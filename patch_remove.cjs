const fs = require('fs');
let code = fs.readFileSync('components/HistoryView.tsx', 'utf-8');

const regex = /\{\/\* Granular Sub-test & Topic Weakness Analysis for this Attempt \*\/\}\s*\{item\.questions && item\.questions\.length > 0 && \(\s*<SubtestWeaknessAnalysis[\s\S]*?\/>\s*\)\}/;
code = code.replace(regex, '');

fs.writeFileSync('components/HistoryView.tsx', code);
