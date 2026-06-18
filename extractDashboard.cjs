const fs = require('fs');
const code = fs.readFileSync('App.tsx', 'utf8');

const startStr = 'export const Dashboard: React.FC<{';
const endStr = 'function App() {';

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr);

const dashboardCodeRaw = code.substring(startIdx, endIdx);

const extractImports = `import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CategoryType, StudyMode, GeneralMaterialInput, SkdStreamType, 
  GeneralStudyMethod, SkripsiFeature, KecermatanMode, TpaStreamType, 
  TkaLevelType 
} from "../types";
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
import {
  CATEGORIES, UTBK_SUBTESTS, SKD_SUBTESTS, TPA_SUBTESTS, PSIKOTEST_SUBTESTS, 
  INTERVIEW_TOPICS, GENERAL_METHODS, INITIAL_SKD_PACKAGES, INITIAL_SKD_KEDINASAN_PACKAGES, 
  INITIAL_UTBK_PACKAGES, INITIAL_TPA_PACKAGES, INITIAL_PSIKOTEST_PACKAGES, 
  INITIAL_UTBK_HOTS_PACKAGES, INITIAL_SKD_CPNS_HOTS_PACKAGES, INITIAL_TPA_HOTS_PACKAGES, 
  APP_LOGO_URL, PSIKOTEST_KEDINASAN_SUBTESTS
} from "../constants";
import * as FirebaseService from "../services/firebase";
import * as GamificationService from "../services/gamificationService";
import { SoundManager } from "../services/soundService";
import * as Gemini from "../services/geminiService";
import { Flashcard } from "./Flashcard";
import { SimpleMarkdown, GoogleIcon } from "./common/UIComponents";
`;

const finalDashboardCode = extractImports + '\n' + dashboardCodeRaw;
fs.writeFileSync('components/Dashboard.tsx', finalDashboardCode);

let newAppCode = code.substring(0, startIdx) + `import { Dashboard } from "./components/Dashboard";\n\n` + code.substring(endIdx);
fs.writeFileSync('App.tsx', newAppCode);
