'use client';

import { useCallback, useEffect, useState } from 'react';
import { Settings, Bell, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { CardGridSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';

interface Prefs {
  email_test_complete: boolean;
  email_report_ready: boolean;
  email_teacher_note: boolean;
  email_weekly_summary: boolean;
}

const DEFAULT_PREFS: Prefs = {
  email_test_complete: true,
  email_report_ready: true,
  email_teacher_note: true,
  email_weekly_summary: false,
};

interface PrefItem {
  key: keyof Prefs;
  title: string;
  description: string;
}

const PREF_ITEMS: PrefItem[] = [
  {
    key: 'email_teacher_note',
    title: 'Öğretmen Mesajları',
    description: 'Çocuğunuzun öğretmeni size bir mesaj gönderdiğinde e-posta ile bildirilir.',
  },
  {
    key: 'email_report_ready',
    title: 'Rapor Hazır Bildirimleri',
    description: 'Çocuğunuz için yeni bir veli raporu üretildiğinde e-posta ile bildirilir.',
  },
  {
    key: 'email_test_complete',
    title: 'Test Tamamlama Bildirimleri',
    description: 'Çocuğunuz bir testi tamamladığında e-posta ile bildirilir.',
  },
  {
    key: 'email_weekly_summary',
    title: 'Haftalık Özet',
    description: 'Her hafta çocuğunuzun gelişim özeti e-posta ile gönderilir. (Henüz aktif değil — yakında)',
  },
];

export default function ParentSettingsPage() {
  const toast = useToast();
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<keyof Prefs | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/parent/notification-preferences');
      const data = await res.json();
      if (res.ok && data.preferences) {
        setPrefs(data.preferences as Prefs);
      } else if (!res.ok) {
        toast.error('Tercihler yüklenemedi', data.error || 'Bilinmeyen hata.');
      }
    } catch {
      toast.error('Bağlantı hatası');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (key: keyof Prefs) => {
    const newValue = !prefs[key];
    setPrefs((p) => ({ ...p, [key]: newValue })); // optimistic
    setSaving(key);
    try {
      const csrf = typeof document !== 'undefined'
        ? document.cookie.split('; ').find((c) => c.startsWith('csrf_token='))?.split('=')[1]
        : undefined;
      const res = await fetch('/api/parent/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(csrf ? { 'x-csrf-token': csrf } : {}),
        },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error('Güncellenemedi', data.error || 'Bilinmeyen hata.');
        setPrefs((p) => ({ ...p, [key]: !newValue })); // revert
      }
    } catch {
      toast.error('Bağlantı hatası');
      setPrefs((p) => ({ ...p, [key]: !newValue })); // revert
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader role="parent" icon={Settings} title="Ayarlar" subtitle="Bildirim tercihleriniz" />
        <CardGridSkeleton count={4} cols={1} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        role="parent"
        icon={Settings}
        title="Ayarlar"
        subtitle="Bildirim tercihleri ve hesap ayarları"
      />

      <div className="mb-4 p-4 bg-pink-50/50 dark:bg-pink-950/20 border border-pink-200/50 dark:border-pink-900/30 rounded-2xl flex items-start gap-3">
        <Mail className="w-5 h-5 text-pink-600 dark:text-pink-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-pink-900 dark:text-pink-200">E-posta Bildirimleri</p>
          <p className="text-xs text-pink-700 dark:text-pink-300 mt-0.5">
            Hangi durumlarda e-posta almak istediğinizi seçin. Değişiklikler otomatik kaydedilir.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {PREF_ITEMS.map((item) => (
          <div
            key={item.key}
            className="p-5 rounded-2xl bg-gradient-to-br from-white to-pink-50/30 dark:from-slate-800 dark:to-slate-800/60 border border-pink-200/60 dark:border-slate-700 shadow-sm flex items-start gap-4"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center text-white shadow-md shrink-0">
              <Bell className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 dark:text-slate-100 text-sm mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
                {item.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => toggle(item.key)}
              disabled={saving === item.key}
              aria-label={`${item.title} — ${prefs[item.key] ? 'aktif' : 'pasif'}`}
              aria-pressed={prefs[item.key]}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0 ${
                prefs[item.key]
                  ? 'bg-gradient-to-r from-pink-500 to-rose-500'
                  : 'bg-gray-300 dark:bg-slate-600'
              } ${saving === item.key ? 'opacity-60 cursor-wait' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                  prefs[item.key] ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 rounded-xl flex gap-2 items-start">
        <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
          Kritik güvenlik/hesap bildirimleri (ör. şifre sıfırlama, giriş uyarıları) her zaman
          gönderilir ve buradan kapatılamaz.
        </p>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-gray-400">
        <CheckCircle2 className="w-3 h-3" />
        <span>Ayarlarınız otomatik kaydedildi</span>
      </div>
    </div>
  );
}
