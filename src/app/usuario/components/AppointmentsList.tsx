"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import AppointmentCard from './AppointmentCard';
import usuarioStyles from '../usuario.module.css';

export interface AppointmentData {
  id?: number | string;
  fecha: Date;
  hora: string;
  medico: string;
  especialidad?: string;
  tokenSala?: string;
  idRoom?: string;
  token?: string;
  notificacionesActivadas?: boolean;
  ultimoRecordatorioEnviado?: string | null;
}

interface AppointmentsListProps {
  citasFiltradas: AppointmentData[];
  filtroCitas: 'todas' | 'proximas' | 'pasadas';
  setVista: (vista: 'inicio' | 'citas' | 'especialistas' | 'pagos' | 'billing' | 'Reunion') => void;
  isRecordatorioOn: (cita: AppointmentData) => boolean;
  enviarRecordatorio: (cita: AppointmentData) => Promise<void>;
  desactivarRecordatorio: (cita: AppointmentData) => Promise<void>;
}

export default function AppointmentsList({
  citasFiltradas,
  filtroCitas,
  setVista,
  isRecordatorioOn,
  enviarRecordatorio,
  desactivarRecordatorio
}: AppointmentsListProps) {
  const { t } = useTranslation('common');

  return (
    <div className="lg:col-span-2 order-1 lg:order-2">
      <div className="space-y-4">
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="hidden sm:inline">
              {filtroCitas === 'todas' && t('list_heading_all')}
              {filtroCitas === 'proximas' && t('list_heading_upcoming')}
              {filtroCitas === 'pasadas' && t('list_heading_history')}
            </span>
            <span className="sm:hidden">
              {filtroCitas === 'todas' && t('filter_all')}
              {filtroCitas === 'proximas' && t('filter_upcoming')}
              {filtroCitas === 'pasadas' && t('filter_history')}
            </span>
          </h3>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            {citasFiltradas.length}
          </span>
        </div>

        <div className="pr-2 overflow-y-auto custom-scrollbar max-h-[50vh] sm:max-h-[55vh] md:max-h-[60vh] lg:max-h-[65vh] xl:max-h-[70vh]">
          {citasFiltradas.length === 0 ? (
            <div className={usuarioStyles.citasEmpty}>
              <svg className={usuarioStyles.citasEmptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div className={usuarioStyles.citasEmptyTitle}>
                {filtroCitas === 'proximas' && t('empty_upcoming_title')}
                {filtroCitas === 'pasadas' && t('empty_history_title')}
                {filtroCitas === 'todas' && t('empty_all_title')}
              </div>
              <div className={usuarioStyles.citasEmptyDescription}>
                {filtroCitas === 'proximas' && t('empty_upcoming_desc')}
                {filtroCitas === 'pasadas' && t('empty_history_desc')}
                {filtroCitas === 'todas' && t('empty_all_desc')}
              </div>
              <button 
                className={usuarioStyles.citasEmptyAction}
                onClick={() => setVista('inicio')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>{t('schedule_first_appointment')}</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {citasFiltradas.map((cita, idx) => (
                <AppointmentCard
                  key={cita.id ?? idx}
                  cita={cita}
                  isRecordatorioOn={isRecordatorioOn}
                  enviarRecordatorio={enviarRecordatorio}
                  desactivarRecordatorio={desactivarRecordatorio}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
