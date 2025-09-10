'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';

interface PaymentsTableHeaderProps {
  pagosSort: {
    key: string;
    dir: string;
  };
  toggleSort: (key: "fecha" | "medico" | "monto" | "estado") => void;
}

export default function PaymentsTableHeader({ pagosSort, toggleSort }: PaymentsTableHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <div className="px-3 py-3 sm:px-4 sm:py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">{t('transactions_history')}</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
          </svg>
          <span>{t('ordered_by')} <strong>{pagosSort.key}</strong> ({pagosSort.dir})</span>
        </div>
      </div>
    </div>
  );
}
