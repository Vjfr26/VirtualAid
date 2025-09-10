"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';

interface WelcomeHeaderProps {
  userName: string;
  nextAppointment?: Date | null;
  appointmentsCount: number;
}

export default function WelcomeHeader({
  userName,
  nextAppointment,
  appointmentsCount
}: WelcomeHeaderProps) {
  const { t } = useTranslation('common');

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 mb-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t('greeting_hello')} {userName}! 👋
          </h1>
          <p className="text-gray-600 mb-1">{t('greeting_subtitle')}</p>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </div>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="text-sm text-gray-600">{t('next_appointment')}</div>
            <div className="text-lg font-semibold text-blue-600">
              {appointmentsCount > 0 && nextAppointment
                ? nextAppointment.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })
                : t('no_appointments_short')
              }
            </div>
          </div>
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-green-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
