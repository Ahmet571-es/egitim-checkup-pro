'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, X, Search, GraduationCap, KeyRound, BookMarked } from 'lucide-react';
import type { Profile, Class } from '@/types';

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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('id', user.id)
      .single();
    if (!profile?.school_id) return;
    setSchoolId(profile.school_id);

    const [{ data: ts }, { data: cs }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('school_id', profile.school_id)
        .eq('role', 'teacher')
        .order('full_name'),
      supabase
        .from('classes')
        .select('*')
        .eq('school_id', profile.school_id)
        .order('name'),
    ]);
    setTeachers(ts || []);
    setClasses(cs || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  // ---- Add ----
  const openAdd = () => {
    setErr('');
    setAddForm({ full_name: '', email: '', password: '' });
    setModal('add');
  };

  const submitAdd = async () => {
    setErr('');
    if (!addForm.full_name.trim() || !addForm.email.trim() || !addForm.password.trim()) {
      setErr('Tüm alanlar zorunludur.');
      return;
    }
    if (addForm.password.trim().length < 6) {
      setErr('Şifre en az 6 karakter olmalı.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/create-teacher', {
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

  // ---- Reset ----
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
      setErr('Şifre en az 6 karakter olmalı.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/reset-teacher-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: activeTeacher.id,
          password: resetForm.password,
        }),
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

  // ---- Assign ----
  const openAssign = (t: Profile) => {
    setErr('');
    setActiveTeacher(t);
    const current = new Set(
      classes.filter((c) => c.teacher_id === t.id).map((c) => c.id),
    );
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
      const res = await fetch('/api/admin/assign-teacher-classes', {
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

  // ---- Pasif ----
  const remove = async (id: string) => {
    if (!confirm('Bu öğretmeni pasife almak istediğinize emin misiniz?')) return;
    await supabase.from('profiles').update({ is_active: false }).eq('id', id);
    load();
  };

  const filtered = teachers.filter(
    (t) =>
      t.full_name.toLowerCase().includes(search.toLowerCase()) ||
      t.email.toLowerCase().includes(search.toLowerCase()),
  );

  const closeModal = () => {
    setModal(null);
    setErr('');
    setActiveTeacher(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0f2847]">Öğretmenler</h1>
          <p className="text-sm text-gray-500 mt-1">{teachers.length} öğretmen</p>
        </div>
        <button
          onClick={openAdd}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold shadow-lg shadow-sky-500/25 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Yeni Öğretmen
        </button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Öğretmen ara..."
          className="w-full sm:w-80 pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 transition-all"
        />
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
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Ad Soyad</th>
                <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">E-posta</th>
                <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Sınıflar</th>
                <th className="text-left px-5 py-3 text-[13px] font-semibold text-gray-500">Durum</th>
                <th className="text-right px-5 py-3 text-[13px] font-semibold text-gray-500">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const tClasses = classes.filter((c) => c.teacher_id === t.id);
                return (
                  <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3.5 font-semibold text-[#0f2847]">{t.full_name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{t.email}</td>
                    <td className="px-5 py-3.5 text-gray-500">
                      {tClasses.length === 0 ? (
                        <span className="text-gray-300">—</span>
                      ) : (
                        <span className="text-[12px]">
                          {tClasses.map((c) => c.name).join(', ')}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[12px] font-semibold ${
                          t.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        {t.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => openAssign(t)}
                          title="Sınıflara Ata"
                          className="p-1.5 rounded-lg hover:bg-sky-50 text-gray-400 hover:text-sky-600"
                        >
                          <BookMarked className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openReset(t)}
                          title="Şifre Sıfırla"
                          className="p-1.5 rounded-lg hover:bg-amber-50 text-gray-400 hover:text-amber-600"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => remove(t.id)}
                          title="Pasife Al"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Add Modal ---- */}
      {modal === 'add' && (
        <ModalShell title="Yeni Öğretmen" onClose={closeModal}>
          {err && <ErrBox msg={err} />}
          <div className="space-y-4">
            <Field label="Ad Soyad *">
              <input
                type="text"
                value={addForm.full_name}
                onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </Field>
            <Field label="E-posta *">
              <input
                type="email"
                value={addForm.email}
                onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
            </Field>
            <Field label="Şifre *">
              <input
                type="text"
                value={addForm.password}
                onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                placeholder="En az 6 karakter"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Bu şifreyi öğretmen ile paylaşmayı unutmayın.
              </p>
            </Field>
          </div>
          <ModalFooter
            onCancel={closeModal}
            onSubmit={submitAdd}
            saving={saving}
            label="Ekle"
          />
        </ModalShell>
      )}

      {/* ---- Reset Modal ---- */}
      {modal === 'reset' && activeTeacher && (
        <ModalShell title={`Şifre Sıfırla — ${activeTeacher.full_name}`} onClose={closeModal}>
          {err && <ErrBox msg={err} />}
          <div className="space-y-4">
            <Field label="Yeni Şifre *">
              <input
                type="text"
                value={resetForm.password}
                onChange={(e) => setResetForm({ password: e.target.value })}
                placeholder="En az 6 karakter"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </Field>
          </div>
          <ModalFooter
            onCancel={closeModal}
            onSubmit={submitReset}
            saving={saving}
            label="Şifreyi Güncelle"
          />
        </ModalShell>
      )}

      {/* ---- Assign Modal ---- */}
      {modal === 'assign' && activeTeacher && (
        <ModalShell title={`Sınıflara Ata — ${activeTeacher.full_name}`} onClose={closeModal}>
          {err && <ErrBox msg={err} />}
          <p className="text-[12px] text-gray-500 mb-3">
            Öğretmenin görmesi gereken sınıfları seçin. Seçilmeyen sınıflar üzerindeki atamalar kaldırılacak.
          </p>
          <div className="max-h-72 overflow-auto space-y-2 pr-1">
            {classes.length === 0 && (
              <p className="text-gray-400 text-sm">Hiç sınıf yok.</p>
            )}
            {classes.map((c) => {
              const checked = selectedClassIds.has(c.id);
              const ownedByOther =
                c.teacher_id && c.teacher_id !== activeTeacher.id;
              return (
                <label
                  key={c.id}
                  className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    checked
                      ? 'border-sky-400 bg-sky-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleClass(c.id)}
                    className="w-4 h-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#0f2847]">{c.name}</p>
                    {ownedByOther && (
                      <p className="text-[11px] text-amber-600">
                        Şu an başka bir öğretmende — seçerseniz devralınır.
                      </p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
          <ModalFooter
            onCancel={closeModal}
            onSubmit={submitAssign}
            saving={saving}
            label="Atamaları Kaydet"
          />
        </ModalShell>
      )}

      {!schoolId && !loading && (
        <p className="text-[12px] text-gray-400 mt-3">Okul bulunamadı.</p>
      )}
    </div>
  );
}

// ---- helpers ----
function ModalShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-[#0f2847]">{title}</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}

function ErrBox({ msg }: { msg: string }) {
  return (
    <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
      {msg}
    </div>
  );
}

function ModalFooter({
  onCancel,
  onSubmit,
  saving,
  label,
}: {
  onCancel: () => void;
  onSubmit: () => void;
  saving: boolean;
  label: string;
}) {
  return (
    <div className="flex justify-end gap-3 mt-6">
      <button
        onClick={onCancel}
        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100"
      >
        İptal
      </button>
      <button
        onClick={onSubmit}
        disabled={saving}
        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white text-sm font-bold shadow-lg disabled:opacity-50"
      >
        {saving ? 'Kaydediliyor...' : label}
      </button>
    </div>
  );
}
