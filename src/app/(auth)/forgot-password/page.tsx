'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/ui/AuthLayout';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Beklenmeyen bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthLayout
        role="student"
        title="E-posta Gönderildi!"
        subtitle={`${email} adresine şifre sıfırlama bağlantısı gönderildi.`}
        footer={
          <Link href="/login" className="inline-flex items-center gap-2 text-[13px] font-extrabold text-violet-600 hover:text-violet-700 hover:underline transition">
            <ArrowLeft className="w-4 h-4" /> Giriş sayfasına dön
          </Link>
        }
      >
        <div className="text-center py-4">
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40 success-bounce">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <p className="text-[14px] text-gray-600 leading-relaxed">
            Lütfen gelen kutunuzu kontrol edin. E-posta birkaç dakika içinde ulaşacak.
          </p>
          <p className="text-[12px] text-gray-400 mt-2">
            E-posta görünmüyorsa spam/gereksiz kutusuna bakın.
          </p>
        </div>
        <style>{`
          @keyframes success-bounce {
            0% { transform: scale(0) rotate(-180deg); opacity: 0; }
            50% { transform: scale(1.15) rotate(10deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          .success-bounce {
            animation: success-bounce 700ms cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
          }
        `}</style>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      role="student"
      title="Şifremi Unuttum"
      subtitle="E-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim"
      footer={
        <Link href="/login" className="inline-flex items-center gap-1.5 text-[13px] font-extrabold text-violet-600 hover:text-violet-700 hover:underline transition">
          <ArrowLeft className="w-3.5 h-3.5" /> Giriş sayfasına dön
        </Link>
      }
    >
      {error && (
        <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 flex items-center gap-2 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">E-posta</label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-md pointer-events-none">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@okul.edu.tr"
              className="w-full pl-14 pr-4 py-3.5 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
              required
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white text-[14px] font-extrabold shadow-lg shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-500/50 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              Sıfırlama Bağlantısı Gönder
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
