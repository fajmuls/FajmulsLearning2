import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Type } from "@google/genai";
import fs from "fs";
import os from "os";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize API
const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY || "", 
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } 
});

app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt, schema, fileBase64, mimeType } = req.body;
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

    // If there is a fileBase64, we need to upload it via File API
    if (fileBase64) {
      if (mimeType === "application/pdf") {
          // write to temp file
          const tmpFilePath = path.join(os.tmpdir(), `upload-${Date.now()}.pdf`);
          fs.writeFileSync(tmpFilePath, Buffer.from(fileBase64, 'base64'));
          
          const uploadRes = await ai.files.upload({
              file: tmpFilePath,
              mimeType: "application/pdf"
          });
          
          parts.push({
              fileData: {
                  fileUri: uploadRes.uri,
                  mimeType: uploadRes.mimeType
              }
          });
          
          fs.unlinkSync(tmpFilePath);
      } else {
          parts.push({
            inlineData: {
              mimeType: mimeType || "application/pdf", 
              data: fileBase64
            }
          });
      }
    }
    
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: parts,
        config
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to call Gemini" });
  }
});

async function startServer() {
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
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
