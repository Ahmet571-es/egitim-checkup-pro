'use client';

import { useState } from 'react';
import { QrCode, Copy, CheckCircle2, X } from 'lucide-react';
import { TEST_TYPES } from '@/types';

export default function QRCodeGenerator() {
  const [selectedTest, setSelectedTest] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://egitim-checkup.com';
  const testUrl = selectedTest ? `${baseUrl}/student/my-tests/${selectedTest}` : '';
  const qrImageUrl = selectedTest
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(testUrl)}&format=svg`
    : '';

  function copyLink() {
    navigator.clipboard.writeText(testUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
      >
        <QrCode className="w-4 h-4" />
        QR Kod ile Test Başlat
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#0f2847]">QR Kod ile Test Başlat</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Test seçin, QR kodu öğrencilere gösterin. Öğrenciler telefon kamerasıyla okutarak doğrudan teste başlar.
            </p>

            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 mb-4"
            >
              <option value="">Test seçin...</option>
              {TEST_TYPES.map(t => (
                <option key={t.key} value={t.key}>{t.label}</option>
              ))}
            </select>

            {selectedTest && (
              <div className="text-center">
                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 inline-block mb-4">
                  <img src={qrImageUrl} alt="QR Kod" className="w-48 h-48 mx-auto" />
                </div>
                <p className="text-xs text-gray-400 mb-3 break-all">{testUrl}</p>
                <button
                  onClick={copyLink}
                  className="flex items-center gap-2 mx-auto px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopyalandı!' : 'Linki Kopyala'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
