'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Mail, CheckCircle2, AlertCircle, ArrowRight, ArrowLeft,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import AuthLayout from '@/components/ui/AuthLayout';

/**
 * Öğrenci Şifremi Unuttum — Supabase native reset
 *
 *   1) E-posta gir + "Sıfırlama Linki Gönder"
 *      → supabase.auth.resetPasswordForEmail(email, { redirectTo: '/reset-password' })
 *      → Supabase otomatik mail atar (kendi e-posta servisi, herkese çalışır)
 *   2) Başarı ekranı: "E-postanızı kontrol edin"
 *   3) Kullanıcı maildeki linki tıklar → /reset-password sayfasına gelir → yeni şifre
 */
export default function TeacherForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@') || !trimmed.includes('.')) {
      setError('Lütfen geçerli bir e-posta adresi girin.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: `${origin}/reset-password`,
      });

      if (resetError) {
        // Rate limit hatası özel mesaj
        if (resetError.message.toLowerCase().includes('rate') || resetError.message.toLowerCase().includes('limit')) {
          setError('Çok fazla istek gönderildi. Lütfen 1 saat sonra tekrar deneyin.');
        } else {
          setError('Bir hata oluştu. Lütfen tekrar deneyin.');
        }
        setLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Başarı ekranı
  if (sent) {
    return (
      <AuthLayout
        role="teacher"
        title="E-postanızı Kontrol Edin"
        subtitle="Şifre sıfırlama bağlantısı gönderildi"
      >
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 text-center">
            <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <p className="text-sm font-extrabold text-emerald-700 mb-1">
              Bağlantı gönderildi
            </p>
            <p className="text-[13px] text-gray-700 break-all mb-2">
              <strong>{email.trim().toLowerCase()}</strong>
            </p>
            <p className="text-[12.5px] text-gray-600">
              Gelen kutunu kontrol et. <strong>Spam/Junk</strong> klasörüne de bakmayı unutma.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-[12.5px] text-blue-800">
            <p className="font-semibold mb-1">📌 Sonraki adımlar:</p>
            <ol className="space-y-0.5 ml-4 list-decimal">
              <li>E-postandaki bağlantıya tıkla</li>
              <li>Yeni şifreni belirle</li>
              <li>Yeni şifrenle giriş yap</li>
            </ol>
          </div>

          <Link
            href="/login/ogretmen"
            className="block text-center py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all"
          >
            Giriş Sayfasına Dön
          </Link>

          <button
            type="button"
            onClick={() => { setSent(false); setEmail(''); }}
            className="w-full py-2.5 text-[12.5px] text-gray-500 hover:text-emerald-600 font-semibold transition"
          >
            E-posta gelmediyse tekrar dene
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      role="teacher"
      title="Şifremi Unuttum"
      subtitle="Şifre sıfırlama bağlantısı için e-posta adresinizi girin"
      footer={
        <Link
          href="/login/ogretmen"
          className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-emerald-600 font-semibold transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Giriş sayfasına dön
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
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-[13px] text-amber-800">
          Kayıtlı e-posta adresine bir şifre sıfırlama bağlantısı göndereceğiz.
          E-postanı açıp bağlantıya tıklaman yeterli.
        </div>

        <div>
          <label className="block text-[13px] font-bold text-gray-700 mb-1.5">
            E-posta Adresi
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@email.com"
              autoFocus
              autoComplete="email"
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Gönderiliyor...
            </>
          ) : (
            <>Sıfırlama Linki Gönder <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
