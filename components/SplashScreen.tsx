
import React, { useEffect } from 'react';
import { Rocket } from 'lucide-react';
import { APP_LOGO_URL } from '../constants';
import { SoundManager } from '../services/soundService';

interface SplashScreenProps {
    onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
    
    // Removed auto-transition timer to ensure user interaction
    // Removed BGM and Intro SFX to prevent Autoplay Errors

    const handleEnter = () => {
        SoundManager.play('click'); // Keep click sound
        onComplete();
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-center animate-fade-in cursor-pointer" onClick={handleEnter}>
            <div className="relative mb-6 sm:mb-8 group">
                <div className="absolute -inset-4 bg-indigo-500 rounded-full opacity-20 group-hover:opacity-40 blur-xl transition-opacity duration-1000 animate-pulse"></div>
                <img 
                    src={APP_LOGO_URL} 
                    alt="Fajmuls Learning" 
                    className="w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 object-contain relative z-10 drop-shadow-2xl animate-bounce-slow"
                />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-white mb-2 tracking-tight">
                Fajmuls <span className="text-indigo-400">Learning</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm md:text-lg mb-6 sm:mb-10 max-w-sm">
                Platform Belajar Cerdas Terintegrasi AI
            </p>
            <button 
                onClick={(e) => { e.stopPropagation(); handleEnter(); }}
                className="px-6 py-2.5 sm:px-10 sm:py-4 bg-white text-indigo-900 rounded-full font-bold text-sm sm:text-lg hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all flex items-center gap-2"
            >
                <Rocket size={18} className="text-indigo-600 sm:w-6 sm:h-6"/> Mulai Belajar
            </button>
        </div>
    );
};
