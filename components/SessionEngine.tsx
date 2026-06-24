import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Timer, Zap, CheckCircle, XCircle, ChevronRight, Lightbulb, Pause, Play, Grid, Loader2, ArrowLeft, ArrowRight, Save, CloudUpload, AlertTriangle, Flag, Type, Plus, Minus, Copy, Bookmark, Mic, MicOff, Settings, Keyboard, Lock, Bot, Sparkles, RotateCcw } from 'lucide-react';
import { StudyMode, Question, UserAnswer, CategoryType, DrillMaterial, TestHistoryItem, SavedSessionState, AppFontSize, MarkedQuestion } from '../types';
import { SoundManager } from '../services/soundService';
import * as Gemini from '../services/geminiService';
import { motion, AnimatePresence } from 'motion/react';
import { UTBK_EXAM_CONFIG, ADMIN_TOKEN_HASH } from '../constants';
import * as FirebaseService from '../services/firebase';
import { useSpeechRecognition } from '../utils/speechRecognition';
import { verifyToken } from '../src/utils/security';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';
import { SimpleMarkdown, MatrixQuestionRenderer, SvgRenderer, formatTopic } from './QuestionRenderer';
import { InteractiveFigural } from './InteractiveFigural';

// --- SUB-COMPONENTS ---

const PacingBar: React.FC<{ idealTimeSeconds: number, isActive: boolean, currentQId: string }> = ({ idealTimeSeconds, isActive, currentQId }) => {
    const [secondsSpent, setSecondsSpent] = useState(0);

    useEffect(() => {
        setSecondsSpent(0); // reset on question change
    }, [currentQId]);

    useEffect(() => {
        if (!isActive) return;
        const interval = setInterval(() => {
            setSecondsSpent(prev => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [isActive, currentQId]);

    const isOverTime = secondsSpent > idealTimeSeconds;
    const remainingSeconds = Math.max(0, idealTimeSeconds - secondsSpent);
    const progressRemaining = isOverTime ? 100 : Math.round((remainingSeconds / idealTimeSeconds) * 100);

    return (
        <div className="w-full mb-3 md:mb-6">
            <div className="flex justify-between text-[10px] md:text-xs font-bold mb-1">
                <span className={isOverTime ? "text-[#b83a24] font-black animate-pulse" : "text-slate-500 dark:text-slate-400"}>
                    <span className="md:hidden">
                        ⏱️ Sisa: {remainingSeconds}s {isOverTime && `(+${secondsSpent - idealTimeSeconds}s!)`}
                    </span>
                    <span className="hidden md:inline">
                        🚀 Sisa Waktu Ideal: {remainingSeconds}s {isOverTime && `(Terlewat +${secondsSpent - idealTimeSeconds}s!)`}
                    </span>
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                    <span className="md:hidden">Target: {idealTimeSeconds}s</span>
                    <span className="hidden md:inline">Target Ideal: {idealTimeSeconds}s</span>
                </span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-300 ${isOverTime ? 'bg-[#b83a24] animate-pulse' : (progressRemaining < 25 ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500')}`}
                    style={{ width: `${progressRemaining}%` }}
                />
            </div>
        </div>
    );
};

const BreakRoom: React.FC<{ 
    timeLeft: number, 
    onFinish: () => void,
    utbkSubtestIndex?: number,
    questions?: Question[],
    answerMap?: Record<string, UserAnswer>
}> = ({ timeLeft, onFinish, utbkSubtestIndex, questions, answerMap }) => {
    useEffect(() => {
        if (timeLeft <= 0) onFinish();
    }, [timeLeft, onFinish]);

    const renderGrid = (subtestName: string, subtestQs: Question[], key: string) => {
        if (!subtestQs.length) return null;
        return (
            <div key={key} className="mb-6 bg-white/5 rounded-xl p-4 border border-white/10">
                <h4 className="font-bold text-white mb-3">{subtestName}</h4>
                <div className="flex flex-wrap gap-2">
                    {subtestQs.map((q, idx) => {
                        const ans = answerMap?.[q.id];
                        let bgClass = "bg-white/10 text-white/50 border-white/10";
                        if (ans?.isDoubtful) {
                            bgClass = "bg-amber-500 border-amber-500 text-white";
                        } else if (ans?.selectedAnswer) {
                            bgClass = "bg-emerald-500 border-emerald-500 text-white";
                        }
                        return (
                            <div key={q.id} className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold border ${bgClass}`}>
                                {idx + 1}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[60] bg-slate-900 flex flex-col md:flex-row text-white overflow-hidden">
            {/* Left Panel: Timer & Info */}
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-indigo-900/50 border-r border-white/10 relative">
                <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mb-8 animate-pulse">
                    <Timer size={48} className="text-white"/>
                </div>
                <h2 className="text-3xl font-bold mb-4 text-center">Istirahat Antar Subtes</h2>
                <div className="text-7xl font-mono font-bold mb-8 text-indigo-300">{timeLeft}s</div>
                <p className="text-xl text-center max-w-md italic opacity-90 text-indigo-100">"Tarik nafas, persiapkan fokus untuk subtes berikutnya."</p>
                <button onClick={onFinish} className="mt-12 px-8 py-3 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl font-bold transition-colors shadow-lg">
                    Lewati Istirahat
                </button>
            </div>

            {/* Right Panel: Progress & Grid */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900">
                <div className="p-6 border-b border-white/10 bg-slate-800/50">
                    <h3 className="text-xl font-bold mb-4">Progress UTBK SNBT</h3>
                    <div className="flex flex-col gap-2">
                        {UTBK_EXAM_CONFIG.map((config, idx) => {
                            let statusColor = "bg-slate-800 text-slate-400 border-slate-700";
                            let statusIcon = <div className="w-5 h-5 rounded-full border-2 border-slate-600"></div>;
                            
                            if (utbkSubtestIndex !== undefined && idx < utbkSubtestIndex) {
                                statusColor = "bg-emerald-900/30 text-emerald-400 border-emerald-800/50";
                                statusIcon = <CheckCircle size={20} className="text-emerald-500" />;
                            } else if (utbkSubtestIndex !== undefined && idx === utbkSubtestIndex) {
                                statusColor = "bg-indigo-900/50 text-indigo-300 border-indigo-700/50 ring-1 ring-indigo-500";
                                statusIcon = <Timer size={20} className="text-indigo-400 animate-pulse" />;
                            }

                            return (
                                <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg border ${statusColor}`}>
                                    {statusIcon}
                                    <span className="font-medium text-sm">{config.name}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    <h3 className="text-lg font-bold mb-4 text-slate-300">Navigasi Soal (Selesai)</h3>
                    {utbkSubtestIndex !== undefined && questions && (
                        UTBK_EXAM_CONFIG.slice(0, utbkSubtestIndex).map((config, idx) => {
                            const subQs = questions.filter(q => q.metadata?.subtest?.includes(config.name) || q.metadata?.subtest?.includes(config.name.replace(' & ', ' dan ')));
                            return (
                                <React.Fragment key={`grid-wrapper-${idx}`}>
                                    {renderGrid(config.name, subQs, `grid-${idx}`)}
                                </React.Fragment>
                            );
                        })
                    )}
                    {utbkSubtestIndex === 0 && (
                        <div className="text-slate-500 text-sm italic text-center mt-10">Belum ada subtes yang diselesaikan.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Question Flag Modal
const QuestionFlagModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    question: Question;
    category: CategoryType;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}> = ({ isOpen, onClose, question, category, showToast }) => {
    if (!isOpen) return null;

    const handleMark = () => {
        const stored = localStorage.getItem('fajmuls_marked_questions');
        const existing: MarkedQuestion[] = stored ? JSON.parse(stored) : [];
        
        if (existing.some(q => q.id === question.id)) {
            showToast("Soal ini sudah ada di daftar tandai.", 'info');
            onClose();
            return;
        }

        const newMarked: MarkedQuestion = {
            id: question.id,
            question,
            category,
            dateMarked: Date.now()
        };

        localStorage.setItem('fajmuls_marked_questions', JSON.stringify([newMarked, ...existing]));
        showToast("Soal berhasil ditandai!", 'success');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Flag size={16} className="text-rose-500"/> Tandai Soal
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <XCircle size={18} className="sm:w-5 sm:h-5"/>
                    </button>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-4 max-h-40 overflow-y-auto">
                    <p className="text-[10px] font-mono text-slate-400 mb-1">ID: {question.id}</p>
                    <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 word-break-safe">
                        <SimpleMarkdown text={question.content} />
                    </div>
                </div>

                <div className="flex gap-2 text-xs font-bold">
                    <button onClick={handleMark} className="flex-1 py-1.5 sm:py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition flex items-center justify-center gap-1.5">
                        <Bookmark size={14}/> Simpan Ke Daftar
                    </button>
                    <button onClick={onClose} className="px-4 py-1.5 sm:py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                        Batal
                    </button>
                </div>
            </div>
        </div>
    );
};

// Finish Confirmation Modal
const FinishConfirmationModal: React.FC<{ 
    isOpen: boolean; 
    onCancel: () => void; 
    onConfirm: () => void; 
    stats: { unanswered: number; doubtful: number; total: number };
}> = ({ isOpen, onCancel, onConfirm, stats }) => {
    if (!isOpen) return null;

    const hasIssues = stats.unanswered > 0 || stats.doubtful > 0;

    return (
        <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-2xl max-w-xs sm:max-w-sm w-full border border-slate-100 dark:border-slate-700 text-center">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-2.5 sm:mb-4 ${hasIssues ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                    {hasIssues ? <AlertTriangle size={18} className="sm:w-6 sm:h-6"/> : <CheckCircle size={18} className="sm:w-6 sm:h-6"/>}
                </div>
                
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2">
                    {hasIssues ? "Yakin Selesai?" : "Selesaikan Ujian?"}
                </h2>
                
                {hasIssues ? (
                    <div className="bg-slate-50 dark:bg-slate-700/50 p-2 sm:p-3 rounded-lg sm:rounded-xl mb-3 sm:mb-4 text-left space-y-1.5 border border-slate-150 dark:border-slate-600">
                        <p className="text-[10px] sm:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Periksa kembali jawaban Anda:</p>
                        {stats.unanswered > 0 && (
                            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 text-[10px] sm:text-xs font-medium">
                                <span className="flex items-center gap-1.5"><XCircle size={12}/> Belum Diisi</span>
                                <span className="font-bold">{stats.unanswered} Soal</span>
                            </div>
                        )}
                        {stats.doubtful > 0 && (
                            <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs font-medium">
                                <span className="flex items-center gap-1.5"><Flag size={12}/> Ragu-ragu</span>
                                <span className="font-bold">{stats.doubtful} Soal</span>
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-3 sm:mb-4">
                        Semua {stats.total} soal telah dijawab. Waktu akan dihentikan dan skor akan dihitung.
                    </p>
                )}

                <div className="flex flex-col gap-1.5 sm:gap-2 text-xs sm:text-sm font-black">
                    <button onClick={onConfirm} className="w-full py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition">
                        Ya, Selesai
                    </button>
                    <button onClick={onCancel} className="w-full py-2 sm:py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                        Kembali Mengerjakan
                    </button>
                </div>
            </div>
        </div>
    );
};

const ShortcutMenuModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
}> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const shortcuts = [
        { key: "→", desc: "Soal Berikutnya" },
        { key: "←", desc: "Soal Sebelumnya" },
        { key: "1-5", desc: "Pilih Jawaban A-E" },
        { key: "R", desc: "Tandai Ragu-ragu" },
        { key: "Esc", desc: "Jeda / Tutup Menu" },
        { key: "Spasi", desc: "Lompat Subtes Berikutnya" },
        { key: "Enter", desc: "Selesaikan Tes" },
        { key: "W", desc: "Perbesar Tulisan" },
        { key: "Q", desc: "Perkecil Tulisan" },
        { key: "↑ / ↓", desc: "Scroll Halaman" }
    ];

    return (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700 flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Keyboard size={18} className="text-indigo-600"/> Shortcut Information
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <XCircle size={18} className="sm:w-5 sm:h-5"/>
                    </button>
                </div>

                <div className="space-y-1.5 mb-4 overflow-y-auto pr-1 sm:pr-2 custom-scrollbar">
                    {shortcuts.map((sc, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 sm:p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                            <span className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300">{sc.desc}</span>
                            <kbd className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md text-[10px] sm:text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm">
                                {sc.key}
                            </kbd>
                        </div>
                    ))}
                </div>
                
                <button onClick={onClose} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition shrink-0 text-xs sm:text-sm">
                    Tutup
                </button>
            </div>
        </div>
    );
};

// Voice Control Configuration Modal
const VoiceControlConfigModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onEnable: () => void;
}> = ({ isOpen, onClose, onEnable }) => {
    if (!isOpen) return null;

    const commands = [
        { category: "Jawaban", items: ["A / Pilihan A", "B / Pilihan B", "C / Pilihan C", "D / Pilihan D", "E / Pilihan E", "Hapus jawaban / Clear answer"] },
        { category: "Navigasi", items: ["Lanjut / Next", "Mundur / Back", "Soal [Nomor] (misal: Soal 5)"] },
        { category: "Kontrol", items: ["Selesaikan / Finish", "Simpan dulu / Save", "Jeda / Pause", "Ragu-ragu / Tandai"] },
        { category: "Tampilan", items: ["Perbesar tulisan", "Perkecil tulisan"] }
    ];

    return (
        <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-center mb-4 shrink-0">
                    <h3 className="text-sm sm:text-base font-black text-slate-800 dark:text-white flex items-center gap-1.5">
                        <Mic size={18} className="text-indigo-600"/> Perintah Suara
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <XCircle size={18} className="sm:w-5 sm:h-5"/>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1 sm:pr-2 mb-4">
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                        Gunakan perintah suara untuk mengerjakan ujian lebih cepat. Pastikan mikrofon aktif dan bicara dengan jelas.
                    </p>
                    
                    <div className="grid gap-3">
                        {commands.map((group, idx) => (
                            <div key={idx} className="bg-slate-50 dark:bg-slate-900 p-2.5 sm:p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                <h4 className="font-bold text-indigo-600 dark:text-indigo-400 text-xs mb-1 uppercase tracking-wider">{group.category}</h4>
                                <ul className="grid grid-cols-1 gap-0.5">
                                    {group.items.map((cmd, i) => (
                                        <li key={i} className="text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                                            <span className="w-1 h-1 bg-slate-400 rounded-full"></span> {cmd}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex gap-2 shrink-0">
                    <button onClick={onEnable} className="flex-1 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-1.5">
                        <Mic size={14}/> Aktifkan Voice Control
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper for safe JSON stringify
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: any, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

interface SessionEngineProps {
  mode: StudyMode;
  questions: Question[];
  drillContent: DrillMaterial | null;
  onComplete: (answers: UserAnswer[], historyItem?: TestHistoryItem, isAborted?: boolean) => void;
  isSkdSimulation?: boolean;
  isUtbkSimulation?: boolean;
  category: CategoryType;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  // New props for persistence
  initialState?: SavedSessionState;
  userId?: string;
  skdStream?: any;
  tpaStream?: any;
  packageTitle?: string;
  sessionDuration?: number;
  onSaveAndExit?: () => void;
  initialFontSize?: AppFontSize; // From global settings
  isLoadingMore?: boolean;
  isAdaptiveCat?: boolean;
  onFetchMoreActive?: (lastBatchAnswers: UserAnswer[]) => Promise<void>;
  enableAITutor?: boolean;
  autoNext?: boolean;
}

const getTkpScore = (option: string, currentQ: Question): number => {
    if (!currentQ.tkpPoints || currentQ.tkpPoints.length === 0) return 0;
    
    // Normalize string to ignore spaces and non-alphanumeric chars
    const normalizeText = (text: string) => text.trim().toLowerCase().replace(/[^a-z0-9]/gi, '');
    const normSelected = normalizeText(option);
    
    let pointData = currentQ.tkpPoints.find(tp => normalizeText(tp.option) === normSelected);
    
    // Fallback 1: Substring match (sometimes AI adds a prefix/suffix)
    if (!pointData) {
        pointData = currentQ.tkpPoints.find(tp => {
            const normTp = normalizeText(tp.option);
            return normTp.includes(normSelected) || normSelected.includes(normTp);
        });
    }

    // Fallback 2: Map to A/B/C/D/E by index
    if (!pointData && currentQ.options) {
        const optIndex = currentQ.options.findIndex(o => o === option);
        if (optIndex !== -1) {
            // Find by letter "A", "B", etc.
            const letter = String.fromCharCode(65 + optIndex);
            pointData = currentQ.tkpPoints.find(tp => {
                // If the option from gemini is like (A) or A., extract just the letter
                const cleanTpMatch = tp.option.trim().toUpperCase().match(/^[A-E]/);
                const cleanTp = cleanTpMatch ? cleanTpMatch[0] : '';
                return cleanTp === letter; 
            });
            
            // Final desperate fallback: If tkpPoints and options are the same length, just use the index mapping
            if (!pointData && currentQ.tkpPoints.length === currentQ.options.length) {
                pointData = currentQ.tkpPoints[optIndex]; // Better than zero
            }
        }
    }
    
    return pointData ? Number(pointData.points) : 0;
};

export const SessionEngine: React.FC<SessionEngineProps> = ({ 
    mode, questions, drillContent, onComplete, 
    isSkdSimulation, isUtbkSimulation, category, showToast: parentShowToast,
    initialState, userId, skdStream, tpaStream, packageTitle, sessionDuration, onSaveAndExit, initialFontSize = 'md',
    isLoadingMore, isAdaptiveCat, onFetchMoreActive, enableAITutor = true, autoNext = true
}) => {
    
    // Font Size State
    const [fontSize, setFontSize] = useState<AppFontSize>(initialFontSize);
    
    const fontSizes: AppFontSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    
    const changeFontSize = (dir: 'up' | 'down') => {
        setFontSize(prev => {
            const idx = fontSizes.indexOf(prev);
            if (dir === 'up' && idx < fontSizes.length - 1) {
                return fontSizes[idx + 1];
            } else if (dir === 'down' && idx > 0) {
                return fontSizes[idx - 1];
            }
            return prev;
        });
    };

    // UTBK Specific State (Resumable)
    const [utbkSubtestIndex, setUtbkSubtestIndex] = useState(initialState?.utbkSubtestIndex || 0);
    const [isBreak, setIsBreak] = useState(false);
    const [breakTime, setBreakTime] = useState(0);

    // Common State (Resumable)
    const [currentIndex, setCurrentIndex] = useState(initialState?.currentIndex || 0);
    const [answerMap, setAnswerMap] = useState<Record<string, UserAnswer>>(initialState?.answerMap || {});
    
    const [isPaused, setIsPaused] = useState(false);
    const [isMobileGridOpen, setIsMobileGridOpen] = useState(false);
    const [isSavingToCloud, setIsSavingToCloud] = useState(false);
    const [loadingTimer, setLoadingTimer] = useState(0);

    useEffect(() => {
        let interval: any;
        if (isLoadingMore) {
            setLoadingTimer(0);
            interval = setInterval(() => {
                setLoadingTimer(prev => prev + 1);
            }, 1000);
        } else {
            setLoadingTimer(0);
        }
        return () => clearInterval(interval);
    }, [isLoadingMore]);
    
    // Finish Confirmation State
    const [showFinishModal, setShowFinishModal] = useState(false);
    const [showFlagModal, setShowFlagModal] = useState(false);
    const [showExitModal, setShowExitModal] = useState(false);
    const [showAdminModal, setShowAdminModal] = useState(false);
    const [adminToken, setAdminToken] = useState('');
    const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
     const [finishStats, setFinishStats] = useState({ unanswered: 0, doubtful: 0, total: 0 });

    useEffect(() => {
        if (showAdminModal && !isAdminAuthenticated) {
            const user = FirebaseService.auth.currentUser;
            if (user && (FirebaseService.isUserAdmin(user) || user.email?.endsWith('@fajmuls.com'))) {
                setIsAdminAuthenticated(true);
            }
        }
    }, [showAdminModal, isAdminAuthenticated]);

    // Custom timers (Deep Work & Pomodoro) State
    const [focusTimerType, setFocusTimerType] = useState<'STANDARD' | 'DEEP_WORK' | 'POMODORO'>('STANDARD');
    const [deepWorkTimeLeft, setDeepWorkTimeLeft] = useState(45 * 60);
    const [isDeepWorkRunning, setIsDeepWorkRunning] = useState(false);
    const [pomodoroTimeLeft, setPomodoroTimeLeft] = useState(25 * 60);
    const [isPomodoroRunning, setIsPomodoroRunning] = useState(false);
    const [pomodoroMode, setPomodoroMode] = useState<'focus' | 'break'>('focus');
    const [completedPomodoros, setCompletedPomodoros] = useState(0);
    const [deepWorkQuoteIdx, setDeepWorkQuoteIdx] = useState(0);

    const DEEP_WORK_QUOTES = [
        "Tarik napas teratur... Fokuslah sepenuhnya pada soal saat ini.",
        "Bebaskan pikiran seketika dari distraksi. Kamu sedang berproses menjadi lebih pintar.",
        "Fokus 100% adalah kunci penguasaan materi.",
        "Matikan notifikasi eksternal. Waktu ini milik kesuksesanmu.",
        "Nikmati rasa ingin tahu Anda. Setiap soal adalah tantangan menarik.",
        "Lakukan yang terbaik, selangkah demi selangkah.",
        "Konsentrasi penuh. Otak Anda sedang mendalami pemecahan masalah."
    ];

    // Trigger quiet toast helper (Locks notifications / silences non-critical ones in Deep Work)
    const showToast = (msg: string, type: 'success' | 'error' | 'info') => {
        if (focusTimerType === 'DEEP_WORK') {
            if (type === 'error' || msg.includes('cloud') || msg.includes('Keluar') || msg.toLowerCase().includes('berhasil') || msg.toLowerCase().includes('simpan')) {
                parentShowToast(msg, type);
            } else {
                console.log(`[Deep Work Mode Muted Notification]: ${msg}`);
            }
        } else {
            parentShowToast(msg, type);
        }
    };

    // Custom timers interval (Pomodoro & Deep Work)
    useEffect(() => {
        let interval: any = null;
        
        if (focusTimerType === 'DEEP_WORK' && isDeepWorkRunning && deepWorkTimeLeft > 0) {
            interval = setInterval(() => {
                setDeepWorkTimeLeft(prev => {
                    if (prev <= 1) {
                        setIsDeepWorkRunning(false);
                        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                        audio.play().catch(e => {});
                        return 0;
                    }
                    if (prev % 45 === 0) {
                        setDeepWorkQuoteIdx(qi => (qi + 1) % DEEP_WORK_QUOTES.length);
                    }
                    return prev - 1;
                });
            }, 1000);
        } else if (focusTimerType === 'POMODORO' && isPomodoroRunning && pomodoroTimeLeft > 0) {
            interval = setInterval(() => {
                setPomodoroTimeLeft(prev => {
                    if (prev <= 1) {
                        const nextMode = pomodoroMode === 'focus' ? 'break' : 'focus';
                        setPomodoroMode(nextMode);
                        const nextDuration = nextMode === 'focus' ? 25 * 60 : 5 * 60;
                        setPomodoroTimeLeft(nextDuration);
                        
                        if (pomodoroMode === 'focus') {
                            setCompletedPomodoros(cp => cp + 1);
                        }
                        
                        const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
                        audio.play().catch(e => {});
                        
                        return nextDuration;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        
        return () => clearInterval(interval);
    }, [focusTimerType, isDeepWorkRunning, deepWorkTimeLeft, isPomodoroRunning, pomodoroTimeLeft, pomodoroMode]);

    // Voice Control State
    const [showVoiceConfig, setShowVoiceConfig] = useState(false);
    const [showShortcutModal, setShowShortcutModal] = useState(false);
    const [voiceEnabled, setVoiceEnabled] = useState(false);
    const [voiceConfirmationPending, setVoiceConfirmationPending] = useState<'FINISH' | 'SAVE' | null>(null);
    const lastCommandTimeRef = useRef(0);

    const { isListening, transcript, startListening, stopListening, resetTranscript, isSupported, error: speechError } = useSpeechRecognition();

    useEffect(() => {
        if (speechError) {
            // Ignore aborted error as it happens on stop
            if (speechError !== 'aborted') {
                showToast(speechError, 'error');
                setVoiceEnabled(false);
            }
        }
    }, [speechError, showToast]);

    // Handle Voice Toggle
    const toggleVoiceControl = () => {
        if (voiceEnabled) {
            stopListening();
            setVoiceEnabled(false);
            showToast("Voice Control dinonaktifkan", 'info');
        } else {
            setShowVoiceConfig(true);
        }
    };

    const enableVoiceControl = () => {
        setShowVoiceConfig(false);
        setVoiceEnabled(true);
        startListening();
        showToast("Voice Control aktif! Silakan bicara.", 'success');
    };

    const startTimeRef = useRef(Date.now());

    // CALCULATE INITIAL TIME
    const getInitialTime = () => {
        if (initialState?.timeLeft) return initialState.timeLeft; 
        if (sessionDuration) return sessionDuration * 60;
        if (isUtbkSimulation && UTBK_EXAM_CONFIG[0]) return UTBK_EXAM_CONFIG[0].duration * 60;
        if (isSkdSimulation) return 100 * 60; 
        if (mode === StudyMode.SIMULATION) {
            if (category === 'PSIKOTEST') return 40 * 60;
            if (category === 'TPA') return 100 * 60; 
            return 60 * 60;
        }
        return 0; 
    };

    const [timeLeft, setTimeLeft] = useState(getInitialTime);
    
    // Absolute End Time for Persistence (Background Timer)
    const [endTime, setEndTime] = useState<number>(() => {
        if (initialState?.timeLeft) {
            return Date.now() + (initialState.timeLeft * 1000);
        }
        const initialDuration = getInitialTime();
        return Date.now() + (initialDuration * 1000);
    });

    const isFinishedRef = useRef(false);

    // PERSISTENCE EFFECT
    useEffect(() => {
        if (!userId || isFinishedRef.current) return;
        let safeSkdStream = skdStream;
        if (typeof skdStream === 'object' && skdStream !== null) safeSkdStream = null;
        let safeTpaStream = tpaStream;
        if (typeof tpaStream === 'object' && tpaStream !== null) safeTpaStream = null;

        const sessionState: SavedSessionState = {
            uid: userId,
            mode,
            category,
            questions, 
            answerMap,
            timeLeft,
            endTime, 
            currentIndex,
            utbkSubtestIndex,
            drillContent,
            skdStream: safeSkdStream,
            tpaStream: safeTpaStream,
            packageTitle,
            timestamp: Date.now()
        };

        try {
            localStorage.setItem('fajmuls_active_session', JSON.stringify(sessionState, getCircularReplacer()));
        } catch (e) {
            console.warn("Failed to save session state", e);
        }
    }, [timeLeft, answerMap, currentIndex, utbkSubtestIndex, userId, skdStream, tpaStream, endTime]); 

    const clearSavedSession = () => {
        localStorage.removeItem('fajmuls_active_session');
    };

    // Filter questions for current UTBK subtest
    const activeQuestions = useMemo(() => {
        let filteredQuestions = questions;
        if (isUtbkSimulation) {
            const currentSubtestName = UTBK_EXAM_CONFIG[utbkSubtestIndex].name;
            filteredQuestions = questions.filter(q => 
                q.metadata?.subtest?.includes(currentSubtestName) || 
                q.metadata?.subtest?.includes(currentSubtestName.replace(' & ', ' dan '))
            );
        }
        
        // Deduplicate questions by ID to prevent "Encountered two children with the same key" error
        const uniqueQuestions = filteredQuestions.filter((q, index, self) => 
            index === self.findIndex((t) => (
                t.id === q.id
            ))
        );
        
        return uniqueQuestions;
    }, [questions, isUtbkSimulation, utbkSubtestIndex]);

    const currentQ = activeQuestions[currentIndex];

    // Voice Command Handler
    useEffect(() => {
        if (!voiceEnabled || !transcript || !currentQ || !currentQ.options) return;

        const now = Date.now();
        // Debounce commands to prevent double execution (1 second cooldown)
        if (now - lastCommandTimeRef.current < 1000) return;

        const lower = transcript.toLowerCase().trim();
        let commandExecuted = false;

        // Confirmation Handling
        if (voiceConfirmationPending) {
            if (lower.includes('konfirmasi') || lower.includes('confirm') || lower.includes('ya') || lower.includes('yes') || lower.includes('lanjutkan')) {
                if (voiceConfirmationPending === 'FINISH') {
                    handleRequestFinish();
                } else if (voiceConfirmationPending === 'SAVE') {
                    if (userId && !userId.startsWith('guest-')) handleSaveToCloud();
                    else handleEarlyExit();
                }
                setVoiceConfirmationPending(null);
                showToast("Perintah dikonfirmasi", 'success');
                commandExecuted = true;
            } else if (lower.includes('batal') || lower.includes('cancel') || lower.includes('tidak') || lower.includes('no')) {
                setVoiceConfirmationPending(null);
                showToast("Perintah dibatalkan", 'info');
                commandExecuted = true;
            }
            
            if (commandExecuted) {
                lastCommandTimeRef.current = now;
                resetTranscript();
                return;
            }
            // If pending confirmation, ignore other commands
            return;
        }

        let selectedIndex = -1;

        // Enhanced detection for Indonesian and English pronunciation
        if (lower === 'a' || lower === 'ah' || lower === 'ei' || lower === 'ay' || lower.includes('pilihan a') || lower.includes('jawaban a')) selectedIndex = 0;
        else if (lower === 'b' || lower === 'be' || lower === 'beh' || lower === 'bee' || lower.includes('pilihan b') || lower.includes('jawaban b')) selectedIndex = 1;
        else if (lower === 'c' || lower === 'ce' || lower === 'che' || lower === 'see' || lower === 'sea' || lower.includes('pilihan c') || lower.includes('jawaban c')) selectedIndex = 2;
        else if (lower === 'd' || lower === 'de' || lower === 'deh' || lower === 'dee' || lower.includes('pilihan d') || lower.includes('jawaban d')) selectedIndex = 3;
        else if (lower === 'e' || lower === 'eh' || lower === 'ee' || lower.includes('pilihan e') || lower.includes('jawaban e')) selectedIndex = 4;

        if (selectedIndex !== -1 && currentQ.options && currentQ.options[selectedIndex]) {
            handleAnswer(currentQ.options[selectedIndex]);
            showToast(`Jawaban ${String.fromCharCode(65 + selectedIndex)} dipilih via suara`, 'info');
            commandExecuted = true;
        }

        // Navigation Commands
        else if (lower.includes('next') || lower.includes('lanjut') || lower.includes('berikutnya') || lower.includes('maju')) {
            if (currentIndex < activeQuestions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                showToast("Ke soal berikutnya", 'info');
            } else {
                setVoiceConfirmationPending('FINISH');
                showToast("Katakan 'Konfirmasi' untuk menyelesaikan ujian", 'info');
            }
            commandExecuted = true;
        }

        else if (lower.includes('previous') || lower.includes('sebelumnya') || lower.includes('mundur') || lower.includes('back') || lower.includes('bali')) {
            if (currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
                showToast("Ke soal sebelumnya", 'info');
            }
            commandExecuted = true;
        }

        // New Commands
        else if (lower.includes('selesaikan') || lower.includes('finish') || lower.includes('kumpulkan')) {
            setVoiceConfirmationPending('FINISH');
            showToast("Katakan 'Konfirmasi' untuk menyelesaikan ujian", 'info');
            commandExecuted = true;
        }

        else if (lower.includes('simpan dulu') || lower.includes('simpan') || lower.includes('save')) {
            setVoiceConfirmationPending('SAVE');
            showToast("Katakan 'Konfirmasi' untuk menyimpan progres", 'info');
            commandExecuted = true;
        }

        else if (lower.includes('perbesar') || lower.includes('besarkan') || lower.includes('zoom in')) {
            changeFontSize('up');
            showToast("Tulisan diperbesar", 'info');
            commandExecuted = true;
        }

        else if (lower.includes('perkecil') || lower.includes('kecilkan') || lower.includes('zoom out')) {
            changeFontSize('down');
            showToast("Tulisan diperkecil", 'info');
            commandExecuted = true;
        }

        else if (lower.includes('ragu') || lower.includes('tandai') || lower.includes('flag')) {
            toggleDoubtful();
            showToast("Status ragu-ragu diubah", 'info');
            commandExecuted = true;
        }

        else if (lower.includes('jeda') || lower.includes('pause') || lower.includes('istirahat')) {
            handlePause();
            commandExecuted = true;
        }

        else if (lower.includes('hapus jawaban') || lower.includes('hapus') || lower.includes('clear answer') || lower.includes('just clear')) {
            handleClearAnswer();
            showToast("Jawaban dihapus", 'info');
            commandExecuted = true;
        }

        // Jump to Question Number
        else {
            const numberMatch = lower.match(/(?:nomor|soal|question|ke|go to)?\s*(\d+)/);
            if (numberMatch && numberMatch[1]) {
                const targetNum = parseInt(numberMatch[1]);
                if (!isNaN(targetNum) && targetNum >= 1 && targetNum <= activeQuestions.length) {
                    setCurrentIndex(targetNum - 1);
                    showToast(`Ke soal nomor ${targetNum}`, 'info');
                    commandExecuted = true;
                }
            }
        }

        if (commandExecuted) {
            lastCommandTimeRef.current = now;
            resetTranscript();
        }
    }, [transcript, currentQ, voiceEnabled, voiceConfirmationPending]);

    // Timer Tick (Using Absolute Time)
    useEffect(() => {
        let timer: any = null;
        
        if (isBreak && breakTime > 0) {
            timer = setInterval(() => setBreakTime(prev => prev - 1), 1000);
        } else if (isBreak && breakTime === 0) {
            setIsBreak(false); 
            // Reset end time for next subtest
            if (isUtbkSimulation) {
                const nextDuration = UTBK_EXAM_CONFIG[utbkSubtestIndex].duration;
                setEndTime(Date.now() + (nextDuration * 60 * 1000));
                setTimeLeft(nextDuration * 60);
            }
        } else if (timeLeft > 0 && !isPaused && mode === StudyMode.SIMULATION) {
            timer = setInterval(() => {
                const now = Date.now();
                const remaining = Math.max(0, Math.ceil((endTime - now) / 1000));
                
                setTimeLeft(prev => {
                    if (remaining <= 11 && remaining > 1 && remaining !== prev) SoundManager.play('tick');
                    return remaining;
                });

                if (remaining <= 0) {
                    clearInterval(timer);
                    if (isUtbkSimulation) {
                        handleNextSubtest();
                    } else {
                        finishExam();
                    }
                }
            }, 1000);
        } else if (timeLeft === 0 && mode === StudyMode.SIMULATION) {
             // Already handled in interval, but safe fallback
        }
        return () => clearInterval(timer);
    }, [endTime, isPaused, isBreak, breakTime, mode, isUtbkSimulation, utbkSubtestIndex]);

    const handleNextSubtest = () => {
        if (isUtbkSimulation) {
            if (utbkSubtestIndex < UTBK_EXAM_CONFIG.length - 1) {
                SoundManager.play('success'); 
                const nextIndex = utbkSubtestIndex + 1;
                setUtbkSubtestIndex(nextIndex);
                // Don't set timeLeft here, wait for break to finish or set immediately if no break
                // But we have a break logic
                setCurrentIndex(0);
                setBreakTime(30); 
                setIsBreak(true);
            } else {
                finishExam();
            }
        } else {
            finishExam();
        }
    };

    const handleRequestFinish = () => {
        SoundManager.play('click');
        const questionsToCheck = (isUtbkSimulation && utbkSubtestIndex < UTBK_EXAM_CONFIG.length - 1) 
            ? activeQuestions 
            : questions;

        let unanswered = 0;
        let doubtful = 0;

        questionsToCheck.forEach(q => {
            const ans = answerMap[q.id];
            if (!ans || !ans.selectedAnswer) {
                unanswered++;
            } else if (ans.isDoubtful) {
                doubtful++;
            }
        });

        setFinishStats({
            unanswered,
            doubtful,
            total: questionsToCheck.length
        });
        
        setShowFinishModal(true);
    };

    const confirmFinishExam = () => {
        setShowFinishModal(false);
        if (isUtbkSimulation && utbkSubtestIndex < UTBK_EXAM_CONFIG.length - 1) {
            handleNextSubtest(); 
        } else {
            finishExam(); 
        }
    };

    const finishExam = async () => {
        isFinishedRef.current = true; // Prevent further saves
        if (userId && !userId.startsWith('guest-')) {
            try { await FirebaseService.clearSessionFromCloud(userId); } catch(e) {}
        }
        clearSavedSession(); 
        SoundManager.play('finish');
        onComplete(Object.values(answerMap));
    };

    const handleEarlyExit = () => {
        setShowExitModal(true);
    };

    const handlePause = () => {
        setIsPaused(true);
    };

    const handleResume = () => {
        setEndTime(Date.now() + (timeLeft * 1000));
        setIsPaused(false);
    };

    const handleSaveToCloud = async () => {
        if (!userId || userId.startsWith('guest-')) {
            showToast("Fitur simpan ke cloud hanya untuk pengguna login.", 'error');
            return;
        }

        setIsSavingToCloud(true);
        
        let safeSkdStream = skdStream;
        if (typeof skdStream === 'object' && skdStream !== null) safeSkdStream = null;
        let safeTpaStream = tpaStream;
        if (typeof tpaStream === 'object' && tpaStream !== null) safeTpaStream = null;

        const sessionState: SavedSessionState = {
            uid: userId,
            mode,
            category,
            questions, 
            answerMap,
            timeLeft,
            endTime,
            currentIndex,
            utbkSubtestIndex,
            drillContent,
            skdStream: safeSkdStream,
            tpaStream: safeTpaStream,
            packageTitle,
            timestamp: Date.now()
        };

        try {
            await FirebaseService.saveSessionToCloud(userId, sessionState);
            isFinishedRef.current = true; // Prevent local save race
            clearSavedSession();
            showToast("Progres tersimpan di cloud! Anda bisa melanjutkannya nanti.", 'success');
            
            if (onSaveAndExit) {
                onSaveAndExit();
            } else {
                onComplete(Object.values(answerMap), undefined, true);
            }
        } catch (e) {
            console.error(e);
            showToast("Gagal menyimpan ke cloud. Cek koneksi internet.", 'error');
        } finally {
            setIsSavingToCloud(false);
        }
    };

    const handleClearAnswer = () => {
        const currentQ = activeQuestions[currentIndex];
        if (!currentQ) return;
        
        const existing = answerMap[currentQ.id];
        if (existing) {
            SoundManager.play('click');
            setAnswerMap(prev => {
                const newMap = { ...prev };
                if (existing.isDoubtful) {
                    newMap[currentQ.id] = { ...existing, selectedAnswer: '', isCorrect: false, scoreEarned: 0 };
                } else {
                    delete newMap[currentQ.id];
                }
                return newMap;
            });
        }
    };

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in an input or textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Handle Esc to close modals or pause
            if (e.key === 'Escape') {
                e.preventDefault();
                if (isPaused) {
                    handleResume();
                } else if (showExitModal) {
                    setShowExitModal(false);
                } else if (showFinishModal) {
                    setShowFinishModal(false);
                } else if (showShortcutModal) {
                    setShowShortcutModal(false);
                } else if (showVoiceConfig) {
                    setShowVoiceConfig(false);
                } else if (showFlagModal) {
                    setShowFlagModal(false);
                } else if (showAdminModal) {
                    setShowAdminModal(false);
                } else if (!isBreak) {
                    handlePause();
                }
                return;
            }

            // Handle Enter to confirm finish
            if (e.key === 'Enter') {
                if (showFinishModal) {
                    e.preventDefault();
                    confirmFinishExam();
                    return;
                } else if (!showExitModal && !showAdminModal && !showFlagModal && !isBreak && !isPaused && !showVoiceConfig && !showShortcutModal) {
                    e.preventDefault();
                    handleRequestFinish();
                    return;
                }
            }

            // If any modal is open, ignore other shortcuts
            if (showFinishModal || showExitModal || showAdminModal || showFlagModal || isBreak || isPaused || showVoiceConfig || showShortcutModal) return;
            
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                if (currentIndex < activeQuestions.length - 1) {
                    SoundManager.play('click');
                    setCurrentIndex(prev => prev + 1);
                }
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                if (currentIndex > 0) {
                    SoundManager.play('click');
                    setCurrentIndex(prev => prev - 1);
                }
            } else if (e.key === 'm' || e.key === 'M' || e.key === 'r' || e.key === 'R') {
                e.preventDefault();
                toggleDoubtful();
            } else if (e.key === ' ') {
                e.preventDefault();
                // Jump to next subtest
                if (isUtbkSimulation) {
                    handleRequestFinish();
                } else {
                    const currentSubtest = activeQuestions[currentIndex]?.metadata?.subtest;
                    let nextIndex = -1;
                    for (let i = currentIndex + 1; i < activeQuestions.length; i++) {
                        if (activeQuestions[i].metadata?.subtest !== currentSubtest) {
                            nextIndex = i;
                            break;
                        }
                    }
                    if (nextIndex !== -1) {
                        setCurrentIndex(nextIndex);
                        SoundManager.play('click');
                    } else {
                        handleRequestFinish();
                    }
                }
            } else if (e.key === 'q' || e.key === 'Q') {
                e.preventDefault();
                changeFontSize('down');
            } else if (e.key === 'w' || e.key === 'W') {
                e.preventDefault();
                changeFontSize('up');
            }

            const currentQ = activeQuestions[currentIndex];
            if (currentQ && currentQ.options && currentQ.options.length > 0) {
                const keyMap: Record<string, number> = { 'a': 0, 'A': 0, 'b': 1, 'B': 1, 'c': 2, 'C': 2, 'd': 3, 'D': 3, 'e': 4, 'E': 4 };
                if (e.key in keyMap) {
                    const optIndex = keyMap[e.key];
                    if (optIndex < currentQ.options.length) {
                        handleAnswer(currentQ.options[optIndex]);
                    }
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [currentIndex, activeQuestions, showFinishModal, showExitModal, showAdminModal, showFlagModal, isBreak, isPaused, showVoiceConfig, showShortcutModal]);

    const handleAnswer = async (option: string) => {
        const currentQ = activeQuestions[currentIndex];
        if (!currentQ) return;

        const existing = answerMap[currentQ.id];
        
        // If the user selects the same option again, clear the answer
        if (existing?.selectedAnswer === option) {
            handleClearAnswer();
            return;
        }

        SoundManager.play('click');

        // Scoring Logic
        let score = 0;
        let isCorrect = false;
        
        if (category === 'SKD') {
            if (currentQ.tkpPoints && currentQ.tkpPoints.length > 0) {
                score = getTkpScore(option, currentQ);
                isCorrect = score === 5; 
            } else {
                isCorrect = option === currentQ.correctAnswer;
                score = isCorrect ? 5 : 0;
            }
        } else if (category === 'UTBK') {
            isCorrect = option === currentQ.correctAnswer;
            const difficulty = currentQ.metadata?.difficulty || 'Medium';
            const weight = difficulty === 'HOTS' || difficulty === 'Hard' ? 3 : difficulty === 'Medium' ? 2 : 1;
            score = isCorrect ? weight : 0;
        } else if (category === 'TPA') {
            const isTBI = currentQ.metadata?.subtest?.includes('TBI') || currentQ.metadata?.subtest?.includes('Inggris');
            if (tpaStream === 'PSIKOTEST_KEDINASAN') {
                if (currentQ.tkpPoints && currentQ.tkpPoints.length > 0) {
                    score = getTkpScore(option, currentQ);
                    isCorrect = score === 5;
                } else {
                    isCorrect = option === currentQ.correctAnswer;
                    score = isCorrect ? 5 : 0; 
                }
            } else {
                isCorrect = option === currentQ.correctAnswer;
                if (isTBI) {
                    score = isCorrect ? 5 : 0;
                } else {
                    score = isCorrect ? 4 : -1;
                }
            }
        } else if (category === 'PELAJARAN' || category === 'TKA') {
            if (currentQ.type === 'multiple_choice_complex') {
                const selectedSet = new Set(option.split('||').filter(Boolean));
                const correctSet = new Set(currentQ.correctAnswer.split('||').filter(Boolean));
                isCorrect = selectedSet.size === correctSet.size && [...selectedSet].every(x => correctSet.has(x));
            } else if (currentQ.type === 'matching') {
                const selectedPairs = new Set(option.split(';;').filter(Boolean));
                const correctPairs = new Set(currentQ.correctAnswer.split(';;').filter(Boolean));
                isCorrect = selectedPairs.size === correctPairs.size && [...selectedPairs].every(x => correctPairs.has(x));
            } else {
                isCorrect = option === currentQ.correctAnswer;
            }
            const difficulty = currentQ.metadata?.difficulty || 'Medium';
            const weight = difficulty === 'HOTS' || difficulty === 'Hard' ? 3 : difficulty === 'Medium' ? 2 : 1;
            score = isCorrect ? weight : 0;
        } else {
             isCorrect = option === currentQ.correctAnswer;
             score = isCorrect ? 10 : 0; 
        }

        let aiEval = '';
        if (currentQ.type !== 'multiple_choice' && category === 'GENERAL') {
             try {
                 const grade = await Gemini.evaluateFlexibleAnswer(currentQ.content, currentQ.correctAnswer, option);
                 score = grade.score;
                 isCorrect = grade.isCorrect;
                 aiEval = grade.feedback;
             } catch(e) { console.error("Grading failed"); }
        }

        const timeTaken = (Date.now() - startTimeRef.current) / 1000;

        const newAnswer: UserAnswer = {
            questionId: currentQ.id,
            selectedAnswer: option,
            isCorrect,
            scoreEarned: score,
            timeTakenSeconds: (existing?.timeTakenSeconds || 0) + timeTaken,
            isOverthinking: false,
            isGuessing: timeTaken < 5,
            aiEvaluation: aiEval,
            isDoubtful: existing?.isDoubtful || false
        };

        setAnswerMap(prev => ({ ...prev, [currentQ.id]: newAnswer }));
        startTimeRef.current = Date.now(); 

        // Auto Next Logic
        if (autoNext && currentIndex < activeQuestions.length - 1) {
            // Small delay for visual feedback of the selection before switching
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 300);
        }
    };

    const toggleDoubtful = () => {
        const currentQ = activeQuestions[currentIndex];
        setAnswerMap(prev => {
            const existing = prev[currentQ.id];
            if (existing) {
                return { ...prev, [currentQ.id]: { ...existing, isDoubtful: !existing.isDoubtful } };
            } else {
                return { 
                    ...prev, 
                    [currentQ.id]: {
                        questionId: currentQ.id,
                        selectedAnswer: '',
                        isCorrect: false,
                        scoreEarned: 0,
                        timeTakenSeconds: 0,
                        isOverthinking: false,
                        isGuessing: false,
                        isDoubtful: true
                    } 
                };
            }
        });
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const renderGridForQuestions = (qs: Question[], header: string) => {
        if (qs.length === 0) return null;
        return (
            <div className="mb-4 sm:mb-6 animate-fade-in-up">
                 <h4 className="text-[10px] sm:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 border-b border-slate-100 dark:border-slate-800 pb-1">
                    {header}
                </h4>
                <div className="grid grid-cols-6 xs:grid-cols-6 sm:grid-cols-5 gap-1.5 sm:gap-2">
                    {qs.map((q, i) => {
                        const trueIndex = activeQuestions.findIndex(aq => aq.id === q.id);
                        const ans = answerMap[q.id];
                        let bgClass = "bg-white dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300";
                        if (ans?.selectedAnswer && ans?.isDoubtful) {
                            bgClass = "bg-emerald-500 border-emerald-500 text-white";
                        } else if (ans?.selectedAnswer) {
                            bgClass = "bg-emerald-500 border-emerald-500 text-white";
                        } else if (ans?.isDoubtful) {
                            bgClass = "bg-amber-400 border-amber-400 text-white";
                        }
                        if (trueIndex === currentIndex) bgClass += " ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-800";
                        
                        return ( 
                            <button key={q.id} onClick={() => { setCurrentIndex(trueIndex); setIsMobileGridOpen(false); }} className={`relative aspect-square rounded-md sm:rounded-lg border flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${bgClass}`}>
                                {trueIndex + 1}
                                {ans?.isDoubtful && ans?.selectedAnswer && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 border border-white dark:border-slate-800 rounded-full flex items-center justify-center shadow-sm" title="Ditandai Ragu-ragu">
                                        <Flag size={6} className="text-amber-950" />
                                    </div>
                                )}
                            </button> 
                        );
                    })}
                </div>
            </div>
        );
    };

    if (isBreak) return <BreakRoom 
        timeLeft={breakTime} 
        utbkSubtestIndex={utbkSubtestIndex}
        questions={questions}
        answerMap={answerMap}
        onFinish={() => { 
            setIsBreak(false); 
            if (isUtbkSimulation) {
                const nextDuration = UTBK_EXAM_CONFIG[utbkSubtestIndex].duration;
                setEndTime(Date.now() + (nextDuration * 60 * 1000));
                setTimeLeft(nextDuration * 60);
            }
        }} 
    />;
    if (activeQuestions.length === 0 && !isLoadingMore) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto"/> Menyiapkan soal subtes...</div>;

    const currentAns = currentQ ? answerMap[currentQ.id] : undefined;

    return (
        <div className="min-h-screen bg-transparent flex flex-col md:flex-row h-screen overflow-hidden transition-colors relative">
            
            {focusTimerType === 'DEEP_WORK' && isDeepWorkRunning && (
                <div className="absolute inset-0 border-[6px] border-indigo-500/25 pointer-events-none rounded-none z-50 animate-pulse"></div>
            )}
            <FinishConfirmationModal 
                isOpen={showFinishModal} 
                onCancel={() => setShowFinishModal(false)}
                onConfirm={confirmFinishExam}
                stats={finishStats}
            />

            <VoiceControlConfigModal 
                isOpen={showVoiceConfig}
                onClose={() => setShowVoiceConfig(false)}
                onEnable={enableVoiceControl}
            />

            <ShortcutMenuModal
                isOpen={showShortcutModal}
                onClose={() => setShowShortcutModal(false)}
            />

            <QuestionFlagModal
                isOpen={showFlagModal}
                onClose={() => setShowFlagModal(false)}
                question={currentQ}
                category={category}
                showToast={showToast}
            />

            {showExitModal && (
                <div className="absolute inset-0 z-[70] bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center animate-fade-in p-3 sm:p-4">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-2xl text-center border border-slate-200 dark:border-slate-700 max-w-xs sm:max-w-sm w-full">
                        <AlertTriangle size={32} className="mx-auto mb-2 text-rose-500"/>
                        <h2 className="text-base sm:text-lg font-bold mb-1 dark:text-white">Keluar Sesi?</h2>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4">Apakah Anda ingin menyimpan progress ini ke Riwayat Belajar?</p>
                        <div className="flex flex-col gap-2 justify-center text-xs sm:text-sm font-black">
                            <button onClick={() => {
                                isFinishedRef.current = true;
                                onComplete(Object.values(answerMap), undefined, true);
                            }} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
                                Simpan ke Riwayat
                            </button>
                            <button onClick={() => {
                                isFinishedRef.current = true;
                                clearSavedSession();
                                onSaveAndExit?.();
                            }} className="w-full py-2 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                                Keluar Tanpa Simpan
                            </button>
                            <button onClick={() => setShowExitModal(false)} className="w-full py-1.5 text-slate-500 dark:text-slate-400 hover:underline font-bold">
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showAdminModal && (
                <div className="absolute inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-2xl max-w-xs sm:max-w-sm w-full border border-slate-200 dark:border-slate-700">
                        <div className="text-center mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Lock size={20} className="text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white mb-1">Admin Command</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
                                Masukkan token akses untuk membuka fitur admin
                            </p>
                        </div>
                        
                        {!isAdminAuthenticated ? (
                            <>
                                <input 
                                    type="text" 
                                    placeholder="Token Akses..." 
                                    value={adminToken}
                                    onChange={(e) => setAdminToken(e.target.value)}
                                    className="w-full p-2.5 sm:p-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg mb-4 focus:border-indigo-600 focus:ring-0 outline-none text-center font-bold tracking-widest text-xs sm:text-sm"
                                    autoFocus
                                    onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                            const isValid = await verifyToken(adminToken, ADMIN_TOKEN_HASH);
                                            if (isValid) {
                                                setIsAdminAuthenticated(true);
                                                SoundManager.play('success');
                                            } else {
                                                showToast("Token salah! Akses ditolak.", "error");
                                                SoundManager.play('error');
                                            }
                                        }
                                    }}
                                />
                                
                                <div className="flex gap-2 text-xs sm:text-sm font-bold">
                                    <button onClick={() => setShowAdminModal(false)} className="flex-1 py-1.5 sm:py-2 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                        Batal
                                    </button>
                                    <button onClick={async () => {
                                        const isValid = await verifyToken(adminToken, ADMIN_TOKEN_HASH);
                                        if (isValid) {
                                            setIsAdminAuthenticated(true);
                                            SoundManager.play('success');
                                        } else {
                                            showToast("Token salah! Akses ditolak.", "error");
                                            SoundManager.play('error');
                                        }
                                    }} className="flex-1 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-sm">
                                        Verifikasi
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm font-bold">
                                <button onClick={() => {
                                    const newMap = { ...answerMap };
                                    questions.forEach(q => {
                                        if (q.options && q.options.length > 0) {
                                            newMap[q.id] = {
                                                questionId: q.id,
                                                selectedAnswer: q.correctAnswer,
                                                isCorrect: true,
                                                scoreEarned: 5,
                                                timeTakenSeconds: 10,
                                                isDoubtful: false,
                                                isOverthinking: false,
                                                isGuessing: false
                                            };
                                        }
                                    });
                                    setAnswerMap(newMap);
                                    showToast("Semua dijawab BENAR!", "success");
                                    setShowAdminModal(false);
                                }} className="w-full py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm border border-emerald-500">
                                    Jawab Semua Benar
                                </button>

                                <button onClick={() => {
                                    const newMap = { ...answerMap };
                                    questions.forEach(q => {
                                        if (q.options && q.options.length > 0) {
                                            const wrongOption = q.options.find(o => o !== q.correctAnswer) || q.options[0];
                                            newMap[q.id] = {
                                                questionId: q.id,
                                                selectedAnswer: wrongOption,
                                                isCorrect: false,
                                                scoreEarned: 0,
                                                timeTakenSeconds: 10,
                                                isDoubtful: false,
                                                isOverthinking: false,
                                                isGuessing: false
                                            };
                                        }
                                    });
                                    setAnswerMap(newMap);
                                    showToast("Semua dijawab SALAH!", "success");
                                    setShowAdminModal(false);
                                }} className="w-full py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-sm border border-rose-500">
                                    Jawab Semua Salah
                                </button>

                                <button onClick={() => {
                                    const newMap = { ...answerMap };
                                    questions.forEach(q => {
                                        if (!newMap[q.id] && q.options && q.options.length > 0) {
                                            const randomOpt = q.options[Math.floor(Math.random() * q.options.length)];
                                            newMap[q.id] = {
                                                questionId: q.id,
                                                selectedAnswer: randomOpt,
                                                isCorrect: randomOpt === q.correctAnswer,
                                                scoreEarned: randomOpt === q.correctAnswer ? 5 : 0,
                                                timeTakenSeconds: 10,
                                                isDoubtful: false,
                                                isOverthinking: false,
                                                isGuessing: false
                                            };
                                        }
                                    });
                                    setAnswerMap(newMap);
                                    showToast("Jawaban otomatis diisi!", "success");
                                    setShowAdminModal(false);
                                }} className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm">
                                    Jawab Acak (Random)
                                </button>
                                <button onClick={() => setShowAdminModal(false)} className="w-full py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
                                    Tutup
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pause Overlay */}
            {isPaused && (
                <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center animate-fade-in px-4">
                    <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-3xl shadow-2xl text-center border border-slate-200 dark:border-slate-700 max-w-[16rem] sm:max-w-sm w-full">
                        <Pause className="mx-auto mb-3 sm:mb-4 text-indigo-600 size-10 sm:size-12"/>
                        <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 dark:text-white">Ujian Dijeda</h2>
                        <div className="flex flex-col gap-2 sm:gap-3 justify-center">
                            <button onClick={handleResume} className="w-full px-4 sm:px-8 py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl text-sm sm:text-base font-bold hover:bg-indigo-700 flex items-center justify-center gap-2">
                                <Play size={18}/> Lanjutkan
                            </button>
                            
                            {!userId?.startsWith('guest-') && (
                                <button 
                                    onClick={handleSaveToCloud} 
                                    disabled={isSavingToCloud}
                                    className="w-full px-4 sm:px-6 py-2.5 sm:py-3 bg-emerald-600 text-white rounded-xl text-xs sm:text-base font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {isSavingToCloud ? <Loader2 className="animate-spin size-4 sm:size-5"/> : <CloudUpload className="size-4 sm:size-5"/>}
                                    Simpan & Lanjut Nanti
                                </button>
                            )}

                            <button onClick={() => setShowExitModal(true)} className="w-full px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm sm:text-base font-bold hover:bg-slate-50 dark:hover:bg-slate-700">
                                Keluar (Simpan Lokal)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative order-1">
                {/* Mobile Header */}
                <div className="md:hidden bg-white dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-20">
                    <div className="font-bold text-slate-700 dark:text-white text-sm">No. {currentIndex + 1}</div>
                    <div className="flex items-center gap-2">
                         {focusTimerType === 'STANDARD' && mode === StudyMode.SIMULATION && (
                            <>
                                <div className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono font-bold dark:text-white">{formatTime(timeLeft)}</div>
                                <button onClick={handlePause} className="p-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-500 rounded text-xs font-bold hover:bg-amber-200 flex items-center justify-center">
                                    <Pause size={14}/>
                                </button>
                            </>
                         )}
                         {focusTimerType === 'DEEP_WORK' && (
                            <>
                                <div className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                                    {formatTime(deepWorkTimeLeft)}
                                </div>
                                <button onClick={() => setIsDeepWorkRunning(!isDeepWorkRunning)} className="p-1.5 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold flex items-center justify-center">
                                    {isDeepWorkRunning ? <Pause size={14}/> : <Play size={14}/>}
                                </button>
                            </>
                         )}
                         {focusTimerType === 'POMODORO' && (
                            <>
                                <div className={`px-2 py-1 rounded text-xs font-mono font-bold flex items-center gap-1 ${pomodoroMode === 'focus' ? 'bg-rose-150 text-rose-600 dark:bg-rose-900/40 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                                    🍅 {formatTime(pomodoroTimeLeft)}
                                </div>
                                <button onClick={() => setIsPomodoroRunning(!isPomodoroRunning)} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded text-xs font-bold flex items-center justify-center">
                                    {isDeepWorkRunning ? <Pause size={14}/> : <Play size={14}/>}
                                </button>
                            </>
                         )}
                        <button onClick={() => setIsMobileGridOpen(!isMobileGridOpen)} className="p-1.5 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded"><Grid size={18} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 sm:p-4 md:p-6 lg:p-8">
                    <div className="max-w-3xl mx-auto pb-16 sm:pb-24">
                        {focusTimerType === 'DEEP_WORK' && (
                            <div className="mb-4 p-3 bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100/55 dark:border-indigo-900/30 rounded-2xl text-center animate-fade-in">
                                <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-500 gap-1.5 flex items-center justify-center">
                                    <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
                                    ZONA DEEP WORK (ZEN FOCUS)
                                </span>
                                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1 italic">
                                    "{DEEP_WORK_QUOTES[deepWorkQuoteIdx]}"
                                </p>
                            </div>
                        )}
                        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800/60 sm:border-slate-200 sm:dark:border-slate-700 p-3 sm:p-5 md:p-6 mb-3 sm:mb-6 relative overflow-hidden">
                            {/* Academic Hub Integrity Label */}
                            <div className="absolute -top-1 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-20"></div>
                            <div className="absolute top-2 left-6 text-[9px] font-black tracking-widest text-slate-300 dark:text-slate-600 select-none hidden sm:block pointer-events-none">
                                KERJAKAN DENGAN JUJUR DAN TELITI • © ACADEMIC HUB 2024
                            </div>
                            
                            {(!currentQ && isLoadingMore) ? (
                                <div className="animate-pulse flex flex-col gap-4">
                                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/6 mb-8"></div>
                                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                    <div className="h-12 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                                    <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">AI sedang memformulasikan soal...</div>
                                </div>
                            ) : currentQ ? (
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentQ.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        {mode === StudyMode.DRILL && drillContent && (
                                            <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800 text-sm text-slate-700 dark:text-slate-300">

                                            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-2 flex items-center gap-2"><Zap size={16}/> {drillContent.topic}</h4>
                                            <p>{drillContent.summary}</p>
                                        </div>
                                    )}

                                    {/* Question Header & Controls */}
                                    <div className="flex items-center justify-between gap-2 border-b border-slate-150/55 dark:border-slate-700/50 pb-2 mb-3.5 sm:mb-4">
                                        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 md:gap-2">
                                            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                                {isUtbkSimulation ? UTBK_EXAM_CONFIG[utbkSubtestIndex].name : (currentQ.metadata?.subtest || 'General')}
                                            </span>
                                            {currentQ.metadata?.topic && formatTopic(currentQ.metadata.subtest, currentQ.metadata.topic) && (
                                                <span className="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                                                    {formatTopic(currentQ.metadata.subtest, currentQ.metadata.topic)}
                                                </span>
                                            )}
                                            {(currentQ.metadata?.difficulty === 'HOTS' || currentQ.metadata?.difficulty === 'Hard') && (
                                                <span className="flex items-center gap-0.5 text-white font-bold text-[9px] sm:text-[10px] bg-rose-600 px-1.5 py-0.5 rounded-full shadow-sm animate-pulse border border-rose-500">
                                                    <Zap size={10} fill="currentColor"/> HOTS
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-750 px-2 py-0.5 rounded">No. {currentIndex + 1}</span>
                                        </div>
                                    </div>

                                    {/* Pacing Indicator */}
                                    {mode === StudyMode.SIMULATION && currentQ.metadata?.idealTimeSeconds && (
                                        <PacingBar idealTimeSeconds={currentQ.metadata.idealTimeSeconds} isActive={!isPaused} currentQId={currentQ.id} />
                                    )}

                                    <div className={`prose dark:prose-invert max-w-none mb-4 sm:mb-6 text-slate-800 dark:text-slate-100 fs-${fontSize} leading-relaxed word-break-safe`}>
                                        {(currentQ.content && currentQ.content.includes(':::MATRIX:::')) || (currentQ.metadata && currentQ.metadata.matrix && currentQ.metadata.matrix.length > 0) ? (
                                            <MatrixQuestionRenderer 
                                                content={currentQ.content} 
                                                metadataMatrix={currentQ.metadata?.matrix} 
                                                selectedOptionContent={answerMap[currentQ.id]?.selectedAnswer || null} 
                                            />
                                        ) : (
                                            <SimpleMarkdown 
                                                text={currentQ.content || ''} 
                                                allowIndent={
                                                    !!currentQ.metadata?.subtest?.includes('Bahasa') || 
                                                    !!currentQ.metadata?.subtest?.includes('Verbal') ||
                                                    !!currentQ.metadata?.topic?.includes('Bacaan') ||
                                                    (!!currentQ.content && currentQ.content.length > 350)
                                                }
                                            />
                                        )}
                                    </div>

                                    {/* Options */}
                                    {currentQ.type === 'multiple_choice' ? (
                                        <div className="space-y-2 sm:space-y-3">
                                            {currentQ.options?.map((opt, idx) => {
                                                const optLabel = String.fromCharCode(65 + idx);
                                                const isSelected = currentAns?.selectedAnswer === opt;
                                                let containerClass = "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750";
                                                let labelClass = "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-600";
                                                
                                                if (isSelected) { 
                                                    containerClass = "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500"; 
                                                    labelClass = "bg-indigo-600 text-white"; 
                                                }
                                                
                                                if (mode !== StudyMode.SIMULATION && currentAns) {
                                                    let isCorrect = false;
                                                    if (currentQ.tkpPoints && currentQ.tkpPoints.length > 0) {
                                                        const pScore = getTkpScore(opt, currentQ);
                                                        isCorrect = pScore === 5;
                                                    } else {
                                                        isCorrect = opt === currentQ.correctAnswer;
                                                    }
                                                    
                                                    if (isCorrect) {
                                                        containerClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"; 
                                                        labelClass = "bg-emerald-500 text-white";
                                                    } else if (isSelected) {
                                                        containerClass = "border-rose-500 bg-rose-50 dark:bg-rose-900/20"; 
                                                        labelClass = "bg-rose-500 text-white";
                                                    }
                                                }

                                                return ( 
                                                    <div 
                                                        key={idx} 
                                                        onClick={() => handleAnswer(opt)} 
                                                        role="button"
                                                        tabIndex={0}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter' || e.key === ' ') {
                                                                e.preventDefault();
                                                                handleAnswer(opt);
                                                            }
                                                        }}
                                                        className={`w-full flex items-center sm:items-start py-1.5 sm:py-2.5 px-2.5 sm:px-4 rounded-lg sm:rounded-xl border-2 transition-all duration-75 group text-left cursor-pointer active:scale-[0.98] ${containerClass}`}
                                                    > 
                                                        <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-md sm:rounded-lg flex items-center justify-center font-bold text-[10px] sm:text-xs md:text-sm mr-2 sm:mr-3 md:mr-4 flex-shrink-0 transition-colors select-none ${labelClass}`}>
                                                           <span>{optLabel}</span>
                                                        </div> 
                                                        <div className={`flex-1 pt-0 sm:pt-0.5 md:pt-1 text-slate-700 dark:text-slate-200 fs-${fontSize} min-w-0 word-break-safe pointer-events-auto`}><SimpleMarkdown text={opt} /></div> 
                                                    </div> 
                                                );
                                            })}
                                        </div>
                                    ) : currentQ.type === 'multiple_choice_complex' ? (
                                        <div className="space-y-2 sm:space-y-3">
                                    {currentQ.options?.map((opt, idx) => {
                                        const isSelected = currentAns?.selectedAnswer?.includes(opt);
                                        let containerClass = "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750";
                                        
                                        if (isSelected) { 
                                            containerClass = "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-500"; 
                                        }
                                        
                                        if (mode !== StudyMode.SIMULATION && currentAns && currentAns.selectedAnswer) {
                                            const correctAnswers = currentQ.correctAnswer.split('||');
                                            const isCorrect = correctAnswers.includes(opt);
                                            
                                            if (isCorrect) {
                                                containerClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"; 
                                            } else if (isSelected) {
                                                containerClass = "border-rose-500 bg-rose-50 dark:bg-rose-950/20"; 
                                            }
                                        }

                                        return ( 
                                            <div key={idx} 
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        let currentSelected = currentAns?.selectedAnswer ? currentAns.selectedAnswer.split('||') : [];
                                                        if (currentSelected.includes(opt)) {
                                                            currentSelected = currentSelected.filter(item => item !== opt);
                                                        } else {
                                                            currentSelected.push(opt);
                                                        }
                                                        handleAnswer(currentSelected.join('||'));
                                                    }
                                                }}
                                                onClick={() => {
                                                let currentSelected = currentAns?.selectedAnswer ? currentAns.selectedAnswer.split('||') : [];
                                                if (currentSelected.includes(opt)) {
                                                    currentSelected = currentSelected.filter(item => item !== opt);
                                                } else {
                                                    currentSelected.push(opt);
                                                }
                                                handleAnswer(currentSelected.join('||'));
                                            }} className={`w-full flex items-center sm:items-start py-1.5 sm:py-2 px-2.5 sm:px-4 rounded-lg sm:rounded-xl border-2 transition-all group text-left cursor-pointer ${containerClass}`}> 
                                                <div className={`w-4 h-4 sm:w-5 sm:h-5 mt-0 rounded flex items-center justify-center border-2 mr-2.5 sm:mr-3.5 flex-shrink-0 transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-600'}`}>
                                                    {isSelected && <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                                                </div> 
                                                <div className={`flex-1 pt-0 text-slate-700 dark:text-slate-200 fs-${fontSize} min-w-0 word-break-safe pointer-events-auto`}><SimpleMarkdown text={opt} /></div> 
                                            </div> 
                                        );
                                    })}
                                </div>
                            ) : currentQ.type === 'matching' ? (
                                <div className="space-y-2.5 sm:space-y-4">
                                    {currentQ.options?.map((opt, idx) => {
                                        const [left, right] = opt.split('||');
                                        const currentSelected = currentAns?.selectedAnswer ? currentAns.selectedAnswer.split(';;') : [];
                                        const selectedMatch = currentSelected.find(s => s.startsWith(left + '||'));
                                        const selectedRight = selectedMatch ? selectedMatch.split('||')[1] : '';

                                        return (
                                            <div key={idx} className="flex flex-col sm:flex-row gap-2.5 sm:gap-4 items-center p-2.5 sm:p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                                                <div className={`flex-1 w-full text-slate-700 dark:text-slate-200 fs-${fontSize} word-break-safe`}><SimpleMarkdown text={left} /></div>
                                                <div className="hidden sm:block text-slate-400"><ArrowRight size={20}/></div>
                                                <div className="w-full sm:w-1/2">
                                                    <select 
                                                        value={selectedRight}
                                                        onChange={(e) => {
                                                            const newRight = e.target.value;
                                                            let newSelected = [...currentSelected];
                                                            const matchIndex = newSelected.findIndex(s => s.startsWith(left + '||'));
                                                            
                                                            if (newRight) {
                                                                if (matchIndex !== -1) {
                                                                    newSelected[matchIndex] = `${left}||${newRight}`;
                                                                } else {
                                                                    newSelected.push(`${left}||${newRight}`);
                                                                }
                                                            } else {
                                                                if (matchIndex !== -1) {
                                                                    newSelected.splice(matchIndex, 1);
                                                                }
                                                            }
                                                            handleAnswer(newSelected.join(';;'));
                                                        }}
                                                        className={`w-full p-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white fs-${fontSize}`}
                                                    >
                                                        <option value="">Pilih Pasangan...</option>
                                                        {currentQ.options?.map(o => o.split('||')[1]).sort().map((r, rIdx) => (
                                                            <option key={rIdx} value={r}>{r}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : ( 
                                <div> <textarea className={`w-full p-4 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white fs-${fontSize}`} placeholder="Ketik jawaban Anda..." rows={4} value={currentAns?.selectedAnswer || ''} onChange={(e) => handleAnswer(e.target.value)} /> </div> 
                            )}
                        </motion.div>
                        </AnimatePresence>
                        ) : (
                            <div className="text-center py-12 text-slate-500 flex flex-col items-center">
                                 <Sparkles size={48} className="text-slate-300 mb-4" />
                                 <h3 className="text-xl font-bold text-slate-700">Tidak ada soal.</h3>
                                 <p>Soal belum dimuat atau indeks di luar batas.</p>
                            </div>
                        )}
                        </div>

                        {mode !== StudyMode.SIMULATION && currentAns && (
                            <div className="bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-100/60 dark:border-emerald-900/30 rounded-xl sm:rounded-2xl p-4 sm:p-6 animate-fade-in-up"> 
                                <div className="flex justify-between items-center mb-2.5 gap-2">
                                    <h4 className="font-bold text-xs sm:text-sm md:text-base text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5"><Lightbulb size={16} className="text-emerald-600 sm:w-5 sm:h-5"/> Pembahasan</h4>
                                    {enableAITutor && (
                                        <button 
                                            onClick={() => window.dispatchEvent(new CustomEvent('openAiTutor', { detail: { context: `Soal:\n${currentQ?.content}\n\nPembahasan:\n${currentQ?.explanation}\n\nSaya ingin bertanya mengenai penjelasan ini...`}}))}
                                            className="text-[10px] sm:text-xs bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-1 sm:px-3 sm:py-1.5 rounded-md sm:rounded-lg font-bold flex items-center gap-1 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition shrink-0"
                                        >
                                            <Bot size={12} className="sm:w-3.5 sm:h-3.5" /> Tanya AI
                                        </button>
                                    )}
                                </div>
                                <div className={`text-slate-700 dark:text-slate-300 leading-relaxed fs-${fontSize} word-break-safe`}><SimpleMarkdown text={currentQ?.explanation || ''} /></div> 
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 sm:p-3.5 z-10">
                    <div className="max-w-4xl mx-auto flex justify-between items-center gap-1">
                        <button onClick={() => {setCurrentIndex(prev => Math.max(0, prev - 1));}} disabled={currentIndex === 0} className="flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 text-[10px] sm:text-xs md:text-sm shrink-0 transition-colors"><ArrowLeft size={12} className="sm:w-4 sm:h-4"/> <span className="hidden sm:inline">Sebelumnya</span><span className="inline sm:hidden font-medium">Sebelumnya</span></button>
                        
                        <div className="flex gap-1 sm:gap-2 items-center justify-center flex-1 min-w-0">
                            {initialState && (
                                <div className="hidden lg:flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                    <Save size={10}/> Saved
                                </div>
                            )}
                            <button onClick={handleClearAnswer} className={`flex items-center gap-0.5 sm:gap-1.5 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg font-bold border transition bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-[10px] sm:text-xs md:text-sm truncate max-w-[80px] xs:max-w-none`}>
                                <XCircle size={12} className="sm:w-4 sm:h-4 shrink-0"/> <span className="hidden sm:inline">Hapus Jawaban</span><span className="inline sm:hidden font-medium">Hapus</span>
                            </button>
                            <button onClick={toggleDoubtful} className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs md:text-sm border transition shrink-0 ${currentAns?.isDoubtful ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                                <input type="checkbox" checked={currentAns?.isDoubtful || false} readOnly className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 accent-amber-500 cursor-pointer shrink-0"/><span className="hidden sm:inline ml-1 font-bold">Ragu-ragu</span><span className="inline sm:hidden font-medium ml-1">Ragu</span>
                            </button>
                        </div>
                        
                        <button 
                            onClick={() => { 
                                SoundManager.play('click');
                                if (currentIndex < activeQuestions.length - 1) {
                                    setCurrentIndex(prev => prev + 1);
                                } else {
                                    handleRequestFinish();
                                }
                            }} 
                            className="flex items-center gap-0.5 sm:gap-1.5 px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm text-[10px] sm:text-xs md:text-sm shrink-0 transition-transform active:scale-95"
                        >
                            <span className="hidden sm:inline">
                                {currentIndex === activeQuestions.length - 1 ? (isUtbkSimulation && utbkSubtestIndex < UTBK_EXAM_CONFIG.length - 1 ? 'Lanjut Subtes' : 'Selesai Tes') : 'Berikutnya'}
                            </span> 
                            <span className="sm:hidden font-bold">{currentIndex === activeQuestions.length - 1 ? 'Selesai' : 'Berikutnya'}</span>
                            <ChevronRight size={12} className="sm:w-4 sm:h-4"/>
                        </button>
                    </div>
                </div>
            </div>

            <div className={`fixed inset-y-0 right-0 w-72 sm:w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 transform transition-transform duration-300 z-[100] md:z-40 flex flex-col order-2 ${isMobileGridOpen ? 'translate-x-0' : 'translate-x-full'} md:translate-x-0 md:relative md:w-80`}>
                <div className="p-3.5 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-2 bg-slate-50 dark:bg-slate-800"> 
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-xs sm:text-sm text-slate-700 dark:text-slate-300">Navigasi Soal</h3>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {/* Font Size */}
                            <div className="flex gap-0.5 bg-slate-100 dark:bg-slate-700 p-0.5 rounded-md mr-1">
                                <button onClick={() => changeFontSize('down')} disabled={fontSize === 'xs'} className="p-0.5 hover:text-indigo-600"><Minus size={12} className="text-slate-600 dark:text-slate-300"/></button>
                                <span className="text-[10px] font-black w-6 flex justify-center text-slate-700 dark:text-slate-200">{fontSize === 'xs' ? 'A--' : fontSize === 'sm' ? 'A-' : fontSize === 'md' ? 'A' : fontSize === 'lg' ? 'A+' : 'A++'}</span>
                                <button onClick={() => changeFontSize('up')} disabled={fontSize === 'xl'} className="p-0.5 hover:text-indigo-600"><Plus size={12} className="text-slate-600 dark:text-slate-300"/></button>
                            </div>

                            {/* Flag Question */}
                            <button onClick={() => setShowFlagModal(true)} className="text-slate-400 hover:text-amber-500 transition" title="Tandai Soal">
                                <Flag size={14} />
                            </button>

                            {/* Shortcut Keyboard */}
                            <button onClick={() => setShowShortcutModal(true)} className="text-slate-400 hover:text-indigo-500 transition" title="Shortcut Keyboard">
                                <Keyboard size={14} />
                            </button>

                            {/* Voice Control (Activate Sound) */}
                            {isSupported && (
                                <button onClick={toggleVoiceControl} className={`transition ${voiceEnabled ? 'text-indigo-600 animate-pulse' : 'text-slate-400 hover:text-indigo-500'}`} title="Perintah Suara">
                                    {voiceEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                                </button>
                            )}

                            <button onClick={() => setShowAdminModal(true)} className="text-slate-400 hover:text-indigo-500 transition" title="Pengaturan"><Settings size={14}/></button>
                            <button onClick={() => setIsMobileGridOpen(false)} className="md:hidden text-slate-500"><XCircle size={18}/></button> 
                        </div>
                    </div>
                    
                    {!userId?.startsWith('guest-') && (
                        <button 
                            onClick={handleSaveToCloud}
                            disabled={isSavingToCloud}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 bg-emerald-600 text-white rounded-md font-bold text-[10px] sm:text-xs hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                            {isSavingToCloud ? <Loader2 size={12} className="animate-spin"/> : <CloudUpload size={12}/>}
                            Simpan Cloud
                        </button>
                    )}

                    <button onClick={handleEarlyExit} className="w-full flex items-center justify-center gap-1.5 py-1.5 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 rounded-md font-bold text-[10px] sm:text-xs hover:bg-rose-50 dark:hover:bg-rose-900/20 transition">
                        <ArrowLeft size={12}/> Keluar (Lokal)
                    </button>
                </div>
                
                {/* TIMER MENU SELECTION */}
                <div className="p-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 hidden md:block">
                    <div className="flex justify-between items-center mb-2.5">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 dark:text-slate-400">
                            <Timer size={12} className="text-indigo-500" />
                            Mode Timer & Fokus
                        </span>
                        
                        {/* Selector Tab Pills */}
                        <div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-[9px] font-extrabold gap-0.5">
                            <button 
                                onClick={() => { setFocusTimerType('STANDARD'); }} 
                                className={`px-1.5 py-0.5 rounded transition ${focusTimerType === 'STANDARD' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                            >
                                Standar
                            </button>
                            <button 
                                onClick={() => { setFocusTimerType('DEEP_WORK'); setIsDeepWorkRunning(true); }} 
                                className={`px-1.5 py-0.5 rounded transition ${focusTimerType === 'DEEP_WORK' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                            >
                                Deep
                            </button>
                            <button 
                                onClick={() => { setFocusTimerType('POMODORO'); setIsPomodoroRunning(true); }} 
                                className={`px-1.5 py-0.5 rounded transition ${focusTimerType === 'POMODORO' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-slate-500'}`}
                            >
                                Pomo
                            </button>
                        </div>
                    </div>

                    {/* TIMER LAYOUTS */}
                    {focusTimerType === 'STANDARD' && (
                        <div>
                            {mode === StudyMode.SIMULATION && timeLeft > 0 ? (
                                <div className="animate-fade-in text-center">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[9px] font-black uppercase text-rose-500 tracking-wider">Durasi Simulator</span>
                                        <button onClick={handlePause} className="text-[9px] bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-500 px-1 py-0.5 rounded font-black hover:bg-amber-200 flex items-center gap-0.5"><Pause size={8}/> Jeda</button>
                                    </div>
                                    <div className="text-xl font-mono font-black text-slate-800 dark:text-white">{formatTime(timeLeft)}</div>
                                </div>
                            ) : (
                                <div className="text-center py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 italic">
                                    Stopwatch Sesi Belajar Berjalan
                                </div>
                            )}
                        </div>
                    )}

                    {focusTimerType === 'DEEP_WORK' && (
                        <div className="space-y-1.5 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-400 px-1 py-0.5 rounded flex items-center gap-1.5 uppercase">
                                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping"></span>
                                    Deep Work (Muted)
                                </span>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setIsDeepWorkRunning(!isDeepWorkRunning)} 
                                        className={`p-0.5 rounded border ${isDeepWorkRunning ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-indigo-600 border-indigo-700 text-white'}`}
                                    >
                                        {isDeepWorkRunning ? <Pause size={10} /> : <Play size={10} />}
                                    </button>
                                    <button 
                                        onClick={() => { setDeepWorkTimeLeft(45 * 60); setIsDeepWorkRunning(false); }} 
                                        className="p-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-500"
                                    >
                                        <RotateCcw size={10} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-xl font-mono font-black text-slate-800 dark:text-white text-center">{formatTime(deepWorkTimeLeft)}</div>
                            <p className="text-[8px] text-slate-400 text-center font-bold uppercase tracking-wider">
                                🔕 Notifikasi Non-Penting Disenyap
                            </p>
                        </div>
                    )}

                    {focusTimerType === 'POMODORO' && (
                        <div className="space-y-1.5 animate-fade-in">
                            <div className="flex justify-between items-center">
                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 uppercase ${pomodoroMode === 'focus' ? 'bg-rose-50 text-rose-500 dark:bg-rose-950/40 dark:text-rose-450' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'}`}>
                                    🍅 {pomodoroMode === 'focus' ? 'Fokus' : 'Break'}
                                </span>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setIsPomodoroRunning(!isPomodoroRunning)} 
                                        className={`p-0.5 rounded border ${isPomodoroRunning ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-rose-600 border-rose-700 text-white'}`}
                                    >
                                        {isPomodoroRunning ? <Pause size={10} /> : <Play size={10} />}
                                    </button>
                                    <button 
                                        onClick={() => { setPomodoroTimeLeft(pomodoroMode === 'focus' ? 25 * 60 : 5 * 60); setIsPomodoroRunning(false); }} 
                                        className="p-0.5 bg-slate-200 dark:bg-slate-700 rounded text-slate-500"
                                    >
                                        <RotateCcw size={10} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-xl font-mono font-black text-slate-800 dark:text-white text-center">{formatTime(pomodoroTimeLeft)}</div>
                            <p className="text-[8px] text-slate-400 text-center font-bold uppercase tracking-wider">
                                Total Siklus: {completedPomodoros} Sesi 🍅
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 sm:space-y-6">
                    {isSkdSimulation ? (
                        <>
                           {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('TWK')), 'Tes Wawasan Kebangsaan (TWK)')}
                           {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('TIU')), 'Tes Intelegensia Umum (TIU)')}
                           {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('TKP')), 'Tes Karakteristik Pribadi (TKP)')}
                        </>
                    ) : category === 'TPA' && mode === StudyMode.SIMULATION ? (
                        tpaStream === 'PSIKOTEST_KEDINASAN' ? (
                            <>
                                {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('TIU')), 'TIU - Verbal & Numerik')}
                                {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('Gambar')), 'Tes Logika Gambar')}
                                {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('Kepribadian')), 'Tes Kepribadian')}
                            </>
                        ) : (
                            <>
                                {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('Verbal')), 'TPA - Verbal')}
                                {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('Kuantitatif')), 'TPA - Kuantitatif')}
                                {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('Penalaran') || q.metadata?.subtest?.includes('Logika')), 'TPA - Penalaran')}
                                {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('TBI') || q.metadata?.subtest?.includes('Inggris')), 'TBI - Bahasa Inggris')}
                            </>
                        )
                    ) : (category === 'PELAJARAN' || category === 'TKA') && mode === StudyMode.SIMULATION ? (
                        <>
                            {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('Matematika')), 'Matematika')}
                            {renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('Bahasa Indonesia')), 'Bahasa Indonesia')}
                            {activeQuestions.some(q => q.metadata?.subtest?.includes('Bahasa Inggris')) && renderGridForQuestions(activeQuestions.filter(q => q.metadata?.subtest?.includes('Bahasa Inggris')), 'Bahasa Inggris')}
                        </>
                    ) : (
                        renderGridForQuestions(activeQuestions, isUtbkSimulation ? UTBK_EXAM_CONFIG[utbkSubtestIndex].name : category)
                    )}
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-700 md:hidden"> 
                    <button onClick={handleRequestFinish} className="w-full py-2 bg-rose-600 text-white rounded-lg font-black text-xs transition active:scale-95">Hentikan Ujian</button> 
                </div>
            </div>
            
            {isMobileGridOpen && <div className="fixed inset-0 bg-black/50 z-50 md:hidden animate-fade-in" onTouchStart={() => setIsMobileGridOpen(false)} onClick={() => setIsMobileGridOpen(false)}></div>}
            
            <AnimatePresence>
                {isLoadingMore && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5, x: 50, y: -50 }}
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                        exit={{ opacity: 0, scale: 0.5, x: 50, y: -50 }}
                        className="fixed bottom-4 right-4 z-[100] bg-indigo-600 px-4 py-3 rounded-full shadow-xl flex items-center gap-3 border border-indigo-500 pointer-events-none"
                    >
                        <Loader2 className="animate-spin text-white w-5 h-5" />
                        <span className="text-sm font-bold text-white">Generating Questions...</span>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
};