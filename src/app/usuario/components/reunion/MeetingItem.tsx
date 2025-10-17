'use client';

import React from 'react';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import { getMedicoStatus, type MedicoResumen } from '../../services/medicos';

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
    medicoAvatar?: string; // Nueva prop para el avatar del médico
  };
  esReciente: boolean;
  pagado: boolean;
  canJoin: boolean;
  medicoInfo?: MedicoResumen; // Nueva prop para información completa del médico
  onRequestJoin: () => void;
  onViewArchive: () => void;
  archiveLoading?: boolean;
}

export default function MeetingItem({ 
  reunion, 
  esReciente, 
  pagado,
  canJoin,
  medicoInfo,
  onRequestJoin,
  onViewArchive,
  archiveLoading,
}: MeetingItemProps) {
  const { t, i18n } = useTranslation('common');
  const fechaReunion = new Date(reunion.fecha);

  return (
    <div className={`p-6 hover:bg-gray-50 transition-colors ${esReciente ? 'bg-green-25' : ''}`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        {/* Información principal */}
        <div className="flex-1 min-w-0 mb-4 lg:mb-0">
          <div className="flex items-start space-x-4">
            {/* Avatar del médico */}
            <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-green-100 to-teal-100">
              {reunion.medicoAvatar ? (
                <Image
                  src={reunion.medicoAvatar}
                  alt={`Foto de ${reunion.medico}`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover rounded-full"
                  onError={() => {
                    // Fallback al ícono si la imagen falla
                    const parent = document.querySelector('.avatar-fallback');
                    if (parent) {
                      parent.innerHTML = `
                        <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      `;
                    }
                  }}
                />
              ) : (
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
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
                {medicoInfo && (() => {
                  const medicoStatus = getMedicoStatus(medicoInfo);
                  return (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      medicoStatus.color === 'bg-green-500' ? 'bg-green-100 text-green-800' :
                      medicoStatus.color === 'bg-yellow-500' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {medicoStatus.showDot && (
                        <div className={`w-2 h-2 ${medicoStatus.color} rounded-full mr-1 animate-pulse`}></div>
                      )}
                      {medicoStatus.status}
                    </span>
                  );
                })()}
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
            <button
              type="button"
              onClick={onViewArchive}
              disabled={archiveLoading}
              className={`px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1.5 border text-sm ${
                archiveLoading
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-progress'
                  : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'
              }`}
              title={t('view_chat_archive_tooltip', 'Ver resumen de la cita')}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a2 2 0 00-.586-1.414l-4.414-4.414A2 2 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>{archiveLoading ? t('loading', 'Cargando...') : t('view_chat_archive_button', 'Archivo')}</span>
            </button>

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
            onClick={onRequestJoin}
            className={`px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1.5 border text-sm ${
              pagado 
                ? 'bg-green-600 hover:bg-green-700 text-white border-green-600' 
                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{t('join_meeting')}</span>
          </button>
          {!pagado && (
            <span className="text-xs text-orange-600 text-center">
              {t('meeting_payment_pending', 'Pago pendiente para habilitar la reunión')}
            </span>
          )}
          {pagado && !canJoin && (
            <span className="text-xs text-gray-500 text-center">
              {t('join_meeting_unavailable')}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
