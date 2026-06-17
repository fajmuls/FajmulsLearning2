import React, { useState } from 'react';
import { Question } from '../types';
import { CheckCircle, XCircle } from 'lucide-react';
import { SimpleMarkdown } from './QuestionRenderer';

interface QuizProps {
  questions: Question[];
}

export const Quiz: React.FC<QuizProps> = ({ questions }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);

  const currentQ = questions[currentIndex];

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setShowExplanation(false);
    }
  };

  const handleOptionClick = (option: string) => {
    if (selectedOption) return; // Prevent changing answer
    setSelectedOption(option);
    setShowExplanation(true);
    if (option === currentQ.correctAnswer) {
      setScore(s => s + 1);
    }
  };

  const isLast = currentIndex === questions.length - 1;

  if (!currentQ) return <div>Loading questions...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="mb-6 flex justify-between items-center text-sm text-slate-500 font-medium">
        <span>Question {currentIndex + 1} of {questions.length}</span>
        <span>Score: {score}</span>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 mb-6">
        <div className="text-xl font-semibold text-slate-800 dark:text-white mb-6">
          <SimpleMarkdown text={currentQ.content} />
        </div>
        
        <div className="space-y-3">
          {currentQ.options?.map((opt, idx) => {
             const isSelected = selectedOption === opt;
             const isCorrect = opt === currentQ.correctAnswer;
             const showResult = selectedOption !== null;
             
             let btnClass = "w-full text-left p-4 rounded-xl border-2 transition-all ";
             if (!showResult) {
               btnClass += "border-slate-100 dark:border-slate-700 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-slate-700";
             } else {
               if (isCorrect) btnClass += "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300";
               else if (isSelected && !isCorrect) btnClass += "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-800 dark:text-rose-300";
               else btnClass += "border-slate-100 dark:border-slate-700 opacity-50";
             }

             return (
               <div 
                key={idx}
                role="button"
                tabIndex={selectedOption !== null ? -1 : 0}
                onClick={() => {
                    if (selectedOption === null) handleOptionClick(opt);
                }}
                onKeyDown={(e) => {
                    if (selectedOption === null && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleOptionClick(opt);
                    }
                }}
                className={btnClass + (selectedOption === null ? " cursor-pointer" : "")}
               >
                 <div className="flex items-center justify-between pointer-events-auto text-left">
                   <div className="flex-1"><SimpleMarkdown text={opt} /></div>
                   {showResult && isCorrect && <CheckCircle className="text-emerald-500 ml-2" size={20} />}
                   {showResult && isSelected && !isCorrect && <XCircle className="text-rose-500 ml-2" size={20} />}
                 </div>
               </div>
             );
          })}
        </div>

        {showExplanation && (
          <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl border border-indigo-100 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
            <p className="font-bold mb-1">Explanation:</p>
            <SimpleMarkdown text={currentQ.explanation || ''} />
          </div>
        )}
      </div>

      {selectedOption && (
         <button 
           onClick={nextQuestion}
           disabled={isLast}
           className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 disabled:opacity-50 transition"
         >
           {isLast ? "Quiz Finished" : "Next Question"}
         </button>
      )}
    </div>
  );
};