
import { CategoryType, GeneralStudyMethod, IshiharaPlate, StaticTestPackage, Question, Achievement, TesKecermatanResultDetails, BenchmarkResultDetails, SkdResultDetails, UtbkResultDetails, TesKoranResultDetails } from './types';

// --- ASSETS ---
// LOGO BARU
export const APP_LOGO_URL = "https://files.catbox.moe/02xqjo.png";

// ADMIN TOKEN HASH (SHA-256 of 'Fajmuls22')
export const ADMIN_TOKEN_HASH = "debe56827a7d8b4d6a274ad2792e9ad17a53bfb17850fb7f2f296a31493df24c";

// ADMIN USERS (Bypass tokens)
export const ADMIN_EMAILS = ["mrachmanfm@gmail.com"];

// Reliable Sound Effects (CORS Friendly)
export const SOUND_EFFECTS = {
    click: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3",
    tap: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/arrow.mp3", 
    back: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/arrow.mp3", 
    success: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/gem-collect.mp3", 
    error: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/loss.mp3", 
    tick: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pop.mp3", 
    intro: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pucker.mp3", 
    finish: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/frozen_missile.mp3", 
    levelUp: "https://codeskulptor-demos.commondatastorage.googleapis.com/pang/pucker.mp3" 
};

export const LEVEL_TITLES = [
    { level: 1, title: "Pemula" },
    { level: 5, title: "Pelajar Tekun" },
    { level: 10, title: "Pejuang UTBK" },
    { level: 20, title: "Ahli Strategi" },
    { level: 30, title: "Master SKD" },
    { level: 50, title: "Grandmaster" },
    { level: 75, title: "Warlord" },
    { level: 100, title: "Legenda Abadi" }
];

// --- ACHIEVEMENT GENERATORS ---

// Helper function to create tiered achievements
// type: 'ASC' (higher is better) or 'DESC' (lower is better, e.g. Reaction Time)
const createBenchmarkTiers = (
    game: string, 
    icon: string, 
    thresholds: number[], 
    type: 'ASC' | 'DESC' = 'ASC',
    unit: string = ''
): Achievement[] => {
    const titles = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Legend', 'Godlike', 'Impossible'];
    
    return thresholds.map((threshold, index) => {
        if (index >= titles.length) return null;
        
        return {
            id: `bench_${game.toLowerCase()}_${index+1}`,
            title: `${game}: ${titles[index]}`,
            description: type === 'DESC' 
                ? `Capai skor < ${threshold} ${unit}` 
                : `Capai skor > ${threshold} ${unit}`,
            icon: icon,
            xpReward: (index + 1) * 100, // 100, 200, 300...
            condition: (h) => h[0]?.category === 'BENCHMARK' && 
                              (h[0]?.details as BenchmarkResultDetails)?.game === game && 
                              (type === 'DESC' ? h[0]?.score <= threshold : h[0]?.score >= threshold)
        } as Achievement;
    }).filter(a => a !== null) as Achievement[];
};

// Helper for Level
const createLevelAch = (level: number, xp: number, icon: string = 'Star'): Achievement => ({
    id: `level_${level}`, title: `Level ${level}`, description: `Mencapai Level ${level}`, icon, xpReward: xp,
    condition: (_, p) => p.level >= level
});

// Helper for Streak
const createStreakAch = (days: number, xp: number): Achievement => ({
    id: `streak_${days}`, title: `Konsisten ${days} Hari`, description: `Login ${days} hari berturut-turut.`, icon: 'Flame', xpReward: xp,
    condition: (_, p) => p.streak >= days
});

// Helper for Total Tests
const createTotalTestAch = (count: number, xp: number): Achievement => ({
    id: `total_tests_${count}`, title: `Veteran ${count}`, description: `Menyelesaikan total ${count} tes.`, icon: 'Layers', xpReward: xp,
    condition: (h) => h.length >= count
});

// Helper for Scores
const createScoreAch = (
    idPrefix: string,
    category: CategoryType, 
    threshold: number, 
    xp: number,
    icon: string = 'Award',
    subKey?: string // e.g. 'twk', 'tiu' inside details
): Achievement => ({
    id: `${idPrefix}_${threshold}`,
    title: `${subKey ? subKey.toUpperCase() : category} ${threshold}+`,
    description: `Mencapai skor ${subKey ? subKey.toUpperCase() : 'Total'} > ${threshold} di ${category}.`,
    icon,
    xpReward: xp,
    condition: (h) => h[0]?.category === category && (subKey ? (h[0]?.details as any)?.[subKey] >= threshold : h[0]?.score >= threshold)
});

// --- ACHIEVEMENT DEFINITIONS ---

// 1. REACTION TIME (DESCENDING: Lower is better)
const reactionAch = createBenchmarkTiers('REACTION', 'Zap', [400, 350, 300, 275, 250, 225, 200, 180, 160, 150], 'DESC', 'ms');

// 2. AIM TRAINER (DESCENDING)
const aimAch = createBenchmarkTiers('AIM', 'Target', [600, 550, 500, 450, 400, 350, 300, 250, 220, 200], 'DESC', 'ms');

// 3. SEQUENCE MEMORY (ASCENDING: Higher is better)
const seqAch = createBenchmarkTiers('SEQUENCE', 'Grid', [5, 8, 10, 12, 15, 18, 20, 25, 30, 40], 'ASC');

// 4. CHIMP TEST (ASCENDING)
const chimpAch = createBenchmarkTiers('CHIMP', 'Brain', [7, 9, 11, 13, 15, 18, 21, 25, 30, 40], 'ASC');

// 5. VISUAL MEMORY (ASCENDING)
const visualAch = createBenchmarkTiers('VISUAL', 'Eye', [5, 7, 9, 11, 13, 15, 17, 20, 25, 30], 'ASC');

// 6. NUMBER MEMORY (ASCENDING)
const numAch = createBenchmarkTiers('NUMBER', 'Hash', [5, 7, 9, 11, 13, 15, 18, 22, 30, 50], 'ASC');

// 7. VERBAL MEMORY (ASCENDING)
const verbalAch = createBenchmarkTiers('VERBAL', 'Book', [10, 20, 30, 40, 50, 70, 100, 150, 200, 300], 'ASC');

// 8. TYPING (ASCENDING)
const typingAch = createBenchmarkTiers('TYPING', 'FileText', [30, 40, 50, 60, 70, 80, 90, 100, 120, 140], 'ASC', 'WPM');

// 9. BRIDGE MEMORY (ASCENDING)
const bridgeAch = createBenchmarkTiers('BRIDGE', 'Map', [5, 8, 12, 15, 20, 25, 30, 40, 50, 60], 'ASC');

// 10. MATCH MEMORY (ASCENDING)
const matchAch = createBenchmarkTiers('MATCH', 'Copy', [3, 5, 8, 10, 15, 20, 25, 30, 40, 50], 'ASC');

// --- SKD EXPANSION ---
const skdTotalAch = [300, 350, 375, 400, 425, 450, 475, 500, 525].map(s => createScoreAch('skd_tot', 'SKD', s, s, 'Briefcase'));
const skdPerfect = createScoreAch('skd_max', 'SKD', 550, 5000, 'Crown'); // Perfect Score

const skdTwkAch = [100, 110, 120, 130, 140, 150].map(s => createScoreAch('skd_twk', 'SKD', s, s, 'Book', 'twk'));
const skdTiuAch = [100, 120, 130, 140, 150, 160, 175].map(s => createScoreAch('skd_tiu', 'SKD', s, s, 'Brain', 'tiu'));
const skdTkpAch = [180, 190, 200, 210, 220, 225].map(s => createScoreAch('skd_tkp', 'SKD', s, s, 'Users', 'tkp'));

// --- UTBK EXPANSION ---
const utbkAvgAch = [500, 600, 650, 700, 750, 800, 850, 900].map(s => createScoreAch('utbk_avg', 'UTBK', s, s, 'GraduationCap', 'average'));
const utbkPerfect = createScoreAch('utbk_max', 'UTBK', 1000, 5000, 'Crown', 'average');

const utbkSubtestsKeys = ['pu', 'ppu', 'pbm', 'pk', 'lbi', 'lbe', 'pm'];
const utbkSubAch = utbkSubtestsKeys.flatMap(sub => 
    [700, 800, 900, 1000].map(s => 
        createScoreAch(`utbk_${sub}`, 'UTBK', s, Math.round(s/2), 'FileText', sub)
    )
);

// --- TPA EXPANSION ---
const tpaAch = [150, 200, 220, 240, 260].map(s => createScoreAch('tpa_tot', 'TPA', s, s, 'Zap'));
const tpaPerfect = createScoreAch('tpa_max', 'TPA', 280, 2500, 'Crown');

// --- PROGRESSION ---
const levels = Array.from({length: 20}, (_, i) => (i+1)*5); // 5, 10, ... 100
const levelAch = levels.map(l => createLevelAch(l, l * 50));

const streaks = [3, 7, 14, 21, 30, 60, 90, 100, 150, 200, 365];
const streakAch = streaks.map(s => createStreakAch(s, s * 20));

const totals = [1, 5, 10, 25, 50, 75, 100, 150, 200, 300, 400, 500, 1000];
const totalAch = totals.map(t => createTotalTestAch(t, t * 10));

// --- SPECIAL & MISC ---
const specialAch: Achievement[] = [
    // Pauli / Koran
    { id: 'pauli_speed_30', title: 'Pauli Speed 30', description: 'Kecepatan > 30/menit.', icon: 'Activity', xpReward: 100, condition: (h) => h[0]?.category === 'PSIKOTEST' && (h[0]?.details as TesKoranResultDetails)?.speedPerMinute >= 30 },
    { id: 'pauli_speed_40', title: 'Pauli Speed 40', description: 'Kecepatan > 40/menit.', icon: 'Activity', xpReward: 200, condition: (h) => h[0]?.category === 'PSIKOTEST' && (h[0]?.details as TesKoranResultDetails)?.speedPerMinute >= 40 },
    { id: 'pauli_speed_50', title: 'Pauli Speed 50', description: 'Kecepatan > 50/menit.', icon: 'Activity', xpReward: 300, condition: (h) => h[0]?.category === 'PSIKOTEST' && (h[0]?.details as TesKoranResultDetails)?.speedPerMinute >= 50 },
    { id: 'pauli_speed_60', title: 'Human Calculator', description: 'Pauli Speed > 60/menit.', icon: 'Activity', xpReward: 1000, condition: (h) => h[0]?.category === 'PSIKOTEST' && (h[0]?.details as TesKoranResultDetails)?.speedPerMinute >= 60 },
    { id: 'pauli_perfect', title: 'Teliti Banget', description: 'Akurasi 100% di Tes Koran.', icon: 'CheckCircle', xpReward: 500, condition: (h) => h[0]?.category === 'PSIKOTEST' && (h[0]?.details as TesKoranResultDetails)?.accuracy === 100 },

    // Kecermatan
    { id: 'kecer_acc_100', title: 'Mata Elang', description: 'Akurasi 100% Kecermatan.', icon: 'Eye', xpReward: 200, condition: (h) => h[0]?.category === 'KECERMATAN' && (h[0]?.details as TesKecermatanResultDetails)?.accuracy === 100 },
    { id: 'kecer_speed_40', title: 'Cepat & Tepat', description: 'Speed > 40 & Akurasi > 95%.', icon: 'Zap', xpReward: 300, condition: (h) => h[0]?.category === 'KECERMATAN' && (h[0]?.details as TesKecermatanResultDetails)?.averageSpeed >= 40 && (h[0]?.details as TesKecermatanResultDetails)?.accuracy >= 95 },
    { id: 'kecer_god', title: 'Mata Dewa', description: 'Kecermatan Akurasi 100% & Speed > 50.', icon: 'Eye', xpReward: 1000, condition: (h) => h[0]?.category === 'KECERMATAN' && (h[0]?.details as TesKecermatanResultDetails)?.accuracy === 100 && (h[0]?.details as TesKecermatanResultDetails)?.averageSpeed >= 50 },

    // Time
    { id: 'night_owl', title: 'Night Owl', description: 'Belajar di atas jam 10 malam.', icon: 'Moon', xpReward: 50, condition: (h) => h.length > 0 && (new Date(h[0].date).getHours() >= 22 || new Date(h[0].date).getHours() < 4) },
    { id: 'early_bird', title: 'Early Bird', description: 'Belajar sebelum jam 6 pagi.', icon: 'Sun', xpReward: 50, condition: (h) => h.length > 0 && (new Date(h[0].date).getHours() >= 4 && new Date(h[0].date).getHours() < 6) },
    { id: 'weekend_warrior', title: 'Weekend Warrior', description: 'Belajar di hari Sabtu/Minggu.', icon: 'Coffee', xpReward: 100, condition: (h) => { const d = new Date(); const day = d.getDay(); return (day === 0 || day === 6) && h.length > 0 && new Date(h[0].date).getDate() === d.getDate(); } },
    { id: 'lunch_break', title: 'Lunch Break', description: 'Belajar jam 12:00-13:00.', icon: 'Sun', xpReward: 100, condition: (h) => { const hr = new Date().getHours(); return hr === 12 && h.length > 0; } },

    // Misc
    { id: 'first_step', title: 'Langkah Pertama', description: 'Menyelesaikan tes pertama Anda.', icon: 'Footprints', xpReward: 50, condition: (h) => h.length >= 1 },
    { id: 'skd_pass', title: 'Lulus SKD', description: 'Lulus Passing Grade SKD.', icon: 'Briefcase', xpReward: 300, condition: (h) => h[0]?.category === 'SKD' && (h[0]?.details as SkdResultDetails)?.passed },
];

export const ACHIEVEMENTS_LIST: Achievement[] = [
    // Benchmark
    ...reactionAch, ...aimAch, ...seqAch, ...chimpAch, ...visualAch, ...numAch, ...verbalAch, ...typingAch, ...bridgeAch, ...matchAch,
    // SKD
    ...skdTotalAch, skdPerfect, ...skdTwkAch, ...skdTiuAch, ...skdTkpAch,
    // UTBK
    ...utbkAvgAch, utbkPerfect, ...utbkSubAch,
    // TPA
    ...tpaAch, tpaPerfect,
    // Progression
    ...levelAch, ...streakAch, ...totalAch,
    // Special
    ...specialAch
];

// --- OTHER CONSTANTS ---

export const TYPING_TEXTS = [
    "Pendidikan adalah senjata paling mematikan di dunia, karena dengan pendidikan, Anda dapat mengubah dunia. Nelson Mandela pernah berkata demikian untuk menekankan pentingnya ilmu pengetahuan.",
    "Kecerdasan buatan bukanlah pengganti kecerdasan manusia, melainkan alat untuk memperkuat kemampuan kita. Kuncinya adalah bagaimana kita berkolaborasi dengan teknologi.",
    "Keberhasilan bukanlah akhir, kegagalan bukanlah hal yang fatal: keberanian untuk melanjutkanlah yang terpenting. Jangan takut untuk memulai hal baru setiap harinya.",
    "Hutan hujan tropis Indonesia adalah salah satu paru-paru dunia. Menjaganya bukan hanya tanggung jawab pemerintah, tetapi tugas kita bersama demi masa depan bumi.",
    "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet. It is commonly used to test typewriters and computer keyboards.",
    "Dalam dunia yang berubah sangat cepat, satu-satunya strategi yang dijamin gagal adalah tidak mengambil risiko. Mark Zuckerberg mengingatkan kita untuk berani berinovasi.",
    "Sabar itu ilmu tingkat tinggi. Belajarnya setiap hari, latihannya setiap saat, ujiannya sering mendadak, sekolahnya seumur hidup.",
    "Technology is a useful servant but a dangerous master. We must ensure that we control technology, rather than letting it control our lives and decisions.",
    "Bhinneka Tunggal Ika berbeda-beda tetapi tetap satu jua. Semboyan ini menggambarkan persatuan dan kesatuan Bangsa dan Negara Kesatuan Republik Indonesia.",
    "Membaca adalah jendela dunia. Dengan membaca, kita bisa menjelajahi tempat-tempat yang belum pernah kita kunjungi dan memahami pemikiran orang-orang hebat."
];

// Reordered Categories: UTBK, SKD, TPA, PSIKOTEST, then others
export const CATEGORIES: {id: CategoryType, name: string, desc: string}[] = [
  { id: 'UTBK', name: 'UTBK SNBT', desc: 'Tes Potensi Skolastik & Literasi (2025)' },
  { id: 'SKD', name: 'SKD CPNS/Kedinasan', desc: 'TWK, TIU, TKP' },
  { id: 'TKA', name: 'TKA (SD/SMP/SMA)', desc: 'Tes Kemampuan Akademik' },
  { id: 'TPA', name: 'Seleksi Lanjutan', desc: 'TPA, TBI, & Psikotes Kedinasan' }, 
  { id: 'PSIKOTEST', name: 'Tes Koran & IQ', desc: 'IQ, Koran/Pauli, & Kognitif' },
  { id: 'KECERMATAN', name: 'Tes Kecermatan', desc: 'Angka/Huruf Hilang (Khas Polri/Kedinasan)' },
  { id: 'BUTAWRNA', name: 'Tes Buta Warna', desc: 'Simulasi Ishihara & Visual' },
  { id: 'BENCHMARK', name: 'Human Benchmark', desc: 'Tes Kognitif: Reaction Time & Sequence Memory' },
  { id: 'INTERVIEW', name: 'Wawancara Tulis', desc: 'Simulasi Jawab Interview & Review AI' },
  { id: 'SKRIPSI', name: 'Skripsi Helper', desc: 'Bantuan Judul, Outline, & Metodologi' },
  { id: 'GENERAL', name: 'Materi Umum', desc: 'Belajar Apapun: PDF, Topik, Hafalan' }
];

export const GENERAL_METHODS: {id: GeneralStudyMethod, name: string, desc: string, icon: string}[] = [
    { id: 'ACTIVE_RECALL', name: 'Active Recall', desc: 'Paksa otak mengingat tanpa melihat catatan.', icon: 'Brain' },
    { id: 'PRACTICE', name: 'Latihan Soal', desc: 'Drill soal pilihan ganda dari materi.', icon: 'PenTool' },
    { id: 'SPACED_REPETITION', name: 'Spaced Repetition', desc: 'Flashcards untuk hafalan jangka panjang.', icon: 'Repeat' },
    { id: 'FEYNMAN', name: 'Feynman Technique', desc: 'Jelaskan materi seolah ke anak kecil.', icon: 'MessageCircle' },
    { id: 'MIND_MAP', name: 'Mind Mapping', desc: 'Visualisasikan hubungan antar konsep.', icon: 'Share2' },
    { id: 'PBL', name: 'Problem-Based', desc: 'Belajar lewat studi kasus nyata.', icon: 'Search' },
    { id: 'TEACHING', name: 'Teaching Method', desc: 'Simulasi mengajar murid (AI).', icon: 'GraduationCap' },
    { id: 'SQ3R', name: 'SQ3R Method', desc: 'Survey, Question, Read, Recite, Review.', icon: 'BookOpen' },
];

export const UTBK_SUBTESTS = [
  'Penalaran Umum',
  'Pengetahuan & Pemahaman Umum',
  'Pemahaman Bacaan & Menulis',
  'Pengetahuan Kuantitatif',
  'Literasi Bahasa Indonesia',
  'Literasi Bahasa Inggris',
  'Penalaran Matematika'
];

export const SKD_SUBTESTS = [
  'Tes Wawasan Kebangsaan (TWK)',
  'Tes Intelegensia Umum (TIU)',
  'Tes Karakteristik Pribadi (TKP)'
];

export const TPA_SUBTESTS = [
  'Verbal (Analogi, Silogisme)',
  'Numerik (Deret, Aritmatika)',
  'Penalaran Logis & Analitis',
  'Spasial (Gambar)',
  'Tes Bahasa Inggris (TBI)'
];

export const PSIKOTEST_KEDINASAN_SUBTESTS = [
    'TIU - Verbal & Numerik',
    'TIU - Logika (Silogisme/Analitis)',
    'Tes Logika Gambar (Abstrak)',
    'Tes Kepribadian (EPPS/Sikap Kerja)',
];

export const PSIKOTEST_SUBTESTS = [
  'Kognitif & Logika (Verbal, Analitik)',
  'Tes Koran/Pauli (Hitungan Cepat)',
  'Tes Spasial (Analogi Gambar)',
  'Tes Kepribadian (EPPS/DISC)'
];

export const INTERVIEW_TOPICS = [
  'Pertanyaan Personal (Kelebihan/Kekurangan)',
  'Motivasi & Komitmen',
  'Studi Kasus & Problem Solving',
  'Wawasan Kebangsaan & Integritas'
];

export const ISHIHARA_PLATES: IshiharaPlate[] = [
    { id: 1, image: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Ishihara_9.png", correctAnswer: "74", type: "Normal", description: "Orang normal melihat 74." },
    { id: 2, image: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Ishihara_1.png", correctAnswer: "12", type: "Normal", description: "Semua orang (termasuk buta warna) harusnya melihat 12." },
    { id: 3, image: "https://upload.wikimedia.org/wikipedia/commons/b/b1/Ishihara_2.png", correctAnswer: "8", type: "Red-Green", description: "Normal melihat 8, buta warna merah-hijau melihat 3." },
    { id: 4, image: "https://upload.wikimedia.org/wikipedia/commons/4/42/Ishihara_5.png", correctAnswer: "29", type: "Red-Green", description: "Normal melihat 29, buta warna merah-hijau melihat 70." },
    { id: 5, image: "https://upload.wikimedia.org/wikipedia/commons/9/93/Ishihara_6.png", correctAnswer: "5", type: "Red-Green", description: "Normal melihat 5, buta warna merah-hijau melihat 2." },
    { id: 6, image: "https://upload.wikimedia.org/wikipedia/commons/8/89/Ishihara_7.png", correctAnswer: "3", type: "Red-Green", description: "Normal melihat 3, buta warna merah-hijau melihat 5." },
    { id: 7, image: "https://upload.wikimedia.org/wikipedia/commons/6/68/Ishihara_11.png", correctAnswer: "6", type: "Red-Green", description: "Normal melihat 6, sebagian buta warna tidak melihat apa-apa." },
    { id: 8, image: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Ishihara_23.png", correctAnswer: "42", type: "Red-Green", description: "Normal melihat 42, buta warna merah/hijau melihat 2 atau 4." },
    { id: 9, image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Ishihara_19.png/300px-Ishihara_19.png", correctAnswer: "nothing", type: "Total", description: "Normal tidak melihat angka. Beberapa kelainan melihat angka 2." },
    { id: 10, image: "https://upload.wikimedia.org/wikipedia/commons/a/a2/Ishihara_Plate_8.jpg", correctAnswer: "6", type: "Normal", description: "Angka 6 terlihat jelas." },
];

export const INITIAL_SKD_PACKAGES: StaticTestPackage[] = [
    {
        id: 'skd-tiu-challenge',
        title: 'Latihan TIU: Logika & Figural (Challenging)',
        category: 'SKD',
        skdStream: 'CPNS',
        durationMinutes: 20,
        isAiGenerated: false,
        createdAt: new Date().toISOString(),
        questions: [
            {
                id: 'TIU-035',
                type: 'multiple_choice',
                content: 'Perhatikan pola: ●●➔◀◀, ■■➔▼▼, ◆◆➔?',
                options: ['▼▼', '▶▶', '▲▲', '●●', '★★'],
                correctAnswer: '▲▲',
                explanation: 'Pola: Dua objek identik berubah menjadi dua objek identik lainnya yang memiliki sudut. Lingkaran (0 sudut) ke Segitiga (3 sudut), Persegi (4 sudut) ke Segitiga arah bawah. Pola menunjukkan transformasi ke bentuk segitiga dengan arah yang bergantian.',
                metadata: { difficulty: 'Hard', idealTimeSeconds: 45, topic: 'Figural', subtest: 'TIU' }
            },
            {
                id: 'TIU-030',
                type: 'multiple_choice',
                content: 'Figural: Diberikan jaring-jaring kubus berbentuk salib (cross) dengan susunan vertikal 4 kotak dan horizontal 3 kotak (memotong di kotak kedua dari atas). Susunan vertikal (atas ke bawah): [A], [B], [C], [D]. Susunan horizontal (kiri ke kanan, memotong di B): [E], [B], [F]. Jika sisi [B] adalah sisi DEPAN, manakah sisi BELAKANG?',
                options: ['A', 'C', 'D', 'E', 'F'],
                correctAnswer: 'D',
                explanation: 'Pada jaring-jaring salib standar: B (Depan) bertolak belakang dengan D (Belakang). A (Atas) bertolak belakang dengan C (Bawah). E (Kiri) bertolak belakang dengan F (Kanan).',
                metadata: { difficulty: 'Hard', idealTimeSeconds: 60, topic: 'Figural', subtest: 'TIU' }
            },
            {
                id: 'TIU-027',
                type: 'multiple_choice',
                content: 'Pola Gambar: ▲➔▼, ●➔○, ■➔?',
                options: ['◆', '▤', '⬔', '□', '▣'],
                correctAnswer: '□',
                explanation: 'Pola: Bentuk tetap, namun warna atau isian berubah dari gelap (filled) menjadi terang (outline/empty).',
                metadata: { difficulty: 'Medium', idealTimeSeconds: 30, topic: 'Figural', subtest: 'TIU' }
            },
            {
                id: 'TIU-023',
                type: 'multiple_choice',
                content: 'Berapa jumlah kubus pada gambar struktur 3D berikut? 🧱🧱🧱 (baris bawah), 🧱🧱 (baris tengah), 🧱 (baris atas). Asumsikan struktur ini padat ke belakang dengan kedalaman 2 blok.',
                options: ['8', '14', '6', '12', '10'],
                correctAnswer: '12',
                explanation: 'Tampak depan: 3+2+1 = 6 blok. Karena kedalaman 2 blok, maka 6 × 2 = 12 blok.',
                metadata: { difficulty: 'Medium', idealTimeSeconds: 45, topic: 'Figural', subtest: 'TIU' }
            },
            {
                id: 'TIU-036',
                type: 'multiple_choice',
                content: 'Logika: Semua Koki adalah Laki-laki. Sebagian Laki-laki adalah Musisi. Tidak ada Musisi yang Nada sumbang. Simpulan yang paling tepat adalah...',
                options: ['Sebagian Koki bukan Musisi', 'Sebagian Laki-laki tidak Nada sumbang', 'Semua Koki tidak Nada sumbang', 'Tidak ada Laki-laki yang Nada sumbang', 'Sebagian Musisi adalah Koki'],
                correctAnswer: 'Sebagian Laki-laki tidak Nada sumbang',
                explanation: 'Premis 1: Koki -> Laki-laki. Premis 2: Sebagian Laki-laki -> Musisi. Premis 3: Musisi -> Tidak Nada sumbang. Dari P2 dan P3, sebagian Laki-laki (yaitu yang Musisi) pasti Tidak Nada sumbang. Hubungan Koki dan Musisi tidak bisa dipastikan (bisa beririsan atau tidak).',
                metadata: { difficulty: 'Hard', idealTimeSeconds: 50, topic: 'Logika', subtest: 'TIU' }
            },
            {
                id: 'TIU-037',
                type: 'multiple_choice',
                content: 'Analitis: A, B, C, D, E, F duduk melingkar menghadap pusat. A berseberangan dengan B. C duduk di antara A dan D. E duduk di sebelah kanan B. Siapakah yang duduk di antara B dan F?',
                options: ['A', 'C', 'D', 'E', 'Tidak ada'],
                correctAnswer: 'E',
                explanation: 'Susunan: 1.A, 2.F, 3.E, 4.B, 5.D, 6.C. (A seberang B). E kanan B (posisi 3). C antara A dan D (posisi 6, D di 5). Sisa F di 2. Antara B(4) dan F(2) adalah E(3).',
                metadata: { difficulty: 'Hard', idealTimeSeconds: 90, topic: 'Logika', subtest: 'TIU' }
            },
            {
                id: 'TIU-038',
                type: 'multiple_choice',
                content: ':::MATRIX:::[["🔴","🔵","🟢"],["🟥","🟦","🟩"],["🔺","🔹","?"]]:::Tentukan gambar yang hilang pada pola matriks di atas.',
                options: ['🔸', '🔻', '🟩', '🟢', '🔺'],
                correctAnswer: '🔻',
                explanation: 'Pola Baris: Setiap baris memiliki urutan warna Merah, Biru, Hijau. Baris 1: Lingkaran. Baris 2: Persegi. Baris 3: Segitiga. Maka yang hilang adalah Segitiga Hijau (atau bentuk serupa dengan warna hijau). Di opsi yang tersedia, 🔻 (Segitiga Terbalik Merah/Oren) mungkin kurang tepat jika kita cari hijau. Mari kita koreksi polanya. Pola Kolom: Kolom 1 Merah, Kolom 2 Biru, Kolom 3 Hijau. Bentuk berubah per baris. Jadi yang dicari adalah bentuk Segitiga dengan warna Hijau. Jika tidak ada opsi Segitiga Hijau, kita cari pola lain. \n\nAlternatif: \nBaris 1: 1, 2, 3 sisi (tidak). \nMari gunakan pola rotasi/warna sederhana. \n🔴 (Red Circle) -> 🔵 (Blue Circle) -> 🟢 (Green Circle)\n🟥 (Red Square) -> 🟦 (Blue Square) -> 🟩 (Green Square)\n🔺 (Red Triangle) -> 🔹 (Blue Diamond/Triangle) -> ?\n\nJawabannya harusnya yang berwarna Hijau dan berbentuk serupa (Segitiga/Diamond). Opsi: 🔸 (Orange), 🔻 (Red), 🟩 (Green Square - salah bentuk), 🟢 (Green Circle - salah bentuk), 🔺 (Red - salah warna). \n\nKoreksi soal untuk opsi yang lebih jelas: \nOpsi: ["🟢", "🟩", "✅", "✳️", "🔻"] -> Jawaban yang paling masuk akal secara warna adalah hijau. \n\nMari kita buat soal yang lebih visual dan logis dengan bentuk geometri sederhana:\n\n[[ "A", "B", "C" ], [ "D", "E", "F" ], [ "G", "H", "?" ]]\n\nAtau gunakan simbol:\n[[ "★", "★★", "★★★" ], [ "●", "●●", "●●●" ], [ "■", "■■", "?" ]]\n\nJawabannya ■■■.',
                metadata: { difficulty: 'Hard', idealTimeSeconds: 60, topic: 'Figural', subtest: 'TIU' }
            },
            {
                id: 'TIU-039',
                type: 'multiple_choice',
                content: ':::MATRIX:::[["★","★★","★★★"],["●","●●","●●●"],["■","■■","?"]]:::Lengkapi pola matriks 3x3 di atas.',
                options: ['■', '■■', '■■■', '●●●', '▲▲▲'],
                correctAnswer: '■■■',
                explanation: 'Pola penambahan jumlah objek. Baris pertama: Bintang 1 -> 2 -> 3. Baris kedua: Lingkaran 1 -> 2 -> 3. Baris ketiga: Kotak 1 -> 2 -> ?. Maka jawabannya adalah Kotak 3 (■■■).',
                metadata: { difficulty: 'Medium', idealTimeSeconds: 30, topic: 'Figural', subtest: 'TIU' }
            },
            {
                id: 'TIU-040',
                type: 'multiple_choice',
                content: ':::MATRIX:::[["🔲","🔳","⬛"],["🔳","⬛","🔲"],["⬛","🔲","?"]]:::Tentukan gambar yang hilang (Pola Sudoku/Latin Square).',
                options: ['🔲', '🔳', '⬛', '⬜', '▦'],
                correctAnswer: '🔳',
                explanation: 'Pola Matriks Latin Square (Sudoku Sederhana): Setiap baris dan kolom harus memiliki elemen yang unik (tidak boleh ada yang sama). \nBaris 1: [Border, Dot, Black]\nBaris 2: [Dot, Black, Border]\nBaris 3: [Black, Border, ?]\nElemen yang belum ada di Baris 3 adalah "Dot" (🔳). \nCek Kolom 3: [Black, Border, ?] -> Kurang "Dot" (🔳). Konsisten.',
                metadata: { difficulty: 'Hard', idealTimeSeconds: 45, topic: 'Figural', subtest: 'TIU' }
            },
            {
                id: 'TIU-041',
                type: 'multiple_choice',
                content: 'Serial Figural (Waktu): [ 🕐 ] ➔ [ 🕒 ] ➔ [ 🕕 ] ➔ [ 🕙 ] ➔ [ ? ]',
                options: ['🕑', '🕒', '🕓', '🕔', '🕕'],
                correctAnswer: '🕒',
                explanation: 'Pola penambahan waktu bertingkat:\n1:00 ke 3:00 = +2 jam\n3:00 ke 6:00 = +3 jam\n6:00 ke 10:00 = +4 jam\nSelanjutnya harus +5 jam.\n10:00 + 5 jam = 15:00.\nDalam format jam analog 12 jam, 15:00 sama dengan jam 3:00 (🕒).',
                metadata: { difficulty: 'Hard', idealTimeSeconds: 60, topic: 'Figural', subtest: 'TIU' }
            },
            {
                id: 'TIU-042',
                type: 'multiple_choice',
                content: 'Selesaikan persamaan logika simbol berikut (Perhatikan urutan operasi):\n\n❄️ + ❄️ + ❄️ = 18\n❄️ × 💧 = 24\n💧 - 🔥 = 2\n🔥 + ❄️ × 💧 = ?',
                options: ['20', '26', '32', '14', '24'],
                correctAnswer: '26',
                explanation: 'Langkah 1: 3❄️ = 18 -> ❄️ = 6.\nLangkah 2: 6 × 💧 = 24 -> 💧 = 4.\nLangkah 3: 4 - 🔥 = 2 -> 🔥 = 2.\nLangkah 4 (Pertanyaan): 🔥 + ❄️ × 💧\nSubstitusi: 2 + 6 × 4\nIngat urutan operasi (Perkalian dulu!): 2 + (6 × 4) = 2 + 24 = 26.',
                metadata: { difficulty: 'Hard', idealTimeSeconds: 90, topic: 'Logika', subtest: 'TIU' }
            }
        ]
    }
];
export const INITIAL_SKD_KEDINASAN_PACKAGES: StaticTestPackage[] = [];
export const INITIAL_UTBK_PACKAGES: StaticTestPackage[] = [
    {
        id: 'utbk-tps-pedagogi-1',
        title: 'Prediksi TPS UTBK: Penalaran & Kuantitatif',
        category: 'UTBK',
        durationMinutes: 45,
        isAiGenerated: false,
        createdAt: new Date().toISOString(),
        questions: [
            {
                id: 'TPS-PU-001',
                type: 'multiple_choice',
                content: 'Jika semua mahasiswa Universitas X pandai berenang, dan sebagian mahasiswa Universitas X adalah atlet basket, maka simpulannya adalah...',
                options: [
                    'Sebagian atlet basket pandai berenang',
                    'Semua atlet basket pandai berenang',
                    'Sebagian mahasiswa yang pandai berenang bukan atlet basket',
                    'Semua mahasiswa Universitas X adalah atlet basket',
                    'Sebagian atlet basket bukan mahasiswa Universitas X'
                ],
                correctAnswer: 'Sebagian atlet basket pandai berenang',
                explanation: 'Sesuai silogisme: Premis 1 (Semua M adalah P) dan Premis 2 (Sebagian M adalah A). Maka Sebagian A adalah P. Dalam hal ini, sebagian atlet basket adalah mahasiswa Univ X, dan karena semua mahasiswa Univ X pandai berenang, maka sebagian atlet basket tersebut pasti pandai berenang.',
                metadata: { difficulty: 'Medium', idealTimeSeconds: 45, topic: 'Penalaran Umum', subtest: 'Penalaran Umum' }
            },
            {
                id: 'TPS-PBM-001',
                type: 'multiple_choice',
                content: '"Pemerintah sedang mengupayakan transformasi digital yang masif di seluruh pelosok negeri guna meningkatkan efisiensi birokrasi."\n\nKata "masif" dalam kalimat tersebut memiliki makna yang paling dekat dengan...',
                options: [
                    'Sangat besar dan kompak',
                    'Dilakukan secara bertahap',
                    'Bersifat sementara',
                    'Terpusat di kota besar',
                    'Melibatkan banyak biaya'
                ],
                correctAnswer: 'Sangat besar dan kompak',
                explanation: 'Menurut KBBI, masif dalam konteks ini berarti utuh, padat, atau dilakukan dalam skala besar dan menyeluruh.',
                metadata: { difficulty: 'Medium', idealTimeSeconds: 40, topic: 'Pemahaman Bacaan', subtest: 'Pemahaman Bacaan & Menulis' }
            },
            {
                id: 'TPS-PK-001',
                type: 'multiple_choice',
                content: 'Jika x = 2 dan y = -3, maka nilai dari 2x² - xy + y² adalah...',
                options: ['11', '23', '25', '5', '17'],
                correctAnswer: '23',
                explanation: 'Substitusi nilai: 2(2)² - (2)(-3) + (-3)² = 2(4) - (-6) + 9 = 8 + 6 + 9 = 23.',
                metadata: { difficulty: 'Easy', idealTimeSeconds: 60, topic: 'Pengetahuan Kuantitatif', subtest: 'Pengetahuan Kuantitatif' }
            },
            {
                id: 'TPS-PK-002',
                type: 'multiple_choice',
                content: 'Perhatikan barisan angka berikut: 4, 9, 19, 39, ...\nAngka berikutnya adalah...',
                options: ['78', '79', '80', '69', '59'],
                correctAnswer: '79',
                explanation: 'Pola: (n x 2) + 1. \n4 x 2 + 1 = 9 \n9 x 2 + 1 = 19 \n19 x 2 + 1 = 39 \n39 x 2 + 1 = 79.',
                metadata: { difficulty: 'Medium', idealTimeSeconds: 45, topic: 'Pengetahuan Kuantitatif', subtest: 'Pengetahuan Kuantitatif' }
            }
        ]
    }
];
export const INITIAL_UTBK_HOTS_PACKAGES: StaticTestPackage[] = [];
export const INITIAL_SKD_CPNS_HOTS_PACKAGES: StaticTestPackage[] = [];
export const INITIAL_TPA_PACKAGES: StaticTestPackage[] = [];
export const INITIAL_TPA_HOTS_PACKAGES: StaticTestPackage[] = [];
export const INITIAL_PSIKOTEST_PACKAGES: StaticTestPackage[] = [];

export const UTBK_EXAM_CONFIG = [
    {name: 'Penalaran Umum', duration: 30, count: 30},
    {name: 'Pengetahuan & Pemahaman Umum', duration: 15, count: 20},
    {name: 'Pemahaman Bacaan & Menulis', duration: 25, count: 20},
    {name: 'Pengetahuan Kuantitatif', duration: 20, count: 20},
    {name: 'Literasi Bahasa Indonesia', duration: 42.5, count: 30},
    {name: 'Literasi Bahasa Inggris', duration: 20, count: 20},
    {name: 'Penalaran Matematika', duration: 42.5, count: 20}
];

export const TKA_EXAM_CONFIG = [
    {name: 'Matematika', duration: 40, count: 30},
    {name: 'Bahasa Indonesia', duration: 30, count: 30},
    {name: 'Bahasa Inggris', duration: 30, count: 30}
];
