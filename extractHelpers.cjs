const fs = require('fs');

const code = fs.readFileSync('App.tsx', 'utf8');

// 1. Find boundaries for HelperComponents
const helperStartStr = 'const UserAvatar: React.FC<{ user: UserProfile | null }> = ({ user }) => {';
const helperEndStr = 'const Dashboard';

const extractImports = `import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import * as Types from "../types";
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
import * as Constants from "../constants";
import * as FirebaseService from "../services/firebase";
import * as GamificationService from "../services/gamificationService";
import { SoundManager } from "../services/soundService";
import * as Gemini from "../services/geminiService";
import { Flashcard } from "./Flashcard";
import { SimpleMarkdown, GoogleIcon } from "./common/UIComponents";
`;

const dashboardStartIdx = code.indexOf(helperEndStr);
const appStartIdx = code.indexOf('function App() {');

const dashboardCodeRaw = code.substring(dashboardStartIdx, appStartIdx);

let fixedDashboardCode = dashboardCodeRaw
  .replace(/import \{.*?\} from ".*?";/g, '') // remove existing imports just in case
  .replace(/\b(CategoryType|StudyMode|Question|DrillMaterial|GeneralMaterialInput|UserAnswer|SkdStreamType|TestHistoryItem|InterviewFeedback|GeneralStudyMethod|FlashcardData|MindMapNode|FeynmanFeedback|SkripsiFeature|IshiharaPlate|MaterialLength|QuestionDifficulty|StaticTestPackage|AppSettings|KecermatanMode|UserProfile|BenchmarkMode|SavedSessionState|TpaStreamType|Achievement|AppTheme|AppPattern|TkaLevelType|BackgroundGenTask)\b/g, 'Types.$1')
  .replace(/\b(CATEGORIES|UTBK_SUBTESTS|SKD_SUBTESTS|TPA_SUBTESTS|PSIKOTEST_SUBTESTS|INTERVIEW_TOPICS|GENERAL_METHODS|INITIAL_SKD_PACKAGES|INITIAL_SKD_KEDINASAN_PACKAGES|INITIAL_UTBK_PACKAGES|INITIAL_TPA_PACKAGES|INITIAL_PSIKOTEST_PACKAGES|INITIAL_UTBK_HOTS_PACKAGES|INITIAL_SKD_CPNS_HOTS_PACKAGES|INITIAL_TPA_HOTS_PACKAGES|APP_LOGO_URL|PSIKOTEST_KEDINASAN_SUBTESTS)\b/g, 'Constants.$1');

const finalDashboardFile = extractImports + fixedDashboardCode;
fs.writeFileSync('src/components/Dashboard.tsx', finalDashboardFile);

// Wait, Dashboard is 1000 lines long, let's keep it in App.tsx but remove the other helpers!
// Actually, extracting Dashboard is hard because it shares so many types. Let's just remove the helper components!

const removeStartIdx = code.indexOf(helperStartStr);
const removeEndIdx = dashboardStartIdx;

let newAppCode = code.substring(0, removeStartIdx) + 
  `import { UserAvatar, SimpleMarkdown, NotificationToast, GoogleIcon } from "./components/common/UIComponents";\n` +
  `import { LoginScreen, UsernameSetupScreen } from "./components/auth/AuthScreens";\n` +
  `import { SkripsiSession, InterviewSession, FlashcardSession, FeynmanSession, SQ3RSession, ResumeModal, ResumeSessionList } from "./components/sessions/SessionInteractions";\n\n` +
  code.substring(removeEndIdx);

fs.writeFileSync('App.tsx', newAppCode);
