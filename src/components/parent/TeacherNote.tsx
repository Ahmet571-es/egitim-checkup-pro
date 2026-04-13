'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Send, MessageSquare, Loader2, CheckCheck, Clock } from 'lucide-react';

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
  sender_name?: string;
  is_mine?: boolean;
}

interface Teacher {
  id: string;
  full_name: string;
}

interface TeacherNoteProps {
  parentId: string;
  childId: string;
}

export default function TeacherNote({ parentId, childId }: TeacherNoteProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [newNote, setNewNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    const supabase = createClient();

    // Çocuğun sınıflarındaki öğretmenleri bul
    const { data: classStudents } = await supabase
      .from('class_students')
      .select('class_id')
      .eq('student_id', childId);

    if (classStudents && classStudents.length > 0) {
      const classIds = classStudents.map((cs) => cs.class_id);
      const { data: classes } = await supabase
        .from('classes')
        .select('teacher_id, teacher:profiles!classes_teacher_id_fkey(id, full_name)')
        .in('id', classIds)
        .not('teacher_id', 'is', null);

      if (classes) {
        const teacherMap = new Map<string, Teacher>();
        for (const c of classes) {
          const t = c.teacher as unknown as { id: string; full_name: string } | null;
          if (t && !teacherMap.has(t.id)) {
            teacherMap.set(t.id, { id: t.id, full_name: t.full_name });
          }
        }
        const teacherList = Array.from(teacherMap.values());
        setTeachers(teacherList);
        if (teacherList.length > 0 && !selectedTeacher) {
          setSelectedTeacher(teacherList[0].id);
        }
      }
    }

    // Notları yükle
    const { data: noteData } = await supabase
      .from('parent_teacher_notes')
      .select('*')
      .eq('student_id', childId)
      .eq('parent_id', parentId)
      .order('created_at', { ascending: true });

    if (noteData) {
      setNotes(
        noteData.map((n) => ({
          ...n,
          is_mine: n.parent_id === parentId && !n.reply_to,
        }))
      );
    }

    setLoading(false);
  }, [childId, parentId, selectedTeacher]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSend = async () => {
    if (!newNote.trim() || !selectedTeacher) return;
    setSending(true);

    const supabase = createClient();
    const { error } = await supabase.from('parent_teacher_notes').insert({
      parent_id: parentId,
      teacher_id: selectedTeacher,
      student_id: childId,
      note: newNote.trim(),
    });

    if (!error) {
      setNewNote('');
      await loadData();
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-pink-400 animate-spin" />
      </div>
    );
  }

  if (teachers.length === 0) {
    return null;
  }

  const filteredNotes = notes.filter(
    (n) => n.teacher_id === selectedTeacher
  );

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
      {/* Başlık */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-pink-500" />
        <h2 className="font-extrabold text-[#0f2847] text-base">Öğretmene Not</h2>
      </div>

      {/* Öğretmen seçimi */}
      <div className="px-6 pt-4 pb-2">
        <select
          value={selectedTeacher}
          onChange={(e) => setSelectedTeacher(e.target.value)}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none bg-white"
        >
          {teachers.map((t) => (
            <option key={t.id} value={t.id}>
              {t.full_name}
            </option>
          ))}
        </select>
      </div>

      {/* Notlar listesi */}
      <div className="px-6 py-3 max-h-64 overflow-y-auto space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="text-center py-6">
            <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">Henüz not bulunmuyor.</p>
            <p className="text-xs text-gray-300 mt-1">İlk notu siz yazın!</p>
          </div>
        ) : (
          filteredNotes.map((n) => {
            const isMine = n.parent_id === parentId && !n.reply_to;
            return (
              <div
                key={n.id}
                className={`p-3 rounded-xl max-w-[85%] ${
                  isMine
                    ? 'bg-pink-50 border border-pink-100 ml-auto'
                    : 'bg-gray-50 border border-gray-100'
                }`}
              >
                <p className="text-sm text-gray-700 leading-relaxed">{n.note}</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <Clock className="w-3 h-3 text-gray-300" />
                  <span className="text-[10px] text-gray-400">
                    {new Date(n.created_at).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {isMine && n.is_read && (
                    <CheckCheck className="w-3 h-3 text-blue-400 ml-1" />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Not yazma */}
      <div className="px-6 py-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Öğretmene not yazın..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 outline-none"
          />
          <button
            onClick={handleSend}
            disabled={sending || !newNote.trim()}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
