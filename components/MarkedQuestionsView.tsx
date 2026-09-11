import React, { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Trash2, Flag, FileText, ChevronDown, ChevronUp, CheckCircle, Copy, Search, X, Filter } from 'lucide-react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { MarkedQuestion } from '../types';
import { SoundManager } from '../services/soundService';
import { SimpleMarkdown, MatrixQuestionRenderer } from './QuestionRenderer';

export const MarkedQuestionsView: React.FC<{ onBack: () => void, showToast: (msg: string, type: 'success' | 'error' | 'info') => void }> = ({ onBack, showToast }) => {
    const [questions, setQuestions] = useState<MarkedQuestion[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<'ALL' | string>('ALL');

    useEffect(() => {
        const stored = localStorage.getItem('fajmuls_marked_questions');
        if (stored) {
            try {
                setQuestions(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse marked questions", e);
            }
        }
    }, []);

    const categories = useMemo(() => {
        const set = new Set<string>();
        questions.forEach(q => {
            if (q.category) set.add(q.category);
        });
        return ['ALL', ...Array.from(set)];
    }, [questions]);

    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const matchesCat = selectedCategory === 'ALL' || q.category === selectedCategory;
            if (!matchesCat) return false;
            if (!searchQuery.trim()) return true;
            const query = searchQuery.toLowerCase();
            const content = (q.question?.content || '').toLowerCase();
            const exp = (q.question?.explanation || '').toLowerCase();
            const subtest = (q.question?.metadata?.subtest || '').toLowerCase();
            const topic = (q.question?.metadata?.topic || '').toLowerCase();
            const id = (q.id || '').toLowerCase();
            return content.includes(query) || exp.includes(query) || subtest.includes(query) || topic.includes(query) || id.includes(query);
        });
    }, [questions, searchQuery, selectedCategory]);

    const handleDelete = (id: string) => {
        SoundManager.play('click');
        const updated = questions.filter(q => q.id !== id);
        setQuestions(updated);
        localStorage.setItem('fajmuls_marked_questions', JSON.stringify(updated));
        showToast("Soal berhasil dihapus.", 'success');
    };

    const toggleExpand = (id: string) => {
        SoundManager.play('click');
        setExpandedId(expandedId === id ? null : id);
    };

    const handleCopy = async (item: MarkedQuestion) => {
        SoundManager.play('click');
        const optionsText = item.question.options?.map((opt, idx) => `${String.fromCharCode(65+idx)}. ${opt}`).join('\n') || '';
        const textToCopy = `[${item.category}] ID: ${item.id}\n\n${item.question.content}\n\nOptions:\n${optionsText}\n\nJawaban Benar: ${item.question.correctAnswer}\n\nPembahasan:\n${item.question.explanation}`;
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            showToast("Soal, jawaban, dan pembahasan berhasil disalin!", 'success');
        } catch (err) {
            console.error('Failed to copy: ', err);
            showToast("Gagal menyalin ke clipboard.", 'error');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 sm:px-6 py-3 sm:py-4 transition-colors">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button onClick={onBack} className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition text-slate-700 dark:text-slate-300">
                            <ArrowLeft size={18} className="sm:w-5 sm:h-5"/>
                        </button>
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                                <Flag className="text-rose-500 w-5 h-5 sm:w-6 sm:h-6" /> Soal Ditandai
                            </h1>
                            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                                {filteredQuestions.length} dari {questions.length} soal tersimpan
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search & Filter Bar */}
                {questions.length > 0 && (
                    <div className="space-y-3 mb-6">
                        <div className="relative">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Cari isi soal, topik, pembahasan, atau ID..."
                                className="w-full pl-10 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <X size={14} />
                                </button>
                            )}
                        </div>

                        {categories.length > 2 && (
                            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                                    <Filter size={10} /> Kategori:
                                </span>
                                {categories.map(cat => {
                                    const count = cat === 'ALL' ? questions.length : questions.filter(q => q.category === cat).length;
                                    const isSelected = selectedCategory === cat;
                                    return (
                                        <button
                                            key={cat}
                                            onClick={() => {
                                                SoundManager.play('tap');
                                                setSelectedCategory(cat);
                                            }}
                                            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap ${
                                                isSelected 
                                                    ? 'bg-indigo-600 text-white shadow-sm' 
                                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                                            }`}
                                        >
                                            {cat === 'ALL' ? 'Semua' : cat} ({count})
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {questions.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                        <Flag size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Belum ada soal yang ditandai.</p>
                    </div>
                ) : filteredQuestions.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 p-6">
                        <Search size={36} className="mx-auto mb-2 text-slate-400 opacity-40"/>
                        <p className="font-semibold text-sm mb-1">Tidak ada soal yang cocok dengan pencarian.</p>
                        <p className="text-xs">Coba kata kunci lain atau ubah filter kategori.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                            className="mt-3 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 transition"
                        >
                            Reset Filter
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredQuestions.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm hover:shadow-md transition-all">
                                <div 
                                    className="p-3 sm:p-4 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    onClick={() => toggleExpand(item.id)}
                                >
                                    <div className="flex items-center gap-3 sm:gap-4">
                                        <div className={`p-1.5 sm:p-2 rounded-lg ${
                                            item.category === 'UTBK' ? 'bg-rose-100 text-rose-600' :
                                            item.category === 'SKD' ? 'bg-amber-100 text-amber-600' :
                                            item.category === 'TPA' ? 'bg-blue-100 text-blue-600' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                            <FileText size={16} className="sm:w-5 sm:h-5"/>
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm mb-0.5 sm:mb-1">
                                                {item.category} • {new Date(item.dateMarked).toLocaleDateString()}
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                                ID: {item.id}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                            className="p-1.5 sm:p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
                                            title="Hapus"
                                        >
                                            <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]"/>
                                        </button>
                                        {expandedId === item.id ? <ChevronUp size={16} className="text-slate-400 sm:w-5 sm:h-5"/> : <ChevronDown size={16} className="text-slate-400 sm:w-5 sm:h-5"/>}
                                    </div>
                                </div>

                                {expandedId === item.id && (
                                    <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 animate-fade-in">
                                        <div className="flex justify-end mb-3 sm:mb-4">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleCopy(item); }}
                                                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition font-bold text-xs sm:text-sm"
                                            >
                                                <Copy size={14} className="sm:w-4 sm:h-4" /> Salin Semua
                                            </button>
                                        </div>
                                        <div className="prose prose-sm dark:prose-invert max-w-none mb-4 sm:mb-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm">
                                            {item.question.metadata?.matrix || item.question.content.includes(':::MATRIX:::') ? (
                                                <MatrixQuestionRenderer 
                                                    content={item.question.content} 
                                                    metadataMatrix={item.question.metadata?.matrix} 
                                                />
                                            ) : (
                                                <SimpleMarkdown text={item.question.content} />
                                            )}
                                        </div>
                                        
                                        {item.question.options && (
                                            <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                                                {item.question.options.map((opt, idx) => (
                                                    <div key={idx} className={`p-2.5 sm:p-3 rounded-lg border ${
                                                        opt === item.question.correctAnswer 
                                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300' 
                                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                                                    }`}>
                                                        <div className="flex gap-2 sm:gap-3 text-xs sm:text-sm">
                                                            <span className="font-bold">{String.fromCharCode(65+idx)}.</span>
                                                            <div className="flex-1"><SimpleMarkdown text={opt} isOption={true} /></div>
                                                            {opt === item.question.correctAnswer && <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5 sm:mt-1 sm:w-4 sm:h-4"/>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 sm:p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                            <h4 className="font-bold text-indigo-700 dark:text-indigo-300 mb-1.5 sm:mb-2 text-xs sm:text-sm">Pembahasan:</h4>
                                            <SimpleMarkdown text={item.question.explanation} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
