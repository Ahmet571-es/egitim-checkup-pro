'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Heart, Plus, Trash2, Mail, Baby, AlertCircle } from 'lucide-react';
import type { Profile } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import PremiumModal from '@/components/ui/PremiumModal';
import ActionButton from '@/components/ui/ActionButton';
import { useToast } from '@/components/ui/Toast';

interface ParentWithChildren extends Profile {
  children: Profile[];
}

export default function SchoolParentsPage() {
  const toast = useToast();
  const [parents, setParents] = useState<ParentWithChildren[]>([]);
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', student_ids: [] as string[] });
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

    const { data: pars } = await supabase.from('profiles').select('*').eq('school_id', profile.school_id).eq('role', 'parent').order('full_name');
    const { data: studs } = await supabase.from('profiles').select('*').eq('school_id', profile.school_id).eq('role', 'student').order('full_name');

    const enriched: ParentWithChildren[] = [];
    for (const p of (pars || [])) {
      const { data: links } = await supabase.from('parent_students').select('student_id').eq('parent_id', p.id);
      const childIds = (links || []).map((l: { student_id: string }) => l.student_id);
      const children = (studs || []).filter((s) => childIds.includes(s.id));
      enriched.push({ ...p, children });
    }

    setParents(enriched);
    setStudents(studs || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!schoolId || !form.full_name || !form.email) return;
    setSaving(true);
    const { data: authData, error } = await supabase.auth.signUp({
      email: form.email,
      password: 'Veli123!',
      options: { data: { full_name: form.full_name, role: 'parent', school_id: schoolId } },
    });
    if (error) { toast.error('Hata', error.message); setSaving(false); return; }

    if (authData.user && form.student_ids.length > 0) {
      const links = form.student_ids.map((sid) => ({ parent_id: authData.user!.id, student_id: sid }));
      await supabase.from('parent_students').insert(links);
    }

    toast.success('Veli eklendi', `${form.full_name} başarıyla sisteme eklendi.`);
    setSaving(false);
    setModal(false);
    setForm({ full_name: '', email: '', student_ids: [] });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Bu veliyi pasife almak istediğinize emin misiniz?')) return;
    await supabase.from('profiles').update({ is_active: false }).eq('id', id);
    load();
  };

  const filtered = parents.filter((p) => p.full_name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')));

  return (
    <div>
      <PageHeader
        role="school_admin"
        icon={Heart}
        title="Veliler"
        subtitle="Okulunuzun velilerini yönetin, öğrencilerle eşleştirin"
        count={parents.length}
        countLabel="veli"
        action={
          <ActionButton variant="primary" icon={Plus} onClick={() => setModal(true)}>
            Yeni Veli
          </ActionButton>
        }
      />

      <div className="mb-5 max-w-md">
        <SearchBar role="school_admin" value={search} onChange={setSearch} placeholder="Veli ara..." />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center animate-pulse shadow-lg">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Yükleniyor...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          role="school_admin"
          icon={Heart}
          title={search ? 'Eşleşen veli bulunamadı' : 'Henüz veli bulunmuyor'}
          subtitle={search ? 'Arama terimlerini değiştirmeyi deneyin.' : '"Yeni Veli" butonuyla ilk veliyi ekleyin.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-stagger">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-pink-500 via-rose-500 to-red-500" />
              <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />

              <div className="relative">
                {/* Avatar */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <Heart className="w-5 h-5" />
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[14.5px] font-extrabold text-[#0f2847] truncate">{p.full_name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-gray-400" />
                      <p className="text-[11.5px] text-gray-500 truncate">{p.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(p.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition active:scale-95 shrink-0"
                    title="Pasife Al"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Children */}
                <div className="pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Baby className="w-3.5 h-3.5 text-rose-500" />
                    <span className="text-[11.5px] font-bold text-gray-700">
                      Çocukları ({p.children.length})
                    </span>
                  </div>
                  {p.children.length === 0 ? (
                    <p className="text-[11.5px] text-gray-400 italic">Henüz çocuk eşleştirilmedi</p>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {p.children.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[11px] font-semibold border border-rose-200">
                          {c.full_name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Parent Modal */}
      <PremiumModal
        open={modal}
        onClose={() => setModal(false)}
        title="Yeni Veli"
        subtitle="Yeni veli hesabı oluşturun ve çocuklarıyla eşleştirin"
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton variant="ghost" onClick={() => setModal(false)}>İptal</ActionButton>
            <button
              onClick={add}
              disabled={saving || !form.full_name || !form.email}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white text-[13.5px] font-bold shadow-lg shadow-pink-500/30 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97]"
            >
              {saving ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Ad Soyad *</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">E-posta *</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-400 transition-all"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Çocukları</label>
            <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1 bg-gray-50/50">
              {students.map((s) => {
                const checked = form.student_ids.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition ${
                      checked ? 'bg-rose-50 border border-rose-200' : 'hover:bg-white border border-transparent'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setForm({
                          ...form,
                          student_ids: e.target.checked
                            ? [...form.student_ids, s.id]
                            : form.student_ids.filter((id) => id !== s.id),
                        });
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">{s.full_name}</span>
                  </label>
                );
              })}
              {students.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Önce öğrenci ekleyin.</p>}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-[12px] text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>Varsayılan şifre: <strong>Veli123!</strong> — Veliyle paylaşmayı unutmayın.</p>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}
