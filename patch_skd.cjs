const fs = require('fs');
let code = fs.readFileSync('services/geminiService.ts', 'utf-8');

// Replace generateSkdSimulation with the new stateful, pausing version
const newImpl = `export const generateSkdSimulation = async (stream: SkdStreamType, variant: 'FULL' | 'TWK' | 'TIU' | 'TKP' = 'FULL', savedState?: any, onProgress?: (progress: number, msg: string) => void): Promise<{ completed: boolean, questions?: Question[], state?: any, errorMsg?: string }> => {
  const difficultyProfile = \`
AUTHENTIC-HARD PROFILE:
- ±20% Medium, ±60% Hard, ±20% HOTS.
- Tidak semua soal harus super panjang.
- Hard terutama berasal dari reasoning depth, plausible distractors, dan ketelitian.
- Waktu ideal realistis; hindari soal yang secara normal membutuhkan >2 menit kecuali memang tipe analitis kompleks.
\`;

  const tiuFiguralProfile = \`
\${difficultyProfile}
ATURAN KHUSUS TIU FIGURAL & MATRIKS:
- Buat soal Matriks 3x3 (Sembilan Kotak).
- Kanvas SVG HARUS berukuran viewBox="0 0 120 120" secara presisi.
- Gunakan <svg> murni (circle, rect, path, polygon, line). DILARANG KERAS menggunakan teks huruf, emoji, atau karakter.
- Gunakan stroke="currentColor" stroke-width="2.5" dan kombinasi fill="currentColor" opacity="0.25" atau fill="none".
- Opsi pengecoh harus memiliki pola matriks (misal salah sudut rotasi 45°, salah jumlah garis, salah operasi boolean).
\`;

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
      if (onProgress) onProgress(completedCount / totalBatches * 100, \`Memuat batch \${batchLabel} dari cache...\`);
      allQuestions.push(...state.completedBatches[key]);
      return;
    }
    if (onProgress) onProgress(completedCount / totalBatches * 100, \`Meracik \${batchLabel}...\`);
    const q = await generateValidatedSkdBatch(subtests, topic, stream, batchLabel, profile);
    state.completedBatches[key] = q;
    completedCount++;
    if (onProgress) onProgress(completedCount / totalBatches * 100, \`Batch \${batchLabel} selesai.\`);
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
      await runBatch('tiuV', Object.fromEntries(entries.filter(([k]) => ['TIU - Analogi', 'TIU - Silogisme', 'TIU - Analitis'].includes(k))), 'TIU', 'TIU-VERBAL', difficultyProfile);
      await runBatch('tiuN', Object.fromEntries(entries.filter(([k]) => ['TIU - Hitungan', 'TIU - Deret Angka', 'TIU - Perbandingan Kuantitatif', 'TIU - Soal Cerita'].includes(k))), 'TIU', 'TIU-NUMERIK', difficultyProfile);
      await runBatch('tiuF', Object.fromEntries(entries.filter(([k]) => k.includes('Gambar'))), 'TIU', 'TIU-FIGURAL', tiuFiguralProfile);
    }

    if (variant === 'FULL' || variant === 'TKP') {
      const entries = Object.entries(SKD_DISTRIBUTION.TKP);
      await runBatch('tkpA', Object.fromEntries(entries.slice(0, 2)), 'TKP', 'TKP-A', difficultyProfile);
      await runBatch('tkpB', Object.fromEntries(entries.slice(2, 4)), 'TKP', 'TKP-B', difficultyProfile);
      await runBatch('tkpC', Object.fromEntries(entries.slice(4)), 'TKP', 'TKP-C', difficultyProfile);
    }

    const expectedTotal = variant === 'FULL' ? 110 : variant === 'TWK' ? SKD_TOTALS.TWK : variant === 'TIU' ? SKD_TOTALS.TIU : SKD_TOTALS.TKP;
    if (allQuestions.length !== expectedTotal) {
      throw new Error(\`SKD V8 menghasilkan \${allQuestions.length}/\${expectedTotal} soal. Paket ditolak agar TO tidak terisi soal yang tidak tervalidasi.\`);
    }

    // Cross-batch semantic duplicate check.
    const fingerprints = allQuestions.map(questionFingerprint);
    for (let i = 0; i < fingerprints.length; i++) {
      for (let j = i + 1; j < fingerprints.length; j++) {
        if (allQuestions[i].metadata?.subtest === allQuestions[j].metadata?.subtest && jaccardSimilarity(fingerprints[i], fingerprints[j]) >= 0.88) {
          throw new Error(\`SKD V8 mendeteksi duplicate-semantic pattern pada \${allQuestions[i].id} dan \${allQuestions[j].id}. Paket ditolak.\`);
        }
      }
    }

    return { completed: true, questions: reindexQuestions(allQuestions, 'SKD-V8'), state };

  } catch (err: any) {
    if (err.name === 'RateLimitError' || err.message?.toLowerCase().includes("quota") || err.message?.includes("429")) {
      return { completed: false, state, errorMsg: err.message };
    }
    throw err;
  }
};
`;

const oldCodeStart = "export const generateSkdSimulation = async (stream: SkdStreamType, variant: 'FULL' | 'TWK' | 'TIU' | 'TKP' = 'FULL', savedState?: any, onProgress?: (msg: string) => void): Promise<{ completed: boolean, questions?: Question[], state?: any }> => {";
const splitIdx = code.indexOf(oldCodeStart);
if (splitIdx === -1) {
  console.log("Could not find generateSkdSimulation start!");
} else {
  const nextFuncStart = code.indexOf("export const generateUtbkSimulation", splitIdx);
  if (nextFuncStart === -1) {
    console.log("Could not find next function start!");
  } else {
    code = code.substring(0, splitIdx) + newImpl + "\n" + code.substring(nextFuncStart);
    fs.writeFileSync('services/geminiService.ts', code);
    console.log("Patch applied successfully!");
  }
}
