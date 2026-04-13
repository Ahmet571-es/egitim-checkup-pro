'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Palette, Save, Loader2, CheckCircle2, Image } from 'lucide-react';

export default function BrandingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#7c3aed');
  const [secondaryColor, setSecondaryColor] = useState('#0f2847');
  const [displayName, setDisplayName] = useState('');
  const [customFooter, setCustomFooter] = useState('');

  useEffect(() => {
    loadBranding();
  }, []);

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
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-[#0f2847] mb-2">Okul Markalaması</h1>
      <p className="text-gray-500 text-sm mb-6">Platformu okulunuzun renkleri ve logosuyla özelleştirin</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ayarlar */}
        <div className="space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0f2847] mb-4 flex items-center gap-2">
              <Image className="w-4 h-4" /> Logo & İsim
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Okul Görünen Adı</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Örn: Ankara Fen Lisesi"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
                <p className="text-xs text-gray-400 mt-1">PNG veya SVG, önerilen boyut: 200x60px</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Alt Bilgi Metni</label>
                <input
                  type="text"
                  value={customFooter}
                  onChange={e => setCustomFooter(e.target.value)}
                  placeholder="© 2026 Okulunuzun Adı"
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6">
            <h3 className="text-sm font-bold text-[#0f2847] mb-4 flex items-center gap-2">
              <Palette className="w-4 h-4" /> Renkler
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Ana Renk</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">İkincil Renk</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border-0 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={saveBranding}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? 'Kaydedildi!' : 'Kaydet'}
          </button>
        </div>

        {/* Önizleme */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm p-6">
          <h3 className="text-sm font-bold text-[#0f2847] mb-4">Önizleme</h3>

          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="p-4 text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
              <div className="flex items-center gap-3">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-8 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-lg">🎓</div>
                )}
                <div>
                  <p className="font-bold text-sm">{displayName || 'Eğitim Check-Up'}</p>
                  <p className="text-xs opacity-75">Psikometrik Test Platformu</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="flex gap-2 mb-3">
                <div className="h-2 rounded-full flex-1" style={{ backgroundColor: primaryColor }} />
                <div className="h-2 rounded-full flex-1" style={{ backgroundColor: secondaryColor }} />
                <div className="h-2 rounded-full flex-1 bg-gray-200" />
              </div>
              <div className="h-20 bg-gray-50 rounded-lg mb-3 flex items-center justify-center text-xs text-gray-400">
                İçerik Alanı
              </div>
              <p className="text-xs text-gray-400 text-center">
                {customFooter || '© 2026 Eğitim Check-Up'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
