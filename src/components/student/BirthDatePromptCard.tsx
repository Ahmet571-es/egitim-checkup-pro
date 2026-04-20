'use client';

import { useState } from 'react';
import { Calendar, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { validateBirthDate } from '@/lib/utils/age';

interface Props {
  currentBirthDate: string | null;
}

/**
 * Öğrenci profil sayfasında doğum tarihi eksikse uyarı + form gösterir.
 * Girilen tarihi hem user_metadata'ya hem de profiles tablosuna yazar.
 */
export default function BirthDatePromptCard({ currentBirthDate }: Props) {
  const [birthDate, setBirthDate] = useState<string>(currentBirthDate || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mevcut tarih varsa uyarı kartını gösterme
  if (currentBirthDate && currentBirthDate !== '—') {
    return null;
  }

  const handleSave = async () => {
    setError(null);
    const validation = validateBirthDate(birthDate);
    if (!validation.valid) {
      setError(validation.error || 'Geçersiz tarih');
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setError('Oturum bulunamadı. Lütfen tekrar giriş yapın.');
        setSaving(false);
        return;
      }

      // 1) user_metadata güncelle (auth tarafı)
      const { error: metaErr } = await supabase.auth.updateUser({
        data: { birth_date: birthDate },
      });
      if (metaErr) throw metaErr;

      // 2) profiles tablosunu güncelle (DB tarafı — yaşa göre test süreleri için)
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ birth_date: birthDate })
        .eq('id', userData.user.id);
      if (profErr) throw profErr;

      setSaved(true);
      // 2 saniye sonra sayfayı yenile — yeni bilgi UI'a yansısın
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Kaydetme başarısız.';
      setError(msg);
    }
    setSaving(false);
  };

  return (
    <div className="mb-4 relative bg-gradient-to-br from-amber-500/15 to-orange-500/10 border-2 border-amber-400/40 rounded-2xl p-5 backdrop-blur-xl overflow-hidden">
      <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-amber-400/20 blur-2xl" />
      <div className="relative">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-white font-extrabold text-[15px]">Doğum Tarihini Ekle</h3>
            <p className="text-white/80 text-[13px] mt-1 leading-relaxed">
              Bazı testler (örneğin <strong>Burdon Dikkat Testi</strong>) yaşa göre süre ayarlar.
              Doğru değerlendirme için doğum tarihini eklemen gerekiyor.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2 items-stretch sm:items-end" style={{ paddingLeft: '56px' }}>
          <div className="flex-1">
            <label className="block text-[11px] font-bold text-amber-200 uppercase tracking-wider mb-1.5">
              Doğum Tarihi
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={saving || saved}
              max={new Date().toISOString().split('T')[0]}
              min="1900-01-01"
              className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white text-[14px] font-medium focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/30 disabled:opacity-60"
            />
          </div>
          <button
            onClick={handleSave}
            disabled={saving || saved || !birthDate}
            className="px-5 py-2.5 bg-gradient-to-br from-amber-500 to-orange-600 text-white font-extrabold rounded-lg shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-[1.02] transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed text-[13px] inline-flex items-center gap-2"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Kaydedildi</>
            ) : (
              <><Save className="w-4 h-4" /> Kaydet</>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-start gap-2 text-[12px] text-rose-200 bg-rose-500/20 border border-rose-400/30 rounded-lg p-2.5" style={{ marginLeft: '56px' }}>
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
