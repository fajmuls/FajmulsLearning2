import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Trash2, 
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
  CheckCircle
} from 'lucide-react';
import { Question, CategoryType } from '../types';
import * as Gemini from '../services/geminiService';
import { CATEGORIES } from '../constants';
import { SimpleMarkdown, MatrixQuestionRenderer } from './QuestionRenderer';

interface BankSoalManagerProps {
  onBack: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const BankSoalManager: React.FC<BankSoalManagerProps> = ({ onBack, showToast }) => {
  const [category, setCategory] = useState<CategoryType>('SKD');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubtest, setSelectedSubtest] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

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
      const stored = localStorage.getItem(`bank_soal_${category}`);
      if (stored) {
        const all: Question[] = JSON.parse(stored);
        const filtered = all.filter(q => q.id !== questionId);
        localStorage.setItem(`bank_soal_${category}`, JSON.stringify(filtered));
        setQuestions(filtered);
        if (selectedQuestion?.id === questionId) setSelectedQuestion(null);
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
        showToast("Soal berhasil dihapus", "success");
      }
    } catch (e) {
      showToast("Gagal menghapus soal", "error");
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Hapus ${selectedIds.size} soal terpilih dari bank soal?`)) return;

    try {
      const stored = localStorage.getItem(`bank_soal_${category}`);
      if (stored) {
        const all: Question[] = JSON.parse(stored);
        const filtered = all.filter(q => !selectedIds.has(q.id));
        localStorage.setItem(`bank_soal_${category}`, JSON.stringify(filtered));
        setQuestions(filtered);
        if (selectedQuestion && selectedIds.has(selectedQuestion.id)) setSelectedQuestion(null);
        setSelectedIds(new Set());
        showToast("Soal terpilih berhasil dihapus", "success");
      }
    } catch (e) {
      showToast("Gagal menghapus soal terpilih", "error");
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
                Bank Soal Hybrid
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kelola soal yang akan digunakan sebagai basis AI generation
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id as CategoryType)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  category === cat.id 
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/20' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
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
              <div className="flex flex-col sm:flex-row gap-2 flex-1">
                {(availableSubtests.length > 0) && (
                    <select
                        value={selectedSubtest || ''}
                        onChange={(e) => {
                            setSelectedSubtest(e.target.value || null);
                            setSelectedTopic(null); // reset topic on subtest change
                        }}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-purple-500"
                    >
                        <option value="">Semua Sub-tes</option>
                        {availableSubtests.map(st => (
                            <option key={st} value={st}>{st}</option>
                        ))}
                    </select>
                )}
                {(availableTopics.length > 0) && (
                    <select
                        value={selectedTopic || ''}
                        onChange={(e) => setSelectedTopic(e.target.value || null)}
                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 outline-none focus:border-purple-500"
                    >
                        <option value="">Semua Tema</option>
                        {availableTopics.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                )}
              </div>

              {filteredQuestions.length > 0 && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    {selectedIds.size === filteredQuestions.length ? 'Batal Semua' : 'Pilih Semua'}
                  </button>
                  {selectedIds.size > 0 && (
                    <button 
                      onClick={handleBulkDelete}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500 text-white shadow-lg shadow-red-500/20 active:scale-95 transition"
                    >
                      <Trash2 size={14} />
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
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                            {q.metadata?.subtest || 'Umum'}
                          </span>
                          {q.metadata?.topic && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                              {q.metadata.topic}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                          {q.content.replace(/<[^>]*>/g, '')}
                        </p>
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(q.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
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
                   <button 
                    onClick={() => handleDelete(selectedQuestion.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
                  >
                    <Trash2 size={14} />
                    Hapus
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
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
                </div>
                
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/40">
                    <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-2">Jawaban Benar</h4>
                    <p className="text-sm font-medium text-emerald-900 dark:text-emerald-300">{selectedQuestion.correctAnswer}</p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-900/40">
                    <h4 className="text-xs font-bold text-purple-700 dark:text-purple-400 uppercase tracking-widest mb-2">Pembahasan</h4>
                    <p className="text-sm leading-relaxed text-purple-900 dark:text-purple-300 italic">
                      {selectedQuestion.explanation || "Tidak ada pembahasan."}
                    </p>
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
              <h3 className="text-lg font-bold text-slate-400">Pilih soal untuk melihat detail</h3>
              <p className="text-sm max-w-xs mt-2">
                Pilih salah satu soal dari daftar di sebelah kiri untuk melihat pratinjau lengkap dan pembahasannya.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
