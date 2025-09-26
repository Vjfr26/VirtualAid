"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import usuarioStyles from '../usuario.module.css';

interface AppointmentCardProps {
  cita: {
    fecha: Date;
    hora: string;
    medico: string;
    especialidad?: string;
  };
  isRecordatorioOn: (cita: { fecha: Date; hora: string; medico: string; especialidad?: string }) => boolean;
  toggleRecordatorio: (cita: { fecha: Date; hora: string; medico: string; especialidad?: string }) => Promise<void>;
}

export default function AppointmentCard({
  cita,
  isRecordatorioOn,
  toggleRecordatorio
}: AppointmentCardProps) {
  const { t } = useTranslation('common');
  const [procesandoRecordatorio, setProcesandoRecordatorio] = React.useState(false);
  
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const esPasada = cita.fecha < inicioHoy;
  const esHoy = cita.fecha.toDateString() === hoy.toDateString();
  const diasRestantes = Math.ceil((cita.fecha.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div 
      className={`${usuarioStyles.citaCard} ${
        esPasada 
          ? usuarioStyles.citaCardPast
          : esHoy 
            ? usuarioStyles.citaCardToday
            : usuarioStyles.citaCardUpcoming
      }`}
    >
      {/* Header de la cita */}
      <div className={usuarioStyles.citaCardHeader}>
        <div>
          <div className={usuarioStyles.citaCardDate}>
            {cita.fecha.toLocaleDateString('es-ES', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
          <div className={usuarioStyles.citaCardTime}>
            <svg className={usuarioStyles.citaCardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {cita.hora}
          </div>
        </div>
        
        <div className={`${usuarioStyles.citaCardStatus} ${
          esPasada 
            ? usuarioStyles.citaCardStatusPast
            : esHoy 
              ? usuarioStyles.citaCardStatusToday
              : usuarioStyles.citaCardStatusUpcoming
        }`}>
          {esPasada 
            ? t('status_completed') 
            : esHoy 
              ? t('legend_today') 
              : t(diasRestantes === 1 ? 'status_in_days_one' : 'status_in_days_other', { count: diasRestantes })}
        </div>
      </div>

      {/* Cuerpo de la cita */}
      <div className={usuarioStyles.citaCardBody}>
        <div className={usuarioStyles.citaCardInfo}>
          <svg className={usuarioStyles.citaCardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="font-semibold truncate max-w-[220px] inline-block" title={`${t('doctor_short')} ${cita.medico}`}>
            {t('doctor_short')} {cita.medico}
          </span>
        </div>
        
        {cita.especialidad && (
          <div className={usuarioStyles.citaCardInfo}>
            <svg className={usuarioStyles.citaCardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>{cita.especialidad}</span>
          </div>
        )}
        
        {/* Información adicional contextual */}
        {esHoy && (
          <div className={usuarioStyles.citaCardInfo}>
            <svg className={usuarioStyles.citaCardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-orange-600 font-medium">{t('appointment_is_today')}</span>
          </div>
        )}
        
        {diasRestantes === 1 && !esHoy && (
          <div className={usuarioStyles.citaCardInfo}>
            <svg className={usuarioStyles.citaCardIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-600 font-medium">{t('appointment_tomorrow')}</span>
          </div>
        )}
      </div>

      {/* Acciones de la cita */}
      <div className={usuarioStyles.citaCardActions}>
        {!esPasada && (() => {
          const on = isRecordatorioOn(cita);
          return (
            <button
              type="button"
              className={`${usuarioStyles.citaCardAction} ${on ? usuarioStyles.citaCardActionSuccess : usuarioStyles.citaCardActionPrimary} ${procesandoRecordatorio ? 'opacity-70 cursor-wait' : ''}`}
              onClick={async () => {
                if (procesandoRecordatorio) return;
                setProcesandoRecordatorio(true);
                try {
                  await toggleRecordatorio(cita);
                } finally {
                  setProcesandoRecordatorio(false);
                }
              }}
              disabled={procesandoRecordatorio}
              aria-pressed={on}
              title={
                procesandoRecordatorio 
                  ? 'Procesando recordatorio...' 
                  : on 
                    ? (t('disable_reminder') as string) 
                    : (t('enable_reminder') as string)
              }
            >
              {procesandoRecordatorio ? (
                // Spinner de carga
                <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {/* Campana */}
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.73 21a2 2 0 01-3.46 0" />
                  {/* Trazo de desactivación cuando está activo */}
                  {on && (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                  )}
                </svg>
              )}
              {procesandoRecordatorio 
                ? 'Enviando...'
                : on 
                  ? t('disable_reminder') 
                  : t('enable_reminder')}
            </button>
          );
        })()}
        {esPasada && (
          <button className={`${usuarioStyles.citaCardAction} ${usuarioStyles.citaCardActionSecondary}`} type="button">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {t('report')}
          </button>
        )}
      </div>
    </div>
  );
}
