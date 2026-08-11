import { GoogleGenAI } from "@google/genai";
import fs from "fs";

async function generate() {
    if (!process.env.GEMINI_API_KEY) {
        console.error("GEMINI_API_KEY is missing");
        return;
    }
    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
            headers: {
                'User-Agent': 'aistudio-build',
            }
        }
    });

    const prompt = `Generate 30 high-quality multiple choice questions specifically for TWK (Tes Wawasan Kebangsaan) level SKD (Seleksi Kompetensi Dasar) CPNS/Kedinasan.
    
    Themes to include:
    - Pasal-pasal UUD 1945 terkait Bela Negara
    - Integritas dan Anti Korupsi
    - Nasionalisme dan Pilar Negara
    - Pancasila dalam butir-butir dan aplikasinya
    - Sejarah Perjuangan Bangsa terkait konstitusi
    
    Requirements:
    1. Language: Indonesian.
    2. Format: JSON array of objects.
    3. Each object structure:
    {
        "id": "twk_pasal_unique_id",
        "question": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
        "correctAnswer": "The correct option text",
        "article": "The article reference or TWK theme reference",
        "explanation": "Detailed explanation why it is the correct answer and its relation to TWK values"
    }
    4. Return ONLY the JSON array.`;

    try {
        const result = await ai.models.generateContent({
            model: "gemini-3.6-flash",
            contents: prompt
        });
        
        const text = result.text;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            fs.writeFileSync("./article_questions.json", jsonMatch[0]);
            console.log("SUCCESS: article_questions.json created");
        } else {
            console.error("JSON_ERROR: Failed to find JSON array in response");
        }
    } catch (err) {
        console.error("API_ERROR:", err);
    }
}

generate();
