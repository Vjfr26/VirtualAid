"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';

interface QuickActionCardsProps {
  citasCount: number;
  especialistasCount: number;
  pagosCount: number;
  onViewCitas: () => void;
  onViewEspecialistas: () => void;
  onViewPagos: () => void;
}

export default function QuickActionCards({
  citasCount,
  especialistasCount,
  pagosCount,
  onViewCitas,
  onViewEspecialistas,
  onViewPagos
}: QuickActionCardsProps) {
  const { t } = useTranslation('common');

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Card de Citas */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow cursor-pointer" onClick={onViewCitas}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('my_appointments')}</h3>
            <p className="text-sm text-gray-600">{t('my_appointments_desc')}</p>
            <p className="text-2xl font-bold text-blue-600 mt-2">{citasCount}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card de Especialistas */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow cursor-pointer" onClick={onViewEspecialistas}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('specialists')}</h3>
            <p className="text-sm text-gray-600">{t('find_professionals')}</p>
            <p className="text-2xl font-bold text-orange-600 mt-2">{especialistasCount}</p>
          </div>
          <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Card de Pagos */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow cursor-pointer" onClick={onViewPagos}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('payments')}</h3>
            <p className="text-sm text-gray-600">{t('manage_payments')}</p>
            <p className="text-2xl font-bold text-green-600 mt-2">{pagosCount}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
