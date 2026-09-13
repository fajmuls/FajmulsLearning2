const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const regex = /newQuestions = await Gemini\.generateSkdSimulation\(\s*skdStream \|\| "CPNS",\s*skdVariant,?\s*\);/g;

code = code.replace(regex, `const res = await Gemini.generateSkdSimulation(
            skdStream || "CPNS",
            skdVariant,
            activeGenTask?.savedState,
            (progressVal, msg) => {
              setActiveGenTask((prev) => {
                if (!prev || prev.id !== taskId) return prev;
                return { ...prev, progress: progressVal };
              });
              // showToast(msg, 'info'); // optional, might be spammy
            }
          );
          if (!res.completed) {
            clearInterval(progressInterval);
            setActiveGenTask((prev) => {
              if (!prev || prev.id !== taskId) return prev;
              return { ...prev, status: "paused", savedState: res.state, errorMsg: res.errorMsg };
            });
            showToast("Kuota AI Terlimit. Pembuatan Paket dijeda sementara.", "error");
            return; // stop execution
          }
          newQuestions = res.questions || [];`);

fs.writeFileSync('App.tsx', code);
