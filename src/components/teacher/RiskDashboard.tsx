'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { calculateRiskScore, type RiskResult } from '@/lib/services/riskScore';
import { Shield, AlertTriangle, Filter, ChevronRight, Loader2, Users } from 'lucide-react';
import Link from 'next/link';

interface StudentRisk {
  studentId: string;
  studentName: string;
  risk: RiskResult;
  mostCriticalFlag: string | null;
}

type FilterType = 'hepsi' | 'kritik' | 'izlenmeli';

export default function RiskDashboard() {
  const [loading, setLoading] = useState(true);
  const [riskList, setRiskList] = useState<StudentRisk[]>([]);
  const [filter, setFilter] = useState<FilterType>('hepsi');
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');

  const loadClasses = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('classes')
      .select('id, name')
      .eq('teacher_id', user.id)
      .order('name');

    if (data && data.length > 0) {
      setClasses(data);
      setSelectedClass(data[0].id);
    }
  }, []);

  const loadRiskData = useCallback(async () => {
    if (!selectedClass) return;
    setLoading(true);

    const supabase = createClient();

    // Sınıf öğrencileri
    const { data: students } = await supabase
      .from('class_students')
      .select('student_id, student:profiles!class_students_student_id_fkey(id, full_name)')
      .eq('class_id', selectedClass);

    if (!students || students.length === 0) {
      setRiskList([]);
      setLoading(false);
      return;
    }

    const list: StudentRisk[] = [];

    for (const s of students) {
      const profile = s.student as unknown as { id: string; full_name: string } | null;
      if (!profile) continue;

      const { data: results } = await supabase
        .from('test_results')
        .select('test_type, scores')
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      if (!results) continue;

      const latestByType = new Map<string, { test_type: string; scores: Record<string, unknown> }>();
      for (const row of results) {
        if (!latestByType.has(row.test_type)) {
          latestByType.set(row.test_type, {
            test_type: row.test_type,
            scores: row.scores as Record<string, unknown>,
          });
        }
      }

      const risk = calculateRiskScore(Array.from(latestByType.values()));
      list.push({
        studentId: profile.id,
        studentName: profile.full_name,
        risk,
        mostCriticalFlag: risk.flags.length > 0 ? risk.flags[0].message : null,
      });
    }

    list.sort((a, b) => a.risk.overallScore - b.risk.overallScore);
    setRiskList(list);
    setLoading(false);
  }, [selectedClass]);

  useEffect(() => { loadClasses(); }, [loadClasses]);
  useEffect(() => { if (selectedClass) loadRiskData(); }, [selectedClass, loadRiskData]);

  const filtered = riskList.filter(s => {
    if (filter === 'kritik') return s.risk.level === 'kritik';
    if (filter === 'izlenmeli') return s.risk.level === 'izlenmeli';
    return true;
  });

  const stats = {
    total: riskList.length,
    kritik: riskList.filter(s => s.risk.level === 'kritik').length,
    izlenmeli: riskList.filter(s => s.risk.level === 'izlenmeli').length,
    saglikli: riskList.filter(s => s.risk.level === 'saglikli').length,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-[#0f2847] flex items-center gap-2">
          <Shield size={20} className="text-red-500" />
          Risk Altındaki Öğrenciler
        </h2>

        {/* Sınıf Seçici */}
        {classes.length > 1 && (
          <select
            value={selectedClass}
            onChange={e => setSelectedClass(e.target.value)}
            className="text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white"
          >
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-gray-50 rounded-xl p-3 text-center">
          <Users size={16} className="mx-auto text-gray-400 mb-1" />
          <p className="text-lg font-bold text-[#0f2847]">{stats.total}</p>
          <p className="text-xs text-gray-500">Toplam</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center cursor-pointer hover:bg-red-100 transition"
          onClick={() => setFilter(filter === 'kritik' ? 'hepsi' : 'kritik')}>
          <span className="text-lg">🔴</span>
          <p className="text-lg font-bold text-red-700">{stats.kritik}</p>
          <p className="text-xs text-red-600">Kritik</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center cursor-pointer hover:bg-amber-100 transition"
          onClick={() => setFilter(filter === 'izlenmeli' ? 'hepsi' : 'izlenmeli')}>
          <span className="text-lg">🟡</span>
          <p className="text-lg font-bold text-amber-700">{stats.izlenmeli}</p>
          <p className="text-xs text-amber-600">İzlenmeli</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <span className="text-lg">🟢</span>
          <p className="text-lg font-bold text-emerald-700">{stats.saglikli}</p>
          <p className="text-xs text-emerald-600">Sağlıklı</p>
        </div>
      </div>

      {/* Filtre bilgisi */}
      {filter !== 'hepsi' && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Filter size={14} />
          <span>
            {filter === 'kritik' ? 'Sadece kritik öğrenciler' : 'Sadece izlenmeli öğrenciler'}
          </span>
          <button onClick={() => setFilter('hepsi')} className="text-violet-600 hover:underline ml-2">
            Tümünü göster
          </button>
        </div>
      )}

      {/* Tablo */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {riskList.length === 0 ? 'Bu sınıfta öğrenci bulunamadı.' : 'Bu filtreye uygun öğrenci yok.'}
        </div>
      ) : (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/40 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Öğrenci</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Risk Skoru</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3">Seviye</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">En Kritik Bulgu</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.studentId} className="border-b border-gray-50 hover:bg-gray-50/50 transition">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[#0f2847] text-sm">{s.studentName}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-lg font-bold ${s.risk.color}`}>
                      {s.risk.overallScore}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${s.risk.bgColor} ${s.risk.color} border ${s.risk.borderColor}`}>
                      {s.risk.emoji} {s.risk.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {s.mostCriticalFlag ? (
                      <div className="flex items-start gap-1.5">
                        <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
                        <span className="text-xs text-gray-600 line-clamp-2">{s.mostCriticalFlag}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/teacher/results?student=${s.studentId}`}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition inline-flex"
                    >
                      <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
