
import React, { useState } from 'react';
import { FlashcardData } from '../types';
import { CheckCircle } from 'lucide-react';

interface FlashcardProps {
  data: FlashcardData;
  onNext: (rating: 'easy' | 'medium' | 'hard') => void;
  isLearned?: boolean;
  onToggleLearned?: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({ data, onNext, isLearned, onToggleLearned }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="w-full max-w-xl mx-auto perspective-1000">
      <div 
        className={`relative w-full h-80 transition-transform duration-700 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front */}
        <div className={`absolute w-full h-full ${isLearned ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-indigo-100'} rounded-2xl shadow-xl border-2 flex items-center justify-center p-8 backface-hidden transition-colors duration-300`}>
          
          {/* Learned Toggle */}
          {onToggleLearned && (
              <button 
                  onClick={(e) => { e.stopPropagation(); onToggleLearned(); }}
                  className={`absolute top-4 right-4 p-2 rounded-full z-10 transition-all duration-300 ${isLearned ? 'bg-emerald-500 text-white scale-110 shadow-lg' : 'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}
                  title={isLearned ? "Tandai belum paham" : "Tandai sudah paham"}
              >
                  <CheckCircle size={24} />
              </button>
          )}

          <div className="text-center">
            {data.title && (
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-2">
                    {data.title}
                </h3>
            )}
            <span className={`inline-block px-3 py-1 ${isLearned ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'} rounded-full text-xs font-bold mb-4 transition-colors`}>QUESTION</span>
            <p className="text-2xl font-medium text-slate-800 leading-relaxed">{data.front}</p>
            <p className="mt-8 text-slate-400 text-sm animate-pulse">Tap to flip</p>
          </div>
        </div>

        {/* Back */}
        <div className={`absolute w-full h-full ${isLearned ? 'bg-emerald-600' : 'bg-indigo-600'} rounded-2xl shadow-xl flex items-center justify-center p-8 backface-hidden rotate-y-180 transition-colors duration-300`}>
          <div className="text-center text-white">
            {data.title && (
                <h3 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-2 border-b border-white/20 pb-2">
                    {data.title}
                </h3>
            )}
            <span className="inline-block px-3 py-1 bg-white/20 text-white rounded-full text-xs font-bold mb-4">ANSWER</span>
            <p className="text-xl leading-relaxed">{data.back}</p>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => { setIsFlipped(false); onNext('hard'); }} className="px-6 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 font-medium transition">
            Sulit (1m)
          </button>
          <button onClick={() => { setIsFlipped(false); onNext('medium'); }} className="px-6 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 font-medium transition">
            Sedang (10m)
          </button>
          <button onClick={() => { setIsFlipped(false); onNext('easy'); }} className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 font-medium transition">
            Mudah (4d)
          </button>
        </div>
      )}
    </div>
  );
};