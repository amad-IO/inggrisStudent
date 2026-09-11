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
  const [activeTab, setActiveTab] = useState<"reading" | "grammar">("reading");

  // Reading Mode State
  const [readingIndex, setReadingIndex] = useState(0);
  const [readingQuestionBatch, setReadingQuestionBatch] = useState(0); // 0 = first 2, 1 = next 2...
  const [readingUserAnswers, setReadingUserAnswers] = useState<{ [key: string]: string }>({});

  // Grammar Mode State
  const [grammarBatch, setGrammarBatch] = useState(0);
  const [grammarUserAnswers, setGrammarUserAnswers] = useState<{ [key: number]: string }>({});

  // Finished & Results State
  const [isFinished, setIsFinished] = useState(false);

  // Current Reading Section
  const currentReading: ReadingSection = questionsData.reading[readingIndex] || {
    title: "",
    passage: "",
    questions: [],
  };

  // Questions to display (MAX 2 questions per page)
  const currentBatchQuestions = useMemo(() => {
    if (activeTab === "reading") {
      const start = readingQuestionBatch * 2;
      return currentReading.questions.slice(start, start + 2);
    } else {
      const start = grammarBatch * 2;
      return questionsData.grammar.slice(start, start + 2);
    }
  }, [activeTab, readingQuestionBatch, currentReading, grammarBatch]);

  const totalBatchesInCurrentSection = Math.ceil(
    (activeTab === "reading" ? currentReading.questions.length : questionsData.grammar.length) / 2
  );

  const handleSelectAnswer = (qKey: string | number, choice: string) => {
    if (activeTab === "reading") {
      setReadingUserAnswers((prev) => ({ ...prev, [qKey]: choice }));
    } else {
      setGrammarUserAnswers((prev) => ({ ...prev, [Number(qKey)]: choice }));
    }
  };

  const handleNext = () => {
    if (activeTab === "reading") {
      if (readingQuestionBatch + 1 < totalBatchesInCurrentSection) {
        setReadingQuestionBatch((prev) => prev + 1);
      } else if (readingIndex + 1 < questionsData.reading.length) {
        setReadingIndex((prev) => prev + 1);
        setReadingQuestionBatch(0);
      } else {
        setIsFinished(true);
      }
    } else {
      if (grammarBatch + 1 < totalBatchesInCurrentSection) {
        setGrammarBatch((prev) => prev + 1);
      } else {
        setIsFinished(true);
      }
    }
  };

  const handleBack = () => {
    if (activeTab === "reading") {
      if (readingQuestionBatch > 0) {
        setReadingQuestionBatch((prev) => prev - 1);
      } else if (readingIndex > 0) {
        setReadingIndex((prev) => prev - 1);
        const prevSectionLen = questionsData.reading[readingIndex - 1].questions.length;
        setReadingQuestionBatch(Math.max(0, Math.ceil(prevSectionLen / 2) - 1));
      }
    } else {
      if (grammarBatch > 0) {
        setGrammarBatch((prev) => prev - 1);
      }
    }
  };

  // Calculate Scores
  const scoreResults = useMemo(() => {
    let readingCorrect = 0;
    let readingTotal = 0;
    questionsData.reading.forEach((sec, sIdx) => {
      sec.questions.forEach((q, qIdx) => {
        readingTotal++;
        const key = `${sIdx}-${qIdx}`;
        if (readingUserAnswers[key]?.toLowerCase() === q.answer?.toLowerCase()) {
          readingCorrect++;
        }
      });
    });

    let grammarCorrect = 0;
    const grammarTotal = questionsData.grammar.length;
    questionsData.grammar.forEach((q, idx) => {
      if (grammarUserAnswers[idx]?.toLowerCase() === q.answer?.toLowerCase()) {
        grammarCorrect++;
      }
    });

    return {
      readingCorrect,
      readingTotal,
      readingPct: readingTotal ? Math.round((readingCorrect / readingTotal) * 100) : 0,
      grammarCorrect,
      grammarTotal,
      grammarPct: grammarTotal ? Math.round((grammarCorrect / grammarTotal) * 100) : 0,
    };
  }, [readingUserAnswers, grammarUserAnswers]);

  return (
    <div className="min-h-screen flex flex-col justify-between">
      {/* Editorial Top Navigation */}
      <header className="border-b border-[#E2E8F0] bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#1E293B] text-white flex items-center justify-center font-serif text-base font-bold shadow-sm">
              E
            </span>
            <div>
              <h1 className="font-serif text-lg font-bold text-[#0F172A] tracking-tight">
                InggrisStudent
              </h1>
              <p className="text-xs text-[#64748B] font-mono">EPRT Preparation Platform</p>
            </div>
          </div>

          {!isFinished && (
            <div className="flex bg-[#F1F5F9] p-1 rounded-xl border border-[#E2E8F0]">
              <button
                onClick={() => {
                  setActiveTab("reading");
                  setIsFinished(false);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "reading"
                    ? "bg-white text-[#0F172A] shadow-sm"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Reading Comprehension
              </button>
              <button
                onClick={() => {
                  setActiveTab("grammar");
                  setIsFinished(false);
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "grammar"
                    ? "bg-white text-[#0F172A] shadow-sm"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Structure & Grammar
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!isFinished && (
              <button
                onClick={() => setIsFinished(true)}
                className="text-xs font-mono font-medium px-3 py-1.5 bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA] rounded-lg hover:bg-[#FEE2E2] transition-colors"
              >
                Finish Attempt
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {isFinished ? (
          /* RESULT / SCOREBOARD VIEW */
          <div className="paper-card rounded-2xl p-8 sm:p-12 text-center max-w-xl mx-auto">
            <span className="inline-block p-4 rounded-full bg-[#FEF9C3] text-[#854D0E] font-serif text-3xl mb-4">
              🎓
            </span>
            <h2 className="font-serif text-3xl font-bold text-[#0F172A] mb-2">
              Practice Completed!
            </h2>
            <p className="text-sm text-[#64748B] mb-8">
              Here is your authentic evaluation based on verified EPRT criteria.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <p className="text-xs uppercase font-mono tracking-wider text-[#64748B] mb-1">
                  Reading Score
                </p>
                <div className="text-3xl font-bold font-serif text-[#0F172A]">
                  {scoreResults.readingPct}%
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  {scoreResults.readingCorrect} of {scoreResults.readingTotal} correct
                </p>
              </div>

              <div className="p-5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                <p className="text-xs uppercase font-mono tracking-wider text-[#64748B] mb-1">
                  Grammar Score
                </p>
                <div className="text-3xl font-bold font-serif text-[#0F172A]">
                  {scoreResults.grammarPct}%
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  {scoreResults.grammarCorrect} of {scoreResults.grammarTotal} correct
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setIsFinished(false);
                setReadingIndex(0);
                setReadingQuestionBatch(0);
                setGrammarBatch(0);
                setReadingUserAnswers({});
                setGrammarUserAnswers({});
              }}
              className="w-full py-3 bg-[#0F172A] text-white rounded-xl font-medium text-sm hover:bg-[#1E293B] shadow-md transition-all"
            >
              Start Practice Again
            </button>
          </div>
        ) : activeTab === "reading" ? (
          /* READING VIEW */
          <div className="space-y-6">
            {/* Story / Passage Section (Fixed on top of questions) */}
            <div className="paper-card rounded-2xl p-6 sm:p-8 bg-white border border-[#E2E8F0] shadow-sm">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#EEF2FF] text-[#4338CA] rounded-md">
                    Passage {readingIndex + 1} of {questionsData.reading.length}
                  </span>
                  <h3 className="font-serif font-bold text-[#0F172A] text-base sm:text-lg">
                    {currentReading.title}
                  </h3>
                </div>
                <span className="text-xs font-mono text-[#64748B]">
                  {currentReading.questions.length} Questions
                </span>
              </div>

              {/* Scrollable Story Text */}
              <div className="text-[#334155] text-sm sm:text-base leading-relaxed max-h-[320px] overflow-y-auto pr-3 font-serif whitespace-pre-line selection:bg-[#FEF08A]">
                {currentReading.passage || "No passage required for this context."}
              </div>
            </div>

            {/* Questions Batch (Max 2 Questions per Next) */}
            <div className="space-y-6">
              {currentBatchQuestions.map((q, idx) => {
                const globalQIdx = readingQuestionBatch * 2 + idx;
                const answerKey = `${readingIndex}-${globalQIdx}`;
                const selected = readingUserAnswers[answerKey];

                return (
                  <div
                    key={globalQIdx}
                    className="paper-card rounded-2xl p-6 bg-white border border-[#E2E8F0]"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center text-xs font-bold font-mono">
                        {globalQIdx + 1}
                      </span>
                      <p className="font-medium text-[#0F172A] text-base leading-snug">
                        {q.question}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {Object.entries(q.choices).map(([choiceKey, choiceVal]) => {
                        const isSelected = selected?.toLowerCase() === choiceKey.toLowerCase();
                        return (
                          <button
                            key={choiceKey}
                            onClick={() => handleSelectAnswer(answerKey, choiceKey)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left text-sm transition-all ${
                              isSelected
                                ? "border-[#0F172A] bg-[#F8FAFC] shadow-sm"
                                : "border-[#E2E8F0] hover:border-[#CBD5E1] bg-white"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono uppercase font-bold transition-colors ${
                                isSelected
                                  ? "bg-[#0F172A] text-white"
                                  : "bg-[#F1F5F9] text-[#64748B]"
                              }`}
                            >
                              {choiceKey}
                            </span>
                            <span className="flex-1 text-[#334155] leading-snug font-normal">
                              {choiceVal}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* GRAMMAR VIEW */
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <span className="text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 bg-[#F0FDF4] text-[#15803D] rounded-md">
                Structure & Grammar
              </span>
              <span className="text-xs font-mono text-[#64748B]">
                Question {grammarBatch * 2 + 1} -{" "}
                {Math.min(grammarBatch * 2 + 2, questionsData.grammar.length)} of{" "}
                {questionsData.grammar.length}
              </span>
            </div>

            <div className="space-y-6">
              {currentBatchQuestions.map((q, idx) => {
                const globalQIdx = grammarBatch * 2 + idx;
                const selected = grammarUserAnswers[globalQIdx];

                return (
                  <div
                    key={globalQIdx}
                    className="paper-card rounded-2xl p-6 bg-white border border-[#E2E8F0]"
                  >
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#F1F5F9] text-[#0F172A] flex items-center justify-center text-xs font-bold font-mono">
                        {globalQIdx + 1}
                      </span>
                      <p className="font-medium text-[#0F172A] text-base leading-snug">
                        {q.question}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {Object.entries(q.choices).map(([choiceKey, choiceVal]) => {
                        const isSelected = selected?.toLowerCase() === choiceKey.toLowerCase();
                        return (
                          <button
                            key={choiceKey}
                            onClick={() => handleSelectAnswer(globalQIdx, choiceKey)}
                            className={`flex items-center gap-3 p-3.5 rounded-xl border text-left text-sm transition-all ${
                              isSelected
                                ? "border-[#0F172A] bg-[#F8FAFC] shadow-sm"
                                : "border-[#E2E8F0] hover:border-[#CBD5E1] bg-white"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-mono uppercase font-bold transition-colors ${
                                isSelected
                                  ? "bg-[#0F172A] text-white"
                                  : "bg-[#F1F5F9] text-[#64748B]"
                              }`}
                            >
                              {choiceKey}
                            </span>
                            <span className="flex-1 text-[#334155] leading-snug font-normal">
                              {choiceVal}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Global Bottom Navigation Controls */}
        {!isFinished && (
          <div className="flex items-center justify-between pt-8 mt-8 border-t border-[#E2E8F0]">
            <button
              onClick={handleBack}
              disabled={
                activeTab === "reading"
                  ? readingIndex === 0 && readingQuestionBatch === 0
                  : grammarBatch === 0
              }
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border border-[#CBD5E1] text-[#334155] hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
            >
              ← Previous Questions
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-[#0F172A] text-white hover:bg-[#1E293B] shadow-md transition-all"
            >
              Next Questions →
            </button>
          </div>
        )}
      </main>

      {/* Subtle Hand-Crafted Footer */}
      <footer className="border-t border-[#E2E8F0] py-6 text-center text-xs text-[#94A3B8] font-mono">
        Handcrafted for English Language Practice • Built with Next.js & Vercel
      </footer>
    </div>
  );
}
