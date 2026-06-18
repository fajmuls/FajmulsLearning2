import React, { useState, useEffect, useRef } from "react";
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
  GeneralStudyMethod,
  FlashcardData,
  MindMapNode,
  SkripsiFeature,
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
  Clock, Brain, Zap, Target, Upload, FileText, ChevronRight, AlertTriangle, 
  CheckCircle, XCircle, X, Activity, ArrowLeft, Loader2, BookOpen, GraduationCap, 
  Briefcase, MessageSquare, Palette, Repeat, Share2, PenTool, Landmark, Building2, 
  Timer, MessageCircle, Filter, Calendar, TrendingUp, Award, Trash2, LogOut, Book, 
  FileSearch, User as UserIcon, Download, Search, History, Lightbulb, Moon, Sun, 
  Grid, Pause, Play, Plus, Lock, Info, Settings, Calculator, Eye, GitMerge, 
  LayoutGrid, Shapes, Globe, Trophy, PlayCircle, FolderOpen, RotateCcw, BarChart2, 
  Users, Swords, Flag, Bot 
} from "lucide-react";
import { PomodoroTimer } from "./components/PomodoroTimer";
import { MindMapViewer } from "./components/MindMapViewer";
import { SkeletonLoader, CardSkeleton } from "./components/SkeletonLoader";
import { SplashScreen } from "./components/SplashScreen";
import { SettingsModal } from "./components/SettingsModal";
import { TOSelectionScreen } from "./components/TOSelectionScreen";
import { ResultsAnalysis } from "./components/ResultsAnalysis";
import { HistoryView, ReviewView } from "./components/HistoryView";
import { SessionEngine } from "./components/SessionEngine";
import { TesKoran } from "./components/TesKoran";
import { TesKecermatan } from "./components/TesKecermatan";
import { ColorBlindTest } from "./components/ColorBlindTest";
import { HumanBenchmark } from "./components/HumanBenchmark";
import { GlobalLeaderboardScreen } from "./components/GlobalLeaderboardScreen";
import {
  GamificationBar, AchievementsModal, LevelUpModal, AchievementToast,
} from "./components/Gamification";
import { AcademicHub } from "./components/AcademicHub";
import { SocialHub } from "./components/SocialHub";
import { BattleArena } from "./components/BattleArena";
import { MarkedQuestionsView } from "./components/MarkedQuestionsView";
import { AiChatTutor } from "./components/AiChatTutor";
import { safeStorage } from "./utils/safeStorage";

const localStorage = safeStorage;

import { getCircularReplacer } from "./utils/helpers";
import { Dashboard } from "./components/Dashboard";
import { UserAvatar, SimpleMarkdown, NotificationToast, GoogleIcon } from "./components/common/UIComponents";
import { LoginScreen, UsernameSetupScreen } from "./components/auth/AuthScreens";
import { SkripsiSession, InterviewSession, FlashcardSession, FeynmanSession, SQ3RSession, ResumeModal, ResumeSessionList } from "./components/sessions/SessionInteractions";
