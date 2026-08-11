import React from 'react';

interface HeatmapProps {
  history: { date: string }[];
  isDarkMode?: boolean;
}

export const LearningHeatmap: React.FC<HeatmapProps> = ({ history, isDarkMode }) => {
  // Generate last 12 weeks of dates
  const today = new Date();
  const days: { date: string; count: number }[] = [];
  
  // Create a map for counts
  const counts: Record<string, number> = {};
  history.forEach(item => {
    const d = new Date(item.date).toISOString().split('T')[0];
    counts[d] = (counts[d] || 0) + 1;
  });

  // Last 18 weeks (approx 126 days) to fit nicely on mobile/desktop
  for (let i = 125; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    days.push({ date: dateStr, count: counts[dateStr] || 0 });
  }

  // Group into weeks
  const weeks: { date: string; count: number }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  const getColor = (count: number) => {
    if (count === 0) return 'bg-slate-100 dark:bg-slate-800';
    if (count <= 2) return 'bg-indigo-200 dark:bg-indigo-900/50';
    if (count <= 4) return 'bg-indigo-400 dark:bg-indigo-700';
    if (count <= 6) return 'bg-indigo-600 dark:bg-indigo-500';
    return 'bg-indigo-800 dark:bg-indigo-400';
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
          Konsistensi Belajar
        </h3>
        <div className="flex gap-1 items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
          <span>Less</span>
          <div className="w-2 h-2 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
          <div className="w-2 h-2 rounded-sm bg-indigo-200 dark:bg-indigo-900/50"></div>
          <div className="w-2 h-2 rounded-sm bg-indigo-400 dark:bg-indigo-700"></div>
          <div className="w-2 h-2 rounded-sm bg-indigo-600 dark:bg-indigo-500"></div>
          <div className="w-2 h-2 rounded-sm bg-indigo-800 dark:bg-indigo-400"></div>
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-2 scrollbar-hide">
        <div className="flex gap-1 min-w-max">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day, di) => (
                <div
                  key={di}
                  title={`${day.date}: ${day.count} aktivitas`}
                  className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-colors ${getColor(day.count)}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-3 flex justify-between text-[10px] text-slate-400 font-medium">
        <span>4 Bulan Terakhir</span>
        <div className="flex gap-4">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Aktif</span>
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Libur</span>
        </div>
      </div>
    </div>
  );
};
