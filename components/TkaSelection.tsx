import React from 'react';
import { Award, Clock, ChevronRight } from 'lucide-react';
import { SoundManager } from '../services/soundService';

import { TkaLevelType } from '../types';

interface TkaSelectionProps {
  tkaLevel: TkaLevelType | null;
  onTkaLevelSelect: (level: TkaLevelType | null) => void;
  onOpenTOSelection: () => void;
  renderSubtests: (subtests: string[]) => React.ReactNode;
}

export const TkaSelection: React.FC<TkaSelectionProps> = ({
  tkaLevel,
  onTkaLevelSelect,
  onOpenTOSelection,
  renderSubtests,
}) => {
  return (
    <>
      {!tkaLevel ? (
        <div className="grid md:grid-cols-3 gap-6 mb-8 animate-fade-in-up">
          <button
            onClick={() => {
              SoundManager.play("click");
              onTkaLevelSelect("SD");
            }}
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition text-center group shadow-sm"
          >
            <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
              TKA SD
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Matematika, B. Indonesia, B. Inggris
            </p>
          </button>
          <button
            onClick={() => {
              SoundManager.play("click");
              onTkaLevelSelect("SMP");
            }}
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition text-center group shadow-sm"
          >
            <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
              TKA SMP
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Matematika, B. Indonesia, B. Inggris
            </p>
          </button>
          <button
            onClick={() => {
              SoundManager.play("click");
              onTkaLevelSelect("SMA");
            }}
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 transition text-center group shadow-sm"
          >
            <Award className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
              TKA SMA
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Matematika, B. Indonesia, B. Inggris
            </p>
          </button>
        </div>
      ) : (
        <div className="animate-fade-in-up">
          <div className="flex items-center gap-2 mb-4 text-sm text-slate-600 dark:text-slate-300">
            <button
              onClick={() => {
                SoundManager.play("click");
                onTkaLevelSelect(null);
              }}
              className="underline hover:text-indigo-600"
            >
              Ubah Jenjang
            </button>{" "}
            <ChevronRight size={14} />{" "}
            <b className="uppercase">TKA {tkaLevel}</b>
          </div>
          <button
            onClick={() => {
              SoundManager.play("click");
              onOpenTOSelection();
            }}
            className="w-full bg-emerald-600 dark:bg-emerald-600 text-white p-4 sm:p-6 rounded-2xl mb-8 flex justify-between items-center group shadow-lg hover:bg-emerald-700 transition-all"
          >
            <div>
              <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <Clock size={24} className="text-white/80" /> Kumpulan Soal
                TKA {tkaLevel}
              </h3>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1">
                90 Soal. 80% HOTS.
              </p>
            </div>
            <ChevronRight className="group-hover:translate-x-2 transition-transform" />
          </button>
          {renderSubtests(
            tkaLevel === "SD"
              ? ["Matematika", "Bahasa Indonesia"]
              : ["Matematika", "Bahasa Indonesia", "Bahasa Inggris"],
          )}
        </div>
      )}
    </>
  );
};
