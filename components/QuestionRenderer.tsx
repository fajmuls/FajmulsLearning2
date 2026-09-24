import React, { useMemo } from 'react';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import { Grid, Shapes, ArrowRight } from 'lucide-react';
import { InteractiveFigural } from './InteractiveFigural';
import { ErrorBoundary } from './ErrorBoundary';

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
                svgElement.setAttribute('class', `${currentClass} max-w-full max-h-[10em] sm:max-h-[12em] lg:max-h-[14em] object-contain mx-auto transition-transform duration-300 select-none`);
                
                return svgElement.outerHTML;
            }
        } catch (err) {
            console.error("SVG preprocessing failed", err);
        }
        return svgString;
    }, [svgString]);

    return (
        <div 
            className="flex justify-center items-center my-2 sm:my-3 overflow-hidden max-w-full" 
            dangerouslySetInnerHTML={{ __html: processedSvg }} 
        />
    );
};

const latexCache = new Map<string, string>();

const cleanMathExpression = (expr: string): string => {
    if (!expr) return '';
    let clean = expr.trim();
    // Strip redundant outer delimiters inside the math block
    clean = clean.replace(/^\\\(|^\$\$|^\$|^\\\[/g, '').replace(/\\\)$|\$\$$|\$$|\\\]$/g, '').trim();
    
    // Normalize multiple backslashes resulting from JSON escaping (e.g. \\frac -> \frac)
    clean = clean.replace(/\\\\+(frac|dfrac|tfrac|cfrac|sqrt|pm|times|div|cdot|cdots|ldots|dots|alpha|beta|gamma|delta|pi|theta|sigma|omega|le|ge|leq|geq|neq|approx|sum|prod|int|text|mathbf|mathrm|mathit|sin|cos|tan|log|ln|left|right|binom|overline|underline|vec|hat|degree)/g, '\\$1');
    
    // Fix \degree (not supported in default KaTeX) -> ^{\circ}
    clean = clean.replace(/\\degree\b/g, '^{\\circ}');
    
    // Fix unescaped percentage sign inside LaTeX: e.g. 25% -> 25\%
    clean = clean.replace(/([^\\]|^)%/g, '$1\\%');
    
    // Fix unescaped currency or words: e.g. Rp 50.000 -> \text{Rp } 50.000
    clean = clean.replace(/\bRp\.?\s*/g, '\\text{Rp }');

    // Balance unclosed braces
    const openBraces = (clean.match(/\{/g) || []).length;
    const closeBraces = (clean.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
        clean += '}'.repeat(openBraces - closeBraces);
    } else if (closeBraces > openBraces) {
        let diff = closeBraces - openBraces;
        while (diff > 0 && clean.endsWith('}')) {
            clean = clean.slice(0, -1);
            diff--;
        }
    }
    
    // Fix unmatched \left without \right
    const leftCount = (clean.match(/\\left\b/g) || []).length;
    const rightCount = (clean.match(/\\right\b/g) || []).length;
    if (leftCount > rightCount) {
        clean += '\\right.'.repeat(leftCount - rightCount);
    } else if (rightCount > leftCount) {
        clean = '\\left.'.repeat(rightCount - leftCount) + clean;
    }

    return clean;
};

const renderFallbackMath = (expr: string): React.ReactNode => {
    if (!expr) return null;
    let fallback = expr
        // Convert fractions: \frac{a}{b} or \dfrac{a}{b} -> a/b
        .replace(/\\(?:d|t|c)?frac\s*\{([^{}]+)\}\s*\{([^{}]+)\}/g, '$1/$2')
        .replace(/\\sqrt\s*(?:\[([^\]]+)\])?\s*\{([^{}]+)\}/g, (_, root, val) => root ? `${root}√(${val})` : `√(${val})`)
        .replace(/\\times\b/g, '×')
        .replace(/\\div\b/g, '÷')
        .replace(/\\pm\b/g, '±')
        .replace(/\\le\b|\\leq\b/g, '≤')
        .replace(/\\ge\b|\\geq\b/g, '≥')
        .replace(/\\neq\b/g, '≠')
        .replace(/\\approx\b/g, '≈')
        .replace(/\\cdot\b/g, '·')
        .replace(/\\degree\b|\^\{\\circ\}/g, '°')
        .replace(/\\text\s*\{([^{}]+)\}/g, '$1')
        .replace(/\\([a-zA-Z]+)/g, '$1')
        .replace(/[{}]/g, '');
    
    return <span className="text-inherit font-sans">{fallback}</span>;
};

const ensureLaTeXWrapping = (text: string, isOption: boolean = false): string => {
    if (!text) return text;
    const cacheKey = (isOption ? '1:' : '0:') + text;
    const cached = latexCache.get(cacheKey);
    if (cached !== undefined) return cached;
    
    // 1. Normalize escaped backslashes and display math
    let preparedText = text
        // Normalize multiple backslashes from JSON strings e.g. \\frac -> \frac
        .replace(/\\\\+(frac|dfrac|tfrac|cfrac|sqrt|pm|times|div|cdot|cdots|ldots|dots|alpha|beta|gamma|delta|pi|theta|sigma|omega|le|ge|leq|geq|neq|approx|sum|prod|int|text|sin|cos|tan|log|ln|left|right|binom|degree)/g, '\\$1')
        // Normalize display math \[ ... \] to $$ ... $$
        .replace(/\\\[([\s\S]*?)\\\]/g, (_, inner) => `\n$$\n${inner.trim()}\n$$\n`)
        // Normalize \degree
        .replace(/\\degree\b/g, '^{\\circ}');

    // 2. Convert common unicode superscripts/subscripts and math operators
    preparedText = preparedText
        .replace(/²/g, '^2')
        .replace(/³/g, '^3')
        .replace(/⁴/g, '^4')
        .replace(/⁵/g, '^5')
        .replace(/⁶/g, '^6')
        .replace(/⁷/g, '^7')
        .replace(/⁸/g, '^8')
        .replace(/⁹/g, '^9')
        .replace(/⁰/g, '^0')
        .replace(/¹/g, '^1')
        .replace(/⁺/g, '^+')
        .replace(/⁻/g, '^-')
        .replace(/₁/g, '_1')
        .replace(/₂/g, '_2')
        .replace(/₃/g, '_3')
        .replace(/₄/g, '_4')
        .replace(/₅/g, '_5')
        .replace(/₆/g, '_6')
        .replace(/₇/g, '_7')
        .replace(/₈/g, '_8')
        .replace(/₉/g, '_9')
        .replace(/₀/g, '_0')
        .replace(/×/g, '\\times ')
        .replace(/÷/g, '\\div ')
        .replace(/±/g, '\\pm ')
        .replace(/≤/g, '\\le ')
        .replace(/≥/g, '\\ge ')
        .replace(/≠/g, '\\neq ')
        .replace(/√/g, '\\sqrt');

    // 3. Convert plain fractions like "1/2" to protected LaTeX "\(\frac{1}{2}\)" (safely avoiding dates like 12/10/2024)
    preparedText = preparedText.replace(/(^|[^\d/])(\d+)\/(\d+)(?=[^\d/]|$)/g, '$1\\(\\frac{$2}{$3}\\)');

    // 4. Convert ellipsis in number series e.g. "4, 9, 19, 39, ..." -> "\dots"
    preparedText = preparedText.replace(/(\d+[\s]*[,;]\s*)+(?:\.{3,}|…)/g, (match) => {
        const clean = match.replace(/\.{3,}|…/g, '\\dots');
        return `\\(${clean}\\)`;
    });

    // 5. Special handling if this is an option and contains pure numbers or algebraic expressions
    if (isOption) {
        const trimmed = preparedText.trim();
        const prefixMatch = trimmed.match(/^([A-E]\.\s*)(.*)$/);
        const prefix = prefixMatch ? prefixMatch[1] : '';
        const body = prefixMatch ? prefixMatch[2].trim() : trimmed;

        if (body && !body.startsWith('\\(') && !body.startsWith('$') && !body.startsWith('$$') && !body.startsWith('<svg')) {
            const isPureMathOrNumber = /^[-+]?[\d.,]+%?$/.test(body) ||
                                       /^[a-zA-Z]\s*=\s*[-+]?[\d.,]+%?$/.test(body) ||
                                       /^\\(?:d|t|c)?frac\{[^{}]+\}\{[^{}]+\}$/.test(body) ||
                                       (/^[-+]?[\d\w\^\+\-\*\/\=\<\>\(\)\s.,\\]+$/.test(body) && /[\d\+\-\*\/\=\<\>\^\\]/.test(body) && !/[a-zA-Z]{5,}/.test(body));
            if (isPureMathOrNumber) {
                return `${prefix}\\(${body}\\)`;
            }
        }
    }

    // Split text by existing math blocks, code blocks, or SVG to avoid double wrapping
    const parts = preparedText.split(/(\\\([\s\S]*?\\\))|(\$\$[\s\S]*?\$\$)|(\$(?!\s)[^$\n]+(?<!\s)\$)|(<svg[\s\S]*?<\/svg>)|(```[\s\S]*?```)/g);
    
    // Comprehensive regex for wrapping raw LaTeX expressions and mathematical formulas:
    // Captures fractions (including nested braces), roots, symbols, equations like "x = \frac{1}{3}" or "\frac{1}{3} + \frac{2}{3} = 1"
    const latexExprRegex = /(?:[a-zA-Z0-9\(\)]+(?:\s*[\^]\s*[-0-9a-zA-Z]+)?\s*[\=\<\>\+\-\*\/]\s*)?\\(?:(?:d|t|c)?frac|sqrt|binom|text|mathbf|mathrm|mathit|overline|underline|vec|hat)\s*(?:\[[^\]]*\])?(?:\s*\{([^{}]*|\{[^{}]*\})*\}){1,2}(?:\s*[\=\<\>\+\-\*\/\^]\s*(?:\\?[a-zA-Z0-9\(\)]+(?:\s*\{([^{}]*|\{[^{}]*\})*\})*|[-0-9.,]+))*|\\(?:pm|times|div|cdot|cdots|ldots|dots|vdots|ddots|approx|neq|le|ge|leq|geq|equiv|sim|cong|to|rightarrow|leftarrow|Rightarrow|Leftarrow|iff|implies|leftrightarrow|forall|exists|in|notin|subset|subseteq|supset|supseteq|cap|cup|setminus|emptyset|circ|degree|angle|perp|parallel|triangle|square|alpha|beta|gamma|delta|epsilon|varepsilon|zeta|eta|theta|vartheta|iota|kappa|lambda|mu|nu|xi|pi|varpi|rho|varrho|sigma|varsigma|tau|upsilon|phi|varphi|chi|psi|omega|Gamma|Delta|Theta|Lambda|Xi|Pi|Sigma|Upsilon|Phi|Psi|Omega|infty|partial|sum|prod|int|oint|log|ln|lg|exp|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|coth|quad|qquad)(?:\s*\{([^{}]*|\{[^{}]*\})*\})*|(?:\b[a-zA-Z]\s*[\=\<\>]\s*[-+]?\d+(?:[.,]\d+)?%?)|(?:\b\d+(?:[.,]\d+)?\s*%)|(?:(?:\d+[\s]*[,;]\s*){2,}\d+)/g;

    let processed = "";
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (!part) continue;
        
        // If this is already a math block, SVG, or code block, keep it intact
        if (part.startsWith('\\(') || part.startsWith('$') || part.startsWith('$$') || part.startsWith('<svg') || part.startsWith('```')) {
            processed += part;
        } else {
            // Find and wrap raw LaTeX & mathematical expressions
            processed += part.replace(latexExprRegex, (match) => {
                if (match.length < 1) return match;
                if (match.startsWith('\\(') && match.endsWith('\\)')) return match;
                return `\\(${match}\\)`;
            });
        }
    }
    
    if (latexCache.size > 2000) {
        latexCache.clear();
    }
    latexCache.set(cacheKey, processed);
    return processed;
};

// --- Markdown Table Parser & Authentic Table Renderer ---
export interface ParsedMarkdownTable {
    headers: string[];
    rows: string[][];
    alignments: ('left' | 'center' | 'right')[];
    hasHeader: boolean;
    isMatrix?: boolean;
}

const extractCellsFromPipeRow = (row: string): string[] => {
    return row
        .trim()
        .replace(/^\|/, '')
        .replace(/\|$/, '')
        .split('|')
        .map(c => c.trim());
};

const isPipeRow = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.includes('|')) return false;
    const cells = extractCellsFromPipeRow(trimmed);
    return cells.length >= 2;
};

const isSeparatorRow = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.includes('|') || !trimmed.includes('-')) return false;
    const cells = extractCellsFromPipeRow(trimmed);
    return cells.length >= 2 && cells.every(c => /^:?-+:?$/.test(c));
};

export const parseMarkdownTable = (block: string): ParsedMarkdownTable | null => {
    const rawLines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    if (rawLines.length === 0) return null;

    // Check if it's a standard markdown table with separator at index 1
    if (rawLines.length >= 2 && isSeparatorRow(rawLines[1])) {
        const headers = extractCellsFromPipeRow(rawLines[0]);
        const separatorCells = extractCellsFromPipeRow(rawLines[1]);
        if (headers.length === 0 || separatorCells.length !== headers.length) return null;

        const alignments: ('left' | 'center' | 'right')[] = separatorCells.map(c => {
            if (c.startsWith(':') && c.endsWith(':')) return 'center';
            if (c.endsWith(':')) return 'right';
            return 'left';
        });

        const rows: string[][] = [];
        for (let i = 2; i < rawLines.length; i++) {
            if (!isPipeRow(rawLines[i])) break;
            const cells = extractCellsFromPipeRow(rawLines[i]);
            while (cells.length < headers.length) cells.push('');
            rows.push(cells.slice(0, headers.length));
        }

        return { headers, rows, alignments, hasHeader: true, isMatrix: false };
    }

    // Check if it's a headerless pipe matrix/table (all lines have pipes and consistent columns)
    const allPipeLines = rawLines.filter(isPipeRow);
    if (allPipeLines.length >= 1) {
        const parsedRows = allPipeLines.map(extractCellsFromPipeRow);
        const colCount = Math.max(...parsedRows.map(r => r.length));
        if (colCount < 2) return null;

        // Check if row 0 looks like a header (mostly text) while other rows are numeric/data
        const row0IsNumeric = parsedRows[0].some(c => /^\d+$/.test(c.replace(/[^0-9]/g, '')) || c === '?');
        const subsequentAreNumeric = parsedRows.length > 1 && parsedRows.slice(1).some(row => row.some(c => /^\d+$/.test(c.replace(/[^0-9]/g, '')) || c === '?'));

        const hasHeader = !row0IsNumeric && subsequentAreNumeric;
        const isMatrix = row0IsNumeric || !hasHeader || parsedRows.length === 1;

        if (hasHeader) {
            const headers = parsedRows[0];
            while (headers.length < colCount) headers.push('');
            const rows = parsedRows.slice(1).map(r => {
                while (r.length < colCount) r.push('');
                return r;
            });
            const alignments = Array(colCount).fill('center');
            return { headers, rows, alignments, hasHeader: true, isMatrix: false };
        } else {
            const rows = parsedRows.map(r => {
                while (r.length < colCount) r.push('');
                return r;
            });
            const alignments = Array(colCount).fill('center');
            return { headers: [], rows, alignments, hasHeader: false, isMatrix: true };
        }
    }

    return null;
};

export const splitByTables = (text: string): { isTable: boolean; content: string; table?: ParsedMarkdownTable }[] => {
    const lines = text.split(/\r?\n/);
    const segments: { isTable: boolean; content: string; table?: ParsedMarkdownTable }[] = [];
    let currentNonTable: string[] = [];
    let i = 0;

    while (i < lines.length) {
        const trimmed = lines[i].trim();
        
        // 1. Standard markdown table check (line i has pipes, line i+1 has separator dashes)
        if (isPipeRow(trimmed) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
            if (currentNonTable.length > 0) {
                segments.push({ isTable: false, content: currentNonTable.join('\n') });
                currentNonTable = [];
            }
            const tableLines: string[] = [];
            while (i < lines.length && (isPipeRow(lines[i]) || isSeparatorRow(lines[i]))) {
                tableLines.push(lines[i].trim());
                i++;
            }
            const parsed = parseMarkdownTable(tableLines.join('\n'));
            if (parsed) {
                segments.push({ isTable: true, content: tableLines.join('\n'), table: parsed });
            } else {
                segments.push({ isTable: false, content: tableLines.join('\n') });
            }
            continue;
        }

        // 2. Multi-row or single-row pipe matrix check
        if (isPipeRow(trimmed)) {
            if (currentNonTable.length > 0) {
                segments.push({ isTable: false, content: currentNonTable.join('\n') });
                currentNonTable = [];
            }
            const tableLines: string[] = [];
            while (i < lines.length && isPipeRow(lines[i])) {
                tableLines.push(lines[i].trim());
                i++;
            }
            const parsed = parseMarkdownTable(tableLines.join('\n'));
            if (parsed) {
                segments.push({ isTable: true, content: tableLines.join('\n'), table: parsed });
            } else {
                segments.push({ isTable: false, content: tableLines.join('\n') });
            }
            continue;
        }

        currentNonTable.push(lines[i]);
        i++;
    }

    if (currentNonTable.length > 0) {
        segments.push({ isTable: false, content: currentNonTable.join('\n') });
    }

    return segments;
};

export const AuthenticTableRenderer: React.FC<{
    table: ParsedMarkdownTable;
}> = React.memo(({ table }) => {
    // If it's a matrix or headerless table (such as TIU 3x3 or 2x4 number matrices)
    if (table.isMatrix || !table.hasHeader) {
        const colCount = table.rows[0]?.length || 3;
        return (
            <div className="my-3 sm:my-5 flex flex-col items-center justify-center w-full overflow-x-auto py-1">
                <div className="inline-flex items-stretch border-l-4 border-r-4 border-indigo-400 dark:border-indigo-500 rounded-2xl bg-white/90 dark:bg-slate-850/90 shadow-sm px-2.5 sm:px-4 py-2.5 sm:py-3.5 border-t border-b border-slate-200/80 dark:border-slate-700/80 max-w-full">
                    <div 
                        className="grid gap-2 sm:gap-3 items-center justify-center min-w-max" 
                        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
                    >
                        {table.rows.map((row, rIdx) => 
                            row.map((cell, cIdx) => {
                                const trimmedCell = cell.trim();
                                const isQuestionMark = trimmedCell === '?' || trimmedCell === '??' || trimmedCell.startsWith('?');
                                return (
                                    <div
                                        key={`${rIdx}-${cIdx}`}
                                        className={`min-w-[44px] sm:min-w-[56px] min-h-[40px] sm:min-h-[50px] px-2.5 py-1.5 rounded-xl flex items-center justify-center text-center transition-all ${
                                            isQuestionMark 
                                                ? 'bg-amber-100/90 dark:bg-amber-950/70 border-2 border-dashed border-amber-400 dark:border-amber-500 text-amber-700 dark:text-amber-300 font-black text-base sm:text-lg animate-pulse shadow-xs'
                                                : 'bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-700/80 font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-100 shadow-2xs'
                                        }`}
                                    >
                                        <SimpleMarkdown text={cell} isOption={true} />
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Standard markdown table with headers
    return (
        <div className="my-3 sm:my-4 w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-750 shadow-xs bg-white dark:bg-slate-850">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                    <tr className="bg-slate-100/90 dark:bg-slate-750 border-b border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                        {table.headers.map((h, i) => {
                            const align = table.alignments[i] || 'center';
                            const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                            return (
                                <th
                                    key={i}
                                    className={`py-2 px-3 sm:py-2.5 sm:px-4 font-bold border-r last:border-r-0 border-slate-200 dark:border-slate-700 ${alignClass}`}
                                >
                                    <SimpleMarkdown text={h} isOption={true} />
                                </th>
                            );
                        })}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-750 text-slate-700 dark:text-slate-300">
                    {table.rows.map((row, rIdx) => (
                        <tr
                            key={rIdx}
                            className="even:bg-slate-50/60 dark:even:bg-slate-800/40 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors"
                        >
                            {row.map((cell, cIdx) => {
                                const align = table.alignments[cIdx] || 'center';
                                const alignClass = align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';
                                const trimmedCell = cell.trim();
                                const isQuestionMark = trimmedCell === '?' || trimmedCell === '??' || trimmedCell.startsWith('?');
                                return (
                                    <td
                                        key={cIdx}
                                        className={`py-2 px-3 sm:py-2.5 sm:px-4 border-r last:border-r-0 border-slate-200 dark:border-slate-700 ${alignClass}`}
                                    >
                                        {isQuestionMark ? (
                                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-dashed border-amber-400 text-amber-700 dark:text-amber-300 font-black text-xs sm:text-sm animate-pulse">
                                                ?
                                            </span>
                                        ) : (
                                            <SimpleMarkdown text={cell} isOption={true} />
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
});

export const SimpleMarkdown: React.FC<{ text: string; allowIndent?: boolean; isOption?: boolean }> = React.memo(({ text, allowIndent = false, isOption = false }) => {
    if (!text) return null;

    // 1. Text Cleaning & LateX Prep
    let processedText = text
        // Fix some common LLM hallucinated markdown/latex combos
        .replace(/`([^`]+)`/g, (match, code) => {
            if (code.includes('\\')) return `\\(${code}\\)`;
            return match;
        });

    // 2. Wrap raw LaTeX and numbers
    processedText = ensureLaTeXWrapping(processedText, isOption);
    
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
        <div className="leading-relaxed space-y-1">
            {codeBlockParts.map((part: string, index: number) => {
                if (part.startsWith('```') && part.endsWith('```')) {
                    // Check if it's SVG
                    const rawContent = part.slice(3, -3).trim();
                    const content = rawContent.replace(/^(xml|html|svg|math|latex|tex)\n/i, '');
                    const isMathBlock = rawContent.toLowerCase().startsWith('math\n') || 
                                        rawContent.toLowerCase().startsWith('latex\n') ||
                                        rawContent.toLowerCase().startsWith('tex\n') ||
                                        (/\\(?:(?:d|t|c)?frac|sqrt|pm|times|le|ge|leq|geq|approx|neq|cdot|div|alpha|beta|gamma|delta|theta|pi|sigma|omega|infty|partial|sum|prod|int|oint|text|degree|log|ln|sin|cos|tan|cot|sec|csc|subset|supset|in|cap|cup|perp|parallel|angle)/.test(content) && !content.includes('<svg'));
                    
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
                                                        <ErrorBoundary compact fallbackMessage="Gagal memuat gambar">
                                                            <InteractiveFigural svgString={svgStr} isOption={isOption} isInline={true} />
                                                        </ErrorBoundary>
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
                         const safeMathExpr = cleanMathExpression(content);
                         return (
                             <div key={index} className="my-2 sm:my-4 flex justify-center w-full py-1 sm:py-2 bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden word-break-safe text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
                                 <BlockMath math={safeMathExpr} renderError={() => renderFallbackMath(content)} />
                             </div>
                         );
                    }
                    
                    return (
                        <pre key={index} className="font-mono text-sm leading-none bg-slate-50 dark:bg-slate-900/50 p-3 sm:p-4 rounded-xl overflow-hidden whitespace-pre-wrap break-words word-break-safe border border-slate-200 dark:border-slate-800 flex justify-start items-start text-left my-2">
                            {content}
                        </pre>
                    );
                } else {
                    const tableSegments = splitByTables(part);

                    return (
                        <div key={index} className="w-full space-y-2">
                            {tableSegments.map((seg, sIdx) => {
                                if (seg.isTable && seg.table) {
                                    return <AuthenticTableRenderer key={sIdx} table={seg.table} />;
                                }

                                const mathParts = seg.content.split(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g);
                                return (
                                    <div key={sIdx} className="w-full">
                                        {mathParts.map((subPart: string, subIndex: number) => {
                                            const isBlockMath = (subPart.startsWith('$$') && subPart.endsWith('$$')) ||
                                                                (subPart.startsWith('\\[') && subPart.endsWith('\\]'));
                                            if (isBlockMath) {
                                                const rawExpr = subPart.startsWith('$$') ? subPart.slice(2, -2) : subPart.slice(2, -2);
                                                const safeMathExpr = cleanMathExpression(rawExpr);
                                                return (
                                                    <div key={subIndex} className="my-2 sm:my-4 flex justify-center w-full py-1 sm:py-2">
                                                        <div className="min-w-0 max-w-full flex-shrink-0 overflow-hidden word-break-safe text-slate-700 dark:text-slate-300">
                                                            <BlockMath math={safeMathExpr} renderError={() => renderFallbackMath(rawExpr)} />
                                                        </div>
                                                    </div>
                                                );
                                            } else {
                                                // Support both \( ... \) and $ ... $ for inline math
                                                const inlineMathParts = subPart.split(/(\\\([\s\S]*?\\\))|(\$(?!\s)[^$\n]+(?<!\s)\$)/g);
                                                
                                                return (
                                                    <div key={subIndex} className="inline-wrap w-full text-justify sm:text-left text-slate-700 dark:text-slate-300">
                                                        {inlineMathParts.filter(Boolean).map((inlinePart: string, inlineIndex: number) => {
                                                            const isInlineMath = (inlinePart.startsWith('\\(') && inlinePart.endsWith('\\)')) || 
                                                                              (inlinePart.startsWith('$') && inlinePart.endsWith('$'));
                                                            
                                                            if (isInlineMath) {
                                                                const content = inlinePart.startsWith('\\(') ? inlinePart.slice(2, -2) : inlinePart.slice(1, -1);
                                                                const safeInlineExpr = cleanMathExpression(content);
                                                                return (
                                                                    <span key={inlineIndex} className="math-inline mx-0.5 inline-block align-middle max-w-full py-0.5 sm:py-1">
                                                                        <InlineMath math={safeInlineExpr} renderError={() => renderFallbackMath(content)} />
                                                                    </span>
                                                                );
                                                            } else {
                                                                const svgParts = inlinePart.split(/(<svg[\s\S]*?<\/svg>)/i);

                                                                return (
                                                                    <span key={inlineIndex} className="inline">
                                                                        {svgParts.map((svgPart: string, svgIndex: number) => {
                                                                            const trimmedSvg = svgPart.trim();
                                                                            if (trimmedSvg.match(/^<svg[\s\S]*?<\/svg>$/i)) {
                                                                                return (
                                                                                    <div key={svgIndex} className="inline-block align-middle">
                                                                                        <ErrorBoundary compact fallbackMessage="Pola visual tidak dapat dimuat">
                                                                                            <InteractiveFigural svgString={trimmedSvg} isOption={isOption} isInline={true} />
                                                                                        </ErrorBoundary>
                                                                                    </div>
                                                                                );
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
                            })}
                        </div>
                    );
                }
            })}
        </div>
    );
});

export const formatTopic = (subtest: string | undefined, topic: string | undefined) => {
    if (!subtest && !topic) return null;
    
    let raw = topic || subtest || '';
    if (subtest && subtest.includes(' - ')) {
        const parts = subtest.split(' - ');
        raw = parts.slice(1).join(' - ').trim();
    } else if (topic && topic.includes(' - ')) {
        const parts = topic.split(' - ');
        raw = parts.slice(1).join(' - ').trim();
    } else if (subtest && !['TWK', 'TIU', 'TKP'].includes(subtest)) {
        raw = subtest;
    } else if (topic && !['TWK', 'TIU', 'TKP'].includes(topic)) {
        raw = topic;
    }
    
    const lowerRaw = raw.toLowerCase();
    const lowerSub = (subtest || '').toLowerCase();
    const lowerTop = (topic || '').toLowerCase();
    const combined = `${lowerSub} ${lowerTop} ${lowerRaw}`;
    
    // 1. TWK (Tema Resmi: Nasionalisme, Integritas, Bela Negara, Pilar Negara, Bahasa Indonesia)
    if (combined.includes('nasionalisme')) return 'Nasionalisme';
    if (combined.includes('integritas')) return 'Integritas';
    if (combined.includes('bela negara') || combined.includes('bela')) return 'Bela Negara';
    if (combined.includes('pilar') || combined.includes('pancasila') || combined.includes('uud') || combined.includes('nkri') || combined.includes('bhinneka')) return 'Pilar Negara';
    if (combined.includes('bahasa')) return 'Bahasa Indonesia';

    // 2. TIU (Tema Resmi: Verbal, Numerik, Figural)
    if (combined.includes('figural') || combined.includes('gambar') || combined.includes('9 kotak') || combined.includes('matriks')) return 'Figural';
    if (combined.includes('numerik') || combined.includes('hitung') || combined.includes('deret') || combined.includes('perbandingan') || combined.includes('aritmatika') || combined.includes('kuantitatif') || combined.includes('tabel') || combined.includes('soal cerita') || combined.includes('data sufficiency')) return 'Numerik';
    if (combined.includes('verbal') || combined.includes('analogi') || combined.includes('kalimat') || combined.includes('silogisme') || combined.includes('posisi') || combined.includes('analitis') || combined.includes('kata')) return 'Verbal';

    // 3. TKP (Tema Resmi: Pelayanan Publik, Jejaring Kerja (Networking), Sosial Budaya, TIK, Profesionalisme, Anti-Radikalisme)
    if (combined.includes('pelayanan')) return 'Pelayanan Publik';
    if (combined.includes('jejaring') || combined.includes('networking')) return 'Jejaring Kerja (Networking)';
    if (combined.includes('sosial budaya') || combined.includes('sosbud')) return 'Sosial Budaya';
    if (combined.includes('tik') || combined.includes('teknologi') || combined.includes('digital')) return 'TIK';
    if (combined.includes('profesionalisme') || combined.includes('profesional')) return 'Profesionalisme';
    if (combined.includes('radikalisme')) return 'Anti-Radikalisme';

    // Generic subtest fallback
    if (lowerSub.includes('twk')) return 'Pilar Negara';
    if (lowerSub.includes('tiu')) return 'Numerik';
    if (lowerSub.includes('tkp')) return 'Profesionalisme';
    
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
                                                 <ErrorBoundary compact fallbackMessage="Gagal memuat sel">
                                                     <InteractiveFigural svgString={String(cellContent || '')} isInline={true} />
                                                 </ErrorBoundary>
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
