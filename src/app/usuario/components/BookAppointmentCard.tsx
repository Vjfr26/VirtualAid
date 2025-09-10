"use client";
import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import styles from '../calendar.module.css';
import { MedicoResumen } from '../services/medicos';
import { Horario } from '../../medico/services/horarios';

interface BookAppointmentCardProps {
  mostrarCalendario: boolean;
  setMostrarCalendario: (show: boolean) => void;
  medicoSeleccionado: string;
  setMedicoSeleccionado: (medico: string) => void;
  fecha: Date | null;
  setFecha: (fecha: Date | null) => void;
  horaSeleccionada: string;
  setHoraSeleccionada: (hora: string) => void;
  especialistas: MedicoResumen[];
  horariosMedico: Horario[];
  horasDisponibles: string[];
  citasAgendadas: Array<{ fecha: Date; hora: string; medico: string; especialidad?: string }>;
  citasMedico: Array<{ fecha: string; hora?: string }>;
  busqueda: string;
  setBusqueda: (busqueda: string) => void;
  onSolicitarCita: () => void;
  onCancelarCalendario: () => void;
}

export default function BookAppointmentCard({
  mostrarCalendario,
  setMostrarCalendario,
  medicoSeleccionado,
  setMedicoSeleccionado,
  fecha,
  setFecha,
  horaSeleccionada,
  setHoraSeleccionada,
  especialistas,
  horariosMedico,
  horasDisponibles,
  citasAgendadas,
  citasMedico,
  busqueda,
  setBusqueda,
  onSolicitarCita,
  onCancelarCalendario
}: BookAppointmentCardProps) {
  const { t } = useTranslation('common');
  const solicitarCitaRef = useRef<HTMLDivElement | null>(null);
  


  return (
    <div ref={solicitarCitaRef} className="bg-white rounded-xl shadow-lg p-6 mb-8 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">{t('book_appointment')}</h2>
          <p className="text-gray-600">{t('description')}</p>
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-purple-300 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:shadow-xl hover:bg-radial transition-shadow transform hover:scale-105" 
             onClick={() => { window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); setMostrarCalendario(true); }} 
             title={t('go_to_request_form')}>
          <svg className="w-8 h-8 text-purple-700 drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
      </div>

      {/* Barra de búsqueda mejorada */}
      <div className="mb-6">
        <div className="relative">
          <input
            className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-700 shadow-sm"
            type="text"
            placeholder={t('search_specialist_placeholder')}
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex justify-center">
        {!mostrarCalendario ? (
          <button 
            className="bg-gradient-to-r from-purple-600 to-purple-400 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:from-purple-700 hover:to-purple-600 transform hover:scale-105 transition-all duration-200 flex items-center cursor-pointer space-x-2" 
            onClick={() => setMostrarCalendario(true)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{t('book_appointment')}</span>
          </button>
        ) : (
          <div className={`${styles.calendarBox} w-full max-w-xl mx-auto`}>
            <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-purple-50 rounded-2xl p-6 mb-6 border border-purple-100 shadow-sm">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <label className="text-lg font-bold text-gray-800">{t('choose_specialty')}</label>
              </div>
              
              <div className="relative">
                <select
                  className="w-full border-2 border-purple-200 rounded-xl px-4 py-4 text-gray-700 bg-white font-medium shadow-sm focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-20 focus:border-blue-500 cursor-pointer transition-all duration-300 appearance-none text-base"
                  value={medicoSeleccionado}
                  onChange={e => {
                    setMedicoSeleccionado(e.target.value);
                    setFecha(null);
                    setHoraSeleccionada("");
                    setMostrarCalendario(true);
                  }}
                >
                  <option value="" className="text-gray-500">{t('choose_health_professional_placeholder')}</option>
                  {especialistas
                    .filter(medico => !!medico.email)
                    .map((medico, idx) => (
                    <option key={idx} value={medico.email!}>
                      🩺 <span className="truncate max-w-[160px] inline-block" title={`${t('doctor_short')} ${medico.nombre}`}>
                        {t('doctor_short')} {medico.nombre}
                      </span>
                      <span className="text-gray-500 ml-1 hidden sm:inline">- {medico.especialidad}</span>
                    </option>
                  ))}
                </select>
                
                {/* Flecha personalizada para el select */}
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {medicoSeleccionado && (
              <>
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {t('select_preferred_date')}
                    </h3>
                    {fecha && (
                      <span className="bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1 rounded-full">
                        {fecha.toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    )}
                  </div>

                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-purple-50 to-indigo-50 p-2 shadow-lg">
                    <Calendar
                      className={styles.calendarBox}
                      onChange={date => {
                        if (date instanceof Date) {
                          setFecha(date);
                        } else {
                          setFecha(null);
                        }
                        setHoraSeleccionada("");
                      }}
                      value={fecha}
                      minDate={new Date()}
                      locale="es-ES"
                      formatDay={(locale, date) => date.getDate().toString()}
                      formatMonthYear={(locale, date) => 
                        date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
                      }
                      tileContent={({ date, view }) => {
                        if (view === 'month') {
                          // Contar citas para este día
                          const citasEnEsteDia = citasAgendadas.filter(cita => 
                            cita.fecha.toDateString() === date.toDateString()
                          );
                          
                          if (citasEnEsteDia.length > 0) {
                            return (
                              <div className="custom-tile-content">
                                <span style={{ 
                                  fontSize: '18px', 
                                  fontWeight: '800', 
                                  color: '#991b1b',
                                  textShadow: '0 1px 2px rgba(0,0,0,0.1)'
                                }}>
                                  {date.getDate()}
                                </span>
                                <span style={{ 
                                  fontSize: '10px', 
                                  fontWeight: '600', 
                                  color: '#dc2626',
                                  marginTop: '2px',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.5px'
                                }}>
                                  {citasEnEsteDia.length} cita{citasEnEsteDia.length > 1 ? 's' : ''}
                                </span>
                              </div>
                            );
                          }
                        }
                        return null;
                      }}
                      tileClassName={({ date, view }) => {
                        if (view === 'month') {
                          const tieneCita = citasAgendadas.some(cita => 
                            cita.fecha.toDateString() === date.toDateString()
                          );
                          return tieneCita ? 'has-appointments' : '';
                        }
                        return '';
                      }}
                      tileDisabled={({ date, view }) => {
                        if (view !== 'month') return false;
                        if (!horariosMedico.length) return true;
                        const dia = date.getDay();
                        const tiene = horariosMedico.some(h => h.dia_semana === dia);
                        return !tiene || date < new Date(new Date().setHours(0,0,0,0));
                      }}
                    />
                  </div>
                </div>

                {fecha && (
                  <>
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center">
                          <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {t('available_slots')}
                        </h3>
                        {horaSeleccionada && (
                          <span className="bg-green-100 text-green-800 text-sm font-medium px-3 py-1 rounded-full flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {horaSeleccionada}
                          </span>
                        )}
                      </div>
                      
                      <div className={styles.hoursList}>
                        {horasDisponibles.length === 0 ? (
                          <div className="col-span-full">
                            <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
                              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-gray-500 text-lg font-medium">{t('no_slots_available')}</p>
                              <p className="text-gray-400 text-sm mt-2">{t('try_another_date')}</p>
                            </div>
                          </div>
                        ) : (() => {
                          // Calcular horas ocupadas por el médico y por el usuario en la fecha seleccionada
                          const fechaKey = fecha ? `${fecha.getFullYear()}-${String(fecha.getMonth()+1).padStart(2,'0')}-${String(fecha.getDate()).padStart(2,'0')}` : null;
                          const ocupadasMedico = new Set(
                            fechaKey
                              ? citasMedico
                                  .filter(c => c.fecha === fechaKey)
                                  .map(c => (c.hora || '').slice(0,5))
                              : []
                          );
                          const ocupadasUsuario = new Set(
                            fecha
                              ? citasAgendadas
                                  .filter(c => c.fecha.toDateString() === fecha.toDateString())
                                  .map(c => (c.hora || '').slice(0,5))
                              : []
                          );
                          return horasDisponibles.map((hora, index) => {
                            const isOcupada = ocupadasMedico.has(hora) || ocupadasUsuario.has(hora);
                            return (
                              <button
                                key={hora}
                                className={`${styles.hourBtn} ${horaSeleccionada === hora ? styles.selected : ''} ${isOcupada ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => {
                                  if (!isOcupada) setHoraSeleccionada(hora);
                                }}
                                type="button"
                                disabled={isOcupada}
                                aria-disabled={isOcupada}
                                style={{ animationDelay: `${index * 0.1}s` }}
                                title={isOcupada ? t('not_available') : undefined}
                              >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {hora}
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 pt-6 border-t border-gray-100">
                      <button
                        className={`${styles.solicitarBtn} flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                        onClick={onSolicitarCita}
                        disabled={!horaSeleccionada}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>{t('confirm_appointment')}</span>
                      </button>
                      <button
                        className="bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-xl px-8 py-4 font-bold transition-all duration-300 border border-gray-300 hover:border-gray-400 transform hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
                        onClick={onCancelarCalendario}
                        type="button"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>{t('cancel')}</span>
                      </button>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
