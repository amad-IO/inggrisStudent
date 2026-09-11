"use client";
import { useState, useMemo } from 'react';
import questionsData from '../data/questions.json';

export default function Home() {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('');
  const [started, setStarted] = useState(false);
  const [score, setScore] = useState<{correct: number, total: number} | null>(null);

  if (score) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-900 text-white font-sans">
        <div className="bg-neutral-800 p-8 rounded shadow max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Exam Completed</h2>
          <p className="text-lg mb-2">Name: <span className="font-semibold">{name}</span></p>
          <p className="text-xl">Score: <span className="font-bold text-teal-400">{score.correct} / {score.total}</span></p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-teal-600 text-white px-6 py-2 rounded hover:bg-teal-700">Restart</button>
        </div>
      </div>
    );
  }

  if (!started) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-neutral-900 font-sans text-white">
      <div className="bg-neutral-800 p-8 rounded shadow-lg max-w-md w-full border border-neutral-700">
        <h1 className="text-xl font-bold mb-6 text-center text-gray-200">EPRT Practice</h1>
        <div className="flex flex-col gap-4">
          <input 
            type="text"
            className="bg-neutral-700 border border-neutral-600 p-3 rounded w-full text-white placeholder-gray-400 focus:outline-none focus:border-teal-500"
            placeholder="Enter your name" 
            value={name}
            onChange={e => setName(e.target.value)} 
          />
          <select 
            className="bg-neutral-700 border border-neutral-600 p-3 rounded w-full text-white focus:outline-none focus:border-teal-500"
            value={mode}
            onChange={e => setMode(e.target.value)}
          >
            <option value="">-- Select Module --</option>
            <option value="reading">Reading Comprehension</option>
            <option value="grammar">Structure & Grammar</option>
            <option value="both">Both (Reading + Grammar)</option>
          </select>
          <button 
            className="mt-4 bg-teal-600 text-white p-3 rounded font-medium hover:bg-teal-700 disabled:opacity-50 transition-colors"
            disabled={!name || !mode}
            onClick={() => setStarted(true)}
          >
            Start Exam
          </button>
        </div>
      </div>
    </div>
  );
  
  return <QuizUI mode={mode} onFinish={setScore} />;
}

function QuizUI({ mode, onFinish }: { mode: string, onFinish: (s: {correct: number, total: number}) => void }) {
  const activeQuestions = useMemo(() => {
    let list: any[] = [];
    if (mode === 'reading' || mode === 'both') {
      questionsData.reading.forEach(r => {
        for (let i = 0; i < r.questions.length; i += 2) {
          list.push({
            type: 'reading',
            passage: r.passage,
            title: r.title,
            questions: r.questions.slice(i, i + 2)
          });
        }
      });
    }
    if (mode === 'grammar' || mode === 'both') {
       const g = questionsData.grammar;
       for (let i = 0; i < g.length; i += 2) {
         list.push({
           type: 'grammar',
           questions: g.slice(i, i + 2).map((q, idx) => ({...q, seq_number: i + idx + 1}))
         });
       }
    }
    return list;
  }, [mode]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const currentView = activeQuestions[currentIndex];

  const handleSelect = (qId: string, choice: string) => {
    setAnswers(prev => ({ ...prev, [qId]: choice }));
  };

  const handleFinish = () => {
    let correct = 0;
    let total = 0;
    
    if (mode === 'reading' || mode === 'both') {
      questionsData.reading.forEach(r => {
        r.questions.forEach(q => {
          total++;
          const ansKey = Object.keys(q.choices).find(k => q.choices[k as keyof typeof q.choices] === q.answer) || q.answer;
          if (answers[q.id] === q.answer || answers[q.id] === ansKey) {
            correct++;
          }
        });
      });
    }
    
    if (mode === 'grammar' || mode === 'both') {
      questionsData.grammar.forEach(g => {
        total++;
        if (g.id && answers[g.id] === g.answer) {
          correct++;
        }
      });
    }
    
    onFinish({ correct, total });
  };

  if (!currentView) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-black p-2 md:p-4 font-sans text-gray-200">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4 h-[90vh]">
        
        {/* Left Panel: Passage */}
        {currentView.type === 'reading' && (
          <div className="md:w-1/2 flex flex-col bg-neutral-900 border border-neutral-700 rounded overflow-hidden">
            <div className="bg-neutral-800 px-4 py-3 border-b border-neutral-700 font-semibold text-sm tracking-wider text-gray-300">
              {currentView.title ? currentView.title.toUpperCase() : 'READING PASSAGE'}
            </div>
            <div className="flex-1 p-5 overflow-y-auto whitespace-pre-wrap leading-relaxed text-gray-300 text-sm md:text-base">
              {currentView.passage}
            </div>
          </div>
        )}

        {/* Right Panel: Questions */}
        <div className={`flex flex-col bg-neutral-900 border border-neutral-700 rounded overflow-hidden ${currentView.type === 'reading' ? 'md:w-1/2' : 'w-full max-w-3xl mx-auto'}`}>
          <div className="bg-neutral-800 px-4 py-3 border-b border-neutral-700 flex justify-between items-center">
            <span className="font-semibold text-sm tracking-wider text-gray-300">
              {currentView.type === 'reading' ? 'READING COMPREHENSION' : 'STRUCTURE & GRAMMAR'}
            </span>
            <span className="text-xs text-gray-400">Page {currentIndex + 1} of {activeQuestions.length}</span>
          </div>

          <div className="flex-1 p-5 overflow-y-auto">
            {currentView.questions.map((q: any) => (
              <div key={q.id} className="mb-8 last:mb-0">
                <p className="font-medium text-base mb-4 text-white">
                  {q.seq_number}. {q.question}
                </p>
                <div className="flex flex-col gap-2">
                  {(Array.isArray(q.choices) ? q.choices : Object.values(q.choices)).map((choice: any, idx: number) => {
                    const isSelected = answers[q.id] === choice;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(q.id, choice)}
                        className={`text-left p-3 rounded text-sm md:text-base transition-colors ${
                          isSelected 
                            ? 'bg-teal-600/20 border-l-4 border-teal-500 text-white' 
                            : 'bg-neutral-800 hover:bg-neutral-700 text-gray-300'
                        }`}
                      >
                        {choice}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="bg-neutral-800 px-5 py-4 border-t border-neutral-700 flex justify-between">
            <button 
              className="px-6 py-2 rounded font-medium text-sm border border-neutral-600 text-gray-300 hover:bg-neutral-700 disabled:opacity-30"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              Back
            </button>
            
            {currentIndex < activeQuestions.length - 1 ? (
              <button 
                className="px-6 py-2 rounded font-medium text-sm bg-neutral-200 text-black hover:bg-white"
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                Next
              </button>
            ) : (
              <button 
                className="px-6 py-2 rounded font-medium text-sm bg-teal-600 text-white hover:bg-teal-500"
                onClick={handleFinish}
              >
                Submit & Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
