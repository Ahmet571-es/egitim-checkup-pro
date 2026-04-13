'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, Type, Volume2 } from 'lucide-react';

export default function AccessibilityToggle() {
  const [highContrast, setHighContrast] = useState(false);
  const [largeFont, setLargeFont] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadPrefs();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
    document.documentElement.classList.toggle('large-font', largeFont);
  }, [highContrast, largeFont]);

  async function loadPrefs() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_preferences')
      .select('high_contrast, large_font, voice_mode')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setHighContrast(data.high_contrast);
      setLargeFont(data.large_font);
      setVoiceMode(data.voice_mode);
    }
  }

  async function savePref(key: string, value: boolean) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: existing } = await supabase
      .from('user_preferences')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      await supabase.from('user_preferences').update({ [key]: value }).eq('user_id', user.id);
    } else {
      await supabase.from('user_preferences').insert({ user_id: user.id, [key]: value });
    }
  }

  function toggle(key: 'high_contrast' | 'large_font' | 'voice_mode') {
    if (key === 'high_contrast') { setHighContrast(!highContrast); savePref(key, !highContrast); }
    if (key === 'large_font') { setLargeFont(!largeFont); savePref(key, !largeFont); }
    if (key === 'voice_mode') { setVoiceMode(!voiceMode); savePref(key, !voiceMode); }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-2 bg-white rounded-2xl shadow-xl border border-gray-200 p-4 w-64">
          <h4 className="text-sm font-bold text-[#0f2847] mb-3">Erişilebilirlik</h4>

          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <Eye className="w-4 h-4" /> Yüksek Kontrast
            </span>
            <div className={`w-10 h-5 rounded-full transition-colors ${highContrast ? 'bg-violet-500' : 'bg-gray-200'}`}
              onClick={() => toggle('high_contrast')}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${highContrast ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </div>
          </label>

          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <Type className="w-4 h-4" /> Büyük Yazı
            </span>
            <div className={`w-10 h-5 rounded-full transition-colors ${largeFont ? 'bg-violet-500' : 'bg-gray-200'}`}
              onClick={() => toggle('large_font')}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${largeFont ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </div>
          </label>

          <label className="flex items-center justify-between py-2 cursor-pointer">
            <span className="flex items-center gap-2 text-sm text-gray-600">
              <Volume2 className="w-4 h-4" /> Sesli Mod
            </span>
            <div className={`w-10 h-5 rounded-full transition-colors ${voiceMode ? 'bg-violet-500' : 'bg-gray-200'}`}
              onClick={() => toggle('voice_mode')}>
              <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${voiceMode ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'}`} />
            </div>
          </label>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-12 h-12 bg-violet-600 text-white rounded-full shadow-lg hover:bg-violet-700 flex items-center justify-center transition-all"
        aria-label="Erişilebilirlik ayarları"
      >
        <Eye className="w-5 h-5" />
      </button>
    </div>
  );
}
