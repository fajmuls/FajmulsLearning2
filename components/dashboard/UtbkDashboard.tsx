import React from "react";
import { StudyMode } from "../../types";
import { Play, LayoutGrid } from "lucide-react";
import { SoundManager } from "../../services/soundService";

export const UtbkDashboard: React.FC<any> = ({ onStartSession, onOpenTOSelection }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button onClick={() => { SoundManager.play("tap"); onStartSession(StudyMode.DRILL); }} className="flex flex-col items-start p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition">
        <Play size={24} className="text-amber-500 mb-3" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Latihan Soal UTBK</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-left">Asah kemampuanmu dengan latihan soal.</p>
      </button>
      <button onClick={() => { SoundManager.play("tap"); onOpenTOSelection(); }} className="flex flex-col items-start p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition">
        <LayoutGrid size={24} className="text-indigo-500 mb-3" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Try Out SNBT</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 text-left">Simulasi ujian nyata dengan waktu aktual.</p>
      </button>
    </div>
  );
};
