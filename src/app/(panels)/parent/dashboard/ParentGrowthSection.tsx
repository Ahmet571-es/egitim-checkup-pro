'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import GrowthCards from '@/components/parent/GrowthCards';
import { getStudentAllTrends } from '@/lib/services/longitudinal';

const TEST_LABELS: Record<string, string> = {
  enneagram: 'Enneagram Kisilik',
  vark: 'VARK Ogrenme Stilleri',
  holland: 'Holland RIASEC',
  'coklu-zeka': 'Coklu Zeka',
  'sinav-kaygisi': 'Sinav Kaygisi',
  'calisma-davranisi': 'Calisma Davranisi',
  'akademik-analiz': 'Akademik Analiz',
  'hizli-okuma': 'Hizli Okuma',
  'd2-dikkat': 'D2 Dikkat',
  'sag-sol-beyin': 'Sag-Sol Beyin',
};

const TEST_ICONS: Record<string, string> = {
  enneagram: '🔮',
  vark: '📚',
  holland: '🧭',
  'coklu-zeka': '🧠',
  'sinav-kaygisi': '😰',
  'calisma-davranisi': '📖',
  'akademik-analiz': '🎓',
  'hizli-okuma': '⚡',
  'd2-dikkat': '🎯',
  'sag-sol-beyin': '🧩',
};

const TEST_COLORS: Record<string, string> = {
  enneagram: '#8b5cf6',
  vark: '#10b981',
  holland: '#f59e0b',
  'coklu-zeka': '#6366f1',
  'sinav-kaygisi': '#ef4444',
  'calisma-davranisi': '#0ea5e9',
  'akademik-analiz': '#059669',
  'hizli-okuma': '#f97316',
  'd2-dikkat': '#dc2626',
  'sag-sol-beyin': '#7c3aed',
};

interface ParentGrowthSectionProps {
  childIds: string[];
}

export default function ParentGrowthSection({ childIds }: ParentGrowthSectionProps) {
  const [growthData, setGrowthData] = useState<
    Array<{
      testType: string;
      testLabel: string;
      testIcon: string;
      testColor: string;
      latestScore: number;
      previousScore: number;
      attemptCount: number;
      direction: 'improving' | 'declining' | 'stable';
    }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (childIds.length === 0) {
        setLoading(false);
        return;
      }

      // Ilk cocugun trendlerini getir (basitlik icin)
      const trends = await getStudentAllTrends(childIds[0]);

      const data = trends.map((t) => ({
        testType: t.testType,
        testLabel: TEST_LABELS[t.testType] ?? t.testType,
        testIcon: TEST_ICONS[t.testType] ?? '📊',
        testColor: TEST_COLORS[t.testType] ?? '#6b7280',
        latestScore: t.latestScore,
        previousScore: t.firstScore,
        attemptCount: t.attempts.length,
        direction: t.direction,
      }));

      setGrowthData(data);
      setLoading(false);
    }
    load();
  }, [childIds]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-pink-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return <GrowthCards growthData={growthData} />;
}
