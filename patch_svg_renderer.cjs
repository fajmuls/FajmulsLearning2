const fs = require('fs');
let code = fs.readFileSync('components/QuestionRenderer.tsx', 'utf-8');

const oldAttr = "svgElement.setAttribute('class', `${currentClass} max-w-full max-h-[160px] sm:max-h-[200px] lg:max-h-[220px] object-contain mx-auto transition-transform duration-300 select-none`);";
const newAttr = "svgElement.setAttribute('class', `${currentClass} max-w-full max-h-[10em] sm:max-h-[12em] lg:max-h-[14em] object-contain mx-auto transition-transform duration-300 select-none`);";

code = code.replace(oldAttr, newAttr);

fs.writeFileSync('components/QuestionRenderer.tsx', code);
