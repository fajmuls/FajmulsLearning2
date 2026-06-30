import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RotateCw, Box, Layers, MousePointer2, Shapes } from 'lucide-react';

interface InteractiveFiguralProps {
    svgString: string;
    type?: string;
    isOption?: boolean;
    isInline?: boolean;
}

export const InteractiveFigural: React.FC<InteractiveFiguralProps> = ({ svgString: rawSvgString, type, isOption = false, isInline = false }) => {
    const [is3DMode, setIs3DMode] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Brief loading animation
    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 800);
        return () => clearTimeout(timer);
    }, []);

    // Clean up any stray markdown code blocks from LLM generation
    const svgString = useMemo(() => {
        let cleanStr = rawSvgString;
        const codeBlockMatch = cleanStr.match(/```(?:xml|svg|html)?\n([\s\S]*?)```/i);
        if (codeBlockMatch) {
            cleanStr = codeBlockMatch[1];
        }
        return cleanStr.trim();
    }, [rawSvgString]);

    // ... (symbols and isCubeNet useMemo remain same) ...
    const symbols = useMemo(() => {
        if (!svgString.includes('Cube Net') && !svgString.includes('Jaring-jaring')) return null;
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgString, 'image/svg+xml');
            const texts = Array.from(doc.querySelectorAll('text'));
            
            const map: Record<string, string> = {
                front: '★',
                back: '◆',
                top: '●',
                bottom: '✚',
                left: '■',
                right: '▲'
            };

            texts.forEach((text, i) => {
                const x = parseInt(text.getAttribute('x') || '0');
                const y = parseInt(text.getAttribute('y') || '0');
                const symbol = text.textContent || '';
                const dataFace = text.getAttribute('data-face') || text.id?.toLowerCase();

                if (dataFace) {
                    if (dataFace.includes('top')) map.top = symbol;
                    if (dataFace.includes('left')) map.left = symbol;
                    if (dataFace.includes('front')) map.front = symbol;
                    if (dataFace.includes('right')) map.right = symbol;
                    if (dataFace.includes('back')) map.back = symbol;
                    if (dataFace.includes('bottom')) map.bottom = symbol;
                } else {
                    if (Math.abs(x - 60) <= 5 && (Math.abs(y - 25) <= 5 || Math.abs(y - 27) <= 5)) map.top = symbol;
                    if ((Math.abs(x - 18) <= 5 || Math.abs(x - 20) <= 5) && (Math.abs(y - 65) <= 5 || Math.abs(y - 67) <= 5)) map.left = symbol;
                    if (Math.abs(x - 60) <= 5 && (Math.abs(y - 65) <= 5 || Math.abs(y - 67) <= 5)) map.front = symbol;
                    if ((Math.abs(x - 98) <= 5 || Math.abs(x - 100) <= 5) && (Math.abs(y - 65) <= 5 || Math.abs(y - 67) <= 5)) map.right = symbol;
                    if ((Math.abs(x - 138) <= 5 || Math.abs(x - 140) <= 5) && (Math.abs(y - 65) <= 5 || Math.abs(y - 67) <= 5)) map.back = symbol;
                    if (Math.abs(x - 60) <= 5 && (Math.abs(y - 105) <= 5 || Math.abs(y - 107) <= 5)) map.bottom = symbol;
                }
            });

            return map;
        } catch (e) {
            return null;
        }
    }, [svgString]);

    const isCubeNet = useMemo(() => svgString.includes('Cube Net') || svgString.includes('Jaring-jaring'), [svgString]);

    const processedSvg = useMemo(() => {
        let cleanStr = svgString;
        try {
            // Replace hardcoded colors for Dark mode compatibility
            cleanStr = cleanStr.replace(/stroke="black"/gi, 'stroke="currentColor"');
            cleanStr = cleanStr.replace(/stroke="#000000"/gi, 'stroke="currentColor"');
            cleanStr = cleanStr.replace(/fill="black"/gi, 'fill="currentColor"');
            cleanStr = cleanStr.replace(/fill="#000000"/gi, 'fill="currentColor"');

            const parser = new DOMParser();
            const doc = parser.parseFromString(cleanStr, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');
            if (svgElement) {
                // Ensure viewBox exists for proper scaling before overriding width/height
                if (!svgElement.getAttribute('viewBox') && svgElement.getAttribute('width') && svgElement.getAttribute('height')) {
                    const w = parseInt(svgElement.getAttribute('width') || '100', 10);
                    const h = parseInt(svgElement.getAttribute('height') || '100', 10);
                    svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`);
                }
                
                const currentClass = svgElement.getAttribute('class') || '';
                
                let isWide = false;
                const viewBox = svgElement.getAttribute('viewBox');
                if (viewBox) {
                    const parts = viewBox.split(/[ ,]+/);
                    if (parts.length >= 4) {
                        const w = parseFloat(parts[2]);
                        const h = parseFloat(parts[3]);
                        if (w > h * 2.5) {
                            isWide = true;
                        }
                    }
                }
                
                const sizeClass = isOption ? 'max-h-[80px] sm:max-h-[100px] max-w-[80px] sm:max-w-[100px] mx-auto' : isInline ? 'w-full h-full object-contain' : `max-h-[220px] md:max-h-[300px] object-contain ${isWide ? 'w-auto h-[120px] sm:h-[150px]' : 'w-full'}`;
                
                if (isWide && !isOption && !isInline) {
                     svgElement.removeAttribute('width');
                     svgElement.setAttribute('height', '100%');
                } else {
                     svgElement.setAttribute('width', '100%');
                     svgElement.setAttribute('height', 'auto');
                }
                
                svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
                svgElement.setAttribute('class', `${currentClass} ${sizeClass} transition-transform duration-300 select-none`);
                return svgElement.outerHTML;
            }
        } catch (e) {}
        return cleanStr;
    }, [svgString, isOption]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (isMinimized) {
        return (
            <motion.div 
                layoutId="figural-container"
                onClick={() => setIsMinimized(false)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-2xl cursor-pointer hover:scale-110 transition-transform active:scale-95"
            >
                <Shapes size={24} />
            </motion.div>
        );
    }

    if (!isCubeNet) {
        return (
            <motion.div 
                layoutId="figural-container"
                className={`relative group flex justify-center items-center ${isInline ? 'w-full h-full p-0 m-0' : 'w-full py-4'}`}
            >
                <button 
                    onClick={() => setIsMinimized(true)}
                    className={`absolute top-0 right-0 p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isOption || isInline ? 'hidden' : ''}`}
                    title="Sembunyikan"
                >
                    <RotateCw size={14} className="rotate-45" />
                </button>
                <div 
                    className={`flex items-center mx-auto ${isOption ? 'justify-center w-full h-full max-w-[120px] max-h-[120px]' : isInline ? 'justify-center w-full h-full' : 'justify-start sm:justify-center w-full max-w-full overflow-x-auto overflow-y-hidden pb-4'}`}
                >
                    <div className={isOption || isInline ? 'w-full h-full flex justify-center items-center overflow-hidden' : 'w-full flex justify-center min-w-max'} dangerouslySetInnerHTML={{ __html: processedSvg }} />
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div 
            layoutId="figural-container"
            className={`flex flex-col items-center relative group ${isInline ? 'w-full h-full p-0 m-0' : 'w-full my-4'}`}
        >
            <button 
                onClick={() => setIsMinimized(true)}
                className={`absolute top-0 right-0 p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-indigo-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 ${isOption || isInline ? 'hidden' : ''}`}
                title="Sembunyikan"
            >
                <RotateCw size={14} className="rotate-45" />
            </button>

            <div className={`relative flex justify-center items-center ${isOption ? 'min-h-[120px] max-w-[120px] mx-auto' : isInline ? 'w-full h-full min-h-0' : 'w-full min-h-[220px]'}`}>
                <AnimatePresence mode="wait">
                    {!is3DMode ? (
                        <motion.div
                            key="2d-net"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="p-4 max-w-full overflow-hidden flex justify-center items-center"
                            dangerouslySetInnerHTML={{ __html: processedSvg }}
                        />
                    ) : (
                        <motion.div
                            key="3d-cube"
                            initial={{ opacity: 0, rotateX: -20, rotateY: 45 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="[perspective:1000px] w-52 h-52 flex items-center justify-center"
                        >
                            <motion.div
                                className="relative w-28 h-28 transform-style-3d h-full w-full"
                                animate={{ 
                                    rotateY: [0, 360],
                                    rotateX: [15, 15],
                                }}
                                transition={{ 
                                    duration: 12, 
                                    repeat: Infinity, 
                                    ease: "linear" 
                                }}
                                style={{ transformStyle: 'preserve-3d' }}
                            >
                                {symbols && (
                                    <>
                                        <CubeFace transform="translateZ(56px)" symbol={symbols.front} color="bg-white" />
                                        <CubeFace transform="rotateY(180deg) translateZ(56px)" symbol={symbols.back} color="bg-slate-50" />
                                        <CubeFace transform="rotateY(90deg) translateZ(56px)" symbol={symbols.right} color="bg-slate-100" />
                                        <CubeFace transform="rotateY(-90deg) translateZ(56px)" symbol={symbols.left} color="bg-slate-100" />
                                        <CubeFace transform="rotateX(90deg) translateZ(56px)" symbol={symbols.top} color="bg-slate-50" />
                                        <CubeFace transform="rotateX(-90deg) translateZ(56px)" symbol={symbols.bottom} color="bg-slate-50" />
                                    </>
                                )}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="mt-4 flex gap-3">
                {symbols && (
                    <button
                        onClick={() => setIs3DMode(!is3DMode)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                            is3DMode 
                            ? 'bg-indigo-600 text-white shadow-lg' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                    >
                        {is3DMode ? <Layers size={14} /> : <Box size={14} />}
                        <span>{is3DMode ? 'Jaring-jaring' : 'Simulasi 3D'}</span>
                    </button>
                )}
            </div>
        </motion.div>
    );
};

const CubeFace = ({ transform, symbol, color }: { transform: string, symbol: string, color: string }) => (
    <div
        className={`absolute inset-0 flex items-center justify-center text-4xl font-bold border-2 border-slate-300 dark:border-slate-600 rounded shadow-inner ${color} dark:bg-slate-700 text-slate-800 dark:text-white`}
        style={{ transform, backfaceVisibility: 'hidden' }}
    >
        {symbol}
    </div>
);
