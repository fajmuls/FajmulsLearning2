
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ArrowLeft, Upload as UploadIcon, Zap, Lock, Loader2, Download, Trash2, Clock, FileText, Plus, ShieldCheck, RefreshCw, Box, AlertTriangle, PenTool, ListOrdered, Calendar, CheckSquare, Square, Type } from 'lucide-react';
import { CategoryType, SkdStreamType, StaticTestPackage, TestHistoryItem, UserPackageStats, TpaStreamType, TkaLevelType, BackgroundGenTask, UserProfile } from '../types';
import { SoundManager } from '../services/soundService';
import { ADMIN_TOKEN_HASH } from '../constants';
import { verifyToken } from '../src/utils/security';
import { isUserAdmin } from '../services/firebase';

interface TOSelectionProps {
    category: CategoryType;
    skdStream?: SkdStreamType;
    tpaStream?: TpaStreamType;
    tkaLevel?: TkaLevelType;
    availablePackages: StaticTestPackage[];
    history: TestHistoryItem[];
    userProfile?: UserProfile | null;
    onSelectPackage: (pkg: StaticTestPackage) => void;
    onGenerateNew: (token: string, options?: { utbkVariant?: 'ONLY_MC' | 'MIXED', skdVariant?: 'FULL' | 'TWK' | 'TIU' | 'TKP' }) => Promise<void>;
    onImportPackage: (files: FileList) => void;
    onDeletePackage: (id: string) => void;
    onDeleteMultiplePackages?: (ids: string[]) => void;
    onFixDuplicates?: () => Promise<void>; 
    onFixGaps?: () => Promise<void>; // New prop for Gap Fixing
    onBack: () => void;
    showToast: (msg: string, type: 'success' | 'error') => void;
    confirmEnabled: boolean;
    onRefresh: () => void;
    isLoading: boolean;
    activeGenTask?: BackgroundGenTask | null;
}

// Simple Token Verification (Direct String)
// const TARGET_TOKEN = "Fajmuls22"; // REMOVED FOR SECURITY

export const TOSelectionScreen: React.FC<TOSelectionProps> = ({ 
    category, skdStream, tpaStream, tkaLevel, availablePackages, history, userProfile,
    onSelectPackage, onGenerateNew, onImportPackage, onDeletePackage, onDeleteMultiplePackages, onFixDuplicates, onFixGaps, onBack, showToast, confirmEnabled,
    onRefresh, isLoading, activeGenTask
}) => {
    
    // Trigger refresh on mount (load when menu opens)
    useEffect(() => {
        onRefresh();
    }, []);

    // Selection State
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Auth State
    const [tokenInput, setTokenInput] = useState('');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [pendingAction, setPendingAction] = useState<{ type: 'GENERATE' | 'IMPORT' | 'DELETE' | 'DELETE_MULTIPLE' | 'FIX_DUPLICATES' | 'FIX_GAPS', payload?: any } | null>(null);

    const [isGenerating, setIsGenerating] = useState(false);
    const [showUtbkVariantModal, setShowUtbkVariantModal] = useState(false);
    const [selectedUtbkVariant, setSelectedUtbkVariant] = useState<'ONLY_MC' | 'MIXED'>('ONLY_MC');
    const [showSkdVariantModal, setShowSkdVariantModal] = useState(false);
    const [skdMenuMode, setSkdMenuMode] = useState<'MAIN' | 'SUBTEST'>('MAIN');
    const [selectedSkdVariant, setSelectedSkdVariant] = useState<'FULL' | 'TWK' | 'TIU' | 'TKP'>('FULL');
    const [skdViewMode, setSkdViewMode] = useState<'FULL' | 'SUBTEST'>('FULL');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // FIX: Updated logic to check both ID and Title
    const getStats = (pkgId: string, pkgTitle: string): UserPackageStats => {
        const attempts = history.filter(h => 
            h.packageId === pkgId || 
            (h.packageTitle && h.packageTitle.trim() === pkgTitle.trim())
        );

        if (attempts.length === 0) return { attempts: 0, highScore: 0, avgScore: 0, lastAttemptDate: "" };
        
        const scores = attempts.map(a => a.score);
        return {
            attempts: attempts.length,
            highScore: Math.max(...scores),
            avgScore: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
            lastAttemptDate: attempts[0].date
        };
    };

    // --- SECURE ACTION HANDLERS ---

    const initiateAction = (type: 'GENERATE' | 'IMPORT' | 'DELETE' | 'DELETE_MULTIPLE' | 'FIX_DUPLICATES' | 'FIX_GAPS', payload?: any) => {
        SoundManager.play('click');
        setPendingAction({ type, payload });
        
        if (type === 'GENERATE' && category === 'UTBK') {
            setShowUtbkVariantModal(true);
            return;
        }

        if (type === 'GENERATE' && category === 'SKD') {
            setSkdMenuMode(skdViewMode === 'SUBTEST' ? 'SUBTEST' : 'MAIN');
            setShowSkdVariantModal(true);
            return;
        }

        // For DELETE actions, show confirmation first (Step 1)
        if (type === 'DELETE' || type === 'DELETE_MULTIPLE') {
            setShowConfirmModal(true);
        } else {
            // Admin Skip Token for ALL actions (including GENERATE)
            if (isUserAdmin(userProfile)) {
                handleBypassAuth(type, payload);
                return;
            }

            // For others, go straight to Auth (Step 2)
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
        setShowAuthModal(true); // Proceed to Step 2 (Token)
    };

    const handleUtbkVariantSelect = (variant: 'ONLY_MC' | 'MIXED') => {
        SoundManager.play('click');
        setSelectedUtbkVariant(variant);
        setShowUtbkVariantModal(false);
        
        if (isUserAdmin(userProfile)) {
            // Updated to handle sync state requirement or direct call
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
            // Updated to handle sync state requirement or direct call
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
            
            // Execute Pending Action
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
        SoundManager.play('click');
        onRefresh();
    };

    // Filter dan Sortir Paket
    const filteredPackages = availablePackages
        .filter(p => {
            if (p.category !== category) return false;
            
            // Filter SKD Stream & View Mode
            if (category === 'SKD' && skdStream) {
                if (p.skdStream !== skdStream) return false;
                const isSubtest = p.id.includes('-twk-') || p.id.includes('-tiu-') || p.id.includes('-tkp-');
                if (skdViewMode === 'FULL' && isSubtest) return false;
                if (skdViewMode === 'SUBTEST' && !isSubtest) return false;
                return true;
            }

            // Filter TPA Stream (Strict Separation)
            if (category === 'TPA') {
                if (tpaStream === 'PSIKOTEST_KEDINASAN') {
                    // Only show packages explicitly marked as PSIKOTEST_KEDINASAN or having legacy title match
                    return p.tpaStream === 'PSIKOTEST_KEDINASAN' || (p.title && p.title.toLowerCase().includes('psikotes'));
                } else {
                    // Default TPA_TBI
                    // Show if tpaStream is TPA_TBI OR if it's undefined (legacy) AND title doesn't say Psikotes
                    return p.tpaStream === 'TPA_TBI' || (!p.tpaStream && !p.title.toLowerCase().includes('psikotes'));
                }
            }

            // Filter TKA Level
            if (category === 'TKA' && tkaLevel) {
                return p.tkaLevel === tkaLevel;
            }

            return true;
        })
        .sort((a, b) => a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' }));

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
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

    // Detect Duplicates & Mismatches (Bucket-Aware)
    const duplicateCount = useMemo(() => {
        const allTitles = new Map<string, number>();
        const mismatches = new Set<string>();

        filteredPackages.forEach(p => {
            // Count total occurrences of this title to find duplicates regardless of original ID bucket
            allTitles.set(p.title, (allTitles.get(p.title) || 0) + 1);

            // Prefix check to detect "broken" names based on internal type
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

    // Detect Gaps in Numbering (Bucket-Aware)
    const gapCount = useMemo(() => {
        if (filteredPackages.length < 1) return 0;
        
        const buckets = new Map<string, StaticTestPackage[]>();
        filteredPackages.forEach(pkg => {
            // Precise bucketing based on properties + variant logic
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
            
            // Sort by CreatedAt within the bucket
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
                    // If multiple items exist but some don't have numbers at end, it's a gap/mess
                    totalGaps++;
                    break;
                }
            }
        });
        
        return totalGaps > 0 ? 1 : 0;
    }, [filteredPackages]);

    // Dynamic Header Title
    let headerTitle = `Pilih Paket Soal ${category}`;
    if (category === 'SKD' && skdStream) headerTitle = `Paket Soal SKD ${skdStream === 'CPNS' ? 'CPNS Umum' : 'Kedinasan'}`;
    if (category === 'TPA' && tpaStream === 'PSIKOTEST_KEDINASAN') headerTitle = `Paket Psikotes Kedinasan (STAN)`;
    if (category === 'TPA' && tpaStream === 'TPA_TBI') headerTitle = `Paket Soal TPA & TBI`;
    if (category === 'TKA' && tkaLevel) headerTitle = `Paket Soal TKA ${tkaLevel}`;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-3 sm:p-6 flex flex-col items-center relative">
            
            {/* CONFIRMATION MODAL (Step 1) */}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4 text-rose-600 dark:text-rose-400">
                                <AlertTriangle size={24}/>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Konfirmasi Hapus</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                                {pendingAction?.type === 'DELETE_MULTIPLE' 
                                    ? `Anda akan menghapus ${selectedIds.size} paket soal terpilih.` 
                                    : 'Anda akan menghapus paket soal ini.'}
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

            {/* AUTH MODAL */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-2xl max-w-[280px] sm:max-w-[320px] w-full border border-slate-200 dark:border-slate-700">
                        <div className="flex flex-col items-center mb-3 sm:mb-4">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-2 sm:mb-3">
                                <ShieldCheck size={20} className="w-5 h-5 sm:w-6 sm:h-6"/>
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">Verifikasi Admin</h3>
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-center mt-0.5 sm:mt-1">
                                Fitur dilindungi. Masukkan token.
                            </p>
                        </div>
                        
                        <input 
                            type="text" 
                            placeholder="Token Akses..." 
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            className="w-full p-2.5 sm:p-3 border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg sm:rounded-xl mb-3 sm:mb-4 focus:border-indigo-600 focus:ring-0 outline-none text-center font-bold tracking-widest text-[11px] sm:text-sm"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && confirmAuth()}
                        />
                        
                        <div className="flex gap-2">
                            <button onClick={() => setShowAuthModal(false)} className="flex-1 py-2 sm:py-2.5 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition">
                                Batal
                            </button>
                            <button onClick={confirmAuth} className="flex-1 py-2 sm:py-2.5 bg-indigo-600 text-white rounded-lg sm:rounded-xl text-[11px] sm:text-sm font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 dark:shadow-none">
                                Verifikasi
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* UTBK VARIANT MODAL */}
            {showUtbkVariantModal && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
                        <div className="flex flex-col items-center mb-4 text-center">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-2">
                                <ListOrdered size={24}/>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Pilih Format UTBK</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Tentukan format soal.
                            </p>
                        </div>
                        
                        <div className="grid gap-2 mb-4">
                            <button 
                                onClick={() => handleUtbkVariantSelect('ONLY_MC')}
                                className="p-3 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-500 rounded-xl flex items-center gap-3 text-left transition group"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition shrink-0">
                                    <CheckSquare size={16}/>
                                </div>
                                <div>
                                    <span className="block font-bold text-sm text-slate-800 dark:text-white">Hanya ABCDE</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Format standard Pilihan Ganda (Single Choice).</span>
                                </div>
                            </button>

                            <button 
                                onClick={() => handleUtbkVariantSelect('MIXED')}
                                className="p-3 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-500 rounded-xl flex items-center gap-3 text-left transition group"
                            >
                                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition shrink-0">
                                    <Zap size={16}/>
                                </div>
                                <div>
                                    <span className="block font-bold text-sm text-slate-800 dark:text-white">Format Mix (Campur)</span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Isian Singkat, Pilihan Ganda, Benar/Salah.</span>
                                </div>
                            </button>
                        </div>
                        
                        <button onClick={() => setShowUtbkVariantModal(false)} className="w-full py-2.5 text-slate-500 dark:text-slate-400 text-sm font-bold hover:text-slate-800 transition">
                            Batal
                        </button>
                    </div>
                </div>
            )}

            {/* SKD VARIANT MODAL */}
            {showSkdVariantModal && (
                <div className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl sm:rounded-2xl shadow-2xl max-w-[280px] sm:max-w-sm w-full border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto relative">
                        {skdMenuMode === 'SUBTEST' && (
                            <button onClick={() => setSkdMenuMode('MAIN')} className="absolute top-4 left-4 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                                <ArrowLeft size={16} />
                            </button>
                        )}
                        <div className="flex flex-col items-center mb-3 sm:mb-4 text-center mt-2 sm:mt-0">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mb-2">
                                <ListOrdered size={20} className="sm:w-6 sm:h-6" />
                            </div>
                            <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-white mb-0.5 sm:mb-1">Format Paket SKD</h2>
                            <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">Tentukan format yang ingin di-generate.</p>
                        </div>
                        
                        <div className="space-y-2 mb-3 sm:mb-4">
                            {skdMenuMode === 'MAIN' ? (
                                <>
                                    <button 
                                        onClick={() => handleSkdVariantSelect('FULL')}
                                        className="w-full p-2.5 sm:p-3 border-2 border-slate-200 dark:border-slate-700 hover:border-amber-600 dark:hover:border-amber-500 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 text-left transition group"
                                    >
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 group-hover:text-amber-600 transition shrink-0">
                                            <ListOrdered size={14} className="sm:w-4 sm:h-4"/>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Full Tryout (110 Soal)</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">Simulasi lengkap 100 menit.</span>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => setSkdMenuMode('SUBTEST')}
                                        className="w-full p-2.5 sm:p-3 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-600 dark:hover:border-indigo-500 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 text-left transition group"
                                    >
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600 transition shrink-0">
                                            <Box size={14} className="sm:w-4 sm:h-4"/>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Subtes Tryout</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400">Generate per bagian (TWK/TIU/TKP).</span>
                                        </div>
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => handleSkdVariantSelect('TWK')}
                                        className="w-full p-2.5 sm:p-3 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 text-left transition group"
                                    >
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition shrink-0">
                                            <Box size={14} className="sm:w-4 sm:h-4"/>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Spesial TWK (30 Soal)</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Wawasan Kebangsaan.</span>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => handleSkdVariantSelect('TIU')}
                                        className="w-full p-2.5 sm:p-3 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-600 dark:hover:border-emerald-500 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 text-left transition group"
                                    >
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 group-hover:text-emerald-600 transition shrink-0">
                                            <Zap size={14} className="sm:w-4 sm:h-4"/>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Spesial TIU (35 Soal)</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Numerik, Verbal, Figural.</span>
                                        </div>
                                    </button>

                                    <button 
                                        onClick={() => handleSkdVariantSelect('TKP')}
                                        className="w-full p-2.5 sm:p-3 border-2 border-slate-200 dark:border-slate-700 hover:border-rose-600 dark:hover:border-rose-500 rounded-lg sm:rounded-xl flex items-center gap-2 sm:gap-3 text-left transition group"
                                    >
                                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-rose-100 dark:group-hover:bg-rose-900/30 group-hover:text-rose-600 transition shrink-0">
                                            <Type size={14} className="sm:w-4 sm:h-4"/>
                                        </div>
                                        <div>
                                            <span className="block font-bold text-xs sm:text-sm text-slate-800 dark:text-white">Spesial TKP (45 Soal)</span>
                                            <span className="text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">Karakteristik Pribadi.</span>
                                        </div>
                                    </button>
                                </>
                            )}
                        </div>
                        
                        <button onClick={() => setShowSkdVariantModal(false)} className="w-full py-2 sm:py-2.5 text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-bold hover:text-slate-800 transition">
                            Tutup
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl w-full">
                <div className="flex justify-between items-center mb-6">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600"><ArrowLeft size={20}/> Kembali</button>
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white hidden sm:block">{headerTitle}</h1>
                        
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

                        <button 
                            onClick={handleManualRefresh} 
                            disabled={isLoading}
                            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-sm transition disabled:opacity-50"
                            title="Refresh Paket Soal"
                        >
                            <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>
                <h1 className="text-base sm:text-xl font-bold text-slate-800 dark:text-white mb-4 sm:hidden">{headerTitle}</h1>

                {/* SELECTION ACTION BAR */}
                {isSelectionMode && (
                    <div className="mb-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 p-3 rounded-xl flex items-center justify-between animate-fade-in-down sticky top-0 z-30 shadow-md">
                        <div className="flex items-center gap-3">
                            <button onClick={selectAll} className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline">
                                {selectedIds.size === filteredPackages.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                            </button>
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {selectedIds.size} terpilih
                            </span>
                        </div>
                        <button 
                            onClick={() => initiateAction('DELETE_MULTIPLE', Array.from(selectedIds))}
                            disabled={selectedIds.size === 0}
                            className="px-4 py-2 bg-rose-600 text-white rounded-lg font-bold text-xs hover:bg-rose-700 transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                        >
                            <Trash2 size={14}/> Hapus Terpilih
                        </button>
                    </div>
                )}

                {/* DUPLICATE ALERT BANNER */}
                {duplicateCount > 0 && onFixDuplicates && (
                    <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-4 rounded-xl flex items-center justify-between animate-fade-in-down shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-800 rounded-lg text-amber-600 dark:text-amber-400">
                                <AlertTriangle size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">Terdeteksi Nama Paket Ganda</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
                                    Ditemukan {duplicateCount} judul yang sama. Sistem dapat memperbaikinya secara otomatis.
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => initiateAction('FIX_DUPLICATES')}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-sm transition shadow-sm flex items-center gap-2 whitespace-nowrap"
                        >
                            <PenTool size={16}/>
                            Perbaiki
                        </button>
                    </div>
                )}

                {/* GAP ALERT BANNER (New) */}
                {gapCount > 0 && onFixGaps && (
                    <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-xl flex items-center justify-between animate-fade-in-down shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg text-blue-600 dark:text-blue-400">
                                <ListOrdered size={24} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">Terdeteksi Lompatan Nomor</h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 hidden sm:block">
                                    Urutan paket soal tidak kontinu (ada nomor yang hilang).
                                </p>
                            </div>
                        </div>
                        <button 
                            onClick={() => initiateAction('FIX_GAPS')}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm transition shadow-sm flex items-center gap-2 whitespace-nowrap"
                        >
                            <RefreshCw size={16}/>
                            Urutkan Ulang
                        </button>
                    </div>
                )}

                {/* ADMIN ACTIONS PANEL */}
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6 sm:mb-8">
                     <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                         <h3 className="font-bold text-sm sm:text-lg text-slate-800 dark:text-white flex items-center gap-1.5 sm:gap-2"><Lock size={16} className="text-slate-400 sm:w-[18px] sm:h-[18px]"/> Admin Zone</h3>
                         
                         <div className="flex gap-3 w-full sm:w-auto">
                             <button 
                                onClick={() => initiateAction('GENERATE')} 
                                disabled={isGenerating} 
                                 className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm"
                             >
                                 {isGenerating ? <Loader2 className="animate-spin" size={14}/> : <Plus size={14} className="sm:w-[18px] sm:h-[18px]"/>}
                                 <span>Buat Paket AI</span>
                             </button>

                             <button 
                                onClick={() => initiateAction('IMPORT')} 
                                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white dark:bg-slate-700 text-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-600 transition shadow-sm"
                             >
                                 <UploadIcon size={14} className="sm:w-[18px] sm:h-[18px]"/>
                                 <span>Import</span>
                             </button>
                         </div>
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

                {/* SKD VIEW TABS */}
                {category === 'SKD' && (
                   <div className="flex bg-slate-200 dark:bg-slate-700/50 p-1.5 rounded-xl mb-6 shadow-sm w-full font-bold">
                       <button 
                           onClick={() => setSkdViewMode('FULL')}
                           className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-all ${
                               skdViewMode === 'FULL' 
                                   ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                   : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                           }`}
                       >
                           Full Tryout
                       </button>
                       <button 
                           onClick={() => setSkdViewMode('SUBTEST')}
                           className={`flex-1 py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg transition-all ${
                               skdViewMode === 'SUBTEST' 
                                   ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                                   : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                           }`}
                       >
                           Subtes Tryout
                       </button>
                   </div>
                )}

                {/* PACKAGE LIST */}
                {isLoading && filteredPackages.length === 0 ? (
                    <div className="py-20 text-center text-slate-500">
                        <Loader2 className="animate-spin mx-auto mb-2" />
                        <p>Memuat paket soal terbaru...</p>
                    </div>
                ) : (filteredPackages.length === 0 && !(activeGenTask && activeGenTask.category === category && (category !== 'SKD' || activeGenTask.skdStream === skdStream) && (category !== 'TPA' || activeGenTask.tpaStream === tpaStream) && (category !== 'TKA' || activeGenTask.tkaLevel === tkaLevel) && activeGenTask.status === 'generating')) ? (
                    <div className="py-20 text-center text-slate-500 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <FileText className="mx-auto mb-4 opacity-20" size={48}/>
                        <p>Belum ada paket soal untuk kategori ini.</p>
                        <p className="text-xs mt-2">Gunakan tombol "Buat Paket AI" untuk generate soal baru.</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                        {/* Render active generation task inline if matched */}
                        {activeGenTask && 
                         activeGenTask.category === category && 
                         (category !== 'SKD' || activeGenTask.skdStream === skdStream) &&
                         (category !== 'TPA' || activeGenTask.tpaStream === tpaStream) &&
                         (category !== 'TKA' || activeGenTask.tkaLevel === tkaLevel) && 
                         activeGenTask.status === 'generating' && (
                             <div className="bg-white dark:bg-slate-800 p-3.5 sm:p-6 rounded-lg sm:rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-500/20 bg-indigo-50/10 dark:bg-indigo-950/10 animate-pulse relative overflow-hidden w-full h-full flex flex-col justify-between">
                                 <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-bl-lg">AI MERACIK</div>
                                 <div>
                                     <div className="flex items-center gap-1.5 mb-1 pr-16">
                                         <Loader2 size={16} className="animate-spin text-indigo-600"/>
                                         <h4 className="text-[13px] sm:text-base md:text-lg font-bold text-indigo-900 dark:text-indigo-400 truncate w-full">{activeGenTask.title}</h4>
                                     </div>
                                     <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sedang meracik soal-soal berkualitas tinggi oleh AI ({activeGenTask.progress}%)...</p>
                                 </div>
                                 <div className="mt-4 space-y-1">
                                     <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                         <div className="h-full bg-indigo-600 transition-all duration-1000 ease-out" style={{ width: `${activeGenTask.progress}%` }}></div>
                                     </div>
                                     <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium font-sans">Bisa ditinggal! AI terus memproses paket soal Anda meskipun Anda berpindah menu.</p>
                                 </div>
                             </div>
                        )}
                        
                        {filteredPackages.map(pkg => {
                            // FIX: Pass both ID and Title for better matching
                            const stats = getStats(pkg.id, pkg.title);
                            
                            return (
                                <div 
                                    key={pkg.id} 
                                    onClick={() => {
                                        if (isSelectionMode) toggleSelection(pkg.id);
                                        else onSelectPackage(pkg);
                                    }}
                                    className={`bg-white dark:bg-slate-800 p-3.5 sm:p-6 rounded-lg sm:rounded-2xl border transition text-left group relative overflow-hidden w-full shadow-sm hover:shadow-md cursor-pointer ${
                                        selectedIds.has(pkg.id) 
                                            ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/10' 
                                            : pkg.version === 'v4' 
                                                ? 'border-cyan-200 dark:border-cyan-800 bg-cyan-50/30 dark:bg-cyan-900/10' 
                                                : 'border-slate-200 dark:border-slate-700 hover:border-indigo-500'
                                    }`}
                                >
                                    {/* Selection Checkbox Overlay */}
                                    {isSelectionMode && (
                                        <div className="absolute top-2.5 left-2.5 z-20">
                                            <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition ${selectedIds.has(pkg.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600'}`}>
                                                {selectedIds.has(pkg.id) && <CheckSquare size={12} />}
                                            </div>
                                        </div>
                                    )}

                                    {pkg.isAiGenerated && <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-bl-lg">AI</div>}
                                    
                                    <div className={`flex justify-between items-start ${isSelectionMode ? 'pl-6 sm:pl-8' : ''}`}>
                                        <h4 className="text-[13px] sm:text-base md:text-lg font-bold text-slate-800 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors pr-1.5 line-clamp-2">{pkg.title}</h4>
                                        <div className="flex gap-0.5 sm:gap-1">
                                            <div 
                                                onClick={(e) => handleDownloadPackage(e, pkg)}
                                                className="p-1.5 sm:p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 bg-slate-50 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition"
                                                title="Download JSON Soal"
                                            >
                                                <Download size={14} className="sm:w-[18px] sm:h-[18px]" />
                                            </div>
                                            {!isSelectionMode && (
                                                <div 
                                                    onClick={(e) => { e.stopPropagation(); initiateAction('DELETE', pkg.id); }}
                                                    className="p-1.5 sm:p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 bg-slate-50 dark:bg-slate-700/50 dark:hover:bg-slate-700 rounded-lg transition"
                                                    title="Hapus Paket (Butuh Token)"
                                                >
                                                    <Trash2 size={14} className="sm:w-[18px] sm:h-[18px]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className={`flex gap-2 sm:gap-4 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-3 items-center flex-wrap ${isSelectionMode ? 'pl-6 sm:pl-8' : ''}`}>
                                        <span className="flex items-center gap-0.5 sm:gap-1"><Clock size={10} className="sm:w-[12px] sm:h-[12px]"/> {pkg.durationMinutes}m</span>
                                        <span className="flex items-center gap-0.5 sm:gap-1"><FileText size={10} className="sm:w-[12px] sm:h-[12px]"/> {pkg.questions.length} Soal</span>
                                        <span className="flex items-center gap-0.5 sm:gap-1"><Calendar size={10} className="sm:w-[12px] sm:h-[12px]"/> {new Date(pkg.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                                        {pkg.version === 'v2' && (
                                            <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 font-bold px-1.5 py-0.2 rounded-full text-[9px] border border-purple-200 dark:border-purple-800">
                                                v2
                                            </span>
                                        )}
                                        {pkg.version === 'v3' && (
                                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 font-bold px-1.5 py-0.2 rounded-full text-[9px] border border-amber-200 dark:border-amber-800 flex items-center gap-0.5">
                                                <Box size={8}/> v3
                                            </span>
                                        )}
                                        {pkg.version === 'v4' && (
                                            <span className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300 font-bold px-1.5 py-0.2 rounded-full text-[9px] border border-cyan-200 dark:border-cyan-800 flex items-center gap-0.5">
                                                <Zap size={8}/> v4
                                            </span>
                                        )}
                                        {pkg.version === 'v5' && (
                                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 font-bold px-1.5 py-0.2 rounded-full text-[9px] border border-emerald-200 dark:border-emerald-800 flex items-center gap-0.5">
                                                <Type size={8}/> v5
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* STATS SECTION */}
                                    <div className={`bg-slate-50 dark:bg-slate-700/50 rounded-lg p-1.5 sm:p-3 grid grid-cols-3 gap-1 sm:gap-2 text-center ${isSelectionMode ? 'ml-6 sm:ml-8' : ''}`}>
                                        <div>
                                            <div className="text-[8px] sm:text-[10px] uppercase text-slate-400 font-bold">Coba</div>
                                            <div className="text-[11px] sm:text-lg font-black text-slate-800 dark:text-white">{stats.attempts}x</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] sm:text-[10px] uppercase text-slate-400 font-bold">Top</div>
                                            <div className="text-[11px] sm:text-lg font-black text-emerald-600 dark:text-emerald-400">{stats.highScore}</div>
                                        </div>
                                        <div>
                                            <div className="text-[8px] sm:text-[10px] uppercase text-slate-400 font-bold">Avg</div>
                                            <div className="text-[11px] sm:text-lg font-black text-indigo-600 dark:text-indigo-400">{stats.avgScore}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};