'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';

interface MeetingItemProps {
  reunion: {
    id: string | number;
    fecha: string;
    hora: string;
    medico: string;
    especialidad?: string;
    archivo?: string | null;
    tokenSala?: string;
    idRoom?: string;
    token?: string;
  };
  reuniones: Array<{ fecha: string; medico: string; hora: string; archivo?: string | null; tokenSala?: string; idRoom?: string }>;
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
  esReciente: boolean;
  canJoin: boolean;
}

export default function MeetingItem({ 
  reunion, 
  reuniones, 
  pagos, 
  esReciente, 
  canJoin 
}: MeetingItemProps) {
  const { t, i18n } = useTranslation('common');
  const fechaReunion = new Date(reunion.fecha);

  const handleJoinMeeting = () => {
    if (!canJoin) return;
    
    // Construir URL con token de sala (si disponible) y hora de inicio
    const getRoomToken = (obj: unknown): string | undefined => {
      if (!obj || typeof obj !== 'object') return undefined;
      const o = obj as Record<string, unknown>;
      // aceptar variantes y limpiar espacios
      const val = (v: unknown) => (typeof v === 'string' ? v.trim() : undefined);
      const token = val(o.token);
      const idRoom = val(o.idRoom) || val((o as Record<string, unknown>)['id_room']);
      const tokenSala = val(o.tokenSala) || val((o as Record<string, unknown>)['token_sala']);
      if (token) return token; // prioridad al campo 'token' de la cita
      if (idRoom) return idRoom;
      if (tokenSala) return tokenSala;
      return undefined;
    };
    
    const reunionCoincidente = reuniones.find(r => 
      r.medico === reunion.medico && 
      r.hora === reunion.hora && 
      new Date(r.fecha).toDateString() === new Date(reunion.fecha).toDateString()
    );
    
    const pagoCoincidente = pagos.find(p => p.medico === reunion.medico);
    // Resolver tokens desde cada posible fuente para loguear su origen
    const tokenFromCita = getRoomToken(reunion);
    const tokenFromReunion = getRoomToken(reunionCoincidente);
    const tokenFromPago = getRoomToken(pagoCoincidente);
    // Priorizar: token/idRoom/tokenSala de la cita (reunion), luego reuniónCoincidente y pago
    const tokenSala = tokenFromCita || tokenFromReunion || tokenFromPago;

    // Logs de diagnóstico solicitados
    try {
      // Info breve
      console.log('[Reunión] Solicitando token', {
        medico: reunion.medico,
        fecha: reunion.fecha,
        hora: reunion.hora,
      });
      // Detalle de fuentes
      console.log('[Reunión] Tokens encontrados', {
        tokenFromCita,
        tokenFromReunion,
        tokenFromPago,
        tokenUsado: tokenSala,
      });
    } catch {}
    const startAtISO = new Date(reunion.fecha).toISOString();
    const url = new URL('/reunion', window.location.origin);
    
    if (tokenSala) url.searchParams.set('room', tokenSala);
    url.searchParams.set('startAt', startAtISO);
    url.searchParams.set('who', 'patient');
    
    // Abrir en nueva pestaña
    if (typeof window !== 'undefined') {
      try {
        console.log('[Reunión] URL de unión construida', url.toString());
      } catch {}
      window.open(url.toString(), '_blank');
    }
  };

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${esReciente ? 'bg-green-25' : ''}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* Información principal */}
        <div className="flex-1 min-w-0 mb-4 lg:mb-0">
          <div className="flex items-start space-x-4">
            {/* Avatar del médico */}
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-teal-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            {/* Detalles de la reunión */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 
                  className="text-lg font-semibold text-gray-900 truncate max-w-[220px]" 
                  title={`${t('doctor_short')} ${reunion.medico}`}
                >
                  {t('doctor_short')} {reunion.medico}
                </h3>
                {esReciente && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                    {t('recent')}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-2">
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>
                    {fechaReunion.toLocaleDateString(i18n?.language || undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{reunion.hora}</span>
                </div>
                
                {reunion.especialidad && (
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
                    </svg>
                    <span className="text-blue-600 font-medium">{reunion.especialidad}</span>
                  </div>
                )}
              </div>
              
              {/* Estado del archivo */}
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1 text-xs px-2 py-1 rounded-full ${
                  reunion.archivo 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{reunion.archivo ? t('document_available') : t('no_documents')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="flex flex-col gap-2">
          {reunion.archivo ? (
            <a
              href={reunion.archivo?.startsWith('/perfiles/') ? reunion.archivo : `/storage/${reunion.archivo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-1.5 shadow-md text-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>{t('download_file')}</span>
            </a>
          ) : (
            <div className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-lg font-medium text-center text-sm">
              <svg className="w-3.5 h-3.5 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('no_file')}
            </div>
          )}
          
          {/* Botón para unirse a la reunión */}
          <button
            type="button"
            disabled={!canJoin}
            onClick={handleJoinMeeting}
            title={canJoin ? '' : t('join_meeting_unavailable')}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1.5 border text-sm ${
              canJoin 
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{t('join_meeting')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
