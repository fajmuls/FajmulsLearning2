const fs = require('fs');
let code = fs.readFileSync('components/HistoryView.tsx', 'utf-8');

// 1. Remove SubtestWeaknessAnalysis from the card
const regex1 = /\{\/\* Granular Sub-test & Topic Weakness Analysis for this Attempt \*\/\}\s*\{item\.questions && item\.questions\.length > 0 && \(\s*<SubtestWeaknessAnalysis[\s\S]*?\/>\s*\)\}/;
code = code.replace(regex1, '');

// 2. Add it to ReviewView, inside the <div className="lg:col-span-3 space-y-4 sm:space-y-6">, 
// just below the header div.
const headerDivEnd = `                                </h2>
                            </div>`; // Let's find a reliable injection point.
