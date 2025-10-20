"use client";
import React from 'react';
import Calendar from 'react-calendar';
import styles from '../calendar.module.css';

export default function CitasSection({ ctx }: { ctx: any }) {
  return (
    <div className="flex flex-col xl:flex-row gap-8 min-h-[80vh] overflow-hidden">
      {/* Panel del Calendario Mejorado */}
      <div className="flex-1 bg-gradient-to-br from-white via-blue-50/40 to-indigo-50/30 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/60 flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <span className="text-2xl">📅</span>
            </div>
            <div>
              <h2 className="font-bold text-white text-xl tracking-wide">Calendario de Citas</h2>
              <p className="text-blue-100 text-sm">Selecciona una fecha para ver las citas</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-3 md:p-6 flex flex-col justify-center overflow-hidden">
          <div className="w-full overflow-hidden">
            <div className={`${styles.calendarContainer} w-full h-90 sm:h-56 md:h-64 lg:h-80 xl:h-105`} style={{ margin: '0 auto' }}>
              <Calendar
                className={`${styles.calendarBox} h-full`}
                onChange={date => ctx.setFechaSeleccionada(date instanceof Date ? date : null)}
                value={ctx.fechaSeleccionada}
                minDate={new Date('2024-01-01')}
                tileContent={ctx.tileContent}
                tileDisabled={() => false}
              />
            </div>
          </div>
          
          {/* Resumen compacto de citas (copiado del Dashboard) */}
          <div className="mt-6 bg-white/80 border border-indigo-200 rounded-xl p-3">
            {ctx.fechaSeleccionada ? (
              <>
                <div className="text-xs font-semibold text-indigo-800 mb-2">
                  {ctx.fechaSeleccionada.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                </div>
                {ctx.getCitasDelDia(ctx.fechaSeleccionada).length === 0 ? (
                  <div className="text-center text-gray-500 py-2">
                    <div className="text-lg mb-1">📅</div>
                    <p className="text-xs">Sin citas</p>
                  </div>
                ) : (
                  <div className="space-y-1 max-h-[80px] overflow-y-auto">
                    {ctx.getCitasDelDia(ctx.fechaSeleccionada).slice(0, 3).map((cita: any, idx: number) => (
                      <div key={idx} className="bg-blue-50 rounded p-1.5 border border-blue-200">
                        <div className="text-xs font-medium text-blue-800">
                          {ctx.usuariosMap.get(cita.usuario_id) || `Usuario ${cita.usuario_id}`}
                        </div>
                        <div className="text-xs text-blue-600">🕐 {cita.hora}</div>
                      </div>
                    ))}
                    {ctx.getCitasDelDia(ctx.fechaSeleccionada).length > 3 && (
                      <div className="text-xs text-center text-indigo-600 font-medium">
                        +{ctx.getCitasDelDia(ctx.fechaSeleccionada).length - 3} más
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-3">
                <div className="text-lg mb-1">👆</div>
                <p className="text-xs">Selecciona un día</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Panel de Citas Mejorado */}
      <div className="flex-1 bg-gradient-to-br from-white via-slate-50/50 to-gray-50/30 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/60 flex flex-col overflow-hidden">
        <div className="bg-gradient-to-r from-slate-600 via-slate-700 to-gray-700 p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-600/20 to-transparent"></div>
          <div className="relative flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <span className="text-2xl">👥</span>
            </div>
            <div>
              <h2 className="font-bold text-white text-xl tracking-wide">Mis Citas Médicas</h2>
              <p className="text-slate-100 text-sm">{ctx.citas.length} citas programadas</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-6 flex flex-col min-h-0">
          {/* Filtros y búsqueda */}
          <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <span className="text-base">🔍</span>
                Filtrar por:
              </div>
              <div className="flex gap-2 flex-wrap">
                <button
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${ctx.filtroCitas === 'hoy' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => { ctx.setFiltroCitas('hoy'); ctx.setMostrarTodasLasCitas(false); }}
                >
                  Hoy
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${ctx.filtroCitas === 'todas' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                  onClick={() => { ctx.setFiltroCitas('todas'); ctx.setMostrarTodasLasCitas(false); }}
                >
                  Todas
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${ctx.filtroCitas === 'canceladas' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                  onClick={() => { ctx.setFiltroCitas('canceladas'); ctx.setMostrarTodasLasCitas(false); }}
                >
                  Canceladas
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${ctx.filtroCitas === 'finalizadas' ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'}`}
                  onClick={() => { ctx.setFiltroCitas('finalizadas'); ctx.setMostrarTodasLasCitas(false); }}
                >
                  Finalizadas
                </button>
                <button
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${ctx.filtroCitas === 'proximas' ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}
                  onClick={() => { ctx.setFiltroCitas('proximas'); ctx.setMostrarTodasLasCitas(false); }}
                >
                  Próximas
                </button>
              </div>
            </div>
          </div>

          {/* Lista de citas mejorada */}
          <div className={`flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm min-h-0 ${ctx.citasAMostrar.length > 3 ? 'max-h-80 overflow-y-auto' : ''}`}>
            {ctx.loadingCitas ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="animate-spin rounded-full border-4 border-blue-200 border-t-blue-600 h-12 w-12 mb-4"></div>
                <p className="text-blue-600 font-semibold">Cargando citas...</p>
                <p className="text-gray-500 text-sm mt-2">Por favor espere un momento</p>
              </div>
            ) : ctx.errorCitas ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-red-100 rounded-full mb-4">
                  <span className="text-2xl text-red-600">⚠️</span>
                </div>
                <p className="text-red-700 font-semibold text-lg">Error al cargar las citas</p>
                <p className="text-red-600 text-sm mt-2">{ctx.errorCitas}</p>
                <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-semibold">
                  Reintentar
                </button>
              </div>
            ) : ctx.citas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <span className="text-3xl text-gray-400">📋</span>
                </div>
                <p className="text-gray-700 font-semibold text-lg">No hay citas programadas</p>
                <p className="text-gray-500 text-sm mt-2 text-center max-w-md">
                  Cuando tenga citas programadas, aparecerán aquí con toda la información detallada.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {ctx.citasAMostrar.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 bg-yellow-50 rounded-full mb-4">
                      <span className="text-3xl text-yellow-500">
                      {ctx.filtroCitas === 'hoy' ? '⏳' : 
                       ctx.filtroCitas === 'canceladas' ? '🚫' :
                       ctx.filtroCitas === 'finalizadas' ? '✅' :
                       ctx.filtroCitas === 'proximas' ? '🔮' : '📅'}
                      </span>
                    </div>
                    <p className="text-yellow-700 font-semibold text-lg">
                      {ctx.filtroCitas === 'hoy' ? 'No hay citas hoy' :
                       ctx.filtroCitas === 'canceladas' ? 'No hay citas canceladas' :
                       ctx.filtroCitas === 'finalizadas' ? 'No hay citas finalizadas' :
                       ctx.filtroCitas === 'proximas' ? 'No hay citas próximas' :
                       'No hay citas'}
                    </p>
                    <p className="text-gray-500 text-sm mt-2 text-center max-w-md">
                      {ctx.filtroCitas === 'hoy' ? 'No hay citas programadas para hoy. Puedes revisar "Todas".' :
                       ctx.filtroCitas === 'canceladas' ? 'No tienes citas canceladas registradas.' :
                       ctx.filtroCitas === 'finalizadas' ? 'No tienes citas finalizadas aún.' :
                       ctx.filtroCitas === 'proximas' ? 'No tienes citas programadas para fechas futuras.' :
                       'No hay citas disponibles con los filtros actuales.'}
                    </p>
                  </div>
                ) : (
                  <>
                    {ctx.citasAMostrar.map((cita: any, idx: number) => (
                      <div key={idx} className="p-4 hover:bg-gray-50/50 transition-all duration-200 group">
                        <div className="flex flex-col space-y-3">
                          {/* Información principal de la cita */}
                          <div className="flex items-start gap-3">
                            {/* Avatar del paciente */}
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0">
                              {(ctx.usuariosMap.get(cita.usuario_id) || cita.usuario_id || 'U').charAt(0).toUpperCase()}
                            </div>
                            
                            {/* Información de la cita - layout vertical */}
                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Nombre y estado */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <h3 className="font-semibold text-gray-800 text-lg leading-tight">
                                  {ctx.usuariosMap.get(cita.usuario_id) || cita.usuario_id || 'Usuario desconocido'}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold shadow-sm w-fit ${
                                  cita.estado === 'confirmada' ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200' : 
                                  cita.estado === 'pendiente' ? 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200' : 
                                  'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-200'
                                }`}>
                                  {cita.estado ? (cita.estado.charAt(0).toUpperCase() + cita.estado.slice(1)) : 'Sin estado'}
                                </span>
                              </div>
                              
                              {/* Fecha y hora */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                  <span className="text-blue-500">📅</span>
                                  <span className="font-medium">{cita.fecha || 'Fecha no disponible'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-green-500">🕐</span>
                                  <span className="font-medium">{cita.hora || 'Hora no disponible'}</span>
                                </div>
                              </div>
                              
                              {/* Botones de acción - responsive para todos los dispositivos */}
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 pt-1">
                                {(() => {
                                  // Verificar si la cita ya pasó
                                  const ahora = new Date();
                                  const fechaCitaCompleta = new Date(`${cita.fecha}T${cita.hora}`);
                                  const citaPasada = fechaCitaCompleta < ahora;
                                  
                                  return (
                                    <button 
                                      className={`px-3 py-2 rounded-lg font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto flex-shrink-0 ${
                                        citaPasada 
                                          ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                                          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                                      }`}
                                      onClick={async () => {
                                        if (citaPasada) return;
                                        // Extraer token de sala con variantes compatibles
                                        const getRoomToken = (obj: unknown): string | undefined => {
                                          if (!obj || typeof obj !== 'object') return undefined;
                                          const o = obj as Record<string, unknown>;
                                          const val = (v: unknown) => (typeof v === 'string' ? v.trim() : undefined);
                                          const token = val(o.token);
                                          const idRoom = val(o.idRoom) || val((o as Record<string, unknown>)['id_room']);
                                          const tokenSala = val(o.tokenSala) || val((o as Record<string, unknown>)['token_sala']);
                                          if (token) return token; // prioridad
                                          if (idRoom) return idRoom;
                                          if (tokenSala) return tokenSala;
                                          return undefined;
                                        };

                                        let tokenSala = getRoomToken(cita);

                                        // Fallback: si no hay token en la cita, consultar el backend para acceso a sala
                                        if (!tokenSala && cita?.id != null) {
                                          try {
                                            const resp = await fetch(`/api/cita/${encodeURIComponent(String(cita.id))}/room`);
                                            if (resp.ok) {
                                              const data = await resp.json();
                                              if (data?.roomId) tokenSala = String(data.roomId);
                                            } else if (resp.status === 403) {
                                              const data = await resp.json().catch(() => ({} as any));
                                              const minutes = data?.minutes ?? data?.minutos ?? undefined;
                                              alert(minutes != null 
                                                ? `La sala se habilitará en aproximadamente ${minutes} minuto(s).`
                                                : 'La sala aún no está disponible. Intenta más cerca de la hora de la cita.');
                                              return;
                                            }
                                          } catch (e) {
                                            console.warn('No se pudo obtener acceso a la sala desde el backend', e);
                                          }
                                        }
                                        try {
                                          console.log('[Medico/Reunión] Tokens encontrados', {
                                            citaId: cita.id,
                                            usuario: cita.usuario_id,
                                            tokenFromCita: tokenSala,
                                          });
                                        } catch {}

                                        // Calcular startAt ISO usando fecha y hora de la cita
                                        let startAtISO = '';
                                        try {
                                          const start = new Date(`${cita.fecha}T${cita.hora}`);
                                          if (!isNaN(start.getTime())) startAtISO = start.toISOString();
                                        } catch {}

                                        const url = new URL('/reunion', window.location.origin);
                                        if (tokenSala) url.searchParams.set('room', tokenSala);
                                        if (startAtISO) url.searchParams.set('startAt', startAtISO);
                                        url.searchParams.set('who', 'doctor');

                                        try { console.log('[Medico/Reunión] URL de unión', url.toString()); } catch {}
                                        window.open(url.toString(), '_blank');
                                      }}
                                      disabled={citaPasada}
                                      title={citaPasada ? 'Esta cita ya ha finalizado' : 'Iniciar reunión con este paciente'}
                                    >
                                      <span className="text-sm">{citaPasada ? '⏰' : '🎥'}</span>
                                      <span className="hidden xs:inline sm:inline">
                                        {citaPasada ? 'Cita Finalizada' : 'Iniciar Reunión'}
                                      </span>
                                      <span className="xs:hidden sm:hidden">
                                        {citaPasada ? 'Finalizada' : 'Reunión'}
                                      </span>
                                    </button>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
            
            {/* Botón Ver más / Ver menos - Solo para filtro 'todas' */}
            {ctx.filtroCitas === 'todas' && ctx.citas.length > 4 && (
              <div className="border-t border-gray-100 p-4 flex justify-center">
                <button
                  className="bg-gradient-to-r from-slate-100 to-gray-100 hover:from-slate-200 hover:to-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2"
                  onClick={() => ctx.setMostrarTodasLasCitas(!ctx.mostrarTodasLasCitas)}
                >
                  <span className="text-base">{ctx.mostrarTodasLasCitas ? '🔺' : '🔻'}</span>
                  {ctx.mostrarTodasLasCitas ? 'Ver menos citas' : `Ver más citas (${ctx.citas.length - 4} restantes)`}
                </button>
              </div>
            )}
          </div>

          {/* Información adicional - solo se muestra si hay citas */}
          {ctx.citas.length > 0 && (
            <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 border border-blue-100">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-blue-700">
                  <span className="text-lg">💡</span>
                  <span className="font-semibold">Consejo:</span>
                </div>
                <span className="text-blue-600">
                  Puedes iniciar una reunión directamente desde cada cita
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
