"use client";

import { useState, useMemo } from "react";
import questionsData from "@/data/questions.json";

interface ChoiceMap {
  [key: string]: string | null | undefined;
}

interface Question {
  question: string;
  choices: ChoiceMap;
  answer: string;
  explanation?: string;
}

interface ReadingSection {
  title: string;
  passage: string;
  questions: Question[];
}

export default function Home() {
  // App Phase: 'welcome' | 'test' | 'result'
  const [phase, setPhase] = useState<"welcome" | "test" | "result">("welcome");
  const [studentName, setStudentName] = useState("");

  // Test Flow: 'reading' -> 'grammar'
  const [stage, setStage] = useState<"reading" | "grammar">("reading");

  // Reading State
  const [readingIndex, setReadingIndex] = useState(0);
  const [readingQuestionBatch, setReadingQuestionBatch] = useState(0); // 2 questions per batch
  const [readingAnswers, setReadingAnswers] = useState<{ [key: string]: string }>({});

  // Grammar State
  const [grammarBatch, setGrammarBatch] = useState(0); // 2 questions per batch
  const [grammarAnswers, setGrammarAnswers] = useState<{ [key: number]: string }>({});

  const currentReading: ReadingSection = questionsData.reading[readingIndex] || {
    title: "Reading Passage",
    passage: "",
    questions: [],
  };

  const totalReadingBatches = Math.ceil((currentReading.questions?.length || 0) / 2);
  const totalGrammarBatches = Math.ceil((questionsData.grammar?.length || 0) / 2);

  // Current batch questions (max 2)
  const currentBatchQuestions = useMemo(() => {
    if (stage === "reading") {
      const start = readingQuestionBatch * 2;
      return currentReading.questions.slice(start, start + 2);
    } else {
      const start = grammarBatch * 2;
      return questionsData.grammar.slice(start, start + 2);
    }
  }, [stage, readingQuestionBatch, currentReading, grammarBatch]);

  const handleStartTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) return;
    setPhase("test");
    setStage("reading");
  };

  const handleSelectAnswer = (qKey: string | number, choiceKey: string) => {
    if (stage === "reading") {
      setReadingAnswers((prev) => ({ ...prev, [qKey]: choiceKey }));
    } else {
      setGrammarAnswers((prev) => ({ ...prev, [Number(qKey)]: choiceKey }));
    }
  };

  const handleNext = () => {
    if (stage === "reading") {
      if (readingQuestionBatch + 1 < totalReadingBatches) {
        setReadingQuestionBatch((prev) => prev + 1);
      } else if (readingIndex + 1 < questionsData.reading.length) {
        setReadingIndex((prev) => prev + 1);
        setReadingQuestionBatch(0);
      } else {
        // Move to Grammar automatically after Reading finishes
        setStage("grammar");
        setGrammarBatch(0);
      }
    } else {
      if (grammarBatch + 1 < totalGrammarBatches) {
        setGrammarBatch((prev) => prev + 1);
      } else {
        // Finish test and show final score
        setPhase("result");
      }
    }
  };

  const handleBack = () => {
    if (stage === "reading") {
      if (readingQuestionBatch > 0) {
        setReadingQuestionBatch((prev) => prev - 1);
      } else if (readingIndex > 0) {
        setReadingIndex((prev) => prev - 1);
        const prevLen = questionsData.reading[readingIndex - 1].questions.length;
        setReadingQuestionBatch(Math.max(0, Math.ceil(prevLen / 2) - 1));
      }
    } else {
      if (grammarBatch > 0) {
        setGrammarBatch((prev) => prev - 1);
      } else {
        // Go back to the last reading batch
        setStage("reading");
        const lastRIndex = questionsData.reading.length - 1;
        setReadingIndex(lastRIndex);
        const lastRLen = questionsData.reading[lastRIndex].questions.length;
        setReadingQuestionBatch(Math.max(0, Math.ceil(lastRLen / 2) - 1));
      }
    }
  };

  // Score Calculation
  const scoreResults = useMemo(() => {
    let rCorrect = 0;
    let rTotal = 0;
    questionsData.reading.forEach((sec, sIdx) => {
      sec.questions.forEach((q, qIdx) => {
        rTotal++;
        const k = `${sIdx}-${qIdx}`;
        if (readingAnswers[k]?.toLowerCase() === q.answer?.toLowerCase()) {
          rCorrect++;
        }
      });
    });

    let gCorrect = 0;
    const gTotal = questionsData.grammar.length;
    questionsData.grammar.forEach((q, gIdx) => {
      if (grammarAnswers[gIdx]?.toLowerCase() === q.answer?.toLowerCase()) {
        gCorrect++;
      }
    });

    const overallTotal = rTotal + gTotal;
    const overallCorrect = rCorrect + gCorrect;
    const overallPct = overallTotal ? Math.round((overallCorrect / overallTotal) * 100) : 0;

    return {
      rCorrect,
      rTotal,
      rPct: rTotal ? Math.round((rCorrect / rTotal) * 100) : 0,
      gCorrect,
      gTotal,
      gPct: gTotal ? Math.round((gCorrect / gTotal) * 100) : 0,
      overallCorrect,
      overallTotal,
      overallPct,
    };
  }, [readingAnswers, grammarAnswers]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#F8FAFC]">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              E
            </span>
            <span className="font-bold text-slate-800 text-base sm:text-lg tracking-tight">
              InggrisStudent
            </span>
          </div>

          {phase === "test" && (
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  stage === "reading"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}
              >
                Stage: {stage === "reading" ? "1. Reading" : "2. Grammar"}
              </span>
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">
                {studentName}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 w-full flex-1">
        {/* PHASE 1: WELCOME FORM */}
        {phase === "welcome" && (
          <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">
              📝
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">EPRT Test Practice</h1>
            <p className="text-sm text-slate-600 mb-6">
              Enter your full name to start the test. You will complete Reading Comprehension first, followed by Structure & Grammar.
            </p>

            <form onSubmit={handleStartTest} className="space-y-4">
              <div className="text-left">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Student Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Enter your name..."
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
              >
                Start Practice Test →
              </button>
            </form>
          </div>
        )}

        {/* PHASE 2: ACTIVE TEST */}
        {phase === "test" && (
          <div className="space-y-6">
            {stage === "reading" ? (
              <>
                {/* Reading Passage (Fixed Top Card) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-md">
                      Passage {readingIndex + 1} of {questionsData.reading.length}
                    </span>
                    <span className="text-xs text-slate-500">
                      {currentReading.title}
                    </span>
                  </div>
                  <div className="text-slate-800 text-sm sm:text-base leading-relaxed font-serif max-h-60 sm:max-h-72 overflow-y-auto pr-2 whitespace-pre-line">
                    {currentReading.passage}
                  </div>
                </div>

                {/* Questions (Max 2) */}
                <div className="space-y-4">
                  {currentBatchQuestions.map((q, idx) => {
                    const globalQIdx = readingQuestionBatch * 2 + idx;
                    const answerKey = `${readingIndex}-${globalQIdx}`;
                    const selected = readingAnswers[answerKey];

                    return (
                      <div
                        key={globalQIdx}
                        className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm"
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {globalQIdx + 1}
                          </span>
                          <p className="font-medium text-slate-900 text-sm sm:text-base leading-snug">
                            {q.question}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {Object.entries(q.choices).map(([choiceKey, choiceVal]) => {
                            if (!choiceVal) return null;
                            const isSelected = selected?.toLowerCase() === choiceKey.toLowerCase();
                            return (
                              <button
                                key={choiceKey}
                                onClick={() => handleSelectAnswer(answerKey, choiceKey)}
                                className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                                  isSelected
                                    ? "border-blue-600 bg-blue-50/50 text-blue-900 font-medium shadow-xs"
                                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                                }`}
                              >
                                <span
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                                    isSelected
                                      ? "bg-blue-600 text-white"
                                      : "bg-slate-100 text-slate-500"
                                  }`}
                                >
                                  {choiceKey}
                                </span>
                                <span className="flex-1 leading-normal">{choiceVal}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* Grammar Questions (Max 2) */
              <div className="space-y-4">
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-medium flex items-center justify-between">
                  <span>Part 2: Structure & Grammar</span>
                  <span>
                    Questions {grammarBatch * 2 + 1} -{" "}
                    {Math.min(grammarBatch * 2 + 2, questionsData.grammar.length)} of{" "}
                    {questionsData.grammar.length}
                  </span>
                </div>

                {currentBatchQuestions.map((q, idx) => {
                  const globalQIdx = grammarBatch * 2 + idx;
                  const selected = grammarAnswers[globalQIdx];

                  return (
                    <div
                      key={globalQIdx}
                      className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm"
                    >
                      <div className="flex items-start gap-3 mb-4">
                        <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                          {globalQIdx + 1}
                        </span>
                        <p className="font-medium text-slate-900 text-sm sm:text-base leading-snug">
                          {q.question}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {Object.entries(q.choices).map(([choiceKey, choiceVal]) => {
                          if (!choiceVal) return null;
                          const isSelected = selected?.toLowerCase() === choiceKey.toLowerCase();
                          return (
                            <button
                              key={choiceKey}
                              onClick={() => handleSelectAnswer(globalQIdx, choiceKey)}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left text-sm transition-all ${
                                isSelected
                                  ? "border-emerald-600 bg-emerald-50/50 text-emerald-900 font-medium shadow-xs"
                                  : "border-slate-200 hover:border-slate-300 bg-white text-slate-700"
                              }`}
                            >
                              <span
                                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold uppercase shrink-0 ${
                                  isSelected
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                {choiceKey}
                              </span>
                              <span className="flex-1 leading-normal">{choiceVal}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={handleBack}
                disabled={stage === "reading" && readingIndex === 0 && readingQuestionBatch === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                ← Back
              </button>

              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-colors"
              >
                {stage === "reading" &&
                readingIndex === questionsData.reading.length - 1 &&
                readingQuestionBatch + 1 >= totalReadingBatches
                  ? "Proceed to Grammar →"
                  : stage === "grammar" && grammarBatch + 1 >= totalGrammarBatches
                  ? "Submit Test & View Results"
                  : "Next →"}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: FINAL SCOREBOARD */}
        {phase === "result" && (
          <div className="max-w-xl mx-auto my-8 p-6 sm:p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              🎓
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Official Test Result</h2>
            <p className="text-sm font-medium text-slate-500 mb-6">Student: {studentName}</p>

            {/* Overall Score Badge */}
            <div className="bg-slate-900 text-white rounded-2xl p-6 mb-6 shadow-md">
              <p className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                Overall Score
              </p>
              <div className="text-4xl font-extrabold text-white mb-1">
                {scoreResults.overallPct}%
              </div>
              <p className="text-xs text-slate-300">
                {scoreResults.overallCorrect} correct out of {scoreResults.overallTotal} questions
              </p>
            </div>

            {/* Detailed Section Breakdown */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-left">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Reading Score
                </p>

                <div className="text-2xl font-bold text-slate-900">{scoreResults.rPct}%</div>
                <p className="text-xs text-slate-600 mt-1">
                  {scoreResults.rCorrect} / {scoreResults.rTotal} Correct
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-left">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Grammar Score
                </p>

                <div className="text-2xl font-bold text-slate-900">{scoreResults.gPct}%</div>
                <p className="text-xs text-slate-600 mt-1">
                  {scoreResults.gCorrect} / {scoreResults.gTotal} Correct
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setPhase("welcome");
                setReadingIndex(0);
                setReadingQuestionBatch(0);
                setGrammarBatch(0);
                setReadingAnswers({});
                setGrammarAnswers({});
              }}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm"
            >
              Take Another Test
            </button>
          </div>
        )}
      </main>

      <footer className="text-center py-4 border-t border-slate-200 text-xs text-slate-400">
        InggrisStudent EPRT Practice • Fully Responsive Mobile UI
      </footer>
    </div>
  );
}
