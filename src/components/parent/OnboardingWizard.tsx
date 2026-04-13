'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  GraduationCap, ChevronRight, ChevronLeft, X, Bell,
  BarChart3, MessageSquare, Home, Check, Sparkles,
} from 'lucide-react';

// ── Tipler ──────────────────────────────────────────────────
interface OnboardingWizardProps {
  userId: string;
  userName: string;
}

// ── Adım içerikleri ─────────────────────────────────────────
const STEPS = [
  {
    title: 'Hoş Geldiniz!',
    subtitle: 'Eğitim Check-Up Pro\'ya hoş geldiniz',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-500',
    features: [
      { icon: BarChart3, text: 'Çocuğunuzun test sonuçlarını detaylı takip edin' },
      { icon: Home, text: 'Evde uygulayabileceğiniz pratik öneriler alın' },
      { icon: MessageSquare, text: 'Öğretmenlerle kolayca iletişim kurun' },
    ],
  },
  {
    title: 'Platform Tanıtımı',
    subtitle: 'Neler yapabilirsiniz?',
    icon: GraduationCap,
    color: 'from-violet-500 to-purple-500',
    features: [
      { icon: BarChart3, text: 'Sınıf Karşılaştırması: Çocuğunuzun sınıf içindeki konumunu anonim olarak görün' },
      { icon: Home, text: 'Evde Ne Yapabilirim: Her test sonucuna özel pratik öneriler' },
      { icon: MessageSquare, text: 'Öğretmen Notları: Öğretmene doğrudan not bırakın, yanıt alın' },
    ],
  },
  {
    title: 'Bildirim Tercihleri',
    subtitle: 'Sizi nasıl bilgilendirelim?',
    icon: Bell,
    color: 'from-amber-500 to-orange-500',
    notifications: [
      { key: 'email_test_complete', label: 'Test tamamlandığında e-posta gönder', defaultOn: true },
      { key: 'email_report_ready', label: 'Yeni rapor hazır olduğunda bildir', defaultOn: true },
      { key: 'email_teacher_note', label: 'Öğretmen not bıraktığında bildir', defaultOn: true },
      { key: 'email_weekly_summary', label: 'Haftalık özet e-postası gönder', defaultOn: false },
    ],
  },
];

export default function OnboardingWizard({ userId, userName }: OnboardingWizardProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({
    email_test_complete: true,
    email_report_ready: true,
    email_teacher_note: true,
    email_weekly_summary: false,
  });
  const [dontShow, setDontShow] = useState(false);

  useEffect(() => {
    // Onboarding tamamlanmış mı kontrol et
    async function check() {
      const supabase = createClient();
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', userId)
        .single();

      if (data && !data.onboarding_completed) {
        setVisible(true);
      }
    }
    check();
  }, [userId]);

  const handleClose = async () => {
    setVisible(false);

    const supabase = createClient();

    // Onboarding tamamlandı olarak işaretle
    if (dontShow) {
      await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', userId);
    }

    // Bildirim tercihlerini kaydet
    await supabase.from('notification_preferences').upsert(
      {
        user_id: userId,
        ...prefs,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const currentStep = STEPS[step];
  const StepIcon = currentStep.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-[fadeInUp_0.3s_ease-out]">
        {/* Kapat butonu */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 p-1.5 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Üst gradient */}
        <div className={`bg-gradient-to-br ${currentStep.color} px-8 pt-8 pb-12 text-white`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">{currentStep.title}</h2>
              <p className="text-white/70 text-sm">{currentStep.subtitle}</p>
            </div>
          </div>

          {step === 0 && (
            <p className="text-white/80 text-sm leading-relaxed">
              Merhaba <strong>{userName}</strong>! Çocuğunuzun gelişimini birlikte takip edeceğiz.
              Platform hakkında kısa bir tur yapalım.
            </p>
          )}
        </div>

        {/* İçerik */}
        <div className="px-8 py-6 -mt-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            {/* Özellikler (Adım 1 ve 2) */}
            {currentStep.features && (
              <div className="space-y-4">
                {currentStep.features.map((f, idx) => {
                  const FIcon = f.icon;
                  return (
                    <div key={idx} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center shrink-0">
                        <FIcon className="w-4 h-4 text-pink-600" />
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed">{f.text}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bildirim tercihleri (Adım 3) */}
            {currentStep.notifications && (
              <div className="space-y-3">
                {currentStep.notifications.map((n) => (
                  <label
                    key={n.key}
                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
                        prefs[n.key]
                          ? 'bg-pink-500 border-pink-500'
                          : 'border-gray-300'
                      }`}
                      onClick={() => setPrefs((p) => ({ ...p, [n.key]: !p[n.key] }))}
                    >
                      {prefs[n.key] && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className="text-sm text-gray-600">{n.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Alt navigasyon */}
        <div className="px-8 pb-6 flex items-center justify-between">
          {/* Adım göstergesi */}
          <div className="flex gap-1.5">
            {STEPS.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all ${
                  idx === step ? 'w-6 bg-pink-500' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-100 transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                Geri
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold text-sm shadow-sm hover:shadow-md transition-all flex items-center gap-1.5"
            >
              {step === STEPS.length - 1 ? 'Başlayalım!' : 'İleri'}
              {step < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Bir daha gösterme */}
        {step === STEPS.length - 1 && (
          <div className="px-8 pb-4 flex justify-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={dontShow}
                onChange={(e) => setDontShow(e.target.checked)}
                className="rounded border-gray-300 text-pink-500 focus:ring-pink-400"
              />
              <span className="text-xs text-gray-400">Bir daha gösterme</span>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
