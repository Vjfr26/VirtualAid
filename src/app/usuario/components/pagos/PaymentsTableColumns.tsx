'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';

interface PaymentsTableColumnsProps {
  pagosSort: {
    key: string;
    dir: string;
  };
  toggleSort: (key: "fecha" | "medico" | "monto" | "estado") => void;
}

export default function PaymentsTableColumns({ pagosSort, toggleSort }: PaymentsTableColumnsProps) {
  const { t } = useTranslation('common');

  return (
    <thead className="bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0 z-10">
      <tr>
        <th 
          className="px-2 py-1 sm:px-3 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors select-none break-words" 
          onClick={() => toggleSort('fecha')}
        >
          <div className="flex items-center space-x-1">
            <span>{t('date')}</span>
            {pagosSort.key === 'fecha' && (
              <svg className={`w-4 h-4 transform ${pagosSort.dir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </th>
        <th 
          className="px-2 py-1 sm:px-3 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors select-none break-words" 
          onClick={() => toggleSort('medico')}
        >
          <div className="flex items-center space-x-1">
            <span>{t('doctor')}</span>
            {pagosSort.key === 'medico' && (
              <svg className={`w-4 h-4 transform ${pagosSort.dir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </th>
        <th className="px-2 py-1 sm:px-3 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
          {t('specialty')}
        </th>
        <th 
          className="px-2 py-1 sm:px-3 sm:py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors select-none break-words" 
          onClick={() => toggleSort('monto')}
        >
          <div className="flex items-center justify-end space-x-1">
            <span>{t('amount')}</span>
            {pagosSort.key === 'monto' && (
              <svg className={`w-4 h-4 transform ${pagosSort.dir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </th>
        <th 
          className="hidden sm:table-cell px-2 py-1 sm:px-3 sm:py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-blue-100 transition-colors select-none break-words" 
          onClick={() => toggleSort('estado')}
        >
          <div className="flex items-center space-x-1">
            <span>{t('status')}</span>
            {pagosSort.key === 'estado' && (
              <svg className={`w-4 h-4 transform ${pagosSort.dir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </th>
        <th className="px-2 py-1 sm:px-3 sm:py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          {t('actions')}
        </th>
      </tr>
    </thead>
  );
}
