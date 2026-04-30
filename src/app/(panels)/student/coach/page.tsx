'use client';
/**
 * Faz 8: Öğrenci AI Koç Sayfası
 *
 * Öğrenci kendi koçuyla sohbet eder. studentId = kendi userId
 * (CoachChat içinde otomatik) — UI'da öğrenci seçimi yok.
 *
 * KVKK: skor görmez, AI yumuşak ve growth-mindset tonunda konuşur.
 */
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Lock } from 'lucide-react';
import CoachChat from '@/components/CoachChat';

export default function StudentCoachPage() {
  const [studentName, setStudentName] = useState<string>('');

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.full_name) {
          setStudentName(profile.full_name.split(' ')[0]);
        }
      }
    })();
  }, []);

  return (
    <div className="space-y-5">
      {/* Sayfa başlığı */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-600 to-pink-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px] w-[200px] h-[200px] rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold mb-1">
              {studentName ? `Merhaba ${studentName}!` : 'Senin Gelişim Koçun'}
            </h1>
            <p className="text-sm text-violet-100 leading-relaxed">
              Bir konu hakkında konuşmak, çalışma alışkanlıkların hakkında öneri almak veya zorlandığın bir noktayı paylaşmak için buradayım.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy info card */}
      <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-900/40 flex items-start gap-2.5">
        <Lock className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
        <div>
          <p className="text-[12px] font-bold text-violet-900 dark:text-violet-200">
            Bu sohbet sadece sana özel
          </p>
          <p className="text-[11px] text-violet-700 dark:text-violet-300 leading-relaxed mt-0.5">
            Mesajların güvenli bir şekilde saklanır. Acil bir durumda <strong>182 ALO</strong> Aile Sosyal Destek Hattı'nı arayabilirsin (7/24 ücretsiz).
          </p>
        </div>
      </div>

      {/* Sohbet */}
      <CoachChat role="student" />
    </div>
  );
}
