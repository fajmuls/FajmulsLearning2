
import { GamificationProfile, TestHistoryItem, UserAnswer, Achievement } from '../types';
import { LEVEL_TITLES, ACHIEVEMENTS_LIST } from '../constants';

export const INITIAL_GAMIFICATION_PROFILE: GamificationProfile = {
    xp: 0,
    level: 1,
    streak: 0,
    lastActiveDate: '',
    unlockedAchievements: []
};

// Calculate XP for a session
export const calculateSessionXP = (
    score: number, 
    answers: UserAnswer[], 
    isSimulation: boolean, 
    category: string
): number => {
    let xp = 0;

    // Base XP from correct answers
    const correctCount = answers.filter(a => a.isCorrect).length;
    xp += correctCount * 10; 

    // Bonus for perfect score
    if (answers.length > 0 && correctCount === answers.length) {
        xp += 50;
    }

    // Bonus for Simulation
    if (isSimulation) {
        xp += 100;
        // Bonus for passing score (if applicable)
        // Hardcoded thresholds for simplicity
        if (category === 'SKD' && score >= 350) xp += 100;
        if (category === 'UTBK' && score >= 600) xp += 100;
    }

    return xp;
};

// Calculate Level based on XP
// Formula: Level = floor(sqrt(XP / 100)) + 1
// XP required for level N = 100 * (N-1)^2
export const calculateLevel = (xp: number): number => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
};

// Get XP required for next level
export const getNextLevelXP = (level: number): number => {
    return 100 * Math.pow(level, 2);
};

// Get Title for current level
export const getLevelTitle = (level: number): string => {
    // Find the highest threshold less than or equal to current level
    const titleObj = [...LEVEL_TITLES].reverse().find(t => level >= t.level);
    return titleObj ? titleObj.title : LEVEL_TITLES[0].title;
};

// Check and Update Streak
export const updateStreak = (currentProfile: GamificationProfile): GamificationProfile => {
    const now = new Date();
    const getLocalDateStr = (d: Date) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    
    const today = getLocalDateStr(now);
    const lastActive = currentProfile.lastActiveDate;

    // Handle initialization or very old accounts safely
    if (lastActive === today && currentProfile.streak > 0) {
        return currentProfile; // Already active today with a valid streak
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = getLocalDateStr(yesterday);

    let newStreak = currentProfile.streak;

    if (lastActive === yesterdayStr) {
        newStreak += 1;
    } else if (lastActive === today) {
        // Fallback for cases where streak somehow became 0 despite lastActive being today
        newStreak = Math.max(1, newStreak);
    } else {
        newStreak = 1; // Reset streak
    }

    return {
        ...currentProfile,
        streak: newStreak,
        lastActiveDate: today
    };
};

// Check for new achievements
export const checkNewAchievements = (
    currentProfile: GamificationProfile,
    history: TestHistoryItem[]
): Achievement[] => {
    const unlockedIds = new Set(currentProfile.unlockedAchievements);
    const newUnlockeds: Achievement[] = [];

    ACHIEVEMENTS_LIST.forEach(achievement => {
        if (!unlockedIds.has(achievement.id)) {
            if (achievement.condition && achievement.condition(history, currentProfile)) {
                newUnlockeds.push(achievement);
            }
        }
    });

    return newUnlockeds;
};
