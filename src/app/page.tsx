"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import questionsData from "../data/questions.json";

// Types
interface ParsedChoice {
  key: string;
  text: string;
  full: string;
}

interface QuestionItem {
  id: string;
  seq_number: number;
  type: "reading" | "grammar";
  passageTitle?: string;
  passageText?: string;
  passageIndex?: number;
  totalPassages?: number;
  questionIndexInPassage?: number;
  totalQuestionsInPassage?: number;
  question: string;
  choices: any;
  answer: string;
  explanation?: string | null;
}

interface ExamResult {
  name: string;
  mode: string;
  correct: number;
  total: number;
  readingCorrect: number;
  readingTotal: number;
  grammarCorrect: number;
  grammarTotal: number;
  timeSpentSeconds: number;
  userAnswers: Record<string, string>;
  questions: QuestionItem[];
}

// Helpers
function parseChoices(choices: any): ParsedChoice[] {
  if (Array.isArray(choices)) {
    return choices.map((c, idx) => {
      const defaultKey = String.fromCharCode(65 + idx); // A, B, C, D
      const match = String(c).match(/^([A-Da-d])[\)\.:\s]+(.*)$/);
      if (match) {
        return {
          key: match[1].toUpperCase(),
          text: match[2].trim(),
          full: String(c),
        };
      }
      return {
        key: defaultKey,
        text: String(c),
        full: `${defaultKey}) ${c}`,
      };
    });
  } else if (choices && typeof choices === "object") {
    return Object.entries(choices).map(([k, v]) => ({
      key: k.toUpperCase(),
      text: String(v),
      full: `${k.toUpperCase()}) ${v}`,
    }));
  }
  return [];
}

function checkIsCorrect(q: QuestionItem, userAnswer: string | undefined): boolean {
  if (!userAnswer) return false;
  const parsed = parseChoices(q.choices);
  const selectedChoice = parsed.find(
    (c) => c.key === userAnswer || c.full === userAnswer || c.text === userAnswer
  );
  if (!selectedChoice) return false;

  const rawAnswer = String(q.answer).trim();
  if (rawAnswer.toUpperCase() === selectedChoice.key) return true;
  if (rawAnswer.toLowerCase() === selectedChoice.key.toLowerCase()) return true;
  if (rawAnswer === selectedChoice.full) return true;
  if (rawAnswer.toLowerCase() === selectedChoice.text.toLowerCase()) return true;

  const match = rawAnswer.match(/^([A-Da-d])[\)\.:\s]+(.*)$/);
  if (match && match[1].toUpperCase() === selectedChoice.key) return true;

  return false;
}

export default function Home() {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<"reading" | "grammar" | "both">("reading");
  const [timed, setTimed] = useState<boolean>(true);
  const [started, setStarted] = useState(false);
  const [examResult, setExamResult] = useState<ExamResult | null>(null);

  if (examResult) {
    return <ResultView result={examResult} onRestart={() => setExamResult(null)} />;
  }

  if (!started) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 sm:p-8">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl mx-auto flex items-center justify-center font-bold text-xl mb-3 shadow-xs border border-blue-100">
              EP
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              EPRT English Practice
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Standardized English Proficiency Simulation
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 text-sm transition-all"
                placeholder="Enter your student or candidate name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Exam Section
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMode("reading")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    mode === "reading"
                      ? "border-blue-600 bg-blue-50/70 text-blue-950 font-semibold ring-1 ring-blue-500/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <div>
                      <div className="text-sm">Reading Comprehension</div>
                      <div className="text-xs text-slate-500 font-normal">36 passage-based questions</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    5 Passages
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("grammar")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    mode === "grammar"
                      ? "border-blue-600 bg-blue-50/70 text-blue-950 font-semibold ring-1 ring-blue-500/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                    <div>
                      <div className="text-sm">Structure & Grammar</div>
                      <div className="text-xs text-slate-500 font-normal">31 error identification questions</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    31 Questions
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("both")}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all ${
                    mode === "both"
                      ? "border-blue-600 bg-blue-50/70 text-blue-950 font-semibold ring-1 ring-blue-500/30"
                      : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 text-slate-700 font-medium"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                    <div>
                      <div className="text-sm">Full Test (Reading + Grammar)</div>
                      <div className="text-xs text-slate-500 font-normal">Complete 67 question exam</div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                    Full
                  </span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Exam Mode
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTimed(true)}
                  className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                    timed
                      ? "border-blue-600 bg-blue-50/70 text-blue-900"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  Timed (45 min)
                </button>
                <button
                  type="button"
                  onClick={() => setTimed(false)}
                  className={`p-3 rounded-xl border text-center text-xs font-semibold transition-all ${
                    !timed
                      ? "border-blue-600 bg-blue-50/70 text-blue-900"
                      : "border-slate-200 hover:border-slate-300 bg-white text-slate-600"
                  }`}
                >
                  Untimed Practice
                </button>
              </div>
            </div>

            <button
              type="button"
              disabled={!name.trim()}
              onClick={() => setStarted(true)}
              className="w-full mt-2 py-3.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all duration-150 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed text-center"
            >
              Start Examination
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <QuizUI
      name={name}
      mode={mode}
      timed={timed}
      onFinish={(result) => setExamResult(result)}
    />
  );
}

function QuizUI({
  name,
  mode,
  timed,
  onFinish,
}: {
  name: string;
  mode: "reading" | "grammar" | "both";
  timed: boolean;
  onFinish: (result: ExamResult) => void;
}) {
  // Build flattened question items with proper context
  const questionsList: QuestionItem[] = useMemo(() => {
    const list: QuestionItem[] = [];
    let globalSeq = 1;

    if (mode === "reading" || mode === "both") {
      questionsData.reading.forEach((passageObj, pIdx) => {
        passageObj.questions.forEach((q, qIdx) => {
          list.push({
            id: q.id || `r_${pIdx}_${qIdx}`,
            seq_number: globalSeq++,
            type: "reading",
            passageTitle: passageObj.title,
            passageText: passageObj.passage,
            passageIndex: pIdx + 1,
            totalPassages: questionsData.reading.length,
            questionIndexInPassage: qIdx,
            totalQuestionsInPassage: passageObj.questions.length,
            question: q.question,
            choices: q.choices,
            answer: q.answer,
            explanation: (q as any).explanation || null,
          });
        });
      });
    }

    if (mode === "grammar" || mode === "both") {
      questionsData.grammar.forEach((g, gIdx) => {
        list.push({
          id: `g_${gIdx + 1}`,
          seq_number: globalSeq++,
          type: "grammar",
          question: g.question,
          choices: g.choices,
          answer: g.answer,
          explanation: g.explanation || null,
        });
      });
    }

    return list;
  }, [mode]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [fontSize, setFontSize] = useState<"sm" | "base" | "lg">("base");
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  // Timer: 45 minutes = 2700s
  const initialTime = timed ? 45 * 60 : 0;
  const [secondsRemaining, setSecondsRemaining] = useState(initialTime);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      if (timed) {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [timed]);

  // Current active question
  const currentQ = questionsList[currentIndex];

  // Select an option
  const handleSelectChoice = useCallback(
    (choiceKey: string) => {
      if (!currentQ) return;
      setAnswers((prev) => ({
        ...prev,
        [currentQ.id]: choiceKey,
      }));
    },
    [currentQ]
  );

  // Toggle flag
  const toggleFlag = (qId: string) => {
    setFlagged((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  // Keyboard shortcuts (A, B, C, D, Left, Right)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or modal is open
      if (e.target instanceof HTMLInputElement || isGridOpen || showConfirmSubmit) return;

      const key = e.key.toUpperCase();
      if (key === "ARROWLEFT" && currentIndex > 0) {
        setCurrentIndex((prev) => prev - 1);
      } else if (key === "ARROWRIGHT" && currentIndex < questionsList.length - 1) {
        setCurrentIndex((prev) => prev + 1);
      } else if (["A", "B", "C", "D"].includes(key)) {
        handleSelectChoice(key);
      } else if (["1", "2", "3", "4"].includes(e.key)) {
        const mapped = ["A", "B", "C", "D"][parseInt(e.key, 10) - 1];
        handleSelectChoice(mapped);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, questionsList.length, isGridOpen, showConfirmSubmit, handleSelectChoice]);

  // Complete exam and calculate stats
  const submitExam = useCallback(() => {
    let correct = 0;
    let readingCorrect = 0;
    let readingTotal = 0;
    let grammarCorrect = 0;
    let grammarTotal = 0;

    questionsList.forEach((q) => {
      const isCorrect = checkIsCorrect(q, answers[q.id]);
      if (isCorrect) correct++;

      if (q.type === "reading") {
        readingTotal++;
        if (isCorrect) readingCorrect++;
      } else {
        grammarTotal++;
        if (isCorrect) grammarCorrect++;
      }
    });

    onFinish({
      name,
      mode,
      correct,
      total: questionsList.length,
      readingCorrect,
      readingTotal,
      grammarCorrect,
      grammarTotal,
      timeSpentSeconds: elapsedSeconds,
      userAnswers: answers,
      questions: questionsList,
    });
  }, [answers, elapsedSeconds, mode, name, onFinish, questionsList]);

  // If time runs out
  useEffect(() => {
    if (timed && secondsRemaining === 0) {
      submitExam();
    }
  }, [timed, secondsRemaining, submitExam]);

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const progressPercent = Math.round((answeredCount / questionsList.length) * 100);

  if (!currentQ) return null;

  const parsedChoices = parseChoices(currentQ.choices);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* TOP STATUS BAR */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-15 flex items-center justify-between gap-4">
          {/* Brand & Mode info */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
              EP
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900 leading-none">
                EPRT Simulation
              </div>
              <div className="text-[11px] text-slate-500 font-medium leading-tight mt-0.5 hidden sm:block">
                Candidate: <span className="font-semibold text-slate-700">{name}</span>
              </div>
            </div>
          </div>

          {/* Center: Timer / Untimed */}
          <div className="flex items-center gap-2">
            {timed ? (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-xs sm:text-sm font-bold transition-colors ${
                  secondsRemaining < 300
                    ? "bg-red-50 text-red-600 border border-red-200 animate-pulse"
                    : "bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(secondsRemaining)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200">
                <span>Untimed Practice</span>
              </div>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            {/* Font size control */}
            <div className="hidden md:flex items-center border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setFontSize("sm")}
                className={`px-2 py-1 rounded font-medium transition-colors ${fontSize === "sm" ? "bg-white text-blue-600 shadow-xs" : "hover:text-slate-900"}`}
                title="Small text"
              >
                A-
              </button>
              <button
                type="button"
                onClick={() => setFontSize("base")}
                className={`px-2 py-1 rounded font-medium transition-colors ${fontSize === "base" ? "bg-white text-blue-600 shadow-xs" : "hover:text-slate-900"}`}
                title="Normal text"
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setFontSize("lg")}
                className={`px-2 py-1 rounded font-medium transition-colors ${fontSize === "lg" ? "bg-white text-blue-600 shadow-xs" : "hover:text-slate-900"}`}
                title="Large text"
              >
                A+
              </button>
            </div>

            {/* Questions Grid Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsGridOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
            >
              <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Questions</span>
              <span className="bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded font-bold">
                {answeredCount}/{questionsList.length}
              </span>
            </button>

            {/* Finish Exam Button */}
            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
            >
              Finish
            </button>
          </div>
        </div>

        {/* Thin progress bar */}
        <div className="w-full bg-slate-100 h-1">
          <div
            className="bg-blue-600 h-1 transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / questionsList.length) * 100}%` }}
          />
        </div>
      </header>

      {/* MAIN EXAM CONTAINER */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
        
        {/* CARD 1: READING PASSAGE CARD (Shown for reading questions) */}
        {currentQ.type === "reading" && currentQ.passageText && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 sm:p-8 transition-all">
            {/* Header row: Exactly matches the screenshot */}
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EEF4FF] text-[#2563EB] font-bold text-xs tracking-wider uppercase">
                PASSAGE {currentQ.passageIndex} OF {currentQ.totalPassages}
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">
                Reading (page {(currentQ.questionIndexInPassage ?? 0) + 1} of{" "}
                {currentQ.totalQuestionsInPassage})
              </div>
            </div>

            {/* Passage Body: Serif font, comfortable reading line height */}
            <div
              className={`font-serif text-slate-700 leading-relaxed max-h-[360px] sm:max-h-[420px] overflow-y-auto custom-scrollbar whitespace-pre-line pr-3 ${
                fontSize === "sm"
                  ? "text-[14px] leading-6"
                  : fontSize === "lg"
                  ? "text-[17px] sm:text-[18px] leading-8"
                  : "text-[15px] sm:text-[16px] leading-7"
              }`}
            >
              {currentQ.passageText}
            </div>
          </div>
        )}

        {/* CARD 1 (Variant for Structure & Grammar questions) */}
        {currentQ.type === "grammar" && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 sm:p-8 transition-all">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-xs tracking-wider uppercase">
                STRUCTURE & GRAMMAR
              </div>
              <div className="text-xs sm:text-sm font-medium text-slate-400">
                Question {currentIndex + 1} of {questionsList.length}
              </div>
            </div>
            <div className="text-slate-600 text-sm">
              Identify the one underlined word or phrase that must be changed in order for the sentence to be grammatically correct.
            </div>
          </div>
        )}

        {/* CARD 2: QUESTION & CHOICES CARD (Matches the screenshot) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6 sm:p-8 transition-all">
          {/* Question Row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5">
              {/* Question Number Badge (circle/rounded square) */}
              <div className="w-8 h-8 rounded-lg sm:rounded-xl bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 border border-slate-200/60 mt-0.5">
                {currentQ.seq_number}
              </div>
              {/* Question Text */}
              <h2 className="text-base sm:text-lg md:text-[17.5px] font-bold text-slate-900 leading-snug">
                {currentQ.question}
              </h2>
            </div>

            {/* Bookmark / Flag Button */}
            <button
              type="button"
              onClick={() => toggleFlag(currentQ.id)}
              className={`p-2 rounded-lg border transition-colors shrink-0 ${
                flagged[currentQ.id]
                  ? "bg-amber-50 border-amber-300 text-amber-600"
                  : "bg-white border-slate-200 text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
              title={flagged[currentQ.id] ? "Remove Flag" : "Flag for Review"}
            >
              <svg className="w-4 h-4" fill={flagged[currentQ.id] ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>

          {/* Choices: 2x2 grid on desktop, 1 column on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 mt-6">
            {parsedChoices.map((choice) => {
              const isSelected =
                answers[currentQ.id] === choice.key ||
                answers[currentQ.id] === choice.full ||
                answers[currentQ.id] === choice.text;

              return (
                <button
                  key={choice.key}
                  type="button"
                  onClick={() => handleSelectChoice(choice.key)}
                  className={`group w-full text-left p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border transition-all duration-150 flex items-center gap-3.5 cursor-pointer select-none ${
                    isSelected
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70"
                  }`}
                >
                  {/* Choice Letter Badge (A, B, C, D) */}
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 group-hover:bg-slate-200/80"
                    }`}
                  >
                    {choice.key}
                  </div>

                  {/* Choice Text */}
                  <span
                    className={`text-sm sm:text-[15px] leading-relaxed transition-colors ${
                      isSelected
                        ? "text-blue-950 font-semibold"
                        : "text-slate-700 font-normal group-hover:text-slate-900"
                    }`}
                  >
                    {choice.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* BOTTOM NAVIGATION BAR */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-6 py-4 flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((prev) => prev - 1)}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-medium text-xs sm:text-sm hover:bg-slate-50 hover:border-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>

          {/* Middle Progress Summary */}
          <div className="text-center hidden sm:block">
            <span className="text-xs font-semibold text-slate-600">
              Question {currentIndex + 1} of {questionsList.length}
            </span>
            <span className="mx-2 text-slate-300">•</span>
            <span className="text-xs text-slate-500">
              {questionsList.length - answeredCount} unanswered
            </span>
          </div>

          {currentIndex < questionsList.length - 1 ? (
            <button
              type="button"
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs"
            >
              Submit Exam
            </button>
          )}
        </div>

        {/* Keyboard shortcut guide hint */}
        <div className="text-center text-[11px] text-slate-400 hidden sm:block">
          Pro-tip: Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600">A</kbd> - <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600">D</kbd> to select, and <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600">←</kbd> <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded font-mono text-[10px] text-slate-600">→</kbd> to navigate.
        </div>
      </main>

      {/* QUESTION NAVIGATOR MODAL / DRAWER */}
      {isGridOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Question Navigator</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Answered {answeredCount} of {questionsList.length} questions
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGridOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body: Grid of question numbers */}
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                {questionsList.map((q, idx) => {
                  const isAnswered = !!answers[q.id];
                  const isCurrent = idx === currentIndex;
                  const isFlagged = !!flagged[q.id];

                  let btnStyle = "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200";
                  if (isAnswered) {
                    btnStyle = "bg-blue-600 text-white border-blue-600 shadow-xs";
                  }
                  if (isCurrent) {
                    btnStyle = "ring-2 ring-blue-500 ring-offset-2 " + btnStyle;
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => {
                        setCurrentIndex(idx);
                        setIsGridOpen(false);
                      }}
                      className={`relative h-10 rounded-xl font-bold text-xs border flex items-center justify-center transition-all ${btnStyle}`}
                    >
                      {idx + 1}
                      {isFlagged && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-around text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300 inline-block" />
                  <span>Unanswered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span>Flagged</span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsGridOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM SUBMIT MODAL */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-center text-slate-900">Finish Exam?</h3>
            <p className="text-xs sm:text-sm text-center text-slate-500 mt-2">
              You have answered <span className="font-bold text-slate-800">{answeredCount}</span> of{" "}
              <span className="font-bold text-slate-800">{questionsList.length}</span> questions.
              {questionsList.length - answeredCount > 0 && (
                <span className="block text-amber-600 font-semibold mt-1">
                  Warning: You have {questionsList.length - answeredCount} unanswered questions.
                </span>
              )}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowConfirmSubmit(false)}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Continue Exam
              </button>
              <button
                type="button"
                onClick={submitExam}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// SCORE & RESULT VIEW COMPONENT
function ResultView({ result, onRestart }: { result: ExamResult; onRestart: () => void }) {
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);

  const percentage = Math.round((result.correct / result.total) * 100);
  const minutes = Math.floor(result.timeSpentSeconds / 60);
  const seconds = result.timeSpentSeconds % 60;

  if (reviewMode) {
    const q = result.questions[reviewIndex];
    const userAns = result.userAnswers[q.id];
    const isCorrect = checkIsCorrect(q, userAns);
    const parsedChoices = parseChoices(q.choices);

    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 antialiased p-4 sm:p-6">
        <div className="max-w-4xl mx-auto w-full flex flex-col gap-6">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReviewMode(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 transition-colors"
              >
                Back to Summary
              </button>
              <span className="text-xs sm:text-sm font-bold text-slate-900">
                Review: Question {reviewIndex + 1} of {result.questions.length}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isCorrect
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {isCorrect ? "Correct" : userAns ? "Incorrect" : "Unanswered"}
              </span>
            </div>
          </div>

          {/* Passage card (if reading) */}
          {q.type === "reading" && q.passageText && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
              <div className="flex items-center justify-between mb-4">
                <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-[#EEF4FF] text-[#2563EB] font-bold text-xs uppercase tracking-wider">
                  PASSAGE {q.passageIndex} OF {q.totalPassages}
                </div>
                <div className="text-xs text-slate-400 font-medium">
                  {q.passageTitle}
                </div>
              </div>
              <div className="font-serif text-slate-700 leading-relaxed text-sm sm:text-base max-h-[300px] overflow-y-auto custom-scrollbar whitespace-pre-line pr-2">
                {q.passageText}
              </div>
            </div>
          )}

          {/* Question card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
            <div className="flex items-start gap-3.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm flex items-center justify-center shrink-0">
                {q.seq_number}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
                {q.question}
              </h2>
            </div>

            {/* Choices list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
              {parsedChoices.map((choice) => {
                const wasChosen =
                  userAns === choice.key || userAns === choice.full || userAns === choice.text;
                const isTheCorrectChoice =
                  String(q.answer).toUpperCase() === choice.key ||
                  String(q.answer).toLowerCase() === choice.key.toLowerCase() ||
                  q.answer === choice.full ||
                  q.answer === choice.text;

                let cardStyle = "border-slate-200 bg-white text-slate-700";
                let badgeStyle = "bg-slate-100 text-slate-600";

                if (isTheCorrectChoice) {
                  cardStyle = "border-emerald-500 bg-emerald-50/60 text-emerald-950 font-semibold ring-2 ring-emerald-500/20";
                  badgeStyle = "bg-emerald-600 text-white";
                } else if (wasChosen && !isTheCorrectChoice) {
                  cardStyle = "border-red-400 bg-red-50/60 text-red-950 font-semibold ring-2 ring-red-500/20";
                  badgeStyle = "bg-red-600 text-white";
                }

                return (
                  <div
                    key={choice.key}
                    className={`p-3.5 sm:p-4 rounded-xl border flex items-center justify-between gap-3 ${cardStyle}`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center shrink-0 ${badgeStyle}`}
                      >
                        {choice.key}
                      </div>
                      <span className="text-sm">{choice.text}</span>
                    </div>

                    {isTheCorrectChoice && (
                      <span className="text-[11px] font-bold uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded shrink-0">
                        Correct
                      </span>
                    )}
                    {wasChosen && !isTheCorrectChoice && (
                      <span className="text-[11px] font-bold uppercase text-red-700 bg-red-100/80 px-2 py-0.5 rounded shrink-0">
                        Your Pick
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation card if available */}
            {q.explanation && (
              <div className="mt-6 p-4 rounded-xl bg-blue-50/80 border border-blue-100 text-xs sm:text-sm text-blue-900 leading-relaxed">
                <span className="font-bold">Explanation: </span>
                {q.explanation}
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-6 py-4 flex items-center justify-between">
            <button
              type="button"
              disabled={reviewIndex === 0}
              onClick={() => setReviewIndex((p) => p - 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-xs text-slate-500 font-medium">
              {reviewIndex + 1} / {result.questions.length}
            </span>
            <button
              type="button"
              disabled={reviewIndex === result.questions.length - 1}
              onClick={() => setReviewIndex((p) => p + 1)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.06)] p-6 sm:p-8 text-center">
        {/* Top Trophy / Badge */}
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 border border-blue-100 shadow-xs">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Exam Completed</h1>
        <p className="text-sm text-slate-500 mt-1">
          Well done, <span className="font-semibold text-slate-700">{result.name}</span>! Here is your performance overview:
        </p>

        {/* Primary Score Ring / Box */}
        <div className="mt-6 p-6 rounded-2xl bg-gradient-to-b from-blue-50/50 to-slate-50 border border-slate-200/80">
          <div className="text-4xl sm:text-5xl font-extrabold text-blue-600 tracking-tight">
            {result.correct} <span className="text-xl sm:text-2xl font-semibold text-slate-400">/ {result.total}</span>
          </div>
          <div className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 mt-2">
            Final Accuracy: {percentage}%
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Time elapsed: {minutes}m {seconds}s
          </div>
        </div>

        {/* Breakdown by sections */}
        <div className="grid grid-cols-2 gap-3 mt-4 text-left">
          {result.readingTotal > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500">Reading</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {result.readingCorrect} / {result.readingTotal}
              </div>
              <div className="text-[11px] text-slate-400">
                {Math.round((result.readingCorrect / result.readingTotal) * 100)}% correct
              </div>
            </div>
          )}

          {result.grammarTotal > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-semibold text-slate-500">Grammar</div>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {result.grammarCorrect} / {result.grammarTotal}
              </div>
              <div className="text-[11px] text-slate-400">
                {Math.round((result.grammarCorrect / result.grammarTotal) * 100)}% correct
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            type="button"
            onClick={() => setReviewMode(true)}
            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs sm:text-sm transition-colors shadow-xs flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <span>Review Answers</span>
          </button>

          <button
            type="button"
            onClick={onRestart}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-colors shadow-xs"
          >
            Take Another Test
          </button>
        </div>
      </div>
    </div>
  );
}
