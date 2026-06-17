

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Pause, CheckCircle, RotateCcw, Eye, ArrowLeft, Target, GitMerge, Grid, Zap, Activity, Save, BarChart2 } from 'lucide-react';
import { TesKecermatanResultDetails, TestHistoryItem, KecermatanMode } from '../types';
import { SoundManager } from '../services/soundService';

interface TesKecermatanProps {
    initialMode?: KecermatanMode;
    onBack: () => void;
    onComplete: (historyItem: TestHistoryItem) => void;
}

const TOTAL_SECTIONS = 10;
const DURATION_PER_SECTION = 60; // 60 seconds per section
const LABELS = ['A', 'B', 'C', 'D', 'E'];
// UPDATE: Menambahkan lebih banyak simbol agar lebih variatif dan menantang (similar symbols)
const SYMBOLS = [
    '★', '▲', '●', '■', '♦', '✚', '▼', '♠', '♣', '♥', '✖', '⬟', 
    '⭘', '⬢', '✜', '✷', '✦', '✶', '✹', '❖', '❄', '❅', '∞', 'Σ', 
    'Φ', 'Ψ', 'Ω', '⌘', '⌥', '⎈', '⌖', '⏣', '⏚', '⎔',
    // Visually similar additions (Near-misses)
    '⌬', '⏧', '⧉', '⧈', '⧖', '⧗', '⧑', '⧒', '⧓', '⧔', 
    '◪', '◩', '◨', '◧', '◫', '◬', '◭', '◮', '▿', '▵',
    '⬖', '⬗', '⬘', '⬙', '⬚', '⬔', '⬕', '⬓', '⬒', '⬑'
];

// --- HELPERS ---

// Algoritma Penilaian Komprehensif
const calculateVerdict = (accuracy: number, speed: number, stability: number): string => {
    let score = 0;
    
    // 1. Bobot Akurasi (Max 50 poin)
    if (accuracy === 100) score += 50;
    else if (accuracy >= 95) score += 45;
    else if (accuracy >= 90) score += 40;
    else if (accuracy >= 80) score += 30;
    else if (accuracy >= 70) score += 20;
    else score += 10;

    // 2. Bobot Kecepatan (Max 30 poin)
    // Asumsi: > 50 jawaban per menit adalah sangat cepat
    if (speed >= 50) score += 30;
    else if (speed >= 40) score += 25;
    else if (speed >= 30) score += 20;
    else if (speed >= 20) score += 10;
    else score += 5;

    // 3. Bobot Stabilitas/Deviasi (Max 20 poin)
    // Semakin kecil deviasi, semakin stabil (bagus)
    if (stability < 2.0) score += 20;
    else if (stability < 4.0) score += 15;
    else if (stability < 6.0) score += 10;
    else if (stability < 8.0) score += 5;
    
    // Total Score (0 - 100)
    if (score >= 95) return "Sempurna";
    if (score >= 85) return "Sangat Baik";
    if (score >= 70) return "Baik";
    if (score >= 55) return "Cukup";
    if (score >= 40) return "Kurang";
    return "Buruk";
};

// Generator untuk Mode Angka/Huruf/Simbol (Missing Item)
const generateMissingItemData = (mode: 'ANGKA' | 'HURUF' | 'SIMBOL_HILANG') => {
    let items: string[] = [];
    if (mode === 'ANGKA') {
        const digits = ['0','1','2','3','4','5','6','7','8','9'];
        items = [...digits].sort(() => 0.5 - Math.random()).slice(0, 5);
    } else if (mode === 'HURUF') {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        items = [...letters].sort(() => 0.5 - Math.random()).slice(0, 5);
    } else if (mode === 'SIMBOL_HILANG') {
        items = [...SYMBOLS].sort(() => 0.5 - Math.random()).slice(0, 5);
    }
    
    const missingIdx = Math.floor(Math.random() * 5);
    // Shuffle the question items to make it harder, but ensure logic is correct
    const questionItems = items.filter((_, idx) => idx !== missingIdx).sort(() => 0.5 - Math.random());
    return {
        reference: items,
        question: questionItems,
        answer: missingIdx // Index 0-4 corresponding to A-E
    };
};

// Generator untuk Mode Simbol (Comparison) - SAMA_BEDA
const generateSymbolData = () => {
    // Pick 3-4 symbols
    const count = 3 + Math.floor(Math.random() * 2); 
    const sequenceA = Array.from({length: count}, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);
    
    const isSame = Math.random() > 0.5;
    let sequenceB = [...sequenceA];
    
    if (!isSame) {
        // Change one symbol randomly or swap
        if (Math.random() > 0.5) {
             const idx = Math.floor(Math.random() * count);
             let newSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
             while(newSym === sequenceA[idx]) newSym = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
             sequenceB[idx] = newSym;
        } else {
             // Swap two
             if (count >= 2) {
                 const i1 = 0;
                 const i2 = 1;
                 [sequenceB[i1], sequenceB[i2]] = [sequenceB[i2], sequenceB[i1]];
                 // Edge case: if swap results in same (e.g. A A -> A A), force change
                 if (sequenceB[i1] === sequenceB[i2]) sequenceB[i1] = SYMBOLS.find(s => s !== sequenceB[i1]) || 'X';
             }
        }
    }
    
    return {
        left: sequenceA,
        right: sequenceB,
        isSame
    };
};

// Generator untuk Mode Matching
const generateMatchingData = () => {
    // Pick 5 distinct symbols for A-E
    const pool = [...SYMBOLS].sort(() => 0.5 - Math.random());
    const map = pool.slice(0, 5); // Index 0=A, 1=B, etc.
    
    // Pick one as question
    const targetIdx = Math.floor(Math.random() * 5);
    const targetSymbol = map[targetIdx];
    
    return {
        map,
        target: targetSymbol,
        answer: targetIdx
    };
};

// Generator untuk Mode Grouping
const generateGroupingData = () => {
    // Pick target symbol
    const target = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
    // Generate grid of 20 items (4x5)
    const grid = Array.from({length: 20}, () => {
        if (Math.random() < 0.3) return target; // 30% chance is target
        let s = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        while(s === target) s = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        return s;
    });
    
    const correctCount = grid.filter(s => s === target).length;
    
    return {
        target,
        grid,
        totalCorrect: correctCount
    };
};

export const TesKecermatan: React.FC<TesKecermatanProps> = ({ initialMode, onBack, onComplete }) => {
    const [mode, setMode] = useState<KecermatanMode>(initialMode || 'ANGKA');
    
    // Game State
    const [currentSection, setCurrentSection] = useState(1);
    const [timeLeft, setTimeLeft] = useState(DURATION_PER_SECTION);
    const [isPaused, setIsPaused] = useState(false);
    const [gameState, setGameState] = useState<'PLAYING' | 'FINISHED'>('PLAYING');
    
    // Data Containers
    const [missingData, setMissingData] = useState<{reference: string[], question: string[], answer: number} | null>(null);
    const [symbolData, setSymbolData] = useState<{left: string[], right: string[], isSame: boolean} | null>(null);
    const [matchingData, setMatchingData] = useState<{map: string[], target: string, answer: number} | null>(null);
    const [groupingData, setGroupingData] = useState<{target: string, grid: string[], totalCorrect: number} | null>(null);
    const [groupingSelection, setGroupingSelection] = useState<number[]>([]); 

    // Stats
    const [stats, setStats] = useState<{section: number, correct: number, wrong: number}[]>([]);
    const [currentCorrect, setCurrentCorrect] = useState(0);
    const [currentWrong, setCurrentWrong] = useState(0);

    const [flashFeedback, setFlashFeedback] = useState<'CORRECT' | 'WRONG' | null>(null);

    // --- GAME ENGINE ---

    const loadNextQuestion = useCallback(() => {
        if (mode === 'ANGKA' || mode === 'HURUF' || mode === 'SIMBOL_HILANG') {
            if (!missingData) {
                const newData = generateMissingItemData(mode);
                setMissingData(newData);
            } else {
                const missingIdx = Math.floor(Math.random() * 5);
                const questionItems = missingData.reference.filter((_, idx) => idx !== missingIdx).sort(() => 0.5 - Math.random());
                setMissingData({
                    ...missingData,
                    question: questionItems,
                    answer: missingIdx
                });
            }
        } else if (mode === 'SAMA_BEDA') {
            setSymbolData(generateSymbolData());
        } else if (mode === 'MATCHING') {
            if (!matchingData) {
                setMatchingData(generateMatchingData());
            } else {
                 const targetIdx = Math.floor(Math.random() * 5);
                 setMatchingData({
                     ...matchingData,
                     target: matchingData.map[targetIdx],
                     answer: targetIdx
                 });
            }
        } else if (mode === 'GROUPING') {
            setGroupingData(generateGroupingData());
            setGroupingSelection([]);
        }
    }, [mode, missingData, matchingData]);

    const initializeSection = useCallback(() => {
        setMissingData(null); 
        setMatchingData(null);
        setSymbolData(null);
        setGroupingData(null);
        
        if (mode === 'ANGKA' || mode === 'HURUF' || mode === 'SIMBOL_HILANG') {
             setMissingData(generateMissingItemData(mode));
        } else if (mode === 'SAMA_BEDA') {
             setSymbolData(generateSymbolData());
        } else if (mode === 'MATCHING') {
             setMatchingData(generateMatchingData());
        } else if (mode === 'GROUPING') {
             setGroupingData(generateGroupingData());
             setGroupingSelection([]);
        }

        setTimeLeft(DURATION_PER_SECTION);
        setCurrentCorrect(0);
        setCurrentWrong(0);
    }, [mode]);

    useEffect(() => {
        if (gameState === 'PLAYING') initializeSection();
    }, [currentSection, mode, gameState]);

    // --- INPUT HANDLERS ---

    const handleAnswer = (val: any) => {
        if (isPaused) return;

        let isCorrect = false;

        if (mode === 'ANGKA' || mode === 'HURUF' || mode === 'SIMBOL_HILANG') {
            isCorrect = (val === missingData?.answer);
        } else if (mode === 'SAMA_BEDA') {
            isCorrect = (val === symbolData?.isSame);
        } else if (mode === 'MATCHING') {
            isCorrect = (val === matchingData?.answer);
        }

        if (isCorrect) {
            setCurrentCorrect(prev => prev + 1);
            setFlashFeedback('CORRECT');
        } else {
            setCurrentWrong(prev => prev + 1);
            setFlashFeedback('WRONG');
            SoundManager.play('error');
        }

        setTimeout(() => setFlashFeedback(null), 150);
        loadNextQuestion();
    };

    const handleGroupingSubmit = () => {
        if (!groupingData) return;
        
        let hits = 0;
        let falseAlarms = 0;
        
        groupingSelection.forEach(idx => {
            if (groupingData.grid[idx] === groupingData.target) hits++;
            else falseAlarms++;
        });

        const misses = groupingData.totalCorrect - hits;
        
        setCurrentCorrect(prev => prev + hits);
        setCurrentWrong(prev => prev + falseAlarms + misses); 

        if (falseAlarms === 0 && misses === 0) {
             setFlashFeedback('CORRECT');
             SoundManager.play('success');
        } else {
             setFlashFeedback('WRONG');
             SoundManager.play('error');
        }
        
        setTimeout(() => setFlashFeedback(null), 200);
        loadNextQuestion();
    };

    const toggleGroupingSelection = (idx: number) => {
        SoundManager.play('click');
        setGroupingSelection(prev => {
            if (prev.includes(idx)) return prev.filter(i => i !== idx);
            return [...prev, idx];
        });
    };

    // --- TIMING ---
    useEffect(() => {
        if (isPaused || gameState === 'FINISHED') return;

        const timer = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 6 && prev > 1) {
                     SoundManager.play('tick'); 
                }
                
                if (prev <= 1) {
                    handleSectionEnd();
                    return 0; 
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPaused, currentSection, gameState, currentCorrect, currentWrong]); 
    // Added currentCorrect/currentWrong to dependencies to capture latest values

    const handleSectionEnd = () => {
        setStats(prevStats => {
            // Check if section already recorded to avoid duplicates due to strict mode/race conditions
            if (prevStats.find(s => s.section === currentSection)) return prevStats;

            const sectionStat = {
                section: currentSection,
                correct: currentCorrect,
                wrong: currentWrong
            };
            
            const newStats = [...prevStats, sectionStat];
            
            if (currentSection >= TOTAL_SECTIONS) {
                setTimeout(() => setGameState('FINISHED'), 0);
            } else {
                setTimeout(() => {
                    setCurrentSection(s => s + 1);
                    SoundManager.play('success');
                }, 0);
            }
            return newStats;
        });
    };

    const finishTest = () => {
        const currentTotalSections = stats.length;
        const totalCorrect = stats.reduce((acc, curr) => acc + curr.correct, 0);
        const totalWrong = stats.reduce((acc, curr) => acc + curr.wrong, 0);
        const avgSpeed = currentTotalSections > 0 ? totalCorrect / currentTotalSections : 0; 
        const totalAttempts = totalCorrect + totalWrong;
        const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
        
        const mean = avgSpeed;
        const variance = stats.reduce((acc, curr) => acc + Math.pow(curr.correct - mean, 2), 0) / (currentTotalSections || 1);
        const stability = Math.sqrt(variance);

        const verdict = calculateVerdict(accuracy, avgSpeed, stability);

        const resultDetails: TesKecermatanResultDetails = {
            mode,
            totalCorrect,
            totalWrong,
            averageSpeed: parseFloat(avgSpeed.toFixed(1)),
            accuracy: parseFloat(accuracy.toFixed(1)),
            sectionData: stats,
            stability: parseFloat(stability.toFixed(2)),
            verdict
        };

        const historyItem: TestHistoryItem = {
            id: `kecer-${Date.now()}`,
            date: new Date().toISOString(),
            category: 'KECERMATAN',
            score: Math.round(accuracy), 
            maxScore: 100,
            details: resultDetails,
            questions: [],
            answers: []
        };

        SoundManager.play('finish');
        onComplete(historyItem);
    };

    const handleEarlyExit = () => {
         const currentSectionStat = {
            section: currentSection,
            correct: currentCorrect,
            wrong: currentWrong
        };
        
        // Add current progress and finish
        // Logic updated to ensure we capture current stats correctly
        const finalStats = [...stats];
        // Only add if not already present
        if (!finalStats.find(s => s.section === currentSection)) {
            finalStats.push(currentSectionStat);
        }

        const totalCorrect = finalStats.reduce((acc, curr) => acc + curr.correct, 0);
        const totalWrong = finalStats.reduce((acc, curr) => acc + curr.wrong, 0);
        const avgSpeed = totalCorrect / (finalStats.length || 1);
        const totalAttempts = totalCorrect + totalWrong;
        const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;
        const stability = 0; // Not applicable for incomplete/early exit usually
        const verdict = "Belum Selesai";

         const resultDetails: TesKecermatanResultDetails = {
            mode,
            totalCorrect,
            totalWrong,
            averageSpeed: parseFloat(avgSpeed.toFixed(1)),
            accuracy: parseFloat(accuracy.toFixed(1)),
            sectionData: finalStats,
            stability: parseFloat(stability.toFixed(2)),
            verdict
        };

        const historyItem: TestHistoryItem = {
            id: `kecer-${Date.now()}`,
            date: new Date().toISOString(),
            category: 'KECERMATAN',
            score: Math.round(accuracy), 
            maxScore: 100,
            details: resultDetails,
            questions: [],
            answers: [],
            isAborted: true
        };
        
        onComplete(historyItem);
    };

    // --- RENDER FINISH SCREEN ---
    if (gameState === 'FINISHED') {
        // Stats calculations
        const totalCorrect = stats.reduce((acc, curr) => acc + curr.correct, 0);
        const totalWrong = stats.reduce((acc, curr) => acc + curr.wrong, 0);
        const avgSpeed = totalCorrect / stats.length;
        const accuracy = (totalCorrect / (totalCorrect + totalWrong)) * 100;
        const mean = avgSpeed;
        const variance = stats.reduce((acc, curr) => acc + Math.pow(curr.correct - mean, 2), 0) / stats.length;
        const stability = Math.sqrt(variance);
        const verdict = calculateVerdict(accuracy, avgSpeed, stability);

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex items-center justify-center animate-fade-in">
                <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Tes Selesai!</h2>
                    <p className="text-slate-500 dark:text-slate-400 mb-8">Berikut hasil performa kecermatan Anda.</p>

                    <div className="flex justify-center mb-8">
                        <div className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold text-xl shadow-lg shadow-indigo-200 dark:shadow-none animate-bounce-slow">
                            {verdict}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Kecepatan</div>
                            <div className="text-2xl font-black text-slate-800 dark:text-white">{avgSpeed.toFixed(1)}</div>
                            <div className="text-[10px] text-slate-500">poin/menit</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Akurasi</div>
                            <div className="text-2xl font-black text-emerald-500">{accuracy.toFixed(1)}%</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700 rounded-xl">
                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Stabilitas</div>
                            <div className="text-2xl font-black text-amber-500">{stability.toFixed(2)}</div>
                            <div className="text-[10px] text-slate-500">deviasi</div>
                        </div>
                    </div>

                    {/* Enhanced Graph Bar - Shows all 10 sections clearly */}
                    <div className="mb-8">
                        <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 text-left">Grafik Performa Per Menit</h4>
                        <div className="h-40 flex items-end gap-2 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 relative">
                            {Array.from({length: TOTAL_SECTIONS}).map((_, i) => {
                                const stat = stats.find(s => s.section === i + 1);
                                const val = stat ? stat.correct : 0;
                                const max = Math.max(...stats.map(st => st.correct), 10); // Minimum scale to avoid division by zero or huge bars for small scores
                                const h = (val / max) * 100;
                                
                                return (
                                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative h-full">
                                        <div className="w-full bg-indigo-500/80 hover:bg-indigo-600 transition-all rounded-t-sm relative" style={{height: `${h}%`}}>
                                             {/* Tooltip on Hover */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded z-10 shadow-lg whitespace-nowrap">
                                                Menit {i+1}: {val}
                                            </div>
                                        </div>
                                        <div className="mt-1 text-[9px] font-bold text-slate-400">{i+1}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <button onClick={finishTest} className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2">
                        <Save size={20}/> Simpan Hasil
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="px-4 py-2 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm shrink-0 z-20">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bagian</span>
                        <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{currentSection}/{TOTAL_SECTIONS}</span>
                    </div>
                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700"></div>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Waktu</span>
                        <span className={`text-lg font-mono font-black ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
                            {timeLeft}s
                        </span>
                    </div>
                     <div className="hidden sm:flex flex-col border-l pl-4 border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Benar</span>
                        <span className="text-lg font-black text-emerald-600">{currentCorrect}</span>
                    </div>
                </div>
                <button onClick={() => setIsPaused(true)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600">
                    <Pause size={20} className="text-slate-600 dark:text-slate-300"/>
                </button>
            </div>

            {/* Game Area Wrapper */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Feedback Overlay */}
                {flashFeedback && (
                    <div className={`absolute inset-0 z-10 flex items-center justify-center pointer-events-none transition-opacity duration-150 ${flashFeedback === 'CORRECT' ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}>
                        <div className={`p-4 rounded-full ${flashFeedback === 'CORRECT' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'} shadow-xl transform scale-125`}>
                            {flashFeedback === 'CORRECT' ? <CheckCircle size={64}/> : <RotateCcw size={64}/>}
                        </div>
                    </div>
                )}

            {/* GAME CONTENT */}
            <div className="flex-1 flex flex-col items-center justify-center p-2 w-full max-w-4xl mx-auto h-full min-h-0">
                
                {/* MODE: MISSING ITEM (ANGKA/HURUF/SIMBOL_HILANG) & MATCHING */}
                {(mode === 'ANGKA' || mode === 'HURUF' || mode === 'MATCHING' || mode === 'SIMBOL_HILANG') && (
                    <div className="w-full h-full flex flex-col justify-center gap-4 sm:gap-8">
                        {/* Static Reference Grid / Key - MOVED UP and styled for realism */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border-2 border-indigo-100 dark:border-slate-700 p-4 shrink-0 -mt-8 translate-y-[-10%] z-20">
                            <div className="grid grid-cols-5 gap-2 sm:gap-4 mb-3">
                                {(mode === 'MATCHING' ? matchingData?.map : missingData?.reference)?.map((item, idx) => (
                                    <div key={idx} className={`aspect-square flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl shadow-inner`}>
                                        <span className={`${mode === 'MATCHING' || mode === 'SIMBOL_HILANG' ? 'text-4xl sm:text-6xl' : 'text-3xl sm:text-5xl'} font-black text-slate-800 dark:text-white leading-none`}>
                                            {item}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-5 gap-2 sm:gap-4 text-center">
                                {LABELS.map((label, idx) => (
                                    <div key={idx} className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-black shadow-md">
                                            {label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Question Area */}
                        <div className="text-center py-4 flex flex-col justify-center items-center">
                            <div className="mb-6">
                                <span className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.3em] shadow-sm border border-amber-200 dark:border-amber-800">
                                    {mode === 'MATCHING' ? 'Temukan Padanan' : 'Simbol yang Hilang?'}
                                </span>
                            </div>
                            
                            {mode === 'MATCHING' ? (
                                <div className="w-28 h-28 sm:w-36 sm:h-36 flex items-center justify-center bg-white dark:bg-slate-800 border-4 border-indigo-500 rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.2)] transform hover:scale-105 transition-transform duration-500">
                                    <span className="text-7xl sm:text-8xl font-black text-slate-800 dark:text-white">{matchingData?.target}</span>
                                </div>
                            ) : (
                                <div className="flex justify-center gap-2 sm:gap-5 flex-wrap px-4 py-8 bg-white/40 dark:bg-slate-800/40 backdrop-blur rounded-[2rem] border border-white/50 dark:border-slate-700/50 shadow-inner">
                                    {missingData?.question.map((item, idx) => (
                                        <div key={idx} className="w-14 h-20 sm:w-24 sm:h-32 flex items-center justify-center bg-white dark:bg-slate-800 rounded-2xl border-2 border-slate-200 dark:border-slate-600 shadow-xl text-slate-800 dark:text-white font-black text-3xl sm:text-5xl transform -rotate-2 hover:rotate-0 transition-transform">
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                    {/* MODE: SAMA BEDA SIMBOL */}
                    {mode === 'SAMA_BEDA' && symbolData && (
                        <div className="w-full max-w-md h-full flex flex-col justify-center gap-4 text-center min-h-0">
                             <div className="flex flex-col gap-2 sm:gap-4 flex-1 justify-center min-h-0">
                                 {/* Box 1 */}
                                 <div className="bg-white dark:bg-slate-800 p-2 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-600 shadow-md flex-1 flex items-center justify-center">
                                     <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
                                         {symbolData.left.map((s, i) => <span key={i} className="text-2xl sm:text-4xl text-slate-800 dark:text-white">{s}</span>)}
                                     </div>
                                 </div>
                                 
                                 {/* Box 2 */}
                                 <div className="bg-white dark:bg-slate-800 p-2 sm:p-6 rounded-2xl border-2 border-slate-200 dark:border-slate-600 shadow-md flex-1 flex items-center justify-center">
                                     <div className="flex justify-center gap-1 sm:gap-2 flex-wrap">
                                         {symbolData.right.map((s, i) => <span key={i} className="text-2xl sm:text-4xl text-slate-800 dark:text-white">{s}</span>)}
                                     </div>
                                 </div>
                             </div>
                             
                             <div className="grid grid-cols-2 gap-4 shrink-0">
                                 <button onClick={() => handleAnswer(true)} className="h-16 sm:h-24 bg-emerald-500 hover:bg-emerald-600 text-white rounded-3xl font-black text-lg sm:text-xl shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center">
                                     <CheckCircle size={24} className="mb-1 hidden sm:block"/> SAMA
                                 </button>
                                 <button onClick={() => handleAnswer(false)} className="h-16 sm:h-24 bg-rose-500 hover:bg-rose-600 text-white rounded-3xl font-black text-lg sm:text-xl shadow-lg active:scale-95 transition-transform flex flex-col items-center justify-center">
                                     <RotateCcw size={24} className="mb-1 hidden sm:block"/> BEDA
                                 </button>
                             </div>
                             <p className="text-xs text-slate-400 pb-1">Bandingkan kedua kotak. Sama atau Beda?</p>
                        </div>
                    )}

                    {/* MODE: GROUPING */}
                    {mode === 'GROUPING' && groupingData && (
                        <div className="w-full h-full flex flex-col overflow-hidden min-h-0">
                             <div className="flex justify-between items-center mb-2 px-2 shrink-0">
                                 <div className="text-sm font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                     Pilih: <span className="text-2xl bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border inline-block shadow-sm text-indigo-600">{groupingData.target}</span>
                                 </div>
                                 <button onClick={handleGroupingSubmit} className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 shadow-md active:scale-95 transition">
                                     Lanjut
                                 </button>
                             </div>
                             
                             <div className="flex-1 grid grid-cols-5 grid-rows-4 gap-1 sm:gap-2 p-1 content-center justify-items-center h-full min-h-0">
                                 {groupingData.grid.map((sym, idx) => {
                                     const isSelected = groupingSelection.includes(idx);
                                     return (
                                         <button 
                                            key={idx}
                                            onClick={() => toggleGroupingSelection(idx)}
                                            className={`w-full h-full rounded-xl flex items-center justify-center text-xl sm:text-3xl transition-all duration-75 ${isSelected ? 'bg-indigo-600 text-white shadow-inner scale-95 border-2 border-indigo-700' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-300'}`}
                                         >
                                             {sym}
                                         </button>
                                     );
                                 })}
                             </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Controls (Answer Buttons) - Only for Mapping/Missing */}
            {(mode === 'ANGKA' || mode === 'HURUF' || mode === 'MATCHING' || mode === 'SIMBOL_HILANG') && (
                <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 p-2 sm:p-4 pb-6 shrink-0 z-30">
                    <div className="max-w-3xl mx-auto">
                        <div className="grid grid-cols-5 gap-2 md:gap-4">
                            {LABELS.map((label, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    className="h-14 sm:h-20 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-indigo-600 dark:hover:bg-indigo-600 hover:text-white active:scale-95 transition-all shadow-sm border-b-4 border-slate-200 dark:border-slate-900 active:border-b-0 active:translate-y-1 flex flex-col items-center justify-center gap-1 group text-slate-700 dark:text-slate-200"
                                >
                                    <span className="text-xl sm:text-2xl font-black">{label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Pause Modal */}
            {isPaused && (
                 <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Tes Dijeda</h2>
                    <p className="text-white/60 mb-6 text-sm">Ambil napas sejenak, fokus kembali.</p>
                    <button onClick={() => setIsPaused(false)} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg mb-4 hover:scale-105 transition w-full max-w-xs shadow-lg">
                        Lanjutkan
                    </button>
                    <button onClick={handleEarlyExit} className="px-8 py-4 bg-transparent border-2 border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/10 transition w-full max-w-xs">
                        Keluar (Simpan)
                    </button>
                </div>
            )}
        </div>
    );
};