"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { useTranslation } from 'react-i18next';

interface DisponibilidadSectionProps {
  ctx: any;
}

export default function DisponibilidadSection({ ctx }: DisponibilidadSectionProps) {
  const { t, i18n } = useTranslation();
  const dayFormatter = React.useMemo(() => new Intl.DateTimeFormat(i18n.language || 'es', { weekday: 'long' }), [i18n.language]);
  const dayOrder = React.useMemo(() => ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'], []);

  const getLocalizedDayName = React.useCallback((value: string) => {
    const index = dayOrder.indexOf(value);
    if (index === -1) return value;
    const date = new Date(2024, 0, 7 + index);
    const localized = dayFormatter.format(date);
    return localized.charAt(0).toUpperCase() + localized.slice(1);
  }, [dayOrder, dayFormatter]);

  const {
    disponibilidad,
    nuevoDia,
    setNuevoDia,
    nuevasHoras,
    setNuevasHoras,
    agregarDisponibilidad,
    loadingHorarios,
    errorDisponibilidad,
    errorHorarios,
    horasDisponibles,
    horasAgregadasForDia,
    medicoData,
    horarios,
    verificarCitasEnHorario,
    setNotificacionDisponibilidad,
    setHorarioAEliminar,
    setMostrarConfirmacion
  } = ctx;

  return (
    <section className="bg-gradient-to-br from-white via-gray-50/50 to-purple-50/30 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/60 flex flex-col overflow-hidden w-full max-w-none">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 p-4 sm:p-6 relative overflow-hidden w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent"></div>
        <div className="relative flex items-center gap-3 w-full">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm flex-shrink-0">
            <span className="text-2xl">🕒</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white text-lg sm:text-xl tracking-wide">{t('medico.availability.header.title')}</h2>
            <p className="text-purple-100 text-xs sm:text-sm">{t('medico.availability.header.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 w-full overflow-x-hidden">
        {/* Estadísticas rápidas - Resumen al inicio */}
        {disponibilidad.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📊</span>
              <h3 className="text-lg font-bold text-gray-800">{t('medico.availability.summary.title')}</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-center">
              <div className="bg-white/60 rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-purple-700">{disponibilidad.length}</div>
                <div className="text-sm text-purple-600 font-medium">{t('medico.availability.summary.days')}</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-indigo-700">
                  {disponibilidad.reduce((acc: number, d: any) => acc + d.horas.split(',').length, 0)}
                </div>
                <div className="text-sm text-indigo-600 font-medium">{t('medico.availability.summary.slots')}</div>
              </div>
              <div className="bg-white/60 rounded-xl p-4 shadow-sm">
                <div className="text-3xl font-bold text-cyan-700">
                  {disponibilidad.length > 0 ? t('medico.availability.status.active') : t('medico.availability.status.inactive')}
                </div>
                <div className="text-sm text-cyan-600 font-medium">{t('medico.availability.summary.status')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario mejorado */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-purple-100 mb-6 sm:mb-8 w-full max-w-none">
          <div className="flex items-center gap-2 mb-6 w-full">
            <span className="text-xl flex-shrink-0">➕</span>
            <h3 className="text-lg font-semibold text-gray-800 flex-1 min-w-0">{t('medico.availability.form.title')}</h3>
          </div>
          
          <form onSubmit={agregarDisponibilidad} className="space-y-6 w-full">
            {/* Selector de día */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-base">📅</span>
                {t('medico.availability.form.day_label')}
              </label>
              <select
                value={nuevoDia}
                onChange={e => setNuevoDia(e.target.value)}
                className="w-full rounded-xl border-2 border-purple-200 bg-white/80 backdrop-blur-sm px-4 py-3 text-sm font-medium transition-all duration-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 focus:outline-none hover:border-purple-300"
                required
              >
                <option value="">{t('medico.availability.form.day_placeholder')}</option>
                <option value="Lunes">🌅 {getLocalizedDayName('Lunes')}</option>
                <option value="Martes">🌄 {getLocalizedDayName('Martes')}</option>
                <option value="Miércoles">⛅ {getLocalizedDayName('Miércoles')}</option>
                <option value="Jueves">🌤️ {getLocalizedDayName('Jueves')}</option>
                <option value="Viernes">🌅 {getLocalizedDayName('Viernes')}</option>
                <option value="Sábado">🎉 {getLocalizedDayName('Sábado')}</option>
                <option value="Domingo">☀️ {getLocalizedDayName('Domingo')}</option>
              </select>
            </div>

            {/* Selector de horarios */}
            <div className="space-y-3 w-full">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                <span className="text-base">⏰</span>
                {t('medico.availability.form.slots_label')}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 w-full overflow-x-hidden">
                  {nuevoDia === '' ? (
                    <div className="col-span-full text-center text-sm text-gray-500 py-6">
                      {t('medico.availability.form.slots_select_day')}
                    </div>
                  ) : (
                    (() => {
                      const disponibles = horasDisponibles.filter((h: string) => !horasAgregadasForDia.has(h));
                      if (disponibles.length === 0) {
                        return (
                          <div className="col-span-full text-center text-sm text-gray-500 py-6">
                            {t('medico.availability.form.slots_none', { day: getLocalizedDayName(nuevoDia) })}
                          </div>
                        );
                      }
                      return disponibles.map((franja: string) => {
                        const selected = nuevasHoras.includes(franja);
                        return (
                          <button
                            type="button"
                            key={franja}
                            className={`relative px-2 sm:px-3 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 transform hover:scale-95 border-2 shadow-sm hover:shadow-md cursor-pointer touch-manipulation w-full min-w-0 break-words ${
                              selected
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-400 shadow-lg shadow-purple-200'
                                : 'bg-white/90 text-purple-700 border-purple-200 hover:bg-purple-50 hover:border-purple-400'
                            }`}
                            onClick={() => {
                              setNuevasHoras((prev: string[]) =>
                                prev.includes(franja) ? prev.filter((h: string) => h !== franja) : [...prev, franja]
                              );
                            }}
                          >
                            {selected && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full flex items-center justify-center">
                                <span className="text-white text-xs">✓</span>
                              </div>
                            )}
                            {franja}
                          </button>
                        );
                      });
                    })()
                  )}
              </div>
              {nuevasHoras.length > 0 && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3">
                  <p className="text-sm text-purple-700">
                    <span className="font-semibold">{t('medico.availability.form.selected_prefix')}</span> {nuevasHoras.join(', ')}
                  </p>
                </div>
              )}
            </div>

            {/* Botón de agregar */}
            <button 
              type="submit"
              disabled={loadingHorarios || !nuevoDia || nuevasHoras.length === 0}
              className={`w-full rounded-2xl px-6 py-4 font-bold text-lg flex items-center justify-center gap-2 transition-all duration-300 border border-white/20 backdrop-blur-sm ${loadingHorarios || !nuevoDia || nuevasHoras.length === 0 ? 'bg-gray-300 text-gray-700 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 cursor-pointer'}`}
            >
              {loadingHorarios ? (
                <>
                  <div className="animate-spin rounded-full border-2 border-white/30 border-t-white h-4 w-4"></div>
                  {t('medico.availability.form.submit_saving')}
                </>
              ) : (
                <>
                  <span className="text-xl">💾</span>
                  {t('medico.availability.form.submit_label')}
                </>
              )}
            </button>
          </form>
        </div>
        {/* Estados de carga y error */}
        {errorDisponibilidad && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 text-red-800 p-4 rounded-2xl text-center mb-6 shadow-lg">
            <div className="flex items-center justify-center gap-2">
              <span className="text-lg">⚠️</span>
              <span className="font-semibold">{errorDisponibilidad}</span>
            </div>
          </div>
        )}
        
        {loadingHorarios ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 h-16 w-16"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400/20 to-indigo-400/20 animate-pulse"></div>
            </div>
            <div className="text-center">
              <p className="text-purple-700 font-semibold text-lg">{t('medico.availability.loading.title')}</p>
              <p className="text-purple-500 text-sm">{t('medico.availability.loading.subtitle')}</p>
            </div>
          </div>
        ) : errorHorarios ? (
          <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 p-8 rounded-3xl text-center shadow-lg">
            <div className="mb-4">
              <span className="text-4xl">❌</span>
            </div>
            <p className="font-bold text-red-800 text-lg mb-2">{t('medico.availability.errors.load_title')}</p>
            <p className="text-red-600">{errorHorarios}</p>
          </div>
        ) : disponibilidad.length === 0 ? (
          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 border-2 border-gray-200 p-8 rounded-3xl text-center shadow-lg">
            <div className="mb-6">
              <span className="text-6xl">📅</span>
            </div>
            <p className="font-bold text-gray-800 text-xl mb-2">{t('medico.availability.empty.title')}</p>
            <p className="text-gray-600 max-w-md mx-auto">
              {t('medico.availability.empty.description')}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📋</span>
              <h3 className="text-xl font-bold text-gray-800">{t('medico.availability.list.title')}</h3>
              <div className="flex-1 h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {disponibilidad.map((d: any, idx: number) => (
                <div 
                  key={idx} 
                  className="group bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 border-2 border-purple-200 rounded-2xl p-4 sm:p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative overflow-hidden"
                >
                  {/* Decoración de fondo */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-100 to-transparent rounded-full transform translate-x-6 -translate-y-6 opacity-50"></div>
                  
                  <div className="relative z-10">
                    {/* Header del día */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="p-1.5 sm:p-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white shadow-lg">
                          <span className="text-sm sm:text-lg font-bold">
                            {getLocalizedDayName(d.dia).slice(0, 3).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-800 text-base sm:text-lg">{getLocalizedDayName(d.dia)}</h4>
                          <p className="text-purple-600 text-xs sm:text-sm">{t('medico.availability.list.workday')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Horarios */}
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span>⏰</span>
                        {t('medico.availability.list.slots_title')}
                      </p>
                      <div className="bg-white/80 border border-purple-100 rounded-xl p-3">
                        <div className="flex flex-wrap gap-1.5 sm:gap-2">
                          {d.horas.split(',').map((h: string, i: number) => (
                            <div key={i} className="flex items-center gap-1.5 sm:gap-2 bg-purple-50 border border-purple-200 rounded-full px-2.5 sm:px-3 py-1 text-xs sm:text-sm text-purple-700">
                              <span className="font-medium">{h.trim()}</span>
                              <button
                                type="button"
                                className="text-red-600 hover:text-red-800 cursor-pointer transition-all duration-200 hover:scale-125 text-sm sm:text-lg w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full hover:bg-red-100 touch-manipulation"
                                onClick={async () => {
                                  // Encontrar el horario crudo correspondiente
                                  if (!medicoData) return;
                                  // Buscar en `horarios` un registro que coincida con día y horas
                                  const diasIdx: any = { 'Domingo':0,'Lunes':1,'Martes':2,'Miércoles':3,'Jueves':4,'Viernes':5,'Sábado':6 };
                                  const diaIdx = diasIdx[d.dia];
                                  const horaParts = h.split(' - ').map((s: string) => s.trim());
                                  const targetFormat = `${horaParts[0]} - ${horaParts[1]}`;
                                  const found = horarios.find((hr: any) => {
                                    if (hr.dia_semana !== diaIdx) return false;
                                    // Normalizar formato: quitar segundos si existen
                                    const inicio = hr.hora_inicio.split(':').slice(0, 2).join(':');
                                    const fin = hr.hora_fin.split(':').slice(0, 2).join(':');
                                    const dbFormat = `${inicio} - ${fin}`;
                                    return dbFormat === targetFormat;
                                  });
                                  if (found && found.id) {
                                    // Verificar si tiene citas asociadas
                                    const citasAsociadas = verificarCitasEnHorario(d.dia, targetFormat);
                                    if (citasAsociadas.length > 0) {
                                      setNotificacionDisponibilidad({ 
                                        tipo: 'warning', 
                                        mensaje: t('medico.availability.warnings.slot_with_appointments', { count: citasAsociadas.length }) 
                                      });
                                      setTimeout(() => setNotificacionDisponibilidad(null), 5000);
                                      return;
                                    }
                                    
                                    // Mostrar confirmación
                                    setHorarioAEliminar({ dia: d.dia, hora: targetFormat, horario: found });
                                    setMostrarConfirmacion(true);
                                  } else {
                                    console.error('No se encontró el horario para eliminar');
                                    setNotificacionDisponibilidad({ tipo: 'error', mensaje: t('medico.availability.errors.find_slot') });
                                    setTimeout(() => setNotificacionDisponibilidad(null), 4000);
                                  }
                                }}
                              >
                                ✖
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}
      </div>
    </section>
  );
}
