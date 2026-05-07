'use client';

/**
 * /sifre-degistir
 *
 * Geçici şifre ile giriş yapan kullanıcının kalıcı şifresini belirlediği sayfa.
 * Akış:
 *   1. Yönetici kullanıcıya tek kullanımlık şifre atar (must_change_password=true)
 *   2. Kullanıcı bu şifreyle login olur
 *   3. Login başarılı → bu sayfaya yönlendirilir
 *   4. Kullanıcı kalıcı şifresini iki kez girer
 *   5. POST /api/auth/change-password çağrılır → flag temizlenir
 *   6. Rolüne uygun panele yönlendirilir
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/ui/AuthLayout';
import { ROLE_PATHS, type UserRole } from '@/types';

export default function SifreDegistirPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('student');
  const [pw1, setPw1] = useState('');
  const [pw2, setPw2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);

  // Sayfa yüklenince oturum kontrolü
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/login');
        return;
      }
      setEmail(user.email || '');
      const r = (user.user_metadata?.role as UserRole) || 'student';
      setRole(r);
      setAuthChecked(true);
    })();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (pw1.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.');
      return;
    }
    if (pw1 !== pw2) {
      setError('Şifreler eşleşmiyor. Lütfen iki kutuya da aynı şifreyi yazın.');
      return;
    }

    setLoading(true);
    try {
      // CSRF token cookie'den oku (proxy zaten /api/auth/* için CSRF muaf, ama header gönderelim)
      const csrf = document.cookie
        .split('; ')
        .find((c) => c.startsWith('csrf_token='))
        ?.split('=')[1] || '';

      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrf,
        },
        body: JSON.stringify({ new_password: pw1 }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Şifre güncellenemedi.');
        setLoading(false);
        return;
      }

      // Başarılı — kullanıcıya kısa bilgi göster, sonra paneline gönder
      setDone(true);
      setTimeout(() => {
        const target = ROLE_PATHS[role] ?? '/student/dashboard';
        // window.location ile sert yönlendirme — proxy.ts'in yeni session'ı görmesi için
        if (typeof window !== 'undefined') {
          window.location.href = target;
        } else {
          router.push(target);
        }
      }, 1500);
    } catch {
      setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
    }
  };

  // Auth check tamamlanmadan loading göster
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400 text-sm">Yükleniyor...</div>
      </div>
    );
  }

  // Layout role'u (admin → admin, school_admin → admin renkleri)
  const layoutRole: 'student' | 'teacher' | 'parent' | 'admin' =
    role === 'school_admin' ? 'admin' :
    (role as 'student' | 'teacher' | 'parent' | 'admin');

  return (
    <AuthLayout
      role={layoutRole}
      title="Kalıcı Şifre Belirle"
      subtitle="Devam etmeden önce kullanmak istediğin yeni şifreni belirle"
    >
      {done ? (
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">
            Şifren güncellendi
          </h3>
          <p className="text-sm text-gray-600">
            Panele yönlendiriliyorsun...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* E-posta (read-only bilgi) */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-700">
            <span className="text-gray-500 font-semibold">Hesap:</span> {email}
          </div>

          {/* Yeni şifre */}
          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
              Yeni Şifre
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={show1 ? 'text' : 'password'}
                value={pw1}
                onChange={(e) => setPw1(e.target.value)}
                placeholder="En az 6 karakter"
                disabled={loading}
                autoComplete="new-password"
                className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all disabled:bg-gray-50"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShow1((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {show1 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Yeni şifre tekrar */}
          <div>
            <label className="block text-[12px] font-bold text-gray-700 mb-1.5">
              Yeni Şifre (Tekrar)
            </label>
            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={show2 ? 'text' : 'password'}
                value={pw2}
                onChange={(e) => setPw2(e.target.value)}
                placeholder="Aynı şifreyi tekrar yaz"
                disabled={loading}
                autoComplete="new-password"
                className="w-full pl-11 pr-11 py-2.5 rounded-xl border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all disabled:bg-gray-50"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShow2((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
              >
                {show2 ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-[13px]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !pw1 || !pw2}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white text-sm font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Kaydediliyor...' : 'Şifreyi Kaydet'}
          </button>

          <p className="text-[11px] text-gray-500 text-center">
            Şifreni belirledikten sonra geçici şifre artık çalışmayacak. Bir sonraki girişte bu yeni şifreyi kullanmalısın.
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
