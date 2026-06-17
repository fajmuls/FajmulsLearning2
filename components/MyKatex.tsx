import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathProps {
  math?: string;
  children?: string;
}

export const InlineMath: React.FC<MathProps> = ({ math, children }) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const formula = math || children || "";

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: false,
          throwOnError: false,
        });
      } catch (err) {
        console.error("KaTeX inline render error:", err);
        containerRef.current.textContent = formula;
      }
    }
  }, [formula]);

  return <span ref={containerRef} className="inline-math" />;
};

export const BlockMath: React.FC<MathProps> = ({ math, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const formula = math || children || "";

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(formula, containerRef.current, {
          displayMode: true,
          throwOnError: false,
        });
      } catch (err) {
        console.error("KaTeX block render error:", err);
        containerRef.current.textContent = formula;
      }
    }
  }, [formula]);

  return <div ref={containerRef} className="block-math my-2 overflow-x-auto overflow-y-hidden max-w-full" />;
};
