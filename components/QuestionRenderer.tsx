import React, { useMemo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Grid, Shapes, ArrowRight } from 'lucide-react';
import { InteractiveFigural } from './InteractiveFigural';

interface SvgRendererProps {
    svgString: string;
}

export const SvgRenderer: React.FC<SvgRendererProps> = ({ svgString }) => {
    const processedSvg = useMemo(() => {
        try {
            let cleanStr = svgString;
            cleanStr = cleanStr.replace(/stroke="black"/gi, 'stroke="currentColor"');
            cleanStr = cleanStr.replace(/stroke="#000000"/gi, 'stroke="currentColor"');
            cleanStr = cleanStr.replace(/fill="black"/gi, 'fill="currentColor"');
            cleanStr = cleanStr.replace(/fill="#000000"/gi, 'fill="currentColor"');

            const parser = new DOMParser();
            const doc = parser.parseFromString(cleanStr, 'image/svg+xml');
            const svgElement = doc.querySelector('svg');
            if (svgElement) {
                if (!svgElement.getAttribute('viewBox') && svgElement.getAttribute('width') && svgElement.getAttribute('height')) {
                    const w = parseInt(svgElement.getAttribute('width') || '100', 10);
                    const h = parseInt(svgElement.getAttribute('height') || '100', 10);
                    svgElement.setAttribute('viewBox', `0 0 ${w} ${h}`);
                }
                svgElement.setAttribute('width', '100%');
                svgElement.setAttribute('height', 'auto');
                
                const currentClass = svgElement.getAttribute('class') || '';
                svgElement.setAttribute('class', `${currentClass} w-full max-h-[220px] md:max-h-[300px] transition-transform duration-300 select-none`);
                
                return svgElement.outerHTML;
            }
        } catch (err) {
            console.error("SVG preprocessing failed", err);
        }
        return svgString;
    }, [svgString]);

    return (
        <div 
            className="flex justify-center items-center my-4 overflow-hidden max-w-full" 
            dangerouslySetInnerHTML={{ __html: processedSvg }} 
        />
    );
};

const ensureLaTeXWrapping = (text: string): string => {
    if (!text) return text;
    
    // Convert plain fractions like "1/2" to "\frac{1}{2}", carefully ignoring dates like "12/10/2024"
    // We use a capture group for the preceding character to avoid lookbehinds for better browser support.
    let preparedText = text.replace(/(^|[^\d/])(\d+)\/(\d+)(?=[^\d/]|$)/g, '$1\\frac{$2}{$3}');
    
    const commonLaTeXRegex = /\\(frac|sqrt|pm|times|le|ge|approx|neq|cdot|div|alpha|beta|gamma|delta|theta|pi|sigma|omega|infty|partial|sum|prod|int|oint|text|degree|log|ln|sin|cos|tan|cot|sec|csc|subset|supset|in|cap|cup|perp|parallel|angle)(\{[^{}]*\}|[a-zA-Z0-9\.\,])*|([0-9]+[\+\-\*\/\=\<\>\^][0-9\(\)\.\,]+)/g;
    
    // Split text by existing math blocks to avoid double wrapping
    const parts = preparedText.split(/(\\\([\s\S]*?\\\))|(\$[\s\S]*?\$)|(\$\$[\s\S]*?\$\$)/g);
    
    let processed = "";
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        
        // If this is already a math block, keep it as is
        if (part.startsWith('\\(') || part.startsWith('$') || part.startsWith('$$')) {
            processed += part;
        } else {
            // This is regular text, find and wrap raw LaTeX
            processed += part.replace(commonLaTeXRegex, (match) => {
                if (match.length < 2) return match;
                return `\\(${match}\\)`;
            });
        }
    }
    
    return processed;
};

export const SimpleMarkdown: React.FC<{ text: string; allowIndent?: boolean; isOption?: boolean }> = ({ text, allowIndent = false, isOption = false }) => {
    const [isReading, setIsReading] = React.useState(false);
    
    if (!text) return null;

    const handleReadAloud = () => {
        if ('speechSynthesis' in window) {
            if (isReading) {
                window.speechSynthesis.cancel();
                setIsReading(false);
                return;
            }
            
            window.speechSynthesis.cancel();
            
            // Clean text for reading
            const cleanText = text
                .replace(/:::MATRIX:::[\s\S]*?:::END_MATRIX:::/g, '')
                .replace(/<svg[\s\S]*?<\/svg>/gi, '')
                .replace(/\\\(|\\\)|\\\[|\\\]|\$|\$\$/g, '')
                .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1 per $2')
                .replace(/\\sqrt\{([^}]+)\}/g, 'akar dari $1')
                .replace(/\\times/g, 'kali')
                .replace(/\\div/g, 'bagi')
                .replace(/\\pm/g, 'plus minus')
                .replace(/```[\s\S]*?```/g, '')
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .trim();

            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'id-ID';
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            
            utterance.onstart = () => setIsReading(true);
            utterance.onend = () => setIsReading(false);
            utterance.onerror = () => setIsReading(false);
            
            window.speechSynthesis.speak(utterance);
        }
    };

    React.useEffect(() => {
        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);
    
    // 1. Text Cleaning & LateX Prep
    let processedText = text
        // Fix some common LLM hallucinated markdown/latex combos
        .replace(/`([^`]+)`/g, (match, code) => {
            if (code.includes('\\')) return `\\(${code}\\)`;
            return match;
        });

    // 2. Wrap raw LaTeX
    processedText = ensureLaTeXWrapping(processedText);
    
    // 3. Fix unclosed delims
    const openDelims = (processedText.match(/\\\(/g) || []).length;
    const closeDelims = (processedText.match(/\\\)/g) || []).length;
    if (openDelims > closeDelims) {
        processedText += '\\)'.repeat(openDelims - closeDelims);
    }
    
    // 4. Special handling for question numbers
    const questionNumberMatch = processedText.match(/^([0-9]+)\.\s+/);
    if (questionNumberMatch) {
        const num = questionNumberMatch[1];
        const rest = processedText.slice(questionNumberMatch[0].length);
        return (
            <div className="leading-relaxed space-y-4">
                <div className="flex flex-col gap-2">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold text-sm shrink-0">
                        {num}
                    </span>
                    <div className="mt-1">
                        <SimpleMarkdown text={rest} />
                    </div>
                </div>
            </div>
        );
    }
    
    // split by code blocks first
    const codeBlockParts = processedText.split(/(```[\s\S]*?```)/g);

    return (
        <div className="group relative leading-relaxed space-y-1">
            {!isOption && text.length > 50 && (
                <div className="absolute -right-1 -top-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <button 
                        onClick={handleReadAloud}
                        className={`p-1.5 rounded-full shadow-sm border transition-colors ${isReading ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600'}`}
                        title={isReading ? "Hentikan Suara" : "Baca Aloud"}
                    >
                        {isReading ? (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 10v3"/><path d="M6 6v11"/><path d="M10 3v18"/><path d="M14 8v7"/><path d="M18 5v13"/><path d="M22 10v3"/></svg>
                        )}
                    </button>
                </div>
            )}
            {codeBlockParts.map((part: string, index: number) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    // Check if it's SVG
                    const rawContent = part.slice(3, -3).trim();
                    const content = rawContent.replace(/^(xml|html|svg|math|latex|tex)\n/i, '');
                    const isMathBlock = rawContent.toLowerCase().startsWith('math\n') || 
                                        rawContent.toLowerCase().startsWith('latex\n') ||
                                        rawContent.toLowerCase().startsWith('tex\n') ||
                                        (/\\(frac|sqrt|pm|times|le|ge|approx|neq|cdot|div|alpha|beta|gamma|delta|theta|pi|sigma|omega|infty|partial|sum|prod|int|oint|text|degree|log|ln|sin|cos|tan|cot|sec|csc|subset|supset|in|cap|cup|perp|parallel|angle)/.test(content) && !content.includes('<svg'));
                    
                    if (content.toLowerCase().includes('<svg') || content.startsWith('<svg')) {
                        const svgMatches = content.match(/<svg[\s\S]*?<\/svg>/gi);
                        if (svgMatches && svgMatches.length > 0) {
                            return (
                                <div key={index} className="w-full py-4 sm:py-6 overflow-hidden">
                                    <div className="flex flex-row items-center justify-start sm:justify-center gap-3 sm:gap-5 w-full overflow-x-auto pb-4 px-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                                        {svgMatches.map((svgStr: string, idx: number) => (
                                            <React.Fragment key={idx}>
                                                {idx > 0 && (
                                                    <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">
                                                        <ArrowRight size={20} />
                                                    </div>
                                                )}
                                                <div className="snap-center flex-shrink-0 w-[90px] h-[90px] sm:w-[130px] sm:h-[130px] bg-white dark:bg-slate-800/80 rounded-2xl border-2 border-slate-200 dark:border-slate-700/80 shadow-sm flex items-center justify-center p-2 sm:p-3 relative">
                                                    <div className="absolute top-1 left-2 sm:top-2 sm:left-3 text-[10px] sm:text-xs font-bold text-slate-300 dark:text-slate-600 leading-none">{idx + 1}</div>
                                                    <div className="w-full h-full flex items-center justify-center [&>div]:w-full [&>div]:h-full [&>div>div]:flex [&>div>div]:items-center [&>div>div]:justify-center">
                                                        <InteractiveFigural svgString={svgStr} isOption={isOption} isInline={true} />
                                                    </div>
                                                </div>
                                            </React.Fragment>
                                        ))}
                                        {!isOption && (
                                            <React.Fragment>
                                                <div className="flex-shrink-0 text-slate-400 dark:text-slate-500">
                                                    <ArrowRight size={20} />
                                                </div>
                                                <div className="snap-center flex-shrink-0 w-[90px] h-[90px] sm:w-[130px] sm:h-[130px] bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-indigo-300 dark:border-indigo-700/50 flex items-center justify-center relative">
                                                    <span className="text-indigo-500/40 font-black text-3xl sm:text-4xl italic">?</span>
                                                </div>
                                            </React.Fragment>
                                        )}
                                    </div>
                                </div>
                            );
                        }
                    } else if (isMathBlock) {
                         const safeMathExpr = content.replace(/([^\\]|^)%/g, '$1\\%');
                         return (
                             <div key={index} className="my-2 sm:my-4 flex justify-center w-full py-1 sm:py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden word-break-safe text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                                 <BlockMath math={safeMathExpr} renderError={(error) => <span className="text-inherit whitespace-pre-wrap">{content}</span>} />
                             </div>
                         );
                    }
                    
                    return (
                        <pre key={index} className="font-mono text-sm leading-none bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl overflow-hidden whitespace-pre-wrap break-words word-break-safe border border-slate-200 dark:border-slate-800 flex justify-start items-start text-left my-2">
                            {content}
                        </pre>
                    );
                } else {
                    const mathParts = part.split(/(\$\$[\s\S]*?\$\$)/g);
                    
                    return (
                        <div key={index} className="w-full">
                            {mathParts.map((subPart: string, subIndex: number) => {
                                if (subPart.startsWith('$$') && subPart.endsWith('$$')) {
                                    const mathExpr = subPart.slice(2, -2).trim();
                                    const safeMathExpr = mathExpr.replace(/([^\\]|^)%/g, '$1\\%');
                                    return (
                                        <div key={subIndex} className="my-2 sm:my-4 flex justify-center w-full py-1 sm:py-2">
                                            <div className="min-w-0 max-w-full flex-shrink-0 overflow-hidden word-break-safe text-slate-700 dark:text-slate-300">
                                                <BlockMath math={safeMathExpr} renderError={(error) => <span className="text-inherit whitespace-pre-wrap">{mathExpr}</span>} />
                                            </div>
                                        </div>
                                    );
                                } else {
                                    // Support both \( ... \) and $ ... $ for inline math
                                    const inlineMathParts = subPart.split(/(\\\([\s\S]*?\\\))|(\$[\s\S]*?\$)/g);
                                    
                                    return (
                                        <div key={subIndex} className="inline-wrap w-full text-justify sm:text-left text-slate-700 dark:text-slate-300">
                                            {inlineMathParts.filter(Boolean).map((inlinePart: string, inlineIndex: number) => {
                                                const isInlineMath = (inlinePart.startsWith('\\(') && inlinePart.endsWith('\\)')) || 
                                                                  (inlinePart.startsWith('$') && inlinePart.endsWith('$'));
                                                
                                                if (isInlineMath) {
                                                    const content = inlinePart.startsWith('\\(') ? inlinePart.slice(2, -2) : inlinePart.slice(1, -1);
                                                    const inlineExpr = content.trim();
                                                    const safeInlineExpr = inlineExpr.replace(/([^\\]|^)%/g, '$1\\%');
                                                    return (
                                                        <span key={inlineIndex} className="math-inline mx-0.5 inline-block align-middle max-w-full py-0.5 sm:py-1">
                                                            <InlineMath math={safeInlineExpr} renderError={(error) => <span className="text-inherit whitespace-pre-wrap">{inlineExpr}</span>} />
                                                        </span>
                                                    );
                                                } else {
                                                    const svgParts = inlinePart.split(/(<svg[\s\S]*?<\/svg>)/i);

                                                    return (
                                                        <span key={inlineIndex} className="inline">
                                                            {svgParts.map((svgPart: string, svgIndex: number) => {
                                                                const trimmedSvg = svgPart.trim();
                                                                if (trimmedSvg.match(/^<svg[\s\S]*?<\/svg>$/i)) {
                                                                    return <div key={svgIndex} className="inline-block align-middle"><InteractiveFigural svgString={trimmedSvg} isOption={isOption} isInline={true} /></div>;
                                                                }

                                                                // Render standard text
                                                                let formatted = svgPart
                                                                    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                                                                    .replace(/\*(.*?)\*/g, '<i>$1</i>')
                                                                    // Safer list replacement that doesn't put as much HTML
                                                                    .replace(/\n- (.*?)/g, '<br/>• $1')
                                                                    // Markers
                                                                    .replace(/\n(Diketahui:|Ditanya:|Jawab:|Solusi:)/g, '<br/><b>$1</b>')
                                                                    .replace(/\\n/g, '<br/>')
                                                                    .replace(/\n\n/g, '<br/><br/>')
                                                                    .replace(/\n/g, '<br/>');

                                                                // Rupiah
                                                                formatted = formatted.replace(
                                                                    /(Rp\.?\s*\d[\d.,]*)/gi,
                                                                    '<b class="whitespace-nowrap">$1</b>'
                                                                );

                                                                return (
                                                                    <span 
                                                                        key={svgIndex} 
                                                                        className="markdown-content inline" 
                                                                        dangerouslySetInnerHTML={{ __html: formatted }} 
                                                                    />
                                                                );
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
                }
            })}
        </div>
    );
};

export const formatTopic = (subtest: string | undefined, topic: string | undefined) => {
    if (!subtest && !topic) return null;
    
    let raw = subtest || topic || '';
    if (subtest && subtest.includes(' - ')) {
        const parts = subtest.split(' - ');
        raw = parts.slice(1).join(' - ').trim();
    } else if (subtest && subtest !== topic) {
        raw = subtest;
    } else if (topic && topic.includes(' - ')) {
        const parts = topic.split(' - ');
        raw = parts.slice(1).join(' - ').trim();
    } else {
        raw = topic || '';
    }
    
    const lowerRaw = raw.toLowerCase();
    
    // TWK
    if (lowerRaw.includes('nasionalisme')) return 'Nasionalisme';
    if (lowerRaw.includes('integritas')) return 'Integritas';
    if (lowerRaw.includes('bela negara')) return 'Bela negara';
    if (lowerRaw.includes('pilar negara') || lowerRaw.includes('pancasila') || lowerRaw.includes('uud') || lowerRaw.includes('nkri') || lowerRaw.includes('bhinneka')) return 'Pilar negara';
    if (lowerRaw.includes('bahasa')) return 'Bahasa Indonesia';
    
    // TIU
    if (lowerRaw.includes('analogi kata')) return 'Analogi kata';
    if (lowerRaw.includes('analogi kalimat')) return 'Analogi kalimat';
    if (lowerRaw.includes('hitungan') || lowerRaw.includes('berhitung')) return 'Hitungan';
    if (lowerRaw.includes('perbandingan')) return 'Perbandingan kuantitatif';
    if (lowerRaw.includes('cerita')) return 'Soal cerita';
    if (lowerRaw.includes('deret')) return 'Deret angka';
    if (lowerRaw.includes('silogisme')) return 'Silogisme';
    if (lowerRaw.includes('analitis') || lowerRaw.includes('analisis')) return 'Analisis';
    if (lowerRaw.includes('analogi gambar')) return 'Analogi gambar';
    if (lowerRaw.includes('serial')) return 'Serial gambar';
    if (lowerRaw.includes('9 kotak') || lowerRaw.includes('sembilan kotak') || lowerRaw.includes('matriks')) return 'Pola sembilan kotak gambar';
    if (lowerRaw.includes('ketidaksamaan') || lowerRaw.includes('beda')) return 'Ketidaksamaan gambar';
    
    // TKP
    if (lowerRaw.includes('pelayanan')) return 'Pelayanan publik';
    if (lowerRaw.includes('jejaring')) return 'Jejaring kerja';
    if (lowerRaw.includes('sosial budaya')) return 'Sosial budaya';
    if (lowerRaw.includes('tik') || lowerRaw.includes('teknologi') || lowerRaw === 'tik') return 'TIK';
    if (lowerRaw.includes('profesionalisme')) return 'Profesionalisme';
    if (lowerRaw.includes('radikalisme')) return 'Anti radikalisme';
    
    // Hide redundant generic topics
    if (['twk', 'tiu', 'tkp', 'skd', 'general', 'umum', 'lainnya'].includes(lowerRaw.replace(/[^a-z]/g, ''))) {
        return null;
    }
    
    return raw;
};

interface MatrixProps {
    content: string;
    metadataMatrix?: any;
    selectedOptionContent?: string | null;
}

export const MatrixQuestionRenderer: React.FC<MatrixProps> = ({ content, metadataMatrix, selectedOptionContent }) => {
    // Flexible regex for :::MATRIX::: ... :::END_MATRIX::: or just :::
    const matrixMatch = content.match(/:::MATRIX:::([\s\S]*?)(?::::END_MATRIX:::|:::|$)/);
    
    const [selectedCellLogic, setSelectedCellLogic] = React.useState<{id: string, logic: string, element?: HTMLElement} | null>(null);

    let matrixData = metadataMatrix;
    let questionText = content;

    if (!matrixData && matrixMatch) {
       const raw = matrixMatch[1].trim();
       if (raw.startsWith('```')) {
           // Handle if it's a code block inside matrix tag
           const codeMatch = raw.match(/```(?:xml|svg|html)?\n([\s\S]*?)```/i);
           if (codeMatch) {
               matrixData = [[codeMatch[1]]]; // Treat as single cell SVG if it's just one SVG
           }
       } else {
           try {
               matrixData = JSON.parse(raw);
           } catch (e) {
               // If it's just raw SVG content
               if (raw.includes('<svg')) {
                   matrixData = [[raw]];
               }
           }
       }
       questionText = content.replace(matrixMatch[0], '').trim();
    }

    if (!matrixData || !Array.isArray(matrixData) || matrixData.length === 0) {
        return <SimpleMarkdown text={content} />;
    }

    try {
        // Flatten or normalize matrixData if it's nested
        if (matrixData[0] && typeof matrixData[0] === 'object' && !Array.isArray(matrixData[0]) && 'row' in matrixData[0]) {
            matrixData = matrixData.map((item: any) => item.row || item);
        }

        if (matrixData.length === 1 && Array.isArray(matrixData[0])) {
             if (matrixData[0].length > 0 && Array.isArray(matrixData[0][0])) {
                 matrixData = matrixData[0];
             }
        }
        
        // Sometimes the AI just returns a flat array instead of array of rows
        if (matrixData.length > 0 && typeof matrixData[0] === 'object' && !Array.isArray(matrixData[0]) && !('row' in matrixData[0]) && !matrixData.some(Array.isArray)) {
            // It's a flat array of cells. Let's group them into 3x3 if it's 9 items.
            if (matrixData.length === 9) {
                matrixData = [
                    matrixData.slice(0, 3),
                    matrixData.slice(3, 6),
                    matrixData.slice(6, 9)
                ];
            } else if (matrixData.length === 4) {
                matrixData = [
                    matrixData.slice(0, 2),
                    matrixData.slice(2, 4)
                ];
            } else {
                // Just wrap it in one row
                matrixData = [matrixData];
            }
        }

        const cols = matrixData[0]?.length || 3;
        
        const getGridColsClass = (numCols: number) => {
            switch (numCols) {
                case 1: return 'grid-cols-1';
                case 2: return 'grid-cols-2';
                case 3: return 'grid-cols-3';
                case 4: return 'grid-cols-4';
                case 5: return 'grid-cols-5';
                default: return 'grid-cols-3';
            }
        };

        return (
            <div id="fajmuls-matrix-grid" className="space-y-6 flex flex-col items-center w-full my-4 sm:my-8 animate-fade-in mb-6 sm:mb-10 overflow-hidden relative">
                {questionText && questionText.trim() !== '' && (
                    <div className="w-full text-center max-w-2xl mx-auto py-2 sm:py-3 px-4 sm:px-6 bg-white/80 dark:bg-slate-800/80 rounded-xl sm:rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm sm:shadow-lg backdrop-blur-md word-break-safe">
                        <SimpleMarkdown text={questionText.replace(/:::END_MATRIX:::/g, '').trim()} />
                    </div>
                )}
                
                {/* Logic Modal / Overlay */}
                {selectedCellLogic && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setSelectedCellLogic(null)}>
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                            <h3 className="font-bold text-lg mb-2 text-slate-800 dark:text-white flex justify-between items-center">
                                Logika Sel / Pola
                                <button onClick={() => setSelectedCellLogic(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                </button>
                            </h3>
                            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                                {selectedCellLogic.logic}
                            </p>
                        </div>
                    </div>
                )}

                <div className="relative p-2 sm:p-4 bg-transparent rounded-3xl w-full max-w-3xl overflow-x-auto overflow-y-hidden">
                    <div className={`grid ${getGridColsClass(cols)} gap-2 sm:gap-4 md:gap-6 bg-transparent p-2 rounded-2xl relative z-10 w-max mx-auto`}>
                         {matrixData.map((row: any[], rowIndex: number) => (
                             row.map((cell: any, colIndex: number) => {
                                 const isObject = cell && typeof cell === 'object' && !Array.isArray(cell);
                                 let cellContent = isObject ? cell.content : (Array.isArray(cell) ? cell[0] : cell);
                                 const id = isObject && cell.id ? cell.id : `${rowIndex}-${colIndex}`;
                                 const logic = isObject && cell.logic ? cell.logic : null;

                                 if (cellContent === '?' && selectedOptionContent) {
                                     cellContent = selectedOptionContent;
                                 }

                                 const isQuestionMark = cellContent === '?';
                                 const isClickable = !!logic;
                                 
                                 return (
                                     <div 
                                        key={id} 
                                        onClick={(e) => {
                                            if (isClickable) {
                                                setSelectedCellLogic({ id, logic, element: e.currentTarget });
                                            }
                                        }}
                                        className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-transparent rounded-xl flex items-center justify-center transition-all overflow-hidden ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-indigo-500 hover:scale-105 shadow-sm' : ''}`}
                                     >
                                         {isClickable && (
                                             <div className="absolute top-1 right-1 sm:top-2 sm:right-2 z-10 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs font-bold opacity-70 group-hover:opacity-100">
                                                 i
                                             </div>
                                         )}
                                         {isQuestionMark ? (
                                             <div className="w-full h-full flex items-center justify-center rounded-xl border-2 border-dashed border-indigo-500/30">
                                                <span className="text-indigo-500/40 font-black text-4xl sm:text-5xl select-none italic underline decoration-indigo-500/20">?</span>
                                             </div>
                                         ) : (
                                             <div className="w-full h-full p-2 flex items-center justify-center [&>div]:w-full [&>div]:h-full [&>div>div]:flex [&>div>div]:items-center [&>div>div]:justify-center">
                                                 <InteractiveFigural svgString={String(cellContent || '')} isInline={true} />
                                             </div>
                                         )}
                                     </div>
                                 );
                             })
                         ))}
                    </div>
                </div>
            </div>
        );
    } catch (e) {
        console.error("Failed to parse matrix data", e);
        return <SimpleMarkdown text={content} />;
    }
};
