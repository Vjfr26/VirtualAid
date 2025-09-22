"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import { MedicoResumen } from '../services/medicos';
import styles from '../usuario.module.css';

interface SpecialistsCardProps {
  especialistas: MedicoResumen[];
  loadingEspecialistas: boolean;
  onViewAll: () => void;
  onScheduleWith: (email?: string) => void;
  onSelectSpecialist: (medico: MedicoResumen) => void;
}

export default function SpecialistsCard({
  especialistas,
  loadingEspecialistas,
  onViewAll,
  onScheduleWith,
  onSelectSpecialist
}: SpecialistsCardProps) {
  const { t } = useTranslation('common');

  // Orden: disponibles primero, luego por nombre
  const especialistasInicio = [...especialistas].sort((a, b) => {
    const ad = a.disponible ? 1 : 0;
    const bd = b.disponible ? 1 : 0;
    if (bd - ad !== 0) return bd - ad;
    return (a.nombre || '').localeCompare(b.nombre || '');
  });

  return (
    <div className="bg-gradient-to-br from-white to-orange-50 rounded-xl shadow-lg p-4 border border-orange-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-1 flex items-center">
            <svg className="w-5 h-5 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {t('our_specialists')}
          </h2>
          <p className="text-gray-600 text-sm">
            {t('health_professionals_available', { count: especialistasInicio.length })}
          </p>
        </div>
        <button 
          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg font-medium flex cursor-pointer items-center space-x-1.5 text-sm transition-colors"
          onClick={onViewAll}
        >
          <span>{t('view_all')}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {loadingEspecialistas ? (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full border-4 border-orange-200 border-t-orange-600 h-12 w-12 mb-4"></div>
          <p className="text-orange-600 font-medium">{t('loading_specialists')}</p>
        </div>
      ) : especialistasInicio.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500">{t('no_specialists_found')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {especialistasInicio.slice(0, 6).map((medico, idx) => (
              <div 
                key={idx} 
                className={`group bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-orange-300 transition-all duration-300 cursor-pointer transform hover:-translate-y-1 ${styles.specialistCard}`}
                onClick={() => onSelectSpecialist(medico)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    {medico.avatar ? (
                      <Image
                        src={medico.avatar}
                        alt={`${medico.nombre} avatar`}
                        width={40}
                        height={40}
                        className={`rounded-full object-cover border-2 border-orange-100 group-hover:border-orange-300 transition-colors ${styles.specialistAvatar}`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://randomuser.me/api/portraits/lego/1.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center border-2 border-orange-100 group-hover:border-orange-300 transition-colors">
                        <span className="text-orange-600 font-bold text-sm">
                          {medico.nombre?.charAt(0).toUpperCase() || 'D'}
                        </span>
                      </div>
                    )}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white ${styles.statusIndicator}`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors text-sm">
                      <span className="truncate max-w-[120px] sm:max-w-[180px] inline-block" title={`${t('doctor_short')} ${medico.nombre} ${medico.apellido || ''}`}>
                        {t('doctor_short')} {medico.nombre} {medico.apellido || ''}
                      </span>
                    </h3>
                    <p className="text-orange-600 text-xs font-medium mb-0.5">{medico.especialidad}</p>
                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span>{medico.disponible ? t('available_today') : t('not_available')}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center space-y-0.5">
                    <button
                      className="bg-orange-600 hover:bg-orange-700 cursor-pointer text-white px-2 py-1 rounded text-xs font-medium transition-colors"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        onScheduleWith(medico.email || undefined); 
                      }}
                    >
                      {t('schedule')}
                    </button>
                    <svg className="w-3 h-3 text-gray-400 group-hover:text-orange-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {especialistas.length > 6 && (
            <div className="text-center pt-3 border-t border-gray-200">
              <p className="text-gray-600 mb-2 text-sm">
                +{especialistas.length - 6} {t('more_specialists_available')}
              </p>
              <button 
                onClick={onViewAll}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm"
              >
                {t('explore_all_specialists')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
