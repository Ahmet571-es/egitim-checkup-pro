'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, AtSign, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ROLE_PATHS } from '@/types';
import type { UserRole } from '@/types';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const submittingRef = useRef(false);
  const router = useRouter();

  // Kullanıcı adından e-posta üret
  const usernameToEmail = (val: string) => {
    const clean = val.trim().toLowerCase().replace(/\s/g, '');
    return `${clean}@ogrenci.egitimcheckup.com`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;

    if (password.trim().length < 6) {
      setError('Şifre en az 6 karakter olmalı (boşluklar sayılmaz).');
      submittingRef.current = false;
      return;
    }

    if (!username.trim()) {
      setError('Kullanıcı adı girin.');
      submittingRef.current = false;
      return;
    }

    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const email = usernameToEmail(username);
      const { error: authError, data } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError(
          authError.message === 'Invalid login credentials'
            ? 'Kullanıcı adı veya şifre hatalı.'
            : authError.message
        );
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      let role: UserRole | undefined = data.user?.user_metadata?.role as UserRole | undefined;
      if (!role && data.user?.id) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();
          if (profile?.role) role = profile.role as UserRole;
        } catch {
          // ignore
        }
      }
      const target = ROLE_PATHS[role ?? 'student'] ?? '/student/dashboard';

      if (typeof window !== 'undefined') {
        window.location.href = target;
      } else {
        router.push(target);
      }
    } catch (err) {
      console.error('[login] unexpected error:', err);
      setError('Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.');
      setLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-[#f0f5ff] via-[#f8fafc] to-[#f0fdf8] px-4">
      <div className="fixed top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-emerald-200/30 to-teal-200/20 blur-3xl" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-blue-200/30 to-indigo-200/20 blur-3xl" />

      <div className="relative w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-[#0f2847]">Eğitim Check-Up</h1>
        </Link>

        <div className="bg-white/72 backdrop-blur-[20px] rounded-3xl border border-white/40 shadow-xl p-8">
          <h2 className="text-2xl font-extrabold text-[#0f2847] text-center mb-1">Giriş Yap</h2>
          <p className="text-sm text-gray-500 text-center mb-8">Kullanıcı adınız ve şifreniz ile giriş yapın</p>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Kullanıcı Adı</label>
              <div className="relative">
                <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="ad_soyad"
                  maxLength={100}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Kayıt olurken belirlediğiniz ad_soyad formatındaki kullanıcı adınız</p>
            </div>
            <div>
              <label className="block text-[13px] font-semibold text-gray-700 mb-1.5">Şifre</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" maxLength={72} className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white/60 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition-all" required />
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {loading ? 'Giriş yapılıyor...' : <>Giriş Yap <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Hesabınız yok mu?{' '}
            <Link href="/register" className="text-emerald-600 font-semibold hover:underline">Kayıt Olun</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
