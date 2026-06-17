import React from 'react';
import { MindMapNode } from '../types';

const TreeNode: React.FC<{ node: MindMapNode; depth?: number }> = ({ node, depth = 0 }) => {
  return (
    <div className="flex flex-col items-center">
      <div className={`
        border-2 px-4 py-2 rounded-xl text-center font-medium shadow-sm transition-all hover:scale-105
        ${depth === 0 ? 'bg-indigo-600 text-white border-indigo-600 mb-4 text-lg' : ''}
        ${depth === 1 ? 'bg-white text-indigo-700 border-indigo-200 mb-4 text-base' : ''}
        ${depth > 1 ? 'bg-slate-50 text-slate-600 border-slate-200 text-sm' : ''}
      `}>
        {node.label}
      </div>
      
      {node.children && node.children.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 relative pt-4">
          {/* Connector lines visual hack using borders could go here, but omitted for clean CSS grid feel */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-slate-300"></div>
          <div className="absolute top-0 left-4 right-4 h-px bg-slate-300"></div>
          
          {node.children.map((child, idx) => (
             <div key={idx} className="flex flex-col items-center relative">
               <div className="w-px h-4 bg-slate-300 mb-1"></div>
               <TreeNode node={child} depth={depth + 1} />
             </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const MindMapViewer: React.FC<{ data: any }> = ({ data }) => {
  const root = data.root || data;
  return (
    <div className="p-8 bg-slate-50 rounded-3xl overflow-x-auto border border-slate-200 min-h-[400px] flex justify-center">
      <TreeNode node={root} />
    </div>
  );
};