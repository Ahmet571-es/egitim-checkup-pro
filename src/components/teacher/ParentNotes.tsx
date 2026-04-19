'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { MessageSquare, Send, Loader2, CheckCheck, Clock, Bell, User } from 'lucide-react';

// ── Tipler ──────────────────────────────────────────────────
interface Note {
  id: string;
  parent_id: string;
  teacher_id: string;
  student_id: string;
  note: string;
  is_read: boolean;
  reply_to: string | null;
  created_at: string;
  parent_name?: string;
  student_name?: string;
}

interface ParentNotesProps {
  teacherId: string;
}

export default function ParentNotes({ teacherId }: ParentNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotes = useCallback(async () => {
    const supabase = createClient();

    const { data } = await supabase
      .from('parent_teacher_notes')
      .select(`
        *,
        parent:profiles!parent_teacher_notes_parent_id_fkey(full_name),
        student:profiles!parent_teacher_notes_student_id_fkey(full_name)
      `)
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      const mappedNotes = data.map((n) => ({
        id: n.id,
        parent_id: n.parent_id,
        teacher_id: n.teacher_id,
        student_id: n.student_id,
        note: n.note,
        is_read: n.is_read,
        reply_to: n.reply_to,
        created_at: n.created_at,
        parent_name: (n.parent as unknown as { full_name: string })?.full_name ?? 'Veli',
        student_name: (n.student as unknown as { full_name: string })?.full_name ?? 'Öğrenci',
      }));

      setNotes(mappedNotes);
      setUnreadCount(mappedNotes.filter((n) => !n.is_read && !n.reply_to).length);

      // Okunmamış notları okundu olarak işaretle
      const unreadIds = mappedNotes
        .filter((n) => !n.is_read && !n.reply_to)
        .map((n) => n.id);
      if (unreadIds.length > 0) {
        await supabase
          .from('parent_teacher_notes')
          .update({ is_read: true })
          .in('id', unreadIds);
      }
    }

    setLoading(false);
  }, [teacherId]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleReply = async (parentId: string, studentId: string, noteId: string) => {
    if (!replyText.trim()) return;
    setSending(true);

    const supabase = createClient();
    const { error } = await supabase.from('parent_teacher_notes').insert({
      parent_id: parentId,
      teacher_id: teacherId,
      student_id: studentId,
      note: replyText.trim(),
      reply_to: noteId,
    });

    if (!error) {
      setReplyText('');
      setReplyTo(null);
      await loadNotes();
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  // Sadece veliden gelen (reply_to null olan) notları grupla
  const parentNotes = notes.filter((n) => !n.reply_to);
  const replies = notes.filter((n) => n.reply_to);

  return (
    <div className="bg-white/70 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm overflow-hidden">
      {/* Başlık */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700/60 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-emerald-500" />
        <h2 className="font-extrabold text-[#0f2847] dark:text-slate-100 text-base">Veli Notları</h2>
        {unreadCount > 0 && (
          <span className="ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
            <Bell className="w-3 h-3" />
            {unreadCount} yeni
          </span>
        )}
      </div>

      {/* Not listesi */}
      <div className="max-h-[400px] overflow-y-auto divide-y divide-gray-50">
        {parentNotes.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Henüz veli notu bulunmuyor.</p>
          </div>
        ) : (
          parentNotes.map((n) => {
            const noteReplies = replies.filter((r) => r.reply_to === n.id);
            const isReplying = replyTo === n.id;

            return (
              <div key={n.id} className="px-6 py-4">
                {/* Veli notu */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-pink-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-[#0f2847] dark:text-slate-100">{n.parent_name}</span>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">→</span>
                      <span className="text-xs text-gray-500 dark:text-slate-400">{n.student_name} hakkında</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed bg-gray-50 dark:bg-slate-800/60 rounded-xl p-3">
                      {n.note}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Clock className="w-3 h-3 text-gray-300" />
                      <span className="text-[10px] text-gray-400 dark:text-slate-500">
                        {new Date(n.created_at).toLocaleDateString('tr-TR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <button
                        onClick={() => setReplyTo(isReplying ? null : n.id)}
                        className="text-[11px] text-emerald-600 font-semibold hover:underline ml-2"
                      >
                        {isReplying ? 'İptal' : 'Yanıtla'}
                      </button>
                    </div>

                    {/* Yanıtlar */}
                    {noteReplies.length > 0 && (
                      <div className="mt-2 ml-4 space-y-2">
                        {noteReplies.map((r) => (
                          <div
                            key={r.id}
                            className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100"
                          >
                            <p className="text-xs text-gray-600 dark:text-slate-300">{r.note}</p>
                            <div className="flex items-center gap-1 mt-1">
                              <Clock className="w-2.5 h-2.5 text-gray-300" />
                              <span className="text-[9px] text-gray-400 dark:text-slate-500">
                                {new Date(r.created_at).toLocaleDateString('tr-TR', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              <span className="text-[9px] text-emerald-500 font-semibold ml-1">Yanıtınız</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Yanıt formu */}
                    {isReplying && (
                      <div className="mt-2 ml-4 flex gap-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleReply(n.parent_id, n.student_id, n.id)}
                          placeholder="Yanıtınızı yazın..."
                          className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-emerald-300 focus:border-emerald-400 outline-none"
                          autoFocus
                        />
                        <button
                          onClick={() => handleReply(n.parent_id, n.student_id, n.id)}
                          disabled={sending || !replyText.trim()}
                          className="px-3 py-2 rounded-xl bg-emerald-500 text-white font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-50 transition-all"
                        >
                          {sending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
