import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Loader2, XCircle, CheckCircle, AlertTriangle, ChevronDown, Clock, StopCircle, Sparkles } from 'lucide-react';
import { BackgroundGenTask } from '../types';
import { SoundManager } from '../services/soundService';

interface GenerationProgressBoxProps {
  task: BackgroundGenTask;
  onCancel: () => void;
  onStart: (task: BackgroundGenTask) => void;
  onClose: () => void;
}

export const GenerationProgressBox: React.FC<GenerationProgressBoxProps> = ({
  task, onCancel, onStart, onClose
}) => {
  const [minimized, setMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);

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
          ) : (
             <AlertTriangle size={16} className="text-rose-500" />
          )}
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            {task.status === 'generating' ? 'AI Generator Aktif' : task.status === 'completed' ? 'Selesai' : 'Gagal'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {task.status === 'generating' && (
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
          {task.status === 'generating' && (
             <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
               <Loader2 size={12} className="animate-spin text-indigo-500" /> Meracik soal berkualitas tinggi...
             </p>
          )}
        </div>

        {task.status === 'generating' && (
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold">
              <span className="text-indigo-600 dark:text-indigo-400">{task.progress}% Selesai</span>
              <span className="text-slate-500 flex items-center gap-1"><Clock size={12}/> {formatTime(elapsed)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden relative">
              <motion.div 
                className="absolute top-0 left-0 h-full bg-indigo-500"
                initial={{ width: 0 }}
                animate={{ width: `${task.progress}%` }}
                transition={{ ease: "linear", duration: 1 }}
              />
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px] animate-[slide_1s_linear_infinite]" />
            </div>
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
           {task.status === 'generating' && (
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
  );
};
