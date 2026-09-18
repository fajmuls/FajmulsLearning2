import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    ArrowLeft, CheckCircle, XCircle, Flag, Zap, Activity, Clock, 
    Bot, Award, CheckSquare, Square, Star, Bookmark, BookOpen, 
    ChevronLeft, ChevronRight, Eye, EyeOff, Volume2, VolumeX, 
    Copy, Check, Edit3, Search, X, Sparkles, Filter, Lightbulb,
    FileText, HelpCircle, Layers, RefreshCw, AlertTriangle, ShieldCheck, GraduationCap, Brain, Package, Target
} from 'lucide-react';
import { 
    TestHistoryItem, TesKoranResultDetails, TesKecermatanResultDetails, 
    Question, UserAnswer 
} from '../types';
import { SimpleMarkdown, MatrixQuestionRenderer, SvgRenderer } from './QuestionRenderer';
import { InteractiveFigural } from './InteractiveFigural';
import { SoundManager } from '../services/soundService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReviewViewProps {
    item: TestHistoryItem;
    onBack: () => void;
    onToggleStudied?: (id: string) => void;
}

// LocalStorage Keys for persistent study features
const STORAGE_KEY_UNDERSTOOD = 'fajmuls_understood_questions';
const STORAGE_KEY_BEST_QUESTIONS = 'fajmuls_best_questions';
const STORAGE_KEY_QUESTION_NOTES = 'fajmuls_question_notes';

export const ReviewView: React.FC<ReviewViewProps> = ({ item, onBack, onToggleStudied }) => {
    // ----------------------------------------------------
    // PERSISTENT STUDY STATE
    // ----------------------------------------------------
    const [understoodSet, setUnderstoodSet] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_UNDERSTOOD);
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });

    const [bestQuestionsSet, setBestQuestionsSet] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_BEST_QUESTIONS);
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch {
            return new Set();
        }
    });

    const [notesMap, setNotesMap] = useState<Record<string, string>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_QUESTION_NOTES);
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Save helper functions
    const toggleUnderstood = (questionId: string) => {
        SoundManager.play('click');
        setUnderstoodSet(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
                SoundManager.play('success');
            }
            try {
                localStorage.setItem(STORAGE_KEY_UNDERSTOOD, JSON.stringify(Array.from(next)));
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    };

    const toggleBestQuestion = (questionId: string) => {
        SoundManager.play('click');
        setBestQuestionsSet(prev => {
            const next = new Set(prev);
            if (next.has(questionId)) {
                next.delete(questionId);
            } else {
                next.add(questionId);
                SoundManager.play('success');
            }
            try {
                localStorage.setItem(STORAGE_KEY_BEST_QUESTIONS, JSON.stringify(Array.from(next)));
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    };

    const saveNote = (questionId: string, noteText: string) => {
        setNotesMap(prev => {
            const next = { ...prev, [questionId]: noteText };
            try {
                localStorage.setItem(STORAGE_KEY_QUESTION_NOTES, JSON.stringify(next));
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    };

    // ----------------------------------------------------
    // STUDY INTERFACE CONTROLS
    // ----------------------------------------------------
    const [studyMode, setStudyMode] = useState<'LIST' | 'FOCUS'>('LIST');
    const [focusIndex, setFocusIndex] = useState<number>(0);
    const [isSelfTestMode, setIsSelfTestMode] = useState<boolean>(false);
    const [revealedSelfTestQuestions, setRevealedSelfTestQuestions] = useState<Set<string>>(new Set());
    const [filterType, setFilterType] = useState<'ALL' | 'WRONG' | 'FLAGGED' | 'BEST' | 'UNDERSTOOD' | 'UNUNDERSTOOD'>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeNoteEditor, setActiveNoteEditor] = useState<string | null>(null);
    const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
    const [speakingQuestionId, setSpeakingQuestionId] = useState<string | null>(null);

    // ----------------------------------------------------
    // TEXT-TO-SPEECH (TTS)
    // ----------------------------------------------------
    const speakText = (questionId: string, textToSpeak: string) => {
        if (!('speechSynthesis' in window)) return;
        if (speakingQuestionId === questionId) {
            window.speechSynthesis.cancel();
            setSpeakingQuestionId(null);
            return;
        }
        window.speechSynthesis.cancel();
        // Clean markdown characters for pleasant speech
        const cleanText = textToSpeak
            .replace(/[#*_`$]/g, '')
            .replace(/<[^>]*>/g, '')
            .replace(/\n+/g, '. ');

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = 'id-ID';
        utterance.rate = 1.0;
        utterance.onend = () => setSpeakingQuestionId(null);
        utterance.onerror = () => setSpeakingQuestionId(null);
        setSpeakingQuestionId(questionId);
        window.speechSynthesis.speak(utterance);
    };

    useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // ----------------------------------------------------
    // COPY TO CLIPBOARD
    // ----------------------------------------------------
    const handleCopyQuestion = (q: Question, qIndex: number) => {
        const text = `Soal No. ${qIndex + 1} (${q.metadata?.subtest || q.metadata?.topic || item.category}):\n\n${q.content}\n\nKunci Jawaban: ${q.correctAnswer}\n\nPembahasan:\n${q.explanation}`;
        navigator.clipboard.writeText(text);
        setCopiedQuestionId(q.id);
        SoundManager.play('click');
        setTimeout(() => setCopiedQuestionId(null), 2000);
    };

    // ----------------------------------------------------
    // KEYBOARD NAVIGATION IN FOCUS MODE
    // ----------------------------------------------------
    useEffect(() => {
        if (studyMode !== 'FOCUS') return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
            if (e.key === 'ArrowLeft') {
                setFocusIndex(prev => Math.max(0, prev - 1));
            } else if (e.key === 'ArrowRight') {
                setFocusIndex(prev => Math.min((item.questions?.length || 1) - 1, prev + 1));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [studyMode, item.questions]);

    // ----------------------------------------------------
    // SPECIAL TES KORAN & KECERMATAN HANDLING
    // ----------------------------------------------------
    const isTesKoran = item.category === 'PSIKOTEST' && item.details && 'speedPerMinute' in item.details;
    const isTesKecermatan = item.category === 'KECERMATAN' && item.details && 'averageSpeed' in item.details;

    if (isTesKoran || isTesKecermatan) {
        const isPauli = isTesKoran;
        const details = item.details as (TesKoranResultDetails | TesKecermatanResultDetails);
        let chartData: { name: string; val: number }[] = [];
        let totalCorrect = 0;
        let totalWrong = 0;
        let speed = 0;
        let accuracy = 0;
        let stability = 0;
        let modeLabel = "";

        if (isPauli) {
            const d = details as TesKoranResultDetails;
            chartData = (d.intervalData || []).map((val, idx) => ({ name: `M${idx + 1}`, val }));
            totalCorrect = d.totalCorrect;
            totalWrong = d.totalWrong;
            speed = d.speedPerMinute;
            accuracy = d.accuracy;
            stability = d.consistencyScore;
            modeLabel = "Tes Koran / Pauli";
        } else {
            const d = details as TesKecermatanResultDetails;
            chartData = (d.sectionData || []).map((s, idx) => ({ name: `K${idx + 1}`, val: s.correct }));
            totalCorrect = d.totalCorrect || 0;
            totalWrong = d.totalWrong || 0;
            speed = d.averageSpeed || 0;
            accuracy = d.accuracy || 0;
            stability = d.stability || 0;
            modeLabel = d.mode ? `Kecermatan (${d.mode})` : "Tes Kecermatan";
        }

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 md:px-6 py-6 transition-colors">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <button onClick={onBack} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                            <ArrowLeft size={16} /> Kembali ke Riwayat
                        </button>
                        {onToggleStudied && (
                            <button
                                onClick={() => onToggleStudied(item.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${item.isStudied ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
                            >
                                {item.isStudied ? <CheckSquare size={16} /> : <Square size={16} />}
                                {item.isStudied ? 'Sudah Dipelajari' : 'Tandai Dipelajari'}
                            </button>
                        )}
                    </div>

                    {/* Hero Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                                <Activity size={32} />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">{modeLabel}</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {new Date(item.date).toLocaleDateString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}
                                </p>
                            </div>
                        </div>

                        {/* Metric Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Benar</div>
                                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalCorrect}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Salah</div>
                                <div className="text-2xl font-black text-rose-500">{totalWrong}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Akurasi</div>
                                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{accuracy}%</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Kecepatan Rata-rata</div>
                                <div className="text-2xl font-black text-slate-800 dark:text-white">{speed}</div>
                            </div>
                            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                                <div className="text-[10px] font-bold text-slate-400 uppercase">Stabilitas</div>
                                <div className="text-2xl font-black text-amber-500">{stability}</div>
                            </div>
                        </div>

                        {/* Chart */}
                        {chartData.length > 0 && (
                            <div className="h-64 w-full pt-4">
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Grafik Ritme Kerja</h3>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="kecermatanGrad" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.3} />
                                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                                        <YAxis stroke="#94a3b8" fontSize={10} />
                                        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '12px' }} />
                                        <Area type="monotone" dataKey="val" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#kecermatanGrad)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // ----------------------------------------------------
    // STANDARD QUESTIONS REVIEW & STUDY ENGINE
    // ----------------------------------------------------
    const questions = item.questions || [];
    const answers = item.answers || [];

    // Filter calculations
    const wrongQuestionsCount = useMemo(() => {
        return questions.filter((q, idx) => {
            const ans = answers.find(a => a.questionId === q.id) || answers[idx];
            return ans && !ans.isCorrect && (ans.scoreEarned === undefined || ans.scoreEarned < 4);
        }).length;
    }, [questions, answers]);

    const flaggedCount = useMemo(() => {
        return answers.filter(a => a.isDoubtful).length;
    }, [answers]);

    const bestQuestionsCount = useMemo(() => {
        return questions.filter(q => bestQuestionsSet.has(q.id)).length;
    }, [questions, bestQuestionsSet]);

    const understoodCount = useMemo(() => {
        return questions.filter(q => understoodSet.has(q.id)).length;
    }, [questions, understoodSet]);

    const masteryPercentage = questions.length > 0 
        ? Math.round((understoodCount / questions.length) * 100) 
        : 0;

    // Filtered questions list
    const filteredQuestions = useMemo(() => {
        return questions.map((q, originalIndex) => ({ q, originalIndex })).filter(({ q, originalIndex }) => {
            const ans = answers.find(a => a.questionId === q.id) || answers[originalIndex];
            
            // Status filters
            if (filterType === 'WRONG') {
                const isWrong = ans && !ans.isCorrect && (ans.scoreEarned === undefined || ans.scoreEarned < 4);
                if (!isWrong) return false;
            } else if (filterType === 'FLAGGED') {
                if (!ans?.isDoubtful) return false;
            } else if (filterType === 'BEST') {
                if (!bestQuestionsSet.has(q.id)) return false;
            } else if (filterType === 'UNDERSTOOD') {
                if (!understoodSet.has(q.id)) return false;
            } else if (filterType === 'UNUNDERSTOOD') {
                if (understoodSet.has(q.id)) return false;
            }

            // Search query filter
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const contentMatch = q.content.toLowerCase().includes(query);
                const explanationMatch = q.explanation?.toLowerCase().includes(query);
                const subtestMatch = (q.metadata?.subtest || '').toLowerCase().includes(query);
                const topicMatch = (q.metadata?.topic || '').toLowerCase().includes(query);
                const noteMatch = (notesMap[q.id] || '').toLowerCase().includes(query);
                if (!contentMatch && !explanationMatch && !subtestMatch && !topicMatch && !noteMatch) {
                    return false;
                }
            }

            return true;
        });
    }, [questions, answers, filterType, searchQuery, bestQuestionsSet, understoodSet, notesMap]);

    // Subtest stats for badge in header
    const subtestBreakdown = useMemo(() => {
        const map: Record<string, { total: number; correct: number }> = {};
        questions.forEach((q, idx) => {
            const sub = q.metadata?.subtest || q.metadata?.topic || 'Umum';
            if (!map[sub]) map[sub] = { total: 0, correct: 0 };
            map[sub].total++;
            const ans = answers.find(a => a.questionId === q.id) || answers[idx];
            if (ans?.isCorrect || (ans?.scoreEarned && ans.scoreEarned >= 4)) {
                map[sub].correct++;
            }
        });
        return map;
    }, [questions, answers]);

    const getCategoryIcon = (category: string) => {
        const cat = category.toUpperCase();
        if (cat === 'SKD') return <ShieldCheck size={24} />;
        if (cat === 'UTBK') return <GraduationCap size={24} />;
        if (cat === 'PSIKOTEST') return <Brain size={24} />;
        return <Package size={24} />;
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 md:px-6 py-4 md:py-6 transition-colors pb-24">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* ---------------------------------------------------- */}
                {/* TOP NAVIGATION BAR */}
                {/* ---------------------------------------------------- */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onBack} 
                            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
                        >
                            <ArrowLeft size={16} /> Kembali ke Riwayat
                        </button>
                        {item.isAborted && (
                            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] sm:text-xs px-2.5 py-1 rounded-xl font-black uppercase tracking-wider">
                                Ujian Dihentikan Awal
                            </span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Global Studied Status Toggle */}
                        {onToggleStudied && (
                            <button
                                onClick={() => onToggleStudied(item.id)}
                                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                                    item.isStudied 
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                {item.isStudied ? <CheckCircle size={16} className="text-white" /> : <BookOpen size={16} className="text-indigo-500" />}
                                {item.isStudied ? 'Paket Selesai Dipelajari' : 'Tandai Paket Dipelajari'}
                            </button>
                        )}
                    </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* HERO CARD (TO SELECTION STYLE) */}
                {/* ---------------------------------------------------- */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                        {/* Left Title & Meta */}
                        <div className="lg:col-span-2 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 rounded-full text-[10px] font-black uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                                    <Sparkles size={12} /> Modul Belajar & Pembahasan
                                </span>
                                <span className="px-2.5 py-1 bg-white/10 rounded-full text-[10px] font-bold text-slate-300">
                                    {new Date(item.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB
                                </span>
                            </div>

                            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white line-clamp-2">
                                {item.packageTitle || `Latihan Soal ${item.category}`}
                            </h1>

                            {/* Subtest Pills */}
                            <div className="flex flex-wrap gap-2 pt-1">
                                {Object.entries(subtestBreakdown).map(([subName, data], sIdx) => (
                                    <div key={sIdx} className="px-2.5 py-1 bg-slate-800/80 border border-slate-700 rounded-xl text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                                        <span className="text-indigo-400 font-extrabold">{subName}:</span>
                                        <span>{data.correct}/{data.total} Benar</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Stats & Mastery Gauge */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-indigo-200 uppercase tracking-wider">Tingkat Penguasaan</span>
                                <span className="text-lg font-black text-emerald-400">{masteryPercentage}%</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-3 bg-slate-950/60 rounded-full overflow-hidden p-0.5 border border-white/10">
                                <div 
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-400 transition-all duration-500"
                                    style={{ width: `${masteryPercentage}%` }}
                                />
                            </div>

                            <div className="flex justify-between text-[11px] text-slate-300 font-medium pt-1">
                                <span><b>{understoodCount}</b> dari <b>{questions.length}</b> Soal Paham</span>
                                <span className="text-amber-300 font-bold">⭐ {bestQuestionsCount} Soal Terbaik</span>
                            </div>

                            {/* Score & Verdict Banner */}
                            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                                <div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Skor Tercapai</div>
                                    <div className="text-xl font-black text-white">{item.score} <span className="text-xs text-slate-400 font-medium">/ {item.maxScore}</span></div>
                                </div>
                                <div className="text-right">
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Hasil</div>
                                    <div className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                                        item.score >= 311 || (item.category === 'UTBK' && item.score >= 600)
                                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    }`}>
                                        {item.score >= 311 || (item.category === 'UTBK' && item.score >= 600) ? 'LULUS PG' : 'EVALUASI'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* TOOLBAR & STUDY MODE CONTROLS */}
                {/* ---------------------------------------------------- */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        
                        {/* View Mode Toggle: LIST vs FOCUS */}
                        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 self-start">
                            <button
                                onClick={() => {
                                    SoundManager.play('click');
                                    setStudyMode('LIST');
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                                    studyMode === 'LIST'
                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Layers size={15} /> Daftar Lengkap ({questions.length})
                            </button>
                            <button
                                onClick={() => {
                                    SoundManager.play('click');
                                    setStudyMode('FOCUS');
                                }}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 ${
                                    studyMode === 'FOCUS'
                                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                                }`}
                            >
                                <Target size={15} /> Mode Fokus Flashcard
                            </button>
                        </div>

                        {/* Self-Test Toggle (Hide answers to test oneself) */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    SoundManager.play('click');
                                    setIsSelfTestMode(!isSelfTestMode);
                                    if (!isSelfTestMode) {
                                        setRevealedSelfTestQuestions(new Set());
                                    }
                                }}
                                className={`px-4 py-2 rounded-2xl text-xs font-black transition border flex items-center gap-2 ${
                                    isSelfTestMode
                                        ? 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                                title="Sembunyikan kunci jawaban dan pembahasan untuk melatih kembali ingatan Anda"
                            >
                                {isSelfTestMode ? <EyeOff size={15} /> : <Eye size={15} />}
                                {isSelfTestMode ? 'Mode Uji Mandiri: Aktif' : 'Mode Uji Mandiri (Tutup Kunci)'}
                            </button>
                        </div>
                    </div>

                    {/* Filter Pills & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        {/* Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            <button
                                onClick={() => setFilterType('ALL')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                                    filterType === 'ALL'
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                Semua ({questions.length})
                            </button>
                            <button
                                onClick={() => setFilterType('WRONG')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    filterType === 'WRONG'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                                }`}
                            >
                                <XCircle size={13} /> Salah Saja ({wrongQuestionsCount})
                            </button>
                            {flaggedCount > 0 && (
                                <button
                                    onClick={() => setFilterType('FLAGGED')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                        filterType === 'FLAGGED'
                                            ? 'bg-amber-600 text-white shadow-sm'
                                            : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                                    }`}
                                >
                                    <Flag size={13} /> Ragu-Ragu ({flaggedCount})
                                </button>
                            )}
                            <button
                                onClick={() => setFilterType('BEST')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    filterType === 'BEST'
                                        ? 'bg-amber-500 text-white shadow-sm'
                                        : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40'
                                }`}
                            >
                                <Star size={13} className="fill-amber-400 text-amber-500" /> Soal Terbaik ({bestQuestionsCount})
                            </button>
                            <button
                                onClick={() => setFilterType('UNDERSTOOD')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    filterType === 'UNDERSTOOD'
                                        ? 'bg-emerald-600 text-white shadow-sm'
                                        : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40'
                                }`}
                            >
                                <CheckCircle size={13} /> Sudah Paham ({understoodCount})
                            </button>
                            <button
                                onClick={() => setFilterType('UNUNDERSTOOD')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    filterType === 'UNUNDERSTOOD'
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <Clock size={13} /> Belum Paham ({questions.length - understoodCount})
                            </button>
                        </div>

                        {/* Search Bar */}
                        <div className="relative min-w-[220px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari konsep, rumus, atau soal..."
                                className="w-full pl-9 pr-8 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* MODE 1: FOCUS FLASHCARD CAROUSEL */}
                {/* ---------------------------------------------------- */}
                {studyMode === 'FOCUS' && (
                    <div className="space-y-4">
                        {filteredQuestions.length === 0 ? (
                            <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
                                <BookOpen size={40} className="mx-auto text-slate-300" />
                                <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Tidak ada soal dalam filter ini</h3>
                                <button onClick={() => { setFilterType('ALL'); setSearchQuery(''); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 underline">
                                    Tampilkan Semua Soal
                                </button>
                            </div>
                        ) : (
                            (() => {
                                const currentIndex = Math.min(focusIndex, filteredQuestions.length - 1);
                                const currentItem = filteredQuestions[currentIndex];
                                if (!currentItem) return null;
                                const { q, originalIndex } = currentItem;
                                const ans = answers.find(a => a.questionId === q.id) || answers[originalIndex];
                                const isBest = bestQuestionsSet.has(q.id);
                                const isUnderstood = understoodSet.has(q.id);
                                const isSelfTestRevealed = !isSelfTestMode || revealedSelfTestQuestions.has(q.id);

                                return (
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 sm:p-8 space-y-6">
                                        {/* Focus Header Bar */}
                                        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
                                                    #{originalIndex + 1}
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                                        {q.metadata?.subtest || q.metadata?.topic || item.category}
                                                    </span>
                                                    <div className="text-xs text-slate-400 font-medium">
                                                        Soal {currentIndex + 1} dari {filteredQuestions.length} dalam filter
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action Badges (Best, Understood, Note, TTS, AI) */}
                                            <div className="flex items-center gap-2">
                                                {/* Mark Best Question Button */}
                                                <button
                                                    onClick={() => toggleBestQuestion(q.id)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                                        isBest
                                                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                                    }`}
                                                    title="Tandai sebagai Soal Terbaik"
                                                >
                                                    <Star size={14} className={isBest ? 'fill-amber-500 text-amber-500' : ''} />
                                                    {isBest ? 'Soal Terbaik' : 'Tandai Terbaik'}
                                                </button>

                                                {/* Mark Understood Button */}
                                                <button
                                                    onClick={() => toggleUnderstood(q.id)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                                        isUnderstood
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                                    }`}
                                                    title="Tandai sudah paham materi ini"
                                                >
                                                    <CheckCircle size={14} className={isUnderstood ? 'text-emerald-600' : ''} />
                                                    {isUnderstood ? 'Sudah Paham' : 'Tandai Paham'}
                                                </button>

                                                {/* TTS Audio */}
                                                <button
                                                    onClick={() => speakText(q.id, `${q.content}. Pembahasan: ${q.explanation}`)}
                                                    className={`p-2 rounded-xl text-xs font-bold transition ${
                                                        speakingQuestionId === q.id
                                                            ? 'bg-indigo-600 text-white animate-pulse'
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                                                    }`}
                                                    title="Dengarkan soal dan pembahasan"
                                                >
                                                    {speakingQuestionId === q.id ? <VolumeX size={15} /> : <Volume2 size={15} />}
                                                </button>

                                                {/* Copy Question */}
                                                <button
                                                    onClick={() => handleCopyQuestion(q, originalIndex)}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                                                    title="Salin teks soal"
                                                >
                                                    {copiedQuestionId === q.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Question Content */}
                                        <div className="text-base sm:text-lg font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                                            <SimpleMarkdown text={q.content} />
                                        </div>

                                        {/* Options Grid */}
                                        {q.options && q.options.length > 0 && (
                                            <div className="space-y-2.5">
                                                {q.options.map((opt, oIdx) => {
                                                    const letter = String.fromCharCode(65 + oIdx);
                                                    const isUserSelected = ans?.selectedAnswer === opt || ans?.selectedAnswer === letter;
                                                    const isCorrectOption = q.correctAnswer === opt || q.correctAnswer === letter;

                                                    let optionStyle = 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                                                    if (isSelfTestRevealed) {
                                                        if (isCorrectOption) {
                                                            optionStyle = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                                                        } else if (isUserSelected && !isCorrectOption) {
                                                            optionStyle = 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-900 dark:text-rose-200';
                                                        }
                                                    } else if (isUserSelected) {
                                                        optionStyle = 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold';
                                                    }

                                                    return (
                                                        <div key={oIdx} className={`p-3.5 sm:p-4 rounded-2xl border transition flex items-start gap-3 ${optionStyle}`}>
                                                            <span className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center font-bold text-xs shrink-0">
                                                                {letter}
                                                            </span>
                                                            <div className="flex-1 text-sm pt-0.5">
                                                                <SimpleMarkdown text={opt} />
                                                            </div>
                                                            {isSelfTestRevealed && isCorrectOption && (
                                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-500 text-white shrink-0">
                                                                    Kunci
                                                                </span>
                                                            )}
                                                            {isUserSelected && (
                                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-indigo-500 text-white shrink-0">
                                                                    Jawabanmu
                                                                </span>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Self-Test Reveal Barrier */}
                                        {isSelfTestMode && !revealedSelfTestQuestions.has(q.id) ? (
                                            <div className="p-6 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 rounded-2xl text-center space-y-3">
                                                <Lightbulb size={24} className="mx-auto text-amber-600 dark:text-amber-400" />
                                                <p className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                                                    Mode Uji Mandiri: Kunci dan Pembahasan Disembunyikan.
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        SoundManager.play('success');
                                                        setRevealedSelfTestQuestions(prev => new Set([...prev, q.id]));
                                                    }}
                                                    className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition shadow-md shadow-amber-600/20"
                                                >
                                                    Buka Kunci & Pembahasan
                                                </button>
                                            </div>
                                        ) : (
                                            /* Explanation & AI Assistant */
                                            <div className="space-y-4 pt-2">
                                                <div className="p-5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 rounded-2xl space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2 text-xs font-black uppercase text-indigo-700 dark:text-indigo-300 tracking-wider">
                                                            <Activity size={14} /> Pembahasan & Kunci Jawaban
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                window.dispatchEvent(new CustomEvent('openAiTutor', {
                                                                    detail: {
                                                                        context: `Soal:\n${q.content}\n\nPembahasan:\n${q.explanation}\n\nSaya sedang belajar di Review Mode dan ingin penjelasan lebih mudah & trik cepat untuk soal ini.`
                                                                    }
                                                                }));
                                                            }}
                                                            className="px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-black flex items-center gap-1.5 transition"
                                                        >
                                                            <Bot size={13} /> Tanya AI Guru
                                                        </button>
                                                    </div>
                                                    <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                                                        <SimpleMarkdown text={q.explanation} />
                                                    </div>
                                                </div>

                                                {/* Personal Study Notes */}
                                                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                                            <Edit3 size={13} className="text-amber-500" /> Catatan Belajar Pribadi
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">Tersimpan otomatis</span>
                                                    </div>
                                                    <textarea
                                                        value={notesMap[q.id] || ''}
                                                        onChange={(e) => saveNote(q.id, e.target.value)}
                                                        placeholder="Tuliskan catatan, rumus cepat, atau pengingat jebakan untuk soal ini..."
                                                        className="w-full p-3 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Focus Navigation Bar (Prev / Next Buttons) */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <button
                                                onClick={() => setFocusIndex(prev => Math.max(0, prev - 1))}
                                                disabled={currentIndex === 0}
                                                className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition"
                                            >
                                                <ChevronLeft size={16} /> Sebelumnya (←)
                                            </button>

                                            <span className="text-xs font-bold text-slate-500">
                                                {currentIndex + 1} / {filteredQuestions.length}
                                            </span>

                                            <button
                                                onClick={() => setFocusIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                                                disabled={currentIndex === filteredQuestions.length - 1}
                                                className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-black disabled:opacity-40 flex items-center gap-2 hover:bg-indigo-700 transition"
                                            >
                                                Selanjutnya (→) <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })()
                        )}
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* MODE 2: FULL LIST VIEW */}
                {/* ---------------------------------------------------- */}
                {studyMode === 'LIST' && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                        
                        {/* Questions List (Left 3 Columns) */}
                        <div className="lg:col-span-3 space-y-4">
                            {filteredQuestions.length === 0 ? (
                                <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
                                    <BookOpen size={40} className="mx-auto text-slate-300" />
                                    <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Tidak ada soal yang cocok dengan filter</h3>
                                    <button onClick={() => { setFilterType('ALL'); setSearchQuery(''); }} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 underline">
                                        Reset Filter
                                    </button>
                                </div>
                            ) : (
                                filteredQuestions.map(({ q, originalIndex }) => {
                                    const ans = answers.find(a => a.questionId === q.id) || answers[originalIndex];
                                    const isBest = bestQuestionsSet.has(q.id);
                                    const isUnderstood = understoodSet.has(q.id);
                                    const isSelfTestRevealed = !isSelfTestMode || revealedSelfTestQuestions.has(q.id);

                                    return (
                                        <div 
                                            key={q.id} 
                                            id={`question-card-${originalIndex}`}
                                            className={`rounded-3xl bg-white dark:bg-slate-800 border transition-all p-5 sm:p-6 space-y-4 shadow-sm ${
                                                isBest ? 'ring-2 ring-amber-400/40 border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            {/* Card Top Action Bar */}
                                            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/60">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center ${
                                                        ans?.isCorrect || (ans?.scoreEarned && ans.scoreEarned >= 4)
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-rose-500 text-white'
                                                    }`}>
                                                        {originalIndex + 1}
                                                    </span>
                                                    <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                                                        {q.metadata?.subtest || q.metadata?.topic || item.category}
                                                    </span>
                                                    {ans?.isDoubtful && (
                                                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/20 flex items-center gap-1">
                                                            <Flag size={10} /> Ragu
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Action Buttons (Best, Understood, Note Toggle, TTS, AI) */}
                                                <div className="flex items-center gap-1.5">
                                                    {/* Mark Best */}
                                                    <button
                                                        onClick={() => toggleBestQuestion(q.id)}
                                                        className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                                            isBest
                                                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
                                                        }`}
                                                        title="Tandai Soal Terbaik"
                                                    >
                                                        <Star size={14} className={isBest ? 'fill-amber-500 text-amber-500' : ''} />
                                                        <span className="hidden sm:inline">{isBest ? 'Terbaik' : 'Tandai'}</span>
                                                    </button>

                                                    {/* Mark Understood */}
                                                    <button
                                                        onClick={() => toggleUnderstood(q.id)}
                                                        className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                                                            isUnderstood
                                                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
                                                        }`}
                                                        title="Tandai Sudah Paham"
                                                    >
                                                        <CheckCircle size={14} className={isUnderstood ? 'text-emerald-600' : ''} />
                                                        <span className="hidden sm:inline">{isUnderstood ? 'Paham' : 'Paham?'}</span>
                                                    </button>

                                                    {/* Toggle Personal Note Editor */}
                                                    <button
                                                        onClick={() => setActiveNoteEditor(activeNoteEditor === q.id ? null : q.id)}
                                                        className={`p-1.5 rounded-xl text-xs transition ${
                                                            notesMap[q.id] || activeNoteEditor === q.id
                                                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
                                                        }`}
                                                        title="Tulis Catatan Pribadi"
                                                    >
                                                        <Edit3 size={14} />
                                                    </button>

                                                    {/* TTS Reader */}
                                                    <button
                                                        onClick={() => speakText(q.id, `${q.content}. Pembahasan: ${q.explanation}`)}
                                                        className={`p-1.5 rounded-xl text-xs transition ${
                                                            speakingQuestionId === q.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
                                                        }`}
                                                        title="Dengarkan Audio Soal"
                                                    >
                                                        <Volume2 size={14} />
                                                    </button>

                                                    {/* Copy */}
                                                    <button
                                                        onClick={() => handleCopyQuestion(q, originalIndex)}
                                                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 transition"
                                                        title="Salin Teks Soal"
                                                    >
                                                        {copiedQuestionId === q.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Question Prompt */}
                                            <div className="text-sm sm:text-base font-medium text-slate-800 dark:text-slate-100 leading-relaxed">
                                                <SimpleMarkdown text={q.content} />
                                            </div>

                                            {/* Options */}
                                            {q.options && q.options.length > 0 && (
                                                <div className="space-y-2 pt-1">
                                                    {q.options.map((opt, oIdx) => {
                                                        const letter = String.fromCharCode(65 + oIdx);
                                                        const isUserSelected = ans?.selectedAnswer === opt || ans?.selectedAnswer === letter;
                                                        const isCorrectOption = q.correctAnswer === opt || q.correctAnswer === letter;

                                                        let optionClass = 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                                                        if (isSelfTestRevealed) {
                                                            if (isCorrectOption) {
                                                                optionClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/60 text-emerald-900 dark:text-emerald-200 font-bold';
                                                            } else if (isUserSelected && !isCorrectOption) {
                                                                optionClass = 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/60 text-rose-900 dark:text-rose-200';
                                                            }
                                                        } else if (isUserSelected) {
                                                            optionClass = 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500/60 text-indigo-900 dark:text-indigo-200 font-bold';
                                                        }

                                                        return (
                                                            <div key={oIdx} className={`p-3 rounded-2xl border text-xs sm:text-sm flex items-start gap-2.5 transition ${optionClass}`}>
                                                                <span className="w-5 h-5 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center font-bold text-[11px] shrink-0">
                                                                    {letter}
                                                                </span>
                                                                <div className="flex-1">
                                                                    <SimpleMarkdown text={opt} />
                                                                </div>
                                                                {isSelfTestRevealed && isCorrectOption && (
                                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white shrink-0">
                                                                        Kunci
                                                                    </span>
                                                                )}
                                                                {isUserSelected && (
                                                                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500 text-white shrink-0">
                                                                        Jawabanmu
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}

                                            {/* TKP Points Breakdown if applicable */}
                                            {isSelfTestRevealed && q.tkpPoints && q.tkpPoints.length > 0 && (
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skala Poin Opsi (TKP 1-5):</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        {[...q.tkpPoints].sort((a, b) => b.points - a.points).map((pt, pIdx) => (
                                                            <div key={pIdx} className="px-2 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center gap-1 text-[11px]">
                                                                <span className="font-bold text-indigo-600 dark:text-indigo-400">{pt.option}:</span>
                                                                <span className="font-black text-emerald-600 dark:text-emerald-400">{pt.points} Poin</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Self-Test Reveal Barrier or Explanation Block */}
                                            {isSelfTestMode && !revealedSelfTestQuestions.has(q.id) ? (
                                                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-3">
                                                    <div className="text-xs text-amber-800 dark:text-amber-300 font-bold flex items-center gap-2">
                                                        <EyeOff size={15} /> Kunci & Pembahasan disembunyikan untuk uji mandiri
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            SoundManager.play('click');
                                                            setRevealedSelfTestQuestions(prev => new Set([...prev, q.id]));
                                                        }}
                                                        className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black transition"
                                                    >
                                                        Buka Pembahasan
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-1.5">
                                                            <Activity size={13} /> Pembahasan & Kunci:
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                window.dispatchEvent(new CustomEvent('openAiTutor', {
                                                                    detail: {
                                                                        context: `Soal:\n${q.content}\n\nPembahasan:\n${q.explanation}\n\nSaya sedang mengulas hasil belajar saya dan ingin bertanya penjelasan ini...`
                                                                    }
                                                                }));
                                                            }}
                                                            className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2.5 py-1 rounded-xl font-black flex items-center gap-1 transition"
                                                        >
                                                            <Bot size={12} /> Tanya AI Guru
                                                        </button>
                                                    </div>
                                                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                                                        <SimpleMarkdown text={q.explanation} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Collapsible / Active Note Editor */}
                                            {(activeNoteEditor === q.id || notesMap[q.id]) && (
                                                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                                                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                        <span className="flex items-center gap-1 text-amber-500">
                                                            <Edit3 size={12} /> Catatan Belajar Pribadi
                                                        </span>
                                                        <span className="text-[10px] text-slate-400">Tersimpan otomatis</span>
                                                    </div>
                                                    <textarea
                                                        value={notesMap[q.id] || ''}
                                                        onChange={(e) => saveNote(q.id, e.target.value)}
                                                        placeholder="Tulis catatan rumus, pola logika, atau pengingat..."
                                                        className="w-full p-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                                                        rows={2}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Right Sidebar: Navigation Matrix (Col 1) */}
                        <div className="hidden lg:block lg:col-span-1">
                            <div className="sticky top-6 bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                                        Navigasi Soal
                                    </h3>
                                    <span className="text-[10px] text-slate-400 font-bold">
                                        {understoodCount}/{questions.length} Paham
                                    </span>
                                </div>

                                {/* Matrix Grid */}
                                <div className="grid grid-cols-5 gap-2 max-h-[420px] overflow-y-auto pr-1">
                                    {questions.map((q, qIdx) => {
                                        const ans = answers.find(a => a.questionId === q.id) || answers[qIdx];
                                        const isBest = bestQuestionsSet.has(q.id);
                                        const isUnderstood = understoodSet.has(q.id);
                                        const isCorrect = ans?.isCorrect || (ans?.scoreEarned && ans.scoreEarned >= 4);

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => {
                                                    const el = document.getElementById(`question-card-${qIdx}`);
                                                    if (el) {
                                                        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }
                                                }}
                                                className={`relative h-10 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center ${
                                                    isCorrect
                                                        ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700'
                                                } hover:scale-105`}
                                            >
                                                <span>{qIdx + 1}</span>
                                                <div className="flex items-center gap-0.5 absolute -top-1 -right-1">
                                                    {isBest && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />}
                                                    {isUnderstood && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-[10px] space-y-1.5 text-slate-500">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-emerald-500" />
                                        <span>Benar / Jawaban Baik</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded bg-rose-500" />
                                        <span>Salah / Perlu Dipelajari</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                        <span>Soal Terbaik (⭐)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        <span>Sudah Paham (✅)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};
