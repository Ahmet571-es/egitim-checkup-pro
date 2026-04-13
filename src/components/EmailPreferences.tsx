'use client';

/**
 * E-posta Bildirim Tercihleri Bileşeni
 * Profil sayfasına entegre edilir.
 * Supabase profiles.email_preferences JSONB sütununu kullanır.
 */
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Bell, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EmailPrefs {
  welcome: boolean;
  test_assigned: boolean;
  test_completed: boolean;
  report_ready: boolean;
  license_expiring: boolean;
  license_expired: boolean;
}

const DEFAULT_PREFS: EmailPrefs = {
  welcome: true,
  test_assigned: true,
  test_completed: true,
  report_ready: true,
  license_expiring: true,
  license_expired: true,
};

const PREF_LABELS: { key: keyof EmailPrefs; label: string; desc: string; roles: string[] }[] = [
  {
    key: 'welcome',
    label: 'Hoş Geldin E-postası',
    desc: 'Kayıt sonrası gönderilen karşılama e-postası',
    roles: ['admin', 'school_admin', 'teacher', 'student', 'parent'],
  },
  {
    key: 'test_assigned',
    label: 'Test Atandı Bildirimi',
    desc: 'Size yeni bir test atandığında bildirim alın',
    roles: ['student'],
  },
  {
    key: 'test_completed',
    label: 'Test Tamamlandı Bildirimi',
    desc: 'Öğrenciniz bir testi tamamladığında bildirim alın',
    roles: ['teacher'],
  },
  {
    key: 'report_ready',
    label: 'Rapor Hazır Bildirimi',
    desc: 'Çocuğunuz için rapor hazırlandığında bildirim alın',
    roles: ['parent'],
  },
  {
    key: 'license_expiring',
    label: 'Lisans Bitiş Uyarısı',
    desc: 'Lisansınız dolmak üzere olduğunda uyarı alın',
    roles: ['admin', 'school_admin'],
  },
  {
    key: 'license_expired',
    label: 'Lisans Sona Erdi Bildirimi',
    desc: 'Lisansınız sona erdiğinde bildirim alın',
    roles: ['admin', 'school_admin'],
  },
];

interface Props {
  userId: string;
  userRole: string;
  initialPrefs?: Partial<EmailPrefs>;
}

export default function EmailPreferences({ userId, userRole, initialPrefs }: Props) {
  const [prefs, setPrefs] = useState<EmailPrefs>({ ...DEFAULT_PREFS, ...initialPrefs });
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const supabase = createClient();

  const relevantPrefs = PREF_LABELS.filter(p => p.roles.includes(userRole));

  async function handleToggle(key: keyof EmailPrefs) {
    const newPrefs = { ...prefs, [key]: !prefs[key] };
    setPrefs(newPrefs);
  }

  async function handleSave() {
    setSaving(true);
    setStatus('idle');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_preferences: prefs })
        .eq('id', userId);

      if (error) {
        setStatus('error');
      } else {
        setStatus('success');
        setTimeout(() => setStatus('idle'), 3000);
      }
    } catch {
      setStatus('error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <Bell className="w-4 h-4 text-emerald-500" />
        <h3 className="font-extrabold text-[#0f2847] text-base">E-posta Bildirimleri</h3>
      </div>

      <div className="p-6 space-y-4">
        {relevantPrefs.length === 0 && (
          <p className="text-gray-400 text-sm text-center py-4">
            Bu rol için yapılandırılabilir bildirim yok.
          </p>
        )}

        {relevantPrefs.map(pref => (
          <div key={pref.key} className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#0f2847]">{pref.label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{pref.desc}</p>
            </div>
            {/* Toggle */}
            <button
              onClick={() => handleToggle(pref.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${
                prefs[pref.key] ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={prefs[pref.key]}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                  prefs[pref.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}

        {/* Kaydet */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0f2847] text-white text-sm font-bold hover:bg-[#1a3d6e] disabled:opacity-50 transition-all"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Kaydediliyor...
              </>
            ) : (
              'Tercihleri Kaydet'
            )}
          </button>

          {status === 'success' && (
            <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
              <CheckCircle className="w-4 h-4" />
              Kaydedildi
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1.5 text-red-600 text-sm font-semibold">
              <AlertCircle className="w-4 h-4" />
              Bir hata oluştu
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
