'use client';
/**
 * Faz 2: Öğretmen panelinde "Öğrenci Ekle" modal'ı
 * Öğretmen ad-soyad, e-posta, şifre, sınıf ve şube girer.
 * Backend: POST /api/teacher/students { action: 'create', ... }
 *
 * Notlar:
 * - Mail doğrulama atlanır (email_confirm: true) — öğretmen şifreyi öğrenciye iletecek.
 * - Öğrencinin school_id'si öğretmenin profile'ından gelir.
 * - Başarılıysa email + şifreyi gösterir, kopyalama kolaylaştırır.
 */
import { useState, useRef, useEffect } from 'react';
import { secureFetch } from '@/lib/csrf-client';
import {
  X, User, Mail, Lock, GraduationCap, Hash, AlertCircle, CheckCircle2,
  Eye, EyeOff, Copy, UserPlus
} from 'lucide-react';

const GRADES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

interface AddStudentModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; // listeyi yenilemek için
}

export default function AddStudentModal({ open, onClose, onSuccess }: AddStudentModalProps) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    grade: '',
    section: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ name: string; email: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);
  const submittingRef = useRef(false);

  // Modal kapandığında state sıfırla
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setForm({ full_name: '', email: '', password: '', grade: '', section: '' });
        setError('');
        setSuccess(null);
        setShowPassword(false);
        submittingRef.current = false;
      }, 200);
    }
  }, [open]);

  // ESC ile kapat
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const update = (key: keyof typeof form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const generatePassword = () => {
    const lower = 'abcdefghjkmnpqrstuvwxyz';
    const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const digits = '23456789';
    const all = lower + upper + digits;
    let pw = '';
    pw += upper[Math.floor(Math.random() * upper.length)];
    pw += lower[Math.floor(Math.random() * lower.length)];
    pw += digits[Math.floor(Math.random() * digits.length)];
    pw += digits[Math.floor(Math.random() * digits.length)];
    for (let i = 0; i < 6; i++) pw += all[Math.floor(Math.random() * all.length)];
    update('password', pw);
  };

  const validate = (): string | null => {
    if (!form.full_name.trim()) return 'Ad-soyad zorunludur.';
    if (form.full_name.trim().split(/\s+/).length < 2) return 'Lütfen ad ve soyadı birlikte girin.';
    if (!form.email.trim() || !form.email.includes('@')) return 'Geçerli bir e-posta girin.';
    if (form.password.length < 8) return 'Şifre en az 8 karakter olmalı.';
    if (!form.grade) return 'Sınıf seçimi zorunludur.';
    return null;
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const res = await secureFetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          grade: form.grade,
          section: form.section.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Öğrenci eklenemedi.');
        submittingRef.current = false;
        setLoading(false);
        return;
      }

      // Başarılı → bilgileri göster
      setSuccess({
        name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      setLoading(false);
      submittingRef.current = false;
      onSuccess();
    } catch {
      setError('Bağlantı hatası. Tekrar deneyin.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  const copyToClipboard = async (text: string, field: 'email' | 'password') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    } catch {
      // sessizce yut
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#0f2847]">
                {success ? 'Öğrenci Eklendi!' : 'Yeni Öğrenci Ekle'}
              </h2>
              <p className="text-xs text-gray-500">
                {success ? 'Giriş bilgilerini öğrenciye iletin' : 'Öğrenciye atanmış olarak oluşturulur'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="w-9 h-9 rounded-lg hover:bg-gray-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* SUCCESS STATE */}
          {success && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-extrabold text-[#0f2847] mb-1">{success.name}</h3>
                <p className="text-sm text-gray-600">başarıyla eklendi.</p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <p className="text-[13px] font-bold text-amber-900 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Giriş bilgilerini öğrenciye iletin
                </p>
                <p className="text-[12px] text-amber-800">
                  Bu bilgiler bir daha gösterilmeyecek. Kopyalayın ve öğrenciye güvenli şekilde iletin. Öğrenci ilk girişinden sonra şifresini değiştirebilir.
                </p>
              </div>

              <div className="space-y-2">
                {/* Email */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">E-posta</div>
                    <div className="text-sm font-mono text-[#0f2847] truncate">{success.email}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(success.email, 'email')}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-[12px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                  >
                    {copiedField === 'email' ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kopyalandı</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Kopyala</>
                    )}
                  </button>
                </div>

                {/* Password */}
                <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Şifre</div>
                    <div className="text-sm font-mono text-[#0f2847]">{success.password}</div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(success.password, 'password')}
                    className="px-3 py-2 rounded-lg bg-white hover:bg-gray-100 border border-gray-200 text-[12px] font-semibold flex items-center gap-1 transition-colors shrink-0"
                  >
                    {copiedField === 'password' ? (
                      <><CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Kopyalandı</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> Kopyala</>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    // Form'u sıfırla, success'i kapat — yeni öğrenci ekleme akışına dön
                    setForm({ full_name: '', email: '', password: '', grade: '', section: '' });
                    setSuccess(null);
                    setError('');
                    setShowPassword(false);
                  }}
                  className="flex-1 py-3 rounded-xl border border-emerald-200 hover:bg-emerald-50 text-emerald-700 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Yeni Öğrenci Ekle
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-[#0f2847] hover:bg-[#1a3a5f] text-white font-extrabold transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          )}

          {/* FORM STATE */}
          {!success && (
            <form
              onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
              className="space-y-4"
            >
              {error && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2" role="alert">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[13px] text-rose-800">{error}</p>
                </div>
              )}

              {/* Ad-Soyad */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  Ad-Soyad <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={form.full_name}
                    onChange={(e) => update('full_name', e.target.value)}
                    placeholder="Ali Yılmaz"
                    aria-required="true"
                    className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                    autoFocus
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  E-posta <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="ogrenci@okul.com"
                    aria-required="true"
                    className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  />
                </div>
              </div>

              {/* Şifre */}
              <div>
                <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                  Geçici Şifre <span className="text-rose-500">*</span> <span className="text-gray-400 font-normal">(en az 8 karakter)</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="••••••••"
                    aria-required="true"
                    minLength={8}
                    className="w-full pl-11 pr-20 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-100 rounded transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4 text-gray-400" /> : <Eye className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={generatePassword}
                  className="mt-2 text-[12px] text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                >
                  ⚡ Otomatik şifre üret
                </button>
              </div>

              {/* Sınıf + Şube */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                    Sınıf <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <select
                      value={form.grade}
                      onChange={(e) => update('grade', e.target.value)}
                      aria-required="true"
                      className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                    >
                      <option value="">Seçin</option>
                      {GRADES.map((g) => (
                        <option key={g} value={g}>{g}. Sınıf</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
                    Şube <span className="text-gray-400 font-normal">(opsiyonel)</span>
                  </label>
                  <div className="relative">
                    <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={form.section}
                      onChange={(e) => update('section', e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="A"
                      maxLength={2}
                      className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all uppercase"
                    />
                  </div>
                </div>
              </div>

              {/* KVKK Bilgilendirme */}
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                  <strong>KVKK uyarısı:</strong> Öğrenci adı, e-posta ve sınıf bilgisi 6698 sayılı KVKK kapsamında
                  kişisel veridir. Bu bilgiler eğitim amaçlı kullanılır, üçüncü kişilerle paylaşılmaz.
                  Geçici şifreyi öğrenciye iletmeyi ve mümkünse ilk girişte şifreyi değiştirmesini öneririz.
                </p>
              </div>

              {/* Submit */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-extrabold shadow-lg shadow-emerald-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Ekleniyor...</>
                  ) : (
                    <><UserPlus className="w-4 h-4" /> Öğrenci Ekle</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
