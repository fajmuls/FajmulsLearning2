import React, { useState, useMemo } from 'react';
import { 
    User, Award, BookOpen, BarChart2, Target, Clock, Flame, 
    ShieldCheck, CheckCircle2, XCircle, AlertTriangle, TrendingUp, 
    ChevronDown, ChevronUp, Search, Edit3, Save, Sparkles, Filter, 
    Layers, Activity, FileText, Check, GraduationCap, 
    MapPin, Phone, Mail, Loader2, Sparkle
} from 'lucide-react';
import { UserProfile, TestHistoryItem, CategoryType } from '../types';
import { analyzeUserAccountLearning, AccountGlobalStats, PackageStats, SubtestStat, TopicStat } from '../src/utils/userAccountAnalytics';
import { SoundManager } from '../services/soundService';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userProfile: UserProfile | null;
    history: TestHistoryItem[];
    onUpdateProfile: (data: Partial<UserProfile>) => Promise<void>;
    isDarkMode?: boolean;
}

type ProfileTab = 'ringkasan' | 'paket_to' | 'subtes' | 'materi' | 'perilaku' | 'edit_profil';

const AVATAR_PRESETS = [
    { id: 'taruna', name: 'Taruna Kedinasan', emoji: '👮', bg: 'from-amber-500 to-orange-600' },
    { id: 'asn', name: 'Aparatur Sipil Negara', emoji: '🏛️', bg: 'from-blue-600 to-indigo-700' },
    { id: 'mahasiswa', name: 'Mahasiswa Berprestasi', emoji: '🎓', bg: 'from-emerald-500 to-teal-700' },
    { id: 'cendekia', name: 'Peneliti & Cendekia', emoji: '🔬', bg: 'from-violet-600 to-purple-800' },
    { id: 'dokter', name: 'Dokter / Medis', emoji: '🩺', bg: 'from-rose-500 to-red-700' },
    { id: 'diplomat', name: 'Diplomat Global', emoji: '🌐', bg: 'from-sky-500 to-cyan-700' },
    { id: 'astronot', name: 'Eksplorator Cerdas', emoji: '🚀', bg: 'from-slate-700 to-slate-950' },
    { id: 'juara', name: 'Bintang Juara', emoji: '⭐', bg: 'from-yellow-400 to-amber-600' }
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    onClose,
    userProfile,
    history,
    onUpdateProfile,
    isDarkMode = false
}) => {
    const [activeTab, setActiveTab] = useState<ProfileTab>('ringkasan');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);
    const [topicSortOrder, setTopicSortOrder] = useState<'WEAK_FIRST' | 'STRONG_FIRST'>('WEAK_FIRST');
    const [topicStatusFilter, setTopicStatusFilter] = useState<'ALL' | 'KRITIS' | 'CUKUP' | 'KUASAI'>('ALL');

    // Form Edit Profil State
    const [formData, setFormData] = useState({
        username: userProfile?.username || '',
        bio: userProfile?.bio || '',
        targetInstitution: userProfile?.targetInstitution || '',
        targetCategory: userProfile?.targetCategory || 'SKD',
        targetScore: userProfile?.targetScore ? String(userProfile.targetScore) : '450',
        institutionOrigin: userProfile?.institutionOrigin || '',
        provinceOrCity: userProfile?.provinceOrCity || '',
        phone: userProfile?.phone || '',
        avatarPreset: userProfile?.avatarPreset || 'taruna',
        photoURL: userProfile?.photoURL || ''
    });

    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

    // Sync form data when userProfile changes
    React.useEffect(() => {
        if (userProfile) {
            setFormData({
                username: userProfile.username || '',
                bio: userProfile.bio || '',
                targetInstitution: userProfile.targetInstitution || '',
                targetCategory: userProfile.targetCategory || 'SKD',
                targetScore: userProfile.targetScore ? String(userProfile.targetScore) : '450',
                institutionOrigin: userProfile.institutionOrigin || '',
                provinceOrCity: userProfile.provinceOrCity || '',
                phone: userProfile.phone || '',
                avatarPreset: userProfile.avatarPreset || 'taruna',
                photoURL: userProfile.photoURL || ''
            });
        }
    }, [userProfile]);

    // Analisis Komprehensif Seluruh Riwayat Belajar
    const stats: AccountGlobalStats = useMemo(() => {
        return analyzeUserAccountLearning(history);
    }, [history]);

    if (!isOpen) return null;

    const usernameDisplay = userProfile?.username || 'Siswa Berprestasi';
    const userLevel = userProfile?.gamification?.level || 1;
    const userStreak = userProfile?.gamification?.streak || 1;
    const currentAvatarPreset = AVATAR_PRESETS.find(p => p.id === (userProfile?.avatarPreset || formData.avatarPreset)) || AVATAR_PRESETS[0];

    // Filter Packages
    const filteredPackages = stats.packages.filter(pkg => {
        const matchesCat = selectedCategoryFilter === 'ALL' || pkg.category === selectedCategoryFilter;
        const matchesSearch = !searchQuery || pkg.packageTitle.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    // Filter Subtests
    const filteredSubtests = stats.allSubtests.filter(st => {
        const matchesCat = selectedCategoryFilter === 'ALL' || st.category === selectedCategoryFilter;
        const matchesSearch = !searchQuery || st.subtestName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    // Filter Topics
    const filteredTopics = stats.allTopicsRanked.filter(tp => {
        const matchesCat = selectedCategoryFilter === 'ALL' || tp.category === selectedCategoryFilter;
        const matchesStatus = topicStatusFilter === 'ALL' || tp.masteryStatus === topicStatusFilter;
        const matchesSearch = !searchQuery || 
            tp.topicName.toLowerCase().includes(searchQuery.toLowerCase()) || 
            tp.subtestName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesStatus && matchesSearch;
    }).sort((a, b) => {
        if (topicSortOrder === 'WEAK_FIRST') {
            return a.accuracyPercent - b.accuracyPercent;
        }
        return b.accuracyPercent - a.accuracyPercent;
    });

    // Handle Save Profile
    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        SoundManager.play('click');
        setIsSaving(true);
        setSaveFeedback(null);

        try {
            await onUpdateProfile({
                username: formData.username.trim() || 'Siswa Fajmuls',
                bio: formData.bio.trim(),
                targetInstitution: formData.targetInstitution.trim(),
                targetCategory: formData.targetCategory,
                targetScore: formData.targetScore ? Number(formData.targetScore) : undefined,
                institutionOrigin: formData.institutionOrigin.trim(),
                provinceOrCity: formData.provinceOrCity.trim(),
                phone: formData.phone.trim(),
                avatarPreset: formData.avatarPreset,
                photoURL: formData.photoURL.trim() || undefined
            });

            setSaveFeedback('Profil dan target belajar Anda berhasil diperbarui!');
            setTimeout(() => setSaveFeedback(null), 4000);
        } catch (err: any) {
            setSaveFeedback('Gagal menyimpan profil: ' + (err?.message || 'Terjadi kesalahan'));
        } finally {
            setIsSaving(false);
        }
    };

    const formatSeconds = (sec: number) => {
        if (!sec || sec <= 0) return '0 dtk';
        const hours = Math.floor(sec / 3600);
        const mins = Math.floor((sec % 3600) / 60);
        const remainingSec = sec % 60;
        if (hours > 0) return `${hours}j ${mins}m`;
        if (mins > 0) return `${mins}m ${remainingSec}s`;
        return `${remainingSec}s`;
    };

    return (
        <div 
            id="profile-modal-overlay" 
            className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in"
        >
            <div 
                id="profile-modal-card" 
                className="relative bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col border border-slate-200 dark:border-slate-800 overflow-hidden text-slate-800 dark:text-slate-100"
            >
                {/* MODAL HEADER WITH PROFILE BANNER */}
                <div className="relative bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 text-white p-4 sm:p-6 pb-5 shrink-0 border-b border-indigo-500/20">
                    <button 
                        onClick={() => { SoundManager.play('back'); onClose(); }}
                        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Tutup Profil"
                    >
                        <XCircle size={24} />
                    </button>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-8">
                        <div className="flex items-center gap-3.5 sm:gap-4">
                            {/* Avatar */}
                            <div className="relative">
                                {userProfile?.photoURL ? (
                                    <img 
                                        src={userProfile.photoURL} 
                                        alt={usernameDisplay} 
                                        className="w-14 h-14 sm:w-18 sm:h-18 rounded-2xl object-cover ring-4 ring-white/30 shadow-lg" 
                                    />
                                ) : (
                                    <div className={`w-14 h-14 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br ${currentAvatarPreset.bg} flex items-center justify-center text-2xl sm:text-3xl ring-4 ring-white/30 shadow-lg`}>
                                        {currentAvatarPreset.emoji}
                                    </div>
                                )}
                                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-900 font-black text-[10px] px-1.5 py-0.5 rounded-md shadow-sm border border-white flex items-center gap-0.5">
                                    <Flame size={10} className="fill-slate-900" />
                                    {userStreak}d
                                </div>
                            </div>

                            {/* Bio & Identitas */}
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 className="text-lg sm:text-2xl font-black tracking-tight leading-none text-white">
                                        {usernameDisplay}
                                    </h1>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm">
                                        Level {userLevel}
                                    </span>
                                    {userProfile?.isGuest ? (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-400/30 text-amber-200 border border-amber-300/30">
                                            Akun Tamu
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-400/30 text-emerald-200 border border-emerald-300/30 flex items-center gap-1">
                                            <ShieldCheck size={11} /> Terverifikasi
                                        </span>
                                    )}
                                </div>

                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-indigo-100/90">
                                    {userProfile?.targetInstitution && (
                                        <span className="flex items-center gap-1 font-medium">
                                            <Target size={12} className="text-amber-300" />
                                            Target: <strong className="text-white">{userProfile.targetInstitution}</strong>
                                            {userProfile?.targetScore ? ` (Skor: ${userProfile.targetScore})` : ''}
                                        </span>
                                    )}
                                    {userProfile?.institutionOrigin && (
                                        <span className="flex items-center gap-1 text-white/80">
                                            <GraduationCap size={12} />
                                            {userProfile.institutionOrigin}
                                        </span>
                                    )}
                                    {userProfile?.provinceOrCity && (
                                        <span className="flex items-center gap-1 text-white/80">
                                            <MapPin size={12} />
                                            {userProfile.provinceOrCity}
                                        </span>
                                    )}
                                </div>

                                {userProfile?.bio && (
                                    <p className="mt-1.5 text-xs text-white/80 italic line-clamp-1 max-w-xl">
                                        &ldquo;{userProfile.bio}&rdquo;
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Quick Action: Button Edit Profil */}
                        <div className="flex items-center gap-2 self-stretch sm:self-center">
                            <button
                                onClick={() => { SoundManager.play('tap'); setActiveTab('edit_profil'); }}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                                    activeTab === 'edit_profil'
                                        ? 'bg-white text-indigo-700 shadow-white/20'
                                        : 'bg-white/15 hover:bg-white/25 text-white'
                                }`}
                            >
                                <Edit3 size={13} />
                                Edit Profil & Target
                            </button>
                        </div>
                    </div>
                </div>

                {/* NAVIGATION TABS */}
                <div className="px-3 sm:px-6 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 shrink-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                        {[
                            { id: 'ringkasan', label: 'Ringkasan Belajar', icon: <BarChart2 size={14} /> },
                            { id: 'paket_to', label: `Paket Tryout (${stats.packages.length})`, icon: <BookOpen size={14} /> },
                            { id: 'subtes', label: `Per-Subtes (${stats.allSubtests.length})`, icon: <Layers size={14} /> },
                            { id: 'materi', label: `Materi Kuat & Lemah (${stats.allTopicsRanked.length})`, icon: <Target size={14} /> },
                            { id: 'perilaku', label: 'Karakteristik & Per Soal', icon: <Activity size={14} /> },
                            { id: 'edit_profil', label: 'Pengaturan Profil', icon: <Edit3 size={14} /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { SoundManager.play('tap'); setActiveTab(tab.id as ProfileTab); }}
                                className={`px-3 sm:px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                                    activeTab === tab.id
                                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800'
                                }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* FILTER TOOLBAR (For Paket, Subtes, and Materi tabs) */}
                {(activeTab === 'paket_to' || activeTab === 'subtes' || activeTab === 'materi') && (
                    <div className="px-3 sm:px-6 py-2.5 bg-slate-100/60 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-2.5 shrink-0">
                        {/* Category chips */}
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
                                <Filter size={11} /> Kategori:
                            </span>
                            {['ALL', 'SKD', 'UTBK', 'TPA', 'PSIKOTEST'].map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => { SoundManager.play('tap'); setSelectedCategoryFilter(cat); }}
                                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                                        selectedCategoryFilter === cat
                                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    {cat === 'ALL' ? 'Semua Kategori' : cat}
                                </button>
                            ))}
                        </div>

                        {/* Search & Extra Filters */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className="relative flex-1 sm:w-56">
                                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari paket / subtes / materi..."
                                    className="w-full pl-8 pr-3 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => setSearchQuery('')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        <XCircle size={12} />
                                    </button>
                                )}
                            </div>

                            {activeTab === 'materi' && (
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setTopicSortOrder(prev => prev === 'WEAK_FIRST' ? 'STRONG_FIRST' : 'WEAK_FIRST')}
                                        className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1 hover:bg-slate-50"
                                        title="Urutkan Akurasi"
                                    >
                                        <TrendingUp size={12} className={topicSortOrder === 'WEAK_FIRST' ? 'rotate-180 text-rose-500' : 'text-emerald-500'} />
                                        {topicSortOrder === 'WEAK_FIRST' ? 'Paling Lemah' : 'Paling Kuat'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* SCROLLABLE MAIN CONTENT */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
                    {/* TAB 1: RINGKASAN BELAJAR (OVERVIEW) */}
                    {activeTab === 'ringkasan' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* KPI Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-150 dark:border-slate-700/80">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Total Soal Dijawab
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                            {stats.totalQuestionsAnswered}
                                        </span>
                                        <span className="text-[10px] text-slate-400">soal</span>
                                    </div>
                                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px]">
                                        <span className="text-emerald-600 font-bold">{stats.totalCorrect} B</span>
                                        <span className="text-slate-300">/</span>
                                        <span className="text-rose-600 font-bold">{stats.totalWrong} S</span>
                                    </div>
                                </div>

                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-150 dark:border-slate-700/80">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Akurasi Keseluruhan
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-xl sm:text-2xl font-black ${
                                            stats.overallAccuracy >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                                            stats.overallAccuracy >= 55 ? 'text-amber-500 dark:text-amber-400' :
                                            'text-rose-600 dark:text-rose-400'
                                        }`}>
                                            {stats.overallAccuracy}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-2">
                                        <div 
                                            className={`h-full rounded-full ${
                                                stats.overallAccuracy >= 75 ? 'bg-emerald-500' :
                                                stats.overallAccuracy >= 55 ? 'bg-amber-500' : 'bg-rose-500'
                                            }`} 
                                            style={{ width: `${stats.overallAccuracy}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-150 dark:border-slate-700/80">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Skor Tertinggi
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                                            {stats.highestScore}
                                        </span>
                                        <span className="text-[10px] text-slate-400">poin</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 truncate block mt-1">
                                        Min: {stats.lowestScore} | Avg: {stats.averageScore}
                                    </span>
                                </div>

                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-150 dark:border-slate-700/80">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Sesi Selesai
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                            {stats.totalSessions}
                                        </span>
                                        <span className="text-[10px] text-slate-400">sesi</span>
                                    </div>
                                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block mt-1">
                                        {stats.passRatePercent}% Lulus PG
                                    </span>
                                </div>

                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-150 dark:border-slate-700/80">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Waktu Belajar
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                            {formatSeconds(stats.totalStudyTimeSeconds)}
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 block mt-1">
                                        Avg {stats.avgTimePerQuestionSeconds}s / soal
                                    </span>
                                </div>

                                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-150 dark:border-slate-700/80">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                                        Paket TO Dicoba
                                    </span>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                                            {stats.packages.length}
                                        </span>
                                        <span className="text-[10px] text-slate-400">paket</span>
                                    </div>
                                    <span className="text-[10px] text-indigo-500 font-bold block mt-1">
                                        {stats.allSubtests.length} Subtes dipelajari
                                    </span>
                                </div>
                            </div>

                            {/* Breakdown per Jalur / Kategori Ujian */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Layers size={16} className="text-indigo-500" />
                                        Performa Berdasarkan Jalur Ujian
                                    </h3>
                                    <span className="text-xs text-slate-400">
                                        {stats.categories.length} Jalur aktif
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {stats.categories.map((cat) => (
                                        <div 
                                            key={cat.category}
                                            className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-400 transition"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs font-black px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                                    {cat.category}
                                                </span>
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                                                    {cat.totalSessions} Tryout
                                                </span>
                                            </div>

                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-2 line-clamp-1">
                                                {cat.categoryLabel}
                                            </h4>

                                            <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-700/60 my-2 text-center">
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block">Skor Max</span>
                                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{cat.highestScore}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block">Skor Rata2</span>
                                                    <span className="text-sm font-black text-slate-800 dark:text-slate-200">{cat.averageScore}</span>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] text-slate-400 block">Akurasi</span>
                                                    <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{cat.accuracyPercent}%</span>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                                                <span>{cat.correctCount} Benar / {cat.wrongCount} Salah</span>
                                                <span>{cat.packagesCount} Paket TO</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Topik Paling Kritis & Paling Kuat Quick Preview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Topik Paling Lemah (Butuh Perhatian Segera) */}
                                <div className="p-4 bg-rose-50/60 dark:bg-rose-950/20 rounded-2xl border border-rose-200/80 dark:border-rose-900/40">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <AlertTriangle size={16} className="text-rose-600" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-rose-800 dark:text-rose-300">
                                                Topik Paling Lemah (Prioritas Belajar)
                                            </h4>
                                        </div>
                                        <button
                                            onClick={() => { SoundManager.play('tap'); setActiveTab('materi'); setTopicStatusFilter('KRITIS'); }}
                                            className="text-[11px] font-bold text-rose-600 hover:underline"
                                        >
                                            Lihat Semua &rarr;
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {stats.allTopicsRanked.slice(0, 4).map((tp, i) => (
                                            <div key={i} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-rose-150 dark:border-slate-700 flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-white block">{tp.topicName}</span>
                                                    <span className="text-[10px] text-slate-400">{tp.subtestName} • {tp.correctCount}/{tp.totalQuestions} Benar</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">{tp.accuracyPercent}%</span>
                                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 block mt-0.5">
                                                        Kritis
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {stats.allTopicsRanked.length === 0 && (
                                            <p className="text-xs text-slate-400 py-3 text-center">Belum ada riwayat soal untuk dianalisis.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Topik Paling Dikuasai */}
                                <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 size={16} className="text-emerald-600" />
                                            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                                                Topik Paling Dikuasai (Kekuatan Utama)
                                            </h4>
                                        </div>
                                        <button
                                            onClick={() => { SoundManager.play('tap'); setActiveTab('materi'); setTopicStatusFilter('KUASAI'); }}
                                            className="text-[11px] font-bold text-emerald-600 hover:underline"
                                        >
                                            Lihat Semua &rarr;
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {[...stats.allTopicsRanked].reverse().slice(0, 4).map((tp, i) => (
                                            <div key={i} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-150 dark:border-slate-700 flex items-center justify-between">
                                                <div>
                                                    <span className="text-xs font-bold text-slate-800 dark:text-white block">{tp.topicName}</span>
                                                    <span className="text-[10px] text-slate-400">{tp.subtestName} • {tp.correctCount}/{tp.totalQuestions} Benar</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{tp.accuracyPercent}%</span>
                                                    <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 block mt-0.5">
                                                        Kuasai
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                        {stats.allTopicsRanked.length === 0 && (
                                            <p className="text-xs text-slate-400 py-3 text-center">Belum ada riwayat soal untuk dianalisis.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: STATISTIK PER PAKET TO */}
                    {activeTab === 'paket_to' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between text-xs text-slate-500">
                                <span>Menampilkan <strong>{filteredPackages.length}</strong> paket tryout yang pernah dikerjakan</span>
                            </div>

                            {filteredPackages.map((pkg) => {
                                const isExpanded = expandedPackageId === pkg.packageKey;

                                return (
                                    <div 
                                        key={pkg.packageKey}
                                        className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-all"
                                    >
                                        {/* Package Header Card */}
                                        <div 
                                            onClick={() => {
                                                SoundManager.play('tap');
                                                setExpandedPackageId(isExpanded ? null : pkg.packageKey);
                                            }}
                                            className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-750 transition"
                                        >
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 uppercase">
                                                        {pkg.category}
                                                    </span>
                                                    {pkg.stream && (
                                                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                            {pkg.stream}
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-400">
                                                        {pkg.attemptCount}x pengerjaan • Terakhir: {new Date(pkg.lastAttemptDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>

                                                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                                                    {pkg.packageTitle}
                                                </h3>
                                            </div>

                                            {/* Metrics preview */}
                                            <div className="flex items-center justify-between md:justify-end gap-3 sm:gap-6 shrink-0">
                                                <div className="text-left md:text-right">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Skor Max / Avg</span>
                                                    <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                        {pkg.highestScore} <span className="text-xs text-slate-400 font-normal">/ {pkg.averageScore}</span>
                                                    </span>
                                                </div>

                                                <div className="text-left md:text-right">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Benar / Salah</span>
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                        <span className="text-emerald-600">{pkg.correctCount}</span> / <span className="text-rose-600">{pkg.wrongCount}</span>
                                                    </span>
                                                </div>

                                                <div className="text-left md:text-right">
                                                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Akurasi</span>
                                                    <span className={`text-base font-black ${
                                                        pkg.accuracyPercent >= 75 ? 'text-emerald-600' :
                                                        pkg.accuracyPercent >= 55 ? 'text-amber-500' : 'text-rose-600'
                                                    }`}>
                                                        {pkg.accuracyPercent}%
                                                    </span>
                                                </div>

                                                <div className="p-2 text-slate-400">
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Package Breakdown (Subtests & Question Details) */}
                                        {isExpanded && (
                                            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-850/50 space-y-4 animate-fade-in">
                                                {/* Subtests in this package */}
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                                                        Rincian Per-Subtes di Paket Ini
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                                        {pkg.subtests.map(st => (
                                                            <div key={st.subtestName} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                                                                <div className="flex justify-between items-center mb-1.5">
                                                                    <span className="text-xs font-black text-slate-800 dark:text-white">{st.subtestName}</span>
                                                                    <span className="text-xs font-black text-emerald-600">{st.accuracyPercent}%</span>
                                                                </div>
                                                                <div className="flex justify-between text-[11px] text-slate-500">
                                                                    <span>Benar: {st.correctCount} / {st.totalQuestions}</span>
                                                                    <span>Salah: {st.wrongCount}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Questions Table in this package */}
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
                                                        <span>Statistik Per-Soal di Paket Ini ({pkg.questions.length} Soal)</span>
                                                        <span className="text-[10px] text-slate-400 font-normal">Riwayat Pengerjaan Terakhir</span>
                                                    </h4>

                                                    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                                                        <table className="w-full text-left text-xs border-collapse bg-white dark:bg-slate-800">
                                                            <thead>
                                                                <tr className="bg-slate-100 dark:bg-slate-700/60 text-slate-500 text-[10px] uppercase font-bold border-b border-slate-200 dark:border-slate-700">
                                                                    <th className="p-2.5 text-center w-12">No</th>
                                                                    <th className="p-2.5">Subtes & Materi</th>
                                                                    <th className="p-2.5">Teks / Cuplikan Soal</th>
                                                                    <th className="p-2.5 text-center">Status</th>
                                                                    <th className="p-2.5 text-center">Jawaban</th>
                                                                    <th className="p-2.5 text-center">Waktu</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                                                                {pkg.questions.map((q) => (
                                                                    <tr key={q.questionId} className="hover:bg-slate-50 dark:hover:bg-slate-750">
                                                                        <td className="p-2.5 text-center font-bold text-slate-400">#{q.index}</td>
                                                                        <td className="p-2.5 whitespace-nowrap">
                                                                            <span className="font-bold text-slate-800 dark:text-white block">{q.subtest}</span>
                                                                            <span className="text-[10px] text-slate-400">{q.topic}</span>
                                                                        </td>
                                                                        <td className="p-2.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                                                                            {q.excerpt}
                                                                        </td>
                                                                        <td className="p-2.5 text-center">
                                                                            {q.isCorrect ? (
                                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                                                    <Check size={10} /> Benar
                                                                                </span>
                                                                            ) : (
                                                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                                                                                    <XCircle size={10} /> Salah
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="p-2.5 text-center whitespace-nowrap text-[11px]">
                                                                            <span className="font-bold text-slate-700 dark:text-slate-200">Pilih: {q.selectedAnswer}</span>
                                                                            {q.correctAnswer && !q.isCorrect && (
                                                                                <span className="text-emerald-600 block text-[10px]">Kunci: {q.correctAnswer}</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="p-2.5 text-center text-slate-500 whitespace-nowrap">
                                                                            {q.timeTakenSeconds}s
                                                                            {q.isOverthinking && (
                                                                                <span className="block text-[9px] text-amber-500 font-bold">Overthinking</span>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {filteredPackages.length === 0 && (
                                <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <BookOpen size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                    <p className="text-sm font-bold">Tidak ada paket tryout yang sesuai filter.</p>
                                    <p className="text-xs">Selesaikan latihan atau tryout untuk melihat analisis paket.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 3: STATISTIK PER SUBTES */}
                    {activeTab === 'subtes' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredSubtests.map((st) => (
                                    <div 
                                        key={st.subtestName}
                                        className="p-4 sm:p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-3"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                                                    {st.category}
                                                </span>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                                                    {st.subtestName}
                                                </h3>
                                            </div>
                                            <div className="text-right">
                                                <span className={`text-xl font-black ${
                                                    st.accuracyPercent >= 75 ? 'text-emerald-600 dark:text-emerald-400' :
                                                    st.accuracyPercent >= 55 ? 'text-amber-500' : 'text-rose-600'
                                                }`}>
                                                    {st.accuracyPercent}%
                                                </span>
                                                <span className="text-[10px] text-slate-400 block">Akurasi Subtes</span>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    st.accuracyPercent >= 75 ? 'bg-emerald-500' :
                                                    st.accuracyPercent >= 55 ? 'bg-amber-500' : 'bg-rose-500'
                                                }`}
                                                style={{ width: `${st.accuracyPercent}%` }}
                                            />
                                        </div>

                                        {/* Metrik bar */}
                                        <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-100 dark:border-slate-700/60 text-center">
                                            <div>
                                                <span className="text-[10px] text-slate-400 block">Total Soal</span>
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{st.totalQuestions}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 block">Benar / Salah</span>
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                    <span className="text-emerald-600">{st.correctCount}</span> / <span className="text-rose-600">{st.wrongCount}</span>
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] text-slate-400 block">Rata2 Waktu</span>
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{st.avgTimeSeconds}s / soal</span>
                                            </div>
                                        </div>

                                        {/* Materi di Subtes ini */}
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                                                Daftar Materi di Subtes Ini ({st.topics.length})
                                            </span>
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                                                {st.topics.map((tp, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-750 text-xs">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate mr-2">{tp.topicName}</span>
                                                        <div className="flex items-center gap-2 shrink-0">
                                                            <span className="text-[11px] text-slate-400">{tp.correctCount}/{tp.totalQuestions} B</span>
                                                            <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded ${
                                                                tp.masteryStatus === 'KUASAI' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300' :
                                                                tp.masteryStatus === 'KRITIS' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300' :
                                                                'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                                                            }`}>
                                                                {tp.accuracyPercent}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {filteredSubtests.length === 0 && (
                                <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                    <Layers size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                    <p className="text-sm font-bold">Tidak ada subtes yang sesuai dengan pencarian.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* TAB 4: MATERI PALING DIKUASAI SAMPAI PALING LEMAH */}
                    {activeTab === 'materi' && (
                        <div className="space-y-4 animate-fade-in">
                            {/* Filter Status Status Bar */}
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="text-slate-400 font-bold">Status Penguasaan:</span>
                                {[
                                    { id: 'ALL', label: 'Semua Status' },
                                    { id: 'KRITIS', label: 'Kritis (<55%)' },
                                    { id: 'CUKUP', label: 'Cukup (55-79%)' },
                                    { id: 'KUASAI', label: 'Kuasai (≥80%)' },
                                ].map(status => (
                                    <button
                                        key={status.id}
                                        onClick={() => setTopicStatusFilter(status.id as any)}
                                        className={`px-3 py-1 rounded-lg font-bold transition ${
                                            topicStatusFilter === status.id
                                                ? 'bg-indigo-600 text-white shadow-sm'
                                                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        {status.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                {filteredTopics.map((topic, i) => {
                                    const isCritical = topic.masteryStatus === 'KRITIS';
                                    const isGood = topic.masteryStatus === 'KUASAI';

                                    return (
                                        <div 
                                            key={`${topic.subtestName}-${topic.topicName}-${i}`}
                                            className={`p-4 rounded-2xl border transition-all ${
                                                isCritical 
                                                    ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' 
                                                    : isGood 
                                                    ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                            }`}
                                        >
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                                            {topic.subtestName}
                                                        </span>
                                                        <span className="text-[10px] font-semibold text-slate-400">
                                                            {topic.category}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                                                        {topic.topicName}
                                                    </h4>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="text-right">
                                                        <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">
                                                            {topic.correctCount} dari {topic.totalQuestions} soal benar
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 block">
                                                            Avg {topic.avgTimeSeconds}s / soal
                                                        </span>
                                                    </div>

                                                    <div className="text-right min-w-[70px]">
                                                        <span className={`text-xl font-black ${
                                                            isGood ? 'text-emerald-600' : isCritical ? 'text-rose-600' : 'text-amber-500'
                                                        }`}>
                                                            {topic.accuracyPercent}%
                                                        </span>
                                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded block text-center ${
                                                            isGood ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' :
                                                            isCritical ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300' :
                                                            'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                                                        }`}>
                                                            {topic.masteryStatus}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Recommendation Box */}
                                            <div className="mt-2.5 p-3 rounded-xl bg-white/80 dark:bg-slate-850/80 border border-slate-150 dark:border-slate-750 text-xs flex items-start gap-2">
                                                <Sparkles size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                                    <strong>Saran Tindak Lanjut:</strong> {topic.recommendation}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {filteredTopics.length === 0 && (
                                    <div className="text-center py-12 text-slate-400 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                                        <Target size={36} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                        <p className="text-sm font-bold">Tidak ada materi yang sesuai dengan filter.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* TAB 5: PERILAKU & KARAKTERISTIK SOAL */}
                    {activeTab === 'perilaku' && (
                        <div className="space-y-6 animate-fade-in">
                            {/* Psychological & Timing Breakdown */}
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Activity size={16} className="text-indigo-500" />
                                    Diagnosis Perilaku Menjawab Soal
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div className="p-4 bg-amber-50/60 dark:bg-amber-950/20 rounded-2xl border border-amber-200/80 dark:border-amber-900/40">
                                        <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 block mb-1">
                                            Soal Overthinking
                                        </span>
                                        <div className="text-2xl font-black text-amber-700 dark:text-amber-300 mb-1">
                                            {stats.overthinkingQuestionsCount}
                                        </div>
                                        <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
                                            Soal di mana Anda menghabiskan waktu &gt; 120% batas ideal per soal. Waspadai kehabisan waktu di subtes lain.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-purple-50/60 dark:bg-purple-950/20 rounded-2xl border border-purple-200/80 dark:border-purple-900/40">
                                        <span className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300 block mb-1">
                                            Soal Ragu-Ragu (Doubtful)
                                        </span>
                                        <div className="text-2xl font-black text-purple-700 dark:text-purple-300 mb-1">
                                            {stats.doubtfulQuestionsCount}
                                        </div>
                                        <p className="text-xs text-purple-800/80 dark:text-purple-400/80">
                                            Soal yang sempat Anda tandai ragu-ragu selama ujian berlangsung. Kaji ulang pemantapan konsep dasarnya.
                                        </p>
                                    </div>

                                    <div className="p-4 bg-blue-50/60 dark:bg-blue-950/20 rounded-2xl border border-blue-200/80 dark:border-blue-900/40">
                                        <span className="text-[10px] uppercase font-bold text-blue-700 dark:text-blue-300 block mb-1">
                                            Pengerjaan Cepat (Tebakan / Cekatan)
                                        </span>
                                        <div className="text-2xl font-black text-blue-700 dark:text-blue-300 mb-1">
                                            {stats.guessingQuestionsCount}
                                        </div>
                                        <p className="text-xs text-blue-800/80 dark:text-blue-400/80">
                                            Soal yang diselesaikan dalam tempo sangat cepat (&lt; 15 detik). Pastikan ketelitian membaca kalimat jebakan.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Difficulty Breakdown */}
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Target size={16} className="text-indigo-500" />
                                    Akurasi Berdasarkan Tingkat Kesulitan Soal
                                </h3>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                    {stats.difficultyBreakdown.map(diff => (
                                        <div key={diff.difficulty} className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-black uppercase text-slate-700 dark:text-slate-300">
                                                    {diff.difficulty}
                                                </span>
                                                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                                                    {diff.accuracy}%
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-2">
                                                <div 
                                                    className="h-full bg-indigo-600 rounded-full" 
                                                    style={{ width: `${diff.accuracy}%` }}
                                                />
                                            </div>
                                            <span className="text-xs text-slate-400">
                                                {diff.correct} Benar dari {diff.total} Soal
                                            </span>
                                        </div>
                                    ))}
                                    {stats.difficultyBreakdown.length === 0 && (
                                        <div className="col-span-full text-center py-6 text-slate-400 text-xs">
                                            Belum ada data tingkat kesulitan soal.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 6: EDIT PROFIL DETAIL */}
                    {activeTab === 'edit_profil' && (
                        <form onSubmit={handleSaveProfile} className="space-y-6 max-w-2xl mx-auto animate-fade-in">
                            {saveFeedback && (
                                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
                                    <CheckCircle2 size={16} />
                                    {saveFeedback}
                                </div>
                            )}

                            {/* Avatar Preset Selection */}
                            <div>
                                <label className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2 block">
                                    Pilih Karakter Avatar Anda
                                </label>
                                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                                    {AVATAR_PRESETS.map(preset => (
                                        <button
                                            type="button"
                                            key={preset.id}
                                            onClick={() => setFormData({ ...formData, avatarPreset: preset.id })}
                                            className={`p-2 rounded-2xl flex flex-col items-center gap-1 border-2 transition ${
                                                formData.avatarPreset === preset.id
                                                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 scale-105 shadow-md'
                                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                        >
                                            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${preset.bg} flex items-center justify-center text-xl shadow-xs`}>
                                                {preset.emoji}
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 text-center truncate w-full">
                                                {preset.name.split(' ')[0]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Username & Bio */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Nama Pengguna / Lengkap *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.username}
                                        onChange={e => setFormData({ ...formData, username: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Nama Anda"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Jalur Ujian Utama
                                    </label>
                                    <select
                                        value={formData.targetCategory}
                                        onChange={e => setFormData({ ...formData, targetCategory: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    >
                                        <option value="SKD">SKD CPNS / Kedinasan</option>
                                        <option value="UTBK">UTBK-SNBT (TPS & Literasi)</option>
                                        <option value="TPA">TPA Bappenas & TBI</option>
                                        <option value="PSIKOTEST">Psikotest Kedinasan / Kerja</option>
                                    </select>
                                </div>
                            </div>

                            {/* Target Instansi & Target Nilai */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Target Instansi / Kampus Impian
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.targetInstitution}
                                        onChange={e => setFormData({ ...formData, targetInstitution: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Contoh: Kemenkeu, PKN STAN, UGM, IPDN"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Target Skor Poin
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.targetScore}
                                        onChange={e => setFormData({ ...formData, targetScore: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Contoh: 450 atau 700"
                                    />
                                </div>
                            </div>

                            {/* Asal Sekolah / Kampus & Domisili */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Asal SMA / Universitas
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.institutionOrigin}
                                        onChange={e => setFormData({ ...formData, institutionOrigin: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Contoh: SMAN 1 Jakarta / UI"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                        Kota / Domisili
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.provinceOrCity}
                                        onChange={e => setFormData({ ...formData, provinceOrCity: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Contoh: Surabaya, Jawa Timur"
                                    />
                                </div>
                            </div>

                            {/* Bio / Motto */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Bio / Moto Belajar
                                </label>
                                <textarea
                                    rows={2}
                                    value={formData.bio}
                                    onChange={e => setFormData({ ...formData, bio: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Tuliskan komitmen atau kutipan motivasi belajar Anda..."
                                />
                            </div>

                            {/* Custom Photo URL (Optional) */}
                            <div>
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                                    Custom URL Foto Profil (Opsional)
                                </label>
                                <input
                                    type="url"
                                    value={formData.photoURL}
                                    onChange={e => setFormData({ ...formData, photoURL: e.target.value })}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://example.com/foto-profil.jpg"
                                />
                            </div>

                            {/* Submit Button */}
                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition active:scale-[0.99] disabled:opacity-50"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            Menyimpan Perubahan...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={16} />
                                            Simpan Profil & Target Belajar
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};
