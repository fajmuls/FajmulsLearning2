const fs = require('fs');
let code = fs.readFileSync('components/HistoryView.tsx', 'utf-8');

// 1. Add SubtestWeaknessAnalysis import if not present? It's already there!
// 2. Inject it into ReviewView
const oldHeaderEnd = `                                </h2>
                            </div>`;
const newInjection = `                                </h2>
                            </div>
                            
                            {/* Detailed Sub-test & Topic Analysis */}
                            {item.questions && item.questions.length > 0 && (
                                <SubtestWeaknessAnalysis
                                     item={item}
                                     isDarkMode={document.documentElement.classList.contains('dark')}
                                     defaultExpanded={true}
                                />
                            )}`;
                            
code = code.replace(oldHeaderEnd, newInjection);

fs.writeFileSync('components/HistoryView.tsx', code);
