import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
    ArrowLeft, CheckCircle, XCircle, Flag, Zap, Activity, Clock, 
    Bot, Award, CheckSquare, Square, Star, Bookmark, BookOpen, 
    ChevronLeft, ChevronRight, Eye, EyeOff, Volume2, VolumeX, 
    Copy, Check, Edit3, Search, X, Sparkles, Filter, Lightbulb,
    FileText, HelpCircle, Layers, RefreshCw, AlertTriangle, ShieldCheck, 
    GraduationCap, Brain, Package, Target, Type, Keyboard, Plus, Minus, 
    RotateCcw, Sliders, Info
} from 'lucide-react';
import { 
    TestHistoryItem, TesKoranResultDetails, TesKecermatanResultDetails, 
    Question, UserAnswer, AppFontSize, AppSettings 
} from '../types';
import { SimpleMarkdown, MatrixQuestionRenderer, SvgRenderer } from './QuestionRenderer';
import { InteractiveFigural } from './InteractiveFigural';
import { SoundManager } from '../services/soundService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { analyzeTkpSessionPatterns, TkpAspectAnalysis, detectQuestionTopic } from '../src/utils/performanceAnalytics';

interface ReviewViewProps {
    item: TestHistoryItem;
    onBack: () => void;
    onToggleStudied?: (id: string) => void;
    settings?: AppSettings;
    isDarkMode?: boolean;
}

// LocalStorage Keys for persistent study features
const STORAGE_KEY_UNDERSTOOD = 'fajmuls_understood_questions';
const STORAGE_KEY_BEST_QUESTIONS = 'fajmuls_best_questions';
const STORAGE_KEY_QUESTION_NOTES = 'fajmuls_question_notes';
const STORAGE_KEY_REVIEW_FONT_SIZE = 'fajmuls_review_font_size';

// Helper to determine TKP points for a given option
const getTkpOptionPoints = (q: Question, optionText: string, optionIndex: number): number | null => {
    const isTkp = q.metadata?.subtest?.toUpperCase().includes('TKP') || 
                  (q.tkpPoints && q.tkpPoints.length > 0);
    if (!isTkp) return null;

    if (!q.tkpPoints || q.tkpPoints.length === 0) {
        const letter = String.fromCharCode(65 + optionIndex);
        if (q.correctAnswer === optionText || q.correctAnswer === letter) return 5;
        return null;
    }

    const normalizeText = (text: string) => text.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
    const normSelected = normalizeText(optionText);

    // Exact text match
    let match = q.tkpPoints.find(tp => normalizeText(tp.option) === normSelected);

    // Substring match
    if (!match) {
        match = q.tkpPoints.find(tp => {
            const normTp = normalizeText(tp.option);
            return normTp.includes(normSelected) || normSelected.includes(normTp);
        });
    }

    // Match by option letter (A, B, C, D, E)
    if (!match) {
        const letter = String.fromCharCode(65 + optionIndex);
        match = q.tkpPoints.find(tp => {
            const cleanTp = tp.option.trim().toUpperCase().replace(/[^A-E]/g, '');
            return cleanTp === letter || tp.option.trim().toUpperCase().startsWith(letter);
        });
    }

    // Index fallback
    if (!match && q.tkpPoints[optionIndex]) {
        match = q.tkpPoints[optionIndex];
    }

    return match ? Number(match.points) : null;
};

// Helper to determine earned TKP points from UserAnswer
const getTkpEarnedPoints = (q: Question, ans?: UserAnswer): number | null => {
    if (!ans) return null;
    if (typeof ans.scoreEarned === 'number' && ans.scoreEarned >= 1 && ans.scoreEarned <= 5) {
        return ans.scoreEarned;
    }
    if (ans.selectedAnswer && q.options) {
        const optIdx = q.options.findIndex((opt, idx) => 
            opt === ans.selectedAnswer || 
            String.fromCharCode(65 + idx) === ans.selectedAnswer
        );
        return getTkpOptionPoints(q, ans.selectedAnswer, optIdx >= 0 ? optIdx : 0);
    }
    return null;
};

// Styling helper for TKP Points 1-5 (Strict Red-to-Green gradient, No Blue)
const getTkpPointStyle = (points: number) => {
    switch (points) {
        case 5:
            return {
                badgeBg: 'bg-emerald-600 text-white font-black',
                border: 'border-emerald-500/80 dark:border-emerald-600',
                bg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
                textColor: 'text-emerald-950 dark:text-emerald-100',
                label: '5 Poin (Hijau Banget - Maksimal)',
                barColor: 'bg-emerald-600',
                ringColor: 'ring-emerald-500',
                progressWidth: '100%',
                navBoxClass: 'bg-emerald-600 text-white border-emerald-700 dark:border-emerald-500 shadow-xs hover:bg-emerald-700',
                navDotColor: 'bg-emerald-600'
            };
        case 4:
            return {
                badgeBg: 'bg-lime-600 text-white font-black',
                border: 'border-lime-500/80 dark:border-lime-600',
                bg: 'bg-lime-50/80 dark:bg-lime-950/30',
                textColor: 'text-lime-950 dark:text-lime-100',
                label: '4 Poin (Hijau Muda)',
                barColor: 'bg-lime-600',
                ringColor: 'ring-lime-500',
                progressWidth: '80%',
                navBoxClass: 'bg-lime-600 text-white border-lime-700 dark:border-lime-500 shadow-xs hover:bg-lime-700',
                navDotColor: 'bg-lime-600'
            };
        case 3:
            return {
                badgeBg: 'bg-amber-500 text-slate-950 font-black',
                border: 'border-amber-400/80 dark:border-amber-600',
                bg: 'bg-amber-50/80 dark:bg-amber-950/30',
                textColor: 'text-amber-950 dark:text-amber-100',
                label: '3 Poin (Kuning-Oranye)',
                barColor: 'bg-amber-500',
                ringColor: 'ring-amber-500',
                progressWidth: '60%',
                navBoxClass: 'bg-amber-500 text-slate-950 border-amber-600 dark:border-amber-400 shadow-xs font-black hover:bg-amber-400',
                navDotColor: 'bg-amber-500'
            };
        case 2:
            return {
                badgeBg: 'bg-orange-500 text-white font-black',
                border: 'border-orange-400/80 dark:border-orange-600',
                bg: 'bg-orange-50/80 dark:bg-orange-950/30',
                textColor: 'text-orange-950 dark:text-orange-100',
                label: '2 Poin (Oranye)',
                barColor: 'bg-orange-500',
                ringColor: 'ring-orange-500',
                progressWidth: '40%',
                navBoxClass: 'bg-orange-500 text-white border-orange-600 dark:border-orange-400 shadow-xs hover:bg-orange-600',
                navDotColor: 'bg-orange-500'
            };
        case 1:
        default:
            return {
                badgeBg: 'bg-red-800 text-white font-black',
                border: 'border-red-700/80 dark:border-red-800',
                bg: 'bg-red-50/90 dark:bg-red-950/50',
                textColor: 'text-red-950 dark:text-red-100',
                label: '1 Poin (Merah Tua - Terendah)',
                barColor: 'bg-red-800',
                ringColor: 'ring-red-800',
                progressWidth: '20%',
                navBoxClass: 'bg-red-800 text-white border-red-950 dark:border-red-900 shadow-xs font-black hover:bg-red-900',
                navDotColor: 'bg-red-800'
            };
    }
};

interface QuestionReviewCardProps {
    q: Question;
    originalIndex: number;
    fIdx: number;
    itemCategory: string;
    ans?: UserAnswer;
    isBest: boolean;
    isUnderstood: boolean;
    isSelfTestRevealed: boolean;
    isSelfTestMode: boolean;
    isTkp: boolean;
    isActiveInList: boolean;
    fontClassPrompt: string;
    fontClassOption: string;
    fontClassExplanation: string;
    isSpeaking: boolean;
    isCopied: boolean;
    isNoteOpen: boolean;
    noteText: string;
    onSelectCard: (fIdx: number) => void;
    onToggleBest: (id: string) => void;
    onToggleUnderstood: (id: string) => void;
    onToggleNoteEditor: (id: string) => void;
    onSaveNote: (id: string, text: string) => void;
    onSpeak: (id: string, text: string) => void;
    onCopy: (q: Question, idx: number) => void;
    onRevealSelfTest: (id: string) => void;
}

const QuestionReviewCard: React.FC<QuestionReviewCardProps> = React.memo(({
    q,
    originalIndex,
    fIdx,
    itemCategory,
    ans,
    isBest,
    isUnderstood,
    isSelfTestRevealed,
    isSelfTestMode,
    isTkp,
    isActiveInList,
    fontClassPrompt,
    fontClassOption,
    fontClassExplanation,
    isSpeaking,
    isCopied,
    isNoteOpen,
    noteText,
    onSelectCard,
    onToggleBest,
    onToggleUnderstood,
    onToggleNoteEditor,
    onSaveNote,
    onSpeak,
    onCopy,
    onRevealSelfTest,
}) => {
    return (
        <div 
            id={`question-card-${originalIndex}`}
            onClick={() => onSelectCard(fIdx)}
            className={`rounded-3xl bg-white dark:bg-slate-800 border transition-all p-5 sm:p-6 space-y-4 shadow-sm cursor-pointer ${
                isActiveInList 
                    ? 'ring-2 ring-indigo-500 border-indigo-400 dark:border-indigo-500 shadow-md'
                    : isBest 
                        ? 'ring-2 ring-amber-400/40 border-amber-300 dark:border-amber-700' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
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
                        {q.metadata?.subtest || q.metadata?.topic || itemCategory}
                    </span>
                    {isTkp && (
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-black border border-indigo-500/20">
                            Poin 1-5
                        </span>
                    )}
                    {ans?.isDoubtful && (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-black border border-amber-500/20 flex items-center gap-1">
                            <Flag size={10} /> Ragu
                        </span>
                    )}
                </div>

                {/* Action Buttons (Best, Understood, Note Toggle, TTS, AI) */}
                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {/* Mark Best */}
                    <button
                        onClick={() => onToggleBest(q.id)}
                        className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            isBest
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Tandai Soal Terbaik (Shortcut: B)"
                    >
                        <Star size={14} className={isBest ? 'fill-amber-500 text-amber-500' : ''} />
                        <span className="hidden sm:inline">{isBest ? 'Terbaik' : 'Tandai'}</span>
                    </button>

                    {/* Mark Understood */}
                    <button
                        onClick={() => onToggleUnderstood(q.id)}
                        className={`p-1.5 sm:px-2.5 sm:py-1 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                            isUnderstood
                                ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Tandai Sudah Paham (Shortcut: P)"
                    >
                        <CheckCircle size={14} className={isUnderstood ? 'text-emerald-600' : ''} />
                        <span className="hidden sm:inline">{isUnderstood ? 'Paham' : 'Paham?'}</span>
                    </button>

                    {/* Toggle Personal Note Editor */}
                    <button
                        onClick={() => onToggleNoteEditor(q.id)}
                        className={`p-1.5 rounded-xl text-xs transition ${
                            noteText || isNoteOpen
                                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Tulis Catatan Pribadi (Shortcut: N)"
                    >
                        <Edit3 size={14} />
                    </button>

                    {/* TTS Reader */}
                    <button
                        onClick={() => onSpeak(q.id, `${q.content}. Pembahasan: ${q.explanation}`)}
                        className={`p-1.5 rounded-xl text-xs transition ${
                            isSpeaking ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Dengarkan Audio Soal (Shortcut: A)"
                    >
                        <Volume2 size={14} />
                    </button>

                    {/* Copy */}
                    <button
                        onClick={() => onCopy(q, originalIndex)}
                        className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-400 hover:text-slate-600 transition"
                        title="Salin Teks Soal (Shortcut: C)"
                    >
                        {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                </div>
            </div>

            {/* Question Prompt */}
            <div className={`${fontClassPrompt} font-medium text-slate-800 dark:text-slate-100`}>
                <SimpleMarkdown text={q.content} />
            </div>

            {/* Options */}
            {q.options && q.options.length > 0 && (
                <div className="space-y-2 pt-1">
                    {q.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const isUserSelected = ans?.selectedAnswer === opt || ans?.selectedAnswer === letter;
                        const isCorrectOption = q.correctAnswer === opt || q.correctAnswer === letter;
                        const tkpPoints = getTkpOptionPoints(q, opt, oIdx);

                        let optionClass = 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                        let tkpStyle = tkpPoints !== null ? getTkpPointStyle(tkpPoints) : null;

                        if (isSelfTestRevealed) {
                            if (isTkp && tkpStyle) {
                                optionClass = `${tkpStyle.bg} ${tkpStyle.border} ${tkpStyle.textColor} ${isUserSelected ? `ring-2 ${tkpStyle.ringColor} font-bold` : ''}`;
                            } else {
                                if (isCorrectOption) {
                                    optionClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/60 text-emerald-900 dark:text-emerald-200 font-bold';
                                } else if (isUserSelected && !isCorrectOption) {
                                    optionClass = 'bg-rose-50 dark:bg-rose-950/30 border-rose-500/60 text-rose-900 dark:text-rose-200';
                                }
                            }
                        } else if (isUserSelected) {
                            optionClass = 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-500/60 text-indigo-900 dark:text-indigo-200 font-bold';
                        }

                        return (
                            <div key={oIdx} className={`p-3 rounded-2xl border flex flex-col gap-1.5 transition ${optionClass}`}>
                                <div className="flex items-start gap-2.5">
                                    <span className="w-5 h-5 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center font-black text-[11px] shrink-0">
                                        {letter}
                                    </span>
                                    <div className={`flex-1 ${fontClassOption}`}>
                                        <SimpleMarkdown text={opt} isOption={true} />
                                    </div>
                                    
                                    {/* TKP Points Badge or Normal Key Badge */}
                                    {isSelfTestRevealed && isTkp && tkpStyle && (
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg shrink-0 shadow-xs ${tkpStyle.badgeBg}`}>
                                            {tkpPoints} Poin
                                        </span>
                                    )}

                                    {isSelfTestRevealed && !isTkp && isCorrectOption && (
                                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500 text-white shrink-0">
                                            Kunci
                                        </span>
                                    )}
                                    
                                    {isUserSelected && (
                                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-indigo-600 text-white shrink-0 shadow-xs">
                                            Jawabanmu {isTkp && tkpPoints !== null && `(${tkpPoints} Poin)`}
                                        </span>
                                    )}
                                </div>

                                {/* TKP Mini Bar in List Mode */}
                                {isSelfTestRevealed && isTkp && tkpStyle && (
                                    <div className="w-full bg-black/5 dark:bg-white/5 h-1 rounded-full overflow-hidden">
                                        <div className={`h-full ${tkpStyle.barColor}`} style={{ width: tkpStyle.progressWidth }} />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* TKP Points Summary Bar */}
            {isSelfTestRevealed && isTkp && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Rincian Bobot Nilai TKP:</span>
                        <span className="text-emerald-500 font-bold">1 (Merah) → 5 (Hijau)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {q.options && q.options.map((opt, oIdx) => {
                            const letter = String.fromCharCode(65 + oIdx);
                            const pts = getTkpOptionPoints(q, opt, oIdx) || (oIdx + 1);
                            const st = getTkpPointStyle(pts);
                            return (
                                <div key={oIdx} className={`px-2 py-1 rounded-lg border text-[11px] flex items-center gap-1.5 ${st.bg} ${st.border}`}>
                                    <span className="font-bold">{letter}:</span>
                                    <span className={`px-1.5 py-0.2 rounded font-black text-[10px] ${st.badgeBg}`}>{pts} Poin</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Self-Test Reveal Barrier or Explanation Block */}
            {isSelfTestMode && !isSelfTestRevealed ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/60 rounded-2xl flex items-center justify-between gap-3">
                    <div className="text-xs text-amber-800 dark:text-amber-300 font-bold flex items-center gap-2">
                        <EyeOff size={15} /> Kunci & Pembahasan disembunyikan untuk uji mandiri
                    </div>
                    <button
                        onClick={() => onRevealSelfTest(q.id)}
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
                    <div className={`${fontClassExplanation} text-slate-700 dark:text-slate-300 leading-relaxed`}>
                        <SimpleMarkdown text={q.explanation} />
                    </div>
                </div>
            )}

            {/* Collapsible / Active Note Editor */}
            {(isNoteOpen || noteText) && (
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        <span className="flex items-center gap-1 text-amber-500">
                            <Edit3 size={12} /> Catatan Belajar Pribadi
                        </span>
                        <span className="text-[10px] text-slate-400">Tersimpan otomatis</span>
                    </div>
                    <textarea
                        value={noteText}
                        onChange={(e) => onSaveNote(q.id, e.target.value)}
                        placeholder="Tulis catatan rumus, pola logika, atau pengingat..."
                        className={`w-full p-2.5 ${fontClassExplanation} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white`}
                        rows={2}
                    />
                </div>
            )}
        </div>
    );
});

export const ReviewView: React.FC<ReviewViewProps> = ({ item, onBack, onToggleStudied, settings, isDarkMode }) => {
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

    // Font Size State
    const [fontSize, setFontSize] = useState<AppFontSize>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_REVIEW_FONT_SIZE);
            return (saved as AppFontSize) || 'md';
        } catch {
            return 'md';
        }
    });

    const fontSizes: AppFontSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    const changeFontSize = (dir: 'up' | 'down') => {
        SoundManager.play('click');
        setFontSize(prev => {
            const idx = fontSizes.indexOf(prev);
            let next = prev;
            if (dir === 'up' && idx < fontSizes.length - 1) {
                next = fontSizes[idx + 1];
            } else if (dir === 'down' && idx > 0) {
                next = fontSizes[idx - 1];
            }
            try {
                localStorage.setItem(STORAGE_KEY_REVIEW_FONT_SIZE, next);
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    };

    const resetFontSize = () => {
        SoundManager.play('click');
        setFontSize('md');
        try {
            localStorage.setItem(STORAGE_KEY_REVIEW_FONT_SIZE, 'md');
        } catch (e) {
            console.error(e);
        }
    };

    // Save helper functions
    const toggleUnderstood = useCallback((questionId: string) => {
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
    }, []);

    const toggleBestQuestion = useCallback((questionId: string) => {
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
    }, []);

    const saveNote = useCallback((questionId: string, noteText: string) => {
        setNotesMap(prev => {
            const next = { ...prev, [questionId]: noteText };
            try {
                localStorage.setItem(STORAGE_KEY_QUESTION_NOTES, JSON.stringify(next));
            } catch (e) {
                console.error(e);
            }
            return next;
        });
    }, []);

    // ----------------------------------------------------
    // STUDY INTERFACE CONTROLS
    // ----------------------------------------------------
    const [studyMode, setStudyMode] = useState<'LIST' | 'FOCUS'>('LIST');
    const [focusIndex, setFocusIndex] = useState<number>(0);
    const [activeListIndex, setActiveListIndex] = useState<number>(0);
    const [isSelfTestMode, setIsSelfTestMode] = useState<boolean>(false);
    const [revealedSelfTestQuestions, setRevealedSelfTestQuestions] = useState<Set<string>>(new Set());
    const [filterType, setFilterType] = useState<'ALL' | 'WRONG' | 'FLAGGED' | 'BEST' | 'UNDERSTOOD' | 'UNUNDERSTOOD' | 'TKP_LOW'>('ALL');
    const [selectedTkpAspect, setSelectedTkpAspect] = useState<string | null>(null);
    const [isTkpAnalysisExpanded, setIsTkpAnalysisExpanded] = useState<boolean>(true);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [activeNoteEditor, setActiveNoteEditor] = useState<string | null>(null);
    const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
    const [speakingQuestionId, setSpeakingQuestionId] = useState<string | null>(null);
    const [showShortcutModal, setShowShortcutModal] = useState<boolean>(false);

    // Scroll helper for List Mode (smooth and non-intrusive)
    const scrollToQuestion = useCallback((originalIndex: number) => {
        const el = document.getElementById(`question-card-${originalIndex}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, []);

    // Theme and background derivation
    const isFajmulsTheme = settings?.theme === 'fajmuls';
    const isDark = isDarkMode || settings?.darkMode || settings?.theme === 'dark';

    const containerBgClass = useMemo(() => {
        if (isFajmulsTheme) {
            return 'bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-slate-100/90 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900 text-slate-900 dark:text-slate-100';
        }
        if (isDark) {
            return 'bg-slate-950 text-slate-100';
        }
        return 'bg-slate-100/80 text-slate-800';
    }, [isFajmulsTheme, isDark]);

    // ----------------------------------------------------
    // TEXT-TO-SPEECH (TTS)
    // ----------------------------------------------------
    const speakText = useCallback((questionId: string, textToSpeak: string) => {
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
    }, [speakingQuestionId]);

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
    const handleCopyQuestion = useCallback((q: Question, qIndex: number) => {
        const text = `Soal No. ${qIndex + 1} (${q.metadata?.subtest || q.metadata?.topic || item.category}):\n\n${q.content}\n\nKunci Jawaban: ${q.correctAnswer}\n\nPembahasan:\n${q.explanation}`;
        navigator.clipboard.writeText(text);
        setCopiedQuestionId(q.id);
        SoundManager.play('click');
        setTimeout(() => setCopiedQuestionId(null), 2000);
    }, [item.category]);

    // Stable card action callbacks for QuestionReviewCard
    const handleSelectCard = useCallback((fIdx: number) => {
        setActiveListIndex(fIdx);
    }, []);

    const handleToggleBest = useCallback((id: string) => {
        toggleBestQuestion(id);
    }, [toggleBestQuestion]);

    const handleToggleUnderstood = useCallback((id: string) => {
        toggleUnderstood(id);
    }, [toggleUnderstood]);

    const handleToggleNoteEditor = useCallback((id: string) => {
        setActiveNoteEditor(prev => prev === id ? null : id);
    }, []);

    const handleSaveNote = useCallback((id: string, text: string) => {
        saveNote(id, text);
    }, [saveNote]);

    const handleSpeak = useCallback((id: string, text: string) => {
        speakText(id, text);
    }, [speakText]);

    const handleCopy = useCallback((q: Question, idx: number) => {
        handleCopyQuestion(q, idx);
    }, [handleCopyQuestion]);

    const handleRevealSelfTest = useCallback((id: string) => {
        SoundManager.play('click');
        setRevealedSelfTestQuestions(prev => new Set([...prev, id]));
    }, []);

    // ----------------------------------------------------
    // DATA DERIVATION & FILTERING
    // ----------------------------------------------------
    const questions = useMemo(() => item.questions || [], [item.questions]);
    const answers = useMemo(() => item.answers || [], [item.answers]);

    // TKP Session Pattern Analysis (Poin 1-5 per Aspek)
    const tkpAnalysis = useMemo(() => analyzeTkpSessionPatterns(item), [item]);

    // Questions count metrics
    const wrongQuestionsCount = useMemo(() => {
        return answers.filter(a => !a.isCorrect && (a.scoreEarned === undefined || a.scoreEarned < 4)).length;
    }, [answers]);

    const flaggedCount = useMemo(() => {
        return answers.filter(a => a.isDoubtful).length;
    }, [answers]);

    const bestQuestionsCount = useMemo(() => {
        return questions.filter(q => bestQuestionsSet.has(q.id)).length;
    }, [questions, bestQuestionsSet]);

    const understoodCount = useMemo(() => {
        return questions.filter(q => understoodSet.has(q.id)).length;
    }, [questions, understoodSet]);

    const masteryPercentage = useMemo(() => {
        if (questions.length === 0) return 0;
        return Math.round((understoodCount / questions.length) * 100);
    }, [understoodCount, questions.length]);

    // Filtered Question List with original index mapping
    const filteredQuestions = useMemo(() => {
        return questions.map((q, originalIndex) => ({ q, originalIndex })).filter(({ q, originalIndex }) => {
            const ans = answers.find(a => a.questionId === q.id) || answers[originalIndex];
            const isCorrect = ans?.isCorrect || (ans?.scoreEarned && ans.scoreEarned >= 4);

            if (filterType === 'WRONG') {
                if (isCorrect) return false;
            } else if (filterType === 'FLAGGED') {
                if (!ans?.isDoubtful) return false;
            } else if (filterType === 'BEST') {
                if (!bestQuestionsSet.has(q.id)) return false;
            } else if (filterType === 'UNDERSTOOD') {
                if (!understoodSet.has(q.id)) return false;
            } else if (filterType === 'UNUNDERSTOOD') {
                if (understoodSet.has(q.id)) return false;
            } else if (filterType === 'TKP_LOW') {
                const isTkp = q.metadata?.subtest?.toUpperCase().includes('TKP') || (q.tkpPoints && q.tkpPoints.length > 0);
                if (!isTkp) return false;
                let earned = 1;
                if (typeof ans?.scoreEarned === 'number' && ans.scoreEarned > 0) {
                    earned = ans.scoreEarned;
                } else if (ans?.selectedAnswer && q.tkpPoints && q.tkpPoints.length > 0) {
                    const normSelected = ans.selectedAnswer.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
                    const matched = q.tkpPoints.find(tp => tp.option.trim().toLowerCase().replace(/[^a-z0-9]/gi, '') === normSelected);
                    earned = matched ? Number(matched.points) : (ans.isCorrect ? 5 : 1);
                } else if (ans?.isCorrect) {
                    earned = 5;
                }
                if (earned > 3) return false; // Hanya tampilkan butir soal dengan skor 1, 2, atau 3
            }

            // Filter berdasarkan Aspek TKP terpilih
            if (selectedTkpAspect) {
                const detected = detectQuestionTopic(q);
                const qAspect = detected.topic || q.metadata?.topic || '';
                if (qAspect !== selectedTkpAspect && !qAspect.toLowerCase().includes(selectedTkpAspect.toLowerCase())) {
                    return false;
                }
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
    }, [questions, answers, filterType, selectedTkpAspect, searchQuery, bestQuestionsSet, understoodSet, notesMap]);

    // Active question helper for shortcut handlers
    const currentActiveQuestion = useMemo(() => {
        if (studyMode === 'FOCUS') {
            const currentItem = filteredQuestions[Math.min(focusIndex, filteredQuestions.length - 1)];
            return currentItem ? currentItem.q : questions[0];
        } else {
            const currentItem = filteredQuestions[Math.min(activeListIndex, filteredQuestions.length - 1)];
            return currentItem ? currentItem.q : questions[0];
        }
    }, [studyMode, focusIndex, activeListIndex, filteredQuestions, questions]);

    // ----------------------------------------------------
    // COMPREHENSIVE KEYBOARD SHORTCUTS
    // ----------------------------------------------------
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore when typing in text input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                if (e.key === 'Escape') {
                    (e.target as HTMLElement).blur();
                }
                return;
            }

            // Global shortcut handler
            if (e.key === '?' || e.key === 'h' || e.key === 'H') {
                e.preventDefault();
                setShowShortcutModal(prev => !prev);
                return;
            }

            if (e.key === 'Escape') {
                if (showShortcutModal) {
                    setShowShortcutModal(false);
                    return;
                }
                if (searchQuery) {
                    setSearchQuery('');
                    return;
                }
                if (activeNoteEditor) {
                    setActiveNoteEditor(null);
                    return;
                }
            }

            // Font size shortcuts (matching Session Engine: Q = down, W = up)
            if (e.key === 'w' || e.key === 'W' || e.key === '+' || e.key === '=' || e.key === ']') {
                e.preventDefault();
                changeFontSize('up');
                return;
            }
            if (e.key === 'q' || e.key === 'Q' || e.key === '-' || e.key === '_' || e.key === '[') {
                e.preventDefault();
                changeFontSize('down');
                return;
            }
            if (e.key === '0') {
                e.preventDefault();
                resetFontSize();
                return;
            }

            // View Mode Toggle (V or L)
            if (e.key === 'v' || e.key === 'V' || e.key === 'l' || e.key === 'L') {
                e.preventDefault();
                SoundManager.play('click');
                setStudyMode(prev => prev === 'LIST' ? 'FOCUS' : 'LIST');
                return;
            }

            // Self-Test Toggle (T or M)
            if (e.key === 't' || e.key === 'T' || e.key === 'm' || e.key === 'M') {
                e.preventDefault();
                SoundManager.play('click');
                setIsSelfTestMode(prev => {
                    const next = !prev;
                    if (!next) setRevealedSelfTestQuestions(new Set());
                    return next;
                });
                return;
            }

            // Filter Shortcuts (1: All, 2: Wrong, 3: Flagged, 4: Best, 5: Understood, 6: Ununderstood)
            if (e.key === '1') { setFilterType('ALL'); SoundManager.play('click'); return; }
            if (e.key === '2') { setFilterType('WRONG'); SoundManager.play('click'); return; }
            if (e.key === '3') { setFilterType('FLAGGED'); SoundManager.play('click'); return; }
            if (e.key === '4') { setFilterType('BEST'); SoundManager.play('click'); return; }
            if (e.key === '5') { setFilterType('UNDERSTOOD'); SoundManager.play('click'); return; }
            if (e.key === '6') { setFilterType('UNUNDERSTOOD'); SoundManager.play('click'); return; }

            // Actions on current question
            if (currentActiveQuestion) {
                // Toggle Understood (P or U)
                if (e.key === 'p' || e.key === 'P' || e.key === 'u' || e.key === 'U') {
                    e.preventDefault();
                    toggleUnderstood(currentActiveQuestion.id);
                    return;
                }

                // Toggle Best Question (B or S)
                if (e.key === 'b' || e.key === 'B' || e.key === 's' || e.key === 'S') {
                    e.preventDefault();
                    toggleBestQuestion(currentActiveQuestion.id);
                    return;
                }

                // Copy question (C)
                if (e.key === 'c' || e.key === 'C') {
                    e.preventDefault();
                    const qIdx = questions.findIndex(q => q.id === currentActiveQuestion.id);
                    handleCopyQuestion(currentActiveQuestion, qIdx >= 0 ? qIdx : 0);
                    return;
                }

                // Speak TTS (A)
                if (e.key === 'a' || e.key === 'A') {
                    e.preventDefault();
                    speakText(currentActiveQuestion.id, `${currentActiveQuestion.content}. Pembahasan: ${currentActiveQuestion.explanation}`);
                    return;
                }

                // Toggle Note Editor (N or E)
                if (e.key === 'n' || e.key === 'N' || e.key === 'e' || e.key === 'E') {
                    e.preventDefault();
                    setActiveNoteEditor(prev => prev === currentActiveQuestion.id ? null : currentActiveQuestion.id);
                    return;
                }
            }

            // Arrow keys & j/k navigation for BOTH Focus Mode and List Mode
            // ArrowUp and ArrowDown are deliberately omitted so they perform smooth natural page scrolling!
            if (e.key === 'ArrowLeft' || e.key === 'k' || e.key === 'K') {
                e.preventDefault();
                if (studyMode === 'FOCUS') {
                    if (focusIndex > 0) {
                        setFocusIndex(prev => {
                            SoundManager.play('click');
                            return Math.max(0, prev - 1);
                        });
                    }
                } else {
                    if (activeListIndex > 0) {
                        const next = activeListIndex - 1;
                        setActiveListIndex(next);
                        SoundManager.play('click');
                        const target = filteredQuestions[next];
                        if (target) {
                            requestAnimationFrame(() => scrollToQuestion(target.originalIndex));
                        }
                    }
                }
                return;
            }

            if (e.key === 'ArrowRight' || e.key === 'j' || e.key === 'J') {
                e.preventDefault();
                if (studyMode === 'FOCUS') {
                    if (focusIndex < filteredQuestions.length - 1) {
                        setFocusIndex(prev => {
                            SoundManager.play('click');
                            return Math.min(filteredQuestions.length - 1, prev + 1);
                        });
                    }
                } else {
                    if (activeListIndex < filteredQuestions.length - 1) {
                        const next = activeListIndex + 1;
                        setActiveListIndex(next);
                        SoundManager.play('click');
                        const target = filteredQuestions[next];
                        if (target) {
                            requestAnimationFrame(() => scrollToQuestion(target.originalIndex));
                        }
                    }
                }
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [studyMode, filteredQuestions, focusIndex, activeListIndex, currentActiveQuestion, showShortcutModal, searchQuery, activeNoteEditor, questions, scrollToQuestion, toggleUnderstood, toggleBestQuestion, handleCopyQuestion, speakText]);

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

    // Font Size Class Resolvers
    const fontClassPrompt = useMemo(() => {
        switch (fontSize) {
            case 'xs': return 'text-xs leading-normal';
            case 'sm': return 'text-sm leading-relaxed';
            case 'lg': return 'text-lg sm:text-xl leading-relaxed';
            case 'xl': return 'text-xl sm:text-2xl leading-relaxed';
            case 'md':
            default:
                return 'text-base sm:text-lg leading-relaxed';
        }
    }, [fontSize]);

    const fontClassOption = useMemo(() => {
        switch (fontSize) {
            case 'xs': return 'text-xs';
            case 'sm': return 'text-xs sm:text-sm';
            case 'lg': return 'text-base sm:text-lg';
            case 'xl': return 'text-lg sm:text-xl';
            case 'md':
            default:
                return 'text-sm sm:text-base';
        }
    }, [fontSize]);

    const fontClassExplanation = useMemo(() => {
        switch (fontSize) {
            case 'xs': return 'text-xs';
            case 'sm': return 'text-xs sm:text-sm';
            case 'lg': return 'text-base sm:text-lg';
            case 'xl': return 'text-lg sm:text-xl';
            case 'md':
            default:
                return 'text-xs sm:text-sm';
        }
    }, [fontSize]);

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
            <div className={`min-h-screen ${containerBgClass} px-4 md:px-6 py-6 transition-colors`}>
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <button onClick={onBack} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                            <ArrowLeft size={16} /> Kembali ke Riwayat
                        </button>
                        {onToggleStudied && (
                            <button
                                onClick={() => onToggleStudied(item.id)}
                                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${item.isStudied ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'}`}
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

    return (
        <div className={`min-h-screen ${containerBgClass} px-4 md:px-6 py-4 md:py-6 transition-colors pb-24`}>
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* ---------------------------------------------------- */}
                {/* TOP NAVIGATION & UTILITY BAR */}
                {/* ---------------------------------------------------- */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

                    {/* Right Tools: Font Size Control, Shortcuts Modal, Studied toggle */}
                    <div className="flex items-center flex-wrap gap-2">
                        {/* Font Size Adjuster Buttons */}
                        <div className="flex items-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-1 shadow-sm">
                            <button
                                onClick={() => changeFontSize('down')}
                                disabled={fontSize === 'xs'}
                                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                                title="Perkecil Ukuran Font (- atau [)"
                            >
                                <Minus size={14} />
                            </button>
                            
                            <button
                                onClick={resetFontSize}
                                className="px-2 py-0.5 text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition"
                                title="Reset Font ke Normal (Tekan 0)"
                            >
                                <span className="text-[11px]">A {fontSize.toUpperCase()}</span>
                            </button>

                            <button
                                onClick={() => changeFontSize('up')}
                                disabled={fontSize === 'xl'}
                                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                                title="Perbesar Ukuran Font (+ atau ])"
                            >
                                <Plus size={14} />
                            </button>
                        </div>

                        {/* Keyboard Shortcut Help Button */}
                        <button
                            onClick={() => {
                                SoundManager.play('click');
                                setShowShortcutModal(true);
                            }}
                            className="px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center gap-1.5 shadow-sm"
                            title="Buka Panduan Shortcut Keyboard (Tekan ? atau H)"
                        >
                            <Keyboard size={15} className="text-indigo-500" />
                            <span className="hidden md:inline">Shortcut</span>
                            <kbd className="hidden sm:inline-block px-1 py-0.2 bg-slate-100 dark:bg-slate-700 rounded text-[9px] font-mono text-slate-500">?</kbd>
                        </button>

                        {/* Global Studied Status Toggle */}
                        {onToggleStudied && (
                            <button
                                onClick={() => onToggleStudied(item.id)}
                                className={`px-3.5 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                                    item.isStudied 
                                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20' 
                                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                {item.isStudied ? <CheckCircle size={15} className="text-white" /> : <BookOpen size={15} className="text-indigo-500" />}
                                <span className="hidden sm:inline">{item.isStudied ? 'Paket Selesai Dipelajari' : 'Tandai Paket Dipelajari'}</span>
                                <span className="sm:hidden">{item.isStudied ? 'Selesai' : 'Dipelajari'}</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* ---------------------------------------------------- */}
                {/* HERO OVERVIEW CARD */}
                {/* ---------------------------------------------------- */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                        {/* Left Title & Meta */}
                        <div className="lg:col-span-2 space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-3 py-1 bg-indigo-500/30 border border-indigo-400/40 rounded-full text-[10px] font-black uppercase tracking-wider text-indigo-200 flex items-center gap-1.5">
                                    <Sparkles size={12} /> Modul Belajar & Pembahasan v4.3.0
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
                {/* ANALISIS POLA JAWABAN TKP PER ASPEK (POIN 1-5) */}
                {/* ---------------------------------------------------- */}
                {tkpAnalysis.hasTkpQuestions && (
                    <div className="rounded-3xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900/50 shadow-md overflow-hidden transition-all text-left">
                        {/* Header Toggle */}
                        <div 
                            onClick={() => setIsTkpAnalysisExpanded(!isTkpAnalysisExpanded)}
                            className="p-5 sm:p-6 bg-gradient-to-r from-indigo-50/70 via-purple-50/30 to-white dark:from-slate-800 dark:via-indigo-950/20 dark:to-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-indigo-50/90 dark:hover:bg-slate-750 transition"
                        >
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="p-1.5 rounded-xl bg-indigo-600 text-white shadow-sm">
                                        <Activity size={16} />
                                    </span>
                                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                                        Analisis Pola Jawaban TKP per Aspek
                                    </h2>
                                    {tkpAnalysis.criticalAspects.length > 0 ? (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-900 flex items-center gap-1">
                                            <AlertTriangle size={12} /> {tkpAnalysis.totalLowPoints} Soal Skor 1–3 ({tkpAnalysis.criticalAspects.length} Aspek Kritis)
                                        </span>
                                    ) : (
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 flex items-center gap-1">
                                            <CheckCircle size={12} /> Pola Jawaban Unggul (Aman)
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Evaluasi perolehan bobot nilai 1 s/d 5 pada 6 Aspek TKP (Pelayanan Publik, Jejaring Kerja, Sosial Budaya, TIK, Profesionalisme, Anti Radikalisme).
                                </p>
                            </div>

                            {/* Score & Toggle */}
                            <div className="flex items-center gap-3 self-start md:self-auto">
                                <div className="text-right">
                                    <div className="text-[10px] uppercase font-bold text-slate-400">Rata-rata Skor TKP</div>
                                    <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                        {tkpAnalysis.overallAverageScore} <span className="text-xs text-slate-400 font-semibold">/ 5.00</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    className="p-2 rounded-2xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 shadow-xs"
                                >
                                    <Sliders size={16} className={`transition-transform duration-200 ${isTkpAnalysisExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Expanded Body */}
                        {isTkpAnalysisExpanded && (
                            <div className="p-5 sm:p-6 border-t border-indigo-100/80 dark:border-slate-700 space-y-6">
                                
                                {/* Diagnostic Message & Point Distribution */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="lg:col-span-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 flex items-start gap-3">
                                        <Sparkles size={18} className="text-amber-500 shrink-0 mt-0.5" />
                                        <div className="space-y-1 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                                            <span className="font-bold text-slate-900 dark:text-white">Diagnosis Performa TKP: </span>
                                            <span>{tkpAnalysis.summaryMessage}</span>
                                        </div>
                                    </div>

                                    {/* Overall 1-5 Point Distribution Card */}
                                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                            Sebaran Bobot Jawaban Sesi Ini
                                        </div>
                                        <div className="grid grid-cols-5 gap-1.5 text-center">
                                            <div className="p-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                                                <div className="text-[9px]">5 Poin</div>
                                                <div className="text-sm font-black">{tkpAnalysis.overallPointDistribution.points5}</div>
                                            </div>
                                            <div className="p-1.5 rounded-xl bg-lime-100 dark:bg-lime-950/60 text-lime-800 dark:text-lime-300 border border-lime-200 dark:border-lime-800 font-bold">
                                                <div className="text-[9px]">4 Poin</div>
                                                <div className="text-sm font-black">{tkpAnalysis.overallPointDistribution.points4}</div>
                                            </div>
                                            <div className="p-1.5 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold">
                                                <div className="text-[9px]">3 Poin</div>
                                                <div className="text-sm font-black">{tkpAnalysis.overallPointDistribution.points3}</div>
                                            </div>
                                            <div className="p-1.5 rounded-xl bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800 font-bold">
                                                <div className="text-[9px]">2 Poin</div>
                                                <div className="text-sm font-black">{tkpAnalysis.overallPointDistribution.points2}</div>
                                            </div>
                                            <div className="p-1.5 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-900 font-black">
                                                <div className="text-[9px]">1 Poin</div>
                                                <div className="text-sm font-black">{tkpAnalysis.overallPointDistribution.points1}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Aspect Cards Grid */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                            <Target size={14} className="text-indigo-500" />
                                            Rincian Evaluasi Aspek & Rekomendasi Poin 5
                                        </h3>
                                        {selectedTkpAspect && (
                                            <button
                                                onClick={() => setSelectedTkpAspect(null)}
                                                className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
                                            >
                                                <X size={12} /> Hapus Filter Aspek ({selectedTkpAspect})
                                            </button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {tkpAnalysis.aspects.map((aspect, aIdx) => {
                                            const isCritical = aspect.status === 'CRITICAL';
                                            const isSelected = selectedTkpAspect === aspect.aspect;

                                            // Gradient progress bar color
                                            let barColor = 'from-emerald-500 to-emerald-400';
                                            let avgBadgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';

                                            if (aspect.averageScore < 3.5 || aspect.lowPointsCount >= 2) {
                                                barColor = 'from-rose-500 to-orange-400';
                                                avgBadgeColor = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
                                            } else if (aspect.averageScore < 4.2 || aspect.lowPointsCount >= 1) {
                                                barColor = 'from-amber-500 to-yellow-400';
                                                avgBadgeColor = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
                                            }

                                            return (
                                                <div 
                                                    key={aIdx}
                                                    className={`rounded-2xl p-4 transition-all flex flex-col justify-between space-y-3.5 border ${
                                                        isSelected 
                                                            ? 'ring-2 ring-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-400' 
                                                            : isCritical
                                                            ? 'bg-rose-50/30 dark:bg-slate-900/60 border-rose-200/70 dark:border-rose-900/40 hover:border-rose-300'
                                                            : 'bg-white dark:bg-slate-850 border-slate-200/80 dark:border-slate-700/80 hover:border-indigo-200'
                                                    }`}
                                                >
                                                    <div className="space-y-2">
                                                        {/* Aspect Title & Average Score */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div>
                                                                <h4 className="text-sm font-black text-slate-900 dark:text-white leading-snug">
                                                                    {aspect.aspect}
                                                                </h4>
                                                                <span className="text-[10px] text-slate-400 font-medium">
                                                                    {aspect.totalQuestions} Butir Soal ({aspect.scoreEarned}/{aspect.maxScore} Poin)
                                                                </span>
                                                            </div>
                                                            
                                                            <div className={`px-2 py-1 rounded-xl text-xs font-black border shrink-0 text-right ${avgBadgeColor}`}>
                                                                <span>{aspect.averageScore}</span>
                                                                <span className="text-[9px] opacity-70"> / 5.0</span>
                                                            </div>
                                                        </div>

                                                        {/* Visual Progress Bar */}
                                                        <div className="space-y-1">
                                                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-300`}
                                                                    style={{ width: `${Math.min(100, Math.max(10, aspect.percentageOfMax))}%` }}
                                                                />
                                                            </div>
                                                            <div className="flex justify-between text-[9px] text-slate-400 font-semibold">
                                                                <span>Akurasi {aspect.percentageOfMax}%</span>
                                                                <span>{aspect.statusLabel}</span>
                                                            </div>
                                                        </div>

                                                        {/* Point Breakdown Dots */}
                                                        <div className="flex items-center gap-1 pt-1 flex-wrap text-[10px] font-bold">
                                                            <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                                                                P5: {aspect.pointDistribution.points5}
                                                            </span>
                                                            <span className="px-1.5 py-0.5 rounded-md bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300 font-bold">
                                                                P4: {aspect.pointDistribution.points4}
                                                            </span>
                                                            {aspect.pointDistribution.points3 > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                                                                P3: {aspect.pointDistribution.points3}
                                                                </span>
                                                            )}
                                                            {aspect.pointDistribution.points2 > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300">
                                                                P2: {aspect.pointDistribution.points2}
                                                                </span>
                                                            )}
                                                            {aspect.pointDistribution.points1 > 0 && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 font-black">
                                                                P1: {aspect.pointDistribution.points1}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Critical Low-Points Warning */}
                                                        {aspect.lowPointsCount > 0 && (
                                                            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-300 leading-snug flex items-start gap-1.5">
                                                                <AlertTriangle size={13} className="shrink-0 mt-0.5 text-rose-500" />
                                                                <div>
                                                                    <span className="font-bold">Perlu Perhatian: </span>
                                                                    <span>Ada <b>{aspect.lowPointsCount} soal</b> yang mendapat poin 1-3.</span>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {/* Strategy Tip */}
                                                        <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                                            <span className="font-bold text-indigo-600 dark:text-indigo-400">💡 Tips Pola Pikir: </span>
                                                            <span>{aspect.strategyTip}</span>
                                                        </div>
                                                    </div>

                                                    {/* Action Buttons */}
                                                    <div className="pt-2 border-t border-slate-100 dark:border-slate-750 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                SoundManager.play('click');
                                                                setSelectedTkpAspect(isSelected ? null : aspect.aspect);
                                                                setFilterType('ALL');
                                                            }}
                                                            className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition text-center ${
                                                                isSelected
                                                                    ? 'bg-indigo-600 text-white shadow-xs'
                                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-600'
                                                            }`}
                                                        >
                                                            {isSelected ? '✓ Aspek Terpilih' : `Semua Soal (${aspect.totalQuestions})`}
                                                        </button>

                                                        {aspect.lowPointsCount > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    SoundManager.play('click');
                                                                    setSelectedTkpAspect(aspect.aspect);
                                                                    setFilterType('TKP_LOW');
                                                                }}
                                                                className="py-1.5 px-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white transition flex items-center gap-1 shadow-xs"
                                                                title="Filter hanya butir soal aspek ini yang mendapatkan poin 1-3"
                                                            >
                                                                <XCircle size={12} /> Poin 1-3 ({aspect.lowPointsCount})
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

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
                                <kbd className="hidden sm:inline-block px-1 py-0.2 bg-slate-200/60 dark:bg-slate-700 rounded text-[9px] font-mono text-slate-500">V</kbd>
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
                                <kbd className="hidden sm:inline-block px-1 py-0.2 bg-slate-200/60 dark:bg-slate-700 rounded text-[9px] font-mono text-slate-500">L</kbd>
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
                                title="Sembunyikan kunci jawaban dan pembahasan untuk melatih ingatan Anda (Shortcut: T atau M)"
                            >
                                {isSelfTestMode ? <EyeOff size={15} /> : <Eye size={15} />}
                                <span>{isSelfTestMode ? 'Mode Uji Mandiri: Aktif' : 'Mode Uji Mandiri (Tutup Kunci)'}</span>
                                <kbd className={`hidden sm:inline-block px-1 py-0.2 rounded text-[9px] font-mono ${isSelfTestMode ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'}`}>T</kbd>
                            </button>
                        </div>
                    </div>

                    {/* Filter Pills & Search */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/60">
                        {/* Filter Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                            <button
                                onClick={() => setFilterType('ALL')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1 ${
                                    filterType === 'ALL'
                                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                        : 'bg-slate-100 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span>Semua ({questions.length})</span>
                                <kbd className="hidden lg:inline text-[9px] opacity-60">1</kbd>
                            </button>
                            <button
                                onClick={() => setFilterType('WRONG')}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                                    filterType === 'WRONG'
                                        ? 'bg-rose-600 text-white shadow-sm'
                                        : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'
                                }`}
                            >
                                <XCircle size={13} /> Salah ({wrongQuestionsCount})
                                <kbd className="hidden lg:inline text-[9px] opacity-60">2</kbd>
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
                                    <Flag size={13} /> Ragu ({flaggedCount})
                                    <kbd className="hidden lg:inline text-[9px] opacity-60">3</kbd>
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
                                <kbd className="hidden lg:inline text-[9px] opacity-60">4</kbd>
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
                                <kbd className="hidden lg:inline text-[9px] opacity-60">5</kbd>
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
                                <kbd className="hidden lg:inline text-[9px] opacity-60">6</kbd>
                            </button>

                            {/* TKP Low Points (1-3) Filter Pill */}
                            {tkpAnalysis.hasTkpQuestions && tkpAnalysis.totalLowPoints > 0 && (
                                <button
                                    onClick={() => setFilterType(filterType === 'TKP_LOW' ? 'ALL' : 'TKP_LOW')}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 ${
                                        filterType === 'TKP_LOW'
                                            ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-300 dark:ring-rose-900'
                                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-100'
                                    }`}
                                    title="Filter hanya butir soal TKP dengan skor 1 s/d 3"
                                >
                                    <AlertTriangle size={13} className="text-rose-500" />
                                    <span>Poin 1–3 TKP ({tkpAnalysis.totalLowPoints})</span>
                                    <kbd className="hidden lg:inline text-[9px] opacity-70">7</kbd>
                                </button>
                            )}

                            {/* Active Aspect Filter Chip */}
                            {selectedTkpAspect && (
                                <div className="px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap bg-indigo-600 text-white shadow-xs flex items-center gap-1.5">
                                    <span>Aspek: {selectedTkpAspect}</span>
                                    <button 
                                        type="button" 
                                        onClick={() => setSelectedTkpAspect(null)} 
                                        className="hover:bg-indigo-700 p-0.5 rounded-md"
                                        title="Hapus filter aspek"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Search Bar */}
                        <div className="relative min-w-[220px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari materi, konsep, atau catatan..."
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
                                const isTkp = q.metadata?.subtest?.toUpperCase().includes('TKP') || (q.tkpPoints && q.tkpPoints.length > 0);

                                return (
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 sm:p-8 space-y-6">
                                        {/* Focus Header Bar */}
                                        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-indigo-500/20">
                                                    #{originalIndex + 1}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                                                            {q.metadata?.subtest || q.metadata?.topic || item.category}
                                                        </span>
                                                        {isTkp && (
                                                            <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 text-[9px] font-extrabold">
                                                                Skala Poin 1-5
                                                            </span>
                                                        )}
                                                    </div>
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
                                                    title="Tandai sebagai Soal Terbaik (Shortcut: B atau S)"
                                                >
                                                    <Star size={14} className={isBest ? 'fill-amber-500 text-amber-500' : ''} />
                                                    <span>{isBest ? 'Soal Terbaik' : 'Tandai Terbaik'}</span>
                                                    <kbd className="hidden sm:inline text-[9px] opacity-60 font-mono">B</kbd>
                                                </button>

                                                {/* Mark Understood Button */}
                                                <button
                                                    onClick={() => toggleUnderstood(q.id)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                                        isUnderstood
                                                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                                                    }`}
                                                    title="Tandai sudah paham materi ini (Shortcut: P atau U)"
                                                >
                                                    <CheckCircle size={14} className={isUnderstood ? 'text-emerald-600' : ''} />
                                                    <span>{isUnderstood ? 'Sudah Paham' : 'Tandai Paham'}</span>
                                                    <kbd className="hidden sm:inline text-[9px] opacity-60 font-mono">P</kbd>
                                                </button>

                                                {/* TTS Audio */}
                                                <button
                                                    onClick={() => speakText(q.id, `${q.content}. Pembahasan: ${q.explanation}`)}
                                                    className={`p-2 rounded-xl text-xs font-bold transition ${
                                                        speakingQuestionId === q.id
                                                            ? 'bg-indigo-600 text-white animate-pulse'
                                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                                                    }`}
                                                    title="Dengarkan soal dan pembahasan (Shortcut: A)"
                                                >
                                                    {speakingQuestionId === q.id ? <VolumeX size={15} /> : <Volume2 size={15} />}
                                                </button>

                                                {/* Copy Question */}
                                                <button
                                                    onClick={() => handleCopyQuestion(q, originalIndex)}
                                                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition"
                                                    title="Salin teks soal (Shortcut: C)"
                                                >
                                                    {copiedQuestionId === q.id ? <Check size={15} className="text-emerald-500" /> : <Copy size={15} />}
                                                </button>
                                            </div>
                                        </div>

                                        {/* Question Content */}
                                        <div className={`${fontClassPrompt} font-medium text-slate-800 dark:text-slate-100`}>
                                            <SimpleMarkdown text={q.content} />
                                        </div>

                                        {/* TKP Scale Legend Indicator if TKP */}
                                        {isTkp && isSelfTestRevealed && (
                                            <div className="p-3 bg-slate-50/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                                                <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 dark:text-slate-300">
                                                    <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
                                                        <Activity size={13} /> Skala Gradasi Nilai TKP (1-5 Poin):
                                                    </span>
                                                    <span className="text-[10px] text-slate-400">Merah (1 Poin) → Hijau (5 Poin)</span>
                                                </div>
                                                <div className="grid grid-cols-5 gap-1 text-[10px] text-center font-bold">
                                                    <div className="p-1 rounded bg-rose-500 text-white">1 Poin</div>
                                                    <div className="p-1 rounded bg-orange-500 text-white">2 Poin</div>
                                                    <div className="p-1 rounded bg-amber-400 text-slate-900 font-extrabold">3 Poin</div>
                                                    <div className="p-1 rounded bg-teal-500 text-white">4 Poin</div>
                                                    <div className="p-1 rounded bg-emerald-600 text-white font-extrabold">5 Poin (Kunci)</div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Options Grid */}
                                        {q.options && q.options.length > 0 && (
                                            <div className="space-y-2.5">
                                                {q.options.map((opt, oIdx) => {
                                                    const letter = String.fromCharCode(65 + oIdx);
                                                    const isUserSelected = ans?.selectedAnswer === opt || ans?.selectedAnswer === letter;
                                                    const isCorrectOption = q.correctAnswer === opt || q.correctAnswer === letter;
                                                    const tkpPoints = getTkpOptionPoints(q, opt, oIdx);

                                                    let optionContainerClass = 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300';
                                                    let tkpStyle = tkpPoints !== null ? getTkpPointStyle(tkpPoints) : null;

                                                    if (isSelfTestRevealed) {
                                                        if (isTkp && tkpStyle) {
                                                            optionContainerClass = `${tkpStyle.bg} ${tkpStyle.border} ${tkpStyle.textColor} ${isUserSelected ? `ring-2 ${tkpStyle.ringColor} font-bold` : ''}`;
                                                        } else {
                                                            if (isCorrectOption) {
                                                                optionContainerClass = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold';
                                                            } else if (isUserSelected && !isCorrectOption) {
                                                                optionContainerClass = 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-900 dark:text-rose-200';
                                                            }
                                                        }
                                                    } else if (isUserSelected) {
                                                        optionContainerClass = 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-900 dark:text-indigo-200 font-bold';
                                                    }

                                                    return (
                                                        <div key={oIdx} className={`p-3.5 sm:p-4 rounded-2xl border transition relative flex flex-col gap-2 ${optionContainerClass}`}>
                                                            <div className="flex items-start gap-3">
                                                                <span className="w-7 h-7 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center font-black text-xs shrink-0">
                                                                    {letter}
                                                                </span>
                                                                <div className={`flex-1 pt-0.5 ${fontClassOption}`}>
                                                                    <SimpleMarkdown text={opt} isOption={true} />
                                                                </div>

                                                                {/* TKP Points Badge or Standard Key Badge */}
                                                                {isSelfTestRevealed && isTkp && tkpStyle && (
                                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                                        <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl shadow-sm ${tkpStyle.badgeBg}`}>
                                                                            {tkpPoints} Poin
                                                                        </span>
                                                                    </div>
                                                                )}

                                                                {isSelfTestRevealed && !isTkp && isCorrectOption && (
                                                                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-lg bg-emerald-500 text-white shrink-0">
                                                                        Kunci
                                                                    </span>
                                                                )}

                                                                {isUserSelected && (
                                                                    <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white shrink-0 shadow-sm">
                                                                        Jawabanmu {isTkp && tkpPoints !== null && `(${tkpPoints} Poin)`}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {/* TKP Mini Progress Bar */}
                                                            {isSelfTestRevealed && isTkp && tkpStyle && (
                                                                <div className="w-full bg-black/5 dark:bg-white/5 h-1.5 rounded-full overflow-hidden mt-1">
                                                                    <div 
                                                                        className={`h-full ${tkpStyle.barColor} transition-all duration-300`} 
                                                                        style={{ width: tkpStyle.progressWidth }} 
                                                                    />
                                                                </div>
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
                                                    <div className={`${fontClassExplanation} text-slate-700 dark:text-slate-200 leading-relaxed`}>
                                                        <SimpleMarkdown text={q.explanation} />
                                                    </div>
                                                </div>

                                                {/* Personal Study Notes */}
                                                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                                                            <Edit3 size={13} className="text-amber-500" /> Catatan Belajar Pribadi
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">Tersimpan otomatis (Shortcut: N atau E)</span>
                                                    </div>
                                                    <textarea
                                                        value={notesMap[q.id] || ''}
                                                        onChange={(e) => saveNote(q.id, e.target.value)}
                                                        placeholder="Tuliskan catatan, rumus cepat, atau pengingat jebakan untuk soal ini..."
                                                        className={`w-full p-3 ${fontClassExplanation} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white`}
                                                        rows={2}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Focus Navigation Bar (Prev / Next Buttons & Question Palette) */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                            <div className="flex items-center justify-between">
                                                <button
                                                    onClick={() => setFocusIndex(prev => Math.max(0, prev - 1))}
                                                    disabled={currentIndex === 0}
                                                    className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold disabled:opacity-40 flex items-center gap-2 hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer"
                                                >
                                                    <ChevronLeft size={16} /> Sebelumnya (←)
                                                </button>

                                                <span className="text-xs font-bold text-slate-500">
                                                    Soal {currentIndex + 1} dari {filteredQuestions.length}
                                                </span>

                                                <button
                                                    onClick={() => setFocusIndex(prev => Math.min(filteredQuestions.length - 1, prev + 1))}
                                                    disabled={currentIndex === filteredQuestions.length - 1}
                                                    className="px-4 py-2 rounded-2xl bg-indigo-600 text-white text-xs font-black disabled:opacity-40 flex items-center gap-2 hover:bg-indigo-700 transition cursor-pointer"
                                                >
                                                    Selanjutnya (→) <ChevronRight size={16} />
                                                </button>
                                            </div>

                                            {/* Quick Jump Palette for Focus Mode */}
                                            <div className="pt-3 border-t border-slate-100 dark:border-slate-700/80">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                                        Lompat ke Soal (Gradasi TKP 1-5 / TWK-TIU)
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-semibold">
                                                        {understoodCount}/{questions.length} Paham
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 pt-1 px-0.5">
                                                    {filteredQuestions.map(({ q: fq, originalIndex: realQIdx }, fIdx) => {
                                                        const ans = answers.find(a => a.questionId === fq.id) || answers[realQIdx];
                                                        const isBest = bestQuestionsSet.has(fq.id);
                                                        const isUnderstood = understoodSet.has(fq.id);
                                                        const isTkp = Boolean(fq.metadata?.subtest?.toUpperCase().includes('TKP') || (fq.tkpPoints && fq.tkpPoints.length > 0));
                                                        const isCurrent = fIdx === currentIndex;

                                                        let boxStyle = '';
                                                        let pointLabel: number | null = null;

                                                        if (isTkp) {
                                                            const points = getTkpEarnedPoints(fq, ans);
                                                            pointLabel = points;
                                                            if (points !== null) {
                                                                const tkpStyle = getTkpPointStyle(points);
                                                                boxStyle = tkpStyle.navBoxClass;
                                                            } else {
                                                                boxStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700';
                                                            }
                                                        } else {
                                                            const isCorrect = ans?.isCorrect || (ans?.scoreEarned && ans.scoreEarned >= 4);
                                                            boxStyle = isCorrect
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                                                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700';
                                                        }

                                                        return (
                                                            <button
                                                                key={fq.id}
                                                                onClick={() => setFocusIndex(fIdx)}
                                                                className={`relative shrink-0 w-10 h-10 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center ${boxStyle} ${
                                                                    isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 scale-105' : 'opacity-85 hover:opacity-100'
                                                                }`}
                                                                title={isTkp ? `Soal #${realQIdx + 1} (TKP: ${pointLabel !== null ? `${pointLabel} Poin` : 'Belum Dijawab'})` : `Soal #${realQIdx + 1}`}
                                                            >
                                                                <span className="leading-none">{realQIdx + 1}</span>
                                                                {isTkp && pointLabel !== null && (
                                                                    <span className="text-[7px] font-black opacity-95 leading-none mt-0.5">
                                                                        {pointLabel}p
                                                                    </span>
                                                                )}
                                                                <div className="flex items-center gap-0.5 absolute -top-1 -right-1">
                                                                    {isBest && <span className="w-2 h-2 rounded-full bg-amber-400 border border-white" />}
                                                                    {isUnderstood && <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white" />}
                                                                </div>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
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
                                filteredQuestions.map(({ q, originalIndex }, fIdx) => {
                                    const ans = answers.find(a => a.questionId === q.id) || answers[originalIndex];
                                    const isBest = bestQuestionsSet.has(q.id);
                                    const isUnderstood = understoodSet.has(q.id);
                                    const isSelfTestRevealed = !isSelfTestMode || revealedSelfTestQuestions.has(q.id);
                                    const isTkp = Boolean(q.metadata?.subtest?.toUpperCase().includes('TKP') || (q.tkpPoints && q.tkpPoints.length > 0));
                                    const isActiveInList = filteredQuestions[activeListIndex]?.originalIndex === originalIndex;

                                    return (
                                        <QuestionReviewCard
                                            key={q.id}
                                            q={q}
                                            originalIndex={originalIndex}
                                            fIdx={fIdx}
                                            itemCategory={item.category}
                                            ans={ans}
                                            isBest={isBest}
                                            isUnderstood={isUnderstood}
                                            isSelfTestRevealed={isSelfTestRevealed}
                                            isSelfTestMode={isSelfTestMode}
                                            isTkp={isTkp}
                                            isActiveInList={isActiveInList}
                                            fontClassPrompt={fontClassPrompt}
                                            fontClassOption={fontClassOption}
                                            fontClassExplanation={fontClassExplanation}
                                            isSpeaking={speakingQuestionId === q.id}
                                            isCopied={copiedQuestionId === q.id}
                                            isNoteOpen={activeNoteEditor === q.id}
                                            noteText={notesMap[q.id] || ''}
                                            onSelectCard={handleSelectCard}
                                            onToggleBest={handleToggleBest}
                                            onToggleUnderstood={handleToggleUnderstood}
                                            onToggleNoteEditor={handleToggleNoteEditor}
                                            onSaveNote={handleSaveNote}
                                            onSpeak={handleSpeak}
                                            onCopy={handleCopy}
                                            onRevealSelfTest={handleRevealSelfTest}
                                        />
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
                                        const isTkp = Boolean(q.metadata?.subtest?.toUpperCase().includes('TKP') || (q.tkpPoints && q.tkpPoints.length > 0));

                                        let boxStyle = '';
                                        let pointLabel: number | null = null;

                                        if (isTkp) {
                                            const points = getTkpEarnedPoints(q, ans);
                                            pointLabel = points;
                                            if (points !== null) {
                                                const tkpStyle = getTkpPointStyle(points);
                                                boxStyle = tkpStyle.navBoxClass;
                                            } else {
                                                boxStyle = 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700';
                                            }
                                        } else {
                                            const isCorrect = ans?.isCorrect || (ans?.scoreEarned && ans.scoreEarned >= 4);
                                            boxStyle = isCorrect
                                                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                                                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 hover:bg-rose-100';
                                        }

                                        const isCurrentInList = filteredQuestions[activeListIndex]?.originalIndex === qIdx;

                                        return (
                                            <button
                                                key={q.id}
                                                onClick={() => {
                                                    scrollToQuestion(qIdx);
                                                    const fIdx = filteredQuestions.findIndex(f => f.originalIndex === qIdx);
                                                    if (fIdx >= 0) setActiveListIndex(fIdx);
                                                    SoundManager.play('click');
                                                }}
                                                className={`relative h-11 rounded-xl font-black text-xs transition-all flex flex-col items-center justify-center ${boxStyle} ${
                                                    isCurrentInList ? 'ring-2 ring-slate-900 dark:ring-white ring-offset-2 scale-105 shadow-md z-10' : 'hover:scale-105 shadow-xs'
                                                }`}
                                                title={isTkp ? `Soal #${qIdx + 1} (TKP: ${pointLabel !== null ? `${pointLabel} Poin` : 'Belum Dijawab'})` : `Soal #${qIdx + 1} (${ans?.isCorrect ? 'Benar' : 'Salah'})`}
                                            >
                                                <span className="leading-tight">{qIdx + 1}</span>
                                                {isTkp && pointLabel !== null && (
                                                    <span className="text-[8px] font-black opacity-95 leading-none">
                                                        {pointLabel}p
                                                    </span>
                                                )}
                                                <div className="flex items-center gap-0.5 absolute -top-1 -right-1">
                                                    {isBest && <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />}
                                                    {isUnderstood && <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-700 text-[10px] space-y-2.5 text-slate-500 dark:text-slate-400">
                                    <div className="space-y-1">
                                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            TWK / TIU:
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded bg-emerald-500 shrink-0" />
                                                <span>Benar</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded bg-rose-500 shrink-0" />
                                                <span>Salah</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                                            Gradasi TKP (1 s/d 5 Poin):
                                        </div>
                                        <div className="grid grid-cols-5 gap-1 text-center font-black text-[8px]">
                                            <div className="py-1 px-0.5 rounded bg-red-800 text-white leading-tight">1 Poin</div>
                                            <div className="py-1 px-0.5 rounded bg-orange-500 text-white leading-tight">2 Poin</div>
                                            <div className="py-1 px-0.5 rounded bg-amber-500 text-slate-950 leading-tight font-black">3 Poin</div>
                                            <div className="py-1 px-0.5 rounded bg-lime-600 text-white leading-tight">4 Poin</div>
                                            <div className="py-1 px-0.5 rounded bg-emerald-600 text-white leading-tight font-black">5 Poin</div>
                                        </div>
                                        <div className="flex justify-between text-[8px] text-slate-400 font-semibold px-0.5">
                                            <span>Merah Tua (1)</span>
                                            <span>→</span>
                                            <span>Hijau Banget (5)</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-1">
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                            <span>Terbaik (⭐)</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                            <span>Paham (✅)</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Floating Quick Navigation & Font Bar in LIST Mode */}
                {studyMode === 'LIST' && filteredQuestions.length > 0 && (
                    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl px-4 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
                        <button
                            onClick={() => {
                                const next = Math.max(0, activeListIndex - 1);
                                setActiveListIndex(next);
                                const target = filteredQuestions[next];
                                if (target) {
                                    requestAnimationFrame(() => scrollToQuestion(target.originalIndex));
                                }
                                SoundManager.play('click');
                            }}
                            disabled={activeListIndex === 0}
                            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-600 transition flex items-center gap-1 text-xs font-bold"
                            title="Soal Sebelumnya (←)"
                        >
                            <ChevronLeft size={16} />
                            <span className="hidden sm:inline">Prev</span>
                        </button>

                        <div className="text-xs font-black text-slate-700 dark:text-slate-300 px-2 flex items-center gap-1.5">
                            <span className="text-indigo-600 dark:text-indigo-400 font-extrabold">
                                #{filteredQuestions[Math.min(activeListIndex, filteredQuestions.length - 1)]?.originalIndex + 1 || 1}
                            </span>
                            <span className="text-slate-400 font-normal">
                                ({Math.min(activeListIndex + 1, filteredQuestions.length)} / {filteredQuestions.length})
                            </span>
                        </div>

                        <button
                            onClick={() => {
                                const next = Math.min(filteredQuestions.length - 1, activeListIndex + 1);
                                setActiveListIndex(next);
                                const target = filteredQuestions[next];
                                if (target) {
                                    requestAnimationFrame(() => scrollToQuestion(target.originalIndex));
                                }
                                SoundManager.play('click');
                            }}
                            disabled={activeListIndex >= filteredQuestions.length - 1}
                            className="p-1.5 rounded-xl bg-indigo-600 text-white disabled:opacity-30 hover:bg-indigo-700 transition flex items-center gap-1 text-xs font-bold shadow-xs"
                            title="Soal Selanjutnya (→)"
                        >
                            <span className="hidden sm:inline">Next</span>
                            <ChevronRight size={16} />
                        </button>

                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block" />

                        {/* Font size quick toggles */}
                        <div className="hidden sm:flex items-center gap-1">
                            <button
                                onClick={() => changeFontSize('down')}
                                disabled={fontSize === 'xs'}
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                                title="Perkecil Font (-)"
                            >
                                <Minus size={13} />
                            </button>
                            <span className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 px-1">
                                {fontSize.toUpperCase()}
                            </span>
                            <button
                                onClick={() => changeFontSize('up')}
                                disabled={fontSize === 'xl'}
                                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition"
                                title="Perbesar Font (+)"
                            >
                                <Plus size={13} />
                            </button>
                        </div>
                    </div>
                )}

                {/* ---------------------------------------------------- */}
                {/* KEYBOARD SHORTCUTS MODAL GUIDE */}
                {/* ---------------------------------------------------- */}
                {showShortcutModal && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                        <Keyboard size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-black text-slate-900 dark:text-white">Daftar Shortcut Keyboard</h3>
                                        <p className="text-xs text-slate-400">Trik navigasi cepat & efisien saat mengulas soal</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowShortcutModal(false)}
                                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Shortcut Categories */}
                            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1 text-xs">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
                                        Ukuran Font & Tampilan
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Perbesar Font Teks</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">W</kbd> <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">+</kbd></div>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Perkecil Font Teks</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">Q</kbd> <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">-</kbd></div>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Reset Ukuran Font Normal</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">0</kbd>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Ganti Mode (Daftar / Flashcard)</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">V</kbd> <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">L</kbd></div>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Mode Uji Mandiri (Tutup/Buka Kunci)</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">T</kbd> <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">M</kbd></div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
                                        Tindakan Pembelajaran
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Tandai Sudah Paham (✅)</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">P</kbd> <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">U</kbd></div>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Tandai Soal Terbaik (⭐)</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">B</kbd> <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">S</kbd></div>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Catatan Belajar Pribadi</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">N</kbd> <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">E</kbd></div>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Salin Teks Soal & Pembahasan</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">C</kbd>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Bacakan Teks Soal (Audio TTS)</span>
                                            <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">A</kbd>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                                        Navigasi & Filter
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Soal Sebelumnya / Selanjutnya</span>
                                            <div className="flex gap-1"><kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">←</kbd> <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">→</kbd></div>
                                        </div>
                                        <div className="flex justify-between items-center p-2 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                                            <span className="text-slate-700 dark:text-slate-300">Pilih Filter Soal (1 - 6)</span>
                                            <div className="flex gap-1"><kbd className="px-1.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">1</kbd>..<kbd className="px-1.5 py-1 bg-white dark:bg-slate-800 border rounded font-mono font-bold shadow-xs">6</kbd></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => setShowShortcutModal(false)}
                                className="w-full py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-md shadow-indigo-600/20"
                            >
                                Tutup Panduan (Esc)
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
