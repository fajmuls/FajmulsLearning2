// ... existing imports ...
import React, { useState, useEffect, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CategoryType,
  StudyMode,
  Question,
  DrillMaterial,
  GeneralMaterialInput,
  UserAnswer,
  SkdStreamType,
  TestHistoryItem,
  InterviewFeedback,
  GeneralStudyMethod,
  FlashcardData,
  MindMapNode,
  FeynmanFeedback,
  SkripsiFeature,
  IshiharaPlate,
  MaterialLength,
  QuestionDifficulty,
  StaticTestPackage,
  AppSettings,
  KecermatanMode,
  UserProfile,
  BenchmarkMode,
  SavedSessionState,
  TpaStreamType,
  Achievement,
  AppTheme,
  AppPattern,
  TkaLevelType,
  BackgroundGenTask,
} from "./types";
import {
  CATEGORIES,
  UTBK_SUBTESTS,
  SKD_SUBTESTS,
  TPA_SUBTESTS,
  PSIKOTEST_SUBTESTS,
  INTERVIEW_TOPICS,
  GENERAL_METHODS,
  INITIAL_SKD_PACKAGES,
  INITIAL_SKD_KEDINASAN_PACKAGES,
  INITIAL_UTBK_PACKAGES,
  INITIAL_TPA_PACKAGES,
  INITIAL_PSIKOTEST_PACKAGES,
  INITIAL_UTBK_HOTS_PACKAGES,
  INITIAL_SKD_CPNS_HOTS_PACKAGES,
  INITIAL_TPA_HOTS_PACKAGES,
  APP_LOGO_URL,
  PSIKOTEST_KEDINASAN_SUBTESTS,
} from "./constants";
import * as Gemini from "./services/geminiService";
import * as FirebaseService from "./services/firebase";
import * as GamificationService from "./services/gamificationService";
import { SoundManager } from "./services/soundService";
import {
  Clock,
  Brain,
  Zap,
  Target,
  Upload,
  FileText,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  X,
  Activity,
  ArrowLeft,
  Loader2,
  BookOpen,
  GraduationCap,
  Briefcase,
  MessageSquare,
  Palette,
  Repeat,
  Share2,
  PenTool,
  Landmark,
  Building2,
  Timer,
  MessageCircle,
  Filter,
  Calendar,
  TrendingUp,
  Award,
  Trash2,
  LogOut,
  Book,
  FileSearch,
  User as UserIcon,
  Download,
  Upload as UploadIcon,
  Search,
  Sparkles,
  History,
  Lightbulb,
  Moon,
  Sun,
  Grid,
  Pause,
  Play,
  Plus,
  Lock,
  Info,
  Settings,
  Calculator,
  Eye,
  GitMerge,
  LayoutGrid,
  Shapes,
  Globe,
  Trophy,
  PlayCircle,
  FolderOpen,
  RotateCcw,
  BarChart2,
  Users,
  Swords,
  Flag,
  Bot,
} from "lucide-react";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { Flashcard } from "./components/Flashcard";
import { MindMapViewer } from "./components/MindMapViewer";
import { SkeletonLoader, CardSkeleton } from "./components/SkeletonLoader";
import { SplashScreen } from "./components/SplashScreen";

// ==== CODE SPLITTING: Lazy Load Route Components ====
const SettingsModal = React.lazy(() => import("./components/SettingsModal").then(m => ({ default: m.SettingsModal })));
const TOSelectionScreen = React.lazy(() => import("./components/TOSelectionScreen").then(m => ({ default: m.TOSelectionScreen })));
const ResultsAnalysis = React.lazy(() => import("./components/ResultsAnalysis").then(m => ({ default: m.ResultsAnalysis })));
const HistoryView = React.lazy(() => import("./components/HistoryView").then(m => ({ default: m.HistoryView })));
const ReviewView = React.lazy(() => import("./components/HistoryView").then(m => ({ default: m.ReviewView })));
const SessionEngine = React.lazy(() => import("./components/SessionEngine").then(m => ({ default: m.SessionEngine })));
const TesKoran = React.lazy(() => import("./components/TesKoran").then(m => ({ default: m.TesKoran })));
const TesKecermatan = React.lazy(() => import("./components/TesKecermatan").then(m => ({ default: m.TesKecermatan })));
const ColorBlindTest = React.lazy(() => import("./components/ColorBlindTest").then(m => ({ default: m.ColorBlindTest })));
const HumanBenchmark = React.lazy(() => import("./components/HumanBenchmark").then(m => ({ default: m.HumanBenchmark })));
const GlobalLeaderboardScreen = React.lazy(() => import("./components/GlobalLeaderboardScreen").then(m => ({ default: m.GlobalLeaderboardScreen })));
const AchievementsModal = React.lazy(() => import("./components/Gamification").then(m => ({ default: m.AchievementsModal })));
const LevelUpModal = React.lazy(() => import("./components/Gamification").then(m => ({ default: m.LevelUpModal })));
const GamificationBar = React.lazy(() => import("./components/Gamification").then(m => ({ default: m.GamificationBar })));
const AchievementToast = React.lazy(() => import("./components/Gamification").then(m => ({ default: m.AchievementToast })));
const AcademicHub = React.lazy(() => import("./components/AcademicHub").then(m => ({ default: m.AcademicHub })));
const SocialHub = React.lazy(() => import("./components/SocialHub").then(m => ({ default: m.SocialHub })));
const BattleArena = React.lazy(() => import("./components/BattleArena").then(m => ({ default: m.BattleArena })));
const MarkedQuestionsView = React.lazy(() => import("./components/MarkedQuestionsView").then(m => ({ default: m.MarkedQuestionsView })));
const AiChatTutor = React.lazy(() => import("./components/AiChatTutor").then(m => ({ default: m.AiChatTutor })));


// ... (Helper components remain the same: UserAvatar, SimpleMarkdown, NotificationToast, ResumeModal, GoogleIcon, LoginScreen, UsernameSetupScreen, SkripsiSession, InterviewSession, FlashcardSession, FeynmanSession, SQ3RSession, ResumeSessionList, Dashboard) ...
const UserAvatar: React.FC<{ user: UserProfile | null }> = ({ user }) => {
  const [imgError, setImgError] = useState(false);
  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);
  if (user?.photoURL && !imgError) {
    return (
      <img
        src={user.photoURL}
        alt="Profile"
        className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
        onError={() => setImgError(true)}
      />
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-sm">
      {" "}
      {user?.username?.[0]?.toUpperCase() || "T"}{" "}
    </div>
  );
};

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
  if (!text) return null;
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>")
    .replace(/\*(.*?)\*/g, "<i>$1</i>")
    .replace(/\n- (.*?)/g, "<br/>• $1")
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>");
  formatted = `<p>${formatted}</p>`;
  return (
    <div
      dangerouslySetInnerHTML={{ __html: formatted }}
      className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm font-sans text-justify markdown-content"
      style={{ textAlign: "justify", textJustify: "inter-word" }}
    />
  );
};

const NotificationToast: React.FC<{
  message: string;
  type: "success" | "error" | "info";
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  const borderAndIconColor =
    type === "success"
      ? "border-emerald-500/25 text-emerald-400 bg-emerald-500/10"
      : type === "error"
        ? "border-rose-500/25 text-rose-400 bg-rose-500/10"
        : "border-indigo-500/25 text-indigo-400 bg-indigo-500/10";

  const icon =
    type === "success" ? (
      <CheckCircle size={16} className="shrink-0 text-emerald-400" />
    ) : type === "error" ? (
      <AlertTriangle size={16} className="shrink-0 text-rose-400" />
    ) : (
      <Info size={16} className="shrink-0 text-indigo-400" />
    );

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95, x: "-50%" }}
      animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
      exit={{ opacity: 0, y: -15, scale: 0.95, x: "-50%" }}
      transition={{ type: "spring", duration: 0.35, bounce: 0.25 }}
      style={{ left: "50%" }}
      className={`fixed top-4 z-[100] flex items-center gap-2.5 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md border ${borderAndIconColor} bg-slate-900/95 dark:bg-slate-950/95 text-slate-100 min-w-[280px] w-auto max-w-[92%] sm:max-w-md transition-all`}
    >
      {icon}
      <p className="flex-grow text-[11px] sm:text-xs font-semibold leading-relaxed text-slate-100 text-left select-none pr-1">
        {message}
      </p>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 p-1 rounded-lg transition-colors shrink-0"
        aria-label="Tutup"
      >
        <XCircle size={14} />
      </button>
    </motion.div>
  );
};
const ResumeModal: React.FC<{
  session: SavedSessionState;
  onResume: () => void;
  onDiscard: () => void;
}> = ({ session, onResume, onDiscard }) => {
  const progress = Math.round(
    (Object.keys(session.answerMap).length / session.questions.length) * 100,
  );
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {" "}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700 text-center">
        {" "}
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse">
          {" "}
          <History size={24} className="sm:w-8 sm:h-8" />{" "}
        </div>{" "}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
          Tes Belum Selesai
        </h2>{" "}
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">
          {" "}
          Ditemukan sesi{" "}
          <b className="text-indigo-600 dark:text-indigo-400">
            {session.packageTitle || session.category}
          </b>{" "}
          yang belum diselesaikan. Ingin melanjutkan?{" "}
        </p>{" "}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 text-left">
          {" "}
          <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            {" "}
            <span>Progress</span> <span>{progress}%</span>{" "}
          </div>{" "}
          <div className="w-full bg-slate-200 dark:bg-slate-600 h-1.5 sm:h-2 rounded-full overflow-hidden">
            {" "}
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex flex-col gap-2.5">
          {" "}
          <button
            onClick={onResume}
            className="w-full py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-1.5"
          >
            {" "}
            <Play size={16} /> Lanjutkan Tes{" "}
          </button>{" "}
          <button
            onClick={onDiscard}
            className="w-full py-2.5 sm:py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
          >
            {" "}
            <Trash2 size={16} /> Hapus & Menu Utama{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};
const GoogleIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 48 48"
    width="24px"
    height="24px"
  >
    {" "}
    <path
      fill="#FFC107"
      d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
    />{" "}
    <path
      fill="#FF3D00"
      d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
    />{" "}
    <path
      fill="#4CAF50"
      d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
    />{" "}
    <path
      fill="#1976D2"
      d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
    />{" "}
  </svg>
);

const LoginScreen: React.FC<{
  onGoogleLogin: (rememberMe: boolean) => void;
  onGuestLogin: () => void;
  isLoading: boolean;
}> = ({ onGoogleLogin, onGuestLogin, isLoading }) => {
  const [rememberMe, setRememberMe] = useState(true);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 transition-colors duration-300">
      {" "}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700 text-center relative overflow-hidden">
        {" "}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 z-20 flex flex-col items-center justify-center">
            {" "}
            <Loader2 className="animate-spin text-indigo-600 w-10 h-10 mb-4" />{" "}
            <p className="font-bold text-slate-600 dark:text-slate-300">
              Menghubungkan...
            </p>{" "}
          </div>
        )}{" "}
        <div className="mb-8 flex justify-center">
          {" "}
          <img
            src={APP_LOGO_URL}
            alt="Logo"
            className="w-24 h-24 object-contain animate-bounce-slow"
          />{" "}
        </div>{" "}
        <div className="text-center mb-8">
          {" "}
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Fajmuls Learning
          </h1>{" "}
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Platform Belajar Cerdas Terintegrasi AI
          </p>{" "}
        </div>{" "}
        <div className="space-y-4">
          {" "}
          <button
            onClick={() => onGoogleLogin(rememberMe)}
            className="w-full py-3 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-full border border-slate-300 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 relative"
          >
            {" "}
            <div className="absolute left-4">
              <GoogleIcon />
            </div>{" "}
            <span className="text-base font-roboto font-bold">
              Masuk dengan Google
            </span>{" "}
          </button>{" "}
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            {" "}
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 text-indigo-600 bg-gray-100 border-gray-300 rounded focus:ring-indigo-500 dark:focus:ring-indigo-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />{" "}
            <label htmlFor="remember" className="cursor-pointer select-none">
              Tetap masuk di perangkat ini
            </label>{" "}
          </div>{" "}
          <div className="relative flex py-2 items-center">
            {" "}
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>{" "}
            <span className="flex-shrink-0 mx-4 text-slate-400 text-xs">
              ATAU
            </span>{" "}
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>{" "}
          </div>{" "}
          <button
            onClick={onGuestLogin}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition flex items-center justify-center gap-2"
          >
            {" "}
            Masuk sebagai Tamu <ChevronRight size={20} />{" "}
          </button>{" "}
          <p className="text-xs text-slate-400 mt-2">
            {" "}
            *Mode Tamu: Riwayat hanya tersimpan di perangkat ini & tidak masuk
            Leaderboard.{" "}
          </p>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};
const UsernameSetupScreen: React.FC<{
  onSubmit: (username: string) => void;
  isLoading: boolean;
}> = ({ onSubmit, isLoading }) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.length < 3) {
      setError("Username minimal 3 karakter.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError("Hanya huruf, angka, dan underscore (_).");
      return;
    }
    onSubmit(username);
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6">
      {" "}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        {" "}
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Buat Username
        </h2>{" "}
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Pilih nama unik untuk identitas belajarmu.
        </p>{" "}
        <form onSubmit={handleSubmit}>
          {" "}
          <div className="mb-4">
            {" "}
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
              Username
            </label>{" "}
            <input
              type="text"
              className="w-full p-4 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl focus:border-indigo-600 focus:ring-0 outline-none font-bold"
              placeholder="Username_Unik"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.replace(/\s/g, ""));
                setError("");
              }}
              autoFocus
            />{" "}
            {error && (
              <p className="text-rose-500 text-xs mt-2 font-bold">{error}</p>
            )}{" "}
          </div>{" "}
          <button
            type="submit"
            disabled={isLoading || !username}
            className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {" "}
            {isLoading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <CheckCircle size={20} />
            )}{" "}
            Simpan & Lanjut{" "}
          </button>{" "}
        </form>{" "}
      </div>{" "}
    </div>
  );
};
const SkripsiSession: React.FC<{
  result: string;
  feature: SkripsiFeature;
  onBack: () => void;
}> = ({ result, feature, onBack }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center">
    <div className="max-w-3xl w-full">
      <button
        onClick={onBack}
        className="mb-4 text-slate-500 dark:text-slate-400 flex items-center gap-2"
      >
        <ArrowLeft size={18} /> Kembali
      </button>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
          <Book size={28} className="text-indigo-600" /> Hasil {feature}
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <SimpleMarkdown text={result} />
        </div>
      </div>
    </div>
  </div>
);
const InterviewSession: React.FC<{
  questions: Question[];
  onComplete: (answers: UserAnswer[]) => void;
}> = ({ questions, onComplete }) => {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserAnswer[]>([]);
  const currentQ = questions[index];
  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const fb = await Gemini.evaluateInterviewAnswer(currentQ.content, answer);
      setFeedback(fb);
    } catch (e) {
      alert("Gagal evaluasi.");
    } finally {
      setLoading(false);
    }
  };
  const handleNext = () => {
    const newResult: UserAnswer = {
      questionId: currentQ.id,
      selectedAnswer: answer,
      isCorrect: true,
      scoreEarned: feedback?.score || 0,
      timeTakenSeconds: 0,
      isOverthinking: false,
      isGuessing: false,
      interviewFeedback: feedback || undefined,
    };
    const updatedResults = [...results, newResult];
    setResults(updatedResults);
    setAnswer("");
    setFeedback(null);
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      onComplete(updatedResults);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="mb-4 text-sm font-bold text-slate-400">
          Pertanyaan {index + 1} dari {questions.length}
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
          {currentQ.content}
        </h2>
        {!feedback ? (
          <>
            <textarea
              className="w-full p-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl mb-4 h-40 focus:ring-2 focus:ring-indigo-500"
              placeholder="Jawab seolah sedang interview..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !answer}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <MessageSquare size={18} />
              )}{" "}
              Submit Jawaban
            </button>
          </>
        ) : (
          <div className="animate-fade-in-up">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Skor: {feedback.score}/100
                </span>
                <span className="text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">
                  {feedback.toneAnalysis}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <b>Feedback:</b> {feedback.feedback}
              </p>
              <div className="text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <b>Saran Jawaban:</b> {feedback.improvedAnswer}
              </div>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90"
            >
              Lanjut
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
const FlashcardSession: React.FC<{
  flashcards: FlashcardData[];
  onFinish: () => void;
}> = ({ flashcards, onFinish }) => {
  const [index, setIndex] = useState(0);
  const handleNext = (rating: "easy" | "medium" | "hard") => {
    if (index < flashcards.length - 1) setIndex(index + 1);
    else onFinish();
  };
  if (flashcards.length === 0) return <div>No Flashcards</div>;
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl mb-6 flex justify-between items-center">
        <button
          onClick={onFinish}
          className="text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-bold text-slate-400">
          {index + 1} / {flashcards.length}
        </span>
      </div>
      <Flashcard data={flashcards[index]} onNext={handleNext} />
    </div>
  );
};
const FeynmanSession: React.FC<{ topic: string; onFinish: () => void }> = ({
  topic,
  onFinish,
}) => {
  const [explanation, setExplanation] = useState("");
  const [feedback, setFeedback] = useState<FeynmanFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fb = await Gemini.evaluateFeynman(topic, explanation);
      setFeedback(fb);
    } catch (e) {
      alert("Error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Feynman Technique
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Jelaskan topik <b>"{topic}"</b> seolah-olah Anda sedang mengajari anak
          kecil (5 tahun).
        </p>
        {!feedback ? (
          <>
            <textarea
              className="w-full p-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl mb-4 h-48 focus:ring-2 focus:ring-indigo-500"
              placeholder="Mulai jelaskan di sini..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !explanation}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Menganalisis..." : "Cek Pemahaman Saya"}
            </button>
          </>
        ) : (
          <div className="animate-fade-in-up">
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`text-2xl font-bold ${feedback.understandingScore > 70 ? "text-emerald-500" : "text-amber-500"}`}
                >
                  {feedback.understandingScore}/100
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  <b>Kualitas Penyederhanaan:</b>{" "}
                  {feedback.simplificationQuality}
                </p>
                <p>
                  <b>Konsep yang Terlewat:</b>{" "}
                  {feedback.missingConcepts.join(", ") || "Tidak ada"}
                </p>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                  <b>Koreksi / Saran:</b> {feedback.correction}
                </div>
              </div>
            </div>
            <button
              onClick={onFinish}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold"
            >
              Selesai Belajar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
const SQ3RSession: React.FC<{ topic: string; onFinish: () => void }> = ({
  topic,
  onFinish,
}) => {
  const steps = ["Survey", "Question", "Read", "Recite", "Review"];
  const [step, setStep] = useState(0);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
        <div className="flex justify-center mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex items-center ${i < steps.length - 1 ? "w-full" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i <= step ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}
              >
                {s[0]}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 ${i < step ? "bg-indigo-600" : "bg-slate-100 dark:bg-slate-700"}`}
                ></div>
              )}
            </div>
          ))}
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-4">
          {steps[step]}
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-300 mb-8">
          Lakukan tahap {steps[step]} untuk materi "{topic}".
        </p>
        <button
          onClick={() => {
            if (step < 4) setStep(step + 1);
            else onFinish();
          }}
          className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
        >
          {step < 4 ? "Lanjut Tahap Berikutnya" : "Selesai SQ3R"}
        </button>
      </div>
    </div>
  );
};
const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key: any, value: any) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};
const ResumeSessionList: React.FC<{
  sessions: SavedSessionState[];
  onBack: () => void;
  onResume: (s: SavedSessionState) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}> = ({ sessions, onBack, onResume, onDelete, loading }) => {
  const getVisuals = (category: CategoryType) => {
    switch (category) {
      case "UTBK":
        return {
          icon: GraduationCap,
          color: "text-rose-600",
          bg: "bg-rose-100 dark:bg-rose-900/30",
          border: "border-rose-200 dark:border-rose-800",
        };
      case "SKD":
        return {
          icon: Briefcase,
          color: "text-amber-600",
          bg: "bg-amber-100 dark:bg-amber-900/30",
          border: "border-amber-200 dark:border-amber-800",
        };
      case "PSIKOTEST":
        return {
          icon: Brain,
          color: "text-purple-600",
          bg: "bg-purple-100 dark:bg-purple-900/30",
          border: "border-purple-200 dark:border-purple-800",
        };
      case "TPA":
        return {
          icon: Zap,
          color: "text-blue-600",
          bg: "bg-blue-100 dark:bg-blue-900/30",
          border: "border-blue-200 dark:border-blue-800",
        };
      case "KECERMATAN":
        return {
          icon: Eye,
          color: "text-emerald-600",
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
          border: "border-emerald-200 dark:border-emerald-800",
        };
      default:
        return {
          icon: FileText,
          color: "text-slate-600",
          bg: "bg-slate-100 dark:bg-slate-800",
          border: "border-slate-200 dark:border-slate-700",
        };
    }
  };
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 transition-colors">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <button
            onClick={onBack}
            className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition text-slate-700 dark:text-slate-300"
          >
            <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Sesi Tersimpan
          </h1>
        </div>
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600 w-8 h-8" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-20 text-slate-500 dark:text-slate-400">
            <History size={40} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm">Tidak ada sesi tersimpan.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-6">
            {sessions.map((s) => {
              const progress = Math.round(
                (Object.keys(s.answerMap).length / s.questions.length) * 100,
              );
              const visual = getVisuals(s.category);
              const Icon = visual.icon;
              return (
                <div
                  key={s.id || s.timestamp}
                  className={`bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-2xl border ${visual.border} shadow-sm flex flex-col gap-3 sm:gap-4 animate-fade-in-up hover:shadow-md transition-all`}
                >
                  <div className="flex justify-between items-start">
                    <div
                      className={`p-2 sm:p-3 rounded-xl ${visual.bg} ${visual.color}`}
                    >
                      <Icon size={18} className="sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-right">
                      <span className="text-[8px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5 sm:mb-1">
                        SISA WAKTU
                      </span>
                      <div
                        className={`font-mono text-base sm:text-xl font-bold ${s.timeLeft < 300 ? "text-rose-500 font-black" : "text-slate-800 dark:text-white"}`}
                      >
                        {formatTime(s.timeLeft)}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="font-bold text-sm sm:text-lg text-slate-800 dark:text-white line-clamp-2"
                        title={s.packageTitle || s.category}
                      >
                        {s.packageTitle || s.category}
                      </span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 sm:py-1 rounded inline-block mb-2.5 sm:mb-3">
                      {new Date(s.timestamp).toLocaleDateString()} •{" "}
                      {s.questions.length} Soal
                    </div>
                    <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-700 h-1.5 sm:h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${s.category === "UTBK" ? "bg-rose-500" : "bg-indigo-500"}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1.5 sm:mt-2">
                    <button
                      onClick={() => onDelete(s.id!)}
                      className="p-2 sm:p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition border border-rose-100 dark:border-rose-900/50"
                    >
                      <Trash2 size={16} className="sm:w-5 sm:h-5" />
                    </button>
                    <button
                      onClick={() => onResume(s)}
                      className="flex-1 px-3 py-2 sm:px-4 sm:py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-1.5"
                    >
                      <Play
                        size={14}
                        fill="currentColor"
                        className="sm:w-[16px] sm:h-[16px]"
                      />{" "}
                      Lanjutkan
                    </button>
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

// Dashboard Component with New Button Colors
const Dashboard: React.FC<{
  category: CategoryType;
  onBack: () => void;
  onStartSession: (
    mode: StudyMode,
    difficulty?: string,
    count?: number,
  ) => void;
  onOpenTOSelection: () => void;
  onStartTesKoran: () => void;
  onStartTesKecermatan: (mode: KecermatanMode) => void;
  onGeneralInputSubmit: (input: GeneralMaterialInput) => void;
  generalInput: GeneralMaterialInput | null;
  setGeneralInput?: (input: GeneralMaterialInput | null) => void;
  isReadingMaterial: boolean;
  onResetMaterial: () => void;
  onSubtestSelect: (s: string) => void;
  selectedSubtest: string;
  weakTopics: string[];
  loading: boolean;
  skdStream: SkdStreamType | null;
  onSkdStreamSelect: (s: SkdStreamType) => void;
  onHistory: () => void;
  onStartGeneralSession: (m: GeneralStudyMethod) => void;
  onStartSkripsiSession?: (feature: SkripsiFeature, input: string) => void;
  username: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  tpaStream?: TpaStreamType | null;
  onTpaStreamSelect?: (s: TpaStreamType) => void;
  tkaLevel?: TkaLevelType | null;
  onTkaLevelSelect?: (s: TkaLevelType) => void;
  onOpenAcademicHub?: () => void;
  onBattle: () => void;
}> = (props) => {
  const {
    category,
    onBack,
    onStartSession,
    onOpenTOSelection,
    onStartTesKoran,
    onStartTesKecermatan,
    onGeneralInputSubmit,
    generalInput,
    setGeneralInput,
    isReadingMaterial,
    onResetMaterial,
    onSubtestSelect,
    selectedSubtest,
    weakTopics,
    loading,
    skdStream,
    onSkdStreamSelect,
    onHistory,
    onStartGeneralSession,
    onStartSkripsiSession,
    username,
    isDarkMode,
    onToggleDarkMode,
    tpaStream,
    onTpaStreamSelect,
    tkaLevel,
    onTkaLevelSelect,
    onOpenAcademicHub,
    onBattle,
  } = props;
  const [inputText, setInputText] = useState("");
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [materialLength, setMaterialLength] =
    useState<MaterialLength>("MEDIUM");
  const [questionDiff, setQuestionDiff] =
    useState<QuestionDifficulty>("MEDIUM");
  const [pdfLoading, setPdfLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [practiceCount, setPracticeCount] = useState<number>(8);
  const [practiceDifficulty, setPracticeDifficulty] = useState<string>("Medium");
  const [loadingTimer, setLoadingTimer] = useState(0);

  useEffect(() => {
    let interval: any;
    if (loading) {
      setLoadingTimer(0);
      interval = setInterval(() => {
        setLoadingTimer(prev => prev + 1);
      }, 1000);
    } else {
      setLoadingTimer(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        alert("Hanya file PDF yang diperbolehkan.");
        return;
      }
      setPdfName(file.name);
      setInputText("");
      setPdfLoading(true);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const rawBase64 = (ev.target?.result as string).split(",")[1];
        setTimeout(() => {
          if (setGeneralInput) {
            setGeneralInput({
              type: "pdf",
              content: rawBase64,
              title: file.name,
              lengthPreference: materialLength,
              difficultyPreference: questionDiff,
            });
          }
          setPdfLoading(false);
        }, 800);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleInputSubmit = () => {
    if (generalInput?.type === "pdf") {
      onGeneralInputSubmit({
        ...generalInput,
        lengthPreference: materialLength,
        difficultyPreference: questionDiff,
      });
    } else if (inputText) {
      onGeneralInputSubmit({
        type: "text",
        content: inputText,
        title: "Input Manual",
        lengthPreference: materialLength,
        difficultyPreference: questionDiff,
      });
    } else {
      alert("Mohon masukkan teks atau upload PDF.");
    }
  };
  const renderSubtests = (list: string[]) => {
    const filteredList = list.filter((sub) =>
      sub.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    return (
      <div className="bg-white dark:bg-slate-800 p-3 sm:p-5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4 sm:mb-6 animate-fade-in-up">
        <h3 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white mb-2">
          Pilih Topik / Subtes:
        </h3>
        <div className="mb-3 relative">
          <Search
            className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={14}
          />
          <input
            type="text"
            placeholder="Cari topik..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-medium dark:text-white focus:ring-1 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {filteredList.length > 0 ? (
            filteredList.map((sub) => (
              <button
                key={sub}
                onClick={() => {
                  SoundManager.play("tap");
                  onSubtestSelect(sub);
                }}
                className={`px-2.5 py-1 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition ${selectedSubtest === sub ? "bg-indigo-600 text-white shadow-md" : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600"}`}
              >
                {sub}
              </button>
            ))
          ) : (
            <div className="text-xs text-slate-500 italic p-1">
              Tidak ada topik yang cocok.
            </div>
          )}
        </div>
        {selectedSubtest &&
          category !== "INTERVIEW" &&
          category !== "SKRIPSI" && (
            <div className="mt-5 border-t border-slate-100 dark:border-slate-700 pt-5 animate-fade-in-up">
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block uppercase">
                    Jumlah Soal
                  </label>
                  <select
                    value={practiceCount}
                    onChange={(e) => setPracticeCount(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium dark:text-white"
                  >
                    <option value="5">5 Soal</option>
                    <option value="8">8 Soal</option>
                    <option value="10">10 Soal</option>
                    <option value="15">15 Soal</option>
                    <option value="20">20 Soal</option>
                  </select>
                </div>
                <div className="flex-1 w-full">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 block uppercase">
                    Tingkat Kesulitan
                  </label>
                  <select
                    value={practiceDifficulty}
                    onChange={(e) => setPracticeDifficulty(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium dark:text-white"
                  >
                    <option value="Easy">Mudah</option>
                    <option value="Medium">Sedang</option>
                    <option value="Hard">Sulit</option>
                    <option value="HOTS">HOTS (Analisis Tinggi)</option>
                  </select>
                </div>
                <button
                  onClick={() => {
                    SoundManager.play("click");
                    onStartSession(
                      StudyMode.PRACTICE,
                      practiceDifficulty,
                      practiceCount,
                    );
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition flex items-center justify-center gap-1.5 text-sm"
                >
                  <PenTool size={16} /> Mulai Latihan
                </button>
              </div>
            </div>
          )}
        {category === "INTERVIEW" && selectedSubtest && (
          <div className="mt-5 border-t border-slate-100 dark:border-slate-700 pt-3.5 animate-fade-in-up">
            <button
              onClick={() => {
                SoundManager.play("click");
                onStartSession(StudyMode.DRILL);
              }}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition flex items-center justify-center gap-2"
            >
              <MessageSquare size={18} /> Mulai Sesi Wawancara
            </button>
          </div>
        )}
      </div>
    );
  };
  return (
    <div className="min-h-screen bg-transparent">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => {
              SoundManager.play("back");
              onBack();
            }}
            className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 text-xs sm:text-sm font-medium"
          >
            <ArrowLeft size={16} className="mr-1.5" /> Kembali
          </button>
          <div className="flex items-center gap-2">
            {onToggleDarkMode && (
              <button
                onClick={() => {
                  onToggleDarkMode();
                }}
                className="p-1.5 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
              >
                {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              </button>
            )}
            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <UserIcon size={10} /> {username}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-indigo-600 uppercase mb-0.5 block">
              {category === "TPA"
                ? "Seleksi Lanjutan"
                : category + " Dashboard"}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Pusat Kendali Belajar
            </h1>
          </div>
        </div>
        
        <AnimatePresence>
            {loading && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.5, x: 50, y: -50 }}
                    animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, x: 50, y: -50 }}
                    className="fixed bottom-4 right-4 z-[100] bg-indigo-600 px-4 py-3 rounded-full shadow-xl flex items-center gap-3 border border-indigo-500"
                >
                    <Loader2 className="animate-spin text-white w-5 h-5" />
                    <span className="text-sm font-bold text-white">Generating Questions...</span>
                </motion.div>
            )}
        </AnimatePresence>

        <div className="transition-all duration-300">
          <>
            {weakTopics.length > 0 && category !== "KECERMATAN" && category !== "SKRIPSI" && category !== "GENERAL" && category !== "BENCHMARK" && (
              <div className="mb-6 animate-fade-in-up bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/10 dark:to-orange-900/10 rounded-xl p-3.5 sm:p-5 border border-rose-100 dark:border-rose-900/50">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target size={16} className="text-rose-600 dark:text-rose-400" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white">Fokus Perbaikan</h3>
                    </div>
                    <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                      Akurasi Anda rendah di {weakTopics.length} topik. Mari perbaiki dengan latihan khusus.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {weakTopics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="text-[10px] font-semibold bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-md border border-rose-50 dark:border-rose-950 shadow-sm">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartSession(StudyMode.WEAKNESS);
                    }}
                    className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold shadow-md shadow-rose-100 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs"
                  >
                    <Brain size={14} /> Latih Sekarang
                  </button>
                </div>
              </div>
            )}
            
            {category === "KECERMATAN" && (
              <div className="animate-fade-in-up">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("ANGKA");
                    }}
                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Activity size={18} />
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                        Angka Hilang
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      Temukan angka yang hilang dari kolom.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("HURUF");
                    }}
                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <FileText size={18} />
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                        Huruf Hilang
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      Variasi huruf. Melatih ketelitian visual.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("SIMBOL_HILANG");
                    }}
                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 border border-slate-200 dark:border-slate-700 hover:border-purple-500 rounded-xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1.5 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400">
                        <Shapes size={18} />
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                        Simbol Hilang
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      Temukan simbol yang hilang dari grid.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("SAMA_BEDA");
                    }}
                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 border border-slate-200 dark:border-slate-700 hover:border-amber-500 rounded-xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1.5 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                        <GitMerge size={18} />
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                        Sama Beda
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      Bandingkan dua baris simbol secepatnya.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("MATCHING");
                    }}
                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 border border-slate-200 dark:border-slate-700 hover:border-rose-500 rounded-xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1.5 bg-rose-100 dark:bg-rose-900/40 rounded-lg text-rose-600 dark:text-rose-400">
                        <Target size={18} />
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                        Matching
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      Cocokkan simbol dengan kode kuncinya.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("GROUPING");
                    }}
                    className="p-3 sm:p-4 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 border border-slate-200 dark:border-slate-700 hover:border-cyan-500 rounded-xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="p-1.5 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg text-cyan-600 dark:text-cyan-400">
                        <LayoutGrid size={18} />
                      </span>
                      <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white">
                        Grouping
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      Pilih semua simbol yang diminta dari grid.
                    </p>
                  </button>
                </div>
              </div>
            )}
            {category === "SKRIPSI" && (
              <div className="animate-fade-in-up max-w-xl mx-auto">
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                    <Book size={20} className="text-indigo-600" /> Skripsi Assistant
                  </h3>
                  <textarea
                    className="w-full p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg mb-4 focus:ring-1 focus:ring-indigo-500 h-24 text-sm"
                    placeholder="Masukkan topik atau judul skripsi Anda..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSkripsiSession && onStartSkripsiSession("TITLE_IDEAS", inputText);
                      }}
                      className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex flex-col items-center gap-1 border border-indigo-100 dark:border-indigo-800 text-xs"
                    >
                      <Brain size={18} /> Ide Judul
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSkripsiSession && onStartSkripsiSession("OUTLINE", inputText);
                      }}
                      className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex flex-col items-center gap-1 border border-emerald-100 dark:border-emerald-800 text-xs"
                    >
                      <FileText size={18} /> Buat Outline
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSkripsiSession && onStartSkripsiSession("METHODOLOGY", inputText);
                      }}
                      className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 flex flex-col items-center gap-1 border border-amber-100 dark:border-amber-800 text-xs"
                    >
                      <Search size={18} /> Cek Metode
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSkripsiSession && onStartSkripsiSession("PARAPHRASE", inputText);
                      }}
                      className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-lg font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 flex flex-col items-center gap-1 border border-rose-100 dark:border-rose-800 text-xs"
                    >
                      <FileSearch size={18} /> Parafrase
                    </button>
                  </div>
                </div>
              </div>
            )}
            {category === "GENERAL" && (
              <div className="space-y-4 animate-fade-in-up">
                {!isReadingMaterial ? (
                  <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-sm text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
                      <Upload size={16} /> Input Materi
                    </h3>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        className="flex-1 p-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-lg text-xs"
                        placeholder={
                          pdfName
                            ? `PDF: ${pdfName}`
                            : "Topik, teks materi, atau paste..."
                        }
                        value={inputText}
                        disabled={!!pdfName}
                        onChange={(e) => {
                          setInputText(e.target.value);
                        }}
                      />
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="application/pdf"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <button
                        className={`p-2 rounded-lg transition flex items-center gap-1.5 ${pdfName ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"}`}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileText size={16} />
                        <span className="hidden sm:inline font-bold text-xs">
                          PDF
                        </span>
                      </button>
                    </div>
                    {pdfName && (
                      <div className="mb-3 text-[10px] bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-3 py-1.5 rounded-md flex items-center justify-between border border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle size={12} />{" "}
                          <span>{pdfName}</span>
                        </div>
                        <button
                          onClick={() => {
                            setPdfName(null);
                            setGeneralInput && setGeneralInput(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">
                          Panjang Ringkasan
                        </label>
                        <select
                          value={materialLength}
                          onChange={(e) =>
                            setMaterialLength(e.target.value as MaterialLength)
                          }
                          className="w-full p-2 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                        >
                          <option value="SHORT">Ringkas</option>
                          <option value="MEDIUM">Standar</option>
                          <option value="LONG">Mendalam</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 mb-1 block uppercase">
                          Kesulitan
                        </label>
                        <select
                          value={questionDiff}
                          onChange={(e) =>
                            setQuestionDiff(e.target.value as QuestionDifficulty)
                          }
                          className="w-full p-2 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-lg text-xs"
                        >
                          <option value="EASY">Mudah</option>
                          <option value="MEDIUM">Sedang</option>
                          <option value="HARD">Sulit</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleInputSubmit}
                      disabled={(!inputText && !pdfName) || pdfLoading}
                      className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 dark:shadow-none transition flex items-center justify-center gap-2 text-sm"
                    >
                      {pdfLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Sparkles size={16} />
                      )}
                      Analisis Materi
                    </button>
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-700 mb-4">
                      <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                          <BookOpen size={16} /> Materi Belajar
                        </h3>
                        <button
                          onClick={onResetMaterial}
                          className="text-[10px] text-rose-500 font-bold hover:underline"
                        >
                          Ganti Materi
                        </button>
                      </div>
                      <div className="prose prose-xs max-w-none text-slate-700 dark:text-slate-300 leading-relaxed max-h-[300px] overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-700">
                        <SimpleMarkdown
                          text={
                            generalInput?.extractedText ||
                            generalInput?.content ||
                            ""
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-800 dark:text-white mb-3">
                        Pilih Metode Belajar:
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {GENERAL_METHODS.map((m) => {
                          const iconMap: Record<string, any> = {
                            Brain,
                            Repeat,
                            MessageCircle,
                            Share2,
                            Search,
                            GraduationCap,
                            BookOpen,
                            PenTool,
                          };
                          const Icon = iconMap[m.icon] || Brain;
                          return (
                            <button
                              key={m.id}
                              onClick={() => {
                                SoundManager.play("click");
                                onStartGeneralSession(m.id);
                              }}
                              className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition text-left flex flex-col h-full"
                            >
                              <div className="mb-3 text-indigo-600 dark:text-indigo-400">
                                <Icon size={24} />
                              </div>
                              <h4 className="font-bold text-sm mb-1 text-slate-900 dark:text-white">
                                {m.name}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {m.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            {category === "UTBK" && (
              <>
                <button
                  onClick={() => {
                    SoundManager.play("click");
                    onOpenTOSelection();
                  }}
                  className="w-full bg-emerald-600 dark:bg-emerald-600 text-white p-4 sm:p-6 rounded-2xl mb-8 flex justify-between items-center group shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all"
                >
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                      <Clock size={24} className="text-white/80" /> Simulasi
                      UTBK SNBT Full
                    </h3>
                    <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                      160 Soal. Durasi 195 Menit. Format Resmi 2025.
                    </p>
                  </div>
                  <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                </button>
                {renderSubtests(UTBK_SUBTESTS)}
              </>
            )}
            {category === "TPA" && (
              <>
                {!tpaStream ? (
                  <div className="grid md:grid-cols-2 gap-6 mb-8 animate-fade-in-up">
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        if (onTpaStreamSelect) onTpaStreamSelect("TPA_TBI");
                      }}
                      className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition text-center group shadow-sm"
                    >
                      <Brain className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition" />
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                        TPA & TBI
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Seleksi Pascasarjana & Umum
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        if (onTpaStreamSelect)
                          onTpaStreamSelect("PSIKOTEST_KEDINASAN");
                      }}
                      className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 dark:hover:border-purple-500 transition text-center group shadow-sm"
                    >
                      <Briefcase className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition" />
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                        Psikotes Kedinasan
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Seleksi Lanjutan I PKN STAN
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-4 text-sm text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => {
                          SoundManager.play("click");
                          if (onTpaStreamSelect) onTpaStreamSelect(null as any);
                        }}
                        className="underline hover:text-indigo-600"
                      >
                        Ubah Jalur
                      </button>{" "}
                      <ChevronRight size={14} />{" "}
                      <b className="uppercase">
                        {tpaStream === "TPA_TBI"
                          ? "TPA & TBI"
                          : "Psikotes PKN STAN"}
                      </b>
                    </div>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onOpenTOSelection();
                      }}
                      className="w-full bg-emerald-600 dark:bg-emerald-600 text-white p-4 sm:p-6 rounded-2xl mb-8 flex justify-between items-center group shadow-lg hover:bg-emerald-700 transition-all"
                    >
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                          <Clock size={24} className="text-white/80" /> Simulasi{" "}
                          {tpaStream === "TPA_TBI" ? "TPA & TBI" : "Psikotes"}{" "}
                          Full
                        </h3>
                        <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                          {tpaStream === "TPA_TBI"
                            ? "65 Soal. 100 Menit."
                            : "TIU, Logika Gambar, Kepribadian."}
                        </p>
                      </div>
                      <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    {renderSubtests(
                      tpaStream === "TPA_TBI"
                        ? TPA_SUBTESTS
                        : PSIKOTEST_KEDINASAN_SUBTESTS,
                    )}
                  </div>
                )}
              </>
            )}
            {category === "TKA" && (
              <>
                {!tkaLevel ? (
                  <div className="grid md:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        if (onTkaLevelSelect) onTkaLevelSelect("SD");
                      }}
                      className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition text-center group shadow-sm"
                    >
                      <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                        TKA SD
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Matematika, B. Indonesia, B. Inggris
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        if (onTkaLevelSelect) onTkaLevelSelect("SMP");
                      }}
                      className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition text-center group shadow-sm"
                    >
                      <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                        TKA SMP
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Matematika, B. Indonesia, B. Inggris
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        if (onTkaLevelSelect) onTkaLevelSelect("SMA");
                      }}
                      className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition text-center group shadow-sm"
                    >
                      <GraduationCap className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
                      <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                        TKA SMA
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                        Matematika, B. Indonesia, B. Inggris
                      </p>
                    </button>
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    <div className="flex items-center gap-2 mb-4 text-sm text-slate-600 dark:text-slate-300">
                      <button
                        onClick={() => {
                          SoundManager.play("click");
                          if (onTkaLevelSelect) onTkaLevelSelect(null as any);
                        }}
                        className="underline hover:text-indigo-600"
                      >
                        Ubah Jenjang
                      </button>{" "}
                      <ChevronRight size={14} />{" "}
                      <b className="uppercase">TKA {tkaLevel}</b>
                    </div>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onOpenTOSelection();
                      }}
                      className="w-full bg-emerald-600 dark:bg-emerald-600 text-white p-4 sm:p-6 rounded-2xl mb-8 flex justify-between items-center group shadow-lg hover:bg-emerald-700 transition-all"
                    >
                      <div>
                        <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                          <Clock size={24} className="text-white/80" /> Simulasi
                          TKA {tkaLevel} Full
                        </h3>
                        <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                          90 Soal. 80% HOTS.
                        </p>
                      </div>
                      <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                    </button>
                    {renderSubtests(
                      tkaLevel === "SD"
                        ? ["Matematika", "Bahasa Indonesia"]
                        : ["Matematika", "Bahasa Indonesia", "Bahasa Inggris"],
                    )}
                  </div>
                )}
              </>
            )}
            {category === "PSIKOTEST" && (
              <>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKoran();
                    }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition text-center group shadow-sm"
                  >
                    <Calculator
                      size={48}
                      className="mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition"
                    />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                      Tes Koran (Pauli/Kraepelin)
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Uji kecepatan, ketelitian, dan stabilitas emosi dengan
                      menjumlahkan angka.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onOpenTOSelection();
                    }}
                    className="bg-white dark:bg-slate-800 p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition text-center group shadow-sm"
                  >
                    <Brain
                      size={48}
                      className="mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition"
                    />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                      Psikotes Logika & IQ
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Analogi, Deret Angka, dan Penalaran Logis (HOTS).
                    </p>
                  </button>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                    Latihan Per Subtes
                  </h3>
                  {renderSubtests(PSIKOTEST_SUBTESTS)}
                </div>
              </>
            )}
            {category === "INTERVIEW" && renderSubtests(INTERVIEW_TOPICS)}
            {category === "SKD" &&
              (!skdStream ? (
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onSkdStreamSelect("KEDINASAN");
                    }}
                    className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition text-center group"
                  >
                    <Landmark className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition" />
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                      Sekolah Kedinasan
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                      STAN, STIS, IPDN, dll
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onSkdStreamSelect("CPNS");
                    }}
                    className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 transition text-center group"
                  >
                    <Building2 className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition" />
                    <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
                      CPNS Umum
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                      Kementerian & Lembaga
                    </p>
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-4 text-sm text-slate-600 dark:text-slate-300">
                    <button
                      onClick={() => onSkdStreamSelect(null as any)}
                      className="underline"
                    >
                      Ubah Jalur
                    </button>{" "}
                    <ChevronRight size={14} /> <b>{skdStream}</b>
                  </div>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onOpenTOSelection();
                    }}
                    className="w-full bg-emerald-600 dark:bg-emerald-600 text-white p-4 sm:p-6 rounded-2xl mb-8 flex justify-between items-center shadow-lg hover:bg-emerald-700 transition-all"
                  >
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                        <Clock size={24} className="text-white/80" /> Simulasi
                        SKD CAT (110 Soal)
                      </h3>
                      <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                        TWK, TIU, TKP. Durasi 100 Menit. Scoring Resmi.
                      </p>
                    </div>
                    <ChevronRight className="group-hover:translate-x-2 transition-transform" />
                  </button>
                  {renderSubtests(SKD_SUBTESTS)}
                </>
              ))}
            {category !== "GENERAL" &&
              category !== "INTERVIEW" &&
              category !== "SKRIPSI" &&
              category !== "PSIKOTEST" &&
              category !== "KECERMATAN" &&
              category !== "BENCHMARK" && (
                <div className="mt-5 sm:mt-8 animate-fade-in-up delay-100">
                  <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white mb-2.5 sm:mb-4">
                    Mode Belajar Lainnya
                  </h3>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSession(StudyMode.DRILL);
                      }}
                      className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:shadow-md transition text-left"
                    >
                      <Zap
                        size={20}
                        className="text-amber-500 mb-1.5 sm:mb-2"
                      />
                      <div className="font-bold text-[13px] sm:text-sm text-slate-800 dark:text-white">
                        Learn & Drill
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                        Materi + 1 Soal
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSession(StudyMode.ACTIVE_RECALL);
                      }}
                      className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-indigo-500 hover:shadow-md transition text-left"
                    >
                      <Brain
                        size={20}
                        className="text-emerald-500 mb-1.5 sm:mb-2"
                      />
                      <div className="font-bold text-[13px] sm:text-sm text-slate-800 dark:text-white">
                        Active Recall
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                        Isian Singkat
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        if (onOpenAcademicHub) onOpenAcademicHub();
                      }}
                      className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900 rounded-xl hover:border-emerald-500 hover:shadow-md transition text-left"
                    >
                      <BarChart2
                        size={20}
                        className="text-emerald-500 mb-1.5 sm:mb-2"
                      />
                      <div className="font-bold text-[13px] sm:text-sm text-slate-800 dark:text-white">
                        Analisis Akademik
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                        Target Skor & Review
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        if (onBattle) onBattle();
                      }}
                      className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-900 rounded-xl hover:border-indigo-500 hover:shadow-md transition text-left"
                    >
                      <Swords
                        size={20}
                        className="text-indigo-500 mb-1.5 sm:mb-2"
                      />
                      <div className="font-bold text-[13px] sm:text-sm text-slate-800 dark:text-white">
                        Battle Arena
                      </div>
                      <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-tight">
                        1v1 Duel
                      </div>
                    </button>
                  </div>
                </div>
              )}
          </>
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---

function App() {
  const [currentView, setCurrentView] = useState<
    | "SPLASH"
    | "LOGIN"
    | "USERNAME_SETUP"
    | "HOME"
    | "DASHBOARD"
    | "TO_SELECTION"
    | "SESSION"
    | "RESULTS"
    | "HISTORY"
    | "RESUME_LIST"
    | "REVIEW"
    | "COLORBLIND"
    | "TES_KORAN"
    | "TES_KECERMATAN"
    | "BENCHMARK"
    | "GLOBAL_LEADERBOARD"
    | "ACADEMIC_HUB"
    | "SOCIAL_HUB"
    | "BATTLE"
    | "MARKED_QUESTIONS"
  >("SPLASH");
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(
    null,
  );
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [benchmarkTab, setBenchmarkTab] = useState<"DASHBOARD" | "RANKING">(
    "DASHBOARD",
  );
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ level: number } | null>(
    null,
  );
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    { id: string; label: string; type: "CATEGORY" | "FEATURE" }[]
  >([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Updated Settings State with Lazy Initialization
  const [settings, setSettings] = useState<AppSettings>(() => {
    const savedSettings = localStorage.getItem("fajmuls_settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (!parsed.theme) parsed.theme = parsed.darkMode ? "dark" : "light";
        if (!parsed.appBaseColor) {
          parsed.appBaseColor = parsed.darkMode ? "#0f172a" : "#ffffff";
          if (parsed.appBackground === "grid") parsed.appPattern = "grid";
          else if (parsed.appBackground === "dots") parsed.appPattern = "dots";
          else if (parsed.appBackground === "waves") parsed.appPattern = "waves";
          else if (parsed.appBackground === "aurora") parsed.appPattern = "aurora";
          else if (parsed.appBackground === "fajmuls") parsed.appPattern = "fajmuls";
          else parsed.appPattern = "none";
        }
        if (!parsed.fontSize) parsed.fontSize = "md";
        return parsed;
      } catch (e) {
        console.error("Gagal memanggil pengaturan di awal", e);
      }
    }
    return {
      soundEnabled: true,
      musicEnabled: true,
      vibrationEnabled: true,
      autoNextQuestion: true,
      volume: 0.5,
      funnyNotifications: true,
      confirmActions: true,
      darkMode: false,
      theme: "light",
      appBaseColor: "#ffffff",
      appPattern: "none",
      fontSize: "md",
    };
  });

  const isSettingsLoadedFromCloudRef = useRef(false);

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [generalInput, setGeneralInput] = useState<GeneralMaterialInput | null>(
    null,
  );
  const [isReadingMaterial, setIsReadingMaterial] = useState(false);
  const [selectedSubtest, setSelectedSubtest] = useState<string>("");
  const [sessionMode, setSessionMode] = useState<StudyMode | null>(null);
  const [skdStream, setSkdStream] = useState<SkdStreamType | null>(null);
  const [tpaStream, setTpaStream] = useState<TpaStreamType | null>(null);
  const [tkaLevel, setTkaLevel] = useState<TkaLevelType | null>(null);
  const [weakTopics, setWeakTopics] = useState<Set<string>>(new Set());
  const [kecermatanMode, setKecermatanMode] = useState<KecermatanMode>("ANGKA");
  const [benchmarkMode, setBenchmarkMode] = useState<BenchmarkMode | null>(
    null,
  );
  const [colorBlindSpectrum, setColorBlindSpectrum] = useState<
    | "MIXED"
    | "GREEN"
    | "PURPLE"
    | "RED"
    | "BLUE"
    | "GRAYSCALE"
    | "CYAN_MAGENTA"
    | "YELLOW_BLUE"
    | "BROWN_GREEN"
    | "PASTEL"
    | undefined
  >(undefined);
  const [generalMethod, setGeneralMethod] = useState<GeneralStudyMethod | null>(
    null,
  );
  const [flashcards, setFlashcards] = useState<FlashcardData[]>([]);
  const [mindMapData, setMindMapData] = useState<MindMapNode | null>(null);
  const [skripsiFeature, setSkripsiFeature] = useState<SkripsiFeature | null>(
    null,
  );
  const [skripsiResult, setSkripsiResult] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [drillContent, setDrillContent] = useState<DrillMaterial | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [initialSessionState, setInitialSessionState] = useState<
    SavedSessionState | undefined
  >(undefined);
  const [savedSessions, setSavedSessions] = useState<SavedSessionState[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [resumeModalData, setResumeModalData] =
    useState<SavedSessionState | null>(null);
  const [currentPackageTitle, setCurrentPackageTitle] = useState<
    string | undefined
  >(undefined);
  const [sessionDuration, setSessionDuration] = useState<number | undefined>(
    undefined,
  );
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [testHistory, setTestHistory] = useState<TestHistoryItem[]>([]);
  const [reviewItem, setReviewItem] = useState<TestHistoryItem | null>(null);
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const showToast = (msg: string, type: "success" | "error" | "info") =>
    setToast({ msg, type });
  const [availablePackages, setAvailablePackages] = useState<
    StaticTestPackage[]
  >([
    ...INITIAL_SKD_PACKAGES,
    ...INITIAL_SKD_KEDINASAN_PACKAGES,
    ...INITIAL_UTBK_PACKAGES,
    ...INITIAL_TPA_PACKAGES,
    ...INITIAL_PSIKOTEST_PACKAGES,
    ...INITIAL_UTBK_HOTS_PACKAGES,
    ...INITIAL_SKD_CPNS_HOTS_PACKAGES,
    ...INITIAL_TPA_HOTS_PACKAGES,
  ]);
  const [activeGenTask, setActiveGenTask] = useState<BackgroundGenTask | null>(
    null,
  );

  const [showTutor, setShowTutor] = useState(false);
  const [tutorContext, setTutorContext] = useState<string | undefined>();
  const [showCommanderMenu, setShowCommanderMenu] = useState(false);
  const [showPomodoro, setShowPomodoro] = useState(false);

  const checkResumableSession = async (uid: string) => {
    try {
      const savedData = localStorage.getItem("fajmuls_active_session");
      if (savedData) {
        const localSession = JSON.parse(savedData) as SavedSessionState;
        if (
          localSession.uid === uid &&
          Date.now() - localSession.timestamp < 24 * 60 * 60 * 1000
        ) {
          setResumeModalData(localSession);
          return true;
        } else {
          localStorage.removeItem("fajmuls_active_session");
        }
      }
    } catch (e) {
      localStorage.removeItem("fajmuls_active_session");
    }
    return false;
  };
  const loadSessionState = (session: SavedSessionState) => {
    setSelectedCategory(session.category);
    setSessionMode(session.mode);
    setQuestions(session.questions);
    setDrillContent(session.drillContent);
    if (session.skdStream) setSkdStream(session.skdStream);
    if (session.tpaStream) setTpaStream(session.tpaStream);
    if (session.tkaLevel) setTkaLevel(session.tkaLevel);
    if (session.packageTitle) setCurrentPackageTitle(session.packageTitle);
    setInitialSessionState(session);
    setResumeModalData(null);
    setCurrentView("SESSION");
  };
  const discardSession = () => {
    localStorage.removeItem("fajmuls_active_session");
    setResumeModalData(null);
  };
  const handleOpenResumeList = async () => {
    SoundManager.play("click");
    if (!userProfile?.uid || userProfile.isGuest) {
      showToast("Fitur ini hanya untuk pengguna login.", "info");
      return;
    }
    setLoadingSessions(true);
    setCurrentView("RESUME_LIST");
    try {
      const sessions = await FirebaseService.getAllSavedSessions(
        userProfile.uid,
      );
      setSavedSessions(sessions);
    } catch (e) {
      showToast("Gagal memuat sesi tersimpan.", "error");
    } finally {
      setLoadingSessions(false);
    }
  };
  const handleResumeSession = async (session: SavedSessionState) => {
    SoundManager.play("click");
    loadSessionState(session);
    if (session.id && userProfile?.uid) {
      await FirebaseService.deleteSavedSession(userProfile.uid, session.id);
    }
  };
  const handleDeleteSavedSession = async (sessionId: string) => {
    SoundManager.play("click");
    if (userProfile?.uid) {
      await FirebaseService.deleteSavedSession(userProfile.uid, sessionId);
      setSavedSessions((prev) =>
        prev.filter(
          (s) => s.id !== sessionId && String(s.timestamp) !== sessionId,
        ),
      );
      showToast("Sesi dihapus.", "success");
    }
  };

  useEffect(() => {
    if (!testHistory || testHistory.length === 0) {
      setWeakTopics(new Set());
      return;
    }

    const weaks = new Set<string>();
    const recentHistory = testHistory.slice(0, 5);
    recentHistory.forEach(session => {
        if (session.answers) {
            session.answers.forEach((ans: any) => {
                if (!ans.isCorrect && ans.question && ans.question.metadata && ans.question.metadata.topic) {
                    weaks.add(ans.question.metadata.topic);
                }
            });
        }
    });

    setWeakTopics(weaks);
  }, [testHistory]);

  // Auto-dismiss completed/failed generation tasks
  useEffect(() => {
    if (activeGenTask && (activeGenTask.status === 'completed' || activeGenTask.status === 'failed')) {
      const timer = setTimeout(() => {
        setActiveGenTask(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeGenTask?.status]);

  useEffect(() => {
    const handleOpenTutor = (e: CustomEvent) => {
      setTutorContext(e.detail?.context);
      setShowTutor(true);
    };
    window.addEventListener("openAiTutor", handleOpenTutor as EventListener);

    const unsubscribe = FirebaseService.subscribeToAuth(
      async (firebaseUser) => {
        setIsInitializing(true);
        if (firebaseUser) {
          try {
            let profile = null;
            let isOfflineMode = false;
            try {
              profile = await FirebaseService.getUserProfile(firebaseUser.uid);
              if (profile) {
                // Cache successful profile fetch for offline use
                localStorage.setItem(
                  `profile_cache_${firebaseUser.uid}`,
                  JSON.stringify(profile),
                );
              }
            } catch (profileErr: any) {
              console.warn(
                "Profile fetch error, trying local cache",
                profileErr,
              );
              isOfflineMode = true;

              // Try cache
              const cachedProfileStr = localStorage.getItem(
                `profile_cache_${firebaseUser.uid}`,
              );
              if (cachedProfileStr) {
                try {
                  profile = JSON.parse(cachedProfileStr);
                  showToast(
                    "Menjalankan dalam mode offline dengan profil tersimpan.",
                    "info",
                  );
                } catch (e) {}
              }

              if (!profile) {
                // Fallback to active memory profile
                profile = {
                  username:
                    firebaseUser.displayName ||
                    firebaseUser.email?.split("@")[0] ||
                    "Tamu",
                  email: firebaseUser.email,
                  photoURL: firebaseUser.photoURL,
                  gamification:
                    GamificationService?.INITIAL_GAMIFICATION_PROFILE || {
                      level: 1,
                      xp: 0,
                      coins: 0,
                      dailyStreak: 0,
                      maxStreak: 0,
                      achievements: [],
                      stats: {
                        totalSeconds: 0,
                        totalAnswers: 0,
                        correctAnswers: 0,
                      },
                      streak: 0,
                      lastActivityDate: null,
                    },
                  isOfflineFallback: true,
                };
                showToast(
                  "Gagal menjangkau server. Profil offline sementara digunakan.",
                  "info",
                );
              }
            }

            if (profile) {
              let updatedProfile = profile;

              // Apply settings from cloud if available
              if (profile.settings && !isOfflineMode) {
                isSettingsLoadedFromCloudRef.current = true;
                setSettings((prev) => ({ ...prev, ...profile.settings }));
              } else {
                isSettingsLoadedFromCloudRef.current = true;
              }

              if (profile.gamification && !isOfflineMode) {
                try {
                  const newGamification = GamificationService.updateStreak(
                    profile.gamification,
                  );
                  if (
                    newGamification.streak !== profile.gamification.streak ||
                    newGamification.lastActiveDate !==
                      profile.gamification.lastActiveDate
                  ) {
                    await FirebaseService.updateGamificationProfile(
                      firebaseUser.uid,
                      newGamification,
                    );
                    updatedProfile = {
                      ...profile,
                      gamification: newGamification,
                    };
                    localStorage.setItem(
                      `profile_cache_${firebaseUser.uid}`,
                      JSON.stringify(updatedProfile),
                    );
                  }
                } catch (streakErr) {
                  console.warn(
                    "Failed to sync/update streak with cloud",
                    streakErr,
                  );
                }
              }

              setUserProfile({
                uid: firebaseUser.uid,
                username: updatedProfile.username,
                email: firebaseUser.email,
                photoURL: updatedProfile.photoURL || firebaseUser.photoURL,
                gamification: updatedProfile.gamification,
              });

              let cloudHistory = [];
              try {
                cloudHistory = await FirebaseService.getUserHistoryFromCloud(
                  firebaseUser.uid,
                );
                if (cloudHistory && cloudHistory.length > 0) {
                  localStorage.setItem(
                    `history_cache_${firebaseUser.uid}`,
                    JSON.stringify(cloudHistory),
                  );
                }
              } catch (historyErr) {
                console.error(
                  "Failed to load history from cloud, trying local cache",
                  historyErr,
                );
                const cachedHistoryStr = localStorage.getItem(
                  `history_cache_${firebaseUser.uid}`,
                );
                if (cachedHistoryStr) {
                  try {
                    cloudHistory = JSON.parse(cachedHistoryStr);
                  } catch (e) {}
                }
              }
              setTestHistory(cloudHistory);

              try {
                await checkResumableSession(firebaseUser.uid);
              } catch (resumeErr) {
                console.warn(
                  "Resumable session check failed offline",
                  resumeErr,
                );
              }

              if (currentView === "SPLASH" || currentView === "LOGIN") {
                setCurrentView("HOME");
              }
            } else {
              setUserProfile({
                uid: firebaseUser.uid,
                username: "",
                email: firebaseUser.email,
                photoURL: firebaseUser.photoURL,
              });
              setCurrentView("USERNAME_SETUP");
            }
          } catch (e: any) {
            console.error("Critical Profile loading failure", e);
            if (e?.message?.includes("Missing or insufficient permissions")) {
              showToast(
                "Gagal memuat profil: Aturan Keamanan Firestore memblokir akses. Silakan perbarui firestore.rules Anda.",
                "error",
              );
              await FirebaseService.logoutUser();
            } else {
              showToast("Gagal memuat profil. Silakan coba lagi.", "error");
              await FirebaseService.logoutUser();
            }
          }
        } else {
          isSettingsLoadedFromCloudRef.current = false;
          const guestState = localStorage.getItem("fajmuls_guest_mode");
          if (guestState === "true") {
            const savedUser = localStorage.getItem("fajmuls_guest_username");
            const fakeUid = "guest-" + (savedUser || "user");

            // Initialize or load gamification profile for guests
            let guestGamification =
              GamificationService.INITIAL_GAMIFICATION_PROFILE;
            const cached = localStorage.getItem("fajmuls_guest_gamification");
            if (cached) {
              try {
                guestGamification = JSON.parse(cached);
              } catch (e) {}
            }
            guestGamification =
              GamificationService.updateStreak(guestGamification);
            localStorage.setItem(
              "fajmuls_guest_gamification",
              JSON.stringify(guestGamification),
            );

            setUserProfile({
              uid: fakeUid,
              username: savedUser || "Tamu",
              email: null,
              isGuest: true,
              gamification: guestGamification,
            });

            const localHistory = localStorage.getItem("fajmuls_guest_history");
            if (localHistory) {
              try {
                setTestHistory(JSON.parse(localHistory));
              } catch (e) {}
            }
            await checkResumableSession(fakeUid);
            if (currentView === "SPLASH" || currentView === "LOGIN") {
              setCurrentView("HOME");
            }
          } else {
            if (currentView !== "SPLASH") setCurrentView("LOGIN");
          }
        }
        setIsInitializing(false);
        setAuthLoading(false);
      },
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem("fajmuls_settings", JSON.stringify(settings));
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    SoundManager.syncSettings(settings);
    if (
      userProfile &&
      !userProfile.isGuest &&
      userProfile.uid &&
      isSettingsLoadedFromCloudRef.current
    ) {
      FirebaseService.saveUserSettings(userProfile.uid, settings).catch((e) =>
        console.warn("Gagal menyimpan pengaturan ke cloud", e),
      );
    }
  }, [settings, userProfile, userProfile?.uid]);

  // ... (Existing login, history, profile handlers) ...
  const handleGoogleLogin = async (rememberMe: boolean) => {
    setAuthLoading(true);
    try {
      const firebaseUser = await FirebaseService.signInWithGoogle(rememberMe);
      const profile = await FirebaseService.getUserProfile(firebaseUser.uid);
      if (!profile) {
        setUserProfile({
          uid: firebaseUser.uid,
          username: "",
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });
        setCurrentView("USERNAME_SETUP");
      }
    } catch (e: any) {
      if (e?.message?.includes("Missing or insufficient permissions")) {
        showToast(
          "Aturan Keamanan Firestore memblokir akses. Perbarui firestore.rules Anda.",
          "error",
        );
        await FirebaseService.logoutUser();
      } else {
        showToast(
          "Gagal login dengan Google. Jika popup terblokir, coba gunakan mode penyamaran atau izinkan popup.",
          "error",
        );
      }
      setAuthLoading(false);
    }
  };

  const handleGuestLogin = () => {
    SoundManager.play("click");
    localStorage.setItem("fajmuls_guest_mode", "true");
    localStorage.setItem("fajmuls_guest_username", "Tamu");

    let guestGamification = GamificationService.INITIAL_GAMIFICATION_PROFILE;
    const cached = localStorage.getItem("fajmuls_guest_gamification");
    if (cached) {
      try {
        guestGamification = JSON.parse(cached);
      } catch (e) {}
    }
    guestGamification = GamificationService.updateStreak(guestGamification);
    localStorage.setItem(
      "fajmuls_guest_gamification",
      JSON.stringify(guestGamification),
    );

    setUserProfile({
      uid: "guest-" + Date.now(),
      username: "Tamu",
      email: null,
      isGuest: true,
      gamification: guestGamification,
    });

    const localSaved = localStorage.getItem("fajmuls_guest_history");
    if (localSaved) {
      try {
        setTestHistory(JSON.parse(localSaved));
      } catch (e) {}
    } else {
      setTestHistory([]);
    }
    setCurrentView("HOME");
  };

  const handleUsernameSetupSubmit = async (username: string) => {
    if (!userProfile?.uid) return;
    setAuthLoading(true);
    try {
      const isAvailable =
        await FirebaseService.checkUsernameAvailability(username);
      if (!isAvailable) {
        showToast("Username sudah dipakai. Pilih yang lain.", "error");
        setAuthLoading(false);
        return;
      }
      await FirebaseService.saveUserProfile(userProfile.uid, {
        username: username,
        email: userProfile.email || "",
        photoURL: userProfile.photoURL || "",
      });

      const initialStreakGamification = GamificationService.updateStreak(
        GamificationService.INITIAL_GAMIFICATION_PROFILE,
      );
      await FirebaseService.updateGamificationProfile(
        userProfile.uid,
        initialStreakGamification,
      );

      setUserProfile((prev) =>
        prev
          ? { ...prev, username, gamification: initialStreakGamification }
          : null,
      );
      setTestHistory([]);
      SoundManager.play("success");
      setCurrentView("HOME");
    } catch (e) {
      showToast("Gagal membuat profil.", "error");
    } finally {
      setAuthLoading(false);
    }
  };
  const handleLogout = async () => {
    SoundManager.play("click");
    localStorage.removeItem("fajmuls_guest_mode");
    localStorage.removeItem("fajmuls_guest_username");
    localStorage.removeItem("fajmuls_active_session");
    if (!userProfile?.isGuest) {
      await FirebaseService.logoutUser();
    }
    setUserProfile(null);
    setTestHistory([]);
    setCurrentView("LOGIN");
  };
  const saveToHistory = async (item: TestHistoryItem) => {
    const updated = [item, ...testHistory];
    setTestHistory(updated);
    if (userProfile?.isGuest) {
      localStorage.setItem(
        "fajmuls_guest_history",
        JSON.stringify(updated, getCircularReplacer()),
      );
    } else if (userProfile?.uid) {
      await FirebaseService.saveHistoryToCloud(userProfile.uid, item);
    }
  };
  const deleteHistory = async (id: string) => {
    const updated = testHistory.filter((item) => item.id !== id);
    setTestHistory(updated);
    if (userProfile?.isGuest) {
      localStorage.setItem("fajmuls_guest_history", JSON.stringify(updated));
    } else if (userProfile?.uid) {
      await FirebaseService.deleteHistoryFromCloud(userProfile.uid, id);
    }
    showToast("Riwayat berhasil dihapus.", "success");
    SoundManager.play("click");
  };
  const handleToggleStudied = async (id: string) => {
    const updated = testHistory.map((item) =>
      item.id === id ? { ...item, isStudied: !item.isStudied } : item,
    );
    setTestHistory(updated);
    if (userProfile?.isGuest) {
      localStorage.setItem("fajmuls_guest_history", JSON.stringify(updated));
    } else if (userProfile?.uid) {
      const item = updated.find((i) => i.id === id);
      if (item) {
        await FirebaseService.saveHistoryToCloud(userProfile.uid, item);
      }
    }
    SoundManager.play("click");
  };
  const handleUpdateProfile = async (data: {
    username?: string;
    photoURL?: string;
  }) => {
    if (userProfile?.isGuest) {
      if (data.username) {
        setUserProfile((prev) =>
          prev ? { ...prev, username: data.username! } : null,
        );
        localStorage.setItem("fajmuls_guest_username", data.username!);
        showToast("Nama Tamu diubah.", "success");
      }
      return;
    }
    if (userProfile?.uid) {
      try {
        await FirebaseService.updateUserProfile(userProfile.uid, data);
        setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
        showToast("Profil berhasil diperbarui!", "success");
      } catch (e: any) {
        showToast(e.message || "Gagal memperbarui profil.", "error");
      }
    }
  };
  const handleGeneralInputSubmit = async (input: GeneralMaterialInput) => {
    setLoading(true);
    try {
      const extractedText = await Gemini.extractTextFromMaterial(input);
      setGeneralInput({ ...input, extractedText });
      setIsReadingMaterial(true);
    } catch (e) {
      showToast("Gagal memproses materi. Coba lagi.", "error");
    } finally {
      setLoading(false);
    }
  };
  const startSkripsiSession = async (
    feature: SkripsiFeature,
    input: string,
  ) => {
    if (!input.trim()) {
      showToast("Mohon isi judul atau topik.", "error");
      return;
    }
    setLoading(true);
    setSkripsiFeature(feature);
    try {
      const res = await Gemini.generateSkripsiContent(input, feature);
      setSkripsiResult(res);
      setCurrentView("SESSION");
    } catch (e) {
      showToast("Gagal generate konten skripsi.", "error");
    } finally {
      setLoading(false);
    }
  };
  const startGeneralSession = async (method: GeneralStudyMethod) => {
    if (!generalInput) {
      showToast("Materi hilang. Silakan input ulang.", "error");
      return;
    }
    setLoading(true);
    setGeneralMethod(method);
    setSessionMode(StudyMode.DRILL);
    try {
      if (
        method === "ACTIVE_RECALL" ||
        method === "PBL" ||
        method === "PRACTICE" ||
        method === "TEACHING"
      ) {
        const qs = await Gemini.generateQuestions(
          StudyMode.DRILL,
          "GENERAL",
          generalInput,
          5,
          [],
          undefined,
          method,
        );
        setQuestions(qs);
      } else if (method === "SPACED_REPETITION") {
        const fcs = await Gemini.generateFlashcards(generalInput);
        setFlashcards(fcs);
      } else if (method === "MIND_MAP") {
        const mm = await Gemini.generateMindMap(generalInput);
        setMindMapData(mm);
      }
      setCurrentView("SESSION");
    } catch (e) {
      showToast("Gagal memuat materi AI.", "error");
    } finally {
      setLoading(false);
    }
  };
  const startSmartReviewSession = (questions: Question[]) => {
    if (questions.length === 0) {
      showToast("Tidak ada soal salah untuk dikerjakan.", "info");
      return;
    }
    setQuestions(questions);
    setSessionMode(StudyMode.DRILL);
    setCurrentPackageTitle("Smart Review: Weakness Attack");
    setInitialSessionState(undefined);
    setCurrentView("SESSION");
  };
  const startSession = async (
    mode: StudyMode,
    difficultyOverride?: string,
    countOverride?: number,
    topicOverride?: string
  ) => {
    if (!selectedCategory) return;
    setCurrentPackageTitle(undefined);
    setInitialSessionState(undefined);
    if (
      ["UTBK", "SKD", "TPA", "PSIKOTEST", "INTERVIEW"].includes(
        selectedCategory,
      ) &&
      !selectedSubtest && !topicOverride &&
      mode !== StudyMode.SIMULATION &&
      mode !== StudyMode.WEAKNESS
    ) {
      showToast(`Harap pilih topik/subtes untuk ${selectedCategory}.`, "error");
      return;
    }
    if (selectedCategory === "SKD" && !skdStream) {
      showToast("Harap pilih jalur (CPNS / Kedinasan).", "error");
      return;
    }
    if (selectedCategory === "TKA" && !tkaLevel) {
      showToast("Harap pilih level TKA (SD/SMP/SMA).", "error");
      return;
    }
    setLoading(true);
    setSessionMode(mode);
    setUserAnswers([]);
    setQuestions([]);
    setDrillContent(null);
    try {
      const context = topicOverride || selectedSubtest;
      if (mode === StudyMode.DRILL) {
        const data = await Gemini.generateDrillContent(
          selectedCategory,
          context,
          skdStream || undefined,
        );
        setDrillContent(data);
        if (data && data.question) {
          setQuestions([data.question]);
        }
      } else if (
        mode === StudyMode.SIMULATION &&
        selectedCategory === "SKD" &&
        skdStream
      ) {
        const qs = await Gemini.generateSkdSimulation(skdStream);
        setQuestions(qs || []);
      } else if (mode === StudyMode.SIMULATION && selectedCategory === "UTBK") {
        const qs = await Gemini.generateUtbkSimulation();
        setQuestions(qs || []);
      } else if (mode === StudyMode.SIMULATION && selectedCategory === "TPA") {
        if (tpaStream === "PSIKOTEST_KEDINASAN") {
          const qs = await Gemini.generatePsikotestKedinasanSimulation();
          setQuestions(qs || []);
        } else {
          const qs = await Gemini.generateTpaTbiSimulation();
          setQuestions(qs || []);
        }
      } else if (
        mode === StudyMode.SIMULATION &&
        selectedCategory === "PSIKOTEST"
      ) {
        const qs = await Gemini.generatePsikotestSimulation();
        setQuestions(qs || []);
      } else if (
        mode === StudyMode.SIMULATION &&
        selectedCategory === "TKA" &&
        tkaLevel
      ) {
        const qs = await Gemini.generateTkaSimulation(tkaLevel);
        setQuestions(qs || []);
      } else {
        let count = countOverride || 5;
        if (selectedCategory === "PSIKOTEST" && mode === StudyMode.SIMULATION)
          count = 40;
        if (selectedCategory === "INTERVIEW") count = 3;
        setLoading(false);
        setIsLoadingMore(true);
        setCurrentView("SESSION");
        try {
          const stream = Gemini.generateQuestionsStream(
            mode,
            selectedCategory,
            context,
            count,
            Array.from(weakTopics),
            skdStream || undefined,
            undefined,
            difficultyOverride,
          );
          for await (const chunk of stream) {
            setQuestions(chunk);
          }
        } finally {
          setIsLoadingMore(false);
          showToast("Soal berhasil dibuat!", "success");
        }
        return;
      }
      setCurrentView("SESSION");
      showToast("Soal berhasil dibuat!", "success");
    } catch (e) {
      console.error(e);
      showToast(
        "Gagal memuat soal. Kemungkinan traffic AI sedang tinggi. Coba lagi.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };
  // Search Logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const results: {
      id: string;
      label: string;
      type: "CATEGORY" | "FEATURE";
    }[] = [];

    // Categories
    CATEGORIES.forEach((cat) => {
      if (
        cat.name.toLowerCase().includes(q) ||
        cat.desc.toLowerCase().includes(q)
      ) {
        results.push({ id: cat.id, label: cat.name, type: "CATEGORY" });
      }
    });

    // Features / Games
    if ("tes koran pauli kraepelin".includes(q))
      results.push({
        id: "TES_KORAN",
        label: "Tes Koran (Pauli/Kraepelin)",
        type: "FEATURE",
      });
    if ("kecermatan angka hilang".includes(q))
      results.push({
        id: "KECERMATAN_ANGKA",
        label: "Kecermatan Angka",
        type: "FEATURE",
      });
    if ("kecermatan huruf hilang".includes(q))
      results.push({
        id: "KECERMATAN_HURUF",
        label: "Kecermatan Huruf",
        type: "FEATURE",
      });

    // SKD Streams
    if ("skd cpns".includes(q) || "cpns".includes(q))
      results.push({
        id: "SKD_STREAM_CPNS",
        label: "SKD CPNS",
        type: "FEATURE",
      });
    if ("skd kedinasan".includes(q) || "kedinasan".includes(q))
      results.push({
        id: "SKD_STREAM_KEDINASAN",
        label: "SKD Kedinasan",
        type: "FEATURE",
      });

    // Color Blind / Visual Tests
    // Note: BUTAWRNA category is already in CATEGORIES loop.
    if ("tes spektrum warna hue sorting gradasi".includes(q))
      results.push({
        id: "HUE_SORT_MIXED",
        label: "Tes Spektrum Warna (Hue Sorting)",
        type: "FEATURE",
      });
    if ("tes gradasi hijau green".includes(q))
      results.push({
        id: "HUE_SORT_GREEN",
        label: "Tes Gradasi Hijau",
        type: "FEATURE",
      });
    if ("tes gradasi ungu purple".includes(q))
      results.push({
        id: "HUE_SORT_PURPLE",
        label: "Tes Gradasi Ungu",
        type: "FEATURE",
      });
    if ("tes gradasi merah red".includes(q))
      results.push({
        id: "HUE_SORT_RED",
        label: "Tes Gradasi Merah",
        type: "FEATURE",
      });
    if ("tes gradasi biru blue".includes(q))
      results.push({
        id: "HUE_SORT_BLUE",
        label: "Tes Gradasi Biru",
        type: "FEATURE",
      });
    if ("tes gradasi hitam putih grayscale".includes(q))
      results.push({
        id: "HUE_SORT_GRAYSCALE",
        label: "Tes Gradasi Hitam-Putih (Grayscale)",
        type: "FEATURE",
      });
    if ("tes gradasi cyan magenta".includes(q))
      results.push({
        id: "HUE_SORT_CYAN_MAGENTA",
        label: "Tes Gradasi Cyan-Magenta",
        type: "FEATURE",
      });
    if ("tes gradasi kuning biru tritan".includes(q))
      results.push({
        id: "HUE_SORT_YELLOW_BLUE",
        label: "Tes Gradasi Kuning-Biru (Tritan)",
        type: "FEATURE",
      });
    if ("tes gradasi coklat hijau deutan".includes(q))
      results.push({
        id: "HUE_SORT_BROWN_GREEN",
        label: "Tes Gradasi Coklat-Hijau (Deutan)",
        type: "FEATURE",
      });
    if ("tes gradasi pastel rainbow".includes(q))
      results.push({
        id: "HUE_SORT_PASTEL",
        label: "Tes Gradasi Pastel Rainbow",
        type: "FEATURE",
      });
    if ("tes visual depth perception kedalaman".includes(q))
      results.push({
        id: "DEPTH_PERCEPTION",
        label: "Tes Persepsi Kedalaman (Visual)",
        type: "FEATURE",
      });

    // Benchmarks
    const benchmarks = [
      { id: "REACTION", label: "Reaction Time" },
      { id: "AIM", label: "Aim Trainer" },
      { id: "SEQUENCE", label: "Sequence Memory" },
      { id: "CHIMP", label: "Chimp Test" },
      { id: "VISUAL", label: "Visual Memory" },
      { id: "NUMBER", label: "Number Memory" },
      { id: "VERBAL", label: "Verbal Memory" },
      { id: "TYPING", label: "Typing Test" },
      { id: "BRIDGE", label: "Bridge Memory" },
      { id: "MATCH", label: "Match Memory" },
    ];
    benchmarks.forEach((b) => {
      if (b.label.toLowerCase().includes(q))
        results.push({ id: b.id, label: b.label, type: "FEATURE" });
    });

    setSearchResults(results);
    setShowSearchDropdown(results.length > 0);
  }, [searchQuery]);

  const handleSessionComplete = async (
    answers: UserAnswer[],
    historyItemOverride?: TestHistoryItem,
    isAborted: boolean = false,
  ) => {
    let finalItem: TestHistoryItem;
    if (historyItemOverride) {
      finalItem = { ...historyItemOverride, isAborted };
    } else {
      setUserAnswers(answers);
      let finalScore = 0;
      let maxScore = 0;
      let details: any = undefined;
      if (selectedCategory === "SKD" && sessionMode === StudyMode.SIMULATION) {
        let twk = 0,
          tiu = 0,
          tkp = 0;
        answers.forEach((a) => {
          const q = questions.find((q) => q.id === a.questionId);
          if (q) {
            if (q.metadata?.subtest?.includes("TWK")) twk += a.scoreEarned;
            if (q.metadata?.subtest?.includes("TIU")) tiu += a.scoreEarned;
            if (q.metadata?.subtest?.includes("TKP")) tkp += a.scoreEarned;
          }
        });
        finalScore = twk + tiu + tkp;
        maxScore = 550;
        const hasTwk = questions.some((q) => q.metadata?.subtest?.includes("TWK"));
        const hasTiu = questions.some((q) => q.metadata?.subtest?.includes("TIU"));
        const hasTkp = questions.some((q) => q.metadata?.subtest?.includes("TKP"));

        details = {
          twk,
          tiu,
          tkp,
          total: finalScore,
          passed:
            (!hasTwk || twk >= 65) &&
            (!hasTiu || tiu >= 80) &&
            (!hasTkp || tkp >= 166),
        };
      } else if (
        selectedCategory === "UTBK" &&
        sessionMode === StudyMode.SIMULATION
      ) {
        // FIX: Handle empty answers (score 0)
        if (answers.length === 0) {
          finalScore = 0;
          maxScore = 1000;
          details = {
            pu: 0,
            ppu: 0,
            pbm: 0,
            pk: 0,
            lbi: 0,
            lbe: 0,
            pm: 0,
            average: 0,
          };
        } else {
          const calculateIrt = (subKeywords: string[]) => {
            // Match any of the keywords
            const subQs = questions.filter((q) =>
              subKeywords.some((k) => q.metadata?.subtest?.includes(k)),
            );
            if (!subQs.length) return 0;
            const correct = answers.filter(
              (a) =>
                a.isCorrect &&
                questions.find((q) => q.id === a.questionId)?.metadata
                  ?.subtest &&
                subKeywords.some((k) =>
                  questions
                    .find((q) => q.id === a.questionId)
                    ?.metadata?.subtest?.includes(k),
                ),
            ).length;
            // Base 200 + (ratio * 800) -> Max 1000. Standard UTBK usually 200-1000 scale.
            // User requested 0 if empty, but here we assume at least 1 answer exists.
            // If 0 correct but attempted, score is 200.
            return Math.round(200 + (correct / subQs.length) * 800);
          };
          // Updated keywords to match UTBK_SUBTESTS constants
          const pu = calculateIrt(["Penalaran Umum"]);
          const ppu = calculateIrt([
            "Pengetahuan & Pemahaman Umum",
            "PPU",
            "Pengetahuan dan Pemahaman Umum",
          ]);
          const pbm = calculateIrt([
            "Pemahaman Bacaan & Menulis",
            "PBM",
            "Pemahaman Bacaan dan Menulis",
            "BBM",
          ]);
          const pk = calculateIrt(["Pengetahuan Kuantitatif", "Kuantitatif"]);
          const lbi = calculateIrt([
            "Literasi Bahasa Indonesia",
            "Bahasa Indonesia",
          ]);
          const lbe = calculateIrt([
            "Literasi Bahasa Inggris",
            "Bahasa Inggris",
          ]);
          const pm = calculateIrt(["Penalaran Matematika"]);

          const avg = Math.round((pu + ppu + pbm + pk + lbi + lbe + pm) / 7);
          finalScore = avg;
          maxScore = 1000;
          details = { pu, ppu, pbm, pk, lbi, lbe, pm, average: avg };
        }
      } else if (
        selectedCategory === "TKA" &&
        sessionMode === StudyMode.SIMULATION
      ) {
        if (answers.length === 0) {
          finalScore = 0;
          maxScore = 1000;
          details = { math: 0, indonesian: 0, english: 0, average: 0 };
        } else {
          const calculateIrt = (subKeywords: string[]) => {
            const subQs = questions.filter((q) =>
              subKeywords.some((k) => q.metadata?.subtest?.includes(k)),
            );
            if (!subQs.length) return 0;
            const correct = answers.filter(
              (a) =>
                a.isCorrect &&
                questions.find((q) => q.id === a.questionId)?.metadata
                  ?.subtest &&
                subKeywords.some((k) =>
                  questions
                    .find((q) => q.id === a.questionId)
                    ?.metadata?.subtest?.includes(k),
                ),
            ).length;
            return Math.round(200 + (correct / subQs.length) * 800);
          };
          const math = calculateIrt(["Matematika"]);
          const indonesian = calculateIrt(["Bahasa Indonesia"]);
          const english = calculateIrt(["Bahasa Inggris"]);
          const avg = Math.round((math + indonesian + english) / 3);
          finalScore = avg;
          maxScore = 1000;
          details = { math, indonesian, english, average: avg };
        }
      } else if (
        selectedCategory === "TPA" &&
        sessionMode === StudyMode.SIMULATION
      ) {
        if (tpaStream === "PSIKOTEST_KEDINASAN") {
          let tiuScore = 0;
          let figuralScore = 0;
          let personalityPoints = 0;
          let personalityQuestions = 0;
          answers.forEach((a) => {
            const q = questions.find((q) => q.id === a.questionId);
            if (q) {
              if (q.metadata.subtest.includes("TIU")) tiuScore += a.scoreEarned;
              else if (
                q.metadata.subtest.includes("Gambar") ||
                q.metadata.subtest.includes("Figural")
              )
                figuralScore += a.scoreEarned;
              else if (q.metadata.subtest.includes("Kepribadian")) {
                personalityPoints += a.scoreEarned;
                personalityQuestions++;
              }
            }
          });
          const maxPersonalityPoints = personalityQuestions * 5;
          const personalityScore =
            maxPersonalityPoints > 0
              ? Math.round((personalityPoints / maxPersonalityPoints) * 100)
              : 0;
          finalScore = tiuScore + figuralScore + personalityScore;
          maxScore = 500;
          const passed = personalityScore >= 70;
          details = {
            tiuScore,
            figuralScore,
            personalityScore,
            passed,
            verdict: passed ? "MEMENUHI SYARAT" : "TIDAK MEMENUHI SYARAT",
          };
        } else {
          let tpaScore = 0;
          let tbiScore = 0;
          answers.forEach((a) => {
            const q = questions.find((q) => q.id === a.questionId);
            if (q) {
              const isTBI =
                q.metadata?.subtest?.includes("TBI") ||
                q.metadata?.subtest?.includes("Inggris");
              if (isTBI) {
                if (a.isCorrect) tbiScore += 5;
              } else {
                if (a.selectedAnswer) {
                  if (a.isCorrect) tpaScore += 4;
                  else tpaScore -= 1;
                }
              }
            }
          });
          const passed = tpaScore >= 67 && tbiScore >= 30;
          finalScore = tpaScore + tbiScore;
          maxScore = 280;
          details = { tpaScore, tbiScore, passed };
        }
      } else if (selectedCategory === "INTERVIEW") {
        const validScores = answers.map((a) => a.interviewFeedback?.score || 0);
        finalScore = Math.round(
          validScores.reduce((a, b) => a + b, 0) / (validScores.length || 1),
        );
        maxScore = 100;
      } else if (
        selectedCategory === "PSIKOTEST" &&
        sessionMode === StudyMode.SIMULATION
      ) {
        const correctCount = answers.filter((a) => a.isCorrect).length;
        const totalQs = questions.length;
        const percentage = correctCount / totalQs;
        const iqEstimate = Math.round(70 + percentage * 75);
        let classification =
          iqEstimate >= 130
            ? "Very Superior"
            : iqEstimate >= 120
              ? "Superior"
              : iqEstimate >= 110
                ? "High Average"
                : iqEstimate >= 90
                  ? "Average"
                  : "Low Average";
        finalScore = iqEstimate;
        maxScore = 160;
        details = { iqScore: iqEstimate, classification };
      } else if (selectedCategory === "GENERAL") {
        const totalPoints = answers.reduce(
          (acc, curr) => acc + (curr.scoreEarned || 0),
          0,
        );
        finalScore = Math.round(totalPoints / (answers.length || 1));
        maxScore = 100;
      } else {
        const correctCount = answers.filter((a) => a.isCorrect).length;
        finalScore = Math.round((correctCount / questions.length) * 100);
        maxScore = 100;
      }

      finalItem = {
        id: `h-${Date.now()}`,
        date: new Date().toISOString(),
        category: selectedCategory!,
        skdStream: skdStream || undefined,
        tpaStream: tpaStream || undefined,
        tkaLevel: tkaLevel || undefined,
        score: finalScore,
        maxScore,
        details: details,
        questions: questions,
        answers: answers,
        isAborted: isAborted,
        packageTitle: currentPackageTitle,
      };
    }

    await saveToHistory(finalItem);

    if (!isAborted && userProfile?.uid && userProfile.gamification) {
      const earnedXP = GamificationService.calculateSessionXP(
        finalItem.score,
        finalItem.answers || [],
        sessionMode === StudyMode.SIMULATION,
        finalItem.category || "",
      );
      let newProfile = { ...userProfile.gamification };
      newProfile.xp += earnedXP;

      // Check & update streak upon session completion
      newProfile = GamificationService.updateStreak(newProfile);

      const newLevel = GamificationService.calculateLevel(newProfile.xp);
      if (newLevel > newProfile.level) {
        newProfile.level = newLevel;
        SoundManager.play("levelUp");
        setLevelUpData({ level: newLevel });
      }

      const fullHistory = [finalItem, ...testHistory];
      const newBadges = GamificationService.checkNewAchievements(
        newProfile,
        fullHistory,
      );
      if (newBadges.length > 0) {
        const newBadgeIds = newBadges.map((b) => b.id);
        newProfile.unlockedAchievements = [
          ...newProfile.unlockedAchievements,
          ...newBadgeIds,
        ];
        const badgeXP = newBadges.reduce((sum, b) => sum + b.xpReward, 0);
        newProfile.xp += badgeXP;
        const levelAfterBadge = GamificationService.calculateLevel(
          newProfile.xp,
        );
        if (levelAfterBadge > newProfile.level) {
          newProfile.level = levelAfterBadge;
          if (!levelUpData) {
            SoundManager.play("levelUp");
            setLevelUpData({ level: levelAfterBadge });
          }
        }
        setNewAchievement(newBadges[0]);
        SoundManager.play("success");
      }

      if (userProfile.isGuest) {
        localStorage.setItem(
          "fajmuls_guest_gamification",
          JSON.stringify(newProfile),
        );
      } else {
        await FirebaseService.updateGamificationProfile(
          userProfile.uid,
          newProfile,
        );
      }
      setUserProfile({ ...userProfile, gamification: newProfile });
    }

    if (!isAborted && !userProfile?.isGuest && userProfile?.uid) {
      if (finalItem.category === "KECERMATAN" && finalItem.details) {
        const d = finalItem.details as any;
        FirebaseService.saveGlobalScore(
          "KECERMATAN",
          d.mode || "General",
          finalItem.score,
          userProfile.username,
          userProfile.uid,
        );
      } else if (selectedCategory && sessionMode === StudyMode.SIMULATION) {
        let subCat = "General";
        if (selectedCategory === "SKD" && skdStream) subCat = skdStream;
        if (selectedCategory === "TPA" && tpaStream) subCat = tpaStream;
        if (selectedCategory === "TKA" && tkaLevel) subCat = tkaLevel;
        FirebaseService.saveGlobalScore(
          selectedCategory,
          subCat,
          finalItem.score,
          userProfile.username,
          userProfile.uid,
          currentPackageTitle,
        );
      }
    }

    setCurrentPackageTitle(undefined);
    if (historyItemOverride) {
      if (historyItemOverride.category !== "BENCHMARK" || isAborted) {
        setCurrentView("HOME");
      }
    } else if (isAborted) {
      setCurrentView("HOME");
    } else {
      setCurrentView("RESULTS");
    }
  };
  const handleDeleteMultipleHistory = async (ids: string[]) => {
    const updated = testHistory.filter((item) => !ids.includes(item.id));
    setTestHistory(updated);
    if (userProfile?.isGuest) {
      localStorage.setItem("fajmuls_guest_history", JSON.stringify(updated));
    } else if (userProfile?.uid) {
      // Delete from cloud
      const deletePromises = ids.map((id) =>
        FirebaseService.deleteHistoryFromCloud(userProfile.uid, id),
      );
      await Promise.all(deletePromises);
    }
    showToast(`${ids.length} Riwayat berhasil dihapus.`, "success");
    SoundManager.play("click");
  };

  const handleDeleteMultiplePackages = async (ids: string[]) => {
    setAvailablePackages((prev) => prev.filter((p) => !ids.includes(p.id)));
    let cloudCount = 0;
    const deletePromises: Promise<void>[] = [];

    for (const id of ids) {
      if (id.startsWith("gen-") || id.startsWith("pkg-")) {
        deletePromises.push(
          FirebaseService.deleteTestPackage(id)
            .then(() => {
              cloudCount++;
            })
            .catch((e) => console.error(e)),
        );
      }
    }

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
    }

    if (cloudCount > 0) {
      showToast(
        `${ids.length} Paket dihapus (${cloudCount} dari database).`,
        "success",
      );
    } else {
      showToast(`${ids.length} Paket dihapus dari tampilan lokal.`, "success");
    }
  };

  const handleCategorySelect = (cat: CategoryType) => {
    SoundManager.play("click");
    setSelectedCategory(cat);
    setCurrentPackageTitle(undefined);
    setInitialSessionState(undefined);
    setColorBlindSpectrum(undefined);
    if (cat === "BUTAWRNA") {
      setCurrentView("COLORBLIND");
    } else if (cat === "BENCHMARK") {
      setBenchmarkMode(null);
      setBenchmarkTab("DASHBOARD");
      setCurrentView("BENCHMARK");
    } else {
      setCurrentView("DASHBOARD");
      setGeneralInput(null);
      setIsReadingMaterial(false);
      setSelectedSubtest("");
      setSkdStream(null);
      setTpaStream(null);
      setTkaLevel(null);
      setGeneralMethod(null);
      setSkripsiFeature(null);
      setSkripsiResult("");
    }
  };
  const handleStartTesKecermatan = (mode: KecermatanMode) => {
    setKecermatanMode(mode);
    setCurrentView("TES_KECERMATAN");
  };
  const exportHistory = () => {
    if (testHistory.length === 0) {
      showToast("Belum ada riwayat untuk disimpan.", "info");
      return;
    }
    const dataStr = JSON.stringify(testHistory, getCircularReplacer(), 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Fajmuls_History_${userProfile?.username || "user"}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Export berhasil!", "success");
  };
  const importHistory = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importedData = JSON.parse(content) as TestHistoryItem[];
        if (!Array.isArray(importedData)) throw new Error("Format salah");
        const currentIds = new Set(testHistory.map((h) => h.id));
        const newItems = importedData.filter((h) => !currentIds.has(h.id));
        const merged = [...testHistory, ...newItems].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
        setTestHistory(merged);
        if (userProfile?.isGuest) {
          localStorage.setItem("fajmuls_guest_history", JSON.stringify(merged));
        } else if (userProfile?.uid) {
          newItems.forEach((item) => {
            FirebaseService.saveHistoryToCloud(userProfile.uid, item);
          });
        }
        showToast(
          `Berhasil memuat ${newItems.length} riwayat baru.`,
          "success",
        );
      } catch (err) {
        showToast("Gagal membaca file JSON.", "error");
      }
    };
    reader.readAsText(file);
  };
  const handlePackageSelect = (pkg: StaticTestPackage) => {
    setQuestions(pkg.questions);
    setSessionMode(StudyMode.SIMULATION);
    setCurrentPackageTitle(pkg.title);
    setSessionDuration(pkg.durationMinutes);
    setInitialSessionState(undefined);
    setCurrentView("SESSION");
  };
  const handleGenerateNewPackage = async (
    token: string,
    options?: {
      utbkVariant?: "ONLY_MC" | "MIXED";
      skdVariant?: "FULL" | "TWK" | "TIU" | "TKP";
    },
  ) => {
    const utbkVariant = options?.utbkVariant;
    const skdVariant = options?.skdVariant || "FULL";

    if (!selectedCategory) return;
    if (activeGenTask && activeGenTask.status === "generating") {
      showToast("Tunggu hingga pembuatan paket sebelumnya selesai!", "info");
      return;
    }

    // Determine package numbering and prefix beforehand
    const currentPackages = availablePackages.filter((p) => {
      if (p.category !== selectedCategory) return false;
      if (selectedCategory === "SKD") {
        if (p.skdStream !== skdStream) return false;
        if (skdVariant === "FULL") {
          return !p.title.includes("Spesial");
        } else {
          return p.title.includes(`Spesial ${skdVariant}`);
        }
      }
      if (selectedCategory === "UTBK") {
        if (utbkVariant === "ONLY_MC") {
          return p.title.includes("Hanya Ganda");
        } else if (utbkVariant === "MIXED") {
          return p.title.includes("Format Mix");
        } else {
          return (
            !p.title.includes("Hanya Ganda") && !p.title.includes("Format Mix")
          );
        }
      }
      if (selectedCategory === "TPA") return p.tpaStream === tpaStream;
      if (selectedCategory === "TKA") return p.tkaLevel === tkaLevel;
      return true;
    });

    const maxNum = currentPackages.reduce((max, p) => {
      const match = p.title.match(/(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        return num > max ? num : max;
      }
      return max;
    }, 0);

    const nextNum = maxNum + 1;
    let title = "";
    let idPrefix = "gen";

    const skdSuffix = skdVariant === "FULL" ? "" : ` - Spesial ${skdVariant}`;

    if (selectedCategory === "SKD") {
      if (skdStream === "CPNS") {
        title = `TO SKD CPNS${skdSuffix} ${nextNum}`;
        idPrefix += `-skd-cpns-${skdVariant.toLowerCase()}`;
      } else if (skdStream === "KEDINASAN") {
        title = `TO SKD Kedinasan${skdSuffix} ${nextNum}`;
        idPrefix += `-skd-kedinasan-${skdVariant.toLowerCase()}`;
      } else {
        title = `TO SKD${skdSuffix} ${nextNum}`;
        idPrefix += `-skd-general-${skdVariant.toLowerCase()}`;
      }
    } else if (selectedCategory === "UTBK") {
      const utbkSuffix =
        utbkVariant === "ONLY_MC"
          ? " (Hanya Ganda)"
          : utbkVariant === "MIXED"
            ? " (Format Mix)"
            : "";
      title = `TO UTBK${utbkSuffix} ${nextNum}`;
      idPrefix += `-utbk-${utbkVariant?.toLowerCase() || "default"}`;
    } else if (selectedCategory === "TPA") {
      if (tpaStream === "PSIKOTEST_KEDINASAN") {
        title = `TO Psikotes Kedinasan ${nextNum}`;
        idPrefix += "-tpa-psikotest_kedinasan";
      } else {
        title = `TO TPA TBI ${nextNum}`;
        idPrefix += "-tpa-tbi";
      }
    } else if (selectedCategory === "PSIKOTEST") {
      title = `TO Psikotest ${nextNum}`;
      idPrefix += "-psikotest";
    } else if (selectedCategory === "TKA") {
      title = `TO TKA ${tkaLevel} ${nextNum}`;
      idPrefix += `-tka-${tkaLevel?.toLowerCase()}`;
    } else {
      title = `TO ${selectedCategory} ${nextNum}`;
      idPrefix += `-${selectedCategory.toLowerCase()}`;
    }

    const newId = `${idPrefix}-${nextNum}-${Date.now()}`;
    const taskId = `task-${Date.now()}`;

    // 1. Setup the active generation task structure
    const initialTask: BackgroundGenTask = {
      id: taskId,
      title,
      category: selectedCategory,
      skdStream: skdStream || undefined,
      tpaStream: tpaStream || undefined,
      tkaLevel: tkaLevel || undefined,
      progress: 5,
      status: "generating",
      createdAt: new Date().toISOString(),
    };

    setActiveGenTask(initialTask);
    showToast(`AI mulai meracik "${title}" di latar belakang.`, "info");

    // Simulate progress updates during async execution
    let currentProgress = 5;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 3;
      if (currentProgress > 95) currentProgress = 95; // Wait for active API completion
      setActiveGenTask((prev) => {
        if (!prev || prev.id !== taskId) return prev;
        return { ...prev, progress: currentProgress };
      });
    }, 1200);

    // 2. Perform the actual API invocation asynchronously (non-blocking)
    (async () => {
      try {
        let newQuestions: Question[] = [];
        let duration = 60;

        if (selectedCategory === "SKD") {
          newQuestions = await Gemini.generateSkdSimulation(
            skdStream || "CPNS",
            skdVariant,
          );
          if (skdVariant === "TWK") duration = 30;
          else if (skdVariant === "TIU") duration = 30;
          else if (skdVariant === "TKP") duration = 40;
          else duration = 100;
        } else if (selectedCategory === "UTBK") {
          newQuestions = await Gemini.generateUtbkSimulation(utbkVariant);
          duration = 195;
        } else if (selectedCategory === "TPA") {
          if (tpaStream === "PSIKOTEST_KEDINASAN") {
            newQuestions = await Gemini.generatePsikotestKedinasanSimulation();
            duration = 90;
          } else {
            newQuestions = await Gemini.generateTpaTbiSimulation();
            duration = 100;
          }
        } else if (selectedCategory === "PSIKOTEST") {
          newQuestions = await Gemini.generatePsikotestSimulation();
          duration = 40;
        } else if (selectedCategory === "TKA" && tkaLevel) {
          newQuestions = await Gemini.generateTkaSimulation(tkaLevel);
          duration = 90;
        } else {
          newQuestions = await Gemini.generateQuestions(
            StudyMode.SIMULATION,
            selectedCategory,
            "SIMULATION",
            20,
            [],
            skdStream || undefined,
            undefined,
            "HOTS",
          );
        }

        clearInterval(progressInterval);

        // Define package structure
        const newPackage: StaticTestPackage = {
          id: newId,
          title,
          category: selectedCategory,
          skdStream: skdStream || undefined,
          tpaStream: tpaStream || undefined,
          tkaLevel: tkaLevel || undefined,
          questions: newQuestions,
          durationMinutes: duration,
          isAiGenerated: true,
          version: "v5",
          createdAt: new Date().toISOString(),
        };

        await FirebaseService.saveTestPackage(newPackage);

        // Update package arrays in local states so matches show up instantly
        setAvailablePackages((prev) => [newPackage, ...prev]);

        // Sound and completed task flags
        SoundManager.play("success");
        setActiveGenTask((prev) => {
          if (!prev || prev.id !== taskId) return prev;
          return { ...prev, status: "completed", progress: 100 };
        });

        // Trigger native dashboard/toast alert
        showToast(`AI Selesai! Paket "${title}" siap dikerjakan.`, "success");

        // Notify the client device using browser Notifications API if permitted
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Fajmuls AI Selesai Meracik!", {
            body: `Paket soal "${title}" telah berhasil dibuat di latar belakang dan siap dikerjakan.`,
            icon: APP_LOGO_URL,
          });
        }
      } catch (err) {
        clearInterval(progressInterval);
        console.error("Error in background generation task:", err);
        setActiveGenTask((prev) => {
          if (!prev || prev.id !== taskId) return prev;
          return {
            ...prev,
            status: "failed",
            error: "Gagal membuat paket soal",
          };
        });
        showToast(`AI gagal meracik "${title}". Coba lagi nanti.`, "error");
      }
    })();
  };
  const handleDeletePackage = async (id: string) => {
    setAvailablePackages((prev) => prev.filter((p) => p.id !== id));
    if (id.startsWith("gen-") || id.startsWith("pkg-")) {
      try {
        await FirebaseService.deleteTestPackage(id);
        showToast("Paket dihapus dari database.", "success");
      } catch (e) {
        console.error(e);
      }
    } else {
      showToast("Paket dihapus dari tampilan lokal.", "success");
    }
  };
  const handlePackageImport = (files: FileList) => {
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const pkg = JSON.parse(content) as StaticTestPackage;
          if (pkg.id && pkg.questions) {
            await FirebaseService.saveTestPackage(pkg);
            setAvailablePackages((prev) => {
              if (prev.find((p) => p.id === pkg.id)) return prev;
              return [pkg, ...prev];
            });
            showToast(`Paket "${pkg.title}" diimpor dan disimpan.`, "success");
          }
        } catch (e) {
          showToast("File tidak valid.", "error");
        }
      };
      reader.readAsText(file);
    });
  };
  const handleRefreshPackages = async (silent = false) => {
    setPackagesLoading(true);
    try {
      const pkgs = await FirebaseService.getTestPackages();
      const initialMap = new Map();
      [
        ...INITIAL_SKD_PACKAGES,
        ...INITIAL_SKD_KEDINASAN_PACKAGES,
        ...INITIAL_UTBK_PACKAGES,
        ...INITIAL_TPA_PACKAGES,
        ...INITIAL_PSIKOTEST_PACKAGES,
        ...INITIAL_UTBK_HOTS_PACKAGES,
        ...INITIAL_SKD_CPNS_HOTS_PACKAGES,
        ...INITIAL_TPA_HOTS_PACKAGES,
      ].forEach((p) => initialMap.set(p.id, p));
      pkgs.forEach((p) => initialMap.set(p.id, p));
      setAvailablePackages(Array.from(initialMap.values()));
      if (!silent) showToast("Paket soal diperbarui.", "success");
    } catch (e) {
      console.error(e);
      if (!silent) showToast("Gagal memuat paket soal.", "error");
    } finally {
      setPackagesLoading(false);
    }
  };

  useEffect(() => {
    handleRefreshPackages(true);
  }, []);

  useEffect(() => {
    // Remove listener on unmount
    return () => {
      const handleOpenTutor = (e: CustomEvent) => {}; // dummy for typings if needed, actually we just need to ensure consistent cleanup, wait, we can't remove it here easily without moving handleOpenTutor outside. Or we just add it to the first useEffect cleanup.
    };
  }, []);
  const handleFixDuplicates = async () => {
    if (!selectedCategory) return;
    setPackagesLoading(true);
    try {
      const currentPackages = availablePackages.filter((p) => {
        if (p.category !== selectedCategory) return false;
        if (selectedCategory === "SKD") return p.skdStream === skdStream;
        if (selectedCategory === "TPA") return p.tpaStream === tpaStream;
        if (selectedCategory === "TKA") return p.tkaLevel === tkaLevel;
        return true;
      });

      if (currentPackages.length === 0) {
        showToast("Tidak ada paket untuk diurutkan.", "info");
        setPackagesLoading(false);
        return;
      }

      // Bucket packages by their exact type/variant prefix to ensure consistency
      const buckets = new Map<string, StaticTestPackage[]>();
      currentPackages.forEach((pkg) => {
        // Precise bucketing based on properties + variant logic
        let subType = "full";
        const idLower = pkg.id.toLowerCase();
        if (idLower.includes("-twk-")) subType = "twk";
        else if (idLower.includes("-tiu-")) subType = "tiu";
        else if (idLower.includes("-tkp-")) subType = "tkp";

        const variant = idLower.includes("-only_mc-")
          ? "only_mc"
          : idLower.includes("-mixed-")
            ? "mixed"
            : "default";

        const bucketKey = `${pkg.category}-${pkg.skdStream || ""}-${pkg.tpaStream || ""}-${pkg.tkaLevel || ""}-${subType}-${variant}`;
        if (!buckets.has(bucketKey)) buckets.set(bucketKey, []);
        buckets.get(bucketKey)!.push(pkg);
      });

      const updates: Promise<void>[] = [];
      const newPackagesList = [...availablePackages];
      let renamedCount = 0;

      for (const [baseIdType, bucketPkgs] of Array.from(buckets.entries())) {
        // Sort bucket by createdAt ascending
        bucketPkgs.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        bucketPkgs.forEach((pkg, index) => {
          const expectedNum = index + 1;

          // Restore correct title prefix based on ID variants and content
          let newTitle = pkg.title;

          if (pkg.category === "SKD") {
            const streamPrefix =
              pkg.skdStream === "CPNS"
                ? "TO SKD CPNS"
                : pkg.skdStream === "KEDINASAN"
                  ? "TO SKD Kedinasan"
                  : "TO SKD";
            const isTwk = pkg.id.includes("-twk-");
            const isTiu = pkg.id.includes("-tiu-");
            const isTkp = pkg.id.includes("-tkp-");

            let suffix = "";
            if (isTwk) suffix = " - Spesial TWK";
            else if (isTiu) suffix = " - Spesial TIU";
            else if (isTkp) suffix = " - Spesial TKP";

            newTitle = `${streamPrefix}${suffix} ${expectedNum}`;
          } else if (pkg.category === "UTBK") {
            let suffix = "";
            if (pkg.id.includes("-only_mc-")) suffix = " (Hanya Ganda)";
            else if (pkg.id.includes("-mixed-")) suffix = " (Format Mix)";
            newTitle = `TO UTBK${suffix} ${expectedNum}`;
          } else if (pkg.category === "TPA") {
            const prefix =
              pkg.tpaStream === "PSIKOTEST_KEDINASAN"
                ? "TO Psikotes Kedinasan "
                : "TO TPA TBI ";
            newTitle = `${prefix}${expectedNum}`;
          } else if (pkg.category === "TKA") {
            newTitle = `TO TKA ${pkg.tkaLevel} ${expectedNum}`;
          } else {
            newTitle = `TO ${pkg.category} ${expectedNum}`;
          }

          if (pkg.title !== newTitle) {
            const updatedPkg = { ...pkg, title: newTitle };
            updates.push(FirebaseService.saveTestPackage(updatedPkg));
            const listIdx = newPackagesList.findIndex((p) => p.id === pkg.id);
            if (listIdx !== -1) newPackagesList[listIdx] = updatedPkg;
            renamedCount++;
          }
        });
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        setAvailablePackages(newPackagesList);
        showToast(
          `Berhasil memperbaiki urutan ${renamedCount} paket.`,
          "success",
        );
      } else {
        showToast("Urutan paket sudah benar.", "info");
      }
    } catch (e) {
      console.error(e);
      showToast("Gagal memperbaiki urutan.", "error");
    } finally {
      setPackagesLoading(false);
    }
  };

  const handleFixGaps = handleFixDuplicates; // Both buttons now do the same robust reordering
  const handleSearchResultClick = (result: {
    id: string;
    label: string;
    type: "CATEGORY" | "FEATURE";
  }) => {
    SoundManager.play("click");
    setSearchQuery("");
    setShowSearchDropdown(false);
    if (result.type === "CATEGORY") {
      handleCategorySelect(result.id as CategoryType);
    } else if (result.type === "FEATURE") {
      if (result.id === "TES_KORAN") {
        setSelectedCategory("PSIKOTEST");
        setCurrentView("TES_KORAN");
      } else if (result.id.startsWith("KECERMATAN_")) {
        setSelectedCategory("KECERMATAN");
        const mode = result.id.replace("KECERMATAN_", "") as KecermatanMode;
        handleStartTesKecermatan(mode);
      } else if (
        [
          "REACTION",
          "AIM",
          "SEQUENCE",
          "CHIMP",
          "VISUAL",
          "NUMBER",
          "VERBAL",
          "TYPING",
          "BRIDGE",
          "MATCH",
        ].includes(result.id)
      ) {
        setSelectedCategory("BENCHMARK");
        setBenchmarkMode(result.id as BenchmarkMode);
        setBenchmarkTab("DASHBOARD");
        setCurrentView("BENCHMARK");
      } else if (result.id.startsWith("UTBK_")) {
        setSelectedCategory("UTBK");
        const sub = result.label.replace("UTBK ", "");
        setSelectedSubtest(sub);
        setCurrentView("DASHBOARD");
      } else if (result.id === "SKD_STREAM_CPNS") {
        setSelectedCategory("SKD");
        setSkdStream("CPNS");
        setCurrentView("DASHBOARD");
      } else if (result.id === "SKD_STREAM_KEDINASAN") {
        setSelectedCategory("SKD");
        setSkdStream("KEDINASAN");
        setCurrentView("DASHBOARD");
      } else if (result.id.startsWith("HUE_SORT_")) {
        setSelectedCategory("BUTAWRNA");
        const spectrum = result.id.replace("HUE_SORT_", "") as
          | "MIXED"
          | "GREEN"
          | "PURPLE"
          | "RED"
          | "BLUE"
          | "GRAYSCALE"
          | "CYAN_MAGENTA"
          | "YELLOW_BLUE"
          | "BROWN_GREEN"
          | "PASTEL";
        setColorBlindSpectrum(spectrum);
        setCurrentView("COLORBLIND");
      } else if (result.id === "DEPTH_PERCEPTION") {
        setSelectedCategory("BUTAWRNA");
        setColorBlindSpectrum(undefined); // Or handle depth mode if I added a prop for it, but ColorBlindTest handles modes internally via menu if no initialSpectrum
        // Actually, ColorBlindTest only takes initialSpectrum.
        // If I want to jump to DEPTH, I might need another prop or just let user choose from menu.
        // But user asked for "Tes spektrum warna...". Depth is different.
        // Let's just open the menu for Depth for now, or add initialMode prop to ColorBlindTest.
        // For now, just open ColorBlind view.
        setCurrentView("COLORBLIND");
      } else if (result.id === "BUTAWRNA") {
        setSelectedCategory("BUTAWRNA");
        setColorBlindSpectrum(undefined);
        setCurrentView("COLORBLIND");
      } else if (result.id.startsWith("SKD_")) {
        setSelectedCategory("SKD");
        const sub = result.label.replace("SKD ", "");
        setSelectedSubtest(sub);
        setSkdStream("CPNS");
        setCurrentView("DASHBOARD");
      }
    }
  };

  // --- RENDERERS ---

  if (currentView === "SPLASH")
    return (
      <SplashScreen
        onComplete={() => setCurrentView(userProfile ? "HOME" : "LOGIN")}
      />
    );
  if (isInitializing)
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        {" "}
        <Loader2 className="animate-spin text-indigo-600 w-10 h-10" />{" "}
      </div>
    );
  if (currentView === "LOGIN")
    return (
      <LoginScreen
        onGoogleLogin={handleGoogleLogin}
        onGuestLogin={handleGuestLogin}
        isLoading={authLoading}
      />
    );
  if (currentView === "USERNAME_SETUP")
    return (
      <UsernameSetupScreen
        onSubmit={handleUsernameSetupSubmit}
        isLoading={authLoading}
      />
    );

  return (
    <>
      {/* Background Animation Wrapper - NOW COMBINES BASE COLOR + PATTERN */}
      <div
        className={`fixed inset-0 -z-10 transition-colors duration-500 bg-pattern-${settings.appPattern || "none"}`}
        style={{ backgroundColor: settings.appBaseColor || "#ffffff" }}
      ></div>

      <AnimatePresence>
        {toast && (
          <NotificationToast
            message={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Global floating Background Task Progress widget */}
      <AnimatePresence>
        {activeGenTask && currentView !== "SESSION" && (
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.9 }}
            className="fixed top-24 right-4 sm:top-24 z-[60] flex items-center gap-3 bg-slate-900/90 dark:bg-slate-950/95 text-white px-4 py-2.5 rounded-full shadow-xl border border-slate-700/50 backdrop-blur-md transition-all hover:bg-slate-800/90"
            title={activeGenTask.title}
          >
            {activeGenTask.status === "generating" && (
              <>
                <Loader2 size={16} className="text-indigo-400 animate-spin shrink-0" />
                <span className="text-[11px] font-bold text-slate-200 tracking-wide">Meracik {activeGenTask.progress}%</span>
                <button
                    onClick={() => {
                        SoundManager.play("click");
                        setActiveGenTask(null);
                    }}
                    className="text-slate-400 hover:text-slate-200 ml-1 shrink-0"
                >
                    <XCircle size={14} />
                </button>
              </>
            )}

            {activeGenTask.status === "completed" && (
              <>
                <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                <div className="flex items-center gap-3 pr-1">
                    <button
                        onClick={() => {
                          SoundManager.play("click");
                          const pkg = availablePackages.find(
                            (p) =>
                              p.id.includes(activeGenTask.id) ||
                              p.title === activeGenTask.title,
                          );
                          if (pkg) {
                            handlePackageSelect(pkg);
                          } else {
                            const latestAi = availablePackages.find(
                              (p) =>
                                p.isAiGenerated &&
                                p.category === activeGenTask.category,
                            );
                            if (latestAi) {
                              handlePackageSelect(latestAi);
                            } else {
                              startSession(StudyMode.SIMULATION);
                            }
                          }
                          setActiveGenTask(null);
                        }}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wide"
                    >
                        Mulai Tes
                    </button>
                    <div className="w-px h-3 bg-slate-700 rounded-full"></div>
                    <button
                        onClick={() => {
                          SoundManager.play("click");
                          setActiveGenTask(null);
                        }}
                        className="text-slate-400 hover:text-slate-200"
                    >
                        <XCircle size={14} />
                    </button>
                </div>
              </>
            )}

            {activeGenTask.status === "failed" && (
              <>
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                <span className="text-[11px] font-bold text-rose-300 tracking-wide">Gagal Meracik</span>
                <button
                    onClick={() => {
                        SoundManager.play("click");
                        setActiveGenTask(null);
                    }}
                    className="text-slate-400 hover:text-slate-200 ml-1 shrink-0"
                >
                    <XCircle size={14} />
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gamification Overlays */}
      {newAchievement && (
        <AchievementToast
          achievement={newAchievement}
          onClose={() => setNewAchievement(null)}
        />
      )}
      {levelUpData && (
        <LevelUpModal
          newLevel={levelUpData.level}
          onClose={() => setLevelUpData(null)}
        />
      )}
      <AchievementsModal
        isOpen={showAchievementsModal}
        onClose={() => setShowAchievementsModal(false)}
        profile={
          userProfile?.gamification ||
          GamificationService.INITIAL_GAMIFICATION_PROFILE
        }
      />

      {resumeModalData && (
        <ResumeModal
          session={resumeModalData}
          onResume={() => handleResumeSession(resumeModalData)}
          onDiscard={discardSession}
        />
      )}

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdate={setSettings}
        userProfile={userProfile}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* TOP BAR WITH SEARCH & GAMIFICATION */}
      {currentView !== "SESSION" &&
        currentView !== "TES_KORAN" &&
        currentView !== "TES_KECERMATAN" &&
        currentView !== "BENCHMARK" &&
        currentView !== "GLOBAL_LEADERBOARD" &&
        currentView !== "ACADEMIC_HUB" &&
        currentView !== "SOCIAL_HUB" &&
        currentView !== "BATTLE" &&
        currentView !== "MARKED_QUESTIONS" && (
          <div className="fixed top-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-40 border-b border-slate-200 dark:border-slate-700 px-3 sm:px-6 py-2 sm:py-3 flex justify-between items-center animate-fade-in-down gap-2 sm:gap-4">
            <div
              className="flex items-center gap-2 cursor-pointer shrink-0"
              onClick={() => {
                SoundManager.play("click");
                setCurrentView("HOME");
              }}
            >
              <img
                src={APP_LOGO_URL}
                alt="Logo"
                className="w-7 h-7 sm:w-8 sm:h-8 object-contain"
              />
              <span className="hidden sm:inline font-bold text-sm sm:text-lg text-slate-800 dark:text-white">
                Fajmuls Learning
              </span>
            </div>

            <div className="flex-1 w-full max-w-full sm:max-w-md relative">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={14}
                />
                <input
                  type="text"
                  className="w-full pl-9 pr-3 py-1.5 sm:py-2 bg-slate-100 dark:bg-slate-800 border-none rounded-full text-xs sm:text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="Cari..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {showSearchDropdown && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-up max-h-80 overflow-y-auto scrollbar-hide">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSearchResultClick(result)}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between group transition-colors"
                    >
                      <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200">
                        {result.label}
                      </span>
                      <span
                        className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${result.type === "CATEGORY" ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300" : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"}`}
                      >
                        {result.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 sm:gap-3 shrink-0">
              {userProfile?.gamification && (
                <div className="scale-90 sm:scale-100 origin-right">
                  <GamificationBar
                    profile={userProfile.gamification}
                    onOpenAchievements={() => {
                      SoundManager.play("click");
                      setShowAchievementsModal(true);
                    }}
                  />
                </div>
              )}
              <div
                className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 p-1 sm:p-2 rounded-xl transition shrink-0"
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    {userProfile?.username || "Tamu"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {userProfile?.isGuest ? "Mode Tamu" : "Online"}
                  </span>
                </div>
                <div className="scale-90 sm:scale-100">
                  <UserAvatar user={userProfile} />
                </div>
              </div>
              {showProfileDropdown && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-fade-in-up">
                  {!userProfile?.isGuest && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        SoundManager.play("click");
                        setCurrentView("SOCIAL_HUB");
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-200 text-sm font-medium"
                    >
                      <Users size={16} className="text-blue-500" /> Social Hub
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      SoundManager.play("click");
                      setSettingsOpen(true);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3 transition-colors text-slate-700 dark:text-slate-200 text-sm font-medium"
                  >
                    <Settings size={16} className="text-slate-500" /> Pengaturan
                  </button>
                  {userProfile && (
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 flex items-center gap-3 transition-colors text-rose-600 dark:text-rose-400 text-sm font-medium border-t border-slate-100 dark:border-slate-700"
                    >
                      <LogOut size={16} /> Keluar
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      <div
        className={`${currentView !== "SESSION" && currentView !== "TES_KORAN" && currentView !== "TES_KECERMATAN" && currentView !== "BENCHMARK" && currentView !== "GLOBAL_LEADERBOARD" && currentView !== "ACADEMIC_HUB" && currentView !== "SOCIAL_HUB" && currentView !== "BATTLE" && currentView !== "MARKED_QUESTIONS" ? "pt-16 sm:pt-16" : ""}`}
      >
        <Suspense fallback={<div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4"/><div className="text-slate-500 font-bold animate-pulse">Memuat Modul...</div></div>}>
        <AnimatePresence mode="wait">
          {currentView === "HOME" && (
            <motion.div
              key="HOME"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <div
                className={`min-h-[calc(100vh-64px)] px-4 py-2 sm:p-6 flex flex-col items-center justify-start relative transition-colors duration-300 bg-transparent`}
              >
                <div className="text-center mb-5 sm:mb-10 mt-1 sm:mt-3 px-2">
                  <img
                    src={APP_LOGO_URL}
                    alt="Logo"
                    className="w-14 h-14 sm:w-28 sm:h-28 object-contain mx-auto mb-1.5 sm:mb-4 animate-float"
                  />
                  <div className="inline-flex flex-col items-center bg-white/75 dark:bg-slate-900/75 backdrop-blur-md px-5 py-2.5 sm:px-8 sm:py-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
                    <h1 className="text-lg sm:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-1">
                      Pilih Jalur Belajarmu
                    </h1>
                    <p className="text-[10px] sm:text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                      Sistem belajar adaptif untuk persiapan ujian.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 w-full max-w-6xl px-0 sm:px-0">
                  {CATEGORIES.map((cat) => {
                    let cardClass =
                      settings.theme === "fajmuls"
                        ? "bg-white/60 backdrop-blur-xl border-white/50 shadow-xl hover:bg-white/80 hover:scale-[1.02] text-slate-900"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:-translate-y-1 hover:shadow-xl";

                    let baseShadow =
                      "shadow-sm hover:-translate-y-1 hover:shadow-xl";

                    // Apply Specific Gradient Borders/Hover Effects based on Request
                    if (settings.theme !== "fajmuls") {
                      if (cat.id === "BENCHMARK") {
                        cardClass +=
                          " hover:border-red-500 dark:hover:border-red-500 hover:shadow-red-100 dark:hover:shadow-red-900/20";
                      } else if (
                        cat.id === "KECERMATAN" ||
                        cat.id === "BUTAWRNA"
                      ) {
                        cardClass +=
                          " hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-orange-100 dark:hover:shadow-orange-900/20";
                      } else if (
                        ["UTBK", "SKD", "TPA", "PSIKOTEST", "TKA"].includes(
                          cat.id,
                        )
                      ) {
                        cardClass +=
                          " hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-emerald-100 dark:hover:shadow-emerald-900/20";
                      } else {
                        cardClass +=
                          " hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-indigo-100 dark:hover:shadow-indigo-900/20";
                      }
                    }

                    // Determine Icon & Decoration Colors based on Gradient Logic
                    let iconBg = "bg-indigo-50 dark:bg-slate-700";
                    let iconColor = "text-indigo-600 dark:text-indigo-400";
                    let decorColor = "bg-indigo-50 dark:bg-indigo-900/20";

                    if (cat.id === "BENCHMARK") {
                      // RED
                      iconBg = "bg-red-100 dark:bg-red-900/40";
                      iconColor = "text-red-600 dark:text-red-400";
                      decorColor = "bg-red-50 dark:bg-red-900/20";
                    } else if (
                      cat.id === "KECERMATAN" ||
                      cat.id === "BUTAWRNA"
                    ) {
                      // ORANGE
                      iconBg = "bg-orange-100 dark:bg-orange-900/40";
                      iconColor = "text-orange-600 dark:text-orange-400";
                      decorColor = "bg-orange-50 dark:bg-orange-900/20";
                    } else if (
                      ["UTBK", "SKD", "TPA", "PSIKOTEST", "TKA"].includes(
                        cat.id,
                      )
                    ) {
                      // GREEN
                      iconBg = "bg-emerald-100 dark:bg-emerald-900/40";
                      iconColor = "text-emerald-600 dark:text-emerald-400";
                      decorColor = "bg-emerald-50 dark:bg-emerald-900/20";
                    }

                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategorySelect(cat.id)}
                        className={`p-2.5 sm:p-4 md:p-6 rounded-xl sm:rounded-2xl border transition-all group text-left flex flex-col items-start relative overflow-hidden ${cardClass}`}
                      >
                        <div
                          className={`absolute top-0 right-0 w-10 h-10 sm:w-20 sm:h-20 rounded-bl-full -mr-2 -mt-2 sm:-mr-4 sm:-mt-4 transition-transform group-hover:scale-110 ${decorColor}`}
                        ></div>

                        <div
                          className={`w-7 h-7 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center mb-1.5 sm:mb-4 transition-colors relative z-10 ${iconBg} ${iconColor} group-hover:bg-opacity-80`}
                        >
                          {cat.id === "GENERAL" ? (
                            <FileText className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          ) : cat.id === "SKD" ? (
                            <Briefcase className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          ) : cat.id === "INTERVIEW" ? (
                            <MessageSquare className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          ) : cat.id === "BUTAWRNA" ? (
                            <Palette className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          ) : cat.id === "PSIKOTEST" ? (
                            <Brain className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          ) : cat.id === "SKRIPSI" ? (
                            <Book className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          ) : cat.id === "KECERMATAN" ? (
                            <Eye className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          ) : cat.id === "BENCHMARK" ? (
                            <Activity className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          ) : cat.id === "TPA" ? (
                            <Zap className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          ) : (
                            <GraduationCap className="w-3.5 h-3.5 sm:w-5.5 sm:h-5.5" />
                          )}
                        </div>
                        <h2 className="text-xs sm:text-lg font-bold text-slate-800 dark:text-slate-100 mb-0.5 sm:mb-2 relative z-10 leading-tight">
                          {cat.name}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-[9px] sm:text-xs leading-tight relative z-10">
                          {cat.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-12 flex flex-wrap gap-2 sm:gap-3 justify-center items-center w-full max-w-4xl mx-auto px-2">
                  <button
                    onClick={handleOpenResumeList}
                    className="flex items-center gap-2 px-4 py-2 text-sm sm:text-base sm:px-8 sm:py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 border border-indigo-500 font-bold hover:from-indigo-700 hover:to-violet-700 hover:scale-105 transform transition-all duration-200 sm:mr-1"
                  >
                    <PlayCircle size={20} className="w-4 h-4 sm:w-5 sm:h-5" />{" "}
                    Lanjutkan TO
                  </button>
                  <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        setCurrentView("HISTORY");
                      }}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-base sm:px-5 sm:py-3 rounded-xl shadow-sm border font-bold transition ${settings.theme === "fajmuls" ? "bg-white/80 backdrop-blur text-slate-700 border-white/50 hover:bg-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    >
                      <History
                        size={18}
                        className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5"
                      />{" "}
                      Riwayat
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        setCurrentView("ACADEMIC_HUB");
                      }}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-base sm:px-5 sm:py-3 rounded-xl shadow-sm border font-bold transition ${settings.theme === "fajmuls" ? "bg-white/80 backdrop-blur text-slate-700 border-white/50 hover:bg-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    >
                      <BarChart2
                        size={18}
                        className="text-emerald-500 w-3.5 h-3.5 sm:w-4.5 sm:h-4.5"
                      />{" "}
                      Target Skor AI
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        setCurrentView("MARKED_QUESTIONS");
                      }}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-base sm:px-5 sm:py-3 rounded-xl shadow-sm border font-bold transition ${settings.theme === "fajmuls" ? "bg-white/80 backdrop-blur text-slate-700 border-white/50 hover:bg-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    >
                      <Flag
                        size={18}
                        className="text-rose-500 w-3.5 h-3.5 sm:w-4.5 sm:h-4.5"
                      />{" "}
                      Soal
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        setCurrentView("GLOBAL_LEADERBOARD");
                      }}
                      className={`flex items-center gap-1.5 sm:gap-2 px-3 py-2 text-xs sm:text-base sm:px-5 sm:py-3 rounded-xl shadow-sm border font-bold transition ${settings.theme === "fajmuls" ? "bg-white/80 backdrop-blur text-slate-700 border-white/50 hover:bg-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"}`}
                    >
                      <Trophy
                        size={18}
                        className="text-amber-500 w-3.5 h-3.5 sm:w-4.5 sm:h-4.5"
                      />{" "}
                      Rank
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {currentView === "DASHBOARD" && (
            <motion.div
              key="DASHBOARD"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <Dashboard
                category={selectedCategory!}
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("HOME");
                }}
                onStartSession={startSession}
                onOpenTOSelection={() => {
                  SoundManager.play("click");
                  setCurrentView("TO_SELECTION");
                }}
                onStartTesKoran={() => {
                  SoundManager.play("click");
                  setCurrentView("TES_KORAN");
                }}
                onStartTesKecermatan={handleStartTesKecermatan}
                onGeneralInputSubmit={handleGeneralInputSubmit}
                generalInput={generalInput}
                setGeneralInput={setGeneralInput}
                isReadingMaterial={isReadingMaterial}
                onResetMaterial={() => {
                  setIsReadingMaterial(false);
                  setGeneralInput(null);
                }}
                onSubtestSelect={setSelectedSubtest}
                selectedSubtest={selectedSubtest}
                weakTopics={Array.from(weakTopics)}
                loading={loading}
                skdStream={skdStream}
                onSkdStreamSelect={setSkdStream}
                onHistory={() => {
                  SoundManager.play("click");
                  setCurrentView("HISTORY");
                }}
                onStartGeneralSession={startGeneralSession}
                onStartSkripsiSession={startSkripsiSession}
                username={userProfile?.username || "Guest"}
                isDarkMode={settings.darkMode}
                onToggleDarkMode={() => {
                  setSettings((prev) => ({
                    ...prev,
                    darkMode: !prev.darkMode,
                    theme: !prev.darkMode ? "dark" : "light",
                  }));
                }}
                tpaStream={tpaStream}
                onTpaStreamSelect={setTpaStream}
                tkaLevel={tkaLevel}
                onTkaLevelSelect={setTkaLevel}
                onOpenAcademicHub={() => {
                  SoundManager.play("click");
                  setCurrentView("ACADEMIC_HUB");
                }}
                onBattle={() => {
                  if (!userProfile?.uid || userProfile.isGuest) {
                    showToast("Login diperlukan untuk Battle Mode.", "info");
                  } else {
                    SoundManager.play("click");
                    setCurrentView("BATTLE");
                  }
                }}
              />
            </motion.div>
          )}
          {currentView === "TO_SELECTION" && (
            <motion.div
              key="TO_SELECTION"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <TOSelectionScreen
                category={selectedCategory!}
                skdStream={skdStream || undefined}
                tpaStream={tpaStream || undefined}
                tkaLevel={tkaLevel || undefined}
                availablePackages={availablePackages}
                history={testHistory}
                userProfile={userProfile}
                onSelectPackage={handlePackageSelect}
                onGenerateNew={handleGenerateNewPackage}
                onDeletePackage={handleDeletePackage}
                onDeleteMultiplePackages={handleDeleteMultiplePackages}
                onImportPackage={handlePackageImport}
                onFixDuplicates={handleFixDuplicates}
                onFixGaps={handleFixGaps}
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("DASHBOARD");
                }}
                showToast={showToast}
                confirmEnabled={settings.confirmActions}
                onRefresh={handleRefreshPackages}
                isLoading={packagesLoading}
                activeGenTask={activeGenTask}
              />
            </motion.div>
          )}
          {currentView === "RESUME_LIST" && (
            <motion.div
              key="RESUME_LIST"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <ResumeSessionList
                sessions={savedSessions}
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("HOME");
                }}
                onResume={handleResumeSession}
                onDelete={handleDeleteSavedSession}
                loading={loadingSessions}
              />
            </motion.div>
          )}
          {currentView === "ACADEMIC_HUB" && (
            <motion.div
              key="ACADEMIC_HUB"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <AcademicHub
                history={testHistory}
                category={selectedCategory!}
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("DASHBOARD");
                }}
                onStartSmartReview={startSmartReviewSession}
              />
            </motion.div>
          )}
          {currentView === "SOCIAL_HUB" && userProfile && (
            <motion.div
              key="SOCIAL_HUB"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <SocialHub
                userProfile={userProfile}
                history={testHistory}
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("HOME");
                }}
                onUpdateProfile={handleUpdateProfile}
              />
            </motion.div>
          )}
          {currentView === "BATTLE" && userProfile && (
            <motion.div
              key="BATTLE"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <BattleArena
                userProfile={userProfile}
                category={selectedCategory || "SKD"}
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("DASHBOARD");
                }}
              />
            </motion.div>
          )}
          {currentView === "MARKED_QUESTIONS" && (
            <motion.div
              key="MARKED_QUESTIONS"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <MarkedQuestionsView
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("HOME");
                }}
                showToast={showToast}
              />
            </motion.div>
          )}
          {currentView === "SESSION" && (
            <motion.div
              key="SESSION"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              {selectedCategory === "SKRIPSI" ? (
                <SkripsiSession
                  result={skripsiResult}
                  feature={skripsiFeature!}
                  onBack={() => {
                    SoundManager.play("back");
                    setCurrentView("DASHBOARD");
                  }}
                />
              ) : selectedCategory === "INTERVIEW" ? (
                <InterviewSession
                  questions={questions}
                  onComplete={(ans) => handleSessionComplete(ans)}
                />
              ) : selectedCategory === "GENERAL" &&
                generalMethod === "SPACED_REPETITION" ? (
                <FlashcardSession
                  flashcards={flashcards}
                  onFinish={() => {
                    SoundManager.play("back");
                    setCurrentView("DASHBOARD");
                  }}
                />
              ) : selectedCategory === "GENERAL" &&
                generalMethod === "MIND_MAP" ? (
                <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col transition-colors duration-300">
                  {" "}
                  <div className="flex justify-between items-center mb-6">
                    {" "}
                    <button
                      onClick={() => {
                        SoundManager.play("back");
                        setCurrentView("DASHBOARD");
                      }}
                      className="flex items-center text-slate-500 dark:text-slate-400"
                    >
                      <ArrowLeft size={18} /> Kembali
                    </button>{" "}
                    <h2 className="font-bold text-slate-800 dark:text-white">
                      Mind Mapping
                    </h2>{" "}
                  </div>{" "}
                  <MindMapViewer data={mindMapData} />{" "}
                </div>
              ) : selectedCategory === "GENERAL" &&
                generalMethod === "FEYNMAN" ? (
                <FeynmanSession
                  topic={generalInput?.content || ""}
                  onFinish={() => {
                    SoundManager.play("back");
                    setCurrentView("DASHBOARD");
                  }}
                />
              ) : selectedCategory === "GENERAL" && generalMethod === "SQ3R" ? (
                <SQ3RSession
                  topic={generalInput?.content || ""}
                  onFinish={() => {
                    SoundManager.play("back");
                    setCurrentView("DASHBOARD");
                  }}
                />
              ) : (
                <SessionEngine
                  mode={sessionMode!}
                  questions={questions}
                  drillContent={drillContent}
                  onComplete={(ans, item, aborted) =>
                    handleSessionComplete(ans, item, aborted)
                  }
                  isSkdSimulation={
                    sessionMode === StudyMode.SIMULATION &&
                    selectedCategory === "SKD"
                  }
                  isUtbkSimulation={
                    sessionMode === StudyMode.SIMULATION &&
                    selectedCategory === "UTBK"
                  }
                  category={selectedCategory!}
                  showToast={showToast}
                  initialState={initialSessionState}
                  userId={userProfile?.uid}
                  skdStream={skdStream}
                  tpaStream={tpaStream}
                  packageTitle={currentPackageTitle}
                  sessionDuration={sessionDuration}
                  onSaveAndExit={() => setCurrentView("HOME")}
                  initialFontSize={settings.fontSize}
                  isLoadingMore={isLoadingMore}
                  enableAITutor={settings.enableAITutor !== false}
                  autoNext={settings.autoNextQuestion !== false}
                />
              )}
            </motion.div>
          )}
          {currentView === "TES_KORAN" && (
            <motion.div
              key="TES_KORAN"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <TesKoran
                onBack={() => setCurrentView("DASHBOARD")}
                onComplete={(item) => handleSessionComplete([], item)}
              />
            </motion.div>
          )}
          {currentView === "TES_KECERMATAN" && (
            <motion.div
              key="TES_KECERMATAN"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <TesKecermatan
                initialMode={kecermatanMode}
                onBack={() => setCurrentView("DASHBOARD")}
                onComplete={(item) => handleSessionComplete([], item)}
              />
            </motion.div>
          )}
          {currentView === "BENCHMARK" && (
            <motion.div
              key="BENCHMARK"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <HumanBenchmark
                onBack={() => setCurrentView("HOME")}
                onComplete={(item) => handleSessionComplete([], item)}
                username={userProfile?.username || "Guest"}
                history={testHistory}
                isGuest={userProfile?.isGuest}
                initialMode={benchmarkMode || undefined}
                initialTab={benchmarkTab}
              />
            </motion.div>
          )}
          {currentView === "GLOBAL_LEADERBOARD" && (
            <motion.div
              key="GLOBAL_LEADERBOARD"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <GlobalLeaderboardScreen
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("HOME");
                }}
                userProfile={userProfile}
                onOpenHumanBenchmark={() => {
                  SoundManager.play("click");
                  setSelectedCategory("BENCHMARK");
                  setBenchmarkMode(null);
                  setBenchmarkTab("RANKING");
                  setCurrentView("BENCHMARK");
                }}
              />
            </motion.div>
          )}
          {currentView === "RESULTS" && (
            <motion.div
              key="RESULTS"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <ResultsAnalysis
                answers={userAnswers}
                questions={questions}
                onHome={() => {
                  SoundManager.play("back");
                  setCurrentView("HOME");
                }}
                onRetry={() => {
                  SoundManager.play("click");
                  startSession(sessionMode!);
                }}
                onRemedial={(topic) => {
                  SoundManager.play("click");
                  startSession(StudyMode.DRILL, undefined, undefined, topic);
                }}
                onHistory={() => {
                  SoundManager.play("click");
                  setCurrentView("HISTORY");
                }}
                category={selectedCategory!}
                details={testHistory[0]?.details}
              />
            </motion.div>
          )}
          {currentView === "HISTORY" && (
            <motion.div
              key="HISTORY"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <HistoryView
                history={testHistory}
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("HOME");
                }}
                onReview={(item: TestHistoryItem) => {
                  SoundManager.play("click");
                  setReviewItem(item);
                  setCurrentView("REVIEW");
                }}
                username={userProfile?.username || "Guest"}
                onExport={exportHistory}
                onImport={importHistory}
                isDarkMode={settings.darkMode}
                onDelete={deleteHistory}
                onDeleteMultiple={handleDeleteMultipleHistory}
                onToggleStudied={handleToggleStudied}
                userProfile={userProfile}
              />
            </motion.div>
          )}
          {currentView === "REVIEW" && (
            <motion.div
              key="REVIEW"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.15 }}
              className="w-full"
            >
              <ReviewView
                item={reviewItem!}
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("HISTORY");
                }}
              />
            </motion.div>
          )}
          {currentView === "COLORBLIND" && (
            <motion.div
              key="COLORBLIND"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full"
            >
              <ColorBlindTest
                onBack={() => {
                  SoundManager.play("back");
                  setCurrentView("HOME");
                }}
                onComplete={(item) => handleSessionComplete([], item)}
                initialSpectrum={colorBlindSpectrum}
              />
            </motion.div>
          )}
        </AnimatePresence>
        </Suspense>

        {/* COMMANDER BUBBLE & MENU */}
        {userProfile &&
          (currentView as string) !== "SPLASH" &&
          (currentView as string) !== "LOGIN" &&
          (currentView as string) !== "USERNAME_SETUP" &&
          (currentView as string) !== "SESSION" &&
          (currentView as string) !== "TES_KORAN" &&
          (currentView as string) !== "TES_KECERMATAN" &&
          (currentView as string) !== "REVIEW" &&
          (settings.enableAITutor !== false ||
            settings.enableTimer !== false) &&
          !showTutor && (
            <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-[60]">
              {/* Expandable Commander Menu */}
              <AnimatePresence>
                {showCommanderMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.8 }}
                    className="flex flex-col gap-2 origin-bottom-right"
                  >
                    {settings.enableAITutor !== false && (
                      <button
                        onClick={() => {
                          setShowTutor(true);
                          setShowCommanderMenu(false);
                        }}
                        className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-slate-200 dark:border-slate-700 hover:scale-105 transition"
                      >
                        <span className="font-bold text-sm">
                          Tanya AI Tutor
                        </span>
                        <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-full text-indigo-600 dark:text-indigo-400">
                          <Bot size={18} />
                        </div>
                      </button>
                    )}
                    {settings.enableTimer !== false && (
                      <button
                        onClick={() => {
                          setShowPomodoro(true);
                          setShowCommanderMenu(false);
                        }}
                        className="bg-white dark:bg-slate-800 text-slate-800 dark:text-white px-4 py-3 rounded-2xl shadow-xl flex items-center justify-between gap-4 border border-slate-200 dark:border-slate-700 hover:scale-105 transition"
                      >
                        <span className="font-bold text-sm">
                          Mode Fokus (Timer)
                        </span>
                        <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full text-emerald-600 dark:text-emerald-400">
                          <Timer size={18} />
                        </div>
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Commander Trigger Button */}
              <button
                onClick={() => setShowCommanderMenu(!showCommanderMenu)}
                className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-2xl shadow-indigo-300 dark:shadow-indigo-900/50 flex items-center justify-center hover:bg-indigo-700 hover:scale-110 transition z-50 focus:outline-none"
              >
                {showCommanderMenu ? (
                  <X size={28} />
                ) : (
                  <div className="flex gap-0.5">
                    {settings.enableAITutor !== false && <Bot size={22} />}
                    {settings.enableTimer !== false && (
                      <Timer
                        size={14}
                        className={
                          settings.enableAITutor !== false
                            ? "opacity-75 -mt-2 -ml-3 bg-indigo-700 rounded-full"
                            : "w-6 h-6"
                        }
                      />
                    )}
                  </div>
                )}
              </button>
            </div>
          )}

        {/* AI CHAT TUTOR MODAL/PANEL */}
        {showTutor && (
          <AiChatTutor
            initialContext={tutorContext}
            onClose={() => {
              setShowTutor(false);
              setTutorContext(undefined);
            }}
            userId={userProfile?.uid}
          />
        )}

        {/* POMODORO TIMER */}
        {(currentView as string) !== "SESSION" &&
          (currentView as string) !== "TES_KORAN" &&
          (currentView as string) !== "TES_KECERMATAN" && (
            <PomodoroTimer
              isOpen={showPomodoro}
              onClose={() => setShowPomodoro(false)}
              onOpen={() => setShowPomodoro(true)}
            />
          )}
      </div>
    </>
  );
}

export default App;
