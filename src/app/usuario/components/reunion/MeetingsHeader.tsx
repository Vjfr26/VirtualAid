'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';

interface MeetingsHeaderProps {
  reuniones: Array<{ fecha: string; medico: string; hora: string; especialidad?: string; archivo?: string | null }>;
}

export default function MeetingsHeader({ reuniones }: MeetingsHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <div className="bg-gradient-to-br from-green-600 to-teal-700 rounded-xl shadow-xl p-6 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-3xl font-bold mb-2 flex items-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            {t('meetings_center')}
          </h1>
          <p className="text-green-100 text-lg">
            {t('meetings_center_sub')}
          </p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold">{reuniones.length}</div>
          <div className="text-green-200">{t('meetings_completed')}</div>
        </div>
      </div>
    </div>
  );
}
