const fs = require('fs');
let code = fs.readFileSync('App.tsx', 'utf-8');

const resumeFunc = `  const resumeGenerationTask = async (task: BackgroundGenTask) => {
    if (!task.savedState || task.category !== 'SKD') {
      showToast("Tipe paket ini belum mendukung fitur Lanjutkan.", "error");
      return;
    }
    
    setActiveGenTask(prev => prev ? { ...prev, status: 'generating', errorMsg: undefined } : prev);
    showToast(\`Melanjutkan pembuatan "\${task.title}"...\`, "info");
    
    // Simulate progress
    let currentProgress = task.progress;
    const progressInterval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 8) + 3;
      if (currentProgress > 95) currentProgress = 95;
      setActiveGenTask((prev) => {
        if (!prev || prev.id !== task.id) return prev;
        return { ...prev, progress: currentProgress };
      });
    }, 1200);

    try {
      const skdVariant = task.title.includes('Spesial TWK') ? 'TWK' : task.title.includes('Spesial TIU') ? 'TIU' : task.title.includes('Spesial TKP') ? 'TKP' : 'FULL';
      const skdStream = task.skdStream || 'CPNS';
      
      const res = await Gemini.generateSkdSimulation(skdStream, skdVariant as any, task.savedState, (progressVal, msg) => {
          setActiveGenTask((prev) => {
            if (!prev || prev.id !== task.id) return prev;
            return { ...prev, progress: progressVal };
          });
      });
      
      if (!res.completed) {
        clearInterval(progressInterval);
        setActiveGenTask((prev) => {
          if (!prev || prev.id !== task.id) return prev;
          return { ...prev, status: "paused", savedState: res.state, errorMsg: res.errorMsg };
        });
        showToast("Kuota AI Terlimit lagi. Silakan coba beberapa saat kemudian.", "error");
        return;
      }

      let newQuestions = res.questions || [];
      clearInterval(progressInterval);

      // Save new package
      const newPackage: StaticTestPackage = {
          id: task.id + '-resumed',
          title: task.title,
          category: task.category,
          skdStream: task.skdStream,
          tpaStream: task.tpaStream,
          tkaLevel: task.tkaLevel,
          questions: newQuestions,
          durationMinutes: skdVariant === 'FULL' ? 100 : skdVariant === 'TWK' ? 30 : skdVariant === 'TIU' ? 35 : 35,
          isAiGenerated: true,
          version: "v8-resumed",
          createdAt: new Date().toISOString(),
      };
      
      await FirebaseService.saveTestPackage(newPackage);
      setAvailablePackages((prev) => [newPackage, ...prev]);
      SoundManager.play("success");
      setActiveGenTask((prev) => {
          if (!prev || prev.id !== task.id) return prev;
          return { ...prev, status: "completed", progress: 100 };
      });
      showToast(\`AI Selesai! Paket "\${task.title}" siap dikerjakan.\`, "success");
    } catch (err) {
        clearInterval(progressInterval);
        console.error("Error resuming background generation task:", err);
        setActiveGenTask((prev) => {
          if (!prev || prev.id !== task.id) return prev;
          return {
            ...prev,
            status: "failed",
            errorMsg: "Gagal melanjutkan pembuatan paket soal",
          };
        });
        showToast(\`AI gagal melanjutkan "\${task.title}". Coba lagi nanti.\`, "error");
    }
  };
`;

code = code.replace("  const handleDeletePackage = async (id: string) => {", resumeFunc + "\n  const handleDeletePackage = async (id: string) => {");

code = code.replace(/<GenerationProgressBox\s*task=\{activeGenTask\}\s*onCancel=\{/s, `<GenerationProgressBox
            task={activeGenTask}
            onResume={resumeGenerationTask}
            onCancel={`);

fs.writeFileSync('App.tsx', code);
