const fs = require('fs');
let code = fs.readFileSync('components/GenerationProgressBox.tsx', 'utf-8');

code = code.replace(/task\.status === 'completed' \? 'Selesai' : 'Gagal'/g, "task.status === 'completed' ? 'Selesai' : task.status === 'paused' ? 'Terjeda (Limit)' : 'Gagal'");
code = code.replace(/{task\.status === 'generating' \? \(/g, `{task.status === 'generating' ? (`);

code = code.replace(/<AlertTriangle size=\{16\} className="text-rose-500" \/>\s*\)}/g, `<AlertTriangle size={16} className="text-rose-500" />
          ) : task.status === 'paused' ? (
             <Clock size={16} className="text-amber-500" />
          )}`);

code = code.replace(/{task\.status === 'generating' && \(/g, `{(task.status === 'generating' || task.status === 'paused') && (`);

code = code.replace(/Meracik soal berkualitas tinggi\.\.\./g, `
{task.status === 'paused' ? (task.errorMsg || 'Menunggu kuota AI...') : 'Meracik soal berkualitas tinggi...'}
`);

code = code.replace(/<span className="text-indigo-600 dark:text-indigo-400">\{task.progress\}% Selesai<\/span>/g, `<span className="text-indigo-600 dark:text-indigo-400">{task.progress}% Selesai {task.status === 'paused' && '(Jeda)'}</span>`);

code = code.replace(/<div className="mt-2 flex justify-end gap-2">/g, `<div className="mt-2 flex justify-end gap-2">
           {task.status === 'paused' && (
             <button
               onClick={() => {
                 SoundManager.play('click');
                 // Trigger resume somehow. Actually, onResume is needed.
                 // We can add onResume prop to GenerationProgressBox
               }}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors"
             >
               <Sparkles size={14} /> Lanjutkan
             </button>
           )}`);

fs.writeFileSync('components/GenerationProgressBox.tsx', code);
