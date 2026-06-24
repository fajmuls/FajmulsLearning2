import React from 'react';
import { Library, Clock, ChevronRight } from 'lucide-react';
import { SoundManager } from '../services/soundService';

import { TkaLevelType } from '../types';

interface SubjectSelectionProps {
  tkaLevel: TkaLevelType | null;
  onTkaLevelSelect: (level: TkaLevelType | null) => void;
  pelajaranSemester: 'Ganjil' | 'Genap' | 'Full' | null;
  onPelajaranSemesterSelect: (sem: 'Ganjil' | 'Genap' | 'Full' | null) => void;
  onOpenTOSelection: () => void;
}

export const SubjectSelection: React.FC<SubjectSelectionProps> = ({
  tkaLevel,
  onTkaLevelSelect,
  pelajaranSemester,
  onPelajaranSemesterSelect,
  onOpenTOSelection,
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
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 transition text-center group shadow-sm"
          >
            <Library className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
              Mata Pelajaran SD
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Kelas 1 - 6
            </p>
          </button>
          <button
            onClick={() => {
              SoundManager.play("click");
              onTkaLevelSelect("SMP");
            }}
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 transition text-center group shadow-sm"
          >
            <Library className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
              Mata Pelajaran SMP
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Kelas 7 - 9
            </p>
          </button>
          <button
            onClick={() => {
              SoundManager.play("click");
              onTkaLevelSelect("SMA");
            }}
            className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-teal-500 dark:hover:border-teal-500 transition text-center group shadow-sm"
          >
            <Library className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition" />
            <h3 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-white">
              Mata Pelajaran SMA
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Kelas 10 - 12
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
            <b className="uppercase">Mata Pelajaran {tkaLevel}</b>
          </div>
          
          <div className="mb-6">
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-2 block uppercase">Pilih Semester</label>
            <div className="flex gap-2">
              {['Ganjil', 'Genap', 'Full'].map((sem) => (
                <button
                  key={sem}
                  onClick={() => {
                    SoundManager.play("tap");
                    onPelajaranSemesterSelect(sem as any);
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all border-2 ${pelajaranSemester === sem ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 shadow-sm' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-teal-300'}`}
                >
                  {sem === 'Full' ? 'Satu Tahun (Full)' : `Semester ${sem}`}
                </button>
              ))}
            </div>
          </div>
          
          {pelajaranSemester && (
            <button
              onClick={() => {
                SoundManager.play("click");
                onOpenTOSelection();
              }}
              className="w-full bg-teal-600 dark:bg-teal-600 text-white p-4 sm:p-6 rounded-2xl mb-8 flex justify-between items-center group shadow-lg hover:bg-teal-700 transition-all"
            >
              <div>
                <h3 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <Clock size={24} className="text-white/80" /> Try Out Mata Pelajaran
                </h3>
                <p className="text-teal-100 text-xs sm:text-sm mt-1">
                  Latihan Terpadu {tkaLevel} - {pelajaranSemester === 'Full' ? 'Satu Tahun' : `Semester ${pelajaranSemester}`}
                </p>
              </div>
              <ChevronRight className="group-hover:translate-x-2 transition-transform" />
            </button>
          )}
        </div>
      )}
    </>
  );
};
