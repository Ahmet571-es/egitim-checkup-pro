'use client';

import { useState } from 'react';
import { Send, Bot, Loader2, MessageSquare } from 'lucide-react';

export default function AIQuery() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function askQuestion() {
    if (!question.trim() || loading) return;
    setLoading(true);
    setAnswer('');

    try {
      const res = await fetch('/api/ai/natural-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });
      const data = await res.json();

      if (data.reply) {
        setAnswer(data.reply);
        setRemaining(data.remaining);
      } else {
        setAnswer(data.error || 'Bir hata oluştu.');
      }
    } catch {
      setAnswer('Bağlantı hatası.');
    }
    setLoading(false);
  }

  const suggestions = [
    'En kaygılı 5 öğrenci kimler?',
    'Dikkat skoru düşen öğrenciler var mı?',
    'Bu sınıfın en güçlü alanı ne?',
    'Hangi öğrenciler risk altında?',
  ];

  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Bot className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#0f2847] dark:text-slate-100">AI Asistan</h3>
          <p className="text-xs text-gray-400 dark:text-slate-500">
            {remaining !== null ? `${remaining} sorgu hakkınız kaldı` : 'Günlük 10 sorgu hakkınız var'}
          </p>
        </div>
      </div>

      {/* Öneri butonları */}
      <div className="flex flex-wrap gap-2 mb-4">
        {suggestions.map(s => (
          <button
            key={s}
            onClick={() => setQuestion(s)}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-600 text-xs font-medium rounded-full hover:bg-emerald-100 transition-colors"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && askQuestion()}
          placeholder="Öğrencileriniz hakkında soru sorun..."
          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button
          onClick={askQuestion}
          disabled={loading || !question.trim()}
          className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>

      {/* Cevap */}
      {answer && (
        <div className="bg-gray-50 dark:bg-slate-800/60 rounded-xl p-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-semibold text-emerald-600">AI Yanıtı</span>
          </div>
          {answer.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
