/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface ModalConfirmarEliminarProps {
  show: boolean;
  horarioAEliminar: any;
  loadingEliminar: number | null;
  citasEnHorario: any[];
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ModalConfirmarEliminar({
  show,
  horarioAEliminar,
  loadingEliminar,
  citasEnHorario,
  onCancel,
  onConfirm
}: ModalConfirmarEliminarProps) {
  if (!show || !horarioAEliminar) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-red-600 mb-4">⚠️ Confirmar Eliminación</h3>
        <div className="mb-4">
          <p className="text-gray-700 mb-2">
            ¿Estás seguro de eliminar este horario?
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
            <p className="font-semibold text-red-800">
              {horarioAEliminar.dia}: {horarioAEliminar.hora}
            </p>
          </div>
          {citasEnHorario.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-yellow-800 font-semibold text-sm">
                ⚠️ Hay {citasEnHorario.length} cita(s) programada(s) en este horario:
              </p>
              <ul className="text-yellow-700 text-xs mt-1">
                {citasEnHorario.slice(0, 3).map((cita, idx) => (
                  <li key={idx}>• {cita.fecha} {cita.hora} - {cita.paciente?.nombre || cita.usuario_email}</li>
                ))}
                {citasEnHorario.length > 3 && <li>• ...y {citasEnHorario.length - 3} más</li>}
              </ul>
            </div>
          )}
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loadingEliminar === horarioAEliminar?.horario?.id}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {loadingEliminar === horarioAEliminar?.horario?.id ? (
              <>
                <div className="animate-spin rounded-full border-2 border-white/30 border-t-white h-4 w-4"></div>
                Eliminando...
              </>
            ) : (
              'Sí, Eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
