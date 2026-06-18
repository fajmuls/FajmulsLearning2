import React, { useMemo } from 'react';
import { InlineMath, BlockMath } from './KatexReact';
import 'katex/dist/katex.min.css';
import { Grid, Shapes } from 'lucide-react';
import { InteractiveFigural } from './InteractiveFigural';

interface SvgRendererProps {
    svgString: string;
}

export const SvgRenderer: React.FC<SvgRendererProps> = ({ svgString }) => {
    const processedSvg = useMemo(() => {
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgString, 'image/svg+xml');
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
    
    // Check if the text contains LaTeX commands but doesn't have any LaTeX delimiters
    const hasRawLaTeX = text.includes('\\sqrt') || text.includes('\\frac') || text.includes('\\pm') || text.includes('\\times') || text.includes('\\le') || text.includes('\\ge') || text.includes('\\approx') || text.includes('\\neq') || text.includes('\\cdot') || text.includes('\\div');
    const hasDelimiters = text.includes('\\(') || text.includes('$$') || text.includes('$');
    
    if (hasRawLaTeX && !hasDelimiters) {
        // If it looks like a single whole math expression, just wrap the whole thing
        if (text.trim().startsWith('\\') && (text.trim().endsWith('}') || text.trim().endsWith(']'))) {
            return `\\(${text.trim()}\\)`;
        }
        
        // Smarter heuristic for wrapping math symbols even with nested braces
        // Using a single regex for all keywords to avoid redundant wrapping
        const keywords = ['sqrt', 'frac', 'pm', 'times', 'le', 'ge', 'approx', 'neq', 'cdot', 'div'];
        const keywordsPattern = keywords.join('|');
        const regex = new RegExp(`\\\\(${keywordsPattern})(\\{[^{}]*(\\{[^{}]*\\}[^{}]*)*\\}|[a-zA-Z0-9/])*`, 'g');
        
        const processed = text.replace(regex, (match) => {
            return `\\(${match}\\)`;
        });
        
        return processed;
    }
    return text;
};

export const SimpleMarkdown: React.FC<{ text: string; allowIndent?: boolean }> = ({ text, allowIndent = false }) => {
    if (!text) return null;
    
    // Preprocess text to ensure raw LaTeX is formatted using correct delimiters
    let wrappedText = ensureLaTeXWrapping(text);
    
    // Fix common mistyped LaTeX patterns that lead to red text (KaTeX errors)
    // Handle unclosed delimiters by adding them at the end if they seem to be needed
    const openDelims = (wrappedText.match(/\\\(/g) || []).length;
    const closeDelims = (wrappedText.match(/\\\)/g) || []).length;
    if (openDelims > closeDelims) {
        wrappedText += '\\)'.repeat(openDelims - closeDelims);
    }

    // Special handling for question numbers like "5. " at the very beginning
    // The user wants them on a new line or clearly separated
    const questionNumberMatch = wrappedText.match(/^([0-9]+)\.\s+/);
    if (questionNumberMatch) {
        const num = questionNumberMatch[1];
        const rest = wrappedText.slice(questionNumberMatch[0].length);
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
    const codeBlockParts = wrappedText.split(/(```[\s\S]*?```)/g);

    return (
        <div className="leading-relaxed space-y-1">
            {codeBlockParts.map((part, index) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    // Check if it's SVG
                    const content = part.slice(3, -3).trim().replace(/^(xml|html|svg)\n/i, '');
                    
                    if (content.toLowerCase().includes('<svg') || content.startsWith('<svg')) {
                        const svgMatches = content.match(/<svg[\s\S]*?<\/svg>/gi);
                        if (svgMatches && svgMatches.length > 0) {
                            return (
                                <div key={index} className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 w-full py-4">
                                    {svgMatches.map((svgStr, idx) => (
                                        <InteractiveFigural key={idx} svgString={svgStr} />
                                    ))}
                                </div>
                            );
                        }
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
                            {mathParts.map((subPart, subIndex) => {
                                if (subPart.startsWith('$$') && subPart.endsWith('$$')) {
                                    const mathExpr = subPart.slice(2, -2).trim();
                                    return (
                                        <div key={subIndex} className="my-2 sm:my-4 flex justify-center w-full py-1 sm:py-2">
                                            <div className="min-w-0 max-w-full flex-shrink-0 overflow-hidden word-break-safe">
                                                <BlockMath math={mathExpr} />
                                            </div>
                                        </div>
                                    );
                                } else {
                                    // Support both \( ... \) and $ ... $ for inline math
                                    const inlineMathParts = subPart.split(/(\\\([\s\S]*?\\\))|(\$[\s\S]*?\$)/g);
                                    
                                    return (
                                        <div key={subIndex} className="inline-wrap w-full text-justify sm:text-left text-slate-700 dark:text-slate-300">
                                            {inlineMathParts.filter(Boolean).map((inlinePart, inlineIndex) => {
                                                const isInlineMath = (inlinePart.startsWith('\\(') && inlinePart.endsWith('\\)')) || 
                                                                  (inlinePart.startsWith('$') && inlinePart.endsWith('$'));
                                                
                                                if (isInlineMath) {
                                                    const content = inlinePart.startsWith('\\(') ? inlinePart.slice(2, -2) : inlinePart.slice(1, -1);
                                                    const inlineExpr = content.trim();
                                                    return (
                                                        <span key={inlineIndex} className="math-inline mx-0.5 inline-block align-middle max-w-full py-0.5 sm:py-1">
                                                            <InlineMath math={inlineExpr} />
                                                        </span>
                                                    );
                                                } else {
                                                    const svgParts = inlinePart.split(/(<svg[\s\S]*?<\/svg>)/i);

                                                    return (
                                                        <span key={inlineIndex} className="inline">
                                                            {svgParts.map((svgPart, svgIndex) => {
                                                                const trimmedSvg = svgPart.trim();
                                                                if (trimmedSvg.match(/^<svg[\s\S]*?<\/svg>$/i)) {
                                                                    return <div key={svgIndex} className="inline-block align-middle"><InteractiveFigural svgString={trimmedSvg} /></div>;
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
    if (!topic) return null;
    
    if (subtest?.includes('TWK') || subtest?.includes('Wawasan Kebangsaan')) {
        const t = topic.toLowerCase();
        if (t.includes('nasionalisme')) return 'Nasionalisme (Kepentingan Nasional)';
        if (t.includes('integritas')) return 'Integritas (Kejujuran/Komitmen)';
        if (t.includes('bela negara')) return 'Bela Negara (Peran Aktif)';
        if (t.includes('pancasila')) return 'Pilar Negara - Pancasila';
        if (t.includes('uud')) return 'Pilar Negara - UUD 1945';
        if (t.includes('nkri')) return 'Pilar Negara - NKRI';
        if (t.includes('bhinneka')) return 'Pilar Negara - Bhinneka Tunggal Ika';
        if (t.includes('pilar negara')) return 'Pilar Negara';
        if (t.includes('bahasa')) return 'Bahasa Indonesia';
    }
    
    return topic;
};

interface MatrixProps {
    content: string;
    metadataMatrix?: any;
    selectedOptionContent?: string | null;
}

export const MatrixQuestionRenderer: React.FC<MatrixProps> = ({ content, metadataMatrix, selectedOptionContent }) => {
    // Flexible regex for :::MATRIX::: ... ::: or just :::MATRIX::: at start
    const matrixMatch = content.match(/:::MATRIX:::([\s\S]*?)($|:::)/);
    
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
        if (matrixData[0] && typeof matrixData[0] === 'object' && !Array.isArray(matrixData[0]) && 'row' in matrixData[0]) {
            matrixData = matrixData.map((item: any) => item.row);
        }

        if (matrixData.length === 1 && Array.isArray(matrixData[0])) {
             if (matrixData[0].length > 0 && Array.isArray(matrixData[0][0])) {
                 matrixData = matrixData[0];
             }
        }        const cols = matrixData[0]?.length || 3;

        return (
            <div id="fajmuls-matrix-grid" className="space-y-6 flex flex-col items-center w-full my-8 animate-fade-in mb-10 overflow-hidden">
                <div className="relative p-2 sm:p-4 bg-transparent rounded-3xl">
                    <div className={`grid grid-cols-${cols} gap-2 sm:gap-4 md:gap-6 bg-transparent p-2 rounded-2xl relative z-10`}>
                         {matrixData.map((row: any[], rowIndex: number) => (
                             row.map((cell: any, colIndex: number) => {
                                 const isObject = cell && typeof cell === 'object' && !Array.isArray(cell);
                                 let cellContent = isObject ? cell.content : (Array.isArray(cell) ? cell[0] : cell);
                                 const id = isObject ? cell.id : `${rowIndex}-${colIndex}`;

                                 if (cellContent === '?' && selectedOptionContent) {
                                     cellContent = selectedOptionContent;
                                 }

                                 const isQuestionMark = cellContent === '?';
                                 
                                 return (
                                     <div 
                                        key={id} 
                                        className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 bg-transparent rounded-xl flex items-center justify-center transition-all overflow-hidden`}
                                     >
                                         {isQuestionMark ? (
                                             <div className="w-full h-full flex items-center justify-center rounded-xl border-2 border-dashed border-indigo-500/30">
                                                <span className="text-indigo-500/40 font-black text-4xl sm:text-5xl select-none italic underline decoration-indigo-500/20">?</span>
                                             </div>
                                         ) : (
                                             <div className="w-full h-full p-2 flex items-center justify-center [&>div]:w-full [&>div]:h-full [&>div>div]:flex [&>div>div]:items-center [&>div>div]:justify-center">
                                                 <InteractiveFigural svgString={String(cellContent || '')} />
                                             </div>
                                         )}
                                     </div>
                                 );
                             })
                         ))}
                    </div>
                </div>
                {questionText && questionText.trim() !== '' && (
                    <div className="w-full text-center max-w-2xl mx-auto py-3 px-6 bg-white/80 dark:bg-slate-800/80 rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg backdrop-blur-md word-break-safe">
                        <SimpleMarkdown text={questionText} />
                    </div>
                )}
            </div>
        );
    } catch (e) {
        console.error("Failed to parse matrix data", e);
        return <SimpleMarkdown text={content} />;
    }
};
