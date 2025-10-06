'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import MeetingItem from './MeetingItem';
import { getEspecialistas, type MedicoResumen } from '../../services/medicos';

interface MeetingsListProps {
  citasAgendadas: Array<{
    id?: string | number;
    fecha: Date;
    hora: string;
    medico: string;
    especialidad?: string;
    tokenSala?: string;
    idRoom?: string;
    token?: string;
  }>;
  reuniones: Array<{ 
    fecha: string; 
    medico: string; 
    hora: string; 
    archivo?: string | null;
    tokenSala?: string;
    idRoom?: string;
    token?: string;
  }>;
  pagos: Array<{ 
    id: number;
    fecha: string;
    fechaRaw: string; 
    medico: string; 
    especialidad?: string;
    monto: number;
    estado: string;
    idRoom?: string;
    tokenSala?: string;
  }>;
  setVista: (vista: 'inicio' | 'citas' | 'especialistas' | 'pagos' | 'billing' | 'Reunion') => void;
}

export default function MeetingsList({ 
  citasAgendadas, 
  reuniones, 
  pagos, 
  setVista 
}: MeetingsListProps) {
  const { t } = useTranslation('common');
  const [especialistas, setEspecialistas] = useState<MedicoResumen[]>([]);

  useEffect(() => {
    const cargarEspecialistas = async () => {
      try {
        const especialistasData = await getEspecialistas();
        setEspecialistas(especialistasData);
      } catch (error) {
        console.error('Error al cargar especialistas:', error);
      }
    };
    cargarEspecialistas();
  }, []);

  // Función para encontrar el avatar del médico por nombre
  const encontrarAvatarMedico = (nombreMedico: string): string | undefined => {
    const especialista = especialistas.find(esp => {
      const nombreCompleto = `${esp.nombre} ${esp.apellido || ''}`.trim();
      return nombreCompleto.toLowerCase() === nombreMedico.toLowerCase() || 
             esp.nombre.toLowerCase() === nombreMedico.toLowerCase();
    });
    return especialista?.avatar;
  };

  const EmptyState = () => (
    <div className="px-6 py-12 text-center">
      <div className="flex flex-col items-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no_meetings_registered')}</h3>
        <p className="text-gray-500 mb-6 max-w-md">{t('no_meetings_registered_desc')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setVista('citas')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('schedule_in_person_appointment')}
          </button>
        </div>
      </div>
    </div>
  );

  // Función para procesar y ordenar las reuniones/citas
  const processItems = () => {
    type Item = { 
      id: string|number; 
      fecha: string; 
      hora: string; 
      medico: string; 
      especialidad?: string; 
      archivo?: string|null;
      // Propagar identificadores de sala desde la cita
      token?: string;
      tokenSala?: string;
      idRoom?: string;
    };

    const items: Item[] = (citasAgendadas || []).map((c) => {
      // Buscar reunión coincidente por mismo médico, mismo día y misma hora
      const reunionCoincidente = (reuniones || []).find((r) => {
        const dCita = c.fecha;
        const dReu = new Date(r.fecha);
        const mismoDia = dCita.getFullYear() === dReu.getFullYear() && 
                        dCita.getMonth() === dReu.getMonth() && 
                        dCita.getDate() === dReu.getDate();
        const mismaHora = r.hora === c.hora;
        const mismoMedico = r.medico === c.medico;
        return mismoDia && mismaHora && mismoMedico;
      });

      return {
        id: `cita-${String((c as { id?: string|number }).id ?? c.medico + '-' + c.fecha.toISOString())}`,
        fecha: c.fecha.toISOString(),
        hora: c.hora,
        medico: c.medico,
        especialidad: c.especialidad,
        archivo: reunionCoincidente?.archivo ?? null,
        token: c.token,
        tokenSala: c.tokenSala,
        idRoom: c.idRoom,
      };
    });

    // Ordenamiento complejo
    return items.sort((a, b) => {
      const today = new Date();
      const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const da = new Date(a.fecha);
      const db = new Date(b.fecha);
      const daDay = normalize(da);
      const dbDay = normalize(db);
      const todayDay = normalize(today);

      const isSameDayA = daDay.getTime() === todayDay.getTime();
      const isSameDayB = dbDay.getTime() === todayDay.getTime();

      const rank = (isSame: boolean, d: Date) => {
        if (isSame) return 0; // mismo día primero
        if (d < todayDay) return 1; // pasadas después
        return 2; // futuras al final
      };

      const rankA = rank(isSameDayA, daDay);
      const rankB = rank(isSameDayB, dbDay);
      if (rankA !== rankB) return rankA - rankB;

      // Dentro del mismo grupo, orden específico
      const buildDT = (base: Date, hora: string) => {
        const dt = new Date(base);
        const parts = (hora || '00:00').split(':').map(Number);
        dt.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
        return dt;
      };
      const dta = buildDT(da, a.hora);
      const dtb = buildDT(db, b.hora);

      if (rankA === 0) {
        // Mismo día: por hora ascendente
        return dta.getTime() - dtb.getTime();
      } else if (rankA === 1) {
        // Pasadas: más reciente primero (desc)
        return dtb.getTime() - dta.getTime();
      } else {
        // Futuras: más próxima primero (asc)
        return dta.getTime() - dtb.getTime();
      }
    });
  };

  const items = processItems();

  // Footer con resumen
  const Footer = () => {
    if ((citasAgendadas?.length ?? 0) === 0) return null;

    const citasConArchivos = (citasAgendadas || []).filter(c => {
      const reunionCoincidente = (reuniones || []).find(r => {
        const dCita = c.fecha;
        const dReu = new Date(r.fecha);
        const mismoDia = dCita.getFullYear() === dReu.getFullYear() && 
                        dCita.getMonth() === dReu.getMonth() && 
                        dCita.getDate() === dReu.getDate();
        const mismaHora = r.hora === c.hora;
        const mismoMedico = r.medico === c.medico;
        return mismoDia && mismaHora && mismoMedico;
      });
      return !!reunionCoincidente?.archivo;
    }).length;

    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{t('total_meetings', { count: (citasAgendadas?.length ?? 0) })}</span>
            <span>•</span>
            <span>{t('with_files_count', { count: citasConArchivos })}</span>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <button 
              onClick={() => setVista('citas')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              {t('view_my_appointments')} →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">{t('consultations_history')}</h2>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('ordered_by_most_recent')}</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-hidden overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
        {(citasAgendadas?.length ?? 0) === 0 ? (
          <EmptyState />
        ) : (
          <div className="divide-y divide-gray-200">
            {items.map((reunion) => {
              const fechaReunion = new Date(reunion.fecha);
              const esReciente = (new Date().getTime() - fechaReunion.getTime()) < (7 * 24 * 60 * 60 * 1000); // 7 días
              
              // Heurística: pago con mismo médico y día
              const pagoRelacionado = pagos.find(p => {
                const dPago = p.fechaRaw ? new Date(p.fechaRaw) : null;
                const mismoDia = dPago && 
                              dPago.getFullYear() === fechaReunion.getFullYear() && 
                              dPago.getMonth() === fechaReunion.getMonth() && 
                              dPago.getDate() === fechaReunion.getDate();
                const mismoMedico = p.medico === reunion.medico;
                return mismoDia && mismoMedico;
              });
              
              const estadoPago = (pagoRelacionado?.estado || '').toString().toLowerCase();
              const pagado = estadoPago.includes('pagad') || estadoPago.includes('paid');
              const hoy = new Date();
              const isToday = fechaReunion.getFullYear() === hoy.getFullYear() && 
                            fechaReunion.getMonth() === hoy.getMonth() && 
                            fechaReunion.getDate() === hoy.getDate();
              const canJoin = pagado && isToday;

              return (
                <MeetingItem
                  key={reunion.id}
                  reunion={{
                    ...reunion,
                    medicoAvatar: encontrarAvatarMedico(reunion.medico)
                  }}
                  reuniones={reuniones}
                  pagos={pagos}
                  esReciente={esReciente}
                  canJoin={canJoin}
                  medicoInfo={especialistas.find(esp => {
                    const nombreCompleto = `${esp.nombre} ${esp.apellido || ''}`.trim();
                    return nombreCompleto.toLowerCase() === reunion.medico.toLowerCase() || 
                           esp.nombre.toLowerCase() === reunion.medico.toLowerCase();
                  })}
                />
              );
            })}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
