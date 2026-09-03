import re

with open('components/SessionEngine.tsx', 'r') as f:
    content = f.read()

# 1. Remove KERJAKAN DENGAN JUJUR
content = re.sub(r'\{/\* Academic Hub Integrity Label \*/\}.*?KERJAKAN DENGAN JUJUR DAN TELITI • © ACADEMIC HUB 2024\s*</div>', '', content, flags=re.DOTALL)

# 2. Modify Mobile Header
mobile_header_regex = r'\{/\* Mobile Header \*/\}.*?<div className="md:hidden bg-white dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-20">\s*<div className="font-bold text-slate-700 dark:text-white text-sm">No. \{currentIndex \+ 1\}</div>\s*<div className="flex items-center gap-1\.5">.*?</button>\s*</div>\s*</div>'

new_mobile_header = """{/* Mobile Header */}
                <div className="md:hidden bg-white dark:bg-slate-800 p-3 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center shadow-sm z-20">
                    <div className="font-bold text-slate-700 dark:text-white text-sm">No. {currentIndex + 1}</div>
                    <div className="flex items-center gap-2">
                        {mode === StudyMode.SIMULATION && (
                            <div className="bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md text-xs font-mono font-bold dark:text-white shadow-inner flex items-center gap-1.5">
                                ⏱️ {formatTime(timeLeft)}
                            </div>
                        )}
                        <button onClick={() => setIsMobileGridOpen(!isMobileGridOpen)} className="p-1.5 bg-indigo-50 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-400 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-sm" title="Grid Soal"><Grid size={18} /></button>
                        <button onClick={() => onOpenSettings?.()} className="p-1.5 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-lg transition-transform hover:scale-105 active:scale-95 shadow-sm border border-slate-200 dark:border-slate-700" title="Pengaturan"><Settings size={18} /></button>
                    </div>
                </div>"""

content = re.sub(mobile_header_regex, lambda x: new_mobile_header, content, flags=re.DOTALL)

# 3. Modify Desktop Header inside Question block
desktop_header_regex = r'\{/\* Question Type & Weight \*/\}.*?<div className="text-right shrink-0">\s*<span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-750 px-2 py-0\.5 rounded">No\. \{currentIndex \+ 1\}</span>\s*</div>\s*</div>'

new_desktop_header = """{/* Question Type & Weight */}
                                        <div className="flex justify-between items-start mb-3 sm:mb-4 border-b border-slate-100 dark:border-slate-700/50 pb-2 sm:pb-3">
                                            <div className="flex flex-col gap-1 sm:gap-1.5">
                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                                                    <span className="bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                                                        {currentQ.metadata?.subtest || 'UMUM'}
                                                    </span>
                                                    {currentQ.metadata?.topic && (
                                                        <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1.5 sm:px-2 py-0.5 rounded text-[9px] sm:text-[10px] font-bold border border-indigo-100 dark:border-indigo-900/30">
                                                            {currentQ.metadata.topic}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-750 px-3 py-1 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">No. {currentIndex + 1}</span>
                                            </div>
                                        </div>"""

content = re.sub(desktop_header_regex, lambda x: new_desktop_header, content, flags=re.DOTALL)

# 4. Remove TTS Button from content area
tts_regex = r'\{currentQ\.content && \(\s*<TTSButton.*?\/>\s*\)\}'
content = re.sub(tts_regex, '', content, flags=re.DOTALL)

# 5. Move Clue, Eliminasi, Bacakan, to Bottom Nav
bottom_nav_regex = r'<div className="p-3 sm:p-5 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/80 z-10">\s*<div className="flex gap-2">.*?<ChevronRight size=\{12\} className="sm:w-4 sm:h-4"/>\s*</button>\s*</div>\s*</div>'

new_bottom_nav = """<div className="p-3 sm:p-5 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 bg-slate-50 dark:bg-slate-800/80 z-10">
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <button onClick={() => { SoundManager.play('click'); if (currentIndex > 0) setCurrentIndex(prev => prev - 1); }} disabled={currentIndex === 0} className="flex items-center gap-0.5 sm:gap-1 px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs md:text-sm border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-sm shrink-0">
                            <ChevronLeft size={14} className="sm:w-4 sm:h-4"/>
                            <span className="hidden sm:inline">Sebelumnya</span>
                        </button>
                        <button onClick={toggleDoubtful} className={`flex items-center gap-1.5 px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs md:text-sm border transition shrink-0 shadow-sm ${currentAns?.isDoubtful ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'}`}>
                            <Flag size={14} className={currentAns?.isDoubtful ? "fill-amber-500 text-amber-500" : "text-slate-400"} />
                            <span className="hidden sm:inline">Ragu-ragu</span>
                            <span className="inline sm:hidden">Ragu</span>
                        </button>
                        
                        {/* UTILITIES MOVED HERE */}
                        <div className="flex items-center gap-1 ml-auto sm:ml-2 border-l border-slate-300 dark:border-slate-600 pl-2 sm:pl-3">
                            {currentQ?.hint && !hintUsedMap[currentQ.id] && (
                                <button onClick={() => setShowHintConfirm(true)} className="p-1.5 sm:p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-200 dark:border-amber-800 transition shadow-sm" title="Gunakan Clue">
                                    <Lightbulb size={16} className="sm:w-5 sm:h-5" />
                                </button>
                            )}
                            {!eliminatedOptionsMap[currentQ.id] && currentQ.options && currentQ.options.length > 2 && (
                                <button onClick={() => setShowEliminateConfirm(true)} className="p-1.5 sm:p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800 transition shadow-sm" title="Eliminasi 1 Opsi Salah">
                                    <Eraser size={16} className="sm:w-5 sm:h-5" />
                                </button>
                            )}
                            {currentAns?.selectedAnswer && (
                                <button onClick={handleClearAnswer} className="p-1.5 sm:p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-lg border border-slate-200 dark:border-slate-600 transition shadow-sm" title="Hapus Jawaban">
                                    <XCircle size={16} className="sm:w-5 sm:h-5" />
                                </button>
                            )}
                            <button onClick={() => {
                                if ('speechSynthesis' in window) {
                                    window.speechSynthesis.cancel();
                                    const cleanText = (currentQ.content || '').replace(/:::MATRIX:::[\\s\\S]*?:::/g, '').replace(/<svg[\\s\\S]*?<\\/svg>/g, '').replace(/(\\*\\*|__|\\*|_|`)/g, '').replace(/\\$/g, '').replace(/\\{|\\}/g, ' ');
                                    const utterance = new SpeechSynthesisUtterance(cleanText);
                                    utterance.lang = 'id-ID';
                                    window.speechSynthesis.speak(utterance);
                                }
                            }} className="p-1.5 sm:p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg border border-indigo-200 dark:border-indigo-800 transition shadow-sm" title="Bacakan Soal">
                                <Volume2 size={16} className="sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => { 
                            SoundManager.play('click');
                            if (currentIndex < activeQuestions.length - 1) {
                                setCurrentIndex(prev => prev + 1);
                            } else {
                                handleRequestFinish();
                            }
                        }} 
                        className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-black bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg text-xs sm:text-sm transition-all active:scale-95"
                    >
                        <span>
                            {currentIndex === activeQuestions.length - 1 ? (isUtbkSimulation && utbkSubtestIndex < UTBK_EXAM_CONFIG.length - 1 ? 'Lanjut Subtes' : 'Selesai Tes') : 'Berikutnya'}
                        </span> 
                        <ChevronRight size={16}/>
                    </button>
                </div>"""

content = re.sub(bottom_nav_regex, lambda x: new_bottom_nav, content, flags=re.DOTALL)

# 6. Sidebar/Right navigation changes
sidebar_top_regex = r'<div className="p-3\.5 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-2 bg-slate-50 dark:bg-slate-800">.*?<ArrowLeft size=\{12\}/> Keluar \(Lokal\)\s*</button>\s*</div>'

new_sidebar_top = """<div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-700 flex flex-col gap-4 bg-slate-50 dark:bg-slate-800"> 
                    <div className="flex justify-between items-center">
                        <h3 className="font-black text-sm text-slate-800 dark:text-white">Navigasi</h3>
                        <button onClick={() => setIsMobileGridOpen(false)} className="md:hidden p-1 bg-slate-200 dark:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300"><XCircle size={16}/></button> 
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => setShowFlagModal(true)} className="flex flex-col items-center justify-center gap-1 p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-amber-400 hover:text-amber-500 transition shadow-sm group" title="Tandai Soal">
                            <Flag size={18} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Tandai</span>
                        </button>
                        {isSupported && (
                            <button onClick={toggleVoiceControl} className={`flex flex-col items-center justify-center gap-1 p-2 bg-white dark:bg-slate-700 border rounded-xl hover:border-indigo-400 hover:text-indigo-500 transition shadow-sm group ${voiceEnabled ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30' : 'border-slate-200 dark:border-slate-600'}`} title="Perintah Suara">
                                {voiceEnabled ? <Mic size={18} className="text-indigo-600 animate-pulse" /> : <MicOff size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />}
                                <span className={`text-[9px] font-bold ${voiceEnabled ? 'text-indigo-600' : 'text-slate-500 dark:text-slate-400'}`}>Suara</span>
                            </button>
                        )}
                        <button onClick={() => onOpenSettings?.()} className="flex flex-col items-center justify-center gap-1 p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-indigo-400 hover:text-indigo-500 transition shadow-sm group" title="Pengaturan Utama">
                            <Settings size={18} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Setelan</span>
                        </button>
                        <button onClick={() => setShowAdminModal(true)} className="flex flex-col items-center justify-center gap-1 p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl hover:border-rose-400 hover:text-rose-500 transition shadow-sm group" title="Admin Menu">
                            <Lock size={18} className="text-slate-400 group-hover:text-rose-500 transition-colors"/>
                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">Admin</span>
                        </button>
                    </div>

                    <div className="flex gap-2">
                        {!userId?.startsWith('guest-') && (
                            <button 
                                onClick={handleSaveToCloud}
                                disabled={isSavingToCloud}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 text-white rounded-xl font-bold text-[10px] md:text-xs hover:bg-emerald-700 disabled:opacity-50 transition shadow-sm"
                            >
                                {isSavingToCloud ? <Loader2 size={14} className="animate-spin"/> : <CloudUpload size={14}/>}
                                Cloud
                            </button>
                        )}
                        <button onClick={handleEarlyExit} className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl font-bold text-[10px] md:text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 transition shadow-sm">
                            <ArrowLeft size={14}/> Keluar
                        </button>
                    </div>
                </div>"""

content = re.sub(sidebar_top_regex, lambda x: new_sidebar_top, content, flags=re.DOTALL)

# Hide Timer Selection on PC
content = content.replace(
    '<div className="flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-[9px] font-extrabold gap-0.5">',
    '<div className="md:hidden flex bg-slate-200 dark:bg-slate-700 p-0.5 rounded-lg text-[9px] font-extrabold gap-0.5">'
)

content = content.replace('{focusTimerType === \'DEEP_WORK\' && (', '{focusTimerType === \'DEEP_WORK\' && window.innerWidth < 768 && (')
content = content.replace('{focusTimerType === \'POMODORO\' && (', '{focusTimerType === \'POMODORO\' && window.innerWidth < 768 && (')

# Let's fix the missing import of ChevronLeft
if 'ChevronLeft' not in content:
    content = content.replace('ChevronRight,', 'ChevronRight, ChevronLeft,')

with open('components/SessionEngine.tsx', 'w') as f:
    f.write(content)
