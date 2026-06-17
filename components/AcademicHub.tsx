
import React, { useState, useEffect, useMemo } from 'react';
import { Target, TrendingUp, BookOpen, Play, AlertCircle, ArrowLeft, Youtube, Calculator, CheckCircle, GraduationCap, BarChart as BarChartIcon, Zap, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { TestHistoryItem, Question, CategoryType, SkdResultDetails, UtbkResultDetails, TargetScoreCalcResult } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { calculateTargetScores } from '../services/geminiService';

interface AcademicHubProps {
    history: TestHistoryItem[];
    category: CategoryType;
    onBack: () => void;
    onStartSmartReview: (questions: Question[]) => void;
}

// Mock Passing Grade Data (Simplified for Demo)
const MOCK_PASSING_GRADES: Record<string, number> = {
    'kedokteran': 750,
    'informatika': 720,
    'ilmu komputer': 710,
    'hukum': 680,
    'manajemen': 690,
    'psikologi': 670,
    'akuntansi': 685,
    'teknik sipil': 660,
    'teknik mesin': 665,
    'teknik elektro': 675,
    'komunikasi': 695,
    'farmasi': 650
};

export const AcademicHub: React.FC<AcademicHubProps> = ({ history, category, onBack, onStartSmartReview }) => {
    // --- STATE: Target Calculator ---
    const [university, setUniversity] = useState('');
    const [major, setMajor] = useState('');
    const [targetScore, setTargetScore] = useState<number>(0);
    const [currentAvg, setCurrentAvg] = useState<number>(0);

    const [calcCategory, setCalcCategory] = useState<'UTBK' | 'SKD'>(category === 'SKD' ? 'SKD' : 'UTBK');
    const [aiTargetResult, setAiTargetResult] = useState<TargetScoreCalcResult | null>(null);
    const [isAiCalculating, setIsAiCalculating] = useState(false);
    const [aiCalcError, setAiCalcError] = useState<string | null>(null);

    // --- STATE: Smart Review ---
    const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);

    // --- EFFECT: Calculate Stats ---
    useEffect(() => {
        // 1. Calculate Average Score from History for this Category
        const relevantHistory = history.filter(h => h.category === category);
        if (relevantHistory.length > 0) {
            const totalScore = relevantHistory.reduce((acc, curr) => acc + curr.score, 0);
            setCurrentAvg(Math.round(totalScore / relevantHistory.length));
        }

        // 2. Extract Wrong Answers
        const distinctWrong: Record<string, Question> = {};
        history.forEach(item => {
            if (item.category === category) {
                item.answers.forEach(ans => {
                    if (!ans.isCorrect) {
                        const q = item.questions.find(q => q.id === ans.questionId);
                        if (q) {
                            distinctWrong[q.id] = q;
                        }
                    }
                });
            }
        });
        setWrongQuestions(Object.values(distinctWrong));
    }, [history, category]);

    const microTopics = useMemo(() => {
        const stats: Record<string, { correct: number, total: number }> = {};
        history.forEach(item => {
            if (item.category === category) {
                item.answers.forEach(ans => {
                    const q = item.questions.find(q => q.id === ans.questionId);
                    if (q) {
                        const topic = q.metadata?.topic || q.metadata?.subtest || 'Materi Umum';
                        if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
                        stats[topic].total++;
                        if (ans.isCorrect) stats[topic].correct++;
                    }
                });
            }
        });
        
        return Object.entries(stats).map(([topic, data]) => ({
            topic,
            accuracy: Math.round((data.correct / data.total) * 100),
            total: data.total
        })).sort((a, b) => a.accuracy - b.accuracy); // sort by weakest
    }, [history, category]);

    // --- DATA: Chart Data ---
    const chartData = useMemo(() => {
        const relevantHistory = history.filter(h => h.category === category).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        return relevantHistory.map((h, i) => ({
            name: `Simulasi ${i + 1}`,
            skor: h.score,
            date: new Date(h.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })
        }));
    }, [history, category]);

    // --- SYSTEM: Clinical Diagnostics (Dynamic Micro-Topic Clinician Box) ---
    const clinicalDiagnostics = useMemo(() => {
        if (history.length === 0) return [];
        
        // Group by subtests
        const subtestStats: Record<string, { total: number; correct: number; scores: number[] }> = {};
        const topicStats: Record<string, { total: number; correct: number; subtest: string }> = {};
        
        const sortedHistory = [...history]
            .filter(h => h.category === category)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            
        if (sortedHistory.length === 0) return [];

        sortedHistory.forEach((h) => {
            h.answers.forEach(ans => {
                const q = h.questions.find(q => q.id === ans.questionId);
                if (q) {
                    const subtest = q.metadata?.subtest || 'Materi Umum';
                    const topic = q.metadata?.topic || 'Umum';
                    
                    if (!subtestStats[subtest]) {
                        subtestStats[subtest] = { total: 0, correct: 0, scores: [] };
                    }
                    subtestStats[subtest].total++;
                    if (ans.isCorrect) subtestStats[subtest].correct++;
                    
                    if (!topicStats[topic]) {
                        topicStats[topic] = { total: 0, correct: 0, subtest };
                    }
                    topicStats[topic].total++;
                    if (ans.isCorrect) topicStats[topic].correct++;
                }
            });
            
            if (h.details) {
                if (category === 'SKD') {
                    const d = h.details as SkdResultDetails;
                    if (d.tiu !== undefined) {
                        if (!subtestStats['TIU']) subtestStats['TIU'] = { total: 0, correct: 0, scores: [] };
                        subtestStats['TIU'].scores.push(d.tiu);
                    }
                    if (d.twk !== undefined) {
                        if (!subtestStats['TWK']) subtestStats['TWK'] = { total: 0, correct: 0, scores: [] };
                        subtestStats['TWK'].scores.push(d.twk);
                    }
                    if (d.tkp !== undefined) {
                        if (!subtestStats['TKP']) subtestStats['TKP'] = { total: 0, correct: 0, scores: [] };
                        subtestStats['TKP'].scores.push(d.tkp);
                    }
                } else if (category === 'UTBK') {
                    const d = h.details as UtbkResultDetails;
                    const map = { 'Penalaran Umum (PU)': d.pu, 'PPU': d.ppu, 'PBM': d.pbm, 'Kuantitatif (PK)': d.pk, 'Literasi Indonesia': d.lbi, 'Literasi Inggris': d.lbe, 'Penalaran Matematika': d.pm };
                    Object.entries(map).forEach(([subName, val]) => {
                        if (val !== undefined) {
                            if (!subtestStats[subName]) subtestStats[subName] = { total: 0, correct: 0, scores: [] };
                            subtestStats[subName].scores.push(val);
                        }
                    });
                }
            }
        });
        
        const insights: { type: 'danger' | 'warning' | 'success'; message: string; title: string; action: string }[] = [];
        
        const sortedTopics = Object.entries(topicStats)
            .map(([topic, data]) => ({
                topic,
                subtest: data.subtest,
                accuracy: Math.round((data.correct / data.total) * 100),
                total: data.total
            }))
            .sort((a, b) => a.accuracy - b.accuracy);
            
        if (sortedTopics.length > 0) {
            const worstTopic = sortedTopics[0];
            const worstSubtest = worstTopic.subtest;
            const subtestInfo = subtestStats[worstSubtest];
            
            let isSubtestImproving = true;
            if (subtestInfo && subtestInfo.scores && subtestInfo.scores.length >= 2) {
                const len = subtestInfo.scores.length;
                isSubtestImproving = subtestInfo.scores[len - 1] >= subtestInfo.scores[0];
            } else {
                const generalScores = sortedHistory.map(sh => sh.score);
                if (generalScores.length >= 2) {
                    isSubtestImproving = generalScores[generalScores.length - 1] >= generalScores[0];
                }
            }
            
            insights.push({
                type: 'danger',
                title: 'Diagnostik Titik Buta',
                message: `Skor ${worstSubtest} kamu ${isSubtestImproving ? 'meningkat' : 'aktif berlatih'}, tapi akurasi kamu di materi ${worstTopic.topic} hanya ${worstTopic.accuracy}%.`,
                action: `Saran: Tingkatkan fokus pada ${worstTopic.topic} melalui menu 'Weakness Attack' atau ulas instan di 'Smart Review'.`
            });
        }
        
        const totalSims = sortedHistory.length;
        if (totalSims >= 2) {
            const latest = sortedHistory[totalSims - 1].score;
            const first = sortedHistory[0].score;
            const diff = latest - first;
            if (diff > 0) {
                insights.push({
                    type: 'success',
                    title: 'Kemajuan Belajar',
                    message: `Tren skor positif! Skor total rata-rata meningkat sebesar +${diff} poin dibanding sesi awal.`,
                    action: 'Pertahankan metode belajar ini dan tuntaskan soal-soal di bank kesalahan Anda.'
                });
            } else if (diff < 0) {
                insights.push({
                    type: 'warning',
                    title: 'Evaluasi Pacing',
                    message: `Skor mengalami penurunan sebesar ${Math.abs(diff)} poin. Kemungkinan disebabkan oleh faktor kelelahan mental atau overthinking.`,
                    action: 'Latih psikologi ketahanan waktu menggunakan progress bar di tiap nomor.'
                });
            }
        }
        
        return insights;
    }, [history, category]);

    // --- HANDLERS ---
    const handleCalculateTargetScores = async () => {
        if (!university || !major) return;
        setIsAiCalculating(true);
        setAiCalcError(null);
        try {
            const result = await calculateTargetScores(calcCategory, university, major);
            setAiTargetResult(result);
            if (result.totalTargetScore) {
                setTargetScore(result.totalTargetScore);
            }
        } catch (error) {
            console.error(error);
            setAiCalcError("Gagal meracik target skor AI. Kemungkinan traffic sedang tinggi. Silakan coba lagi.");
        } finally {
            setIsAiCalculating(false);
        }
    };

    const handleMajorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setMajor(val);
        
        // Simple heuristic lookup
        const lowerVal = val.toLowerCase();
        let foundScore = 600; // Default base
        
        Object.keys(MOCK_PASSING_GRADES).forEach(key => {
            if (lowerVal.includes(key)) {
                foundScore = MOCK_PASSING_GRADES[key];
            }
        });
        
        // Add modifier based on University (Mock)
        const univLower = university.toLowerCase();
        if (univLower.includes('ui') || univLower.includes('itb') || univLower.includes('ugm')) foundScore += 50;
        
        setTargetScore(foundScore);
    };

    const progress = targetScore > 0 ? Math.min(100, Math.round((currentAvg / targetScore) * 100)) : 0;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-4 transition-colors">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition text-slate-700 dark:text-slate-300">
                        <ArrowLeft size={20}/>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <GraduationCap className="text-indigo-600 dark:text-indigo-400"/>
                            Analisis Akademik {category}
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Target skor & perbaikan kelemahan.</p>
                    </div>
                </div>

                {/* CHART SECTION */}
                {chartData.length > 0 && (
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 transition-all">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <BarChartIcon className="text-sky-500" /> Tren Perkembangan Skor
                        </h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                                        itemStyle={{ color: '#38bdf8' }}
                                        labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                    />
                                    <Bar dataKey="skor" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    {/* 1. AI-POWERED TARGET SCORE CALCULATOR */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 col-span-1 md:col-span-2">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-6">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <Target className="text-rose-500"/> Kalkulator Target Skor AI
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Peta jalan akurasi & target nilai setiap subtes UTBK/SKD buatan kecerdasan buatan.</p>
                            </div>
                            
                            {/* Toggle Category */}
                            <div className="flex bg-slate-100 dark:bg-slate-900 rounded-lg p-1 text-xs font-bold gap-1 self-stretch sm:self-auto">
                                <button 
                                    onClick={() => { setCalcCategory('UTBK'); setAiTargetResult(null); }}
                                    className={`px-3 py-1.5 rounded-md transition ${calcCategory === 'UTBK' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    UTBK SNBT
                                </button>
                                <button 
                                    onClick={() => { setCalcCategory('SKD'); setAiTargetResult(null); }}
                                    className={`px-3 py-1.5 rounded-md transition ${calcCategory === 'SKD' ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    SKD CPNS/Kedinasan
                                </button>
                            </div>
                        </div>

                        {!aiTargetResult ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase mb-1">{calcCategory === 'UTBK' ? 'Universitas Impian' : 'Instansi / Kementerian Target'}</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            placeholder={calcCategory === 'UTBK' ? "Contoh: Universitas Gadjah Mada" : "Contoh: Kemenkumham / STAN"}
                                            value={university}
                                            onChange={e => setUniversity(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-500 uppercase mb-1">{calcCategory === 'UTBK' ? 'Jurusan / Program Studi' : 'Formasi / Jabatan Target'}</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium dark:text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                            placeholder={calcCategory === 'UTBK' ? "Contoh: Teknik Elektro" : "Contoh: Penjaga Tahanan / Auditor"}
                                            value={major}
                                            onChange={e => setMajor(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {aiCalcError && (
                                    <div className="p-3 bg-rose-50 dark:bg-rose-950/20 text-rose-500 text-xs rounded-xl font-medium">
                                        ❌ {aiCalcError}
                                    </div>
                                )}

                                <button 
                                    onClick={handleCalculateTargetScores}
                                    disabled={!university || !major || isAiCalculating}
                                    className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10"
                                >
                                    {isAiCalculating ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>AI Sedang Memproyeksikan Skor Target Kelulusan...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={16} />
                                            <span>Hitung Target Skor Sehari-Hari dengan AI</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6 animate-fade-in animate-duration-300">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-2xl">
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">Peluang Kelulusan Anda</div>
                                            <div className="text-xl font-extrabold text-slate-800 dark:text-white mt-0.5">
                                                {aiTargetResult.targetUniversityOrInstansi} • {aiTargetResult.targetMajorOrFormasi}
                                            </div>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Target Skor Total</div>
                                            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{aiTargetResult.totalTargetScore}</div>
                                        </div>
                                    </div>

                                    {/* Progress Meter with current average */}
                                    <div className="mt-4">
                                        <div className="flex justify-between text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                                            <span>Skor Rata-Rata Saat Ini: {currentAvg}</span>
                                            <span>Target Lolos: {aiTargetResult.totalTargetScore}</span>
                                        </div>
                                        <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${progress >= 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`} 
                                                style={{width: `${progress}%`}}
                                            ></div>
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 text-center mt-2">
                                            {progress >= 100 
                                                ? "🎉 Hebat! Rata-rata akurasimu sudah memenuhi estimasi kelulusan AI." 
                                                : `Fokus belajar agar mendongkrak +${Math.max(0, aiTargetResult.totalTargetScore - currentAvg)} poin lagi untuk mencapai target.`}
                                        </p>
                                    </div>
                                </div>

                                {/* Subtest Breakdown Grid */}
                                <div>
                                    <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Breakdown Estimasi Skor Tiap Subtes</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {aiTargetResult.subtestTargets.map((item, index) => (
                                            <div key={index} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl flex flex-col justify-between shadow-sm">
                                                <div>
                                                    <div className="flex justify-between items-start mb-1.5">
                                                        <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200 leading-tight">{item.name}</h5>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-full whitespace-nowrap">
                                                            {item.percentage}% Akurasi
                                                        </span>
                                                    </div>
                                                    <div className="flex items-baseline gap-1 mb-2">
                                                        <span className="text-xl font-extrabold text-slate-900 dark:text-white">{item.score}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">/ {item.maxScore}</span>
                                                        {item.passingGrade && (
                                                            <span className="text-[10px] ml-2 font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                                                                Passing Grade: {item.passingGrade}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                                                        {item.strategy}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Overall Strategy Box */}
                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-2xl">
                                    <h5 className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <Sparkles size={14} /> Strategi Utama Lolos Seleksi
                                    </h5>
                                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold">
                                        {aiTargetResult.overallStrategy}
                                    </p>
                                </div>

                                {/* Re-calculate Button */}
                                <div className="flex justify-end">
                                    <button 
                                        onClick={() => setAiTargetResult(null)}
                                        className="py-2 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition"
                                    >
                                        <RefreshCw size={12} />
                                        <span>Ganti Target / Koreksi Data</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 2. SMART REVIEW (WRONG ANSWERS) */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <BookOpen className="text-emerald-500"/> Smart Review
                        </h3>

                        <div className="flex-1 flex flex-col items-center justify-center text-center mb-6">
                            <div className="w-24 h-24 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mb-4 relative">
                                <AlertCircle size={48} className="text-rose-500"/>
                                <div className="absolute top-0 right-0 bg-rose-600 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white dark:border-slate-800">
                                    {wrongQuestions.length}
                                </div>
                            </div>
                            <h4 className="text-xl font-bold text-slate-800 dark:text-white">Bank Kesalahan</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-xs">
                                Sistem mengumpulkan {wrongQuestions.length} soal yang pernah kamu jawab salah. Kerjakan ulang untuk memastikan pemahaman.
                            </p>
                        </div>

                        <button 
                            onClick={() => onStartSmartReview(wrongQuestions)}
                            disabled={wrongQuestions.length === 0}
                            className="w-full py-4 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 shadow-lg"
                        >
                            <Play size={20} fill="currentColor"/>
                            Kerjakan {wrongQuestions.length} Soal Salah
                        </button>
                    </div>
                </div>

                {/* CLINICAL DIAGNOSTICS */}
                {clinicalDiagnostics.length > 0 && (
                    <div className="mt-6 bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl relative overflow-hidden transition-all duration-300">
                        <div className="absolute -top-10 -left-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        
                        <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-3">
                            <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg">
                                <Zap size={18} className="animate-pulse" />
                            </span>
                            <div>
                                <h3 className="font-extrabold text-base tracking-tight">🩺 Diagnostik Klinis Akademik</h3>
                                <p className="text-xs text-slate-400">Analisis cerdas presisi tinggi mendeteksi titik buta pelajaran Anda.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {clinicalDiagnostics.map((insight, idx) => (
                                <div key={idx} className={`p-4 rounded-2xl border ${
                                    insight.type === 'danger' 
                                        ? 'bg-red-500/5 border-red-500/25 text-red-100' 
                                        : insight.type === 'warning'
                                        ? 'bg-amber-500/5 border-amber-500/25 text-amber-100'
                                        : 'bg-emerald-500/5 border-emerald-500/25 text-emerald-100'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <div className="mt-0.5">
                                            {insight.type === 'danger' ? (
                                                <AlertCircle size={18} className="text-red-400" />
                                            ) : insight.type === 'warning' ? (
                                                <AlertCircle size={18} className="text-amber-400" />
                                            ) : (
                                                <CheckCircle size={18} className="text-emerald-400" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-sm tracking-tight mb-1">{insight.title}</h4>
                                            <p className="text-xs md:text-sm text-slate-300 leading-relaxed font-medium mb-2">{insight.message}</p>
                                            <div className="text-xs text-slate-400 bg-black/40 p-2.5 rounded-xl border border-slate-800 font-mono">
                                                💡 {insight.action}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* MICRO-TOPIC DIAGNOSTIC */}
                {microTopics.length > 0 && (
                    <div className="mt-6 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Zap className="text-amber-500" /> Analisis Kelemahan Mikro (Micro-Topic)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {microTopics.slice(0, 8).map((mt, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div>
                                        <div className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate max-w-[200px]" title={mt.topic}>{mt.topic}</div>
                                        <div className="text-xs text-slate-500 dark:text-slate-400">{mt.total} soal dikerjakan</div>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <div className={`font-black tracking-tight ${mt.accuracy < 50 ? 'text-rose-500' : mt.accuracy < 80 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {mt.accuracy}%
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. VIDEO PEMBAHASAN INFO */}
                <div className="mt-6 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                    <div className="relative z-10 flex items-center gap-6">
                        <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                            <Youtube size={40} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold mb-1">Video Pembahasan Terintegrasi</h3>
                            <p className="text-red-100 text-sm max-w-lg">
                                Bingung dengan penjelasan teks? Sekarang setiap soal dilengkapi tombol pencarian otomatis ke YouTube untuk menemukan video pembahasan konsep terkait dari tutor terbaik.
                            </p>
                            <div className="mt-4 flex gap-2">
                                <span className="text-xs bg-black/20 px-3 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle size={12}/> Auto-Search Topic
                                </span>
                                <span className="text-xs bg-black/20 px-3 py-1 rounded-full flex items-center gap-1">
                                    <CheckCircle size={12}/> Curated Keywords
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
