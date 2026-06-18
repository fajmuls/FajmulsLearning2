import React, { useState } from "react";
import { 
  ArrowLeft, Book, Loader2, MessageSquare, 
  Trash2, Play, History as HistoryIcon, Clock
} from "lucide-react";
import { 
  Question, UserAnswer, InterviewFeedback, FeynmanFeedback,
  SkripsiFeature, FlashcardData, SavedSessionState
} from "../../types";
import * as Gemini from "../../services/geminiService";
import { SimpleMarkdown } from "../common/UIComponents";
import { Flashcard } from "../Flashcard";

export const SkripsiSession: React.FC<{
  result: string;
  feature: SkripsiFeature;
  onBack: () => void;
}> = ({ result, feature, onBack }) => (
  <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center">
    <div className="max-w-3xl w-full">
      <button
        onClick={onBack}
        className="mb-4 text-slate-500 dark:text-slate-400 flex items-center gap-2"
      >
        <ArrowLeft size={18} /> Kembali
      </button>
      <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-6 text-slate-800 dark:text-white flex items-center gap-2">
          <Book size={28} className="text-indigo-600" /> Hasil {feature}
        </h2>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <SimpleMarkdown text={result} />
        </div>
      </div>
    </div>
  </div>
);

export const InterviewSession: React.FC<{
  questions: Question[];
  onComplete: (answers: UserAnswer[]) => void;
}> = ({ questions, onComplete }) => {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserAnswer[]>([]);
  const currentQ = questions[index];
  const handleSubmit = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const fb = await Gemini.evaluateInterviewAnswer(currentQ.content, answer);
      setFeedback(fb);
    } catch (e) {
      alert("Gagal evaluasi.");
    } finally {
      setLoading(false);
    }
  };
  const handleNext = () => {
    const newResult: UserAnswer = {
      questionId: currentQ.id,
      selectedAnswer: answer,
      isCorrect: true,
      scoreEarned: feedback?.score || 0,
      timeTakenSeconds: 0,
      isOverthinking: false,
      isGuessing: false,
      interviewFeedback: feedback || undefined,
    };
    const updatedResults = [...results, newResult];
    setResults(updatedResults);
    setAnswer("");
    setFeedback(null);
    if (index < questions.length - 1) {
      setIndex(index + 1);
    } else {
      onComplete(updatedResults);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <div className="mb-4 text-sm font-bold text-slate-400">
          Pertanyaan {index + 1} dari {questions.length}
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">
          {currentQ.content}
        </h2>
        {!feedback ? (
          <>
            <textarea
              className="w-full p-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl mb-4 h-40 focus:ring-2 focus:ring-indigo-500"
              placeholder="Jawab seolah sedang interview..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !answer}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <MessageSquare size={18} />
              )}{" "}
              Submit Jawaban
            </button>
          </>
        ) : (
          <div className="animate-fade-in-up">
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-slate-700 dark:text-slate-300">
                  Skor: {feedback.score}/100
                </span>
                <span className="text-sm bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded">
                  {feedback.toneAnalysis}
                </span>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                <b>Feedback:</b> {feedback.feedback}
              </p>
              <div className="text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800">
                <b>Saran Jawaban:</b> {feedback.improvedAnswer}
              </div>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold hover:opacity-90"
            >
              Lanjut
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const FlashcardSession: React.FC<{
  flashcards: FlashcardData[];
  onFinish: () => void;
}> = ({ flashcards, onFinish }) => {
  const [index, setIndex] = useState(0);
  const handleNext = (rating: "easy" | "medium" | "hard") => {
    if (index < flashcards.length - 1) setIndex(index + 1);
    else onFinish();
  };
  if (flashcards.length === 0) return <div>No Flashcards</div>;
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl mb-6 flex justify-between items-center">
        <button
          onClick={onFinish}
          className="text-slate-500 hover:text-indigo-600"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="font-bold text-slate-400">
          {index + 1} / {flashcards.length}
        </span>
      </div>
      <Flashcard data={flashcards[index]} onNext={handleNext} />
    </div>
  );
};

export const FeynmanSession: React.FC<{ topic: string; onFinish: () => void }> = ({
  topic,
  onFinish,
}) => {
  const [explanation, setExplanation] = useState("");
  const [feedback, setFeedback] = useState<FeynmanFeedback | null>(null);
  const [loading, setLoading] = useState(false);
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fb = await Gemini.evaluateFeynman(topic, explanation);
      setFeedback(fb);
    } catch (e) {
      alert("Error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          Feynman Technique
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Jelaskan topik <b>"{topic}"</b> seolah-olah Anda sedang mengajari anak
          kecil (5 tahun).
        </p>
        {!feedback ? (
          <>
            <textarea
              className="w-full p-4 border border-slate-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white rounded-xl mb-4 h-48 focus:ring-2 focus:ring-indigo-500"
              placeholder="Mulai jelaskan di sini..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !explanation}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? "Menganalisis..." : "Cek Pemahaman Saya"}
            </button>
          </>
        ) : (
          <div className="animate-fade-in-up">
            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`text-2xl font-bold ${feedback.understandingScore > 70 ? "text-emerald-500" : "text-amber-500"}`}
                >
                  {feedback.understandingScore}/100
                </div>
              </div>
              <div className="space-y-3 text-sm text-slate-700 dark:text-slate-300">
                <p>
                  <b>Kualitas Penyederhanaan:</b>{" "}
                  {feedback.simplificationQuality}
                </p>
                <p>
                  <b>Konsep yang Terlewat:</b>{" "}
                  {feedback.missingConcepts.join(", ") || "Tidak ada"}
                </p>
                <div className="bg-indigo-50 dark:bg-indigo-900/20 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300">
                  <b>Koreksi / Saran:</b> {feedback.correction}
                </div>
              </div>
            </div>
            <button
              onClick={onFinish}
              className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold"
            >
              Selesai Belajar
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const SQ3RSession: React.FC<{ topic: string; onFinish: () => void }> = ({
  topic,
  onFinish,
}) => {
  const steps = ["Survey", "Question", "Read", "Recite", "Review"];
  const [step, setStep] = useState(0);
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 text-center">
        <div className="flex justify-center mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex items-center ${i < steps.length - 1 ? "w-full" : ""}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${i <= step ? "bg-indigo-600 text-white" : "bg-slate-100 dark:bg-slate-700 text-slate-400"}`}
              >
                {s[0]}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-1 flex-1 ${i < step ? "bg-indigo-600" : "bg-slate-100 dark:bg-slate-700"}`}
                ></div>
              )}
            </div>
          ))}
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
          {steps[step]} Phase
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 font-bold">
          {topic}
        </p>
        <div className="h-40 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl mb-6 text-slate-400 text-sm">
          Fokus pada instruksi {steps[step]}...
        </div>
        <button
          onClick={() => {
            if (step < steps.length - 1) setStep(step + 1);
            else onFinish();
          }}
          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
        >
          {step < steps.length - 1 ? "Lanjut ke " + steps[step + 1] : "Selesai"}
        </button>
      </div>
    </div>
  );
};

export const ResumeModal: React.FC<{
  session: SavedSessionState;
  onResume: () => void;
  onDiscard: () => void;
}> = ({ session, onResume, onDiscard }) => {
  const progress = Math.round(
    (Object.keys(session.answerMap).length / session.questions.length) * 100,
  );
  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      {" "}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl max-w-sm w-full border border-slate-200 dark:border-slate-700 text-center">
        {" "}
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 animate-pulse">
          {" "}
          <HistoryIcon size={24} className="sm:w-8 sm:h-8" />{" "}
        </div>{" "}
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-1.5">
          Tes Belum Selesai
        </h2>{" "}
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 sm:mb-6">
          {" "}
          Ditemukan sesi{" "}
          <b className="text-indigo-600 dark:text-indigo-400">
            {session.packageTitle || session.category}
          </b>{" "}
          yang belum diselesaikan. Ingin melanjutkan?{" "}
        </p>{" "}
        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 sm:p-4 rounded-xl mb-4 sm:mb-6 text-left">
          {" "}
          <div className="flex justify-between text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
            {" "}
            <span>Progress</span> <span>{progress}%</span>{" "}
          </div>{" "}
          <div className="w-full bg-slate-200 dark:bg-slate-600 h-1.5 sm:h-2 rounded-full overflow-hidden">
            {" "}
            <div
              className="h-full bg-indigo-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>{" "}
          </div>{" "}
        </div>{" "}
        <div className="flex flex-col gap-2.5">
          {" "}
          <button
            onClick={onResume}
            className="w-full py-2.5 sm:py-3 bg-indigo-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-indigo-700 transition flex items-center justify-center gap-1.5"
          >
            {" "}
            <Play size={16} /> Lanjutkan Tes{" "}
          </button>{" "}
          <button
            onClick={onDiscard}
            className="w-full py-2.5 sm:py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-1.5"
          >
            {" "}
            <Trash2 size={16} /> Hapus & Menu Utama{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
};

export const ResumeSessionList: React.FC<{
  sessions: SavedSessionState[];
  onBack: () => void;
  onResume: (s: SavedSessionState) => void;
  onDelete: (id: string) => void;
  loading: boolean;
}> = ({ sessions, onBack, onResume, onDelete, loading }) => {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-amber-200 dark:border-amber-900/50 mb-6 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-500">
          <Clock size={16} /> Terakhir Dimainkan & Belum Selesai
        </h3>
        <button onClick={onBack} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300">
          Kembali
        </button>
      </div>
      {loading ? (
         <div className="flex items-center justify-center py-4"><Loader2 className="animate-spin text-amber-500" /></div>
      ) : (
      <div className="space-y-2">
        {sessions.map((s) => {
          const prog = Math.round(
            (Object.keys(s.answerMap || {}).length / (s.questions?.length || 1)) * 100,
          );
          return (
            <div
              key={s.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50 gap-3"
            >
              <div>
                <p className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  {s.packageTitle || s.category}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 bg-slate-200 dark:bg-slate-600 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full rounded-full"
                      style={{ width: `${prog}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                    {prog}% Selesai
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onResume(s)}
                  className="flex-1 sm:flex-none px-4 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-900/30 dark:hover:bg-amber-900/50 dark:text-amber-400 text-xs font-bold rounded-lg transition"
                >
                  Lanjut
                </button>
                <button
                  onClick={() => onDelete(s.id!)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
