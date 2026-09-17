import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    ArrowLeft, Upload as UploadIcon, Zap, Lock, Loader2, Download, Trash2, 
    Clock, FileText, Plus, ShieldCheck, RefreshCw, Box, AlertTriangle, PenTool, 
    ListOrdered, Calendar, CheckSquare, Square, Type, Eye, Settings, ChevronDown, 
    BookOpen, Award, Brain, Hexagon, Layers, Flame, Activity, Cpu, X, Star, 
    Search, Check, Filter, Sparkles, Trophy, BarChart3, BookmarkCheck, Share2
} from 'lucide-react';
import { 
    CategoryType, SkdStreamType, StaticTestPackage, TestHistoryItem, 
    UserPackageStats, TpaStreamType, TkaLevelType, BackgroundGenTask, UserProfile 
} from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { SoundManager } from '../services/soundService';
import { ADMIN_TOKEN_HASH } from '../constants';
import { verifyToken } from '../src/utils/security';
import { isUserAdmin } from '../services/firebase';
import { APP_VERSION } from '../src/constants/version';

interface TOSelectionProps {
    category: CategoryType;
    skdStream?: SkdStreamType;
    tpaStream?: TpaStreamType;
    tkaLevel?: TkaLevelType;
    availablePackages: StaticTestPackage[];
    history: TestHistoryItem[];
    userProfile?: UserProfile | null;
    onSelectPackage: (pkg: StaticTestPackage, options?: { shuffle?: boolean }) => void;
    onAdminViewPackage?: (pkg: StaticTestPackage) => void;
    onOpenSettings?: () => void;
    onGenerateNew: (token: string, options?: { utbkVariant?: 'ONLY_MC' | 'MIXED', skdVariant?: 'FULL' | 'TWK' | 'TIU' | 'TKP' }) => Promise<void>;
    onImportPackage: (files: FileList) => void;
    onDeletePackage: (id: string) => void;
    onDeleteMultiplePackages?: (ids: string[]) => void;
    onCombinePackages?: (ids: string[], title: string) => Promise<void>;
    onFixDuplicates?: () => Promise<void>; 
    onFixGaps?: () => Promise<void>;
    onBack: () => void;
    showToast: (msg: string, type: 'success' | 'error') => void;
    confirmEnabled: boolean;
    onRefresh: () => void;
    isLoading: boolean;
    activeGenTask?: BackgroundGenTask | null;
    onCategoryChange?: (cat: CategoryType) => void;
}

const STORAGE_KEY_BEST_PACKAGES = 'fajmuls_best_packages';

export const TOSelectionScreen: React.FC<TOSelectionProps> = ({ 
    category, skdStream, tpaStream, tkaLevel, availablePackages, history, userProfile,
    onSelectPackage, onAdminViewPackage, onOpenSettings, onGenerateNew, onImportPackage, 
    onDeletePackage, onDeleteMultiplePackages, onCombinePackages, onFixDuplicates, 
    onFixGaps, onBack, showToast, confirmEnabled, onRefresh, isLoading, activeGenTask, 
    onCategoryChange
}) => {
    
    const CATEGORIES_DATA: { id: CategoryType; label: string; icon: any }[] = [
        { id: 'UTBK', label: 'UTBK-SNBT', icon: BookOpen },
        { id: 'SKD', label: 'SKD CPNS', icon: Award },
        { id: 'TPA', label: 'Psikotes / TPA', icon: Brain },
        { id: 'GENERAL', label: 'Materi Sekolah', icon: PenTool },
    ];
    
    // Trigger refresh on mount
    useEffect(() => {
        onRefresh();
    }, []);

    // Best Packages persistence state
    const [bestPackageIds, setBestPackageIds] = useState<Set<string>>(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY_BEST_PACKAGES);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) return new Set(parsed);
            }
        } catch (e) {
            console.error("Failed to load best packages", e);
        }
        return new Set();
    });

    const toggleBestPackage = (pkgId: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const nextSet = new Set(bestPackageIds);
        const isNowBest = !nextSet.has(pkgId);
        
        if (isNowBest) {
            nextSet.add(pkgId);
            SoundManager.play('success');
            showToast("Paket ditandai sebagai Paket TO Terbaik! ⭐", "success");
        } else {
            nextSet.delete(pkgId);
            SoundManager.play('click');
            showToast("Tanda Paket Terbaik dilepas.", "success");
        }
        
        setBestPackageIds(nextSet);
        try {
            localStorage.setItem(STORAGE_KEY_BEST_PACKAGES, JSON.stringify(Array.from(nextSet)));
        } catch (err) {
            console.error("Failed to save best packages", err);
        }
    };

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showCombineModal, setShowCombineModal] = useState(false);
    const [combineTitle, setCombineTitle] = useState('');

    // Search and Filtering State
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'ALL' | 'DONE' | 'NOT_DONE' | 'BEST'>('ALL');
    const [sortBy, setSortBy] = useState<'BEST_FIRST' | 'NEWEST' | 'OLDEST' | 'TITLE'>('BEST_FIRST');

    // Auth State
    const [tokenInput, setTokenInput] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ 
        type: 'GENERATE' | 'IMPORT' | 'DELETE' | 'DELETE_MULTIPLE' | 'FIX_DUPLICATES' | 'FIX_GAPS', 
        payload?: any 
    } | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [showUtbkVariantModal, setShowUtbkVariantModal] = useState(false);
    const [selectedUtbkVariant, setSelectedUtbkVariant] = useState<'ONLY_MC' | 'MIXED'>('ONLY_MC');
    const [showSkdVariantModal, setShowSkdVariantModal] = useState(false);
    const [skdMenuMode, setSkdMenuMode] = useState<'MAIN' | 'SUBTEST'>('MAIN');
    const [selectedSkdVariant, setSelectedSkdVariant] = useState<'FULL' | 'TWK' | 'TIU' | 'TKP'>('FULL');
    const [skdSubtestFilter, setSkdSubtestFilter] = useState<'SEMUA' | 'FULL' | 'TWK' | 'TIU' | 'TKP' | 'COMBINED'>('FULL');
    const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
    const [pendingPackage, setPendingPackage] = useState<StaticTestPackage | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleStartWithOption = (shuffle: boolean) => {
        if (pendingPackage) {
            onSelectPackage(pendingPackage, { shuffle });
            setPendingPackage(null);
            SoundManager.play('click');
        }
    };

    // User package statistics calculation
    const getStats = (pkgId: string, pkgTitle: string): UserPackageStats => {
        const attempts = history.filter(h => 
            h.packageId === pkgId || 
            (h.packageTitle && h.packageTitle.trim() === pkgTitle.trim())
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (attempts.length === 0) return { attempts: 0, highScore: 0, avgScore: 0, lastAttemptDate: "" };
        
        const scores = attempts.map(a => a.score);
        return {
            attempts: attempts.length,
            highScore: Math.max(...scores),
            avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            lastAttemptDate: attempts[0].date,
            attemptsDetails: attempts
        };
    };

    // Admin & Secure Action Handler
    const initiateAction = (type: 'GENERATE' | 'IMPORT' | 'DELETE' | 'DELETE_MULTIPLE' | 'FIX_DUPLICATES' | 'FIX_GAPS', payload?: any) => {
        SoundManager.play('click');
        setPendingAction({ type, payload });
        
        if (type === 'GENERATE' && category === 'UTBK') {
            setShowUtbkVariantModal(true);
            return;
        }

        if (type === 'GENERATE' && category === 'SKD') {
            setSkdMenuMode(skdSubtestFilter !== 'FULL' ? 'SUBTEST' : 'MAIN');
            setShowSkdVariantModal(true);
            return;
        }

        if (type === 'DELETE' || type === 'DELETE_MULTIPLE') {
            setShowConfirmModal(true);
        } else {
            if (isUserAdmin(userProfile)) {
                handleBypassAuth(type, payload);
                return;
            }
            setTokenInput('');
            setShowAuthModal(true);
        }
    };

    const handleBypassAuth = (overrideType?: string, overridePayload?: any) => {
        SoundManager.play('success');
        const typeTarget = overrideType || pendingAction?.type;
        const payloadTarget = overridePayload !== undefined ? overridePayload : pendingAction?.payload;

        if (typeTarget === 'GENERATE') {
            performGenerate();
        } else if (typeTarget === 'IMPORT') {
            fileInputRef.current?.click();
        } else if (typeTarget === 'DELETE') {
            performDelete(payloadTarget);
        } else if (typeTarget === 'DELETE_MULTIPLE') {
            if (onDeleteMultiplePackages && payloadTarget) {
                onDeleteMultiplePackages(payloadTarget);
                setSelectedIds(new Set());
                setIsSelectionMode(false);
            }
        } else if (typeTarget === 'FIX_DUPLICATES') {
            if (onFixDuplicates) onFixDuplicates();
        } else if (typeTarget === 'FIX_GAPS') {
            if (onFixGaps) onFixGaps();
        }
        setPendingAction(null);
    };

    const handleConfirmStep1 = () => {
        setShowConfirmModal(false);
        if (isUserAdmin(userProfile)) {
            handleBypassAuth();
            return;
        }
        setTokenInput('');
        setShowAuthModal(true);
    };

    const handleUtbkVariantSelect = (variant: 'ONLY_MC' | 'MIXED') => {
        SoundManager.play('click');
        setSelectedUtbkVariant(variant);
        setShowUtbkVariantModal(false);
        
        if (isUserAdmin(userProfile)) {
            setIsGenerating(true);
            onGenerateNew("verified_client", {
                utbkVariant: variant,
                skdVariant: undefined
            }).finally(() => setIsGenerating(false));
            setPendingAction(null);
        } else {
            setTokenInput('');
            setShowAuthModal(true);
        }
    };

    const handleSkdVariantSelect = (variant: 'FULL' | 'TWK' | 'TIU' | 'TKP') => {
        SoundManager.play('click');
        setSelectedSkdVariant(variant);
        setShowSkdVariantModal(false);

        if (isUserAdmin(userProfile)) {
            setIsGenerating(true);
            onGenerateNew("verified_client", {
                utbkVariant: undefined,
                skdVariant: variant
            }).finally(() => setIsGenerating(false));
            setPendingAction(null);
        } else {
            setTokenInput('');
            setShowAuthModal(true);
        }
    };

    const confirmAuth = async () => {
        if (!tokenInput) {
            showToast("Masukkan token akses!", "error");
            return;
        }

        const isValid = await verifyToken(tokenInput, ADMIN_TOKEN_HASH);

        if (isValid) {
            setShowAuthModal(false);
            SoundManager.play('success');
            
            if (pendingAction?.type === 'GENERATE') {
                performGenerate();
            } else if (pendingAction?.type === 'IMPORT') {
                fileInputRef.current?.click();
            } else if (pendingAction?.type === 'DELETE') {
                performDelete(pendingAction.payload);
            } else if (pendingAction?.type === 'DELETE_MULTIPLE') {
                if (onDeleteMultiplePackages && pendingAction.payload) {
                    onDeleteMultiplePackages(pendingAction.payload);
                    setSelectedIds(new Set());
                    setIsSelectionMode(false);
                }
            } else if (pendingAction?.type === 'FIX_DUPLICATES') {
                if (onFixDuplicates) onFixDuplicates();
            } else if (pendingAction?.type === 'FIX_GAPS') {
                if (onFixGaps) onFixGaps();
            }
        } else {
            SoundManager.play('error');
            showToast("Token salah! Akses ditolak.", "error");
        }
    };

    const performGenerate = async () => {
        setIsGenerating(true);
        try {
            await onGenerateNew("verified_client", {
                utbkVariant: category === 'UTBK' ? selectedUtbkVariant : undefined,
                skdVariant: category === 'SKD' ? selectedSkdVariant : undefined
            }); 
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    const performDelete = (pkgId: string) => {
        onDeletePackage(pkgId);
    };

    const handleDownloadPackage = (e: React.MouseEvent, pkg: StaticTestPackage) => {
        e.stopPropagation();
        const dataStr = JSON.stringify(pkg, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${pkg.title.replace(/\s+/g, '_')}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Paket Soal berhasil didownload", "success");
    };

    const handleManualRefresh = () => {
        SoundManager.play('tap');
        onRefresh();
    };

    // Filter and sort packages
    const usedPackageIds = useMemo(() => {
        const used = new Set<string>();
        availablePackages.forEach(p => {
            if (p.combinedSourceIds) {
                p.combinedSourceIds.forEach(id => used.add(id));
            }
        });
        return used;
    }, [availablePackages]);

    const filteredPackages = useMemo(() => {
        return availablePackages
            .filter(p => {
                if (p.category !== category) return false;
                
                // SKD Stream & View Mode
                if (category === 'SKD' && skdStream) {
                    if (p.skdStream !== skdStream) return false;
                    const isSubtest = p.id.includes('-twk-') || p.id.includes('-tiu-') || p.id.includes('-tkp-');
                    const isCombined = p.id.includes('combined');
                    
                    if (skdSubtestFilter === 'FULL' && (isSubtest || isCombined)) return false;
                    if (skdSubtestFilter === 'COMBINED' && !isCombined) return false;
                    if (skdSubtestFilter === 'TWK' && (!p.id.includes('-twk-') || isCombined)) return false;
                    if (skdSubtestFilter === 'TIU' && (!p.id.includes('-tiu-') || isCombined)) return false;
                    if (skdSubtestFilter === 'TKP' && (!p.id.includes('-tkp-') || isCombined)) return false;
                    
                    return true;
                }

                // TPA Stream
                if (category === 'TPA') {
                    if (tpaStream === 'PSIKOTEST_KEDINASAN') {
                        return p.tpaStream === 'PSIKOTEST_KEDINASAN' || (p.title && p.title.toLowerCase().includes('psikotes'));
                    } else {
                        return p.tpaStream === 'TPA_TBI' || (!p.tpaStream && !p.title.toLowerCase().includes('psikotes'));
                    }
                }

                // Pelajaran Level
                if (category === 'PELAJARAN' && tkaLevel) {
                    return p.tkaLevel === tkaLevel;
                }

                // TKA Level
                if (category === 'TKA' && tkaLevel) {
                    return p.tkaLevel === tkaLevel;
                }

                return true;
            })
            .filter(p => {
                // Search query filter
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const titleMatch = p.title.toLowerCase().includes(q);
                    const versionMatch = p.version?.toLowerCase().includes(q);
                    return titleMatch || versionMatch;
                }
                return true;
            })
            .filter(p => {
                const stats = getStats(p.id, p.title);
                const isBest = bestPackageIds.has(p.id) || p.isBestPackage;
                
                if (statusFilter === 'DONE') return stats.attempts > 0;
                if (statusFilter === 'NOT_DONE') return stats.attempts === 0;
                if (statusFilter === 'BEST') return isBest;
                return true;
            })
            .sort((a, b) => {
                const isBestA = bestPackageIds.has(a.id) || a.isBestPackage;
                const isBestB = bestPackageIds.has(b.id) || b.isBestPackage;

                if (sortBy === 'BEST_FIRST') {
                    if (isBestA && !isBestB) return -1;
                    if (!isBestA && isBestB) return 1;
                }

                if (sortBy === 'NEWEST') {
                    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
                }
                if (sortBy === 'OLDEST') {
                    return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
                }
                if (sortBy === 'TITLE') {
                    return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
                }

                // Default grouping: Combined first, then AI Generated, then title
                const isCombinedA = a.id.includes('combined');
                const isCombinedB = b.id.includes('combined');
                if (isCombinedA && !isCombinedB) return -1;
                if (!isCombinedA && isCombinedB) return 1;

                const isAiA = a.isAiGenerated;
                const isAiB = b.isAiGenerated;
                if (isAiA && !isAiB) return -1;
                if (!isAiA && isAiB) return 1;

                return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
            });
    }, [availablePackages, category, skdStream, tpaStream, tkaLevel, skdSubtestFilter, searchQuery, statusFilter, sortBy, bestPackageIds]);

    const toggleSelection = (id: string) => {
        const pkg = availablePackages.find(p => p.id === id);
        if (!pkg) return;

        const isCombinedPkg = pkg.id.includes('gen-combined-');
        
        if (selectedIds.has(id)) {
            const newSet = new Set(selectedIds);
            newSet.delete(id);
            setSelectedIds(newSet);
            return;
        }

        if (usedPackageIds.has(id)) {
            showToast("Paket ini sudah digabung dalam paket lain.", "error");
            return;
        }

        if (category === 'SKD') {
            if (isCombinedPkg) {
                showToast("Paket gabungan tidak dapat digabung lagi.", "error");
                return;
            }

            const currentSelected = availablePackages.filter(p => selectedIds.has(p.id));
            
            const isTwk = pkg.id.includes('-twk-');
            const isTiu = pkg.id.includes('-tiu-');
            const isTkp = pkg.id.includes('-tkp-');
            const isFull = !isTwk && !isTiu && !isTkp;

            if (isFull) {
                showToast("Pilih subtes (TWK/TIU/TKP) untuk digabung.", "error");
                return;
            }

            if (isTwk && currentSelected.some(p => p.id.includes('-twk-'))) {
                showToast("Hanya boleh satu paket TWK.", "error");
                return;
            }
            if (isTiu && currentSelected.some(p => p.id.includes('-tiu-'))) {
                showToast("Hanya boleh satu paket TIU.", "error");
                return;
            }
            if (isTkp && currentSelected.some(p => p.id.includes('-tkp-'))) {
                showToast("Hanya boleh satu paket TKP.", "error");
                return;
            }
        }

        const newSet = new Set(selectedIds);
        newSet.add(id);
        setSelectedIds(newSet);
    };

    const selectAll = () => {
        if (selectedIds.size === filteredPackages.length) {
            setSelectedIds(new Set());
        } else {
            const newSet = new Set(filteredPackages.map(p => p.id));
            setSelectedIds(newSet);
        }
    };

    // Duplicate detection
    const duplicateCount = useMemo(() => {
        const allTitles = new Map<string, number>();
        const mismatches = new Set<string>();

        filteredPackages.forEach(p => {
            allTitles.set(p.title, (allTitles.get(p.title) || 0) + 1);

            const titleUpper = p.title.toUpperCase();
            const idLower = p.id.toLowerCase();
            
            if (idLower.includes('-skd-')) {
                const isTwkId = idLower.includes('-twk-');
                const isTiuId = idLower.includes('-tiu-');
                const isTkpId = idLower.includes('-tkp-');
                const isFullId = idLower.includes('-full-');

                if (isTwkId && !titleUpper.includes('TWK')) mismatches.add(p.id);
                else if (isTiuId && !titleUpper.includes('TIU')) mismatches.add(p.id);
                else if (isTkpId && !titleUpper.includes('TKP')) mismatches.add(p.id);
                else if (isFullId && (titleUpper.includes('TWK') || titleUpper.includes('TIU') || titleUpper.includes('TKP'))) mismatches.add(p.id);
            }
        });

        let count = 0;
        allTitles.forEach(c => { if (c > 1) count += (c - 1); });
        return count + mismatches.size;
    }, [filteredPackages]);

    // Gap detection
    const gapCount = useMemo(() => {
        if (filteredPackages.length < 1) return 0;
        
        const buckets = new Map<string, StaticTestPackage[]>();
        filteredPackages.forEach(pkg => {
            if (pkg.id.includes('combined')) return;
            
            let subType = 'full';
            const idLower = pkg.id.toLowerCase();
            if (idLower.includes('-twk-')) subType = 'twk';
            else if (idLower.includes('-tiu-')) subType = 'tiu';
            else if (idLower.includes('-tkp-')) subType = 'tkp';

            const variant = idLower.includes('-only_mc-') ? 'only_mc' : idLower.includes('-mixed-') ? 'mixed' : 'default';
            
            const bucketKey = `${pkg.category}-${pkg.skdStream || ''}-${pkg.tpaStream || ''}-${pkg.tkaLevel || ''}-${subType}-${variant}`;
            if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
            buckets.get(bucketKey)!.push(pkg);
        });

        let totalGaps = 0;
        buckets.forEach((bucketPkgs) => {
            if (bucketPkgs.length < 1) return;
            
            const sorted = [...bucketPkgs].sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
            
            for(let i=0; i<sorted.length; i++) {
                const pkg = sorted[i];
                const match = pkg.title.match(/(\d+)$/);
                if (match) {
                    const currentNum = parseInt(match[1]);
                    if (currentNum !== i + 1) {
                        totalGaps++;
                        break;
                    }
                } else if (sorted.length > 1) {
                    totalGaps++;
                    break;
                }
            }
        });
        
        return totalGaps > 0 ? 1 : 0;
    }, [filteredPackages]);

    // Category summary statistics
    const categoryStats = useMemo(() => {
        let totalDone = 0;
        let highest = 0;
        let totalScoreSum = 0;
        let totalAttempts = 0;
        let bestCount = 0;

        filteredPackages.forEach(pkg => {
            const st = getStats(pkg.id, pkg.title);
            if (st.attempts > 0) {
                totalDone++;
                totalAttempts += st.attempts;
                if (st.highScore > highest) highest = st.highScore;
                totalScoreSum += st.avgScore;
            }
            if (bestPackageIds.has(pkg.id) || pkg.isBestPackage) {
                bestCount++;
            }
        });

        return {
            totalPackages: filteredPackages.length,
            totalDone,
            bestCount,
            highestScore: highest,
            avgOverall: totalDone > 0 ? Math.round(totalScoreSum / totalDone) : 0
        };
    }, [filteredPackages, history, bestPackageIds]);

    // Dynamic Header Title & Icon
    let headerTitle = `Simulasi ${category}`;
    let CategoryIcon = BookOpen;
    let badgeColor = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';

    if (category === 'SKD') {
        CategoryIcon = Award;
        headerTitle = skdStream === 'CPNS' ? 'SKD CPNS Umum' : 'SKD Sekolah Kedinasan';
        badgeColor = 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
    } else if (category === 'TPA') {
        CategoryIcon = Brain;
        headerTitle = tpaStream === 'PSIKOTEST_KEDINASAN' ? 'Psikotes Kedinasan (STAN)' : 'TPA & Bahasa Inggris (TBI)';
        badgeColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
    } else if (category === 'GENERAL' || category === 'PELAJARAN') {
        CategoryIcon = PenTool;
        headerTitle = tkaLevel ? `Materi Sekolah (${tkaLevel})` : 'Materi Pembelajaran';
        badgeColor = 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800';
    }

    const usernameDisplay = userProfile?.username || "Fadmus";
    const userInitial = usernameDisplay.charAt(0).toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 p-3 sm:p-6 md:p-8 flex flex-col items-center relative text-slate-800 dark:text-slate-100 transition-colors">
            
            {/* 1. CONFIRMATION MODAL (Step 1) */}
            <AnimatePresence>
                {showConfirmModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 text-center"
                        >
                            <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400 shadow-lg shadow-rose-500/10">
                                <AlertTriangle size={28} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">Konfirmasi Hapus Paket</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm leading-relaxed mb-6">
                                {pendingAction?.type === 'DELETE_MULTIPLE' 
                                    ? `Anda akan menghapus ${selectedIds.size} paket soal terpilih secara permanen.` 
                                    : 'Anda akan menghapus paket soal ini dari database.'}
                                <br/><span className="text-rose-500 font-semibold">Tindakan ini tidak dapat dibatalkan.</span>
                            </p>
                            <div className="flex gap-2.5">
                                <button 
                                    onClick={() => setShowConfirmModal(false)} 
                                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleConfirmStep1} 
                                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs sm:text-sm shadow-md shadow-rose-600/20 transition"
                                >
                                    Lanjut Hapus
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 2. ADMIN AUTH MODAL */}
            <AnimatePresence>
                {showAuthModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 text-center"
                        >
                            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/10">
                                <ShieldCheck size={28} />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">Verifikasi Otoritas Admin</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-5">
                                Fitur terlindungi. Silakan masukkan token akses sistem.
                            </p>
                            
                            <input 
                                type="password" 
                                placeholder="Masukkan Token Akses..." 
                                value={tokenInput}
                                onChange={(e) => setTokenInput(e.target.value)}
                                className="w-full p-3.5 border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 dark:text-white rounded-xl mb-4 focus:border-indigo-600 focus:ring-0 outline-none text-center font-bold tracking-widest text-sm"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && confirmAuth()}
                            />
                            
                            <div className="flex gap-2.5">
                                <button 
                                    onClick={() => setShowAuthModal(false)} 
                                    className="flex-1 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={confirmAuth} 
                                    className="flex-1 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-xs sm:text-sm font-bold hover:from-indigo-700 hover:to-violet-700 transition shadow-lg shadow-indigo-500/20"
                                >
                                    Verifikasi
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 3. UTBK VARIANT MODAL */}
            <AnimatePresence>
                {showUtbkVariantModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex flex-col items-center mb-5 text-center">
                                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-blue-500/10">
                                    <ListOrdered size={28} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">Format Simulasi UTBK</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Tentukan tipe susunan soal yang ingin di-generate oleh AI.
                                </p>
                            </div>
                            
                            <div className="space-y-3 mb-5">
                                <button 
                                    onClick={() => handleUtbkVariantSelect('ONLY_MC')}
                                    className="w-full p-4 border-2 border-slate-200/80 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 rounded-2xl flex items-center gap-3.5 text-left transition-all group bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                        <CheckSquare size={20} />
                                    </div>
                                    <div>
                                        <span className="block font-black text-sm text-slate-800 dark:text-white">Hanya Pilihan Ganda (A-E)</span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Standar ujian klasik single-choice 5 opsi.</span>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleUtbkVariantSelect('MIXED')}
                                    className="w-full p-4 border-2 border-slate-200/80 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 rounded-2xl flex items-center gap-3.5 text-left transition-all group bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800"
                                >
                                    <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                        <Sparkles size={20} />
                                    </div>
                                    <div>
                                        <span className="block font-black text-sm text-slate-800 dark:text-white">Format Mix SNBT Resmi</span>
                                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Isian Angka, Pilihan Majemuk & Pilihan Ganda.</span>
                                    </div>
                                </button>
                            </div>
                            
                            <button 
                                onClick={() => setShowUtbkVariantModal(false)} 
                                className="w-full py-2.5 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider hover:text-slate-800 dark:hover:text-white transition"
                            >
                                Batal
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* 4. SKD VARIANT MODAL */}
            <AnimatePresence>
                {showSkdVariantModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-800 relative"
                        >
                            {skdMenuMode === 'SUBTEST' && (
                                <button 
                                    onClick={() => setSkdMenuMode('MAIN')} 
                                    className="absolute top-5 left-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                >
                                    <ArrowLeft size={16} />
                                </button>
                            )}
                            <div className="flex flex-col items-center mb-5 text-center mt-1">
                                <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-amber-500/10">
                                    <Award size={28} />
                                </div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                    {skdMenuMode === 'MAIN' ? 'Generate Paket SKD' : 'Pilih Modul Subtes'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                    {skdMenuMode === 'MAIN' ? 'Tentukan jenis ujian yang ingin diramu AI.' : 'Pilih subtes spesifik untuk di-generate.'}
                                </p>
                            </div>
                            
                            <div className="space-y-2.5 mb-5">
                                {skdMenuMode === 'MAIN' ? (
                                    <>
                                        <button 
                                            onClick={() => handleSkdVariantSelect('FULL')}
                                            className="w-full p-4 border-2 border-slate-200/80 dark:border-slate-800 hover:border-amber-600 dark:hover:border-amber-500 rounded-2xl flex items-center gap-3.5 text-left transition-all group bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                                <ListOrdered size={20} />
                                            </div>
                                            <div>
                                                <span className="block font-black text-sm text-slate-800 dark:text-white">Full Tryout (110 Soal)</span>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Simulasi lengkap CAT BKN (100 Menit).</span>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => setSkdMenuMode('SUBTEST')}
                                            className="w-full p-4 border-2 border-slate-200/80 dark:border-slate-800 hover:border-indigo-600 dark:hover:border-indigo-500 rounded-2xl flex items-center gap-3.5 text-left transition-all group bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
                                                <Box size={20} />
                                            </div>
                                            <div>
                                                <span className="block font-black text-sm text-slate-800 dark:text-white">Subtes Terpisah</span>
                                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Latihan parsial khusus TWK, TIU, atau TKP.</span>
                                            </div>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button 
                                            onClick={() => handleSkdVariantSelect('TWK')}
                                            className="w-full p-3.5 border-2 border-slate-200/80 dark:border-slate-800 hover:border-rose-500 rounded-2xl flex items-center gap-3 text-left transition group bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                                <ShieldCheck size={18}/>
                                            </div>
                                            <div>
                                                <span className="block font-black text-xs sm:text-sm text-slate-800 dark:text-white">Spesial TWK (30 Soal)</span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Wawasan Kebangsaan, Nasionalisme, Integritas.</span>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => handleSkdVariantSelect('TIU')}
                                            className="w-full p-3.5 border-2 border-slate-200/80 dark:border-slate-800 hover:border-blue-500 rounded-2xl flex items-center gap-3 text-left transition group bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                <Brain size={18}/>
                                            </div>
                                            <div>
                                                <span className="block font-black text-xs sm:text-sm text-slate-800 dark:text-white">Spesial TIU (35 Soal)</span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Numerik, Penalaran Analitis & Figural HOTS.</span>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => handleSkdVariantSelect('TKP')}
                                            className="w-full p-3.5 border-2 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 rounded-2xl flex items-center gap-3 text-left transition group bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800"
                                        >
                                            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                <Award size={18}/>
                                            </div>
                                            <div>
                                                <span className="block font-black text-xs sm:text-sm text-slate-800 dark:text-white">Spesial TKP (45 Soal)</span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400">Karakteristik Pribadi & Profesionalisme Grey Area.</span>
                                            </div>
                                        </button>
                                    </>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => setShowSkdVariantModal(false)} 
                                className="w-full py-2 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider hover:text-slate-800 dark:hover:text-white transition"
                            >
                                Tutup
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* MAIN CONTENT WRAPPER */}
            <div className="max-w-[1600px] w-full space-y-5">
                
                {/* TOP NAVIGATION & ACTIONS BAR */}
                <div className="flex flex-wrap sm:flex-nowrap justify-between items-center gap-3">
                    <button 
                        onClick={onBack} 
                        className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-bold text-xs bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={16}/> 
                        <span>Kembali ke Beranda</span>
                    </button>

                    {/* Right Controls */}
                    <div className="flex items-center gap-2">
                        {/* Settings Button Shortcut */}
                        {onOpenSettings && (
                            <button
                                onClick={() => { SoundManager.play('tap'); onOpenSettings(); }}
                                className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm"
                                title="Buka Pengaturan"
                            >
                                <Settings size={18} />
                            </button>
                        )}

                        {/* Batch Selection Mode Toggle */}
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
                        >
                            <CheckSquare size={16} />
                            <span>{isSelectionMode ? 'Mode Pilih Aktif' : 'Pilih Paket'}</span>
                        </button>

                        {/* Refresh Button */}
                        <button 
                            onClick={handleManualRefresh} 
                            disabled={isLoading}
                            className="p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:border-indigo-300 transition shadow-sm disabled:opacity-50"
                            title="Refresh Paket Soal"
                        >
                            <RefreshCw size={18} className={isLoading ? "animate-spin text-indigo-600" : ""} />
                        </button>
                    </div>
                </div>

                {/* HERO OVERVIEW CARD (Matching SettingsModal Account Hero Card) */}
                <div className="p-4 sm:p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-500/5 via-violet-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
                    
                    <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 relative z-10">
                        {/* Title & Category Info */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                                <CategoryIcon size={28} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-lg border ${badgeColor}`}>
                                        {category}
                                    </span>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                        v{APP_VERSION}
                                    </span>
                                </div>
                                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                    {headerTitle}
                                </h1>
                                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                    Pilih simulasi tryout untuk menguji kesiapan, strategi waktu, dan evaluasi capaian skor.
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[90px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Paket</span>
                                <span className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-0.5">
                                    {categoryStats.totalPackages}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[90px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Selesai</span>
                                <span className="text-base sm:text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">
                                    {categoryStats.totalDone}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[90px]">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Skor Top</span>
                                <span className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {categoryStats.highestScore > 0 ? categoryStats.highestScore : '-'}
                                </span>
                            </div>
                            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 flex flex-col items-center justify-center min-w-[90px]">
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1">
                                    <Star size={10} className="fill-amber-500" /> Terbaik
                                </span>
                                <span className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                                    {categoryStats.bestCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BATCH SELECTION ACTION BAR (Sticky when active) */}
                <AnimatePresence>
                    {isSelectionMode && (
                        <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-indigo-600 text-white p-3.5 sm:p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 sticky top-3 z-30 shadow-xl shadow-indigo-600/20 border border-indigo-500"
                        >
                            <div className="flex items-center gap-3">
                                <button 
                                    onClick={selectAll} 
                                    className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    <CheckSquare size={14} />
                                    <span>{selectedIds.size === filteredPackages.length ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
                                </button>
                                <span className="text-xs sm:text-sm font-bold bg-white/20 px-2.5 py-1 rounded-xl">
                                    {selectedIds.size} Paket Terpilih
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {onCombinePackages && (
                                    <button 
                                        onClick={() => {
                                            SoundManager.play('click');
                                            setCombineTitle('');
                                            setShowCombineModal(true);
                                        }}
                                        disabled={selectedIds.size < 2}
                                        className="px-3.5 py-1.5 bg-white text-indigo-700 rounded-xl font-bold text-xs hover:bg-slate-100 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <Layers size={14}/> Gabungkan
                                    </button>
                                )}
                                <button 
                                    onClick={() => initiateAction('DELETE_MULTIPLE', Array.from(selectedIds))}
                                    disabled={selectedIds.size === 0}
                                    className="px-3.5 py-1.5 bg-rose-500 text-white rounded-xl font-bold text-xs hover:bg-rose-600 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Trash2 size={14}/> Hapus ({selectedIds.size})
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* DUPLICATE ALERT BANNER */}
                {duplicateCount > 0 && onFixDuplicates && (
                    <div className="bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
                                <AlertTriangle size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Terdeteksi Nama Paket Ganda</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                    Ditemukan {duplicateCount} judul berulang. Sistem dapat merapikan penamaan secara otomatis.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => initiateAction('FIX_DUPLICATES')}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-2 whitespace-nowrap self-end sm:self-center"
                        >
                            <PenTool size={14}/>
                            <span>Perbaiki Otomatis</span>
                        </button>
                    </div>
                )}

                {/* GAP ALERT BANNER */}
                {gapCount > 0 && onFixGaps && (
                    <div className="bg-blue-50/90 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-2xl text-blue-600 dark:text-blue-400 shrink-0">
                                <ListOrdered size={22} />
                            </div>
                            <div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Terdeteksi Lompatan Nomor Paket</h4>
                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                    Urutan penomoran paket soal tidak berurutan karena ada paket yang terhapus sebelumnya.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => initiateAction('FIX_GAPS')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition shadow-sm flex items-center gap-2 whitespace-nowrap self-end sm:self-center"
                        >
                            <RefreshCw size={14}/>
                            <span>Urutkan Ulang</span>
                        </button>
                    </div>
                )}

                {/* ADMIN ACTION TOOLBAR */}
                {isUserAdmin(userProfile) && (
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <Lock size={16}/>
                            </div>
                            <div>
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                                    Admin Control Panel
                                    {(gapCount > 0 || duplicateCount > 0) && (
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                                        </span>
                                    )}
                                </h3>
                                <p className="text-[11px] text-slate-400 dark:text-slate-500">Akses khusus pengelolaan dan pembuatan soal AI</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button 
                                onClick={() => initiateAction('GENERATE')} 
                                disabled={isGenerating} 
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 py-2 rounded-xl font-black text-xs uppercase tracking-tight hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 transition shadow-md shadow-indigo-500/20"
                            >
                                {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <Zap size={14} className="fill-white"/>}
                                <span>Generate AI</span>
                            </button>

                            <button 
                                onClick={() => initiateAction('IMPORT')} 
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-tight hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                            >
                                <UploadIcon size={14}/>
                                <span>Import JSON</span>
                            </button>
                        </div>

                        {/* Hidden File Input */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept=".json" 
                            multiple
                            onChange={(e) => {
                                if(e.target.files && e.target.files.length > 0) {
                                    onImportPackage(e.target.files);
                                }
                                if(fileInputRef.current) fileInputRef.current.value = '';
                            }}
                        />
                    </div>
                )}

                {/* SEARCH & FILTERS CONTROLS */}
                <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
                        {/* Search Input */}
                        <div className="relative flex-1">
                            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari judul paket, nomor, atau versi..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium outline-none focus:border-indigo-500 dark:focus:border-indigo-500 transition"
                            />
                            {searchQuery && (
                                <button 
                                    onClick={() => setSearchQuery('')} 
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {/* Dropdown Filters */}
                        <div className="flex flex-wrap items-center gap-2">
                            {category === 'SKD' && (
                                <select
                                    value={skdSubtestFilter}
                                    onChange={(e) => {
                                        SoundManager.play('click');
                                        setSkdSubtestFilter(e.target.value as any);
                                    }}
                                    className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                >
                                    <option value="SEMUA">Semua Jenis Subtes</option>
                                    <option value="FULL">Hanya Simulasi Full (110s)</option>
                                    <option value="COMBINED">Hanya Paket Gabungan</option>
                                    <option value="TWK">Hanya Modul TWK</option>
                                    <option value="TIU">Hanya Modul TIU</option>
                                    <option value="TKP">Hanya Modul TKP</option>
                                </select>
                            )}

                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    SoundManager.play('click');
                                    setStatusFilter(e.target.value as any);
                                }}
                                className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="ALL">Status: Semua</option>
                                <option value="BEST">⭐ Hanya Paket Terbaik</option>
                                <option value="NOT_DONE">Belum Dikerjakan</option>
                                <option value="DONE">Sudah Dikerjakan</option>
                            </select>

                            <select
                                value={sortBy}
                                onChange={(e) => {
                                    SoundManager.play('click');
                                    setSortBy(e.target.value as any);
                                }}
                                className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-3 py-2 text-xs font-bold shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            >
                                <option value="BEST_FIRST">Urut: Paket Terbaik Dulu</option>
                                <option value="NEWEST">Urut: Terbaru</option>
                                <option value="OLDEST">Urut: Terlama</option>
                                <option value="TITLE">Urut: Judul (A-Z)</option>
                            </select>
                        </div>
                    </div>

                    {/* Quick Filter Chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                            <Filter size={12} /> Filter Cepat:
                        </span>
                        
                        <button
                            onClick={() => {
                                SoundManager.play('tap');
                                setStatusFilter(statusFilter === 'BEST' ? 'ALL' : 'BEST');
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                                statusFilter === 'BEST'
                                    ? 'bg-amber-500 text-white shadow-sm shadow-amber-500/30'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            <Star size={12} className={statusFilter === 'BEST' ? 'fill-white' : 'text-amber-500 fill-amber-500'} />
                            <span>Paket Terbaik ({categoryStats.bestCount})</span>
                        </button>

                        <button
                            onClick={() => {
                                SoundManager.play('tap');
                                setStatusFilter(statusFilter === 'NOT_DONE' ? 'ALL' : 'NOT_DONE');
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                                statusFilter === 'NOT_DONE'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Belum Dikerjakan ({categoryStats.totalPackages - categoryStats.totalDone})
                        </button>

                        <button
                            onClick={() => {
                                SoundManager.play('tap');
                                setStatusFilter(statusFilter === 'DONE' ? 'ALL' : 'DONE');
                            }}
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition ${
                                statusFilter === 'DONE'
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                            }`}
                        >
                            Sudah Selesai ({categoryStats.totalDone})
                        </button>
                    </div>
                </div>

                {/* ACTIVE GENERATION TASK BANNER (Inline Card) */}
                {activeGenTask && 
                 activeGenTask.category === category && 
                 (category !== 'SKD' || activeGenTask.skdStream === skdStream) &&
                 (category !== 'TPA' || activeGenTask.tpaStream === tpaStream) &&
                 (category !== 'PELAJARAN' || activeGenTask.tkaLevel === tkaLevel) && 
                 (category !== 'TKA' || activeGenTask.tkaLevel === tkaLevel) && 
                 activeGenTask.status === 'generating' && (
                    <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white p-5 rounded-3xl shadow-xl shadow-indigo-500/20 relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-4 animate-pulse">
                        <div className="flex items-center gap-3.5">
                            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl">
                                <Loader2 size={24} className="animate-spin text-white"/>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-md">AI Meramu Soal</span>
                                    <span className="text-xs font-bold text-white/80">{activeGenTask.progress}% Selesai</span>
                                </div>
                                <h4 className="text-base font-black text-white mt-0.5">{activeGenTask.title}</h4>
                                <p className="text-xs text-white/80">{activeGenTask.message || "Sedang memproses bank soal berkualitas tinggi..."}</p>
                            </div>
                        </div>

                        <div className="w-full sm:w-48 bg-white/20 h-2.5 rounded-full overflow-hidden shrink-0">
                            <div className="h-full bg-white transition-all duration-500 ease-out" style={{ width: `${activeGenTask.progress}%` }}></div>
                        </div>
                    </div>
                )}

                {/* PACKAGE GRID LIST */}
                {isLoading && filteredPackages.length === 0 ? (
                    <div className="py-24 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800">
                        <Loader2 className="animate-spin mx-auto mb-3 text-indigo-600" size={32} />
                        <p className="font-bold text-slate-800 dark:text-white">Memuat paket soal...</p>
                        <p className="text-xs text-slate-400 mt-1">Mengambil data simulasi terbaru dari server.</p>
                    </div>
                ) : filteredPackages.length === 0 ? (
                    <div className="py-20 text-center text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6">
                        <FileText className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={48}/>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">Tidak ada paket soal yang cocok</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                            Coba sesuaikan kata kunci pencarian atau ubah filter status yang aktif.
                        </p>
                        {isUserAdmin(userProfile) && (
                            <button 
                                onClick={() => initiateAction('GENERATE')}
                                className="mt-4 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition"
                            >
                                Buat Paket Baru dengan AI
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 pb-24">
                        {filteredPackages.map(pkg => {
                            const stats = getStats(pkg.id, pkg.title);
                            const isCombined = pkg.id.includes('combined');
                            const isBest = bestPackageIds.has(pkg.id) || pkg.isBestPackage;

                            const IconCmp = pkg.id.includes('-twk-') ? ShieldCheck : 
                                            pkg.id.includes('-tiu-') ? Brain : 
                                            pkg.id.includes('-tkp-') ? Award : 
                                            isCombined ? Layers : 
                                            pkg.isAiGenerated ? Zap : Box;
                            
                            const iconColor = pkg.id.includes('-twk-') ? 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' : 
                                              pkg.id.includes('-tiu-') ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' : 
                                              pkg.id.includes('-tkp-') ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' : 
                                              isCombined ? 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' : 
                                              pkg.isAiGenerated ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40' : 
                                              'text-slate-600 bg-slate-100 dark:bg-slate-800';

                            return (
                                <div 
                                    key={pkg.id} 
                                    onClick={() => {
                                        if (isSelectionMode) toggleSelection(pkg.id);
                                    }}
                                    className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all duration-300 text-left group relative overflow-hidden flex flex-col justify-between p-5 ${
                                        selectedIds.has(pkg.id) 
                                            ? 'border-indigo-600 ring-4 ring-indigo-500/10 bg-indigo-50/20 dark:bg-indigo-900/10 shadow-xl z-10' 
                                            : isBest
                                                ? 'border-amber-300/80 dark:border-amber-600/40 shadow-md hover:shadow-xl hover:border-amber-400 hover:-translate-y-1'
                                                : 'border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-xl hover:-translate-y-1'
                                    }`}
                                >
                                    {/* Selection Checkbox (Active in Selection Mode) */}
                                    {isSelectionMode && (
                                        <div className="absolute top-4 left-4 z-20">
                                            <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                                                selectedIds.has(pkg.id) 
                                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600'
                                            }`}>
                                                {selectedIds.has(pkg.id) && <CheckSquare size={12} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    )}

                                    {/* Top Right Badges & Actions */}
                                    <div className="flex items-center justify-between gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            {/* Star / Best Package Toggle Button */}
                                            <button
                                                onClick={(e) => toggleBestPackage(pkg.id, e)}
                                                className={`p-1.5 rounded-xl transition-all ${
                                                    isBest
                                                        ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-500 dark:text-amber-300 shadow-sm'
                                                        : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                                                }`}
                                                title={isBest ? "Paket Terbaik (Klik untuk lepas)" : "Tandai sebagai Paket Terbaik"}
                                            >
                                                <Star size={16} className={isBest ? "fill-amber-400 text-amber-500" : ""} />
                                            </button>

                                            {isBest && (
                                                <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[8px] sm:text-[9px] px-2 py-0.5 rounded-lg shadow-sm shadow-amber-500/20 flex items-center gap-1 uppercase tracking-tight">
                                                    ★ TERBAIK
                                                </span>
                                            )}

                                            {usedPackageIds.has(pkg.id) && (
                                                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tight border border-amber-200 dark:border-amber-800/60">
                                                    GABUNGAN
                                                </span>
                                            )}

                                            {pkg.isAiGenerated && !isCombined && (
                                                <span className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tight border border-indigo-200 dark:border-indigo-800/60">
                                                    AI
                                                </span>
                                            )}

                                            {isCombined && (
                                                <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8px] font-black px-2 py-0.5 rounded-lg uppercase tracking-tight border border-purple-200 dark:border-purple-800/60">
                                                    MIX
                                                </span>
                                            )}
                                        </div>

                                        {/* Admin Action Menu on Card */}
                                        {!isSelectionMode && isUserAdmin(userProfile) && (
                                            <div className="flex items-center gap-1">
                                                {onAdminViewPackage && (
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); onAdminViewPackage(pkg); }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl transition"
                                                        title="Lihat Preview Soal"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={(e) => handleDownloadPackage(e, pkg)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition"
                                                    title="Unduh File JSON"
                                                >
                                                    <Download size={14} />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); initiateAction('DELETE', pkg.id); }}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                                                    title="Hapus Paket"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Header & Title */}
                                    <div className={`flex items-start gap-3 mb-3 ${isSelectionMode ? 'pl-6' : ''}`}>
                                        <div className={`p-2.5 rounded-2xl shrink-0 shadow-sm ${iconColor}`}>
                                            <IconCmp size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-white leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                                {pkg.title}
                                            </h4>
                                            
                                            {/* Meta tags: Duration & Question Count & Version */}
                                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold border border-slate-200/60 dark:border-slate-700/60">
                                                    <Clock size={11} className="text-indigo-500" />
                                                    {pkg.durationMinutes}m
                                                </span>
                                                <span className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-bold border border-slate-200/60 dark:border-slate-700/60">
                                                    <FileText size={11} className="text-violet-500" />
                                                    {pkg.questions.length} Soal
                                                </span>

                                                {/* Version Badges */}
                                                {pkg.version === 'v1' && <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Zap size={10} /> V1</span>}
                                                {pkg.version === 'v2' && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Box size={10} /> V2</span>}
                                                {pkg.version === 'v3' && <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Hexagon size={10} /> V3</span>}
                                                {pkg.version === 'v4' && <span className="px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Cpu size={10} /> V4</span>}
                                                {pkg.version === 'v5' && <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Activity size={10} /> V5</span>}
                                                {pkg.version === 'v6' && <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[9px] font-black uppercase flex items-center gap-1"><Layers size={10} /> V6</span>}
                                                {pkg.version === 'v7' && <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-lg text-[9px] font-black uppercase shadow-sm flex items-center gap-1"><Flame size={10} /> V7</span>}
                                                {(pkg.version === 'v8' || (!pkg.version && pkg.isAiGenerated)) && <span className="px-2 py-0.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-lg text-[9px] font-black uppercase shadow-sm flex items-center gap-1"><Sparkles size={10} /> V8</span>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Performance Stats Strip */}
                                    <div className="mt-auto space-y-3 pt-2">
                                        <div className="grid grid-cols-3 gap-2 bg-slate-50/80 dark:bg-slate-800/50 p-2 rounded-2xl border border-slate-100 dark:border-slate-800">
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Percobaan</span>
                                                <span className="text-xs font-black text-slate-700 dark:text-white mt-0.5">{stats.attempts}x</span>
                                            </div>
                                            <div className="flex flex-col items-center border-x border-slate-200/60 dark:border-slate-700/60">
                                                <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-wider">Skor Top</span>
                                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.highScore > 0 ? stats.highScore : '-'}</span>
                                            </div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[8px] font-bold text-indigo-500 uppercase tracking-wider">Rata-rata</span>
                                                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{stats.avgScore > 0 ? stats.avgScore : '-'}</span>
                                            </div>
                                        </div>

                                        {/* Action Button & History Toggle */}
                                        {!isSelectionMode && (
                                            <div className="flex flex-col gap-2">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => {
                                                            SoundManager.play('click');
                                                            setPendingPackage(pkg);
                                                        }}
                                                        className={`flex-1 py-2.5 rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-md ${
                                                            stats.attempts > 0
                                                                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20'
                                                                : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/25'
                                                        }`}
                                                    >
                                                        <span>{stats.attempts > 0 ? 'KERJAKAN ULANG' : 'KERJAKAN SEKARANG'}</span>
                                                        <Zap size={12} className="fill-white" />
                                                    </button>
                                                    
                                                    {stats.attempts > 0 && (
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                SoundManager.play('tap');
                                                                setExpandedPackageId(expandedPackageId === pkg.id ? null : pkg.id);
                                                            }}
                                                            className="px-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-2xl flex items-center justify-center transition"
                                                            title="Riwayat Percobaan"
                                                        >
                                                            <ChevronDown size={14} className={`transition-transform duration-300 ${expandedPackageId === pkg.id ? 'rotate-180' : ''}`} />
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Expanded Attempt History */}
                                                <AnimatePresence>
                                                    {expandedPackageId === pkg.id && stats.attemptsDetails && (
                                                        <motion.div
                                                            initial={{ height: 0, opacity: 0 }}
                                                            animate={{ height: 'auto', opacity: 1 }}
                                                            exit={{ height: 0, opacity: 0 }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-1.5 max-h-36 overflow-y-auto">
                                                                {stats.attemptsDetails.map((attempt, idx) => (
                                                                    <div key={idx} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-200/40 dark:border-slate-800 last:border-0">
                                                                        <span className="text-slate-500 dark:text-slate-400 font-medium">Sesi #{stats.attempts - idx}</span>
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="font-mono text-slate-400 text-[9px]">
                                                                                {new Date(attempt.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                                            </span>
                                                                            <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md">
                                                                                {attempt.score} Poin
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* COMBINE PACKAGES MODAL */}
            <AnimatePresence>
                {showCombineModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-800 p-6"
                        >
                            <div className="w-14 h-14 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-purple-500/10">
                                <Layers size={28} />
                            </div>
                            <h3 className="text-base sm:text-lg font-black text-slate-800 dark:text-white text-center mb-1">Gabungkan Subtes Paket</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 text-center mb-5">
                                Masukkan judul untuk paket simulasi gabungan baru ({selectedIds.size} subtes terpilih).
                            </p>
                            
                            <input 
                                type="text" 
                                value={combineTitle}
                                onChange={(e) => setCombineTitle(e.target.value)}
                                placeholder={`Simulasi Lengkap (${selectedIds.size} Subtes)`}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm mb-5 outline-none focus:border-indigo-500 transition"
                            />

                            <div className="flex gap-2.5">
                                <button 
                                    onClick={() => setShowCombineModal(false)}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 transition"
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={() => {
                                        if (onCombinePackages) {
                                            onCombinePackages(Array.from(selectedIds), combineTitle);
                                        }
                                        setShowCombineModal(false);
                                        setIsSelectionMode(false);
                                        setSelectedIds(new Set());
                                    }}
                                    className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md shadow-indigo-500/20"
                                >
                                    Gabungkan
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* START OPTION MODAL (Normal vs Random order) */}
            <AnimatePresence>
                {pendingPackage && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 10 }}
                            className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative overflow-hidden"
                        >
                            <button 
                                onClick={() => setPendingPackage(null)} 
                                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1"
                            >
                                <X size={20} />
                            </button>

                            <div className="text-center mb-6">
                                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10">
                                    <Zap size={28} />
                                </div>
                                <h2 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Konfigurasi Sesi Ujian</h2>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 px-2">
                                    Pilih mode urutan soal untuk <span className="text-indigo-600 dark:text-indigo-400 font-bold">"{pendingPackage.title}"</span>
                                </p>
                            </div>

                            <div className="space-y-3">
                                <button 
                                    onClick={() => handleStartWithOption(false)}
                                    className="w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 transition-all group active:scale-95 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800"
                                >
                                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                        <ListOrdered size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-black text-slate-800 dark:text-white">Urutan Nomor Asli</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Sesuai format kisi-kisi resmi</div>
                                    </div>
                                </button>

                                <button 
                                    onClick={() => handleStartWithOption(true)}
                                    className="w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 border-slate-200/80 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group active:scale-95 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800"
                                >
                                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform shrink-0">
                                        <RefreshCw size={20} />
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-black text-slate-800 dark:text-white">Urutan Soal Diacak</div>
                                        <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Shuffle untuk melatih adaptasi</div>
                                    </div>
                                </button>
                            </div>

                            <button 
                                onClick={() => setPendingPackage(null)} 
                                className="w-full mt-5 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-widest transition"
                            >
                                Batal
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};
