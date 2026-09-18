import React, { useState, useRef, useMemo } from 'react';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { 
    ArrowLeft, User as UserIcon, Download, Upload as UploadIcon, Filter, 
    TrendingUp, TrendingDown, Award, History, Calendar, CheckCircle, XCircle, 
    ChevronRight, Zap, Activity, Clock, BarChart2, Trash2, Eye, 
    Briefcase, GraduationCap, Brain, FileText, MessageSquare, Palette, Book, BookOpen, Library, School, Package,
    Square, CheckSquare, Grid, ShieldCheck, AlertTriangle, Flag, Bot, AlertCircle, Info, Target, Lightbulb, EyeOff, Search, X, Sparkles
} from 'lucide-react';
import { TestHistoryItem, CategoryType, SkdResultDetails, TesKoranResultDetails, TesKecermatanResultDetails, UtbkResultDetails, BenchmarkResultDetails, Question, UserAnswer, UserProfile, StudyMode } from '../types';
import { CATEGORIES } from '../constants';
import { SoundManager } from '../services/soundService';
import { SimpleMarkdown, MatrixQuestionRenderer, SvgRenderer } from './QuestionRenderer';
import { InteractiveFigural } from './InteractiveFigural';
import { LearningHeatmap } from './LearningHeatmap';
import { SubtestWeaknessAnalysis } from './SubtestWeaknessAnalysis';
import { calculateMovingAverageData, calculateCumulativeWeaknesses } from '../src/utils/performanceAnalytics';
import { isUserAdmin } from '../services/firebase';
import { APP_VERSION } from '../src/constants/version';

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
    return item.category?.toUpperCase() === 'BUTA WARNA' || item.category?.toUpperCase() === 'BUTAWRNA';
};

const getCategoryIcon = (category: string) => {
    const cat = category.toUpperCase();
    if (cat === 'SKD') return <ShieldCheck size={16} />;
    if (cat === 'BUTA WARNA' || cat === 'BUTAWRNA') return <Eye size={16} />;
    if (cat === 'BENCHMARK') return <Activity size={16} />;
    if (cat === 'KECERMATAN') return <Zap size={16} />;
    if (cat === 'UTBK') return <GraduationCap size={16} />;
    if (cat === 'PSIKOTEST') return <Brain size={16} />;
    return <Package size={16} />;
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

export const HistoryView: React.FC<HistoryProps> = ({ history, onBack, onReview, username, onExport, onImport, onDelete, onDeleteMultiple, onToggleStudied, userProfile, isDarkMode }) => {
    const [filterCategory, setFilterCategory] = useState<'ALL' | CategoryType>('ALL');
    const [skdSubFilter, setSkdSubFilter] = useState<'ALL' | 'TWK' | 'TIU' | 'TKP'>('ALL');
    const [timeFilter, setTimeFilter] = useState<'ALL' | 'TODAY' | 'WEEK' | 'MONTH'>('ALL');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'LIST' | 'ANALYTICS'>('LIST');
    const [maWindow, setMaWindow] = useState<5 | 10>(5);
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
    const [showSummary, setShowSummary] = useState(false);

    const [activeTab, setActiveTab] = useState<'ANALYTICS' | 'HISTORY'>('ANALYTICS');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const toggleGroup = (key: string) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
        SoundManager.play('click');
    };

    const sortedHistory = useMemo(() => {
        const sorted = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        const attemptCounts: Record<string, number> = {};
        return sorted.map(item => {
            const key = item.packageId || item.packageTitle || item.category;
            attemptCounts[key] = (attemptCounts[key] || 0) + 1;
            return { ...item, attemptNumber: attemptCounts[key] };
        }).reverse();
    }, [history]);

    const filteredHistory = sortedHistory.filter(item => {
        if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
        
        if (filterCategory === 'SKD' && skdSubFilter !== 'ALL') {
            const isTWK = item.packageId?.includes('-twk-') || item.packageTitle?.includes('TWK');
            const isTIU = item.packageId?.includes('-tiu-') || item.packageTitle?.includes('TIU');
            const isTKP = item.packageId?.includes('-tkp-') || item.packageTitle?.includes('TKP');
            
            if (skdSubFilter === 'TWK' && !isTWK) return false;
            if (skdSubFilter === 'TIU' && !isTIU) return false;
            if (skdSubFilter === 'TKP' && !isTKP) return false;
        }

        if (statusFilter !== 'ALL') {
            const isPassed = (item as any).isPassed ?? (item.score !== undefined ? (item.category === 'UTBK' ? item.score >= 600 : item.score >= 65) : false);
            if (statusFilter === 'PASSED' && !isPassed) return false;
            if (statusFilter === 'FAILED' && isPassed) return false;
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const title = (item.packageTitle || '').toLowerCase();
            const id = (item.packageId || item.id || '').toLowerCase();
            const category = (item.category || '').toLowerCase();
            const mode = (item.mode || '').toLowerCase();
            if (!title.includes(q) && !id.includes(q) && !category.includes(q) && !mode.includes(q)) return false;
        }

        if (timeFilter !== 'ALL') {
            const itemDate = new Date(item.date);
            const now = new Date();
            if (timeFilter === 'TODAY') {
                if (itemDate.toDateString() !== now.toDateString()) return false;
            } else if (timeFilter === 'WEEK') {
                const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                if (itemDate < oneWeekAgo) return false;
            } else if (timeFilter === 'MONTH') {
                const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                if (itemDate < oneMonthAgo) return false;
            }
        }
        
        return true;
    });
    const totalTests = filteredHistory.length;
    
    const avgScore = totalTests > 0 ? Math.round(filteredHistory.reduce((a, b) => a + (b.score || 0), 0) / totalTests) : 0;
    const highestScore = totalTests > 0 ? Math.max(...filteredHistory.map(h => h.score || 0)) : 0;

    let totalQuestionsAnswered = 0;
    let totalCorrectAll = 0;
    filteredHistory.forEach(h => {
        if (h.answers) {
            totalQuestionsAnswered += h.answers.length;
            totalCorrectAll += h.answers.filter(a => a.isCorrect).length;
        }
    });
    const totalWrongAll = totalQuestionsAnswered - totalCorrectAll;

    const movingAverageData = useMemo(() => {
        return calculateMovingAverageData(filteredHistory, maWindow);
    }, [filteredHistory, maWindow]);

    const cumulativeWeaknesses = useMemo(() => {
        return calculateCumulativeWeaknesses(filteredHistory);
    }, [filteredHistory]);

    const packageSummary = useMemo(() => {
        const groups: Record<string, { 
            category: string, 
            subCategories: Record<string, {
                title: string,
                count: number,
                avgScore: number,
                highestScore: number,
                attempts: { id: string, date: string, score: number, title: string }[]
            }>
        }> = {};
        
        const uniqueHistory: TestHistoryItem[] = [];
        const seenIds = new Set();
        filteredHistory.forEach(item => {
            if (!seenIds.has(item.id)) {
                uniqueHistory.push(item);
                seenIds.add(item.id);
            }
        });

        uniqueHistory.forEach(item => {
            const cat = item.category || 'LAINNYA';
            
            // Determine subcategory title
            let subTitle = item.packageTitle || item.category;
            const lowTitle = subTitle.toLowerCase();

            if (cat === 'SKD') {
                if (lowTitle.includes('twk')) {
                    subTitle = 'Materi TWK';
                } else if (lowTitle.includes('tiu')) {
                    subTitle = 'Materi TIU';
                } else if (lowTitle.includes('tkp')) {
                    subTitle = 'Materi TKP';
                } else if (lowTitle.includes('kedinasan')) {
                    if (lowTitle.includes('gabungan')) {
                        subTitle = 'SKD Kedinasan Full Gabungan';
                    } else if (lowTitle.includes('to skd kedinasan') || lowTitle.includes('try out skd kedinasan') || lowTitle.includes('to ') || lowTitle.includes('try out')) {
                        subTitle = 'TO SKD Kedinasan Full';
                    } else {
                        subTitle = 'SKD Kedinasan Full';
                    }
                } else if (lowTitle.includes('simulasi') || lowTitle.includes('lengkap') || lowTitle.includes('cpns full')) {
                    subTitle = 'Simulasi SKD CPNS Full';
                } else if (item.skdStream === 'KEDINASAN') {
                    subTitle = 'SKD Kedinasan Full';
                } else {
                    subTitle = 'Materi SKD';
                }
            }
 else if (cat === 'UTBK') {
                if (lowTitle.includes('simulasi')) subTitle = 'Try Out UTBK';
                else subTitle = 'Materi UTBK';
            } else if (cat === 'BUTAWRNA') {
                // Ensure specific test names are used for Buta Warna
                subTitle = (item.packageTitle || 'Tes Buta Warna').replace(/BUTAWRNA/gi, 'BUTA WARNA').replace(/BUTA WRNA/gi, 'BUTA WARNA');
            } else if (cat === 'BENCHMARK' || cat === 'KECERMATAN') {
                // Keep the specific package title for these to ensure they are separated
                subTitle = item.packageTitle || item.category;
            }

            if (!groups[cat]) {
                groups[cat] = { category: cat, subCategories: {} };
                
                // For SKD, pre-initialize the required 5 subcategories to ensure they always show up
                if (cat === 'SKD') {
                    const skdSubs = ['Simulasi SKD CPNS Full', 'Materi TWK', 'Materi TIU', 'Materi TKP', 'TO SKD Kedinasan Full', 'SKD Kedinasan Full', 'SKD Kedinasan Full Gabungan'];
                    skdSubs.forEach(s => {
                        groups[cat].subCategories[s] = {
                            title: s,
                            count: 0,
                            avgScore: 0,
                            highestScore: 0,
                            attempts: []
                        };
                    });
                }
            }
            
            if (!groups[cat].subCategories[subTitle]) {
                groups[cat].subCategories[subTitle] = { 
                    title: subTitle, 
                    count: 0, 
                    avgScore: 0, 
                    highestScore: 0, 
                    attempts: [] 
                };
            }
            
            const sub = groups[cat].subCategories[subTitle];
            sub.count++;
            sub.avgScore += (item.score || 0);
            if ((item.score || 0) > sub.highestScore) {
                sub.highestScore = item.score || 0;
            }
            sub.attempts.push({ 
                id: item.id, 
                date: item.date, 
                score: item.score || 0,
                title: item.packageTitle || item.category
            });
        });
        
        // Finalize averages and sort attempts by date desc
        Object.values(groups).forEach(cat => {
            Object.values(cat.subCategories).forEach(sub => {
                if (sub.count > 0) {
                    sub.avgScore = Math.round(sub.avgScore / sub.count);
                }
                sub.attempts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            });
        });
        
        return Object.values(groups);
    }, [filteredHistory]);

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

            <div className="max-w-[1600px] w-full mx-auto space-y-5">
                
                {/* TOP NAVIGATION & ACTIONS BAR */}
                <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3">
                    <button 
                        onClick={onBack} 
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-bold text-xs bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={16}/> 
                        <span>Kembali ke Beranda</span>
                    </button>

                    <div className="flex items-center gap-2">
                        {/* SELECTION MODE TOGGLE */}
                        <button 
                            onClick={() => {
                                SoundManager.play('click');
                                setIsSelectionMode(!isSelectionMode);
                                setSelectedIds(new Set());
                            }}
                            className={`px-3.5 py-2 rounded-2xl border transition-all text-xs font-bold flex items-center gap-2 shadow-sm ${
                                isSelectionMode 
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-indigo-500/20' 
                                    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
                            }`}
                            title="Mode Seleksi"
                        >
                            <CheckSquare size={16} />
                            <span>{isSelectionMode ? 'Mode Pilih Aktif' : 'Pilih Sesi'}</span>
                        </button>

                        <button onClick={onExport} className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl font-bold text-xs hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm whitespace-nowrap">
                            <Download size={14}/> Backup
                        </button>
                        <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800 rounded-2xl font-bold text-xs hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition shadow-sm whitespace-nowrap">
                            <UploadIcon size={14}/> Restore
                        </button>
                        <input type="file" ref={fileRef} className="hidden" accept=".json" onChange={(e) => { if (e.target.files?.[0]) onImport(e.target.files[0]); if (fileRef.current) fileRef.current.value = ''; }} />
                    </div>
                </div>

                {/* HERO OVERVIEW CARD (Unified with TOSelectionScreen) */}
                <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10">
                        {/* Title & Info */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                                <GraduationCap size={28} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800">
                                        Riwayat Belajar
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                        v{APP_VERSION}
                                    </span>
                                    <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                                        <UserIcon size={10}/> {username}
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    Riwayat Belajar & Evaluasi Mandiri
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    Pantau riwayat pengerjaan tryout, tinjau progres berkala, dan ulas kembali pembahasan soal secara mendalam.
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[90px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Sesi</span>
                                <span className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-0.5">
                                    {totalTests}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[90px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Rata-rata</span>
                                <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                                    {avgScore}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[90px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skor Puncak</span>
                                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {highestScore > 0 ? highestScore : '-'}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[90px]">
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                                    <CheckCircle size={10} /> Dipelajari
                                </span>
                                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {history.filter(h => h.isStudied).length}/{history.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SELECTION ACTION BAR */}
                {isSelectionMode && (
                    <div className="bg-indigo-600 text-white p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 sticky top-3 z-30 shadow-xl shadow-indigo-600/20 border border-indigo-500 animate-fade-in">
                        <div className="flex items-center gap-3">
                            <button onClick={selectAll} className="flex items-center gap-2 text-xs font-bold text-indigo-100 hover:underline">
                                {selectedIds.size === filteredHistory.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                            </button>
                            <span className="text-xs sm:text-sm font-bold bg-white/20 px-2.5 py-1 rounded-lg">
                                {selectedIds.size} sesi terpilih
                            </span>
                        </div>
                        <button 
                            onClick={initiateDeleteMultiple}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 bg-rose-600 text-white rounded-xl font-bold text-xs hover:bg-rose-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Trash2 size={14}/> Hapus Sesi Terpilih
                        </button>
                    </div>
                )}

                {/* Search Bar & Quick Filters */}
                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari judul paket tryout, modul, kategori, atau ID..."
                            className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                    <button onClick={() => setFilterCategory('ALL')} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${filterCategory === 'ALL' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                        Semua Kategori
                    </button>
                    {CATEGORIES.map(cat => (
                        <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${filterCategory === cat.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
                            {cat.name}
                        </button>
                    ))}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {filterCategory === 'SKD' && (
                        <select 
                            value={skdSubFilter} 
                            onChange={(e) => setSkdSubFilter(e.target.value as any)}
                            className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="ALL">SKD: Semua Subtes</option>
                            <option value="TWK">SKD: TWK</option>
                            <option value="TIU">SKD: TIU</option>
                            <option value="TKP">SKD: TKP</option>
                        </select>
                    )}
                    <select 
                        value={statusFilter} 
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ALL">Status: Semua</option>
                        <option value="PASSED">Status: Lulus / Memenuhi</option>
                        <option value="FAILED">Status: Belum Lulus</option>
                    </select>
                    <select 
                        value={timeFilter} 
                        onChange={(e) => setTimeFilter(e.target.value as any)}
                        className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ALL">Waktu: Semua</option>
                        <option value="TODAY">Hari Ini</option>
                        <option value="WEEK">7 Hari Terakhir</option>
                        <option value="MONTH">30 Hari Terakhir</option>
                    </select>
                    {(searchQuery || statusFilter !== 'ALL' || timeFilter !== 'ALL' || filterCategory !== 'ALL') && (
                        <button
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('ALL');
                                setTimeFilter('ALL');
                                setFilterCategory('ALL');
                                setSkdSubFilter('ALL');
                            }}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline px-2 py-1"
                        >
                            Reset Filter ({filteredHistory.length} hasil)
                        </button>
                    )}
                </div>

                {/* View Mode Switcher Tabs */}
                <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                    <button 
                        onClick={() => { SoundManager.play('tap'); setViewMode('ANALYTICS'); }} 
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'ANALYTICS' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        <Activity size={16} />
                        <span>Evaluasi & Analisis Belajar</span>
                    </button>
                    <button 
                        onClick={() => { SoundManager.play('tap'); setViewMode('LIST'); }} 
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 ${viewMode === 'LIST' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'}`}
                    >
                        <FileText size={16} />
                        <span>Daftar Sesi Riwayat ({filteredHistory.length})</span>
                    </button>
                </div>

                {viewMode === 'ANALYTICS' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Layer 1: Consistency & Activity Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="md:col-span-2">
                                <LearningHeatmap history={history} isDarkMode={isDarkMode} />
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Aktivitas Belajar</h3>
                                    <Activity size={16} className="text-indigo-500" />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-3xl font-black text-slate-800 dark:text-white">{totalTests}</span>
                                    <span className="text-xs font-bold text-slate-500">Sesi Selesai</span>
                                </div>
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Akurasi</div>
                                        <div className="text-sm font-black text-emerald-500">
                                            {totalQuestionsAnswered > 0 ? Math.round((totalCorrectAll / totalQuestionsAnswered) * 100) : 0}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">Avg Skor</div>
                                        <div className="text-sm font-black text-indigo-500">{avgScore}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Layer 2: Main Performance Cards (Summary) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Rata-rata</div>
                                <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">{avgScore}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Puncak</div>
                                <div className="text-xl font-black text-emerald-600 dark:text-emerald-500">{highestScore}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Jawaban</div>
                                <div className="text-xl font-black text-purple-600 dark:text-purple-500">{totalQuestionsAnswered}</div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">B / S</div>
                                <div className="text-lg font-black flex items-center gap-1">
                                    <span className="text-emerald-500">{totalCorrectAll}</span>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-rose-500">{totalWrongAll}</span>
                                </div>
                            </div>
                        </div>

                        {/* Layer 3: Hierarchical Package Summary */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
                                <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <BarChart2 size={16} className="text-indigo-500" /> Ringkasan Per Paket & Materi
                                </h3>
                                <p className="text-[10px] text-slate-500 mt-1">Dikelompokkan berdasarkan kategori dan sub-materi ujian.</p>
                            </div>
                            
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {packageSummary.map((catGroup, ci) => (
                                    <div key={ci} className="overflow-hidden">
                                        <button 
                                            onClick={() => toggleGroup(catGroup.category)}
                                            className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                    {getCategoryIcon(catGroup.category)}
                                                </div>
                                                <div className="text-left">
                                                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                                        {catGroup.category.toUpperCase() === 'BUTAWRNA' ? 'BUTA WARNA' : catGroup.category}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-400">{Object.keys(catGroup.subCategories).length} Sub-materi</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={18} className={`text-slate-400 transition-transform ${expandedGroups[catGroup.category] ? 'rotate-90' : ''}`} />
                                        </button>

                                        {expandedGroups[catGroup.category] && (
                                            <div className="bg-slate-50/30 dark:bg-slate-900/10 px-4 pb-4 animate-fade-in">
                                                <div className="space-y-3">
                                                    {Object.values(catGroup.subCategories).map((sub, si) => (
                                                        <div key={si} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm overflow-hidden">
                                                            <button 
                                                                onClick={() => toggleGroup(`${catGroup.category}-${sub.title}`)}
                                                                className="w-full p-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                                                            >
                                                                <div className="flex flex-col text-left overflow-hidden">
                                                                    <span className="text-[11px] font-black text-slate-800 dark:text-white truncate pr-2">{sub.title}</span>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[9px] font-bold bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-500 whitespace-nowrap">{sub.count} Sesi</span>
                                                                        {sub.count > 0 && (
                                                                            <>
                                                                                <span className="text-[9px] font-bold text-indigo-500 whitespace-nowrap">Avg: {sub.avgScore}</span>
                                                                                <span className="text-[9px] font-bold text-emerald-500 whitespace-nowrap">Top: {sub.highestScore}</span>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <ChevronRight size={14} className={`text-slate-300 transition-transform ${expandedGroups[`${catGroup.category}-${sub.title}`] ? 'rotate-90' : ''}`} />
                                                            </button>

                                                            {expandedGroups[`${catGroup.category}-${sub.title}`] && (
                                                                <div className="px-3 pb-3 border-t border-slate-100 dark:border-slate-800 animate-slide-up">
                                                                    <table className="w-full text-left mt-2">
                                                                        <thead>
                                                                            <tr className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter border-b border-slate-50 dark:border-slate-800">
                                                                                <th className="pb-1">Tanggal</th>
                                                                                <th className="pb-1">Nama Paket</th>
                                                                                <th className="pb-1 text-right">Skor</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                                            {sub.attempts.map((att, ai) => (
                                                                                <tr key={ai} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer" onClick={() => onReview(history.find(h => h.id === att.id)!)}>
                                                                                    <td className="py-2 text-[10px] text-slate-500 font-medium">
                                                                                        {new Date(att.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                                                    </td>
                                                                                    <td className="py-2 text-[10px] text-slate-700 dark:text-slate-300 font-bold line-clamp-1">
                                                                                        {att.title}
                                                                                    </td>
                                                                                    <td className="py-2 text-[10px] text-indigo-600 dark:text-indigo-400 font-black text-right">
                                                                                        {att.score}
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Layer 4: Original Progress Charts + Moving Average Visualization */}
                        {filteredHistory.length > 1 ? (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Score Chart with Moving Average */}
                                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                            <div>
                                                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                                                    <TrendingUp className="text-indigo-500 w-4 h-4" /> Grafik Tren Skor & Moving Average
                                                </h3>
                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Garis emas menunjukkan rata-rata bergerak ({maWindow} tryout terakhir) untuk memantau konsistensi kenaikan nilai.
                                                </p>
                                            </div>

                                            {/* Window Selector Buttons */}
                                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-700/60 p-1 rounded-xl">
                                                <button
                                                    type="button"
                                                    onClick={() => setMaWindow(5)}
                                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                                        maWindow === 5 
                                                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                                    }`}
                                                >
                                                    MA-5
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setMaWindow(10)}
                                                    className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
                                                        maWindow === 10 
                                                            ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                                            : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                                    }`}
                                                >
                                                    MA-10
                                                </button>
                                            </div>
                                        </div>

                                        {/* Trend Metric Summary Card */}
                                        <div className="mb-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
                                            <div className="flex items-center gap-2">
                                                <span className="text-slate-500 font-medium">Rata-rata Terkini (MA-{maWindow}):</span>
                                                <span className="font-extrabold text-slate-800 dark:text-white text-sm">
                                                    {movingAverageData.currentMA}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 font-bold">
                                                {movingAverageData.trendDirection === 'UP' ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full text-[11px]">
                                                        <TrendingUp size={12} />
                                                        Naik +{movingAverageData.trendDelta} poin (+{movingAverageData.trendPercent}%)
                                                    </span>
                                                ) : movingAverageData.trendDirection === 'DOWN' ? (
                                                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-full text-[11px]">
                                                        <TrendingDown size={12} />
                                                        Turun {movingAverageData.trendDelta} poin ({movingAverageData.trendPercent}%)
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-200 dark:bg-slate-700/60 px-2 py-0.5 rounded-full text-[11px]">
                                                        <Activity size={12} />
                                                        Tren Stabil
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Chart Area */}
                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart 
                                                    data={movingAverageData.points} 
                                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                >
                                                    <defs>
                                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                                                        </linearGradient>
                                                    </defs>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
                                                        dy={10}
                                                    />
                                                    <YAxis 
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                                                            borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                        formatter={(value: any, name: any) => {
                                                            if (name === 'movingAvg') return [`${value} (Rata-rata Bergerak)`, `MA-${maWindow}`];
                                                            return [`${value} Poin`, 'Skor Sesi'];
                                                        }}
                                                        labelFormatter={(val) => new Date(val).toLocaleString('id-ID')}
                                                    />
                                                    <Area 
                                                        type="monotone" 
                                                        dataKey="score" 
                                                        stroke="#6366f1" 
                                                        strokeWidth={2} 
                                                        fillOpacity={1} 
                                                        fill="url(#colorScore)" 
                                                        name="score"
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="movingAvg" 
                                                        stroke="#f59e0b" 
                                                        strokeWidth={3.5} 
                                                        dot={{ r: 3.5, strokeWidth: 2, fill: '#fff', stroke: '#f59e0b' }} 
                                                        activeDot={{ r: 6, stroke: '#f59e0b', strokeWidth: 2 }}
                                                        name="movingAvg"
                                                    />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* Chart Legend */}
                                        <div className="flex items-center justify-center gap-5 mt-3 text-xs font-bold text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-indigo-500"></span>
                                                <span>Skor Sesi Aktual</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-3.5 h-1 rounded-full bg-amber-500"></span>
                                                <span>Moving Average (MA-{maWindow})</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Accuracy Chart */}
                                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-1 flex items-center gap-2">
                                                <Target className="text-emerald-500 w-4 h-4" /> Grafik Akurasi Jawaban (%)
                                            </h3>
                                            <p className="text-[11px] text-slate-500 mb-4">
                                                Persentase jawaban benar per sesi tryout untuk mengukur presisi pengerjaan soal.
                                            </p>
                                        </div>

                                        <div className="h-64 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart 
                                                    data={[...filteredHistory].reverse().map((d: any) => ({ 
                                                        ...d, 
                                                        accuracy: Math.round((d.answers || []).filter((a: any) => a.isCorrect).length / Math.max((d.answers || []).length || 1, 1) * 100) 
                                                    }))} 
                                                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#1e293b' : '#f1f5f9'} />
                                                    <XAxis 
                                                        dataKey="date" 
                                                        tickFormatter={(val) => new Date(val).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
                                                        dy={10}
                                                    />
                                                    <YAxis 
                                                        domain={[0, 100]}
                                                        axisLine={false}
                                                        tickLine={false}
                                                        tick={{ fontSize: 10, fill: isDarkMode ? '#64748b' : '#94a3b8' }}
                                                    />
                                                    <Tooltip 
                                                        contentStyle={{ 
                                                            backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', 
                                                            borderColor: isDarkMode ? '#334155' : '#e2e8f0',
                                                            borderRadius: '12px',
                                                            fontSize: '11px',
                                                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                                                        }}
                                                        formatter={(value: any) => [`${value}%`, 'Akurasi Jawaban']}
                                                        labelFormatter={(val) => new Date(val).toLocaleString('id-ID')}
                                                    />
                                                    <Line 
                                                        type="monotone" 
                                                        dataKey="accuracy" 
                                                        stroke="#10b981" 
                                                        strokeWidth={3} 
                                                        dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} 
                                                        activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }} 
                                                    />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </div>

                                        <div className="flex items-center justify-center gap-5 mt-3 text-xs font-bold text-slate-500">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                                <span>Akurasi Soal Terjawab Benar</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Layer 5: Cumulative Weakness Diagnosis (Granular Sub-test & Topic Analysis) */}
                                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-left">
                                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                                <AlertTriangle size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-white">
                                                    Peta Analisis Kekurangan Materi (Diagnosis Akumulatif)
                                                </h3>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Evaluasi gabungan dari seluruh riwayat tryout untuk mendeteksi materi yang paling sering salah dijawab.
                                                </p>
                                            </div>
                                        </div>

                                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-slate-600 dark:text-slate-300">
                                            {cumulativeWeaknesses.totalEvaluatedSessions} Sesi Dianalisis
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
                                        {/* Topik Kritis / Perlu Ditingkatkan */}
                                        <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/40 dark:border-rose-900/40 dark:bg-rose-950/20">
                                            <h4 className="text-xs font-extrabold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 uppercase tracking-wider mb-3">
                                                <AlertCircle size={15} /> Topik Prioritas Pembenahan (Akurasi Rendah)
                                            </h4>

                                            {cumulativeWeaknesses.weakestTopics.length > 0 ? (
                                                <div className="space-y-2.5">
                                                    {cumulativeWeaknesses.weakestTopics.map((topic, idx) => (
                                                        <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-rose-100 dark:border-rose-900/50 shadow-xs">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300">
                                                                            {topic.subtest}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                                                                            {topic.topic}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                                                                        {topic.accuracyPercent}%
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                                        ({topic.correctCount}/{topic.totalQuestions})
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                                                                <div 
                                                                    className="h-full bg-rose-500 rounded-full" 
                                                                    style={{ width: `${Math.min(100, Math.max(5, topic.accuracyPercent))}%` }}
                                                                />
                                                            </div>

                                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                                                                <span className="font-semibold text-slate-700 dark:text-slate-200">Saran: </span>
                                                                {topic.recommendation}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500 py-6 text-center bg-white dark:bg-slate-800 rounded-lg">
                                                    Tidak ada materi di bawah ambang kritis. Konsistensi akurasi Anda sangat memuaskan!
                                                </div>
                                            )}
                                        </div>

                                        {/* Topik yang Telah Dikuasai */}
                                        <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 dark:border-emerald-900/40 dark:bg-emerald-950/20">
                                            <h4 className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider mb-3">
                                                <CheckCircle size={15} /> Materi yang Telah Dikuasai (Akurasi Tinggi)
                                            </h4>

                                            {cumulativeWeaknesses.strongestTopics.length > 0 ? (
                                                <div className="space-y-2.5">
                                                    {cumulativeWeaknesses.strongestTopics.map((topic, idx) => (
                                                        <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/50 shadow-xs">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                                                                            {topic.subtest}
                                                                        </span>
                                                                        <span className="text-xs font-bold text-slate-800 dark:text-white">
                                                                            {topic.topic}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="text-right shrink-0">
                                                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                                                                        {topic.accuracyPercent}%
                                                                    </span>
                                                                    <span className="text-[10px] text-slate-400 ml-1">
                                                                        ({topic.correctCount}/{topic.totalQuestions})
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                                                                <div 
                                                                    className="h-full bg-emerald-500 rounded-full" 
                                                                    style={{ width: `${Math.min(100, Math.max(5, topic.accuracyPercent))}%` }}
                                                                />
                                                            </div>

                                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                                                                <span className="font-semibold text-slate-700 dark:text-slate-200">Rekomendasi: </span>
                                                                Pertahankan ritme kecepatan pengerjaan dan ulangi secara berkala untuk menjaga retensi ingatan.
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-xs text-slate-500 py-6 text-center bg-white dark:bg-slate-800 rounded-lg">
                                                    Belum ada materi yang mencapai ambang penguasaan penuh (&ge; 80%). Terus lakukan latihan rutin!
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-400">
                                <Activity size={48} className="mx-auto mb-4 opacity-20"/>
                                <p>Belum ada data progres. Kumpulkan lebih dari 1 riwayat tryout untuk melihat grafik analisis.</p>
                            </div>
                        )}
                    </div>
                )}

                {viewMode === 'LIST' && (
                    <div className="animate-fade-in">
                        <div className="flex justify-end mb-4 gap-2">
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
                            const totalHints = (item.answers || []).reduce((acc: number, a) => acc + (a.hintsUsed || 0), 0);
                            const totalEliminators = (item.answers || []).reduce((acc: number, a) => acc + (a.eliminatorsUsed || 0), 0);
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

                            // CLEAN TITLE: Remove any "Attempt" suffixes
                            displayTitle = displayTitle.replace(/\s*\(?Attempt\s*(ke-)?\s*\d+\)?/gi, '').trim();
                            displayTitle = displayTitle.replace(/\s*-\s*Attempt\s*\d+/gi, '').trim();

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
                                                <div className="mt-3 space-y-2">
                                                    {/* LAYER 1: Performa Utama (Tes, Rata-rata, Puncak) */}
                                                    <div className="grid grid-cols-3 gap-2">
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Tes (Skor)</span>
                                                            <span className={`text-xs sm:text-sm font-black ${scoreColorClass}`}>{mainDisplayValue}</span>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Rata-rata</span>
                                                            <span className="text-xs sm:text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                                {isPauli || isKecermatan ? gridSpeed : (totalAnswered > 0 ? Math.round(totalTimeUsed / totalAnswered) : 0)}
                                                                <span className="text-[8px] sm:text-[10px] font-normal ml-0.5">{isPauli ? 'jpm' : (isKecermatan ? 'dtk' : 's/q')}</span>
                                                            </span>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Puncak</span>
                                                            <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-500">
                                                                {isPauli || isKecermatan ? gridPeak.val : item.maxScore}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* LAYER 2: Detail Jawaban (Jawaban, B/S + Persentase) */}
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">Jawaban</span>
                                                            <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-200">{totalAnswered} <span className="text-slate-400 text-[10px]">/ {isPauli || isKecermatan ? totalAnswered : totalQuestions}</span></span>
                                                        </div>
                                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mb-1">B / S (%)</span>
                                                            <div className="flex gap-1.5 items-center">
                                                                <span className="text-xs sm:text-sm font-black text-emerald-500">{totalCorrect}</span>
                                                                <span className="text-slate-300 dark:text-slate-600">/</span>
                                                                <span className="text-xs sm:text-sm font-black text-rose-500">{totalWrong}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 ml-1">
                                                                    ({totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0}%)
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* LAYER 3: Rincian Tambahan (SKD/UTBK Breakdown or Analysis) */}
                                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex gap-2 items-center">
                                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Ringkasan:</span>
                                                                {item.category === 'SKD' && item.details ? (
                                                                    <div className="flex gap-1.5 text-[9px] font-bold">
                                                                        <span className="text-amber-600">TWK:{(item.details as SkdResultDetails).twk || 0}</span>
                                                                        <span className="text-blue-600">TIU:{(item.details as SkdResultDetails).tiu || 0}</span>
                                                                        <span className="text-purple-600">TKP:{(item.details as SkdResultDetails).tkp || 0}</span>
                                                                    </div>
                                                                ) : item.category === 'UTBK' && item.details ? (
                                                                    <span className="text-[9px] font-bold text-indigo-600">Avg IRT: {(item.details as any).average || 0}</span>
                                                                ) : (
                                                                    <span className={`text-[10px] font-bold uppercase ${verdictData.color}`}>{verdictData.text}</span>
                                                                )}
                                                            </div>

                                                            <div className="flex gap-3">
                                                                {totalHints > 0 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Lightbulb size={10} className="text-blue-500" />
                                                                        <span className="text-[9px] font-bold text-slate-500">{totalHints} Clue</span>
                                                                    </div>
                                                                )}
                                                                {totalEliminators > 0 && (
                                                                    <div className="flex items-center gap-1">
                                                                        <EyeOff size={10} className="text-amber-500" />
                                                                        <span className="text-[9px] font-bold text-slate-500">{totalEliminators} Eliminasi</span>
                                                                    </div>
                                                                )}
                                                                {!isPauli && !isKecermatan && (
                                                                    <div className="flex items-center gap-1">
                                                                        <Clock size={10} className="text-slate-400" />
                                                                        <span className="text-[9px] font-bold text-slate-500">{formatDuration(totalTimeUsed)}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* CHART VISUALIZATION FOR PAULI & KECERMATAN */}
                                                    {(isPauli || isKecermatan) && chartData.length > 0 && (
                                                        <div className="mt-2 h-10 flex items-end gap-0.5 opacity-60 hover:opacity-100 transition-all bg-white dark:bg-slate-900/50 p-1 rounded-lg border border-slate-100 dark:border-slate-800">
                                                            {chartData.map((val, idx) => {
                                                                const max = Math.max(...chartData, 1);
                                                                const h = (val / max) * 100;
                                                                return (
                                                                    <div key={idx} className={`flex-1 rounded-t-[1px] ${idx + 1 === gridPeak.index ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`} style={{height: `${h}%`}}></div>
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
                </div>
                )}
            </div>
        </div>
    );
}

export { ReviewView } from "./ReviewView";
