const fs = require('fs');
let code = fs.readFileSync('components/ProfileModal.tsx', 'utf-8');

const regex = /<div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">\s*<span>\{cat\.correctCount\} Benar \/ \{cat\.wrongCount\} Salah<\/span>\s*<span>\{cat\.packagesCount\} Paket TO<\/span>\s*<\/div>/;

const newHTML = `<div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                                                <span>{cat.correctCount} Benar / {cat.wrongCount} Salah</span>
                                                <span>{cat.packagesCount} Paket TO</span>
                                            </div>
                                            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 mt-1 border-t border-slate-50 dark:border-slate-700/30">
                                                <span>Waktu Belajar: <span className="font-bold text-slate-700 dark:text-slate-300">{formatSeconds(cat.totalTimeSeconds)}</span></span>
                                            </div>`;

code = code.replace(regex, newHTML);

fs.writeFileSync('components/ProfileModal.tsx', code);
