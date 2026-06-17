
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, Pause, Play, Save, Activity, Clock, CheckCircle, RotateCcw, BarChart2 } from 'lucide-react';
import { TesKoranConfig, TesKoranResultDetails, TestHistoryItem } from '../types';
import { SoundManager } from '../services/soundService';

interface TesKoranProps {
    onBack: () => void;
    onComplete: (historyItem: TestHistoryItem) => void;
}

// --- CONSTANTS ---
const PAULI_DURATION_MINS = 10; 
const INTERVAL_SECONDS = 60; // 1 Minute interval
const NUM_PRELOAD_COLS = 500; // Generate enough columns initially
const NUM_ROWS = 50; // Standard numbers per column

// --- ALGORITHMS ---

// Generator Angka Lokal
const generateNumbers = (cols: number, rows: number) => {
    return Array.from({ length: cols }, () => 
        Array.from({ length: rows }, () => Math.floor(Math.random() * 10))
    );
};

// Algoritma Penilaian Pauli/Koran Komprehensif
const getPauliVerdict = (totalCorrect: number, avgSpeed: number, accuracy: number, stability: number, trend: 'NAIK' | 'STABIL' | 'TURUN') => {
    // 1. Prestasi (Total Volume)
    let score = 0;
    if (totalCorrect >= 400) score += 40; // ~40/menit x 10
    else if (totalCorrect >= 300) score += 30;
    else if (totalCorrect >= 200) score += 20;
    else score += 10;

    // 2. Ketelitian (Accuracy)
    if (accuracy >= 99) score += 20;
    else if (accuracy >= 97) score += 15;
    else if (accuracy >= 95) score += 10;
    else score += 5;

    // 3. Stabilitas (Deviasi) - Rendah lebih baik
    if (stability < 3.0) score += 20;
    else if (stability < 6.0) score += 15;
    else if (stability < 9.0) score += 10;
    else score += 5;

    // 4. Ketahanan (Tren)
    if (trend === 'NAIK') score += 20;
    else if (trend === 'STABIL') score += 15;
    else score += 5; // Turun drastis (kelelahan)

    // Verdict String
    if (score >= 90) return "Sangat Disarankan (Konsisten & Tinggi)";
    if (score >= 75) return "Disarankan (Baik)";
    if (score >= 60) return "Cukup (Perlu Latihan)";
    if (trend === 'TURUN' && stability > 8) return "Indikasi Kelelahan / Emosi Tidak Stabil";
    return "Kurang Disarankan";
};

// Analisis Tren Grafik (Naik/Turun/Stabil)
const analyzeTrend = (intervals: number[]): 'NAIK' | 'STABIL' | 'TURUN' => {
    if (intervals.length < 2) return 'STABIL';
    
    // Bandingkan paruh pertama dan paruh kedua
    const half = Math.floor(intervals.length / 2);
    const firstHalf = intervals.slice(0, half);
    const secondHalf = intervals.slice(half);

    const avgFirst = firstHalf.reduce((a,b)=>a+b,0) / (firstHalf.length || 1);
    const avgSecond = secondHalf.reduce((a,b)=>a+b,0) / (secondHalf.length || 1);

    const diffPercent = ((avgSecond - avgFirst) / avgFirst) * 100;

    if (diffPercent > 5) return 'NAIK'; // Produktivitas meningkat
    if (diffPercent < -10) return 'TURUN'; // Indikasi kelelahan signifikan
    return 'STABIL';
};

export const TesKoran: React.FC<TesKoranProps> = ({ onBack, onComplete }) => {
    const [gameState, setGameState] = useState<'SETUP' | 'PLAYING' | 'PAUSED' | 'FINISHED'>('SETUP');
    
    // Game Data
    const [columnsData, setColumnsData] = useState<number[][]>([]);
    
    // Cursors & Tracking
    const [colIndex, setColIndex] = useState(0);
    const [rowIndex, setRowIndex] = useState(0);
    const [totalCorrect, setTotalCorrect] = useState(0);
    const [totalWrong, setTotalWrong] = useState(0);
    
    // Interval Tracking for Pauli Graph
    const [intervalCounts, setIntervalCounts] = useState<number[]>([]); // Stores correct count at each "GARIS"
    const [currentIntervalCorrect, setCurrentIntervalCorrect] = useState(0);
    const [showGarisIndicator, setShowGarisIndicator] = useState(false);

    // Timers
    const [timeLeft, setTimeLeft] = useState(PAULI_DURATION_MINS * 60);
    const [intervalTimer, setIntervalTimer] = useState(INTERVAL_SECONDS);

    // --- SETUP ---
    const startTest = () => {
        const data = generateNumbers(NUM_PRELOAD_COLS, NUM_ROWS);
        setColumnsData(data);
        
        setColIndex(0);
        setRowIndex(0);
        setTotalCorrect(0);
        setTotalWrong(0);
        setIntervalCounts([]);
        setCurrentIntervalCorrect(0);
        
        setTimeLeft(PAULI_DURATION_MINS * 60);
        setIntervalTimer(INTERVAL_SECONDS);
        
        setGameState('PLAYING');
        SoundManager.play('click');
    };

    // --- LOGIC ---
    const handleInput = useCallback((num: number) => {
        if (gameState !== 'PLAYING') return;

        const n1 = columnsData[colIndex][rowIndex];
        const n2 = columnsData[colIndex][rowIndex + 1];

        // Jika row habis, pindah kolom
        if (n2 === undefined) {
             setColIndex(prev => prev + 1);
             setRowIndex(0);
             return; 
        }

        const sum = n1 + n2;
        const correctDigit = sum % 10;
        
        const isCorrect = num === correctDigit;

        if (isCorrect) {
            setTotalCorrect(prev => prev + 1);
            setCurrentIntervalCorrect(prev => prev + 1);
        } else {
            setTotalWrong(prev => prev + 1);
            SoundManager.play('error');
        }

        // Move Cursor
        if (rowIndex < NUM_ROWS - 2) {
            setRowIndex(prev => prev + 1);
        } else {
            // End of column, move to next
            setColIndex(prev => prev + 1);
            setRowIndex(0);
        }
    }, [columnsData, colIndex, rowIndex, gameState]);

    // Handle Keyboard Input
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (gameState !== 'PLAYING') return;
            if (e.key >= '0' && e.key <= '9') {
                handleInput(parseInt(e.key));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameState, handleInput]);


    // --- TIMERS & INTERVALS ---
    useEffect(() => {
        if (gameState !== 'PLAYING') return;

        const timer = setInterval(() => {
            // Main Timer
            setTimeLeft(prev => {
                if (prev <= 1) {
                    finishGame();
                    return 0;
                }
                return prev - 1;
            });

            // Interval Timer (GARIS)
            setIntervalTimer(prev => {
                if (prev <= 6 && prev > 1) {
                    // Sound on last 5 seconds of interval
                    SoundManager.play('tick');
                }

                if (prev <= 1) {
                    // Trigger GARIS
                    SoundManager.play('success'); // Distinct sound for GARIS
                    triggerGaris();
                    return INTERVAL_SECONDS;
                }
                return prev - 1;
            });

        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, currentIntervalCorrect]); 
    
    // Correct way to capture interval data without stale closures
    const currentIntervalCorrectRef = useRef(0);
    useEffect(() => {
        currentIntervalCorrectRef.current = currentIntervalCorrect;
    }, [currentIntervalCorrect]);

    const triggerGaris = () => {
        // Save current count snapshot
        const snapshot = currentIntervalCorrectRef.current;
        setIntervalCounts(prev => [...prev, snapshot]);
        setCurrentIntervalCorrect(0); // Reset for next interval

        // Visual Feedback
        setShowGarisIndicator(true);
        setTimeout(() => setShowGarisIndicator(false), 2000);
    };

    const finishGame = (isAborted: boolean = false) => {
        // Add last interval data
        const snapshot = currentIntervalCorrectRef.current;
        if (snapshot > 0) {
            setIntervalCounts(prev => [...prev, snapshot]);
        }
        setGameState('FINISHED');
        if (!isAborted) SoundManager.play('finish');
    };

    // --- CALCULATION ---
    const calculateResults = (): TesKoranResultDetails & { interpretation: any } => {
        const totalAttempts = totalCorrect + totalWrong;
        const timeUsedMinutes = (PAULI_DURATION_MINS * 60 - timeLeft) / 60;
        
        // If aborted very early, avoid division by near zero
        const effectiveTime = timeUsedMinutes < 0.1 ? 0.1 : timeUsedMinutes;

        const speedPerMinute = effectiveTime > 0 ? Math.round(totalCorrect / effectiveTime) : 0;
        const accuracy = totalAttempts > 0 ? (totalCorrect / totalAttempts) * 100 : 0;

        // Stability (Standard Deviation of Interval Counts)
        let stdDev = 0;
        if (intervalCounts.length > 0) {
            const mean = intervalCounts.reduce((a, b) => a + b, 0) / intervalCounts.length;
            const variance = intervalCounts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervalCounts.length;
            stdDev = Math.sqrt(variance);
        }

        const trend = analyzeTrend(intervalCounts);
        const verdict = getPauliVerdict(totalCorrect, speedPerMinute, accuracy, stdDev, trend);

        return {
            totalCorrect,
            totalWrong,
            totalAttempts,
            totalColumns: colIndex,
            speedPerMinute,
            consistencyScore: parseFloat(stdDev.toFixed(2)),
            accuracy: Math.round(accuracy),
            intervalData: intervalCounts,
            interpretation: {
                verdict: verdict, 
                speedDesc: speedPerMinute > 50 ? "Sangat Cepat" : speedPerMinute > 35 ? "Cepat" : "Sedang",
                accDesc: accuracy > 98 ? "Sangat Teliti" : accuracy > 92 ? "Teliti" : "Kurang Teliti",
                stabDesc: trend === 'TURUN' ? "Menurun (Lelah)" : (stdDev < 4 ? "Stabil" : "Fluktuatif"),
                trend: trend
            }
        };
    };

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    };

    const handleEarlyExit = () => {
        // Save progress and exit
        const results = calculateResults();
        const historyItem: TestHistoryItem = {
            id: `pauli-${Date.now()}`,
            date: new Date().toISOString(),
            category: 'PSIKOTEST',
            score: results.totalCorrect, // Use Total Correct as main score for Pauli
            maxScore: 0,
            details: results,
            questions: [],
            answers: [],
            isAborted: true
        };
        onComplete(historyItem);
    }

    // --- RENDERERS ---

    if (gameState === 'SETUP') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center">
                <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700 animate-fade-in-up">
                    <div className="p-8 bg-indigo-600 text-white text-center relative overflow-hidden">
                        <Activity size={64} className="mx-auto mb-4 relative z-10"/>
                        <h1 className="text-3xl font-black relative z-10">Tes Pauli Digital</h1>
                        <p className="opacity-90 relative z-10 text-sm mt-2">Uji Ketahanan & Stabilitas Kerja</p>
                    </div>
                    <div className="p-8 space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300 space-y-3">
                            <p className="flex items-center gap-3"><Clock size={18} className="text-indigo-500 shrink-0"/> <span><strong>Durasi:</strong> {PAULI_DURATION_MINS} Menit</span></p>
                            <p className="flex items-center gap-3"><Activity size={18} className="text-emerald-500 shrink-0"/> <span><strong>Instruksi:</strong> Jumlahkan dua angka yang berdekatan. Masukkan digit satuan saja (misal: 12 &rarr; 2).</span></p>
                            <p className="flex items-center gap-3"><BarChart2 size={18} className="text-amber-500 shrink-0"/> <span><strong>Garis:</strong> Setiap 1 menit, muncul tanda 'Garis'. Tetap lanjutkan menghitung.</span></p>
                        </div>

                        <button onClick={startTest} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition flex items-center justify-center gap-2 hover:scale-105 transform duration-200">
                            <Play size={24} fill="currentColor"/> Mulai Tes
                        </button>
                        <button onClick={onBack} className="w-full py-3 text-slate-500 hover:text-indigo-600 font-bold text-sm transition">Kembali</button>
                    </div>
                </div>
            </div>
        );
    }

    if (gameState === 'FINISHED') {
        const results = calculateResults();
        
        const historyItem: TestHistoryItem = {
            id: `pauli-${Date.now()}`,
            date: new Date().toISOString(),
            category: 'PSIKOTEST',
            score: results.totalCorrect, // Use Total Correct as the main score (Prestasi)
            maxScore: 0,
            details: results,
            questions: [],
            answers: []
        };

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 flex items-center justify-center animate-fade-in">
                <div className="max-w-4xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white">Analisis Profil Kerja</h2>
                        <div className="mt-4 inline-block px-6 py-2 bg-indigo-600 text-white text-xl font-bold rounded-full shadow-lg">
                            {results.interpretation.verdict}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                         <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-center border border-slate-100 dark:border-slate-600">
                            <div className="text-xs text-slate-400 uppercase font-bold mb-2 flex justify-center items-center gap-1"><Activity size={14}/> Prestasi (Total)</div>
                            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{results.totalCorrect}</div>
                            <div className="text-[10px] text-slate-500">jawaban benar</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-center border border-slate-100 dark:border-slate-600">
                            <div className="text-xs text-slate-400 uppercase font-bold mb-2 flex justify-center items-center gap-1"><Clock size={14}/> Tempo</div>
                            <div className="text-3xl font-black text-slate-800 dark:text-white">{results.speedPerMinute}</div>
                            <div className="text-[10px] text-slate-500">rata-rata/menit</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-center border border-slate-100 dark:border-slate-600">
                            <div className="text-xs text-slate-400 uppercase font-bold mb-2 flex justify-center items-center gap-1"><CheckCircle size={14}/> Ketelitian</div>
                            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{results.totalWrong}</div>
                            <div className="text-[10px] text-slate-500">kesalahan ({results.interpretation.accDesc})</div>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl text-center border border-slate-100 dark:border-slate-600">
                            <div className="text-xs text-slate-400 uppercase font-bold mb-2 flex justify-center items-center gap-1"><BarChart2 size={14}/> Stabilitas</div>
                            <div className="text-3xl font-black text-amber-500">{results.consistencyScore}</div>
                            <div className="text-[10px] text-slate-500">deviasi ({results.interpretation.trend})</div>
                        </div>
                    </div>

                    <div className="mb-8">
                        <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2"><BarChart2 size={18}/> Grafik Ritme Kerja (Per 1 Menit)</h3>
                        <div className="h-48 flex items-end gap-1 p-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
                            {results.intervalData.map((val, idx) => {
                                const max = Math.max(...results.intervalData, 1);
                                const h = (val / max) * 100;
                                return (
                                    <div key={idx} className="flex-1 min-w-[20px] bg-indigo-500/80 hover:bg-indigo-500 transition-all rounded-t relative group" style={{height: `${h}%`}}>
                                         <div className="absolute bottom-0 w-full text-center text-[8px] text-white/50">{idx+1}</div>
                                         <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded z-10 shadow-lg">{val}</div>
                                    </div>
                                );
                            })}
                        </div>
                         <p className="text-xs text-slate-400 mt-2 text-center">Grafik yang menurun drastis menunjukkan indikasi kelelahan.</p>
                    </div>

                    <div className="flex gap-4">
                        <button onClick={() => { setGameState('SETUP'); }} className="flex-1 py-4 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition">
                            Ulangi Tes
                        </button>
                        <button onClick={() => onComplete(historyItem)} className="flex-1 py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none">
                            <Save size={20}/> Simpan & Keluar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- PLAYING STATE ---
    const col = columnsData[colIndex] || [];
    
    // Calculate visible range for "Sheet Mode" (Lembaran)
    // We show 20 numbers at a time as requested, centering the current active pair
    const visibleRange = 20;
    const startIdx = Math.max(0, rowIndex - 8);
    const endIdx = Math.min(col.length, startIdx + visibleRange);
    
    const visibleNumbers = col.slice(startIdx, endIdx);

    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

    return (
        <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col h-full overflow-hidden">
            
            {/* Header */}
            <div className="px-6 py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="text-[10px] text-slate-400 font-bold uppercase leading-none">Waktu</div>
                        <div className="text-xl font-mono font-bold text-slate-800 dark:text-white leading-tight">{formatTime(timeLeft)}</div>
                    </div>
                    <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    <div className="flex flex-col">
                        <div className="text-[10px] text-slate-400 font-bold uppercase leading-none">Poin</div>
                        <div className="text-xl font-bold text-emerald-600 leading-tight">{totalCorrect}</div>
                    </div>
                </div>
                
                {/* Interval Progress Bar */}
                <div className="hidden md:block flex-1 max-w-xs mx-8">
                     <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden group">
                        <div 
                            className="h-full bg-indigo-500 transition-all duration-1000"
                            style={{ width: `${(intervalTimer / INTERVAL_SECONDS) * 100}%` }}
                        />
                     </div>
                </div>

                <button onClick={() => setGameState('PAUSED')} className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600">
                    <Pause size={20} className="text-slate-600 dark:text-slate-300"/>
                </button>
            </div>

            {/* GARIS Indicator Overlay */}
            {showGarisIndicator && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 bg-amber-500 text-white px-8 py-3 rounded-2xl font-black shadow-2xl animate-bounce border-2 border-white flex items-center gap-2">
                    <Activity size={24}/> GARIS! — LANJUT KE KOLOM BERIKUTNYA
                </div>
            )}

            {/* Main Area - SHEET MODE (Lembaran) */}
            <div className="flex-1 flex flex-col items-center justify-start relative p-4 py-8 overflow-hidden select-none">
                <div className="flex flex-col items-center gap-0 w-full max-w-[200px]">
                    {/* Visualizing numbers in a column */}
                    {visibleNumbers.map((num, idx) => {
                        const actualIdx = startIdx + idx;
                        const isActiveTop = actualIdx === rowIndex;
                        const isActiveBottom = actualIdx === rowIndex + 1;
                        const isPast = actualIdx < rowIndex;
                        const isUpcoming = actualIdx > rowIndex + 1;

                        return (
                            <div 
                                key={`${colIndex}-${actualIdx}`}
                                className={`
                                    w-full h-14 flex items-center justify-center text-4xl font-mono font-black transition-all duration-200 relative
                                    ${isActiveTop || isActiveBottom ? 'bg-white dark:bg-slate-800 scale-110 z-10 shadow-lg text-indigo-600' : ''}
                                    ${isActiveTop ? 'rounded-t-2xl border-t-2 border-x-2 border-indigo-200 dark:border-indigo-900' : ''}
                                    ${isActiveBottom ? 'rounded-b-2xl border-b-2 border-x-2 border-indigo-200 dark:border-indigo-900 border-t-2 border-t-slate-100 dark:border-t-slate-700' : ''}
                                    ${isPast ? 'text-slate-300 dark:text-slate-800 scale-90 opacity-40' : ''}
                                    ${isUpcoming ? 'text-slate-600 dark:text-slate-400' : ''}
                                `}
                            >
                                {num}

                                {/* Answer placeholder in between */}
                                {isActiveTop && (
                                     <div className="absolute top-1/2 left-full ml-4 translate-y-[-50%]">
                                         <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white text-xl animate-pulse ring-4 ring-indigo-100 dark:ring-indigo-900/30">
                                             ?
                                         </div>
                                         <div className="absolute top-1/2 left-0 w-4 h-0.5 bg-indigo-600 -translate-x-full"></div>
                                     </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Column Progress Hint */}
                <div className="absolute right-8 top-1/2 translate-y-[-50%] hidden lg:flex flex-col items-center gap-1">
                    <div className="text-[10px] font-bold text-slate-400 rotate-90 mb-4 whitespace-nowrap">PROGRESS KOLOM</div>
                    <div className="h-64 w-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                            className="w-full bg-indigo-500 transition-all"
                            style={{ height: `${(rowIndex / NUM_ROWS) * 100}%` }}
                        />
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-500 mt-2">{rowIndex}/{NUM_ROWS}</div>
                </div>
            </div>

            {/* Virtual Numpad */}
            <div className="bg-white dark:bg-slate-800 p-4 pb-10 border-t-2 border-slate-200 dark:border-slate-700 shrink-0 z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.05)]">
                <div className="max-w-md mx-auto grid grid-cols-5 gap-3">
                    {numbers.map((num) => (
                        <button
                            key={num}
                            onClick={() => handleInput(num)}
                            className="h-16 sm:h-20 rounded-2xl bg-slate-50 dark:bg-slate-700/50 text-3xl font-black text-slate-700 dark:text-white shadow-[0_4px_0_rgb(226,232,240)] dark:shadow-[0_4px_0_rgb(15,23,42)] active:shadow-none active:translate-y-1 transition-all hover:bg-white dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600"
                        >
                            {num}
                        </button>
                    ))}
                </div>
            </div>

            {/* Pause Overlay */}
            {gameState === 'PAUSED' && (
                <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-8">
                    <h2 className="text-3xl font-bold text-white mb-2">Tes Dijeda</h2>
                    <p className="text-white/60 mb-6 text-sm">Ambil napas sejenak, lalu lanjutkan.</p>
                    <button onClick={() => setGameState('PLAYING')} className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg mb-4 hover:scale-105 transition w-full max-w-xs shadow-lg">
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
