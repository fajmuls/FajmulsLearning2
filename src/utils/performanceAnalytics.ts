import { Question, TestHistoryItem, UserAnswer } from '../../types';

export interface TopicPerformance {
    subtest: string;
    topic: string;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    unansweredCount: number;
    scoreEarned: number;
    maxScore: number;
    accuracyPercent: number;
    status: 'CRITICAL' | 'WARNING' | 'GOOD';
    statusLabel: string;
    recommendation: string;
}

export interface SubtestSummary {
    subtestName: string;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    scoreEarned: number;
    maxScore: number;
    accuracyPercent: number;
    topics: TopicPerformance[];
}

export interface SessionDiagnostic {
    hasQuestions: boolean;
    subtestSummaries: SubtestSummary[];
    criticalWeaknesses: TopicPerformance[];
    warningTopics: TopicPerformance[];
    strongestTopics: TopicPerformance[];
    overallAccuracy: number;
    totalScore: number;
    diagnosticMessage: string;
}

// Deteksi Topik & Materi Soal secara Cerdas sesuai Standar BKN
export function detectQuestionTopic(q: Question): { subtest: string; topic: string } {
    const rawSubtest = (q.metadata?.subtest || '').toUpperCase();
    const rawTopic = (q.metadata?.topic || '').trim().toLowerCase();
    const content = (q.content || '').toLowerCase();
    const explanation = (q.explanation || '').toLowerCase();
    const fullText = `${content} ${explanation} ${rawTopic} ${rawSubtest}`;

    // 1. Cek Kategori TWK
    if (rawSubtest.includes('TWK') || (!rawSubtest && (fullText.includes('pancasila') || fullText.includes('uud 1945') || fullText.includes('bela negara') || fullText.includes('integritas')))) {
        const sub = 'TWK';
        if (fullText.includes('nasionalisme') || fullText.includes('chauvinisme') || fullText.includes('kebangsaan') || fullText.includes('sumpah pemuda') || fullText.includes('identitas nasional') || fullText.includes('toleransi')) {
            return { subtest: sub, topic: 'Nasionalisme' };
        }
        if (fullText.includes('integritas') || fullText.includes('korupsi') || fullText.includes('kejujuran') || fullText.includes('gratifikasi') || fullText.includes('suap') || fullText.includes('kode etik') || fullText.includes('kpk')) {
            return { subtest: sub, topic: 'Integritas' };
        }
        if (fullText.includes('bela negara') || fullText.includes('cinta tanah air') || fullText.includes('ancaman militer') || fullText.includes('patriotisme') || fullText.includes('sejarah') || fullText.includes('agresi') || fullText.includes('tokoh')) {
            return { subtest: sub, topic: 'Bela Negara' };
        }
        if (fullText.includes('bahasa indonesia') || fullText.includes('bahasa') || fullText.includes('ejaan') || fullText.includes('eyd') || fullText.includes('puebi') || fullText.includes('kalimat efektif') || fullText.includes('ide pokok') || fullText.includes('kata baku')) {
            return { subtest: sub, topic: 'Bahasa Indonesia' };
        }
        return { subtest: sub, topic: 'Pilar Negara' };
    }

    // 2. Cek Kategori TIU (Verbal, Numerik, Figural)
    if (rawSubtest.includes('TIU') || (!rawSubtest && (fullText.includes('silogisme') || fullText.includes('deret') || fullText.includes('analogi') || fullText.includes('figural')))) {
        const sub = 'TIU';
        if (fullText.includes('figural') || fullText.includes('gambar') || fullText.includes('rotasi') || fullText.includes('pencerminan') || fullText.includes('ketidaksamaan') || fullText.includes('svg') || fullText.includes('9 kotak') || fullText.includes('matriks')) {
            return { subtest: sub, topic: 'Figural' };
        }
        if (fullText.includes('numerik') || fullText.includes('hitung') || fullText.includes('deret') || fullText.includes('perbandingan') || fullText.includes('aritmatika') || fullText.includes('aritmetika') || fullText.includes('kecepatan') || fullText.includes('diskon') || fullText.includes('tabel') || fullText.includes('kuantitatif') || fullText.includes('data sufficiency')) {
            return { subtest: sub, topic: 'Numerik' };
        }
        return { subtest: sub, topic: 'Verbal' };
    }

    // 3. Cek Kategori TKP (Pelayanan Publik, Jejaring Kerja, Sosial Budaya, TIK, Profesionalisme, Anti-Radikalisme)
    if (rawSubtest.includes('TKP') || (q.tkpPoints && q.tkpPoints.length > 0)) {
        const sub = 'TKP';
        if (fullText.includes('pelayanan') || fullText.includes('masyarakat') || fullText.includes('antrean') || fullText.includes('komplain') || fullText.includes('keluhan') || fullText.includes('publik')) {
            return { subtest: sub, topic: 'Pelayanan Publik' };
        }
        if (fullText.includes('jejaring') || fullText.includes('networking') || fullText.includes('rekan kerja') || fullText.includes('kolaborasi') || fullText.includes('mitra') || fullText.includes('tim')) {
            return { subtest: sub, topic: 'Jejaring Kerja (Networking)' };
        }
        if (fullText.includes('sosial budaya') || fullText.includes('toleransi') || fullText.includes('keberagaman') || fullText.includes('adaptasi') || fullText.includes('suku') || fullText.includes('budaya') || fullText.includes('adat')) {
            return { subtest: sub, topic: 'Sosial Budaya' };
        }
        if (fullText.includes('tik') || fullText.includes('teknologi') || fullText.includes('digital') || fullText.includes('komputer') || fullText.includes('aplikasi') || fullText.includes('ai') || fullText.includes('internet')) {
            return { subtest: sub, topic: 'TIK' };
        }
        if (fullText.includes('radikalisme') || fullText.includes('anti radikalisme') || fullText.includes('ekstrimisme') || fullText.includes('intoleran')) {
            return { subtest: sub, topic: 'Anti-Radikalisme' };
        }
        return { subtest: sub, topic: 'Profesionalisme' };
    }

    return { subtest: rawSubtest || 'Lainnya', topic: q.metadata?.topic || 'Umum' };
}

export function analyzeSessionWeaknesses(item: TestHistoryItem): SessionDiagnostic {
    const questions = item.questions || [];
    const answers = item.answers || [];

    if (questions.length === 0) {
        return {
            hasQuestions: false,
            subtestSummaries: [],
            criticalWeaknesses: [],
            warningTopics: [],
            strongestTopics: [],
            overallAccuracy: 0,
            totalScore: item.score || 0,
            diagnosticMessage: 'Rincian soal tidak tersimpan pada sesi ini.'
        };
    }

    const answerMap = new Map<string, UserAnswer>();
    answers.forEach(a => answerMap.set(a.questionId, a));

    // Kelompokkan per subtest dan topic
    const subtestMap = new Map<string, Map<string, {
        total: number;
        correct: number;
        wrong: number;
        unanswered: number;
        scoreEarned: number;
        maxScore: number;
    }>>();

    questions.forEach(q => {
        const { subtest, topic } = detectQuestionTopic(q);
        const ans = answerMap.get(q.id);

        if (!subtestMap.has(subtest)) {
            subtestMap.set(subtest, new Map());
        }
        const topicMap = subtestMap.get(subtest)!;

        if (!topicMap.has(topic)) {
            topicMap.set(topic, {
                total: 0,
                correct: 0,
                wrong: 0,
                unanswered: 0,
                scoreEarned: 0,
                maxScore: 0
            });
        }
        const stats = topicMap.get(topic)!;
        stats.total += 1;

        const isTkp = (q.tkpPoints && q.tkpPoints.length > 0) || subtest === 'TKP';
        if (isTkp) {
            stats.maxScore += 5;
            if (ans) {
                const s = ans.scoreEarned ?? (ans.isCorrect ? 5 : 1);
                stats.scoreEarned += s;
                if (s >= 4) stats.correct += 1;
                else stats.wrong += 1;
            } else {
                stats.unanswered += 1;
            }
        } else {
            stats.maxScore += 5; // Standar bobot TWK/TIU
            if (ans) {
                if (ans.isCorrect) {
                    stats.correct += 1;
                    stats.scoreEarned += 5;
                } else {
                    stats.wrong += 1;
                }
            } else {
                stats.unanswered += 1;
            }
        }
    });

    const subtestSummaries: SubtestSummary[] = [];
    const allTopics: TopicPerformance[] = [];

    subtestMap.forEach((topicMap, subName) => {
        let subTotal = 0;
        let subCorrect = 0;
        let subWrong = 0;
        let subScore = 0;
        let subMaxScore = 0;
        const topicList: TopicPerformance[] = [];

        topicMap.forEach((stats, topicName) => {
            subTotal += stats.total;
            subCorrect += stats.correct;
            subWrong += stats.wrong;
            subScore += stats.scoreEarned;
            subMaxScore += stats.maxScore;

            const accuracyPercent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
            let status: 'CRITICAL' | 'WARNING' | 'GOOD' = 'WARNING';
            let statusLabel = 'Cukup';

            if (accuracyPercent < 65) {
                status = 'CRITICAL';
                statusLabel = 'Kritis (Perlu Pembenahan)';
            } else if (accuracyPercent >= 80) {
                status = 'GOOD';
                statusLabel = 'Kuasai (Sangat Baik)';
            }

            const rec = getTopicRecommendation(topicName, status === 'CRITICAL');

            const topicPerf: TopicPerformance = {
                subtest: subName,
                topic: topicName,
                totalQuestions: stats.total,
                correctCount: stats.correct,
                wrongCount: stats.wrong,
                unansweredCount: stats.unanswered,
                scoreEarned: stats.scoreEarned,
                maxScore: stats.maxScore,
                accuracyPercent,
                status,
                statusLabel,
                recommendation: rec
            };

            topicList.push(topicPerf);
            allTopics.push(topicPerf);
        });

        // Urutkan topik dari akurasi terendah
        topicList.sort((a, b) => a.accuracyPercent - b.accuracyPercent);

        const subAccuracy = subTotal > 0 ? Math.round((subCorrect / subTotal) * 100) : 0;
        subtestSummaries.push({
            subtestName: subName,
            totalQuestions: subTotal,
            correctCount: subCorrect,
            wrongCount: subWrong,
            scoreEarned: subScore,
            maxScore: subMaxScore,
            accuracyPercent: subAccuracy,
            topics: topicList
        });
    });

    // Urutkan subtest (misal TWK, TIU, TKP)
    const priorityOrder: Record<string, number> = { 'TWK': 1, 'TIU': 2, 'TKP': 3 };
    subtestSummaries.sort((a, b) => (priorityOrder[a.subtestName] || 99) - (priorityOrder[b.subtestName] || 99));

    const criticalWeaknesses = allTopics.filter(t => t.status === 'CRITICAL').sort((a, b) => a.accuracyPercent - b.accuracyPercent);
    const warningTopics = allTopics.filter(t => t.status === 'WARNING').sort((a, b) => a.accuracyPercent - b.accuracyPercent);
    const strongestTopics = allTopics.filter(t => t.status === 'GOOD').sort((a, b) => b.accuracyPercent - a.accuracyPercent);

    let totalCorrectOverall = 0;
    let totalQuestionsOverall = questions.length;
    answers.forEach(a => { if (a.isCorrect) totalCorrectOverall++; });
    const overallAccuracy = totalQuestionsOverall > 0 ? Math.round((totalCorrectOverall / totalQuestionsOverall) * 100) : 0;

    let diagnosticMessage = '';
    if (criticalWeaknesses.length > 0) {
        const topWeakNames = criticalWeaknesses.slice(0, 2).map(t => `${t.subtest} - ${t.topic} (${t.correctCount}/${t.totalQuestions})`).join(', ');
        diagnosticMessage = `Perlu perhatian mendesak pada materi: ${topWeakNames}. Prioritaskan pengulangan konsep dan pembahasan soal di topik tersebut.`;
    } else if (warningTopics.length > 0) {
        diagnosticMessage = `Pemahaman materi cukup solid. Tingkatkan konsistensi latihan untuk mendorong materi bernilai cukup menuju predikat kuasai.`;
    } else {
        diagnosticMessage = `Performa luar biasa! Semua topik dalam sesi ini berhasil dikuasai dengan akurasi di atas ambang aman (>= 80%).`;
    }

    return {
        hasQuestions: true,
        subtestSummaries,
        criticalWeaknesses,
        warningTopics,
        strongestTopics,
        overallAccuracy,
        totalScore: item.score || 0,
        diagnosticMessage
    };
}

// Analisis Kelemahan Akumulatif di Seluruh Riwayat
export function calculateCumulativeWeaknesses(history: TestHistoryItem[]): {
    weakestTopics: TopicPerformance[];
    strongestTopics: TopicPerformance[];
    totalEvaluatedSessions: number;
} {
    const topicAggregates = new Map<string, {
        subtest: string;
        topic: string;
        totalQuestions: number;
        correctCount: number;
        wrongCount: number;
        scoreEarned: number;
        maxScore: number;
    }>();

    let evaluatedCount = 0;

    history.forEach(item => {
        if (!item.questions || item.questions.length === 0) return;
        evaluatedCount++;

        const answerMap = new Map<string, UserAnswer>();
        (item.answers || []).forEach(a => answerMap.set(a.questionId, a));

        item.questions.forEach(q => {
            const { subtest, topic } = detectQuestionTopic(q);
            const key = `${subtest}:::${topic}`;
            if (!topicAggregates.has(key)) {
                topicAggregates.set(key, {
                    subtest,
                    topic,
                    totalQuestions: 0,
                    correctCount: 0,
                    wrongCount: 0,
                    scoreEarned: 0,
                    maxScore: 0
                });
            }

            const agg = topicAggregates.get(key)!;
            agg.totalQuestions += 1;

            const isTkp = (q.tkpPoints && q.tkpPoints.length > 0) || subtest === 'TKP';
            const ans = answerMap.get(q.id);
            if (isTkp) {
                agg.maxScore += 5;
                if (ans) {
                    const s = ans.scoreEarned ?? (ans.isCorrect ? 5 : 1);
                    agg.scoreEarned += s;
                    if (s >= 4) agg.correctCount += 1;
                    else agg.wrongCount += 1;
                }
            } else {
                agg.maxScore += 5;
                if (ans) {
                    if (ans.isCorrect) {
                        agg.correctCount += 1;
                        agg.scoreEarned += 5;
                    } else {
                        agg.wrongCount += 1;
                    }
                }
            }
        });
    });

    const topicPerformances: TopicPerformance[] = [];
    topicAggregates.forEach(agg => {
        if (agg.totalQuestions < 3) return; // Butuh minimal 3 soal untuk signifikansi data
        const accuracy = Math.round((agg.correctCount / agg.totalQuestions) * 100);
        let status: 'CRITICAL' | 'WARNING' | 'GOOD' = 'WARNING';
        let statusLabel = 'Cukup';

        if (accuracy < 65) {
            status = 'CRITICAL';
            statusLabel = 'Kritis (Perlu Perbaikan)';
        } else if (accuracy >= 80) {
            status = 'GOOD';
            statusLabel = 'Kuasai';
        }

        topicPerformances.push({
            subtest: agg.subtest,
            topic: agg.topic,
            totalQuestions: agg.totalQuestions,
            correctCount: agg.correctCount,
            wrongCount: agg.wrongCount,
            unansweredCount: 0,
            scoreEarned: agg.scoreEarned,
            maxScore: agg.maxScore,
            accuracyPercent: accuracy,
            status,
            statusLabel,
            recommendation: getTopicRecommendation(agg.topic, status === 'CRITICAL')
        });
    });

    topicPerformances.sort((a, b) => a.accuracyPercent - b.accuracyPercent);

    return {
        weakestTopics: topicPerformances.filter(t => t.status === 'CRITICAL' || t.accuracyPercent < 70).slice(0, 5),
        strongestTopics: topicPerformances.filter(t => t.accuracyPercent >= 80).slice(0, 5),
        totalEvaluatedSessions: evaluatedCount
    };
}

// Kalkulasi Moving Average (Rata-rata Bergerak) 5 atau 10 Sesi
export interface MovingAveragePoint {
    id: string;
    index: number;
    date: string;
    score: number;
    movingAvg: number;
    title: string;
}

export function calculateMovingAverageData(
    items: TestHistoryItem[],
    windowSize: number = 5
): {
    points: MovingAveragePoint[];
    currentMA: number;
    previousMA: number;
    trendDelta: number;
    trendPercent: number;
    trendDirection: 'UP' | 'DOWN' | 'STABLE';
} {
    // Urutkan kronologis dari sesi terlama ke sesi terbaru
    const sorted = [...items]
        .filter(item => typeof item.score === 'number' && !isNaN(item.score))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sorted.length === 0) {
        return {
            points: [],
            currentMA: 0,
            previousMA: 0,
            trendDelta: 0,
            trendPercent: 0,
            trendDirection: 'STABLE'
        };
    }

    const points: MovingAveragePoint[] = [];

    for (let i = 0; i < sorted.length; i++) {
        const item = sorted[i];
        const startIndex = Math.max(0, i - windowSize + 1);
        const windowSlice = sorted.slice(startIndex, i + 1);
        const windowSum = windowSlice.reduce((acc, curr) => acc + (curr.score || 0), 0);
        const movingAvg = Math.round((windowSum / windowSlice.length) * 10) / 10;

        points.push({
            id: item.id,
            index: i + 1,
            date: item.date,
            score: item.score || 0,
            movingAvg,
            title: item.packageTitle || item.category
        });
    }

    const currentMA = points[points.length - 1]?.movingAvg || 0;
    // Titik pembanding: titik sebelum window terakhir atau titik awal
    const compareIndex = Math.max(0, points.length - windowSize);
    const previousMA = points[compareIndex]?.movingAvg || points[0]?.movingAvg || 0;
    const trendDelta = Math.round((currentMA - previousMA) * 10) / 10;
    const trendPercent = previousMA > 0 ? Math.round((trendDelta / previousMA) * 1000) / 10 : 0;

    let trendDirection: 'UP' | 'DOWN' | 'STABLE' = 'STABLE';
    if (trendDelta >= 1) trendDirection = 'UP';
    else if (trendDelta <= -1) trendDirection = 'DOWN';

    return {
        points,
        currentMA,
        previousMA,
        trendDelta,
        trendPercent,
        trendDirection
    };
}

function getTopicRecommendation(topic: string, isCritical: boolean): string {
    if (!isCritical) return 'Pertahankan performa luar biasa ini. Teruslah berlatih!';
    const t = topic.toLowerCase();
    
    if (t.includes('integritas')) return 'Perbanyak baca studi kasus perilaku jujur & anti-korupsi di lingkungan kerja.';
    if (t.includes('bela negara')) return 'Pahami dasar hukum dan contoh nyata penerapan pilar negara dalam kehidupan sehari-hari.';
    if (t.includes('figural')) return 'Sering berlatih pola gambar 3x3 dan rotasi objek agar mata lebih peka.';
    if (t.includes('deret')) return 'Latihlah kepekaan pada deret fibonacci, larik ganda, dan pangkat berulang.';
    if (t.includes('pelayanan publik')) return 'Pilih opsi yang paling menguntungkan institusi dan masyarakat tanpa melanggar SOP.';
    if (t.includes('jejaring')) return 'Fokus pada opsi yang menekankan kolaborasi dan win-win solution.';
    if (t.includes('sosial budaya')) return 'Pilih opsi yang paling toleran, menghargai keberagaman, dan cepat beradaptasi di lingkungan baru.';
    if (t.includes('tik') || t.includes('teknologi')) return 'Pilih opsi yang adaptif memanfaatkan teknologi digital untuk efisiensi kerja tanpa takut perubahan.';
    if (t.includes('profesionalisme')) return 'Pilih opsi yang mengutamakan ketuntasan tugas, integritas, dan disiplin tinggi dalam segala kondisi.';
    if (t.includes('anti radikalisme')) return 'Pilih opsi yang menjunjung tinggi toleransi, moderasi, serta berani melaporkan atau menangkal paham radikal.';
    
    return 'Lakukan evaluasi ulang (review) pada soal-soal salah di topik ini dan pahami pembahasannya.';
}

// ----------------------------------------------------
// ANALISIS POLA JAWABAN TKP PER ASPEK (POIN 1-5)
// ----------------------------------------------------
export interface TkpAspectAnalysis {
    aspect: string;
    totalQuestions: number;
    scoreEarned: number;
    maxScore: number;
    averageScore: number;
    pointDistribution: {
        points5: number;
        points4: number;
        points3: number;
        points2: number;
        points1: number;
    };
    lowPointsCount: number; // Jumlah soal dengan skor 1, 2, atau 3
    highPointsCount: number; // Jumlah soal dengan skor 4 atau 5
    percentageOfMax: number;
    status: 'EXCELLENT' | 'ADEQUATE' | 'CRITICAL';
    statusLabel: string;
    criticalAlert: string | null;
    strategyTip: string;
    questionIndices: number[]; // Index asli dari array questions
    lowPointQuestionIndices: number[]; // Index soal yang mendapat poin 1-3
}

export interface TkpSessionAnalysis {
    hasTkpQuestions: boolean;
    totalTkpQuestions: number;
    totalTkpScore: number;
    maxPossibleTkpScore: number;
    overallAverageScore: number;
    overallPointDistribution: {
        points5: number;
        points4: number;
        points3: number;
        points2: number;
        points1: number;
    };
    aspects: TkpAspectAnalysis[];
    criticalAspects: TkpAspectAnalysis[];
    totalLowPoints: number;
    summaryMessage: string;
}

const TKP_ASPECT_TIPS: Record<string, string> = {
    'Pelayanan Publik': 'Kunci Poin 5: Utamakan kepuasan masyarakat/pelanggan secara ramah, cepat, dan tulus tanpa melanggar regulasi resmi atau mengorbankan integritas.',
    'Jejaring Kerja': 'Kunci Poin 5: Tunjukkan sikap terbuka menjalin kemitraan, kolaboratif, mendengarkan masukan tim, serta membangun relasi kerja yang positif dan produktif.',
    'Sosial Budaya': 'Kunci Poin 5: Tunjukkan sikap toleransi tinggi, tidak diskriminatif, menghargai keberagaman adat/suku/agama, dan cepat beradaptasi dengan budaya baru.',
    'Teknologi Informasi (TIK)': 'Kunci Poin 5: Bersikap antusias dan proaktif memanfaatkan teknologi serta sistem digital untuk mempercepat kerja dan meningkatkan efektivitas organisasi.',
    'Profesionalisme': 'Kunci Poin 5: Tuntaskan tugas tepat waktu dengan standar mutu tinggi, utamakan kepentingan kedinasan di atas urusan pribadi, dan patuhi SOP kerja.',
    'Anti Radikalisme': 'Kunci Poin 5: Junjung teguh ideologi Pancasila dan NKRI, bersikap moderat, serta berani mengambil sikap tegas jika ada indikasi paham intoleran/radikal.',
    'Karakteristik Pribadi (Lainnya)': 'Kunci Poin 5: Pilih tindakan yang paling solutif, tenang dalam tekanan, dan menunjukkan kedewasaan berpikir seorang aparatur negara.'
};

export function analyzeTkpSessionPatterns(item: TestHistoryItem): TkpSessionAnalysis {
    const questions = item.questions || [];
    const answers = item.answers || [];

    const answerMap = new Map<string, UserAnswer>();
    answers.forEach(a => answerMap.set(a.questionId, a));

    const overallDist = { points5: 0, points4: 0, points3: 0, points2: 0, points1: 0 };
    let totalScore = 0;
    let totalTkpCount = 0;

    const aspectMap = new Map<string, {
        total: number;
        score: number;
        dist: { points5: number; points4: number; points3: number; points2: number; points1: number };
        indices: number[];
        lowPointIndices: number[];
    }>();

    // Inisialisasi 6 Aspek Utama TKP agar urutan selalu konsisten
    const standardAspects = [
        'Pelayanan Publik',
        'Jejaring Kerja',
        'Sosial Budaya',
        'Teknologi Informasi (TIK)',
        'Profesionalisme',
        'Anti Radikalisme'
    ];

    questions.forEach((q, idx) => {
        const rawSubtest = (q.metadata?.subtest || '').toUpperCase();
        const hasTkpPoints = q.tkpPoints && q.tkpPoints.length > 0;
        const isTkp = rawSubtest.includes('TKP') || hasTkpPoints || item.category === 'SKD' && rawSubtest.includes('TKP');

        if (!isTkp) return;

        totalTkpCount += 1;
        const detected = detectQuestionTopic(q);
        const aspectName = detected.topic || 'Karakteristik Pribadi (Lainnya)';

        if (!aspectMap.has(aspectName)) {
            aspectMap.set(aspectName, {
                total: 0,
                score: 0,
                dist: { points5: 0, points4: 0, points3: 0, points2: 0, points1: 0 },
                indices: [],
                lowPointIndices: []
            });
        }

        const data = aspectMap.get(aspectName)!;
        data.total += 1;
        data.indices.push(idx);

        // Ambil poin yang diperoleh
        const ans = answerMap.get(q.id) || answers[idx];
        let earnedPoints = 1;

        if (ans) {
            if (typeof ans.scoreEarned === 'number' && ans.scoreEarned > 0) {
                earnedPoints = Math.min(5, Math.max(1, Math.round(ans.scoreEarned)));
            } else if (ans.selectedAnswer && q.tkpPoints && q.tkpPoints.length > 0) {
                // Cari dari array tkpPoints
                const normSelected = ans.selectedAnswer.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
                let matched = q.tkpPoints.find(tp => tp.option.trim().toLowerCase().replace(/[^a-z0-9]/gi, '') === normSelected);
                if (!matched && q.options) {
                    const optIdx = q.options.findIndex(o => o === ans.selectedAnswer);
                    if (optIdx !== -1 && q.tkpPoints[optIdx]) {
                        matched = q.tkpPoints[optIdx];
                    }
                }
                earnedPoints = matched ? Number(matched.points) : (ans.isCorrect ? 5 : 1);
            } else if (ans.isCorrect) {
                earnedPoints = 5;
            }
        }

        data.score += earnedPoints;
        totalScore += earnedPoints;

        // Distribusi poin
        if (earnedPoints === 5) { data.dist.points5++; overallDist.points5++; }
        else if (earnedPoints === 4) { data.dist.points4++; overallDist.points4++; }
        else if (earnedPoints === 3) { data.dist.points3++; overallDist.points3++; data.lowPointIndices.push(idx); }
        else if (earnedPoints === 2) { data.dist.points2++; overallDist.points2++; data.lowPointIndices.push(idx); }
        else { data.dist.points1++; overallDist.points1++; data.lowPointIndices.push(idx); }
    });

    if (totalTkpCount === 0) {
        return {
            hasTkpQuestions: false,
            totalTkpQuestions: 0,
            totalTkpScore: 0,
            maxPossibleTkpScore: 0,
            overallAverageScore: 0,
            overallPointDistribution: overallDist,
            aspects: [],
            criticalAspects: [],
            totalLowPoints: 0,
            summaryMessage: 'Tidak ada soal TKP pada sesi ini.'
        };
    }

    const aspects: TkpAspectAnalysis[] = [];
    const criticalAspects: TkpAspectAnalysis[] = [];
    let totalLowPoints = 0;

    aspectMap.forEach((data, aspectName) => {
        const averageScore = Math.round((data.score / data.total) * 10) / 10;
        const maxScore = data.total * 5;
        const percentageOfMax = Math.round((data.score / maxScore) * 100);
        const lowPointsCount = data.dist.points1 + data.dist.points2 + data.dist.points3;
        const highPointsCount = data.dist.points4 + data.dist.points5;
        totalLowPoints += lowPointsCount;

        let status: 'EXCELLENT' | 'ADEQUATE' | 'CRITICAL' = 'ADEQUATE';
        let statusLabel = 'Cukup (Standar)';
        let criticalAlert: string | null = null;

        if (averageScore >= 4.5 && lowPointsCount === 0) {
            status = 'EXCELLENT';
            statusLabel = 'Sangat Unggul ⭐';
        } else if (averageScore < 4.0 || lowPointsCount >= 2 || (data.total <= 2 && lowPointsCount >= 1)) {
            status = 'CRITICAL';
            statusLabel = 'Kritis (Banyak Poin 1-3) ⚠️';
            criticalAlert = `Terdapat ${lowPointsCount} dari ${data.total} soal pada aspek ini yang memperoleh poin 1–3. Pola pemikiran perlu disesuaikan dengan standar poin 5 kedinasan.`;
        }

        const strategyTip = TKP_ASPECT_TIPS[aspectName] || 'Pilih opsi yang paling solutif, proaktif, dan bertanggung jawab penuh.';

        const aspectAnalysis: TkpAspectAnalysis = {
            aspect: aspectName,
            totalQuestions: data.total,
            scoreEarned: data.score,
            maxScore,
            averageScore,
            pointDistribution: data.dist,
            lowPointsCount,
            highPointsCount,
            percentageOfMax,
            status,
            statusLabel,
            criticalAlert,
            strategyTip,
            questionIndices: data.indices,
            lowPointQuestionIndices: data.lowPointIndices
        };

        aspects.push(aspectAnalysis);
        if (status === 'CRITICAL') {
            criticalAspects.push(aspectAnalysis);
        }
    });

    // Urutkan aspek: aspek kritis paling atas, lalu skor terendah ke tertinggi
    aspects.sort((a, b) => {
        if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
        if (a.status !== 'CRITICAL' && b.status === 'CRITICAL') return 1;
        return a.averageScore - b.averageScore;
    });

    const overallAverageScore = Math.round((totalScore / totalTkpCount) * 100) / 100;
    const maxPossibleTkpScore = totalTkpCount * 5;

    let summaryMessage = '';
    if (criticalAspects.length > 0) {
        const criticalNames = criticalAspects.map(a => `${a.aspect} (Rata-rata ${a.averageScore})`).join(', ');
        summaryMessage = `Perlu perbaikan pola pikir pada aspek: ${criticalNames}. Ditemukan ${totalLowPoints} butir soal dengan perolehan poin 1–3 yang menurunkan skor total TKP.`;
    } else if (overallAverageScore >= 4.5) {
        summaryMessage = `Pola jawaban TKP Anda sangat tajam! Rata-rata perolehan mencapai ${overallAverageScore}/5.00 dengan konsistensi poin 4 dan 5 di seluruh aspek.`;
    } else {
        summaryMessage = `Pola jawaban TKP Anda sudah berada pada rentang aman (rata-rata ${overallAverageScore}/5.00). Tingkatkan beberapa butir bernilai 4 menjadi poin maksimal 5.`;
    }

    return {
        hasTkpQuestions: true,
        totalTkpQuestions: totalTkpCount,
        totalTkpScore: totalScore,
        maxPossibleTkpScore,
        overallAverageScore,
        overallPointDistribution: overallDist,
        aspects,
        criticalAspects,
        totalLowPoints,
        summaryMessage
    };
}

