import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, XCircle, CheckCircle, AlertTriangle, ChevronDown, Clock, StopCircle, Sparkles, FileJson } from 'lucide-react';
import { BackgroundGenTask } from '../types';
import { SoundManager } from '../services/soundService';

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
      className={`fixed ${task.status === 'generating' ? 'bottom-6 right-6 w-80' : 'top-24 right-4 w-72'} z-[60] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col`}
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
                 <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-2 py-1.5 rounded-md border border-indigo-100 dark:border-indigo-800/50 font-medium text-[10.5px] leading-snug">
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
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
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
