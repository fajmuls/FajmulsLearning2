import React, { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Flag, FileText, ChevronDown, ChevronUp, CheckCircle, Copy } from 'lucide-react';
import { InlineMath, BlockMath } from './KatexReact';
import 'katex/dist/katex.min.css';
import { MarkedQuestion } from '../types';
import { SoundManager } from '../services/soundService';
import { safeStorage } from '../utils/safeStorage';

// Shadow standard localStorage with safeStorage for iframe storage access resiliency
const localStorage = safeStorage;

const ensureLaTeXWrapping = (text: string): string => {
    if (!text) return text;
    
    // Check if the text contains LaTeX commands but doesn't have any LaTeX delimiters
    const hasRawLaTeX = text.includes('\\sqrt') || text.includes('\\frac') || text.includes('\\pm') || text.includes('\\times') || text.includes('\\le') || text.includes('\\ge') || text.includes('\\approx') || text.includes('\\neq') || text.includes('\\cdot');
    const hasDelimiters = text.includes('\\(') || text.includes('$$');
    
    if (hasRawLaTeX && !hasDelimiters) {
        if (text.trim().startsWith('\\') && text.trim().endsWith('}')) {
            return `\\(${text.trim()}\\)`;
        }
        
        let processed = text;
        processed = processed.replace(/\\(sqrt|frac|pm|times|le|ge|approx|neq|cdot)\{?[^{}]*\}?(\{?[^{}]*\})?/g, (match) => {
            return `\\(${match}\\)`;
        });
        return processed;
    }
    return text;
};

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    
    const wrappedText = ensureLaTeXWrapping(text);
    const codeBlockParts = wrappedText.split(/(```[\s\S]*?```)/g);

    return (
        <div className="leading-relaxed space-y-2 text-justify" style={{ textJustify: 'inter-word' }}>
            {codeBlockParts.map((part, index) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    if (part.toLowerCase().includes('<svg')) {
                        const svgMatch = part.match(/<svg[\s\S]*?<\/svg>/i);
                        if (svgMatch) {
                            return (
                                <div key={index} className="flex justify-center items-center my-4" dangerouslySetInnerHTML={{ __html: svgMatch[0] }} />
                            );
                        }
                    }
                    const content = part.slice(3, -3).trim().replace(/^xml\n/, '').replace(/^html\n/, '');
                    return (
                        <pre key={index} className="font-mono text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto whitespace-pre border border-slate-200 dark:border-slate-700">
                            {content}
                        </pre>
                    );
                } else {
                    const mathParts = part.split(/(\$\$[\s\S]*?\$\$)/g);
                    
                    return (
                        <div key={index}>
                            {mathParts.map((subPart, subIndex) => {
                                if (subPart.startsWith('$$') && subPart.endsWith('$$')) {
                                    const mathExpr = subPart.slice(2, -2).trim();
                                    return (
                                        <div key={subIndex} className="w-full overflow-x-auto scrollbar-thin py-2 px-1 my-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl flex justify-center">
                                            <BlockMath math={mathExpr} />
                                        </div>
                                    );
                                } else {
                                    const inlineMathParts = subPart.split(/(\\\([\s\S]*?\\\))/g);
                                    
                                    return (
                                        <span key={subIndex}>
                                            {inlineMathParts.map((inlinePart, inlineIndex) => {
                                                if (inlinePart.startsWith('\\(') && inlinePart.endsWith('\\)')) {
                                                    const inlineExpr = inlinePart.slice(2, -2).trim();
                                                    return <InlineMath key={inlineIndex} math={inlineExpr} />;
                                                } else {
                                                    let formatted = inlinePart
                                                        .replace(/\*\*(.*?)\*\*/g, '<b class="text-slate-900 dark:text-white font-bold">$1</b>')
                                                        .replace(/\*(.*?)\*/g, '<i>$1</i>')
                                                        .replace(/\n- (.*?)/g, '<br/><span class="text-indigo-500 mr-2">•</span>$1')
                                                        .replace(/\n\n/g, '<br/><br/>')
                                                        .replace(/\n/g, '<br/>');

                                                    formatted = formatted.replace(
                                                        /([\p{Emoji}])/gu,
                                                        '<span style="font-size: 1.25em; line-height: 1; vertical-align: middle; display: inline-block; padding: 0 2px;">$1</span>'
                                                    );

                                                    formatted = formatted.replace(
                                                        /([\u00B0-\u00B9\u00BC-\u00BE\u00D7\u00F7\u0370-\u03FF\u2000-\u2AFF\u2150-\u215E\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2460-\u24FF\u2500-\u257F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u27C0-\u27EF\u2900-\u29FF\u2B00-\u2BFF\u{1D400}-\u{1D7FF}\u{1F000}-\u{1F9FF}])/gu,
                                                        '<span style="font-size: 1.15em; line-height: 1; vertical-align: middle; display: inline-block; padding: 0 1px;">$1</span>'
                                                    );

                                                    return <span key={inlineIndex} className="markdown-content text-left md:text-justify text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: formatted }} />;
                                                }
                                            })}
                                        </span>
                                    );
                                }
                            })}
                        </div>
                    );
                }
            })}
        </div>
    );
};

export const MarkedQuestionsView: React.FC<{ onBack: () => void, showToast: (msg: string, type: 'success' | 'error' | 'info') => void }> = ({ onBack, showToast }) => {
    const [questions, setQuestions] = useState<MarkedQuestion[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const stored = safeStorage.getItem('fajmuls_marked_questions');
        if (stored) {
            try {
                setQuestions(JSON.parse(stored));
            } catch (e) {
                console.error("Failed to parse marked questions", e);
            }
        }
    }, []);

    const handleDelete = (id: string) => {
        SoundManager.play('click');
        const updated = questions.filter(q => q.id !== id);
        setQuestions(updated);
        safeStorage.setItem('fajmuls_marked_questions', JSON.stringify(updated));
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
                <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
                    <button onClick={onBack} className="p-1.5 sm:p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition text-slate-700 dark:text-slate-300">
                        <ArrowLeft size={18} className="sm:w-5 sm:h-5"/>
                    </button>
                    <h1 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                        <Flag className="text-rose-500 w-5 h-5 sm:w-6 sm:h-6" /> Soal Ditandai
                    </h1>
                </div>

                {questions.length === 0 ? (
                    <div className="text-center py-20 text-slate-500 dark:text-slate-400">
                        <Flag size={48} className="mx-auto mb-4 opacity-20"/>
                        <p>Belum ada soal yang ditandai.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {questions.map((item) => (
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
                                            <SimpleMarkdown text={item.question.content} />
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
                                                            <div className="flex-1"><SimpleMarkdown text={opt} /></div>
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
