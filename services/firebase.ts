
import * as firebaseApp from 'firebase/app';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, query, where, getDocs, setDoc, doc, deleteDoc, getDoc, updateDoc, orderBy, limit, onSnapshot, serverTimestamp, setLogLevel } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User, onAuthStateChanged, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { GlobalBenchmarkScore, BenchmarkMode, StaticTestPackage, TestHistoryItem, SavedSessionState, GlobalLeaderboardEntry, CategoryType, GamificationProfile, BattleState, FriendProfile, Question, FriendRequest, UserProfile } from "../types";
import { INITIAL_GAMIFICATION_PROFILE } from './gamificationService';

import firebaseConfig from '../firebase-applet-config.json';
import { ADMIN_EMAILS } from '../constants';

// Inisialisasi Firebase
setLogLevel('silent'); // Prevent offline errors from triggering testing failure
const app = (firebaseApp as any).initializeApp(firebaseConfig);

let db: any;
try {
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    }, (firebaseConfig as any).firestoreDatabaseId);
    console.log("Firestore initialized with persistent local cache enabled.");
} catch (err) {
    console.warn("Firestore initializeFirestore with localCache failed, falling back to getFirestore", err);
    db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId);
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

console.log("Firebase Service Initialized for:", firebaseConfig.projectId);

// COLLECTION NAMES
const BENCHMARK_COLLECTION = 'benchmark_scores';
const GLOBAL_LEADERBOARD_COLLECTION = 'global_leaderboard';
const PACKAGES_COLLECTION = 'test_packages';
const USERS_COLLECTION = 'users';
const BATTLES_COLLECTION = 'battles';

// --- AUTHENTICATION & USER MANAGEMENT ---

export const subscribeToAuth = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
};

export const isUserAdmin = (user: User | UserProfile | null | any): boolean => {
    if (!user) return false;
    const email = (user as any).email;
    return !!email && (ADMIN_EMAILS.includes(email) || email.endsWith('@fajmuls.com'));
};

export const signInWithGoogle = async (rememberMe: boolean = true) => {
    try {
        await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
        const result = await signInWithPopup(auth, googleProvider);
        return result.user;
    } catch (error: any) {
        console.error("Error signing in with Google", error);
        
        if (error.code === 'auth/unauthorized-domain') {
            const domain = window.location.hostname;
            throw new Error(`Domain belum terotorisasi di Firebase Console. \n\nSilakan tambahkan domain berikut ke 'Authorized Domains' di Firebase Console (Authentication > Settings): \n- ${domain}`);
        }
        
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Error signing out", error);
    }
};

export const saveUserSettings = async (uid: string, settings: any) => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    await updateDoc(docRef, { settings });
};

// Cek apakah username sudah dipakai orang lain
export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
    // Check against the lowercase version to ensure uniqueness regardless of case
    const q = query(collection(db, USERS_COLLECTION), where("username_lowercase", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
};

// Ambil data profil user dari Firestore
export const getUserProfile = async (uid: string) => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        const data = docSnap.data();
        // Backward compatibility: If gamification missing, merge initial
        if (!data.gamification) {
            return { ...data, gamification: INITIAL_GAMIFICATION_PROFILE };
        }
        return data;
    } else {
        return null; // User baru belum punya profil di DB
    }
};

// Simpan/Update data user (saat setup awal atau ganti nama)
export const saveUserProfile = async (uid: string, data: { username: string, email: string, photoURL?: string }) => {
    const docRef = doc(db, USERS_COLLECTION, uid);
    // Use setDoc with merge to preserve existing gamification data if present
    await setDoc(docRef, {
        ...data,
        username_lowercase: data.username.toLowerCase(),
        lastLogin: new Date().toISOString()
    }, { merge: true });
    
    // Ensure gamification structure exists
    const snap = await getDoc(docRef);
    if (snap.exists() && !snap.data().gamification) {
        await updateDoc(docRef, { gamification: INITIAL_GAMIFICATION_PROFILE });
    }
};

// Update Gamification Data
export const updateGamificationProfile = async (uid: string, gamification: GamificationProfile) => {
    try {
        await updateDoc(doc(db, USERS_COLLECTION, uid), {
            gamification: gamification
        });
    } catch (e) {
        console.error("Error updating gamification", e);
    }
};

// Update username saja
export const updateUsername = async (uid: string, newUsername: string) => {
    const isAvailable = await checkUsernameAvailability(newUsername);
    if (!isAvailable) {
        throw new Error("Username sudah dipakai.");
    }
    
    await updateDoc(doc(db, USERS_COLLECTION, uid), {
        username: newUsername,
        username_lowercase: newUsername.toLowerCase()
    });
};

// Update Profile (Username & Photo)
export const updateUserProfile = async (uid: string, data: { username?: string, photoURL?: string }) => {
    const updates: any = {};
    
    if (data.username) {
        updates.username = data.username;
        updates.username_lowercase = data.username.toLowerCase();
    }
    
    if (data.photoURL !== undefined) {
        updates.photoURL = data.photoURL;
    }
    
    await updateDoc(doc(db, USERS_COLLECTION, uid), updates);
};

// --- HELPER FOR SAFE OBJECT SERIALIZATION ---
const deepClean = (obj: any) => {
    const seen = new WeakSet();
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) {
                return; // Circular reference detected
            }
            seen.add(value);
        }
        if (value === undefined) return; // JSON.stringify removes undefined, ensuring explicit removal logic matches
        return value;
    }));
};

// --- ACTIVE SESSION MANAGEMENT (CLOUD SAVE) ---

export const saveSessionToCloud = async (uid: string, sessionData: SavedSessionState) => {
    try {
        const sessionId = sessionData.timestamp ? `sess-${sessionData.timestamp}` : `sess-${Date.now()}`;
        const cleanData = deepClean(sessionData);
        await setDoc(doc(db, USERS_COLLECTION, uid, 'sessions', sessionId), {
            ...cleanData,
            id: sessionId 
        });
        console.log(`Session ${sessionId} saved to cloud`);
    } catch (e) {
        console.error("Error saving session to cloud", e);
        throw e;
    }
};

export const getSessionFromCloud = async (uid: string): Promise<SavedSessionState | null> => {
    try {
        const q = query(collection(db, USERS_COLLECTION, uid, 'sessions'), orderBy('timestamp', 'desc'), limit(1));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
            const data = snapshot.docs[0].data() as SavedSessionState;
            return { ...data, id: snapshot.docs[0].id };
        }
        return null;
    } catch (e) {
        console.error("Error retrieving session from cloud", e);
        return null;
    }
};

export const getAllSavedSessions = async (uid: string): Promise<SavedSessionState[]> => {
    try {
        const q = query(collection(db, USERS_COLLECTION, uid, 'sessions'), orderBy('timestamp', 'desc'));
        const snapshot = await getDocs(q);
        const sessions: SavedSessionState[] = [];
        snapshot.forEach(doc => {
            sessions.push({ ...doc.data(), id: doc.id } as SavedSessionState);
        });
        return sessions;
    } catch (e) {
        console.error("Error fetching all saved sessions", e);
        return [];
    }
};

export const deleteSavedSession = async (uid: string, sessionId: string) => {
    try {
        await deleteDoc(doc(db, USERS_COLLECTION, uid, 'sessions', sessionId));
        console.log(`Cloud session ${sessionId} deleted`);
    } catch (e) {
        console.error("Error deleting session from cloud", e);
    }
};

export const clearSessionFromCloud = async (uid: string) => {
    console.log("clearSessionFromCloud called - Use deleteSavedSession for specific items");
};

// --- HISTORY SYNC ---

export const saveHistoryToCloud = async (uid: string, item: TestHistoryItem) => {
    try {
        const cleanItem = deepClean(item);
        await setDoc(doc(db, USERS_COLLECTION, uid, 'history', item.id), cleanItem);
        console.log("History saved to cloud");
    } catch (e) {
        console.error("Error saving history to cloud", e);
    }
};

export const getUserHistoryFromCloud = async (uid: string): Promise<TestHistoryItem[]> => {
    try {
        const q = query(collection(db, USERS_COLLECTION, uid, 'history'));
        const querySnapshot = await getDocs(q);
        const history: TestHistoryItem[] = [];
        querySnapshot.forEach((doc) => {
            history.push(doc.data() as TestHistoryItem);
        });
        return history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } catch (e) {
        console.error("Error fetching history from cloud", e);
        return [];
    }
};

export const deleteHistoryFromCloud = async (uid: string, historyId: string) => {
    try {
        await deleteDoc(doc(db, USERS_COLLECTION, uid, 'history', historyId));
    } catch (e) {
        console.error("Error deleting history from cloud", e);
    }
};

// --- GLOBAL LEADERBOARD FUNCTIONS ---

export const saveGlobalScore = async (
    category: CategoryType,
    subCategory: string,
    score: number,
    username: string,
    userId: string,
    packageName?: string
) => {
    if (!userId || userId.startsWith('guest-')) return; 

    const docId = `${category}_${subCategory}_${userId}`;
    const docRef = doc(db, GLOBAL_LEADERBOARD_COLLECTION, docId);

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const currentData = docSnap.data() as GlobalLeaderboardEntry;
            if (score > currentData.score) {
                const updates: any = deepClean({
                    score,
                    packageName: packageName || currentData.packageName, 
                    timestamp: Date.now(),
                    username 
                });
                await updateDoc(docRef, updates);
            }
        } else {
            const newEntry: any = deepClean({
                uid: userId,
                username,
                category,
                subCategory,
                score,
                packageName,
                timestamp: Date.now()
            });
            await setDoc(docRef, newEntry);
        }
    } catch (e) {
        console.error("Error saving to global leaderboard", e);
    }
};

export const getGlobalLeaderboardData = async (
    category: CategoryType, 
    subCategory: string, 
    limitCount: number = 50
): Promise<GlobalLeaderboardEntry[]> => {
    try {
        const q = query(
            collection(db, GLOBAL_LEADERBOARD_COLLECTION),
            where('category', '==', category),
            where('subCategory', '==', subCategory),
            orderBy('score', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(q);
        const data: GlobalLeaderboardEntry[] = [];
        snapshot.forEach(doc => data.push(doc.data() as GlobalLeaderboardEntry));
        return data;
    } catch (e) {
        console.error(`Error fetching leaderboard for ${category}/${subCategory}:`, e);
        return [];
    }
};

export const saveBenchmarkScore = async (
    game: BenchmarkMode, 
    score: number, 
    username: string, 
    unit: string
) => {
    try {
        const cleanData = deepClean({
            game,
            score,
            username,
            unit,
            timestamp: Date.now()
        });
        await addDoc(collection(db, BENCHMARK_COLLECTION), cleanData);
    } catch (e) {
        console.error("Error saving score to Firebase:", e);
    }
};

export const getBenchmarkLeaderboard = async (game: BenchmarkMode, limitCount: number = 5): Promise<GlobalBenchmarkScore[]> => {
    try {
        const isAscending = (game === 'REACTION' || game === 'AIM');
        const q = query(collection(db, BENCHMARK_COLLECTION), where('game', '==', game));
        const querySnapshot = await getDocs(q);
        const rawScores: GlobalBenchmarkScore[] = [];
        querySnapshot.forEach((doc) => {
            rawScores.push({ id: doc.id, ...doc.data() } as GlobalBenchmarkScore);
        });
        rawScores.sort((a, b) => {
            if (isAscending) return a.score - b.score; 
            else return b.score - a.score; 
        });
        const uniqueScores: GlobalBenchmarkScore[] = [];
        const seenUsers = new Set<string>();
        for (const s of rawScores) {
            const userKey = s.username.toLowerCase().trim();
            if (!seenUsers.has(userKey)) {
                uniqueScores.push(s);
                seenUsers.add(userKey);
            }
            if (uniqueScores.length >= limitCount) break;
        }
        return uniqueScores;
    } catch (e) {
        console.error("Error fetching leaderboard from Firebase:", e);
        return [];
    }
};

// --- TEST PACKAGES FUNCTIONS ---

export const saveTestPackage = async (pkg: StaticTestPackage) => {
    try {
        const cleanPkg = deepClean(pkg);
        await setDoc(doc(db, PACKAGES_COLLECTION, pkg.id), cleanPkg);
    } catch (e: any) {
        console.error("Error saving package to Firebase:", e);
        if (e?.message?.includes('Missing or insufficient permissions')) {
            const errInfo = {
                error: e.message,
                operationType: 'write',
                path: `${PACKAGES_COLLECTION}/${pkg.id}`,
                authInfo: {
                    userId: auth.currentUser?.uid,
                    email: auth.currentUser?.email,
                    emailVerified: auth.currentUser?.emailVerified,
                    isAnonymous: auth.currentUser?.isAnonymous,
                    tenantId: auth.currentUser?.tenantId,
                    providerInfo: auth.currentUser?.providerData.map(provider => ({
                        providerId: provider.providerId,
                        displayName: provider.displayName,
                        email: provider.email,
                        photoUrl: provider.photoURL
                    })) || []
                }
            };
            throw new Error(JSON.stringify(errInfo));
        }
        throw e;
    }
};

export const getTestPackages = async (): Promise<StaticTestPackage[]> => {
    try {
        const querySnapshot = await getDocs(collection(db, PACKAGES_COLLECTION));
        const packages: StaticTestPackage[] = [];
        querySnapshot.forEach((doc) => {
            packages.push(doc.data() as StaticTestPackage);
        });
        packages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return packages;
    } catch (e: any) {
        console.error("Error fetching packages from Firebase:", e);
        if (e?.message?.includes('Missing or insufficient permissions')) {
            const errInfo = {
                error: e.message,
                operationType: 'get',
                path: PACKAGES_COLLECTION,
                authInfo: {
                    userId: auth.currentUser?.uid,
                    email: auth.currentUser?.email,
                    emailVerified: auth.currentUser?.emailVerified,
                    isAnonymous: auth.currentUser?.isAnonymous,
                    tenantId: auth.currentUser?.tenantId,
                    providerInfo: auth.currentUser?.providerData.map(provider => ({
                        providerId: provider.providerId,
                        displayName: provider.displayName,
                        email: provider.email,
                        photoUrl: provider.photoURL
                    })) || []
                }
            };
            throw new Error(JSON.stringify(errInfo));
        }
        return [];
    }
};

export const deleteTestPackage = async (packageId: string) => {
    try {
        await deleteDoc(doc(db, PACKAGES_COLLECTION, packageId));
    } catch (e: any) {
        console.error("Error deleting package from Firebase:", e);
        if (e?.message?.includes('Missing or insufficient permissions')) {
            const errInfo = {
                error: e.message,
                operationType: 'delete',
                path: `${PACKAGES_COLLECTION}/${packageId}`,
                authInfo: {
                    userId: auth.currentUser?.uid,
                    email: auth.currentUser?.email,
                    emailVerified: auth.currentUser?.emailVerified,
                    isAnonymous: auth.currentUser?.isAnonymous,
                    tenantId: auth.currentUser?.tenantId,
                    providerInfo: auth.currentUser?.providerData.map(provider => ({
                        providerId: provider.providerId,
                        displayName: provider.displayName,
                        email: provider.email,
                        photoUrl: provider.photoURL
                    })) || []
                }
            };
            throw new Error(JSON.stringify(errInfo));
        }
        throw e;
    }
};

// --- SOCIAL & FRIENDS FUNCTIONS ---

export const searchUsers = async (searchTerm: string): Promise<FriendProfile[]> => {
    if (!searchTerm || searchTerm.length < 3) return [];
    try {
        const q = query(
            collection(db, USERS_COLLECTION),
            where('username_lowercase', '>=', searchTerm.toLowerCase()),
            where('username_lowercase', '<=', searchTerm.toLowerCase() + '\uf8ff'),
            limit(10)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const d = doc.data();
            return {
                uid: doc.id,
                username: d.username,
                photoURL: d.photoURL,
                level: d.gamification?.level || 1,
                lastActive: d.lastLogin
            };
        });
    } catch (e) {
        console.error("Error searching users", e);
        return [];
    }
};

// Send a friend request
export const sendFriendRequest = async (sender: FriendProfile, receiverUid: string) => {
    const requestData: FriendRequest = {
        id: `${sender.uid}_${Date.now()}`,
        fromUid: sender.uid,
        fromUsername: sender.username,
        fromPhotoURL: sender.photoURL,
        fromLevel: sender.level,
        timestamp: Date.now()
    };
    await setDoc(doc(db, USERS_COLLECTION, receiverUid, 'friend_requests', sender.uid), requestData);
};

// Get incoming requests
export const getFriendRequests = async (uid: string): Promise<FriendRequest[]> => {
    const snap = await getDocs(collection(db, USERS_COLLECTION, uid, 'friend_requests'));
    return snap.docs.map(d => d.data() as FriendRequest);
};

// Accept Request
export const acceptFriendRequest = async (myUid: string, myData: FriendProfile, request: FriendRequest) => {
    // 1. Add sender to my friend list
    const friendData: FriendProfile = {
        uid: request.fromUid,
        username: request.fromUsername,
        photoURL: request.fromPhotoURL,
        level: request.fromLevel,
        lastActive: new Date().toISOString() // Placeholder, will update on fetch
    };
    await setDoc(doc(db, USERS_COLLECTION, myUid, 'friends', request.fromUid), friendData);

    // 2. Add me to sender's friend list
    await setDoc(doc(db, USERS_COLLECTION, request.fromUid, 'friends', myUid), myData);

    // 3. Delete request
    await deleteDoc(doc(db, USERS_COLLECTION, myUid, 'friend_requests', request.fromUid));
};

// Reject Request
export const rejectFriendRequest = async (myUid: string, senderUid: string) => {
    await deleteDoc(doc(db, USERS_COLLECTION, myUid, 'friend_requests', senderUid));
};

export const addFriend = async (myUid: string, friendUid: string, friendData: FriendProfile) => {
    try {
        await setDoc(doc(db, USERS_COLLECTION, myUid, 'friends', friendUid), friendData);
    } catch (e) {
        console.error("Error adding friend", e);
        throw e;
    }
};

export const removeFriend = async (myUid: string, friendUid: string) => {
    try {
        await deleteDoc(doc(db, USERS_COLLECTION, myUid, 'friends', friendUid));
        // Optionally remove self from friend's list too
        await deleteDoc(doc(db, USERS_COLLECTION, friendUid, 'friends', myUid));
    } catch (e) {
        console.error("Error removing friend", e);
        throw e;
    }
};

export const getFriendsList = async (uid: string): Promise<FriendProfile[]> => {
    try {
        const snapshot = await getDocs(collection(db, USERS_COLLECTION, uid, 'friends'));
        const friends: FriendProfile[] = [];
        
        // Fetch fresh data for each friend to get real status
        for (const d of snapshot.docs) {
            const fData = d.data() as FriendProfile;
            const freshProfile = await getUserProfile(fData.uid);
            if (freshProfile) {
                friends.push({
                    uid: fData.uid,
                    username: freshProfile.username,
                    photoURL: freshProfile.photoURL,
                    level: freshProfile.gamification?.level || 1,
                    lastActive: freshProfile.lastLogin
                });
            } else {
                friends.push(fData);
            }
        }
        return friends;
    } catch (e) {
        console.error("Error getting friends", e);
        return [];
    }
};

// --- BATTLE MODE FUNCTIONS ---

export const createBattleRoom = async (hostUid: string, hostName: string, category: CategoryType, questions: Question[]): Promise<string> => {
    const battleId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const battleData: BattleState = {
        id: battleId,
        hostUid,
        hostName,
        guestUid: null,
        guestName: null,
        status: 'WAITING',
        category,
        questions: deepClean(questions),
        scores: { [hostUid]: 0 },
        progress: { [hostUid]: 0 },
        winner: null,
        createdAt: Date.now()
    };
    
    await setDoc(doc(db, BATTLES_COLLECTION, battleId), battleData);
    return battleId;
};

export const joinBattleRoom = async (battleId: string, guestUid: string, guestName: string): Promise<boolean> => {
    const battleRef = doc(db, BATTLES_COLLECTION, battleId);
    const snap = await getDoc(battleRef);
    
    if (!snap.exists()) throw new Error("Room not found");
    const data = snap.data() as BattleState;
    
    if (data.status !== 'WAITING') throw new Error("Game already started or finished");
    if (data.guestUid) throw new Error("Room is full");
    
    await updateDoc(battleRef, {
        guestUid: guestUid,
        guestName: guestName,
        status: 'STARTING',
        [`scores.${guestUid}`]: 0,
        [`progress.${guestUid}`]: 0
    });
    return true;
};

export const subscribeToBattle = (battleId: string, callback: (data: BattleState) => void) => {
    return onSnapshot(doc(db, BATTLES_COLLECTION, battleId), (doc) => {
        if (doc.exists()) {
            callback(doc.data() as BattleState);
        }
    });
};

export const updateBattleProgress = async (battleId: string, uid: string, score: number, questionIndex: number) => {
    const battleRef = doc(db, BATTLES_COLLECTION, battleId);
    await updateDoc(battleRef, {
        [`scores.${uid}`]: score,
        [`progress.${uid}`]: questionIndex
    });
};

export const finishBattle = async (battleId: string, winnerUid: string | 'DRAW') => {
    const battleRef = doc(db, BATTLES_COLLECTION, battleId);
    await updateDoc(battleRef, {
        status: 'FINISHED',
        winner: winnerUid
    });
};

export const saveChatHistory = async (uid: string, chatData: any) => {
    const chatCol = collection(db, 'chat_history');
    const cleanData = deepClean({
        userId: uid,
        ...chatData,
        timestamp: Date.now()
    });
    await addDoc(chatCol, cleanData);
};

export { auth };