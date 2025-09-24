'use client';

import React from 'react';
import PaymentsHeader from './PaymentsHeader';
import PaymentsStats from './PaymentsStats';
import PaymentsTable from './PaymentsTable';

interface PaymentsViewProps {
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
  descargarRecibo: (pagoId: number) => Promise<{ blob: Blob; fileName: string }>;
  addToast: (message: string, type: 'success' | 'error') => void;
  refreshPagos: () => Promise<void>;
  setVista: React.Dispatch<React.SetStateAction<"inicio" | "citas" | "especialistas" | "pagos" | "billing" | "Reunion">>;
}

export default function PaymentsView({
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
}: PaymentsViewProps) {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header mejorado */}
      <PaymentsHeader pagos={pagos} />

      {/* Estadísticas de pagos */}
      <PaymentsStats pagos={pagos} />

      {/* Tabla de pagos mejorada */}
      <PaymentsTable
        pagos={pagos}
        pagosOrdenados={pagosOrdenados}
        pagosSort={pagosSort}
        toggleSort={toggleSort}
        loadingPagos={loadingPagos}
        fmtMonto={fmtMonto}
        abrirModalPago={abrirModalPago}
        marcarPagoGratis={marcarPagoGratis}
        descargarRecibo={descargarRecibo}
        addToast={addToast}
        refreshPagos={refreshPagos}
        setVista={setVista}
      />
    </div>
  );
}
