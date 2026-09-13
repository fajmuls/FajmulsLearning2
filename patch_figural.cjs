const fs = require('fs');
let code = fs.readFileSync('components/InteractiveFigural.tsx', 'utf-8');

const oldSizeClass = "const sizeClass = isOption ? 'max-h-[75px] sm:max-h-[90px] max-w-[75px] sm:max-w-[90px] mx-auto' : isInline ? 'w-full h-full object-contain' : `max-h-[150px] sm:max-h-[180px] lg:max-h-[210px] object-contain ${isWide ? 'w-auto h-[100px] sm:h-[130px]' : 'max-w-full mx-auto'}`;";

const newSizeClass = "const sizeClass = isOption ? 'max-h-[5em] sm:max-h-[6em] max-w-[5em] sm:max-w-[6em] mx-auto' : isInline ? 'w-full h-full object-contain' : `max-h-[10em] sm:max-h-[12em] lg:max-h-[14em] object-contain ${isWide ? 'w-auto h-[7em] sm:h-[9em]' : 'max-w-full mx-auto'}`;";

code = code.replace(oldSizeClass, newSizeClass);

fs.writeFileSync('components/InteractiveFigural.tsx', code);
