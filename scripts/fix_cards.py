import re

with open('components/TOSelectionScreen.tsx', 'r') as f:
    content = f.read()

# Update the card container styling for a larger size
content = content.replace(
    'min-h-[160px] sm:min-h-[220px]',
    'min-h-[180px] sm:min-h-[260px]'
)

# Update the badges
old_badges = """                                                {/* Version Badges */}
                                                {pkg.version === 'v1' && <span className="px-1 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[7px] font-black uppercase">v1</span>}
                                                {pkg.version === 'v2' && <span className="px-1 py-0.5 bg-blue-100 text-blue-600 rounded-md text-[7px] font-black uppercase">v2</span>}
                                                {pkg.version === 'v3' && <span className="px-1 py-0.5 bg-amber-100 text-amber-600 rounded-md text-[7px] font-black uppercase">v3</span>}
                                                {pkg.version === 'v4' && <span className="px-1 py-0.5 bg-cyan-100 text-cyan-600 rounded-md text-[7px] font-black uppercase">v4</span>}
                                                {pkg.version === 'v5' && <span className="px-1 py-0.5 bg-emerald-100 text-emerald-600 rounded-md text-[7px] font-black uppercase">v5</span>}
                                                {pkg.version === 'v6' && <span className="px-1 py-0.5 bg-indigo-600 text-white rounded-md text-[7px] font-black uppercase shadow-sm shadow-indigo-200">v6</span>}
                                                {pkg.version === 'v7' && <span className="px-1.5 py-0.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-md text-[7px] font-black uppercase shadow-md shadow-orange-500/20 flex items-center gap-0.5"><Flame size={8} /> V7</span>}"""

new_badges = """                                                {/* Version Badges */}
                                                {pkg.version === 'v1' && <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded-md text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"><Zap size={9} /> V1</span>}
                                                {pkg.version === 'v2' && <span className="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-700/50 text-blue-600 dark:text-blue-400 rounded-md text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"><Box size={9} /> V2</span>}
                                                {pkg.version === 'v3' && <span className="px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-700/50 text-amber-600 dark:text-amber-400 rounded-md text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"><Hexagon size={9} /> V3</span>}
                                                {pkg.version === 'v4' && <span className="px-1.5 py-0.5 bg-cyan-50 dark:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-700/50 text-cyan-600 dark:text-cyan-400 rounded-md text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"><Cpu size={9} /> V4</span>}
                                                {pkg.version === 'v5' && <span className="px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-400 rounded-md text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"><Activity size={9} /> V5</span>}
                                                {pkg.version === 'v6' && <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-700/50 text-indigo-600 dark:text-indigo-400 rounded-md text-[8px] font-black uppercase flex items-center gap-1 shadow-sm"><Layers size={9} /> V6</span>}
                                                {pkg.version === 'v7' && <span className="px-2 py-0.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-md text-[9px] font-black uppercase shadow-md shadow-orange-500/20 flex items-center gap-1"><Flame size={10} className="text-yellow-200" /> V7</span>}"""

content = content.replace(old_badges, new_badges)

with open('components/TOSelectionScreen.tsx', 'w') as f:
    f.write(content)
