const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

code = code.replace("const qs = await Gemini.generateSkdSimulation(skdStream);", "const qs = await Gemini.generateSkdSimulation(skdStream);");
code = code.replace("setQuestions(qs || []);", "setQuestions((qs as any).questions || []);");

fs.writeFileSync('App.tsx', code);
