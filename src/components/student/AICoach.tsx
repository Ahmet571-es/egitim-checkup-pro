'use client';

import { useState } from 'react';
import { Send, Bot, User, Loader2, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AICoach() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setLoading(true);

    try {
      const res = await fetch('/api/coaching/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error }]);
        setRemaining(0);
      } else if (data.reply) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
        setRemaining(data.remaining);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: data.error || 'Bir hata oluştu.' }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Bağlantı hatası. Tekrar dene.' }]);
    }

    setLoading(false);
  }

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden flex flex-col" style={{ height: '500px' }}>
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-violet-500 to-purple-600">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Koçun</h3>
            <p className="text-xs text-white/70">
              {remaining !== null ? `${remaining} mesaj hakkın kaldı` : 'Günlük 5 mesaj hakkın var'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle className="w-12 h-12 text-violet-200 mb-3" />
            <p className="text-sm text-gray-500 font-medium">Merhaba! Ben senin AI koçunum.</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Ders çalışma, sınav kaygısı, motivasyon... Aklına ne gelirse sorabilirsin!
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center">
              {['Sınava nasıl çalışmalıyım?', 'Konsantre olamıyorum', 'Motivasyonum düşük'].map(q => (
                <button
                  key={q}
                  onClick={() => { setInput(q); }}
                  className="px-3 py-1.5 bg-violet-50 text-violet-600 text-xs font-medium rounded-full hover:bg-violet-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
              msg.role === 'user' ? 'bg-violet-100' : 'bg-gradient-to-br from-violet-500 to-purple-600'
            }`}>
              {msg.role === 'user'
                ? <User className="w-3.5 h-3.5 text-violet-600" />
                : <Bot className="w-3.5 h-3.5 text-white" />
              }
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-violet-600 text-white rounded-tr-md'
                : 'bg-gray-100 text-gray-700 rounded-tl-md'
            }`}>
              {msg.content.split('\n').map((line, j) => (
                <p key={j} className={j > 0 ? 'mt-2' : ''}>{line}</p>
              ))}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Mesajını yaz..."
            disabled={loading || remaining === 0}
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim() || remaining === 0}
            className="px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
