import { CategoryType, Question, TestHistoryItem, UserAnswer } from '../../types';
import { detectQuestionTopic } from './performanceAnalytics';

export interface SubtestStat {
    subtestName: string;
    category: string;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    accuracyPercent: number;
    avgScore?: number;
    highestScore?: number;
    lowestScore?: number;
    avgTimeSeconds: number;
    topics: TopicStat[];
}

export interface TopicStat {
    topicName: string;
    subtestName: string;
    category: string;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    accuracyPercent: number;
    avgTimeSeconds: number;
    masteryStatus: 'KUASAI' | 'CUKUP' | 'KRITIS';
    recommendation: string;
}

export interface QuestionLevelStat {
    index: number;
    questionId: string;
    excerpt: string;
    subtest: string;
    topic: string;
    difficulty: string;
    isCorrect: boolean;
    scoreEarned: number;
    selectedAnswer: string;
    correctAnswer: string;
    timeTakenSeconds: number;
    isOverthinking: boolean;
    isDoubtful: boolean;
    isGuessing: boolean;
}

export interface PackageStats {
    packageKey: string;
    packageTitle: string;
    category: string;
    stream?: string;
    attemptCount: number;
    lastAttemptDate: string;
    highestScore: number;
    lowestScore: number;
    averageScore: number;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    accuracyPercent: number;
    totalTimeSeconds: number;
    subtests: SubtestStat[];
    topics: TopicStat[];
    questions: QuestionLevelStat[];
}

export interface CategoryStats {
    category: string;
    categoryLabel: string;
    totalSessions: number;
    totalQuestions: number;
    correctCount: number;
    wrongCount: number;
    accuracyPercent: number;
    highestScore: number;
    lowestScore: number;
    averageScore: number;
    passRatePercent: number;
    packagesCount: number;
    totalTimeSeconds: number;
    subtests: SubtestStat[];
    topics: TopicStat[];
}

export interface AccountGlobalStats {
    totalSessions: number;
    totalQuestionsAnswered: number;
    totalCorrect: number;
    totalWrong: number;
    overallAccuracy: number;
    highestScore: number;
    highestScoreDate?: string;
    lowestScore: number;
    averageScore: number;
    totalStudyTimeSeconds: number;
    avgTimePerQuestionSeconds: number;
    passRatePercent: number;
    passedSessionsCount: number;
    overthinkingQuestionsCount: number;
    doubtfulQuestionsCount: number;
    guessingQuestionsCount: number;
    categories: CategoryStats[];
    packages: PackageStats[];
    allSubtests: SubtestStat[];
    allTopicsRanked: TopicStat[];
    difficultyBreakdown: {
        difficulty: string;
        total: number;
        correct: number;
        accuracy: number;
    }[];
}

// Rekomendasi Cerdas berdasarkan Topik & Status
function generateTopicRecommendation(topic: string, status: 'KUASAI' | 'CUKUP' | 'KRITIS'): string {
    const t = topic.toLowerCase();
    if (status === 'KRITIS') {
        if (t.includes('integritas')) return 'Pelajari kembali prinsip antikorupsi, delik suap, gratifikasi, dan kode etik ASN.';
        if (t.includes('bela negara')) return 'Kaji ulang 5 nilai dasar Bela Negara dan penerapannya dalam kasus non-militer.';
        if (t.includes('silogisme')) return 'Latih rumus silogisme kategoris, penarikan kesimpulan berpremis "semua" dan "beberapa".';
        if (t.includes('deret')) return 'Latih pengenalan cepat pola deret aritmetika bertingkat, geometri, dan larik selang-seling.';
        if (t.includes('figural')) return 'Asah kepekaan rotasi 45°-90°, pencerminan simetri, dan perubahan pola elemen gambar.';
        if (t.includes('pelayanan publik')) return 'Pilih opsi yang selalu mendahulukan kepentingan masyarakat sesuai SOP dengan ramah & tuntas.';
        if (t.includes('kuantitatif') || t.includes('matematika')) return 'Kuasai konsep aljabar dasar, persamaan linear, perbandingan senilai/berbalik nilai.';
        if (t.includes('bacaan') || t.includes('literasi')) return 'Gunakan teknik skimming & scanning untuk menemukan ide pokok dan simpulan paragraf panjang.';
        return 'Pelajari kembali konsep dasar dan kerjakan 10-15 soal latihan bertahap pada materi ini.';
    } else if (status === 'CUKUP') {
        return 'Akurasi sudah lumayan, perbanyak latihan soal variasi HOTS untuk memperkuat intuisi.';
    }
    return 'Materi telah dikuasai dengan sangat baik! Pertahankan dan latih kecepatan pengerjaan.';
}

export function analyzeUserAccountLearning(history: TestHistoryItem[]): AccountGlobalStats {
    if (!history || history.length === 0) {
        return {
            totalSessions: 0,
            totalQuestionsAnswered: 0,
            totalCorrect: 0,
            totalWrong: 0,
            overallAccuracy: 0,
            highestScore: 0,
            lowestScore: 0,
            averageScore: 0,
            totalStudyTimeSeconds: 0,
            avgTimePerQuestionSeconds: 0,
            passRatePercent: 0,
            passedSessionsCount: 0,
            overthinkingQuestionsCount: 0,
            doubtfulQuestionsCount: 0,
            guessingQuestionsCount: 0,
            categories: [],
            packages: [],
            allSubtests: [],
            allTopicsRanked: [],
            difficultyBreakdown: []
        };
    }

    let totalQuestionsAnswered = 0;
    let totalCorrect = 0;
    let totalWrong = 0;
    let totalStudyTimeSeconds = 0;
    let highestScore = 0;
    let highestScoreDate: string | undefined = undefined;
    let lowestScore = Infinity;
    let sumScore = 0;
    let passedSessionsCount = 0;
    let overthinkingQuestionsCount = 0;
    let doubtfulQuestionsCount = 0;
    let guessingQuestionsCount = 0;

    // Map Kategori
    const categoryMap = new Map<string, {
        sessions: TestHistoryItem[];
        totalQ: number;
        correct: number;
        wrong: number;
        scores: number[];
        passedCount: number;
        timeSeconds: number;
        packageTitles: Set<string>;
    }>();

    // Map Paket TO
    const packageMap = new Map<string, {
        packageTitle: string;
        category: string;
        stream?: string;
        sessions: TestHistoryItem[];
        scores: number[];
        lastDate: string;
        totalTimeSeconds: number;
        questionsMap: Map<string, {
            question: Question;
            answers: UserAnswer[];
        }>;
    }>();

    // Map Subtes Global
    const subtestGlobalMap = new Map<string, {
        subtestName: string;
        category: string;
        totalQ: number;
        correct: number;
        wrong: number;
        timeSeconds: number;
        topicMap: Map<string, { total: number; correct: number; timeSeconds: number }>;
    }>();

    // Difficulty Map
    const difficultyMap = new Map<string, { total: number; correct: number }>();

    // Process every session
    history.forEach((session) => {
        const score = Number(session.score || 0);
        sumScore += score;
        if (score > highestScore) {
            highestScore = score;
            highestScoreDate = session.date;
        }
        if (score < lowestScore) {
            lowestScore = score;
        }

        // Check if passed
        let isPassed = false;
        if (session.details && typeof session.details.passed === 'boolean') {
            isPassed = session.details.passed;
        } else if (session.maxScore > 0 && (score / session.maxScore) >= 0.65) {
            isPassed = true;
        }
        if (isPassed) passedSessionsCount++;

        // Category grouping
        const catKey = session.category || 'SKD';
        if (!categoryMap.has(catKey)) {
            categoryMap.set(catKey, {
                sessions: [],
                totalQ: 0,
                correct: 0,
                wrong: 0,
                scores: [],
                passedCount: 0,
                timeSeconds: 0,
                packageTitles: new Set<string>()
            });
        }
        const catData = categoryMap.get(catKey)!;
        catData.sessions.push(session);
        catData.scores.push(score);
        if (isPassed) catData.passedCount++;

        // Package grouping
        const pkgTitle = session.packageTitle?.trim() || `${catKey} - Latihan Mandiri`;
        const pkgKey = `${catKey}___${pkgTitle}`;
        catData.packageTitles.add(pkgTitle);

        if (!packageMap.has(pkgKey)) {
            packageMap.set(pkgKey, {
                packageTitle: pkgTitle,
                category: catKey,
                stream: session.skdStream || session.tpaStream,
                sessions: [],
                scores: [],
                lastDate: session.date,
                totalTimeSeconds: 0,
                questionsMap: new Map()
            });
        }
        const pkgData = packageMap.get(pkgKey)!;
        pkgData.sessions.push(session);
        pkgData.scores.push(score);
        if (session.date > pkgData.lastDate) {
            pkgData.lastDate = session.date;
        }

        // Process questions & answers
        const questions = session.questions || [];
        const answers = session.answers || [];
        const answerMap = new Map<string, UserAnswer>();
        answers.forEach(a => {
            if (a.questionId) answerMap.set(a.questionId, a);
        });

        questions.forEach((q, qIndex) => {
            const userAns = answerMap.get(q.id) || answers[qIndex];
            if (!userAns) return;

            totalQuestionsAnswered++;
            catData.totalQ++;

            const isCorr = Boolean(userAns.isCorrect);
            if (isCorr) {
                totalCorrect++;
                catData.correct++;
            } else {
                totalWrong++;
                catData.wrong++;
            }

            const timeSpent = userAns.timeTakenSeconds || 0;
            totalStudyTimeSeconds += timeSpent;
            catData.timeSeconds += timeSpent;
            pkgData.totalTimeSeconds += timeSpent;

            if (userAns.isOverthinking) overthinkingQuestionsCount++;
            if (userAns.isDoubtful) doubtfulQuestionsCount++;
            if (userAns.isGuessing) guessingQuestionsCount++;

            // Package question tracking
            if (!pkgData.questionsMap.has(q.id)) {
                pkgData.questionsMap.set(q.id, {
                    question: q,
                    answers: []
                });
            }
            pkgData.questionsMap.get(q.id)!.answers.push(userAns);

            // Subtest and Topic detection
            const { subtest, topic } = detectQuestionTopic(q);
            const subKey = `${catKey}::${subtest}`;

            if (!subtestGlobalMap.has(subKey)) {
                subtestGlobalMap.set(subKey, {
                    subtestName: subtest,
                    category: catKey,
                    totalQ: 0,
                    correct: 0,
                    wrong: 0,
                    timeSeconds: 0,
                    topicMap: new Map()
                });
            }
            const subData = subtestGlobalMap.get(subKey)!;
            subData.totalQ++;
            if (isCorr) subData.correct++;
            else subData.wrong++;
            subData.timeSeconds += timeSpent;

            if (!subData.topicMap.has(topic)) {
                subData.topicMap.set(topic, { total: 0, correct: 0, timeSeconds: 0 });
            }
            const topData = subData.topicMap.get(topic)!;
            topData.total++;
            if (isCorr) topData.correct++;
            topData.timeSeconds += timeSpent;

            // Difficulty breakdown
            const diff = q.metadata?.difficulty || 'Medium';
            if (!difficultyMap.has(diff)) {
                difficultyMap.set(diff, { total: 0, correct: 0 });
            }
            const dData = difficultyMap.get(diff)!;
            dData.total++;
            if (isCorr) dData.correct++;
        });
    });

    if (lowestScore === Infinity) lowestScore = 0;

    // Convert Subtests to List & compute topics
    const allSubtests: SubtestStat[] = [];
    const allTopicsRanked: TopicStat[] = [];

    subtestGlobalMap.forEach((subVal) => {
        const accuracy = subVal.totalQ > 0 ? Math.round((subVal.correct / subVal.totalQ) * 100) : 0;
        const avgTime = subVal.totalQ > 0 ? Math.round(subVal.timeSeconds / subVal.totalQ) : 0;
        const topicsList: TopicStat[] = [];

        subVal.topicMap.forEach((topVal, topName) => {
            const topAcc = topVal.total > 0 ? Math.round((topVal.correct / topVal.total) * 100) : 0;
            const topAvgTime = topVal.total > 0 ? Math.round(topVal.timeSeconds / topVal.total) : 0;
            let status: 'KUASAI' | 'CUKUP' | 'KRITIS' = 'CUKUP';
            if (topAcc >= 80) status = 'KUASAI';
            else if (topAcc < 55) status = 'KRITIS';

            const topicItem: TopicStat = {
                topicName: topName,
                subtestName: subVal.subtestName,
                category: subVal.category,
                totalQuestions: topVal.total,
                correctCount: topVal.correct,
                wrongCount: topVal.total - topVal.correct,
                accuracyPercent: topAcc,
                avgTimeSeconds: topAvgTime,
                masteryStatus: status,
                recommendation: generateTopicRecommendation(topName, status)
            };
            topicsList.push(topicItem);
            allTopicsRanked.push(topicItem);
        });

        topicsList.sort((a, b) => a.accuracyPercent - b.accuracyPercent);

        allSubtests.push({
            subtestName: subVal.subtestName,
            category: subVal.category,
            totalQuestions: subVal.totalQ,
            correctCount: subVal.correct,
            wrongCount: subVal.wrong,
            accuracyPercent: accuracy,
            avgTimeSeconds: avgTime,
            topics: topicsList
        });
    });

    // Sort ranked topics: weakest first (critical attention)
    allTopicsRanked.sort((a, b) => {
        if (a.accuracyPercent !== b.accuracyPercent) {
            return a.accuracyPercent - b.accuracyPercent;
        }
        return b.totalQuestions - a.totalQuestions;
    });

    // Build Package stats list
    const packagesList: PackageStats[] = [];
    packageMap.forEach((pkg) => {
        const totalAttempts = pkg.sessions.length;
        const highest = Math.max(...pkg.scores);
        const lowest = Math.min(...pkg.scores);
        const avg = Math.round(pkg.scores.reduce((a, b) => a + b, 0) / totalAttempts);

        let pkgTotalQ = 0;
        let pkgCorrect = 0;
        let pkgWrong = 0;

        const subtestLocalMap = new Map<string, {
            subtest: string;
            total: number;
            correct: number;
            wrong: number;
            time: number;
            topics: Map<string, { total: number; correct: number; time: number }>;
        }>();

        const questionLevelList: QuestionLevelStat[] = [];
        let qIdx = 1;

        pkg.questionsMap.forEach((qEntry, qId) => {
            const q = qEntry.question;
            const answers = qEntry.answers;
            const lastAns = answers[answers.length - 1];
            const { subtest, topic } = detectQuestionTopic(q);

            answers.forEach(a => {
                pkgTotalQ++;
                if (a.isCorrect) pkgCorrect++;
                else pkgWrong++;

                if (!subtestLocalMap.has(subtest)) {
                    subtestLocalMap.set(subtest, {
                        subtest,
                        total: 0,
                        correct: 0,
                        wrong: 0,
                        time: 0,
                        topics: new Map()
                    });
                }
                const st = subtestLocalMap.get(subtest)!;
                st.total++;
                if (a.isCorrect) st.correct++;
                else st.wrong++;
                st.time += (a.timeTakenSeconds || 0);

                if (!st.topics.has(topic)) {
                    st.topics.set(topic, { total: 0, correct: 0, time: 0 });
                }
                const tp = st.topics.get(topic)!;
                tp.total++;
                if (a.isCorrect) tp.correct++;
                tp.time += (a.timeTakenSeconds || 0);
            });

            // Add question level stat
            const excerpt = q.content ? q.content.slice(0, 95) + (q.content.length > 95 ? '...' : '') : 'Soal Ujian';
            questionLevelList.push({
                index: qIdx++,
                questionId: qId,
                excerpt,
                subtest,
                topic,
                difficulty: q.metadata?.difficulty || 'Medium',
                isCorrect: Boolean(lastAns?.isCorrect),
                scoreEarned: lastAns?.scoreEarned || 0,
                selectedAnswer: lastAns?.selectedAnswer || '-',
                correctAnswer: q.correctAnswer || '-',
                timeTakenSeconds: lastAns?.timeTakenSeconds || 0,
                isOverthinking: Boolean(lastAns?.isOverthinking),
                isDoubtful: Boolean(lastAns?.isDoubtful),
                isGuessing: Boolean(lastAns?.isGuessing)
            });
        });

        const pkgAccuracy = pkgTotalQ > 0 ? Math.round((pkgCorrect / pkgTotalQ) * 100) : 0;

        const pkgSubtests: SubtestStat[] = [];
        const pkgTopics: TopicStat[] = [];

        subtestLocalMap.forEach((st) => {
            const stAcc = st.total > 0 ? Math.round((st.correct / st.total) * 100) : 0;
            const stTopics: TopicStat[] = [];

            st.topics.forEach((tpVal, tpName) => {
                const tpAcc = tpVal.total > 0 ? Math.round((tpVal.correct / tpVal.total) * 100) : 0;
                let status: 'KUASAI' | 'CUKUP' | 'KRITIS' = 'CUKUP';
                if (tpAcc >= 80) status = 'KUASAI';
                else if (tpAcc < 55) status = 'KRITIS';

                const tpItem: TopicStat = {
                    topicName: tpName,
                    subtestName: st.subtest,
                    category: pkg.category,
                    totalQuestions: tpVal.total,
                    correctCount: tpVal.correct,
                    wrongCount: tpVal.total - tpVal.correct,
                    accuracyPercent: tpAcc,
                    avgTimeSeconds: tpVal.total > 0 ? Math.round(tpVal.time / tpVal.total) : 0,
                    masteryStatus: status,
                    recommendation: generateTopicRecommendation(tpName, status)
                };
                stTopics.push(tpItem);
                pkgTopics.push(tpItem);
            });

            pkgSubtests.push({
                subtestName: st.subtest,
                category: pkg.category,
                totalQuestions: st.total,
                correctCount: st.correct,
                wrongCount: st.wrong,
                accuracyPercent: stAcc,
                avgTimeSeconds: st.total > 0 ? Math.round(st.time / st.total) : 0,
                topics: stTopics
            });
        });

        packagesList.push({
            packageKey: pkg.packageTitle,
            packageTitle: pkg.packageTitle,
            category: pkg.category,
            stream: pkg.stream,
            attemptCount: totalAttempts,
            lastAttemptDate: pkg.lastDate,
            highestScore: highest,
            lowestScore: lowest,
            averageScore: avg,
            totalQuestions: pkgTotalQ,
            correctCount: pkgCorrect,
            wrongCount: pkgWrong,
            accuracyPercent: pkgAccuracy,
            totalTimeSeconds: pkg.totalTimeSeconds,
            subtests: pkgSubtests,
            topics: pkgTopics,
            questions: questionLevelList
        });
    });

    packagesList.sort((a, b) => new Date(b.lastAttemptDate).getTime() - new Date(a.lastAttemptDate).getTime());

    // Build Category stats list
    const categoriesList: CategoryStats[] = [];
    categoryMap.forEach((catData, catName) => {
        const totalS = catData.sessions.length;
        const cHigh = Math.max(...catData.scores);
        const cLow = Math.min(...catData.scores);
        const cAvg = Math.round(catData.scores.reduce((a, b) => a + b, 0) / totalS);
        const cAcc = catData.totalQ > 0 ? Math.round((catData.correct / catData.totalQ) * 100) : 0;
        const cPass = totalS > 0 ? Math.round((catData.passedCount / totalS) * 100) : 0;

        const subtestsForCat = allSubtests.filter(st => st.category === catName);
        const topicsForCat = allTopicsRanked.filter(tp => tp.category === catName);

        let catLabel = catName;
        if (catName === 'SKD') catLabel = 'Seleksi Kompetensi Dasar (SKD)';
        else if (catName === 'UTBK') catLabel = 'UTBK-SNBT (TPS & Literasi)';
        else if (catName === 'TPA') catLabel = 'TPA Bappenas & TBI';
        else if (catName === 'PSIKOTEST') catLabel = 'Psikotest & Kedinasan';
        else if (catName === 'KECERMATAN') catLabel = 'Tes Kecermatan & Angka Hilang';
        else if (catName === 'BENCHMARK') catLabel = 'Human Benchmark & Kognitif';

        categoriesList.push({
            category: catName,
            categoryLabel: catLabel,
            totalSessions: totalS,
            totalQuestions: catData.totalQ,
            correctCount: catData.correct,
            wrongCount: catData.wrong,
            accuracyPercent: cAcc,
            highestScore: cHigh,
            lowestScore: cLow,
            averageScore: cAvg,
            passRatePercent: cPass,
            packagesCount: catData.packageTitles.size,
            totalTimeSeconds: catData.timeSeconds,
            subtests: subtestsForCat,
            topics: topicsForCat
        });
    });

    // Build difficulty breakdown
    const difficultyBreakdown = Array.from(difficultyMap.entries()).map(([diff, val]) => ({
        difficulty: diff,
        total: val.total,
        correct: val.correct,
        accuracy: val.total > 0 ? Math.round((val.correct / val.total) * 100) : 0
    }));

    const overallAccuracy = totalQuestionsAnswered > 0 ? Math.round((totalCorrect / totalQuestionsAnswered) * 100) : 0;
    const avgScore = history.length > 0 ? Math.round(sumScore / history.length) : 0;
    const passRatePercent = history.length > 0 ? Math.round((passedSessionsCount / history.length) * 100) : 0;
    const avgTimePerQuestionSeconds = totalQuestionsAnswered > 0 ? Math.round(totalStudyTimeSeconds / totalQuestionsAnswered) : 0;

    return {
        totalSessions: history.length,
        totalQuestionsAnswered,
        totalCorrect,
        totalWrong,
        overallAccuracy,
        highestScore,
        highestScoreDate,
        lowestScore,
        averageScore: avgScore,
        totalStudyTimeSeconds,
        avgTimePerQuestionSeconds,
        passRatePercent,
        passedSessionsCount,
        overthinkingQuestionsCount,
        doubtfulQuestionsCount,
        guessingQuestionsCount,
        categories: categoriesList,
        packages: packagesList,
        allSubtests,
        allTopicsRanked,
        difficultyBreakdown
    };
}
