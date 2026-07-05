import React, { useState, useEffect } from 'react';
import { SavedSessionState, Question } from '../types';
import { ArrowLeft, Bookmark, BookmarkMinus, CheckCircle, Database, Sparkles } from 'lucide-react';
import { SimpleMarkdown, MatrixQuestionRenderer } from './QuestionRenderer';
import * as Gemini from '../services/geminiService';

export const AdminSessionViewer: React.FC<{
  session: SavedSessionState | { category: any, questions: Question[] };
  onBack: () => void;
  showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  fontSize: string;
}> = ({ session, onBack, showToast, fontSize }) => {
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const bank = Gemini.getBankSoal(session.category);
      const bankIds = new Set(bank.map(q => q.id));
      setAddedIds(bankIds);
    } catch (e) {
      console.error(e);
    }
  }, [session.category]);

  const handleToggleBank = (q: Question) => {
    try {
      if (addedIds.has(q.id)) {
        Gemini.removeFromBankSoal(session.category, q.id);
        showToast("Soal berhasil dihapus dari Bank Soal", "info");
        setAddedIds(prev => {
          const next = new Set(prev);
          next.delete(q.id);
          return next;
        });
      } else {
        Gemini.saveToBankSoal(session.category, q);
        showToast("Soal berhasil ditambahkan ke Bank Soal", "success");
        setAddedIds(prev => new Set(prev).add(q.id));
      }
    } catch (e) {
      showToast("Gagal menyimpan ke Bank Soal", "error");
    }
  };

  const getFontSizeClass = (size: string) => {
    switch (size) {
      case 'xs': return 'text-[10px]';
      case 'sm': return 'text-xs';
      case 'md': return 'text-sm';
      case 'lg': return 'text-base';
      case 'xl': return 'text-lg';
      default: return 'text-sm';
    }
  };

  const fontSizeClass = getFontSizeClass(fontSize);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-3 sm:p-4 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <button 
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="truncate">
              <h1 className="text-sm sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 truncate">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg shrink-0">
                  <Database className="text-purple-500" size={16} />
                </div>
                <span className="truncate">Admin: {session.category}</span>
              </h1>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                {session.questions.length} Soal Paket
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {session.questions.map((q, idx) => (
            <div key={q.id} className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                <div>
                  <span className="inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black rounded-lg uppercase tracking-widest mb-1">
                    Soal No. {idx + 1}
                  </span>
                  {q.metadata?.subtest && (
                    <span className="block text-[10px] font-bold text-indigo-500 uppercase tracking-tighter">
                      Subtest: {q.metadata.subtest}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => handleToggleBank(q)}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-tight transition-all active:scale-95 ${
                    addedIds.has(q.id) 
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-rose-500 hover:shadow-rose-500/20' 
                      : 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700'
                  }`}
                >
                  {addedIds.has(q.id) ? (
                    <><CheckCircle size={14} /> Tersimpan</>
                  ) : (
                    <><Bookmark size={14} /> Simpan ke Bank Soal</>
                  )}
                </button>
              </div>
              
              <div className={`mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 ${fontSizeClass}`}>
                <div className="prose prose-slate dark:prose-invert max-w-none">
                  <SimpleMarkdown text={q.content} />
                </div>
                {q.metadata?.matrix && (
                  <div className="mt-4 overflow-x-auto">
                    <MatrixQuestionRenderer 
                      content={q.content} 
                      metadataMatrix={q.metadata.matrix} 
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2 mb-6">
                {q.options?.map((opt, i) => (
                  <div key={i} className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${fontSizeClass} ${opt === q.correctAnswer ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-900 dark:text-emerald-100 font-bold' : 'border-slate-100 dark:border-slate-800 text-slate-700 dark:text-slate-300'}`}>
                    <span className="font-black text-indigo-500 shrink-0 w-5 h-5 flex items-center justify-center bg-white dark:bg-slate-800 rounded-lg text-[10px] border border-slate-100 dark:border-slate-700">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <div className="flex-1 pt-0.5"><SimpleMarkdown text={opt} isOption={true} /></div>
                  </div>
                ))}
              </div>

              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 -mr-8 -mt-8 rounded-full" />
                <h4 className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  <Sparkles size={12} /> Pembahasan
                </h4>
                <div className={`text-slate-700 dark:text-slate-300 italic leading-relaxed ${fontSizeClass}`}>
                  <SimpleMarkdown text={q.explanation || "Tidak ada pembahasan."} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
