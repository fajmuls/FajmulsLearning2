import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, XCircle, CheckCircle, AlertTriangle, ChevronDown, Clock, StopCircle, Sparkles, FileJson, Eye, Maximize2 } from 'lucide-react';
import { BackgroundGenTask } from '../types';
import { SoundManager } from '../services/soundService';
import { SimpleMarkdown } from './QuestionRenderer';

interface GenerationProgressBoxProps {
  task: BackgroundGenTask;
  onCancel: () => void;
  onStart: (task: BackgroundGenTask) => void;
  onResume?: (task: BackgroundGenTask) => void;
  onClose: () => void;
}

export const GenerationProgressBox: React.FC<GenerationProgressBoxProps> = ({
  task, onCancel, onStart, onClose, onResume
}) => {
  const [minimized, setMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  useEffect(() => {
    if (task.status === 'generating') {
      const interval = setInterval(() => {
        const start = new Date(task.createdAt).getTime();
        const now = Date.now();
        setElapsed(Math.floor((now - start) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [task.status, task.createdAt]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };
  
  const extractGeneratedQuestions = () => {
    if (!task.savedState || !task.savedState.completedBatches) return [];
    const batches = task.savedState.completedBatches;
    let questions: any[] = [];
    Object.keys(batches).forEach(k => {
      questions.push(...batches[k]);
    });
    return questions;
  };

  const previewQuestion = task.previewQuestion || extractGeneratedQuestions()[0];

  if (minimized && task.status === 'generating') {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onClick={() => {
            SoundManager.play('click');
            setMinimized(false);
        }}
        className="fixed bottom-6 right-6 z-[60] bg-indigo-600 hover:bg-indigo-700 text-white p-3 rounded-full shadow-2xl border border-indigo-400 flex items-center justify-center gap-2 transition-transform hover:scale-105"
      >
        <Loader2 size={20} className="animate-spin" />
        <span className="text-xs font-bold mr-1">{task.progress}%</span>
      </motion.button>
    );
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed ${task.status === 'generating' ? 'bottom-6 right-6 w-84 sm:w-96' : 'top-24 right-4 w-80'} z-[60] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col`}
    >
      <div className="bg-slate-50 dark:bg-slate-800 p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {task.status === 'generating' ? (
             <Sparkles size={16} className="text-indigo-500" />
          ) : task.status === 'completed' ? (
             <CheckCircle size={16} className="text-emerald-500" />
          ) : task.status === 'paused' ? (
             <Clock size={16} className="text-amber-500" />
          ) : (
             <AlertTriangle size={16} className="text-rose-500" />
          )}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            {task.status === 'generating' ? 'AI Generator Aktif' : task.status === 'completed' ? 'Selesai' : task.status === 'paused' ? 'Terjeda (Error/Limit)' : 'Gagal'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {(task.status === 'generating' || task.status === 'paused') && (
            <button
              onClick={() => {
                  SoundManager.play('click');
                  setMinimized(true);
              }}
              className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400"
              title="Sembunyikan"
            >
              <ChevronDown size={16} />
            </button>
          )}
          <button
            onClick={() => {
                SoundManager.play('click');
                onClose();
            }}
            className="p-1 rounded-md hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-900/30 dark:hover:text-rose-400 text-slate-400 transition"
            title="Tutup"
          >
            <XCircle size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{task.title}</h4>
          {(task.status === 'generating' || task.status === 'paused') && (
             <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-col gap-1.5">
               <span className="flex items-center gap-1">
                 <Loader2 size={12} className="animate-spin text-indigo-500" /> 
                 {task.status === 'paused' ? (task.errorMsg || 'Menunggu tindakan...') : 'Meracik soal berkualitas tinggi...'}
               </span>
               {task.message && (
                 <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2.5 py-1.5 rounded-lg border border-indigo-100 dark:border-indigo-800/50 font-medium text-[11px] leading-snug">
                   {task.message}
                 </span>
               )}
             </div>
          )}
        </div>

        {(task.status === 'generating' || task.status === 'paused') && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-indigo-600 dark:text-indigo-400">{task.progress}% Selesai {task.status === 'paused' && '(Jeda)'}</span>
              <span className="text-slate-500 flex items-center gap-1"><Clock size={12}/> {formatTime(elapsed)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden relative">
              <motion.div 
                className={`absolute top-0 left-0 h-full ${task.status === 'paused' ? 'bg-amber-500' : 'bg-indigo-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${task.progress}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
            </div>
          </div>
        )}

        {/* LIVE PREVIEW SOAL PERTAMA (Bila Batch 1 Selesai) */}
        {previewQuestion && (
          <div className="pt-2 border-t border-slate-150 dark:border-slate-800 flex flex-col gap-2">
            <button
              onClick={() => {
                SoundManager.play('tap');
                setShowLivePreview(prev => !prev);
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-indigo-500/10 hover:from-emerald-500/20 hover:to-indigo-500/20 border border-emerald-500/30 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition shadow-2xs group"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Sparkles size={14} className="text-emerald-500 shrink-0 animate-spin" />
                <span className="truncate">Live Preview Soal #1 (Tervalidasi)</span>
              </span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                {showLivePreview ? 'Sembunyikan' : 'Lihat'} <Eye size={13} />
              </span>
            </button>

            {showLivePreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200/80 dark:border-slate-750 max-h-64 overflow-y-auto space-y-2 text-xs"
              >
                <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-slate-200/60 dark:border-slate-750">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] uppercase">
                    {previewQuestion.metadata?.subtest || previewQuestion.subtest || 'Soal Batch 1'}
                  </span>
                  <button
                    onClick={() => {
                      SoundManager.play('click');
                      setPreviewModalOpen(true);
                    }}
                    className="text-[10.5px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                    title="Perbesar Layar Preview"
                  >
                    <Maximize2 size={11} /> Perbesar
                  </button>
                </div>
                
                <div className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  <SimpleMarkdown text={previewQuestion.content} />
                </div>

                {previewQuestion.options && previewQuestion.options.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {previewQuestion.options.map((opt: any, oIdx: number) => (
                      <div key={oIdx} className="p-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 flex items-start gap-1.5 text-[11px]">
                        <span className="font-bold text-slate-500 dark:text-slate-400 shrink-0">
                          {String.fromCharCode(65 + oIdx)}.
                        </span>
                        <div className="flex-1 text-slate-700 dark:text-slate-300">
                          <SimpleMarkdown text={opt.text} isOption={true} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-slate-400 dark:text-slate-500 italic pt-1 text-center">
                  💡 Contoh soal batch pertama sembari AI meracik batch berikutnya.
                </div>
              </motion.div>
            )}
          </div>
        )}

        <div className="mt-2 flex flex-wrap justify-end gap-2">
           {task.status === 'paused' && (
             <button
               onClick={() => {
                 SoundManager.play('click');
                 setShowDebug(true);
               }}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
             >
               <FileJson size={14} /> Lihat JSON
             </button>
           )}
           {task.status === 'paused' && (
             <button
               onClick={() => {
                 SoundManager.play('click');
                 if (onResume) onResume(task);
               }}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
             >
               <Sparkles size={14} /> Lanjutkan
             </button>
           )}
           {(task.status === 'generating' || task.status === 'paused') && (
             <button
               onClick={() => {
                 SoundManager.play('click');
                 onCancel();
               }}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 dark:text-rose-400 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 transition-colors"
             >
               <StopCircle size={14} /> Batalkan
             </button>
           )}
           {task.status === 'completed' && (
             <button
               onClick={() => {
                 SoundManager.play('click');
                 onStart(task);
               }}
               className="w-full flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20 transition-all"
             >
               <CheckCircle size={16} /> Mulai Tes
             </button>
           )}
        </div>
      </div>
    </motion.div>

    {/* MODAL FULL PREVIEW SOAL PERTAMA */}
    <AnimatePresence>
      {previewModalOpen && previewQuestion && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setPreviewModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 sm:p-5 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-850/80">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
                  <Sparkles size={18} />
                </span>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Live Preview: Soal Pertama Selesai
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Tervalidasi dari Batch 1 • Generator terus berjalan di latar belakang
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setPreviewModalOpen(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <XCircle size={22} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs uppercase">
                  {previewQuestion.metadata?.subtest || previewQuestion.subtest || 'SKD'}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs">
                  {previewQuestion.metadata?.difficulty || 'Standard'}
                </span>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 text-slate-900 dark:text-slate-100 leading-relaxed text-sm sm:text-base font-medium">
                <SimpleMarkdown text={previewQuestion.content} />
              </div>

              {previewQuestion.options && previewQuestion.options.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">Pilihan Jawaban</h4>
                  {previewQuestion.options.map((opt: any, oIdx: number) => (
                    <div 
                      key={oIdx} 
                      className="p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3 text-sm shadow-2xs"
                    >
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200/60 dark:border-indigo-800/60">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <div className="flex-1 text-slate-800 dark:text-slate-200 pt-0.5">
                        <SimpleMarkdown text={opt.text} isOption={true} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Loader2 size={14} className="animate-spin text-indigo-500" /> Progres: {task.progress}%
              </span>
              <button
                onClick={() => setPreviewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition"
              >
                Tutup Preview
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* MODAL DEBUG / LIHAT JSON */}
    <AnimatePresence>
      {showDebug && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          onClick={() => setShowDebug(false)}
        >
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.95 }}
            className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-slate-150 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <FileJson size={18} className="text-indigo-500" />
                Data Soal & Log Error
              </h3>
              <button onClick={() => setShowDebug(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
               {task.errorMsg && (
                 <div className="p-3 rounded-lg bg-rose-50 border border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/30">
                    <h4 className="text-sm font-bold text-rose-700 dark:text-rose-400 mb-1 flex items-center gap-1"><AlertTriangle size={14}/> Pesan Error Terakhir</h4>
                    <p className="text-xs text-rose-600 dark:text-rose-300 whitespace-pre-wrap font-mono">{task.errorMsg}</p>
                 </div>
               )}

               <div>
                 <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Soal yang Tersimpan ({extractGeneratedQuestions().length} soal)</h4>
                 <pre className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs font-mono overflow-x-auto whitespace-pre-wrap max-h-[50vh]">
                   {JSON.stringify(extractGeneratedQuestions(), null, 2)}
                 </pre>
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
};
