import { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, Sparkles, RefreshCw, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface QuestionData {
  type: string;
  question: string;
  explanation: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const YEARS = [
  "1° anno",
  "2° anno",
  "3° anno",
  "4° anno",
  "5° anno"
];

function getTodayDateString() {
  return new Date().toISOString().split('T')[0];
}

export default function App() {
  const [topic, setTopic] = useState("");
  const [year, setYear] = useState(YEARS[0]);
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuestionData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [genCount, setGenCount] = useState({ date: getTodayDateString(), count: 0 });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('domandeApertura_count');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === getTodayDateString()) {
          setGenCount(parsed);
        } else {
          setGenCount({ date: getTodayDateString(), count: 0 });
        }
      }
    } catch(e) {
      // Ignore parse errors
    }
  }, []);

  const incrementCount = () => {
    let newCount = genCount;
    if (genCount.date === getTodayDateString()) {
      newCount = { ...genCount, count: genCount.count + 1 };
    } else {
      newCount = { date: getTodayDateString(), count: 1 };
    }
    setGenCount(newCount);
    localStorage.setItem('domandeApertura_count', JSON.stringify(newCount));
  };

  const handleGenerate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);
    setQuestions(null); // Clear previous results to show loading state better

    try {
      const prompt = `Sei un esperto di pedagogia e didattica per la scuola superiore.
Devi generare 3 domande di apertura per una lezione.
Argomento: ${topic}
Classe: ${year} della scuola secondaria di secondo grado.

Genera esattamente 3 domande diverse per stile per catturare l'attenzione della classe nei primi 30 secondi:
1) Una domanda provocatoria, che mette in discussione un'idea comune.
2) Una domanda di curiosità, che parte da un dettaglio sorprendente.
3) Una domanda di attualizzazione, che collega l'argomento alla vita degli adolescenti di oggi.

Assicurati che la lingua sia italiano. Non usare emoji. Sii altamente professionale ed efficace per adolescenti. Restituisci le domande nell'ordine richiesto.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "Il tipo di domanda: 'Provocatoria', 'Curiosità', o 'Attualizzazione'."
                },
                question: {
                  type: Type.STRING,
                  description: "Il testo della domanda rivolta alla classe."
                },
                explanation: {
                  type: Type.STRING,
                  description: "Una breve frase che inizia sempre con la minuscola, spiegando l'effetto pedagogico atteso della domanda."
                }
              },
              required: ["type", "question", "explanation"]
            }
          }
        }
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        if (Array.isArray(parsed) && parsed.length > 0) {
           setQuestions(parsed);
           incrementCount();
        } else {
           throw new Error("Formato risposta non valido");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError("Si è verificato un errore durante la generazione. Controlla la tua connessione e riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0A] text-white p-6 md:p-10 font-sans overflow-y-auto overflow-x-hidden selection:bg-amber-500/30 selection:text-white">
      <div className="max-w-[1024px] w-full mx-auto flex flex-col flex-1">
        
        {/* Header Section */}
        <header className="mb-8 border-b border-white/10 pb-6 flex-shrink-0">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-500 tracking-tight mb-2">Domanda di apertura</h1>
          <p className="text-lg md:text-xl text-neutral-400 font-light">Catturare l'attenzione della classe in 30 secondi</p>
        </header>

        {/* Interaction Section */}
        <form onSubmit={handleGenerate} className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8 bg-neutral-900/50 p-6 md:p-8 rounded-xl border border-white/5 shadow-2xl flex-shrink-0">
          <div className="md:col-span-6">
            <label htmlFor="topic" className="block text-xs uppercase tracking-widest text-amber-500/70 mb-2 font-semibold">
              Argomento della lezione
            </label>
            <input
              id="topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="es. La Rivoluzione Francese"
              disabled={loading}
              className="w-full bg-neutral-800 border-b border-neutral-700 text-white px-3 py-2 flex items-center focus:outline-none focus:border-amber-500 text-lg placeholder-neutral-600 transition-colors disabled:opacity-50"
              required
            />
          </div>
          <div className="md:col-span-3">
            <label htmlFor="year" className="block text-xs uppercase tracking-widest text-amber-500/70 mb-2 font-semibold">
              Classe
            </label>
            <div className="relative">
              <select
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                disabled={loading}
                className="w-full bg-neutral-800 border-b border-neutral-700 text-white px-3 py-2 appearance-none focus:outline-none focus:border-amber-500 text-lg transition-colors disabled:opacity-50"
              >
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-zinc-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <div className="md:col-span-3 flex items-end">
            <button
              type="submit"
              disabled={loading || !topic.trim()}
              className="w-full bg-green-500 hover:bg-green-600 text-black font-bold py-3 px-6 rounded transition-all shadow-[0_0_20px_rgba(34,197,94,0.2)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>GENERA...</span>
                </>
              ) : (
                <span>GENERA 3 DOMANDE</span>
              )}
            </button>
          </div>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-red-950/40 border border-red-900/50 text-red-200 px-6 py-4 rounded-xl mb-8 flex-shrink-0"
            >
              {error}
            </motion.div>
          )}

          {questions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col gap-4 mb-8"
            >
              {questions.map((q, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.15, duration: 0.5, ease: "easeOut" }}
                  className="bg-neutral-900 border-l-4 border-amber-500 p-5 rounded-r-lg shadow-md"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                      {q.type}
                    </span>
                  </div>
                  <p className="text-xl font-serif italic text-neutral-100 mb-2 leading-relaxed">
                    "{q.question}"
                  </p>
                  <p className="text-sm text-neutral-500 italic">
                    <span className="text-amber-500/80 font-semibold not-italic mr-1">Perché funziona:</span>
                    {q.explanation}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer Section */}
        <footer className="mt-auto flex justify-between items-center border-t border-white/5 pt-4 pb-2">
          <div className="text-sm text-neutral-500">
            Domande generate oggi: <span className="text-amber-500 font-mono">{genCount.count}</span>
          </div>
          {questions && (
            <button
              onClick={(e) => handleGenerate(e as any)}
              disabled={loading}
              className="text-xs text-neutral-400 uppercase tracking-widest hover:text-amber-500 transition-colors border border-white/10 hover:border-amber-500/30 px-4 py-2 rounded flex items-center justify-center disabled:opacity-50"
            >
              Genera nuove domande
            </button>
          )}
        </footer>

      </div>
    </div>
  );
}
