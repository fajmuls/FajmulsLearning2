
import React, { useState, useEffect } from 'react';
import { Award, Activity, Target, Loader2, Lightbulb, CheckCircle, XCircle, Youtube, Flag, Bot } from 'lucide-react';
import { CategoryType, Question, UserAnswer, UtbkResultDetails } from '../types';
import * as Gemini from '../services/geminiService';
import { SimpleMarkdown } from './QuestionRenderer';
import confetti from 'canvas-confetti';

interface ResultsProps {
    answers: UserAnswer[];
    questions: Question[];
    onHome: () => void;
    onRetry: () => void;
    onHistory?: () => void;
    category: CategoryType;
    details?: any;
}

export const ResultsAnalysis: React.FC<ResultsProps> = ({ answers, questions, onHome, onRetry, onHistory, category, details }) => {
    const correctCount = answers.filter(a => a.isCorrect).length;
    let score = details?.total || details?.average || details?.iqScore || Math.round((correctCount / questions.length) * 100);
    
    // For General flexible scoring
    if (category === 'GENERAL' && !details) {
         const totalPoints = answers.reduce((acc, curr) => acc + (curr.scoreEarned || 0), 0);
         score = Math.round(totalPoints / (questions.length || 1));
    }

    useEffect(() => {
        const isHighScore = score >= (category === 'UTBK' ? 600 : 80);
        if (isHighScore) {
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#4f46e5', '#10b981', '#f59e0b']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#4f46e5', '#10b981', '#f59e0b']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();
        }
    }, [score, category]);

    const [improvementAdvice, setImprovementAdvice] = useState<string>('');
    const [loadingAdvice, setLoadingAdvice] = useState(false);
    
    // Simulate Percentile based on score
    const simulatedPercentile = Math.min(99, Math.round((score / (category === 'UTBK' ? 1000 : 100)) * 100) + (score % 5));

    // Passing Grade Logic (Ambang Batas)
    const getPassingGradeStatus = () => {
        if (category !== 'SKD') return null;
        
        // Group answers by category (TWK, TIU, TKP)
        const categories: Record<string, { score: number; min: number; passed: boolean; count: number }> = {
            TWK: { score: 0, min: 65, passed: false, count: 0 },
            TIU: { score: 0, min: 80, passed: false, count: 0 },
            TKP: { score: 0, min: 166, passed: false, count: 0 }
        };

        questions.forEach(q => {
            const sub = q.metadata?.subtest || "";
            if (sub.includes('TWK')) categories.TWK.count++;
            else if (sub.includes('TIU')) categories.TIU.count++;
            else if (sub.includes('TKP')) categories.TKP.count++;
        });

        answers.forEach(ans => {
            const q = questions.find(qu => qu.id === ans.questionId);
            const sub = q?.metadata?.subtest || "";
            if (sub.includes('TWK')) categories.TWK.score += (ans.scoreEarned || 0);
            else if (sub.includes('TIU')) categories.TIU.score += (ans.scoreEarned || 0);
            else if (sub.includes('TKP')) categories.TKP.score += (ans.scoreEarned || 0);
        });

        const result: Record<string, { score: number; min: number; passed: boolean }> = {};
        if (categories.TWK.count > 0) {
            categories.TWK.passed = categories.TWK.score >= categories.TWK.min;
            result.TWK = categories.TWK;
        }
        if (categories.TIU.count > 0) {
            categories.TIU.passed = categories.TIU.score >= categories.TIU.min;
            result.TIU = categories.TIU;
        }
        if (categories.TKP.count > 0) {
            categories.TKP.passed = categories.TKP.score >= categories.TKP.min;
            result.TKP = categories.TKP;
        }

        return Object.keys(result).length > 0 ? result : null;
    };

    const skdPassingStatus = getPassingGradeStatus();
    
    const wrongAnswers = answers.filter(a => !a.isCorrect);
    const weakTopics = Array.from<string>(new Set(wrongAnswers.map(a => {
        const q = questions.find(qu => qu.id === a.questionId);
        return (q?.metadata?.subtest || q?.metadata?.topic || 'General') as string;
    })));

    const handleGetAdvice = async () => {
        setLoadingAdvice(true);
        try {
            const advice = await Gemini.getImprovementAdvice(weakTopics);
            setImprovementAdvice(advice);
        } catch (e) {
            alert("Gagal memuat saran AI.");
        } finally {
            setLoadingAdvice(false);
        }
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 px-4 sm:px-6 md:px-12 py-4 md:py-6 flex flex-col items-center transition-colors">
            <div className="max-w-2xl w-full text-center">
                <div className="inline-block p-4 rounded-full bg-slate-50 dark:bg-slate-800 mb-6">
                    {score >= (category === 'UTBK' ? 600 : 70) ? <Award size={48} className="text-emerald-500"/> : <Activity size={48} className="text-amber-500"/>}
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">Sesi Selesai!</h1>
                <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm sm:text-base">Berikut adalah analisis hasil belajar Anda.</p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-6">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase mb-1">Skor Akhir</div>
                        <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">{score}</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase mb-1">Persentil</div>
                        <div className="text-xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">Top {100 - simulatedPercentile}%</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase mb-1">Avg Time</div>
                        <div className="text-xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
                            {Math.round(answers.reduce((acc, curr) => acc + (curr.timeTakenSeconds || 0), 0) / (answers.length || 1))}s
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase mb-1">Akurasi</div>
                        <div className="text-xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                            {Math.round((correctCount / (questions.length || 1)) * 100)}%
                        </div>
                    </div>
                </div>

                {/* DEEP STATS: Time Distribution & Consistency */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-6">
                     <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-left">
                        <h4 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                             <Activity size={14} className="text-indigo-500" /> Distribusi Waktu (Pacing)
                        </h4>
                        <div className="space-y-3">
                            {['EASY', 'MEDIUM', 'HARD'].map(level => {
                                const levelAns = answers.filter(a => {
                                    const q = questions.find(qu => qu.id === a.questionId);
                                    const d = q?.metadata?.difficulty || 'Medium';
                                    if (level === 'EASY') return d === 'Easy';
                                    if (level === 'HARD') return d === 'Hard' || d === 'HOTS';
                                    return d === 'Medium';
                                });
                                if (levelAns.length === 0) return null;
                                const avg = Math.round(levelAns.reduce((acc, c) => acc + (c.timeTakenSeconds || 0), 0) / levelAns.length);
                                return (
                                    <div key={level}>
                                        <div className="flex justify-between text-[9px] sm:text-[10px] font-bold mb-1">
                                            <span className="text-slate-500">{level}</span>
                                            <span className="text-slate-900 dark:text-white">{avg} detik/soal</span>
                                        </div>
                                        <div className="h-1 sm:h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (avg / 120) * 100)}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                     </div>

                     <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-left flex flex-col justify-between">
                        <div>
                            <h4 className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Target size={14} className="text-emerald-500" /> Konsistensi & Fokus
                            </h4>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                                Skor konsistensi Anda adalah <b>{Math.round(80 + (Math.random() * 15))}%</b>. 
                                {answers.length > 5 && answers.slice(-3).every(a => a.isCorrect) 
                                    ? " Anda menunjukkan performa yang sangat stabil di akhir sesi."
                                    : " Anda cenderung kehilangan fokus pada soal terakhir."}
                            </p>
                        </div>
                        <div className="p-3 mb-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex justify-between items-center">
                             <div className="text-[10px] font-bold text-slate-500 uppercase">Estimasi IQ (TIU)</div>
                             <div className="text-xl font-black text-slate-900 dark:text-white">
                                {category === 'SKD' ? Math.round(95 + (score / 5)) : 'N/A'}
                             </div>
                        </div>
                     </div>
                </div>

                {/* SKD PASSING GRADE STATUS */}
                {skdPassingStatus && (
                    <div className="mb-6 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="p-3 sm:p-4 bg-white dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600 flex justify-between items-center">
                            <h3 className="font-bold text-slate-700 dark:text-slate-100 uppercase text-[10px] sm:text-xs tracking-widest flex items-center gap-2 truncate pr-2">
                                <Flag size={14} className="text-indigo-500 shrink-0"/> Ambang Batas
                            </h3>
                            <div className={`px-2 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase whitespace-nowrap ${Object.values(skdPassingStatus).every(v => v.passed) ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                {Object.values(skdPassingStatus).every(v => v.passed) ? 'LULUS' : 'BELUM LULUS'}
                            </div>
                        </div>
                        <div className="p-3 sm:p-4 grid grid-cols-3 gap-2 sm:gap-4">
                            {Object.entries(skdPassingStatus).map(([key, data]) => (
                                <div key={key} className="flex flex-col p-2 sm:p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex justify-between items-center mb-1 sm:mb-2">
                                        <span className="text-[10px] sm:text-xs font-black text-slate-500 dark:text-slate-400">{key}</span>
                                        {data.passed ? <CheckCircle size={12} className="text-emerald-500"/> : <XCircle size={12} className="text-rose-500"/>}
                                    </div>
                                    <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-white">{data.score}</div>
                                    <div className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase mt-0.5">Min: {data.min}</div>
                                    <div className="mt-1 sm:mt-2 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full transition-all duration-1000 ${data.passed ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                            style={{ width: `${Math.min(100, (data.score / data.min) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* UTBK SUBTEST BREAKDOWN */}
                {category === 'UTBK' && details && (
                    <div className="mb-6 w-full bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                        <h3 className="font-bold text-[10px] sm:text-xs tracking-widest text-slate-700 dark:text-slate-300 mb-3 text-left border-b border-slate-200 dark:border-slate-700 pb-2 uppercase">Rincian Subtes (IRT)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                            <div className="flex justify-between p-2 sm:p-0 bg-white sm:bg-transparent dark:bg-slate-900 sm:dark:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100 dark:border-slate-700"><span>Penalaran Umum:</span> <b>{details.pu}</b></div>
                            <div className="flex justify-between p-2 sm:p-0 bg-white sm:bg-transparent dark:bg-slate-900 sm:dark:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100 dark:border-slate-700"><span>PPU:</span> <b>{details.ppu}</b></div>
                            <div className="flex justify-between p-2 sm:p-0 bg-white sm:bg-transparent dark:bg-slate-900 sm:dark:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100 dark:border-slate-700"><span>PBM:</span> <b>{details.pbm}</b></div>
                            <div className="flex justify-between p-2 sm:p-0 bg-white sm:bg-transparent dark:bg-slate-900 sm:dark:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100 dark:border-slate-700"><span>Kuantitatif:</span> <b>{details.pk}</b></div>
                            <div className="flex justify-between p-2 sm:p-0 bg-white sm:bg-transparent dark:bg-slate-900 sm:dark:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100 dark:border-slate-700"><span>Lit. B.Indo:</span> <b>{details.lbi}</b></div>
                            <div className="flex justify-between p-2 sm:p-0 bg-white sm:bg-transparent dark:bg-slate-900 sm:dark:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100 dark:border-slate-700"><span>Lit. B.Inggris:</span> <b>{details.lbe}</b></div>
                            <div className="flex justify-between p-2 sm:p-0 bg-white sm:bg-transparent dark:bg-slate-900 sm:dark:bg-transparent rounded-lg sm:rounded-none border sm:border-0 border-slate-100 dark:border-slate-700"><span>Penalaran Math:</span> <b>{details.pm}</b></div>
                        </div>
                    </div>
                )}

                {/* Weakness Section */}
                {weakTopics.length > 0 && (
                    <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900 p-4 sm:p-6 rounded-2xl mb-6 text-left w-full">
                        <h3 className="font-bold text-sm sm:text-base text-rose-800 dark:text-rose-400 flex items-center gap-2 mb-3"><Target size={16}/> Topik Perlu Perbaikan</h3>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                            {weakTopics.slice(0, 5).map(t => (
                                <span key={t} className="bg-white dark:bg-rose-900/40 text-rose-600 dark:text-rose-200 px-2 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border border-rose-200 dark:border-rose-800">{t}</span>
                            ))}
                        </div>
                        
                        {!improvementAdvice ? (
                            <button 
                                onClick={handleGetAdvice}
                                disabled={loadingAdvice}
                                className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 underline flex items-center gap-1 hover:text-rose-900 dark:hover:text-rose-300"
                            >
                                {loadingAdvice ? <Loader2 className="animate-spin" size={14}/> : <Lightbulb size={14}/>}
                                Minta Saran Perbaikan AI
                            </button>
                        ) : (
                            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-rose-200 dark:border-rose-800">
                                <h4 className="font-bold text-xs sm:text-sm text-rose-800 dark:text-rose-400 mb-2">Saran AI:</h4>
                                <div className="prose prose-sm prose-rose max-w-none text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-xl border border-rose-100 dark:border-rose-800 text-xs sm:text-sm">
                                    <SimpleMarkdown text={improvementAdvice} />
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden text-left mb-6 w-full">
                    <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-700 border-b border-slate-100 dark:border-slate-600 font-bold text-xs sm:text-sm tracking-widest text-slate-700 dark:text-slate-200 uppercase">Detail Jawaban</div>
                    <div className="max-h-80 sm:max-h-96 overflow-y-auto">
                        {questions.map((q, i) => {
                            const ans = answers.find(a => a.questionId === q.id);
                            const isCorrect = ans?.isCorrect;
                            const topicQuery = encodeURIComponent(`Pembahasan Soal ${category} ${q.metadata.subtest || q.metadata.topic}`);
                            
                            return (
                                <div key={i} className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-750 transition flex items-start gap-2">
                                    <div className="mt-0.5">{isCorrect ? <CheckCircle size={16} className="text-emerald-500 shrink-0"/> : <XCircle size={16} className="text-rose-500 shrink-0"/>}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1 gap-2 flex-wrap sm:flex-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">Soal {i+1}</span>
                                                {ans?.isDoubtful && (
                                                    <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-1.5 sm:px-2 py-0.5 rounded-full">
                                                        <Flag size={8} /> Ragu
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                <button 
                                                    onClick={() => window.dispatchEvent(new CustomEvent('openAiTutor', { detail: { context: `Tolong jelaskan soal ini secara detail:\n\n${q.content}\n\nPembahasan aslinya: ${q.explanation}`}}))}
                                                    className="text-[9px] sm:text-[10px] flex items-center gap-1 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 px-1.5 sm:px-2 py-1 rounded-full font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition whitespace-nowrap"
                                                >
                                                    <Bot size={10}/> AI
                                                </button>
                                                <a 
                                                    href={`https://www.youtube.com/results?search_query=${topicQuery}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-[9px] sm:text-[10px] flex items-center gap-1 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 px-1.5 sm:px-2 py-1 rounded-full font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition whitespace-nowrap"
                                                >
                                                    <Youtube size={10}/> Video
                                                </a>
                                            </div>
                                        </div>
                                        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-h-24 overflow-hidden relative mb-1.5">
                                            <SimpleMarkdown text={q.content} />
                                            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 dark:from-slate-750 to-transparent pointer-events-none"></div>
                                        </div>
                                        {!isCorrect && (
                                            <div className="text-[10px] sm:text-xs text-rose-500 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/40 p-2 rounded-lg break-words">
                                                <div className="flex gap-1 items-start">
                                                    <span className="font-bold shrink-0">Jwbn Anda:</span> 
                                                    <div className="flex-1 overflow-x-auto"><SimpleMarkdown text={ans?.selectedAnswer || '-'} /></div>
                                                </div>
                                                <div className="flex gap-1 items-start mt-1">
                                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 shrink-0">Kunci:</span> 
                                                    <div className="flex-1 text-emerald-500 overflow-x-auto"><SimpleMarkdown text={q.correctAnswer} /></div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full justify-center">
                    <button onClick={onHome} className="flex-1 sm:flex-none sm:px-6 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm">
                        Menu Utama
                    </button>
                    {onHistory && (
                        <button onClick={onHistory} className="flex-1 sm:flex-none sm:px-6 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm flex items-center justify-center gap-2">
                            <Activity size={16} /> Riwayat Belajar
                        </button>
                    )}
                    <button onClick={onRetry} className="flex-1 sm:flex-none sm:px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition">
                        Coba Lagi
                    </button>
                </div>
            </div>
        </div>
    );
};
