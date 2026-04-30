'use client';
/**
 * Faz 8: Veli AI Koç Sayfası
 *
 * Veli, çocukları arasından birini seçer ve hakkında danışmanlık alır.
 * KVKK: çocuğun test puanlarını görür ama ham cevaplar değil.
 */
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Sparkles, Heart, AlertCircle, User, Loader2 } from 'lucide-react';
import CoachChat from '@/components/CoachChat';

interface Child {
  id: string;
  full_name: string;
  grade: string | null;
}

export default function ParentCoachPage() {
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('Giriş yapmamışsınız.');
          setLoading(false);
          return;
        }

        // Veli bağlı çocuk ID'lerini al
        const { data: links } = await supabase
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', user.id);

        const childIds = (links || []).map((l: { student_id: string }) => l.student_id);
        if (childIds.length === 0) {
          setLoading(false);
          return;
        }

        const { data: kids } = await supabase
          .from('profiles')
          .select('id, full_name, grade')
          .in('id', childIds);

        setChildren(kids || []);
        // Otomatik ilk çocuğu seç
        if (kids && kids.length > 0) {
          setSelectedChildId(kids[0].id);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectedChild = children.find((c) => c.id === selectedChildId) || null;

  return (
    <div className="space-y-5">
      {/* Başlık */}
      <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-fuchsia-500 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-[-30px] right-[-30px] w-[200px] h-[200px] rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
            <Heart className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold mb-1">Veli Koçu</h1>
            <p className="text-sm text-pink-100 leading-relaxed">
              Çocuğunuzun gelişimine nasıl destek olabileceğiniz konusunda akademik temelli, pratik tavsiyeler.
            </p>
          </div>
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 animate-spin text-pink-500" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <p className="text-sm text-rose-800">{error}</p>
        </div>
      ) : children.length === 0 ? (
        <div className="p-8 rounded-2xl bg-pink-50 dark:bg-pink-950/30 border border-pink-200 text-center">
          <Heart className="w-10 h-10 text-pink-300 mx-auto mb-3" />
          <p className="font-bold text-[#0f2847] dark:text-slate-100 mb-1">
            Henüz çocuk eklenmedi
          </p>
          <p className="text-[13px] text-gray-600 dark:text-slate-400 max-w-md mx-auto">
            AI Koç ile danışmak için önce <a href="/parent/my-children" className="text-pink-600 font-bold hover:underline">Çocuklarım</a> sayfasından çocuğunuzu eklemelisiniz.
          </p>
        </div>
      ) : (
        <>
          {/* Çocuk seçici (birden fazla varsa) */}
          {children.length > 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-3 shadow-sm">
              <p className="text-[11px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-2 px-1">
                Hangi çocuk hakkında?
              </p>
              <div className="flex flex-wrap gap-2">
                {children.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChildId(c.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-bold transition-all ${
                      selectedChildId === c.id
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md'
                        : 'bg-gray-50 dark:bg-slate-700/40 text-gray-600 dark:text-slate-300 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    {c.full_name}
                    {c.grade && (
                      <span className="text-[10px] opacity-80">{c.grade}. Sınıf</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sohbet */}
          {selectedChild && (
            <CoachChat
              role="parent"
              studentId={selectedChild.id}
              studentName={selectedChild.full_name}
            />
          )}
        </>
      )}
    </div>
  );
}
