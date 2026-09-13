const fs = require('fs');
let code = fs.readFileSync('src/utils/performanceAnalytics.ts', 'utf-8');

const recFn = `
function getTopicRecommendation(topic: string, isCritical: boolean): string {
    if (!isCritical) return 'Pertahankan performa luar biasa ini. Teruslah berlatih!';
    const t = topic.toLowerCase();
    
    if (t.includes('integritas')) return 'Perbanyak baca studi kasus perilaku jujur & anti-korupsi di lingkungan kerja.';
    if (t.includes('bela negara')) return 'Pahami dasar hukum dan contoh nyata penerapan pilar negara dalam kehidupan sehari-hari.';
    if (t.includes('figural')) return 'Sering berlatih pola gambar 3x3 dan rotasi objek agar mata lebih peka.';
    if (t.includes('deret')) return 'Latihlah kepekaan pada deret fibonacci, larik ganda, dan pangkat berulang.';
    if (t.includes('pelayanan publik')) return 'Pilih opsi yang paling menguntungkan institusi dan masyarakat tanpa melanggar SOP.';
    if (t.includes('jejaring')) return 'Fokus pada opsi yang menekankan kolaborasi dan win-win solution.';
    
    return 'Lakukan evaluasi ulang (review) pada soal-soal salah di topik ini dan pahami pembahasannya.';
}
`;

code = code + recFn;
fs.writeFileSync('src/utils/performanceAnalytics.ts', code);
