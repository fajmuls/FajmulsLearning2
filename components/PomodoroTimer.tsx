import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Timer } from 'lucide-react';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ isOpen, onClose, onOpen }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'focus' | 'break'>('focus');

  // Request Notification Permission on Mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      triggerNotification();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const triggerNotification = () => {
    // Audio Alert
    const audio = new Audio('https://actions.google.com/sounds/v1/alarms/beep_short.ogg');
    audio.play().catch(e => console.log("Audio play failed", e));

    // Browser Notification
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(mode === 'focus' ? "Fokus Selesai!" : "Istirahat Selesai!", {
        body: mode === 'focus' ? "Waktunya istirahat sejenak." : "Kembali fokus belajar!",
        icon: '/favicon.ico'
      });
    }
  };

  const toggleTimer = () => setIsActive(!isActive);
  
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'focus' ? 25 * 60 : 5 * 60);
  };

  const switchMode = () => {
    const newMode = mode === 'focus' ? 'break' : 'focus';
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? 25 * 60 : 5 * 60);
    setIsActive(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) {
    if (isActive) {
      return (
        <div className="fixed top-[4.5rem] right-4 bg-indigo-600/90 backdrop-blur text-white px-3 py-1.5 rounded-full shadow-lg z-40 flex items-center gap-2 cursor-pointer hover:bg-indigo-700 transition animate-fade-in-down" onClick={() => onOpen()}>
          <Timer size={14} className="animate-pulse" />
          <span className="font-mono font-bold text-sm tracking-widest">{formatTime(timeLeft)}</span>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-[calc(100vw-2rem)] max-w-xs bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 z-[90] overflow-hidden animate-fade-in-up">
      <div className={`p-4 ${mode === 'focus' ? 'bg-indigo-600' : 'bg-emerald-500'} text-white flex justify-between items-center`}>
        <div className="flex items-center gap-2">
          <Timer size={20} />
          <span className="font-bold">{mode === 'focus' ? 'Fokus' : 'Istirahat'}</span>
        </div>
        <button onClick={onClose} className="hover:bg-white/20 p-1 rounded">
          <X size={18} />
        </button>
      </div>
      
      <div className="p-6 flex flex-col items-center">
        <div className="text-5xl font-mono font-bold text-slate-800 dark:text-slate-100 mb-6 tracking-wider">
          {formatTime(timeLeft)}
        </div>
        
        <div className="flex gap-4 mb-6">
          <button 
            onClick={toggleTimer}
            className="p-3 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
          >
            {isActive ? <Pause size={24} /> : <Play size={24} />}
          </button>
          <button 
            onClick={resetTimer}
            className="p-3 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
          >
            <RotateCcw size={24} />
          </button>
        </div>

        <button 
          onClick={switchMode}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 underline"
        >
          Ganti ke Mode {mode === 'focus' ? 'Istirahat' : 'Fokus'}
        </button>
      </div>
    </div>
  );
};
