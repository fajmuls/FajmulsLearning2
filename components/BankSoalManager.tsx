import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash, 
  ArrowLeft, 
  BookOpen, 
  Search, 
  Filter,
  AlertTriangle,
  RefreshCw,
  Database,
  Eye,
  Check,
  Sparkles,
  CheckCircle,
  X,
  ChevronDown,
  Maximize2,
  Edit3,
  Save,
  Brain,
  Award,
  PenTool
} from 'lucide-react';
import { Question, CategoryType } from '../types';
import * as Gemini from '../services/geminiService';
import { SimpleMarkdown, MatrixQuestionRenderer } from './QuestionRenderer';

interface BankSoalManagerProps {
  onBack: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const CATEGORIES_DATA: { id: CategoryType; label: string; icon: any }[] = [
  { id: 'UTBK', label: 'UTBK-SNBT', icon: BookOpen },
  { id: 'SKD', label: 'SKD CPNS', icon: Award },
  { id: 'TPA', label: 'Psikotes / TPA', icon: Brain },
  { id: 'GENERAL', label: 'Materi Sekolah', icon: PenTool },
];

export const BankSoalManager: React.FC<BankSoalManagerProps> = ({ onBack, showToast }) => {
  const [category, setCategory] = useState<CategoryType>('SKD');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubtest, setSelectedSubtest] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Question | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'subtest' | 'topic' | 'category' | null>(null);

  const fetchQuestions = () => {
    setLoading(true);
    try {
      const data = Gemini.getBankSoal(category);
      setQuestions(data);
      setSelectedIds(new Set());
    } catch (e) {
      showToast("Gagal memuat bank soal", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
    setSelectedSubtest(null);
    setSelectedTopic(null);
  }, [category]);

  const handleDelete = (questionId: string) => {
    if (!confirm("Hapus soal ini dari bank soal?")) return;
    
    try {
      Gemini.removeFromBankSoal(category, questionId);
      setQuestions(prev => prev.filter(q => q.id !== questionId));
      if (selectedQuestion?.id === questionId) {
        setSelectedQuestion(null);
        setIsMaximized(false);
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(questionId);
        return next;
      });
      showToast("Soal berhasil dihapus", "success");
    } catch (e) {
      showToast("Gagal menghapus soal", "error");
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Hapus ${selectedIds.size} soal terpilih dari bank soal?`)) return;

    try {
      selectedIds.forEach(id => Gemini.removeFromBankSoal(category, id));
      setQuestions(prev => prev.filter(q => !selectedIds.has(q.id)));
      if (selectedQuestion && selectedIds.has(selectedQuestion.id)) {
        setSelectedQuestion(null);
        setIsMaximized(false);
      }
      setSelectedIds(new Set());
      showToast("Soal terpilih berhasil dihapus", "success");
    } catch (e) {
      showToast("Gagal menghapus soal terpilih", "error");
    }
  };

  const handleSaveEdit = () => {
    if (!editData) return;
    try {
      Gemini.updateBankSoal(category, editData);
      setQuestions(prev => prev.map(q => q.id === editData.id ? editData : q));
      setSelectedQuestion(editData);
      setIsEditing(false);
      showToast("Soal berhasil diperbarui", "success");
    } catch (e) {
      showToast("Gagal menyimpan perubahan", "error");
    }
  };

  const toggleSelect = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredQuestions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredQuestions.map(q => q.id)));
    }
  };

  const availableSubtests = Array.from(new Set(questions.map(q => q.metadata?.subtest).filter(Boolean))) as string[];
  const availableTopics = Array.from(new Set(questions.filter(q => !selectedSubtest || q.metadata?.subtest === selectedSubtest).map(q => q.metadata?.topic).filter(Boolean))) as string[];

  const filteredQuestions = questions.filter(q => {
      const matchSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (q.metadata?.topic && q.metadata.topic.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchSubtest = !selectedSubtest || q.metadata?.subtest === selectedSubtest;
      const matchTopic = !selectedTopic || q.metadata?.topic === selectedTopic;
      return matchSearch && matchSubtest && matchTopic;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Database className="text-purple-500" size={24} />
                Bank Soal Hybrid & Analisis
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola soal yang akan digunakan sebagai basis AI generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveDropdown(activeDropdown === 'category' ? null : 'category')}
                          className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all hover:border-purple-500 shadow-sm min-w-[120px] justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {CATEGORIES_DATA.find(c => c.id === category)?.icon && React.createElement(CATEGORIES_DATA.find(c => c.id === category)!.icon, { size: 14, className: "text-purple-500" })}
                            <span className="uppercase tracking-tight">{CATEGORIES_DATA.find(c => c.id === category)?.label}</span>
                          </div>
                          <ChevronDown size={14} className={`transition-transform ${activeDropdown === 'category' ? 'rotate-180' : ''}`} />
                        </button>
                        {activeDropdown === 'category' && (
                          <div className="absolute top-full right-0 mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fade-in-up">
                            {CATEGORIES_DATA.map(cat => (
                              <button
                                key={cat.id}
                                type="button"
                                onClick={() => { setCategory(cat.id as CategoryType); setActiveDropdown(null); }}
                                className={`w-full text-left px-4 py-3 text-xs flex items-center gap-3 transition hover:bg-slate-50 dark:hover:bg-slate-700 ${category === cat.id ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
                              >
                                {React.createElement(cat.icon, { size: 16 })}
                                <span className="uppercase tracking-wide">{cat.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full flex flex-col md:flex-row gap-6 p-4 overflow-hidden">
        {/* Left Side: List */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center gap-3">
                <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="text"
                    placeholder="Cari soal atau topik..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
                </div>
                <button 
                onClick={fetchQuestions}
                className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Refresh"
                >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-2 flex-1">
                {availableSubtests.length > 0 && (
                  <div className="relative flex-1">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'subtest' ? null : 'subtest')}
                      className="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[9px] sm:text-[10px] font-black text-slate-700 dark:text-slate-300 transition-all hover:border-purple-500"
                    >
                      <span className="truncate uppercase">{selectedSubtest || 'Semua Sub-tes'}</span>
                      <ChevronDown size={12} className={`transition-transform ${activeDropdown === 'subtest' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === 'subtest' && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden animate-fade-in-up">
                        <button
                          onClick={() => { setSelectedSubtest(null); setSelectedTopic(null); setActiveDropdown(null); }}
                          className="w-full text-left px-3 py-2 text-[9px] sm:text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition uppercase font-bold"
                        >
                          Semua Sub-tes
                        </button>
                        {availableSubtests.map(st => (
                          <button
                            key={st}
                            onClick={() => { setSelectedSubtest(st); setSelectedTopic(null); setActiveDropdown(null); }}
                            className="w-full text-left px-3 py-2 text-[9px] sm:text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition uppercase"
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {availableTopics.length > 0 && (
                  <div className="relative flex-1">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === 'topic' ? null : 'topic')}
                      className="w-full flex items-center justify-between bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-[9px] sm:text-[10px] font-black text-slate-700 dark:text-slate-300 transition-all hover:border-purple-500"
                    >
                      <span className="truncate uppercase">{selectedTopic || 'Semua Tema'}</span>
                      <ChevronDown size={12} className={`transition-transform ${activeDropdown === 'topic' ? 'rotate-180' : ''}`} />
                    </button>
                    {activeDropdown === 'topic' && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-30 overflow-hidden animate-fade-in-up">
                        <button
                          onClick={() => { setSelectedTopic(null); setActiveDropdown(null); }}
                          className="w-full text-left px-3 py-2 text-[9px] sm:text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition uppercase font-bold"
                        >
                          Semua Tema
                        </button>
                        {availableTopics.map(t => (
                          <button
                            key={t}
                            onClick={() => { setSelectedTopic(t); setActiveDropdown(null); }}
                            className="w-full text-left px-3 py-2 text-[9px] sm:text-[10px] hover:bg-slate-100 dark:hover:bg-slate-700 transition uppercase"
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {filteredQuestions.length > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-[10px] sm:text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline whitespace-nowrap"
                  >
                    {selectedIds.size === filteredQuestions.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button 
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg text-[10px] sm:text-xs font-bold bg-red-500 text-white shadow-lg shadow-red-500/20 active:scale-95 transition"
                    >
                      <Trash size={12} className="sm:w-[14px] sm:h-[14px]" />
                      Hapus ({selectedIds.size})
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
            {filteredQuestions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center p-8">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="text-slate-300 dark:text-slate-600" size={32} />
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold">Belum ada soal</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Tambahkan soal dari menu Try Out saat sedang mengerjakan soal sebagai Admin.
                </p>
              </div>
            ) : (
              filteredQuestions.map((q) => (
                <motion.div 
                  key={q.id}
                  layoutId={q.id}
                  onClick={() => setSelectedQuestion(q)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedQuestion?.id === q.id 
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 ring-1 ring-purple-500/30' 
                      : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 hover:border-purple-200 dark:hover:border-purple-800'
                  }`}
                >
                  <div 
                    onClick={(e) => toggleSelect(q.id, e)}
                    className={`w-5 h-5 rounded border mt-0.5 shrink-0 flex items-center justify-center transition-all ${
                      selectedIds.has(q.id) 
                        ? 'bg-purple-600 border-purple-600 text-white' 
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    {selectedIds.has(q.id) && <Check size={12} strokeWidth={4} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {q.metadata?.subtest || 'Umum'}
                          </span>
                          {q.metadata?.topic && (
                            <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                              {q.metadata.topic}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {q.content.replace(/<[^>]*>/g, '')}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQuestion(q);
                            setIsMaximized(true);
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all active:scale-90 md:hidden"
                        >
                          <Maximize2 size={18} />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(q.id);
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-90"
                          title="Hapus Soal"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Detail */}
        <div className="hidden md:flex flex-[1.5] flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-w-0">
          {selectedQuestion ? (
            <div className="flex flex-col h-full overflow-hidden">
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
                <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye size={18} className="text-purple-500" />
                  Pratinjau Soal
                </h3>
                <div className="flex gap-2">
                   {!isEditing ? (
                     <button 
                      onClick={() => { setEditData({...selectedQuestion}); setIsEditing(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 hover:bg-purple-50 transition"
                     >
                      <Edit3 size={14} />
                      Edit
                     </button>
                   ) : (
                     <button 
                      onClick={handleSaveEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition"
                     >
                      <Save size={14} />
                      Simpan
                     </button>
                   )}
                   <button 
                    onClick={() => handleDelete(selectedQuestion.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                  >
                    <Trash size={14} />
                    Hapus
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Teks Soal</label>
                        <textarea 
                          value={editData?.content || ''}
                          onChange={(e) => setEditData(prev => prev ? {...prev, content: e.target.value} : null)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm min-h-[120px] focus:ring-2 focus:ring-purple-500/20 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Pilihan Jawaban</label>
                        {editData?.options?.map((opt, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="w-6 text-[10px] font-bold text-slate-400">{String.fromCharCode(65 + i)}.</span>
                            <input 
                              value={opt}
                              onChange={(e) => setEditData(prev => {
                                if(!prev || !prev.options) return prev;
                                const nextOpts = [...prev.options];
                                nextOpts[i] = e.target.value;
                                return {...prev, options: nextOpts};
                              })}
                              className={`flex-1 bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-purple-500/20 outline-none ${opt === editData.correctAnswer ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}`}
                            />
                            <button 
                              onClick={() => setEditData(prev => prev ? {...prev, correctAnswer: opt} : null)}
                              className={`p-1.5 rounded-lg transition ${opt === editData.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}
                              title="Set as Correct"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <SimpleMarkdown text={selectedQuestion.content} />
                      {selectedQuestion.metadata?.matrix && (
                        <div className="mt-4">
                          <MatrixQuestionRenderer 
                            content={selectedQuestion.content} 
                            metadataMatrix={selectedQuestion.metadata.matrix} 
                          />
                        </div>
                      )}
                      
                      <div className="mt-6 space-y-2">
                        {selectedQuestion.options?.map((opt, i) => (
                          <div key={i} className={`p-3 rounded-lg border ${opt === selectedQuestion.correctAnswer ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
                            <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span>
                            <SimpleMarkdown text={opt} isOption={true} />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">Jawaban Benar</h4>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">{selectedQuestion.correctAnswer}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/40">
                    <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-2">Pembahasan</h4>
                    {isEditing ? (
                      <textarea 
                        value={editData?.explanation || ''}
                        onChange={(e) => setEditData(prev => prev ? {...prev, explanation: e.target.value} : null)}
                        placeholder="Tulis pembahasan soal di sini..."
                        className="w-full bg-transparent border-none p-0 text-sm min-h-[100px] focus:ring-0 outline-none italic text-purple-900 dark:text-purple-300"
                      />
                    ) : (
                      <div className="text-sm leading-relaxed text-purple-900 dark:text-purple-300 italic">
                        <SimpleMarkdown text={selectedQuestion.explanation || "Tidak ada pembahasan."} />
                      </div>
                    )}
                  </div>

                  {selectedQuestion.metadata && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Metadata</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {Object.entries(selectedQuestion.metadata).map(([key, val]) => (
                          <div key={key}>
                            <p className="text-[10px] text-slate-400 uppercase">{key}</p>
                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300">{String(val)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-50">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <Database className="text-slate-300 dark:text-slate-600" size={40} />
              </div>
              <h3 className="text-lg font-bold text-slate-400">Pilih soal untuk melihat detail & analisis</h3>
              <p className="text-sm max-w-xs mt-2">
                Pilih salah satu soal dari daftar di sebelah kiri untuk melihat pratinjau lengkap, pembahasan, dan analisis mendalam.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Maximized Detail Modal (for Mobile/Tablets) */}
      <AnimatePresence>
      {(isMaximized && selectedQuestion) && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[95vh] rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="p-3 sm:p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg sm:rounded-xl text-purple-600 dark:text-purple-400">
                  <Eye size={16} className="sm:w-5 sm:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-xs sm:text-base text-slate-900 dark:text-white">Detail Soal</h3>
                  <p className="text-[8px] sm:text-[10px] text-slate-500 uppercase font-black tracking-widest">{selectedQuestion.metadata?.subtest || 'Umum'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {!isEditing ? (
                  <button 
                    onClick={() => { setEditData({...selectedQuestion}); setIsEditing(true); }}
                    className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-purple-600 hover:bg-purple-50 transition"
                    title="Edit Soal"
                  >
                    <Edit3 size={16} className="sm:w-5 sm:h-5" />
                  </button>
                ) : (
                  <button 
                    onClick={handleSaveEdit}
                    className="p-1.5 sm:p-2 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition flex items-center gap-1 sm:gap-2"
                  >
                    <Save size={16} className="sm:w-5 sm:h-5" />
                    <span className="text-[10px] sm:text-xs font-bold">Simpan</span>
                  </button>
                )}
                <button 
                  onClick={() => { setIsMaximized(false); setIsEditing(false); }}
                  className="p-1.5 sm:p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  <X size={20} className="sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 scrollbar-hide">
                <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                  {isEditing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Teks Soal</label>
                        <textarea 
                          value={editData?.content || ''}
                          onChange={(e) => setEditData(prev => prev ? {...prev, content: e.target.value} : null)}
                          className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs sm:text-sm min-h-[120px] focus:ring-2 focus:ring-purple-500/20 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Pilihan Jawaban</label>
                        {editData?.options?.map((opt, i) => (
                          <div key={i} className="flex gap-2 items-center">
                            <span className="w-6 text-[10px] font-bold text-slate-400">{String.fromCharCode(65 + i)}.</span>
                            <input 
                              value={opt}
                              onChange={(e) => setEditData(prev => {
                                if(!prev || !prev.options) return prev;
                                const nextOpts = [...prev.options];
                                nextOpts[i] = e.target.value;
                                return {...prev, options: nextOpts};
                              })}
                              className={`flex-1 bg-slate-50 dark:bg-slate-900 border rounded-lg px-3 py-1.5 text-xs sm:text-sm focus:ring-2 focus:ring-purple-500/20 outline-none ${opt === editData.correctAnswer ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}`}
                            />
                            <button 
                              onClick={() => setEditData(prev => prev ? {...prev, correctAnswer: opt} : null)}
                              className={`p-1.5 rounded-lg transition ${opt === editData.correctAnswer ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}
                              title="Set as Correct"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs sm:text-base leading-relaxed">
                        <SimpleMarkdown text={selectedQuestion.content} />
                      </div>
                      {selectedQuestion.metadata?.matrix && (
                        <div className="mt-4">
                          <MatrixQuestionRenderer 
                            content={selectedQuestion.content} 
                            metadataMatrix={selectedQuestion.metadata.matrix} 
                          />
                        </div>
                      )}
                      
                      <div className="mt-4 sm:mt-6 space-y-2">
                        {selectedQuestion.options?.map((opt, i) => (
                          <div key={i} className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border flex items-start gap-2 sm:gap-3 transition ${opt === selectedQuestion.correctAnswer ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
                            <span className="font-bold text-[10px] sm:text-sm text-slate-400 mt-0.5">{String.fromCharCode(65 + i)}.</span>
                            <div className="flex-1 text-[11px] sm:text-base leading-tight">
                              <SimpleMarkdown text={opt} isOption={true} />
                            </div>
                            {opt === selectedQuestion.correctAnswer && <CheckCircle size={14} className="text-emerald-500 mt-0.5 sm:mt-1 shrink-0" />}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                    <h4 className="text-[8px] sm:text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-1 sm:mb-2">Jawaban Benar</h4>
                    <p className="text-[11px] sm:text-sm font-bold text-emerald-900 dark:text-emerald-300">{selectedQuestion.correctAnswer}</p>
                  </div>
                  
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/40">
                    <h4 className="text-[8px] sm:text-[10px] font-black text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-1 sm:mb-2">Pembahasan</h4>
                    {isEditing ? (
                      <textarea 
                        value={editData?.explanation || ''}
                        onChange={(e) => setEditData(prev => prev ? {...prev, explanation: e.target.value} : null)}
                        placeholder="Tulis pembahasan soal di sini..."
                        className="w-full bg-transparent border-none p-0 text-[11px] sm:text-sm min-h-[80px] focus:ring-0 outline-none italic text-purple-900 dark:text-purple-300"
                      />
                    ) : (
                      <div className="text-[11px] sm:text-sm leading-relaxed text-purple-900 dark:text-purple-300 italic">
                        <SimpleMarkdown text={selectedQuestion.explanation || "Tidak ada pembahasan."} />
                      </div>
                    )}
                  </div>
                </div>
            </div>
            
            <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <button 
                onClick={() => handleDelete(selectedQuestion.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] sm:text-xs font-bold text-red-600 hover:bg-red-50 transition"
              >
                <Trash size={14} />
                Hapus Soal
              </button>
              <button 
                onClick={() => { setIsMaximized(false); setIsEditing(false); }}
                className="px-5 sm:px-8 py-2 sm:py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-[10px] sm:text-sm hover:scale-105 active:scale-95 transition"
              >
                Tutup
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
