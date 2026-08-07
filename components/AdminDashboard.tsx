import React from 'react';
import { ArrowLeft, Activity, Info, Tag, Layers, GitCommit, FileText } from 'lucide-react';

interface AdminDashboardProps {
  onBack: () => void;
}

const PATCH_NOTES = [
  {
    version: "v1.3.0",
    date: "2026-08-06",
    type: "Feature",
    description: "Update besar untuk sistem Bank Soal",
    details: [
      "Bank Soal sekarang terintegrasi langsung dengan Firebase Firestore (Cloud Database), tidak lagi menggunakan Local Storage.",
      "Semua pengguna dan agen AI dapat membaca Bank Soal secara real-time.",
      "Admin dapat menyimpan dan menghapus soal dari Bank Soal langsung saat Review Test dengan indikator Icon dinamis.",
      "Struktur Bank Soal diperbarui untuk lebih detail dengan pemisahan per topik dan subtes secara spesifik."
    ]
  },
  {
    version: "v1.2.3",
    date: "2026-08-01",
    type: "Patch",
    description: "Perbaikan bug dan penyesuaian UI",
    details: [
      "Perbaikan tampilan di mode mobile.",
      "Optimasi render question."
    ]
  }
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 sticky top-0 z-10 shrink-0">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <div className="p-1.5 bg-blue-600 rounded-lg shadow-lg shadow-blue-500/20">
                  <Activity className="text-white" size={20} />
                </div>
                Admin Dashboard & Version
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Tag size={16} className="text-blue-600 dark:text-blue-400" />
            <span className="font-black text-blue-700 dark:text-blue-300 text-sm">{PATCH_NOTES[0].version}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-4 sm:p-8">
        <div className="max-w-[800px] mx-auto space-y-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText className="text-purple-500" /> Patch Notes & Updates
            </h2>
            
            <div className="space-y-8">
              {PATCH_NOTES.map((note, index) => (
                <div key={note.version} className="relative pl-6 sm:pl-8">
                  <div className={`absolute left-0 top-1 bottom-0 w-px ${index === PATCH_NOTES.length - 1 ? 'bg-transparent' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                  <div className="absolute left-[-5px] top-1.5 w-3 h-3 rounded-full bg-purple-500 border-2 border-white dark:border-slate-900"></div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-black text-lg text-slate-900 dark:text-white">{note.version}</span>
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${note.type === 'Feature' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {note.type}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{note.date}</span>
                  </div>
                  
                  <p className="text-slate-700 dark:text-slate-300 font-medium mb-4">{note.description}</p>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-800">
                    <ul className="space-y-3">
                      {note.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                          <GitCommit className="shrink-0 mt-0.5 text-slate-300 dark:text-slate-600" size={16} />
                          <span className="leading-relaxed">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
            
          </div>
        </div>
      </main>
    </div>
  );
};