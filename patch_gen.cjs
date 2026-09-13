const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// Also add RateLimitError check for callGeminiStream if it exists, wait we can just edit generateSkdSimulation
// Find export const generateSkdSimulation = async (stream: SkdStreamType, variant: 'FULL' | 'TWK' | 'TIU' | 'TKP' = 'FULL'): Promise<Question[]> => {
// and replace it.

code = code.replace(
  "export const generateSkdSimulation = async (stream: SkdStreamType, variant: 'FULL' | 'TWK' | 'TIU' | 'TKP' = 'FULL'): Promise<Question[]> => {",
  "export const generateSkdSimulation = async (stream: SkdStreamType, variant: 'FULL' | 'TWK' | 'TIU' | 'TKP' = 'FULL', savedState?: any, onProgress?: (msg: string) => void): Promise<{ completed: boolean, questions?: Question[], state?: any }> => {"
);

fs.writeFileSync('services/geminiService.ts', code);
