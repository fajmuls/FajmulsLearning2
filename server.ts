import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/generate-questions", async (req, res) => {
    const { prompt: userPrompt, category, difficulty } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "GEMINI_API_KEY is not configured on server" });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      let finalPrompt = userPrompt;

      // If category and difficulty (subtest) are provided, build an ELITE prompt
      if (category === 'SKD' && difficulty) {
        const isTwk = ['TWK', 'WAWASAN KEBANGSAAN'].includes(difficulty.toUpperCase());
        const isTiu = ['TIU', 'INTELEGENSIA'].includes(difficulty.toUpperCase());
        const isTkp = ['TKP', 'KARAKTERISTIK'].includes(difficulty.toUpperCase());

        let difficultyContext = "";
        if (isTwk) {
          difficultyContext = `CONTEXT: SKD TWK (Tes Wawasan Kebangsaan) - ELITE KEDINASAN DIFFICULTY.
           
           THEME & TOPICS: Nasionalisme, Integritas, Bela Negara, Pilar Negara, Bahasa Indonesia.

           CONTENT RATIO (CRITICAL):
           - 30% Advanced Memorization: Deep constitutional history, specific article nuances, and historical dates (Hafalan tingkat lanjut).
           - 70% Actual Duty Reasoning: Complex case studies involving ethics, implementation of state values in government duty, and national integrity in modern situations (Penalaran Implementasi/Tugas Aktual).

           CRITICAL TWK RULES:
           1. NO IMAGES/SVG.
           2. FORMAT: Complex case studies. Avoid simple memorization except for the 30% portion.
           3. JAWABAN: High-level conceptual understanding and value implementation.
           4. EXPLANATION: Concise but clear (Singkat, Padat, Jelas).
           5. DISTRACTORS: Extreme difficulty. All options must sound plausible and constitutional.
           6. ANTI-REPETITION: No cliches. Go deeper into actual duty.`;
        } else if (isTiu) {
          difficultyContext = `CONTEXT: SKD TIU (Tes Intelegensia Umum) - ELITE KEDINASAN LEVEL (ACTUAL TIU).
           
           THEME & TOPICS: Verbal Analogy, Syllogism, Analytical, Numerical Series, Quantitative Comparison, Figural 3x3 Matrix.

           CRITICAL TIU RULES:
           1. VERBAL ANALOGY: Advanced vocabulary/context.
           2. NUMERICAL SERIES: Interleaved/multi-layer logic.
           3. LOGICAL REASONING: Complex negations and contradictory premises.
           4. FIGURAL: Clean SVG with complex transformations (rotation + scaling + XOR).
           5. EXPLANATION: Brief, mathematical, and easy to understand.`;
        } else if (isTkp) {
          difficultyContext = `CONTEXT: SKD TKP (Tes Karakteristik Pribadi) - ELITE KEDINASAN (CREATIVE SCENARIOS).
           
           THEME & TOPICS: Public Service, Networking, Social-Cultural, ICT, Professionalism, Anti-Radicalism.

           CRITICAL TKP RULES:
           1. SCORING: 5-4-3-2-1.
           2. DIFFICULTY: Highly grey-area professional dilemmas.
           3. NO CLICHÉS: No standard printer/guest problems. Use modern bureaucracy, digital transformation, or policy dilemmas.
           4. CREATIVITY: Unique scenarios not found in old bank soal.
           5. EXPLANATION: Brief reason for point 5 choice.`;
        }

        finalPrompt = `${difficultyContext}
        
        TASK: Generate ${userPrompt.match(/\d+/) || 10} high-quality ${difficulty} multiple choice questions.
        
        Requirements:
        1. Language: Indonesian.
        2. Format: JSON array of objects.
        3. Structure:
        {
            "id": "${difficulty.toLowerCase()}_gen_${Date.now()}_index",
            "question": "...",
            "options": ["...", "...", "...", "...", "..."],
            "correctAnswer": "...",
            "explanation": "...",
            "metadata": {
                "subtest": "${difficulty}",
                "topic": "...",
                "difficulty": "ELITE"
            }
        }
        4. Return ONLY the JSON array.`;
      }

      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: finalPrompt
      });

      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate content" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
