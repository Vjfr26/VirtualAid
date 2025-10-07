"use client";
import React from 'react';
import { useTranslation } from 'react-i18next';
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import usuarioStyles from '../usuario.module.css';
import type { AppointmentData } from './AppointmentsList';

interface AppointmentsCalendarProps {
  fechaSeleccionadaCalendario: Date | null;
  setFechaSeleccionadaCalendario: (fecha: Date | null) => void;
  citasFiltradas: AppointmentData[];
  citasFiltradasCalendario: AppointmentData[];
  citasProximas: AppointmentData[];
  citasPasadas: AppointmentData[];
  citasAgendadas: AppointmentData[];
}

export default function AppointmentsCalendar({
  fechaSeleccionadaCalendario,
  setFechaSeleccionadaCalendario,
  citasFiltradas,
  citasFiltradasCalendario,
  citasProximas,
  citasPasadas,
  citasAgendadas
}: AppointmentsCalendarProps) {
  const { t } = useTranslation('common');

  return (
    <div className="lg:col-span-2 order-2 lg:order-1">
      <div className={`${usuarioStyles.calendarWrapper} relative overflow-hidden`}>
        {/* Header del calendario con controles adicionales */}
        <div className={usuarioStyles.calendarHeader}>
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-600 rounded-xl flex items-center justify-center mr-3 shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="hidden sm:inline">{t('calendar')}</span>
            <span className="sm:hidden">{t('calendar')}</span>
          </h3>
          <div className="flex items-center space-x-2">
            <button 
              className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              onClick={() => setFechaSeleccionadaCalendario(new Date())}
              title={t('go_to_today')}
            >
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Calendario principal */}
        <div className="relative text-gray-600">
          <Calendar
            className={usuarioStyles.calendarBox}
            value={fechaSeleccionadaCalendario || new Date()}
            onChange={(date) => setFechaSeleccionadaCalendario(date as Date)}
            selectRange={false}
            locale="es-ES"
            showNeighboringMonth={false}
            tileClassName={({ date, view }) => {
              if (view === 'month') {
                // Usar las citas filtradas por vista (todas/proximas/pasadas), no por fecha seleccionada
                const tieneCita = citasFiltradas.some(c => 
                  c.fecha.toDateString() === date.toDateString()
                );
                const esHoy = new Date().toDateString() === date.toDateString();
                const esFechaSeleccionada = fechaSeleccionadaCalendario?.toDateString() === date.toDateString();
                
                const clases = [];
                if (tieneCita) clases.push('has-appointment', 'relative', 'badge-anchor');
                if (esHoy) clases.push('is-today');
                if (esFechaSeleccionada) clases.push('is-selected');
                
                return clases.join(' ');
              }
              return '';
            }}
            tileContent={({ date, view }) => {
              if (view === 'month') {
                // Mantener conteos visibles siempre usando las citas filtradas globalmente
                const citasEnFecha = citasFiltradas.filter(c => 
                  c.fecha.toDateString() === date.toDateString()
                );
                if (citasEnFecha.length > 0) {
                  const hoy = new Date();
                  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
                  const esPasada = date < inicioHoy;
                  const esHoy = date.toDateString() === hoy.toDateString();
                  return (
                    <div className="absolute top-1 right-1 z-[2] pointer-events-none select-none">
                      <span
                        className={`text-[10px] leading-none font-bold px-1.5 py-0.5 rounded-[4px] shadow border border-white ${
                          esPasada
                            ? 'bg-gray-600 text-white'
                            : esHoy
                              ? 'bg-green-600 text-white'
                              : 'bg-blue-600 text-white'
                        }`}
                      >
                        {citasEnFecha.length}
                      </span>
                    </div>
                  );
                }
              }
              return null;
            }}
            tileDisabled={({ date, view }) => {
              // Opcional: deshabilitar fechas futuras muy lejanas
              if (view === 'month') {
                const hoy = new Date();
                const seiseMesesAdelante = new Date();
                seiseMesesAdelante.setMonth(hoy.getMonth() + 6);
                return date > seiseMesesAdelante;
              }
              return false;
            }}
          />
        </div>
        
        {/* Estadísticas mejoradas */}
        <div className={`${usuarioStyles.calendarStats} mt-4`}>
          <div className={`${usuarioStyles.calendarStat} group hover:scale-105 transition-transform cursor-pointer`}>
            <div className={`${usuarioStyles.calendarStatNumber} ${usuarioStyles.upcoming}`}>
              {citasProximas.length}
            </div>
            <div className={usuarioStyles.calendarStatLabel}>{t('stats_upcoming')}</div>
            <div className="mt-1 w-full bg-green-100 rounded-full h-1">
              <div 
                className="bg-green-500 h-1 rounded-full transition-all duration-500"
                style={{
                  width: `${citasAgendadas.length ? (citasProximas.length / citasAgendadas.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>
          
          <div className={`${usuarioStyles.calendarStat} group hover:scale-105 transition-transform cursor-pointer`}>
            <div className={`${usuarioStyles.calendarStatNumber} ${usuarioStyles.completed}`}>
              {citasPasadas.length}
            </div>
            <div className={usuarioStyles.calendarStatLabel}>{t('stats_completed')}</div>
            <div className="mt-1 w-full bg-gray-100 rounded-full h-1">
              <div 
                className="bg-gray-500 h-1 rounded-full transition-all duration-500"
                style={{
                  width: `${citasAgendadas.length ? (citasPasadas.length / citasAgendadas.length) * 100 : 0}%`
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Indicadores de estado en el calendario */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <div className="flex items-center space-x-1.5 bg-white rounded-lg px-2 py-1 shadow-sm border">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-gray-600 font-medium">{t('legend_today')}</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-white rounded-lg px-2 py-1 shadow-sm border">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-600 font-medium">{t('legend_with_appointments')}</span>
          </div>
          <div className="flex items-center space-x-1.5 bg-white rounded-lg px-2 py-1 shadow-sm border">
            <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            <span className="text-gray-600 font-medium">{t('legend_past')}</span>
          </div>
        </div>
        
        {/* Información de fecha seleccionada */}
        {fechaSeleccionadaCalendario && (
          <div className="mt-4 p-3 bg-white rounded-xl border border-blue-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">
                {fechaSeleccionadaCalendario.toLocaleDateString('es-ES', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </h4>
              {fechaSeleccionadaCalendario.toDateString() === new Date().toDateString() && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {t('legend_today')}
                </span>
              )}
            </div>
            {citasFiltradasCalendario.filter(c => 
              c.fecha.toDateString() === fechaSeleccionadaCalendario.toDateString()
            ).length > 0 ? (
              <div className="space-y-1">
                {citasFiltradasCalendario
                  .filter(c => c.fecha.toDateString() === fechaSeleccionadaCalendario.toDateString())
                  .map((cita, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-600">
                      <svg className="w-3 h-3 text-blue-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="truncate max-w-[220px] inline-block" title={`${t('doctor_short')} ${cita.medico}`}>
                        {cita.hora} - {t('doctor_short')} {cita.medico}
                      </span>
                    </div>
                  ))
                }
              </div>
            ) : (
              <p className="text-sm text-gray-500">{t('info_no_appointments_for_day')}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
