
import React, { useState, useEffect, useRef } from 'react';
import { User, Shield, Zap, Search, UserPlus, Trash2, ArrowLeft, BarChart2, Award, Users, CheckCircle, XCircle, Bell, Activity, Clock, Edit2, Camera, Save, Loader2, GitCompare, Menu, Trophy } from 'lucide-react';
import { UserProfile, FriendProfile, TestHistoryItem, CategoryType, FriendRequest } from '../types';
import * as FirebaseService from '../services/firebase';
import { getNextLevelXP, getLevelTitle } from '../services/gamificationService';
import { SoundManager } from '../services/soundService';

interface SocialHubProps {
    userProfile: UserProfile;
    history: TestHistoryItem[];
    onBack: () => void;
    onUpdateProfile: (data: { username?: string, photoURL?: string }) => Promise<void>;
}

export const SocialHub: React.FC<SocialHubProps> = ({ userProfile, history, onBack, onUpdateProfile }) => {
    const [activeTab, setActiveTab] = useState<'PROFILE' | 'FRIENDS' | 'REQUESTS'>('PROFILE');
    const [friends, setFriends] = useState<FriendProfile[]>([]);
    const [requests, setRequests] = useState<FriendRequest[]>([]);
    const [searchResults, setSearchResults] = useState<FriendProfile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Comparison State
    const [compareFriend, setCompareFriend] = useState<FriendProfile | null>(null);
    const [compareStats, setCompareStats] = useState<any>(null); // Remote stats

    // Edit Profile State
    const [isEditing, setIsEditing] = useState(false);
    const [newUsername, setNewUsername] = useState(userProfile.username);
    const [newPhoto, setNewPhoto] = useState<string | null>(null);
    const [saveLoading, setSaveLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (activeTab === 'FRIENDS' || activeTab === 'REQUESTS') {
            loadFriendsAndRequests();
        }
    }, [activeTab]);

    const loadFriendsAndRequests = async () => {
        if (!userProfile.uid) return;
        setLoading(true);
        try {
            const fList = await FirebaseService.getFriendsList(userProfile.uid);
            setFriends(fList);
            const rList = await FirebaseService.getFriendRequests(userProfile.uid);
            setRequests(rList);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    // --- PROFILE EDITING ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { alert("Ukuran file maksimal 2MB"); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (!ctx) return;
                    const maxSize = 200;
                    let w = img.width, h = img.height;
                    if (w > h) { if (w > maxSize) { h *= maxSize/w; w = maxSize; } }
                    else { if (h > maxSize) { w *= maxSize/h; h = maxSize; } }
                    canvas.width = w; canvas.height = h;
                    ctx.drawImage(img, 0, 0, w, h);
                    setNewPhoto(canvas.toDataURL('image/jpeg', 0.8));
                };
                img.src = ev.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        setSaveLoading(true);
        try {
            const updates: any = {};
            if (newUsername !== userProfile.username) updates.username = newUsername;
            if (newPhoto) updates.photoURL = newPhoto;
            if (Object.keys(updates).length > 0) await onUpdateProfile(updates);
            setIsEditing(false);
            setNewPhoto(null);
        } catch (e) { alert("Gagal menyimpan profil."); } 
        finally { setSaveLoading(false); }
    };

    // --- FRIENDS LOGIC ---
    const handleSearch = async () => {
        if (searchQuery.length < 3) return;
        setLoading(true);
        try {
            const results = await FirebaseService.searchUsers(searchQuery);
            const friendIds = new Set(friends.map(f => f.uid));
            setSearchResults(results.filter(u => u.uid !== userProfile.uid && !friendIds.has(u.uid)));
        } catch (e) { console.error(e); } 
        finally { setLoading(false); }
    };

    const handleSendRequest = async (target: FriendProfile) => {
        try {
            await FirebaseService.sendFriendRequest({
                uid: userProfile.uid,
                username: userProfile.username,
                photoURL: userProfile.photoURL || undefined,
                level: userProfile.gamification?.level || 1
            }, target.uid);
            alert("Permintaan pertemanan dikirim!");
            setSearchResults(prev => prev.filter(p => p.uid !== target.uid));
        } catch (e) { alert("Gagal mengirim request."); }
    };

    const handleAcceptRequest = async (req: FriendRequest) => {
        try {
            await FirebaseService.acceptFriendRequest(userProfile.uid, {
                uid: userProfile.uid, username: userProfile.username, 
                photoURL: userProfile.photoURL || undefined, level: userProfile.gamification?.level || 1
            }, req);
            loadFriendsAndRequests();
        } catch(e) { alert("Error accepting"); }
    };

    const handleRejectRequest = async (req: FriendRequest) => {
        try {
            await FirebaseService.rejectFriendRequest(userProfile.uid, req.fromUid);
            setRequests(prev => prev.filter(r => r.id !== req.id));
        } catch(e) { alert("Error rejecting"); }
    };

    const handleRemoveFriend = async (friendUid: string) => {
        if (!window.confirm("Hapus teman ini?")) return;
        try {
            await FirebaseService.removeFriend(userProfile.uid, friendUid);
            setFriends(prev => prev.filter(f => f.uid !== friendUid));
        } catch (e) {
            alert("Gagal menghapus teman.");
        }
    };

    const getStatus = (lastActive?: string) => {
        if (!lastActive) return 'offline';
        const diff = Date.now() - new Date(lastActive).getTime();
        return diff < 15 * 60 * 1000 ? 'online' : 'offline'; 
    };

    const handleCompare = async (friend: FriendProfile) => {
        setLoading(true);
        try {
            const fHistory = await FirebaseService.getUserHistoryFromCloud(friend.uid);
            const stats = {
                utbk: Math.max(0, ...fHistory.filter(h => h.category === 'UTBK').map(h => h.score)),
                skd: Math.max(0, ...fHistory.filter(h => h.category === 'SKD').map(h => h.score)),
                tpa: Math.max(0, ...fHistory.filter(h => h.category === 'TPA').map(h => h.score)),
                psikotest: Math.max(0, ...fHistory.filter(h => h.category === 'PSIKOTEST').map(h => h.score)),
                kecermatan: Math.max(0, ...fHistory.filter(h => h.category === 'KECERMATAN').map(h => h.score)),
                benchmark: Math.max(0, ...fHistory.filter(h => h.category === 'BENCHMARK').map(h => h.score))
            };
            setCompareStats(stats);
            setCompareFriend(friend);
        } catch(e) { alert("Gagal mengambil data teman."); }
        finally { setLoading(false); }
    };

    // Stats Calculation
    const getBestScore = (cat: CategoryType) => {
        const catHistory = history.filter(h => h.category === cat);
        if (catHistory.length === 0) return 0;
        return Math.max(...catHistory.map(h => h.score));
    };

    // XP Calc
    const currentXP = userProfile.gamification?.xp || 0;
    const currentLevel = userProfile.gamification?.level || 1;
    const nextLevelXP = getNextLevelXP(currentLevel);
    const prevLevelXP = getNextLevelXP(currentLevel - 1);
    const xpProgress = Math.min(100, Math.max(0, ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100));

    // --- RENDER COMPARISON ---
    if (compareFriend && compareStats) {
        return (
            <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col p-6 overflow-y-auto">
                <div className="flex items-center mb-8">
                    <button onClick={() => setCompareFriend(null)} className="p-2 bg-white/10 rounded-full text-white mr-4"><ArrowLeft/></button>
                    <h2 className="text-2xl font-bold text-white">Duel Stats</h2>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-8 text-center text-white">
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-indigo-500 mb-2 overflow-hidden border-4 border-indigo-400 shadow-lg shadow-indigo-500/30">
                            {userProfile.photoURL ? <img src={userProfile.photoURL} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-3xl font-bold">{userProfile.username[0]}</span>}
                        </div>
                        <span className="font-bold truncate w-full text-lg">{userProfile.username}</span>
                    </div>
                    <div className="flex items-center justify-center">
                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                            <GitCompare size={24} className="text-white"/>
                        </div>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 rounded-full bg-rose-500 mb-2 overflow-hidden border-4 border-rose-400 shadow-lg shadow-rose-500/30">
                            {compareFriend.photoURL ? <img src={compareFriend.photoURL} className="w-full h-full object-cover"/> : <span className="flex items-center justify-center h-full text-3xl font-bold">{compareFriend.username[0]}</span>}
                        </div>
                        <span className="font-bold truncate w-full text-lg">{compareFriend.username}</span>
                    </div>
                </div>

                <div className="space-y-4 max-w-2xl mx-auto w-full">
                    {[
                        { label: 'UTBK SNBT', key: 'utbk', myScore: getBestScore('UTBK'), friendScore: compareStats.utbk },
                        { label: 'SKD CPNS', key: 'skd', myScore: getBestScore('SKD'), friendScore: compareStats.skd },
                        { label: 'TPA & TBI', key: 'tpa', myScore: getBestScore('TPA'), friendScore: compareStats.tpa },
                        { label: 'Psikotes', key: 'psikotest', myScore: getBestScore('PSIKOTEST'), friendScore: compareStats.psikotest },
                        { label: 'Kecermatan', key: 'kecermatan', myScore: getBestScore('KECERMATAN'), friendScore: compareStats.kecermatan },
                        { label: 'Benchmark', key: 'benchmark', myScore: getBestScore('BENCHMARK'), friendScore: compareStats.benchmark },
                    ].map((stat) => (
                        <div key={stat.key} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 backdrop-blur-sm">
                            <div className="text-center text-slate-400 text-xs font-bold uppercase mb-3 tracking-widest">{stat.label}</div>
                            <div className="flex justify-between items-center text-xl font-black">
                                <span className={stat.myScore > stat.friendScore ? 'text-indigo-400' : 'text-slate-500'}>{stat.myScore}</span>
                                <div className="h-2 flex-1 mx-4 bg-slate-700 rounded-full overflow-hidden relative">
                                    <div 
                                        className={`h-full absolute left-0 top-0 bottom-0 transition-all duration-1000 ${stat.myScore > stat.friendScore ? 'bg-indigo-500' : 'bg-rose-500'}`} 
                                        style={{width: `${(stat.myScore / ((stat.myScore + stat.friendScore) || 1)) * 100}%`}}
                                    ></div>
                                </div>
                                <span className={stat.friendScore > stat.myScore ? 'text-rose-400' : 'text-slate-500'}>{stat.friendScore}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f0f4f8] dark:bg-[#0f172a] relative overflow-hidden transition-colors font-sans">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-indigo-200 via-purple-200 to-pink-200 dark:from-indigo-900/40 dark:via-purple-900/40 dark:to-pink-900/40 blur-3xl opacity-50 pointer-events-none"></div>
            
            <div className="relative z-10 max-w-5xl mx-auto px-4 md:px-6 py-2 md:py-6">
                
                {/* 1. Header Bar */}
                <div className="flex items-center justify-between mb-8">
                    <button onClick={onBack} className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-bold bg-white/50 dark:bg-slate-800/50 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/20">
                        <ArrowLeft size={18}/> Back
                    </button>
                    
                    <div className="flex items-center gap-1 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md p-1 rounded-full shadow-sm border border-white/20">
                        <button onClick={() => setActiveTab('PROFILE')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'PROFILE' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Profile</button>
                        <button onClick={() => setActiveTab('FRIENDS')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'FRIENDS' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>My Friends</button>
                        <button onClick={() => setActiveTab('REQUESTS')} className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTab === 'REQUESTS' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                            Requests {requests.length > 0 && <span className="ml-1 text-rose-500">•</span>}
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-sm text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition border border-white/20"><Bell size={20}/></button>
                        <button className="p-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-full shadow-sm text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 transition border border-white/20"><Menu size={20}/></button>
                    </div>
                </div>

                {activeTab === 'PROFILE' && (
                    <div className="animate-fade-in-up space-y-6">
                        
                        {/* 2. Main Profile Card (Glassmorphism) */}
                        <div className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/40 dark:border-white/10">
                            {/* Glass Background */}
                            <div className="absolute inset-0 bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl"></div>
                            
                            <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
                                {/* Avatar */}
                                <div className="relative group cursor-pointer" onClick={() => isEditing && fileInputRef.current?.click()}>
                                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full p-1 bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg">
                                        <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-900 relative">
                                            {(newPhoto || userProfile.photoURL) ? (
                                                <img src={newPhoto || userProfile.photoURL!} className="w-full h-full object-cover" alt="Avatar"/>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-slate-300">{userProfile.username?.[0]}</div>
                                            )}
                                            {isEditing && <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white"><Camera/></div>}
                                        </div>
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1.5 rounded-full font-bold text-sm shadow-md border-2 border-white dark:border-slate-800">
                                        Lvl {currentLevel}
                                    </div>
                                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange}/>
                                </div>

                                {/* Info */}
                                <div className="flex-1 text-center md:text-left w-full">
                                    <div className="flex flex-col md:flex-row items-center justify-between mb-2">
                                        {isEditing ? (
                                            <input value={newUsername} onChange={e => setNewUsername(e.target.value)} className="text-3xl font-black bg-white/50 dark:bg-slate-900/50 p-2 rounded-xl border border-slate-300 dark:border-slate-600 outline-none w-full md:w-auto" autoFocus/>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-3xl md:text-4xl font-black text-slate-800 dark:text-white tracking-tight">{userProfile.username}</h2>
                                                <button onClick={() => setIsEditing(true)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition"><Edit2 size={16}/></button>
                                            </div>
                                        )}
                                        {isEditing && (
                                            <div className="flex gap-2 mt-4 md:mt-0">
                                                <button onClick={handleSaveProfile} disabled={saveLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-indigo-700">{saveLoading && <Loader2 className="animate-spin" size={14}/>} Save</button>
                                                <button onClick={() => setIsEditing(false)} className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-sm hover:bg-slate-300">Cancel</button>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 dark:text-slate-300 font-medium mb-6">
                                        <Shield size={16} className="text-indigo-500"/>
                                        <span>{userProfile.isGuest ? 'Guest Account' : 'Verified Student'}</span>
                                    </div>

                                    {/* XP Bar */}
                                    <div className="w-full bg-white/50 dark:bg-slate-900/50 rounded-full h-6 p-1 backdrop-blur-sm border border-white/20 dark:border-white/5 relative">
                                        <div className="h-full rounded-full bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 relative overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.5)] transition-all duration-1000" style={{ width: `${xpProgress}%` }}>
                                            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                                        </div>
                                        <div className="absolute top-0 right-0 -mt-8 text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded-lg backdrop-blur-md shadow-sm">
                                            {currentXP} / {nextLevelXP} XP
                                        </div>
                                        <div className="absolute top-1/2 left-3 transform -translate-y-1/2 text-[10px] font-black text-white mix-blend-overlay uppercase tracking-widest pointer-events-none">
                                            {Math.round(xpProgress)}% to Lvl {currentLevel + 1}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. Performance Stats Grid */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-4 flex items-center gap-2 px-2">
                                <BarChart2 size={20} className="text-indigo-500"/> Performance Stats
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { label: 'BEST UTBK', score: getBestScore('UTBK'), icon: GraduationCap, color: 'text-rose-500', bg: 'bg-rose-500/10' },
                                    { label: 'BEST SKD', score: getBestScore('SKD'), icon: Shield, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                                    { label: 'BEST TPA & TBI', score: getBestScore('TPA'), icon: Zap, color: 'text-purple-500', bg: 'bg-purple-500/10' },
                                    { label: 'BEST PSIKOTES', score: getBestScore('PSIKOTEST'), icon: Brain, color: 'text-pink-500', bg: 'bg-pink-500/10' },
                                    { label: 'BEST KECERMATAN', score: getBestScore('KECERMATAN'), icon: Eye, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                    { label: 'BEST BENCHMARK', score: getBestScore('BENCHMARK'), icon: Activity, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                    { label: 'TOTAL BATTLES', score: userProfile.gamification?.battlesPlayed || 0, icon: Users, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                                    { label: 'BATTLE WIN RATE', score: `${userProfile.gamification?.battlesPlayed ? Math.round(((userProfile.gamification.battlesWon||0)/userProfile.gamification.battlesPlayed)*100) : 0}%`, icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
                                ].map((stat, i) => {
                                    const Icon = stat.icon;
                                    return (
                                        <div key={i} className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-5 rounded-2xl border border-white/40 dark:border-white/5 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className={`p-2 rounded-xl ${stat.bg} ${stat.color}`}>
                                                    <Icon size={20}/>
                                                </div>
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{stat.label}</div>
                                            <div className="text-2xl font-black text-slate-800 dark:text-white">{stat.score}</div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- OTHER TABS (Simpler Layouts) --- */}
                
                {activeTab === 'FRIENDS' && (
                    <div className="animate-fade-in-up">
                        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-6 rounded-3xl border border-white/40 dark:border-white/5 shadow-sm mb-8">
                            <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Search size={16}/> Find Friends</h3>
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Username..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                    className="flex-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                                <button onClick={handleSearch} className="px-6 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition">Search</button>
                            </div>
                            
                            {searchResults.length > 0 && (
                                <div className="mt-4 space-y-2">
                                    {searchResults.map(user => (
                                        <div key={user.uid} className="flex justify-between items-center p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <div className="font-bold text-slate-700 dark:text-slate-200">{user.username}</div>
                                            <button onClick={() => handleSendRequest(user)} className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-emerald-200 transition">
                                                <UserPlus size={14}/> Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            {friends.length === 0 ? (
                                <div className="text-center py-20 text-slate-400 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <Users size={48} className="mx-auto mb-4 opacity-50"/>
                                    <p>You haven't added any friends yet.</p>
                                </div>
                            ) : (
                                friends.map(friend => {
                                    const status = getStatus(friend.lastActive);
                                    return (
                                        <div key={friend.uid} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-4 rounded-2xl border border-white/40 dark:border-white/5 flex justify-between items-center shadow-sm hover:shadow-md transition">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-full flex items-center justify-center font-bold text-white overflow-hidden shadow-sm">
                                                        {friend.photoURL ? <img src={friend.photoURL} className="w-full h-full object-cover"/> : friend.username[0]}
                                                    </div>
                                                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-800 ${status === 'online' ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                </div>
                                                <div>
                                                    <div className="font-bold text-slate-800 dark:text-white text-lg">{friend.username}</div>
                                                    <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
                                                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">Lvl {friend.level}</span> 
                                                        <span className={status === 'online' ? 'text-emerald-500' : 'text-slate-400'}>{status === 'online' ? 'Online' : 'Offline'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleCompare(friend)} className="p-2.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition" title="Compare Stats">
                                                    <GitCompare size={18}/>
                                                </button>
                                                <button disabled={status !== 'online'} className="px-4 py-2 bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 rounded-xl font-bold text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-rose-100 transition">
                                                    <Zap size={14}/> Duel
                                                </button>
                                                <button onClick={() => handleRemoveFriend(friend.uid)} className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition">
                                                    <Trash2 size={18}/>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'REQUESTS' && (
                    <div className="space-y-3 animate-fade-in-up">
                        {requests.length === 0 ? (
                            <div className="text-center py-20 text-slate-400 bg-white/40 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700">
                                <Bell size={48} className="mx-auto mb-4 opacity-50"/>
                                <p>No new friend requests.</p>
                            </div>
                        ) : (
                            requests.map(req => (
                                <div key={req.id} className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center font-bold text-indigo-600">
                                            {req.fromPhotoURL ? <img src={req.fromPhotoURL} className="w-full h-full rounded-full object-cover"/> : req.fromUsername[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 dark:text-white">{req.fromUsername}</div>
                                            <div className="text-xs text-slate-500">Level {req.fromLevel}</div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleAcceptRequest(req)} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-bold hover:bg-emerald-600 transition shadow-lg shadow-emerald-200 dark:shadow-none">Accept</button>
                                        <button onClick={() => handleRejectRequest(req)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-200 transition">Decline</button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// Icons needed for Stats
import { GraduationCap, Brain, Eye } from 'lucide-react';
