import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, HelpCircle, ChevronDown, ChevronUp, Target, Sparkles, BookOpen } from 'lucide-react';
import { TestHistoryItem } from '../types';
import { analyzeSessionWeaknesses, SessionDiagnostic, TopicPerformance } from '../src/utils/performanceAnalytics';

interface SubtestWeaknessAnalysisProps {
    item: TestHistoryItem;
    isDarkMode?: boolean;
    defaultExpanded?: boolean;
}

export const SubtestWeaknessAnalysis: React.FC<SubtestWeaknessAnalysisProps> = ({
    item,
    isDarkMode,
    defaultExpanded = false
}) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const diagnostic = React.useMemo(() => analyzeSessionWeaknesses(item), [item]);

    if (!diagnostic.hasQuestions || diagnostic.subtestSummaries.length === 0) {
        return null;
    }

    const { subtestSummaries, criticalWeaknesses, diagnosticMessage } = diagnostic;

    return (
        <div 
            onClick={(e) => e.stopPropagation()} 
            className="mt-3 rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/30 dark:bg-slate-900/40 overflow-hidden transition-all text-left"
        >
            {/* Header / Toggle Button */}
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-indigo-50/60 dark:hover:bg-slate-800/60 transition text-left"
            >
                <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-700 dark:text-indigo-400">
                        <Target size={14} className="text-indigo-500" />
                        <span>Analisis Kekurangan Materi & Subtes</span>
                    </div>

                    {criticalWeaknesses.length > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {criticalWeaknesses.length} Topik Kritis
                        </span>
                    ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                            <CheckCircle size={10} />
                            Semua Materi Aman
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400">
                    <span>{isExpanded ? 'Tutup Rincian' : 'Buka Rincian'}</span>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-1 border-t border-indigo-100/60 dark:border-slate-800/80 space-y-3">
                    {/* Ringkasan Cepat */}
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60 leading-relaxed flex items-start gap-2">
                        <Sparkles size={14} className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-slate-800 dark:text-white">Diagnosis Hasil: </span>
                            <span>{diagnosticMessage}</span>
                        </div>
                    </div>

                    {/* Breakdown per Subtes & Topik */}
                    <div className="space-y-2.5">
                        {subtestSummaries.map((sub, sIdx) => {
                            const isTwk = sub.subtestName.includes('TWK');
                            const isTiu = sub.subtestName.includes('TIU');
                            const isTkp = sub.subtestName.includes('TKP');

                            const badgeColor = isTwk 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300'
                                : isTiu 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300'
                                : isTkp
                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300'
                                : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';

                            return (
                                <div 
                                    key={sIdx} 
                                    className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/60 p-2.5 shadow-sm"
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${badgeColor}`}>
                                                {sub.subtestName}
                                            </span>
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                {sub.correctCount}/{sub.totalQuestions} Soal Benar
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-black text-slate-800 dark:text-white">
                                                {sub.accuracyPercent}%
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-medium ml-1">Akurasi</span>
                                        </div>
                                    </div>

                                    {/* Topic Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {sub.topics.map((t, tIdx) => {
                                            const isCritical = t.status === 'CRITICAL';
                                            const isGood = t.status === 'GOOD';

                                            const statusClass = isCritical 
                                                ? 'border-rose-200 bg-rose-50/60 dark:border-rose-900/50 dark:bg-rose-950/20'
                                                : isGood
                                                ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-900/50 dark:bg-emerald-950/20'
                                                : 'border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20';

                                            const textBadge = isCritical
                                                ? 'text-rose-600 dark:text-rose-400'
                                                : isGood
                                                ? 'text-emerald-600 dark:text-emerald-400'
                                                : 'text-amber-600 dark:text-amber-400';

                                            return (
                                                <div 
                                                    key={tIdx} 
                                                    className={`p-2 rounded-lg border ${statusClass} flex flex-col justify-between`}
                                                >
                                                    <div>
                                                        <div className="flex items-start justify-between gap-1">
                                                            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-snug">
                                                                {t.topic}
                                                            </span>
                                                            <span className={`text-[10px] font-black shrink-0 ${textBadge}`}>
                                                                {t.correctCount}/{t.totalQuestions}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={`h-full rounded-full ${
                                                                        isCritical ? 'bg-rose-500' : isGood ? 'bg-emerald-500' : 'bg-amber-500'
                                                                    }`}
                                                                    style={{ width: `${Math.min(100, Math.max(5, t.accuracyPercent))}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">
                                                                {t.accuracyPercent}%
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
                                                        <span className="font-semibold text-slate-600 dark:text-slate-300">Saran: </span>
                                                        {t.recommendation}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
