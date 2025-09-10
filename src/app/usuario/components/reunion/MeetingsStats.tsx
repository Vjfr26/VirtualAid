'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';

interface MeetingsStatsProps {
  reuniones: Array<{ fecha: string; medico: string; hora: string; especialidad?: string; archivo?: string | null }>;
}

export default function MeetingsStats({ reuniones }: MeetingsStatsProps) {
  const { t } = useTranslation('common');

  const reunionesConArchivos = reuniones.filter(r => r.archivo).length;
  const reunionesEsteMes = reuniones.filter(r => {
    const fechaReunion = new Date(r.fecha);
    const ahora = new Date();
    return fechaReunion.getMonth() === ahora.getMonth() && 
           fechaReunion.getFullYear() === ahora.getFullYear();
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Total de reuniones */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('meetings_total')}</p>
            <p className="text-3xl font-bold text-green-600">{reuniones.length}</p>
            <p className="text-xs text-gray-500 mt-1">{t('meetings_completed')}</p>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Con documentos */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('with_documents')}</p>
            <p className="text-3xl font-bold text-blue-600">{reunionesConArchivos}</p>
            <p className="text-xs text-gray-500 mt-1">{t('files_available')}</p>
          </div>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Este mes */}
      <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('this_month')}</p>
            <p className="text-3xl font-bold text-purple-600">{reunionesEsteMes}</p>
            <p className="text-xs text-gray-500 mt-1">{t('recent_meetings')}</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
