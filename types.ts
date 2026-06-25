
export type CategoryType = 'UTBK' | 'SKD' | 'GENERAL' | 'TPA' | 'PSIKOTEST' | 'INTERVIEW' | 'BUTAWRNA' | 'SKRIPSI' | 'KECERMATAN' | 'BENCHMARK' | 'PELAJARAN' | 'TKA' | 'BAHASA';
export type SkdStreamType = 'CPNS' | 'KEDINASAN';
export type TpaStreamType = 'TPA_TBI' | 'PSIKOTEST_KEDINASAN';
export type TkaLevelType = 'SD' | 'SMP' | 'SMA';
export type PelajaranSubjectType = string;
export type PelajaranSemesterType = 'Ganjil' | 'Genap' | 'Full';
export type SkripsiFeature = 'OUTLINE' | 'TITLE_IDEAS' | 'METHODOLOGY' | 'PARAPHRASE' | 'CORRECT_GRAMMAR';
export type KecermatanMode = 'ANGKA' | 'HURUF' | 'SIMBOL_HILANG' | 'SAMA_BEDA' | 'MATCHING' | 'GROUPING';
export type BenchmarkMode = 'REACTION' | 'SEQUENCE' | 'AIM' | 'CHIMP' | 'VISUAL' | 'NUMBER' | 'VERBAL' | 'TYPING' | 'BRIDGE' | 'MATCH' | 'HANGMAN' | 'HOTCOLD' | 'NUMBER_RANGE' | 'POSITION_MEMORY' | 'PATTERN_BREAKER' | 'DECISION_LAB' | 'REVERSE_THINKING' | 'LOGIC_MAZE' | 'TIME_PRESSURE' | 'MULTI_LAYER' | 'SYNONYM_ANTONYM';
export type AppTheme = 'light' | 'dark' | 'fajmuls';
export type AppFontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type AppPattern = 'none' | 'grid' | 'dots' | 'waves' | 'aurora' | 'fajmuls';

export enum StudyMode {
  DRILL = 'Learn & Drill',
  ACTIVE_RECALL = 'Active Recall',
  SIMULATION = 'Test Simulation',
  WEAKNESS = 'Weakness Attack',
  EXAMPLE = 'Contoh Soal',
  PRACTICE = 'Latihan Kustom'
}

export type GeneralStudyMethod = 
  | 'ACTIVE_RECALL' 
  | 'SPACED_REPETITION' 
  | 'FEYNMAN' 
  | 'INTERLEAVING' 
  | 'DELIBERATE' 
  | 'SQ3R' 
  | 'POMODORO' 
  | 'MIND_MAP' 
  | 'PBL' 
  | 'TEACHING'
  | 'PRACTICE';

export type MaterialLength = 'SHORT' | 'MEDIUM' | 'LONG';
export type QuestionDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface GamificationProfile {
    xp: number;
    level: number;
    streak: number;
    lastActiveDate: string; // YYYY-MM-DD
    unlockedAchievements: string[];
    // Battle Stats
    battlesWon?: number;
    battlesLost?: number;
    battlesPlayed?: number;
}

export interface FriendProfile {
    uid: string;
    username: string;
    level: number;
    photoURL?: string;
    lastActive?: string;
    status?: 'online' | 'offline' | 'ingame'; 
}

export interface FriendRequest {
    id: string;
    fromUid: string;
    fromUsername: string;
    fromPhotoURL?: string;
    fromLevel: number;
    timestamp: number;
}

export interface BattleState {
    id: string;
    hostUid: string;
    hostName: string;
    guestUid: string | null;
    guestName: string | null;
    status: 'WAITING' | 'STARTING' | 'PLAYING' | 'FINISHED';
    category: CategoryType;
    questions: Question[];
    scores: Record<string, number>; // uid -> score
    progress: Record<string, number>; // uid -> current question index
    winner: string | null; // uid
    createdAt: number;
}

export interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string; // Lucide icon name
    xpReward: number;
    condition?: (history: TestHistoryItem[], profile: GamificationProfile) => boolean;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    username: string;
    photoURL?: string | null;
    isGuest?: boolean;
    gamification?: GamificationProfile;
    settings?: AppSettings;
}

export interface QuestionMetadata {
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'HOTS';
  idealTimeSeconds: number;
  topic: string;
  subtest: string;
  trapPattern?: string;
  matrix?: { row: string[] }[];
}

export interface Question {
  id: string;
  type: 'multiple_choice' | 'short_answer' | 'long_text' | 'multiple_choice_complex' | 'matching';
  content: string;
  options?: string[];
  correctAnswer: string; 
  tkpPoints?: { option: string; points: number }[]; 
  matchingPairs?: { statement: string; category: string }[];
  explanation: string;
  shortcut?: string;
  metadata: QuestionMetadata;
}

export interface DrillMaterial {
  topic: string;
  summary: string;
  keyPoints: string[];
  question?: Question;
}

export interface GeneralMaterialInput {
    type: 'text' | 'pdf' | 'topic';
    content: string;
    title?: string;
    extractedText?: string;
    lengthPreference?: MaterialLength;
    difficultyPreference?: QuestionDifficulty;
}

export interface InterviewFeedback {
    score: number;
    feedback: string;
    improvedAnswer: string;
    keyPointsCovered: string[];
    toneAnalysis: string;
}

export interface FeynmanFeedback {
    understandingScore: number;
    simplificationQuality: string;
    missingConcepts: string[];
    correction: string;
}

export interface FlashcardData {
    id: string;
    front: string;
    back: string;
    title?: string;
}

export interface MindMapNode {
    label: string;
    children?: MindMapNode[];
}

export interface UserAnswer {
    questionId: string;
    selectedAnswer: string;
    isCorrect: boolean;
    scoreEarned: number;
    timeTakenSeconds: number;
    isOverthinking: boolean;
    isGuessing: boolean;
    interviewFeedback?: InterviewFeedback;
    aiEvaluation?: string;
    isDoubtful?: boolean;
}

export interface SkdResultDetails {
    twk: number;
    tiu: number;
    tkp: number;
    total: number;
    passed: boolean;
}

export interface UtbkResultDetails {
    pu: number;
    ppu: number;
    pbm: number;
    pk: number;
    lbi: number;
    lbe: number;
    pm: number;
    average: number;
}

export interface TpaResultDetails {
    tpaScore: number;
    tbiScore: number;
    tpaCorrect: number;
    tbiCorrect: number;
    passed: boolean;
}

export interface PsikotestKedinasanResultDetails {
    tiuScore: number;
    figuralScore: number;
    personalityScore: number; // 0-100 scale representing "Fit"
    passed: boolean;
    verdict: string;
}

export interface TesKoranResultDetails {
    totalCorrect: number;
    totalWrong: number;
    totalAttempts: number;
    totalColumns: number;
    speedPerMinute: number;
    consistencyScore: number;
    accuracy: number;
    intervalData: number[];
    interpretation: {
        verdict: string;
        speedDesc: string;
        accDesc: string;
        stabDesc: string;
        trend: string;
    }
}

export interface TesKecermatanResultDetails {
    mode: KecermatanMode;
    totalCorrect: number;
    totalWrong: number;
    averageSpeed: number;
    accuracy: number;
    stability: number;
    verdict: string;
    sectionData: {section: number, correct: number, wrong: number}[];
}

export interface BenchmarkResultDetails {
    game: BenchmarkMode;
    unit: string;
}

export interface TestHistoryItem {
    id: string;
    date: string;
    category: CategoryType;
    skdStream?: SkdStreamType;
    tpaStream?: TpaStreamType; 
    tkaLevel?: TkaLevelType;
    pelajaranSemester?: PelajaranSemesterType;
    mode?: StudyMode;
    score: number;
    maxScore: number;
    details?: SkdResultDetails | UtbkResultDetails | TpaResultDetails | TesKoranResultDetails | TesKecermatanResultDetails | BenchmarkResultDetails | PsikotestKedinasanResultDetails | { type: string, passed: boolean } | any;
    questions: Question[];
    answers: UserAnswer[];
    isAborted?: boolean;
    packageTitle?: string;
    packageId?: string;
    isStudied?: boolean;
}

export interface StaticTestPackage {
    id: string;
    title: string;
    category: CategoryType;
    skdStream?: SkdStreamType;
    tpaStream?: TpaStreamType;
    tkaLevel?: TkaLevelType;
    durationMinutes: number;
    isAiGenerated: boolean;
    createdAt: string;
    questions: Question[];
    version?: string;
}

export interface AppSettings {
    soundEnabled: boolean;
    musicEnabled: boolean;
    vibrationEnabled: boolean;
    autoNextQuestion: boolean;
    enableTimer?: boolean;
    volume: number;
    funnyNotifications: boolean;
    confirmActions: boolean;
    darkMode: boolean; 
    theme: AppTheme;
    appBaseColor: string; // NEW: Hex code or CSS color
    appPattern: AppPattern; // NEW: Pattern ID
    fontSize: AppFontSize;
    enableAITutor?: boolean;
}

export interface SavedSessionState {
    id?: string;
    uid: string;
    mode: StudyMode;
    category: CategoryType;
    questions: Question[];
    answerMap: Record<string, UserAnswer>;
    timeLeft: number;
    endTime?: number; // Timestamp when the session should end
    currentIndex: number;
    utbkSubtestIndex: number;
    drillContent: DrillMaterial | null;
    skdStream: SkdStreamType | null;
    tpaStream?: TpaStreamType | null;
    tkaLevel?: TkaLevelType | null;
    packageTitle?: string;
    timestamp: number;
}

export interface MarkedQuestion {
    id: string;
    question: Question;
    category: CategoryType;
    dateMarked: number;
    note?: string;
}

export interface GlobalBenchmarkScore {
    id?: string;
    game: BenchmarkMode;
    score: number;
    username: string;
    unit: string;
    timestamp: number;
}

export interface GlobalLeaderboardEntry {
    uid: string;
    username: string;
    category: CategoryType;
    subCategory: string;
    score: number;
    packageName?: string;
    timestamp: number;
}

export interface UserPackageStats {
    attempts: number;
    highScore: number;
    avgScore: number;
    lastAttemptDate: string;
}

export interface IshiharaPlate {
    id: number;
    image: string;
    correctAnswer: string;
    type: string;
    description: string;
}

export interface TesKoranConfig {
    durationMinutes: number;
}

export interface BackgroundGenTask {
    id: string;
    category: CategoryType;
    skdStream?: SkdStreamType;
    tpaStream?: TpaStreamType;
    tkaLevel?: TkaLevelType;
    title: string;
    progress: number;
    status: 'generating' | 'completed' | 'failed';
    createdAt: string;
}

export interface TargetSubtestScore {
    name: string;
    score: number;
    passingGrade?: number;
    maxScore: number;
    percentage: number;
    strategy: string;
}

export interface TargetScoreCalcResult {
    targetUniversityOrInstansi: string;
    targetMajorOrFormasi: string;
    totalTargetScore: number;
    subtestTargets: TargetSubtestScore[];
    overallStrategy: string;
}