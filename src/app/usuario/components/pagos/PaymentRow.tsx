'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';

interface PaymentRowProps {
  pago: {
    id: number;
    fecha: string;
    medico: string;
    especialidad?: string;
    monto: number;
    estado: string;
  };
  idx: number;
  fmtMonto: (monto: number) => string;
  abrirModalPago: (pagoId: number) => void;
  marcarPagoGratis: (pagoId: string | number) => Promise<{ status: string; } | undefined>;
  descargarRecibo: (pagoId: number) => Promise<{ blob: Blob; fileName: string }>;
  addToast: (message: string, type: 'success' | 'error') => void;
  refreshPagos: () => Promise<void>;
  onAbrirPreview: (pagoId: number) => void; // Nueva prop para abrir preview
}

export default function PaymentRow({ 
  pago, 
  idx, 
  fmtMonto, 
  abrirModalPago, 
  marcarPagoGratis, 
  descargarRecibo, 
  addToast, 
  refreshPagos,
  onAbrirPreview
}: PaymentRowProps) {
  const { t } = useTranslation('common');
  
  const estadoNorm = pago.estado.toLowerCase();
  const esPagado = !estadoNorm.includes('no pagado');

  const handleMarcarGratis = async () => {
    try {
      await marcarPagoGratis(pago.id);
      addToast('Confirmado sin pago', 'success');
      await refreshPagos();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo confirmar';
      addToast(msg, 'error');
    }
  };

  const handleDescargarRecibo = async () => {
    try {
      const result = await descargarRecibo(pago.id);
      const url = URL.createObjectURL(result.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName || `recibo_${pago.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      addToast('Recibo descargado', 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'No se pudo descargar el recibo', 'error');
    }
  };

  const handleAbrirPreview = () => {
    onAbrirPreview(pago.id);
  };

  return (
    <tr className={`hover:bg-gray-50 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
      {/* Fecha */}
      <td className="px-2 py-1 sm:px-3 sm:py-2 break-words min-w-0">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-gray-900">{pago.fecha}</div>
          <div className="text-xs text-gray-500">ID: #{pago.id}</div>
        </div>
      </td>

      {/* Médico */}
      <td className="px-2 py-1 sm:px-3 sm:py-2 break-words min-w-0">
        <div className="flex items-center">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-full flex items-center justify-center mr-2 sm:mr-3">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-900 max-w-[140px] sm:max-w-[220px] break-words" title={`${t('doctor_short')} ${pago.medico}`}>
              {t('doctor_short')} {(pago.medico || '').toString()}
            </div>
          </div>
        </div>
      </td>

      {/* Especialidad */}
      <td className="px-2 py-1 sm:px-3 sm:py-2 hidden md:table-cell break-words min-w-0">
        <div className="text-sm text-gray-900">{pago.especialidad || '-'}</div>
      </td>

      {/* Monto */}
      <td className="px-2 py-1 sm:px-3 sm:py-2 text-right min-w-0">
        <div className={`text-base sm:text-lg font-bold ${esPagado ? 'text-green-600' : 'text-yellow-600'}`}>€{fmtMonto(pago.monto)}</div>
      </td>

      {/* Estado */}
      <td className="hidden sm:table-cell px-2 py-1 sm:px-3 sm:py-2 min-w-0">
        {esPagado ? (
          <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t('paid')}
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            {t('pending')}
          </span>
        )}
      </td>

      {/* Acciones */}
      <td className="px-2 py-1 sm:px-3 sm:py-2 text-center min-w-0">
        {!esPagado ? (
          <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
            {Number(pago.monto) === 0 ? (
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-3 rounded-lg disabled:opacity-60"
                onClick={handleMarcarGratis}
              >
                {t('confirm_free_payment')}
              </button>
            ) : (
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold py-1.5 px-3 rounded-md shadow-sm disabled:opacity-60 transition-colors cursor-pointer"
                onClick={() => abrirModalPago(pago.id)}
              >
                {t('pay_now') || 'Pagar'}
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <button
              className="p-2 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-700 transition-colors shadow-sm hover:shadow flex items-center justify-center"
              title="Ver vista previa del recibo"
              aria-label="Ver vista previa del recibo"
              onClick={handleAbrirPreview}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
          </div>
        )}
      </td>
    </tr>
  );
}