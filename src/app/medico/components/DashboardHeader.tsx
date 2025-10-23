import React from 'react';
import { useTranslation } from 'react-i18next';

interface DashboardHeaderProps {
  doctorName?: string;
}

export default function DashboardHeader({ doctorName }: DashboardHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 mb-6 shadow-xl border border-blue-200/50 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
          <span className="text-3xl">👨‍⚕️</span>
        </div>
        <div className="flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-wide">
            {t('medico.header.title')}
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-blue-100 text-sm">{t('medico.header.welcome')}</span>
            <span className="text-white font-semibold text-lg bg-white/20 px-3 py-1 rounded-lg backdrop-blur-sm">
              {doctorName || t('medico.header.doctor_fallback')}
            </span>
          </div>
        </div>
        <div className="hidden md:flex flex-col items-center text-center">
          <div className="text-white/90 text-xs font-medium mb-1">{t('medico.header.session_active')}</div>
          <div className="bg-green-400 text-green-900 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
            <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
            {t('medico.header.online')}
          </div>
        </div>
      </div>
    </div>
  );
}
