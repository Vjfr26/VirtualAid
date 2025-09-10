"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';

interface AppointmentsHeaderProps {
  filtroCitas: 'todas' | 'proximas' | 'pasadas';
  setFiltroCitas: (filtro: 'todas' | 'proximas' | 'pasadas') => void;
  loadingCitas: boolean;
}

export default function AppointmentsHeader({
  filtroCitas,
  setFiltroCitas,
  loadingCitas
}: AppointmentsHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">{t('appointments_title')}</h2>
          <p className="text-sm sm:text-base text-gray-600">{t('appointments_subtitle')}</p>
        </div>
        <div className="flex items-center justify-center sm:justify-end">
          <div className="flex items-center space-x-1 bg-gray-50 rounded-lg p-1">
            <button
              onClick={() => setFiltroCitas('todas')}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all ${
                filtroCitas === 'todas' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="hidden sm:inline">{t('filter_all')}</span>
              <span className="sm:hidden">{t('filter_all_short')}</span>
            </button>
            <button
              onClick={() => setFiltroCitas('proximas')}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all ${
                filtroCitas === 'proximas' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="hidden sm:inline">{t('filter_upcoming')}</span>
              <span className="sm:hidden">{t('filter_upcoming_short')}</span>
            </button>
            <button
              onClick={() => setFiltroCitas('pasadas')}
              className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-all ${
                filtroCitas === 'pasadas' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              <span className="hidden sm:inline">{t('filter_history')}</span>
              <span className="sm:hidden">{t('filter_history_short')}</span>
            </button>
          </div>
        </div>
      </div>

      {loadingCitas && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="inline-block animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 h-12 w-12 mb-4" />
          <p className="text-blue-600 font-medium">{t('loading_appointments')}</p>
        </div>
      )}
    </div>
  );
}
