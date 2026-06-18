
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Swords, Users, Copy, Zap, CheckCircle, XCircle, Trophy, Loader2, Play } from 'lucide-react';
import { InlineMath, BlockMath } from './KatexReact';
import 'katex/dist/katex.min.css';
import { BattleState, CategoryType, Question, UserProfile } from '../types';
import * as FirebaseService from '../services/firebase';
import * as GeminiService from '../services/geminiService';
import { SoundManager } from '../services/soundService';

interface BattleArenaProps {
    userProfile: UserProfile;
    onBack: () => void;
    category: CategoryType;
}

const ensureLaTeXWrapping = (text: string): string => {
    if (!text) return text;
    
    // Check if the text contains LaTeX commands but doesn't have any LaTeX delimiters
    const hasRawLaTeX = text.includes('\\sqrt') || text.includes('\\frac') || text.includes('\\pm') || text.includes('\\times') || text.includes('\\le') || text.includes('\\ge') || text.includes('\\approx') || text.includes('\\neq') || text.includes('\\cdot');
    const hasDelimiters = text.includes('\\(') || text.includes('$$');
    
    if (hasRawLaTeX && !hasDelimiters) {
        if (text.trim().startsWith('\\') && text.trim().endsWith('}')) {
            return `\\(${text.trim()}\\)`;
        }
        
        let processed = text;
        processed = processed.replace(/\\(sqrt|frac|pm|times|le|ge|approx|neq|cdot)\{?[^{}]*\}?(\{?[^{}]*\})?/g, (match) => {
            return `\\(${match}\\)`;
        });
        return processed;
    }
    return text;
};

const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;
    
    const wrappedText = ensureLaTeXWrapping(text);
    const codeBlockParts = wrappedText.split(/(```[\s\S]*?```)/g);

    return (
        <div className="leading-relaxed space-y-2 text-justify" style={{ textJustify: 'inter-word' }}>
            {codeBlockParts.map((part, index) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    if (part.toLowerCase().includes('<svg')) {
                        const svgMatch = part.match(/<svg[\s\S]*?<\/svg>/i);
                        if (svgMatch) {
                            return (
                                <div key={index} className="flex justify-center items-center my-4" dangerouslySetInnerHTML={{ __html: svgMatch[0] }} />
                            );
                        }
                    }
                    const content = part.slice(3, -3).trim().replace(/^xml\n/, '').replace(/^html\n/, '');
                    return (
                        <pre key={index} className="font-mono text-xs bg-slate-100 dark:bg-slate-900 p-3 rounded-lg overflow-x-auto whitespace-pre border border-slate-200 dark:border-slate-700">
                            {content}
                        </pre>
                    );
                } else {
                    const mathParts = part.split(/(\$\$[\s\S]*?\$\$)/g);
                    
                    return (
                        <div key={index}>
                            {mathParts.map((subPart, subIndex) => {
                                if (subPart.startsWith('$$') && subPart.endsWith('$$')) {
                                    const mathExpr = subPart.slice(2, -2).trim();
                                    return (
                                        <div key={subIndex} className="w-full overflow-x-auto scrollbar-thin py-2 px-1 my-2 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl flex justify-center">
                                            <BlockMath math={mathExpr} />
                                        </div>
                                    );
                                } else {
                                    const inlineMathParts = subPart.split(/(\\\([\s\S]*?\\\))/g);
                                    
                                    return (
                                        <span key={subIndex}>
                                            {inlineMathParts.map((inlinePart, inlineIndex) => {
                                                if (inlinePart.startsWith('\\(') && inlinePart.endsWith('\\)')) {
                                                    const inlineExpr = inlinePart.slice(2, -2).trim();
                                                    return <InlineMath key={inlineIndex} math={inlineExpr} />;
                                                } else {
                                                    let formatted = inlinePart
                                                        .replace(/\*\*(.*?)\*\*/g, '<b class="text-slate-900 dark:text-white font-bold">$1</b>')
                                                        .replace(/\*(.*?)\*/g, '<i>$1</i>')
                                                        .replace(/\n- (.*?)/g, '<br/><span class="text-indigo-500 mr-2">•</span>$1')
                                                        .replace(/\n\n/g, '<br/><br/>')
                                                        .replace(/\n/g, '<br/>');

                                                    formatted = formatted.replace(
                                                        /([\p{Emoji}])/gu,
                                                        '<span style="font-size: 1.25em; line-height: 1; vertical-align: middle; display: inline-block; padding: 0 2px;">$1</span>'
                                                    );

                                                    formatted = formatted.replace(
                                                        /([\u00B0-\u00B9\u00BC-\u00BE\u00D7\u00F7\u0370-\u03FF\u2000-\u2AFF\u2150-\u215E\u2190-\u21FF\u2200-\u22FF\u2300-\u23FF\u2460-\u24FF\u2500-\u257F\u25A0-\u25FF\u2600-\u26FF\u2700-\u27BF\u27C0-\u27EF\u2900-\u29FF\u2B00-\u2BFF\u{1D400}-\u{1D7FF}\u{1F000}-\u{1F9FF}])/gu,
                                                        '<span style="font-size: 1.15em; line-height: 1; vertical-align: middle; display: inline-block; padding: 0 1px;">$1</span>'
                                                    );

                                                    return <span key={inlineIndex} className="markdown-content text-left md:text-justify text-slate-700 dark:text-slate-300" dangerouslySetInnerHTML={{ __html: formatted }} />;
                                                }
                                            })}
                                        </span>
                                    );
                                }
                            })}
                        </div>
                    );
                }
            })}
        </div>
    );
};

export const BattleArena: React.FC<BattleArenaProps> = ({ userProfile, onBack, category }) => {
    const [view, setView] = useState<'LOBBY' | 'GAME' | 'RESULT'>('LOBBY');
    const [battleId, setBattleId] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [battleState, setBattleState] = useState<BattleState | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Game State
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isThinking, setIsThinking] = useState(false); // Creating room
    
    // Unsubscribe ref
    const unsubRef = useRef<(() => void) | null>(null);

    // --- CLEANUP ---
    useEffect(() => {
        return () => {
            if (unsubRef.current) unsubRef.current();
        };
    }, []);

    // --- LOBBY ACTIONS ---

    const createRoom = async () => {
        setLoading(true);
        setIsThinking(true);
        try {
            // Generate 10 quick questions
            const questions = await GeminiService.generateQuestions(
                'DRILL' as any, 
                category, 
                `1v1 Battle Mode - ${category}. Fast paced questions. Use 3D symbols if TPA/Spatial.`, 
                10, 
                [], 
                category === 'SKD' ? 'CPNS' : undefined
            );
            
            const id = await FirebaseService.createBattleRoom(
                userProfile.uid, 
                userProfile.username, 
                category, 
                questions
            );
            
            setBattleId(id);
            listenToRoom(id);
        } catch (e) {
            setError("Gagal membuat room. Coba lagi.");
        } finally {
            setLoading(false);
            setIsThinking(false);
        }
    };

    const joinRoom = async () => {
        if (!joinCode) return;
        setLoading(true);
        try {
            await FirebaseService.joinBattleRoom(joinCode.toUpperCase(), userProfile.uid, userProfile.username);
            setBattleId(joinCode.toUpperCase());
            listenToRoom(joinCode.toUpperCase());
        } catch (e: any) {
            setError(e.message || "Gagal join room.");
        } finally {
            setLoading(false);
        }
    };

    const listenToRoom = (id: string) => {
        if (unsubRef.current) unsubRef.current();
        
        unsubRef.current = FirebaseService.subscribeToBattle(id, (data) => {
            setBattleState(data);
            if (data.status === 'STARTING' && view === 'LOBBY') {
                setView('GAME');
                SoundManager.play('success');
            }
            if (data.status === 'FINISHED') {
                setView('RESULT');
                SoundManager.play('finish');
            }
        });
    };

    // --- GAMEPLAY LOGIC ---

    const handleAnswer = async (option: string) => {
        if (!battleState) return;
        
        const currentQ = battleState.questions[currentIndex];
        const isCorrect = option === currentQ.correctAnswer;
        
        // Score: 10 for correct
        const point = isCorrect ? 10 : -2;
        
        const currentScore = battleState.scores[userProfile.uid] || 0;
        const newScore = Math.max(0, currentScore + point);
        
        if (isCorrect) SoundManager.play('success');
        else SoundManager.play('error');

        await FirebaseService.updateBattleProgress(battleState.id, userProfile.uid, newScore, currentIndex + 1);
        
        if (currentIndex < battleState.questions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            // Finished
            checkWinner(newScore);
        }
    };

    const checkWinner = async (myFinalScore: number) => {
        if (!battleState) return;
        const opponentUid = battleState.hostUid === userProfile.uid ? battleState.guestUid : battleState.hostUid;
        if (!opponentUid) return;

        const opponentScore = battleState.scores[opponentUid] || 0;
        const opponentProgress = battleState.progress[opponentUid] || 0;
        
        if (opponentProgress >= battleState.questions.length) {
            // Both done
            const winner = myFinalScore > opponentScore ? userProfile.uid : (opponentScore > myFinalScore ? opponentUid : 'DRAW');
            await FirebaseService.finishBattle(battleState.id, winner);
        } else {
            // Waiting for opponent... stay on game screen (UI handles "Waiting" message via status)
        }
    };

    // --- RENDER ---

    if (view === 'LOBBY') {
        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col p-3 sm:p-6">
                <button onClick={onBack} className="self-start flex items-center text-slate-400 hover:text-white mb-6 sm:mb-8 text-sm">
                    <ArrowLeft size={16} className="mr-1 sm:mr-2"/> Quit Battle
                </button>

                <div className="max-w-md w-full mx-auto text-center">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-[0_0_30px_rgba(79,70,229,0.5)] animate-pulse">
                        <Swords size={28} className="sm:w-[40px] sm:h-[40px]" />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black mb-1 sm:mb-2 uppercase italic tracking-wider">Battle Arena</h1>
                    <p className="text-xs sm:text-sm text-slate-400 mb-6 sm:mb-8">{category} 1v1 Duel</p>

                    {!battleId ? (
                        <div className="space-y-4 sm:space-y-6">
                            <div className="bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-700">
                                <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Create Room</h3>
                                <button 
                                    onClick={createRoom} 
                                    disabled={loading}
                                    className="w-full py-3 sm:py-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg sm:rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm sm:text-base"
                                >
                                    {loading ? <Loader2 className="animate-spin"/> : <Zap size={18}/>}
                                    Host Match
                                </button>
                            </div>
                            
                            <div className="relative flex py-1 sm:py-2 items-center">
                                <div className="flex-grow border-t border-slate-700"></div>
                                <span className="flex-shrink-0 mx-3 sm:mx-4 text-slate-500 text-[10px] sm:text-xs uppercase">or join</span>
                                <div className="flex-grow border-t border-slate-700"></div>
                            </div>

                            <div className="bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-700">
                                <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Join Room</h3>
                                <input 
                                    type="text" 
                                    placeholder="Enter Room Code" 
                                    value={joinCode}
                                    onChange={e => setJoinCode(e.target.value.toUpperCase())}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg sm:rounded-xl p-3 sm:p-4 text-center font-mono text-lg sm:text-xl tracking-widest mb-3 sm:mb-4 focus:border-indigo-500 outline-none"
                                />
                                <button 
                                    onClick={joinRoom}
                                    disabled={!joinCode || loading}
                                    className="w-full py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-500 rounded-lg sm:rounded-xl font-bold transition disabled:opacity-50 text-sm sm:text-base"
                                >
                                    Join Fight
                                </button>
                            </div>
                            {error && <p className="text-rose-500 font-bold text-xs sm:text-sm animate-pulse">{error}</p>}
                        </div>
                    ) : (
                        <div className="bg-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-indigo-500/50 shadow-2xl">
                            <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6 text-slate-300">Waiting for Opponent...</h2>
                            <div className="bg-slate-900 p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 border border-slate-700">
                                <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest mb-1 sm:mb-2 border-b border-slate-800 pb-1">Room Code</p>
                                <div className="text-3xl sm:text-5xl font-mono font-black text-indigo-400 tracking-widest flex items-center justify-center gap-2 sm:gap-4">
                                    {battleId}
                                    <button onClick={() => navigator.clipboard.writeText(battleId)} className="p-1.5 hover:bg-white/10 rounded-full text-slate-300 hover:text-white transition"><Copy size={16} className="sm:w-[20px] sm:h-[20px]"/></button>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-2 sm:gap-4 animate-pulse">
                                <Users size={18} className="text-emerald-400 sm:w-[24px] sm:h-[24px]"/>
                                <span className="text-sm sm:text-lg font-bold">1/2 Players</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'GAME' && battleState) {
        const isHost = battleState.hostUid === userProfile.uid;
        const opponentUid = isHost ? battleState.guestUid : battleState.hostUid;
        const opponentName = isHost ? battleState.guestName : battleState.hostName;
        
        const myScore = battleState.scores[userProfile.uid] || 0;
        const oppScore = opponentUid ? (battleState.scores[opponentUid] || 0) : 0;
        const oppProgress = opponentUid ? (battleState.progress[opponentUid] || 0) : 0;

        const currentQ = battleState.questions[currentIndex];
        const isFinished = currentIndex >= battleState.questions.length || battleState.progress[userProfile.uid] >= battleState.questions.length;

        return (
            <div className="min-h-screen bg-slate-900 text-white flex flex-col overflow-hidden">
                {/* Battle Header */}
                <div className="bg-slate-800 p-3 sm:p-4 shadow-md flex justify-between items-center z-10 border-b border-slate-700">
                    <div className="flex flex-col">
                        <span className="text-[10px] sm:text-xs text-indigo-400 font-bold">YOU</span>
                        <span className="text-xl sm:text-2xl font-black">{myScore}</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                        <div className="text-[9px] sm:text-xs font-bold bg-rose-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full animate-pulse">LIVE</div>
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] sm:text-xs text-rose-400 font-bold truncate max-w-[80px] sm:max-w-[120px]">{opponentName || 'Opponent'}</span>
                        <span className="text-xl sm:text-2xl font-black">{oppScore}</span>
                    </div>
                </div>

                {/* Progress Bars */}
                <div className="h-1.5 bg-slate-700 w-full flex">
                    <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: `${((currentIndex)/battleState.questions.length)*50}%` }}></div>
                    <div className="h-full bg-rose-500 transition-all duration-500 ml-auto" style={{ width: `${(oppProgress/battleState.questions.length)*50}%` }}></div>
                </div>

                {/* Game Area */}
                <div className="flex-1 flex flex-col items-center justify-center p-3 sm:p-6 relative">
                    {isFinished ? (
                        <div className="text-center">
                            <h2 className="text-xl sm:text-3xl font-bold mb-3 sm:mb-4">Waiting for results...</h2>
                            <Loader2 size={36} className="animate-spin text-indigo-500 mx-auto"/>
                        </div>
                    ) : (
                        <div className="w-full max-w-2xl">
                            <div className="bg-slate-800 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-700 mb-4 sm:mb-6 shadow-xl w-full">
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 sm:mb-2 block border-b border-slate-700 pb-1 w-fit">Question {currentIndex + 1}/{battleState.questions.length}</span>
                                <h3 className="text-base sm:text-xl md:text-2xl font-bold leading-relaxed">
                                    <SimpleMarkdown text={currentQ.content} />
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 gap-2 sm:gap-3">
                                {currentQ.options?.map((opt, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => handleAnswer(opt)}
                                        className="p-3 sm:p-4 rounded-lg sm:rounded-xl border-2 border-slate-700 bg-slate-800 hover:bg-indigo-600 hover:border-indigo-500 focus:border-indigo-500 hover:scale-[1.01] transition-all text-left font-medium text-xs sm:text-sm md:text-base outline-none"
                                    >
                                        <SimpleMarkdown text={opt} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    if (view === 'RESULT' && battleState) {
        const isWinner = battleState.winner === userProfile.uid;
        const isDraw = battleState.winner === 'DRAW';
        
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white text-center">
                <div className="max-w-md w-full">
                    <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl ${isWinner ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`}>
                        {isWinner ? <Trophy size={64}/> : (isDraw ? <Users size={64}/> : <XCircle size={64}/>)}
                    </div>
                    
                    <h1 className="text-5xl font-black mb-2 italic uppercase">
                        {isWinner ? 'VICTORY!' : (isDraw ? 'DRAW' : 'DEFEAT')}
                    </h1>
                    <p className="text-slate-400 mb-8 text-lg">
                        {isWinner ? '+100 XP' : '+20 XP'}
                    </p>

                    <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 mb-8">
                        <div className="flex justify-between items-center border-b border-slate-700 pb-4 mb-4">
                            <div className="text-left">
                                <div className="text-xs text-slate-500 font-bold uppercase">You</div>
                                <div className="text-3xl font-black text-indigo-400">{battleState.scores[userProfile.uid]}</div>
                            </div>
                            <div className="text-xl font-black text-slate-600">VS</div>
                            <div className="text-right">
                                <div className="text-xs text-slate-500 font-bold uppercase">Opponent</div>
                                <div className="text-3xl font-black text-rose-400">
                                    {battleState.scores[battleState.hostUid === userProfile.uid ? battleState.guestUid! : battleState.hostUid]}
                                </div>
                            </div>
                        </div>
                        <button onClick={onBack} className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:scale-105 transition">
                            Back to Menu
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
};
