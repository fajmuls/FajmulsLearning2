const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// Insert RateLimitError class
code = `export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}\n` + code;

// Catch in callGemini
code = code.replace(
  `console.warn(\`[Gemini Retry] Model \${model} encountered transient error (\${retries - 1} retries remaining, rotating model):\`, error?.message || error);`,
  `if (error?.message?.toLowerCase().includes("quota") || error?.message?.toLowerCase().includes("resource_exhausted") || error?.message?.includes("429")) {
        throw new RateLimitError("Quota API Gemini Habis/Terlimit. Coba lagi nanti.");
      }
      console.warn(\`[Gemini Retry] Model \${model} encountered transient error (\${retries - 1} retries remaining, rotating model):\`, error?.message || error);`
);

fs.writeFileSync('services/geminiService.ts', code);
