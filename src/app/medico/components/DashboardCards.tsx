import React from 'react';
import { resumenGradients } from '../utils';
import { formatearMonto, calcularIngresosPorPeriodo, type Pago } from '../services';

interface DashboardCardsProps {
  resumen: Array<{
    titulo: string;
    valor: string | number;
    icono: string;
    bg: string;
    detalles?: string[];
  }>;
  mostrarDetalleIngresos: boolean;
  setMostrarDetalleIngresos: (show: boolean) => void;
  pagos: Pago[];
  loadingPagos: boolean;
  totalIngresos: number;
}

export default function DashboardCards({
  resumen,
  mostrarDetalleIngresos,
  setMostrarDetalleIngresos,
  pagos,
  loadingPagos,
  totalIngresos
}: DashboardCardsProps) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
        {resumen.map((item, idx) => {
          // Seleccionar un gradiente diferente para cada tarjeta
          const grad = resumenGradients[idx % resumenGradients.length];
          // Determinar si es el card de ingresos para agregar funcionalidad especial
          const esCardIngresos = item.titulo === "Ingresos";
          return (
            <div
              key={idx}
              className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50 ${esCardIngresos ? 'cursor-pointer shadow-green-500/30 hover:shadow-green-500/50' : ''}`}
              onClick={esCardIngresos ? () => setMostrarDetalleIngresos(!mostrarDetalleIngresos) : undefined}
            >
              {/* Efecto de brillo */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              {/* Contenido de la tarjeta */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-xl ${item.bg} text-white shadow-lg`}>
                    <span className="text-2xl">{item.icono}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-gray-200">{item.valor}</div>
                  </div>
                </div>
                <div className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
                  {item.titulo}
                </div>
                {item.detalles?.length ? (
                  <ul className="mt-3 space-y-1 text-sm text-gray-100">
                    {item.detalles.map((detalle, detalleIdx) => (
                      <li key={detalleIdx} className="flex items-start gap-2">
                        <span className="text-lg leading-none">•</span>
                        <span className="leading-snug text-gray-100/90">{detalle}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              
              {/* Decoración inferior */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 ${item.bg}`}></div>
            </div>
          );
        })}
      </div>
      
      {/* Panel de detalle de ingresos */}
      {mostrarDetalleIngresos && (
        <div className="mb-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl shadow-lg border border-emerald-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-emerald-800">📊 Detalle de Ingresos</h3>
            <button 
              onClick={() => setMostrarDetalleIngresos(false)}
              className="text-emerald-600 hover:text-emerald-800 text-xl font-bold"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100">
              <div className="text-sm text-emerald-600 font-semibold">Total del Mes</div>
              <div className="text-2xl font-bold text-emerald-800">
                {loadingPagos ? "..." : formatearMonto(calcularIngresosPorPeriodo(pagos, 'mes'))}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100">
              <div className="text-sm text-emerald-600 font-semibold">Total General</div>
              <div className="text-2xl font-bold text-emerald-800">
                {loadingPagos ? "..." : formatearMonto(totalIngresos)}
              </div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100">
              <div className="text-sm text-emerald-600 font-semibold">Pagos Completados</div>
              <div className="text-2xl font-bold text-emerald-800">{pagos.length}</div>
            </div>
          </div>
          
          {/* Lista de pagos recientes */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-emerald-100">
            <h4 className="font-semibold text-emerald-800 mb-3">Pagos Recientes</h4>
            {loadingPagos ? (
              <div className="text-center py-4">
                <div className="inline-block animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600 h-8 w-8"></div>
              </div>
            ) : pagos.length === 0 ? (
              <div className="text-gray-500 text-center py-4">No hay pagos registrados</div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {pagos.slice(0, 5).map((pago) => (
                  <div key={pago.id} className="flex justify-between items-center py-2 px-3 bg-emerald-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-800">
                        {formatearMonto(pago.monto)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(pago.fecha_pago).toLocaleDateString('es-ES')} - {pago.metodo}
                      </div>
                    </div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        pago.estado === 'completado' ? 'bg-green-100 text-green-800' :
                        pago.estado === 'pagado' ? 'bg-blue-100 text-blue-800' :
                        pago.estado === 'confirmado' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {pago.estado}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
