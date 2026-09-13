const fs = require('fs');
let code = fs.readFileSync('src/utils/performanceAnalytics.ts', 'utf-8');

const regex = /\/\/ Deteksi Topik & Materi Soal secara Cerdas[\s\S]*?export function detectQuestionTopic[^\}]*\}[^\}]*\}[^\}]*\}[^\}]*\}/; // Too risky, let's just use string replace.

let replaceFn = `// Deteksi Topik & Materi Soal secara Cerdas
export function detectQuestionTopic(q: Question): { subtest: string; topic: string } {
    const rawSubtest = (q.metadata?.subtest || '').toUpperCase();
    const rawTopic = (q.metadata?.topic || '').trim().toLowerCase();
    const content = (q.content || '').toLowerCase();
    const explanation = (q.explanation || '').toLowerCase();
    const fullText = \`\${content} \${explanation} \${rawTopic}\`;

    // 1. Cek Kategori SKD
    if (rawSubtest.includes('TWK') || (!rawSubtest && (fullText.includes('pancasila') || fullText.includes('uud 1945') || fullText.includes('bela negara') || fullText.includes('integritas')))) {
        const sub = 'TWK';
        if (fullText.includes('integritas') || fullText.includes('korupsi') || fullText.includes('kejujuran') || fullText.includes('gratifikasi') || fullText.includes('suap') || fullText.includes('kode etik') || fullText.includes('kpk')) {
            return { subtest: sub, topic: 'Integritas' };
        }
        if (fullText.includes('bela negara') || fullText.includes('cinta tanah air') || fullText.includes('ancaman militer') || fullText.includes('hankanrata') || fullText.includes('patriotisme') || fullText.includes('uu no. 23 tahun 2019') || fullText.includes('agresi')) {
            return { subtest: sub, topic: 'Bela Negara' };
        }
        if (fullText.includes('nasionalisme') || fullText.includes('chauvinisme') || fullText.includes('kebangsaan') || fullText.includes('sumpah pemuda') || fullText.includes('identitas nasional') || fullText.includes('budi utomo') || fullText.includes('pahlawan')) {
            return { subtest: sub, topic: 'Nasionalisme' };
        }
        if (fullText.includes('bahasa indonesia') || fullText.includes('ejaan') || fullText.includes('eyd') || fullText.includes('puebi') || fullText.includes('kalimat efektif') || fullText.includes('konjungsi') || fullText.includes('paragraf') || fullText.includes('ide pokok') || fullText.includes('kata baku')) {
            return { subtest: sub, topic: 'Bahasa Indonesia' };
        }
        if (fullText.includes('pancasila') || fullText.includes('uud 1945') || fullText.includes('nkri') || fullText.includes('bhinneka') || fullText.includes('pasal ') || fullText.includes('amandemen') || fullText.includes('bpupki') || fullText.includes('ppki') || fullText.includes('pilar')) {
            return { subtest: sub, topic: 'Pilar Negara' };
        }
        return { subtest: sub, topic: 'Pilar Negara & Konstitusi' };
    }

    if (rawSubtest.includes('TIU') || (!rawSubtest && (fullText.includes('silogisme') || fullText.includes('deret') || fullText.includes('analogi') || fullText.includes('figural')))) {
        const sub = 'TIU';
        if (fullText.includes('silogisme') || fullText.includes('premis') || fullText.includes('kesimpulan yang tepat') || (fullText.includes('semua ') && fullText.includes('beberapa'))) {
            return { subtest: sub, topic: 'Silogisme / Penarikan Kesimpulan' };
        }
        if (fullText.includes('analogi') || fullText.includes('padanan') || fullText.includes('kata') || (q.content.includes(':') && q.content.length < 100)) {
            return { subtest: sub, topic: 'Analogi Kata' };
        }
        if (fullText.includes('urutan') || fullText.includes('posisi duduk') || fullText.includes('jadwal') || fullText.includes('analitis') || fullText.includes('sebelah')) {
            return { subtest: sub, topic: 'Penalaran Analitis' };
        }
        if (fullText.includes('deret') || fullText.includes('pola angka') || fullText.includes('barisan') || fullText.match(/\d+,\s*\d+,\s*\d+/)) {
            return { subtest: sub, topic: 'Deret Angka' };
        }
        if (fullText.includes('figural') || fullText.includes('gambar') || fullText.includes('rotasi') || fullText.includes('pencerminan') || fullText.includes('ketidaksamaan') || fullText.includes('svg')) {
            return { subtest: sub, topic: 'Kemampuan Figural' };
        }
        if (fullText.includes('kecepatan') || fullText.includes('perbandingan') || fullText.includes('pekerja') || fullText.includes('debit') || fullText.includes('skala') || fullText.includes('jarak')) {
            return { subtest: sub, topic: 'Perbandingan Kuantitatif' };
        }
        if (fullText.includes('untung') || fullText.includes('rugi') || fullText.includes('diskon') || fullText.includes('bunga') || fullText.includes('persen')) {
            return { subtest: sub, topic: 'Aritmetika Sosial & Cerita' };
        }
        if (fullText.includes('pecahan') || fullText.includes('aljabar') || fullText.includes('hitung') || fullText.includes('operasi') || fullText.includes('numerik')) {
            return { subtest: sub, topic: 'Berhitung Cepat' };
        }
        return { subtest: sub, topic: 'Kemampuan Numerik & Logika' };
    }

    if (rawSubtest.includes('TKP') || (q.tkpPoints && q.tkpPoints.length > 0)) {
        const sub = 'TKP';
        if (fullText.includes('pelayanan') || fullText.includes('masyarakat') || fullText.includes('antrean') || fullText.includes('komplain') || fullText.includes('keluhan') || fullText.includes('publik')) {
            return { subtest: sub, topic: 'Pelayanan Publik' };
        }
        if (fullText.includes('jejaring') || fullText.includes('rekan kerja') || fullText.includes('kolaborasi') || fullText.includes('mitra') || fullText.includes('tim') || fullText.includes('teman')) {
            return { subtest: sub, topic: 'Jejaring Kerja' };
        }
        if (fullText.includes('sosial budaya') || fullText.includes('toleransi') || fullText.includes('keberagaman') || fullText.includes('adaptasi') || fullText.includes('suku') || fullText.includes('budaya') || fullText.includes('adat')) {
            return { subtest: sub, topic: 'Sosial Budaya' };
        }
        if (fullText.includes('tik') || fullText.includes('teknologi') || fullText.includes('digital') || fullText.includes('komputer') || fullText.includes('aplikasi') || fullText.includes('sistem') || fullText.includes('internet')) {
            return { subtest: sub, topic: 'Teknologi Informasi (TIK)' };
        }
        if (fullText.includes('radikalisme') || fullText.includes('anti radikalisme') || fullText.includes('ekstrimisme') || (fullText.includes('pancasila') && fullText.includes('ideologi'))) {
            return { subtest: sub, topic: 'Anti Radikalisme' };
        }
        if (fullText.includes('profesionalisme') || fullText.includes('tanggung jawab') || fullText.includes('tugas') || fullText.includes('kerja') || fullText.includes('profesional')) {
            return { subtest: sub, topic: 'Profesionalisme' };
        }
        return { subtest: sub, topic: 'Karakteristik Pribadi (Lainnya)' };
    }

    return { subtest: rawSubtest || 'Lainnya', topic: q.metadata?.topic || 'Umum' };
}`;

// I need to replace the entire `detectQuestionTopic` function in `src/utils/performanceAnalytics.ts`
const startIdx = code.indexOf('// Deteksi Topik & Materi Soal secara Cerdas');
const nextExportIdx = code.indexOf('export function', startIdx + 100);

if (startIdx !== -1) {
    if (nextExportIdx !== -1) {
        code = code.substring(0, startIdx) + replaceFn + '\n\n' + code.substring(nextExportIdx);
    } else {
        code = code.substring(0, startIdx) + replaceFn + '\n';
    }
    fs.writeFileSync('src/utils/performanceAnalytics.ts', code);
    console.log("Patched detectQuestionTopic successfully.");
} else {
    console.log("Could not find detectQuestionTopic.");
}
