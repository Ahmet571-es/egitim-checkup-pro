'use client';

import { useCallback, useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MessageSquare, Send, Baby, Clock, CheckCheck, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

interface Child {
  id: string;
  full_name: string;
}

interface Note {
  id: string;
  parent_id: string;
  teacher_id: string;
  student_id: string;
  note: string;
  is_read: boolean;
  reply_to: string | null;
  created_at: string;
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const supabase = createClient();

  const childIdParam = searchParams.get('child');
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(childIdParam);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const loadChildren = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: links } = await supabase
      .from('parent_students')
      .select('student_id')
      .eq('parent_id', user.id);
    const childIds = (links || []).map((l: { student_id: string }) => l.student_id);
    if (childIds.length === 0) {
      setChildren([]);
      return;
    }
    const { data: kids } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', childIds);
    setChildren((kids || []) as Child[]);
    if (!selectedChildId && kids && kids.length > 0) {
      setSelectedChildId(kids[0].id);
      router.replace(`/parent/messages?child=${kids[0].id}`);
    }
  }, [supabase, selectedChildId, router]);

  const loadNotes = useCallback(async (studentId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/notes?student_id=${studentId}`);
      const data = await res.json();
      if (!res.ok) {
        toast.error('Mesajlar yüklenemedi', data.error || 'Bilinmeyen hata.');
        setNotes([]);
      } else {
        setNotes((data.notes || []) as Note[]);
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadChildren(); }, [loadChildren]);
  useEffect(() => {
    if (selectedChildId) loadNotes(selectedChildId);
    else setLoading(false);
  }, [selectedChildId, loadNotes]);

  const send = async () => {
    const body = draft.trim();
    if (!body || body.length < 3 || !selectedChildId) return;
    setSending(true);
    try {
      const csrf = typeof document !== 'undefined'
        ? document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1]
        : undefined;
      const res = await fetch('/api/parent/send-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({ student_id: selectedChildId, note: body }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error('Gönderilemedi', data.error || 'Bilinmeyen hata.');
      } else {
        toast.success('Mesaj gönderildi');
        setDraft('');
        loadNotes(selectedChildId);
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setSending(false);
    }
  };

  const selectedChild = children.find((c) => c.id === selectedChildId);

  if (!loading && children.length === 0) {
    return (
      <div>
        <PageHeader role="parent" icon={MessageSquare} title="Mesajlar" subtitle="Öğretmenle iletişim kurun" />
        <EmptyState
          role="parent"
          icon={Baby}
          title="Henüz çocuk eklenmemiş"
          subtitle="Mesaj gönderebilmek için önce çocuğunuzu ekleyin."
          action={
            <button
              onClick={() => router.push('/parent/my-children')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Çocuk Ekle
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        role="parent"
        icon={MessageSquare}
        title="Mesajlar"
        subtitle={selectedChild ? `${selectedChild.full_name} için öğretmene mesaj` : 'Çocuk seçin'}
      />

      {children.length > 1 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedChildId(c.id);
                router.replace(`/parent/messages?child=${c.id}`);
              }}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedChildId === c.id
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border border-pink-200/60 dark:border-slate-700 hover:border-pink-400'
              }`}
            >
              <Baby className="w-4 h-4 inline-block mr-1.5 -mt-0.5" />
              {c.full_name}
            </button>
          ))}
        </div>
      )}

      {/* Yeni mesaj yazma kutusu */}
      <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-white to-pink-50/40 dark:from-slate-800 dark:to-slate-800/60 border border-pink-200/60 dark:border-slate-700 shadow-sm">
        <label className="block text-[13px] font-semibold text-gray-700 dark:text-slate-300 mb-2">
          Öğretmene mesaj
        </label>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, 2000))}
          rows={3}
          placeholder="Öğretmene iletmek istediğiniz mesajı yazın (en az 3, en fazla 2000 karakter)..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/60 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 resize-none"
        />
        <div className="flex items-center justify-between mt-3">
          <span className="text-[11px] text-gray-400">
            {draft.trim().length}/2000 karakter
          </span>
          <button
            onClick={send}
            disabled={sending || draft.trim().length < 3}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {sending ? 'Gönderiliyor...' : (<><Send className="w-4 h-4" /> Gönder</>)}
          </button>
        </div>
      </div>

      {/* Mesaj geçmişi */}
      {loading ? (
        <CardGridSkeleton count={3} cols={1} />
      ) : notes.length === 0 ? (
        <div className="bg-pink-50/40 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-900/30 rounded-2xl p-6 text-center">
          <MessageSquare className="w-10 h-10 text-pink-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-slate-300 font-semibold">Henüz mesaj yok</p>
          <p className="text-xs text-gray-400 mt-1">Yukarıdaki kutudan ilk mesajınızı yazın.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <h2 className="text-sm font-extrabold text-gray-700 dark:text-slate-200 mb-3">
            Konuşma geçmişi
          </h2>
          {notes.map((n) => {
            const mine = n.parent_id && n.reply_to === null;
            return (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border shadow-sm ${
                  mine
                    ? 'bg-gradient-to-br from-pink-50/80 to-rose-50/60 dark:from-pink-950/30 dark:to-rose-950/20 border-pink-200/60 dark:border-pink-900/40 ml-8'
                    : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    mine ? 'text-pink-700 dark:text-pink-300' : 'text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {mine ? 'Siz' : 'Öğretmen'}
                  </span>
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(n.created_at).toLocaleString('tr-TR', {
                      year: 'numeric', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                  {mine && n.is_read && (
                    <span className="text-[11px] text-pink-600 dark:text-pink-400 font-semibold ml-auto flex items-center gap-1">
                      <CheckCheck className="w-3 h-3" />
                      Okundu
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {n.note}
                </p>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-3 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex gap-2 items-start">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
          Mesajlar çocuğunuzun atanmış öğretmenine iletilir. Acil sağlık veya güvenlik durumlarında
          okul rehberlik servisini telefonla arayın.
        </p>
      </div>
    </div>
  );
}

export default function ParentMessagesPage() {
  return (
    <Suspense fallback={<CardGridSkeleton count={3} cols={1} />}>
      <MessagesContent />
    </Suspense>
  );
}
