
import React, { useState } from 'react';
import { Flame, Star, Trophy, X, Lock, Footprints, Zap, Crosshair, Activity, Eye, Moon, Layers, ChevronRight } from 'lucide-react';
import { GamificationProfile, Achievement } from '../types';
import { getLevelTitle, getNextLevelXP } from '../services/gamificationService';
import { ACHIEVEMENTS_LIST } from '../constants';
import { SoundManager } from '../services/soundService';

// --- ICONS MAPPING ---
const IconMap: Record<string, any> = {
    Footprints, Flame, Zap, Crosshair, Activity, Eye, Moon, Layers, Trophy
};

// 1. GAMIFICATION BAR (Header)
export const GamificationBar: React.FC<{ 
    profile: GamificationProfile,
    onOpenAchievements: () => void 
}> = ({ profile, onOpenAchievements }) => {
    const nextLevelXP = getNextLevelXP(profile.level);
    const prevLevelXP = getNextLevelXP(profile.level - 1);
    const levelProgress = ((profile.xp - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100;
    const title = getLevelTitle(profile.level);

    return (
        <div className="flex items-center gap-2 sm:gap-3 bg-white dark:bg-slate-800 p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm animate-fade-in-down w-auto overflow-hidden">
            {/* Streak */}
            <div className="flex items-center gap-1 px-2 sm:px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg border border-orange-100 dark:border-orange-800">
                <Flame size={16} className="fill-orange-500 animate-pulse"/>
                <span className="font-black text-sm">{profile.streak}</span>
            </div>

            {/* Level & XP */}
            <div className="hidden sm:flex flex-1 flex-col justify-center min-w-[100px]">
                <div className="flex justify-between items-end mb-1">
                    <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                        Lvl {profile.level}: {title}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                        {profile.xp} / {nextLevelXP} XP
                    </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out" 
                        style={{ width: `${Math.min(100, Math.max(0, levelProgress))}%` }}
                    ></div>
                </div>
            </div>

            {/* Achievements Button */}
            <button 
                onClick={onOpenAchievements}
                className="hidden sm:block p-2 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition border border-yellow-100 dark:border-yellow-800"
            >
                <Trophy size={18} />
            </button>
        </div>
    );
};

// 2. ACHIEVEMENTS MODAL
export const AchievementsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    profile: GamificationProfile;
}> = ({ isOpen, onClose, profile }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-white dark:bg-slate-800 z-10 py-2">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Trophy className="text-yellow-500 fill-yellow-500"/> Pencapaian
                        </h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Terkumpul: {profile.unlockedAchievements.length} / {ACHIEVEMENTS_LIST.length}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500"><X size={24}/></button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {ACHIEVEMENTS_LIST.map(ach => {
                        const isUnlocked = profile.unlockedAchievements.includes(ach.id);
                        const Icon = IconMap[ach.icon] || Trophy;

                        return (
                            <div key={ach.id} className={`p-4 rounded-2xl border-2 flex items-center gap-4 transition-all ${isUnlocked ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 opacity-60 grayscale'}`}>
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isUnlocked ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-md' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                    {isUnlocked ? <Icon size={24} /> : <Lock size={20}/>}
                                </div>
                                <div>
                                    <h3 className={`font-bold ${isUnlocked ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>{ach.title}</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mb-1">{ach.description}</p>
                                    <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                        +{ach.xpReward} XP
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

// 3. LEVEL UP MODAL
export const LevelUpModal: React.FC<{
    newLevel: number;
    onClose: () => void;
}> = ({ newLevel, onClose }) => {
    return (
        <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-fade-in" onClick={onClose}>
            <div className="text-center relative">
                <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                <Star size={120} className="text-yellow-400 fill-yellow-400 mx-auto mb-6 animate-bounce-slow drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]" />
                <h2 className="text-5xl font-black text-white mb-2 tracking-tight animate-scale-up">LEVEL UP!</h2>
                <div className="text-2xl font-bold text-indigo-300 mb-8">Level {newLevel}: {getLevelTitle(newLevel)}</div>
                <button onClick={onClose} className="px-10 py-4 bg-white text-indigo-900 rounded-full font-bold text-lg hover:scale-105 transition shadow-xl">
                    Lanjut Belajar
                </button>
            </div>
        </div>
    );
};

// 4. ACHIEVEMENT TOAST
export const AchievementToast: React.FC<{
    achievement: Achievement;
    onClose: () => void;
}> = ({ achievement, onClose }) => {
    const Icon = IconMap[achievement.icon] || Trophy;
    
    // Auto close after 4s
    React.useEffect(() => {
        const timer = setTimeout(onClose, 4000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-[100] bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-yellow-500/30 flex items-center gap-4 animate-slide-up w-max max-w-[90vw]">
            <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center shrink-0 text-slate-900 animate-pulse">
                <Icon size={24} />
            </div>
            <div>
                <div className="text-xs font-bold text-yellow-400 uppercase tracking-wider mb-0.5">Achievement Unlocked!</div>
                <div className="font-bold text-lg">{achievement.title}</div>
                <div className="text-xs text-slate-400">+{achievement.xpReward} XP</div>
            </div>
        </div>
    );
};
