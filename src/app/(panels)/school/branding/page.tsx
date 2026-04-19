'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Palette, Save, Loader2, CheckCircle2, Image as ImageIcon, Eye, Building } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SectionCard from '@/components/ui/SectionCard';

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#7c3aed');
  const [secondaryColor, setSecondaryColor] = useState('#0f2847');
  const [displayName, setDisplayName] = useState('');
  const [customFooter, setCustomFooter] = useState('');

  useEffect(() => { loadBranding(); }, []);

  async function loadBranding() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.school_id) return;

      const { data } = await supabase
        .from('school_branding')
        .select('*')
        .eq('school_id', profile.school_id)
        .maybeSingle();

      if (data) {
        setLogoUrl(data.logo_url || '');
        setPrimaryColor(data.primary_color || '#7c3aed');
        setSecondaryColor(data.secondary_color || '#0f2847');
        setDisplayName(data.school_display_name || '');
        setCustomFooter(data.custom_footer || '');
      }
    } catch (err) {
      console.error('Marka bilgisi yüklenemedi:', err);
    } finally {
      setLoading(false);
    }
  }

  async function saveBranding() {
    setSaving(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('school_id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile?.school_id) return;

      const brandingData = {
        school_id: profile.school_id,
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        school_display_name: displayName,
        custom_footer: customFooter,
        updated_at: new Date().toISOString(),
      };

      const { data: existing } = await supabase
        .from('school_branding')
        .select('id')
        .eq('school_id', profile.school_id)
        .maybeSingle();

      if (existing) {
        await supabase.from('school_branding').update(brandingData).eq('school_id', profile.school_id);
      } else {
        await supabase.from('school_branding').insert(brandingData);
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Kaydetme hatası:', err);
      alert('Kaydedilirken hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center animate-pulse shadow-lg">
          <Palette className="w-6 h-6 text-white" />
        </div>
        <p className="text-gray-500 text-sm font-medium">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        role="school_admin"
        icon={Palette}
        title="Okul Markalaması"
        subtitle="Platformu okulunuzun renkleri ve logosuyla özelleştirin"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sol: Ayarlar */}
        <div className="space-y-5">
          <SectionCard
            icon={ImageIcon}
            title="Logo & İsim"
            subtitle="Okulunuzun kimlik bilgileri"
            gradient="from-sky-500 to-blue-600"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Okul Görünen Adı</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Örn: Ankara Fen Lisesi"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
                />
                <p className="text-[11.5px] text-gray-500 mt-1.5">PNG veya SVG, önerilen boyut: 200×60px</p>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Alt Bilgi Metni</label>
                <input
                  type="text"
                  value={customFooter}
                  onChange={e => setCustomFooter(e.target.value)}
                  placeholder="© 2026 Okulunuzun Adı"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
                />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            icon={Palette}
            title="Renkler"
            subtitle="Marka paletinizi belirleyin"
            gradient="from-violet-500 via-purple-500 to-fuchsia-600"
            delay={80}
          >
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">Ana Renk</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border-2 border-white ring-1 ring-gray-200">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="absolute inset-[-2px] w-14 h-14 cursor-pointer border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[13px] font-bold text-gray-700 mb-1.5">İkincil Renk</label>
                <div className="flex items-center gap-2">
                  <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-md border-2 border-white ring-1 ring-gray-200">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={e => setSecondaryColor(e.target.value)}
                      className="absolute inset-[-2px] w-14 h-14 cursor-pointer border-0"
                    />
                  </div>
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="flex-1 px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                  />
                </div>
              </div>
            </div>
          </SectionCard>

          <button
            onClick={saveBranding}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-600 text-white font-extrabold text-[13.5px] shadow-lg shadow-violet-500/40 hover:shadow-xl hover:shadow-violet-500/50 hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none transition-all active:scale-[0.97]"
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Kaydediliyor...</>
            ) : saved ? (
              <><CheckCircle2 className="w-4 h-4" /> Kaydedildi!</>
            ) : (
              <><Save className="w-4 h-4" /> Kaydet</>
            )}
          </button>
        </div>

        {/* Sağ: Önizleme */}
        <SectionCard
          icon={Eye}
          title="Canlı Önizleme"
          subtitle="Değişiklikleriniz gerçek zamanlı görünür"
          gradient="from-emerald-500 to-teal-600"
          delay={160}
        >
          <div className="relative border-2 border-gray-200 rounded-2xl overflow-hidden shadow-lg">
            {/* Header preview */}
            <div
              className="relative p-5 text-white overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
              }}
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-center gap-3">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-10 object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="w-10 h-10 bg-white/25 backdrop-blur-md rounded-xl flex items-center justify-center text-xl shadow-md border border-white/20">
                    🎓
                  </div>
                )}
                <div>
                  <p className="font-extrabold text-[15px] drop-shadow-sm">{displayName || 'Eğitim Check-Up'}</p>
                  <p className="text-[11.5px] opacity-85">Psikometrik Test Platformu</p>
                </div>
              </div>
            </div>

            {/* Body preview */}
            <div className="p-5">
              <div className="flex gap-2 mb-4">
                <div className="h-2.5 rounded-full flex-1 shadow-sm" style={{ backgroundColor: primaryColor }} />
                <div className="h-2.5 rounded-full flex-1 shadow-sm" style={{ backgroundColor: secondaryColor }} />
                <div className="h-2.5 rounded-full flex-1 bg-gray-200" />
              </div>
              <div className="h-24 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl mb-3 flex items-center justify-center text-[12px] text-gray-400 font-semibold border border-gray-100">
                İçerik Alanı
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 py-2 rounded-lg text-white text-[11px] font-bold shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Ana Buton
                </button>
                <button
                  className="flex-1 py-2 rounded-lg text-white text-[11px] font-bold shadow-sm"
                  style={{ backgroundColor: secondaryColor }}
                >
                  İkincil
                </button>
              </div>
              <p className="text-[11px] text-gray-400 text-center mt-3 font-medium">
                {customFooter || '© 2026 Eğitim Check-Up'}
              </p>
            </div>
          </div>

          {/* Info card */}
          <div className="mt-4 p-3 rounded-xl bg-sky-50 border border-sky-200 text-[12px] text-sky-700 flex items-center gap-2">
            <Building className="w-4 h-4 shrink-0" />
            <p>Değişiklikler kaydedildikten sonra tüm okul kullanıcılarında görünür.</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
