'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';

interface PaymentsStatsProps {
  pagos: Array<{ 
    id: number; 
    monto: number; 
    estado: string;
  }>;
}

export default function PaymentsStats({ pagos }: PaymentsStatsProps) {
  const { t } = useTranslation('common');

  const pagosPagados = pagos.filter(p => !p.estado.toLowerCase().includes('no pagado'));
  const pagosPendientes = pagos.filter(p => p.estado.toLowerCase().includes('no pagado'));
  const totalPagado = pagosPagados.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  const totalPendiente = pagosPendientes.reduce((acc, p) => acc + Number(p.monto || 0), 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Pagados */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border-l-4 border-green-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('paid')}</p>
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {pagosPagados.length}
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Pendientes */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border-l-4 border-yellow-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('pending')}</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">
              {pagosPendientes.length}
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Total pagado */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('total_paid')}</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              €{totalPagado.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>

      {/* Total pendiente */}
      <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 md:p-6 border-l-4 border-purple-500">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{t('total_pending')}</p>
            <p className="text-xl sm:text-2xl font-bold text-purple-600">
              €{totalPendiente.toFixed(2)}
            </p>
          </div>
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
