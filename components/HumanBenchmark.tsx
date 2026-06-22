import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Zap, Grid, Activity, Play, Trophy, BarChart2, X, Users, TrendingUp, Target, Brain, Hash, Type, FileText, CheckCircle, Heart, History, Clock, Map, Copy, Globe, Loader2, ArrowUp, Search, MapPin, Briefcase, RefreshCw, Route, Flag, Layers } from 'lucide-react';
import { SoundManager } from '../services/soundService';
import { BenchmarkMode, TestHistoryItem, BenchmarkResultDetails, GlobalBenchmarkScore } from '../types';
import { TYPING_TEXTS } from '../constants';
import * as FirebaseService from '../services/firebase';
import * as Gemini from '../services/geminiService';
import { generateVocabQuestions, VocabQuestion } from '../src/utils/synonymDictionary';

// --- TYPES ---

interface HumanBenchmarkProps {
    onBack: () => void;
    onComplete: (item: TestHistoryItem) => void; 
    username: string; 
    history: TestHistoryItem[];
    isGuest?: boolean;
    initialMode?: BenchmarkMode; // Added for deep linking support
    initialTab?: 'DASHBOARD' | 'RANKING';
}

const calculatePercentile = (game: BenchmarkMode, score: number | null): number => {
    if (score === null) return 0;

    if (game === 'REACTION') {
        if (score <= 150) return 99;
        if (score >= 450) return 1;
        return Math.max(1, Math.min(99, Math.round(100 - ((score - 150) / 300) * 100)));
    } else if (game === 'AIM') {
        // Aim Trainer: Avg ~500ms. Good < 300ms.
        if (score <= 250) return 99;
        if (score >= 800) return 1;
        return Math.max(1, Math.min(99, Math.round(100 - ((score - 250) / 550) * 100)));
    } else if (game === 'TYPING') {
         // WPM: Avg ~40. Pro ~100.
         if (score >= 120) return 99.9;
         if (score <= 10) return 1;
         return Math.max(1, Math.min(99, Math.round(((score - 10) / 110) * 100)));
    } else if (game === 'NUMBER_RANGE') {
        if (score <= 1) return 99;
        if (score >= 15) return 1;
        return Math.max(1, Math.min(99, Math.round(100 - ((score - 1) / 14) * 100)));
    } else {
        // Sequence, Visual, Number, Chimp, Verbal, Bridge, Match, Position Memory (Higher Better)
        let maxScale = 50; 
        if (game === 'SEQUENCE') maxScale = 30;
        if (game === 'CHIMP') maxScale = 40;
        if (game === 'VISUAL') maxScale = 30;
        if (game === 'NUMBER') maxScale = 20;
        if (game === 'VERBAL') maxScale = 100;
        if (game === 'SYNONYM_ANTONYM') maxScale = 50;
        if (game === 'BRIDGE') maxScale = 30;
        if (game === 'MATCH') maxScale = 30;
        if (game === 'POSITION_MEMORY') maxScale = 20;

        return Math.max(1, Math.min(99, Math.round((score / maxScale) * 100)));
    }
};

const getPerformanceDescription = (percentile: number) => {
    if (percentile >= 90) return "Top Class (Sangat Luar Biasa)";
    if (percentile >= 75) return "Superior (Di Atas Rata-rata)";
    if (percentile >= 50) return "Average (Rata-rata)";
    if (percentile >= 25) return "Below Average (Perlu Latihan)";
    return "Novice (Pemula)";
};

const getGameColor = (game: BenchmarkMode) => {
    switch(game) {
        case 'REACTION': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
        case 'SEQUENCE': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
        case 'AIM': return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
        case 'CHIMP': return 'text-teal-500 bg-teal-50 dark:bg-teal-900/20';
        case 'VISUAL': return 'text-sky-500 bg-sky-50 dark:bg-sky-900/20';
        case 'NUMBER': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20';
        case 'VERBAL': return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
        case 'TYPING': return 'text-slate-500 bg-slate-50 dark:bg-slate-700/50';
        case 'BRIDGE': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
        case 'MATCH': return 'text-pink-500 bg-pink-50 dark:bg-pink-900/20';
        case 'HANGMAN': return 'text-slate-900 bg-slate-100 dark:text-slate-100 dark:bg-slate-700';
        case 'HOTCOLD': return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
        case 'NUMBER_RANGE': return 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20';
        case 'POSITION_MEMORY': return 'text-fuchsia-600 bg-fuchsia-50 dark:bg-fuchsia-900/20';
        case 'PATTERN_BREAKER': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20';
        case 'DECISION_LAB': return 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20';
        case 'REVERSE_THINKING': return 'text-violet-600 bg-violet-50 dark:bg-violet-900/20';
        case 'LOGIC_MAZE': return 'text-amber-600 bg-amber-50 dark:bg-amber-900/20';
        case 'TIME_PRESSURE': return 'text-rose-600 bg-rose-50 dark:bg-rose-900/20';
        case 'MULTI_LAYER': return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20';
        case 'SYNONYM_ANTONYM': return 'text-cyan-600 bg-cyan-50 dark:bg-cyan-900/20';
        default: return 'text-slate-500 bg-slate-100';
    }
}

const getGameIcon = (game: BenchmarkMode) => {
    switch(game) {
        case 'REACTION': return <Zap size={24}/>;
        case 'SEQUENCE': return <Grid size={24}/>;
        case 'AIM': return <Target size={24}/>;
        case 'CHIMP': return <Brain size={24}/>;
        case 'VISUAL': return <Grid size={24}/>;
        case 'NUMBER': return <Hash size={24}/>;
        case 'VERBAL': return <Type size={24}/>;
        case 'TYPING': return <FileText size={24}/>;
        case 'BRIDGE': return <Map size={24}/>;
        case 'MATCH': return <Copy size={24}/>;
        case 'HANGMAN': return <Users size={24}/>;
        case 'HOTCOLD': return <TrendingUp size={24}/>;
        case 'NUMBER_RANGE': return <Search size={24}/>;
        case 'POSITION_MEMORY': return <MapPin size={24}/>;
        case 'PATTERN_BREAKER': return <Brain size={24}/>;
        case 'DECISION_LAB': return <Briefcase size={24}/>;
        case 'REVERSE_THINKING': return <RefreshCw size={24}/>;
        case 'LOGIC_MAZE': return <Route size={24}/>;
        case 'TIME_PRESSURE': return <Clock size={24}/>;
        case 'MULTI_LAYER': return <Layers size={24}/>;
        case 'SYNONYM_ANTONYM': return <Type size={24}/>;
        default: return <Activity size={24}/>;
    }
}

const getGameLabel = (g: BenchmarkMode) => {
    switch(g) {
        case 'REACTION': return 'Reaction Time';
        case 'SEQUENCE': return 'Sequence Memory';
        case 'AIM': return 'Aim Trainer';
        case 'CHIMP': return 'Chimp Test';
        case 'VISUAL': return 'Visual Memory';
        case 'NUMBER': return 'Number Memory';
        case 'VERBAL': return 'Verbal Memory';
        case 'TYPING': return 'Typing Test';
        case 'BRIDGE': return 'Bridge Memory';
        case 'MATCH': return 'Match Memory';
        case 'NUMBER_RANGE': return 'Number Range';
        case 'POSITION_MEMORY': return 'Position Memory';
        case 'PATTERN_BREAKER': return 'Pattern Breaker';
        case 'DECISION_LAB': return 'Decision Lab';
        case 'REVERSE_THINKING': return 'Reverse Thinking';
        case 'LOGIC_MAZE': return 'Logic Maze';
        case 'TIME_PRESSURE': return 'Time Pressure Logic';
        case 'MULTI_LAYER': return 'Multi-Layer Puzzle';
        case 'SYNONYM_ANTONYM': return 'Sinonim & Antonim';
        default: return g;
    }
}

const AlertTriangleIcon = () => <div className="text-amber-500 mb-4 mx-auto w-fit"><Activity size={64}/></div>;

// 1. DISTRIBUTION GRAPH COMPONENT
const DistributionGraph: React.FC<{ percentile: number, score: number, unit: string, game: BenchmarkMode }> = ({ percentile, score, unit, game }) => {
    const width = 300;
    const height = 100;
    const userX = (percentile / 100) * width;
    
    return (
        <div className="flex flex-col items-center">
            <div className="relative w-full max-w-[300px] h-[120px]">
                <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                    <path 
                        d="M0,100 C60,100 100,10 150,10 S240,100 300,100 Z" 
                        fill="url(#grad1)" 
                        stroke="none"
                        className="opacity-80"
                    />
                    <defs>
                        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" style={{stopColor: '#3b82f6', stopOpacity: 0.2}} />
                            <stop offset="50%" style={{stopColor: '#3b82f6', stopOpacity: 0.8}} />
                            <stop offset="100%" style={{stopColor: '#3b82f6', stopOpacity: 0.2}} />
                        </linearGradient>
                    </defs>
                    <line x1={userX} y1="10" x2={userX} y2="100" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" />
                    <circle cx={userX} cy="10" r="4" fill="#ef4444" />
                </svg>
                <div 
                    className="absolute top-0 transform -translate-x-1/2 -translate-y-6 bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
                    style={{ left: `${percentile}%` }}
                >
                    You: {score} {unit}
                </div>
            </div>
            <div className="w-full flex justify-between text-[10px] text-slate-400 mt-1 max-w-[300px]">
                <span>Bottom 1%</span>
                <span>Average</span>
                <span>Top 1%</span>
            </div>
        </div>
    );
};

// 2. STATS MODAL
const StatsModal: React.FC<{ isOpen: boolean, onClose: () => void, game: BenchmarkMode, bestScore: number | null }> = ({ isOpen, onClose, game, bestScore }) => {
    if (!isOpen) return null;
    
    const percentile = calculatePercentile(game, bestScore);
    const desc = getPerformanceDescription(percentile);
    
    let unit = 'pts';
    if (game === 'REACTION' || game === 'AIM') unit = 'ms';
    if (game === 'TYPING') unit = 'wpm';
    if (game === 'NUMBER_RANGE') unit = 'attempts';
    if (game === 'SEQUENCE' || game === 'NUMBER' || game === 'CHIMP' || game === 'VISUAL' || game === 'BRIDGE' || game === 'MATCH' || game === 'POSITION_MEMORY') unit = 'lvl';
    if (game === 'SYNONYM_ANTONYM') unit = 'pts';

    return (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <BarChart2 className="text-indigo-500"/> Statistik Anda
                    </h3>
                    <button onClick={() => { SoundManager.play('back'); onClose(); }}><X size={24} className="text-slate-400 hover:text-rose-500"/></button>
                </div>

                {bestScore !== null ? (
                    <div className="space-y-6">
                        <div className="text-center">
                            <div className="text-sm text-slate-500 uppercase font-bold mb-1">Skor Terbaik</div>
                            <div className="text-4xl font-black text-slate-900 dark:text-white">{bestScore} <span className="text-lg font-medium text-slate-400">{unit}</span></div>
                            <div className="inline-block mt-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold">
                                Lebih baik dari {percentile}% orang
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-600">
                             <DistributionGraph percentile={percentile} score={bestScore} unit={unit} game={game} />
                             <p className="text-center text-xs text-slate-500 mt-4 font-medium">{desc}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-slate-500">
                        Belum ada data. Mainkan game ini untuk melihat statistik Anda.
                    </div>
                )}
            </div>
        </div>
    );
};

const ReactionTimeGame: React.FC<{ onFinish: (avgMs: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [state, setState] = useState<'WAITING' | 'READY' | 'GO' | 'RESULT' | 'TOO_SOON' | 'FINAL_SCORE'>('WAITING');
    const [startTime, setStartTime] = useState(0);
    const [attempts, setAttempts] = useState<number[]>([]);
    const [currentReaction, setCurrentReaction] = useState(0);
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
    }, []);

    const startAttempt = () => {
        setState('READY');
        const delay = Math.floor(Math.random() * 3000) + 2000;
        timeoutRef.current = window.setTimeout(() => {
            setStartTime(Date.now());
            setState('GO');
        }, delay);
    };

    const handleClick = () => {
        if (state === 'WAITING') startAttempt();
        else if (state === 'READY') {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            setState('TOO_SOON');
        } else if (state === 'GO') {
            const time = Date.now() - startTime;
            setCurrentReaction(time);
            const newAttempts = [...attempts, time];
            setAttempts(newAttempts);
            if (newAttempts.length >= 5) { setState('FINAL_SCORE'); SoundManager.play('finish'); } 
            else { setState('RESULT'); SoundManager.play('success'); }
        } else if (state === 'RESULT' || state === 'TOO_SOON') setState('WAITING');
    };

    const average = attempts.length > 0 ? Math.round(attempts.reduce((a, b) => a + b, 0) / attempts.length) : 0;
    
    let content, bgColor = 'bg-slate-900';
    if (state === 'WAITING') { content = <><Zap size={80} className="mx-auto mb-6 text-amber-400"/><h2 className="text-4xl font-bold text-white mb-2">Reaction Time</h2><h3 className="text-xl text-white/60 mb-8">Percobaan {attempts.length + 1} dari 5</h3><p className="text-white/80">Klik untuk mulai.</p></>; bgColor = 'bg-slate-800'; }
    else if (state === 'READY') { content = <h2 className="text-5xl font-bold text-white tracking-widest">...</h2>; bgColor = 'bg-rose-600'; }
    else if (state === 'GO') { content = <h2 className="text-6xl font-black text-white">KLIK!</h2>; bgColor = 'bg-emerald-500'; }
    else if (state === 'RESULT') { content = <><div className="text-2xl text-white/80 mb-2">{currentReaction} ms</div><p className="text-white/60">Klik untuk lanjut.</p></>; bgColor = 'bg-indigo-600'; }
    else if (state === 'FINAL_SCORE') { content = <><Activity size={64} className="mx-auto mb-4 text-emerald-400"/><div className="text-xl text-white/80 mb-2">Rata-rata</div><h2 className="text-7xl font-black text-white mb-8">{average} ms</h2><div className="flex flex-col gap-3 w-64 mx-auto"><button className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold" onClick={() => onFinish(average)}>Simpan Skor</button><button className="px-6 py-3 border-2 border-white/30 text-white rounded-xl font-bold" onClick={() => { setAttempts([]); setState('WAITING'); }}>Coba Lagi</button></div></>; bgColor = 'bg-slate-800'; }
    else if (state === 'TOO_SOON') { content = <><AlertTriangleIcon /><h2 className="text-3xl font-bold text-white mb-4">Terlalu Cepat!</h2><p className="text-white/80">Klik untuk ulang.</p></>; bgColor = 'bg-slate-800'; }

    return <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none ${bgColor === 'bg-slate-900' || bgColor === 'bg-slate-800' ? 'bg-slate-900/95 backdrop-blur-sm' : bgColor}`} onMouseDown={state !== 'FINAL_SCORE' ? handleClick : undefined}><button onClick={(e) => {e.stopPropagation(); onExit();}} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white"><ArrowLeft size={24}/></button>{content}</div>;
};

const SequenceMemoryGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [sequence, setSequence] = useState<number[]>([]);
    const [userSequence, setUserSequence] = useState<number[]>([]);
    const [level, setLevel] = useState(1);
    const [gameState, setGameState] = useState<'START' | 'WATCHING' | 'PLAYING' | 'GAMEOVER'>('START');
    const [activeTile, setActiveTile] = useState<number | null>(null);

    const startLevel = async (lvl: number, currentSeq: number[]) => {
        setGameState('WATCHING');
        setUserSequence([]);
        const nextStep = Math.floor(Math.random() * 9);
        const newSeq = [...currentSeq, nextStep];
        setSequence(newSeq);
        await new Promise(r => setTimeout(r, 800));
        for (let i = 0; i < newSeq.length; i++) {
            setActiveTile(newSeq[i]); SoundManager.play('click');
            await new Promise(r => setTimeout(r, 600)); setActiveTile(null); await new Promise(r => setTimeout(r, 200));
        }
        setGameState('PLAYING');
    };

    const handleTileClick = async (index: number) => {
        if (gameState !== 'PLAYING') return;
        setActiveTile(index); SoundManager.play('tap'); setTimeout(() => setActiveTile(null), 200);
        const newUserSeq = [...userSequence, index];
        setUserSequence(newUserSeq);
        if (newUserSeq[newUserSeq.length - 1] !== sequence[newUserSeq.length - 1]) { setGameState('GAMEOVER'); SoundManager.play('error'); return; }
        if (newUserSeq.length === sequence.length) { setGameState('WATCHING'); SoundManager.play('success'); await new Promise(r => setTimeout(r, 800)); setLevel(p => p + 1); startLevel(level + 1, sequence); }
    };

    if (gameState === 'START') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button><div className="text-center max-w-md p-6"><Grid size={80} className="mx-auto mb-6 text-indigo-400"/><h2 className="text-4xl font-bold mb-4">Sequence Memory</h2><p className="text-white/60 mb-8">Ingat urutan kotak yang menyala. Pola akan bertambah satu langkah setiap level.</p><button onClick={() => startLevel(1, [])} className="px-8 py-3 bg-indigo-500 text-white rounded-xl font-bold text-lg hover:bg-indigo-600 transition">Mulai</button></div></div>);
    if (gameState === 'GAMEOVER') return <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><div className="bg-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full"><Grid size={64} className="mx-auto mb-6 text-rose-500"/><h2 className="text-3xl font-bold mb-2">Game Over</h2><p className="text-slate-400 mb-6">Level: <span className="text-white font-bold text-xl">{level}</span></p><div className="space-y-3"><button onClick={() => { setLevel(1); startLevel(1, []); }} className="w-full py-3 bg-indigo-600 rounded-xl font-bold">Coba Lagi</button><button onClick={() => onFinish(Math.max(1, level - 1))} className="w-full py-3 border border-slate-600 rounded-xl font-bold">Simpan Skor</button></div></div></div>;
    return <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white"><ArrowLeft size={24}/></button><div className="text-center mb-8"><div className="text-2xl font-bold text-white mb-1">Level {level}</div><p className="text-slate-400 text-sm animate-pulse h-6">{gameState === 'WATCHING' ? 'Lihat polanya...' : 'Giliranmu!'}</p></div><div className="grid grid-cols-3 gap-3 p-4">{Array.from({length: 9}).map((_, i) => (<div key={i} onClick={() => handleTileClick(i)} className={`w-20 h-20 sm:w-28 sm:h-28 rounded-xl transition-all duration-100 cursor-pointer border-4 border-slate-800 ${activeTile === i ? 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.8)] scale-95 border-white' : 'bg-slate-700 hover:bg-slate-600'}`}/>))}</div></div>;
};

const AimTrainerGame: React.FC<{ onFinish: (avgMs: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [state, setState] = useState<'IDLE' | 'PLAYING' | 'FINISHED'>('IDLE');
    const [targetsLeft, setTargetsLeft] = useState(30);
    const [targetPos, setTargetPos] = useState({ top: '50%', left: '50%' });
    const [times, setTimes] = useState<number[]>([]);
    const containerRef = useRef<HTMLDivElement>(null);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [startTime, setStartTime] = useState(0);
    const [lastClickTime, setLastClickTime] = useState(0);
    const [timerInterval, setTimerInterval] = useState<any>(null);

    const moveTarget = () => { 
        if (!containerRef.current) return; 
        const rect = containerRef.current.getBoundingClientRect(); 
        const size = 96; 
        const padding = 50; 
        
        const maxX = rect.width - size - padding;
        const maxY = rect.height - size - padding;
        
        const x = Math.max(padding, Math.random() * maxX);
        const y = Math.max(padding, Math.random() * maxY); 
        
        setTargetPos({ top: `${y}px`, left: `${x}px` }); 
    };
    
    const startGame = () => { 
        setState('PLAYING'); 
        setTargetsLeft(30); 
        setTimes([]); 
        setElapsedTime(0);
        setStartTime(0);
        moveTarget(); 
    };

    useEffect(() => {
        if (state === 'PLAYING' && startTime > 0) {
            const interval = setInterval(() => {
                setElapsedTime(Date.now() - startTime);
            }, 50);
            setTimerInterval(interval);
            return () => clearInterval(interval);
        }
    }, [state, startTime]);

    const handleHit = (e: React.MouseEvent) => { 
        e.stopPropagation(); 
        if (state !== 'PLAYING') return; 
        
        const now = Date.now(); 
        
        if (startTime === 0) {
            setStartTime(now);
            setLastClickTime(now);
            setTargetsLeft(prev => prev - 1); 
            moveTarget();
            SoundManager.play('click');
            return;
        }

        const diff = now - lastClickTime; 
        setTimes(prev => [...prev, diff]); 
        setLastClickTime(now); 
        SoundManager.play('click'); 
        
        if (targetsLeft <= 1) { 
            clearInterval(timerInterval);
            setState('FINISHED'); 
            SoundManager.play('finish'); 
        } else { 
            setTargetsLeft(prev => prev - 1); 
            moveTarget(); 
        } 
    };

    const handleMiss = () => { if (state === 'PLAYING' && startTime > 0) SoundManager.play('error'); }
    const avgTime = times.length > 0 ? Math.round(times.reduce((a,b)=>a+b,0) / times.length) : 0;
    const liveAvg = times.length > 0 ? Math.round(times.reduce((a,b)=>a+b,0) / times.length) : 0;

    return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center select-none" onMouseDown={handleMiss}>
        <button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
        {state === 'IDLE' && (
            <div className="text-center text-white cursor-default" onClick={(e) => e.stopPropagation()}>
                <Target size={80} className="mx-auto mb-6 text-orange-500"/>
                <h2 className="text-4xl font-bold mb-4">Aim Trainer</h2>
                <p className="text-white/60 mb-8">Klik 30 target secepat mungkin. Waktu dimulai saat target pertama diklik.</p>
                <button onClick={startGame} className="px-8 py-3 bg-orange-500 text-white rounded-xl font-bold text-lg hover:bg-orange-600 transition">Mulai</button>
            </div>
        )}
        {state === 'PLAYING' && (
            <>
                <div className="absolute top-8 flex gap-8 items-center pointer-events-none z-10 select-none">
                     <div className="text-center">
                         <div className="text-white/50 text-xs font-bold uppercase">Remaining</div>
                         <div className="text-white font-mono text-3xl font-bold">{targetsLeft}</div>
                     </div>
                     <div className="text-center">
                         <div className="text-white/50 text-xs font-bold uppercase">Time</div>
                         <div className="text-white font-mono text-3xl font-bold">{(elapsedTime / 1000).toFixed(1)}s</div>
                     </div>
                     <div className="text-center">
                         <div className="text-white/50 text-xs font-bold uppercase">Avg</div>
                         <div className="text-orange-400 font-mono text-3xl font-bold">{liveAvg} ms</div>
                     </div>
                </div>
                <div ref={containerRef} className="w-full h-full relative max-w-5xl max-h-[80vh] cursor-crosshair">
                    <div onMouseDown={handleHit} className="absolute w-24 h-24 rounded-full bg-orange-500 border-4 border-white shadow-[0_0_15px_rgba(249,115,22,0.6)] cursor-pointer flex items-center justify-center hover:scale-95 transition-transform duration-75" style={{ top: targetPos.top, left: targetPos.left }}>
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                        <div className="absolute w-12 h-12 border-2 border-white/50 rounded-full"></div>
                        <div className="absolute w-20 h-20 border border-white/20 rounded-full"></div>
                    </div>
                </div>
            </>
        )}
        {state === 'FINISHED' && (
            <div className="text-center text-white cursor-default" onClick={(e) => e.stopPropagation()}>
                <Target size={64} className="mx-auto mb-4 text-orange-500"/>
                <h2 className="text-3xl font-bold mb-2">Selesai!</h2>
                <p className="text-white/60 mb-6">Rata-rata waktu per target</p>
                <h1 className="text-7xl font-black mb-8">{avgTime} ms</h1>
                <div className="text-white/40 mb-8 font-mono">Total Waktu: {(elapsedTime/1000).toFixed(2)}s</div>
                <div className="space-y-3 w-64 mx-auto">
                    <button onClick={() => onFinish(avgTime)} className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold">Simpan Skor</button>
                    <button onClick={startGame} className="w-full py-3 border border-white/20 rounded-xl font-bold">Coba Lagi</button>
                </div>
            </div>
        )}
    </div>);
};

const ChimpTestGame: React.FC<{ onFinish: (score: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [level, setLevel] = useState(4); const [numbers, setNumbers] = useState<{id: number, pos: number, visible: boolean}[]>([]); const [state, setState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE'); const [nextNum, setNextNum] = useState(1); const [hideNumbers, setHideNumbers] = useState(false);
    const generateLevel = (count: number) => { const positions = Array.from({length: 40}, (_, i) => i); const shuffled = positions.sort(() => 0.5 - Math.random()); const newNumbers = Array.from({length: count}, (_, i) => ({ id: i + 1, pos: shuffled[i], visible: true })); setNumbers(newNumbers); setNextNum(1); setHideNumbers(false); setState('PLAYING'); };
    const handleClick = (id: number) => { if (state !== 'PLAYING') return; if (id === nextNum) { SoundManager.play('click'); if (id === 1) setHideNumbers(true); setNumbers(prev => prev.map(n => n.id === id ? { ...n, visible: false } : n)); if (id === numbers.length) { SoundManager.play('success'); setTimeout(() => { setLevel(l => l + 1); generateLevel(level + 1); }, 500); } else { setNextNum(n => n + 1); } } else { SoundManager.play('error'); setState('GAMEOVER'); } };
    return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center select-none"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>{state === 'IDLE' && (<div className="text-center text-white max-w-md p-6"><Brain size={80} className="mx-auto mb-6 text-teal-400"/><h2 className="text-4xl font-bold mb-4">Chimp Test</h2><p className="text-white/60 mb-8">Klik angka secara berurutan. Setelah klik angka 1, sisanya akan tertutup. Uji ingatan visualmu!</p><button onClick={() => generateLevel(4)} className="px-8 py-3 bg-teal-500 text-white rounded-xl font-bold text-lg hover:bg-teal-600 transition">Mulai Tes</button></div>)}{state === 'PLAYING' && (<><div className="text-white mb-4 font-bold text-lg">Level {level - 3}</div><div className="grid grid-cols-8 gap-2 md:gap-4 p-4 max-w-3xl">{Array.from({length: 40}).map((_, i) => { const num = numbers.find(n => n.pos === i); if (!num || !num.visible) return <div key={i} className="w-10 h-10 md:w-16 md:h-16"></div>; return (<button key={i} onMouseDown={() => handleClick(num.id)} className={`w-10 h-10 md:w-16 md:h-16 rounded-lg border-2 font-bold flex items-center justify-center transition-transform active:scale-95 text-xl md:text-3xl ${hideNumbers && num.id > 1 ? 'bg-indigo-100 border-indigo-200 text-transparent hover:bg-indigo-200' : 'bg-indigo-500 border-indigo-400 text-white hover:bg-indigo-400 shadow-lg'}`}>{hideNumbers && num.id > 1 ? '' : num.id}</button>); })}</div></>)}{state === 'GAMEOVER' && (<div className="text-center text-white"><Brain size={64} className="mx-auto mb-4 text-rose-500"/><h2 className="text-3xl font-bold mb-2">Game Over</h2><p className="text-white/60 mb-6">Skor: <span className="text-white font-bold text-xl">{level - 1}</span></p><div className="space-y-3 w-64 mx-auto"><button onClick={() => { generateLevel(4); setLevel(4); }} className="w-full py-3 bg-indigo-600 rounded-xl font-bold hover:bg-indigo-700">Coba Lagi</button><button onClick={() => onFinish(Math.max(0, level - 1))} className="w-full py-3 border border-white/20 rounded-xl font-bold hover:bg-white/10">Simpan Skor</button></div></div>)}</div>);
};

const VisualMemoryGame: React.FC<{ onFinish: (score: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [level, setLevel] = useState(1); const [lives, setLives] = useState(3); const [gridSize, setGridSize] = useState(3); const [activeTiles, setActiveTiles] = useState<number[]>([]); const [userClicks, setUserClicks] = useState<number[]>([]); const [wrongClicks, setWrongClicks] = useState<number[]>([]); const [state, setState] = useState<'START' | 'SHOWING' | 'PLAYING' | 'GAMEOVER'>('START');
    const startLevel = (lvl: number) => { let size = 3; if (lvl > 2) size = 4; if (lvl > 5) size = 5; if (lvl > 10) size = 6; if (lvl > 20) size = 7; setGridSize(size); const tileCount = Math.min(Math.floor(size * size / 2), lvl + 2); const tiles: number[] = []; while(tiles.length < tileCount) { const r = Math.floor(Math.random() * (size * size)); if (!tiles.includes(r)) tiles.push(r); } setActiveTiles(tiles); setUserClicks([]); setWrongClicks([]); setState('SHOWING'); setTimeout(() => setState('PLAYING'), 1000 + (lvl * 100)); };
    const handleTileClick = (idx: number) => { if (state !== 'PLAYING') return; if (userClicks.includes(idx) || wrongClicks.includes(idx)) return; if (activeTiles.includes(idx)) { SoundManager.play('tap'); const newClicks = [...userClicks, idx]; setUserClicks(newClicks); if (newClicks.length === activeTiles.length) { SoundManager.play('success'); setTimeout(() => { setLevel(l => l + 1); startLevel(level + 1); }, 500); } } else { SoundManager.play('error'); const newLives = lives - 1; setLives(newLives); setWrongClicks(prev => [...prev, idx]); if (newLives <= 0) { setTimeout(() => setState('GAMEOVER'), 500); } } };
    if (state === 'START') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button><div className="text-center max-w-md p-6"><Grid size={80} className="mx-auto mb-6 text-sky-400"/><h2 className="text-4xl font-bold mb-4">Visual Memory</h2><p className="text-white/60 mb-8">Ingat posisi kotak putih yang muncul. Hati-hati, setiap kesalahan mengurangi nyawa!</p><button onClick={() => { setLevel(1); setLives(3); startLevel(1); }} className="px-8 py-3 bg-sky-500 text-white rounded-xl font-bold text-lg hover:bg-sky-600 transition">Mulai</button></div></div>);
    if (state === 'GAMEOVER') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><div className="bg-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full border border-slate-700"><Grid size={64} className="mx-auto mb-6 text-sky-500"/><h2 className="text-3xl font-bold mb-2">Game Over</h2><p className="text-slate-400 mb-6">Level: <span className="text-white font-bold text-xl">{level}</span></p><div className="space-y-3"><button onClick={() => { setLevel(1); setLives(3); startLevel(1); }} className="w-full py-3 bg-indigo-600 rounded-xl font-bold">Coba Lagi</button><button onClick={() => onFinish(level)} className="w-full py-3 border border-slate-600 rounded-xl font-bold">Simpan Skor</button></div></div></div>);
    return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white"><ArrowLeft size={24}/></button><div className="text-center mb-8 flex flex-col items-center gap-2"><div className="text-2xl font-bold text-white">Level {level}</div><div className="flex gap-1">{[...Array(3)].map((_, i) => (<Heart key={i} size={24} className={i < lives ? "fill-rose-500 text-rose-500" : "fill-slate-700 text-slate-700"} />))}</div></div><div className="grid gap-2 bg-slate-800 p-4 rounded-xl shadow-2xl transition-all duration-300" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)`, width: 'min(90vw, 400px)', aspectRatio: '1/1' }}>{Array.from({length: gridSize * gridSize}).map((_, i) => { const isActive = activeTiles.includes(i); const isClicked = userClicks.includes(i); const isWrong = wrongClicks.includes(i); let bgClass = 'bg-slate-700 hover:bg-slate-600'; if (state === 'SHOWING' && isActive) bgClass = 'bg-white shadow-[0_0_15px_white] scale-95'; if (state === 'PLAYING' && isClicked) bgClass = 'bg-white'; if (state === 'PLAYING' && isWrong) bgClass = 'bg-slate-900 border-2 border-rose-900'; return (<div key={i} onMouseDown={() => handleTileClick(i)} className={`rounded-lg transition-all duration-200 cursor-pointer ${bgClass}`}></div>); })}</div></div>);
};

const NumberMemoryGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [level, setLevel] = useState(1); const [number, setNumber] = useState(''); const [input, setInput] = useState(''); const [state, setState] = useState<'START' | 'SHOWING' | 'INPUT' | 'RESULT' | 'GAMEOVER'>('START'); const [timeLeft, setTimeLeft] = useState(0);
    const [progress, setProgress] = useState(100);

    const generateNumber = (lvl: number) => { let num = ''; for(let i=0; i<lvl; i++) num += Math.floor(Math.random() * 10); return num; };
    const startGame = () => { setLevel(1); startLevel(1); };
    
    const startLevel = (lvl: number) => { 
        const num = generateNumber(lvl); 
        setNumber(num); 
        setState('SHOWING'); 
        setProgress(100);
        
        const duration = 1000 + (lvl * 500); 
        setTimeLeft(duration);
        
        setTimeout(() => {
            setProgress(0);
        }, 50);

        setTimeout(() => { setState('INPUT'); }, duration); 
    };

    const handleSubmit = (e?: React.FormEvent) => { e?.preventDefault(); if (input === number) { SoundManager.play('success'); setState('RESULT'); setTimeout(() => { setLevel(l => l + 1); setInput(''); startLevel(level + 1); }, 1000); } else { SoundManager.play('error'); setState('GAMEOVER'); } };
    
    if (state === 'START') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button><div className="text-center max-w-md p-6"><Hash size={80} className="mx-auto mb-6 text-blue-400"/><h2 className="text-4xl font-bold mb-4">Number Memory</h2><p className="text-white/60 mb-8">Ingat angka yang muncul, lalu ketik ulang. Angka akan bertambah panjang setiap level.</p><button onClick={startGame} className="px-8 py-3 bg-blue-500 text-white rounded-xl font-bold text-lg hover:bg-blue-600 transition">Mulai</button></div></div>);
    if (state === 'GAMEOVER') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><div className="bg-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full"><Hash size={64} className="mx-auto mb-6 text-blue-500"/><h2 className="text-3xl font-bold mb-2">Salah!</h2><div className="text-left bg-slate-900 p-4 rounded-xl mb-6 font-mono text-sm break-all"><div className="text-slate-400 mb-1">Angka:</div><div className="text-white font-bold mb-2 tracking-widest">{number}</div><div className="text-slate-400 mb-1">Jawab:</div><div className="text-rose-500 line-through tracking-widest">{input}</div></div><p className="text-slate-400 mb-6">Level: <span className="text-white font-bold">{level}</span></p><div className="space-y-3"><button onClick={startGame} className="w-full py-3 bg-indigo-600 rounded-xl font-bold">Coba Lagi</button><button onClick={() => onFinish(level)} className="w-full py-3 border border-slate-600 rounded-xl font-bold">Simpan Skor</button></div></div></div>);
    
    return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center select-none"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white"><ArrowLeft size={24}/></button>
        {state === 'SHOWING' && (
            <div className="text-center animate-fade-in-up w-full px-8">
                <h2 className="text-6xl md:text-8xl font-black text-white font-mono tracking-widest">{number}</h2>
                <div className="w-full max-w-md h-2 bg-slate-800 rounded-full mt-8 mx-auto overflow-hidden">
                    <div className="h-full bg-white transition-all ease-linear" style={{ width: `${progress}%`, transitionDuration: `${timeLeft}ms`, opacity: progress > 0 ? 1 : 0.2 }}></div>
                </div>
            </div>
        )}
        {state === 'INPUT' && (<div className="text-center w-full max-w-md px-4"><h3 className="text-xl text-white mb-4">Apa angkanya?</h3><form onSubmit={handleSubmit}><input type="text" inputMode="numeric" pattern="[0-9]*" autoFocus value={input} onChange={e => setInput(e.target.value)} className="w-full bg-slate-800 text-white text-3xl font-mono text-center py-4 rounded-xl border-2 border-slate-700 focus:border-blue-500 focus:outline-none mb-4"/><button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition">Submit</button></form></div>)}{state === 'RESULT' && (<div className="text-center"><CheckCircle size={80} className="text-emerald-500 mx-auto mb-4 animate-bounce-slow"/><h2 className="text-2xl text-white font-bold">Benar!</h2></div>)}</div>);
};

const VerbalMemoryGame: React.FC<{ onFinish: (score: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [score, setScore] = useState(0); const [lives, setLives] = useState(3); const [currentWord, setCurrentWord] = useState(''); const [seenWords, setSeenWords] = useState<Set<string>>(new Set()); const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
    const dictionary = ["RUMAH", "POHON", "MEJA", "BUKU", "JALAN", "AIR", "API", "LANGIT", "BUMI", "LAUT", "GUNUNG", "KOTA", "DESA", "MOBIL", "SEPEDA", "KAPAL", "IKAN", "BURUNG", "KUCING", "ANJING", "MERAH", "BIRU", "HIJAU", "KUNING", "PUTIH", "HITAM", "BESAR", "KECIL", "PANJANG", "PENDEK", "KERJA", "MAIN", "TIDUR", "MAKAN", "MINUM", "LARI", "DUDUK", "BERDIRI", "CINTA", "BENCI", "SENANG", "SEDIH", "MARAH", "TAKUT", "BERANI", "KUAT", "LEMAH", "PINTAR", "BODOH", "CEPAT", "AWAN", "BINTANG", "BULAN", "CAHAYA", "GELAP", "TERANG", "PAGI", "SIANG", "SORE", "MALAM", "WAKTU", "JAM", "MENIT", "DETIK", "TAHUN", "BULAN", "MINGGU", "HARI"];
    const nextTurn = () => { const showSeen = seenWords.size > 0 && Math.random() < 0.4; let word = ''; if (showSeen) { const array = Array.from(seenWords); word = array[Math.floor(Math.random() * array.length)]; } else { let attempts = 0; do { word = dictionary[Math.floor(Math.random() * dictionary.length)]; attempts++; } while (seenWords.has(word) && attempts < 100); } setCurrentWord(word); };
    const handleAnswer = (choice: 'SEEN' | 'NEW') => { const isSeen = seenWords.has(currentWord); const correct = (choice === 'SEEN' && isSeen) || (choice === 'NEW' && !isSeen); if (correct) { setScore(s => s + 1); if (choice === 'NEW') setSeenWords(prev => new Set(prev).add(currentWord)); SoundManager.play('click'); nextTurn(); } else { const newLives = lives - 1; setLives(newLives); SoundManager.play('error'); if (choice === 'NEW') setSeenWords(prev => new Set(prev).add(currentWord)); if (newLives <= 0) setGameState('GAMEOVER'); else nextTurn(); } };
    const startGame = () => { setScore(0); setLives(3); setSeenWords(new Set()); setGameState('PLAYING'); nextTurn(); };
    if (gameState === 'START') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button><div className="text-center max-w-md p-6"><Type size={80} className="mx-auto mb-6 text-purple-400"/><h2 className="text-4xl font-bold mb-4">Verbal Memory</h2><p className="text-white/60 mb-8">Anda akan melihat kata-kata satu per satu. Jika kata tersebut belum pernah muncul, klik <strong>BARU</strong>. Jika sudah, klik <strong>SUDAH</strong>.</p><button onClick={startGame} className="px-8 py-3 bg-purple-500 text-white rounded-xl font-bold text-lg hover:bg-purple-600 transition">Mulai</button></div></div>);
    if (gameState === 'GAMEOVER') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><div className="bg-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full"><Type size={64} className="mx-auto mb-6 text-purple-500"/><h2 className="text-3xl font-bold mb-2">Verbal Memory</h2><p className="text-slate-400 mb-6">Skor: <span className="text-white font-bold text-xl">{score}</span> kata</p><div className="space-y-3"><button onClick={startGame} className="w-full py-3 bg-indigo-600 rounded-xl font-bold">Coba Lagi</button><button onClick={() => onFinish(score)} className="w-full py-3 border border-slate-600 rounded-xl font-bold">Simpan Skor</button></div></div></div>);
    return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center select-none"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white"><ArrowLeft size={24}/></button><div className="flex gap-8 mb-12 text-lg font-bold text-white items-center"><div>Skor: {score}</div><div className="flex gap-1">{[...Array(3)].map((_, i) => (<Heart key={i} size={24} className={i < lives ? "fill-rose-500 text-rose-500" : "fill-slate-700 text-slate-700"} />))}</div></div><div className="text-5xl md:text-7xl font-black text-white mb-12 animate-fade-in-up transition-all">{currentWord}</div><div className="flex gap-4"><button onClick={() => handleAnswer('SEEN')} className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xl transition w-40">SUDAH</button><button onClick={() => handleAnswer('NEW')} className="px-8 py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-bold text-xl transition w-40">BARU</button></div></div>);
};

const TypingGame: React.FC<{ onFinish: (wpm: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [text, setText] = useState<string>("");
    const [input, setInput] = useState(''); 
    const [startTime, setStartTime] = useState<number | null>(null); 
    const [wpm, setWpm] = useState(0); 
    const [timeElapsed, setTimeElapsed] = useState(0); 
    const [state, setState] = useState<'START' | 'PLAYING' | 'FINISHED'>('START');

    useEffect(() => { 
        const texts = TYPING_TEXTS;
        // Fix: Explicitly cast to string using String() constructor to avoid 'unknown' type error
        const randomText = texts.length > 0 ? String(texts[Math.floor(Math.random() * texts.length)]) : ""; 
        setText(randomText); 
    }, []);

    useEffect(() => { 
        let interval: any; 
        if (state === 'PLAYING' && startTime) { 
            interval = setInterval(() => { 
                const now = Date.now(); 
                const elapsedSec = (now - startTime) / 1000; 
                setTimeElapsed(Math.floor(elapsedSec)); 
                const charCount = input.length; 
                const minutes = elapsedSec / 60; 
                if (minutes > 0) { 
                    setWpm(Math.round((charCount / 5) / minutes)); 
                } 
            }, 1000); 
        } 
        return () => clearInterval(interval); 
    }, [state, startTime, input]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => { 
        const val = e.target.value; 
        if (state === 'START') { 
            setStartTime(Date.now()); 
            setState('PLAYING'); 
        } 
        setInput(val); 
        if (val === text) { 
            const time = (Date.now() - (startTime || Date.now())) / 60000; 
            const finalWpm = Math.round((text.length / 5) / time); 
            setWpm(finalWpm); 
            setState('FINISHED'); 
            SoundManager.play('finish'); 
        } else { 
            if (val.length % 5 === 0) SoundManager.play('tap'); 
        } 
    };

    const startGame = () => { 
        const texts = TYPING_TEXTS;
        // Fix: Explicitly cast to string using String() constructor to avoid 'unknown' type error
        const randomText = texts.length > 0 ? String(texts[Math.floor(Math.random() * texts.length)]) : ""; 
        setText(randomText); 
        setInput(''); 
        setStartTime(null); 
        setWpm(0); 
        setTimeElapsed(0); 
        setState('START'); 
    }

    if (state === 'FINISHED') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><div className="bg-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full"><FileText size={64} className="mx-auto mb-6 text-slate-400"/><h2 className="text-3xl font-bold mb-2">Typing Speed</h2><h1 className="text-6xl font-black text-emerald-400 mb-6">{wpm} <span className="text-xl text-white/50">WPM</span></h1><div className="space-y-3"><button onClick={startGame} className="w-full py-3 bg-indigo-600 rounded-xl font-bold">Coba Lagi</button><button onClick={() => onFinish(wpm)} className="w-full py-3 border border-slate-600 rounded-xl font-bold">Simpan Skor</button></div></div></div>);
    return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center p-6"><button onClick={onExit} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white"><ArrowLeft size={24}/></button><div className="flex gap-12 mb-8 text-white font-mono text-xl"><div>WPM: <span className="font-bold text-emerald-400">{wpm}</span></div><div>Time: <span className="font-bold text-emerald-400">{timeElapsed}s</span></div></div><div className="w-full max-w-2xl bg-slate-800 p-6 rounded-2xl shadow-xl"><div className="mb-6 text-lg text-slate-400 leading-relaxed select-none">{text.split('').map((char, i) => { let color = 'text-slate-500'; if (i < input.length) { color = input[i] === char ? 'text-white' : 'text-rose-500 bg-rose-500/20'; } return <span key={i} className={color}>{char}</span>; })}</div><textarea value={input} onChange={handleChange} className="w-full bg-slate-900 text-white p-4 rounded-xl border border-slate-700 focus:border-indigo-500 focus:outline-none h-32 resize-none font-mono" placeholder="Mulai ketik di sini..." autoFocus/></div></div>);
};

const BridgeMemoryGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [level, setLevel] = useState(1); 
    const [lives, setLives] = useState(3); 
    const [gridWidth, setGridWidth] = useState(5);
    const [gridHeight, setGridHeight] = useState(4); 
    const [path, setPath] = useState<{row: number, col: number}[]>([]); 
    const [gameState, setGameState] = useState<'START' | 'SHOWING' | 'PLAYING' | 'GAMEOVER'>('START'); 
    const [currentStep, setCurrentStep] = useState(0); 
    const [progress, setProgress] = useState(100);
    const [showDuration, setShowDuration] = useState(1500);

    const generatePath = (lvl: number) => { 
        const width = 5; 
        const height = 4 + Math.floor(lvl / 2); 
        setGridWidth(width);
        setGridHeight(height);
        
        const newPath = []; 
        let r = height - 1; 
        let c = Math.floor(width / 2); 
        
        newPath.push({row: r, col: c});

        while(r > 0) {
            r--;
            const possibleCols = [c];
            if (c > 0) possibleCols.push(c - 1);
            if (c < width - 1) possibleCols.push(c + 1);
            
            c = possibleCols[Math.floor(Math.random() * possibleCols.length)];
            newPath.push({row: r, col: c});
        }
        
        setPath(newPath); 
    };

    const startLevel = (lvl: number) => { 
        generatePath(lvl); 
        setGameState('SHOWING'); 
        setProgress(100);
        
        const duration = 1500; 
        setShowDuration(duration);

        setTimeout(() => setProgress(0), 50);

        setTimeout(() => {
            setGameState('PLAYING');
            setCurrentStep(0);
        }, duration); 
    };

    const handleTileClick = (r: number, c: number) => { 
        if (gameState !== 'PLAYING') return; 
        
        const target = path[currentStep];
        
        if (r === target.row && c === target.col) { 
            SoundManager.play('click'); 
            const next = currentStep + 1;
            setCurrentStep(next); 
            
            if (next === path.length) { 
                SoundManager.play('success'); 
                setTimeout(() => { 
                    setLevel(l => l + 1); 
                    startLevel(level + 1); 
                }, 500); 
            } 
        } else { 
            SoundManager.play('error'); 
            setLives(prev => prev - 1); 
            if (lives <= 1) { 
                setGameState('GAMEOVER'); 
            } else { 
                setGameState('SHOWING'); 
                setProgress(100); 
                setTimeout(() => setProgress(0), 50); 
                setTimeout(() => {
                    setGameState('PLAYING');
                    setCurrentStep(0);
                }, showDuration); 
            } 
        } 
    };
    
    if (gameState === 'START') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button><div className="text-center max-w-md p-6"><Map size={80} className="mx-auto mb-6 text-emerald-400"/><h2 className="text-4xl font-bold mb-4">Bridge Memory</h2><p className="text-white/60 mb-8">Hafalkan jalan yang aman dari bawah ke atas sebelum hilang.</p><button onClick={() => { SoundManager.play('click'); setLevel(1); setLives(3); startLevel(1); }} className="px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold text-lg hover:bg-emerald-600 transition">Mulai</button></div></div>);
    
    if (gameState === 'GAMEOVER') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><div className="bg-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full"><Map size={64} className="mx-auto mb-6 text-emerald-500"/><h2 className="text-3xl font-bold mb-2">Game Over</h2><p className="text-slate-400 mb-6">Level: <span className="text-white font-bold text-xl">{level}</span></p><div className="space-y-3"><button onClick={() => { SoundManager.play('click'); setLevel(1); setLives(3); startLevel(1); }} className="w-full py-3 bg-indigo-600 rounded-xl font-bold">Coba Lagi</button><button onClick={() => { SoundManager.play('click'); onFinish(level); }} className="w-full py-3 border border-slate-600 rounded-xl font-bold">Simpan Skor</button></div></div></div>);
    
    return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center overflow-hidden">
        <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white"><ArrowLeft size={24}/></button>
        <div className="text-center mb-4 flex flex-col items-center gap-2">
            <div className="text-2xl font-bold text-white">Level {level}</div>
            <div className="flex gap-1">{[...Array(3)].map((_, i) => (<Heart key={i} size={24} className={i < lives ? "fill-rose-500 text-rose-500" : "fill-slate-700 text-slate-700"} />))}</div>
        </div>
        
         <div className={`w-full max-w-xs h-2 bg-slate-800 rounded-full mb-6 overflow-hidden transition-opacity duration-300 ${gameState === 'SHOWING' ? 'opacity-100' : 'opacity-0'}`}>
            <div className="h-full bg-white transition-all ease-linear" style={{ width: `${progress}%`, transitionDuration: `${showDuration}ms` }}></div>
        </div>

        <div className="flex-1 w-full max-w-md flex items-center justify-center p-4">
             <div 
                className="grid gap-1.5 w-full h-full max-h-[70vh]" 
                style={{ 
                    gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                    gridTemplateRows: `repeat(${gridHeight}, 1fr)` 
                }}
            >
                {Array.from({length: gridHeight}).map((_, rIndex) => {
                    return Array.from({length: gridWidth}).map((_, cIndex) => { 
                        const pathStepIndex = path.findIndex(p => p.row === rIndex && p.col === cIndex);
                        const isPath = pathStepIndex !== -1;
                        const isVisited = isPath && pathStepIndex < currentStep;
                        
                        let bgClass = 'bg-slate-700'; 
                        
                        if (gameState === 'SHOWING' && isPath) {
                            bgClass = 'bg-emerald-400'; 
                        } else if (gameState === 'PLAYING') {
                             if (isVisited) bgClass = 'bg-emerald-600'; 
                             else if (isPath && pathStepIndex === currentStep) {
                                 bgClass = 'bg-slate-700 active:bg-emerald-400';
                             }
                        }

                        return (
                            <div 
                                key={`${rIndex}-${cIndex}`} 
                                onMouseDown={() => handleTileClick(rIndex, cIndex)} 
                                className={`w-full h-full rounded-md transition-colors duration-200 cursor-pointer ${bgClass} hover:opacity-90`}
                            ></div>
                        ) 
                    })
                })}
            </div>
        </div>
        
        <div className="mt-2 text-emerald-400 animate-bounce flex flex-col items-center">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Start Here</span>
            <ArrowUp size={32} />
        </div>
    </div>);
}

const MatchMemoryGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [level, setLevel] = useState(1); const [lives, setLives] = useState(5); const [cards, setCards] = useState<{id: number, icon: string, flipped: boolean, matched: boolean, color: string}[]>([]); const [selectedCards, setSelectedCards] = useState<number[]>([]); const [gameState, setGameState] = useState<'START' | 'PREVIEW' | 'PLAYING' | 'GAMEOVER'>('START'); const [isProcessing, setIsProcessing] = useState(false); const [gridCols, setGridCols] = useState(3);
    const icons = ['★', '▲', '●', '■', '♦', '✚', '▼', '♠', '♣', '♥', '✖', '⬟', '⭘', '⬢', '✜', '✷']; const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500', 'bg-lime-500', 'bg-rose-500', 'bg-emerald-500', 'bg-fuchsia-500', 'bg-violet-500', 'bg-sky-500'];
    
    const startLevel = (lvl: number) => { 
        const pairCount = lvl + 2; 
        const totalCards = pairCount * 2; 
        const cols = Math.ceil(Math.sqrt(totalCards)); 
        setGridCols(cols); 
        const gameIcons = [...icons].sort(() => Math.random() - 0.5).slice(0, pairCount); 
        let deck: {id: number, icon: string, flipped: boolean, matched: boolean, color: string}[] = []; 
        for (let i = 0; i < pairCount; i++) { 
            const icon = gameIcons[i]; 
            const color = colors[i % colors.length]; 
            deck.push({ id: i * 2, icon, flipped: true, matched: false, color }); 
            deck.push({ id: i * 2 + 1, icon, flipped: true, matched: false, color }); 
        } 
        deck = deck.sort(() => Math.random() - 0.5).map((card, index) => ({...card, id: index})); 
        setCards(deck); 
        setGameState('PREVIEW'); 
    };

    const handleReady = () => { SoundManager.play('click'); setCards(prev => prev.map(c => ({...c, flipped: false}))); setGameState('PLAYING'); };
    const handleCardClick = (id: number) => { if (gameState !== 'PLAYING' || isProcessing) return; const clickedCard = cards.find(c => c.id === id); if (!clickedCard || clickedCard.flipped || clickedCard.matched) return; SoundManager.play('click'); const newCards = cards.map(c => c.id === id ? { ...c, flipped: true } : c); setCards(newCards); const newSelected = [...selectedCards, id]; setSelectedCards(newSelected); if (newSelected.length === 2) { setIsProcessing(true); const card1 = newCards.find(c => c.id === newSelected[0]); const card2 = newCards.find(c => c.id === newSelected[1]); if (card1 && card2 && card1.icon === card2.icon) { SoundManager.play('success'); setTimeout(() => { setCards(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, matched: true } : c)); setSelectedCards([]); setIsProcessing(false); if (newCards.filter(c => !c.matched && !newSelected.includes(c.id)).length === 0) { setTimeout(() => { setLevel(l => l + 1); startLevel(level + 1); }, 500); } }, 500); } else { setTimeout(() => { SoundManager.play('error'); setCards(prev => prev.map(c => newSelected.includes(c.id) ? { ...c, flipped: false } : c)); setSelectedCards([]); setIsProcessing(false); setLives(l => { const newLives = l - 1; if(newLives <= 0) setGameState('GAMEOVER'); return newLives; }); }, 1000); } } };
    if (gameState === 'START') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button><div className="text-center max-w-md p-6"><Copy size={80} className="mx-auto mb-6 text-pink-400"/><h2 className="text-4xl font-bold mb-4">Match Memory</h2><p className="text-white/60 mb-8">Hafalkan posisi pasangan simbol sebelum kartu ditutup. Cocokkan semua pasangan!</p><button onClick={() => { SoundManager.play('click'); setLevel(1); setLives(5); startLevel(1); }} className="px-8 py-3 bg-pink-500 text-white rounded-xl font-bold text-lg hover:bg-pink-600 transition">Mulai</button></div></div>);
    if (gameState === 'GAMEOVER') return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center text-white"><div className="bg-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full"><Copy size={64} className="mx-auto mb-6 text-pink-500"/><h2 className="text-3xl font-bold mb-2">Game Over</h2><p className="text-slate-400 mb-6">Level: <span className="text-white font-bold text-xl">{level}</span></p><div className="space-y-3"><button onClick={() => { SoundManager.play('click'); setLevel(1); setLives(5); startLevel(1); }} className="w-full py-3 bg-indigo-600 rounded-xl font-bold">Coba Lagi</button><button onClick={() => { SoundManager.play('click'); onFinish(level); }} className="w-full py-3 border border-slate-600 rounded-xl font-bold">Simpan Skor</button></div></div></div>);
    return (<div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col items-center justify-center"><button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white"><ArrowLeft size={24}/></button><div className="text-center mb-6 flex flex-col items-center gap-2"><div className="text-2xl font-bold text-white">Level {level}</div><div className="flex gap-1">{[...Array(5)].map((_, i) => (<Heart key={i} size={24} className={i < lives ? "fill-rose-500 text-rose-500" : "fill-slate-700 text-slate-700"} />))}</div>{gameState === 'PREVIEW' && (<button onClick={handleReady} className="mt-4 px-8 py-2 bg-emerald-500 text-white font-bold rounded-full hover:bg-emerald-600 transition shadow-lg animate-pulse">SAYA SIAP!</button>)}</div><div className="grid gap-3 justify-center max-w-2xl p-4" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>{cards.map(card => (<div key={card.id} onClick={() => handleCardClick(card.id)} className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center text-3xl font-bold cursor-pointer transition-all duration-300 transform ${card.flipped || card.matched ? `${card.color} text-white rotate-y-180` : 'bg-slate-700 hover:bg-slate-600'}`}>{(card.flipped || card.matched) ? card.icon : ''}</div>))}</div></div>);
}

const LeaderboardView: React.FC<{ username: string, history: TestHistoryItem[] }> = ({ username, history }) => {
    
    const [globalScores, setGlobalScores] = useState<Record<string, GlobalBenchmarkScore[]>>({});
    const [loading, setLoading] = useState(true);
    const [isGlobal, setIsGlobal] = useState(true); 

    const games: BenchmarkMode[] = ['REACTION', 'SEQUENCE', 'AIM', 'CHIMP', 'VISUAL', 'NUMBER', 'VERBAL', 'TYPING', 'BRIDGE', 'MATCH', 'NUMBER_RANGE', 'POSITION_MEMORY', 'PATTERN_BREAKER', 'DECISION_LAB', 'REVERSE_THINKING', 'LOGIC_MAZE', 'TIME_PRESSURE', 'MULTI_LAYER'];

    useEffect(() => {
        const fetchGlobalScores = async () => {
            if (!isGlobal) return;
            setLoading(true);
            const scores: Record<string, GlobalBenchmarkScore[]> = {};
            
            await Promise.all(games.map(async (game: BenchmarkMode) => {
                try {
                    const data = await FirebaseService.getBenchmarkLeaderboard(game);
                    scores[game] = data;
                } catch (e) {
                    console.error("Failed to load leaderboard for", game);
                    scores[game] = [];
                }
            }));
            
            setGlobalScores(scores);
            setLoading(false);
        };
        
        fetchGlobalScores();
    }, [isGlobal]); 

    // Function to process PERSONAL history data (Fallback)
    const generatePersonalLeaderboard = (game: BenchmarkMode) => {
        const gameHistory = history.filter(h => {
            if (h.category !== 'BENCHMARK' || !h.details) return false;
            // Explicitly cast to check game property safely
            const d = h.details as any;
            return d.game === game;
        });

        if (game === 'REACTION' || game === 'AIM') {
            gameHistory.sort((a, b) => a.score - b.score);
        } else {
            gameHistory.sort((a, b) => b.score - a.score);
        }

        return gameHistory.slice(0, 5).map(h => {
            // Safety cast to BenchmarkResultDetails to correctly access properties
            const details = h.details as BenchmarkResultDetails; 
            return {
                name: username,
                score: h.score,
                unit: details?.unit || '', 
            };
        });
    };

    return (
        <div className="mt-8 animate-fade-in-up px-2 sm:px-0">
             <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5 sm:gap-2">
                    <Trophy className="text-amber-500 w-5 h-5 sm:w-6 sm:h-6" /> <span className="truncate">Leaderboard</span>
                </h3>
                
                <div className="bg-slate-200 dark:bg-slate-700 p-1 rounded-xl flex gap-1">
                    <button 
                        onClick={() => setIsGlobal(true)}
                        className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${isGlobal ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <Globe size={14} className="inline mr-1 w-3.5 h-3.5 sm:w-4 sm:h-4"/> Global
                    </button>
                    <button 
                        onClick={() => setIsGlobal(false)}
                         className={`px-2 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${!isGlobal ? 'bg-white dark:bg-slate-600 shadow text-indigo-600 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        <Users size={14} className="inline mr-1 w-3.5 h-3.5 sm:w-4 sm:h-4"/> Personal
                    </button>
                </div>
            </div>
            
            {loading && isGlobal ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Loader2 size={40} className="animate-spin mb-4 text-indigo-500"/>
                    <p>Memuat Data Global Rank...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                     {games.map(game => {
                         let scores: any[] = [];
                         if (isGlobal) {
                             scores = globalScores[game] || [];
                         } else {
                             scores = generatePersonalLeaderboard(game);
                         }

                         const colorClass = getGameColor(game);
                         
                         return (
                             <div key={game} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                                 <div className={`p-4 ${colorClass} bg-opacity-20 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3`}>
                                     <div className={`p-2 rounded-lg bg-white/50 text-slate-800`}>
                                         {getGameIcon(game)}
                                     </div>
                                     <span className="font-bold text-sm uppercase tracking-wide">{getGameLabel(game)}</span>
                                 </div>
                                 <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                     {scores.length > 0 ? (
                                         scores.map((s, idx) => (
                                             <div key={idx} className={`p-3 flex justify-between items-center text-sm ${idx === 0 ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                                 <div className="flex items-center gap-3">
                                                     <span className={`font-bold w-4 text-center ${idx===0?'text-amber-500':idx===1?'text-slate-400':idx===2?'text-orange-700':'text-slate-500'}`}>{idx+1}</span>
                                                     <span className={`font-medium truncate max-w-[120px] ${s.username === username || s.name === username ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                                                         {s.name || s.username} {s.username === username || s.name === username ? '(You)' : ''}
                                                     </span>
                                                 </div>
                                                 <span className="font-mono font-bold text-slate-800 dark:text-white">{s.score}<span className="text-xs text-slate-400 ml-1">{s.unit}</span></span>
                                             </div>
                                         ))
                                     ) : (
                                         <div className="p-4 text-center text-slate-400 text-sm italic">
                                             Belum ada data
                                         </div>
                                     )}
                                 </div>
                             </div>
                         );
                     })}
                </div>
            )}
        </div>
    );
};

const ActivityFeed: React.FC<{ history: TestHistoryItem[] }> = ({ history }) => {
    const benchmarkHistory = history
        .filter(item => item.category === 'BENCHMARK')
        .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20); 

    if (benchmarkHistory.length === 0) {
        return (
             <div className="mt-8 bg-white dark:bg-slate-800 rounded-3xl p-8 text-center border border-slate-200 dark:border-slate-700">
                <div className="inline-block p-4 bg-slate-100 dark:bg-slate-700 rounded-full mb-4">
                    <History size={32} className="text-slate-400"/>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Belum ada aktivitas</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Mainkan tes untuk melihat riwayat Anda di sini.</p>
            </div>
        );
    }

    return (
        <div className="mt-8 animate-fade-in-up">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <Activity size={18} className="text-indigo-500" /> Recent Activity
            </h3>
            
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                         <thead className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                            <tr>
                                <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Test</th>
                                <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Date</th>
                                <th className="p-3 sm:p-4 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider text-right">Score</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {benchmarkHistory.map((item) => {
                                const details = item.details as BenchmarkResultDetails | undefined;
                                if (!details) return null;
                                const gameType = details.game as BenchmarkMode;
                                const score = item.score;
                                const unit = details.unit || '';
                                const percentile = calculatePercentile(gameType, score);
                                
                                return (
                                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                        <td className="p-3 sm:p-4">
                                            <div className="flex items-center gap-2 sm:gap-4">
                                                <div className={`p-1.5 sm:p-2 rounded-lg sm:rounded-xl ${getGameColor(gameType)}`}>
                                                    {getGameIcon(gameType)}
                                                </div>
                                                <span className={`font-bold text-xs sm:text-sm ${getGameColor(gameType).split(' ')[0]}`}>
                                                    {getGameLabel(gameType)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 sm:p-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                                                    {new Date(item.date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                                                </span>
                                                 <span className="text-[9px] sm:text-[10px] text-slate-400">
                                                    {new Date(item.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-3 sm:p-4 text-right">
                                            <div className="flex flex-col items-end">
                                                <span className="text-sm sm:text-lg font-black text-slate-800 dark:text-white font-mono">
                                                    {score}{unit}
                                                </span>
                                                <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${percentile >= 50 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                                    Top {percentile}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const HangmanGame: React.FC<{ onFinish: (score: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const words = ['ALGORITHM', 'DATABASE', 'INTERFACE', 'VARIABLE', 'FUNCTION', 'COMPONENT', 'FRAMEWORK', 'BROWSER', 'SERVER', 'PYTHON', 'JAVASCRIPT', 'REACT', 'TYPESCRIPT', 'COMPILER', 'DEBUGGING'];
    const [word, setWord] = useState('');
    const [guessed, setGuessed] = useState<Set<string>>(new Set());
    const [mistakes, setMistakes] = useState(0);
    const [status, setStatus] = useState<'START' | 'PLAYING' | 'WON' | 'LOST'>('START');
    const [score, setScore] = useState(0);

    const startGame = () => {
        SoundManager.play('click');
        setWord(words[Math.floor(Math.random() * words.length)]);
        setGuessed(new Set());
        setMistakes(0);
        setScore(0);
        setStatus('PLAYING');
    };

    const handleGuess = (letter: string) => {
        if (status !== 'PLAYING' || guessed.has(letter)) return;
        
        const newGuessed = new Set(guessed);
        newGuessed.add(letter);
        setGuessed(newGuessed);

        if (!word.includes(letter)) {
            SoundManager.play('error');
            const newMistakes = mistakes + 1;
            setMistakes(newMistakes);
            if (newMistakes >= 6) {
                setStatus('LOST');
                setTimeout(() => onFinish(score), 2000);
            }
        } else {
            SoundManager.play('click');
            const isWon = word.split('').every(l => newGuessed.has(l));
            if (isWon) {
                setStatus('WON');
                SoundManager.play('success');
                const points = (word.length * 10) - (mistakes * 5);
                setScore(points);
                setTimeout(() => onFinish(points), 2000);
            }
        }
    };

    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    if (status === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-700 text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
                <Users size={64} className="mb-6 opacity-80" />
                <h2 className="text-4xl font-black mb-4">Hangman</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md">Tebak kata rahasia sebelum gambar orang tergantung sempurna. Hati-hati dengan tebakan Anda!</p>
                <button onClick={startGame} className="px-8 py-4 bg-white text-slate-700 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Mulai</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-800 flex flex-col items-center justify-center text-white p-4">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
            <div className="mb-8 relative w-48 h-48 border-b-4 border-white">
                {/* Hangman Drawing */}
                <div className="absolute bottom-0 left-1/4 w-1 h-48 bg-white"></div>
                <div className="absolute top-0 left-1/4 w-24 h-1 bg-white"></div>
                <div className="absolute top-0 left-[calc(25%+6rem)] w-1 h-8 bg-white"></div>
                
                {/* Body Parts */}
                {mistakes >= 1 && <div className="absolute top-8 left-[calc(25%+5rem)] w-8 h-8 rounded-full border-2 border-white"></div>} {/* Head */}
                {mistakes >= 2 && <div className="absolute top-16 left-[calc(25%+6rem)] w-1 h-12 bg-white -translate-x-1/2"></div>} {/* Body */}
                {mistakes >= 3 && <div className="absolute top-20 left-[calc(25%+6rem)] w-8 h-1 bg-white -translate-x-full rotate-[-30deg] origin-right"></div>} {/* L Arm */}
                {mistakes >= 4 && <div className="absolute top-20 left-[calc(25%+6rem)] w-8 h-1 bg-white rotate-[30deg] origin-left"></div>} {/* R Arm */}
                {mistakes >= 5 && <div className="absolute top-28 left-[calc(25%+6rem)] w-8 h-1 bg-white -translate-x-full rotate-[-45deg] origin-right"></div>} {/* L Leg */}
                {mistakes >= 6 && <div className="absolute top-28 left-[calc(25%+6rem)] w-8 h-1 bg-white rotate-[45deg] origin-left"></div>} {/* R Leg */}
            </div>

            <div className="text-4xl font-mono tracking-widest mb-12">
                {word.split('').map((char, i) => (
                    <span key={i} className="mx-2 border-b-2 border-slate-500 min-w-[30px] inline-block text-center">
                        {guessed.has(char) || status === 'LOST' ? char : ''}
                    </span>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-2 max-w-2xl">
                {alphabet.map(letter => (
                    <button
                        key={letter}
                        onClick={() => handleGuess(letter)}
                        disabled={guessed.has(letter) || status !== 'PLAYING'}
                        className={`w-10 h-10 rounded font-bold ${guessed.has(letter) ? 'bg-slate-700 text-slate-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                    >
                        {letter}
                    </button>
                ))}
            </div>

            {status !== 'PLAYING' && (
                <div className="mt-8 text-2xl font-bold animate-bounce">
                    {status === 'WON' ? 'YOU WON!' : 'GAME OVER'}
                </div>
            )}
        </div>
    );
};

const HotColdGame: React.FC<{ onFinish: (score: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [targetWord, setTargetWord] = useState('');
    const [guess, setGuess] = useState('');
    const [history, setHistory] = useState<{guess: string, score: number}[]>([]);
    const [status, setStatus] = useState<'START' | 'PLAYING' | 'WON'>('START');
    const [loading, setLoading] = useState(false);

    const startGame = () => {
        SoundManager.play('click');
        const targets = ['APPLE', 'OCEAN', 'MOUNTAIN', 'GUITAR', 'COMPUTER', 'TIGER', 'PLANET', 'COFFEE'];
        setTargetWord(targets[Math.floor(Math.random() * targets.length)]);
        setHistory([]);
        setGuess('');
        setStatus('PLAYING');
    };

    const handleGuess = async () => {
        if (!guess.trim()) return;
        setLoading(true);
        try {
            const res = await Gemini.calculateWordSimilarity(targetWord, guess);
            const newHistory = [...history, {guess: guess.toUpperCase(), score: res.score}].sort((a, b) => b.score - a.score);
            setHistory(newHistory);
            if (res.score === 100 || guess.toUpperCase() === targetWord) {
                setStatus('WON');
                SoundManager.play('success');
                setTimeout(() => onFinish(100 - (history.length * 5)), 2000); // Score based on attempts
            } else {
                SoundManager.play('click');
            }
        } catch (e) {
             // Fallback mock
             const score = Math.floor(Math.random() * 100);
             const newHistory = [...history, {guess: guess.toUpperCase(), score}].sort((a, b) => b.score - a.score);
             setHistory(newHistory);
             SoundManager.play('click');
        } finally {
            setLoading(false);
            setGuess('');
        }
    };

    if (status === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-rose-500 text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
                <TrendingUp size={64} className="mb-6 opacity-80" />
                <h2 className="text-4xl font-black mb-4">Hot & Cold</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md">Tebak kata rahasia berdasarkan kedekatan makna. Semakin tinggi persentase, semakin dekat tebakan Anda!</p>
                <button onClick={startGame} className="px-8 py-4 bg-white text-rose-500 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Mulai</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center text-white p-4">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
            <h2 className="text-3xl font-bold mb-2">Hot & Cold Word</h2>
            <p className="text-slate-400 mb-8">Guess the secret word. Higher % means closer meaning.</p>

            {status === 'PLAYING' ? (
                <div className="flex gap-2 w-full max-w-md mb-8">
                    <input 
                        type="text" 
                        value={guess} 
                        onChange={e => setGuess(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleGuess()}
                        className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Type a word..."
                        disabled={loading}
                    />
                    <button 
                        onClick={handleGuess} 
                        disabled={loading || !guess}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 rounded-xl font-bold disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin"/> : 'Guess'}
                    </button>
                </div>
            ) : (
                <div className="text-center animate-bounce mb-8">
                    <div className="text-4xl font-bold text-emerald-500 mb-2">FOUND IT!</div>
                    <div className="text-xl">The word was {targetWord}</div>
                </div>
            )}

            <div className="w-full max-w-md space-y-4 mb-8">
                {history.map((h, i) => (
                    <div key={i} className="flex justify-between items-center bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <span className="font-bold">{h.guess}</span>
                        <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${h.score > 70 ? 'bg-emerald-500' : h.score > 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{width: `${h.score}%`}}></div>
                            </div>
                            <span className="font-mono">{h.score}%</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD ---
const NumberRangeGame: React.FC<{ onFinish: (score: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [state, setState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
    const [range, setRange] = useState<number>(100);
    const [target, setTarget] = useState<number>(0);
    const [attempts, setAttempts] = useState<number>(0);
    const [guess, setGuess] = useState<string>('');
    const [feedback, setFeedback] = useState<string>('');
    const [minGuess, setMinGuess] = useState<number>(1);
    const [maxGuess, setMaxGuess] = useState<number>(100);

    const startGame = (r: number) => {
        SoundManager.play('click');
        setRange(r);
        setTarget(Math.floor(Math.random() * r) + 1);
        setAttempts(0);
        setGuess('');
        setFeedback('');
        setMinGuess(1);
        setMaxGuess(r);
        setState('PLAYING');
    };

    const handleGuess = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const num = parseInt(guess);
        if (isNaN(num)) return;
        
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (num === target) {
            setFeedback('Benar!');
            SoundManager.play('success');
            setState('GAMEOVER');
            setTimeout(() => onFinish(newAttempts), 1500);
        } else if (num < target) {
            setFeedback(`Lebih besar dari ${num}`);
            setMinGuess(prev => Math.max(prev, num + 1));
            SoundManager.play('click');
            setGuess('');
        } else {
            setFeedback(`Lebih kecil dari ${num}`);
            setMaxGuess(prev => Math.min(prev, num - 1));
            SoundManager.play('click');
            setGuess('');
        }
    };

    if (state === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-cyan-600 text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
                <Search size={64} className="mb-6 opacity-80" />
                <h2 className="text-4xl font-black mb-4">Number Range</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md">Tebak angka rahasia. Semakin sedikit percobaan, semakin baik skor Anda.</p>
                <div className="flex flex-col gap-4 w-full max-w-xs">
                    <button onClick={() => startGame(10)} className="px-8 py-4 bg-white text-cyan-600 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">1 - 10</button>
                    <button onClick={() => startGame(100)} className="px-8 py-4 bg-white text-cyan-600 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">1 - 100</button>
                    <button onClick={() => startGame(1000)} className="px-8 py-4 bg-white text-cyan-600 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">1 - 1000</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-cyan-600 text-white">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
            <h2 className="text-2xl font-bold mb-2">Tebak Angka</h2>
            <div className="text-lg opacity-80 mb-6">Percobaan: {attempts}</div>
            
            {state === 'PLAYING' ? (
                <div className="flex flex-col items-center w-full max-w-sm">
                    <div className="text-xl font-bold bg-white/20 px-6 py-3 rounded-xl mb-8 w-full">
                        Rentang: {minGuess} - {maxGuess}
                    </div>
                    <form onSubmit={handleGuess} className="flex flex-col items-center gap-6 w-full">
                        <input 
                            type="text" 
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={guess} 
                            onChange={(e) => {
                                setGuess(e.target.value);
                                if (e.target.value) SoundManager.play('click');
                            }} 
                            className="w-full text-center text-4xl p-4 rounded-2xl text-slate-800 font-bold outline-none focus:ring-4 focus:ring-cyan-300"
                            autoFocus
                            placeholder="?"
                        />
                        <button type="submit" className="w-full px-8 py-4 bg-white text-cyan-600 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Tebak</button>
                        {feedback && <div className="text-2xl font-bold mt-4 animate-bounce">{feedback}</div>}
                    </form>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-6xl font-black mb-2">{target}</div>
                    <div className="text-2xl font-bold text-emerald-300">Benar!</div>
                    <div className="text-xl">Diselesaikan dalam {attempts} percobaan</div>
                </div>
            )}
        </div>
    );
};

const PositionMemoryGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [state, setState] = useState<'START' | 'MEMORIZE' | 'RECALL' | 'GAMEOVER'>('START');
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [gridSize, setGridSize] = useState(3);
    const [blocks, setBlocks] = useState<{id: number, color: string, index: number}[]>([]);
    const [placedBlocks, setPlacedBlocks] = useState<Record<number, string>>({});
    const [selectedColor, setSelectedColor] = useState<string | null>(null);
    const [wrongCells, setWrongCells] = useState<number[]>([]);
    const [progress, setProgress] = useState(100);
    const [memorizeTime, setMemorizeTime] = useState(2500);

    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];

    const startLevel = (lvl: number, currentLives: number) => {
        SoundManager.play('click');
        const size = Math.min(5, 2 + Math.floor(lvl / 3)); // 3x3, 4x4, 5x5
        setGridSize(size);
        const numBlocks = Math.min(size * size - 1, lvl + 2);
        
        const newBlocks: {id: number, color: string, index: number}[] = [];
        const usedIndices = new Set<number>();
        
        for (let i = 0; i < numBlocks; i++) {
            let idx;
            do {
                idx = Math.floor(Math.random() * (size * size));
            } while (usedIndices.has(idx));
            usedIndices.add(idx);
            
            newBlocks.push({
                id: i,
                color: colors[i % colors.length],
                index: idx
            });
        }
        
        const time = 2000 + (lvl * 500);
        setMemorizeTime(time);
        setProgress(100);

        setBlocks(newBlocks);
        setPlacedBlocks({});
        setWrongCells([]);
        setSelectedColor(null);
        setLevel(lvl);
        setLives(currentLives);
        setState('MEMORIZE');
        
        setTimeout(() => {
            setProgress(0);
        }, 50);

        setTimeout(() => {
            setState('RECALL');
        }, time);
    };

    const handleCellClick = (idx: number) => {
        if (state !== 'RECALL' || !selectedColor) return;
        if (placedBlocks[idx]) return; 
        
        const correctBlock = blocks.find(b => b.index === idx && b.color === selectedColor);
        if (correctBlock) {
            SoundManager.play('success');
            const newPlaced = { ...placedBlocks, [idx]: selectedColor };
            setPlacedBlocks(newPlaced);
            
            if (Object.keys(newPlaced).length === blocks.length) {
                setTimeout(() => startLevel(level + 1, lives), 1000);
            }
        } else {
            SoundManager.play('error');
            setWrongCells([...wrongCells, idx]);
            setTimeout(() => setWrongCells(prev => prev.filter(i => i !== idx)), 500);
            
            const newLives = lives - 1;
            setLives(newLives);
            if (newLives <= 0) {
                setState('GAMEOVER');
                setTimeout(() => onFinish(level), 1500);
            }
        }
    };

    if (state === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-fuchsia-600 text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
                <MapPin size={64} className="mb-6 opacity-80" />
                <h2 className="text-4xl font-black mb-4">Position Memory</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md">Hafalkan posisi dan warna blok. Susun kembali blok sesuai ingatan Anda. Anda memiliki 3 nyawa.</p>
                <button onClick={() => startLevel(1, 3)} className="px-8 py-4 bg-white text-fuchsia-600 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Mulai</button>
            </div>
        );
    }

    const availableColors = Array.from(new Set(blocks.map(b => b.color)));

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-fuchsia-600 text-white">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
            <div className="flex justify-between w-full max-w-md mb-4">
                <div className="text-xl font-bold">Level {level}</div>
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <Heart key={i} size={24} className={i < lives ? 'text-rose-400 fill-rose-400' : 'text-white/20'} />
                    ))}
                </div>
            </div>

            <div className="w-full max-w-md mb-8 h-10">
                {state === 'MEMORIZE' && (
                    <div className="animate-fade-in">
                        <div className="text-sm font-bold mb-2 text-white/80">Waktu Menghafal</div>
                        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-white rounded-full"
                                style={{ 
                                    width: `${progress}%`, 
                                    transition: progress === 100 ? 'none' : `width ${memorizeTime}ms linear` 
                                }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div 
                className="grid gap-2 mb-8 bg-slate-900/40 p-4 rounded-2xl shadow-2xl" 
                style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))` }}
            >
                {[...Array(gridSize * gridSize)].map((_, i) => {
                    const block = blocks.find(b => b.index === i);
                    const isPlaced = placedBlocks[i];
                    const isWrong = wrongCells.includes(i);
                    
                    let cellColor = 'bg-slate-800 border-2 border-white/10';
                    if (state === 'MEMORIZE' && block) {
                        cellColor = `${block.color} border-2 border-white/40 shadow-lg`;
                    } else if (state === 'RECALL' && isPlaced) {
                        cellColor = `${isPlaced} border-2 border-white/40`;
                    } else if (isWrong) {
                        cellColor = 'bg-rose-500 border-2 border-rose-300 animate-pulse';
                    }

                    return (
                        <div 
                            key={i} 
                            onClick={() => handleCellClick(i)}
                            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl transition-all duration-300 ${cellColor} ${state === 'RECALL' && !isPlaced && selectedColor ? 'cursor-pointer hover:bg-white/20 hover:border-white/40' : ''}`}
                        />
                    );
                })}
            </div>

            {state === 'RECALL' && (
                <div className="flex flex-col items-center gap-4">
                    <div className="text-lg font-medium">Pilih warna dan klik posisinya:</div>
                    <div className="flex gap-4">
                        {availableColors.map(color => {
                            const totalOfColor = blocks.filter(b => b.color === color).length;
                            const placedOfColor = Object.values(placedBlocks).filter(c => c === color).length;
                            if (totalOfColor === placedOfColor) return null;

                            return (
                                <button 
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`w-12 h-12 rounded-full ${color} ${selectedColor === color ? 'ring-4 ring-white scale-110' : 'opacity-80 hover:opacity-100'} transition-all`}
                                />
                            );
                        })}
                    </div>
                </div>
            )}

            {state === 'GAMEOVER' && (
                <div className="text-3xl font-black mt-8 animate-bounce">Game Over!</div>
            )}
        </div>
    );
};

const PatternBreakerGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [state, setState] = useState<'START' | 'PLAYING' | 'FEEDBACK' | 'GAMEOVER'>('START');
    const [patternData, setPatternData] = useState<{seq: number[], ans: number, opts: number[], desc: string} | null>(null);
    const [timeLeft, setTimeLeft] = useState(100);
    const [selectedOpt, setSelectedOpt] = useState<number | null>(null);

    const generatePattern = (lvl: number) => {
        let seq: number[] = [];
        let desc = "";
        const start = Math.floor(Math.random() * 10) + 1;
        seq.push(start);

        if (lvl <= 3) {
            const add = Math.floor(Math.random() * 5) + 2;
            for(let i=1; i<6; i++) seq.push(seq[i-1] + add);
            desc = `Ditambah ${add} setiap langkah`;
        } else if (lvl <= 6) {
            const mul = Math.floor(Math.random() * 3) + 2;
            for(let i=1; i<6; i++) seq.push(seq[i-1] * mul);
            desc = `Dikalikan ${mul} setiap langkah`;
        } else if (lvl <= 10) {
            const op1 = Math.floor(Math.random() * 3) + 2;
            const op2 = Math.floor(Math.random() * 5) + 1;
            for(let i=1; i<6; i++) {
                if (i % 2 !== 0) seq.push(seq[i-1] * op1);
                else seq.push(seq[i-1] + op2);
            }
            desc = `Bergantian: dikali ${op1}, lalu ditambah ${op2}`;
        } else {
            if (Math.random() > 0.5) {
                seq = [start, start + Math.floor(Math.random() * 3) + 1];
                for(let i=2; i<6; i++) seq.push(seq[i-1] + seq[i-2]);
                desc = `Deret Fibonacci (penjumlahan 2 angka sebelumnya)`;
            } else {
                const base = Math.floor(Math.random() * 5) + 1;
                seq = [];
                for(let i=0; i<6; i++) seq.push(Math.pow(base + i, 2));
                desc = `Kuadrat dari bilangan berurutan mulai dari ${base}`;
            }
        }

        const ans = seq.pop()!;
        const opts = [ans];
        while(opts.length < 4) {
            const wrong = ans + Math.floor(Math.random() * 20) - 10;
            if (!opts.includes(wrong) && wrong > 0) opts.push(wrong);
        }
        return { seq, ans, opts: opts.sort(() => Math.random() - 0.5), desc };
    };

    const startLevel = (lvl: number, currentLives: number) => {
        SoundManager.play('click');
        setLevel(lvl);
        setLives(currentLives);
        setPatternData(generatePattern(lvl));
        setSelectedOpt(null);
        setTimeLeft(100);
        setState('PLAYING');
    };

    useEffect(() => {
        if (state !== 'PLAYING') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleWrong(null);
                    return 0;
                }
                return prev - (1 + level * 0.1); // gets faster
            });
        }, 100);
        return () => clearInterval(timer);
    }, [state, level]);

    const handleWrong = (opt: number | null) => {
        SoundManager.play('error');
        setSelectedOpt(opt);
        setState('FEEDBACK');
        const newLives = lives - 1;
        setLives(newLives);
        setTimeout(() => {
            if (newLives <= 0) {
                setState('GAMEOVER');
                setTimeout(() => onFinish(level), 1500);
            } else {
                startLevel(level, newLives);
            }
        }, 3000);
    };

    const handleAnswer = (opt: number) => {
        if (state !== 'PLAYING' || !patternData) return;
        if (opt === patternData.ans) {
            SoundManager.play('success');
            setSelectedOpt(opt);
            setState('FEEDBACK');
            setTimeout(() => {
                startLevel(level + 1, lives);
            }, 1500);
        } else {
            handleWrong(opt);
        }
    };

    if (state === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-indigo-900 text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
                <Brain size={64} className="mb-6 opacity-80 text-indigo-300" />
                <h2 className="text-4xl font-black mb-4">Pattern Breaker</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md">Temukan pola dari deret angka dan tebak angka selanjutnya. Waktu Anda terbatas!</p>
                <button onClick={() => startLevel(1, 3)} className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Mulai</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-indigo-900 text-white">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
            
            <div className="flex justify-between w-full max-w-md mb-4">
                <div className="text-xl font-bold">Level {level}</div>
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <Heart key={i} size={24} className={i < lives ? 'text-rose-400 fill-rose-400' : 'text-white/20'} />
                    ))}
                </div>
            </div>

            <div className="w-full max-w-md mb-8 h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-400 transition-all duration-100" style={{ width: `${timeLeft}%` }} />
            </div>

            {patternData && (
                <div className="w-full max-w-md">
                    <div className="flex flex-wrap justify-center gap-4 mb-12 text-4xl font-black tracking-widest">
                        {patternData.seq.map((n, i) => (
                            <span key={i} className="bg-white/10 px-4 py-2 rounded-xl">{n}</span>
                        ))}
                        <span className="bg-indigo-500/50 px-4 py-2 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-200">?</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {patternData.opts.map((opt, i) => {
                            let btnClass = "bg-white/10 hover:bg-white/20 border-2 border-transparent";
                            if (state === 'FEEDBACK') {
                                if (opt === patternData.ans) btnClass = "bg-emerald-500 border-emerald-400";
                                else if (opt === selectedOpt) btnClass = "bg-rose-500 border-rose-400";
                                else btnClass = "bg-white/5 opacity-50";
                            }
                            return (
                                <button 
                                    key={i} 
                                    onClick={() => handleAnswer(opt)}
                                    disabled={state !== 'PLAYING'}
                                    className={`py-6 rounded-2xl text-2xl font-bold transition-all ${btnClass}`}
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>

                    {state === 'FEEDBACK' && (
                        <div className="mt-8 p-4 bg-black/30 rounded-xl animate-fade-in-up">
                            <div className="text-sm text-indigo-300 uppercase font-bold tracking-wider mb-1">Penjelasan Pola</div>
                            <div className="text-lg">{patternData.desc}</div>
                        </div>
                    )}
                </div>
            )}

            {state === 'GAMEOVER' && (
                <div className="absolute inset-0 z-10 bg-indigo-900/90 flex items-center justify-center backdrop-blur-sm">
                    <div className="text-5xl font-black animate-bounce text-rose-400">Game Over!</div>
                </div>
            )}
        </div>
    );
};

const ReverseThinkingGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [status, setStatus] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [target, setTarget] = useState(0);
    const [equations, setEquations] = useState<{text: string, value: number, isCorrect: boolean, selected: boolean}[]>([]);
    const [timeLeft, setTimeLeft] = useState(100);
    const [correctNeeded, setCorrectNeeded] = useState(0);
    const [correctFound, setCorrectFound] = useState(0);

    const generateLevel = (currentLevel: number) => {
        let newTarget = 0;
        let numEquations = 4;
        let numCorrect = 2;
        let ops = ['+', '-'];

        if (currentLevel < 3) {
            newTarget = Math.floor(Math.random() * 20) + 10;
            numEquations = 4;
            numCorrect = 2;
        } else if (currentLevel < 6) {
            newTarget = Math.floor(Math.random() * 40) + 20;
            numEquations = 6;
            numCorrect = 3;
            ops = ['+', '-', '*'];
        } else if (currentLevel < 10) {
            newTarget = Math.floor(Math.random() * 80) + 30;
            numEquations = 9;
            numCorrect = 4;
            ops = ['+', '-', '*', '/'];
        } else {
            newTarget = Math.floor(Math.random() * 150) + 50;
            numEquations = 12;
            numCorrect = 5;
            ops = ['+', '-', '*', '/'];
        }

        setTarget(newTarget);
        setCorrectNeeded(numCorrect);
        setCorrectFound(0);

        const newEquations = [];
        for (let i = 0; i < numEquations; i++) {
            const isCorrect = i < numCorrect;
            let a = 0, b = 0, op = '+', val = 0;
            let attempts = 0;
            do {
                op = ops[Math.floor(Math.random() * ops.length)];
                if (isCorrect) {
                    if (op === '+') { a = Math.floor(Math.random() * newTarget); b = newTarget - a; }
                    else if (op === '-') { b = Math.floor(Math.random() * 20) + 1; a = newTarget + b; }
                    else if (op === '*') {
                        const factors = [];
                        for (let j = 1; j <= newTarget; j++) { if (newTarget % j === 0) factors.push(j); }
                        a = factors[Math.floor(Math.random() * factors.length)];
                        b = newTarget / a;
                    }
                    else if (op === '/') { b = Math.floor(Math.random() * 10) + 2; a = newTarget * b; }
                    val = newTarget;
                } else {
                    a = Math.floor(Math.random() * (newTarget + 20)) + 1;
                    b = Math.floor(Math.random() * 20) + 1;
                    if (op === '/') { a = b * (Math.floor(Math.random() * 10) + 1); }
                    if (op === '+') val = a + b;
                    else if (op === '-') val = a - b;
                    else if (op === '*') val = a * b;
                    else if (op === '/') val = a / b;
                }
                attempts++;
            } while ((!isCorrect && val === newTarget) && attempts < 50);

            newEquations.push({ text: `${a} ${op} ${b}`, value: val, isCorrect, selected: false });
        }

        // Shuffle
        for (let i = newEquations.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newEquations[i], newEquations[j]] = [newEquations[j], newEquations[i]];
        }

        setEquations(newEquations);
        setTimeLeft(100);
    };

    const startGame = () => {
        setStatus('PLAYING');
        setLevel(1);
        setLives(3);
        generateLevel(1);
    };

    useEffect(() => {
        if (status !== 'PLAYING') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) return 0;
                return prev - (0.1 + level * 0.015);
            });
        }, 50);
        return () => clearInterval(timer);
    }, [status, level]);

    useEffect(() => {
        if (timeLeft <= 0 && status === 'PLAYING') {
            SoundManager.play('error');
            if (lives <= 1) {
                setLives(0);
                setStatus('GAMEOVER');
            } else {
                setLives(l => l - 1);
                generateLevel(level);
            }
        }
    }, [timeLeft, status, lives, level]);

    const handleEquationClick = (index: number) => {
        if (status !== 'PLAYING' || equations[index].selected) return;

        const eq = equations[index];
        const newEqs = [...equations];
        newEqs[index].selected = true;
        setEquations(newEqs);

        if (eq.isCorrect) {
            SoundManager.play('success');
            const newFound = correctFound + 1;
            setCorrectFound(newFound);
            if (newFound >= correctNeeded) {
                setTimeout(() => {
                    setLevel(l => l + 1);
                    generateLevel(level + 1);
                }, 500);
            }
        } else {
            SoundManager.play('error');
            if (lives <= 1) {
                setLives(0);
                setStatus('GAMEOVER');
            } else {
                setLives(l => l - 1);
            }
        }
    };

    if (status === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900/95 backdrop-blur-sm text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60] hover:bg-white/20 transition-colors"><ArrowLeft size={24}/></button>
                <RefreshCw size={80} className="mb-6 opacity-80 text-violet-400" />
                <h2 className="text-4xl font-black mb-4">Reverse Thinking</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md text-slate-300">Diberikan sebuah jawaban, temukan semua persamaan yang menghasilkan jawaban tersebut. Hati-hati, memilih persamaan yang salah akan mengurangi nyawa!</p>
                <button onClick={startGame} className="px-8 py-4 bg-violet-500 text-white rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Mulai Game</button>
            </div>
        );
    }

    if (status === 'GAMEOVER') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900/95 backdrop-blur-sm text-white">
                <div className="bg-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full border border-slate-700">
                    <RefreshCw size={64} className="mx-auto mb-6 text-violet-500" />
                    <h2 className="text-3xl font-bold mb-2">Game Over</h2>
                    <p className="text-slate-400 mb-6">Level: <span className="text-white font-bold text-xl">{level}</span></p>
                    <div className="space-y-3">
                        <button onClick={startGame} className="w-full py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-bold transition-colors">Coba Lagi</button>
                        <button onClick={() => onFinish(level)} className="w-full py-3 border border-slate-600 hover:bg-slate-700 rounded-xl font-bold transition-colors">Simpan Skor</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-violet-900 text-white">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60] hover:bg-white/20 transition-colors"><ArrowLeft size={24}/></button>
            
            <div className="flex justify-between w-full max-w-2xl mb-4">
                <div className="text-xl font-bold">Level {level}</div>
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <Heart key={i} size={24} className={i < lives ? "text-rose-400 fill-rose-400" : "text-white/20"} />
                    ))}
                </div>
            </div>

            <div className="w-full max-w-2xl h-2 bg-white/20 rounded-full mb-8 overflow-hidden">
                <div className="h-full bg-white transition-all duration-75" style={{ width: `${timeLeft}%` }} />
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl">
                <div className="text-2xl text-white/80 mb-2">Target Jawaban:</div>
                <div className="text-6xl font-black text-white mb-4">{target}</div>
                <div className="text-sm text-white/80 mb-8">
                    Temukan {correctNeeded - correctFound} persamaan lagi
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full">
                    {equations.map((eq, i) => (
                        <button
                            key={i}
                            onClick={() => handleEquationClick(i)}
                            disabled={eq.selected}
                            className={`p-6 rounded-xl text-2xl font-bold transition-all ${
                                eq.selected 
                                    ? eq.isCorrect 
                                        ? 'bg-emerald-500 text-white scale-95' 
                                        : 'bg-rose-500 text-white scale-95'
                                    : 'bg-white/10 text-white hover:bg-white/20 shadow-sm border-2 border-white/20'
                            }`}
                        >
                            {eq.text}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

const LogicMazeGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [status, setStatus] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
    const [level, setLevel] = useState(1);
    const [lives, setLives] = useState(3);
    const [grid, setGrid] = useState<{val: number, color: string}[][]>([]);
    const [path, setPath] = useState<{x: number, y: number}[]>([]);
    const [ruleText, setRuleText] = useState("");
    const [ruleType, setRuleType] = useState(0);
    const [timeLeft, setTimeLeft] = useState(100);

    const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

    const generateMaze = (currentLevel: number) => {
        const size = Math.min(4 + Math.floor((currentLevel - 1) / 2), 7);
        const rType = (currentLevel - 1) % 5;
        setRuleType(rType);

        switch(rType) {
            case 0: setRuleText("Hanya injak angka GENAP"); break;
            case 1: setRuleText("Hanya injak angka GANJIL"); break;
            case 2: setRuleText("Selang-seling GENAP dan GANJIL"); break;
            case 3: setRuleText("Angka harus MAKIN BESAR"); break;
            case 4: setRuleText("Warna TIDAK BOLEH sama berurutan"); break;
        }

        const newPath = [{x: 0, y: 0}];
        let cx = 0, cy = 0;
        while (cx < size - 1 || cy < size - 1) {
            if (cx === size - 1) cy++;
            else if (cy === size - 1) cx++;
            else {
                if (Math.random() > 0.5) cx++; else cy++;
            }
            newPath.push({x: cx, y: cy});
        }

        const newGrid = Array(size).fill(0).map(() => Array(size).fill(null));
        let lastVal = 0;
        let lastColor = '';

        for (let i = 0; i < newPath.length; i++) {
            const p = newPath[i];
            let val = 0;
            let color = colors[Math.floor(Math.random() * colors.length)];

            if (rType === 0) val = Math.floor(Math.random() * 49) * 2 + 2;
            else if (rType === 1) val = Math.floor(Math.random() * 50) * 2 + 1;
            else if (rType === 2) val = (i % 2 === 0) ? Math.floor(Math.random() * 49) * 2 + 2 : Math.floor(Math.random() * 50) * 2 + 1;
            else if (rType === 3) { val = lastVal + Math.floor(Math.random() * 5) + 1; lastVal = val; }
            else if (rType === 4) {
                val = Math.floor(Math.random() * 99) + 1;
                let availableColors = colors.filter(c => c !== lastColor);
                color = availableColors[Math.floor(Math.random() * availableColors.length)];
                lastColor = color;
            }
            newGrid[p.y][p.x] = { val, color };
        }

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (!newGrid[y][x]) {
                    newGrid[y][x] = {
                        val: Math.floor(Math.random() * 99) + 1,
                        color: colors[Math.floor(Math.random() * colors.length)]
                    };
                }
            }
        }

        setGrid(newGrid);
        setPath([{x: 0, y: 0}]);
        setTimeLeft(100);
    };

    const startGame = () => {
        setStatus('PLAYING');
        setLevel(1);
        setLives(3);
        generateMaze(1);
    };

    useEffect(() => {
        if (status !== 'PLAYING') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 0) return 0;
                return prev - (0.1 + level * 0.015);
            });
        }, 50);
        return () => clearInterval(timer);
    }, [status, level]);

    useEffect(() => {
        if (timeLeft <= 0 && status === 'PLAYING') {
            SoundManager.play('error');
            if (lives <= 1) {
                setLives(0);
                setStatus('GAMEOVER');
            } else {
                setLives(l => l - 1);
                generateMaze(level);
            }
        }
    }, [timeLeft, status, lives, level]);

    const handleCellClick = (x: number, y: number) => {
        if (status !== 'PLAYING') return;

        const currentPos = path[path.length - 1];
        const isAdjacent = Math.abs(currentPos.x - x) + Math.abs(currentPos.y - y) === 1;
        
        // Allow backtracking
        if (path.length > 1 && path[path.length - 2].x === x && path[path.length - 2].y === y) {
            setPath(path.slice(0, -1));
            SoundManager.play('click');
            return;
        }

        if (!isAdjacent) {
            // Give feedback that the cell is not adjacent
            SoundManager.play('error');
            return;
        }
        if (path.some(p => p.x === x && p.y === y)) {
            SoundManager.play('error');
            return; // Cannot revisit except backtracking
        }

        const newCell = grid[y][x];
        const prevCell = grid[currentPos.y][currentPos.x];
        let isValid = true;

        if (ruleType === 0) isValid = newCell.val % 2 === 0;
        else if (ruleType === 1) isValid = newCell.val % 2 !== 0;
        else if (ruleType === 2) isValid = (prevCell.val % 2) !== (newCell.val % 2);
        else if (ruleType === 3) isValid = newCell.val > prevCell.val;
        else if (ruleType === 4) isValid = newCell.color !== prevCell.color;

        if (isValid) {
            SoundManager.play('click');
            const newPath = [...path, {x, y}];
            setPath(newPath);

            if (x === grid[0].length - 1 && y === grid.length - 1) {
                SoundManager.play('success');
                setTimeout(() => {
                    setLevel(l => l + 1);
                    generateMaze(level + 1);
                }, 500);
            }
        } else {
            SoundManager.play('error');
            if (lives <= 1) {
                setLives(0);
                setStatus('GAMEOVER');
            } else {
                setLives(l => l - 1);
                // Removed generateMaze(level) to prevent double life reduction and disorientation
            }
        }
    };

    if (status === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900/95 backdrop-blur-sm text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60] hover:bg-white/20 transition-colors"><ArrowLeft size={24}/></button>
                <Route size={80} className="mb-6 opacity-80 text-amber-400" />
                <h2 className="text-4xl font-black mb-4">Logic Maze</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md text-slate-300">Jelajahi labirin dari kiri atas ke kanan bawah. Setiap langkah harus mematuhi aturan logika yang diberikan. Aturan akan berubah setiap level!</p>
                <button onClick={startGame} className="px-8 py-4 bg-amber-500 text-white rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Mulai Game</button>
            </div>
        );
    }

    if (status === 'GAMEOVER') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900/95 backdrop-blur-sm text-white">
                <div className="bg-slate-800 p-8 rounded-3xl text-center shadow-2xl max-w-sm w-full border border-slate-700">
                    <Route size={64} className="mx-auto mb-6 text-amber-500" />
                    <h2 className="text-3xl font-bold mb-2">Game Over</h2>
                    <p className="text-slate-400 mb-6">Level: <span className="text-white font-bold text-xl">{level}</span></p>
                    <div className="space-y-3">
                        <button onClick={startGame} className="w-full py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-bold transition-colors">Coba Lagi</button>
                        <button onClick={() => onFinish(level)} className="w-full py-3 border border-slate-600 hover:bg-slate-700 rounded-xl font-bold transition-colors">Simpan Skor</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-amber-900 text-white">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60] hover:bg-white/20 transition-colors"><ArrowLeft size={24}/></button>
            
            <div className="flex justify-between w-full max-w-2xl mb-4">
                <div className="text-xl font-bold">Level {level}</div>
                <div className="flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <Heart key={i} size={24} className={i < lives ? "text-rose-400 fill-rose-400" : "text-white/20"} />
                    ))}
                </div>
            </div>

            <div className="w-full max-w-2xl h-2 bg-white/20 rounded-full mb-6 overflow-hidden">
                <div className="h-full bg-amber-400 transition-all duration-75" style={{ width: `${timeLeft}%` }} />
            </div>

            <div className="text-center mb-6">
                <div className="text-sm text-white/80 mb-1">Aturan Level Ini:</div>
                <div className="text-xl font-bold text-amber-900 bg-amber-400 py-2 px-4 rounded-lg inline-block">
                    {ruleText}
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center w-full max-w-2xl">
                <div 
                    className="grid gap-2" 
                    style={{ gridTemplateColumns: `repeat(${grid.length}, minmax(0, 1fr))` }}
                >
                    {grid.map((row, y) => row.map((cell, x) => {
                        const isPath = path.some(p => p.x === x && p.y === y);
                        const isCurrent = path[path.length - 1].x === x && path[path.length - 1].y === y;
                        const isEnd = x === grid.length - 1 && y === grid.length - 1;
                        const isStart = x === 0 && y === 0;
                        
                        const currentPos = path[path.length - 1];
                        const isAdjacent = Math.abs(currentPos.x - x) + Math.abs(currentPos.y - y) === 1;

                        return (
                            <button
                                key={`${x}-${y}`}
                                onClick={() => handleCellClick(x, y)}
                                className={`
                                    relative w-12 h-12 sm:w-16 sm:h-16 rounded-lg flex items-center justify-center text-lg sm:text-2xl font-bold text-white shadow-sm transition-all
                                    ${cell.color}
                                    ${isPath ? 'ring-4 ring-white scale-95 opacity-100' : 'opacity-80 hover:opacity-100 hover:scale-105'}
                                    ${isCurrent ? 'ring-4 ring-amber-400 animate-pulse' : ''}
                                    ${isAdjacent && !isPath ? 'ring-2 ring-white/50' : ''}
                                `}
                            >
                                {cell.val}
                                {isStart && <span className="absolute -top-2 -left-2 bg-slate-900 text-white p-0.5 rounded shadow-md"><Play size={10} className="fill-white"/></span>}
                                {isEnd && <span className="absolute -bottom-2 -right-2 bg-slate-900 text-white p-0.5 rounded shadow-md"><Flag size={10} className="fill-white"/></span>}
                            </button>
                        );
                    }))}
                </div>
            </div>
        </div>
    );
};

const DecisionLabGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [level, setLevel] = useState(1);
    const [score, setScore] = useState(0);
    const [state, setState] = useState<'START' | 'PLAYING' | 'FEEDBACK' | 'GAMEOVER'>('START');
    const [timeLeft, setTimeLeft] = useState(100);
    const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
    const [shuffledScenarios, setShuffledScenarios] = useState<any[]>([]);

    const allScenarios = [
        {
            text: "Perusahaan Anda mengalami penurunan profit bulan ini. Apa tindakan pertama Anda?",
            options: [
                { text: "Memotong gaji karyawan 20%", score: -1, feedback: "Moral karyawan hancur, produktivitas makin turun." },
                { text: "Menganalisis laporan keuangan untuk mencari kebocoran", score: 1, feedback: "Tepat. Analisis akar masalah sebelum bertindak." },
                { text: "Menaikkan harga produk secara drastis", score: -1, feedback: "Pelanggan lari ke kompetitor karena harga tiba-tiba naik." }
            ]
        },
        {
            text: "Tim Anda kelelahan karena lembur beruntun. Proyek penting harus selesai minggu depan.",
            options: [
                { text: "Paksa mereka lembur dengan ancaman potong gaji", score: -1, feedback: "Tim resign massal. Proyek gagal total." },
                { text: "Beri bonus lembur dan rotasi shift agar ada waktu istirahat", score: 1, feedback: "Keseimbangan yang baik. Proyek selesai dan tim tetap loyal." },
                { text: "Tunda proyek sebulan penuh", score: -1, feedback: "Klien marah besar dan membatalkan kontrak." }
            ]
        },
        {
            text: "Ada teknologi AI baru yang bisa menggantikan 30% pekerjaan tim Anda dengan biaya lebih murah.",
            options: [
                { text: "Langsung pecat 30% tim dan pakai AI", score: -1, feedback: "Reputasi perusahaan hancur, sisa tim kehilangan motivasi." },
                { text: "Abaikan AI, pertahankan cara tradisional", score: -1, feedback: "Perusahaan tertinggal oleh kompetitor yang lebih efisien." },
                { text: "Gunakan AI untuk efisiensi, dan latih ulang tim untuk peran baru", score: 1, feedback: "Langkah strategis! Efisiensi naik tanpa mengorbankan SDM." }
            ]
        },
        {
            text: "Anda mendapat tawaran investasi besar, tapi investor ingin kontrol penuh atas keputusan produk.",
            options: [
                { text: "Terima saja demi uang cepat", score: -1, feedback: "Visi awal Anda hancur karena investor mengubah arah produk." },
                { text: "Tolak mentah-mentah", score: 0, feedback: "Aman, tapi Anda kehilangan kesempatan berkembang cepat." },
                { text: "Negosiasi ulang pembagian kontrol yang lebih adil", score: 1, feedback: "Keputusan bijak. Win-win solution tercapai." }
            ]
        },
        {
            text: "Kompetitor meluncurkan fitur yang mirip dengan produk andalan Anda, tapi lebih murah.",
            options: [
                { text: "Turunkan harga lebih murah lagi (perang harga)", score: -1, feedback: "Margin profit hancur, perusahaan bangkrut perlahan." },
                { text: "Fokus pada kualitas layanan pelanggan dan nilai tambah unik", score: 1, feedback: "Pelanggan setia tetap bertahan karena kualitas." },
                { text: "Tuntut kompetitor tanpa bukti kuat", score: -1, feedback: "Membuang waktu dan biaya hukum yang sia-sia." }
            ]
        },
        {
            text: "Seorang karyawan kunci mendapat tawaran gaji 2x lipat dari perusahaan lain.",
            options: [
                { text: "Biarkan dia pergi", score: 0, feedback: "Kehilangan talenta, tapi menghemat budget." },
                { text: "Samakan gajinya meskipun melebihi budget", score: -1, feedback: "Merusak struktur gaji dan memicu kecemburuan karyawan lain." },
                { text: "Tawarkan opsi saham (equity) dan peran yang lebih strategis", score: 1, feedback: "Mempertahankan talenta dengan visi jangka panjang." }
            ]
        },
        {
            text: "Produk baru Anda mendapat review buruk di minggu pertama peluncuran karena banyak bug.",
            options: [
                { text: "Hapus review buruk dan salahkan user", score: -1, feedback: "Viral di media sosial sebagai perusahaan anti-kritik." },
                { text: "Tarik produk sepenuhnya dari pasar", score: -1, feedback: "Kerugian finansial masif dan hilangnya momentum." },
                { text: "Minta maaf secara publik, beri kompensasi, dan rilis patch perbaikan", score: 1, feedback: "Membangun kepercayaan melalui transparansi." }
            ]
        },
        {
            text: "Anda harus memilih vendor untuk bahan baku. Vendor A murah tapi sering telat. Vendor B mahal tapi selalu tepat waktu.",
            options: [
                { text: "Pilih Vendor A untuk hemat biaya", score: -1, feedback: "Produksi sering terhenti, kerugian lebih besar dari penghematan." },
                { text: "Pilih Vendor B untuk stabilitas", score: 1, feedback: "Rantai pasok aman, pelanggan puas dengan ketersediaan produk." },
                { text: "Ganti bahan baku dengan kualitas lebih rendah", score: -1, feedback: "Kualitas produk turun, pelanggan kecewa." }
            ]
        },
        {
            text: "Data pelanggan Anda bocor karena serangan siber.",
            options: [
                { text: "Sembunyikan insiden ini dari publik", score: -1, feedback: "Terbongkar oleh media, perusahaan dituntut dan hancur." },
                { text: "Laporkan ke otoritas, beri tahu pelanggan, dan tingkatkan keamanan", score: 1, feedback: "Krisis tertangani secara profesional dan sesuai hukum." },
                { text: "Bayar hacker agar data tidak disebar", score: -1, feedback: "Hacker tetap menyebar data dan meminta uang lagi." }
            ]
        },
        {
            text: "Anda memiliki budget marketing terbatas. Di mana Anda akan mengalokasikannya?",
            options: [
                { text: "Pasang billboard besar di jalan tol", score: -1, feedback: "Sulit diukur ROI-nya dan tidak tertarget." },
                { text: "Beli followers palsu di media sosial", score: -1, feedback: "Engagement palsu, merusak algoritma dan reputasi." },
                { text: "Kampanye digital tertarget pada niche market Anda", score: 1, feedback: "ROI tinggi dan konversi lebih efektif." }
            ]
        },
        {
            text: "Pemerintah mengeluarkan regulasi baru yang memberatkan bisnis Anda.",
            options: [
                { text: "Abaikan regulasi dan jalankan bisnis seperti biasa", score: -1, feedback: "Perusahaan didenda besar dan izin usaha dicabut." },
                { text: "Sesuaikan operasi bisnis agar patuh pada regulasi baru", score: 1, feedback: "Bisnis tetap berjalan aman meski butuh penyesuaian awal." },
                { text: "Suap pejabat agar bisnis Anda dikecualikan", score: -1, feedback: "Tertangkap KPK, Anda masuk penjara." }
            ]
        },
        {
            text: "Dua manajer terbaik Anda sering bertengkar dan mengganggu kinerja tim.",
            options: [
                { text: "Pecat keduanya agar suasana tenang", score: -1, feedback: "Kehilangan dua talenta terbaik sekaligus, produktivitas anjlok." },
                { text: "Panggil keduanya, mediasi, dan perjelas pembagian tugas", score: 1, feedback: "Konflik mereda, kolaborasi kembali berjalan baik." },
                { text: "Biarkan saja, anggap sebagai persaingan sehat", score: -1, feedback: "Konflik makin memanas, tim terbelah menjadi dua kubu." }
            ]
        },
        {
            text: "Anda menemukan celah hukum untuk menghindari pajak dalam jumlah besar.",
            options: [
                { text: "Gunakan celah tersebut untuk memaksimalkan profit", score: -1, feedback: "Aturan berubah, Anda terkena denda retroaktif yang membangkrutkan perusahaan." },
                { text: "Tetap bayar pajak sesuai aturan yang berlaku", score: 1, feedback: "Tidur nyenyak, bisnis berjalan tanpa risiko hukum." },
                { text: "Pindahkan semua aset ke negara bebas pajak secara diam-diam", score: -1, feedback: "Terkena sanksi pencucian uang internasional." }
            ]
        },
        {
            text: "Karyawan Anda ketahuan mencuri ide produk dari kompetitor.",
            options: [
                { text: "Beri bonus karena idenya bagus", score: -1, feedback: "Dituntut pelanggaran hak cipta, perusahaan didenda miliaran." },
                { text: "Pecat karyawan tersebut dan batalkan peluncuran produk", score: 1, feedback: "Integritas terjaga, terhindar dari tuntutan hukum yang menghancurkan." },
                { text: "Luncurkan produknya tapi ubah sedikit namanya", score: -1, feedback: "Tetap ketahuan dan dituntut, reputasi perusahaan hancur." }
            ]
        },
        {
            text: "Anda harus memilih antara proyek A (profit besar, risiko tinggi) atau proyek B (profit kecil, risiko rendah).",
            options: [
                { text: "All-in di proyek A dengan semua modal perusahaan", score: -1, feedback: "Proyek A gagal, perusahaan langsung bangkrut." },
                { text: "Ambil proyek B untuk stabilitas, alokasikan sedikit dana untuk riset proyek A", score: 1, feedback: "Keuangan aman, inovasi tetap berjalan terkendali." },
                { text: "Tidak mengambil keduanya karena takut rugi", score: -1, feedback: "Perusahaan stagnan dan perlahan mati karena inflasi." }
            ]
        }
    ];

    const startLevel = (lvl: number, currentScore: number) => {
        SoundManager.play('click');
        setLevel(lvl);
        setScore(currentScore);
        setSelectedOpt(null);
        setTimeLeft(100);
        setState('PLAYING');
    };

    const startGame = () => {
        setShuffledScenarios([...allScenarios].sort(() => Math.random() - 0.5));
        startLevel(1, 0);
    };

    useEffect(() => {
        if (state !== 'PLAYING') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleAnswer(-1); // Timeout
                    return 0;
                }
                return prev - (0.5 + level * 0.05); // gets faster
            });
        }, 100);
        return () => clearInterval(timer);
    }, [state, level]);

    const handleAnswer = (optIndex: number) => {
        if (state !== 'PLAYING') return;
        setSelectedOpt(optIndex);
        
        const currentScenario = shuffledScenarios[(level - 1) % shuffledScenarios.length];
        
        let point = 0;
        if (optIndex === -1) {
            SoundManager.play('error');
            point = -1;
        } else {
            const opt = currentScenario.options[optIndex];
            point = opt.score;
            if (point > 0) SoundManager.play('success');
            else SoundManager.play('error');
        }

        const newScore = score + point;
        setScore(newScore);
        setState('FEEDBACK');

        setTimeout(() => {
            if (newScore < -2 || level >= 10) { // Game over condition
                setState('GAMEOVER');
                setTimeout(() => onFinish(level), 2000);
            } else {
                startLevel(level + 1, newScore);
            }
        }, 4000);
    };

    if (state === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900 text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
                <Briefcase size={64} className="mb-6 opacity-80 text-emerald-400" />
                <h2 className="text-4xl font-black mb-4">Decision Lab</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md">Hadapi skenario realistis dan buat keputusan strategis. Setiap pilihan memiliki konsekuensi. Jangan sampai skor Anda terlalu rendah!</p>
                <button onClick={startGame} className="px-8 py-4 bg-emerald-500 text-white rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Mulai Simulasi</button>
            </div>
        );
    }

    const currentScenario = shuffledScenarios[(level - 1) % shuffledScenarios.length];

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900 text-white">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
            
            <div className="flex justify-between w-full max-w-2xl mb-4">
                <div className="text-xl font-bold text-slate-300">Skenario {level}/10</div>
                <div className="text-xl font-bold flex items-center gap-2">
                    <TrendingUp size={20} className={score >= 0 ? "text-emerald-400" : "text-rose-400"}/> 
                    <span className={score >= 0 ? "text-emerald-400" : "text-rose-400"}>Skor: {score}</span>
                </div>
            </div>

            <div className="w-full max-w-2xl mb-8 h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-100 ${timeLeft > 30 ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${timeLeft}%` }} />
            </div>

            <div className="w-full max-w-2xl flex flex-col gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl text-left">
                    <p className="text-xl leading-relaxed">{currentScenario?.text}</p>
                </div>

                <div className="flex flex-col gap-3">
                    {currentScenario?.options.map((opt: any, i: number) => {
                        let btnClass = "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200";
                        if (state === 'FEEDBACK') {
                            if (i === selectedOpt) {
                                btnClass = opt.score > 0 ? "bg-emerald-900/50 border-emerald-500 text-emerald-100" : "bg-rose-900/50 border-rose-500 text-rose-100";
                            } else if (opt.score > 0) {
                                btnClass = "bg-emerald-900/20 border-emerald-500/50 text-emerald-200/50"; // Highlight the best answer
                            } else {
                                btnClass = "bg-slate-800/50 border-slate-800 opacity-50";
                            }
                        }

                        return (
                            <button 
                                key={i} 
                                onClick={() => handleAnswer(i)}
                                disabled={state !== 'PLAYING'}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${btnClass}`}
                            >
                                {opt.text}
                            </button>
                        );
                    })}
                </div>

                {state === 'FEEDBACK' && (
                    <div className="mt-4 p-5 bg-black/40 rounded-xl animate-fade-in-up text-left border-l-4 border-indigo-500">
                        <div className="text-sm text-indigo-400 uppercase font-bold tracking-wider mb-2">Konsekuensi</div>
                        <div className="text-lg text-slate-200">
                            {(selectedOpt === null || selectedOpt === -1) ? "Waktu habis! Anda kehilangan kesempatan bertindak." : currentScenario?.options[selectedOpt].feedback}
                        </div>
                    </div>
                )}
            </div>

            {state === 'GAMEOVER' && (
                <div className="absolute inset-0 z-10 bg-slate-900/95 flex flex-col items-center justify-center backdrop-blur-md">
                    <div className="text-5xl font-black mb-4 text-white">Simulasi Selesai</div>
                    <div className={`text-2xl font-bold ${score > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>Skor Akhir: {score}</div>
                    <p className="mt-4 text-slate-400 max-w-md">
                        {score > 5 ? "Luar biasa! Anda memiliki insting strategis yang tajam." : 
                         score > 0 ? "Cukup baik, tapi masih banyak ruang untuk perbaikan." : 
                         "Keputusan Anda membawa perusahaan ke ambang kehancuran."}
                    </p>
                </div>
            )}
        </div>
    );
};

const TimePressureGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [level, setLevel] = useState(1);
    const [state, setState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
    const [timeLeft, setTimeLeft] = useState(100);
    const [question, setQuestion] = useState<{ expression: string, answer: number, options: number[] } | null>(null);

    const generateQuestion = (lvl: number) => {
        const ops = ['+', '-', '*'];
        const op = ops[Math.floor(Math.random() * (lvl > 5 ? 3 : 2))];
        let a = Math.floor(Math.random() * (10 + lvl * 2)) + 1;
        let b = Math.floor(Math.random() * (10 + lvl * 2)) + 1;
        
        let ans = 0;
        if (op === '+') ans = a + b;
        else if (op === '-') {
            if (a < b) [a, b] = [b, a];
            ans = a - b;
        } else if (op === '*') {
            a = Math.floor(Math.random() * (5 + lvl)) + 1;
            b = Math.floor(Math.random() * (5 + lvl)) + 1;
            ans = a * b;
        }

        const options = [ans];
        while (options.length < 4) {
            const offset = Math.floor(Math.random() * 10) - 5;
            const fakeAns = ans + offset;
            if (fakeAns !== ans && !options.includes(fakeAns) && fakeAns >= 0) {
                options.push(fakeAns);
            }
        }
        options.sort(() => Math.random() - 0.5);

        setQuestion({ expression: `${a} ${op} ${b}`, answer: ans, options });
    };

    const startGame = () => {
        SoundManager.play('click');
        setLevel(1);
        generateQuestion(1);
        setTimeLeft(100);
        setState('PLAYING');
    };

    useEffect(() => {
        if (state !== 'PLAYING') return;
        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleWrong();
                    return 0;
                }
                return prev - (1 + level * 0.2);
            });
        }, 50);
        return () => clearInterval(timer);
    }, [state, level]);

    const handleAnswer = (opt: number) => {
        if (state !== 'PLAYING' || !question) return;
        if (opt === question.answer) {
            SoundManager.play('success');
            setLevel(l => l + 1);
            generateQuestion(level + 1);
            setTimeLeft(100);
        } else {
            handleWrong();
        }
    };

    const handleWrong = () => {
        SoundManager.play('error');
        setState('GAMEOVER');
        setTimeout(() => onFinish(level), 2000);
    };

    if (state === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900 text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
                <Clock size={64} className="mb-6 opacity-80 text-rose-400" />
                <h2 className="text-4xl font-black mb-4">Time Pressure Logic</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md">Jawab soal logika dan matematika secepat mungkin. Waktu sangat terbatas dan semakin cepat setiap level!</p>
                <button onClick={startGame} className="px-8 py-4 bg-rose-500 text-white rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Mulai</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900 text-white">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
            
            <div className="text-2xl font-bold text-slate-300 mb-4">Level {level}</div>
            
            <div className="w-full max-w-md mb-12 h-4 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-75 ${timeLeft > 40 ? 'bg-rose-500' : 'bg-red-600 animate-pulse'}`} style={{ width: `${timeLeft}%` }} />
            </div>

            {state === 'PLAYING' && question && (
                <div className="flex flex-col items-center w-full max-w-md">
                    <div className="text-6xl font-black mb-12 tracking-wider">{question.expression} = ?</div>
                    <div className="grid grid-cols-2 gap-4 w-full">
                        {question.options.map((opt, i) => (
                            <button 
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                className="p-6 bg-slate-800 hover:bg-slate-700 border-2 border-slate-700 rounded-2xl text-3xl font-bold transition-colors"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {state === 'GAMEOVER' && (
                <div className="absolute inset-0 z-10 bg-slate-900/95 flex flex-col items-center justify-center backdrop-blur-md">
                    <div className="text-5xl font-black mb-4 text-white">Waktu Habis / Salah!</div>
                    <div className="text-2xl font-bold text-rose-400">Level Tercapai: {level}</div>
                </div>
            )}
        </div>
    );
};

const MultiLayerGame: React.FC<{ onFinish: (level: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [level, setLevel] = useState(1);
    const [state, setState] = useState<'START' | 'PLAYING' | 'GAMEOVER'>('START');
    const [puzzle, setPuzzle] = useState<{ layer1: string, layer2: string, question: string, answer: string, options: string[] } | null>(null);
    const [timeLeft, setTimeLeft] = useState(100);
    const timerRef = useRef<number | null>(null);

    useEffect(() => {
        if (state === 'PLAYING') {
            timerRef.current = window.setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        if (timerRef.current) clearInterval(timerRef.current);
                        setState('GAMEOVER');
                        setTimeout(() => onFinish(level), 2000);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 100);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [state, level, onFinish]);

    const generatePuzzle = (lvl: number) => {
        const start = Math.floor(Math.random() * 5) + 1;
        const step = Math.floor(Math.random() * 3) + 1;
        const seq = [start, start + step, start + step * 2, start + step * 3, start + step * 4];
        
        const multipliers = [2, 3, 4];
        const mult = multipliers[Math.floor(Math.random() * multipliers.length)];
        
        const targetIndex = Math.floor(Math.random() * 4);
        const positions = ["Pertama", "Kedua", "Ketiga", "Keempat", "Kelima"];
        
        const ans = (seq[targetIndex] * mult).toString();
        
        const options = [ans];
        while (options.length < 4) {
            const fake = (seq[Math.floor(Math.random() * 5)] * multipliers[Math.floor(Math.random() * multipliers.length)] + Math.floor(Math.random() * 3)).toString();
            if (!options.includes(fake)) options.push(fake);
        }
        options.sort(() => Math.random() - 0.5);

        setPuzzle({
            layer1: `Deret: ${seq.join(', ')}`,
            layer2: `Aturan: Kalikan setiap angka dengan ${mult}`,
            question: `Berapa hasil angka ${positions[targetIndex]} setelah aturan diterapkan?`,
            answer: ans,
            options
        });
    };

    const startGame = () => {
        SoundManager.play('click');
        setLevel(1);
        setTimeLeft(100);
        generatePuzzle(1);
        setState('PLAYING');
    };

    const handleAnswer = (opt: string) => {
        if (state !== 'PLAYING' || !puzzle) return;
        if (opt === puzzle.answer) {
            SoundManager.play('success');
            setLevel(l => l + 1);
            setTimeLeft(100);
            generatePuzzle(level + 1);
        } else {
            SoundManager.play('error');
            setState('GAMEOVER');
            setTimeout(() => onFinish(level), 2000);
        }
    };

    if (state === 'START') {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900 text-white">
                <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
                <Layers size={64} className="mb-6 opacity-80 text-indigo-400" />
                <h2 className="text-4xl font-black mb-4">Multi-Layer Puzzle</h2>
                <p className="text-xl mb-8 opacity-90 max-w-md">Selesaikan teka-teki yang memiliki beberapa lapisan logika. Pahami deret dasar, terapkan aturan, dan temukan jawaban akhirnya.</p>
                <button onClick={startGame} className="px-8 py-4 bg-indigo-500 text-white rounded-2xl font-bold text-xl hover:scale-105 transition-transform shadow-xl">Mulai</button>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-center p-6 bg-slate-900 text-white">
            <button onClick={() => { SoundManager.play('back'); onExit(); }} className="absolute top-6 left-6 bg-white/10 p-3 rounded-full text-white z-[60]"><ArrowLeft size={24}/></button>
            
            <div className="absolute top-0 left-0 w-full h-2 bg-slate-800">
                <div className={`h-full transition-all duration-75 ${timeLeft > 40 ? 'bg-indigo-500' : 'bg-red-600 animate-pulse'}`} style={{ width: `${timeLeft}%` }} />
            </div>

            <div className="text-2xl font-bold text-slate-300 mb-8 mt-8">Level {level}</div>

            {state === 'PLAYING' && puzzle && (
                <div className="flex flex-col items-center w-full max-w-2xl">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full mb-4 text-left">
                        <div className="text-sm text-indigo-400 font-bold uppercase mb-1">Lapisan 1</div>
                        <div className="text-2xl font-mono">{puzzle.layer1}</div>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 w-full mb-8 text-left">
                        <div className="text-sm text-indigo-400 font-bold uppercase mb-1">Lapisan 2</div>
                        <div className="text-xl">{puzzle.layer2}</div>
                    </div>
                    
                    <div className="text-2xl font-bold mb-8">{puzzle.question}</div>

                    <div className="grid grid-cols-2 gap-4 w-full">
                        {puzzle.options.map((opt, i) => (
                            <button 
                                key={i}
                                onClick={() => handleAnswer(opt)}
                                className="p-4 bg-slate-800 hover:bg-indigo-900/50 border-2 border-slate-700 hover:border-indigo-500 rounded-xl text-2xl font-bold transition-colors"
                            >
                                {opt}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {state === 'GAMEOVER' && (
                <div className="absolute inset-0 z-10 bg-slate-900/95 flex flex-col items-center justify-center backdrop-blur-md">
                    <div className="text-5xl font-black mb-4 text-white">Waktu Habis / Salah!</div>
                    <div className="text-2xl font-bold text-indigo-400">Level Tercapai: {level}</div>
                </div>
            )}
        </div>
    );
};

const SynonymAntonymGame: React.FC<{ onFinish: (score: number) => void, onExit: () => void }> = ({ onFinish, onExit }) => {
    const [state, setState] = useState<'LANG_SELECT' | 'LOADING' | 'PLAYING' | 'SHOW_MEANING' | 'GAMEOVER'>('LANG_SELECT');
    const [lang, setLang] = useState<'ID'|'EN'>('ID');
    const [questions, setQuestions] = useState<VocabQuestion[]>([]);
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(3);
    const [wrongOptions, setWrongOptions] = useState<Set<string>>(new Set());

    const startGame = async (selectedLang: 'ID'|'EN') => {
        setLang(selectedLang);
        setState('LOADING');
        try {
            const result = await generateVocabQuestions(selectedLang);
            setQuestions(result);
            setState('PLAYING');
        } catch(e) {
            console.error(e);
            setState('PLAYING');
        }
    };

    const handleAnswer = (option: string) => {
        if (state !== 'PLAYING') return;
        const currentQ = questions[qIndex];
        
        if (option === currentQ.correct) {
            SoundManager.play('success');
            setScore(prev => prev + 1);
            setWrongOptions(new Set());
            setState('SHOW_MEANING');
        } else {
            SoundManager.play('error');
            const newWrong = new Set(wrongOptions);
            newWrong.add(option);
            setWrongOptions(newWrong);
            
            const newLives = lives - 1;
            setLives(newLives);
            if (newLives <= 0) {
                SoundManager.play('finish');
                setState('SHOW_MEANING'); // Show meaning before game over
            }
        }
    };

    const handleNext = () => {
        if (lives <= 0) {
            setState('GAMEOVER');
            setTimeout(() => onFinish(score), 2000);
            return;
        }

        if (qIndex + 1 < questions.length) {
            setQIndex(prev => prev + 1);
            setState('PLAYING');
        } else {
            // Out of questions (won?)
            SoundManager.play('finish');
            setState('GAMEOVER');
            setTimeout(() => onFinish(score), 2000);
        }
    };

    if (state === 'LANG_SELECT') {
        return (
            <div className="w-full max-w-lg mx-auto bg-slate-900 border-2 border-slate-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-8 text-center animate-fade-in text-white relative">
                <button onClick={onExit} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition bg-slate-800 rounded-full"><ArrowLeft size={20}/></button>
                <div className="w-20 h-20 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-6"><Type size={40}/></div>
                <h2 className="text-3xl font-black mb-4">Sinonim & Antonim</h2>
                <p className="text-slate-400 mb-8 max-w-sm mx-auto">Pilih bahasa untuk tes kosakata Anda. Jawab dengan benar untuk mengumpulkan poin. Anda memiliki 3 nyawa.</p>
                <div className="grid grid-cols-2 gap-4">
                    <button onClick={() => startGame('ID')} className="p-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl flex flex-col items-center gap-3 transition">
                        <Flag className="text-rose-500" size={32}/>
                        <span className="font-bold">Bahasa Indonesia</span>
                    </button>
                    <button onClick={() => startGame('EN')} className="p-6 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-2xl flex flex-col items-center gap-3 transition">
                        <Globe className="text-blue-500" size={32}/>
                        <span className="font-bold">Bahasa Inggris</span>
                    </button>
                </div>
            </div>
        );
    }

    if (state === 'LOADING') {
        return (
            <div className="w-full h-[600px] bg-slate-900 border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center animate-fade-in text-white relative">
                <Loader2 className="animate-spin text-cyan-500 mb-6" size={48}/>
                <h2 className="text-2xl font-bold">Mempersiapkan Soal...</h2>
                <p className="text-slate-400 mt-2">Daftar kata sedang dimuat</p>
            </div>
        );
    }

    if (state === 'SHOW_MEANING') {
        const q = questions[qIndex];
        const isGameOver = lives <= 0;
        return (
            <div className="w-full min-h-[600px] bg-slate-900 border-2 border-slate-700 rounded-3xl flex flex-col justify-center animate-fade-in text-white relative p-6">
                <button onClick={onExit} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition bg-slate-800 rounded-full z-10"><ArrowLeft size={20}/></button>
                
                <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full text-center">
                    <div className="text-sm font-bold mb-4 tracking-widest uppercase text-slate-400">Target</div>
                    <div className="text-4xl font-black mb-2 text-cyan-400">{q.word}</div>
                    
                    <div className="text-sm font-bold mt-4 mb-4 tracking-widest uppercase text-slate-400">Kunci ({q.type === 'SYNONYM' ? 'Sinonim' : 'Antonim'})</div>
                    <div className="text-2xl font-bold mb-6 text-emerald-400">{q.correct}</div>

                    <div className="text-sm font-bold mb-4 tracking-widest uppercase text-slate-400">Pembahasan</div>
                    <div className="text-lg text-slate-300 bg-slate-800 p-6 rounded-2xl border border-slate-600 mb-8 w-full text-left leading-relaxed shadow-inner">
                        {q.meaning || `Definisi kata ini belum tersedia dalam kamus.`}
                    </div>

                    <button
                        onClick={handleNext}
                        className="w-full py-4 text-xl font-black text-white bg-cyan-600 hover:bg-cyan-500 rounded-2xl shadow-xl transition-all"
                    >
                        {isGameOver ? 'Akhiri Permainan' : 'Soal Berikutnya'}
                    </button>
                </div>
            </div>
        );
    }

    if (state === 'PLAYING') {
        const q = questions[qIndex];
        return (
            <div className="w-full min-h-[600px] bg-slate-900 border-2 border-slate-700 rounded-3xl flex flex-col animate-fade-in text-white relative p-6">
                <button onClick={onExit} className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white transition bg-slate-800 rounded-full z-10"><ArrowLeft size={20}/></button>
                
                <div className="flex justify-between items-center mb-8 px-12">
                    <div className="text-slate-400 font-bold uppercase tracking-wider text-sm flex items-center gap-2">Poin <span className="text-2xl text-cyan-400">{score}</span></div>
                    <div className="flex gap-1">
                        {[1,2,3].map(i => (
                            <Heart key={i} size={24} className={i <= lives ? "text-rose-500 fill-rose-500" : "text-slate-700 fill-slate-700"} />
                        ))}
                    </div>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center max-w-xl mx-auto w-full">
                    <div className="text-slate-400 font-bold tracking-widest uppercase mb-2 text-sm">{q.type === 'SYNONYM' ? 'Sinonim dari' : 'Antonim dari'}</div>
                    <div className="text-5xl font-black mb-12 text-center break-all">{q.word}</div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                        {q.options.map((opt, i) => {
                            if (wrongOptions.has(opt)) return <div key={i} className="p-4 border-2 border-slate-800 bg-slate-800/20 text-slate-600 rounded-xl text-center opacity-50 cursor-not-allowed hidden sm:block">❌</div>; // Hidden on mobile, dimmed on desktop? Or just not render. Let's just not render it or render an empty space.
                            if (wrongOptions.has(opt)) return null; // Make wrong options disappear as requested
                            return (
                                <button
                                    key={i}
                                    onClick={() => handleAnswer(opt)}
                                    className="p-4 bg-slate-800 hover:bg-cyan-900/50 border-2 border-slate-700 hover:border-cyan-500 rounded-xl text-lg font-bold transition-all hover:scale-105 active:scale-95 text-center min-h-[64px]"
                                >
                                    {opt}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-[600px] bg-slate-900 border-2 border-slate-700 rounded-3xl flex flex-col items-center justify-center animate-fade-in text-white relative">
            <Type size={64} className="mb-6 text-cyan-500 opacity-50"/>
            <h2 className="text-4xl font-black mb-4">Game Over!</h2>
            <div className="text-xl text-slate-400 mb-2">Skor Akhir</div>
            <div className="text-6xl font-black text-cyan-400 mb-8">{score}</div>
        </div>
    );
};

export const HumanBenchmark: React.FC<HumanBenchmarkProps> = ({ onBack, username, history, onComplete, isGuest, initialMode, initialTab }) => {
    const [mode, setMode] = useState<'MENU' | BenchmarkMode>('MENU');
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RANKING'>(initialTab || 'DASHBOARD');
    
    // Auto-start specific game if provided via search deep link
    useEffect(() => {
        if (initialMode) {
            setMode(initialMode);
        }
    }, [initialMode]);

    // Handle initial tab if provided
    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    // Stats Modal
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [statsModalGame, setStatsModalGame] = useState<BenchmarkMode>('REACTION');

    const handleFinishGame = async (score: number, gameType: BenchmarkMode) => {
        let unit = 'pts';
        if (gameType === 'REACTION' || gameType === 'AIM') unit = 'ms';
        if (gameType === 'SEQUENCE' || gameType === 'NUMBER' || gameType === 'CHIMP' || gameType === 'VISUAL' || gameType === 'BRIDGE' || gameType === 'MATCH' || gameType === 'POSITION_MEMORY') unit = 'lvl';
        if (gameType === 'TYPING') unit = 'wpm';
        if (gameType === 'NUMBER_RANGE') unit = 'attempts';
        
        // SAVE TO FIREBASE (Only if not Guest)
        if (!isGuest) {
            FirebaseService.saveBenchmarkScore(gameType, score, username, unit).catch(err => console.error("Cloud save failed", err));
        }

        // Construct standard TestHistoryItem for LOCAL state
        const newItem: TestHistoryItem = {
            id: `bench-${Date.now()}`,
            date: new Date().toISOString(),
            category: 'BENCHMARK',
            score: score,
            maxScore: 0, 
            details: {
                game: gameType,
                unit: unit
            },
            questions: [], 
            answers: []
        };
        
        onComplete(newItem);
        setMode('MENU');
    };

    const getStats = (game: BenchmarkMode) => {
        // Filter benchmark items from the main history prop
        const benchmarkItems = history
            .filter(item => {
                if(item.category !== 'BENCHMARK' || !item.details) return false;
                // Safe check using any cast for the union details property
                const d = item.details as any;
                return d.game === game;
            })
            .map(item => {
                const details = item.details as BenchmarkResultDetails;
                return {
                    id: item.id,
                    game: details.game,
                    score: item.score,
                    unit: details.unit,
                    date: item.date
                };
            });
            
        if (benchmarkItems.length === 0) return { best: null, percentile: 0 };

        let bestScore;
        if (game === 'REACTION' || game === 'AIM') {
             bestScore = Math.min(...benchmarkItems.map(d => d.score));
        } else {
             bestScore = Math.max(...benchmarkItems.map(d => d.score));
        }
        
        const percentile = calculatePercentile(game, bestScore);
        return { best: bestScore, percentile };
    };

    if (mode !== 'MENU') {
        switch(mode) {
            case 'REACTION': return <ReactionTimeGame onFinish={(s) => handleFinishGame(s, 'REACTION')} onExit={() => setMode('MENU')} />;
            case 'SEQUENCE': return <SequenceMemoryGame onFinish={(s) => handleFinishGame(s, 'SEQUENCE')} onExit={() => setMode('MENU')} />;
            case 'AIM': return <AimTrainerGame onFinish={(s) => handleFinishGame(s, 'AIM')} onExit={() => setMode('MENU')} />;
            case 'CHIMP': return <ChimpTestGame onFinish={(s) => handleFinishGame(s, 'CHIMP')} onExit={() => setMode('MENU')} />;
            case 'VISUAL': return <VisualMemoryGame onFinish={(s) => handleFinishGame(s, 'VISUAL')} onExit={() => setMode('MENU')} />;
            case 'NUMBER': return <NumberMemoryGame onFinish={(s) => handleFinishGame(s, 'NUMBER')} onExit={() => setMode('MENU')} />;
            case 'VERBAL': return <VerbalMemoryGame onFinish={(s) => handleFinishGame(s, 'VERBAL')} onExit={() => setMode('MENU')} />;
            case 'TYPING': return <TypingGame onFinish={(s) => handleFinishGame(s, 'TYPING')} onExit={() => setMode('MENU')} />;
            case 'BRIDGE': return <BridgeMemoryGame onFinish={(s) => handleFinishGame(s, 'BRIDGE')} onExit={() => setMode('MENU')} />;
            case 'MATCH': return <MatchMemoryGame onFinish={(s) => handleFinishGame(s, 'MATCH')} onExit={() => setMode('MENU')} />;
            case 'HANGMAN': return <HangmanGame onFinish={(s) => handleFinishGame(s, 'HANGMAN')} onExit={() => setMode('MENU')} />;
            case 'HOTCOLD': return <HotColdGame onFinish={(s) => handleFinishGame(s, 'HOTCOLD')} onExit={() => setMode('MENU')} />;
            case 'NUMBER_RANGE': return <NumberRangeGame onFinish={(s) => handleFinishGame(s, 'NUMBER_RANGE')} onExit={() => setMode('MENU')} />;
            case 'POSITION_MEMORY': return <PositionMemoryGame onFinish={(s) => handleFinishGame(s, 'POSITION_MEMORY')} onExit={() => setMode('MENU')} />;
            case 'PATTERN_BREAKER': return <PatternBreakerGame onFinish={(s) => handleFinishGame(s, 'PATTERN_BREAKER')} onExit={() => setMode('MENU')} />;
            case 'DECISION_LAB': return <DecisionLabGame onFinish={(s) => handleFinishGame(s, 'DECISION_LAB')} onExit={() => setMode('MENU')} />;
            case 'REVERSE_THINKING': return <ReverseThinkingGame onFinish={(s) => handleFinishGame(s, 'REVERSE_THINKING')} onExit={() => setMode('MENU')} />;
            case 'LOGIC_MAZE': return <LogicMazeGame onFinish={(s) => handleFinishGame(s, 'LOGIC_MAZE')} onExit={() => setMode('MENU')} />;
            case 'TIME_PRESSURE': return <TimePressureGame onFinish={(s) => handleFinishGame(s, 'TIME_PRESSURE')} onExit={() => setMode('MENU')} />;
            case 'MULTI_LAYER': return <MultiLayerGame onFinish={(s) => handleFinishGame(s, 'MULTI_LAYER')} onExit={() => setMode('MENU')} />;
            case 'SYNONYM_ANTONYM': return <SynonymAntonymGame onFinish={(s) => handleFinishGame(s, 'SYNONYM_ANTONYM')} onExit={() => setMode('MENU')} />;
            default: setMode('MENU'); return null;
        }
    }

    const GameCard: React.FC<{ 
        game: BenchmarkMode, 
        title: string, 
        desc: string, 
        icon: React.ReactNode, 
        colorClass: string,
        btnColorClass: string
    }> = ({ game, title, desc, icon, colorClass, btnColorClass }) => {
        const { best, percentile } = getStats(game);
        let unit = 'pts';
        if (game === 'REACTION' || game === 'AIM') unit = 'ms';
        if (game === 'TYPING') unit = 'wpm';
        if (game === 'NUMBER_RANGE') unit = 'attempts';
        if (game === 'SEQUENCE' || game === 'NUMBER' || game === 'CHIMP' || game === 'VISUAL' || game === 'BRIDGE' || game === 'MATCH' || game === 'POSITION_MEMORY') unit = 'lvl';

        return (
            <div className="relative overflow-hidden bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg transition-all group h-full">
                <div className={`absolute top-0 bottom-0 left-0 w-1 ${colorClass}`}></div>
                
                <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 h-full">
                     {/* Icon Box */}
                    <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10 text-opacity-100 shrink-0`}>
                        <div className={`${colorClass.replace('bg-', 'text-')}`}>
                           {icon}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 text-center sm:text-left min-w-0 w-full">
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mb-0.5 truncate">{title}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs mb-2 line-clamp-2 min-h-[2.5em]">{desc}</p>
                        
                        {/* Percentile Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-1.5 overflow-hidden">
                            <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${percentile}%` }}></div>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                             <span>Best: {best !== null ? `${best} ${unit}` : '-'}</span>
                             <span>{percentile > 0 ? `Top ${percentile}%` : '-'}</span>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row sm:flex-col gap-1.5 w-full sm:w-auto shrink-0">
                        <button 
                            onClick={(e) => { e.stopPropagation(); SoundManager.play('click'); setMode(game); }}
                            className={`flex-1 sm:flex-none px-4 py-2 ${btnColorClass} text-white rounded-lg font-bold text-[11px] shadow-sm hover:shadow-md hover:scale-105 transition flex items-center justify-center gap-1.5`}
                        >
                            <Play size={12} fill="currentColor"/> MAIN
                        </button>
                        <button 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                SoundManager.play('click'); 
                                setStatsModalGame(game); 
                                setStatsModalOpen(true); 
                            }} 
                            className="flex-1 sm:flex-none px-3 py-2 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 rounded-lg font-bold text-[10px] transition flex items-center justify-center gap-1"
                        >
                            <BarChart2 size={12}/> STATS
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent p-6 flex flex-col font-sans transition-colors">
             <div className="max-w-6xl mx-auto w-full">
                
                <StatsModal 
                    isOpen={statsModalOpen} 
                    onClose={() => setStatsModalOpen(false)} 
                    game={statsModalGame} 
                    bestScore={getStats(statsModalGame).best}
                />

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <button onClick={() => { SoundManager.play('back'); onBack(); }} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 font-medium transition self-start">
                        <ArrowLeft size={20} className="mr-2" /> Menu Utama
                    </button>
                </div>

                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 flex items-center justify-center sm:justify-start gap-3">
                        <Activity className="text-rose-500" size={40} /> Human Benchmark
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-lg">Halo <span className="font-bold text-indigo-500">{username}</span>! Uji batas kemampuan kognitifmu.</p>
                    {isGuest && (
                        <div className="mt-2 text-xs bg-amber-100 text-amber-700 inline-block px-3 py-1 rounded-full font-bold">
                            Mode Tamu: Skor tidak disimpan ke Global Leaderboard
                        </div>
                    )}
                </div>

                {/* Tab Switcher */}
                <div className="flex justify-center sm:justify-start gap-4 mb-8 border-b border-slate-200 dark:border-slate-700">
                    <button 
                        onClick={() => setActiveTab('DASHBOARD')}
                        className={`pb-3 px-4 font-bold transition-all ${activeTab === 'DASHBOARD' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Game Dashboard
                    </button>
                    <button 
                        onClick={() => setActiveTab('RANKING')}
                         className={`pb-3 px-4 font-bold transition-all ${activeTab === 'RANKING' ? 'text-indigo-600 border-b-4 border-indigo-600' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                    >
                        Leaderboard
                    </button>
                </div>

                {activeTab === 'DASHBOARD' ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 mb-10">
                            <GameCard 
                                game="REACTION" 
                                title="Reaction Time" 
                                desc="Uji seberapa cepat refleks visual Anda merespons perubahan warna." 
                                icon={<Zap size={32}/>}
                                colorClass="bg-amber-500"
                                btnColorClass="bg-amber-500 hover:bg-amber-600"
                            />
                            <GameCard 
                                game="SEQUENCE" 
                                title="Sequence Memory" 
                                desc="Ingat pola urutan kotak yang menyala semakin panjang." 
                                icon={<Grid size={32}/>}
                                colorClass="bg-indigo-500"
                                btnColorClass="bg-indigo-600 hover:bg-indigo-700"
                            />
                            <GameCard 
                                game="AIM" 
                                title="Aim Trainer" 
                                desc="Seberapa cepat Anda bisa mengenai semua target yang muncul?" 
                                icon={<Target size={32}/>}
                                colorClass="bg-orange-500"
                                btnColorClass="bg-orange-500 hover:bg-orange-600"
                            />
                            <GameCard 
                                game="CHIMP" 
                                title="Chimp Test" 
                                desc="Apakah Anda lebih pintar dari simpanse? Uji memori kerja spasial." 
                                icon={<Brain size={32}/>}
                                colorClass="bg-teal-500"
                                btnColorClass="bg-teal-500 hover:bg-teal-600"
                            />
                            <GameCard 
                                game="VISUAL" 
                                title="Visual Memory" 
                                desc="Ingat posisi kotak putih yang muncul. Hati-hati, setiap kesalahan mengurangi nyawa!" 
                                icon={<Grid size={32}/>}
                                colorClass="bg-sky-500"
                                btnColorClass="bg-sky-500 hover:bg-sky-600"
                            />
                            <GameCard 
                                game="NUMBER" 
                                title="Number Memory" 
                                desc="Ingat angka terpanjang yang bisa Anda hafal." 
                                icon={<Hash size={32}/>}
                                colorClass="bg-blue-600"
                                btnColorClass="bg-blue-600 hover:bg-blue-700"
                            />
                            <GameCard 
                                game="VERBAL" 
                                title="Verbal Memory" 
                                desc="Ingat kata mana yang baru muncul dan mana yang sudah pernah." 
                                icon={<Type size={32}/>}
                                colorClass="bg-purple-500"
                                btnColorClass="bg-purple-500 hover:bg-purple-600"
                            />
                            <GameCard 
                                game="SYNONYM_ANTONYM" 
                                title="Sinonim & Antonim" 
                                desc="Uji perbendaharaan katamu! Pilih sinonim atau antonim yang tepat." 
                                icon={<Type size={32}/>}
                                colorClass="bg-cyan-600"
                                btnColorClass="bg-cyan-600 hover:bg-cyan-700"
                            />
                            <GameCard 
                                game="TYPING" 
                                title="Typing Test" 
                                desc="Berapa banyak kata yang bisa Anda ketik per menit?" 
                                icon={<FileText size={32}/>}
                                colorClass="bg-slate-500"
                                btnColorClass="bg-slate-600 hover:bg-slate-700"
                            />
                             <GameCard 
                                game="BRIDGE" 
                                title="Bridge Memory" 
                                desc="Hafalkan jalan yang aman dari bawah ke atas sebelum hilang." 
                                icon={<Map size={32}/>}
                                colorClass="bg-emerald-500"
                                btnColorClass="bg-emerald-600 hover:bg-emerald-700"
                            />
                            <GameCard 
                                game="MATCH" 
                                title="Match Memory" 
                                desc="Cari pasangan simbol yang sama di balik kartu." 
                                icon={<Copy size={32}/>}
                                colorClass="bg-pink-500"
                                btnColorClass="bg-pink-600 hover:bg-pink-700"
                            />
                            <GameCard 
                                game="HANGMAN" 
                                title="Hangman" 
                                desc="Tebak kata sebelum orangnya tergantung." 
                                icon={<Users size={32}/>}
                                colorClass="bg-slate-700"
                                btnColorClass="bg-slate-800 hover:bg-slate-900"
                            />
                            <GameCard 
                                game="HOTCOLD" 
                                title="Hot & Cold" 
                                desc="Tebak kata rahasia berdasarkan kedekatan makna." 
                                icon={<TrendingUp size={32}/>}
                                colorClass="bg-rose-500"
                                btnColorClass="bg-rose-600 hover:bg-rose-700"
                            />
                            <GameCard 
                                game="NUMBER_RANGE" 
                                title="Number Range" 
                                desc="Tebak angka rahasia dengan petunjuk lebih besar/kecil." 
                                icon={<Search size={32}/>}
                                colorClass="bg-cyan-600"
                                btnColorClass="bg-cyan-700 hover:bg-cyan-800"
                            />
                            <GameCard 
                                game="POSITION_MEMORY" 
                                title="Position Memory" 
                                desc="Hafalkan posisi dan warna blok, lalu susun kembali." 
                                icon={<MapPin size={32}/>}
                                colorClass="bg-fuchsia-600"
                                btnColorClass="bg-fuchsia-700 hover:bg-fuchsia-800"
                            />
                            <GameCard 
                                game="PATTERN_BREAKER" 
                                title="Pattern Breaker" 
                                desc="Temukan pola tersembunyi dari deret angka." 
                                icon={<Brain size={32}/>}
                                colorClass="bg-indigo-600"
                                btnColorClass="bg-indigo-700 hover:bg-indigo-800"
                            />
                            <GameCard 
                                game="DECISION_LAB" 
                                title="Decision Lab" 
                                desc="Buat keputusan strategis dalam berbagai skenario." 
                                icon={<Briefcase size={32}/>}
                                colorClass="bg-emerald-600"
                                btnColorClass="bg-emerald-700 hover:bg-emerald-800"
                            />
                            <GameCard 
                                game="REVERSE_THINKING" 
                                title="Reverse Thinking" 
                                desc="Diberikan jawaban, temukan logika atau persamaannya." 
                                icon={<RefreshCw size={32}/>}
                                colorClass="bg-violet-600"
                                btnColorClass="bg-violet-700 hover:bg-violet-800"
                            />
                            <GameCard 
                                game="LOGIC_MAZE" 
                                title="Logic Maze" 
                                desc="Jelajahi labirin dengan aturan logika yang berubah-ubah." 
                                icon={<Route size={32}/>}
                                colorClass="bg-amber-600"
                                btnColorClass="bg-amber-700 hover:bg-amber-800"
                            />
                            <GameCard 
                                game="TIME_PRESSURE" 
                                title="Time Pressure Logic" 
                                desc="Selesaikan soal logika sederhana di bawah tekanan waktu." 
                                icon={<Clock size={32}/>}
                                colorClass="bg-rose-600"
                                btnColorClass="bg-rose-700 hover:bg-rose-800"
                            />
                            <GameCard 
                                game="MULTI_LAYER" 
                                title="Multi-Layer Puzzle" 
                                desc="Selesaikan teka-teki yang memiliki beberapa lapisan logika." 
                                icon={<Layers size={32}/>}
                                colorClass="bg-indigo-600"
                                btnColorClass="bg-indigo-700 hover:bg-indigo-800"
                            />
                        </div>
                        
                        <ActivityFeed history={history} />
                    </>
                ) : (
                    <LeaderboardView username={username} history={history} />
                )}
             </div>
        </div>
    );
};