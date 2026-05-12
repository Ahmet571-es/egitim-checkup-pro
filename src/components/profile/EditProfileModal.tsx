'use client';

/**
 * EditProfileModal — Hem öğrenci/öğretmen self-edit için hem de
 * admin tarafından başkasını edit için kullanılır.
 *
 * Props:
 *   open: bool
 *   onClose: () => void
 *   role: 'student' | 'teacher'
 *   targetUserId?: string  → admin modunda zorunlu
 *   initialValues: profil alanları
 *   onSuccess?: () => void → başarılı güncellemeden sonra (örn. router.refresh)
 */

import { useEffect, useRef, useState } from 'react';
import {
  X, User, Phone, Calendar, MapPin, School as SchoolIcon, BookOpen,
  GraduationCap, AlertCircle, CheckCircle2, Loader2, Briefcase, Users,
} from 'lucide-react';
import { secureFetch } from '@/lib/csrf-client';
import { STUDENT_GRADES } from '@/types';

type Role = 'student' | 'teacher';

export interface EditableProfileFields {
  full_name?: string;
  phone?: string;
  gender?: string;
  birth_date?: string;
  city?: string;
  district?: string;
  school_name?: string;
  grade?: string;
  is_graduated?: boolean;
  branch?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  role: Role;
  targetUserId?: string;
  initialValues: EditableProfileFields;
  onSuccess?: () => void;
}

const ROLE_THEME: Record<Role, { gradient: string; accentBg: string; accentText: string; accentBorder: string }> = {
  student: {
    gradient: 'from-violet-500 to-purple-600',
    accentBg: 'bg-violet-500',
    accentText: 'text-violet-700',
    accentBorder: 'focus:border-violet-400 focus:ring-violet-500/30',
  },
  teacher: {
    gradient: 'from-emerald-500 to-teal-600',
    accentBg: 'bg-emerald-500',
    accentText: 'text-emerald-700',
    accentBorder: 'focus:border-emerald-400 focus:ring-emerald-500/30',
  },
};

export default function EditProfileModal({
  open, onClose, role, targetUserId, initialValues, onSuccess,
}: Props) {
  const [form, setForm] = useState<EditableProfileFields>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const submittingRef = useRef(false);

  // Modal her açıldığında form'u initial'larla resetle
  useEffect(() => {
    if (open) {
      setForm(initialValues);
      setError('');
      setSuccess(false);
      submittingRef.current = false;
    }
  }, [open, initialValues]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const theme = ROLE_THEME[role];
  const isAdminMode = !!targetUserId;

  const update = <K extends keyof EditableProfileFields>(key: K, value: EditableProfileFields[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setError('');

    const fullName = (form.full_name ?? '').trim();
    if (fullName.length < 2) {
      setError('Ad-soyad en az 2 karakter olmalı.');
      submittingRef.current = false;
      return;
    }

    // Phone basic validation (boş veya minimum 10 rakam)
    const phoneDigits = (form.phone ?? '').replace(/\D/g, '');
    if (phoneDigits && phoneDigits.length < 10) {
      setError('Telefon numarası en az 10 haneli olmalı (veya boş bırakın).');
      submittingRef.current = false;
      return;
    }

    setLoading(true);

    const payload: Record<string, unknown> = {
      full_name: fullName,
      phone: form.phone ?? '',
      gender: form.gender ?? '',
      birth_date: form.birth_date ?? '',
      city: form.city ?? '',
      district: form.district ?? '',
      school_name: form.school_name ?? '',
    };
    if (role === 'student') {
      payload.grade = form.grade ?? '';
      payload.is_graduated = !!form.is_graduated;
    } else {
      payload.branch = form.branch ?? '';
    }
    if (isAdminMode) {
      payload.target_user_id = targetUserId;
    }

    try {
      const res = await secureFetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error || 'Güncelleme başarısız.');
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      setSuccess(true);
      setLoading(false);
      submittingRef.current = false;

      // 1.2 sn sonra modalı kapat ve callback çağır
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-2 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="fixed inset-0 bg-black/70 backdrop-blur-md animate-[edit-fadein_0.2s]" onClick={onClose} />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative z-10 w-full max-w-2xl my-4 sm:my-8 bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[edit-pop_0.3s_cubic-bezier(0.22,1,0.36,1)]"
      >
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${theme.gradient} p-5 sm:p-6 text-white`}>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur transition flex items-center justify-center"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 shadow-lg">
              <User className="w-6 h-6" />
            </div>
            <div className="pr-10">
              <h2 className="text-lg sm:text-xl font-extrabold leading-tight">
                {isAdminMode
                  ? (role === 'student' ? 'Öğrenci Bilgilerini Düzenle' : 'Öğretmen Bilgilerini Düzenle')
                  : 'Profilimi Düzenle'}
              </h2>
              <p className="text-white/90 text-[12px] sm:text-sm mt-0.5">
                {isAdminMode ? 'Yönetici olarak değişiklik yapıyorsunuz' : 'Bilgilerinizi güncelleyebilirsiniz'}
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto space-y-4">
          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Başarıyla güncellendi.</span>
            </div>
          )}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ad Soyad */}
          <Field icon={User} label="Ad Soyad" accentBg={theme.accentBg}>
            <input
              type="text"
              value={form.full_name ?? ''}
              onChange={(e) => update('full_name', e.target.value)}
              className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 ${theme.accentBorder}`}
              maxLength={120}
              required
            />
          </Field>

          {/* Telefon */}
          <Field icon={Phone} label="Telefon" accentBg={theme.accentBg}>
            <input
              type="tel"
              value={form.phone ?? ''}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="0532 123 45 67"
              className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 ${theme.accentBorder}`}
              maxLength={20}
            />
          </Field>

          {/* Cinsiyet + Doğum Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field icon={Users} label="Cinsiyet" accentBg={theme.accentBg}>
              <select
                value={form.gender ?? ''}
                onChange={(e) => update('gender', e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 ${theme.accentBorder}`}
              >
                <option value="">Seçiniz</option>
                <option value="erkek">Erkek</option>
                <option value="kadin">Kadın</option>
              </select>
            </Field>

            <Field icon={Calendar} label="Doğum Tarihi" accentBg={theme.accentBg}>
              <input
                type="date"
                value={form.birth_date ?? ''}
                onChange={(e) => update('birth_date', e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 ${theme.accentBorder}`}
              />
            </Field>
          </div>

          {/* İl + İlçe */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field icon={MapPin} label="İl" accentBg={theme.accentBg}>
              <input
                type="text"
                value={form.city ?? ''}
                onChange={(e) => update('city', e.target.value)}
                placeholder="Ankara"
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 ${theme.accentBorder}`}
                maxLength={80}
              />
            </Field>
            <Field icon={MapPin} label="İlçe" accentBg={theme.accentBg}>
              <input
                type="text"
                value={form.district ?? ''}
                onChange={(e) => update('district', e.target.value)}
                placeholder="Çankaya"
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 ${theme.accentBorder}`}
                maxLength={80}
              />
            </Field>
          </div>

          {/* Okul */}
          <Field icon={SchoolIcon} label="Okul Adı" accentBg={theme.accentBg}>
            <input
              type="text"
              value={form.school_name ?? ''}
              onChange={(e) => update('school_name', e.target.value)}
              placeholder="Atatürk Anadolu Lisesi"
              className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 ${theme.accentBorder}`}
              maxLength={200}
            />
          </Field>

          {/* Role-specific: STUDENT */}
          {role === 'student' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field icon={BookOpen} label="Sınıf" accentBg={theme.accentBg}>
                <select
                  value={form.grade ?? ''}
                  onChange={(e) => update('grade', e.target.value)}
                  disabled={!!form.is_graduated}
                  className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 ${theme.accentBorder} disabled:opacity-50`}
                >
                  <option value="">Seçiniz</option>
                  {STUDENT_GRADES.map((g) => (
                    <option key={g.value} value={g.value}>{g.label}</option>
                  ))}
                </select>
              </Field>

              <Field icon={GraduationCap} label="Durum" accentBg={theme.accentBg}>
                <label className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 bg-white cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={!!form.is_graduated}
                    onChange={(e) => update('is_graduated', e.target.checked)}
                    className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500"
                  />
                  <span className="font-semibold">Mezunum</span>
                </label>
              </Field>
            </div>
          )}

          {/* Role-specific: TEACHER */}
          {role === 'teacher' && (
            <Field icon={Briefcase} label="Branş" accentBg={theme.accentBg}>
              <input
                type="text"
                value={form.branch ?? ''}
                onChange={(e) => update('branch', e.target.value)}
                placeholder="Matematik"
                className={`w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 ${theme.accentBorder}`}
                maxLength={80}
              />
            </Field>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 dark:border-slate-700 p-4 sm:p-5 flex items-center justify-end gap-2 bg-gray-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-sm font-bold transition disabled:opacity-50"
          >
            Vazgeç
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className={`px-5 py-2.5 rounded-xl bg-gradient-to-r ${theme.gradient} text-white text-sm font-bold shadow-md hover:shadow-lg transition active:scale-[0.98] disabled:opacity-60 flex items-center gap-2`}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {success ? 'Kaydedildi ✓' : loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </button>
        </div>
      </form>

      <style jsx global>{`
        @keyframes edit-fadein { from { opacity: 0 } to { opacity: 1 } }
        @keyframes edit-pop {
          from { opacity: 0; transform: translateY(16px) scale(0.97) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
      `}</style>
    </div>
  );
}

function Field({
  icon: Icon, label, accentBg, children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  accentBg: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[12px] font-bold text-gray-600 dark:text-slate-400 mb-1.5">
        <span className={`w-4 h-4 rounded ${accentBg} flex items-center justify-center`}>
          <Icon className="w-2.5 h-2.5 text-white" />
        </span>
        {label}
      </label>
      {children}
    </div>
  );
}
