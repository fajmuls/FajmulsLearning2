import React, { useEffect, useRef } from 'react';
import katex from 'katex';

interface MathProps {
  math: string;
}

export const InlineMath: React.FC<MathProps> = ({ math }) => {
  const containerRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math || '', containerRef.current, {
          displayMode: false,
          throwOnError: false,
        });
      } catch (error) {
        containerRef.current.textContent = math || '';
      }
    }
  }, [math]);

  return <span ref={containerRef} />;
};

export const BlockMath: React.FC<MathProps> = ({ math }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      try {
        katex.render(math || '', containerRef.current, {
          displayMode: true,
          throwOnError: false,
        });
      } catch (error) {
        containerRef.current.textContent = math || '';
      }
    }
  }, [math]);

  return <div ref={containerRef} />;
};
