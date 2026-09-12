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

// Deteksi Topik & Materi Soal secara Cerdas
export function detectQuestionTopic(q: Question): { subtest: string; topic: string } {
    const rawSubtest = (q.metadata?.subtest || '').toUpperCase();
    const rawTopic = (q.metadata?.topic || '').trim();
    const content = (q.content || '').toLowerCase();
    const explanation = (q.explanation || '').toLowerCase();
    const fullText = `${content} ${explanation}`;

    // 1. Cek Kategori SKD
    if (rawSubtest.includes('TWK') || (!rawSubtest && (fullText.includes('pancasila') || fullText.includes('uud 1945') || fullText.includes('bela negara') || fullText.includes('integritas')))) {
        const sub = 'TWK';
        if (rawTopic) return { subtest: sub, topic: rawTopic };

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
        if (fullText.includes('pancasila') || fullText.includes('uud 1945') || fullText.includes('nkri') || fullText.includes('bhinneka') || fullText.includes('pasal ') || fullText.includes('amandemen') || fullText.includes('bpupki') || fullText.includes('ppki')) {
            return { subtest: sub, topic: 'Pilar Negara' };
        }
        return { subtest: sub, topic: 'Pilar Negara & Konstitusi' };
    }

    if (rawSubtest.includes('TIU') || (!rawSubtest && (fullText.includes('silogisme') || fullText.includes('deret') || fullText.includes('analogi') || fullText.includes('figural')))) {
        const sub = 'TIU';
        if (rawTopic) return { subtest: sub, topic: rawTopic };

        if (fullText.includes('silogisme') || fullText.includes('premis') || fullText.includes('kesimpulan yang tepat') || fullText.includes('semua ') && fullText.includes('beberapa')) {
            return { subtest: sub, topic: 'Silogisme / Penarikan Kesimpulan' };
        }
        if (fullText.includes('analogi') || fullText.includes('padanan') || (q.content.includes(':') && q.content.length < 100)) {
            return { subtest: sub, topic: 'Analogi Kata' };
        }
        if (fullText.includes('urutan') || fullText.includes('posisi duduk') || fullText.includes('jadwal') || fullText.includes('analitis')) {
            return { subtest: sub, topic: 'Penalaran Analitis' };
        }
        if (fullText.includes('deret') || fullText.includes('pola angka') || fullText.includes('barisan') || fullText.match(/\d+,\s*\d+,\s*\d+/)) {
            return { subtest: sub, topic: 'Deret Angka' };
        }
        if (fullText.includes('figural') || fullText.includes('gambar') || fullText.includes('rotasi') || fullText.includes('pencerminan') || fullText.includes('ketidaksamaan')) {
            return { subtest: sub, topic: 'Kemampuan Figural' };
        }
        if (fullText.includes('kecepatan') || fullText.includes('perbandingan') || fullText.includes('pekerja') || fullText.includes('debit') || fullText.includes('skala')) {
            return { subtest: sub, topic: 'Perbandingan Kuantitatif' };
        }
        if (fullText.includes('untung') || fullText.includes('rugi') || fullText.includes('diskon') || fullText.includes('bunga') || fullText.includes('persen')) {
            return { subtest: sub, topic: 'Aritmetika Sosial & Cerita' };
        }
        if (fullText.includes('pecahan') || fullText.includes('aljabar') || fullText.includes('hitung') || fullText.includes('operasi')) {
            return { subtest: sub, topic: 'Berhitung Cepat' };
        }
        return { subtest: sub, topic: 'Kemampuan Numerik & Logika' };
    }

    if (rawSubtest.includes('TKP') || (q.tkpPoints && q.tkpPoints.length > 0)) {
        const sub = 'TKP';
        if (rawTopic) return { subtest: sub, topic: rawTopic };

        if (fullText.includes('pelayanan') || fullText.includes('masyarakat') || fullText.includes('antrean') || fullText.includes('komplain') || fullText.includes('keluhan')) {
            return { subtest: sub, topic: 'Pelayanan Publik' };
        }
        if (fullText.includes('jejaring') || fullText.includes('rekan kerja') || fullText.includes('kolaborasi') || fullText.includes('mitra') || fullText.includes('tim')) {
            return { subtest: sub, topic: 'Jejaring Kerja' };
        }
        if (fullText.includes('sosial budaya') || fullText.includes('toleransi') || fullText.includes('keberagaman') || fullText.includes('adaptasi') || fullText.includes('suku')) {
            return { subtest: sub, topic: 'Sosial Budaya' };
        }
        if (fullText.includes('tik') || fullText.includes('teknologi') || fullText.includes('digital') || fullText.includes('komputer') || fullText.includes('aplikasi') || fullText.includes('sistem')) {
            return { subtest: sub, topic: 'Teknologi Informasi (TIK)' };
        }
        if (fullText.includes('radikalisme') || fullText.includes('anti radikalisme') || fullText.includes('ekstrimisme') || fullText.includes('pancasila') && fullText.includes('ideologi')) {
            return { subtest: sub, topic: 'Anti Radikalisme' };
        }
        if (fullText.includes('profesional') || fullText.includes('disiplin') || fullText.includes('tanggung jawab') || fullText.includes('deadline') || fullText.includes('lembur')) {
            return { subtest: sub, topic: 'Profesionalisme' };
        }
        return { subtest: sub, topic: 'Integritas & Sikap Kerja' };
    }

    // UTBK / Kategori Lainnya
    const subName = rawSubtest || 'Umum';
    const topicName = rawTopic || 'Materi Inti';
    return { subtest: subName, topic: topicName };
}

// Rekomendasi Tindak Lanjut Spesifik per Topik
function getTopicRecommendation(topic: string, isCritical: boolean): string {
    const t = topic.toLowerCase();
    if (t.includes('integritas')) {
        return isCritical 
            ? 'Perbanyak studi kasus penolakan gratifikasi, benturan kepentingan ASN, dan kode etik perilaku antikorupsi KPK.'
            : 'Pertahankan pemahaman nilai antikorupsi; perhatikan detail skenario penugasan yang rentan suap terselubung.';
    }
    if (t.includes('bela negara')) {
        return isCritical
            ? 'Kaji ulang 5 nilai dasar Bela Negara (cinta tanah air, sadar berbangsa, setia Pancasila, rela berkorban, kemampuan awal).'
            : 'Fokuskan latihan pada pemilahan aksi nyata bela negara di era modern (non-militer).';
    }
    if (t.includes('nasionalisme')) {
        return isCritical
            ? 'Pelajari garis waktu perjuangan kemerdekaan (Budi Utomo, Sumpah Pemuda, BPUPKI) dan pencegahan chauvinisme.'
            : 'Tingkatkan pemahaman penerapan persatuan nasional dalam masyarakat majemuk.';
    }
    if (t.includes('pilar negara')) {
        return isCritical
            ? 'Hafalkan pasal krusial UUD 1945 (HAM, Lembaga Negara, Pendidikan) dan butir-butir implementasi Pancasila.'
            : 'Latih soal penalaran yuridis konstitusional dan perbandingan pasal amandemen I-IV.';
    }
    if (t.includes('bahasa indonesia')) {
        return isCritical
            ? 'Kuasai kaidah EYD V (huruf kapital, tanda baca titik dua/koma), kalimat efektif, dan gagasan utama paragraf.'
            : 'Percepat pemindaian ide pokok bacaan panjang dan perhatikan kata serapan baku.';
    }
    if (t.includes('silogisme')) {
        return isCritical
            ? 'Kuasai rumus penarikan kesimpulan: Modus Ponens/Tollens, Silogisme Hipotetis, dan aturan kata "Semua" vs "Sebagian".'
            : 'Tingkatkan kecepatan analisis diagram relasi premis negatif dan partikular.';
    }
    if (t.includes('deret')) {
        return isCritical
            ? 'Latih pola deret bertingkat, larik lompat 2/3 angka, pola Fibonacci, dan pola beda kuadrat/kubik.'
            : 'Gunakan eliminasi cepat: periksa selisih dua suku pertama untuk mendeteksi pola perkalian atau penjumlahan.';
    }
    if (t.includes('figural')) {
        return isCritical
            ? 'Latih arah putaran sudut (45°, 90°, 180°), penambahan/pengurangan elemen, dan logika pencerminan/simetri lipat.'
            : 'Asah ketelitian pada elemen kecil seperti arsir, ketebalan garis, dan titik orientasi.';
    }
    if (t.includes('pelayanan publik')) {
        return isCritical
            ? 'Pilih opsi yang menempatkan kepentingan pengguna layanan di atas kepentingan pribadi dengan ramah & tuntas.'
            : 'Cari solusi yang sistematis dan tidak melanggar SOP pelayanan umum.';
    }
    if (t.includes('jejaring kerja')) {
        return isCritical
            ? 'Pilih opsi terbuka terhadap masukan, kooperatif dalam tim, dan proaktif menjembatani koordinasi.'
            : 'Perhatikan keseimbangan antara empati dan pencapaian target tim.';
    }
    if (t.includes('tik') || t.includes('teknologi')) {
        return isCritical
            ? 'Utamakan sikap adaptif terhadap digitalisasi sistem, efisiensi kerja melalui otomasi, dan keamanan data.'
            : 'Dukung transformasi digital di tempat kerja secara proaktif.';
    }
    if (t.includes('anti radikalisme')) {
        return isCritical
            ? 'Pilih sikap tegas menolak paham intoleran, lapor kepada pimpinan/pihak berwenang sesuai prosedur hukum.'
            : 'Terapkan dialog persuasif berlandaskan wawasan kebangsaan yang inklusif.';
    }
    return isCritical
        ? 'Pelajari kembali konsep dasar materi ini dan perbanyak latihan soal bertingkat medium hingga HOTS.'
        : 'Pertahankan akurasi dan latih kecepatan pengerjaan per soal.';
}

// Evaluasi Komprehensif Sesi Ujian
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
