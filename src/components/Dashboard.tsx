import React, { useState, useEffect, useRef } from "react";
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
const Dashboard: React.FC<{
  category: Types.CategoryType;
  onBack: () => void;
  onStartSession: (
    mode: Types.StudyMode,
    difficulty?: string,
    count?: number,
  ) => void;
  onOpenTOSelection: () => void;
  onStartTesKoran: () => void;
  onStartTesKecermatan: (mode: Types.KecermatanMode) => void;
  onGeneralInputSubmit: (input: Types.GeneralMaterialInput) => void;
  generalInput: Types.GeneralMaterialInput | null;
  setGeneralInput?: (input: Types.GeneralMaterialInput | null) => void;
  isReadingMaterial: boolean;
  onResetMaterial: () => void;
  onSubtestSelect: (s: string) => void;
  selectedSubtest: string;
  weakTopics: string[];
  loading: boolean;
  skdStream: Types.SkdStreamType | null;
  onSkdStreamSelect: (s: Types.SkdStreamType) => void;
  onHistory: () => void;
  onStartGeneralSession: (m: Types.GeneralStudyMethod) => void;
  onStartSkripsiSession?: (feature: Types.SkripsiFeature, input: string) => void;
  username: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  tpaStream?: Types.TpaStreamType | null;
  onTpaStreamSelect?: (s: Types.TpaStreamType) => void;
  tkaLevel?: Types.TkaLevelType | null;
  onTkaLevelSelect?: (s: Types.TkaLevelType) => void;
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
    useState<Types.MaterialLength>("MEDIUM");
  const [questionDiff, setQuestionDiff] =
    useState<Types.QuestionDifficulty>("MEDIUM");
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
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-4 sm:mb-6 animate-fade-in-up">
        <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white mb-2.5">
          Pilih Topik / Subtes:
        </h3>
        <div className="mb-3.5 relative">
          <Search
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Cari topik..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
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
                      Types.StudyMode.PRACTICE,
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
                onStartSession(Types.StudyMode.DRILL);
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
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => {
              SoundManager.play("back");
              onBack();
            }}
            className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-medium"
          >
            <ArrowLeft size={18} className="mr-2" /> Kembali
          </button>
          <div className="flex items-center gap-3">
            {onToggleDarkMode && (
              <button
                onClick={() => {
                  onToggleDarkMode();
                }}
                className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition"
              >
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            )}
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full flex items-center gap-1">
              <UserIcon size={12} /> {username}
            </span>
          </div>
        </div>
        <div className="flex justify-between items-end mb-8">
          <div>
            <span className="text-sm font-bold tracking-wider text-indigo-600 uppercase mb-1 block">
              {category === "TPA"
                ? "Seleksi Lanjutan"
                : category + " Dashboard"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
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
              <div className="mb-8 animate-fade-in-up bg-gradient-to-br from-rose-50 to-orange-50 dark:from-rose-900/20 dark:to-orange-900/20 rounded-2xl p-5 sm:p-6 border border-rose-200 dark:border-rose-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Target size={20} className="text-rose-600 dark:text-rose-400" />
                      <h3 className="text-base sm:text-lg font-bold text-slate-800 dark:text-white">Fokus Perbaikan: Topik Lemah</h3>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                      Sistem mendeteksi ada {weakTopics.length} topik dimana akurasi Anda masih di bawah target. Mari berlatih kembali dengan soal latihan HOTS khusus untuk menyempurnakan kelemahan.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {weakTopics.slice(0, 3).map((topic, i) => (
                        <span key={i} className="text-[10px] sm:text-xs font-semibold bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 px-2.5 py-1.5 rounded-lg border border-rose-100 dark:border-rose-900 shadow-sm">
                          {topic}
                        </span>
                      ))}
                      {weakTopics.length > 3 && (
                        <span className="text-[10px] sm:text-xs font-semibold bg-transparent border border-rose-200/50 dark:border-rose-800 text-rose-500 px-2.5 py-1.5 rounded-lg">
                          +{weakTopics.length - 3} lainnya
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartSession(Types.StudyMode.WEAKNESS);
                    }}
                    className="w-full sm:w-auto mt-2 sm:mt-0 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-lg shadow-rose-200 dark:shadow-none transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    <Brain size={18} /> Latih Topik Ini
                  </button>
                </div>
              </div>
            )}
            
            {category === "KECERMATAN" && (
              <div className="animate-fade-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("ANGKA");
                    }}
                    className="p-4 sm:p-6 bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 rounded-2xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg text-indigo-600 dark:text-indigo-400">
                        <Activity size={24} />
                      </span>
                      <span className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">
                        Angka Hilang
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Standar tes kedinasan/Polri. Temukan angka yang hilang
                      dari kolom.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("HURUF");
                    }}
                    className="p-4 sm:p-6 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="p-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg text-emerald-600 dark:text-emerald-400">
                        <FileText size={24} />
                      </span>
                      <span className="font-bold text-base sm:text-lg text-slate-800 dark:text-white">
                        Huruf Hilang
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                      Variasi huruf. Melatih ketelitian visual terhadap karakter
                      mirip.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("SIMBOL_HILANG");
                    }}
                    className="p-6 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-2 border-slate-200 dark:border-slate-700 hover:border-purple-500 rounded-2xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg text-purple-600 dark:text-purple-400">
                        <Shapes size={24} />
                      </span>
                      <span className="font-bold text-lg text-slate-800 dark:text-white">
                        Simbol Hilang
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Temukan simbol yang hilang. Melatih ketelitian visual
                      bentuk abstrak.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("SAMA_BEDA");
                    }}
                    className="p-6 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 border-2 border-slate-200 dark:border-slate-700 hover:border-amber-500 rounded-2xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg text-amber-600 dark:text-amber-400">
                        <GitMerge size={24} />
                      </span>
                      <span className="font-bold text-lg text-slate-800 dark:text-white">
                        Sama Beda Simbol
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Bandingkan dua baris simbol. Tentukan SAMA atau BEDA
                      secepat mungkin.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("MATCHING");
                    }}
                    className="p-6 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-2 border-slate-200 dark:border-slate-700 hover:border-rose-500 rounded-2xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg text-rose-600 dark:text-rose-400">
                        <Target size={24} />
                      </span>
                      <span className="font-bold text-lg text-slate-800 dark:text-white">
                        Matching (Pencocokan)
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Cocokkan simbol dengan kode kuncinya. Melatih memori kerja
                      jangka pendek.
                    </p>
                  </button>
                  <button
                    onClick={() => {
                      SoundManager.play("click");
                      onStartTesKecermatan("GROUPING");
                    }}
                    className="p-6 bg-white dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 border-2 border-slate-200 dark:border-slate-700 hover:border-cyan-500 rounded-2xl text-left transition group shadow-sm"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="p-2 bg-cyan-100 dark:bg-cyan-900/40 rounded-lg text-cyan-600 dark:text-cyan-400">
                        <LayoutGrid size={24} />
                      </span>
                      <span className="font-bold text-lg text-slate-800 dark:text-white">
                        Grouping (Pengelompokan)
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Pilih semua simbol yang diminta dari grid acak. Melatih
                      fokus selektif.
                    </p>
                  </button>
                </div>
              </div>
            )}
            {category === "SKRIPSI" && (
              <div className="animate-fade-in-up max-w-2xl mx-auto">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Book size={24} className="text-indigo-600" /> Skripsi
                    Assistant
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                    Masukkan topik atau judul skripsi Anda untuk mendapatkan
                    bantuan AI.
                  </p>
                  <textarea
                    className="w-full p-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl mb-6 focus:ring-2 focus:ring-indigo-500 h-32"
                    placeholder="Contoh: Pengaruh Kecerdasan Buatan terhadap Minat Belajar Mahasiswa Teknik Informatika..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSkripsiSession &&
                          onStartSkripsiSession("TITLE_IDEAS", inputText);
                      }}
                      className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 flex flex-col items-center gap-2 border border-indigo-100 dark:border-indigo-800"
                    >
                      <Brain size={24} /> Ide Judul
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSkripsiSession &&
                          onStartSkripsiSession("OUTLINE", inputText);
                      }}
                      className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-xl font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 flex flex-col items-center gap-2 border border-emerald-100 dark:border-emerald-800"
                    >
                      <FileText size={24} /> Buat Outline
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSkripsiSession &&
                          onStartSkripsiSession("METHODOLOGY", inputText);
                      }}
                      className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-xl font-bold hover:bg-amber-100 dark:hover:bg-amber-900/40 flex flex-col items-center gap-2 border border-amber-100 dark:border-amber-800"
                    >
                      <Search size={24} /> Cek Metodologi
                    </button>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        onStartSkripsiSession &&
                          onStartSkripsiSession("PARAPHRASE", inputText);
                      }}
                      className="p-4 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-xl font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 flex flex-col items-center gap-2 border border-rose-100 dark:border-rose-800"
                    >
                      <FileSearch size={24} /> Parafrase Teks
                    </button>
                  </div>
                </div>
              </div>
            )}
            {category === "GENERAL" && (
              <div className="space-y-8 animate-fade-in-up">
                {!isReadingMaterial ? (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Upload size={20} /> Input Materi
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                      Masukkan topik, teks materi, atau upload PDF yang ingin
                      dipelajari.
                    </p>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="text"
                        className="flex-1 p-3 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl"
                        placeholder={
                          pdfName
                            ? `PDF Terpilih: ${pdfName}`
                            : "Contoh: Perang Dunia II, Hukum Newton, atau paste teks..."
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
                        className={`p-3 rounded-xl transition flex items-center gap-2 ${pdfName ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"}`}
                        title="Upload PDF"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <FileText size={20} />
                        <span className="hidden sm:inline font-bold text-sm">
                          Upload PDF
                        </span>
                      </button>
                    </div>
                    {pdfName && (
                      <div className="mb-4 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 px-4 py-2 rounded-lg flex items-center justify-between animate-fade-in-up border border-emerald-100 dark:border-emerald-800">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} />{" "}
                          <span>
                            File siap: <b>{pdfName}</b>
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            setPdfName(null);
                            setGeneralInput && setGeneralInput(null);
                            if (fileInputRef.current)
                              fileInputRef.current.value = "";
                          }}
                          className="text-slate-400 hover:text-rose-500"
                          title="Hapus PDF"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                    {pdfLoading ? (
                      <div className="mb-6 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                          <Loader2 size={14} className="animate-spin" /> Memuat
                          Preview PDF...
                        </div>
                        <SkeletonLoader
                          height="h-[300px]"
                          className="rounded-xl"
                        />
                      </div>
                    ) : (
                      generalInput?.type === "pdf" &&
                      generalInput.content && (
                        <div className="mb-6 animate-fade-in-up">
                          <label className="text-xs font-bold text-slate-500 mb-2 block">
                            Preview PDF:
                          </label>
                          <embed
                            src={`data:application/pdf;base64,${generalInput.content}`}
                            className="w-full h-[300px] rounded-xl border border-slate-200 dark:border-slate-700"
                            type="application/pdf"
                          />
                        </div>
                      )
                    )}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">
                          Panjang Materi (Ringkasan)
                        </label>
                        <select
                          value={materialLength}
                          onChange={(e) =>
                            setMaterialLength(e.target.value as Types.MaterialLength)
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium"
                        >
                          <option value="SHORT">Ringkas / Poin Penting</option>
                          <option value="MEDIUM">Standar (Rekomedasi)</option>
                          <option value="LONG">Mendalam / Detail</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-500 mb-1 block">
                          Tingkat Kesulitan Soal
                        </label>
                        <select
                          value={questionDiff}
                          onChange={(e) =>
                            setQuestionDiff(
                              e.target.value as Types.QuestionDifficulty,
                            )
                          }
                          className="w-full p-3 bg-slate-50 dark:bg-slate-700 dark:text-white border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-medium"
                        >
                          <option value="EASY">Mudah (Recall)</option>
                          <option value="MEDIUM">Sedang (Konseptual)</option>
                          <option value="HARD">Sulit / HOTS</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        SoundManager.play("click");
                        handleInputSubmit();
                      }}
                      className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition"
                    >
                      Proses & Baca Materi
                    </button>
                  </div>
                ) : (
                  <div className="animate-fade-in-up">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6">
                      <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <BookOpen size={20} /> Materi Belajar
                        </h3>
                        <button
                          onClick={onResetMaterial}
                          className="text-sm text-rose-500 hover:underline"
                        >
                          Ganti Materi
                        </button>
                      </div>
                      {generalInput?.type === "pdf" && generalInput.content && (
                        <div className="mb-6">
                          <embed
                            src={`data:application/pdf;base64,${generalInput.content}`}
                            className="w-full h-[500px] rounded-xl border border-slate-200 dark:border-slate-700"
                            type="application/pdf"
                          />
                        </div>
                      )}
                      <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed max-h-[400px] overflow-y-auto p-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
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
                      <h3 className="font-bold text-slate-800 dark:text-white mb-4">
                        Sudah selesai membaca? Pilih Metode Belajar:
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Constants.GENERAL_METHODS.map((m) => {
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
                {renderSubtests(Constants.UTBK_SUBTESTS)}
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
                        ? Constants.TPA_SUBTESTS
                        : Constants.PSIKOTEST_KEDINASAN_SUBTESTS,
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
                  {renderSubtests(Constants.PSIKOTEST_SUBTESTS)}
                </div>
              </>
            )}
            {category === "INTERVIEW" && renderSubtests(Constants.INTERVIEW_TOPICS)}
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
                  {renderSubtests(Constants.SKD_SUBTESTS)}
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
                        onStartSession(Types.StudyMode.DRILL);
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
                        onStartSession(Types.StudyMode.ACTIVE_RECALL);
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

