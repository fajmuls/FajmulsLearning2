import React, { useState } from "react";
import { 
  CategoryType, StudyMode, GeneralMaterialInput, SkdStreamType, 
  GeneralStudyMethod, SkripsiFeature, KecermatanMode, TpaStreamType, 
  TkaLevelType 
} from "../../types";
import { ArrowLeft } from "lucide-react";
import { SoundManager } from "../../services/soundService";
import { UtbkDashboard } from "./UtbkDashboard";
import { SkdDashboard } from "./SkdDashboard";
import { GeneralDashboard } from "./GeneralDashboard";
import { TkaDashboard } from "./TkaDashboard";

export const Dashboard: React.FC<{
  category: CategoryType;
  onBack: () => void;
  onStartSession: (mode: StudyMode, difficulty?: string, count?: number) => void;
  onOpenTOSelection: () => void;
  onStartTesKoran: () => void;
  onStartTesKecermatan: (mode: KecermatanMode) => void;
  onGeneralInputSubmit: (input: GeneralMaterialInput) => void;
  generalInput: GeneralMaterialInput | null;
  setGeneralInput?: (input: GeneralMaterialInput | null) => void;
  isReadingMaterial: boolean;
  onResetMaterial: () => void;
  onSubtestSelect: (s: string) => void;
  selectedSubtest: string;
  weakTopics: string[];
  loading: boolean;
  skdStream: SkdStreamType | null;
  onSkdStreamSelect: (s: SkdStreamType) => void;
  onHistory: () => void;
  onStartGeneralSession: (m: GeneralStudyMethod) => void;
  onStartSkripsiSession?: (feature: SkripsiFeature, input: string) => void;
  username: string;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  tpaStream?: TpaStreamType | null;
  onTpaStreamSelect?: (s: TpaStreamType) => void;
  tkaLevel?: TkaLevelType | null;
  onTkaLevelSelect?: (s: TkaLevelType) => void;
  onOpenAcademicHub?: () => void;
  onBattle: () => void;
}> = (props) => {

  const renderDashboardContent = () => {
    switch (props.category) {
      case "UTBK": return <UtbkDashboard {...props} />;
      case "SKD": return <SkdDashboard {...props} />;
      case "TKA": return <TkaDashboard {...props} />;
      default: return <GeneralDashboard {...props} />;
    }
  };

  return (
    <div className="flex flex-col space-y-6 w-full animate-in fade-in zoom-in-95 duration-200 p-4">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => { SoundManager.play("back"); props.onBack(); }} 
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm"
        >
          <ArrowLeft size={16} /> <span>Kembali</span>
        </button>
        <h2 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
          Dashboard {props.category}
        </h2>
      </div>

      <div className="w-full">
        {renderDashboardContent()}
      </div>
    </div>
  );
};
