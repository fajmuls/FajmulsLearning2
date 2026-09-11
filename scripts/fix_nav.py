import re

with open('components/SessionEngine.tsx', 'r') as f:
    content = f.read()

# 1. Remove utilities from bottom nav
bottom_utilities_regex = r'\{\/\* Desktop\/Mobile Utilities \*\/\}[\s\S]*?<\/button>\s*'

content = re.sub(bottom_utilities_regex, '', content)

# 2. Modify Right Sidebar Nav (Navigasi)
sidebar_nav_regex = r'<div className="grid grid-cols-4 gap-2">[\s\S]*?<\/button>\s*<\/div>'

new_sidebar_nav = """<div className="flex flex-wrap items-center gap-2">
                        {/* Tandai */}
                        <button onClick={() => setShowFlagModal(true)} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-amber-400 hover:text-amber-500 transition shadow-sm group" title="Tandai Soal">
                            <Flag size={16} className="text-slate-400 group-hover:text-amber-500 transition-colors" />
                        </button>
                        
                        {/* Clue */}
                        {currentQ?.hint && !hintUsedMap[currentQ.id] && (
                            <button onClick={() => setShowHintConfirm(true)} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg hover:border-amber-400 text-amber-600 dark:text-amber-400 transition shadow-sm group" title="Gunakan Clue">
                                <Lightbulb size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                        
                        {/* Eliminasi */}
                        {!eliminatedOptionsMap[currentQ.id] && currentQ.options && currentQ.options.length > 2 && (
                            <button onClick={() => setShowEliminateConfirm(true)} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800 rounded-lg hover:border-rose-400 text-rose-600 dark:text-rose-400 transition shadow-sm group" title="Eliminasi Opsi">
                                <Eraser size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                        )}

                        {/* Hapus Jawaban */}
                        {currentAns?.selectedAnswer && (
                            <button onClick={handleClearAnswer} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-slate-400 text-slate-500 dark:text-slate-400 transition shadow-sm group" title="Hapus Jawaban">
                                <XCircle size={16} className="group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                        
                        {/* Baca Soal */}
                        <button onClick={() => {
                            if ('speechSynthesis' in window) {
                                window.speechSynthesis.cancel();
                                const cleanText = (currentQ?.content || '').replace(/:::MATRIX:::[\\s\\S]*?:::/g, '').replace(/<svg[\\s\\S]*?<\\/svg>/g, '').replace(/(\\*\\*|__|\\*|_|`)/g, '').replace(/\\$/g, '').replace(/\\{|\\}/g, ' ');
                                const utterance = new SpeechSynthesisUtterance(cleanText);
                                utterance.lang = 'id-ID';
                                window.speechSynthesis.speak(utterance);
                            }
                        }} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:border-indigo-400 text-indigo-600 dark:text-indigo-400 transition shadow-sm group" title="Bacakan Soal">
                            <Volume2 size={16} className="group-hover:scale-110 transition-transform" />
                        </button>
                        
                        {/* Suara */}
                        {isSupported && (
                            <button onClick={toggleVoiceControl} className={`flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-700 border rounded-lg hover:border-indigo-400 hover:text-indigo-500 transition shadow-sm group ${voiceEnabled ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600' : 'border-slate-200 dark:border-slate-600'}`} title="Perintah Suara">
                                {voiceEnabled ? <Mic size={16} className="animate-pulse" /> : <MicOff size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />}
                            </button>
                        )}
                        
                        {/* Setelan */}
                        <button onClick={() => onOpenSettings?.()} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-indigo-400 hover:text-indigo-500 transition shadow-sm group" title="Pengaturan Utama">
                            <Settings size={16} className="text-slate-400 group-hover:text-indigo-500 transition-colors" />
                        </button>

                        {/* Admin */}
                        <button onClick={() => setShowAdminModal(true)} className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:border-rose-400 hover:text-rose-500 transition shadow-sm group" title="Admin Menu">
                            <Lock size={16} className="text-slate-400 group-hover:text-rose-500 transition-colors"/>
                        </button>
                    </div>"""

content = re.sub(sidebar_nav_regex, lambda x: new_sidebar_nav, content)

with open('components/SessionEngine.tsx', 'w') as f:
    f.write(content)

