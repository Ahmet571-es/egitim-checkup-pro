'use client';

import { useEffect, useState, useCallback } from 'react';
import { UserCheck, UserX, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PendingLink {
  id: string;
  parent_id: string;
  student_id: string;
  created_at: string;
  parent_name: string;
  parent_email: string;
  student_name: string;
}

/**
 * Onay bekleyen veli bağlantılarını listeler.
 *
 * Patron isteği: Veli öğrenci koduyla kendi kendine bağlandığında,
 * öğretmen bu bağlantıyı onaylamadan veli çocuğun verisine tam
 * erişim alamamalı.
 *
 * Realtime: parent_students INSERT'leri dinler — yeni bağlantı
 * olduğunda listeyi yeniler. Öğretmenin dashboard'u açık dursa bile
 * anında görür.
 *
 * Migration (parent_students.approved_at) çalıştırılmadıysa
 * endpoint boş liste döner — widget gizlenir.
 */
export default function PendingParents() {
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<PendingLink[]>([]);
  const [acting, setActing] = useState<string | null>(null);

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch('/api/teacher/pending-parents');
      const data = await res.json();
      setPending(data.pending ?? []);
    } catch (err) {
      console.warn('pending-parents fetch error:', err);
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  // Realtime: yeni veli kaydı → listeyi yenile
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('pending-parents-watcher')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'parent_students',
        },
        () => {
          // Yeni bağlantı var — endpoint'i tekrar çağır
          // (server zaten yetki + filter uyguluyor)
          fetchPending();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPending]);

  const handleAction = async (linkId: string, action: 'approve' | 'reject') => {
    setActing(linkId);
    try {
      const res = await fetch('/api/teacher/approve-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: linkId, action }),
      });
      if (res.ok) {
        setPending((prev) => prev.filter((p) => p.id !== linkId));
      } else {
        const data = await res.json();
        alert(data.error || 'İşlem başarısız');
      }
    } catch {
      alert('Bağlantı hatası. Tekrar deneyin.');
    } finally {
      setActing(null);
    }
  };

  if (loading) {
    return null; // loading'de UI'ı meşgul etme
  }

  if (pending.length === 0) {
    return null; // bekleyen yoksa widget görünmesin
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/50 rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 px-5 py-4 border-b border-amber-200 dark:border-amber-900/50 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md">
          <UserCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#0f2847] dark:text-slate-100">
            Onay Bekleyen Veli Bağlantıları
          </h3>
          <p className="text-[12px] text-gray-600 dark:text-slate-400">
            {pending.length} veli çocuğuna bağlanmak için onay bekliyor
          </p>
        </div>
      </div>

      <ul className="divide-y divide-gray-100 dark:divide-slate-800">
        {pending.map((p) => (
          <li key={p.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-bold text-[#0f2847] dark:text-slate-100">
                  {p.parent_name}
                </span>
                <span className="text-[11px] text-gray-500">→</span>
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  {p.student_name}
                </span>
              </div>
              {p.parent_email && (
                <div className="text-[12px] text-gray-500 flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {p.parent_email}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAction(p.id, 'approve')}
                disabled={acting === p.id}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center gap-1.5 shadow-sm hover:shadow-md transition-all disabled:opacity-60"
                aria-label={`${p.parent_name} velisini onayla`}
              >
                {acting === p.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                Onayla
              </button>
              <button
                onClick={() => handleAction(p.id, 'reject')}
                disabled={acting === p.id}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-white border-2 border-red-200 hover:bg-red-50 text-red-700 text-sm font-bold flex items-center gap-1.5 transition-all disabled:opacity-60"
                aria-label={`${p.parent_name} velisini reddet`}
              >
                <UserX className="w-4 h-4" />
                Reddet
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
