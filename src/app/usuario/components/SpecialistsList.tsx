"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MedicoResumen } from '../services/medicos';
import SpecialistCard from './SpecialistCard';

interface SpecialistsListProps {
  especialistasFiltrados: MedicoResumen[];
  loadingEspecialistas: boolean;
  onScheduleAppointment: (email: string) => void;
  onViewProfile: (medico: MedicoResumen) => void;
}

export default function SpecialistsList({
  especialistasFiltrados,
  loadingEspecialistas,
  onScheduleAppointment,
  onViewProfile
}: SpecialistsListProps) {
  const { t } = useTranslation('common');
  const scrollableContainerClass = 'max-h-[560px] overflow-y-auto pr-2 custom-scrollbar';

  if (loadingEspecialistas) {
    return (
      <div className={scrollableContainerClass}>
        <div className="space-y-3 animate-pulse pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-300 rounded mb-1.5 w-1/2"></div>
                  <div className="h-3 bg-gray-300 rounded mb-1 w-1/3"></div>
                  <div className="h-2.5 bg-gray-300 rounded w-1/4"></div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-7 bg-gray-300 rounded w-28"></div>
                  <div className="h-7 bg-gray-300 rounded w-28"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (especialistasFiltrados.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-10 h-10 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('no_specialists_found')}
          </h3>
          <p className="text-gray-500 max-w-sm">
            {t('try_adjusting_filters')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={scrollableContainerClass}>
      <div className="space-y-0 divide-y divide-gray-100 pb-2">
        {especialistasFiltrados.map((medico, index) => (
          <SpecialistCard
            key={medico.email || index}
            medico={medico}
            onScheduleAppointment={onScheduleAppointment}
            onViewProfile={onViewProfile}
          />
        ))}
      </div>
    </div>
  );
}
