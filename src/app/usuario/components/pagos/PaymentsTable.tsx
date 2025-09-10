'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';
import PaymentsTableHeader from './PaymentsTableHeader';
import PaymentsTableColumns from './PaymentsTableColumns';
import PaymentRow from './PaymentRow';

interface PaymentsTableProps {
  pagos: Array<{
    id: number;
    fecha: string;
    fechaRaw: string;
    medico: string;
    especialidad?: string;
    monto: number;
    estado: string;
    tokenSala?: string;
    idRoom?: string;
  }>;
  pagosOrdenados: Array<{
    id: number;
    fecha: string;
    medico: string;
    especialidad?: string;
    monto: number;
    estado: string;
  }>;
  pagosSort: {
    key: string;
    dir: string;
  };
  toggleSort: (key: "fecha" | "medico" | "monto" | "estado") => void;
  loadingPagos: boolean;
  fmtMonto: (monto: number) => string;
  abrirModalPago: (pagoId: number) => void;
  marcarPagoGratis: (pagoId: string | number) => Promise<{ status: string; } | undefined>;
  descargarRecibo: (pagoId: number) => Promise<Blob>;
  addToast: (message: string, type: 'success' | 'error') => void;
  refreshPagos: () => Promise<void>;
  setVista: React.Dispatch<React.SetStateAction<"inicio" | "citas" | "especialistas" | "pagos" | "billing" | "Reunion">>;
}

export default function PaymentsTable({
  pagos,
  pagosOrdenados,
  pagosSort,
  toggleSort,
  loadingPagos,
  fmtMonto,
  abrirModalPago,
  marcarPagoGratis,
  descargarRecibo,
  addToast,
  refreshPagos,
  setVista,
}: PaymentsTableProps) {
  const { t } = useTranslation('common');

  const EmptyState = () => (
    <tr>
      <td colSpan={6} className="px-3 py-10 sm:px-4 sm:py-12 text-center">
        <div className="flex flex-col items-center">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no_transactions')}</h3>
          <p className="text-gray-500 mb-4">{t('no_transactions_desc')}</p>
          <button 
            onClick={() => setVista('inicio')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('schedule_first_appointment')}
          </button>
        </div>
      </td>
    </tr>
  );

  const LoadingState = () => (
    <tr>
      <td colSpan={6} className="px-3 py-10 sm:px-4 sm:py-12 text-center">
        <div className="flex flex-col items-center">
          <div className="inline-block animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 h-12 w-12 mb-4"></div>
          <p className="text-blue-600 font-medium">{t('loading_transactions')}</p>
          <p className="text-gray-500 text-sm mt-1">{t('fetching_payments_info')}</p>
        </div>
      </td>
    </tr>
  );

  const Footer = () => {
    if (pagosOrdenados.length === 0) return null;

    const totalAmount = pagos.reduce((acc, p) => acc + Number(p.monto || 0), 0);

    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-3 sm:px-4 sm:py-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{t('showing_transactions', { count: pagosOrdenados.length })}</span>
            <span>•</span>
            <span>{t('total')}: €{totalAmount.toFixed(2)}</span>
          </div>
          <div className="mt-2 sm:mt-0">
            <button 
              onClick={() => setVista('billing')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              {t('manage_payment_methods')} →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xl">
      {/* Contenedor responsive */}
      <div className="w-full overflow-x-auto px-2 sm:px-6">
        <PaymentsTableHeader pagosSort={pagosSort} toggleSort={toggleSort} />

        <div className="overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
          <table className="w-full min-w-0 table-auto divide-y divide-gray-200 text-xs sm:text-sm">
            <PaymentsTableColumns pagosSort={pagosSort} toggleSort={toggleSort} />
            <tbody className="bg-white divide-y divide-gray-200">
              {loadingPagos ? (
                <LoadingState />
              ) : pagosOrdenados.length === 0 ? (
                <EmptyState />
              ) : (
                pagosOrdenados.map((pago, idx) => (
                  <PaymentRow
                    key={pago.id}
                    pago={pago}
                    idx={idx}
                    fmtMonto={fmtMonto}
                    abrirModalPago={abrirModalPago}
                    marcarPagoGratis={marcarPagoGratis}
                    descargarRecibo={descargarRecibo}
                    addToast={addToast}
                    refreshPagos={refreshPagos}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Footer />
    </div>
  );
}
