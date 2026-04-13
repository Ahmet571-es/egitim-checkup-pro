'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2, X, Search, BookOpen, Users } from 'lucide-react';
import type { Class } from '@/types';

export default function SchoolClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; full_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Partial<Class>>({ name: '', grade: null, section: '', teacher_id: null });
  const [saving, setSaving] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return;
    setSchoolId(profile.school_id);

    const { data: cls } = await supabase.from('classes').select('*, teacher:profiles!classes_teacher_id_fkey(id,full_name)').eq('school_id', profile.school_id).order('name');
    const { data: tchs } = await supabase.from('profiles').select('id,full_name').eq('school_id', profile.school_id).eq('role', 'teacher');

    // Get student counts
    if (cls) {
      for (const c of cls) {
        const { count } = await supabase.from('class_students').select('*', { count: 'exact', head: true }).eq('class_id', c.id);
        c.student_count = count || 0;
      }
    }

    setClasses(cls || []);
    setTeachers(tchs || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    if (!schoolId) return;
    setSaving(true);
    const payload = { school_id: schoolId, name: editing.name!, grade: editing.grade, section: editing.section || '', teacher_id: editing.teacher_id || null };
    if (editing.id) {
      await supabase.from('classes').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('classes').insert(payload);
    }
    setSaving(false);
    setModal(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Bu sınıfı silmek istediğinize emin misiniz?')) return;
    await supabase.from('classes').delete().eq('id', id);
    load();
  };

  const filtered = classes.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f2847]">Sınıflar</h1>
          <p className="text-sm text-gray-500 mt-1">{classes.length} sınıf</p>
        </div>
        <button onClick={() => { setEditing({ name: '', grade: null, section: '', teacher_id: null }); setModal(true); }} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Sınıf
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sınıf ara..." className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40">
          <BookOpen className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Henüz sınıf bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 border-l-4 border-l-sky-500 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-[15px] font-bold text-[#0f2847]">{c.name}</h3>
                <div className="flex gap-1">
                  <button onClick={() => { setEditing(c); setModal(true); }} className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => remove(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </div>
              {c.teacher && <p className="text-[13px] text-gray-500 mb-2">Öğretmen: {(c.teacher as unknown as { full_name: string }).full_name}</p>}
              <div className="flex items-center gap-1.5 text-[13px] text-gray-400">
                <Users className="w-3.5 h-3.5" />{c.student_count || 0} öğrenci
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0f2847]">{editing.id ? 'Sınıf Düzenle' : 'Yeni Sınıf'}</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Sınıf Adı *</label>
                <input type="text" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="Ör: 9-A" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1">Sınıf Seviyesi</label>
                  <input type="number" value={editing.grade || ''} onChange={(e) => setEditing({ ...editing, grade: parseInt(e.target.value) || null })} placeholder="9" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1">Şube</label>
                  <input type="text" value={editing.section || ''} onChange={(e) => setEditing({ ...editing, section: e.target.value })} placeholder="A" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Sınıf Öğretmeni</label>
                <select value={editing.teacher_id || ''} onChange={(e) => setEditing({ ...editing, teacher_id: e.target.value || null })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30">
                  <option value="">Seçiniz</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">İptal</button>
              <button onClick={save} disabled={saving || !editing.name} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold shadow-lg disabled:opacity-50">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
