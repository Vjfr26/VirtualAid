'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';

interface PaymentsHeaderProps {
  pagos: Array<{ id: number; monto: number; estado: string }>;
}

export default function PaymentsHeader({ pagos }: PaymentsHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <div className="bg-gradient-to-br from-purple-600 to-blue-700 rounded-xl shadow-xl p-4 sm:p-6 md:p-8 text-white">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-4 lg:mb-0">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2 flex items-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            {t('payments_management')}
          </h1>
          <p className="text-purple-100 text-lg">{t('payments_management_sub')}</p>
        </div>
        <div className="text-right">
          <div className="text-2xl sm:text-3xl lg:text-4xl font-bold">{pagos.length}</div>
          <div className="text-purple-200">{t('transactions_total')}</div>
        </div>
      </div>
    </div>
  );
}
