'use client';

import React from 'react';
import { RefreshCw, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface RetakeTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  testName: string;
  lastScore: number;
  lastAttempt: number;
  lastDate: string;
}

export default function RetakeTestModal({
  isOpen,
  onClose,
  onConfirm,
  testName,
  lastScore,
  lastAttempt,
  lastDate,
}: RetakeTestModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Baslik */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <RefreshCw size={18} className="text-amber-500" />
            <h3 className="font-extrabold text-[#0f2847]">Tekrar Coz</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Icerik */}
        <div className="px-6 py-5">
          <p className="text-gray-700 text-sm mb-4">
            <span className="font-bold text-[#0f2847]">{testName}</span> testini
            daha once cozmusun.
          </p>

          {/* Onceki skor karti */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 mb-4 border border-amber-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-600 font-semibold mb-1">
                  Son Sonucun
                </p>
                <p className="text-3xl font-extrabold text-amber-700">
                  {Math.round(lastScore)}
                  <span className="text-sm font-medium text-amber-500 ml-1">
                    puan
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-amber-500">
                  {lastAttempt}. deneme
                </p>
                <p className="text-xs text-amber-400 mt-0.5">{lastDate}</p>
              </div>
            </div>
          </div>

          <p className="text-gray-500 text-sm">
            Tekrar cozerek gelisimini takip edebilirsin. Yeni sonucun oncekiyle
            karsilastirilacak.
          </p>
        </div>

        {/* Butonlar */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all"
          >
            Vazgec
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-[#0f2847] text-white text-sm font-bold hover:bg-[#1a3d6e] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Tekrar Coz
          </button>
        </div>
      </div>
    </div>
  );
}
