
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trophy, Crown, Medal, User, Loader2, Activity, Package, ExternalLink, ChevronDown, Grid, List } from 'lucide-react';
import { GlobalLeaderboardEntry, CategoryType, UserProfile } from '../types';
import * as FirebaseService from '../services/firebase';
import { SoundManager } from '../services/soundService';

interface GlobalLeaderboardScreenProps {
    onBack: () => void;
    userProfile: UserProfile | null;
    onOpenHumanBenchmark: () => void;
}

// --- CONFIGURATION ---

type TabMode = 'SINGLE' | 'SPLIT_SKD' | 'SPLIT_KECERMATAN' | 'BENCHMARK' | 'SPLIT_TPA';

interface CategoryConfig {
    id: string;
    label: string;
    type: CategoryType;
    sub?: string; // For SINGLE mode
    mode: TabMode;
    color: string;
    description: string;
}

const RANKING_CATEGORIES: CategoryConfig[] = [
    { id: 'utbk', label: 'UTBK SNBT', type: 'UTBK', sub: 'General', mode: 'SINGLE', color: 'bg-rose-500', description: 'Ranking berdasarkan skor IRT rata-rata.' },
    { id: 'skd_combined', label: 'SKD CPNS & Kedinasan', type: 'SKD', mode: 'SPLIT_SKD', color: 'bg-amber-500', description: 'Ranking jalur CPNS Umum dan Sekolah Kedinasan.' },
    { id: 'tpa_combined', label: 'Seleksi Lanjutan I', type: 'TPA', mode: 'SPLIT_TPA', color: 'bg-blue-600', description: 'Ranking TPA/TBI dan Psikotes Kedinasan.' },
    { id: 'psikotest', label: 'Tes Koran & IQ', type: 'PSIKOTEST', sub: 'General', mode: 'SINGLE', color: 'bg-purple-500', description: 'Ranking berdasarkan estimasi IQ & Tes Pauli.' },
    { id: 'kecermatan_combined', label: 'Tes Kecermatan', type: 'KECERMATAN', mode: 'SPLIT_KECERMATAN', color: 'bg-emerald-600', description: 'Ranking ketelitian di berbagai mode tes.' },
    { id: 'benchmark', label: 'Human Benchmark', type: 'BENCHMARK', mode: 'BENCHMARK', color: 'bg-slate-800', description: 'Ranking game kognitif khusus.' },
];

// --- REUSABLE SUB-COMPONENTS ---

const RankBadge: React.FC<{ rank: number }> = ({ rank }) => {
    if (rank === 1) return <Crown className="text-amber-400 fill-amber-400 w-5 h-5 sm:w-6 sm:h-6" />;
    if (rank === 2) return <Medal className="text-slate-400 fill-slate-400 w-5 h-5 sm:w-6 sm:h-6" />;
    if (rank === 3) return <Medal className="text-orange-400 fill-orange-400 w-5 h-5 sm:w-6 sm:h-6" />;
    return <span className="font-black text-slate-400 text-sm sm:text-lg w-6 text-center">{rank}</span>;
};

const LeaderboardList: React.FC<{ 
    title: string; 
    data: GlobalLeaderboardEntry[]; 
    currentUserId?: string;
    colorClass: string;
    compact?: boolean;
}> = ({ title, data, currentUserId, colorClass, compact }) => {
    
    if (data.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 flex flex-col items-center justify-center text-center h-full min-h-[160px] sm:min-h-[200px]">
                <div className={`p-2 rounded-full ${colorClass.replace('bg-', 'bg-opacity-10 text-')} mb-2`}>
                    <Trophy size={18} className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white mb-1">{title}</h3>
                <p className="text-[10px] sm:text-xs text-slate-500">Belum ada data ranking.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col h-full">
            <div className={`p-3 sm:p-4 border-b border-slate-100 dark:border-slate-700 ${colorClass} bg-opacity-10`}>
                <h3 className={`font-bold text-xs sm:text-sm ${colorClass.replace('bg-', 'text-')} flex items-center gap-1.5`}>
                    <Trophy size={14} className="sm:w-[18px] sm:h-[18px]" /> {title}
                </h3>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[400px] sm:max-h-[500px] p-1.5 sm:p-2 scrollbar-hide">
                <div className="space-y-1.5">
                    {data.map((entry, index) => {
                        const rank = index + 1;
                        const isMe = currentUserId === entry.uid;
                        return (
                            <div 
                                key={index} 
                                className={`flex items-center p-2 sm:p-3 rounded-lg sm:rounded-xl border transition-all ${
                                    isMe 
                                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm' 
                                    : 'bg-white dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                                }`}
                            >
                                <div className="w-8 shrink-0 flex justify-center mr-1.5 sm:mr-2"><RankBadge rank={rank} /></div>
                                
                                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-500 dark:text-slate-400 mr-2 sm:mr-3 text-[10px] sm:text-xs shrink-0">
                                    {entry.username[0].toUpperCase()}
                                </div>

                                <div className="flex-1 min-w-0 mr-1.5 sm:mr-2">
                                    <div className={`font-bold text-xs sm:text-sm truncate ${isMe ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-white'}`}>
                                        {entry.username} {isMe && '(You)'}
                                    </div>
                                    {!compact && entry.packageName && (
                                        <div className="flex items-center gap-0.5 sm:gap-1 text-[9px] sm:text-[10px] text-slate-400 mt-0.5">
                                            <Package size={8} className="sm:w-[10px] sm:h-[10px]" /> {entry.packageName}
                                        </div>
                                    )}
                                </div>

                                <div className="text-right">
                                    <div className={`font-black text-xs sm:text-sm ${rank <= 3 ? 'text-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                                        {entry.score}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export const GlobalLeaderboardScreen: React.FC<GlobalLeaderboardScreenProps> = ({ onBack, userProfile, onOpenHumanBenchmark }) => {
    const [selectedTabId, setSelectedTabId] = useState('utbk');
    
    // Data States
    const [singleData, setSingleData] = useState<GlobalLeaderboardEntry[]>([]);
    const [multiData, setMultiData] = useState<Record<string, GlobalLeaderboardEntry[]>>({});
    
    const [loading, setLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const currentConfig = RANKING_CATEGORIES.find(c => c.id === selectedTabId) || RANKING_CATEGORIES[0];

    useEffect(() => {
        const fetchData = async () => {
            if (currentConfig.mode === 'BENCHMARK') return;

            setLoading(true);
            setSingleData([]);
            setMultiData({});

            try {
                if (currentConfig.mode === 'SINGLE') {
                    const data = await FirebaseService.getGlobalLeaderboardData(
                        currentConfig.type,
                        currentConfig.sub || 'General'
                    );
                    setSingleData(data);
                } 
                else if (currentConfig.mode === 'SPLIT_SKD') {
                    const [cpns, kedinasan] = await Promise.all([
                        FirebaseService.getGlobalLeaderboardData('SKD', 'CPNS'),
                        FirebaseService.getGlobalLeaderboardData('SKD', 'KEDINASAN')
                    ]);
                    setMultiData({ 'CPNS': cpns, 'KEDINASAN': kedinasan });
                }
                else if (currentConfig.mode === 'SPLIT_TPA') {
                    // Fetch TPA_TBI and PSIKOTEST_KEDINASAN
                    const [tpa, psikotest] = await Promise.all([
                        FirebaseService.getGlobalLeaderboardData('TPA', 'TPA_TBI'),
                        FirebaseService.getGlobalLeaderboardData('TPA', 'PSIKOTEST_KEDINASAN')
                    ]);
                    setMultiData({ 'TPA_TBI': tpa, 'PSIKOTEST_KEDINASAN': psikotest });
                }
                else if (currentConfig.mode === 'SPLIT_KECERMATAN') {
                    const modes = ['ANGKA', 'HURUF', 'SIMBOL_HILANG', 'SAMA_BEDA', 'MATCHING', 'GROUPING'];
                    const promises = modes.map(m => FirebaseService.getGlobalLeaderboardData('KECERMATAN', m));
                    const results = await Promise.all(promises);
                    
                    const newMulti: Record<string, GlobalLeaderboardEntry[]> = {};
                    modes.forEach((m, idx) => {
                        newMulti[m] = results[idx];
                    });
                    setMultiData(newMulti);
                }
            } catch (e) {
                console.error("Error fetching leaderboard", e);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedTabId]);

    const handleTabChange = (id: string) => {
        SoundManager.play('click');
        setSelectedTabId(id);
        setIsDropdownOpen(false);
    };

    const getUserRankSingle = () => {
        if (!userProfile?.uid || currentConfig.mode !== 'SINGLE') return null;
        const idx = singleData.findIndex(d => d.uid === userProfile.uid);
        if (idx !== -1) return { rank: idx + 1, data: singleData[idx] };
        return null;
    };

    const userRankSingle = getUserRankSingle();

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors h-screen overflow-hidden">
            
            {/* --- DESKTOP SIDEBAR --- */}
            <div className="hidden md:flex w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-col shrink-0 z-20">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                    <button onClick={onBack} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition text-slate-500 dark:text-slate-400">
                        <ArrowLeft size={20} />
                    </button>
                    <h2 className="font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                        <Trophy className="text-amber-500" size={20} /> Global Rank
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {RANKING_CATEGORIES.map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => handleTabChange(cat.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left ${
                                selectedTabId === cat.id 
                                ? `${cat.color} text-white shadow-md` 
                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                            }`}
                        >
                            <div className={`w-2 h-2 rounded-full ${selectedTabId === cat.id ? 'bg-white' : cat.color}`}></div>
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- MOBILE HEADER & DROPDOWN --- */}
            <div className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-3 z-30 sticky top-0">
                <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <button onClick={onBack} className="flex items-center text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm">
                        <ArrowLeft size={16} className="mr-1 sm:w-[18px] sm:h-[18px]"/> Menu
                    </button>
                    <div className="text-xs sm:text-sm font-black text-slate-800 dark:text-white flex items-center gap-1">
                        <Trophy size={14} className="text-amber-500 sm:w-[16px] sm:h-[16px]"/> Global Leaderboard
                    </div>
                </div>
                
                <div className="relative">
                    <button 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full flex items-center justify-between p-2.5 bg-slate-100 dark:bg-slate-700 rounded-xl font-bold text-xs sm:text-sm text-slate-700 dark:text-white"
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${currentConfig.color}`}></div>
                            {currentConfig.label}
                        </div>
                        <ChevronDown size={16} className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}/>
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-down max-h-[60vh] overflow-y-auto">
                            {RANKING_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleTabChange(cat.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all text-left border-b border-slate-50 dark:border-slate-700 last:border-0 ${
                                        selectedTabId === cat.id 
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${cat.color}`}></div>
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <div className="flex-1 flex flex-col h-full relative overflow-hidden bg-slate-50 dark:bg-slate-900" onClick={() => setIsDropdownOpen(false)}>
                
                {/* Header (Desktop Only) */}
                <div className="p-6 pb-4 hidden md:block">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{currentConfig.label}</h1>
                    <p className="text-slate-500 text-sm">{currentConfig.description}</p>
                </div>

                {/* --- LOADING STATE --- */}
                {loading && (
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-indigo-600 mb-4" size={40} />
                        <p className="text-slate-500 font-medium">Memuat data ranking...</p>
                    </div>
                )}

                {/* --- CONTENT VIEWS --- */}
                {!loading && (
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 scrollbar-hide">
                        
                        {currentConfig.mode === 'BENCHMARK' && (
                            <div className="flex flex-col items-center justify-center h-full text-center p-2 sm:p-4">
                                <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-md w-full">
                                    <Activity size={48} className="mx-auto mb-4 text-indigo-500 animate-bounce-slow sm:w-[64px] sm:h-[64px]" />
                                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">Human Benchmark</h2>
                                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-6 sm:mb-8">
                                        Peringkat untuk game kognitif (Reaction Time, Memory, dll) tersedia di dashboard khusus.
                                    </p>
                                    <button 
                                        onClick={() => { SoundManager.play('click'); onOpenHumanBenchmark(); }}
                                        className="w-full py-2.5 sm:py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg text-xs sm:text-base"
                                    >
                                        <ExternalLink size={16} /> Buka Dashboard
                                    </button>
                                </div>
                            </div>
                        )}

                        {currentConfig.mode === 'SINGLE' && (
                            <div className="max-w-3xl mx-auto">
                                <LeaderboardList 
                                    title={`Ranking ${currentConfig.label}`} 
                                    data={singleData} 
                                    currentUserId={userProfile?.uid}
                                    colorClass={currentConfig.color}
                                />
                            </div>
                        )}

                        {currentConfig.mode === 'SPLIT_SKD' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto h-full">
                                <LeaderboardList 
                                    title="SKD CPNS Umum" 
                                    data={multiData['CPNS'] || []} 
                                    currentUserId={userProfile?.uid}
                                    colorClass="bg-amber-500"
                                />
                                <LeaderboardList 
                                    title="SKD Kedinasan" 
                                    data={multiData['KEDINASAN'] || []} 
                                    currentUserId={userProfile?.uid}
                                    colorClass="bg-orange-500"
                                />
                            </div>
                        )}

                        {currentConfig.mode === 'SPLIT_TPA' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto h-full">
                                <LeaderboardList 
                                    title="TPA & TBI (Standar)" 
                                    data={multiData['TPA_TBI'] || []} 
                                    currentUserId={userProfile?.uid}
                                    colorClass="bg-blue-600"
                                />
                                <LeaderboardList 
                                    title="Psikotes Kedinasan" 
                                    data={multiData['PSIKOTEST_KEDINASAN'] || []} 
                                    currentUserId={userProfile?.uid}
                                    colorClass="bg-purple-600"
                                />
                            </div>
                        )}

                        {currentConfig.mode === 'SPLIT_KECERMATAN' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">
                                <LeaderboardList title="Angka Hilang" data={multiData['ANGKA'] || []} currentUserId={userProfile?.uid} colorClass="bg-emerald-500" compact />
                                <LeaderboardList title="Huruf Hilang" data={multiData['HURUF'] || []} currentUserId={userProfile?.uid} colorClass="bg-teal-500" compact />
                                <LeaderboardList title="Simbol Hilang" data={multiData['SIMBOL_HILANG'] || []} currentUserId={userProfile?.uid} colorClass="bg-cyan-500" compact />
                                <LeaderboardList title="Sama Beda Simbol" data={multiData['SAMA_BEDA'] || []} currentUserId={userProfile?.uid} colorClass="bg-blue-500" compact />
                                <LeaderboardList title="Matching" data={multiData['MATCHING'] || []} currentUserId={userProfile?.uid} colorClass="bg-indigo-500" compact />
                                <LeaderboardList title="Grouping" data={multiData['GROUPING'] || []} currentUserId={userProfile?.uid} colorClass="bg-violet-500" compact />
                            </div>
                        )}

                    </div>
                )}

                {/* --- STICKY FOOTER (Only for SINGLE mode) --- */}
                {userRankSingle && currentConfig.mode === 'SINGLE' && (
                    <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-4 shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-30 animate-slide-up">
                        <div className="max-w-3xl mx-auto flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-xs font-bold text-slate-400 uppercase">Your Rank</div>
                                <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black px-3 py-1 rounded-lg">
                                    #{userRankSingle.rank}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs font-bold text-slate-400 uppercase">Your Score</div>
                                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                    {userRankSingle.data.score}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
