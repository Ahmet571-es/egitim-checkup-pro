'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, X, Search, GraduationCap } from 'lucide-react';
import type { Profile } from '@/types';

export default function SchoolTeachersPage() {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '' });
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

    const { data } = await supabase.from('profiles').select('*').eq('school_id', profile.school_id).eq('role', 'teacher').order('full_name');
    setTeachers(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!schoolId || !form.full_name || !form.email) return;
    setSaving(true);
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: 'Ogretmen123!',
      options: { data: { full_name: form.full_name, role: 'teacher', school_id: schoolId } },
    });
    if (error) alert('Hata: ' + error.message);
    setSaving(false);
    setModal(false);
    setForm({ full_name: '', email: '' });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Bu öğretmeni pasife almak istediğinize emin misiniz?')) return;
    await supabase.from('profiles').update({ is_active: false }).eq('id', id);
    load();
  };

  const filtered = teachers.filter((t) => t.full_name.toLowerCase().includes(search.toLowerCase()) || t.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f2847]">Öğretmenler</h1>
          <p className="text-sm text-gray-500 mt-1">{teachers.length} öğretmen</p>
        </div>
        <button onClick={() => setModal(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Öğretmen
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Öğretmen ara..." className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Henüz öğretmen bulunmuyor.</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100">
              <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Ad Soyad</th>
              <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">E-posta</th>
              <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Durum</th>
              <th className="text-right px-5 py-3 text-[13px] font-semibold text-gray-500">İşlem</th>
            </tr></thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-5 py-3.5 font-semibold text-[#0f2847]">{t.full_name}</td>
                  <td className="px-5 py-3.5 text-gray-500">{t.email}</td>
                  <td className="px-5 py-3.5"><span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{t.is_active ? 'Aktif' : 'Pasif'}</span></td>
                  <td className="px-5 py-3.5 text-right"><button onClick={() => remove(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0f2847]">Yeni Öğretmen</h3>
              <button onClick={() => setModal(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Ad Soyad *</label>
                <input type="text" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">E-posta *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30" />
              </div>
              <p className="text-[12px] text-gray-400">Varsayılan şifre: Ogretmen123!</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100">İptal</button>
              <button onClick={add} disabled={saving || !form.full_name || !form.email} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold shadow-lg disabled:opacity-50">
                {saving ? 'Ekleniyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
