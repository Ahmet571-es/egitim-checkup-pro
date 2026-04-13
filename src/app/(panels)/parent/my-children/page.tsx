/**
 * Veli — Çocuklarım Sayfası — Faz 6
 * Velinin eşleştirilmiş çocuklarını listeler
 */
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/actions/auth';
import Link from 'next/link';
import { Baby, ClipboardCheck, Calendar, ChevronRight, GraduationCap, AlertCircle } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface ChildData {
  id: string;
  full_name: string;
  className: string | null;
  grade: number | null;
  completedTests: number;
  lastTestDate: string | null;
}

export default async function Page() {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const supabase = await createClient();

  // Velinin çocuklarını + sınıf bilgilerini getir
  const { data: parentStudents } = await supabase
    .from('parent_students')
    .select('student_id, profiles!parent_students_student_id_fkey(id, full_name)')
    .eq('parent_id', profile.id);

  const childrenRaw = (parentStudents ?? []).map(ps => ({
    id: (ps.profiles as unknown as { id: string; full_name: string }).id,
    full_name: (ps.profiles as unknown as { id: string; full_name: string }).full_name,
  }));

  // Her çocuk için sınıf ve test bilgisini getir
  const children: ChildData[] = await Promise.all(
    childrenRaw.map(async (child) => {
      // Sınıf bilgisi
      const { data: classData } = await supabase
        .from('class_students')
        .select('class_id, classes!class_students_class_id_fkey(name, grade)')
        .eq('student_id', child.id)
        .limit(1)
        .maybeSingle();

      const cls = classData?.classes as unknown as { name: string; grade: number | null } | null;

      // Test sonuçları
      const { data: testResults } = await supabase
        .from('test_results')
        .select('id, completed_at')
        .eq('student_id', child.id)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false });

      return {
        id: child.id,
        full_name: child.full_name,
        className: cls?.name ?? null,
        grade: cls?.grade ?? null,
        completedTests: (testResults ?? []).length,
        lastTestDate: testResults?.[0]?.completed_at ?? null,
      };
    })
  );

  return (
    <div>
      {/* Başlık */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow">
            <Baby className="w-4 h-4 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-[#0f2847]">Çocuklarım</h1>
        </div>
        <p className="text-gray-500 text-sm ml-10">
          Hesabınıza eşleştirilmiş çocuklarınızın listesi
        </p>
      </div>

      {/* Çocuk yok */}
      {children.length === 0 && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-pink-400" />
          </div>
          <h3 className="font-extrabold text-[#0f2847] text-lg mb-2">Henüz çocuk eşleştirmesi yapılmamış</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Okul yöneticinizle iletişime geçerek çocuğunuzun hesabınıza eşleştirilmesini talep edin.
          </p>
        </div>
      )}

      {/* Çocuk Kartları */}
      {children.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
            >
              {/* Kart başlığı */}
              <div className="bg-gradient-to-r from-pink-500 to-rose-500 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-white font-extrabold text-lg">
                    {child.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-extrabold text-white text-base">{child.full_name}</p>
                    {child.className ? (
                      <p className="text-white/75 text-xs flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        {child.grade ? `${child.grade}. Sınıf — ` : ''}{child.className}
                      </p>
                    ) : (
                      <p className="text-white/60 text-xs">Sınıf bilgisi yok</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Kart içeriği */}
              <div className="px-5 py-4">
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-pink-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <ClipboardCheck className="w-4 h-4 text-pink-500" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-pink-500">Tamamlanan Test</p>
                    </div>
                    <p className="text-2xl font-extrabold text-[#0f2847]">{child.completedTests}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Son Test</p>
                    </div>
                    <p className="text-sm font-bold text-[#0f2847]">
                      {child.lastTestDate
                        ? new Date(child.lastTestDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'Henüz test yok'}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/parent/results?child=${child.id}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-bold hover:opacity-90 transition-opacity shadow-sm"
                >
                  Sonuçları Gör
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
