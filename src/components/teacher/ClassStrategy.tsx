'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Loader2, Lightbulb, BookOpen } from 'lucide-react';

export default function ClassStrategy() {
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingClasses, setLoadingClasses] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  async function loadClasses() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('classes')
      .select('id, name')
      .eq('teacher_id', user.id)
      .order('name');

    setClasses(data || []);
    setLoadingClasses(false);
  }

  async function generateStrategy() {
    if (!selectedClass || loading) return;
    setLoading(true);
    setStrategy('');

    try {
      const res = await fetch('/api/ai/class-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ classId: selectedClass }),
      });
      const data = await res.json();
      setStrategy(data.strategy || data.error || 'Strateji oluşturulamadı.');
    } catch {
      setStrategy('Bağlantı hatası.');
    }
    setLoading(false);
  }

  if (loadingClasses) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="bg-white/80 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl border border-white/40 dark:border-slate-700/60 shadow-sm p-6">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h3 className="text-sm font-bold text-[#0f2847] dark:text-slate-100">Sınıf Strateji Önerisi</h3>
      </div>

      <div className="flex gap-3 mb-4">
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <option value="">Sınıf seçin...</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={generateStrategy}
          disabled={loading || !selectedClass}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-semibold rounded-xl hover:bg-amber-600 disabled:opacity-50 transition-colors"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4" />}
          Strateji Oluştur
        </button>
      </div>

      {strategy && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-gray-700 dark:text-slate-300 leading-relaxed">
          {strategy.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>
          ))}
        </div>
      )}
    </div>
  );
}
