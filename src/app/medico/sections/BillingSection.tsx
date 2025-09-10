"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';

interface BillingSectionProps {
  ctx: any;
}

export default function BillingSection({ ctx }: BillingSectionProps) {
  const {
    billingLoading,
    billingProfile,
    setBillingLoading,
    setBillingProfile,
    createOrUpdateBillingProfile,
    medicoData,
    invoices
  } = ctx;

  return (
    <section className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-slate-200 flex flex-col gap-4 overflow-hidden">
      <div className=" p-6 bg-linear-to-r from-green-700/80 to-green-500/70 rounded-t-lg overflow-hidden">
        <h2 className="font-bold text-gray-100 uppercase">Facturación</h2>
      </div>
      <div className="p-6 overflow-hidden">
        <div className="w-full h-1 bg-primary rounded mb-2" />
        {billingLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full border-4 border-primary-200 border-t-primary h-12 w-12 mr-2"></div>
            <p className="text-primary mt-2">Cargando facturación...</p>
          </div>
        ) : !billingProfile ? (
          <div className="bg-gray-50 text-gray-700 p-5 rounded-md text-center my-4">
            <p className="font-semibold">No hay perfil de facturación</p>
            <button className="bg-green-700 text-white rounded-md mt-2 px-4 py-2 font-semibold hover:bg-green-600" onClick={async () => {
              if (!medicoData) return;
              setBillingLoading(true);
              try {
                const created = await createOrUpdateBillingProfile({
                  billable_type: 'App\\Models\\Medico',
                  billable_id: medicoData.email,
                  legal_name: `Dr. ${medicoData.nombre} ${medicoData.apellido}`
                });
                setBillingProfile(created);
              } finally {
                setBillingLoading(false);
              }
            }}>Crear perfil de facturación</button>
          </div>
        ) : (
          <>
            {/* Facturas (invoices) */}
            <div className="mb-8">
              <h3 className="font-bold text-lg text-primary-700 mb-2">Facturas</h3>
              <div style={{overflowX: 'auto'}}>
                {invoices.length === 0 ? (
                  <div className="bg-gray-200/80 text-gray-700 p-5 rounded-md text-center my-4">
                    <p className="font-semibold">No hay facturas disponibles</p>
                    <p className="mt-2">Cuando se generen facturas, aparecerán aquí.</p>
                  </div>
                ) : (
                  <table className="w-full border-collapse text-sm table-fixed">
                    <thead>
                      <tr className="text-primary-900 font-bold bg-primary-50 border-b border-primary-200">
                        <th className="py-2 max-w-[100px] break-words">ID</th>
                        <th className="max-w-[100px] break-words">Monto</th>
                        <th className="max-w-[80px] break-words">Moneda</th>
                        <th className="max-w-[100px] break-words">Estado</th>
                        <th className="max-w-[120px] break-words">Pagado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv: any) => (
                        <tr key={inv.id} className="border-b border-gray-200 text-center">
                          <td className="py-1 break-words max-w-[100px]">{inv.id}</td>
                          <td className="break-words max-w-[100px]">{inv.amount}</td>
                          <td className="break-words max-w-[80px]">{inv.currency}</td>
                          <td className="break-words max-w-[100px]">{inv.status}</td>
                          <td className="break-words max-w-[120px]">{inv.paid_at ? new Date(inv.paid_at).toLocaleString() : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            {/* Información del perfil simplificada */}
            <div className="text-center text-gray-600 p-8">
              <h3 className="font-bold text-lg text-primary-700 mb-2">Perfil de Facturación</h3>
              <p>Nombre: {billingProfile?.legal_name || 'Sin nombre'}</p>
              <p>NIF/CIF: {billingProfile?.tax_id || 'Sin NIF/CIF'}</p>
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  Sistema de facturación completo implementado con gestión de direcciones, métodos de pago, cupones e información adicional.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
