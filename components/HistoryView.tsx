import React, { useState, useRef, useMemo } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
    ArrowLeft, User as UserIcon, Download, Upload as UploadIcon, Filter, 
    TrendingUp, Award, History, Calendar, CheckCircle, XCircle, 
    ChevronRight, Zap, Activity, Clock, BarChart2, Trash2, Eye, 
    Briefcase, GraduationCap, Brain, FileText, MessageSquare, Palette, Book, BookOpen, Library, School, Package,
    Square, CheckSquare, Grid, ShieldCheck, AlertTriangle, Flag, Bot, AlertCircle, Info, Target
} from 'lucide-react';
import { TestHistoryItem, CategoryType, SkdResultDetails, TesKoranResultDetails, TesKecermatanResultDetails, UtbkResultDetails, BenchmarkResultDetails, Question, UserAnswer, UserProfile, StudyMode } from '../types';
import { CATEGORIES } from '../constants';
import { SoundManager } from '../services/soundService';
import { SimpleMarkdown, MatrixQuestionRenderer, SvgRenderer } from './QuestionRenderer';
import { InteractiveFigural } from './InteractiveFigural';
import { isUserAdmin } from '../services/firebase';

interface HistoryProps {
    history: TestHistoryItem[];
    onBack: () => void;
    onReview: (item: TestHistoryItem) => void;
    username: string;
    onExport: () => void;
    onImport: (file: File) => void;
    onDelete: (id: string) => void;
    onDeleteMultiple?: (ids: string[]) => void;
    onToggleStudied: (id: string) => void;
    isDarkMode?: boolean;
    userProfile?: UserProfile | null;
}

const isTesKoran = (item: TestHistoryItem): boolean => {
    return item.category === 'PSIKOTEST' && item.details && 'speedPerMinute' in item.details;
};

const isTesKecermatan = (item: TestHistoryItem): boolean => {
    return item.category === 'KECERMATAN' && item.details && 'averageSpeed' in item.details;
};

const isPsikotesIQ = (item: TestHistoryItem): boolean => {
    return item.category === 'PSIKOTEST' && item.details && 'iqScore' in item.details;
};

const isColorBlindTest = (item: TestHistoryItem): boolean => {
    return item.category === 'BUTAWRNA';
};

// --- HELPER UNTUK VISUAL ---
const getCategoryVisuals = (category: CategoryType) => {
    switch (category) {
        case 'TKA':
            return { icon: GraduationCap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' };
        case 'PELAJARAN':
            return { icon: BookOpen, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' };
        case 'UTBK':
            return { icon: GraduationCap, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-100 dark:border-rose-800' };
        case 'SKD':
            return { icon: Briefcase, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-100 dark:border-amber-800' };
        case 'PSIKOTEST':
            return { icon: Brain, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-100 dark:border-purple-800' };
        case 'TPA':
            return { icon: Zap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-100 dark:border-blue-800' };
        case 'KECERMATAN':
            return { icon: Eye, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-100 dark:border-emerald-800' };
        case 'INTERVIEW':
            return { icon: MessageSquare, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-900/30', border: 'border-cyan-100 dark:border-cyan-800' };
        case 'BUTAWRNA':
            return { icon: Palette, color: 'text-pink-600 dark:text-pink-400', bg: 'bg-pink-50 dark:bg-pink-900/30', border: 'border-pink-100 dark:border-pink-800' };
        case 'SKRIPSI':
            return { icon: Book, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-100 dark:border-indigo-800' };
        default:
            return { icon: FileText, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-200 dark:border-slate-700' };
    }
};

// Helper Verdict System
const getVerdictInfo = (value: number, type: 'PERCENT' | 'IQ' | 'UTBK' = 'PERCENT') => {
    let text = "";
    let color = "";

    if (type === 'IQ') {
         if (value >= 130) { text = "Sempurna (Genius)"; color = "text-cyan-500 dark:text-cyan-400"; }
         else if (value >= 120) { text = "Istimewa (Superior)"; color = "text-teal-500 dark:text-teal-400"; }
         else if (value >= 110) { text = "Sangat Baik (High Avg)"; color = "text-emerald-500 dark:text-emerald-400"; }
         else if (value >= 90) { text = "Baik (Average)"; color = "text-indigo-500 dark:text-indigo-400"; }
         else if (value >= 80) { text = "Cukup (Low Avg)"; color = "text-amber-500 dark:text-amber-400"; }
         else if (value >= 70) { text = "Buruk (Borderline)"; color = "text-orange-500 dark:text-orange-400"; }
         else { text = "Sangat Buruk"; color = "text-rose-600 dark:text-rose-500"; }
    } else if (type === 'UTBK') {
        if (value >= 800) { text = "Istimewa"; color = "text-teal-500 dark:text-teal-400"; }
        else if (value >= 700) { text = "Sangat Baik"; color = "text-emerald-500 dark:text-emerald-400"; }
        else if (value >= 600) { text = "Baik"; color = "text-lime-600 dark:text-lime-500"; }
        else if (value >= 500) { text = "Cukup"; color = "text-amber-500 dark:text-amber-400"; }
        else { text = "Kurang"; color = "text-rose-600 dark:text-rose-500"; }
    } else {
        // Percentage (Score or Accuracy)
        if (value === 100) { text = "Sempurna"; color = "text-cyan-500 dark:text-cyan-400"; }
        else if (value >= 95) { text = "Istimewa"; color = "text-teal-500 dark:text-teal-400"; }
        else if (value >= 85) { text = "Sangat Baik"; color = "text-emerald-500 dark:text-emerald-400"; }
        else if (value >= 70) { text = "Baik"; color = "text-lime-600 dark:text-lime-500"; }
        else if (value >= 55) { text = "Cukup"; color = "text-amber-500 dark:text-amber-400"; }
        else if (value >= 40) { text = "Buruk"; color = "text-orange-500 dark:text-orange-400"; }
        else { text = "Sangat Buruk"; color = "text-rose-600 dark:text-rose-500"; }
    }
    return { text, color };
};

const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s}s`;
};

// Helper for Kecermatan Mode Labels
const getKecermatanLabel = (mode: string) => {
    if (mode === 'SIMBOL') return 'SAMA BEDA SIMBOL'; // Legacy mapping
    if (mode === 'SAMA_BEDA') return 'SAMA BEDA SIMBOL';
    if (mode === 'SIMBOL_HILANG') return 'SIMBOL HILANG';
    if (mode === 'ANGKA') return 'ANGKA HILANG';
    if (mode === 'HURUF') return 'HURUF HILANG';
    return mode;
};

// Helper for Review Colors
const getReviewColorClass = (q: Question, ans: UserAnswer | undefined) => {
    if (!ans) return 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'; // No answer / Neutral

    // TKP Logic (1-5 Points)
    // Check if points exist or if it's explicitly marked as TKP in metadata
    if ((q.tkpPoints && q.tkpPoints.length > 0) || (q.metadata?.subtest && q.metadata.subtest.includes('TKP'))) {
        const s = ans.scoreEarned;
        if (s >= 5) return 'bg-emerald-200 dark:bg-emerald-900/40 border-emerald-300 dark:border-emerald-700'; // Full Green
        if (s === 4) return 'bg-lime-200 dark:bg-lime-900/40 border-lime-300 dark:border-lime-700'; // Light Green
        if (s === 3) return 'bg-yellow-200 dark:bg-yellow-900/40 border-yellow-300 dark:border-yellow-700'; // Yellow
        if (s === 2) return 'bg-orange-200 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700'; // Orange
        return 'bg-rose-200 dark:bg-rose-900/40 border-rose-300 dark:border-rose-700'; // Red (1 or 0)
    }

    // Standard Logic (Correct/Incorrect)
    if (ans.isCorrect) return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800'; // Green
    return 'bg-rose-100 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800'; // Red
};

export const getUtbkDetails = (item: TestHistoryItem) => {
    if (item.category !== 'UTBK') return item.details;
    
    const questions = item.questions || [];
    const answers = item.answers || [];

    const calculateIrt = (sub: string, altSub?: string, altSub2?: string) => {
         const subLower = sub.toLowerCase();
         const altSubLower = altSub?.toLowerCase();
         const altSub2Lower = altSub2?.toLowerCase();
         
         const subQs = questions.filter(q => {
             const st = (q.metadata?.subtest || '').toLowerCase();
             return st.includes(subLower) || (altSubLower && st.includes(altSubLower)) || (altSub2Lower && st.includes(altSub2Lower));
         });
         if (!subQs.length) return 0;

         let totalWeight = 0;
         let earnedWeight = 0;

         subQs.forEach(q => {
             const difficulty = q.metadata?.difficulty || 'Medium';
             const weight = difficulty === 'HOTS' || difficulty === 'Hard' ? 3 : difficulty === 'Medium' ? 2 : 1;
             totalWeight += weight;
             
             const ans = answers.find(a => a.questionId === q.id);
             if (ans && ans.isCorrect) {
                 earnedWeight += weight;
             }
         });

         if (totalWeight === 0) return 0;
         return Math.round(200 + ((earnedWeight / totalWeight) * 800));
    };

    const pu=calculateIrt('Penalaran Umum');
    const ppu=calculateIrt('Pengetahuan & Pemahaman Umum', 'Pengetahuan dan Pemahaman Umum', 'PPU');
    const pbm=calculateIrt('Pemahaman Bacaan & Menulis', 'Pemahaman Bacaan dan Menulis', 'PBM');
    const pk=calculateIrt('Pengetahuan Kuantitatif', 'Kuantitatif');
    const lbi=calculateIrt('Literasi Bahasa Indonesia', 'Literasi B.Indo');
    const lbe=calculateIrt('Literasi Bahasa Inggris', 'Literasi B.Inggris');
    const pm=calculateIrt('Penalaran Matematika');
    
    const scores = [pu, ppu, pbm, pk, lbi, lbe, pm].filter(s => s > 0);
    const avg = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    
    return { pu, ppu, pbm, pk, lbi, lbe, pm, average: avg };
};

export const HistoryView: React.FC<HistoryProps> = ({ history, onBack, onReview, username, onExport, onImport, onDelete, onDeleteMultiple, onToggleStudied, userProfile }) => {
    const [filterCategory, setFilterCategory] = useState<'ALL' | CategoryType>('ALL');
    const [viewMode, setViewMode] = useState<'LIST' | 'ANALYTICS'>('LIST');
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showAllDetails, setShowAllDetails] = useState(false);

    // Auth State
    const [tokenInput, setTokenInput] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);

    const filteredHistory = history.filter(item => filterCategory === 'ALL' || item.category === filterCategory);
    const totalTests = filteredHistory.length;
    
    const avgScore = totalTests > 0 ? Math.round(filteredHistory.reduce((a, b) => a + (b.score || 0), 0) / totalTests) : 0;
    const highestScore = totalTests > 0 ? Math.max(...filteredHistory.map(h => h.score || 0)) : 0;

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        SoundManager.play('click');
        setDeleteId(id);
    };

    const confirmDelete = () => {
        if (deleteId) {
            onDelete(deleteId);
            setDeleteId(null);
        }
    };

    // --- MULTI SELECTION LOGIC ---

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredHistory.length) {
            setSelectedIds(new Set());
        } else {
            const newSet = new Set(filteredHistory.map(h => h.id));
            setSelectedIds(newSet);
        }
    };

    const initiateDeleteMultiple = () => {
        SoundManager.play('click');
        setShowConfirmModal(true);
    };

    const handleConfirmStep1 = () => {
        setShowConfirmModal(false);

        if (isUserAdmin(userProfile)) {
            handleBypassAuth();
            return;
        }

        setTokenInput('');
        setShowAuthModal(true); // Proceed to Step 2 (Token)
    };

    const handleBypassAuth = () => {
        SoundManager.play('success');
        if (onDeleteMultiple) {
            onDeleteMultiple(Array.from(selectedIds));
            setSelectedIds(new Set());
            setIsSelectionMode(false);
        }
    };

    const confirmAuth = async () => {
        if (!tokenInput) {
            // Simple alert or toast logic if available, otherwise just return
            alert("Ketik 'HAPUS SEMUA' untuk konfirmasi!");
            return;
        }

        if (tokenInput === "HAPUS SEMUA") {
            setShowAuthModal(false);
            SoundManager.play('success');
            
            if (onDeleteMultiple) {
                onDeleteMultiple(Array.from(selectedIds));
                setSelectedIds(new Set());
                setIsSelectionMode(false);
            }
        } else {
            SoundManager.play('error');
            alert("Konfirmasi salah! Ketik 'HAPUS SEMUA' dengan huruf besar.");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 md:px-6 py-2 md:py-4 transition-colors">
            {/* Delete Confirmation Modal (Single Item) */}
            {deleteId && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
                                <Trash2 size={24}/>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Hapus Riwayat?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Data hasil tes ini akan dihapus secara permanen dan tidak dapat dikembalikan.</p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">Batal</button>
                                <button onClick={confirmDelete} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition">Hapus</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL (Multi Delete Step 1) */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
                                <AlertTriangle size={24}/>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Konfirmasi Hapus Banyak</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                Anda akan menghapus <b>{selectedIds.size}</b> riwayat tes terpilih.
                                <br/>Tindakan ini tidak dapat dibatalkan.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">Batal</button>
                                <button onClick={handleConfirmStep1} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition">Lanjut</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* AUTH MODAL (Multi Delete Step 2) */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col items-center mb-6">
                            <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-4">
                                <Trash2 size={32}/>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Konfirmasi Penghapusan</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mt-1">
                                Ketik "HAPUS SEMUA" untuk menghapus data secara permanen.
                            </p>
                        </div>
                        
                        <input 
                            type="text" 
                            placeholder="HAPUS SEMUA" 
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            className="w-full p-4 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl mb-6 focus:border-rose-600 focus:ring-0 outline-none text-center font-bold tracking-widest uppercase"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && confirmAuth()}
                        />
                        
                        <div className="flex gap-3">
                            <button onClick={() => setShowAuthModal(false)} className="flex-1 py-3 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                Batal
                            </button>
                            <button onClick={confirmAuth} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition shadow-lg shadow-rose-200 dark:shadow-none">
                                Hapus Permanen
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition text-slate-700 dark:text-slate-300"><ArrowLeft size={20}/></button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Riwayat Belajar</h1>
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                <UserIcon size={12}/> {username}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 items-center">
                        {/* SELECTION MODE TOGGLE */}
                        <button 
                            onClick={() => {
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedIds(new Set());
                            }}
                            className={`p-2 rounded-lg border transition ${isSelectionMode ? 'bg-indigo-100 border-indigo-500 text-indigo-700' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}
                            title="Mode Seleksi"
                        >
                            <CheckSquare size={20} />
                        </button>

                                        <button onClick={onExport} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[10px] sm:text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-sm whitespace-nowrap">
                                            <Download size={14}/> Backup
                                        </button>
                                        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded-lg font-bold text-[10px] sm:text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shadow-sm whitespace-nowrap">
                                            <UploadIcon size={14}/> Restore
                                        </button>
                        <input type="file" ref={fileRef} className="hidden" accept=".json" onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); if (fileRef.current) fileRef.current.value = ''; }} />
                    </div>
                </div>

                {/* SELECTION ACTION BAR */}
                {isSelectionMode && (
                    <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 p-3 rounded-xl flex items-center justify-between animate-fade-in-down sticky top-0 z-30 shadow-md backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <button onClick={selectAll} className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                {selectedIds.size === filteredHistory.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                            </button>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {selectedIds.size} terpilih
                            </span>
                        </div>
                        <button 
                            onClick={initiateDeleteMultiple}
                            disabled={selectedIds.size === 0}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-rose-600 text-white rounded-lg font-bold text-[10px] sm:text-xs hover:bg-rose-700 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap"
                        >
                            <Trash2 size={14}/> Hapus Terpilih
                        </button>
                    </div>
                )}

                <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-4 scrollbar-hide">
                    <button onClick={() => setFilterCategory('ALL')} className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition ${filterCategory === 'ALL' ? 'bg-slate-900 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                        Semua
                    </button>
                    {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition ${filterCategory === cat.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-1.5 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-white dark:bg-slate-800 p-2 sm:p-5 rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="flex items-center gap-1 sm:gap-2 text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-2 font-bold text-[8px] sm:text-xs uppercase tracking-wider"><Filter size={12} className="w-[10px] h-[10px] sm:w-4 sm:h-4"/> <span className="hidden sm:inline">Total Tes</span><span className="sm:hidden">Tes</span></div>
                        <div className="text-sm sm:text-3xl font-black text-slate-800 dark:text-white">{totalTests}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 sm:p-5 rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="flex items-center gap-1 sm:gap-2 text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-2 font-bold text-[8px] sm:text-xs uppercase tracking-wider"><TrendingUp size={12} className="w-[10px] h-[10px] sm:w-4 sm:h-4"/> <span className="hidden sm:inline">Avg Skor</span><span className="sm:hidden">Avg</span></div>
                        <div className="text-sm sm:text-3xl font-black text-indigo-600 dark:text-indigo-400">{avgScore}</div>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2 sm:p-5 rounded-lg sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center sm:items-start text-center sm:text-left">
                        <div className="flex items-center gap-1 sm:gap-2 text-slate-500 dark:text-slate-400 mb-0.5 sm:mb-2 font-bold text-[8px] sm:text-xs uppercase tracking-wider"><Award size={12} className="w-[10px] h-[10px] sm:w-4 sm:h-4"/> <span className="hidden sm:inline">Tertinggi</span><span className="sm:hidden">Top</span></div>
                        <div className="text-sm sm:text-3xl font-black text-emerald-600 dark:text-emerald-500">{highestScore}</div>
                    </div>
                </div>

                <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
                    <button 
                        onClick={() => setViewMode('LIST')} 
                        className={`pb-3 text-sm font-bold transition-all border-b-2 ${viewMode === 'LIST' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Daftar Riwayat
                    </button>
                    <button 
                        onClick={() => setViewMode('ANALYTICS')} 
                        className={`pb-3 text-sm font-bold transition-all border-b-2 ${viewMode === 'ANALYTICS' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                    >
                        Analisis Progres
                    </button>
                </div>

                {viewMode === 'ANALYTICS' && (
                    <div className="space-y-6">
                        {filteredHistory.length > 1 ? (
                            <>
                                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                        <BarChart2 className="text-indigo-500 w-4 h-4" /> Grafik Tren Skor Utama
                                    </h3>
                                    <p className="text-xs text-slate-500 mb-6">Lihat peningkatan atau penurunan skor Anda dari waktu ke waktu berdasarkan filter kategori yang dipilih.</p>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={[...filteredHistory].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <defs>
                                                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                                                <XAxis dataKey={(d) => new Date(d.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }}
                                                />
                                                <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, stroke: '#6366f1', strokeWidth: 2 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                        <Target className="text-emerald-500 w-4 h-4" /> Grafik Akurasi Jawaban (%)
                                    </h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={[...filteredHistory].reverse().map((d: any) => ({ ...d, accuracy: Math.round((d.details?.correctCount || 0) / Math.max(d.details?.totalQuestions || 1, 1) * 100) }))} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                                                <XAxis dataKey={(d) => new Date(d.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px' }} />
                                                <Line type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                                <Activity size={48} className="mx-auto mb-4 opacity-20"/>
                                <p>Belum ada data progres. Kumpulkan lebih dari 1 riwayat tryout untuk melihat grafik analisis.</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'LIST' && (
                    <>
                        <div className="flex justify-end mb-4">
                            <button 
                                onClick={() => setShowAllDetails(!showAllDetails)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${showAllDetails ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
                            >
                                {showAllDetails ? <XCircle size={14}/> : <Eye size={14}/>}
                                {showAllDetails ? 'Tampilan Ringkas' : 'Tampilkan Rincian'}
                            </button>
                        </div>

                {/* List Items */}
                <div className="space-y-4">
                    {filteredHistory.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                            <History size={48} className="mx-auto mb-4 opacity-20"/>
                            <p>Tidak ada riwayat untuk kategori ini.</p>
                        </div>
                    ) : (
                        filteredHistory.map(item => {
                            const visual = getCategoryVisuals(item.category);
                            const Icon = visual.icon;
                            
                            // CALCULATE BASIC STATS
                            const totalQuestions = (item.questions || []).length;
                            const totalAnswered = (item.answers || []).length;
                            const totalCorrect = (item.answers || []).filter(a => a.isCorrect).length;
                            const totalWrong = totalAnswered - totalCorrect;
                            const totalTimeUsed = (item.answers || []).reduce((acc: number, a) => acc + (a.timeTakenSeconds || 0), 0);
                            const formattedDuration = formatDuration(totalTimeUsed);

                            const isPauli = isTesKoran(item);
                            const isKecermatan = isTesKecermatan(item);
                            const isIQ = isPsikotesIQ(item);
                            const isCB = isColorBlindTest(item);
                            
                            // Dynamic Title & Logic
                            let displayTitle = (item.category as string) || "Test Result";
                            if (item.category === 'TPA') displayTitle = 'Seleksi Lanjutan I';
                            else if (item.category === 'PSIKOTEST' && isTesKoran(item)) displayTitle = 'Tes Koran / Pauli';
                            else if (item.category === 'PSIKOTEST' && isPsikotesIQ(item)) displayTitle = 'Psikotes (IQ & Logika)';
                            else if (item.category === 'KECERMATAN') displayTitle = 'Tes Kecermatan';
                            else if (isCB) displayTitle = 'Tes Buta Warna & Visual';
                            
                            // Tampilkan nama paket jika ada
                            if (item.packageTitle) {
                                displayTitle = item.packageTitle;
                            }

                            // Display Value Logic (Score vs Accuracy vs IQ)
                            let mainDisplayValue = (item.score || 0).toString();
                            let mainDisplayLabel = "SKOR";
                            let verdictData = { text: "-", color: "text-slate-500" };

                            try {
                                if (isKecermatan) {
                                    const details = item.details as TesKecermatanResultDetails;
                                    mainDisplayValue = (details?.accuracy || 0) + "%";
                                    mainDisplayLabel = "AKURASI";
                                    verdictData = getVerdictInfo(details?.accuracy || 0, 'PERCENT');
                                } else if (isPauli) {
                                    const details = item.details as TesKoranResultDetails;
                                    mainDisplayValue = (details?.accuracy || 0) + "%";
                                    mainDisplayLabel = "AKURASI";
                                    verdictData = getVerdictInfo(details?.accuracy || 0, 'PERCENT');
                                } else if (isIQ) {
                                    // For IQ tests
                                    const iqScore = (item.details as any)?.iqScore || item.score || 0;
                                    mainDisplayValue = iqScore.toString();
                                    mainDisplayLabel = "IQ SCORE";
                                    verdictData = getVerdictInfo(iqScore, 'IQ');
                                } else if (isCB) {
                                    // For Color Blind Tests
                                    const d = item.details as any;
                                    if (d?.type === 'Ishihara Simulation') {
                                        mainDisplayValue = d.passed ? "NORMAL" : "DEFECT";
                                        mainDisplayLabel = "STATUS";
                                        verdictData = { text: d.diagnosis || "Analysis", color: d.passed ? 'text-emerald-500' : 'text-rose-500' };
                                    } else {
                                        // Hue Sort or Depth
                                        mainDisplayValue = (item.score || 0).toString();
                                        mainDisplayLabel = "SKOR";
                                        verdictData = getVerdictInfo(item.score || 0, 'PERCENT');
                                    }
                                } else if (item.category === 'UTBK') {
                                    const utbkDetails = getUtbkDetails(item) as UtbkResultDetails;
                                    mainDisplayValue = (utbkDetails?.average || 0).toString();
                                    mainDisplayLabel = "SKOR IRT";
                                    verdictData = getVerdictInfo(utbkDetails?.average || 0, 'UTBK');
                                } else {
                                    // Default Percentage based score
                                    let dynamicMaxScore = item.maxScore || 0;
                                    if (item.category === 'SKD' && item.questions && item.questions.length > 0) {
                                        dynamicMaxScore = item.questions.length * 5;
                                    }
                                    const percentage = dynamicMaxScore > 0 ? ((item.score || 0) / dynamicMaxScore) * 100 : 0;
                                    verdictData = getVerdictInfo(percentage, 'PERCENT');
                                }
                            } catch (e) {
                                console.warn("Error calculating display value for item", item.id, e);
                            }

                            // Dynamic Color for Main Score (using same logic as verdict color for consistency)
                            const scoreColorClass = verdictData.color;

                            // --- DATA PREPARATION FOR GRID ---
                            // Initialize vars
                            let gridCorrect = totalCorrect;
                            let gridWrong = totalWrong;
                            let gridSpeed = 0;
                            let gridStability = 0;
                            let gridPeak = { val: 0, index: 0 };
                            let chartData: number[] = [];

                            const details = item.details as any;
                            if (isKecermatan && details) {
                                gridCorrect = details.totalCorrect || 0;
                                gridWrong = details.totalWrong || 0;
                                gridSpeed = details.averageSpeed || 0;
                                gridStability = details.stability || 0;
                                chartData = (details.sectionData || []).map((s: any) => s.correct);
                            } else if (isPauli && details) {
                                gridCorrect = details.totalCorrect || 0;
                                gridWrong = details.totalWrong || 0;
                                gridSpeed = details.speedPerMinute || 0;
                                gridStability = details.consistencyScore || 0;
                                chartData = details.intervalData || [];
                            }

                            // Find Peak for Pauli/Kecermatan
                            if (chartData && chartData.length > 0) {
                                const maxVal = Math.max(...chartData);
                                const maxIdx = chartData.indexOf(maxVal);
                                gridPeak = { val: maxVal, index: maxIdx + 1 };
                            }

                            const safeDate = item.date ? new Date(item.date) : new Date();
                            const displayDateStr = isNaN(safeDate.getTime()) ? "Tanggal Tidak Valid" : safeDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

                            return (
                                <div 
                                    key={item.id} 
                                    onClick={() => {
                                        if (isSelectionMode) toggleSelection(item.id);
                                        else onReview(item);
                                    }}
                                    className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border transition group relative overflow-hidden cursor-pointer hover:shadow-lg ${
                                        selectedIds.has(item.id) 
                                            ? 'bg-indigo-50/10 border-indigo-500 ring-2 ring-indigo-500/20' 
                                            : item.isStudied 
                                                ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800' 
                                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500'
                                    }`}
                                >
                                    {/* Selection Checkbox Overlay */}
                                    {isSelectionMode && (
                                        <div className="absolute top-2.5 left-2.5 z-20">
                                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition ${selectedIds.has(item.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                                                {selectedIds.has(item.id) && <CheckSquare size={12} />}
                                            </div>
                                        </div>
                                    )}

                                    {/* Badge Status */}
                                    <div className="absolute top-0 right-0 z-10 flex">
                                        {item.isAborted && (
                                            <span className="bg-amber-500 text-white text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold rounded-bl-lg">TIDAK SELESAI</span>
                                        )}
                                        {item.details && (item.details as any).passed !== undefined && (
                                            <span className={`text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold rounded-bl-lg text-white ${(item.details as any).passed ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                {(item.details as any).passed ? 'LULUS' : 'TIDAK LULUS'}
                                            </span>
                                        )}
                                    </div>

                                    <div className={`flex items-start gap-2.5 sm:gap-4 ${isSelectionMode ? 'pl-6 sm:pl-8' : ''}`}>
                                        {/* Icon */}
                                        <div className={`w-8 h-8 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${visual.bg} ${visual.color} border ${visual.border}`}>
                                            <Icon size={16} className="sm:w-5 sm:h-5" />
                                        </div>

                                        {/* Main Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1.5 pr-1">
                                                <div className="flex-1 min-w-0 pr-1 sm:pr-2">
                                                    <h3 className="font-bold text-slate-800 dark:text-white text-[11px] sm:text-base whitespace-normal break-words line-clamp-2 md:line-clamp-none">
                                                        {displayTitle}
                                                    </h3>
                                                    {item.packageTitle && item.packageTitle !== displayTitle && (
                                                        <p className="text-[10px] sm:text-xs text-indigo-500 dark:text-indigo-400 font-medium whitespace-normal break-words line-clamp-1 mb-0.5 sm:mb-1">
                                                            <Package size={8} className="sm:w-2.5 sm:h-2.5 inline mr-1"/> {item.packageTitle}
                                                        </p>
                                                    )}
                                                    <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[10px] sm:text-xs mt-0.5 sm:mt-1 flex-wrap">
                                                        <span className="flex items-center gap-1"><Calendar size={12}/> {displayDateStr}</span>
                                                        
                                                        {item.mode === StudyMode.PRACTICE ? (
                                                            <span className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Subtes</span>
                                                        ) : item.mode === StudyMode.SIMULATION ? (
                                                            (() => {
                                                                if (item.category === 'SKD') {
                                                                    const details = item.details as any;
                                                                    const hasTwk = details && typeof details === 'object' && ('twk' in details || (item.questions && item.questions.some(q => q.metadata?.subtest?.includes('TWK'))));
                                                                    const hasTiu = details && typeof details === 'object' && ('tiu' in details || (item.questions && item.questions.some(q => q.metadata?.subtest?.includes('TIU'))));
                                                                    const hasTkp = details && typeof details === 'object' && ('tkp' in details || (item.questions && item.questions.some(q => q.metadata?.subtest?.includes('TKP'))));
                                                                    
                                                                    if (hasTwk && hasTiu && hasTkp) {
                                                                        return <span className="bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Full TO</span>;
                                                                    } else {
                                                                        return <span className="bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase">Sub TO</span>;
                                                                    }
                                                                }
                                                                return <span className="bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Full TO</span>;
                                                            })()
                                                        ) : null}
                                                        
                                                        {/* MODE BADGES */}
                                                        {item.skdStream && <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase">{item.skdStream}</span>}
                                                        
                                                        {showAllDetails && isKecermatan && (item.details as any).mode && (
                                                            <>
                                                                <span className="bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">
                                                                    {getKecermatanLabel((item.details as any).mode)}
                                                                </span>
                                                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                    <Clock size={10}/> {formattedDuration}
                                                                </span>
                                                            </>
                                                        )}

                                                        {/* Color Blind Specific Type Badge */}
                                                        {showAllDetails && isCB && (item.details as any).type && (
                                                            <span className="bg-pink-100 dark:bg-pink-900/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-pink-700 dark:text-pink-400 uppercase">
                                                                {(item.details as any).type.replace(' Simulation', '').replace('Discrimination', '')}
                                                            </span>
                                                        )}

                                                        {/* Pauli Badge */}
                                                        {showAllDetails && isPauli && (
                                                            <>
                                                                <span className="bg-purple-100 dark:bg-purple-900/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-purple-700 dark:text-purple-400 uppercase">PAULI</span>
                                                                <span className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                                    <Clock size={10}/> {formattedDuration}
                                                                </span>
                                                            </>
                                                        )}

                                                         {/* IQ Badge */}
                                                        {showAllDetails && isPsikotesIQ(item) && (
                                                             <span className="bg-indigo-100 dark:bg-indigo-900/40 px-1.5 py-0.5 rounded text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase">IQ LOGIKA</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0 flex flex-col items-end">
                                                    <div className={`text-sm sm:text-2xl font-black ${scoreColorClass}`}>{mainDisplayValue}</div>
                                                    <div className="text-[8px] sm:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{mainDisplayLabel}</div>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onToggleStudied(item.id); }}
                                                        className={`mt-1.5 py-0.5 sm:py-1 px-1.5 sm:px-2 rounded flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[9px] uppercase font-bold transition-all ${item.isStudied ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30' : 'text-slate-400 bg-slate-50 dark:bg-slate-700/50 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                                    >
                                                        {item.isStudied ? 'Dipelajari' : 'Belum Dipelajari'}
                                                        {item.isStudied ? <CheckSquare size={10} strokeWidth={2.5} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/> : <Square size={10} strokeWidth={2} className="w-2.5 h-2.5 sm:w-3 sm:h-3"/>}
                                                    </button>
                                                </div>
                                            </div>
                                            
                                            {/* --- DETAILED STATS GRID --- */}
                                            {showAllDetails && (
                                                <div className="mt-3">
                                                    {/* STATS KHUSUS KECERMATAN & PAULI (6 ITEMS GRID) */}
                                                    {(isKecermatan || isPauli) ? (
                                                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-xs bg-slate-50 dark:bg-slate-700/30 p-2 rounded-xl border border-slate-100 dark:border-slate-700">
                                                            <div className="flex flex-col text-center border-r border-slate-200 dark:border-slate-600 last:border-0 sm:last:border-0">
                                                                <span className="text-[9px] text-slate-400 uppercase">Total Dijawab</span>
                                                                <span className="font-black text-indigo-600 dark:text-indigo-400">{gridCorrect + gridWrong}</span>
                                                            </div>
                                                            <div className="flex flex-col text-center border-r border-slate-200 dark:border-slate-600">
                                                                <span className="text-[9px] text-slate-400 uppercase">Benar/Salah</span>
                                                                <span className="font-bold"><span className="text-emerald-500">{gridCorrect}</span> / <span className="text-rose-500">{gridWrong}</span></span>
                                                            </div>
                                                            <div className="flex flex-col text-center border-r-0 sm:border-r border-slate-200 dark:border-slate-600">
                                                                <span className="text-[9px] text-slate-400 uppercase">Speed Avg</span>
                                                                <span className="font-black text-slate-700 dark:text-slate-200">{gridSpeed}</span>
                                                            </div>
                                                            <div className="flex flex-col text-center border-r border-slate-200 dark:border-slate-600">
                                                                <span className="text-[9px] text-slate-400 uppercase">Stabil</span>
                                                                <span className="font-black text-amber-500">{gridStability}</span>
                                                            </div>
                                                            <div className="flex flex-col text-center border-r border-slate-200 dark:border-slate-600">
                                                                <span className="text-[9px] text-slate-400 uppercase">Peak</span>
                                                                <span className="font-black text-emerald-500" title={`Highest: ${gridPeak.val} at Interval ${gridPeak.index}`}>{gridPeak.val}<span className="text-[8px] text-slate-400 font-normal ml-0.5">@{gridPeak.index}</span></span>
                                                            </div>
                                                            <div className="flex flex-col text-center">
                                                                <span className="text-[9px] text-slate-400 uppercase">Kesimpulan</span>
                                                                <span className={`font-black text-[10px] leading-tight ${verdictData.color}`}>{verdictData.text}</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* STATS UNTUK SOAL UMUM (TPA, SKD, UTBK, CB) */
                                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] sm:text-xs bg-slate-50 dark:bg-slate-700/30 p-2 sm:p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-400 font-medium text-[10px] sm:text-[11px] mb-0.5">Dijawab</span>
                                                                <span className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm">{totalAnswered} <span className="text-slate-400 text-[10px] sm:text-xs">/ {totalQuestions}</span></span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-slate-400 font-medium text-[10px] sm:text-[11px] mb-0.5">Benar / Salah</span>
                                                                <span className="font-bold text-emerald-600 text-xs sm:text-sm">{totalCorrect} <span className="text-slate-400 text-[10px] sm:text-xs">/</span> <span className="text-rose-500">{totalWrong}</span></span>
                                                            </div>
                                                            
                                                            {/* Dynamic Stats for Color Blind */}
                                                            {isCB && (item.details as any).breakdown && (
                                                                <div className="flex flex-col sm:col-span-2">
                                                                    <span className="text-slate-400 font-medium text-[10px] sm:text-[11px] mb-0.5">Analisis</span>
                                                                    <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-200 uppercase truncate">
                                                                        {(item.details as any).diagnosis}
                                                                    </span>
                                                                </div>
                                                            )}

                                                            {!isCB && (
                                                                <div className="flex flex-col">
                                                                    <span className="text-slate-400 font-medium text-[10px] sm:text-[11px] mb-0.5">Waktu</span>
                                                                    <span className="font-bold text-slate-700 dark:text-slate-200 text-xs sm:text-sm">{formatDuration(totalTimeUsed)}</span>
                                                                </div>
                                                            )}

                                                            {/* SKD SPECIFIC */}
                                                            {item.category === 'SKD' && item.details && (
                                                                <div className="flex flex-col col-span-2 sm:col-span-1">
                                                                    <span className="text-slate-400 font-medium text-[10px] sm:text-[11px] mb-0.5">Rincian</span>
                                                                    <div className="flex gap-1 sm:gap-1.5 text-[10px] sm:text-xs font-mono font-bold flex-wrap items-center h-full">
                                                                        {(item.details as SkdResultDetails).twk !== undefined && (
                                                                            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1 rounded">TWK:{(item.details as SkdResultDetails).twk}</span>
                                                                        )}
                                                                        {(item.details as SkdResultDetails).tiu !== undefined && (
                                                                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1 rounded">TIU:{(item.details as SkdResultDetails).tiu}</span>
                                                                        )}
                                                                        {(item.details as SkdResultDetails).tkp !== undefined && (
                                                                            <span className="bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-400 px-1 rounded">TKP:{(item.details as SkdResultDetails).tkp}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* UTBK SPECIFIC */}
                                                            {item.category === 'UTBK' && item.details && (() => {
                                                                const uDetails = getUtbkDetails(item) as UtbkResultDetails;
                                                                return (
                                                                    <div className="flex flex-col col-span-2">
                                                                        <span className="text-slate-400 font-medium text-[10px] sm:text-[11px] mb-0.5">Rincian</span>
                                                                        <div className="flex gap-1.5 text-[10px] sm:text-[11px] font-mono font-bold flex-wrap items-center mt-0.5">
                                                                            <span className="bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 px-1 rounded" title="Penalaran Umum">PU:{uDetails.pu}</span>
                                                                            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 px-1 rounded" title="Pengetahuan & Pemahaman Umum">PPU:{uDetails.ppu}</span>
                                                                            <span className="bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400 px-1 rounded" title="Pemahaman Bacaan & Menulis">PBM:{uDetails.pbm}</span>
                                                                            <span className="bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-400 px-1 rounded" title="Pengetahuan Kuantitatif">PK:{uDetails.pk}</span>
                                                                            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-1 rounded" title="Literasi B. Indonesia">LBI:{uDetails.lbi}</span>
                                                                            <span className="bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-400 px-1 rounded" title="Literasi B. Inggris">LBE:{uDetails.lbe}</span>
                                                                            <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1 rounded" title="Penalaran Matematika">PM:{uDetails.pm}</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })()}
                                                        </div>
                                                    )}

                                                    {/* CHART VISUALIZATION FOR PAULI & KECERMATAN */}
                                                    {(isPauli || isKecermatan) && chartData.length > 0 && (
                                                        <div className="mt-2 h-8 flex items-end gap-0.5 opacity-50 hover:opacity-100 transition-opacity">
                                                            {chartData.map((val, idx) => {
                                                                const max = Math.max(...chartData, 1);
                                                                const h = (val / max) * 100;
                                                                return (
                                                                    <div key={idx} className={`flex-1 rounded-t-sm ${idx + 1 === gridPeak.index ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} style={{height: `${h}%`}}></div>
                                                                )
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Delete Button (Bottom Left) */}
                                    <div className="absolute bottom-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {!isSelectionMode && (
                                            <button onClick={(e) => handleDeleteClick(e, item.id)} className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors flex items-center gap-1.5" title="Hapus">
                                                <Trash2 size={16}/>
                                                <span className="text-xs font-bold uppercase hidden sm:block">Hapus</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
                </>
                )}
            </div>
        </div>
    );
}

export const ReviewView: React.FC<{ item: TestHistoryItem, onBack: () => void, onToggleStudied?: (id: string) => void }> = ({ item, onBack, onToggleStudied }) => {
    
    // DETAIL VIEW KHUSUS TES KORAN & KECERMATAN (Unified)
    if (isTesKoran(item) || isTesKecermatan(item)) {
        const isPauli = isTesKoran(item);
        const details = item.details as (TesKoranResultDetails | TesKecermatanResultDetails);
        
        let chartData: number[] = [];
        let totalCorrect = 0;
        let totalWrong = 0;
        let speed = 0;
        let accuracy = 0;
        let stability = 0;
        let modeLabel = "";
        let verdictData = { text: "-", color: "text-slate-500" };

        if (isPauli) {
            const d = details as TesKoranResultDetails;
            chartData = d.intervalData || [];
            totalCorrect = d.totalCorrect;
            totalWrong = d.totalWrong;
            speed = d.speedPerMinute;
            accuracy = d.accuracy;
            stability = d.consistencyScore;
            modeLabel = "PAULI / KORAN";
            verdictData = getVerdictInfo(d.accuracy, 'PERCENT');
        } else {
            const d = details as TesKecermatanResultDetails;
            chartData = (d.sectionData || []).map(s => s.correct);
            totalCorrect = d.totalCorrect || 0;
            totalWrong = d.totalWrong || 0;
            speed = d.averageSpeed || 0;
            accuracy = d.accuracy || 0;
            stability = d.stability || 0;
            modeLabel = d.mode ? getKecermatanLabel(d.mode) : "Kecermatan";
            verdictData = getVerdictInfo(d.accuracy || 0, 'PERCENT');
        }

        // Find Peak
        let peakVal = 0;
        let peakIdx = 0;
        if(chartData.length > 0) {
            peakVal = Math.max(...chartData);
            peakIdx = chartData.indexOf(peakVal) + 1;
        }

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 md:px-6 py-2 md:py-4 transition-colors">
                <div className="max-w-4xl mx-auto">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-4">
                            <button onClick={onBack} className="text-slate-500 dark:text-slate-400 flex items-center hover:text-indigo-600 transition"><ArrowLeft size={16} className="mr-1"/> Kembali ke Riwayat</button>
                            {item.isAborted && (
                                 <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded font-bold">TIDAK FULL TEST</span>
                            )}
                        </div>
                        {onToggleStudied && (
                            <button 
                                onClick={() => onToggleStudied(item.id)}
                                className={`py-1 sm:py-1.5 px-2.5 sm:px-3 rounded flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs uppercase font-bold transition-all shadow-sm ${item.isStudied ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30 ring-1 ring-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' : 'text-slate-500 bg-white dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                            >
                                {item.isStudied ? 'Dipelajari' : 'Tandai Dipelajari'}
                                {item.isStudied ? <CheckSquare size={12} strokeWidth={2.5}/> : <Square size={12} strokeWidth={2}/>}
                            </button>
                        )}
                    </div>
                    
                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400">
                                <Activity size={32}/>
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analisis {modeLabel}</h1>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Kesimpulan: <span className={`font-bold ${verdictData.color}`}>{verdictData.text}</span></p>
                            </div>
                        </div>

                        {/* Top Stats Cards (6 Grid) */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            <div className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-700/30">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Volume Total</div>
                                <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{totalCorrect}</div>
                                <div className="text-[10px] text-slate-500">jawaban benar</div>
                            </div>
                             <div className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-700/30">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Error / Salah</div>
                                <div className="text-3xl font-black text-rose-500">{totalWrong}</div>
                                <div className="text-[10px] text-slate-500">jawaban salah</div>
                            </div>
                            <div className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-700/30">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Kecepatan (Avg)</div>
                                <div className="text-3xl font-black text-slate-800 dark:text-white">{speed}</div>
                                <div className="text-[10px] text-slate-500">per menit/bagian</div>
                            </div>
                            <div className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-700/30">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Akurasi</div>
                                <div className={`text-3xl font-black ${getVerdictInfo(accuracy, 'PERCENT').color}`}>{accuracy}%</div>
                                <div className="text-[10px] text-slate-500">ketelitian kerja</div>
                            </div>
                            <div className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-700/30">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Stabilitas</div>
                                <div className="text-3xl font-black text-amber-500">{stability}</div>
                                <div className="text-[10px] text-slate-500">deviasi</div>
                            </div>
                            <div className="p-5 border border-slate-100 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-700/30">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-2">Peak Performance</div>
                                <div className="text-3xl font-black text-emerald-500">{peakVal}</div>
                                <div className="text-[10px] text-slate-500">tertinggi pada menit ke-{peakIdx}</div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <h3 className="font-bold text-slate-800 dark:text-white mb-4">Grafik Ritme Kerja (Per Menit/Bagian)</h3>
                            <div className="h-64 flex items-end gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative overflow-x-auto">
                                {chartData.map((val, idx) => {
                                    const maxVal = Math.max(...chartData, 10);
                                    const h = (val / maxVal) * 100;
                                    const isPeak = (val === peakVal);
                                    
                                    return (
                                        <div key={idx} className="flex-1 flex flex-col justify-end items-center group relative h-full min-w-[20px]">
                                            <div className={`w-full rounded-t-sm transition-all hover:opacity-80 ${isPeak ? 'bg-emerald-500' : 'bg-indigo-600'}`} style={{height: `${h}%`}}></div>
                                            
                                            <div className="mt-2 text-[10px] font-bold text-slate-400">{idx+1}</div>
                                            
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-black text-white text-xs p-2 rounded z-10 whitespace-nowrap shadow-xl">
                                                Menit {idx+1}: {val}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <p className="text-xs text-slate-400 mt-2 text-center">Grafik yang menurun drastis menunjukkan indikasi kelelahan.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // STANDARD REVIEW VIEW
    const [navOpen, setNavOpen] = useState(false);

    const scrollToQuestion = (index: number) => {
        setNavOpen(false); // Close nav on mobile after jumping
        const element = document.getElementById(`question-${index}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };

    const getNavColor = (q: Question, ans: UserAnswer | undefined) => {
        if (!ans) return 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400';
        
        // TKP Logic
        if ((q.tkpPoints && q.tkpPoints.length > 0) || (q.metadata?.subtest && q.metadata.subtest.includes('TKP'))) {
             const s = ans.scoreEarned;
             if (s >= 5) return 'bg-emerald-500 text-white';
             if (s === 4) return 'bg-lime-500 text-white';
             if (s === 3) return 'bg-yellow-500 text-white';
             if (s === 2) return 'bg-orange-500 text-white';
             return 'bg-rose-500 text-white';
        }

        // Standard
        if (ans.isCorrect) return 'bg-emerald-500 text-white';
        return 'bg-rose-500 text-white';
    };

    const renderNavigationGrid = () => {
        // Group questions by subtest
        const groupedQuestions: { subtest: string; questions: { q: Question; index: number }[] }[] = [];
        let currentSubtest = "";
        let currentGroup: { subtest: string; questions: { q: Question; index: number }[] } | null = null;

        item.questions.forEach((q, i) => {
            // Determine subtest name
            let subtest = "Lainnya";
            if (q.metadata?.topic === 'TWK' || q.metadata?.subtest?.includes('TWK')) {
                subtest = "Tes Wawasan Kebangsaan";
            } else if (q.metadata?.topic === 'TIU' || q.metadata?.subtest?.includes('TIU')) {
                subtest = "Tes Intelegensia Umum";
            } else if (q.metadata?.topic === 'TKP' || q.metadata?.subtest?.includes('TKP')) {
                subtest = "Tes Karakteristik Pribadi";
            } else if (q.metadata?.subtest) {
                subtest = q.metadata.subtest;
            }
            
            // Clean up subtest name if needed
            if (subtest.startsWith("SKD - ")) subtest = subtest.replace("SKD - ", "");
            if (subtest.startsWith("UTBK - ")) subtest = subtest.replace("UTBK - ", "");

            if (subtest !== currentSubtest) {
                currentSubtest = subtest;
                currentGroup = { subtest, questions: [] };
                groupedQuestions.push(currentGroup);
            }
            if (currentGroup) {
                currentGroup.questions.push({ q, index: i });
            }
        });

        return (
            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4 text-sm uppercase tracking-wider flex items-center justify-between">
                    <div className="flex items-center gap-2"><Grid size={16}/> Navigasi Soal</div>
                    {/* Close button for mobile inside the grid */}
                    <button onClick={() => setNavOpen(false)} className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <XCircle size={20}/>
                    </button>
                </h3>
                <div className="lg:max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar space-y-4">
                    {groupedQuestions.map((group, gIdx) => (
                        <div key={gIdx}>
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2 truncate border-b border-slate-100 dark:border-slate-700 pb-1" title={group.subtest}>
                                {group.subtest}
                            </h4>
                            <div className="grid grid-cols-5 gap-2">
                                {group.questions.map(({ q, index }) => {
                                    const ans = item.answers.find(a => a.questionId === q.id);
                                    return (
                                        <button 
                                            key={index}
                                            onClick={() => scrollToQuestion(index)}
                                            className={`relative aspect-square rounded-lg font-bold text-xs flex items-center justify-center transition hover:opacity-80 shadow-sm ${getNavColor(q, ans)}`}
                                        >
                                            {index + 1}
                                            {ans?.isDoubtful && (
                                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 border border-white dark:border-slate-800 rounded-full flex items-center justify-center shadow-sm" title="Ditandai Ragu-ragu">
                                                    <Flag size={8} className="text-amber-900" />
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Legend */}
                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 space-y-3">
                    <div className="text-xs font-bold text-slate-400 uppercase">Keterangan Warna</div>
                    <div className="grid grid-cols-1 gap-2 text-[10px] font-medium text-slate-600 dark:text-slate-400">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-emerald-500"></div> Benar / 5 Poin</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-lime-500"></div> 4 Poin (TKP)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-yellow-500"></div> 3 Poin (TKP)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500"></div> 2 Poin (TKP)</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-rose-500"></div> Salah / 1 Poin</div>
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-700"></div> Kosong</div>
                        <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center"><Flag size={8} className="text-amber-900" /></div> Ditandai Ragu-ragu</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 md:px-6 py-2 pb-6 md:py-4 transition-colors relative">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={onBack} className="text-slate-500 dark:text-slate-400 flex items-center hover:text-indigo-600 transition"><ArrowLeft size={16} className="mr-1"/> Kembali ke Riwayat</button>
                    {onToggleStudied && (
                        <button 
                            onClick={() => onToggleStudied(item.id)}
                            className={`py-1 sm:py-1.5 px-2.5 sm:px-3 rounded flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-xs uppercase font-bold transition-all shadow-sm ${item.isStudied ? 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/30 ring-1 ring-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' : 'text-slate-500 bg-white dark:bg-slate-800 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'}`}
                        >
                            {item.isStudied ? 'Dipelajari' : 'Tandai Dipelajari'}
                            {item.isStudied ? <CheckSquare size={12} strokeWidth={2.5}/> : <Square size={12} strokeWidth={2}/>}
                        </button>
                    )}
                </div>
                
                {/* Mobile Nav Sidebar Overlay */}
                {navOpen && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity" onClick={() => setNavOpen(false)}>
                        <div className="fixed inset-y-0 right-0 w-72 sm:w-80 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col transform transition-transform duration-300 animate-slide-in-right h-full overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
                                {renderNavigationGrid()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Floating Mobile Nav Button */}
                {!navOpen && (
                    <button 
                        onClick={() => setNavOpen(true)}
                        className="fixed bottom-6 right-4 sm:right-6 z-40 lg:hidden flex items-center justify-center bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition"
                    >
                        <Grid size={24}/>
                    </button>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 relative">
                    {/* MAIN CONTENT */}
                    <div className="lg:col-span-3 space-y-4 sm:space-y-6">
                        <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            <div className="flex justify-between items-start mb-3 sm:mb-4">
                                <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText size={20} className="sm:w-6 sm:h-6 text-indigo-600"/> 
                                    Review: {item.packageTitle || item.category}
                                </h2>
                            </div>
                            
                            {/* Basic Score Summary */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4">
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                                    <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Skor Total</div>
                                    <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-white">
                                        {item.category === 'UTBK' ? (getUtbkDetails(item) as UtbkResultDetails).average : item.score}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl border border-slate-100 dark:border-slate-600">
                                    <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase">Benar / Salah</div>
                                    <div className="text-xl sm:text-2xl font-black">
                                        <span className="text-emerald-500">{(item.answers || []).filter(a => a.isCorrect).length}</span>
                                        <span className="text-slate-400 mx-1 sm:mx-2">/</span>
                                        <span className="text-rose-500">{(item.answers || []).filter(a => !a.isCorrect).length}</span>
                                    </div>
                                </div>
                            </div>

                            {/* SKD Subtest Scores */}
                            {item.category === 'SKD' && item.details && (
                                (() => {
                                    const details = item.details as SkdResultDetails;
                                    const hasTwk = details.twk !== undefined;
                                    const hasTiu = details.tiu !== undefined;
                                    const hasTkp = details.tkp !== undefined;
                                    const colCount = [hasTwk, hasTiu, hasTkp].filter(Boolean).length || 1;
                                    
                                    return (
                                        <div className={`mt-4 grid grid-cols-${colCount} gap-2`}>
                                            {hasTwk && (
                                                <div className="bg-amber-50 dark:bg-amber-900/30 p-3 rounded-xl border border-amber-100 dark:border-amber-800 text-center">
                                                    <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">TWK</div>
                                                    <div className="text-lg font-black text-slate-800 dark:text-white">{details.twk}</div>
                                                </div>
                                            )}
                                            {hasTiu && (
                                                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl border border-blue-100 dark:border-blue-800 text-center">
                                                    <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">TIU</div>
                                                    <div className="text-lg font-black text-slate-800 dark:text-white">{details.tiu}</div>
                                                </div>
                                            )}
                                            {hasTkp && (
                                                <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-xl border border-purple-100 dark:border-purple-800 text-center">
                                                    <div className="text-[10px] font-bold text-purple-600 dark:text-purple-400 uppercase">TKP</div>
                                                    <div className="text-lg font-black text-slate-800 dark:text-white">{details.tkp}</div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()
                            )}

                            {/* UTBK Subtest Scores */}
                            {item.category === 'UTBK' && item.details && (
                                (() => {
                                    const utbkDetails = getUtbkDetails(item) as UtbkResultDetails;
                                    return (
                                        <div className="mt-4">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Rincian Subtes</div>
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                                <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase">PU</div>
                                                    <div className="text-sm font-black text-slate-800 dark:text-white">{utbkDetails.pu}</div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase">PPU</div>
                                                    <div className="text-sm font-black text-slate-800 dark:text-white">{utbkDetails.ppu}</div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase">PBM</div>
                                                    <div className="text-sm font-black text-slate-800 dark:text-white">{utbkDetails.pbm}</div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase">PK</div>
                                                    <div className="text-sm font-black text-slate-800 dark:text-white">{utbkDetails.pk}</div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase">LBI</div>
                                                    <div className="text-sm font-black text-slate-800 dark:text-white">{utbkDetails.lbi}</div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase">LBE</div>
                                                    <div className="text-sm font-black text-slate-800 dark:text-white">{utbkDetails.lbe}</div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                    <div className="text-[9px] font-bold text-slate-500 uppercase">PM</div>
                                                    <div className="text-sm font-black text-slate-800 dark:text-white">{utbkDetails.pm}</div>
                                                </div>
                                                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800 text-center">
                                                    <div className="text-[9px] font-bold text-indigo-600 uppercase">AVG</div>
                                                    <div className="text-sm font-black text-indigo-700 dark:text-indigo-400">{utbkDetails.average}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()
                            )}

                            {/* TKA / PELAJARAN Subtest Scores */}
                            {(item.category === 'TKA' || item.category === 'PELAJARAN') && item.details && (
                                <div className="mt-4">
                                    <div className="text-xs font-bold text-slate-400 uppercase mb-2">Rincian Subtes (IRT)</div>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {(item.details as any).math !== undefined && (
                                            <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                <div className="text-[9px] font-bold text-slate-500 uppercase">MATEMATIKA</div>
                                                <div className="text-sm font-black text-slate-800 dark:text-white">{(item.details as any).math}</div>
                                            </div>
                                        )}
                                        {(item.details as any).indonesian !== undefined && (
                                            <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                <div className="text-[9px] font-bold text-slate-500 uppercase">B. INDONESIA</div>
                                                <div className="text-sm font-black text-slate-800 dark:text-white">{(item.details as any).indonesian}</div>
                                            </div>
                                        )}
                                        {(item.details as any).english !== undefined && (
                                            <div className="bg-slate-50 dark:bg-slate-700/30 p-2 rounded-lg border border-slate-100 dark:border-slate-600 text-center">
                                                <div className="text-[9px] font-bold text-slate-500 uppercase">B. INGGRIS</div>
                                                <div className="text-sm font-black text-slate-800 dark:text-white">{(item.details as any).english}</div>
                                            </div>
                                        )}
                                        {(item.details as any).average !== undefined && (
                                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-lg border border-indigo-100 dark:border-indigo-800 text-center">
                                                <div className="text-[9px] font-bold text-indigo-600 uppercase">AVG</div>
                                                <div className="text-sm font-black text-indigo-700 dark:text-indigo-400">{(item.details as any).average}</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="space-y-4">
                            {(!item.questions || item.questions.length === 0) && !isTesKoran(item) && !isTesKecermatan(item) ? (
                                <div className="text-center py-10 px-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                    <div className="text-slate-400 mb-3 flex justify-center"><AlertCircle size={40} /></div>
                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300">Detail Soal Tidak Tersedia</div>
                                    <p className="text-[11px] text-slate-500 mt-2 max-w-[240px] mx-auto leading-relaxed">
                                        Data soal untuk riwayat lama ini telah dihapus dari cache lokal untuk menghemat ruang penyimpanan.
                                    </p>
                                </div>
                            ) : (
                                (item.questions || []).map((q, i) => {
                                    const ans = (item.answers || []).find(a => a.questionId === q.id);
                                    const containerClass = getReviewColorClass(q, ans);
                                    
                                    return (
                                        <div id={`question-${i}`} key={i} className={`p-3 sm:p-4 border rounded-xl transition-all ${containerClass}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">Soal {i+1}</span>
                                                    {ans?.isDoubtful && (
                                                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 px-2 py-0.5 rounded-full">
                                                            <Flag size={8} className="sm:w-[10px] sm:h-[10px]" /> Ditandai Ragu
                                                        </span>
                                                    )}
                                                </div>
                                                {(() => {
                                                    const isTkp = (q.tkpPoints && q.tkpPoints.length > 0) || (q.metadata?.subtest && q.metadata.subtest.includes('TKP'));
                                                    if (isTkp) {
                                                        const s = ans?.scoreEarned || 0;
                                                        if (s >= 4) return <CheckCircle size={14} className="sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400"/>;
                                                        if (s >= 2) return <CheckCircle size={14} className="sm:w-4 sm:h-4 text-yellow-600 dark:text-yellow-400"/>;
                                                        return <XCircle size={14} className="sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400"/>;
                                                    }
                                                    return ans?.isCorrect ? <CheckCircle size={14} className="sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400"/> : <XCircle size={14} className="sm:w-4 sm:h-4 text-rose-600 dark:text-rose-400"/>;
                                                })()}
                                            </div>
                                            
                                            <div className="mb-2 sm:mb-3 text-[11px] sm:text-sm text-slate-800 dark:text-slate-200 text-justify">
                                                {(q.content && q.content.includes(':::MATRIX:::')) || (q.metadata && q.metadata.matrix && q.metadata.matrix.length > 0) ? (
                                                    <MatrixQuestionRenderer content={q.content} metadataMatrix={q.metadata?.matrix} />
                                                ) : (
                                                    <SimpleMarkdown 
                                                        text={q.content} 
                                                        allowIndent={
                                                            !!q.metadata?.subtest?.includes('Bahasa') || 
                                                            !!q.metadata?.subtest?.includes('Verbal') ||
                                                            !!q.metadata?.topic?.includes('Bacaan') ||
                                                            (!!q.content && q.content.length > 350)
                                                        }
                                                    />
                                                )}
                                            </div>
                                            
                                            <div className="text-[10px] sm:text-sm space-y-1 mb-2 sm:mb-3">
                                                <div className={`flex gap-2 ${
                                                    (() => {
                                                        const isTkp = (q.tkpPoints && q.tkpPoints.length > 0) || (q.metadata?.subtest && q.metadata.subtest.includes('TKP'));
                                                        if (isTkp) {
                                                            const s = ans?.scoreEarned || 0;
                                                            if (s >= 4) return 'text-emerald-700 dark:text-emerald-300';
                                                            if (s >= 2) return 'text-yellow-700 dark:text-yellow-300';
                                                            return 'text-rose-700 dark:text-rose-300';
                                                        }
                                                        return ans?.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300';
                                                    })()
                                                }`}>
                                                <span className="font-bold w-16 sm:w-24 shrink-0">Jwbn Anda:</span>
                                                <span className="font-medium">
                                                    {q.options && q.type === 'multiple_choice' ? (
                                                        <SimpleMarkdown text={ans?.selectedAnswer || '-'} />
                                                    ) : (
                                                        ans?.selectedAnswer || '-'
                                                    )}
                                                </span>
                                            </div>
                                            {(!ans?.isCorrect && !((q.tkpPoints && q.tkpPoints.length > 0) || (q.metadata?.subtest && q.metadata.subtest.includes('TKP')))) && (
                                                <div className="flex gap-2 text-slate-600 dark:text-slate-400">
                                                    <span className="font-bold w-16 sm:w-24 shrink-0">Kunci:</span>
                                                    <span className="font-medium">
                                                        {q.options && q.type === 'multiple_choice' ? (
                                                            <SimpleMarkdown text={q.correctAnswer} />
                                                        ) : (
                                                            q.correctAnswer
                                                        )}
                                                    </span>
                                                </div>
                                            )}
                                            {(q.tkpPoints || (ans?.scoreEarned !== undefined && (q.metadata?.subtest?.includes('TKP') || q.metadata?.topic?.includes('TKP')))) && (
                                                <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2">
                                                    <div className="flex gap-2 text-slate-600 dark:text-slate-400">
                                                        <span className="font-bold w-16 sm:w-24 shrink-0">Poin Anda:</span>
                                                        <span className={`font-bold px-1.5 sm:px-2 rounded ${ans?.scoreEarned && ans.scoreEarned >= 4 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700'}`}>{ans?.scoreEarned}</span>
                                                    </div>
                                                    
                                                    {/* TKP Breakdown */}
                                                    {q.tkpPoints && q.tkpPoints.length > 0 && (
                                                        <div className="mt-2 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Rincian Poin Jawaban</div>
                                                            <div className="space-y-1.5">
                                                                {[...q.tkpPoints].sort((a, b) => b.points - a.points).map((pt, idx) => {
                                                                    let isSelected = false;
                                                                    if (ans?.selectedAnswer) {
                                                                        if (ans.selectedAnswer === pt.option) {
                                                                            isSelected = true;
                                                                        } else if (q.options) {
                                                                            const optIndex = q.options.findIndex(o => o === ans.selectedAnswer);
                                                                            if (optIndex !== -1) {
                                                                                const letter = String.fromCharCode(65 + optIndex);
                                                                                if (pt.option.trim().toUpperCase() === letter) {
                                                                                    isSelected = true;
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                    
                                                                    // Get full text if pt.option is just A/B/C/D/E
                                                                    let displayText = pt.option;
                                                                    if (displayText.length === 1 && displayText.toUpperCase() >= 'A' && displayText.toUpperCase() <= 'E' && q.options) {
                                                                        const idx = displayText.toUpperCase().charCodeAt(0) - 65;
                                                                        if (idx >= 0 && idx < q.options.length) {
                                                                            displayText = q.options[idx];
                                                                        }
                                                                    }

                                                                    return (
                                                                    <div key={idx} className="flex gap-2 text-xs items-start">
                                                                        <span className={`font-bold w-6 shrink-0 text-center rounded ${
                                                                            pt.points === 5 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
                                                                            pt.points === 4 ? 'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400' :
                                                                            pt.points === 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                                                            pt.points === 2 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' :
                                                                            'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400'
                                                                        }`}>{pt.points}</span>
                                                                        <span className={`flex-1 ${isSelected ? 'font-bold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                            <SimpleMarkdown text={displayText} />
                                                                            {isSelected && <span className="ml-2 text-[10px] bg-slate-200 dark:bg-slate-600 px-1 rounded text-slate-600 dark:text-slate-300">(Jawabanmu)</span>}
                                                                        </span>
                                                                    </div>
                                                                )})}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mt-3 pt-3 border-t border-black/10 dark:border-white/10">
                                            <details className="group/exp">
                                                <summary className="flex items-center justify-between cursor-pointer list-none">
                                                    <div className="flex items-center gap-2">
                                                        <div className="text-xs font-bold text-slate-500 flex items-center gap-1 opacity-75">
                                                            <Activity size={12}/> Penjelasan:
                                                        </div>
                                                        <span className="text-[10px] text-indigo-500 font-bold group-open/exp:hidden">Lihat Pembahasan</span>
                                                        <span className="text-[10px] text-slate-400 font-bold hidden group-open/exp:inline">Tutup</span>
                                                    </div>
                                                    <button 
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            window.dispatchEvent(new CustomEvent('openAiTutor', { 
                                                                detail: { 
                                                                    context: `Soal:\n${q.content}\n\nPembahasan:\n${q.explanation}\n\nSaya sedang mengulas hasil belajar saya dan ingin bertanya penjelasan ini...`
                                                                } 
                                                            }));
                                                        }}
                                                        className="text-[9px] sm:text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 sm:py-1 rounded font-bold flex items-center gap-1 hover:bg-indigo-200 dark:hover:bg-indigo-900 transition"
                                                    >
                                                        <Bot size={10} /> Tanya AI
                                                    </button>
                                                </summary>
                                                <div className="mt-2 text-xs text-slate-600 dark:text-slate-300 bg-white/60 dark:bg-black/20 p-2 sm:p-3 rounded-lg border border-black/5 dark:border-white/5 animate-fade-in">
                                                    <SimpleMarkdown text={q.explanation} />
                                                </div>
                                            </details>
                                        </div>
                                    </div>
                                );
                            }))}
                        </div>
                    </div>

                    {/* RIGHT SIDEBAR (Navigation) */}
                    <div className="hidden lg:block lg:col-span-1">
                        <div className="sticky top-6">
                            {renderNavigationGrid()}
                        </div>
                    </div>
                </div>
            </div>

            {/* STICKY BOTTOM QUESTION BUBBLES GRID ON MOBILE REMOVED */}
        </div>
    );
};
