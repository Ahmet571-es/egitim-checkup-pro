'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Pencil, Trash2, BookOpen, Users, User } from 'lucide-react';
import type { Class } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import PremiumModal from '@/components/ui/PremiumModal';
import ActionButton from '@/components/ui/ActionButton';
import { useConfirm } from '@/components/ui/ConfirmDialog';

export default function SchoolClassesPage() {
  const { confirm } = useConfirm();
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

    const { data: cls } = await supabase
      .from('classes')
      .select('*, teacher:profiles!classes_teacher_id_fkey(id,full_name)')
      .eq('school_id', profile.school_id)
      .order('name');
    const { data: tchs } = await supabase
      .from('profiles')
      .select('id,full_name')
      .eq('school_id', profile.school_id)
      .eq('role', 'teacher');

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
    const payload = {
      school_id: schoolId,
      name: editing.name!,
      grade: editing.grade,
      section: editing.section || '',
      teacher_id: editing.teacher_id || null,
    };
    if (editing.id) {
      await supabase.from('classes').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('classes').insert(payload);
    }
    setSaving(false);
    setModal(false);
    load();
  };

  const remove = async (id: string, name: string) => {
    const ok = await confirm({
      variant: 'danger',
      title: 'Sınıfı silmek istiyor musun?',
      description: `"${name}" sınıfını silmek üzeresin. Bu işlem geri alınamaz.`,
      confirmLabel: 'Evet, Sil',
    });
    if (!ok) return;
    await supabase.from('classes').delete().eq('id', id);
    load();
  };

  const filtered = classes.filter((c) => c.name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')));

  return (
    <div>
      <PageHeader
        role="school_admin"
        icon={BookOpen}
        title="Sınıflar"
        subtitle="Okulunuzun sınıf ve şubelerini yönetin"
        count={classes.length}
        countLabel="sınıf"
        action={
          <ActionButton
            variant="primary"
            icon={Plus}
            onClick={() => {
              setEditing({ name: '', grade: null, section: '', teacher_id: null });
              setModal(true);
            }}
          >
            Yeni Sınıf
          </ActionButton>
        }
      />

      <div className="mb-5 max-w-md">
        <SearchBar
          role="school_admin"
          value={search}
          onChange={setSearch}
          placeholder="Sınıf ara..."
        />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center animate-pulse shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Yükleniyor...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          role="school_admin"
          icon={BookOpen}
          title={search ? 'Eşleşen sınıf bulunamadı' : 'Henüz sınıf bulunmuyor'}
          subtitle={search ? 'Arama terimlerini değiştirmeyi deneyin.' : 'İlk sınıfınızı oluşturmak için yukarıdaki "Yeni Sınıf" butonunu kullanın.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-stagger">
          {filtered.map((c) => {
            const teacher = c.teacher as unknown as { full_name: string } | undefined;
            return (
              <div
                key={c.id}
                className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group overflow-hidden"
              >
                {/* Gradient accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-500 via-blue-500 to-indigo-600" />
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />

                <div className="relative">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-md group-hover:scale-110 group-hover:rotate-6 transition-all shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-[15px] font-extrabold text-[#0f2847] truncate">{c.name}</h3>
                        {c.grade && (
                          <p className="text-[11px] text-gray-500 font-semibold">
                            {c.grade}. Sınıf {c.section && `· ${c.section}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => { setEditing(c); setModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600 transition active:scale-95"
                        title="Düzenle"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => remove(c.id, c.name)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition active:scale-95"
                        title="Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                      <User className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium truncate">{teacher?.full_name || 'Öğretmen atanmadı'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-gray-600">
                      <Users className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        <span className="font-bold text-sky-600">{c.student_count || 0}</span> öğrenci
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PremiumModal
        open={modal}
        onClose={() => setModal(false)}
        title={editing.id ? 'Sınıf Düzenle' : 'Yeni Sınıf'}
        subtitle={editing.id ? 'Sınıf bilgilerini güncelleyin' : 'Yeni bir sınıf oluşturun'}
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton variant="ghost" onClick={() => setModal(false)}>
              İptal
            </ActionButton>
            <button
              onClick={save}
              disabled={saving || !editing.name}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[13.5px] font-bold shadow-lg shadow-sky-500/30 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97]"
            >
              {saving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Sınıf Adı <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={editing.name || ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Ör: 9-A"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Sınıf Seviyesi</label>
              <input
                type="number"
                value={editing.grade || ''}
                onChange={(e) => setEditing({ ...editing, grade: parseInt(e.target.value) || null })}
                placeholder="9"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Şube</label>
              <input
                type="text"
                value={editing.section || ''}
                onChange={(e) => setEditing({ ...editing, section: e.target.value })}
                placeholder="A"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Sınıf Öğretmeni</label>
            <select
              value={editing.teacher_id || ''}
              onChange={(e) => setEditing({ ...editing, teacher_id: e.target.value || null })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            >
              <option value="">Seçiniz</option>
              {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>
        </div>
      </PremiumModal>
    </div>
  );
}
