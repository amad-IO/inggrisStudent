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
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 text-gray-900 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Hasil Ujian</h2>
          <p className="text-lg mb-2">Nama: <span className="font-semibold">{name}</span></p>
          <p className="text-xl">Score: <span className="font-bold text-blue-600">{score.correct} / {score.total}</span></p>
          <button onClick={() => window.location.reload()} className="mt-8 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 shadow-md">Mulai Ulang</button>
        </div>
      </div>
    );
  }

  if (!started) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 font-sans text-gray-900">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-900">EPRT Practice</h1>
        <div className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nama Lengkap</label>
            <input 
              type="text"
              className="border border-gray-300 p-3 rounded-xl w-full outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
              placeholder="Masukkan Nama Anda" 
              value={name}
              onChange={e => setName(e.target.value)} 
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2.5">Pilih Modul Ujian</label>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                type="button"
                onClick={() => setMode('reading')}
                className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm transition-all text-left flex items-center justify-between border-2 ${
                  mode === 'reading'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <span>Reading Comprehension</span>
                {mode === 'reading' && <span className="text-blue-600 font-bold">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setMode('grammar')}
                className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm transition-all text-left flex items-center justify-between border-2 ${
                  mode === 'grammar'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <span>Structure & Grammar</span>
                {mode === 'grammar' && <span className="text-blue-600 font-bold">✓</span>}
              </button>

              <button
                type="button"
                onClick={() => setMode('both')}
                className={`w-full py-3.5 px-4 rounded-xl font-medium text-sm transition-all text-left flex items-center justify-between border-2 ${
                  mode === 'both'
                    ? 'border-blue-600 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <span>Keduanya (Reading + Grammar)</span>
                {mode === 'both' && <span className="text-blue-600 font-bold">✓</span>}
              </button>
            </div>
          </div>

          <button 
            className="w-full bg-blue-600 text-white p-3.5 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-md mt-2"
            disabled={!name.trim() || !mode}
            onClick={() => setStarted(true)}
          >
            Mulai Ujian
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

  if (!currentView) return <div>Memuat soal...</div>;

  return (
    <div className="min-h-screen bg-gray-100 p-4 font-sans text-gray-800 md:p-8">
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-6">
        
        {currentView.type === 'reading' && (
          <div className="md:w-1/2 bg-white rounded-xl shadow p-6 max-h-[80vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">{currentView.title || 'Reading Passage'}</h2>
            <div className="whitespace-pre-wrap leading-relaxed text-gray-700">
              {currentView.passage}
            </div>
          </div>
        )}

        <div className={`bg-white rounded-xl shadow p-6 flex flex-col ${currentView.type === 'reading' ? 'md:w-1/2' : 'w-full max-w-2xl mx-auto'}`}>
          <div className="mb-4 text-sm font-semibold text-gray-500 uppercase tracking-wide">
            {currentView.type === 'reading' ? 'Reading Comprehension' : 'Structure & Grammar'} 
            <span className="float-right text-blue-600">Halaman {currentIndex + 1} / {activeQuestions.length}</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-2">
            {currentView.questions.map((q: any) => (
              <div key={q.id} className="mb-8 pb-6 border-b last:border-0">
                <p className="font-medium text-lg mb-4">
                  {q.seq_number}. {q.question}
                </p>
                <div className="flex flex-col gap-3">
                  {(Array.isArray(q.choices) ? q.choices : Object.values(q.choices)).map((choice: any, idx: number) => {
                    const isSelected = answers[q.id] === choice;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSelect(q.id, choice)}
                        className={`text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium' 
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
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

          <div className="mt-6 flex justify-between pt-4 border-t">
            <button 
              className="px-6 py-2 rounded-lg font-medium border border-gray-300 hover:bg-gray-100 disabled:opacity-30"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex(prev => prev - 1)}
            >
              Back
            </button>
            
            {currentIndex < activeQuestions.length - 1 ? (
              <button 
                className="px-6 py-2 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700"
                onClick={() => setCurrentIndex(prev => prev + 1)}
              >
                Next
              </button>
            ) : (
              <button 
                className="px-6 py-2 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-green-500/30"
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
