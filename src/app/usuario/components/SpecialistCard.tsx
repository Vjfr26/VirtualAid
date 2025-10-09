"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { MedicoResumen } from '../services/medicos';

interface SpecialistCardProps {
  medico: MedicoResumen;
  onScheduleAppointment: (email: string) => void;
  onViewProfile: (medico: MedicoResumen) => void;
}

export default function SpecialistCard({
  medico,
  onScheduleAppointment,
  onViewProfile
}: SpecialistCardProps) {
  const { t } = useTranslation('common');

  return (
    <div className="group p-4 hover:bg-orange-50 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <div className="relative">
            {(() => {
              let avatarSrc = medico.avatar || '';
              // Normalizar URL del avatar
              if (avatarSrc.startsWith('/perfiles/') || avatarSrc.startsWith('/storage/') || avatarSrc.startsWith('http')) {
                // Ya tiene prefijo correcto o es URL absoluta
              } else if (avatarSrc) {
                // Agregar /storage/ solo si no lo tiene
                avatarSrc = `/storage/${avatarSrc}`;
              } else {
                avatarSrc = 'https://randomuser.me/api/portraits/lego/1.jpg';
              }
              
              return avatarSrc ? (
                <Image
                  src={avatarSrc}
                  alt={medico.nombre + ' avatar'}
                  width={48}
                  height={48}
                  className="rounded-full object-cover border-2 border-orange-200 group-hover:border-orange-400 transition-colors"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://randomuser.me/api/portraits/lego/1.jpg'; }}
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center border-2 border-orange-200 group-hover:border-orange-400 transition-colors">
                  <span className="text-orange-600 font-bold text-lg">
                    {medico.nombre?.charAt(0).toUpperCase() || 'D'}
                  </span>
                </div>
              );
            })()}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
              medico.disponible ? 'bg-green-500' : 'bg-red-500'
            }`}>
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="text-base font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                <span className="truncate max-w-[140px] sm:max-w-[200px] inline-block" title={`${t('doctor_short')} ${medico.nombre} ${medico.apellido || ''}`}>
                  {t('doctor_short')} {medico.nombre} {medico.apellido || ''}
                </span>
              </h3>
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                medico.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {medico.disponible ? t('available') : t('not_available')}
              </span>
            </div>
            
            <div className="flex items-center space-x-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 7.172V5L8 4z" />
              </svg>
              <span className="text-orange-600 font-medium text-sm">{medico.especialidad}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                </svg>
                <span>{medico.disponible ? t('available_today') : t('not_available')}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col space-y-1.5 mt-3 sm:mt-0 sm:ml-3 w-full sm:w-auto">
          <button 
            onClick={() => onScheduleAppointment(medico.email || '')}
            className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 flex items-center justify-center space-x-1.5 text-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{t('schedule_appointment')}</span>
          </button>
          
          <button 
            onClick={() => onViewProfile(medico)}
            className="w-full sm:w-auto border border-gray-300 hover:border-orange-300 text-gray-700 hover:text-orange-700 px-4 py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center space-x-1.5 text-sm"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t('view_profile')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
