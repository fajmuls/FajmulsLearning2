
// ... existing imports ...
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowLeft, CheckCircle, AlertTriangle, Eraser, MousePointer2, Eye, RefreshCw, Activity, Palette, GripHorizontal, Info, Layers, Box, Trophy, Star, Sparkles } from 'lucide-react';
import { TestHistoryItem } from '../types';
import { SoundManager } from '../services/soundService';

// ... existing interfaces and PALETTES ...

interface ColorBlindTestProps {
    onBack: () => void;
    onComplete: (item: TestHistoryItem) => void;
}

type PaletteType = 'RED_GREEN' | 'BLUE_YELLOW' | 'GRAYSCALE' | 'PROTANOPIA' | 'DEUTERANOPIA';
type QuestionType = 'NUMBER' | 'PATH';
type TestMode = 'MENU' | 'ISHIHARA' | 'HUE_SORT' | 'DEPTH';

interface QuestionConfig {
    id: number;
    type: QuestionType;
    palette: PaletteType;
    target: number | string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    description?: string;
}

// --- PALETTES (Medically Inspired) ---
const PALETTES = {
    RED_GREEN: {
        fg: ['#EA5455', '#FF9F43', '#E55039', '#F8EFBA', '#F97F51'], 
        bg: ['#2ECC71', '#26C6DA', '#1ABC9C', '#55E6C1', '#58B19F', '#CAD3C8'] 
    },
    BLUE_YELLOW: {
        fg: ['#5F27CD', '#341F97', '#54A0FF', '#2E86DE', '#0ABDE3'], 
        bg: ['#FECA57', '#FF9F43', '#F8C291', '#6AB04C', '#BADC58'] 
    },
    GRAYSCALE: {
        fg: ['#2d3436', '#636e72', '#b2bec3'], 
        bg: ['#dfe6e9', '#f5f6fa', '#dcdde1'] 
    },
    PROTANOPIA: { // Simulates confusion between Red and Dark Colors
        fg: ['#833471', '#6D214F', '#B33771', '#3B3B98'], 
        bg: ['#182C61', '#2C3A47', '#58B19F', '#2C2C54']
    },
    DEUTERANOPIA: { // Simulates confusion Green/Red/Brown
        fg: ['#D6A2E8', '#82589F', '#E056FD', '#BE2EDD'],
        bg: ['#95AFC0', '#7ED6DF', '#22A6B3', '#30336B']
    }
};

// --- ALGORITHMS ---

const generateRandomSequence = (): QuestionConfig[] => {
    const questions: QuestionConfig[] = [];
    let idCounter = 1;

    // 1. Control Plate (Easy Red-Green)
    questions.push({
        id: idCounter++, type: 'NUMBER', palette: 'RED_GREEN', target: 12, difficulty: 'EASY', description: "Control Plate"
    });

    // 2. Random Numbers (Red-Green Focus) - 5 Questions
    for(let i=0; i<5; i++) {
        const target = Math.floor(Math.random() * 90) + 10;
        const typeRand = Math.random();
        let palette: PaletteType = 'RED_GREEN';
        if (typeRand > 0.7) palette = 'DEUTERANOPIA';
        else if (typeRand > 0.4) palette = 'PROTANOPIA';
        
        questions.push({
            id: idCounter++, type: 'NUMBER', palette, target, difficulty: 'MEDIUM', description: "Red-Green Defect Check"
        });
    }

    // 3. Blue-Yellow & Grayscale - 3 Questions
    questions.push({ id: idCounter++, type: 'NUMBER', palette: 'BLUE_YELLOW', target: Math.floor(Math.random()*90)+10, difficulty: 'MEDIUM', description: "Tritanopia Check" });
    questions.push({ id: idCounter++, type: 'NUMBER', palette: 'GRAYSCALE', target: Math.floor(Math.random()*90)+10, difficulty: 'HARD', description: "Contrast Sensitivity" });
    questions.push({ id: idCounter++, type: 'NUMBER', palette: 'BLUE_YELLOW', target: Math.floor(Math.random()*90)+10, difficulty: 'HARD', description: "Tritanopia Check" });

    // 4. Paths - 6 Questions
    const shapes = ['curve_simple', 'snake', 'loop', 'spiral', 'zigzag', 'square', 'triangle', 'infinity'];
    const shuffledShapes = shapes.sort(() => 0.5 - Math.random());

    for(let i=0; i<6; i++) {
        const shape = shuffledShapes[i % shuffledShapes.length];
        const pRand = Math.random();
        let palette: PaletteType = 'RED_GREEN';
        if (pRand > 0.8) palette = 'GRAYSCALE';
        else if (pRand > 0.6) palette = 'BLUE_YELLOW';
        
        questions.push({
            id: idCounter++, type: 'PATH', palette, target: shape, difficulty: i > 3 ? 'HARD' : 'MEDIUM', description: `Path Tracking (${palette})`
        });
    }

    return questions;
};

// --- COMPONENTS ---

// Confetti Component for Victory
const CelebrationConfetti: React.FC = () => {
    return (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
            {[...Array(20)].map((_, i) => (
                <div 
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `-10%`,
                        backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)],
                        width: '10px',
                        height: '10px',
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: `${2 + Math.random() * 3}s`
                    }}
                />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-bounce-slow text-6xl text-yellow-400 drop-shadow-lg">
                    <Trophy size={120} fill="currentColor" />
                </div>
            </div>
        </div>
    );
};

// 1. ISHIHARA DOT RENDERER (Static Layer)
const IshiharaPlateCanvas: React.FC<{ 
    config: QuestionConfig, 
    onPathGenerated: (checkpoints: {x: number, y: number}[]) => void
}> = ({ config, onPathGenerated }) => {
    // ... existing canvas logic ...
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // --- GENERATE PATTERN MASK ---
        const offCanvas = document.createElement('canvas');
        offCanvas.width = canvas.width;
        offCanvas.height = canvas.height;
        const offCtx = offCanvas.getContext('2d');
        if (!offCtx) return;

        offCtx.fillStyle = '#000000'; 
        offCtx.fillRect(0, 0, canvas.width, canvas.height);
        offCtx.fillStyle = '#FFFFFF'; 
        offCtx.strokeStyle = '#FFFFFF'; 

        const checkpoints: {x: number, y: number}[] = [];

        if (config.type === 'NUMBER') {
            offCtx.font = 'bold 180px "Arial Rounded MT Bold", Arial, sans-serif';
            offCtx.textAlign = 'center';
            offCtx.textBaseline = 'middle';
            const angle = (Math.random() - 0.5) * 0.2; // Slight rotation
            offCtx.save();
            offCtx.translate(canvas.width / 2, canvas.height / 2);
            offCtx.rotate(angle);
            offCtx.fillText(config.target.toString(), 0, 15);
            offCtx.restore();
        } else {
            offCtx.lineWidth = 55; 
            offCtx.lineCap = 'round';
            offCtx.lineJoin = 'round';
            offCtx.beginPath();

            const w = canvas.width;
            const h = canvas.height;
            const pad = 50;

            // DYNAMIC SHAPES
            if (config.target === 'curve_simple') { offCtx.moveTo(pad, h/2); offCtx.quadraticCurveTo(w/2, -50, w-pad, h/2); } 
            else if (config.target === 'snake') { offCtx.moveTo(pad, h/2); offCtx.bezierCurveTo(w/3, 0, 2*w/3, h, w-pad, h/2); }
            else if (config.target === 'loop') { offCtx.arc(w/2, h/2, w/3, 0, Math.PI * 2); }
            else if (config.target === 'spiral') {
                const centerX = w/2, centerY = h/2; offCtx.moveTo(centerX, centerY);
                for(let i=0; i<100; i++) {
                    const angle = 0.3 * i; const r = 2 * i;
                    const x = centerX + r * Math.cos(angle); const y = centerY + r * Math.sin(angle);
                    if (x < pad || x > w-pad || y < pad || y > h-pad) break;
                    offCtx.lineTo(x, y);
                }
            }
            else if (config.target === 'zigzag') { offCtx.moveTo(pad, pad); offCtx.lineTo(w/2, h-pad); offCtx.lineTo(w-pad, pad); }
            else if (config.target === 'square') { offCtx.rect(pad, pad, w - 2*pad, h - 2*pad); }
            else if (config.target === 'triangle') { offCtx.moveTo(w/2, pad); offCtx.lineTo(w-pad, h-pad); offCtx.lineTo(pad, h-pad); offCtx.closePath(); }
            else if (config.target === 'infinity') { offCtx.moveTo(pad, h/2); offCtx.bezierCurveTo(w/3, 0, w/3, h, w/2, h/2); offCtx.bezierCurveTo(2*w/3, 0, 2*w/3, h, w-pad, h/2); }
            else { offCtx.moveTo(pad, h - pad); offCtx.bezierCurveTo(w/2, 0, w, h/2, w/2, h/2); offCtx.bezierCurveTo(0, h/2, w/2, h, w-pad, pad); }
            
            offCtx.stroke();

            // Extract Checkpoints
            const imgDataPath = offCtx.getImageData(0,0,w,h);
            const step = 20; 
            for(let y=0; y<h; y+=step) {
                for(let x=0; x<w; x+=step) {
                    if (imgDataPath.data[(y*w+x)*4] > 200) checkpoints.push({x,y});
                }
            }
            onPathGenerated(checkpoints);
        }

        // --- RENDER DOTS ---
        const imgData = offCtx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        const palette = PALETTES[config.palette];

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const plateRadius = canvas.width / 2 - 2;
        const numCircles = 3200; 

        for (let i = 0; i < numCircles; i++) {
            let x = Math.random() * canvas.width;
            let y = Math.random() * canvas.height;
            const dist = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (dist > plateRadius) continue;

            const pixelIdx = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
            const isForeground = pixels[pixelIdx] > 128;

            let r = Math.random() * 3 + 2; 
            if (config.difficulty === 'HARD') r = Math.random() * 2.5 + 1.5;

            let colors = isForeground ? palette.fg : palette.bg;
            // Noise
            if (config.difficulty === 'HARD' && Math.random() < 0.08) colors = isForeground ? palette.bg : palette.fg;

            const color = colors[Math.floor(Math.random() * colors.length)];

            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }, [config]);

    return <canvas ref={canvasRef} width={320} height={320} className="rounded-full shadow-lg bg-slate-100 dark:bg-slate-800" />;
};

// 2. INTERACTIVE DRAWING LAYER (Top Layer)
const InteractiveLayer: React.FC<{
    isActive: boolean;
    onStroke: (pos: {x: number, y: number}) => void;
    clearTrigger: number;
}> = ({ isActive, onStroke, clearTrigger }) => {
    // ... existing interactive logic ...
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if(canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.clearRect(0, 0, canvas.width, canvas.height);
        }
    }, [clearTrigger]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !isActive) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const getPos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            let clientX, clientY;
            if ('touches' in e) {
                clientX = e.touches[0].clientX;
                clientY = e.touches[0].clientY;
            } else {
                clientX = (e as MouseEvent).clientX;
                clientY = (e as MouseEvent).clientY;
            }
            return {
                x: (clientX - rect.left) * (canvas.width / rect.width),
                y: (clientY - rect.top) * (canvas.height / rect.height)
            };
        };

        const startDraw = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            setIsDrawing(true);
            const pos = getPos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
            ctx.lineWidth = 15;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = 'rgba(0, 0, 255, 0.7)';
            onStroke(pos);
        };

        const draw = (e: MouseEvent | TouchEvent) => {
            if (!isDrawing) return;
            e.preventDefault(); 
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
            onStroke(pos);
        };

        const stopDraw = () => {
            setIsDrawing(false);
            ctx.closePath();
        };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        window.addEventListener('mousemove', draw);
        window.addEventListener('touchmove', draw, { passive: false });
        window.addEventListener('mouseup', stopDraw);
        window.addEventListener('touchend', stopDraw);

        return () => {
            canvas.removeEventListener('mousedown', startDraw);
            canvas.removeEventListener('touchstart', startDraw);
            window.removeEventListener('mousemove', draw);
            window.removeEventListener('touchmove', draw);
            window.removeEventListener('mouseup', stopDraw);
            window.removeEventListener('touchend', stopDraw);
        };
    }, [isActive, isDrawing, onStroke]);

    return <canvas ref={canvasRef} width={320} height={320} className="absolute top-0 left-0 cursor-crosshair touch-none z-10" />;
};

// 3. HUE SORTING GAME COMPONENT
const HueSortingGame: React.FC<{ onFinish: (score: number) => void, initialSpectrum?: 'MIXED' | 'GREEN' | 'PURPLE' | 'RED' | 'BLUE' | 'GRAYSCALE' | 'CYAN_MAGENTA' | 'YELLOW_BLUE' | 'BROWN_GREEN' | 'PASTEL' }> = ({ onFinish, initialSpectrum }) => {
    const [tiles, setTiles] = useState<{id: number, color: string, correctIndex: number}[]>([]);
    const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);
    const [score, setScore] = useState(0);
    const [spectrumType, setSpectrumType] = useState<'MIXED' | 'GREEN' | 'PURPLE' | 'RED' | 'BLUE' | 'GRAYSCALE' | 'CYAN_MAGENTA' | 'YELLOW_BLUE' | 'BROWN_GREEN' | 'PASTEL'>('MIXED');
    const [gameStarted, setGameStarted] = useState(false);

    const startSpectrum = (type: 'MIXED' | 'GREEN' | 'PURPLE' | 'RED' | 'BLUE' | 'GRAYSCALE' | 'CYAN_MAGENTA' | 'YELLOW_BLUE' | 'BROWN_GREEN' | 'PASTEL') => {
        setSpectrumType(type);
        const count = 15;
        let generated: {id: number, color: string, correctIndex: number}[] = [];

        if (type === 'MIXED') {
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(${i * (320/count)}, 65%, 55%)`,
                correctIndex: i
            }));
        } else if (type === 'GREEN') {
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(120, 70%, ${20 + (i * (60/count))}%)`,
                correctIndex: i
            }));
        } else if (type === 'PURPLE') {
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(270, 70%, ${20 + (i * (60/count))}%)`,
                correctIndex: i
            }));
        } else if (type === 'RED') {
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(0, 75%, ${20 + (i * (60/count))}%)`,
                correctIndex: i
            }));
        } else if (type === 'BLUE') {
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(220, 75%, ${20 + (i * (60/count))}%)`,
                correctIndex: i
            }));
        } else if (type === 'GRAYSCALE') {
            // Black to White
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(0, 0%, ${10 + (i * (80/count))}%)`,
                correctIndex: i
            }));
        } else if (type === 'CYAN_MAGENTA') {
            // Cyan (180) to Magenta (300)
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(${180 + (i * (120/count))}, 70%, 50%)`,
                correctIndex: i
            }));
        } else if (type === 'YELLOW_BLUE') {
            // Yellow (60) to Blue (240) - Tritanopia challenge
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(${60 + (i * (180/count))}, 80%, 50%)`,
                correctIndex: i
            }));
        } else if (type === 'BROWN_GREEN') {
            // Brown (30, 100%, 30%) to Green (120, 60%, 40%) - Red-Green challenge
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(${30 + (i * (90/count))}, ${100 - (i * (40/count))}%, ${30 + (i * (10/count))}%)`,
                correctIndex: i
            }));
        } else if (type === 'PASTEL') {
            // Pastel Rainbow - High lightness, low saturation
            generated = Array.from({length: count}, (_, i) => ({
                id: i,
                color: `hsl(${i * (360/count)}, 40%, 80%)`,
                correctIndex: i
            }));
        }

        const middle = generated.slice(1, count - 1).sort(() => Math.random() - 0.5);
        setTiles([generated[0], ...middle, generated[count - 1]]);
        setGameStarted(true);
        setIsFinished(false);
        setScore(0);
    };

    useEffect(() => {
        if (initialSpectrum) {
            startSpectrum(initialSpectrum);
        }
    }, [initialSpectrum]);

    const handleTileClick = (idx: number) => {
        if (isFinished) return;
        if (idx === 0 || idx === tiles.length - 1) {
            SoundManager.play('error'); // Locked tiles
            return;
        }

        if (selectedIdx === null) {
            SoundManager.play('tap');
            setSelectedIdx(idx);
        } else {
            // Swap
            const newTiles = [...tiles];
            [newTiles[selectedIdx], newTiles[idx]] = [newTiles[idx], newTiles[selectedIdx]];
            setTiles(newTiles);
            setSelectedIdx(null);
            SoundManager.play('click');
        }
    };

    const calculateScore = () => {
        let errorScore = 0;
        for (let i = 0; i < tiles.length - 1; i++) {
            const diff = Math.abs(tiles[i].correctIndex - tiles[i+1].correctIndex);
            if (diff > 1) errorScore += (diff - 1);
        }
        const finalScore = Math.max(0, 100 - (errorScore * 3));
        setScore(finalScore);
        setIsFinished(true);
        SoundManager.play('finish');
    };

    if (!gameStarted) {
        return (
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
                <h3 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center justify-center gap-2">
                    <Palette size={28} className="text-indigo-500"/> Pilih Spektrum Warna
                </h3>
                <p className="text-slate-500 mb-8">Pilih jenis gradasi warna yang ingin Anda urutkan.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={() => startSpectrum('MIXED')} className="p-6 bg-gradient-to-r from-red-400 via-green-400 to-blue-400 rounded-2xl shadow-md hover:scale-105 transition text-white font-bold text-lg shadow-slate-300 dark:shadow-none">
                        Warna-Warni (Hue)
                    </button>
                    <button onClick={() => startSpectrum('GREEN')} className="p-6 bg-gradient-to-r from-green-800 to-green-300 rounded-2xl shadow-md hover:scale-105 transition text-white font-bold text-lg shadow-green-200 dark:shadow-none">
                        Hijau Tua - Muda
                    </button>
                    <button onClick={() => startSpectrum('PURPLE')} className="p-6 bg-gradient-to-r from-purple-900 to-purple-300 rounded-2xl shadow-md hover:scale-105 transition text-white font-bold text-lg shadow-purple-200 dark:shadow-none">
                        Ungu Tua - Muda
                    </button>
                    <button onClick={() => startSpectrum('RED')} className="p-6 bg-gradient-to-r from-red-900 to-red-300 rounded-2xl shadow-md hover:scale-105 transition text-white font-bold text-lg shadow-red-200 dark:shadow-none">
                        Merah Tua - Muda
                    </button>
                    <button onClick={() => startSpectrum('BLUE')} className="p-6 bg-gradient-to-r from-blue-900 to-blue-300 rounded-2xl shadow-md hover:scale-105 transition text-white font-bold text-lg shadow-blue-200 dark:shadow-none sm:col-span-2">
                        Biru Tua - Muda
                    </button>
                    <button onClick={() => startSpectrum('GRAYSCALE')} className="p-6 bg-gradient-to-r from-gray-900 to-gray-100 rounded-2xl shadow-md hover:scale-105 transition text-white font-bold text-lg shadow-gray-200 dark:shadow-none">
                        Hitam - Putih (Grayscale)
                    </button>
                    <button onClick={() => startSpectrum('CYAN_MAGENTA')} className="p-6 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-2xl shadow-md hover:scale-105 transition text-white font-bold text-lg shadow-cyan-200 dark:shadow-none">
                        Cyan - Magenta
                    </button>
                    <button onClick={() => startSpectrum('YELLOW_BLUE')} className="p-6 bg-gradient-to-r from-yellow-400 to-blue-600 rounded-2xl shadow-md hover:scale-105 transition text-white font-bold text-lg shadow-yellow-200 dark:shadow-none">
                        Kuning - Biru (Tritan)
                    </button>
                    <button onClick={() => startSpectrum('BROWN_GREEN')} className="p-6 bg-gradient-to-r from-amber-900 to-green-600 rounded-2xl shadow-md hover:scale-105 transition text-white font-bold text-lg shadow-amber-200 dark:shadow-none">
                        Coklat - Hijau (Deutan)
                    </button>
                    <button onClick={() => startSpectrum('PASTEL')} className="p-6 bg-gradient-to-r from-pink-200 via-purple-200 to-blue-200 rounded-2xl shadow-md hover:scale-105 transition text-slate-700 font-bold text-lg shadow-pink-100 dark:shadow-none sm:col-span-2">
                        Pastel Rainbow (Low Saturation)
                    </button>
                </div>
            </div>
        );
    }

    if (isFinished) {
        return (
            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl animate-fade-in">
                <Palette size={64} className="mx-auto mb-4 text-indigo-500"/>
                <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Hasil Tes Spektrum ({spectrumType})</h2>
                <div className="text-6xl font-black text-indigo-600 dark:text-indigo-400 mb-4">{score}</div>
                <p className="text-slate-500 mb-6">{score >= 90 ? "Penglihatan warna sangat akurat!" : score >= 70 ? "Diskriminasi warna baik." : "Terindikasi kesulitan membedakan nuansa warna."}</p>
                <div className="flex justify-center gap-1 mb-6 h-8 rounded-lg overflow-hidden border border-slate-200">
                    {tiles.map((t, i) => (
                        <div key={i} className="flex-1" style={{backgroundColor: t.color}}></div>
                    ))}
                </div>
                <div className="flex gap-4 justify-center">
                    <button onClick={() => setGameStarted(false)} className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition">Menu Spektrum</button>
                    <button onClick={() => onFinish(score)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition">Selesai</button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                    <Palette size={20}/> Urutkan: {spectrumType === 'MIXED' ? 'Warna-Warni' : spectrumType}
                </h3>
                <button onClick={() => setGameStarted(false)} className="text-xs text-slate-500 hover:text-indigo-600 underline">Ganti Mode</button>
            </div>
            
            <p className="text-center text-sm text-slate-500 mb-6">
                Klik untuk menukar posisi kotak warna agar membentuk gradasi yang halus dari kiri ke kanan. 
                <br/><span className="text-xs text-rose-500 font-bold">Kotak pertama dan terakhir terkunci.</span>
            </p>

            <div className="grid grid-cols-5 sm:flex sm:flex-nowrap gap-1 mb-8">
                {tiles.map((t, i) => {
                    const isLocked = i === 0 || i === tiles.length - 1;
                    const isSelected = selectedIdx === i;
                    return (
                        <div 
                            key={i}
                            onClick={() => handleTileClick(i)}
                            className={`
                                h-16 sm:h-24 sm:flex-1 rounded-lg cursor-pointer transition-all transform
                                ${isSelected ? 'scale-110 ring-4 ring-indigo-500 z-10' : 'hover:scale-105'}
                                ${isLocked ? 'opacity-100 ring-2 ring-slate-400 z-0 cursor-default' : 'opacity-100'}
                            `}
                            style={{backgroundColor: t.color}}
                        >
                            {isLocked && <div className="w-full h-full flex items-center justify-center text-white/50"><AlertTriangle size={16}/></div>}
                        </div>
                    );
                })}
            </div>

            <button onClick={calculateScore} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2">
                <CheckCircle size={20}/> Selesai Mengurutkan
            </button>
        </div>
    );
};

// 4. DEPTH PERCEPTION GAME COMPONENT (ENHANCED PARALLAX 3D + LANE LOGIC)
const DepthPerceptionGame: React.FC<{ onFinish: (score: number) => void }> = ({ onFinish }) => {
    const [round, setRound] = useState(1);
    const [score, setScore] = useState(0);
    
    // Position Data
    const [objects, setObjects] = useState<{id: number, z: number, lane: number, color: string}[]>([]);
    const [mousePos, setMousePos] = useState({x: 0, y: 0});
    const [explodingId, setExplodingId] = useState<number | null>(null);
    
    const [targetType, setTargetType] = useState<'CLOSEST' | 'FURTHEST'>('CLOSEST');
    const [isFinished, setIsFinished] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const maxRounds = 10;
    
    const ballColors = [
        { base: '#f43f5e', light: '#fb7185', glow: 'rgba(244, 63, 94, 0.6)' }, // Rose
        { base: '#3b82f6', light: '#60a5fa', glow: 'rgba(59, 130, 246, 0.6)' }, // Blue
        { base: '#10b981', light: '#34d399', glow: 'rgba(16, 185, 129, 0.6)' }, // Emerald
        { base: '#f59e0b', light: '#fbbf24', glow: 'rgba(245, 158, 11, 0.6)' }, // Amber
        { base: '#8b5cf6', light: '#a78bfa', glow: 'rgba(139, 92, 246, 0.6)' }, // Violet
    ];

    const generateRound = () => {
        setExplodingId(null);
        const type = Math.random() > 0.5 ? 'CLOSEST' : 'FURTHEST';
        setTargetType(type);
        
        const newObjects = [];
        // STRICT LANE SYSTEM: Use slots -1, 0, 1 so they NEVER overlap horizontally in screen space
        // because the parallax shift will be bounded relative to their lane width.
        const lanes = [-1, 0, 1].sort(() => 0.5 - Math.random());
        
        // Z Range: -400 to -100.
        // We use a high focal length to make the size difference subtle.
        
        for(let i=0; i<3; i++) {
            const lane = lanes[i];
            const z = -100 - Math.floor(Math.random() * 300); // Random Z between -100 and -400
            
            const colorIdx = Math.floor(Math.random() * ballColors.length);

            newObjects.push({
                id: i,
                z: z,
                lane: lane, // Assign unique lane
                color: JSON.stringify(ballColors[colorIdx])
            });
        }
        setObjects(newObjects);
    };

    useEffect(() => {
        generateRound();
    }, []);

    const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        
        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const x = ((clientX - rect.left) / rect.width) * 2 - 1;
        const y = ((clientY - rect.top) / rect.height) * 2 - 1;
        
        setMousePos({x, y});
    };

    const handleObjectClick = (objId: number, z: number) => {
        if (isFinished || explodingId !== null) return;

        setExplodingId(objId); // Trigger Animation

        const allZ = objects.map(o => o.z);
        const targetZ = targetType === 'CLOSEST' ? Math.max(...allZ) : Math.min(...allZ);
        
        // Check correctness
        const isCorrect = z === targetZ;
        if (isCorrect) {
            SoundManager.play('success');
            setScore(s => s + 1);
        } else {
            SoundManager.play('error');
        }

        setTimeout(() => {
            if (round < maxRounds) {
                setRound(r => r + 1);
                generateRound();
            } else {
                setIsFinished(true);
                SoundManager.play('finish');
            }
        }, 500); // Wait for animation
    };

    if (isFinished) {
        return (
            <div className="text-center p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl animate-fade-in">
                <Layers size={64} className="mx-auto mb-4 text-indigo-500"/>
                <h2 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Hasil Persepsi Kedalaman</h2>
                <div className="text-6xl font-black text-indigo-600 dark:text-indigo-400 mb-4">{score * 10}</div>
                <p className="text-slate-500 mb-6">{score >= 8 ? "Persepsi kedalaman sangat baik!" : "Perlu latihan estimasi jarak visual."}</p>
                <button onClick={() => onFinish(score * 10)} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold">Lanjut</button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-2xl bg-slate-900 p-6 rounded-3xl shadow-xl overflow-hidden relative select-none">
            <div className="absolute top-4 left-4 z-10 bg-black/50 px-3 py-1 rounded text-white text-xs font-bold">
                Round {round}/{maxRounds}
            </div>
            
            <h3 className="text-center font-bold text-lg mb-8 text-white flex items-center justify-center gap-2 z-10 relative">
                {targetType === 'CLOSEST' ? 'Pilih yang TERDEKAT (Paling Besar/Jelas)' : 'Pilih yang TERJAUH (Paling Kecil/Buram)'}
            </h3>

            <div 
                ref={containerRef}
                className="h-96 w-full relative flex justify-center items-center bg-gradient-to-b from-slate-800 to-slate-900 overflow-hidden rounded-xl border border-slate-700 cursor-crosshair touch-none perspective-container"
                onMouseMove={handleMouseMove}
                onTouchMove={handleMouseMove}
            >
                {/* 3D Floor Grid */}
                <div className="absolute bottom-0 w-[200%] h-[100%] left-[-50%] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" 
                     style={{
                         transform: 'perspective(600px) rotateX(60deg) translateY(100px) scale(2)',
                         pointerEvents: 'none'
                     }}>
                </div>

                {objects.map((obj) => {
                    // --- PARALLAX & DEPTH LOGIC ---
                    const focalLength = 1000; 
                    // Formula for scale based on Z. 
                    // z is negative (into screen). 
                    // Scale = focal / (focal - z).
                    // If z = -100, scale = 1000/1100 = 0.9.
                    // If z = -400, scale = 1000/1400 = 0.71.
                    // Difference is subtle but visible.
                    const scale = focalLength / (focalLength - obj.z); 
                    
                    // Blur based on distance (Z). Further = more blur.
                    // Max Z diff is around 300. Max blur should be ~3px.
                    const blurAmount = Math.abs(obj.z + 100) / 100; // Offset by nearest point

                    // Parallax: Objects move opposite to mouse. Closer objects move MORE.
                    const parallaxX = mousePos.x * scale * 30; 
                    const parallaxY = mousePos.y * scale * 15;

                    // Base position based on Lane (Spread wide to prevent overlap)
                    const laneWidth = 100; 
                    const baseX = obj.lane * laneWidth;

                    const finalX = baseX + parallaxX;
                    const finalY = parallaxY;

                    const zIndex = 1000 + Math.floor(obj.z); 
                    const size = 100; 

                    const colors = JSON.parse(obj.color);
                    const isExploding = explodingId === obj.id;

                    return (
                        <div key={obj.id} style={{
                            position: 'absolute',
                            top: '50%', left: '50%',
                            transform: `translate(calc(-50% + ${finalX}px), calc(-50% + ${finalY}px))`,
                            zIndex: isExploding ? 2000 : zIndex, // Bring to front on click
                            width: `${size * scale}px`,
                            height: `${size * scale}px`,
                            transition: isExploding ? 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' : 'transform 0.1s linear',
                        }}>
                            {/* SHADOW */}
                            <div 
                                className="absolute bg-black/50 rounded-full blur-md"
                                style={{
                                    bottom: '-20%',
                                    left: '10%',
                                    width: '80%',
                                    height: '20%',
                                    opacity: 0.6 * scale,
                                    transform: isExploding ? 'scale(1.5)' : 'scale(1)',
                                    transition: 'all 0.3s'
                                }}
                            ></div>

                            {/* SPHERE */}
                            <div 
                                onClick={(e) => { e.stopPropagation(); handleObjectClick(obj.id, obj.z); }}
                                className={`w-full h-full rounded-full cursor-pointer touch-manipulation relative`}
                                style={{
                                    background: `radial-gradient(circle at 30% 30%, ${colors.light}, ${colors.base})`,
                                    boxShadow: isExploding 
                                        ? `0 0 50px 20px ${colors.glow}, inset -10px -10px 20px rgba(0,0,0,0.5)` 
                                        : `inset -10px -10px 20px rgba(0,0,0,0.5), 0 0 10px rgba(0,0,0,0.3)`,
                                    filter: isExploding ? 'blur(0px)' : `blur(${blurAmount}px)`,
                                    transform: isExploding ? 'scale(1.2)' : 'scale(1)',
                                    transition: 'all 0.3s ease-out'
                                }}
                            >
                                {/* Specular Highlight */}
                                <div className="absolute top-[15%] left-[15%] w-[25%] h-[25%] bg-white/60 rounded-full blur-[2px] pointer-events-none"></div>
                                
                                {/* Click Feedback Ring */}
                                {isExploding && (
                                    <div className="absolute inset-0 rounded-full border-4 border-white animate-ping opacity-75"></div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
            
            <div className="text-center text-slate-400 text-xs mt-4 flex items-center justify-center gap-2">
                <MousePointer2 size={12}/> Gerakkan mouse/jari untuk melihat efek 3D (Paralaks).
            </div>
        </div>
    );
};

export const ColorBlindTest: React.FC<ColorBlindTestProps & { initialSpectrum?: 'MIXED' | 'GREEN' | 'PURPLE' | 'RED' | 'BLUE' | 'GRAYSCALE' | 'CYAN_MAGENTA' | 'YELLOW_BLUE' | 'BROWN_GREEN' | 'PASTEL' }> = ({ onBack, onComplete, initialSpectrum }) => {
    // ... existing wrapper code ...
    const [mode, setMode] = useState<TestMode>(initialSpectrum ? 'HUE_SORT' : 'MENU');
    const [testQuestions, setTestQuestions] = useState<QuestionConfig[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState<(string|boolean)[]>([]);
    const [inputNumber, setInputNumber] = useState('');
    
    // Victory State
    const [isCelebrating, setIsCelebrating] = useState(false);
    
    // Path Tracking
    const [pathCheckpoints, setPathCheckpoints] = useState<{x: number, y: number}[]>([]);
    const [userPath, setUserPath] = useState<{x: number, y: number}[]>([]);
    const [clearTrigger, setClearTrigger] = useState(0);

    const startIshihara = () => {
        const questions = generateRandomSequence();
        setTestQuestions(questions);
        setAnswers([]);
        setCurrentIndex(0);
        setIsCelebrating(false);
        setMode('ISHIHARA');
        SoundManager.play('click');
    };

    const handleNextQuestion = () => {
        SoundManager.play('click');
        const currentQ = testQuestions[currentIndex];
        let answerValue: string | boolean = false;

        if (currentQ.type === 'NUMBER') {
            answerValue = inputNumber.trim();
            setInputNumber('');
        } else {
            // Verify Path
            if (pathCheckpoints.length === 0 || userPath.length === 0) {
                answerValue = false; 
            } else {
                let hitCount = 0;
                const radius = 30; 
                pathCheckpoints.forEach(cp => {
                    const hit = userPath.some(up => Math.sqrt(Math.pow(up.x - cp.x, 2) + Math.pow(up.y - cp.y, 2)) < radius);
                    if (hit) hitCount++;
                });
                const coverage = hitCount / pathCheckpoints.length;
                answerValue = coverage > 0.55; // 55% coverage required
            }
            setUserPath([]);
            setPathCheckpoints([]);
            setClearTrigger(t => t + 1); // Signal to clear interactive canvas
        }

        const newAnswers = [...answers, answerValue];
        setAnswers(newAnswers);

        if (currentIndex < testQuestions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            SoundManager.play('finish');
            // Trigger celebration then finish
            setIsCelebrating(true);
            setTimeout(() => {
                finishIshihara(newAnswers);
            }, 3500); // Wait for animation
        }
    };

    const finishIshihara = (finalAnswers: (string|boolean)[]) => {
        // Detailed Analysis Logic
        let correctCount = 0;
        let errors = {
            RED_GREEN: 0,
            BLUE_YELLOW: 0,
            TOTAL_RG: 0,
            TOTAL_BY: 0
        };

        const processedAnswers = testQuestions.map((q, i) => {
            const ans = finalAnswers[i];
            let isCorrect = false;
            if (q.type === 'NUMBER') isCorrect = ans.toString() === q.target.toString();
            else isCorrect = ans === true;

            if (isCorrect) correctCount++;
            else {
                if (q.palette === 'RED_GREEN' || q.palette === 'PROTANOPIA' || q.palette === 'DEUTERANOPIA') errors.RED_GREEN++;
                if (q.palette === 'BLUE_YELLOW') errors.BLUE_YELLOW++;
            }

            if (q.palette === 'RED_GREEN' || q.palette === 'PROTANOPIA' || q.palette === 'DEUTERANOPIA') errors.TOTAL_RG++;
            if (q.palette === 'BLUE_YELLOW') errors.TOTAL_BY++;

            return { question: q, answer: ans, isCorrect };
        });

        const passed = correctCount >= 12;
        let diagnosis = "Normal Color Vision";
        if (!passed) {
            if (errors.RED_GREEN > 2 && errors.BLUE_YELLOW <= 1) diagnosis = "Possible Red-Green Deficiency (Protan/Deutan)";
            else if (errors.BLUE_YELLOW > 1 && errors.RED_GREEN <= 2) diagnosis = "Possible Blue-Yellow Deficiency (Tritan)";
            else if (errors.RED_GREEN > 2 && errors.BLUE_YELLOW > 1) diagnosis = "Complex/Severe Deficiency";
            else diagnosis = "Mild Deficiency / Inconsistent";
        }

        const historyItem: TestHistoryItem = {
            id: `cb-${Date.now()}`,
            date: new Date().toISOString(),
            category: 'BUTAWRNA',
            score: Math.round((correctCount / testQuestions.length) * 100), 
            maxScore: 100,
            details: { type: 'Ishihara Simulation', passed, correctCount, diagnosis, breakdown: errors },
            questions: testQuestions.map(q => ({
                id: `q-${q.id}`, type: 'short_answer', content: `Plate ${q.id} (${q.palette})`, correctAnswer: q.target.toString(), explanation: q.description || '', metadata: { difficulty: 'Medium', idealTimeSeconds: 15, topic: 'Color', subtest: q.palette }
            })),
            answers: processedAnswers.map((pa, i) => ({
                questionId: `q-${pa.question.id}`, selectedAnswer: pa.answer.toString(), isCorrect: pa.isCorrect, scoreEarned: pa.isCorrect ? 1 : 0, timeTakenSeconds: 0, isOverthinking: false, isGuessing: false
            }))
        };
        onComplete(historyItem);
    };

    const finishHueTest = (score: number) => {
        const historyItem: TestHistoryItem = {
            id: `hue-${Date.now()}`,
            date: new Date().toISOString(),
            category: 'BUTAWRNA',
            score: score,
            maxScore: 100,
            details: { type: 'Hue Discrimination', passed: score > 70, diagnosis: score > 70 ? 'Good Discrimination' : 'Weak Discrimination' },
            questions: [],
            answers: []
        };
        onComplete(historyItem);
    };

    const finishDepthTest = (score: number) => {
        const historyItem: TestHistoryItem = {
            id: `depth-${Date.now()}`,
            date: new Date().toISOString(),
            category: 'BUTAWRNA',
            score: score,
            maxScore: 100,
            details: { type: 'Depth Perception', passed: score > 70, diagnosis: score > 70 ? 'Good Depth Perception' : 'Poor Depth Estimation' },
            questions: [],
            answers: []
        };
        onComplete(historyItem);
    };

    // --- RENDERERS ---

    if (mode === 'MENU') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center animate-fade-in">
                <div className="max-w-md w-full">
                    <button onClick={onBack} className="flex items-center text-slate-500 hover:text-indigo-600 mb-8 font-bold"><ArrowLeft size={20} className="mr-2"/> Kembali</button>
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
                        <Eye size={64} className="mx-auto mb-4 text-indigo-600 dark:text-indigo-400"/>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Tes Visual</h2>
                        <p className="text-slate-500 mb-8">Pilih metode pengujian:</p>
                        
                        <div className="space-y-4">
                            <button onClick={startIshihara} className="w-full p-4 bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-100 dark:border-indigo-800 rounded-2xl hover:border-indigo-500 transition group text-left flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-indigo-600 shadow-sm group-hover:scale-110 transition">
                                    <Activity size={24}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Simulasi Ishihara</h3>
                                    <p className="text-xs text-slate-500">15 Plate Angka & Jalur (Buta Warna)</p>
                                </div>
                            </button>

                            <button onClick={() => setMode('HUE_SORT')} className="w-full p-4 bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 rounded-2xl hover:border-emerald-500 transition group text-left flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-emerald-600 shadow-sm group-hover:scale-110 transition">
                                    <Palette size={24}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Tes Spektrum Warna</h3>
                                    <p className="text-xs text-slate-500">Farnsworth-Munsell D-15 (Sorting)</p>
                                </div>
                            </button>

                            <button onClick={() => setMode('DEPTH')} className="w-full p-4 bg-sky-50 dark:bg-sky-900/20 border-2 border-sky-100 dark:border-sky-800 rounded-2xl hover:border-sky-500 transition group text-left flex items-center gap-4">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-full text-sky-600 shadow-sm group-hover:scale-110 transition">
                                    <Layers size={24}/>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white">Persepsi Kedalaman</h3>
                                    <p className="text-xs text-slate-500">Estimasi Jarak Objek 3D</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'HUE_SORT') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center animate-fade-in">
                <button onClick={() => setMode('MENU')} className="absolute top-6 left-6 flex items-center text-slate-500 hover:text-indigo-600 font-bold"><ArrowLeft size={20} className="mr-2"/> Batal</button>
                <HueSortingGame onFinish={finishHueTest} initialSpectrum={initialSpectrum} />
            </div>
        );
    }

    if (mode === 'DEPTH') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center animate-fade-in">
                <button onClick={() => setMode('MENU')} className="absolute top-6 left-6 flex items-center text-slate-500 hover:text-indigo-600 font-bold"><ArrowLeft size={20} className="mr-2"/> Batal</button>
                <DepthPerceptionGame onFinish={finishDepthTest} />
            </div>
        );
    }

    // ISHIHARA MODE
    const currentQ = testQuestions[currentIndex];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 px-6 py-4 flex flex-col items-center justify-center transition-colors relative overflow-hidden">
             
             {isCelebrating && <CelebrationConfetti />}

             <div className={`w-full max-w-md transition-all duration-500 ${isCelebrating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}`}>
                 <div className="flex justify-between items-center mb-6">
                    <button onClick={() => setMode('MENU')} className="flex items-center text-slate-500 dark:text-slate-400 hover:text-indigo-600"><ArrowLeft size={18} className="mr-2"/> Keluar</button>
                    <span className="text-sm font-bold text-slate-400 bg-slate-200 dark:bg-slate-700 px-3 py-1 rounded-full">
                        {currentIndex + 1} / {testQuestions.length}
                    </span>
                 </div>
                 
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-slate-100 dark:border-slate-700 text-center select-none relative">
                     
                     <div className="mb-6 flex justify-center py-2 relative">
                         <div className="relative inline-block">
                             {/* Bottom: Static Dots */}
                             <IshiharaPlateCanvas 
                                config={currentQ} 
                                onPathGenerated={(cps) => setPathCheckpoints(cps)}
                             />
                             {/* Top: Interactive Drawing (Only for PATH mode) */}
                             {currentQ.type === 'PATH' && (
                                 <InteractiveLayer 
                                    isActive={true} 
                                    onStroke={(pos) => setUserPath(prev => [...prev, pos])}
                                    clearTrigger={clearTrigger}
                                 />
                             )}
                         </div>
                     </div>

                     <div className="mb-4">
                         <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">
                             {currentQ.type === 'NUMBER' ? 'Angka berapa yang terlihat?' : 'Ikuti jalur dengan jari/kursor!'}
                         </h3>
                         <div className="flex justify-center gap-2 mt-2">
                             <span className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-2 py-1 rounded font-bold uppercase">
                                {currentQ.palette.replace('_', ' ')}
                             </span>
                         </div>
                     </div>
                     
                     {currentQ.type === 'NUMBER' ? (
                         <div className="flex gap-2">
                            <input 
                                type="number" 
                                className="flex-1 p-4 text-center text-2xl font-bold border-2 border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-xl focus:border-indigo-600 focus:ring-0 outline-none"
                                placeholder="?"
                                value={inputNumber}
                                onChange={e => setInputNumber(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && inputNumber && handleNextQuestion()}
                            />
                            <button 
                                onClick={handleNextQuestion}
                                disabled={!inputNumber}
                                className="px-6 bg-indigo-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 hover:bg-indigo-700 transition"
                            >
                                OK
                            </button>
                         </div>
                     ) : (
                         <div className="flex gap-2">
                             <button 
                                onClick={() => setClearTrigger(t => t + 1)}
                                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-300 transition flex items-center justify-center gap-2"
                             >
                                 <Eraser size={18}/> Hapus
                             </button>
                             <button 
                                onClick={handleNextQuestion}
                                className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
                             >
                                 <CheckCircle size={18}/> Selesai Gambar
                             </button>
                         </div>
                     )}

                     {currentQ.type === 'NUMBER' && (
                        <div className="mt-4 flex justify-center">
                            <button onClick={() => setInputNumber('0')} className="text-xs text-slate-400 hover:text-indigo-500 underline flex items-center gap-1">
                                <Eye size={12}/> Tidak terlihat apa-apa (Isi 0)
                            </button>
                        </div>
                     )}
                 </div>
                 
                 {currentQ.type === 'PATH' && (
                     <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500 animate-pulse">
                         <MousePointer2 size={12}/> Tarik garis di atas gambar.
                     </div>
                 )}
             </div>
        </div>
    );
};
