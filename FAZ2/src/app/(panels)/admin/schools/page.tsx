'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { School, Plus, Pencil, Trash2, X, Search, Building } from 'lucide-react';
import type { School as SchoolType } from '@/types';

const EMPTY: Partial<SchoolType> = { name: '', code: '', city: '', phone: '', email: '', max_students: 50 };

export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Partial<SchoolType>>(EMPTY);
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('schools').select('*').order('created_at', { ascending: false });
    setSchools(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setEditing({ ...EMPTY, code: generateCode() }); setModal(true); };
  const openEdit = (s: SchoolType) => { setEditing(s); setModal(true); };

  const save = async () => {
    setSaving(true);
    if (editing.id) {
      await supabase.from('schools').update({ name: editing.name, code: editing.code, city: editing.city, phone: editing.phone, email: editing.email, max_students: editing.max_students }).eq('id', editing.id);
    } else {
      await supabase.from('schools').insert({ name: editing.name, code: editing.code, city: editing.city, phone: editing.phone, email: editing.email, max_students: editing.max_students });
    }
    setSaving(false);
    setModal(false);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Bu okulu silmek istediğinize emin misiniz?')) return;
    await supabase.from('schools').delete().eq('id', id);
    load();
  };

  const filtered = schools.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.city.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase()));

  const statusBadge = (s: SchoolType['license_status']) => {
    const map = { trial: 'bg-amber-100 text-amber-700', active: 'bg-emerald-100 text-emerald-700', expired: 'bg-red-100 text-red-700' };
    const labels = { trial: 'Deneme', active: 'Aktif', expired: 'Süresi Dolmuş' };
    return <span className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${map[s]}`}>{labels[s]}</span>;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f2847]">Okullar</h1>
          <p className="text-sm text-gray-500 mt-1">{schools.length} okul kayıtlı</p>
        </div>
        <button onClick={openNew} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all flex items-center gap-2">
          <Plus className="w-4 h-4" /> Yeni Okul
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Okul ara..." className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all" />
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">Yükleniyor...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40">
          <Building className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Henüz okul bulunmuyor.</p>
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Okul Adı</th>
                  <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Kod</th>
                  <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Şehir</th>
                  <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Lisans</th>
                  <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Limit</th>
                  <th className="text-right px-5 py-3 text-[13px] font-semibold text-gray-500">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-[#0f2847]">{s.name}</td>
                    <td className="px-5 py-3.5 font-mono text-xs text-gray-500">{s.code}</td>
                    <td className="px-5 py-3.5 text-gray-600">{s.city}</td>
                    <td className="px-5 py-3.5">{statusBadge(s.license_status)}</td>
                    <td className="px-5 py-3.5 text-gray-600">{s.max_students}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600 transition-colors mr-1"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={() => setModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-[#0f2847]">{editing.id ? 'Okul Düzenle' : 'Yeni Okul'}</h3>
              <button onClick={() => setModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Okul Adı *</label>
                <input type="text" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1">Okul Kodu *</label>
                  <input type="text" value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1">Şehir</label>
                  <input type="text" value={editing.city || ''} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1">Telefon</label>
                  <input type="text" value={editing.phone || ''} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
                <div>
                  <label className="block text-[13px] font-semibold text-gray-700 mb-1">E-posta</label>
                  <input type="email" value={editing.email || ''} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                </div>
              </div>
              <div>
                <label className="block text-[13px] font-semibold text-gray-700 mb-1">Maks. Öğrenci</label>
                <input type="number" value={editing.max_students || 50} onChange={(e) => setEditing({ ...editing, max_students: parseInt(e.target.value) })} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(false)} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors">İptal</button>
              <button onClick={save} disabled={saving || !editing.name || !editing.code} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-lg shadow-amber-500/25 disabled:opacity-50 transition-all">
                {saving ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}
