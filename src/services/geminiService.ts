import { GoogleGenAI, Type, Schema } from "@google/genai";
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

// Initialize API
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper for shuffling options
function shuffleArray<T>(array: T[]): T[] {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
}

const questionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    type: { type: Type.STRING, enum: ["multiple_choice", "short_answer", "long_text", "multiple_choice_complex", "matching"] },
    content: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING } },
    correctAnswer: { type: Type.STRING },
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
    explanation: { type: Type.STRING },
    shortcut: { type: Type.STRING },
    metadata: {
      type: Type.OBJECT,
      properties: {
        difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard", "HOTS"] },
        idealTimeSeconds: { type: Type.INTEGER },
        topic: { type: Type.STRING },
        subtest: { type: Type.STRING },
        trapPattern: { type: Type.STRING },
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
  required: ["id", "type", "content", "correctAnswer", "explanation", "metadata"]
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

async function callGemini<T>(prompt: string, schema?: Schema, imageBase64?: string): Promise<T> {
  const models = ["gemini-3-flash-preview", "gemini-3.5-flash"];
  
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
      const result = await ai.models.generateContent({
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
            console.error(`JSON Parse Error for model ${model}`, e);
            const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
            if (match) {
                return JSON.parse(match[0]);
            }
            return text as unknown as T;
        }
      }
      return text as unknown as T;
    } catch (error: any) {
      console.error(`Gemini API Error with model ${model} (${retries} retries left):`, error);
      
      const isOverloaded = error?.status === 503 || error?.status === 429 || error?.status === 500 ||
                           error?.message?.includes('503') || error?.message?.includes('429') || error?.message?.includes('500') ||
                           error?.message?.includes('high demand') || error?.message?.includes('UNAVAILABLE') ||
                           error?.message?.includes('error code: 6') || error?.message?.includes('xhr error') ||
                           error?.message?.includes('resource exhausted');
      
      if (retries > 1) {
        retries--;
        modelIdx++; // Rotate to the next model in choice
        console.log(`Rotating/Retrying with next model in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; // Exponential backoff
        continue;
      }
      
      throw error;
    }
  }
  throw new Error("Failed to generate content after multiple retries and model rotations.");
}

async function* callGeminiStream(prompt: string, schema?: Schema, imageBase64?: string): AsyncGenerator<any[], void, unknown> {
  const models = ["gemini-3-flash-preview", "gemini-3.5-flash"];
  
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
      const resultStream = await ai.models.generateContentStream({
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
      console.error(`Gemini Streaming API Error with model ${model} (${retries} retries left):`, error);
      
      const isOverloaded = error?.status === 503 || error?.status === 429 || error?.status === 500 ||
                           error?.message?.includes('503') || error?.message?.includes('429') || error?.message?.includes('500') ||
                           error?.message?.includes('high demand') || error?.message?.includes('UNAVAILABLE') ||
                           error?.message?.includes('error code: 6') || error?.message?.includes('xhr error') ||
                           error?.message?.includes('resource exhausted');
      
      if (retries > 1) {
        retries--;
        modelIdx++; // Rotate to the next model
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 1.5; 
        continue;
      }
      throw error;
    }
  }
  throw new Error("Failed to generate stream after multiple retries and model rotations.");
}

function sanitizeQuestion(q: Question): Question {
  if (!q.id) q.id = `q-${Math.random().toString(36).substr(2, 9)}`;

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
          .replace(/\bin\s+line\b/gi, 'inline');
          
      return cleanAndWrapSvg(cleaned);
  };

  if (q.content) q.content = fixTypos(q.content);
  if (q.explanation) q.explanation = fixTypos(q.explanation);
  if (q.correctAnswer) q.correctAnswer = fixTypos(q.correctAnswer);

  if (q.options) {
      q.options = q.options.map(opt => fixTypos(opt));
  }

  if (q.tkpPoints) {
      q.tkpPoints = q.tkpPoints.map(tp => ({
          ...tp,
          option: fixTypos(tp.option)
      }));
  }

  if (q.metadata && q.metadata.matrix && Array.isArray(q.metadata.matrix)) {
      q.metadata.matrix = q.metadata.matrix.map((rowItem: any) => {
          if (Array.isArray(rowItem)) {
              return { row: rowItem.map(item => String(item)) };
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
          // Remove A., B., etc prefixes
          clean = clean.replace(/^[A-Ea-e1-5][\.\)\s]+/, '').trim();
          return clean;
      });

      // Also clean correctAnswer if it has a prefix (e.g. "A. Answer")
      if (q.correctAnswer) {
          q.correctAnswer = q.correctAnswer.replace(/(\\n|\n|\r)/g, ' ').trim();
          q.correctAnswer = q.correctAnswer.replace(/^[A-Ea-e1-5][\.\)\s]+/, '').trim();
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

export const buildQuestionPrompt = (
  mode: StudyMode,
  category: CategoryType,
  context: string | GeneralMaterialInput,
  count: number = 8,
  weakTopics: string[] = [],
  skdStream?: SkdStreamType,
  generalMethod?: GeneralStudyMethod,
  difficultyOverride?: string,
  utbkVariant?: 'ONLY_MC' | 'MIXED'
): { prompt: string, base64Pdf: string | undefined, schema: Schema } => {
  let prompt = "";
  let base64Pdf: string | undefined = undefined;

  
  // V15.0 UPGRADE: MASTER-LEVEL TIU & FIGURAL REASONING
  const shapeInstructions = `
  CRITICAL VISUAL & LOGIC RULES (V15.0 - MASTER):
  - **MANDATORY SVG COMPLETION**:
    - SERIAL (Pola) & ANALOGY: The 'content' field MUST start with an SVG string showing the complete sequence. NEVER leave it as text only.
    - MATRIX (3x3): 'metadata.matrix' MUST be a 3x3 array [row][col] of SVG strings. Cell (2,2) MUST be '?'.
    - KETIDAKSAMAAN (Odd One Out): 'options' MUST be 5 distinct SVG strings. Use generic question text like "Pilihlah gambar yang berbeda dari yang lain." Do NOT explain the difference in the question text.
    - NEVER produce figural items without SVGs in the 'content' or 'matrix' fields.
  
  - **ELITE FIGURAL LOGIC (HIGH DIFFICULTY)**:
    - **XOR Logic**: Overlapping lines between Cell A and B disappear in Cell C.
    - **Composite Transformation**: Combine rotation, scale, and element count change in one step.
    - **Spatial Folding**: Isometric nets that must be mentally folded into a cube.
    - **Perspective**: 3D rotation of objects.

  - **RENDER FIDELITY**:
    - SVGs MUST use viewBox="0 0 100 100".
    - Use high-contrast colors (#6366f1, #f43f5e).
    - Ensure all lines have stroke-width="2" or greater for visibility on mobile.
  `;

  // Removed old shape instructions
  const oldShapeInstructions = "";
  // FORMATTING INSTRUCTIONS
  const formattingInstructions = `
  CRITICAL FORMATTING RULES:
  - **DISTRACTOR QUALITY (Near-Miss Logic)**: For incorrect options (distractors), do NOT use random or easily guessable wrong answers. Construct them logically based on common calculation errors, misread signs, logical traps, or near-misses of the exact correct answer.
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
  - **TOTAL ENCAPSULATION**: Every single number (e.g., $10$, $25\%$, $1/2$) and math expression MUST be wrapped in LaTeX delimiters.
  - **INLINE LATEX PREFERENCE**: Use inline LaTeX (\\\\( ... \\\\)) blended seamlessly into sentences.
  - **NEATNESS**: Using LaTeX for all numbers ensures a consistent, professional, and "natural" academic look.
  - **SYMBOLS**: Replace all unicode math with LaTeX representations (e.g., use \\\\sqrt{2} instead of √2, \\\\neq instead of ≠).
  - **NO PLAIN NUMBERS**: Even simple numbers in text must be LaTeX (e.g., "Membeli $5$ buah apel" instead of "Membeli 5 buah apel").
  `;

  // Removed old instructions
  const oldMathInstructions = "";

  const langInstruction = "CRITICAL: The generated questions MUST BE in Bahasa Indonesia and strictly follow the style, difficulty, and structure of real world past-year SKD/CPNS field report (FR Soal Asli) questions.";

  let schema: Schema = questionsListSchema;

  const isPsikotestKedinasan = (category === 'TPA' && (typeof context === 'string' && (context.includes('Psikotes') || context.includes('Kepribadian') || context.includes('Logika Gambar'))));

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
          COMPLEXITY: Extreme. Use multiple rules per pattern (e.g., shape change + rotation + shading).
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
      
      const isTwk = (typeof context === 'string' && context.toUpperCase().includes('TWK')) || (category === 'SKD' && difficultyOverride === 'TWK');
      const isTiu = (typeof context === 'string' && context.toUpperCase().includes('TIU')) || (category === 'SKD' && difficultyOverride === 'TIU');
      const isTkp = (typeof context === 'string' && context.toUpperCase().includes('TKP')) || (category === 'SKD' && difficultyOverride === 'TKP');

      if (isTwk) {
           difficultyContext = `CONTEXT: SKD TWK (Tes Wawasan Kebangsaan) - EXTREME HOTS DIFFICULTY (MASTER LEVEL).
           
           THEME & TOPICS (STRICTLY FOLLOW THESE):
           - Pancasila: Ideologi, sejarah perumusan, dan butir-butir pengamalannya.
           - UUD 1945: Pembukaan, pasal-pasal, dan tata urutan peraturan perundang-undangan (Sangat mendalam).
           - Bhinneka Tunggal Ika: Toleransi, keragaman suku, agama, ras, dan golongan dalam konteks sejarah dan konstitusi.
           - NKRI: Sistem tata negara, sejarah perjuangan bangsa dari zaman kerajaan hingga kemerdekaan, dan peran mendalam tokoh nasional.
           - Nasionalisme & Bela Negara: Cinta tanah air, rela berkorban, integrasi nasional, dan implementasi bela negara di era modern.
           - Bahasa Indonesia: Tata bahasa baku (EYD/PUEBI), ejaan, pemahaman bacaan tingkat tinggi, dan penarikan kesimpulan teks.

           CRITICAL TWK RULES (ELITE DIFFICULTY & SANGAT MENGECOH):
           1. **NO IMAGES/SVG**: DILARANG KERAS menghasilkan gambar, SVG, atau visual apa pun. Soal TWK HARUS 100% TEKS.
           2. FORMAT: Gunakan narasi/studi kasus yang kompleks. Analisis contoh soal SKD tahun-tahun sebelumnya (Field Report) dan buat variasi yang LEBIH SULIT (HOTS Tingkat Tinggi).
           3. JAWABAN: Harus ada 1 Benar (nilai 5) dan 4 Salah (nilai 0). Opsi jawaban harus menguji pemahaman KONSEPTUAL dan ANALITIS, bukan sekadar hafalan.
           4. DISTRACTORS: Jebakan harus sangat halus, seringkali menggunakan istilah yang mirip atau peristiwa sejarah yang berdekatan waktunya.
           5. Language: Gunakan Bahasa Indonesia formal/akademik yang sangat rapi.`;
      } else if (isTiu) {
           difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - EXTREME HOTS (ELITE LEVEL).
           
           THEME & TOPICS (STRICTLY FOLLOW THESE):
           - Kemampuan Verbal: Analogi (padanan kata yang ambigu), silogisme (penarikan kesimpulan kompleks), dan analitis (posisi/urutan rumit).
           - Kemampuan Numerik: Berhitung cepat, deret angka (pola bertingkat/interleaved), perbandingan kuantitatif, dan soal cerita matematika analisis tinggi.
           - Kemampuan Figural: Analogi gambar, ketidaksamaan gambar, dan serial gambar (Gunakan SVG yang kompleks).

           CRITICAL TIU RULES (ELITE DIFFICULTY):
           1. VERBAL ANALOGY: Gunakan analogi bertingkat dengan kosa kata KBBI level tinggi yang membingungkan. Wrap all concepts in LaTeX if they involve numbers or symbols.
           2. NUMERICAL SERIES: Gunakan pola bertingkat yang tidak masuk akal tanpa penalaran tajam. EVERY NUMBER MUST BE IN LaTeX ($ ... $).
           3. LOGICAL REASONING: Gunakan silogisme dengan 3+ premis dan kuantor ganda dengan complex structure.
           4. FIGURAL: (Already defined in Master Figural instructions). Only TIU is allowed to have visual SVG logic.
           5. MATH: Probability, Statistics, and Geometry must require multiple steps. EVERY CALCULATION IN LaTeX. Opsi yang salah harus berisi jebakan perhitungan parsial.
           6. ODD ONE OUT (Ketidaksamaan): Just ask "Pilihlah gambar yang tidak sesuai." Do NOT explain the pattern.
           `;
      } else if (isTkp) {
           difficultyContext = `CONTEXT: SKD TKP (Tes Karakteristik Pribadi) - EXTREME AMBIGUITY (SANGAT MENGECOH).
           
           THEME & TOPICS (STRICTLY FOLLOW THESE):
           - Pelayanan Publik: Melayani masyarakat dengan ramah, profesional, dan solutif di situasi tersulit.
           - Jejaring Kerja: Beradaptasi, bekerja sama, membangun kemitraan, dan resolusi konflik tim.
           - Sosial Budaya: Toleransi, menghargai perbedaan, dan integritas di tengah keberagaman.
           - Teknologi Informasi (TIK): Adaptasi dan pemanfaatan teknologi informasi untuk efisiensi kerja.
           - Profesionalisme: Disiplin, tanggung jawab, integritas, dan performa kerja di bawah tekanan.
           - Anti Radikalisme: Pemahaman dan sikap tegas terhadap ideologi yang bertentangan dengan Pancasila.

           CRITICAL TKP RULES:
           1. DIFFICULTY: Options must be VERY SIMILAR in length, tone, and logic. Avoid obvious outliers. Opsi poin 5 dan 4 harus LUAR BIASA sulit dibedakan, keduanya memuat solusi ideal dan sangat baik, hanya terpisah oleh prioritas inisiatif jangka panjang, SOP, atau penyelesaian mendasarnya.
           2. DISTRACTORS: Jawaban bernilai 1 atau 2 TIDAK BOLEH terlihat buruk/jahat, namun terlihat wajar dalam perspektif normatif biasa tapi kurang memenuhi kriteria profesionalisme tertinggi ASN.
           3. NO LENGTH BIAS: Do not make the correct answer significantly longer than others.
           4. AMBIGUITY: The difference between 5 points and 4 points should be subtle (e.g., direct action vs. procedural action).
           5. VISUALS: DO NOT use images, icons, or SVG. Use professional text only.
           6. TOPICS: Focus strictly on the themes above. Focuskan ke dilema kerja berat.`;
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
             
             difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - FULL MIX.
             
             DISTRIBUTION (Total ${count} questions):
             - VERBAL: ${verbalCount} questions (Analogi, Silogisme, Analitis)
             - NUMERIK: ${numericCount} questions (Berhitung, Deret, Perbandingan, Soal Cerita)
             - FIGURAL: ${figuralCount} questions (Analogi, Ketidaksamaan, Serial, Matriks, Spasial)
             
             CRITICAL RULES:
             1. **FIGURAL (VISUAL LOGIC)**: 
                - **CANVAS-BASED SVG**: Use the robust drawing utility coordinate paths.
                - **Ketidaksamaan (Odd One Out)**: Differences must be subtle. MUST use SVG.
                - **Serial/Analogi**: Combine 2-3 transformations.
             2. **NUMERIK**: Use Unicode math symbols and LaTeX for complex formulas.
             `;
        } else if (category === 'SKD' && typeof context === 'string' && (context.toUpperCase().includes('VERBAL') || context.toUpperCase().includes('ANALOGI') || context.toUpperCase().includes('SILOGISME') || context.toUpperCase().includes('ANALITIS'))) {
           difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - VERBAL.
           
           CRITICAL RULES FOR VERBAL (EXTREME DIFFICULTY SANGAT SULIT & SANGAT MENGECOH):
           1. COMPLEXITY: Questions must be EXTREMELY HARD, tricky, and mimic the official test style. Distractors must be highly deceptive.
           2. ANALOGY: Use double-gap format (A : ... = ... : D) or 3-variable format (A : B : C = P : Q : R). You MUST base analogies on absolute, non-debatable logical frameworks (Relationship Type Constraint) but use advanced KBBI vocabulary to obscure the logic.
           3. SYLLOGISM (SILOGISME): 
              - MUST explicitly label premises (Premis 1, Premis 2, etc.) in the question text.
              - Use 3-5 complex premises with layered quantifiers (Semua, Sebagian, Beberapa, Tidak ada) and negations (Bukan, Tidak).
              - Correct logic must be rigorous. Incorrect options must represent common logical fallacies.
           4. ANALYTICAL (ANALITIS):
              - Create ordering/ranking/matching scenarios.
              - Use at least 6-8 variables with complex overlapping constraints.
              - Clues must be highly interconnected and deceptive.

           FEW-SHOT EXAMPLES (Follow this style):
           
           Type: Analogi (Double Gap)
           Q: API : … = … : TERBASAHI
           A. PANAS – CAIRAN
           B. TERBAKAR – AIR
           C. BERBAHAYA – GENANGAN
           D. DIHINDARI – DIDEKATI
           E. GAS – CAIR
           (Correct: B. Api menyebabkan Terbakar, Air menyebabkan Terbasahi)

           Type: Analogi (3 Variables)
           Q: KULKAS : SATU PINTU : DUA PINTU = …
           A. APEL : SATU KERANJANG : DUA KERANJANG
           B. ES KRIM : DINGIN : PANAS
           C. RODA : BULAT : KOTAK
           D. KASUR : RANJANG : ALAS TIDUR
           E. MESIN CUCI : BUKAAN ATAS : BUKAAN DEPAN
           (Correct: E. Jenis-jenis kulkas vs Jenis-jenis mesin cuci)

           Type: Silogisme (Quantifiers)
           Q: Perhatikan pernyataan berikut!
           Premis 1: Setiap manusia di dunia pernah mengalami gigi rontok.
           Premis 2: Beberapa manusia di dunia adalah orang yang sangat tampan.
           Jadi, …
           A. Beberapa manusia yang sangat tampan tidak pernah mengalami rontok gigi.
           B. Beberapa manusia yang sangat tampan pernah mengalami rontok gigi.
           C. Semua manusia yang sangat tampan tidak pernah mengalami rontok gigi.
           D. Semua manusia yang sangat tampan pernah mengalami rontok gigi.
           E. Semua manusia yang pernah mengalami rontok gigi adalah manusia yang sangat tampan.
           (Correct: D. Karena "Setiap" (Semua) mengalami, maka yang "Beberapa" (Tampan) juga pasti mengalami)

           Type: Analitis (Ordering)
           Q: Perhatikan ilustrasi berikut!
           Dalam sebuah perlombaan lari:
           1. Dani mencapai garis finis segera setelah Anton.
           2. Budi menyelesaikan perlombaan di antara Anton dan Raka.
           3. Raka sendiri mencapai garis finis setelah Fikri yang merupakan juara lomba lari tersebut.
           Urutan masuk finis kelima pelari tersebut adalah ….
           A. Budi – Anton – Fikri – Raka – Dani
           B. Fikri – Budi – Dani – Raka – Anton
           C. Fikri – Raka – Budi – Anton – Dani
           D. Fikri – Dani – Raka – Budi – Anton
           E. Raka – Budi – Fikri – Dani – Anton
           (Correct: C. Fikri (1) -> Raka -> Budi -> Anton -> Dani)
           `;
      } else if (category === 'SKD' && typeof context === 'string' && (context.toUpperCase().includes('NUMERIK') || context.toUpperCase().includes('KUANTITATIF') || context.toUpperCase().includes('HITUNG') || context.toUpperCase().includes('DERET'))) {
           difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - NUMERIK.
           
           CRITICAL RULES FOR NUMERIK (EXTREME DIFFICULTY):
           1. FORMATTING: MUST use Unicode for all math symbols.
              - Roots: √2, √3, ³√5
              - Fractions: ½, ⅓, ¾, ⅖ (or a/b if complex)
              - Exponents: x², y³, 2⁵
              - Operators: ×, ÷, ±, ≤, ≥, ≠
              - USE LATEX ($...$) FOR EVERY CALCULATION/VARIABLE.
           2. DIFFICULTY: Questions must be EXTREMELY HARD and TRICKY (SANGAT MENGECOH).
              - Algebra: Use complex substitution and nonlinear systems.
              - Series: Use 3 interleaved patterns, abstract sequences.
              - Comparison: Use quadratic inequalities causing indeterminate bounds.
              - Word Problems: Use inverse proportion with 2+ interruptions/variable changes. Distractors MUST BE logic-based errors (e.g., partial computation).
           3. CLARITY: The text must be clear and realistic, but the logic complex.

           FEW-SHOT EXAMPLES (Follow this style/difficulty):
           
           Type: Hitung Cepat (Aljabar/Akar)
           Q: Nilai dari (1 + √2)/(1 - √2) + (1 - √2)/(1 + √2) adalah ...
           A. -6
           B. -4
           C. -3
           D. 2 - ⅓√2
           E. 2 - ⁴⁄₃√2
           (Correct: A. Rationalize denominators: (1+√2)²/(1-2) + (1-√2)²/(1-2) = (3+2√2)/(-1) + (3-2√2)/(-1) = -3-2√2 -3+2√2 = -6)

           Type: Deret (Huruf/Angka)
           Q: A, Z, C, X, E, V, ..., ...
           A. F, T
           B. F, U
           C. G, S
           D. G, T
           E. G, U
           (Correct: D. Pattern 1: A, C, E, G (+2 letters). Pattern 2: Z, X, V, T (-2 letters))

           Type: Perbandingan Kuantitatif (Inequalities)
           Q: Jika 5 < x < 7 dan 6 < y < 8 dengan x dan y merupakan bilangan real, maka hubungan antara x dan y yang paling tepat adalah ….
           A. x > y
           B. x = y
           C. x < y
           D. x + 1 = y
           E. Hubungan antara x dan y tidak dapat ditentukan
           (Correct: E. If x=6.9 and y=6.1, x>y. If x=5.1 and y=7.9, x<y. Indeterminate.)

           Type: Soal Cerita (Work/Time)
           Q: Sebuah tim konstruksi sedang membangun dinding pagar sepanjang 500 meter. Jika pekerjaan tersebut dilakukan oleh 5 pekerja, mereka dapat menyelesaikannya dalam waktu 12 jam tanpa istirahat. Agar pekerjaan tersebut dapat selesai dalam waktu 7 jam, dengan 1 jam waktu istirahat di tengah (total kerja efektif 6 jam), maka jumlah pekerja yang dibutuhkan adalah …
           A. 6 pekerja
           B. 8 pekerja
           C. 10 pekerja
           D. 12 pekerja
           E. 15 pekerja
           (Correct: C. Load = 5 workers * 12 hours = 60 man-hours. Target time = 7 - 1 = 6 hours. Workers needed = 60 / 6 = 10 workers.)
           `;
      } else if (category === 'SKD' && typeof context === 'string' && (context.toUpperCase().includes('FIGURAL') || context.toUpperCase().includes('GAMBAR') || context.toUpperCase().includes('SERIAL') || context.toUpperCase().includes('KETIDAKSAMAAN'))) {
           difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - FIGURAL.
           
           CRITICAL RULES FOR FIGURAL (VISUAL LOGIC):
           1. **VISUAL REPRESENTATION**: You MUST generate raw <svg> code for ALL figural questions using the coordinates from shapeInstructions.
           2. **SVG REQUIREMENTS**: Use viewBox="0 0 100 100" (Standard). Use stroke="currentColor" fill="none" and stroke-width="2". Ensure width="100%" and height="auto".
           3. **TYPES & DIFFICULTY**:
              - **Ketidaksamaan (Odd One Out)**: EXTREME DIFFICULTY. The differences between the 5 options must be subtle and difficult to distinguish. Use intersecting shapes, slight angle differences, or complex layering patterns.
              - **Serial**: Sequence of changing shapes (combining Rotation, Addition, Shading).
              - **Analogi**: Relationship between two pairs.
           
           FEW-SHOT EXAMPLES (Abstract Structural Example):
           
           Type: Figural - Matrix 3x3 (Hard Pattern)
           (For a matrix, use the 'matrix' JSON array of rows where each cell is {content: "SVG or '?'", id: "id", logic: "Logic"}).
           
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
           difficultyContext = `CONTEXT: SKD TWK (Tes Wawasan Kebangsaan).
           
           CRITICAL RULES FOR TWK:
           1. FORMAT: Questions MUST be about TWK Themes (Bela Negara, Pilar Negara, UUD 1945, Bhinneka Tunggal Ika, Integritas, Nasionalisme, Patriotisme). DO NOT create scenario-based behavioral questions that resemble TKP (Tes Karakteristik Pribadi).
           2. OPTIONS: There must be 1 absolute CORRECT answer (score 5) and 4 entirely INCORRECT answers conceptually (score 0). DO NOT use TKP-style "best to worst" scoring where all options are varying degrees of good/bad behavior. Options must test constitutional/historical/national insight facts.
           3. TOPICS & METADATA: The 'metadata.topic' MUST be strictly one of the following exact strings:
              - "Nasionalisme (Kepentingan Nasional)"
              - "Integritas (Kejujuran/Komitmen)"
              - "Bela Negara (Peran Aktif)"
              - "Pilar Negara - Pancasila"
              - "Pilar Negara - UUD 1945"
              - "Pilar Negara - NKRI"
              - "Pilar Negara - Bhinneka Tunggal Ika"
              - "Bahasa Indonesia"
              Distribute questions evenly among these topics.
              - Bahasa Indonesia: Main ideas, EBI (Spelling), Conclusions.

           FEW-SHOT EXAMPLES (Follow this long, narrative style):

           Type: Nasionalisme (Case Study)
           Q: Negara X adalah sebuah negara yang baru saja merdeka dan sedang berusaha membangun rasa nasionalisme di kalangan warganya. Proses ini dilakukan melalui implementasi berbagai program pemerintah dan penyebaran nilai-nilai patriotisme dalam pendidikan. Namun, beberapa tantangan tampaknya menjadi penghambat dalam upaya tersebut. Antara lain: (1) Banyak warga Negara X yang memilih untuk bekerja di negara lain dan mengadopsi gaya hidup serta budaya negara tersebut. (2) Sebagian masyarakat Negara X lebih tertarik pada barang-barang impor dibandingkan produk lokal. (3) Penyiaran dan media di Negara X banyak didominasi oleh konten dari luar negeri. Berdasarkan kasus di atas, mana faktor yang paling mungkin menjadi penghambat utama dalam membangun semangat nasionalisme di Negara X?
           A. Globalisasi
           B. Kesenjangan sosial
           C. Pendidikan yang kurang efektif
           D. Sumber daya manusia yang kurang
           E. Kurangnya dukungan dari pemerintah
           (Correct: A. The influx of foreign culture, media, and products is the essence of Globalization challenges.)

           Type: Sejarah (Analysis)
           Q: Pada masa penjajahan, beberapa pemuda Indonesia seperti Ernest Douwes Dekker, Soewardi Soerjaningrat dan Tjipto Mangunkusumo mendirikan organisasi yang bernama Indische Party. Organisasi ini dikenal sebagai organisasi pertama yang mencetuskan konsep merdeka, yaitu bebas dari penjajahan Belanda dan menjadi fondasi penting dalam paham nasionalisme Indonesia. Peran Indische Party dan konsep merdeka memiliki pengaruh yang signifikan dalam sejarah kemerdekaan Indonesia. Bagaimanakah dampak konsep merdeka dan paham nasionalisme yang ditetapkan oleh Indische Party dalam perjuangan bangsa Indonesia hingga hari ini?
           A. Menginspirasi pembuatan Pancasila sebagai dasar negara
           B. Mendorong pertumbuhan partai-partai politik di Indonesia
           C. Mendorong terbentuknya kesadaran kolektif untuk merdeka
           D. Mendorong penggunaan Bahasa Indonesia sebagai bahasa resmi
           E. Menstimulasi pembentukan lembaga-lembaga pemerintahan setelah kemerdekaan
           (Correct: C. The core contribution was the "Collective Consciousness" of being one nation (Indonesia) vs the Dutch.)

           Type: Integritas/Hukum (Specific Pasal)
           Q: Pada 2021 silam, seorang aparat bernama Briptu Nikmal Idwan diduga melakukan pemerkosaan terhadap seorang remaja perempuan berusia 16 tahun di Mapolsek Jailolo Selatan, Halmahera Barat, Maluku Utara. Tindakan aparat ini jelas sekali bertentangan dengan ….
           A. UUD 1945 pasal 27 ayat 3
           B. UUD 1945 pasal 30 ayat 3
           C. UUD 1945 pasal 30 ayat 4
           D. UU nomor 3 2002 pasal 9 ayat 1
           E. UU nomor 3 2002 pasal 9 ayat 2
           (Correct: C. Pasal 30 ayat 4 discusses the Police (Polri) as the instrument of the state that serves, protects, and enforces the law. Misconduct violates this core function.)

           Type: Bela Negara (Current Events)
           Q: Nama Pandawara Group seringkali menjadi perbincangan dan trending topik di sosial media berkat aksi-aksi heroiknya dalam membersihkan sampah. Beranggotakan lima orang pemuda, tak jarang Pandawara Group mengajak masyarakat dan netizen untuk turut serta turun ke lapangan membersihkan sampah. Aksi kelompok pemuda ini mencerminkan salah satu nilai bela negara, yaitu ….
           A. cinta tanah air
           B. kesadaran berbangsa dan bernegara
           C. rela berkorban
           D. memiliki kemampuan bela negara
           E. memiliki kemampuan awal bela negara
           (Correct: E. Physical action to protect the environment is often categorized as "Kemampuan Awal Bela Negara" or "Cinta Tanah Air" depending on context, but usually 'Kemampuan Awal' involves physical/psychological readiness.)

           Type: Pilar Negara (Pancasila Implementation)
           Q: Desa yang dipimpin oleh Pak Dimas terancam banjir akibat musim penghujan yang akan segera tiba. Untuk mengatasi masalah ini, Pak Dimas mengusulkan pembangunan tanggul baru atau memperkuat drainase. Melalui pemungutan suara yang diadakan di desa tersebut, mayoritas warga memilih bangun tanggul baru. Perilaku Pak Dimas dan seluruh warga desa merupakan cerminan dari ….
           A. UUD 1945 Pasal 2 ayat 1
           B. pembukaan UUD 1945 alinea ke 1
           C. pembukaan UUD 1945 alinea ke 4
           D. Pancasila sila ke-2
           E. Pancasila sila ke-4
           (Correct: E. Musyawarah and voting (democracy) is the core of Sila ke-4.)
           `;
      } else {
           // Default Distribution
           let hotsPercent = "70%";
           let hardPercent = "30%";

           // OVERRIDE FOR SKD TWK & TIU
           if (category === 'SKD') {
               const contextStr = typeof context === 'string' ? context.toUpperCase() : '';
               
               // TWK: 80% HOTS, 20% Difficult
               if (contextStr.includes('TWK') || contextStr.includes('WAWASAN')) {
                   hotsPercent = "80%";
                   hardPercent = "20%";
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
           - ABSOLUTELY NO Easy or simple recall questions.
           - For TIU/Figural: Use COMPLEX visual patterns with the symbols defined in shapeInstructions. Avoid simple 1-step patterns.
           - For TIU/Verbal (Analogi): DO NOT use simple, ambiguous, or debatable analogies (e.g., "Televisi : Gambar : Suara"). Use highly specific, academic, or technical relationships where only ONE answer is definitively correct.
           - For TIU/Logika (Posisi/Silogisme): Create complex scenarios with at least 5-6 variables/people and multiple intersecting rules. Avoid simple "A is next to B" puzzles.
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
               - **PBM (Pemahaman Bacaan dan Menulis)**: Focus on EDITING (correcting errors), grammar, sentence structure, punctuation, spelling (EYD), and effective writing in context.
               - **PPU (Pengetahuan dan Pemahaman Umum)**: Focus on semantics, contextual meaning, word relationships (synonym/antonym in context), and general knowledge derived from texts.
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
        
        prompt += `\nGenerate ${count} distinct questions. Provide DETAILED explanation.`;

      } else {
        const commonInstruction = `Generate ${count} distinct questions. ${difficultyContext}. Provide DETAILED explanation. ${shapeInstructions} ${mathInstructions} ${formattingInstructions}`;
        
        if (isTkp) {
           prompt = `SKD TKP MODE. ${commonInstruction} SCORING: 1-5 points via 'tkpPoints'. Ensure high ambiguity between top choices. The 'option' field in tkpPoints MUST BE THE EXACT FULL TEXT of the option, NOT A/B/C/D/E.`;
        } else {
            prompt = `TRY OUT / PRACTICE V5. Category: ${category}. Context: ${JSON.stringify(context)}. ${commonInstruction}. If TPA or Spatial, utilize 3D symbols (📦, 🧊, 🎲, 🧱) or geometric shapes heavily. Ensure all fractions use Unicode characters (e.g. ½, ⅓).`;
        }
      }
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
  utbkVariant?: 'ONLY_MC' | 'MIXED'
): AsyncGenerator<Question[], void, unknown> {
  const { prompt, base64Pdf, schema } = buildQuestionPrompt(mode, category, context, count, weakTopics, skdStream, generalMethod, difficultyOverride, utbkVariant);
  
  const stream = callGeminiStream(prompt, schema, base64Pdf);
  for await (const chunk of stream) {
    if (chunk) {
      const sanitized = chunk.filter(q => !!q).map(q => {
        const s = sanitizeQuestion(q);
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
  utbkVariant?: 'ONLY_MC' | 'MIXED'
): Promise<Question[]> => {
  const { prompt, base64Pdf, schema } = buildQuestionPrompt(mode, category, context, count, weakTopics, skdStream, generalMethod, difficultyOverride, utbkVariant);

  const res = await callGemini<{questions: Question[]}>(prompt, schema, base64Pdf);
  const rawQuestions = res.questions || [];
  
  return rawQuestions.filter(q => !!q).map(q => {
      const sanitized = sanitizeQuestion(q);
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

export const generateSkdSimulation = async (stream: SkdStreamType, variant: 'FULL' | 'TWK' | 'TIU' | 'TKP' = 'FULL'): Promise<Question[]> => {
    // 1. Setup Prompts
    const genTwk = async () => {
        const p1 = generateQuestions(StudyMode.SIMULATION, 'SKD', 'Tes Wawasan Kebangsaan (TWK) - Nasionalisme dan Integritas', 15, [], stream, undefined, 'HOTS');
        const p2 = generateQuestions(StudyMode.SIMULATION, 'SKD', 'Tes Wawasan Kebangsaan (TWK) - Bela Negara, Pilar Negara, dan Bahasa Indonesia', 15, [], stream, undefined, 'HOTS');
        const [r1, r2] = await Promise.all([p1, p2]);
        return [...r1, ...r2];
    };

    const genTkp = async () => {
        const p1 = generateQuestions(StudyMode.SIMULATION, 'SKD', 'Tes Karakteristik Pribadi (TKP) - Pelayanan Publik dan Jejaring Kerja', 15, [], stream, undefined, 'TKP');
        const p2 = generateQuestions(StudyMode.SIMULATION, 'SKD', 'Tes Karakteristik Pribadi (TKP) - Sosial Budaya dan TIK', 15, [], stream, undefined, 'TKP');
        const p3 = generateQuestions(StudyMode.SIMULATION, 'SKD', 'Tes Karakteristik Pribadi (TKP) - Profesionalisme dan Anti Radikalisme', 15, [], stream, undefined, 'TKP');
        const [r1, r2, r3] = await Promise.all([p1, p2, p3]);
        return [...r1, ...r2, ...r3];
    };
    
    const genTiu = async () => {
        // TIU: 35 Questions Total Total (for full TIU subtest)
        // Adjust for more spatial/matrix/figural and inequalities
        // Figural/Matrix/Spatial: 12-14
        // Numerik (including Inequalities): 10-12
        // Verbal: 9-11
        const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
        
        let figuralCount = getRandomInt(12, 14);
        let numericCount = getRandomInt(10, 12);
        let verbalCount = 35 - figuralCount - numericCount;

        const pTiuVerbal = generateQuestions(StudyMode.SIMULATION, 'SKD', 'SKD - VERBAL (Analogi, Silogisme, Analitis). HARD DIFFICULTY. Complex syllogisms (3+ premises).', verbalCount, [], stream, undefined, 'HOTS');
        const pTiuNumerik = generateQuestions(StudyMode.SIMULATION, 'SKD', 'SKD - NUMERIK (Berhitung, Deret, Perbandingan, Ketidaksamaan/Inequalities, Soal Cerita). VERY HARD. Must include inequalities (Perbandingan Kuantitatif, A > B, P < Q, dst), multi-step arithmetic, and complex word problems/sequences.', numericCount, [], stream, undefined, 'HOTS');
        const pTiuFigural = generateQuestions(StudyMode.SIMULATION, 'SKD', 'SKD - FIGURAL (Analogi, Ketidaksamaan, Serial, Matriks, Spasial, Jaring-jaring 3D). EXTREME DIFFICULTY. MUST OUTPUT <svg> FOR ALL QUESTIONS, INCLUDING IN EACH OF THE 5 OPTIONS. Abstract geometric patterns ONLY. Include 3x3 matrices, paper folding (spasial), and 3D rotations. MAKE KETIDAKSAMAAN EXTREMELY DIFFICULT. For 3D shapes/cubes (bangun ruang/jaring-jaring), MUST use isometric projection with proper <polygon> faces, distinct fill colors (e.g. #e2e8f0, #cbd5e1, #94a3b8) to simulate lighting and depth (shadow effects). Avoid ambiguous or overly simplistic 2D nets.', figuralCount, [], stream, undefined, 'HOTS');

        const [tiuVerbal, tiuNumerik, tiuFigural] = await Promise.all([pTiuVerbal, pTiuNumerik, pTiuFigural]);
        
        let tiu = [...tiuVerbal, ...tiuNumerik, ...tiuFigural];
        tiu.forEach(q => q.metadata.subtest = 'Tes Intelegensia Umum (TIU)');
        return shuffleArray(tiu);
    };

    let allQuestions: Question[] = [];

    if (variant === 'TWK') {
        allQuestions = await genTwk();
        allQuestions.forEach(q => q.metadata.subtest = 'Tes Wawasan Kebangsaan (TWK)');
    } else if (variant === 'TIU') {
        allQuestions = await genTiu();
    } else if (variant === 'TKP') {
        allQuestions = await genTkp();
        allQuestions.forEach(q => q.metadata.subtest = 'Tes Karakteristik Pribadi (TKP)');
    } else {
        // FULL variant
        const [twk, tiu, tkp] = await Promise.all([genTwk(), genTiu(), genTkp()]);
        twk.forEach(q => q.metadata.subtest = 'Tes Wawasan Kebangsaan (TWK)');
        tkp.forEach(q => q.metadata.subtest = 'Tes Karakteristik Pribadi (TKP)');
        allQuestions = [...twk, ...tiu, ...tkp];
    }

    return reindexQuestions(allQuestions, 'SKD');
};

export const generateUtbkSimulation = async (variant: 'ONLY_MC' | 'MIXED' = 'MIXED'): Promise<Question[]> => {
    // Penalaran Umum: 30 soal (Induktif 10, Deduktif 10, Kuantitatif 10)
    const pPU_Induktif = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'Penalaran Umum (Penalaran Induktif)', 10, [], undefined, undefined, 'HOTS', variant);
    const pPU_Deduktif = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'Penalaran Umum (Penalaran Deduktif)', 10, [], undefined, undefined, 'HOTS', variant);
    const pPU_Kuantitatif = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'Penalaran Umum (Penalaran Kuantitatif)', 10, [], undefined, undefined, 'HOTS', variant);

    const pPPU = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'Pengetahuan dan Pemahaman Umum', 20, [], undefined, undefined, 'HOTS', variant);
    const pPBM = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'Pemahaman Bacaan dan Menulis', 20, [], undefined, undefined, 'HOTS', variant);
    const pPK = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'Pengetahuan Kuantitatif', 20, [], undefined, undefined, 'HOTS', variant);
    
    // Literasi Bahasa Indonesia: 30 soal
    const pLitIndo = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'Literasi Bahasa Indonesia', 30, [], undefined, undefined, 'HOTS', variant);
    
    // Literasi Bahasa Inggris: 20 soal
    const pLitIng = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'Literasi Bahasa Inggris', 20, [], undefined, undefined, 'HOTS', variant);
    
    // Penalaran Matematika: 20 soal
    const pPM = generateQuestions(StudyMode.SIMULATION, 'UTBK', 'Penalaran Matematika', 20, [], undefined, undefined, 'HOTS', variant);

    const [puInd, puDed, puKuan, ppu, pbm, pk, lind, ling, pm] = await Promise.all([
        pPU_Induktif, pPU_Deduktif, pPU_Kuantitatif, 
        pPPU, pPBM, pPK, pLitIndo, pLitIng, pPM
    ]);

    const pu = [...puInd, ...puDed, ...puKuan];
    pu.forEach(q => q.metadata.subtest = 'Penalaran Umum');
    
    ppu.forEach(q => q.metadata.subtest = 'Pengetahuan dan Pemahaman Umum');
    pbm.forEach(q => q.metadata.subtest = 'Pemahaman Bacaan dan Menulis');
    pk.forEach(q => q.metadata.subtest = 'Pengetahuan Kuantitatif');
    lind.forEach(q => q.metadata.subtest = 'Literasi Bahasa Indonesia');
    ling.forEach(q => q.metadata.subtest = 'Literasi Bahasa Inggris');
    pm.forEach(q => q.metadata.subtest = 'Penalaran Matematika');

    const allQuestions = [...pu, ...ppu, ...pbm, ...pk, ...lind, ...ling, ...pm];
    return reindexQuestions(allQuestions, 'UTBK');
};

export const generateTpaTbiSimulation = async (): Promise<Question[]> => {
    const tpaVerbal = generateQuestions(StudyMode.SIMULATION, 'TPA', `TPA - Verbal (HOTS). Complex analogies and syllogisms.`, 15, [], undefined, undefined, 'HOTS');
    const tpaQuant = generateQuestions(StudyMode.SIMULATION, 'TPA', `TPA - Kuantitatif (HOTS). Advanced arithmetic, algebra, and geometry.`, 15, [], undefined, undefined, 'HOTS');
    const tpaLogic = generateQuestions(StudyMode.SIMULATION, 'TPA', `TPA - Penalaran (HOTS). Complex logical deduction and spatial reasoning.`, 15, [], undefined, undefined, 'HOTS');
    const tbi = generateQuestions(StudyMode.SIMULATION, 'TPA', `TBI - Bahasa Inggris (TOEFL Style). Advanced grammar and reading comprehension.`, 20, [], undefined, undefined, 'HOTS');

    const [resVerbal, resQuant, resLogic, resTbi] = await Promise.all([tpaVerbal, tpaQuant, tpaLogic, tbi]);

    resVerbal.forEach(q => q.metadata.subtest = 'TPA - Kemampuan Verbal');
    resQuant.forEach(q => q.metadata.subtest = 'TPA - Kemampuan Kuantitatif');
    resLogic.forEach(q => q.metadata.subtest = 'TPA - Kemampuan Penalaran');
    resTbi.forEach(q => q.metadata.subtest = 'TBI - Bahasa Inggris');

    const allQuestions = [...resVerbal, ...resQuant, ...resLogic, ...resTbi];
    return reindexQuestions(allQuestions, 'TPA');
};

export const generatePsikotestKedinasanSimulation = async (): Promise<Question[]> => {
    const tiu = generateQuestions(StudyMode.SIMULATION, 'TPA', `PSIKOTEST KEDINASAN (TIU V3). HARD DIFFICULTY.`, 30, [], undefined, undefined, 'HOTS');
    // Important: Specifically requesting 3D symbols for V3 Figural/Spatial
    const figural = generateQuestions(StudyMode.SIMULATION, 'TPA', `PSIKOTEST KEDINASAN (LOGIKA GAMBAR V3). EXTREME DIFFICULTY. Use 3D UNICODE SHAPES (📦, 🧊, 🎲) or geometric (▲, ■) for spatial/pattern series. NO semantic/fruit/animal questions.`, 15, [], undefined, undefined, 'HOTS');
    const personality = generateQuestions(StudyMode.SIMULATION, 'TPA', `PSIKOTEST KEDINASAN (KEPRIBADIAN)`, 20, [], undefined, undefined, 'TKP');

    const [resTiu, resFigural, resPersonality] = await Promise.all([tiu, figural, personality]);

    resTiu.forEach(q => q.metadata.subtest = 'TIU - Verbal & Numerik');
    resFigural.forEach(q => q.metadata.subtest = 'Tes Logika Gambar (Abstrak)');
    resPersonality.forEach(q => q.metadata.subtest = 'Tes Kepribadian');

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
    const math = generateQuestions(StudyMode.SIMULATION, 'TKA', `TKA ${level} - Matematika. 80% HOTS. Include a mix of 'multiple_choice', 'multiple_choice_complex', and 'matching' question types.`, 30, [], undefined, undefined, 'HOTS');
    const indonesian = generateQuestions(StudyMode.SIMULATION, 'TKA', `TKA ${level} - Bahasa Indonesia. 80% HOTS. Include a mix of 'multiple_choice', 'multiple_choice_complex', and 'matching' question types.`, 30, [], undefined, undefined, 'HOTS');
    
    let allQuestions: Question[] = [];

    if (level === 'SD') {
        const [resMath, resIndo] = await Promise.all([math, indonesian]);
        resMath.forEach(q => q.metadata.subtest = 'Matematika');
        resIndo.forEach(q => q.metadata.subtest = 'Bahasa Indonesia');
        allQuestions = [...resMath, ...resIndo];
    } else {
        const english = generateQuestions(StudyMode.SIMULATION, 'TKA', `TKA ${level} - Bahasa Inggris. 80% HOTS. Include a mix of 'multiple_choice', 'multiple_choice_complex', and 'matching' question types.`, 30, [], undefined, undefined, 'HOTS');
        const [resMath, resIndo, resEng] = await Promise.all([math, indonesian, english]);
        resMath.forEach(q => q.metadata.subtest = 'Matematika');
        resIndo.forEach(q => q.metadata.subtest = 'Bahasa Indonesia');
        resEng.forEach(q => q.metadata.subtest = 'Bahasa Inggris');
        allQuestions = [...resMath, ...resIndo, ...resEng];
    }

    return reindexQuestions(allQuestions, 'TKA');
};

export const generatePsikotestSimulation = async () => {
    const qs = await generateQuestions(StudyMode.SIMULATION, 'PSIKOTEST', 'SIMULATION (IQ & LOGIC V3). Focus on spatial logic with 3D Unicode symbols (📦, 🧱) where applicable.', 40, [], undefined, undefined, 'HOTS');
    return reindexQuestions(qs, 'PSIKOTEST');
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
- Pengetahuan Kuantitatif (PK) (skor maksimal 1000)
- Literasi Bahasa Indonesia (LBI) (skor maksimal 1000)
- Literasi Bahasa Inggris (LBE) (skor maksimal 1000)
- Penalaran Matematika (PM) (skor maksimal 1000)` : `- Tes Wawasan Kebangsaan (TWK) (ambang batas passing grade 65, nilai maksimal 150)
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