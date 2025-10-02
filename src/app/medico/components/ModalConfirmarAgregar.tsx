import React from 'react';

interface ModalConfirmarAgregarProps {
  show: boolean;
  datosAgregar: any;
  loadingHorarios: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ModalConfirmarAgregar({
  show,
  datosAgregar,
  loadingHorarios,
  onCancel,
  onConfirm
}: ModalConfirmarAgregarProps) {
  if (!show || !datosAgregar) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Confirmar Horarios</h3>
        <div className="mb-4">
          <p className="text-gray-600 mb-2">
            <span className="font-semibold">Día:</span> {datosAgregar.dia}
          </p>
          <p className="text-gray-600 mb-2">
            <span className="font-semibold">Horarios a agregar:</span>
          </p>
          <ul className="list-disc list-inside text-gray-700 bg-gray-50 p-3 rounded-lg">
            {datosAgregar.horas.map((hora: string, idx: number) => (
              <li key={idx}>{hora}</li>
            ))}
          </ul>
        </div>
        <div className="flex gap-4 justify-center">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loadingHorarios}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loadingHorarios ? (
              <>
                <div className="animate-spin rounded-full border-2 border-white/30 border-t-white h-4 w-4"></div>
                Agregando...
              </>
            ) : (
              'Agregar Horarios'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
