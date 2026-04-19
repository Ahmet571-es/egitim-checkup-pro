'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useToast } from '@/components/ui/Toast';

const KPIDashboard = dynamic(() => import('@/components/admin/KPIDashboard'), { ssr: false });
const SchoolHeatmap = dynamic(() => import('@/components/admin/SchoolHeatmap'), { ssr: false });
const RiskDistribution = dynamic(() => import('@/components/admin/RiskDistribution'), { ssr: false });
const GenderAgeBreakdown = dynamic(() => import('@/components/admin/GenderAgeBreakdown'), { ssr: false });

export default function AnalyticsSection() {
  const toast = useToast();
  const [reportLoading, setReportLoading] = useState(false);

  const handleDownloadReport = async () => {
    setReportLoading(true);
    const loadingId = toast.loading('Rapor hazırlanıyor...', 'Bu birkaç saniye sürebilir.');
    try {
      const res = await fetch('/api/reports/guidance');
      if (!res.ok) throw new Error('Rapor oluşturulamadı');
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rehberlik-raporu-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.dismiss(loadingId);
      toast.success('Rapor indirildi', 'Rehberlik raporu başarıyla oluşturuldu.');
    } catch {
      toast.dismiss(loadingId);
      toast.error('İndirilemedi', 'Rapor indirilemedi. Lütfen tekrar deneyin.');
    }
    setReportLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* KPI Dashboard */}
      <KPIDashboard />

      {/* Rehberlik Raporu İndir butonu */}
      <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-5 shadow-lg shadow-purple-500/20">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Dönem Sonu Rehberlik Raporu</h3>
            <p className="text-violet-100 text-sm mt-1">Okul geneli istatistikler, sınıf bazlı özet ve risk listesi</p>
          </div>
          <button
            onClick={handleDownloadReport}
            disabled={reportLoading}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-semibold px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 text-sm"
          >
            {reportLoading ? 'Hazırlanıyor...' : 'Raporu İndir'}
          </button>
        </div>
      </div>

      {/* Isı Haritası */}
      <SchoolHeatmap />

      {/* Risk Dağılımı */}
      <RiskDistribution />

      {/* Cinsiyet Kırılımı */}
      <GenderAgeBreakdown />
    </div>
  );
}
