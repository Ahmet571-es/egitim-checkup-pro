'use client';

import { secureFetch } from '@/lib/csrf-client';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Plus, Trash2, GraduationCap, KeyRound, BookMarked, Mail, CheckCircle2, AlertCircle,
} from 'lucide-react';
import type { Profile, Class } from '@/types';
import PageHeader from '@/components/ui/PageHeader';
import SearchBar from '@/components/ui/SearchBar';
import EmptyState from '@/components/ui/EmptyState';
import PremiumModal from '@/components/ui/PremiumModal';
import ActionButton from '@/components/ui/ActionButton';

type ModalKind = null | 'add' | 'reset' | 'assign';

export default function SchoolTeachersPage() {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<ModalKind>(null);
  const [activeTeacher, setActiveTeacher] = useState<Profile | null>(null);

  const [addForm, setAddForm] = useState({ full_name: '', email: '', password: '' });
  const [resetForm, setResetForm] = useState({ password: '' });

  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<Set<string>>(new Set());

  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const supabase = createClient();

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return;
    setSchoolId(profile.school_id);

    const [{ data: ts }, { data: cs }] = await Promise.all([
      supabase.from('profiles').select('*').eq('school_id', profile.school_id).eq('role', 'teacher').order('full_name'),
      supabase.from('classes').select('*').eq('school_id', profile.school_id).order('name'),
    ]);
    setTeachers(ts || []);
    setClasses(cs || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setErr('');
    setAddForm({ full_name: '', email: '', password: '' });
    setModal('add');
  };

  const submitAdd = async () => {
    setErr('');
    if (!addForm.full_name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      setErr('Tüm alanlar zorunludur.'); return;
    }
    if (addForm.password.trim().length < 6) {
      setErr('Şifre en az 6 karakter olmalı.'); return;
    }
    setSaving(true);
    try {
      const res = await secureFetch('/api/admin/create-teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addForm),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Hata');
      setModal(null);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Hata');
    } finally {
      setSaving(false);
    }
  };

  const openReset = (t: Profile) => {
    setErr('');
    setActiveTeacher(t);
    setResetForm({ password: '' });
    setModal('reset');
  };

  const submitReset = async () => {
    if (!activeTeacher) return;
    setErr('');
    if (resetForm.password.trim().length < 6) {
      setErr('Şifre en az 6 karakter olmalı.'); return;
    }
    setSaving(true);
    try {
      const res = await secureFetch('/api/admin/reset-teacher-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teacher_id: activeTeacher.id, password: resetForm.password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Hata');
      setModal(null);
      alert('Şifre güncellendi.');
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Hata');
    } finally {
      setSaving(false);
    }
  };

  const openAssign = (t: Profile) => {
    setErr('');
    setActiveTeacher(t);
    const current = new Set(classes.filter((c) => c.teacher_id === t.id).map((c) => c.id));
    setSelectedClassIds(current);
    setModal('assign');
  };

  const toggleClass = (id: string) => {
    setSelectedClassIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const submitAssign = async () => {
    if (!activeTeacher) return;
    setErr('');
    setSaving(true);
    try {
      const res = await secureFetch('/api/admin/assign-teacher-classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: activeTeacher.id,
          class_ids: Array.from(selectedClassIds),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Hata');
      setModal(null);
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Hata');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Bu öğretmeni pasife almak istediğinize emin misiniz?')) return;
    await supabase.from('profiles').update({ is_active: false }).eq('id', id);
    load();
  };

  const filtered = teachers.filter((t) =>
    t.full_name.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')) ||
    t.email.toLocaleLowerCase('tr-TR').includes(search.toLocaleLowerCase('tr-TR')),
  );

  const closeModal = () => { setModal(null); setErr(''); setActiveTeacher(null); };

  return (
    <div>
      <PageHeader
        role="school_admin"
        icon={GraduationCap}
        title="Öğretmenler"
        subtitle="Okulunuzun öğretmenlerini yönetin, sınıflara atayın"
        count={teachers.length}
        countLabel="öğretmen"
        action={
          <ActionButton variant="primary" icon={Plus} onClick={openAdd}>
            Yeni Öğretmen
          </ActionButton>
        }
      />

      <div className="mb-5 max-w-md">
        <SearchBar role="school_admin" value={search} onChange={setSearch} placeholder="Öğretmen ara (ad, e-posta)..." />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center animate-pulse shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <p className="text-gray-500 text-sm font-medium">Yükleniyor...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          role="school_admin"
          icon={GraduationCap}
          title={search ? 'Eşleşen öğretmen bulunamadı' : 'Henüz öğretmen bulunmuyor'}
          subtitle={search ? 'Arama terimlerini değiştirmeyi deneyin.' : '"Yeni Öğretmen" butonuyla ilk öğretmeninizi ekleyin.'}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-stagger">
          {filtered.map((t) => {
            const tClasses = classes.filter((c) => c.teacher_id === t.id);
            return (
              <div
                key={t.id}
                className="relative bg-white/80 backdrop-blur-xl rounded-2xl border border-white/60 p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all group overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600" />
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-10 blur-2xl group-hover:opacity-25 transition-opacity" />

                <div className="relative">
                  {/* Avatar + Name */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-110 group-hover:rotate-6 transition-all">
                      <span className="text-[17px] font-extrabold">{t.full_name.charAt(0).toUpperCase()}</span>
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[14.5px] font-extrabold text-[#0f2847] truncate">{t.full_name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-gray-400" />
                        <p className="text-[11.5px] text-gray-500 truncate">{t.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Status + Classes */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      t.is_active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                    }`}>
                      {t.is_active ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                      {t.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                    {tClasses.length > 0 && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <BookMarked className="w-3 h-3" />
                        {tClasses.length} sınıf
                      </span>
                    )}
                  </div>

                  {/* Sınıf isimleri */}
                  <div className="pt-3 border-t border-gray-100">
                    {tClasses.length === 0 ? (
                      <p className="text-[11.5px] text-gray-400 italic">Henüz sınıf atanmadı</p>
                    ) : (
                      <p className="text-[11.5px] text-gray-600 truncate" title={tClasses.map((c) => c.name).join(', ')}>
                        <span className="font-semibold">Sınıflar:</span> {tClasses.map((c) => c.name).join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center gap-1.5">
                    <button
                      onClick={() => openAssign(t)}
                      title="Sınıflara Ata"
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-[12px] font-bold transition active:scale-95 border border-sky-100"
                    >
                      <BookMarked className="w-3.5 h-3.5" />
                      Ata
                    </button>
                    <button
                      onClick={() => openReset(t)}
                      title="Şifre Sıfırla"
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-600 transition active:scale-95 border border-amber-100"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => remove(t.id)}
                      title="Pasife Al"
                      className="inline-flex items-center justify-center p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition active:scale-95 border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ---- Add Modal ---- */}
      <PremiumModal
        open={modal === 'add'}
        onClose={closeModal}
        title="Yeni Öğretmen"
        subtitle="Yeni öğretmen hesabı oluşturun"
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton variant="ghost" onClick={closeModal}>İptal</ActionButton>
            <button
              onClick={submitAdd}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[13.5px] font-bold shadow-lg shadow-sky-500/30 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97]"
            >
              {saving ? 'Ekleniyor...' : 'Ekle'}
            </button>
          </div>
        }
      >
        {err && <ErrBox msg={err} />}
        <div className="space-y-4">
          <Field label="Ad Soyad *">
            <input
              type="text"
              value={addForm.full_name}
              onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            />
          </Field>
          <Field label="E-posta *">
            <input
              type="email"
              value={addForm.email}
              onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            />
          </Field>
          <Field label="Şifre *">
            <input
              type="text"
              value={addForm.password}
              onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
              placeholder="En az 6 karakter"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
            />
            <p className="text-[11.5px] text-gray-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 text-amber-500" />
              Bu şifreyi öğretmen ile paylaşmayı unutmayın.
            </p>
          </Field>
        </div>
      </PremiumModal>

      {/* ---- Reset Modal ---- */}
      <PremiumModal
        open={modal === 'reset' && !!activeTeacher}
        onClose={closeModal}
        title="Şifre Sıfırla"
        subtitle={activeTeacher?.full_name}
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton variant="ghost" onClick={closeModal}>İptal</ActionButton>
            <button
              onClick={submitReset}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[13.5px] font-bold shadow-lg shadow-amber-500/30 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97]"
            >
              {saving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
            </button>
          </div>
        }
      >
        {err && <ErrBox msg={err} />}
        <div className="space-y-4">
          <Field label="Yeni Şifre *">
            <input
              type="text"
              value={resetForm.password}
              onChange={(e) => setResetForm({ password: e.target.value })}
              placeholder="En az 6 karakter"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 transition-all"
            />
          </Field>
        </div>
      </PremiumModal>

      {/* ---- Assign Modal ---- */}
      <PremiumModal
        open={modal === 'assign' && !!activeTeacher}
        onClose={closeModal}
        title="Sınıflara Ata"
        subtitle={activeTeacher?.full_name}
        size="lg"
        footer={
          <div className="flex justify-end gap-3">
            <ActionButton variant="ghost" onClick={closeModal}>İptal</ActionButton>
            <button
              onClick={submitAssign}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-[13.5px] font-bold shadow-lg shadow-sky-500/30 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97]"
            >
              {saving ? 'Kaydediliyor...' : 'Atamaları Kaydet'}
            </button>
          </div>
        }
      >
        {err && <ErrBox msg={err} />}
        <p className="text-[12.5px] text-gray-500 mb-4 leading-relaxed">
          Öğretmenin görmesi gereken sınıfları seçin. Seçilmeyen sınıflar üzerindeki atamalar kaldırılacak.
        </p>
        <div className="max-h-80 overflow-auto space-y-2 pr-1 -mr-1">
          {classes.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-8">Hiç sınıf yok.</p>
          )}
          {classes.map((c) => {
            const checked = selectedClassIds.has(c.id);
            const ownedByOther = c.teacher_id && c.teacher_id !== activeTeacher?.id;
            return (
              <label
                key={c.id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  checked
                    ? 'border-sky-400 bg-gradient-to-r from-sky-50 to-blue-50 shadow-sm'
                    : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleClass(c.id)}
                  className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[#0f2847] truncate">{c.name}</p>
                  {ownedByOther && (
                    <p className="text-[11.5px] text-amber-600 mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      Şu an başka bir öğretmende — seçerseniz devralınır.
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </PremiumModal>

      {!schoolId && !loading && (
        <p className="text-[12px] text-gray-400 mt-3">Okul bulunamadı.</p>
      )}
    </div>
  );
}

// Helpers
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-bold text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 font-medium flex items-center gap-2">
      <AlertCircle className="w-4 h-4 shrink-0" />
      {msg}
    </div>
  );
}
