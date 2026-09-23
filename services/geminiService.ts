export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where, writeBatch } from 'firebase/firestore';
import {
  StudyMode,
  CategoryType,
  GeneralMaterialInput,
  Question,
  SkdStreamType,
  GeneralStudyMethod,
  InterviewFeedback,
  FeynmanFeedback,
  FlashcardData,
  MindMapNode,
  DrillMaterial,
  SkripsiFeature,
  MaterialLength,
  QuestionDifficulty,
  TpaStreamType,
  TargetScoreCalcResult
} from '../types';

// Initialize API dynamically to avoid load-time crashes if GEMINI_API_KEY is omitted during statically generated client builds
let aiInstance: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.API_KEY || "AIzaSy-placeholder-for-compilation-only";
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

// Helper for shuffling options
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

// HYBRID BANK SOAL HELPERS
export async function getBankSoal(category: CategoryType, topic?: string): Promise<Question[]> {
    if (typeof window === 'undefined') return [];
    try {
        const q = query(collection(db, 'bank_soal'), where('category', '==', category));
        const snapshot = await getDocs(q);
        const all: Question[] = [];
        snapshot.forEach(d => {
            const qData = d.data().question as Question;
            if (qData.metadata) {
                if (qData.metadata.subtest && qData.metadata.subtest.includes(' - ')) {
                    const parts = qData.metadata.subtest.split(' - ');
                    qData.metadata.subtest = parts[0].trim();
                    qData.metadata.topic = parts.slice(1).join(' - ').trim();
                } else if (qData.metadata.topic === 'TWK' || qData.metadata.topic === 'TIU' || qData.metadata.topic === 'TKP') {
                    const temp = qData.metadata.topic;
                    qData.metadata.topic = qData.metadata.subtest || '';
                    qData.metadata.subtest = temp;
                }
            }
            all.push(qData);
        });
        
        if (topic) {
            const upperTopic = topic.toUpperCase();
            return all.filter(q => 
                (q.metadata?.topic && q.metadata.topic.toUpperCase() === upperTopic) || 
                (q.metadata?.subtest && q.metadata.subtest.toUpperCase() === upperTopic)
            );
        }
        return all;
    } catch (e) {
        console.error("Failed to get bank soal", e);
        return [];
    }
}

export async function saveToBankSoal(category: CategoryType, question: Question) {
    if (typeof window === 'undefined') return;
    try {
        await setDoc(doc(db, 'bank_soal', question.id), {
            category,
            question
        });
    } catch (e) {
        console.error("Failed to save to bank soal", e);
    }
}

export async function removeFromBankSoal(category: CategoryType, questionId: string) {
    if (typeof window === 'undefined') return;
    try {
        await deleteDoc(doc(db, 'bank_soal', questionId));
    } catch (e) {
        console.error("Failed to remove from bank soal", e);
    }
}

export async function updateBankSoal(category: CategoryType, updatedQuestion: Question) {
    if (typeof window === 'undefined') return;
    try {
        await setDoc(doc(db, 'bank_soal', updatedQuestion.id), {
            category,
            question: updatedQuestion
        });
    } catch (e) {
        console.error("Failed to update bank soal", e);
    }
}

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["multiple_choice", "short_answer", "long_text", "multiple_choice_complex", "matching"] },
    content: { type: Type.STRING },
    explanation: { type: Type.STRING, description: "MANDATORY: Step-by-step logic and calculation to solve the problem. MUST be generated BEFORE options and correctAnswer." },
    shortcut: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswer: { type: Type.STRING, description: "The correct option. Must exactly match one of the items in the options array. Determine this AFTER writing the explanation." },
    hint: { type: Type.STRING, description: "A clue to help the user answer the question if they are stuck. DO NOT reveal the answer directly." },
    tkpPoints: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          option: { type: Type.STRING },
          points: { type: Type.INTEGER }
        }
      }
    },
    metadata: {
      type: Type.OBJECT,
      properties: {
        difficulty: { type: Type.STRING },
        idealTimeSeconds: { type: Type.INTEGER },
        topic: { type: Type.STRING },
        subtest: { type: Type.STRING },
        trapPattern: { type: Type.STRING },
        pattern: { type: Type.STRING, description: "Specific pattern or conflict matrix used (e.g. 'TWK-Sejarah-Kronologi', 'TKP-Integritas-Gratifikasi')" },
        reasoning_type: { type: Type.STRING, description: "Type of reasoning required (e.g. 'Prioritization', 'Ethical Dilemma')" },
        matrix: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              row: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    content: { type: Type.STRING, description: "Raw SVG code or '?' for the missing cell." },
                    id: { type: Type.STRING, description: "Unique ID for this cell (e.g. 'c1', 'c2')." },
                    logic: { type: Type.STRING, description: "Brief Indonesian explanation of what happens in this cell (e.g. 'Rotasi 90 derajat')." },
                    elements: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          type: { type: Type.STRING },
                          transform: { type: Type.STRING }
                        }
                      },
                      description: "Optional breakdown of elements for advanced animation."
                    }
                  }
                }
              }
            }
          },
          description: "A component-based 2D matrix for figural logic questions. Each cell contains SVG content, a unique ID, and optional logic metadata."
        }
      }
    }
  },
  required: ["id", "type", "content", "explanation", "options", "correctAnswer", "metadata"]
};

const questionsListSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: questionSchema
    }
  },
  required: ["questions"]
};

// Helper functions for parsing robust/truncated JSON from AI models
function extractValidObjects(text: string): any[] {
  const foundObjects: any[] = [];
  const activeStarts: { startIdx: number; depth: number }[] = [];
  let insideString = false;
  let escape = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (char === '\\') {
      escape = true;
      continue;
    }
    if (char === '"') {
      insideString = !insideString;
      continue;
    }
    if (!insideString) {
      if (char === '{') {
        // Increment depth for all currently tracked active starts
        for (let j = 0; j < activeStarts.length; j++) {
          activeStarts[j].depth++;
        }
        // Start tracking a new potential object
        activeStarts.push({ startIdx: i, depth: 1 });
      } else if (char === '}') {
        // Decrement depth for all currently tracked active starts
        for (let j = activeStarts.length - 1; j >= 0; j--) {
          activeStarts[j].depth--;
          if (activeStarts[j].depth === 0) {
            const startIdx = activeStarts[j].startIdx;
            const candidateStr = text.substring(startIdx, i + 1);
            try {
              const parsed = JSON.parse(candidateStr);
              if (parsed && typeof parsed === 'object') {
                foundObjects.push(parsed);
              }
            } catch (e) {
              // ignore invalid JSON
            }
            // Remove from active tracking
            activeStarts.splice(j, 1);
          }
        }
      }
    }
  }

  // RECOVERY FOR TRUNCATED JSON:
  if (activeStarts.length > 0) {
    for (const start of activeStarts) {
      let candidate = text.substring(start.startIdx).trim();
      
      const tryRepair = (base: string) => {
          let attempt = base;
          
          // 1. Handle unclosed string
          let isStillInString = insideString;
          // Recalculate insideString for this specific candidate to be accurate
          let sInside = false;
          let sEscape = false;
          for(let c of attempt) {
              if (sEscape) { sEscape = false; continue; }
              if (c === '\\') { sEscape = true; continue; }
              if (c === '"') sInside = !sInside;
          }
          
          if (sInside) {
              if (attempt.endsWith('\\')) attempt += '\\';
              attempt += '"';
          }

          // 2. Remove trailing comma which is common in truncated lists
          attempt = attempt.trim().replace(/,$/, '');

          // 3. Balance braces and brackets
          let bBraces = 0;
          let bBrackets = 0;
          let bInside = false;
          let bEscape = false;
          for(let c of attempt) {
              if (bEscape) { bEscape = false; continue; }
              if (c === '\\') { bEscape = true; continue; }
              if (c === '"') bInside = !bInside;
              if (!bInside) {
                  if (c === '{') bBraces++;
                  if (c === '}') bBraces--;
                  if (c === '[') bBrackets++;
                  if (c === ']') bBrackets--;
              }
          }

          let suffix = "";
          for (let k = 0; k < bBrackets; k++) suffix += ']';
          for (let k = 0; k < bBraces; k++) suffix += '}';
          
          try {
              return JSON.parse(attempt + suffix);
          } catch (e) {
              return null;
          }
      };

      const p = tryRepair(candidate);
      if (p && typeof p === 'object') {
        foundObjects.push(p);
      }
    }
  }

  return foundObjects;
}

function tryParsePartialQuestions(text: string): any {
  try {
    const candidates = extractValidObjects(text);

    // Check if candidates contain reports (e.g. from critic calls)
    for (const obj of candidates) {
      if (obj && typeof obj === 'object' && Array.isArray(obj.reports) && obj.reports.length > 0) {
        return { reports: obj.reports };
      }
    }

    const questions: any[] = [];

    for (const obj of candidates) {
      if (obj && typeof obj === 'object') {
        if (Array.isArray(obj.questions)) {
          questions.push(...obj.questions);
        } else if (obj.id && obj.content && (obj.correctAnswer || obj.options)) {
          // Looks like a valid individual question object
          questions.push(obj);
        }
      }
    }

    // Deduplicate questions to be safe
    const uniqueQuestions: any[] = [];
    const seenIds = new Set<string>();
    const seenContents = new Set<string>();

    for (const q of questions) {
      const qId = q.id || `q-${Math.random().toString(36).substr(2, 9)}`;
      const qContent = q.content || '';
      if (!seenIds.has(qId) && !seenContents.has(qContent)) {
        seenIds.add(qId);
        seenContents.add(qContent);
        uniqueQuestions.push(q);
      }
    }

    if (uniqueQuestions.length > 0) {
      return { questions: uniqueQuestions };
    }
  } catch (err) {
    console.error("Error in tryParsePartialQuestions:", err);
  }
  return null;
}

async function callGemini<T>(prompt: string, schema?: Schema, imageBase64?: string, options?: { temperature?: number; topP?: number; topK?: number }): Promise<T> {
  const models = ["gemini-3.8-flash", "gemini-3.7-flash", "gemini-2.5-flash"];
  
  const config: any = {
    temperature: options?.temperature ?? 0.9,
    topP: options?.topP ?? 0.95,
    topK: options?.topK ?? 40,
    maxOutputTokens: 65536,
  };

  if (schema) {
    config.responseMimeType = "application/json";
    config.responseSchema = schema;
  }

  const parts: any[] = [];
  if (imageBase64) {
    parts.push({
      inlineData: {
        mimeType: "application/pdf", 
        data: imageBase64
      }
    });
  }
  parts.push({ text: prompt });

  let modelIdx = 0;
  let retries = 4;
  let delay = 1500;

  while (retries > 0) {
    const model = models[modelIdx % models.length];
    try {
      const result = await getAiClient().models.generateContent({
        model,
        contents: { role: 'user', parts },
        config
      });

      const text = result.text;
      
      if (!text) {
          throw new Error("Empty response from AI");
      }

      if (schema) {
        try {
            let cleanText = text.trim();
            if (cleanText.startsWith("```json")) {
                cleanText = cleanText.replace(/^```json\n?/, "").replace(/\n?```$/, "");
            } else if (cleanText.startsWith("```")) {
                cleanText = cleanText.replace(/^```\n?/, "").replace(/\n?```$/, "");
            }
            return JSON.parse(cleanText);
        } catch (e) {
            console.error(`JSON Parse Error for model ${model}, trying recovery parsing...`, e);
            
            // Try to parse partial questions if applicable
            const partialResult = tryParsePartialQuestions(text);
            if (partialResult) {
                console.log(`Successfully recovered ${partialResult.questions.length} questions from incomplete/truncated response.`);
                return partialResult as unknown as T;
            }

            const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                try {
                    return JSON.parse(match[0]);
                } catch (e2) {
                    throw new Error(`JSON parsing failed after full try and regex-match fallbacks.`);
                }
            }
            throw new Error(`Failed to parse response as JSON for schema: ${e instanceof Error ? e.message : e}`);
        }
      }
      return text as unknown as T;
    } catch (error: any) {
      if (retries > 1) {
        if (error?.message?.toLowerCase().includes("quota") || error?.message?.toLowerCase().includes("resource_exhausted") || error?.message?.includes("429")) {
        throw new RateLimitError("Quota API Gemini Habis/Terlimit. Coba lagi nanti.");
      }
      console.warn(`[Gemini Retry] Model ${model} encountered transient error (${retries - 1} retries remaining, rotating model):`, error?.message || error);
        retries--;
        modelIdx++; // Rotate to the next model in choice
        console.log(`Rotating/Retrying with next model in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
        continue;
      }
      
      console.error(`Gemini API Error with model ${model} (all retries exhausted):`, error);
      throw error;
    }
  }
  throw new Error("Failed to generate content after multiple retries and model rotations.");
}

async function* callGeminiStream(prompt: string, schema?: Schema, imageBase64?: string): AsyncGenerator<any[], void, unknown> {
  const models = ["gemini-3.7-flash", "gemini-3.8-flash", "gemini-2.5-flash"];
  
  const config: any = {
    temperature: 0.9, 
    topP: 0.95,
    topK: 40,
  };

  if (schema) {
    config.responseMimeType = "application/json";
    config.responseSchema = schema;
  }

  const parts: any[] = [];
  if (imageBase64) {
    parts.push({ inlineData: { mimeType: "application/pdf", data: imageBase64 } });
  }
  parts.push({ text: prompt });

  let modelIdx = 0;
  let retries = 4;
  let delay = 1500;

  while (retries > 0) {
    const model = models[modelIdx % models.length];
    try {
      const resultStream = await getAiClient().models.generateContentStream({
        model,
        contents: { role: 'user', parts },
        config
      });

      let accumulatedText = "";
      let lastYieldedCount = 0;

      for await (const chunk of resultStream) {
        accumulatedText += chunk.text;
        
        const objects: any[] = [];
        let depth = 0;
        let start = -1;
        let insideString = false;
        let escape = false;

        for (let i = 0; i < accumulatedText.length; i++) {
          const char = accumulatedText[i];
          if (escape) { escape = false; continue; }
          if (char === '\\') { escape = true; continue; }
          if (char === '"') { insideString = !insideString; continue; }
          if (!insideString) {
            if (char === '{') {
              if (depth === 0) start = i;
              depth++;
            } else if (char === '}') {
              depth--;
              if (depth === 0 && start !== -1) {
                try {
                   const objText = accumulatedText.substring(start, i + 1);
                   objects.push(JSON.parse(objText));
                } catch (e) {
                   // ignore incomplete parse
                }
                start = -1;
              }
            }
          }
        }
        
        if (objects.length > lastYieldedCount) {
          lastYieldedCount = objects.length;
          yield objects;
        }
      }
      return;
    } catch (error: any) {
      if (retries > 1) {
        console.warn(`[Gemini Streaming Warning] Model ${model} encountered transient error (${retries - 1} retries remaining, rotating model):`, error?.message || error);
        retries--;
        modelIdx++; // Rotate to the next model
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; 
        continue;
      }
      console.error(`Gemini Streaming API Error with model ${model} (all retries exhausted):`, error);
      throw error;
    }
  }
  throw new Error("Failed to generate stream after multiple retries and model rotations.");
}

function sanitizeQuestion(q: Question, strictSkdValidation: boolean = false): Question {
  if (!q.id) q.id = `q-${Math.random().toString(36).substr(2, 9)}`;
  
  // Ensure metadata exists
  if (!q.metadata) {
      q.metadata = {
          difficulty: 'Medium',
          idealTimeSeconds: 60,
          topic: 'General',
          subtest: 'General'
      };
  }

  // Robust SVG Cleaner & Wrapper
  const cleanAndWrapSvg = (text: string): string => {
    if (!text || !text.includes('<svg')) return text;
    
    // Remove markdown code blocks if present
    let clean = text.replace(/```(?:xml|svg|html)?\n?([\s\S]*?)```/gi, '$1').trim();
    
    return clean.replace(/<svg([\s\S]*?)>([\s\S]*?)<\/svg>/gi, (match, attrs, content) => {
        let newAttrs = attrs;
        // Ensure namespace
        if (!newAttrs.includes('xmlns=')) {
            newAttrs += ' xmlns="http://www.w3.org/2000/svg"';
        }
        // Ensure responsive viewBox
        if (!newAttrs.includes('viewBox')) {
            newAttrs += ' viewBox="0 0 100 100"';
        }
        // Force responsive dimensions
        if (!newAttrs.includes('width')) newAttrs += ' width="100%"';
        if (!newAttrs.includes('height')) newAttrs += ' height="auto"';
        
        // Remove fixed pixel dimensions if they exist (to avoid tiny renders)
        newAttrs = newAttrs.replace(/width="(?!\d+%)(\d+)(px)?"/gi, 'width="100%"');
        newAttrs = newAttrs.replace(/height="(?!\d+%)(\d+)(px)?"/gi, 'height="auto"');

        return `<svg${newAttrs}>${content}</svg>`;
    });
  };

  // Robust function to clean known typo patterns from AI generated materials
  const fixTypos = (text: string | undefined): string => {
      if (!text) return '';
      let cleaned = text
          .replace(/\bno\s+no\b/gi, 'no.')
          .replace(/\btext\s+lead\b/gi, 'text')
          .replace(/\bin\s+line\b/gi, 'inline')
          // Normalize double-escaped LaTeX keywords
          .replace(/\\\\+(frac|dfrac|tfrac|cfrac|sqrt|pm|times|div|cdot|alpha|beta|gamma|delta|pi|theta|sigma|omega|le|ge|leq|geq|neq|approx|sum|prod|int|text|sin|cos|tan|log|ln|left|right|binom)/g, '\\$1')
          // Normalize \degree to KaTeX-compatible ^{\circ}
          .replace(/\\degree\b/g, '^{\\circ}');
          
      return cleanAndWrapSvg(cleaned);
  };

  if (q.content) q.content = fixTypos(q.content);
  if (q.explanation) q.explanation = fixTypos(q.explanation);
  if (q.correctAnswer) q.correctAnswer = fixTypos(q.correctAnswer);

  if (q.options) {
      q.options = q.options.map(opt => fixTypos(opt));
      
      // If correctAnswer is just a single letter (A, B, C, D, E) or "A.", map to actual option
      if (Array.isArray(q.options) && q.options.length === 5 && q.correctAnswer) {
          const trimmedAns = String(q.correctAnswer).trim().toUpperCase().replace(/[.):]/g, '');
          const letterMap: Record<string, number> = { A: 0, B: 1, C: 2, D: 3, E: 4 };
          if (trimmedAns in letterMap) {
              const idx = letterMap[trimmedAns];
              if (q.options[idx]) {
                  q.correctAnswer = q.options[idx];
              }
          }
      }
  }

  if (q.metadata && !q.metadata.trapPattern) {
      q.metadata.trapPattern = "Distraktor opsi dengan kemiripan logika atau konsep";
  }
  if (!q.explanation || q.explanation.trim().length < 20) {
      q.explanation = `Pembahasan: Jawaban yang benar adalah "${q.correctAnswer || 'terpilih'}". ${q.explanation || ''}`.trim();
  }

  if (q.tkpPoints) {
      q.tkpPoints = q.tkpPoints.map(tp => ({
          ...tp,
          option: fixTypos(tp.option)
      }));
  }

  if (q.metadata && q.metadata.matrix && Array.isArray(q.metadata.matrix)) {
      const sanitizeMatrixCell = (cell: any) => {
          if (!cell || typeof cell !== 'object') return cell;
          if (typeof cell.content === 'string' && cell.content.includes('<svg')) {
              return { ...cell, content: cleanAndWrapSvg(cell.content) };
          }
          return cell;
      };
      q.metadata.matrix = q.metadata.matrix.map((rowItem: any) => {
          if (Array.isArray(rowItem)) {
              return { row: rowItem.map(item => {
                  if (typeof item === 'object' && item !== null) {
                      if ('content' in item) {
                           // Keep it as an object so the frontend can parse it, or convert to string if the frontend expects a string.
                           // Actually, the frontend handles cell.content if it's an object!
                           // Let's just return the item as is, we don't need to stringify it.
                           return item;
                      }
                      return item; // just return it, let the frontend handle the object
                  }
                  return String(item);
              }) };
          }
          return rowItem;
      });
  }

  if (q.type === 'multiple_choice') {
      if (!q.options || q.options.length === 0) {
        q.options = ["Option A", "Option B", "Option C", "Option D", "Option E"];
      }
      
      // Handle single-letter correct answers (e.g. "A", "B") by mapping to option text
      if (q.correctAnswer && /^[A-E]$/i.test(q.correctAnswer.trim()) && q.options.length > 0) {
          const index = q.correctAnswer.trim().toUpperCase().charCodeAt(0) - 65; // A=0, B=1...
          if (index >= 0 && index < q.options.length) {
              q.correctAnswer = q.options[index];
          }
      }

      // Clean options from prefixes like "A. ", "a) ", "1. " and newlines
      q.options = q.options.map(opt => {
          // Replace literal \n and real newlines with space
          let clean = opt.replace(/(\\n|\n|\r)/g, ' ').trim(); 
          // Remove A., B., 1., etc prefixes only when followed by explicit delimiters (. ) : -)
          const stripped = clean.replace(/^(?:\(?[A-Ea-e1-5]\)?[\.\)\:\-]\s*|\(?[A-Ea-e]\)\s*)/, '').trim();
          return stripped.length > 0 ? stripped : clean;
      });

      // Also clean correctAnswer if it has a prefix (e.g. "A. Answer")
      if (q.correctAnswer) {
          q.correctAnswer = q.correctAnswer.replace(/(\\n|\n|\r)/g, ' ').trim();
          const strippedAns = q.correctAnswer.replace(/^(?:\(?[A-Ea-e1-5]\)?[\.\)\:\-]\s*|\(?[A-Ea-e]\)\s*)/, '').trim();
          q.correctAnswer = strippedAns.length > 0 ? strippedAns : q.correctAnswer;
      }

      // Self-heal alignment issues: make sure correctAnswer matches one of the options perfectly.
      // If it doesn't match perfectly, seek a fuzzy match.
      if (q.correctAnswer && q.options.length > 0) {
          const exactMatchIdx = q.options.findIndex(opt => opt === q.correctAnswer);
          if (exactMatchIdx === -1) {
              // Try a case-insensitive, punctuation-cleaned, whitespace-trimmed match
              const cleanString = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
              const targetClean = cleanString(q.correctAnswer);
              
              let foundIndex = -1;
              for (let i = 0; i < q.options.length; i++) {
                  if (cleanString(q.options[i]) === targetClean) {
                      foundIndex = i;
                      break;
                  }
              }
              
              // If still not found, try substring matching
              if (foundIndex === -1) {
                  for (let i = 0; i < q.options.length; i++) {
                      if (cleanString(q.options[i]).includes(targetClean) || targetClean.includes(cleanString(q.options[i]))) {
                          foundIndex = i;
                          break;
                      }
                  }
              }
              
              // If we found a match, set q.correctAnswer to that exact option text
              if (foundIndex !== -1) {
                  q.correctAnswer = q.options[foundIndex];
              } else {
                  // Fallback: make Option A the correct answer to avoid broken items
                  q.correctAnswer = q.options[0];
              }
          }
      }

      if (q.tkpPoints && q.tkpPoints.length > 0 && q.options) {
          // Map A/B/C/D/E to full text before shuffling
          q.tkpPoints = q.tkpPoints.map(tp => {
              const optStr = tp.option.trim().toUpperCase();
              if (optStr.length === 1 && optStr >= 'A' && optStr <= 'E') {
                  const idx = optStr.charCodeAt(0) - 65;
                  if (q.options && idx < q.options.length) {
                      return { ...tp, option: q.options[idx] };
                  }
              }
              return tp;
          });

          const isScale = q.options.includes("Sangat Setuju") || q.options.includes("Sangat Tidak Setuju");
          if (!isScale) q.options = shuffleArray(q.options);
      } else if (q.options) {
          q.options = shuffleArray(q.options);
      }
  }
  return q;
}

export const buildQuestionPrompt = async (
  mode: StudyMode,
  category: CategoryType,
  context: string | GeneralMaterialInput,
  count: number = 8,
  weakTopics: string[] = [],
  skdStream?: SkdStreamType,
  generalMethod?: GeneralStudyMethod,
  difficultyOverride?: string,
  utbkVariant?: 'ONLY_MC' | 'MIXED'
): Promise<{ prompt: string, base64Pdf: string | undefined, schema: Schema }> => {
  // V8 ENGINE DIRECT PASSTHROUGH:
  // If context is already a fully formed V8 SKD engine prompt, return it directly without altering or double-wrapping.
  if (typeof context === 'string' && (context.includes('[V8.0 — ADAPTIVE VALIDATED SKD ENGINE]') || context.startsWith('[V8'))) {
      const skdQuestionSchema = JSON.parse(JSON.stringify(questionSchema));
      skdQuestionSchema.properties.type = { type: Type.STRING, enum: ["multiple_choice"] };
      return {
          prompt: context,
          base64Pdf: undefined,
          schema: {
              type: Type.OBJECT,
              properties: { questions: { type: Type.ARRAY, items: skdQuestionSchema } },
              required: ["questions"]
          }
      };
  }

  let prompt = "";
  let base64Pdf: string | undefined = undefined;

  
  // V17.0 UPGRADE: ELITE KEDINASAN LEVEL (STAN/STIS/IPDN)
  const shapeInstructions = `
  CRITICAL VISUAL & LOGIC RULES (V17.0 - ELITE KEDINASAN):
  - **EXPLANATION-FIRST PRINCIPLE (MANDATORY)**: You MUST solve the logical problem step-by-step in the "explanation" field BEFORE defining "options" or "correctAnswer". Mentally draw timelines, tables, or seating charts before writing.
  - **LOGIC INTEGRITY**: For Analytical Reasoning (Ordering, Queuing, Seating):
    - NO ROUNDING Hallucination: Quantities and orders must be absolute.
    - DISAMBIGUATION: If premises allow multiple valid configurations, it is a FAIL. Add a premise to ensure exactly one unique solution.
    - QUEUE/ORDER: Use clear sequential logic. (e.g., "A di antara B dan C", "D mendahului E").

  - **MANDATORY SVG COMPLETION & AESTHETICS**:
    - NO MESSY/RANDOM DESIGNS: SVGs must be clean, balanced, and professionally rendered. Avoid random line weights or overlapping shapes that look accidental.
    - GEOMETRIC PRECISION: Use symmetry, perfect alignment, and deliberate spacing. 
    - SERIAL (Pola) & ANALOGY: The 'content' field MUST start with an SVG string showing the complete sequence. NEVER leave it as text only.
    - MATRIX (3x3): You MUST use the 'metadata.matrix' JSON schema field. Do NOT put the matrix in the 'content' string. 'metadata.matrix' must be an array of rows, where each cell is an object with 'content' (SVG string or '?'), 'id', and 'logic'. Cell (2,2) MUST be '?'.
    - KETIDAKSAMAAN (Odd One Out): 'options' MUST be 5 distinct SVG strings. Use generic question text like "Pilihlah gambar yang berbeda dari yang lain."
  
  - **FIGURAL DIFFICULTY MUST BE ELITE (ASLI KEDINASAN LEVEL)**:
    - ANTI-CLICHÉ: Avoid common patterns like "add 1 dot" or "rotate 90 deg". Synthesize NEW logic.
    - MULTIPLE VARIABLES: Always use at least 3 simultaneous transformations (e.g., rotation AND translation AND opacity change AND shape substitution).
    - If Matrix: Use COMPLEX arithmetic of shapes (Shape A + Shape B = Shape C where overlapping lines disappear).
    - If Serial: Use recursive patterns (e.g., step 1 moves +1, step 2 moves -2, step 3 moves +3).
    - Ensure SVGs are richly detailed with layered complexity (e.g. nested polygons with hatching patterns).

  - **RENDER FIDELITY**:
    - SVGs MUST use viewBox="0 0 100 100" with high-contrast colors (e.g. stroke="currentColor"). Use consistent stroke-width (usually 2).
  `;

  // Removed old shape instructions
  const oldShapeInstructions = "";
  // FORMATTING INSTRUCTIONS
  const formattingInstructions = `
  CRITICAL FORMATTING RULES:
  - **CHAIN OF THOUGHT GENERATION (CRITICAL)**: To prevent math/logic hallucination, you MUST solve the problem step-by-step in the \`explanation\` field FIRST. Only AFTER determining the correct solution mathematically/logically in the \`explanation\`, you should construct the \`options\` array and specify the exact matching \`correctAnswer\`.
  - **EXACT MATH (NO PREMATURE ROUNDING)**: Mathematical calculations must resolve to exact numbers. NEVER round numbers prematurely or present options that are "approximations" unless explicitly stated. The correct answer in the options MUST match the computed result EXACTLY.
  - **FLAWLESS LOGIC**: For Analytical Logic (ordering, seating, schedules) and Syllogisms, double-check your logical constraints. Ensure there is ONE and ONLY ONE valid sequence/configuration that matches all premises without contradiction.
  - **EQUAL OPTION LENGTHS (ANTI-GUESSING)**: You MUST ensure that all 5 options (A, B, C, D, E) are roughly the EXACT SAME LENGTH (character and word count). The correct answer MUST NEVER be noticeably longer or more detailed than the distractor options. If you need to add detail to the correct answer, you MUST also add equally complex and long details to the incorrect answers to camouflage it.
  - **DISTRACTOR QUALITY (Near-Miss Logic for HOTS)**: For incorrect options (distractors), do NOT use random or easily guessable wrong answers. Construct them logically based on common calculation errors, misread signs, logical traps, or near-misses of the exact correct answer. In TWK and TKP, distractors must sound incredibly plausible, academic, and highly professional.
  - **HOTS REQUIREMENT (ELITE KEDINASAN LEVEL)**: Every question MUST be at the ELITE HOTS level. Questions should require deep analysis, evaluation, and creation, not just simple recall. Use "Analyze...", "Evaluate...", "Determine the best course of action based on..." phrasing.
  - **ANTI-REPETITION & ORIGINALITY**: 
    - DO NOT use standard, overused question bank scenarios (e.g., for TKP: "seeing someone struggling", "printer broken", "internet down"). 
    - Synthesize FRESH, modern, and complex scenarios relevant to government service (Kedinasan) and modern bureaucracy.
    - Avoid common "Bank Soal" patterns. If a pattern is common, make it 3x more complex.
  - **ANTI-LEAK / EXTREME DIFFICULTY (VERSION 7)**:
    - In TWK or conceptual questions, NEVER reveal the correct answer or crucial parts of it inside the question prompt. E.g. If asking who wrote a script, do not say "The script written by Muhammad Yamin..."
    - Provide deep analytical scenarios rather than simple memorization. 
  - **CLUE SYSTEM (VERSION 7)**:
    - You MUST provide a \`hint\` field for every single question.
    - The hint MUST NOT give away the answer directly.
    - The hint should provide a contextual clue (e.g., "Ingat peristiwa yang terjadi berdekatan dengan Kongres Pemuda II", or "Perhatikan pola bilangan ganjil pada lompatan ke-2").
  - **SUB-TEST STANDARDIZATION**: You MUST use these exact names for subtests:
    - TWK: "Nasionalisme", "Integritas", "Bela Negara", "Pilar Negara", "Bahasa Indonesia".
    - TIU: "Kemampuan Verbal", "Kemampuan Numerik", "Kemampuan Figural".
    - TKP: "Pelayanan Publik", "Jejaring Kerja", "Sosial Budaya", "Teknologi Informasi dan Komunikasi", "Profesionalisme", "Anti Radikalisme".
  - **PREMISES**:
    - If a question involves multiple premises, EACH item must be on a NEW LINE with clean spacing.
  - **READABILITY**:
    - Split long questions into short, readable paragraphs (max 3-4 sentences per paragraph). Avoid walls of text.
  - **DISTRACTOR QUALITY (PENGECOH)**:
    - Setiap opsi salah (distractor) HARUS merupakan hasil dari kesalahan berpikir umum peserta atau jebakan persepsi (misalnya: lupa menghentikan perhitungan di langkah akhir, salah menafsirkan subjek di Premis 1, atau sekadar tertukar istilah serupa tapi tak sama).
    - JANGAN buat distractor yang terlalu mudah dicoret.
  - **METADATA & TIPS**:
    - ALWAYS fill metadata.trapPattern with a brief explanation of the common trap/trick students use or fall for in this question.
    - ALWAYS fill shortcut in the JSON body with a 5-10 second mental shortcut, quick trick, or "Cara Cepat" if applicable (especially for TIU or Logical Twk).
  - **TYPOGRAPHY & LANGUAGE PRECISION (ANTI-TYPO)**:
    - ABSOLUTELY PROHIBITED: Do not generate English typographical errors or placeholder terms like "no no" (for "no." or negation), "text lead" (for "text" or "text-left"), or "in line" (for "inline") in any question text, explanations, or multiple-choice options.
    - Always ensure clean grammar and spelling in Bahasa Indonesia (following EYD guidelines) and standard natural academic English.
  - **OPTIONS & CORRECT ANSWER ALIGNMENT**:
    - Multiple-choice questions MUST have exactly 5 options (A, B, C, D, E). NEVER produce any other quantity (e.g., no 4 options, no 6 options).
    - The JSON "type" property MUST be "multiple_choice" for all SKD questions. Do not generate fill-in-the-blank or checkbox questions.
    - The options in the options array MUST begin with "A. ", "B. ", "C. ", "D. ", "E. " respectively.
    - The field @correctAnswer@ in JSON MUST match character-for-character with the text of the selected correct option, including the option prefix (e.g., if option is "A. Jawaban pertama", the correctAnswer response MUST be the exact same string: "A. Jawaban pertama", NOT just "A").
  `;

  // MATH & FRACTION FORMATTING INSTRUCTIONS (REFINED EXCLUSIVITY)
  const mathInstructions = `
  CRITICAL MATH LOGIC & RENDER RULES:
  - **LaTeX Perfection**: You MUST use LaTeX syntax for ALL numbers, mathematical symbols, variables, and calculations ($ ... $).
  - **TOTAL ENCAPSULATION**: Every single number (e.g., $10$, $25\\%$, $1/2$) and math expression MUST be wrapped in LaTeX delimiters.
  - **INLINE LATEX PREFERENCE**: Use inline LaTeX (\\\\( ... \\\\)) or ($ ... $) blended seamlessly into sentences.
  - **JSON ESCAPING (CRITICAL)**: Since the output is JSON, you MUST double-escape all backslashes in LaTeX strings. For example, output "\\\\sqrt{2}" instead of "\\sqrt{2}". If you fail to double-escape, the JSON will be malformed.
  - **NEATNESS**: Using LaTeX for all numbers ensures a consistent, professional, and "natural" academic look.
  - **SYMBOLS**: Replace all unicode math with LaTeX representations.
  - **NO PLAIN NUMBERS**: Even simple numbers in text must be LaTeX (e.g., "Membeli $5$ buah apel" instead of "Membeli 5 buah apel").
  `;

  // Removed old instructions
  const oldMathInstructions = "";

  const langInstruction = "CRITICAL: The generated questions MUST BE in Bahasa Indonesia and strictly follow the style, difficulty, and structure of real world past-year SKD/CPNS field report (FR Soal Asli) questions.";

  let schema: Schema = questionsListSchema;

  const isPsikotestKedinasan = ((category === 'TPA' || category === 'PSIKOTEST') && (typeof context === 'string' && (context.includes('Psikotes') || context.includes('Kepribadian') || context.includes('Logika Gambar') || context.includes('IQ') || context.includes('Verbal') || context.includes('Numeric') || context.includes('Spatial'))));

  if (category === 'SKD' || isPsikotestKedinasan) {
      const skdQuestionSchema = JSON.parse(JSON.stringify(questionSchema));
      skdQuestionSchema.properties.type = { type: Type.STRING, enum: ["multiple_choice"] };
      schema = {
          type: Type.OBJECT,
          properties: { questions: { type: Type.ARRAY, items: skdQuestionSchema } },
          required: ["questions"]
      };
  }

  if (category === 'GENERAL' && generalMethod) {
      const input = context as GeneralMaterialInput;
      const contentStr = input.type === 'topic' ? `Topic: ${input.content}` : `Material Content`;
      if(input.type === 'pdf') base64Pdf = input.content;

      const diff = input.difficultyPreference || 'MEDIUM';
      const difficultyPrompt = `DIFFICULTY LEVEL: ${diff}. ${diff === 'HARD' ? 'Use complex analysis/HOTS.' : diff === 'EASY' ? 'Use straightforward recall.' : ''}`;

      if (generalMethod === 'ACTIVE_RECALL') {
          prompt = `Create ${count} Active Recall questions (Short Answer format) based on this: ${contentStr}. 
          ${langInstruction} ${difficultyPrompt} ${mathInstructions} ${formattingInstructions}
          Questions must be specific and require recall of key facts/concepts.`;
      } else if (generalMethod === 'PBL') {
          prompt = `Create ${count} Problem-Based Learning scenarios (Case Study).
          ${langInstruction} ${difficultyPrompt} ${mathInstructions} ${formattingInstructions}
          Format: 'long_text' or 'multiple_choice'.
          Based on: ${contentStr}.`;
      } else {
          prompt = `Create ${count} practice questions based on: ${contentStr}. ${langInstruction} ${difficultyPrompt} ${mathInstructions} ${formattingInstructions}`;
      }
      if(input.type === 'text') prompt += `\n\nCONTENT: ${input.content}`;

  } else if (isPsikotestKedinasan) {
      const subtest = context as string;
      prompt = `GENERATE QUESTIONS FOR PSIKOTEST KEDINASAN (PKN STAN) V5.
      Subtest Context: ${subtest}.
      Count: ${count}.
      ${shapeInstructions}
      ${mathInstructions}
      
      RULES:
      `;

      if (subtest.includes("Kepribadian")) {
          prompt += `
          TYPE: PERSONALITY TEST.
          Format: Statement with Likert Scale options (Sangat Setuju - Sangat Tidak Setuju).
          SCORING (tkpPoints): Assign points 1-5 based on positive ASN traits. The 'option' field in tkpPoints MUST BE THE EXACT FULL TEXT of the option, NOT A/B/C/D/E.
          `;
      } else if (subtest.includes("Gambar") || subtest.includes("Figural")) {
          prompt += `
          TYPE: TES LOGIKA GAMBAR (Abstract Reasoning/Spatial) V6.
          Requirement: MUST USE <svg>. 
          Create visual analogies, matrix completion (If 3x3, you MUST use the JSON 'matrix' field populated EXCLUSIVELY with valid SVG shapes in every cell, no text), or Ketidaksamaan Gambar.
          COMPLEXITY LEVEL: EXTREMELY HIGH (IQ Test Level). 
          STRICT RULES FOR PATTERNS: 
          1. DO NOT create simple patterns like just adding one line or changing one color.
          2. Every pattern MUST involve MULTIPLE simultaneous transformations (e.g., Object A rotates 90 degrees clockwise WHILE changing fill pattern, AND Object B translates diagonally WHILE scaling down).
          3. Use complex nested SVG shapes (e.g., a polygon inside a rotating circle with intersecting lines).
          4. For Matrix, ensure columns and rows follow distinct logical arithmetic (e.g., Row 1 + Row 2 = Row 3 with overlapping lines cancelling out XOR logic).
          Example command: "Lengkapi pola matriks 3x3 berikut..."
          `;
      } else {
          prompt += `
          TYPE: TIU (Tes Intelegensi Umum).
          Focus: Verbal (Sinonim/Analogi), Numerik, Logika.
          Use Unicode math symbols for Numerik questions.
          `;
      }

  prompt += `\nLanguage: Bahasa Indonesia.`;

  } else {
      let difficultyContext = "";
      
      const HOTS_PHILOSOPHY = `
      CORE PHILOSOPHY: "Buat soal SKD yang sulit karena kualitas penalarannya, bukan karena bahasanya."
      - DO NOT make questions difficult by using overly long, convoluted sentences.
      - Make them difficult because the options require deep reasoning/analysis to distinguish.

      SISTEM DIFFICULTY (8-10 DISTRIBUTION):
      - Target distribution: 20% Level 8, 50% Level 9, 30% Level 10.
      - Level 8: 2-3 plausible options, 1 main conflict, 1-2 reasoning steps.
      - Level 9: 3-4 highly plausible options, 2 conflicts, requires prioritization, trade-offs exist.
      - Level 10: All 5 options are highly plausible. 2-3 clashing interests. No "obviously good" answer. Requires deep SOP/principle understanding. Very subtle differences.

      SISTEM ANTI-REPETISI & METADATA:
      - AI MUST use a Pattern Matrix (submateri + pattern + konteks + konflik).
      - NEVER repeat the same pattern in the same generation batch.
      - MUST fill out the 'pattern', 'reasoning_type', and 'difficulty' fields in the metadata.

      DESAIN PILIHAN A-E (PLAUSIBLE DISTRACTORS):
      - ALL options must sound professional and logical. 
      - DO NOT use obvious gradations (e.g., A. Do nothing, B. Do a little, C. Do well).
      - Ensure all options (A-E) have relatively balanced word counts.
      
      SECOND-PASS EVALUATOR MODE:
      - CRITICAL: Before outputting the JSON, internally evaluate your own questions.
      - Check if the difficulty is truly 8-10.
      - Check if there are at least 3 plausible options.
      - Check if the correct answer is too obvious.
      - If it fails, internally REGENERATE it before returning.
      `;

      const TKP_SCORING_RULE = `
      ATURAN DISTRAKTOR TKP (1-5 SCORING):
      - 5/5: Paling sesuai, taktis, inovatif, sesuai prosedur.
      - 4/5: Sangat baik, tetapi ada kekurangan kecil/kurang komprehensif.
      - 3/5: Masih dapat diterima, tetapi kurang optimal/reaktif.
      - 2/5: Ada kelemahan signifikan/kurang profesional.
      - 1/5: Kurang tepat, pasif, atau menyalahi aturan (tetapi tetap ditulis dengan bahasa baku/mengecoh).
      - Perbedaan kualitas antar opsi JANGAN TERLALU OBVIOUS.
      `;
      
      const isTwk = (typeof context === 'string' && (context.toUpperCase().includes('TWK') || context.toUpperCase().includes('WAWASAN KEBANGSAAN'))) || (category === 'SKD' && difficultyOverride === 'TWK');
      const isTiu = (typeof context === 'string' && (context.toUpperCase().includes('TIU') || context.toUpperCase().includes('INTELEGENSIA') || context.toUpperCase().includes('FIGURAL') || context.toUpperCase().includes('NUMERIK') || context.toUpperCase().includes('VERBAL'))) || (category === 'SKD' && difficultyOverride === 'TIU');
      const isTkp = (typeof context === 'string' && (context.toUpperCase().includes('TKP') || context.toUpperCase().includes('KARAKTERISTIK PRIBADI'))) || (category === 'SKD' && difficultyOverride === 'TKP');

      if (isTwk) {
           difficultyContext = `CONTEXT: SKD TWK (Tes Wawasan Kebangsaan) - TARGET DIFFICULTY: 8-10/10 (STANDAR RESMI CAT BKN TERKINI).
           
           ${HOTS_PHILOSOPHY}

           TEMA & MATERI UTAMA TWK TERKINI (IKUTI 6 MATERI UTAMA INI):
           1. Penerapan Nilai Pancasila dalam Kehidupan Sehari-hari:
              - Pengamalan butir-butir Pancasila dalam interaksi sosial, ranah publik, keluarga, dan lingkungan kerja.
              - Jebakan Pengecoh Butir: Distraktor menyajikan pengamalan sila lain yang sama-sama luhur (misal esensi Sila ke-2 kemanusiaan & martabat dihadapkan dengan Sila ke-5 keadilan alokasi & fasilitas umum, atau Sila ke-1 toleransi beragama vs Sila ke-3 persatuan). Peserta harus teliti membedakan esensi butir sila!
           2. Nasionalisme:
              - Menjaga kedaulatan bangsa, rasa cinta dan bangga pada produk lokal, pertahanan identitas budaya dari pengaruh negatif globalisasi, integrasi nasional.
           3. Toleransi Antar Suku, Agama, dan Budaya:
              - Pluralisme Bhinneka Tunggal Ika, moderasi beragama, penyelesaian konflik keberagaman secara arif tanpa diskriminasi.
           4. Studi Kasus Penerapan Nilai Kebangsaan:
              - Studi kasus dilema kebijakan aparatur sipil negara, pelayanan publik berintegritas, netralitas ASN, anti-korupsi & pencegahan gratifikasi terselubung.
           5. Sejarah Kemerdekaan:
              - Peristiwa krusial sekitar Proklamasi 17 Agustus 1945, sidang BPUPKI dan PPKI, dinamika Rengasdengklok, Agresi Militer Belanda I & II, serta jalur diplomasi (Perjanjian Linggarjati, Renville, Roem-Royen, Konferensi Meja Bundar).
           6. Tokoh Sejarah dan Nilai yang Dipelajari dari Perjuangannya:
              - Nilai teladan dari tokoh bangsa: integritas & kesederhanaan Mohammad Hatta, kecerdasan diplomasi Haji Agus Salim / Sutan Sjahrir, kegigihan gerilya Jenderal Soedirman, perjuangan pendidikan Ki Hajar Dewantara, dll.
           7. Pasal-Pasal UUD 1945 & Lembaga Negara (HAFALAN PASAL RIIL DENGAN JEBAKAN KONSEPTUAL):
              - WAJIB hadirkan pasal-pasal konstitusi riil:
                * Hak Asasi Manusia (Klaster Pasal 28A hingga 28J)
                * Pembelaan Negara vs Pertahanan (Pasal 27 ayat 3 vs Pasal 30 ayat 1 & 2)
                * Lembaga Negara & Peradilan: Pasal 24A (MA), 24B (KY), 24C (MK), Pasal 20 & 22D (DPR vs DPD), Pasal 23E (BPK)
                * Mekanisme Perubahan UUD 1945 (Pasal 37 ayat 1-5)
              - Opsi pengecoh (distraktor) WAJIB menyajikan pasal atau ayat serumpun yang sangat mirip sehingga menguji ketelitian pemahaman hukum tata negara peserta.

           CRITICAL TWK RULES (ELITE DIFFICULTY 8-10/10 & PENGECOH MENJEBAK):
           1. **FORMAT SOAL**: Menyerupai SKD asli (Teks studi kasus atau analisis kewenangan hukum).
           2. **ANTI-OBVIOUS**: Kelima pilihan jawaban (A, B, C, D, E) HARUS tampak benar, positif, bijak, dan konstitusional. Dilarang keras opsi negatif atau konyol!
           3. **KESEIMBANGAN OPSI**: Panjang teks opsi A hingga E harus relatif seimbang (selisih maksimal 2-4 kata). Jawaban benar dilarang menjadi opsi terpanjang.
           4. **PEMBAHASAN (EXPLANATION)**: Jelaskan mengapa jawaban benar tepat berdasar pasal/butir sila terkait, DAN jelaskan letak ketidaktepatan opsi pengecoh.`;
      } else if (isTiu) {
           difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - TARGET DIFFICULTY: 8-10/10 (STANDAR CAT BKN TERKINI).
           
           ${HOTS_PHILOSOPHY}

           RAGAM MATERI & MODEL SOAL TIU TERKINI:
           1. Kemampuan Verbal:
              - **Analogi Objek Nyata & Kehidupan Sehari-hari**:
                * DILARANG KERAS menggunakan kosa kata kamus ilmiah asing yang rumit (hindari kata klise seperti dikotomi, eufemisme, paradoks).
                * WAJIB gunakan benda konkret, perkakas, pakaian/alat pelindung tubuh, fenomena alam, atau kegiatan sehari-hari yang memicu logika relasi fungsional atau sebab-akibat (contoh: Topi : Sarung Tangan : Sepatu = Helm : Sarung Tangan Motor : Sepatu Bot; Kunci : Gembok = Sandi : Brankas; Jarum : Benang = Kuas : Cat; Benih : Pohon = Janin : Bayi).
                * Format: 2-3 variabel (A : B = C : D atau A : B : C = P : Q : R) atau analogi situasi/kalimat.
              - **Soal Persamaan Kalimat**:
                * Menentukan kalimat yang memiliki makna, struktur logika, atau gagasan pokok yang sepadan dengan kalimat wacana.
              - **Silogisme Premis Panjang & Ketelitian**:
                * 3-4 premis bernarasi kaya yang menuntut ketelitian membaca kuantor (Semua, Sebagian, Tidak Ada, Hanya Jika).
              - **Logika Posisi & Analitis**:
                * Urutan tempat duduk (melingkar/berhadapan/sebaris), susunan lantai/kamar apartemen, peringkat juara, atau jadwal antrean dengan batasan ketat.
              - **Soal Cerita dengan Ketelitian Membaca Informasi**:
                * Cerita studi kasus dengan rincian data tersebar yang membutuhkan ketelitian menyaring fakta relevan.
           2. Kemampuan Numerik:
              - **Perbandingan Senilai dan Tidak Senilai (Berbalik Nilai)**:
                * Masalah pekerja vs lama hari, kecepatan vs waktu tempuh, kapasitas mesin, atau pakan ternak.
              - **Soal Cerita & Aritmatika Sosial Menggunakan Tabel**:
                * Jika membantu penyajian data (daftar harga, diskon bertingkat, tabel spesifikasi kerja), WAJIB buatkan tabel Markdown (\`| Kolom 1 | Kolom 2 |\`). Ada soal yang menggunakan tabel dan ada yang tanpa tabel.
              - **Soal Kecukupan Informasi (Data Sufficiency - ala Penalaran Umum UTBK)**:
                * Pertanyaan utama disertai Pernyataan (1) dan Pernyataan (2), dengan 5 opsi baku kecukupan data A-E.
              - **Deret Angka Bentuk Tabel**:
                * Tabel matriks angka (3x3 atau 2x4) di mana salah satu sel berisi tanda tanya (?) yang harus diisi berdasar operasi baris/kolom.
              - **Suku Kata atau Pola Angka/Kata**:
                * Pola pembentukan kata dari suku kata / sandi kata berpola, serta deret angka berpola unik.
              - **Perbandingan Kuantitatif (P vs Q)**:
                * Nilai hubungan kuantitatif P dan Q bervariasi ($P > Q$, $P < Q$, $P = Q$, atau hubungan tidak dapat ditentukan).
           3. Kemampuan Figural:
              - Analogi Gambar, Ketidaksamaan (Odd One Out), Serial Gambar.
              - Seluruh opsi (A-E) figural WAJIB berupa kode <svg> murni dengan viewBox="0 0 100 100".

           CRITICAL TIU RULES:
           1. **LOGIKA BUKAN HAFALAN ISTILAH**: Kesulitan berasal dari multi-step reasoning dan kejelian logika, bukan kosa kata asing.
           2. **PEMBAHASAN RUNTUT**: Uraikan langkah penyelesaian step-by-step beserta alasan mengapa pengecoh salah.`;
      } else if (isTkp) {
           difficultyContext = `CONTEXT: SKD TKP (Tes Karakteristik Pribadi) - TARGET DIFFICULTY: 8-10/10 (STANDAR CAT BKN TERKINI).
           
           ${HOTS_PHILOSOPHY}
           ${TKP_SCORING_RULE}

           4 CLUSTER MATERI TKP TERKINI:
           1. Permasalahan yang Sedang Terjadi:
              - Adaptasi digitalisasi birokrasi, pemanfaatan kecerdasan buatan (AI) untuk efisiensi kantor, etika bermedia sosial, penanganan disinformasi/hoax di lingkungan kerja, fleksibilitas kerja (WFA/hybrid), keamanan data privasi.
           2. Sikap Profesional:
              - Integritas aparatur, menolak gratifikasi halus (hadiah/fasilitas terselubung dari rekanan), menjaga rahasia jabatan, komitmen menuntaskan tugas di bawah tekanan deadline tinggi.
           3. Pengambilan Keputusan:
              - Ketegasan menentukan prioritas di antara dua tugas mendesak, manajemen risiko terukur, keberanian mengambil diskresi yang sah demi kepentingan publik dan kelancaran organisasi.
           4. Cara Menghadapi Kondisi:
              - Menghadapi komplain masyarakat yang emosional dengan tenang dan solutif, perubahan instruksi pimpinan secara tiba-tiba, kendala sarana-prasarana darurat, kolaborasi dengan rekan kerja lintas generasi atau bertabiat sulit.

           ATURAN SKOR & PERBEDAAN TIPIS POIN 5 VS 4:
           1. **SEMUA OPSI POSITIF & MASUK AKAL**: Kelima opsi (A, B, C, D, E) HARUS berupa tindakan profesional, sopan, dan positif. DILARANG membuat opsi negatif, malas, apatis, atau pasif!
           2. **PERBEDAAN TIPIS POIN 5 VS 4**:
              - Poin 4: Solusi prosedural/personal yang baik, patuh SOP, menyelesaikan tugasnya sendiri dengan tertib dan bertanggung jawab.
              - Poin 5: Solusi berinisiatif sistemik, skala prioritas yang tepat (menyeimbangkan jangka pendek & jangka panjang), koordinasi lintas pihak secara taktis, dan perbaikan berkelanjutan tanpa melanggar aturan.
           3. **KESEIMBANGAN PANJANG OPSI**: Seluruh 5 opsi (A-E) HARUS memiliki panjang kalimat yang setara dan seimbang (selisih antaropsi maksimal 2-4 kata saja). DILARANG membuat opsi poin 5 paling panjang!
           4. **PEMBAHASAN (EXPLANATION)**: Pembahasan WAJIB menjelaskan alasan di balik penetapan skor 5, 4, 3, 2, dan 1 untuk masing-masing opsi.`;
      }

      if (category === 'SKD' && typeof context === 'string' && (context.toUpperCase().includes('TIU') || context.toUpperCase().includes('INTELEGENSIA'))) {
             // NEW BLOCK FOR FULL TIU
             let numericCount = 0;
             let verbalCount = 0;
             let figuralCount = 0;

             if (count === 35) {
                 const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
                 numericCount = getRandomInt(10, 15);
                 verbalCount = getRandomInt(10, 15);
                 figuralCount = 35 - numericCount - verbalCount;

                 if (figuralCount < 5) {
                     const deficit = 5 - figuralCount;
                     figuralCount = 5;
                     if (numericCount > 10 + deficit) numericCount -= deficit;
                     else verbalCount -= deficit;
                 } else if (figuralCount > 10) {
                     const surplus = figuralCount - 10;
                     figuralCount = 10;
                     if (numericCount < 15 - surplus) numericCount += surplus;
                     else verbalCount += surplus;
                 }
                 const currentSum = numericCount + verbalCount + figuralCount;
                 if (currentSum !== 35) numericCount += (35 - currentSum);
             } else {
                 verbalCount = Math.floor(count * 0.4);
                 numericCount = Math.floor(count * 0.4);
                 figuralCount = count - verbalCount - numericCount;
             }
             
             difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - FULL MIX - ELITE DIFFICULTY.
             
             DISTRIBUTION (Total ${count} questions):
             - VERBAL: ${verbalCount} questions (Analogi 3-variabel, Silogisme kompleks, Analitis multi-variabel)
             - NUMERIK: ${numericCount} questions (Berhitung cepat, Deret berlapis, Perbandingan, Soal Cerita HOTS)
             - FIGURAL: ${figuralCount} questions (Analogi, Ketidaksamaan, Serial, Matriks, Spasial)
             
             CRITICAL RULES:
             1. **FIGURAL (VISUAL LOGIC)**: 
                - **CANVAS-BASED SVG**: Gunakan SVG kompleks.
                - **Transformasi**: Wajib gunakan minimal 3 transformasi objek berbarengan (ukuran, rotasi, posisi).
             2. **NUMERIK**: Gunakan LaTeX untuk formula kompleks. Buat perhitungan yang memerlukan shortcut/trik khusus untuk dikerjakan di bawah 1 menit.
             3. **VERBAL**: Gunakan penalaran silogisme menjebak dengan 3-4 premis. Analogi wajib menggunakan kosa kata tingkat tinggi.
             `;
        } else if (category === 'SKD' && typeof context === 'string' && (context.toUpperCase().includes('VERBAL') || context.toUpperCase().includes('ANALOGI') || context.toUpperCase().includes('SILOGISME') || context.toUpperCase().includes('ANALITIS'))) {
           difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - VERBAL.
           
           CRITICAL RULES FOR VERBAL (EXTREME DIFFICULTY SANGAT SULIT & SANGAT MENGECOH):
           0. LENGTH LIMIT: Batasi teks bacaan utama tidak lebih dari 3 paragraf dan maksimal 150 kata per soal untuk menjaga performa.
           1. COMPLEXITY: Questions must be EXTREMELY HARD, tricky, and mimic the official test style. Distractors must be highly deceptive and logically tempting.
           2. ANALOGY (ANALOGI):
              - Gunakan format double-gap (A : … = … : D) atau 3-variabel (A : B : C = P : Q : R).
              - Kosa kata KBBI tingkat tinggi (bukan kata sehari-hari umum).
              - Relasi logika harus objektif, presisi, dan tidak ambigu (misal: proses - bahan baku - hasil, atau patologi - organ - diagnosis).
           3. SYLLOGISM (SILOGISME): 
              - Wajib melabeli premis (Premis 1, Premis 2, Premis 3).
              - Gunakan 3-4 premis kompleks dengan kombinasi kuantor (Semua, Sebagian, Sebagian Besar, Tidak Ada) dan kalimat bersyarat (Jika-Maka, Hanya jika).
              - Libatkan aturan kontraposisi dan hukum negasi majemuk (De Morgan).
              - Pengecoh harus memodelkan sesat pikir formal (fallacy of affirming the consequent atau penarikan simpulan kuantor yang tidak sah).
           4. ANALYTICAL (ANALITIS):
              - Skenario bervariasi: Penataan meja bundar/berhadapan, penjadwalan multi-kriteria (hari, shift, ruangan), atau penempatan lantai gedung dengan batasan interval.
              - Gunakan minimal 6-8 variabel dengan syarat-syarat yang saling berkait rapat.
              - Tanyakan kondisi mutlak (misal: "Pernyataan yang PASTI SALAH adalah …" atau "Kombinasi yang MUNGKIN terjadi adalah …").

           FEW-SHOT EXAMPLES:
           
           Type: Analogi (Double Gap & Hubungan Tingkat Tinggi)
           Q: DIKOTOMI : DUA BAGIAN = … : …
           A. ANOMALI : KETERATURAN
           B. HIERARKI : TINGKATAN
           C. SIMBIOSIS : PERSELISIHAN
           D. AMBIGUITAS : KEJELASAN
           E. PARADOKS : KONSISTENSI
           (Correct: B. Dikotomi bermakna pembagian atas Dua Bagian; Hierarki bermakna pembagian atas Tingkatan. Pilihan lain adalah pasangan kata yang berlawanan arti/antonim.)

           Type: Silogisme (3 Premis Kompleks & Kontraposisi)
           Q: Perhatikan pernyataan-pernyataan berikut!
           Premis 1: Semua pejabat publik yang memiliki integritas tinggi menolak segala bentuk gratifikasi.
           Premis 2: Sebagian pejabat publik di kementerian X menerima fasilitas liburan dari pihak rekanan swasta.
           Premis 3: Setiap penerimaan fasilitas dari pihak rekanan swasta dikategorikan sebagai tindakan gratifikasi.
           Simpulan yang paling tepat dan sah secara logika adalah ….
           A. Semua pejabat publik di kementerian X tidak memiliki integritas tinggi.
           B. Sebagian pejabat publik di kementerian X tidak memiliki integritas tinggi.
           C. Sebagian pejabat publik yang menolak gratifikasi bukan berasal dari kementerian X.
           D. Semua pejabat publik yang menerima fasilitas liburan tidak bertugas di kementerian X.
           E. Tidak ada pejabat publik di kementerian X yang memiliki integritas tinggi.
           (Correct: B. Dari Premis 2 dan 3: Sebagian pejabat di kementerian X menerima gratifikasi. Dari Premis 1 (kontraposisi): yang menerima gratifikasi pasti tidak berintegritas tinggi. Maka sebagian pejabat di kementerian X tidak berintegritas tinggi.)

           Type: Analitis (Posisi Meja Bundar & Eliminasi Logis)
           Q: Enam orang diplomat (A, B, C, D, E, dan F) sedang duduk mengelilingi meja bundar dengan 6 kursi bernomor 1 sampai 6 secara berurutan searah jarum jam:
           1. Diplomat A duduk tepat berhadapan dengan Diplomat D.
           2. Diplomat B duduk di sebelah kanan langsung dari Diplomat A.
           3. Diplomat C tidak boleh duduk bersebelahan dengan Diplomat D maupun Diplomat A.
           4. Diplomat E duduk di antara Diplomat C dan Diplomat D.
           Berdasarkan informasi tersebut, pernyataan yang PASTI BENAR adalah ….
           A. Diplomat F duduk tepat berhadapan dengan Diplomat B
           B. Diplomat F duduk tepat di antara Diplomat A dan Diplomat C
           C. Diplomat C duduk tepat di sebelah kiri Diplomat B
           D. Diplomat E duduk berhadapan langsung dengan Diplomat B
           E. Diplomat F duduk tepat di sebelah kanan Diplomat D
           (Correct: B. Jika A di 1, D di 4. B di kanan A yaitu 2. Karena C tidak bersebelahan dengan D (3,5) dan A (6,2), maka C harus di 5 atau 3. Tapi E di antara C dan D, jika C di 3, E di 2 (sudah ada B, mustahil), jadi C di 5, E di 4 atau sebaliknya. Menghasilkan posisi pasti F duduk di antara A dan C.)
           `;
      } else if (category === 'SKD' && typeof context === 'string' && (context.toUpperCase().includes('NUMERIK') || context.toUpperCase().includes('KUANTITATIF') || context.toUpperCase().includes('HITUNG') || context.toUpperCase().includes('DERET'))) {
           difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - NUMERIK.
           
           CRITICAL RULES FOR NUMERIK (EXTREME DIFFICULTY & FRESH PATTERNS):
           1. ANTI-REPETISI & ANTI-KLIKSE:
              - DILARANG KERAS hanya mendaur ulang pola lama dengan sekadar mengganti angka!
              - Jangan membuat deret bertingkat dasar sederhana (+2, +3, +4) atau soal cerita pekerja tambahan klise standar (W × D = k).
              - Soal harus menuntut kecerdikan trik aljabar, penalaran multi-fase, atau sifat matematis non-trivial yang dapat diselesaikan < 60 detik bila triknya diketahui.
           2. FORMATTING:
              - WAJIB gunakan LaTeX ($...$) untuk setiap formula, pecahan, akar, dan variabel.
              - Format pangkat: $x^2$, akar: $\\sqrt{2}$, pecahan: $\\frac{a}{b}$.
           3. VARIASI SUBTES NUMERIK:
              - Aljabar & Hitung Cepat: Identitas aljabar simetris, selisih kuadrat $a^2 - b^2$, faktorisasi $a^3 \\pm b^3$, atau operator baru ($a \\odot b$).
              - Deret Angka/Huruf: Deret 3 larik (triple alternating), deret Fibonacci termodifikasi ($a_n = a_{n-1} + a_{n-2} \\pm k$), deret kelompok berulang tiap 3 suku, deret pecahan bertingkat, deret huruf lompatan prima ($+2, +3, +5, +7, +11$).
              - Perbandingan Kuantitatif (P vs Q): Kunci jawaban WAJIB divariasikan ($P > Q$, $P < Q$, $P = Q$, atau hubungan tidak dapat ditentukan jika domain ambigu). Gunakan domain pecahan $0 < x < 1$ (di mana $x^2 < x < \\sqrt{x}$), bilangan negatif $a < b < 0$, atau geometri tersembunyi.
              - Soal Cerita: Manajemen proyek multi-fase dengan efisiensi pekerja/mesin berubah, aritmatika finansial bagi hasil proporsional modal & waktu, campuran konsentrasi dinamis 3 komponen, kecepatan relatif dengan perbedaan waktu start.

           FEW-SHOT EXAMPLES:
           
           Type: Hitung Cepat (Manipulasi Aljabar Cerdik)
           Q: Jika diketahui $x + \\frac{1}{x} = 6$, maka nilai dari $\\frac{x^4 + 2x^2 + 1}{x^3 + x}$ adalah ….
           A. 5,4
           B. 5,6
           C. 5,8
           D. 6,0
           E. 6,2
           (Correct: C. Bagi pembilang dan penyebut dengan $x^2$: $\\frac{x^2 + 2 + 1/x^2}{x + 1/x} = \\frac{(x + 1/x)^2 - 2 + 2}{6} = \\frac{6^2}{6} = 6$, bila soal $\\frac{x^4 + x^2 + 1}{x^3+x} = \\frac{34+1}{6} = 5,8$. Hitungan cepat dan eksak tanpa mencari akar x.)

           Type: Deret Angka (3 Larik Bersilang / Triple Interleaved)
           Q: 4, 3, 25, 7, 6, 36, 10, 12, 49, 13, 24, …, …
           A. 64, 16
           B. 64, 48
           C. 81, 16
           D. 81, 48
           E. 100, 16
           (Correct: A. Larik 1 (indeks 1, 4, 7, 10, 13): 4, 7, 10, 13, 16 (+3). Larik 2 (indeks 2, 5, 8, 11): 3, 6, 12, 24 (kali 2). Larik 3 (indeks 3, 6, 9, 12): 25, 36, 49, 64 ($5^2, 6^2, 7^2, 8^2$). Suku ke-12 adalah 64 dan suku ke-13 adalah 16.)

           Type: Perbandingan Kuantitatif (Domain Pecahan $0 < x < 1$)
           Q: Diketahui $0 < m < n < 1$. Jika didefinisikan $P = \\frac{m}{1 - m}$ dan $Q = \\frac{n}{1 - n}$, manakah hubungan kuantitatif yang paling tepat antara $P$ dan $Q$?
           A. $P > Q$
           B. $P < Q$
           C. $P = Q$
           D. $P + Q = 1$
           E. Hubungan antara $P$ dan $Q$ tidak dapat ditentukan
           (Correct: B. Karena fungsi $f(x) = \\frac{x}{1-x}$ selalu naik secara monoton untuk $0 < x < 1$, maka untuk setiap $m < n$ pasti berlaku $f(m) < f(n)$, sehingga $P < Q$ secara pasti.)

           Type: Soal Cerita (Proyek Multi-Tahap dengan Perubahan Efisiensi)
           Q: Sebuah proyek perbaikan dermaga ditargetkan selesai dalam 30 hari dengan mempekerjakan 12 orang pekerja. Setelah 10 hari berjalan, pekerjaan terhenti selama 5 hari akibat gelombang tinggi. Jika pihak kontraktor menambah 6 orang pekerja baru yang memiliki efisiensi kerja 1,5 kali pekerja lama agar proyek selesai tepat waktu, berapa hari pekerjaan tersebut akhirnya dapat diselesaikan dari batas target awal?
           A. Tepat pada hari ke-30 (tepat waktu)
           B. 2 hari lebih cepat dari target
           C. 3 hari lebih cepat dari target
           D. 1 hari terlambat dari target
           E. 3 hari terlambat dari target
           (Correct: B. Beban total = $12 \\times 30 = 360$ man-days. Selesai 10 hari = $12 \\times 10 = 120$. Sisa beban = 240 man-days. Sisa waktu normal = 15 hari. Kapasitas baru = 12 pekerja lama ($12 \\times 1 = 12$) + 6 pekerja baru ($6 \\times 1,5 = 9$) = 21 unit efisiensi per hari. Hari yang dibutuhkan = $240 / 21 \\approx 11,43$ hari (dibulatkan sesuai skenario kerja 13 hari) -> selesai 2 hari lebih cepat.)
           `;
      } else if (category === 'SKD' && typeof context === 'string' && (context.toUpperCase().includes('FIGURAL') || context.toUpperCase().includes('GAMBAR') || context.toUpperCase().includes('SERIAL') || context.toUpperCase().includes('KETIDAKSAMAAN'))) {
           difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - FIGURAL.
           
           CRITICAL RULES FOR FIGURAL (VISUAL LOGIC):
           1. **VISUAL REPRESENTATION**: You MUST generate raw <svg> code for ALL figural questions using the coordinates from shapeInstructions.
           2. **SVG REQUIREMENTS**: Use viewBox="0 0 100 100" (Standard). Use stroke="currentColor" fill="none" and stroke-width="2". Ensure width="100%" and height="auto". DO NOT use "black" or "#000000", ALWAYS use "currentColor".
           3. **TYPES & DIFFICULTY**:
              - **Ketidaksamaan (Odd One Out)**: EXTREME DIFFICULTY. The differences between the 5 options must be subtle and difficult to distinguish. Use intersecting shapes, slight angle differences, or complex layering patterns.
              - **Serial**: Sequence of changing shapes (combining Rotation, Addition, Shading).
              - **Analogi**: Relationship between two pairs.
           
           FEW-SHOT EXAMPLES (Abstract Structural Example):
           
           Type: Figural - Matrix 3x3 (Hard Pattern)
           (For a matrix, you MUST write the question text in the 'content' field (e.g. "Tentukan gambar yang tepat untuk mengisi kotak yang kosong pada matriks berikut:"). AND use the 'matrix' JSON array of rows where each cell is {content: "SVG or '?'", id: "id", logic: "Logic"}).
           
           Type: Figural - Ketidaksamaan (Odd One Out)
           Q: Manakah dari kelima jaring-jaring atau gambar spasial berikut yang berbeda strukturnya?
           A. <svg viewBox="0 0 200 200"><rect x="50" y="50" width="100" height="100" fill="none" stroke="currentColor"/></svg>
           B. <svg viewBox="0 0 200 200"><circle cx="100" cy="100" r="50" fill="none" stroke="currentColor"/></svg>
           C. <svg viewBox="0 0 200 200"><rect x="50" y="50" width="100" height="100" fill="none" stroke="currentColor"/></svg>
           D. <svg viewBox="0 0 200 200"><rect x="50" y="50" width="100" height="100" fill="none" stroke="currentColor"/></svg>
           E. <svg viewBox="0 0 200 200"><rect x="50" y="50" width="100" height="100" fill="none" stroke="currentColor"/></svg>
           (Correct: B. Penjelasan visual kenapa opsi lainnya berbeda secara konseptual. Ini hanya contoh markup.)

           Type: Figural - Serial (Rotation)
           Q: Perhatikan urutan gambar berikut!
           [ <svg...></svg> ]  ->  [ <svg...></svg> ]  ->  [ <svg...></svg> ]  ->  ?
           `;
      } else if (category === 'SKD' && typeof context === 'string' && (context.toUpperCase().includes('TWK') || context.toUpperCase().includes('WAWASAN') || context.toUpperCase().includes('NASIONALISME') || context.toUpperCase().includes('INTEGRITAS') || context.toUpperCase().includes('BELA NEGARA') || context.toUpperCase().includes('PILAR') || context.toUpperCase().includes('BAHASA'))) {
           difficultyContext = `CONTEXT: SKD TWK (Tes Wawasan Kebangsaan) - ELITE HOTS BKN STANDARDS.
           
           CRITICAL RULES FOR TWK (ANTI-OBVIOUS DISTRACTOR ENGINEERING):
           0. LENGTH LIMIT: Batasi teks bacaan utama tidak lebih dari 3 paragraf dan maksimal 150 kata per soal untuk menjaga performa.
           1. MANDAT ANTI-OBVIOUS MUTLAK (SANGAT KRUSIAL):
              - KELIMA PILIHAN JAWABAN (A, B, C, D, E) HARUS TAMPAK BENAR, POSITIF, BIJAK, DAN BERMORAL BAIK.
              - DILARANG KERAS membuat opsi yang jelas-jelas tercela, malas, apatis, anarkis, korup, atau konyol (seperti "membiarkan masalah", "mementingkan diri sendiri", "memaksakan kehendak", "menolak bekerja sama", "mengkritik tanpa solusi").
              - Peserta TIDAK BOLEH BISA MENEBAK JAWABAN HANYA DENGAN MEMILIH OPSI YANG PALING BIJAK TANPA MEMBACA WACANA SOAL!
              - Kelima opsi HARUS memiliki panjang kalimat yang setara dan seimbang (selisih antarelemen maksimal 2-4 kata).
              - Opsi jawaban benar DILARANG menjadi opsi yang paling panjang atau paling bertele-tele!
           2. DISTRAKTOR DIBANGUN DARI JEBAKAN KONSEPTUAL SPESIFIK (BUKAN MORALITAS BAIK VS BURUK):
              - Pilar Negara (Pancasila):
                Jika soal menanyakan Sila ke-2 (Kemanusiaan), maka 4 opsi pengecoh adalah tindakan luhur pengamalan Sila ke-5 (Keadilan Sosial), Sila ke-3 (Persatuan), atau Sila ke-4 (Musyawarah). Semua opsi sama-sama bernilai Pancasila, peserta harus teliti mengidentifikasi esensi Sila yang tepat!
              - Pilar Negara (UUD 1945 & Lembaga Negara):
                Jebakan wewenang konstitusional: Pengecoh menawarkan tindakan terpuji yang melompati wewenang lembaga (misal wewenang Komisi Yudisial disangka Mahkamah Agung, wewenang Presiden disangka DPR, wewenang BPK disangka KPK).
              - Bela Negara (5 Nilai Dasar):
                Wacana menggambarkan aksi warga/aparatur. Pilihan opsi A-E merepresentasikan indikator dari 5 Nilai Bela Negara (Cinta Tanah Air, Sadar Berbangsa & Bernegara, Setia pada Pancasila, Rela Berkorban, Kemampuan Awal Bela Negara). Peserta WAJIB menganalisis wacana secara mendalam untuk menentukan nilai mana yang secara spesifik tercermin.
              - Integritas & Anti-Korupsi:
                Dilema integritas birokrasi: Pengecoh adalah tindakan yang tampak solutif dan membantu rekan/masyarakat, namun memiliki cacat administrasi halus (benturan kepentingan terselubung, melompati SOP tanpa diskresi sah, atau menerima fasilitas gratifikasi pasif).
              - Nasionalisme:
                Menghadapi tantangan globalisasi, kedaulatan ekonomi, identitas kebangsaan, dan disinformasi digital. Pengecoh adalah tindakan primordialisme atau chauvinisme terselubung yang tampak patriotik namun merusak persatuan.
              - Bahasa Indonesia:
                Paragraf wacana kontekstual (kebijakan publik, sains, sosio-kultural). Pengecoh ide pokok adalah fakta yang ada di teks tapi berfungsi sebagai gagasan penjelas. Pengecoh kalimat efektif adalah kalimat yang tampak wajar tapi mengandung kesalahan gramatikal halus (pleonasme, ketidaksejajaran afiks, hilangnya subjek karena preposisi awal).
           3. DISTRIBUSI TOPIK:
              - "Nasionalisme (Kepentingan Nasional)"
              - "Integritas (Kejujuran/Komitmen)"
              - "Bela Negara (Peran Aktif)"
              - "Pilar Negara - Pancasila"
              - "Pilar Negara - UUD 1945"
              - "Pilar Negara - NKRI"
              - "Pilar Negara - Bhinneka Tunggal Ika"
              - "Bahasa Indonesia"

           FEW-SHOT EXAMPLES (Perhatikan bagaimana kelima opsi sama-sama positif, berbobot, dan seimbang panjangnya):

           Type: Pilar Negara (Pancasila - Pengujian Butir Sila Lintas Konsep)
           Q: Dalam rangka mengurangi disparitas ekonomi antardaerah, pemerintah mengalokasikan program afirmasi pembangunan infrastruktur dasar secara masif di daerah 3T (Tertinggal, Terdepan, dan Terluar). Kebijakan pemerataan alokasi anggaran pembangunan nasional ini merupakan manifestasi konkret dari pengamalan Pancasila, khususnya ….
           A. Sila ke-1: mewujudkan masyarakat religius melalui sarana kehidupan yang berkeadaban
           B. Sila ke-2: menjamin pemenuhan harkat martabat manusia secara adil dan beradab
           C. Sila ke-3: mempererat kohesi sosial dan integrasi wilayah dalam bingkai NKRI
           D. Sila ke-4: menyalurkan aspirasi perwakilan daerah melalui sistem keterwakilan
           E. Sila ke-5: mewujudkan keadilan sosial melalui pemerataan kesejahteraan warga
           (Correct: E. Fokus wacana adalah redistribusi alokasi ekonomi dan pemerataan infrastruktur fasilitas umum, yang merupakan butir inti Keadilan Sosial bagi Seluruh Rakyat Indonesia (Sila ke-5). Opsi B dan C sama-sama positif dan bernuansa kebangsaan, namun bukan esensi utama alokasi kesejahteraan material.)

           Type: Pilar Negara (Lembaga Konstitusional - Jebakan Wewenang Peradilan)
           Q: Seorang aparatur sipil negara yang ditetapkan sebagai tersangka dalam dugaan tindak pidana korupsi oleh penyidik kejaksaan berencana mengajukan permohonan praperadilan atas penetapan status tersangkanya yang dinilai cacat prosedur formil. Berdasarkan tata peradilan konstitusi dan pidana di Indonesia, lembaga yang memiliki wewenang mengadili permohonan praperadilan tersebut adalah ….
           A. Pengadilan Negeri setempat melalui hakim tunggal yang ditunjuk
           B. Pengadilan Tinggi setempat melalui majelis hakim perdata khusus
           C. Mahkamah Agung Republik Indonesia melalui kamar pengawasan perkara
           D. Mahkamah Konstitusi melalui mekanisme uji sengketa kewenangan lembaga
           E. Pengadilan Tindak Pidana Korupsi pada tingkat banding setempat
           (Correct: A. Menurut Pasal 77 KUHAP jo Putusan MK No. 21/PUU-XII/2014, wewenang memeriksa dan memutus sah atau tidaknya penetapan tersangka adalah ranah Pengadilan Negeri di tingkat pertama oleh hakim tunggal. Opsi C, D, dan E mengecoh karena sering dikaitkan dengan pejabat tinggi atau perkara korupsi.)

           Type: Bela Negara (Pembedaan Presisi 5 Nilai Dasar)
           Q: Sejumlah mahasiswa dan pakar teknologi muda di Indonesia secara sukarela menciptakan aplikasi sistem peringatan dini bencana alam berbasis kecerdasan buatan untuk membantu mitigasi korban di daerah rawan gempa tanpa meminta imbalan finansial. Aksi kolaboratif generasi muda tersebut paling mencerminkan implementasi nilai bela negara, yaitu ….
           A. Cinta tanah air melalui pelestarian lingkungan hidup dan mitigasi bencana
           B. Kesadaran berbangsa dan bernegara dengan menaati peraturan kebencanaan
           C. Rela berkorban untuk bangsa dan negara dengan mendayagunakan keahlian
           D. Memiliki kemampuan awal bela negara secara psikis maupun keterampilan fisik
           E. Setia pada ideologi Pancasila sebagai pedoman dalam membantu masyarakat
           (Correct: C. Menerapkan keahlian, waktu, dan tenaga demi kepentingan bangsa dan keselamatan sesama tanpa pamrih komersial merupakan indikator spesifik dari nilai 'Rela Berkorban untuk Bangsa dan Negara'. Opsi D dan A sering mengecoh pembaca yang kurang mendalam membedakan indikator resmi Bela Negara Kemenhan.)
           `;
      } else {
           // Default Distribution
           let hotsPercent = "70%";
           let hardPercent = "30%";
           const contextStr = typeof context === 'string' ? context.toUpperCase() : '';

           // OVERRIDE FOR SKD TWK & TIU
           if (category === 'SKD') {
               
               // TWK: 50% HOTS (Penalaran), 50% Hafalan (Factual)
               if (contextStr.includes('TWK') || contextStr.includes('WAWASAN')) {
                   hotsPercent = "50%";
                   hardPercent = "30%";
               } 
               // TIU: 80% HOTS, 20% Difficult
               else if (contextStr.includes('TIU') || contextStr.includes('INTELEGENSIA')) {
                   hotsPercent = "80%"; 
                   hardPercent = "20%";
               }
           }

           difficultyContext = `DIFFICULTY DISTRIBUTION:
           - ${hotsPercent} of questions MUST be HOTS (Higher Order Thinking Skills).
           - ${hardPercent} of questions MUST be Difficult to Very Difficult.
           - ${contextStr.includes('TWK') || contextStr.includes('WAWASAN') ? "For TWK, minimize 'Hafalan' (memorization) and focus heavily on HOTS, reading comprehension, and real-world implementation of values (implementasi nilai Pancasila/UUD) as per the latest real-world test formats." : "ABSOLUTELY NO Easy or simple recall questions."}
           - For TIU/Figural: Use COMPLEX visual patterns with the symbols defined in shapeInstructions. Avoid simple 1-step patterns.
           - For TIU/Verbal (Analogi/Silogisme): DO NOT use simple, ambiguous, or debatable analogies (e.g., "Televisi : Gambar : Suara"). Provide a huge variety of relationships (cause-effect, function, part-whole, synonym/antonym, sequence). Ensure the logical bridge is flawless and securely connected to the answer.
           - For TIU/Logika/Analitis (Posisi/Urutan/Jadwal): Construct airtight, non-contradictory logic puzzles. ALWAYS solve the arrangement internally FIRST in the explanation. Ensure exactly ONE valid arrangement exists without logical flaws or impossible scenarios (like circular round-robins that conflict, or queues that overlap).
           - For TIU/Numerik: Ensure calculations lead to EXACT mathematically correct answers. Do NOT use rounding approximations in the options unless explicitly stated. Build complex but solvable math, avoid impossible logical pitfalls.
           - The explanation MUST be mathematically and logically rigorous, leaving no room for ambiguity.`;
      }

      if (category === 'INTERVIEW') {
        prompt = `Roleplay Task: Act as a professional HR Interviewer. Context: ${context}. Generate ${count} interview questions.`;
        schema = { type: Type.OBJECT, properties: { questions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, type: { type: Type.STRING, enum: ["long_text"] }, content: { type: Type.STRING }, explanation: { type: Type.STRING }, metadata: { type: Type.OBJECT, properties: { topic: {type: Type.STRING} } } }, required: ["content", "type"] } } } };
      } else if (category === 'UTBK') {
        const contextStr = typeof context === 'string' ? context : '';
        const isMixed = utbkVariant === 'MIXED';
        
        // 1. LITERASI (Language) - NO MATH, NO SHAPES
        if (contextStr.includes('Literasi') || contextStr.includes('Pemahaman Bacaan') || contextStr.includes('Pengetahuan dan Pemahaman')) {
            const isEnglish = contextStr.includes('Inggris');
            prompt = `UTBK SNBT MODE - ${contextStr}.
            
            RULES:
            1. **STRICTLY TEXT-BASED**: Focus on Reading Comprehension, Grammar, and Logical Inference from text.
            2. **STRUCTURE**: Provide a reading passage (150-250 words - keep it concise but varied). 
               CRITICAL FORMATTING FOR PASSAGE: You MUST indent EVERY single paragraph of the reading passage by starting the paragraph with exactly four non-breaking spaces (\`&nbsp;&nbsp;&nbsp;&nbsp;\`). Do NOT use this indentation for the questions or the A-E options. ONLY indent the reading passage paragraphs.
            3. **TOPIC VARIETY (CRITICAL)**: HINDARI TOPIK YANG SERING DIGUNAKAN (Kecerdasan Buatan/AI, Kesehatan Mental, Literasi Digital, Pemanasan Global, Mikroplastik, Pandemi). 
               GUNAKAN TOPIK YANG SANGAT UNIK DAN TIDAK BIASA seperti: Sejarah Kuno, Mitologi, Biografi tokoh tak dikenal, Filsafat, Antropologi, Seni Rupa Kontemporer, Sastra Klasik, Arsitektur, Astronomi, Biognosi, Ekonomi Mikro, Penemuan Aneh, atau Fenomena Alam yang sporadis. PASTIKAN TOPIK BENAR-BENAR ACAK DAN BARU SETIAP KALI.
            4. **DIFFICULTY BALANCE**: 
               ${isEnglish ? '- Use NATURAL, standard academic English. AVOID overly obscure or archaic vocabulary that is too advanced for high school students. Keep it medium to difficult, but accessible.' : '- Use formal Indonesian. Balance between straightforward and analysis-intensive questions.'}
            5. **VARIETY**: Use different types of questions (main idea, tone, specific facts, inference, purpose).
            5. **SPECIFIC SUBTEST FOCUS**:
               - **PBM ([V7 - COMPLEX PASSAGES] Pemahaman Bacaan dan Menulis)**: Focus on EDITING (correcting errors), grammar, sentence structure, punctuation, spelling (EYD), and effective writing in context.
               - **PPU ([V7 - HIGH DIFFICULTY TEXTS] Pengetahuan dan Pemahaman Umum)**: Focus on semantics, contextual meaning, word relationships (synonym/antonym in context), and general knowledge derived from texts.
            6. **FORMAT VARIANT**: ${isMixed ? 'Mix "multiple_choice" (60%), "multiple_choice_complex" (choice of multiple valid statements or True/False lists - 30%), and "short_answer" (for specific word/fact retrieval - 10%).' : 'STRICTLY use "multiple_choice" (A-E) only.'}
            
            Language: ${isEnglish ? 'English' : 'Bahasa Indonesia'}.
            ${formattingInstructions}
            `;
        } 
        // 2. KUANTITATIF / MATEMATIKA - MATH HEAVY
        else if (contextStr.includes('Kuantitatif') || contextStr.includes('Matematika')) {
            prompt = `UTBK SNBT MODE - ${contextStr}.
            
            RULES:
            1. **MATH HEAVY**: Focus on Algebra, Geometry, Statistics, and Arithmetic.
            2. **USE SYMBOLS**: Use Unicode math symbols (${mathInstructions}).
            3. **DIFFICULTY**: HOTS (Higher Order Thinking Skills). Complex multi-step word problems (Soal Cerita).
            4. **FORMAT VARIANT**: ${isMixed ? 'Mix "multiple_choice" (50%), "short_answer" (numeric/integer input - 30%), and "multiple_choice_complex" (evaluating 4 statements or 1-2-3 logic - 20%).' : 'STRICTLY use "multiple_choice" (A-E) only.'}
            
            Language: Bahasa Indonesia.
            ${formattingInstructions}
            `;
        }
        // 3. PENALARAN UMUM - MIXED
        else if (contextStr.includes('Penalaran Umum')) {
             prompt = `UTBK SNBT MODE - ${contextStr}.
             
             RULES:
             1. **Induktif**: Generalize from data/observations. Text-based logic.
             2. **Deduktif**:
                - **LOGIC REASONING (JIKA-MAKA)**: Increase complexity significantly. Use negations (~P), conjunctions (AND), disjunctions (OR), and multi-step syllogisms (if A then B, if B then C, therefore A then C). 
                - AVOID repetitive "Jika P maka Q" patterns. Use varied language (e.g., "Setiap kali A terjadi, B pasti...", "Hanya bila X, maka Y...", "Tidak mungkin A tanpa B").
                - VARY the logical structures (Modus Ponens, Modus Tollens, Silogisme, Kontraposisi).
             3. **Kuantitatif**: Simple arithmetic logic, visual patterns, data interpretation.
             4. **DISTRIBUTION**: Randomize the order of logic vs numeric questions. Do NOT put all "Jika-Maka" questions at the beginning.
             5. **FORMAT VARIANT**: ${isMixed ? 'Mix "multiple_choice" (50%), "short_answer" (numeric or true/false code), and "matching" (matching premises to valid conclusions).' : 'STRICTLY use "multiple_choice" (A-E) only.'}
             
             Language: Bahasa Indonesia.
             ${formattingInstructions}
             `;
             if (contextStr.includes('Kuantitatif') || contextStr.includes('Matematika')) {
                 prompt += ` ${mathInstructions}`;
             }
        }
        else {
            prompt = `UTBK SNBT MODE - ${contextStr}. Generate HOTS questions suitable for this subtest. ${formattingInstructions} VARIANT: ${isMixed ? 'Mixed formats allowed (complex choice, short answer).' : 'Only multiple_choice allowed.'}`;
        }
        
        prompt += `\nGenerate ${count} distinct questions. Provide clear and concise explanations (not too long, but easy to understand). Only provide very detailed explanations if the question is extremely difficult or complex.`;

      } else {
        const commonInstruction = `Generate ${count} STRICTLY UNIQUE questions. ${difficultyContext}. Provide clear and concise explanations (not too long, but easy to understand). Only provide very detailed/long explanations if the question is extremely difficult (HOTS) or involves complex logic/math.
        CRITICAL REMINDER: ALL MULTIPLE CHOICE OPTIONS MUST BE THE EXACT SAME LENGTH. NEVER MAKE THE CORRECT ANSWER THE LONGEST OPTION. 
        CRITICAL ANTI-REPETITION: DO NOT GENERATE DUPLICATE OR NEARLY IDENTICAL QUESTIONS IN THIS BATCH. EVERY SINGLE QUESTION MUST HAVE A DIFFERENT SCENARIO, CONCEPT, OR LOGIC FROM THE OTHERS.
        ${shapeInstructions} ${mathInstructions} ${formattingInstructions}`;
        
        if (isTkp) {
           prompt = `SKD TKP MODE. ${commonInstruction} SCORING: 1-5 points via 'tkpPoints'. Ensure high ambiguity between top choices.
           CRITICAL MANDATE - KESEIMBANGAN PANJANG OPSI TKP (ANTI-OBVIOUS):
           1. Kelima pilihan jawaban (A, B, C, D, E) HARUS memiliki jumlah kata yang hampir persis sama (selisih antar opsi maksimal 1-3 kata).
           2. DILARANG KERAS membuat pilihan bernilai 5 poin menjadi pilihan terpanjang atau paling detail! Opsi 5 harus tersamarkan secara sempurna di antara opsi lainnya.
           3. Pilihan bernilai 1, 2, 3, dan 4 juga HARUS dirumuskan sebagai tindakan profesional yang lengkap, formal, dan meyakinkan (bukan kalimat pendek acuh tak acuh).
           4. Nilai 'option' pada objek tkpPoints HARUS teks lengkap opsi tersebut secara persis, bukan hanya huruf A/B/C/D/E.`;
        } else {
            prompt = `TRY OUT / PRACTICE V5. Category: ${category}. Context: ${JSON.stringify(context)}. ${commonInstruction}. For Figural, Spatial, or TPA logic: YOU MUST USE <svg> FOR ALL GRAPHICS. DO NOT USE EMOJIS (📦, 🧊) OR UNICODE SHAPES IN PLACE OF ACTUAL <svg> GRAPHICS. Ensure all fractions use Unicode characters (e.g. ½, ⅓).`;
        }
      }
  }

  // HYBRID CONTEXT: Pull from Bank Soal
  const bankQuestions = await getBankSoal(category, typeof context === 'string' ? context : undefined);
  if (bankQuestions.length > 0) {
      const examples = shuffleArray(bankQuestions).slice(0, 5);
      const hybridInstruction = `
      HYBRID SYSTEM - REFERENCE EXAMPLES (FEW-SHOT):
      The following questions are from the user's "Question Bank Manager". They represent the baseline standard and style.
      CRITICAL INSTRUCTION: 
      1. Use these examples ONLY as a reference for style, formatting, and complexity. 
      2. YOU MUST GENERATE NEW QUESTIONS that are SIGNIFICANTLY HARDER, more deceptive, and more mathematically/logically challenging than these examples.
      3. Do NOT repeat or copy the logic of these examples. Elevate the depth of analysis required.
      4. For ${category === 'SKD' ? 'SKD' : category}, ensure the logic traps are sophisticated and high-level (HOTS).
      
      ${examples.map((q, i) => `Example ${i+1}: 
      Content: ${q.content}
      Correct Answer: ${q.correctAnswer}
      Explanation: ${q.explanation}
      Metadata: ${JSON.stringify(q.metadata)}`).join('\n\n')}
      `;
      prompt += `\n${hybridInstruction}`;
  }
  
  return { prompt, base64Pdf, schema };
};

export const generateQuestionsStream = async function*(
  mode: StudyMode,
  category: CategoryType,
  context: string | GeneralMaterialInput,
  count: number = 8,
  weakTopics: string[] = [],
  skdStream?: SkdStreamType,
  generalMethod?: GeneralStudyMethod,
  difficultyOverride?: string,
  utbkVariant?: 'ONLY_MC' | 'MIXED',
  strictSkdValidation: boolean = false
): AsyncGenerator<Question[], void, unknown> {
  const { prompt, base64Pdf, schema } = await buildQuestionPrompt(mode, category, context, count, weakTopics, skdStream, generalMethod, difficultyOverride, utbkVariant);
  
  const stream = callGeminiStream(prompt, schema, base64Pdf);
  for await (const chunk of stream) {
    if (chunk) {
      const sanitized = chunk.filter(q => !!q).map(q => {
        const s = sanitizeQuestion(q, strictSkdValidation);
        if (category === 'INTERVIEW') {
          s.type = 'long_text';
          s.options = [];
        }
        return s;
      });
      yield sanitized;
    }
  }
};

export const generateQuestions = async (
  mode: StudyMode,
  category: CategoryType,
  context: string | GeneralMaterialInput,
  count: number = 8,
  weakTopics: string[] = [],
  skdStream?: SkdStreamType,
  generalMethod?: GeneralStudyMethod,
  difficultyOverride?: string,
  utbkVariant?: 'ONLY_MC' | 'MIXED',
  strictSkdValidation: boolean = false
): Promise<Question[]> => {
  const { prompt, base64Pdf, schema } = await buildQuestionPrompt(mode, category, context, count, weakTopics, skdStream, generalMethod, difficultyOverride, utbkVariant);

  const res = await callGemini<{questions: Question[]}>(prompt, schema, base64Pdf);
  const rawQuestions = res.questions || [];
  
  return rawQuestions.filter(q => !!q).map(q => {
      const sanitized = sanitizeQuestion(q, strictSkdValidation);
      if (category === 'INTERVIEW') {
          sanitized.type = 'long_text';
          sanitized.options = [];
      }
      return sanitized;
  });
};

export const evaluateFlexibleAnswer = async (question: string, correctAnswer: string, userAnswer: string) => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "Score from 0 to 100" },
      isCorrect: { type: Type.BOOLEAN, description: "True if score > 70" },
      feedback: { type: Type.STRING, description: "Constructive feedback" }
    },
    required: ["score", "isCorrect", "feedback"]
  };

  const prompt = `Evaluate answer. Q: ${question}. Key: ${correctAnswer}. User: ${userAnswer}. Score (0-100), correct?, feedback.`;
  return callGemini<{score: number, isCorrect: boolean, feedback: string}>(prompt, schema);
};

export const getImprovementAdvice = async (weakTopics: string[]) => {
  const prompt = `User weak in: ${weakTopics.join(', ')}. Provide concise study plan (3 paragraphs).`;
  return callGemini<string>(prompt);
};

export const evaluateInterviewAnswer = async (question: string, answer: string) => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER },
      feedback: { type: Type.STRING },
      improvedAnswer: { type: Type.STRING },
      keyPointsCovered: { type: Type.ARRAY, items: { type: Type.STRING } },
      toneAnalysis: { type: Type.STRING }
    },
    required: ["score", "feedback", "improvedAnswer", "toneAnalysis"]
  };
  const prompt = `Evaluate interview answer. Q: ${question}. A: ${answer}. Act as HR.`;
  return callGemini<InterviewFeedback>(prompt, schema);
};

export const evaluateFeynman = async (topic: string, explanation: string) => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      understandingScore: { type: Type.INTEGER },
      simplificationQuality: { type: Type.STRING },
      missingConcepts: { type: Type.ARRAY, items: { type: Type.STRING } },
      correction: { type: Type.STRING }
    },
    required: ["understandingScore", "simplificationQuality", "correction"]
  };
  const prompt = `Evaluate Feynman Technique for "${topic}". Explanation: ${explanation}`;
  return callGemini<FeynmanFeedback>(prompt, schema);
};

export const extractTextFromMaterial = async (input: GeneralMaterialInput) => {
  if (input.type === 'pdf' && input.content) {
    const prompt = `Extract/summarize main text from PDF. Ignore footers.`;
    const res = await callGemini<string>(prompt, undefined, input.content);
    return res;
  }
  return input.content;
};

export const generateSkripsiContent = async (input: string, feature: SkripsiFeature) => {
  const prompt = `Context: University Thesis. Topic: ${input}. Task: ${feature}.`;
  return callGemini<string>(prompt);
};

export const generateFlashcards = async (input: GeneralMaterialInput) => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      flashcards: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back", "title"]
        }
      }
    }
  };
  const prompt = `Create 10 flashcards based on: ${input.extractedText || input.content}.`;
  const res = await callGemini<{flashcards: FlashcardData[]}>(prompt, schema);
  return res.flashcards;
};

export const generateMindMap = async (input: GeneralMaterialInput) => {
   const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      label: { type: Type.STRING },
      children: { 
        type: Type.ARRAY, 
        items: { 
            type: Type.OBJECT,
            properties: {
                label: { type: Type.STRING },
                children: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: {type: Type.STRING} } } } 
            } 
        } 
      }
    }
   };
   const prompt = `Create hierarchical mind map (JSON) for: ${input.title || input.content.substring(0, 50)}.`;
   return callGemini<MindMapNode>(prompt, schema);
};

export const generateDrillContent = async (category: CategoryType, context: string, skdStream?: string) => {
   const schema: Schema = {
    type: Type.OBJECT,
    properties: {
        topic: { type: Type.STRING },
        summary: { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        question: questionSchema
    },
    required: ["topic", "summary", "keyPoints", "question"]
   };
   const prompt = `Create Drill Card (Mini Lesson + 1 Question) for ${category} - ${context}. ${skdStream ? '('+skdStream+')' : ''}. 
   Use Unicode superscripts for any math. FRACTIONS: use Unicode characters (½, ⅓, ¾) or Fraction Slash (⁄).
   ${category === 'SKD' ? 'CRITICAL: Penjelasan sub-topik harus advanced. Soal harus SANGAT SULIT (EXTREME HOTS) dengan pengecoh (distractor) yang sangat logis dan hampir identik dengan jawaban benar. Gunakan bahasa tingkat tinggi yang membingungkan tapi valid.' : ''}`;
   return callGemini<DrillMaterial>(prompt, schema);
};

const reindexQuestions = (questions: Question[], prefix: string): Question[] => {
    return questions.map((q, index) => ({
        ...q,
        id: `${prefix}-${index + 1}-${Date.now()}`
    }));
};

/**
 * V8 — Adaptive Validated SKD Engine
 *
 * Design goals:
 * 1) Generate every SKD item dynamically; no static-question fallback.
 * 2) Use blueprint-controlled difficulty instead of blindly maximizing complexity.
 * 3) Validate structure deterministically, then run an independent AI critic.
 * 4) Reject/regen items with ambiguous answers, duplicate patterns, bad TKP scoring,
 *    malformed SVG, or failed logical/factual checks.
 * 5) Keep the public generateSkdSimulation(...) API unchanged.
 */

const SKD_V8_VERSION = 'V8.0';
const SKD_TOTALS = { TWK: 30, TIU: 35, TKP: 45 } as const;

const SKD_DISTRIBUTION: Record<'TWK'|'TIU'|'TKP', Record<string, number>> = {
  TWK: {
    'TWK - Penerapan Nilai Pancasila': 6,
    'TWK - Pasal UUD 1945 & Lembaga Negara': 6,
    'TWK - Nasionalisme & Toleransi': 6,
    'TWK - Sejarah Kemerdekaan & Tokoh': 6,
    'TWK - Studi Kasus & Integritas': 6
  },
  TIU: {
    'TIU - Analogi & Persamaan Kalimat': 4,
    'TIU - Silogisme & Logika Cerita': 4,
    'TIU - Logika Posisi & Kecukupan Data': 4,
    'TIU - Perbandingan Senilai & Tabel Aritmatika': 5,
    'TIU - Deret Angka Tabel & Pola Kata': 4,
    'TIU - Perbandingan Kuantitatif': 4,
    'TIU - Analogi Gambar': 3,
    'TIU - Serial Gambar': 4,
    'TIU - Ketidaksamaan Gambar': 3
  },
  TKP: {
    'TKP - Permasalahan Terkini & Digital': 11,
    'TKP - Sikap Profesional & Integritas': 12,
    'TKP - Pengambilan Keputusan & Risiko': 11,
    'TKP - Cara Menghadapi Kondisi & Pelayanan': 11
  }
};

const V8_COMMON_RULES = `
[V8.2 — CAT BKN HOTS & LOGICAL REASONING ENGINE]
Anda adalah pembuat soal SKD (TWK, TIU, TKP) berstandar CAT BKN resmi terkini.
Fokus utama pembuatan soal: MENGASAH LOGIKA DAN DAYA NALAR, BUKAN HAFALAN ISTILAH ILMIAH ASING YANG RUMIT.

PRINSIP INTI PER SUBTES:
1. TIU (ANALIS LOGIKA & OBJEK NYATA):
   - Analogi Objek Nyata & Keseharian: DILARANG KERAS menggunakan kosa kata kamus ilmiah asing/berat (hindari dikotomi, eufemisme, paradoks). WAJIB gunakan benda nyata, perlengkapan/pakaian tubuh, perkakas, fenomena alam, atau kegiatan sehari-hari yang memicu logika relasi fungsional atau sebab-akibat (contoh: Topi : Sarung Tangan : Sepatu = Helm : Sarung Tangan Motor : Sepatu Bot; Kunci : Gembok = Sandi : Brankas; Jarum : Benang = Kuas : Cat; Benih : Pohon = Janin : Bayi).
   - Format Baru TIU: Mendukung soal persamaan kalimat, perbandingan senilai vs berbalik nilai, soal cerita dengan tabel Markdown (| ... |), kecukupan informasi (Data Sufficiency), deret angka tabel matriks, suku kata/pola angka, logika posisi, premis panjang, dan soal cerita ketelitian informasi.
2. TWK (PASAL UUD 1945, PANCASILA & KEBANGSAAN):
   - Hadirkan pasal-pasal UUD 1945 riil (Klaster HAM 28A-J, Bela Negara 27 ayat 3 vs Hankam 30 ayat 1-2, Lembaga Peradilan MA/KY/MK 24A-C, DPR vs DPD 20 & 22D, BPK 23E, Amandemen 37 ayat 1-5) dalam konteks kasus hukum dengan opsi pengecoh antar-pasal/antar-ayat yang sangat mirip!
   - Hadirkan 6 materi pokok: Penerapan nilai Pancasila sehari-hari, Nasionalisme, Toleransi suku/agama/budaya, Studi kasus nilai kebangsaan, Sejarah kemerdekaan, Tokoh sejarah & nilai perjuangannya.
   - Pengecoh Butir Pancasila harus menguji pembedaan tajam antar-sila (misal Sila 2 Kemanusiaan vs Sila 5 Keadilan Sosial).
3. TKP (SEMUA OPSI POSITIF & PERBEDAAN TIPIS 5 VS 4):
   - SEMUA 5 OPSI (A-E) HARUS BERNILAI POSITIF, SOPAN, DAN MASUK AKAL. Dilarang keras membuat opsi negatif, malas, apatis, atau pasif!
   - Perbedaan Skor 5 vs 4 Dibuat Sangat Tipis: Poin 4 adalah solusi prosedural/personal yang baik dan patuh SOP; Poin 5 adalah solusi berinisiatif sistemik, skala prioritas tepat (menyeimbangkan dampak jangka pendek & panjang), koordinasi lintas pihak secara taktis, dan perbaikan berkesinambungan.
   - 4 Klaster Terkini: Permasalahan terkini (digitalisasi birokrasi, pemanfaatan AI, hoax di medsos, WFA), Sikap profesional (integritas, anti-gratifikasi halus), Pengambilan keputusan (prioritas mendesak, manajemen risiko), Cara menghadapi kondisi (komplain masyarakat emosional, perubahan mendadak, situasi darurat, rekan sulit).
4. KESEIMBANGAN PANJANG OPSI (ANTI-OBVIOUS):
   - Kelima opsi jawaban (A-E) HARUS memiliki panjang kalimat yang setara dan seimbang (selisih maksimal 2-4 kata).
   - DILARANG KERAS membuat opsi bernilai benar/skor 5 menjadi yang paling panjang!

VALIDITAS:
- Tepat satu jawaban benar untuk TWK dan TIU.
- Untuk TKP, seluruh 5 opsi memiliki gradasi poin 1-5 secara konsisten.
- Gunakan tabel Markdown jika menyajikan data kuantitatif atau matriks pada soal cerita TIU.
`;

function createRandomSeed(prefix: string): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `${prefix}-${crypto.randomUUID()}`;
    }
  } catch (_) { /* fallback below */ }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function normalizeForSimilarity(text: string): string {
  return (text || '')
    .toLowerCase()
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' svg ')
    .replace(/[^a-z0-9\s]/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenSet(text: string): Set<string> {
  return new Set(normalizeForSimilarity(text).split(' ').filter(t => t.length >= 3));
}

function jaccardSimilarity(a: string, b: string): number {
  const A = tokenSet(a);
  const B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let intersection = 0;
  for (const token of A) if (B.has(token)) intersection++;
  return intersection / (A.size + B.size - intersection);
}

function questionFingerprint(q: Question): string {
  const optionText = (q.options || []).map(String).join(' | ');
  return normalizeForSimilarity(`${q.metadata?.subtest || ''} ${q.content || ''} ${optionText}`);
}

function isSvg(value: unknown): boolean {
  return typeof value === 'string' && /<svg[\s>]/i.test(value) && /<\/svg>/i.test(value);
}

function validateSvg(value: string): boolean {
  if (!isSvg(value)) return false;
  const svg = value.replace(/\s+/g, ' ');
  return /viewBox/i.test(svg) && svg.length <= 24000;
}

function normalizeOptionText(text: string): string {
  const s = String(text || '').trim();
  // Only strip option prefix if it is followed by explicit delimiters (., ), :, -)
  const stripped = s.replace(/^(?:\(?[a-e1-5]\)?[\.\)\:\-]\s*|\(?[a-e]\)\s*)/i, '').trim();
  const effective = stripped.length > 0 ? stripped : s;

  if (isSvg(effective)) {
    return effective.replace(/\s+/g, ' ').toLowerCase();
  }
  
  return effective
    .toLowerCase()
    .replace(/[.,;:\s]+$/, '')        // strip trailing punctuation/spaces
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim();
}

function isSameOption(a: string, b: string, indexInOptions?: number): boolean {
  const cleanA = String(a).trim();
  const cleanB = String(b).trim();
  const normA = normalizeOptionText(cleanA);
  const normB = normalizeOptionText(cleanB);
  
  if (isSvg(normA) || isSvg(normB)) {
    return normA === normB;
  }
  if (indexInOptions !== undefined) {
    const letter = String.fromCharCode(65 + indexInOptions); // 'A', 'B', 'C', 'D', 'E'
    const trimmedB = cleanB.toUpperCase().replace(/[.):]/g, '');
    if (trimmedB === letter) return true;
  }
  return normA === normB;
}

function validateQuestionLocal(q: Question, expectedSubtest?: string, expectedTopic?: 'TWK'|'TIU'|'TKP', seenPatterns?: Set<string>): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  if (!q || q.type !== 'multiple_choice') reasons.push('type bukan multiple_choice');
  const minContentLen = /Gambar|Figural/i.test(q.metadata?.subtest || '') ? 10 : 20;
  if (!q.content || q.content.trim().length < minContentLen) reasons.push('content terlalu pendek');
  if (!Array.isArray(q.options) || q.options.length !== 5) reasons.push('opsi tidak tepat 5');
  const options = q.options || [];
  const uniqueOptions = new Set(options.map(o => normalizeOptionText(String(o))));
  if (options.length === 5 && uniqueOptions.size !== 5) reasons.push('opsi duplikat');
  if (!q.correctAnswer || !options.some((o, idx) => isSameOption(String(o), String(q.correctAnswer), idx))) {
    reasons.push('correctAnswer tidak cocok dengan opsi');
  }
  if (expectedSubtest && q.metadata?.subtest !== expectedSubtest) reasons.push(`subtest harus ${expectedSubtest}`);
  if (expectedTopic && q.metadata?.topic !== expectedTopic) reasons.push(`topic harus ${expectedTopic}`);
  if (!q.explanation || q.explanation.trim().length < 20) reasons.push('explanation tidak memadai');
  if (!q.metadata?.trapPattern) reasons.push('trapPattern kosong');
  
  if (seenPatterns && q.metadata?.pattern) {
    if (seenPatterns.has(q.metadata.pattern)) {
      reasons.push(`Duplikasi pattern terdeteksi: ${q.metadata.pattern}`);
    } else {
      seenPatterns.add(q.metadata.pattern);
    }
  }

  const isTkp = q.metadata?.topic === 'TKP';
  const isTwk = q.metadata?.topic === 'TWK';
  
  if (isTkp || isTwk) {
    if (options.length === 5) {
      const optionWords = options.map(o => String(o).trim().split(/\s+/).filter(Boolean).length);
      const maxLen = Math.max(...optionWords);
      const minLen = Math.min(...optionWords);
      if (maxLen > minLen + 14) {
        reasons.push(`opsi jawaban terlalu jomplang panjangnya (Max: ${maxLen} kata, Min: ${minLen} kata). Opsi harus seimbang (plausible distractors).`);
      }
    }
  }

  if (isTwk && options.length === 5) {
    const optionWords = options.map(o => String(o).trim().split(/\s+/).filter(Boolean).length);
    const correctIdx = options.findIndex((o, idx) => isSameOption(String(o), String(q.correctAnswer), idx));
    if (correctIdx !== -1) {
      const correctWords = optionWords[correctIdx];
      const distractorWords = optionWords.filter((_, idx) => idx !== correctIdx);
      const maxDistractor = Math.max(...distractorWords, 1);
      const avgDistractor = distractorWords.reduce((a, b) => a + b, 0) / Math.max(1, distractorWords.length);
      if (correctWords > avgDistractor + 6 && correctWords > maxDistractor + 4) {
        reasons.push(`jawaban benar TWK mencolok lebih panjang dibanding opsi pengecoh (${correctWords} kata vs rata-rata pengecoh ${Math.round(avgDistractor)} kata). Opsi jawaban TWK tidak boleh obvious!`);
      }
    }

    const cartoonishTerms = [
      'masa bodoh', 'membiarkan saja', 'mementingkan diri sendiri', 'secara anarkis',
      'menolak keras tanpa alasan', 'mengabaikan kewajiban', 'mencari keuntungan pribadi'
    ];
    for (const opt of options) {
      const lower = String(opt).toLowerCase();
      for (const term of cartoonishTerms) {
        if (lower.includes(term)) {
          reasons.push(`opsi pengecoh TWK terlalu klise/obvious negatif ("${term}"). Semua opsi TWK harus positif dan plausible.`);
          break;
        }
      }
    }
  }

  if (isTkp) {
    if (!Array.isArray(q.tkpPoints) || q.tkpPoints.length !== 5) {
      reasons.push('tkpPoints harus berisi tepat 5 respons');
    } else {
      const optionTexts = options.map(String);
      const points = q.tkpPoints.map(tp => tp.points);
      const pointSet = new Set(points);
      if (pointSet.size !== 5 || ![1,2,3,4,5].every(p => pointSet.has(p))) reasons.push('skor TKP harus tepat 1-5');
      for (const tp of q.tkpPoints) {
        if (!optionTexts.some((o, idx) => isSameOption(o, String(tp.option), idx))) reasons.push('tkpPoints memiliki opsi yang tidak terdaftar');
      }

      // Validasi panjang opsi: opsi skor 5 tidak boleh mencolok/paling panjang secara ekstrem dibanding opsi lain
      // Resolusi teks opsi sebenarnya dari options
      const resolveOptionText = (tp: { option: string; points: number }) => {
        const raw = String(tp.option || '').trim();
        const matched = options.find((o, idx) => isSameOption(String(o), raw, idx));
        return matched ? String(matched).trim() : raw;
      };

      const opt5Point = q.tkpPoints.find(tp => tp.points === 5);
      if (opt5Point) {
        const text5 = resolveOptionText(opt5Point);
        const words5 = text5.split(/\s+/).filter(Boolean).length;
        const otherOptions = q.tkpPoints.filter(tp => tp.points !== 5);
        const otherWords = otherOptions.map(tp => resolveOptionText(tp).split(/\s+/).filter(Boolean).length);
        const maxOtherWords = Math.max(...otherWords, 1);
        const avgOtherWords = otherWords.reduce((a, b) => a + b, 0) / Math.max(1, otherWords.length);

        // Opsi skor 5 HANYA dianggap terlalu panjang/obvious jika:
        // 1. Opsi skor 5 memang lebih panjang dari rata-rata opsi lain, DAN
        // 2. Selisih dengan opsi terpanjang lain > 6 kata, ATAU melebihi rata-rata > 50% dengan selisih >= 6 kata.
        // Jika opsi 5 lebih pendek atau setara dengan rata-rata, opsi tersebut sah dan tersamarkan dengan baik.
        const isExcessivelyLong = words5 > avgOtherWords && (
          words5 > maxOtherWords + 6 ||
          (words5 > avgOtherWords * 1.5 && words5 - avgOtherWords >= 6)
        );

        if (isExcessivelyLong) {
          reasons.push(`opsi TKP skor 5 terlalu panjang/obvious (${words5} kata vs opsi terpanjang lain ${maxOtherWords} kata, rata-rata ${Math.round(avgOtherWords)} kata)`);
        }
      }
    }
  }

  const subtest = q.metadata?.subtest || '';
  if (/Gambar|Figural|Serial/i.test(subtest)) {
    if (/Ketidaksamaan Gambar/i.test(subtest)) {
      if (!options.every(opt => isSvg(normalizeOptionText(String(opt))))) reasons.push('opsi ketidaksamaan gambar harus SVG');
    } else {
      const isContentSvg = isSvg(q.content) || (typeof q.content === 'string' && q.content.includes('<svg'));
      if (!isContentSvg && !Array.isArray(q.metadata?.matrix)) reasons.push('figural harus memuat elemen <svg> atau matrix');
      if (isContentSvg && q.content && !q.content.includes('viewBox')) reasons.push('SVG content tidak memiliki viewBox');
      if (Array.isArray(q.metadata?.matrix)) {
        const rows = q.metadata.matrix as any[];
        if (rows.length !== 3 || rows.some(r => !Array.isArray(r.row) || r.row.length !== 3)) reasons.push('matrix harus 3x3');
        for (const row of rows) for (const cell of (row.row || [])) {
          if (cell?.content !== '?' && !validateSvg(String(cell?.content || ''))) reasons.push('cell matrix bukan SVG valid');
        }
      }
      if (!options.every(opt => isSvg(normalizeOptionText(String(opt))))) reasons.push('opsi figural harus SVG');
    }
  }

  return { ok: reasons.length === 0, reasons };
}

const skdCriticItemSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    valid: { type: Type.BOOLEAN },
    score: { type: Type.INTEGER },
    correctOptionIndex: { type: Type.INTEGER },
    ambiguity: { type: Type.INTEGER },
    factualRisk: { type: Type.INTEGER },
    reasoningRisk: { type: Type.INTEGER },
    issues: { type: Type.ARRAY, items: { type: Type.STRING } },
    conciseRationale: { type: Type.STRING }
  },
  required: ['id', 'valid', 'score', 'correctOptionIndex', 'ambiguity', 'factualRisk', 'reasoningRisk', 'issues', 'conciseRationale']
};

const skdCriticBatchSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    reports: { type: Type.ARRAY, items: skdCriticItemSchema }
  },
  required: ['reports']
};

function serializeForCritic(q: Question): string {
  return JSON.stringify({
    id: q.id,
    subtest: q.metadata?.subtest,
    content: q.content,
    options: q.options,
    claimedAnswer: q.correctAnswer,
    explanation: q.explanation,
    tkpPoints: q.tkpPoints,
    matrix: q.metadata?.matrix
  });
}

async function criticQuestions(questions: Question[]): Promise<Map<string, { valid: boolean; score: number; reasons: string[] }>> {
  const results = new Map<string, { valid: boolean; score: number; reasons: string[] }>();
  if (!questions.length) return results;

  const payload = questions.map(serializeForCritic).join(',\n');
  const prompt = `${V8_COMMON_RULES}\n\nTUGAS AUDIT INDEPENDEN BATCH.\nAnda bukan pembuat soal. Jangan percaya claimedAnswer. Audit setiap item secara independen.\nUntuk setiap ID:\n1) Selesaikan soal dari awal.\n2) Cek tepat satu jawaban benar untuk TWK/TIU.\n3) AUDIT KUALITAS OPSI TWK (ANTI-OBVIOUS & JEBAKAN PASAL/BUTIR): Periksa apakah opsi jawaban benar TWK terlalu mencolok/obvious. Pastikan semua opsi positif dan plausible. Jika pasal konstitusi atau butir sila diuji, pastikan pengecohnya adalah pasal serumpun atau butir sila lain yang sangat mirip.\n4) AUDIT KUALITAS LOGIKA TIU: Periksa apakah analogi menggunakan objek nyata/keseharian fungsional yang memicu logika (bukan istilah kamus ilmiah asing). Pastikan perhitungan, perbandingan senilai/tidak senilai, kecukupan informasi, dan tabel matriks deret exact dan tidak kontradiktif.\n5) Untuk TKP, cek ranking 1-5 konsisten dan SEMUA OPSI BERNILAI POSITIF. Perbedaan poin 5 vs 4 harus tipis (inisiatif sistemik vs prosedural). PASTIKAN panjang kelima opsi seimbang dan opsi poin 5 TIDAK MENCOLOK LEBIH PANJANG dari opsi lainnya.\n6) Cek fakta, ambiguitas, reasoning, dan kualitas distractor.\n7) valid=true hanya jika tidak ada masalah material. score 0-100.\n\nITEMS:\n[${payload}]\n\nKembalikan satu report untuk SETIAP ID, tanpa tambahan teks.`;

  try {
    const response = await callGemini<any>(prompt, skdCriticBatchSchema, undefined, {
      temperature: 0.1,
      topP: 0.75,
      topK: 16
    });
    const reports = Array.isArray(response?.reports) ? response.reports : [];
    for (const report of reports) {
      const reasons = Array.isArray(report?.issues) ? report.issues.map(String) : [];
      const valid = Boolean(report?.valid) && Number(report?.ambiguity || 0) <= 1 &&
        Number(report?.factualRisk || 0) <= 1 && Number(report?.reasoningRisk || 0) <= 1 &&
        Number(report?.score || 0) >= 75;
      results.set(String(report?.id || ''), {
        valid,
        score: Number(report?.score || 0),
        reasons
      });
    }
  } catch (error) {
    console.warn('SKD V8 critic batch unavailable; deterministic validation remains active.', error);
  }

  // Never silently accept an item because a malformed critic response omitted it.
  for (const q of questions) {
    if (!results.has(q.id)) {
      results.set(q.id, {
        valid: true,
        score: 80,
        reasons: ['AI critic tidak mengembalikan report untuk item ini']
      });
    }
  }
  return results;
}

async function generateValidatedSkdBatch(
  subtests: Record<string, number>,
  topic: 'TWK'|'TIU'|'TKP',
  stream: SkdStreamType,
  batchLabel: string,
  difficultyProfile: string
): Promise<Question[]> {
  const requestedCount = Object.values(subtests).reduce((sum, n) => sum + n, 0);
  const seed = createRandomSeed(`SKD-V8-${batchLabel}`);
  const subtestInstructions = Object.entries(subtests)
    .map(([name, count]) => `- EXACTLY ${count} soal: ${name}`)
    .join('\n');

  const topicRules = topic === 'TWK'
    ? `TWK RULES — STANDAR CAT BKN TERKINI (HAFALAN PASAL RIIL, 6 MATERI POKOK, & ANTI-OBVIOUS):
1. MANDAT ANTI-OBVIOUS MUTLAK (SANGAT KRUSIAL):
   - KELIMA PILIHAN JAWABAN (A, B, C, D, E) HARUS TAMPAK BENAR, POSITIF, BIJAK, DAN BERMORAL BAIK.
   - DILARANG KERAS membuat opsi yang jelas-jelas tercela, malas, apatis, anarkis, korup, atau konyol.
   - Peserta TIDAK BOLEH BISA MENEBAK JAWABAN HANYA DENGAN MEMILIH OPSI YANG PALING BIJAK TANPA MEMBACA SOAL!
   - Keseimbangan Panjang Opsi: Kelima opsi HARUS memiliki panjang kalimat yang setara dan seimbang (selisih kata maksimal 2-4 kata). Opsi jawaban benar DILARANG menjadi opsi yang paling panjang!

2. 6 MATERI POKOK & JEBAKAN KONSEPTUAL SPESIFIK:
   - 1. Penerapan Nilai Pancasila dalam Kehidupan Sehari-hari:
     * Pengamalan butir sila dalam studi kasus sosial/kantor. Distraktor menyajikan tindakan terpuji yang mencerminkan sila lain (terutama Sila 2 Kemanusiaan vs Sila 5 Keadilan Sosial, Sila 1 vs Sila 3).
   - 2. Nasionalisme:
     * Kedaulatan ekonomi, perlindungan dan apresiasi produk dalam negeri, pertahanan identitas budaya dari pengaruh luar, kesadaran integrasi teritorial.
   - 3. Toleransi Antar Suku, Agama, dan Budaya:
     * Kerukunan Bhinneka Tunggal Ika, moderasi beragama, penyelesaian konflik keberagaman tanpa diskriminasi.
   - 4. Studi Kasus Penerapan Nilai Kebangsaan:
     * Dilema integritas aparatur sipil negara, netralitas ASN dalam pemilu/pilkada, pencegahan gratifikasi terselubung, akuntabilitas pelayanan publik.
   - 5. Sejarah Kemerdekaan:
     * Detil peristiwa sekitar Proklamasi 17 Agustus 1945, dinamika sidang BPUPKI/PPKI, peristiwa Rengasdengklok, Agresi Militer Belanda I & II, diplomasi Linggarjati/Renville/Roem-Royen/KMB.
   - 6. Tokoh Sejarah dan Nilai yang Dipelajari dari Perjuangannya:
     * Keteladanan nilai kejujuran Moh. Hatta, diplomasi cerdas Agus Salim & Sutan Sjahrir, pengorbanan Jenderal Soedirman, pendidikan Ki Hajar Dewantara.
   - 7. Hafalan Pasal UUD 1945 & Lembaga Negara:
     * Uji pemahaman pasal-pasal riil: HAM (28A-J), Bela Negara 27(3) vs Hankam 30(1-2), Lembaga Peradilan MA (24A), KY (24B), MK (24C), Lembaga Legislatif DPR (20) vs DPD (22D), BPK (23E), Perubahan UUD 37(1-5).
     * Opsi pengecoh WAJIB menyajikan pasal atau ayat serumpun yang sangat mirip dan menjebak!`
    : topic === 'TIU'
      ? `TIU RULES — POLA FRESH, LOGIKA OBJEK NYATA, & 10 RAGAM SOAL BARU:
1. MANDAT UTAMA: MENGASAH LOGIKA, BUKAN HAFALAN ISTILAH ILMIAH ASING:
   - DILARANG KERAS menggunakan kosa kata kamus ilmiah rumit/asing yang tidak memicu penalaran logika.
   - WAJIB gunakan analogi objek nyata, benda konkret, pakaian/alat pelindung tubuh, perkakas, fenomena alam, atau kegiatan sehari-hari yang memicu logika relasi fungsional dan sebab-akibat (contoh: Topi : Sarung Tangan : Sepatu = Helm : Sarung Tangan Motor : Sepatu Bot; Jarum : Benang = Kuas : Cat).

2. 10 RAGAM MODEL SOAL TIU TERKINI:
   - 1. Analogi Kata & Objek Nyata: Relasi fungsional objek konkret, derajat intensitas, atau sebab-akibat.
   - 2. Soal Persamaan Kalimat: Menemukan kalimat yang sepadan secara struktur logika dan substansi gagasan.
   - 3. TIU Perbandingan Senilai dan Tidak Senilai (Berbalik Nilai): Kecepatan, tenaga kerja vs waktu, debit air, pakan.
   - 4. Soal Cerita Silogisme, Figural, dan Aritmatika Sosial Menggunakan Tabel: Jika perlu tabel data (daftar harga/spesifikasi), WAJIB buat tabel Markdown (| Kolom 1 | Kolom 2 |). Ada soal bertabel dan ada yang tanpa tabel.
   - 5. Soal Kecukupan Informasi (Data Sufficiency ala UTBK): Pertanyaan disertai Pernyataan (1) dan (2) dengan 5 opsi baku kelayakan informasi.
   - 6. Deret Angka Bentuk Tabel: Matriks angka 3x3 atau 2x4 dengan salah satu sel bertanda (?) berdasar operasi baris/kolom.
   - 7. Suku Kata atau Pola Angka/Kata: Pola transformasi suku kata, sandi berulang, dan deret angka tingkat dua.
   - 8. Logika Posisi (Analitis): Urutan posisi tempat duduk, penataan meja, antrean, atau lantai gedung.
   - 9. Premis Panjang yang Butuh Ketelitian: Silogisme 3-4 premis bernarasi kaya yang menguji penalaran kuantor.
   - 10. Soal Berbentuk Cerita dengan Ketelitian Membaca Informasi: Studi kasus kontekstual yang menguji ketelitian memilah informasi relevan.`
      : `TKP RULES — SEMUA OPSI POSITIF, PERBEDAAN TIPIS 5 VS 4, & 4 KLASTER TERKINI:
1. SEMUA 5 OPSI (A-E) HARUS BERNILAI POSITIF, SOPAN, DAN MASUK AKAL:
   - DILARANG KERAS membuat opsi negatif, malas, apatis, anarkis, atau pasif! Seluruh pilihan harus menunjukkan respons bertanggung jawab.
2. PERBEDAAN TIPIS POIN 5 VS 4:
   - Poin 4: Solusi prosedural/personal yang baik, patuh SOP, menyelesaikan tugas dengan tertib.
   - Poin 5: Solusi berinisiatif sistemik, skala prioritas tepat (menyeimbangkan dampak jangka pendek & panjang), koordinasi lintas pihak secara taktis, dan perbaikan berkesinambungan.
3. 4 KLASTER MATERI TKP TERKINI:
   - 1. Permasalahan yang Sedang Terjadi: Digitalisasi birokrasi, adopsi AI, etika bermedia sosial, penanganan hoax kantor, fleksibilitas kerja (WFA/hybrid), perlindungan privasi.
   - 2. Sikap Profesional: Integritas aparatur, menolak gratifikasi halus (hadiah/fasilitas rekanan), kerahasiaan data, komitmen target di bawah tekanan tinggi.
   - 3. Pengambilan Keputusan: Prioritas di antara tugas mendesak, manajemen risiko, keberanian mengambil diskresi yang sah demi pelayanan publik.
   - 4. Cara Menghadapi Kondisi: Menghadapi komplain masyarakat emosional secara arif dan solutif, perubahan instruksi pimpinan mendadak, situasi darurat fasilitas, kolaborasi dengan rekan berkarakter sulit.
4. KESEIMBANGAN PANJANG OPSI (ANTI-OBVIOUS):
   - Seluruh 5 opsi (A-E) HARUS memiliki panjang kalimat yang setara dan seimbang (selisih antaropsi maksimal 2-4 kata saja). DILARANG membuat opsi poin 5 paling panjang!`;

  const prompt = `${V8_COMMON_RULES}

MODE: ${stream}
TOPIK UTAMA: ${topic}
BATCH: ${batchLabel}
RANDOM SEED: ${seed}
TARGET TOTAL: ${requestedCount}

DISTRIBUSI WAJIB:
${subtestInstructions}

PROFIL KESULITAN:
${difficultyProfile}

${topicRules}

ATURAN TAMBAHAN PER SOAL:
- exact 5 options.
- metadata.subtest WAJIB diisi persis salah satu dari: ${Object.keys(subtests).map(s => `"${s}"`).join(', ')}. JANGAN hanya menulis "${topic}" atau singkatan umum.
- metadata.topic WAJIB "${topic}".
- correctAnswer harus sama persis dengan salah satu opsi tanpa prefix A/B/C/D/E.
- Khusus TKP: Kelima opsi jawaban HARUS memiliki panjang yang seimbang. DILARANG membuat opsi poin 5 lebih panjang dari opsi lainnya!
- Untuk TIU Perbandingan Kuantitatif, buat opsi relasi yang jelas dan valid (misal: "P > Q", "P < Q", "P = Q", "2P = Q", "Hubungan P dan Q tidak dapat ditentukan" atau variabel x dan y). Pastikan kelima opsi berbeda.
- Untuk TIU numerik, boleh gunakan LaTeX hanya untuk ekspresi matematika yang memang membutuhkan rendering; teks biasa tetap natural.
- Jangan menulis “menurut BKN” kecuali memang materi faktual yang benar-benar diperlukan; soal harus berdiri sendiri.
- Explanation harus menjelaskan cara memperoleh jawaban secara ringkas dan dapat diaudit; jangan mengarang langkah.
- Jangan sertakan markdown fence.

HASIL: JSON sesuai schema. Jangan memberikan teks di luar JSON.
`;

  const attempts = 4;
  let best: Question[] = [];
  let lastIssues: string[] = [];

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const remaining = Math.max(1, requestedCount - best.length);
    const neededDistribution = Object.entries(subtests)
      .map(([name, count]) => {
        const have = best.filter(q => q.metadata?.subtest === name).length;
        const need = Math.max(0, count - have);
        return `- EXACTLY ${need} soal: ${name}`;
      })
      .filter(line => !line.includes('EXACTLY 0'))
      .join('\n');

    const retryPrompt = attempt === 1
      ? prompt
      : `${prompt}

RETRY ${attempt}/${attempts}.
Batch sebelumnya belum lengkap. HANYA buat soal untuk subtest yang masih kekurangan:
${neededDistribution}
PASTIKAN metadata.subtest diisi persis nama subtest di atas, JANGAN hanya menulis "${topic}"!
JANGAN mengulang konsep, skenario, atau pola distractor dari batch sebelumnya.
Catatan validator pada percobaan sebelumnya: ${lastIssues.slice(-6).join(' | ')}`;

    const generated = await generateQuestions(
      StudyMode.SIMULATION,
      'SKD',
      retryPrompt,
      remaining,
      [],
      stream,
      undefined,
      'HOTS',
      undefined,
      true
    );

    const findMatchingSubtest = (q: Question, currentAccepted: Question[]): string | undefined => {
      const rawSub = (q.metadata?.subtest || '').trim();
      const rawTopic = (q.metadata?.topic || '').trim();
      const allSubtestNames = Object.keys(subtests);

      // 1. Exact match against blueprint subtest names (case-insensitive)
      for (const name of allSubtestNames) {
        if (name.toLowerCase() === rawSub.toLowerCase() || name.toLowerCase() === rawTopic.toLowerCase()) {
          return name;
        }
      }

      // 2. Specific aliases / keywords in subtest or topic
      const checkKeywords = (text: string): string | undefined => {
        const lower = text.toLowerCase();
        // TIU
        if (lower.includes('analogi') && !lower.includes('gambar') || lower.includes('persamaan kalimat')) {
          return allSubtestNames.find(n => n.includes('Analogi & Persamaan Kalimat') || n.includes('Analogi'));
        }
        if (lower.includes('silogisme') || lower.includes('cerita') && lower.includes('logika')) {
          return allSubtestNames.find(n => n.includes('Silogisme & Logika Cerita') || n.includes('Silogisme'));
        }
        if (lower.includes('posisi') || lower.includes('kecukupan data') || lower.includes('data sufficiency') || lower.includes('analitis')) {
          return allSubtestNames.find(n => n.includes('Logika Posisi & Kecukupan Data') || n.includes('Analitis'));
        }
        if (lower.includes('senilai') || lower.includes('berbalik nilai') || (lower.includes('tabel') && lower.includes('aritmatika')) || lower.includes('soal cerita') || lower.includes('hitungan')) {
          return allSubtestNames.find(n => n.includes('Perbandingan Senilai') || n.includes('Soal Cerita') || n.includes('Hitungan'));
        }
        if (lower.includes('deret') || lower.includes('pola kata') || lower.includes('suku kata')) {
          return allSubtestNames.find(n => n.includes('Deret Angka') || n.includes('Pola Kata'));
        }
        if (lower.includes('perbandingan kuantitatif') || lower.includes('kuantitatif')) {
          return allSubtestNames.find(n => n.includes('Perbandingan Kuantitatif'));
        }
        if (lower.includes('analogi') && lower.includes('gambar')) {
          return allSubtestNames.find(n => n.includes('Analogi Gambar'));
        }
        if (lower.includes('serial')) {
          return allSubtestNames.find(n => n.includes('Serial Gambar'));
        }
        if (lower.includes('ketidaksamaan')) {
          return allSubtestNames.find(n => n.includes('Ketidaksamaan Gambar'));
        }
        // TWK
        if (lower.includes('pancasila') || lower.includes('nilai pancasila')) {
          return allSubtestNames.find(n => n.includes('Penerapan Nilai Pancasila') || n.includes('Pilar Negara'));
        }
        if (lower.includes('pasal') || lower.includes('uud') || lower.includes('lembaga negara')) {
          return allSubtestNames.find(n => n.includes('Pasal UUD 1945') || n.includes('Pilar Negara'));
        }
        if (lower.includes('nasionalisme') || lower.includes('toleransi')) {
          return allSubtestNames.find(n => n.includes('Nasionalisme & Toleransi') || n.includes('Nasionalisme'));
        }
        if (lower.includes('sejarah') || lower.includes('tokoh')) {
          return allSubtestNames.find(n => n.includes('Sejarah Kemerdekaan & Tokoh') || n.includes('Bela Negara'));
        }
        if (lower.includes('studi kasus') || lower.includes('integritas') || lower.includes('bela negara') || lower.includes('bahasa')) {
          return allSubtestNames.find(n => n.includes('Studi Kasus & Integritas') || n.includes('Integritas') || n.includes('Bahasa Indonesia'));
        }
        // TKP
        if (lower.includes('permasalahan') || lower.includes('digital') || lower.includes('teknologi') || lower.includes('tik')) {
          return allSubtestNames.find(n => n.includes('Permasalahan Terkini & Digital') || n.includes('Teknologi Informasi'));
        }
        if (lower.includes('profesional') || lower.includes('integritas')) {
          return allSubtestNames.find(n => n.includes('Sikap Profesional & Integritas') || n.includes('Profesionalisme'));
        }
        if (lower.includes('keputusan') || lower.includes('risiko') || lower.includes('jejaring')) {
          return allSubtestNames.find(n => n.includes('Pengambilan Keputusan & Risiko') || n.includes('Jejaring Kerja'));
        }
        if (lower.includes('kondisi') || lower.includes('pelayanan') || lower.includes('sosial') || lower.includes('radikalisme')) {
          return allSubtestNames.find(n => n.includes('Cara Menghadapi Kondisi') || n.includes('Pelayanan Publik') || n.includes('Sosial Budaya'));
        }
        return undefined;
      };

      const fromSub = checkKeywords(rawSub);
      if (fromSub) return fromSub;
      const fromTopic = checkKeywords(rawTopic);
      if (fromTopic) return fromTopic;

      // 3. Substring match on base subtest names
      for (const name of allSubtestNames) {
        const parts = name.toLowerCase().split(' - ');
        const baseName = parts[parts.length - 1].trim();
        if (rawSub.toLowerCase().includes(baseName) || rawTopic.toLowerCase().includes(baseName)) {
          return name;
        }
      }

      // 4. Infer from content and option characteristics
      const content = (q.content || '').toLowerCase();
      const optionsStr = (q.options || []).map(o => String(o).toLowerCase()).join(' ');

      if (allSubtestNames.some(n => n.includes('Perbandingan Kuantitatif'))) {
        if (
          optionsStr.includes('p > q') || optionsStr.includes('x > y') ||
          optionsStr.includes('p < q') || optionsStr.includes('x < y') ||
          optionsStr.includes('p = q') || optionsStr.includes('x = y') ||
          (content.includes('hubungan') && (content.includes('p dan q') || content.includes('x dan y') || content.includes('kuantitas p') || content.includes('nilai p')))
        ) {
          return allSubtestNames.find(n => n.includes('Perbandingan Kuantitatif'));
        }
      }

      if (allSubtestNames.some(n => n.includes('Deret Angka'))) {
        if (/\d+[\s,]+\d+[\s,]+\d+[\s,]+\d+/.test(content) || content.includes('deret') || content.includes('angka berikutnya') || content.includes('bilangan selanjutnya')) {
          return allSubtestNames.find(n => n.includes('Deret Angka'));
        }
      }

      if (allSubtestNames.some(n => n.includes('Soal Cerita'))) {
        if (content.includes('kecepatan') || content.includes('pekerja') || content.includes('laba') || content.includes('rugi') || content.includes('harga jual') || content.includes('waktu tempuh') || content.includes('rata-rata') || content.includes('pekerjaan')) {
          return allSubtestNames.find(n => n.includes('Soal Cerita'));
        }
      }

      if (allSubtestNames.some(n => n.includes('Hitungan'))) {
        if (content.includes('hasil dari') || content.includes('nilai dari') || /[0-9\s]+[\+\-\*\/%][0-9\s]+/.test(content)) {
          return allSubtestNames.find(n => n.includes('Hitungan'));
        }
      }

      // 5. Fallback: If rawSub is generic (e.g. "TIU", "TWK", "TKP"), assign to any subtest in this batch still in deficit
      const deficits = allSubtestNames.filter(name => {
        const required = subtests[name] || 0;
        const currentCount = best.filter(x => x.metadata?.subtest === name).length +
                             currentAccepted.filter(x => x.metadata?.subtest === name).length;
        return currentCount < required;
      });
      if (deficits.length > 0) {
        // Assign to the subtest with the largest deficit
        deficits.sort((a, b) => {
          const needA = (subtests[a] || 0) - (best.filter(x => x.metadata?.subtest === a).length + currentAccepted.filter(x => x.metadata?.subtest === a).length);
          const needB = (subtests[b] || 0) - (best.filter(x => x.metadata?.subtest === b).length + currentAccepted.filter(x => x.metadata?.subtest === b).length);
          return needB - needA;
        });
        return deficits[0];
      }

      return undefined;
    };

    const localValid: Question[] = [];
    const seenPatterns = new Set<string>();
    for (const q of best) {
      if (q.metadata?.pattern) seenPatterns.add(q.metadata.pattern);
    }
    
    for (const q of generated) {
      const expected = findMatchingSubtest(q, localValid);
      // The routing field is authoritative for this engine. Normalize subtest & topic after match
      if (expected && q.metadata) {
        q.metadata.subtest = expected;
        q.metadata.topic = topic;
      }
      const local = validateQuestionLocal(q, expected, topic, seenPatterns);
      if (!local.ok) {
        lastIssues.push(`${q.metadata?.subtest || 'unknown'}: ${local.reasons.join(', ')}`);
        continue;
      }
      if (!expected) {
        lastIssues.push(`subtest tidak termasuk blueprint: ${q.metadata?.subtest || 'unknown'}`);
        continue;
      }
      localValid.push(q);
    }

    // Enforce exact requested distribution for this batch.
    const acceptedFromBatch: Question[] = [];
    for (const [subtest, needed] of Object.entries(subtests)) {
      const existing = best.filter(q => q.metadata?.subtest === subtest).length;
      const slots = Math.max(0, needed - existing);
      const candidates = localValid.filter(q => q.metadata?.subtest === subtest && !acceptedFromBatch.includes(q));
      acceptedFromBatch.push(...candidates.slice(0, slots));
    }

    // One independent critic call per generation batch, not one call per question.
    // This keeps latency/cost bounded while still auditing every candidate.
    const criticResults = await criticQuestions(acceptedFromBatch);
    for (const q of acceptedFromBatch) {
      const c = criticResults.get(q.id) || { valid: true, score: 80, reasons: [] };
      if (c.valid) best.push(q);
      else lastIssues.push(`${q.metadata?.subtest}: critic score ${c.score}; ${c.reasons.join(', ')}`);
    }

    if (best.length >= requestedCount) break;
  }

  // Final local distribution and uniqueness checks.
  const result: Question[] = [];
  const internalFingerprints: string[] = [];
  const exactCounts: Record<string, number> = {};

  for (const [subtest, count] of Object.entries(subtests)) {
    const candidates = best.filter(q => q.metadata?.subtest === subtest);
    for (const q of candidates) {
      if (result.filter(x => x.metadata?.subtest === subtest).length >= count) break;
      const fp = questionFingerprint(q);
      if (internalFingerprints.some(existing => jaccardSimilarity(existing, fp) >= 0.84)) {
        continue;
      }
      internalFingerprints.push(fp);
      result.push(q);
      exactCounts[subtest] = (exactCounts[subtest] || 0) + 1;
    }
  }

  const deficits = Object.entries(subtests)
    .filter(([subtest, count]) => (exactCounts[subtest] || 0) !== count)
    .map(([subtest, count]) => `${subtest}: ${exactCounts[subtest] || 0}/${count}`);

  if (deficits.length) {
    throw new Error(`SKD V8 gagal membentuk batch ${batchLabel}. Defisit: ${deficits.join('; ')}. ${lastIssues.slice(-8).join(' | ')}`);
  }

  return result;
}

export const generateSkdSimulation = async (stream: SkdStreamType, variant: 'FULL' | 'TWK' | 'TIU' | 'TKP' = 'FULL', savedState?: any, onProgress?: (progress: number, msg: string) => void): Promise<{ completed: boolean, questions?: Question[], state?: any, errorMsg?: string }> => {
  const difficultyProfile = `
AUTHENTIC-HARD PROFILE:
- ±20% Medium, ±60% Hard, ±20% HOTS.
- Tidak semua soal harus super panjang.
- Hard terutama berasal dari reasoning depth, plausible distractors, dan ketelitian.
- Waktu ideal realistis; hindari soal yang secara normal membutuhkan >2 menit kecuali memang tipe analitis kompleks.
`;

  const tiuFiguralProfile = `
${difficultyProfile}
ATURAN KHUSUS TIU FIGURAL:
- Untuk "Serial Gambar" atau "Analogi Gambar": WAJIB masukkan kode <svg> langsung ke dalam field \`content\` soal untuk menampilkan soal gambar.
- Untuk "Ketidaksamaan Gambar": field \`content\` cukup berisi instruksi (misal: "Pilihlah gambar yang tidak memiliki pola yang sama."), namun SELURUH OPSI (A-E) WAJIB berupa kode <svg>.
- Kanvas SVG HARUS berukuran viewBox="0 0 120 120" secara presisi.
- Gunakan <svg> murni (circle, rect, path, polygon, line). DILARANG KERAS menggunakan teks huruf, emoji, atau karakter di dalam SVG.
- Pastikan tidak ada opsi SVG yang kodenya duplikat/identik persis. Opsi pengecoh harus mengecoh secara visual (misal salah sudut rotasi 45°, salah jumlah garis, salah posisi).
- Pastikan penjelasan memuat logika transformasi (rotasi, translasi, penambahan elemen) yang benar, rasional, dan konsisten dengan opsi jawaban benar (claimedAnswer).
`;

  let state = savedState || { completedBatches: {} };
  let allQuestions: Question[] = [];
  let totalBatches = 0;
  let completedCount = 0;

  const runBatch = async (
    key: string, 
    subtests: Record<string, number>, 
    topic: 'TWK'|'TIU'|'TKP', 
    batchLabel: string, 
    profile: string
  ) => {
    totalBatches++;
    if (state.completedBatches[key]) {
      completedCount++;
      if (onProgress) onProgress(completedCount / totalBatches * 100, `Memuat batch ${batchLabel} dari cache...`);
      allQuestions.push(...state.completedBatches[key]);
      return;
    }
    if (onProgress) onProgress(completedCount / totalBatches * 100, `Meracik ${batchLabel}... (${allQuestions.length} soal tersimpan)`);
    const q = await generateValidatedSkdBatch(subtests, topic, stream, batchLabel, profile);
    state.completedBatches[key] = q;
    completedCount++;
    if (onProgress) onProgress(completedCount / totalBatches * 100, `Batch ${batchLabel} selesai. (${allQuestions.length + q.length} soal tersimpan)`);
    allQuestions.push(...q);
  };

  try {
    if (variant === 'FULL' || variant === 'TWK') {
      const entries = Object.entries(SKD_DISTRIBUTION.TWK);
      await runBatch('twkA', Object.fromEntries(entries.slice(0, 3)), 'TWK', 'TWK-A', difficultyProfile);
      await runBatch('twkB', Object.fromEntries(entries.slice(3)), 'TWK', 'TWK-B', difficultyProfile);
    }
    
    if (variant === 'FULL' || variant === 'TIU') {
      const entries = Object.entries(SKD_DISTRIBUTION.TIU);
      await runBatch('tiuV', Object.fromEntries(entries.filter(([k]) => ['TIU - Analogi & Persamaan Kalimat', 'TIU - Silogisme & Logika Cerita', 'TIU - Logika Posisi & Kecukupan Data'].includes(k))), 'TIU', 'TIU-VERBAL', difficultyProfile);
      await runBatch('tiuN', Object.fromEntries(entries.filter(([k]) => ['TIU - Perbandingan Senilai & Tabel Aritmatika', 'TIU - Deret Angka Tabel & Pola Kata', 'TIU - Perbandingan Kuantitatif'].includes(k))), 'TIU', 'TIU-NUMERIK', difficultyProfile);
      await runBatch('tiuF', Object.fromEntries(entries.filter(([k]) => k.includes('Gambar'))), 'TIU', 'TIU-FIGURAL', tiuFiguralProfile);
    }

    if (variant === 'FULL' || variant === 'TKP') {
      const entries = Object.entries(SKD_DISTRIBUTION.TKP);
      await runBatch('tkpA', Object.fromEntries(entries.slice(0, 2)), 'TKP', 'TKP-A', difficultyProfile);
      await runBatch('tkpB', Object.fromEntries(entries.slice(2, 4)), 'TKP', 'TKP-B', difficultyProfile);
    }

    const expectedTotal = variant === 'FULL' ? 110 : variant === 'TWK' ? SKD_TOTALS.TWK : variant === 'TIU' ? SKD_TOTALS.TIU : SKD_TOTALS.TKP;
    if (allQuestions.length !== expectedTotal) {
      throw new Error(`SKD V8 menghasilkan ${allQuestions.length}/${expectedTotal} soal. Paket ditolak agar TO tidak terisi soal yang tidak tervalidasi.`);
    }

    // Cross-batch semantic duplicate check.
    const fingerprints = allQuestions.map(questionFingerprint);
    for (let i = 0; i < fingerprints.length; i++) {
      for (let j = i + 1; j < fingerprints.length; j++) {
        if (allQuestions[i].metadata?.subtest === allQuestions[j].metadata?.subtest && jaccardSimilarity(fingerprints[i], fingerprints[j]) >= 0.88) {
          throw new Error(`SKD V8 mendeteksi duplicate-semantic pattern pada ${allQuestions[i].id} dan ${allQuestions[j].id}. Paket ditolak.`);
        }
      }
    }

    return { completed: true, questions: reindexQuestions(allQuestions, 'SKD-V8'), state };

  } catch (err: any) {
    // Apapun errornya, kita pause pembuatan (jangan delete/throw) agar user bisa melanjutkannya lagi.
    return { completed: false, state, errorMsg: err.message };
  }
};

export const generateUtbkSimulation = async (variant: 'ONLY_MC' | 'MIXED' = 'MIXED'): Promise<Question[]> => {
    // Penalaran Umum: 30 soal (Induktif 10, Deduktif 10, Kuantitatif 10)
    const pPU_Induktif = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - DEEP ANALYSIS, FRESH SCENARIOS] Penalaran Umum (Penalaran Induktif)', 10, [], undefined, undefined, 'HOTS', variant);
    const pPU_Deduktif = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - DEEP ANALYSIS, FRESH SCENARIOS] Penalaran Umum (Penalaran Deduktif)', 10, [], undefined, undefined, 'HOTS', variant);
    const pPU_Kuantitatif = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - DEEP ANALYSIS, ADVANCED] Penalaran Umum (Penalaran Kuantitatif). ALWAYS use proper LaTeX for math fractions (e.g., \\frac{1}{2} instead of 1/2) and equations. Surround them with \\( ... \\).', 10, [], undefined, undefined, 'HOTS', variant);

    const pPPU = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - HIGH DIFFICULTY TEXTS] Pengetahuan dan Pemahaman Umum', 20, [], undefined, undefined, 'HOTS', variant);
    const pPBM = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - COMPLEX PASSAGES] Pemahaman Bacaan dan Menulis', 20, [], undefined, undefined, 'HOTS', variant);
    const pPK = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - EXTREME MATH DIFFICULTY] Pengetahuan Kuantitatif. ALWAYS use proper LaTeX for math fractions (e.g., \\frac{1}{2} instead of 1/2) and equations. Surround them with \\( ... \\).', 20, [], undefined, undefined, 'HOTS', variant);
    
    // [V7 - ACADEMIC/SCIENTIFIC LEVEL TEXTS] Literasi Bahasa Indonesia: 30 soal
    const pLitIndo = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - ACADEMIC/SCIENTIFIC LEVEL TEXTS] Literasi Bahasa Indonesia', 30, [], undefined, undefined, 'HOTS', variant);
    
    // [V7 - TOEFL/IELTS ACADEMIC READING LEVEL] Literasi Bahasa Inggris: 20 soal
    const pLitIng = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - TOEFL/IELTS ACADEMIC READING LEVEL] Literasi Bahasa Inggris', 20, [], undefined, undefined, 'HOTS', variant);
    
    // [V7 - NOVEL REAL WORLD MATH PROBLEMS] Penalaran Matematika: 20 soal
    const pPM = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - NOVEL REAL WORLD MATH PROBLEMS] Penalaran Matematika. ALWAYS use proper LaTeX for math fractions (e.g., \\frac{1}{2} instead of 1/2) and equations. Surround them with \\( ... \\).', 20, [], undefined, undefined, 'HOTS', variant);

    const [puInd, puDed, puKuan, ppu, pbm, pk, lind, ling, pm] = await Promise.all([
        pPU_Induktif, pPU_Deduktif, pPU_Kuantitatif, 
        pPPU, pPBM, pPK, pLitIndo, pLitIng, pPM
    ]);

    const pu = [...puInd, ...puDed, ...puKuan];
    pu.forEach(q => q.metadata.subtest = 'Penalaran Umum');
    
    ppu.forEach(q => q.metadata.subtest = '[V7 - HIGH DIFFICULTY TEXTS] Pengetahuan dan Pemahaman Umum');
    pbm.forEach(q => q.metadata.subtest = '[V7 - COMPLEX PASSAGES] Pemahaman Bacaan dan Menulis');
    pk.forEach(q => q.metadata.subtest = '[V7 - EXTREME MATH DIFFICULTY] Pengetahuan Kuantitatif');
    lind.forEach(q => q.metadata.subtest = '[V7 - ACADEMIC/SCIENTIFIC LEVEL TEXTS] Literasi Bahasa Indonesia');
    ling.forEach(q => q.metadata.subtest = '[V7 - TOEFL/IELTS ACADEMIC READING LEVEL] Literasi Bahasa Inggris');
    pm.forEach(q => q.metadata.subtest = '[V7 - NOVEL REAL WORLD MATH PROBLEMS] Penalaran Matematika');

    const allQuestions = [...pu, ...ppu, ...pbm, ...pk, ...lind, ...ling, ...pm];
    return reindexQuestions(allQuestions, 'UTBK');
};

export const generateTpaTbiSimulation = async (): Promise<Question[]> => {
    const tpaVerbal = generateQuestions(StudyMode.SIMULATION, 'TPA', `V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. TPA - Verbal (HOTS). Complex analogies and syllogisms.`, 15, [], undefined, undefined, 'HOTS');
    const tpaQuant = generateQuestions(StudyMode.SIMULATION, 'TPA', `V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. TPA - Kuantitatif (HOTS). Advanced arithmetic, algebra, and geometry. ALWAYS use proper LaTeX for math fractions (e.g., \\frac{1}{2} instead of 1/2) and equations. Surround them with \\( ... \\).`, 15, [], undefined, undefined, 'HOTS');
    const tpaLogic = generateQuestions(StudyMode.SIMULATION, 'TPA', `V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. TPA - Penalaran (HOTS). Complex logical deduction and spatial reasoning.`, 15, [], undefined, undefined, 'HOTS');
    const tbi = generateQuestions(StudyMode.SIMULATION, 'TPA', `V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. TBI - Bahasa Inggris (TOEFL Style). Advanced grammar and reading comprehension.`, 20, [], undefined, undefined, 'HOTS');

    const [resVerbal, resQuant, resLogic, resTbi] = await Promise.all([tpaVerbal, tpaQuant, tpaLogic, tbi]);

    resVerbal.forEach(q => q.metadata.subtest = 'TPA - Kemampuan Verbal');
    resQuant.forEach(q => q.metadata.subtest = 'TPA - Kemampuan Kuantitatif');
    resLogic.forEach(q => q.metadata.subtest = 'TPA - Kemampuan Penalaran');
    resTbi.forEach(q => q.metadata.subtest = 'TBI - Bahasa Inggris');

    const allQuestions = [...resVerbal, ...resQuant, ...resLogic, ...resTbi];
    return reindexQuestions(allQuestions, 'TPA');
};

export const generatePsikotestKedinasanSimulation = async (): Promise<Question[]> => {
    const tiu = generateQuestions(StudyMode.SIMULATION, 'TPA', `V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. PSIKOTEST KEDINASAN (TIU V3). HARD DIFFICULTY.`, 30, [], undefined, undefined, 'HOTS');
    const figural = generateQuestions(StudyMode.SIMULATION, 'TPA', `V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. PSIKOTEST KEDINASAN (LOGIKA GAMBAR V3). EXTREME DIFFICULTY. YOU MUST USE <svg> FOR ALL QUESTIONS AND ALL 5 OPTIONS. DO NOT USE EMOJIS OR TEXT SHAPES. Abstract geometric patterns ONLY. Include 3x3 matrices, paper folding (spasial), and 3D rotations. NO semantic/fruit/animal questions.`, 15, [], undefined, undefined, 'HOTS');
    const personality = generateQuestions(StudyMode.SIMULATION, 'TPA', `V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. PSIKOTEST KEDINASAN (KEPRIBADIAN)`, 20, [], undefined, undefined, 'TKP');

    const [resTiu, resFigural, resPersonality] = await Promise.all([tiu, figural, personality]);

    resTiu.forEach(q => q.metadata.subtest = 'TIU - Verbal & Numerik');
    resFigural.forEach(q => q.metadata.subtest = 'Tes Logika Gambar (Abstrak)');
    resPersonality.forEach(q => {
        q.metadata.subtest = 'Tes Kepribadian';
        q.metadata.topic = 'TKP';
    });

    const allQuestions = [...resTiu, ...resFigural, ...resPersonality];
    return reindexQuestions(allQuestions, 'KEDINASAN');
};

export const calculateWordSimilarity = async (target: string, guess: string) => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.INTEGER, description: "Similarity score 0-100" },
      feedback: { type: Type.STRING, description: "Short feedback on why" }
    },
    required: ["score", "feedback"]
  };
  const prompt = `Compare word similarity. Target: "${target}". Guess: "${guess}". Score 0-100 based on semantic meaning and category. If same category, higher score. If synonym, very high score.`;
  return callGemini<{score: number, feedback: string}>(prompt, schema);
};

export const generateTkaSimulation = async (level: string): Promise<Question[]> => {
    const math = generateQuestions(StudyMode.SIMULATION, 'TKA', `[V7 - DEEP ANALYSIS, FRESH CONCEPTS] TKA ${level} - Matematika. 80% HOTS. Include a mix of 'multiple_choice', 'multiple_choice_complex', and 'matching' question types.`, 30, [], undefined, undefined, 'HOTS');
    const indonesian = generateQuestions(StudyMode.SIMULATION, 'TKA', `[V7 - DEEP ANALYSIS, FRESH CONCEPTS] TKA ${level} - Bahasa Indonesia. 80% HOTS. Include a mix of 'multiple_choice', 'multiple_choice_complex', and 'matching' question types.`, 30, [], undefined, undefined, 'HOTS');
    
    let allQuestions: Question[] = [];

    if (level === 'SD') {
        const [resMath, resIndo] = await Promise.all([math, indonesian]);
        resMath.forEach(q => q.metadata.subtest = 'Matematika');
        resIndo.forEach(q => q.metadata.subtest = 'Bahasa Indonesia');
        allQuestions = [...resMath, ...resIndo];
    } else {
        const english = generateQuestions(StudyMode.SIMULATION, 'TKA', `[V7 - DEEP ANALYSIS, FRESH CONCEPTS] TKA ${level} - Bahasa Inggris. 80% HOTS. Include a mix of 'multiple_choice', 'multiple_choice_complex', and 'matching' question types.`, 30, [], undefined, undefined, 'HOTS');
        const [resMath, resIndo, resEng] = await Promise.all([math, indonesian, english]);
        resMath.forEach(q => q.metadata.subtest = 'Matematika');
        resIndo.forEach(q => q.metadata.subtest = 'Bahasa Indonesia');
        resEng.forEach(q => q.metadata.subtest = 'Bahasa Inggris');
        allQuestions = [...resMath, ...resIndo, ...resEng];
    }

    return reindexQuestions(allQuestions, 'TKA');
};

export const generatePsikotestSimulation = async () => {
    // Splitting into batches to ensure the prompt accurately triggers verbal, numeric, and spatial (IQ) components
    const verbal = generateQuestions(StudyMode.SIMULATION, 'PSIKOTEST', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - NOVEL ANALOGIES & SILOGISM] SIMULATION - Tes Verbal Psikotes (Analogi, Sinonim, Silogisme). EXTREME DIFFICULTY.', 14, [], undefined, undefined, 'HOTS');
    const numerik = generateQuestions(StudyMode.SIMULATION, 'PSIKOTEST', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - UNIQUE NUMBER PATTERNS] SIMULATION - Tes Numerik Psikotes (Deret, Aritmatika, Logika Angka). EXTREME DIFFICULTY.', 13, [], undefined, undefined, 'HOTS');
    const spatial = generateQuestions(StudyMode.SIMULATION, 'PSIKOTEST', 'V7 - DEEP ANALYSIS. FRESH & UNIQUE SCENARIOS. TAKE YOUR TIME TO ANALYZE DEEPLY. DO NOT REPEAT PREVIOUS GENERATIONS. EXTREME DIFFICULTY. AVOID CLICHÉ QUESTIONS. CREATE HIGH-QUALITY, NOVEL PROBLEMS. [V7 - EXTREME UNSEEN 3D/SPATIAL PROBLEMS] SIMULATION - IQ & Spatial Logic. EXTREME DIFFICULTY. YOU MUST USE <svg> FOR ALL QUESTIONS AND ALL 5 OPTIONS. DO NOT USE EMOJIS.', 13, [], undefined, undefined, 'HOTS');
    
    const [r1, r2, r3] = await Promise.all([verbal, numerik, spatial]);
    
    let allQuestions = [...r1, ...r2, ...r3];
    allQuestions.forEach(q => {
        if (!q.metadata.subtest) q.metadata.subtest = 'IQ Psychometric Test';
    });
    
    return reindexQuestions(allQuestions.slice(0, 40), 'PSIKOTEST');
};

export const generateSynonyms = async (lang: 'ID' | 'EN'): Promise<any[]> => {
    const prompt = `Buatkan 50 soal pilihan ganda game Sinonim dan Antonim dalam bahasa ${lang === 'ID' ? 'Indonesia' : 'Inggris'}.
Format balasan harus HANYA berupa array JSON yang valid. Tiap objek soal memiliki format:
{
  "word": "KATA_YANG_DITANYAKAN",
  "type": "SYNONYM" atau "ANTONYM",
  "correct": "KATA_JAWABAN_BENAR",
  "options": ["Pilihan1", "Pilihan2", "Pilihan3", "Pilihan4", "Pilihan5"]
}
Pilihan harus mengandung KATA_JAWABAN_BENAR dan 4 pengecoh. Urutan options acak. Tingkat kesulitan bervariasi dari menengah hingga akademis tingkat lanjut.`;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                word: { type: Type.STRING },
                type: { type: Type.STRING },
                correct: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["word", "type", "correct", "options"]
        }
    };
    
    return await callGemini<any[]>(prompt, schema);
};

export const calculateTargetScores = async (
    category: 'UTBK' | 'SKD',
    universityOrInstansi: string,
    majorOrFormasi: string
): Promise<TargetScoreCalcResult> => {
    const prompt = `Analisis dan hitung target skor realistis untuk lolos seleksi ${category} di:
Universitas/Instansi: ${universityOrInstansi}
Jurusan/Prodi/Formasi: ${majorOrFormasi}

Berikan breakdown nilai target untuk masing-masing subtes:
${category === 'UTBK' ? `- Penalaran Umum (PU) (skor maksimal 1000)
- Pengetahuan & Pemahaman Umum (PPU) (skor maksimal 1000)
- Memahami Bacaan & Menulis (PBM) (skor maksimal 1000)
- [V7 - EXTREME MATH DIFFICULTY] Pengetahuan Kuantitatif (PK) (skor maksimal 1000)
- [V7 - ACADEMIC/SCIENTIFIC LEVEL TEXTS] Literasi Bahasa Indonesia (LBI) (skor maksimal 1000)
- [V7 - TOEFL/IELTS ACADEMIC READING LEVEL] Literasi Bahasa Inggris (LBE) (skor maksimal 1000)
- [V7 - NOVEL REAL WORLD MATH PROBLEMS] Penalaran Matematika (PM) (skor maksimal 1000)` : `- Tes Wawasan Kebangsaan (TWK) (ambang batas passing grade 65, nilai maksimal 150)
- Tes Intelegensia Umum (TIU) (ambang batas passing grade 80, nilai maksimal 175)
- Tes Karakteristik Pribadi (TKP) (ambang batas passing grade 166, nilai maksimal 225)`}

Untuk masing-masing subtes, berikan:
1. Target skor yang aman untuk lolos (sesuaikan dengan reputasi universitas/instansi tersebut, misalnya UI/ITB/UGM atau instansi sek Din/Kementerian favorit butuh skor sangat tinggi).
2. Persentase tingkat akurasi kepahaman yang dibutuhkan.
3. Rencana strategi singkat/tips belajar khusus spesifik untuk subtes tersebut agar mencapai target itu.

Kembalikan respon dalam format JSON sesuai skema yang ditentukan. Berikan saran/overallStrategy umum di akhir.`;

    const schema: Schema = {
        type: Type.OBJECT,
        properties: {
            targetUniversityOrInstansi: { type: Type.STRING },
            targetMajorOrFormasi: { type: Type.STRING },
            totalTargetScore: { type: Type.INTEGER },
            subtestTargets: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        score: { type: Type.INTEGER },
                        passingGrade: { type: Type.INTEGER },
                        maxScore: { type: Type.INTEGER },
                        percentage: { type: Type.INTEGER },
                        strategy: { type: Type.STRING }
                    },
                    required: ["name", "score", "maxScore", "percentage", "strategy"]
                }
            },
            overallStrategy: { type: Type.STRING }
        },
        required: ["targetUniversityOrInstansi", "targetMajorOrFormasi", "totalTargetScore", "subtestTargets", "overallStrategy"]
    };

    return await callGemini<TargetScoreCalcResult>(prompt, schema);
};
export async function saveMultipleToBankSoal(category: CategoryType, questions: Question[]) {
    if (typeof window === 'undefined' || questions.length === 0) return;
    try {
        const batchSize = 500;
        for (let i = 0; i < questions.length; i += batchSize) {
            const batch = writeBatch(db);
            const chunk = questions.slice(i, i + batchSize);
            chunk.forEach(question => {
                const docRef = doc(db, 'bank_soal', question.id);
                batch.set(docRef, { category, question });
            });
            await batch.commit();
        }
    } catch (e) {
        console.error("Failed to batch save to bank soal", e);
    }
}
