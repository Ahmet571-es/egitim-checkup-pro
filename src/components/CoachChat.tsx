'use client';
/**
 * Faz 8: AI Koç Sohbet Komponenti (reusable)
 *
 * 3 rol için tema farklı:
 *   • student → mor/pembe (sıcak, motive edici)
 *   • parent → pembe/rose (yumuşak, danışman)
 *   • teacher → emerald/cyan (profesyonel)
 */
import { useEffect, useRef, useState } from 'react';
import { secureFetch } from '@/lib/csrf-client';
import { useToast } from '@/components/ui/Toast';
import {
  Send, Loader2, MessageSquare, AlertTriangle, Sparkles,
  Bot, User as UserIcon, Lock, RefreshCw,
} from 'lucide-react';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  flagged_safety?: boolean;
  created_at?: string;
}

interface Props {
  /** AI koç rolü (caller'ın rolüyle eşleşmeli) */
  role: 'student' | 'parent' | 'teacher';
  /** parent/teacher modunda hakkında konuşulacak öğrenci */
  studentId?: string;
  /** Üst başlık (panel sayfasından geliyor) */
  studentName?: string;
}

const THEME = {
  student: {
    gradient: 'from-violet-500 via-purple-500 to-pink-500',
    bg: 'bg-violet-50 dark:bg-violet-950/20',
    border: 'border-violet-200 dark:border-violet-900/40',
    accent: 'violet',
    aiAvatar: 'from-violet-500 to-pink-500',
    userBubble: 'bg-violet-600 text-white',
    placeholder: 'Bir sorun veya isteğin var mı? Buraya yaz...',
    welcomeText: 'Merhaba! Ben senin gelişim koçun. Bu hafta nasıl gidiyor? Bir konu hakkında sohbet etmek ister misin?',
  },
  parent: {
    gradient: 'from-pink-500 via-rose-500 to-fuchsia-500',
    bg: 'bg-pink-50 dark:bg-pink-950/20',
    border: 'border-pink-200 dark:border-pink-900/40',
    accent: 'pink',
    aiAvatar: 'from-pink-500 to-fuchsia-500',
    userBubble: 'bg-pink-600 text-white',
    placeholder: 'Çocuğunuz hakkında danışmak istediğiniz bir konu var mı?',
    welcomeText: 'Merhaba. Çocuğunuzun gelişimi konusunda size destek olmak için buradayım. Bir konuda görüş almak ister misiniz?',
  },
  teacher: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    border: 'border-emerald-200 dark:border-emerald-900/40',
    accent: 'emerald',
    aiAvatar: 'from-emerald-500 to-teal-600',
    userBubble: 'bg-emerald-600 text-white',
    placeholder: 'Bu öğrenci hakkında pedagojik bir konu sorabilirsiniz...',
    welcomeText: 'Merhaba. Öğrenci hakkında pedagojik destek için buradayım. Bir konuda görüş almak ister misiniz?',
  },
};

export default function CoachChat({ role, studentId, studentName }: Props) {
  const toast = useToast();
  const t = THEME[role];

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Auto-scroll new messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setInput('');

    // Optimistic UI: kullanıcı mesajını hemen göster
    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);

    try {
      const res = await secureFetch(`/api/coach/${role}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: conversationId,
          student_id: studentId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Limit aşıldıysa
        if (res.status === 429) {
          toast.error('Günlük limit', data.error || 'Yarın tekrar deneyin.');
          // Mesajı geri al
          setMessages((prev) => prev.slice(0, -1));
          return;
        }
        toast.error('Hata', data.error || 'Mesaj gönderilemedi.');
        setMessages((prev) => prev.slice(0, -1));
        return;
      }

      if (data.conversation_id && !conversationId) {
        setConversationId(data.conversation_id);
      }

      // AI yanıtını ekle
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
          flagged_safety: data.flagged_safety,
        },
      ]);

      if (typeof data.remaining_today === 'number') {
        setRemaining(data.remaining_today);
      }

      // Kriz tetiklendiyse uyarı toast
      if (data.flagged_safety) {
        toast.error(
          'Önemli bilgi',
          'Mesajında ciddi bir konu var. Lütfen koç önerilerini dikkatle oku.',
        );
      }
    } catch {
      toast.error('Bağlantı hatası', 'Lütfen tekrar deneyin.');
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setSending(false);
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setConversationId(null);
    setRemaining(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className={`rounded-2xl border ${t.border} ${t.bg} overflow-hidden flex flex-col`} style={{ minHeight: '60vh', maxHeight: '80vh' }}>
      {/* Başlık */}
      <div className={`px-4 py-3 bg-gradient-to-r ${t.gradient} text-white flex items-center justify-between gap-3`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold truncate">
              {role === 'student' ? 'Senin Koçun' :
               role === 'parent' ? 'Veli Koçu' : 'Pedagojik Koç'}
            </h3>
            <p className="text-[11px] text-white/80 truncate">
              {studentName ? `${studentName} hakkında` : 'Claude Sonnet 4.6'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {remaining !== null && (
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              {remaining} kaldı
            </span>
          )}
          {messages.length > 0 && (
            <button
              onClick={handleNewConversation}
              className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition"
              aria-label="Yeni sohbet"
              title="Yeni sohbet başlat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Privacy notice */}
      <div className="px-4 py-2 bg-white/60 dark:bg-slate-900/40 border-b border-gray-100 dark:border-slate-800 flex items-center gap-2">
        <Lock className="w-3 h-3 text-gray-400" />
        <p className="text-[10.5px] text-gray-500 dark:text-slate-400">
          {role === 'student'
            ? 'Mesajların güvenli şekilde saklanır. Acil bir durumda 182 ALO Aile Sosyal Destek Hattı\'nı arayabilirsin.'
            : role === 'parent'
            ? 'Bu sohbet KVKK kapsamında özel kişisel veridir. Üçüncü kişilerle paylaşılmaz.'
            : 'Profesyonel sır. Öğrenci verisi KVKK kapsamında özel kişisel veridir.'}
        </p>
      </div>

      {/* Mesaj listesi */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.aiAvatar} flex items-center justify-center text-white mb-3 shadow-lg`}>
              <Bot className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#0f2847] dark:text-slate-100 max-w-md">
              {t.welcomeText}
            </p>
          </div>
        ) : (
          messages.map((m, idx) => (
            <div
              key={m.id || idx}
              className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                m.role === 'user'
                  ? 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                  : `bg-gradient-to-br ${t.aiAvatar} text-white shadow-md`
              }`}>
                {m.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed ${
                m.role === 'user'
                  ? `${t.userBubble} rounded-tr-sm`
                  : 'bg-white dark:bg-slate-800 text-[#0f2847] dark:text-slate-100 border border-gray-100 dark:border-slate-700 rounded-tl-sm'
              }`}>
                {m.flagged_safety && m.role === 'user' && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-200">
                    <AlertTriangle className="w-3 h-3" />
                    İşaretlendi
                  </div>
                )}
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))
        )}
        {sending && (
          <div className="flex gap-2">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${t.aiAvatar} flex items-center justify-center text-white shrink-0 shadow-md`}>
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-3.5 py-2 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
              <span className="text-[12px] text-gray-500 dark:text-slate-400">düşünüyor...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-3 border-t border-gray-100 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 800))}
            onKeyDown={handleKeyDown}
            placeholder={t.placeholder}
            rows={2}
            disabled={sending}
            className={`flex-1 resize-none rounded-xl border ${t.border} bg-white dark:bg-slate-800 px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-${t.accent}-400 disabled:opacity-50`}
          />
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className={`p-2.5 rounded-xl bg-gradient-to-br ${t.gradient} text-white shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
            aria-label="Gönder"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            <strong>Enter</strong> gönder · <strong>Shift+Enter</strong> yeni satır
          </p>
          <p className="text-[10px] text-gray-400 dark:text-slate-500">
            {input.length}/800
          </p>
        </div>
      </div>
    </div>
  );
}
