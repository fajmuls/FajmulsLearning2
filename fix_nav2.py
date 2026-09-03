import re

with open('components/SessionEngine.tsx', 'r') as f:
    content = f.read()

# 1. Clean the bottom nav area from line 2239 up to the save to bank button
# Look for Ragu-ragu button
# The syntax error was caused because `{/* Desktop/Mobile Utilities */}` was removed, but maybe `)}` was left behind.
# Let's just find the div containing Ragu-ragu and Bank Soal, and replace it.

bottom_nav_regex = r'<div className="flex gap-1 sm:gap-2 items-center justify-center flex-1 min-w-0">.*?{isAdminAuthenticated && currentQ && \('

new_bottom_nav = """<div className="flex gap-1 sm:gap-2 items-center justify-center flex-1 min-w-0">
                            {initialState && (
                                <div className="hidden lg:flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">
                                    <Save size={10}/> Saved
                                </div>
                            )}
                            <button onClick={toggleDoubtful} className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-3 py-1 sm:py-2 rounded-lg font-bold text-[10px] sm:text-xs md:text-sm border transition shrink-0 ${currentAns?.isDoubtful ? 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'}`}>
                                <input type="checkbox" checked={currentAns?.isDoubtful || false} readOnly className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 accent-amber-500 cursor-pointer shrink-0"/><span className="hidden sm:inline ml-1 font-bold">Ragu-ragu</span><span className="inline sm:hidden font-medium ml-1">Ragu</span>
                            </button>

                            {isAdminAuthenticated && currentQ && ("""

content = re.sub(bottom_nav_regex, new_bottom_nav, content, flags=re.DOTALL)


with open('components/SessionEngine.tsx', 'w') as f:
    f.write(content)

