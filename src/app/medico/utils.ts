// Gradientes para las tarjetas del resumen
export const resumenGradients = [
  'from-blue-700 via-blue-500/70 to-blue-600/60',
  'from-orange-400 via-orange-600/80 to-orange-400/60',
  'from-purple-700 via-purple-500/80 to-purple-600/60',
  'from-emerald-400 via-emerald-600/80 to-emerald-400/60',
] as const;

// Utilidad para fusionar intervalos contiguos de horarios
export function fusionarHorariosPorDia(disponibilidad: { id: number, dia: string, horas: string }[]) {
  const dias: Record<string, { inicio: number, fin: number }[]> = {};
  disponibilidad.forEach(({ dia, horas }) => {
    const [hInicio, hFin] = horas.split(' - ');
    const inicio = parseInt(hInicio.split(':')[0], 10);
    const fin = parseInt(hFin.split(':')[0], 10);
    if (!dias[dia]) dias[dia] = [];
    dias[dia].push({ inicio, fin });
  });

  const resultado: { dia: string, intervalos: string[] }[] = [];
  Object.entries(dias).forEach(([dia, intervalos]) => {
    intervalos.sort((a, b) => a.inicio - b.inicio);
    const fusionadas: { inicio: number, fin: number }[] = [];
    
    for (const intervalo of intervalos) {
      if (fusionadas.length === 0 || fusionadas[fusionadas.length - 1].fin < intervalo.inicio - 1) {
        fusionadas.push(intervalo);
      } else {
        fusionadas[fusionadas.length - 1].fin = Math.max(fusionadas[fusionadas.length - 1].fin, intervalo.fin);
      }
    }
    
    resultado.push({
      dia,
      intervalos: fusionadas.map(f => `${f.inicio}:00 - ${f.fin}:00`)
    });
  });
  return resultado;
}

// Helper para agrupar horarios por día
export const groupHorariosByDay = (horariosList: any[]) => {
  const diasArr = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const map: Record<string, string[]> = {};
  horariosList.forEach(h => {
    const dia = diasArr[h.dia_semana] || 'Sin día';
    const inicio = h.hora_inicio.split(':').slice(0, 2).join(':');
    const fin = h.hora_fin.split(':').slice(0, 2).join(':');
    const horarioStr = `${inicio} - ${fin}`;
    if (!map[dia]) map[dia] = [];
    if (!map[dia].includes(horarioStr)) map[dia].push(horarioStr);
  });
  
  // Ordenar días y devolver formato correcto con id y horas como string
  return Object.keys(map).sort((a,b) => {
    const idxA = diasArr.indexOf(a);
    const idxB = diasArr.indexOf(b);
    return idxA - idxB;
  }).map((dia, i) => ({ 
    id: i + 1, 
    dia, 
    horas: map[dia].join(', ') 
  }));
};

// ---------------------- Helpers de fecha (zona local del navegador) ----------------------
/**
 * Parsear una fecha ISO (posible con zona o sin ella) y una hora opcional
 * y devolver un objeto con la Date en la zona local del navegador y una cadena ISO-local
 * isoLocal: 'YYYY-MM-DD HH:mm' (sin zona)
 */
export function combinarFechaHoraLocal(fechaStr: string | undefined | null, horaStr?: string | null) {
  // Si no hay fecha, devolver ahora (local)
  if (!fechaStr) {
    const now = new Date();
    const isoLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return { date: now, isoLocal };
  }

  // Extraer la parte de fecha (YYYY-MM-DD) siempre que exista
  const fechaMatch = fechaStr.match(/(\d{4}-\d{2}-\d{2})/);
  const ymd = fechaMatch ? fechaMatch[1] : null;

  // Si el backend ya incluye hora en la fechaStr, intentar extraerla
  const horaMatch = fechaStr.match(/T(\d{2}:\d{2}:?\d{0,2})/);

  // Determinar la hora a usar (priorizar horaStr si está presente)
  let horaFinal = '00:00:00';
  if (horaStr && /^\d{2}:\d{2}(:\d{2})?$/.test(horaStr)) {
    horaFinal = horaStr.length === 5 ? `${horaStr}:00` : horaStr;
  } else if (horaMatch) {
    const hm = horaMatch[1];
    horaFinal = hm.length === 5 ? `${hm}:00` : (hm.length === 8 ? hm : `${hm}:00`);
  }

  // Si no pudimos extraer la fecha YYYY-MM-DD, intentar usar Date fallback y luego convertir a local
  if (!ymd) {
    // Fallback: crear Date con el string y convertir a local
    const dtFallback = new Date(fechaStr);
    const isoLocalFb = `${dtFallback.getFullYear()}-${String(dtFallback.getMonth() + 1).padStart(2, '0')}-${String(dtFallback.getDate()).padStart(2, '0')} ${String(dtFallback.getHours()).padStart(2, '0')}:${String(dtFallback.getMinutes()).padStart(2, '0')}`;
    return { date: dtFallback, isoLocal: isoLocalFb };
  }

  // Construir Date en zona local usando componentes (evita interpretar como UTC)
  const [yyyy, mm, dd] = ymd.split('-').map(s => parseInt(s, 10));
  const [hh, mi, ss] = horaFinal.split(':').map(s => parseInt(s, 10));
  const localDate = new Date(yyyy, mm - 1, dd, hh || 0, mi || 0, ss || 0, 0);
  const isoLocal = `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')} ${String(hh).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
  return { date: localDate, isoLocal };
}

/** Devuelve YYYY-MM-DD para una Date en zona local */
export function formatLocalYYYYMMDD(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}


// Verificar si un horario tiene citas
export const verificarCitasEnHorario = (dia: string, hora: string, citas: any[]) => {
  const diasIdx: any = { 'Domingo':0,'Lunes':1,'Martes':2,'Miércoles':3,'Jueves':4,'Viernes':5,'Sábado':6 };
  const diaIdx = diasIdx[dia];
  const [horaInicio, horaFin] = hora.split(' - ').map(h => h.trim());
  
  return citas.filter(cita => {
    if (!cita.fecha || !cita.hora) return false;
    const fechaCita = combinarFechaHoraLocal(cita.fecha).date;
    const diaCita = fechaCita.getDay();
    if (diaCita !== diaIdx) return false;
    const horaCita = cita.hora.split(':').slice(0, 2).join(':');
    return horaCita >= horaInicio && horaCita < horaFin;
  });
};

// Función para confirmar eliminación de horario
type TranslateFn = (key: string, options?: Record<string, unknown>) => string;

export const createEliminarHorarioHandler = (
  setLoadingEliminar: any,
  eliminarHorarioService: any,
  getHorarios: any,
  setHorarios: any,
  groupHorariosByDay: any,
  setDisponibilidad: any,
  setNotificacionDisponibilidad: any,
  translate: TranslateFn,
  setMostrarConfirmacion: any,
  setHorarioAEliminar: any
) => async (medicoData: any, horarioAEliminar: any) => {
  if (!horarioAEliminar || !medicoData) return;
  
  const { horario } = horarioAEliminar;
  setLoadingEliminar(horario.id);
  try {
    await eliminarHorarioService(medicoData.email, horario.id!);
    const horariosData = await getHorarios(medicoData.email);
    setHorarios(horariosData);
    setDisponibilidad(groupHorariosByDay(horariosData));
    setNotificacionDisponibilidad({ 
      tipo: 'delete', 
      mensaje: translate('medico.availability.delete_success') 
    });
  } catch (error: any) {
    setNotificacionDisponibilidad({ 
      tipo: 'error', 
      mensaje: error?.message || translate('medico.availability.delete_error') 
    });
  } finally {
    setLoadingEliminar(null);
    setMostrarConfirmacion(false);
    setHorarioAEliminar(null);
    setTimeout(() => setNotificacionDisponibilidad(null), 5000);
  }
};

// Función para confirmar agregar horarios
export const createAgregarHorariosHandler = (
  setLoadingHorarios: any,
  agregarHorario: any,
  setNotificacionDisponibilidad: any,
  translate: TranslateFn,
  setNuevoDia: any,
  setNuevasHoras: any,
  getHorarios: any,
  setHorarios: any,
  groupHorariosByDay: any,
  setDisponibilidad: any,
  setMostrarConfirmacionAgregar: any,
  setDatosAgregar: any
) => async (medicoData: any, datosAgregar: any) => {
  if (!datosAgregar || !medicoData) return;
  
  setLoadingHorarios(true);
  try {
    const diaSemana = datosAgregar.diaSemana;
    
    for (const franja of datosAgregar.horas) {
      const [horaInicio, horaFin] = franja.split(' - ');
      const formatearHora = (hora: string): string => {
        const [h, m] = hora.split(':');
        return `${h.padStart(2, '0')}:${m}`;
      };
      const payload = {
        dia_semana: diaSemana,
        hora_inicio: formatearHora(horaInicio),
        hora_fin: formatearHora(horaFin)
      };
      await agregarHorario(medicoData.email, payload);
    }
    
    setNotificacionDisponibilidad({ 
      tipo: 'success', 
      mensaje: translate('medico.availability.add_success', { count: datosAgregar.horas.length }) 
    });
    setNuevoDia("");
    setNuevasHoras([]);
    
    const horariosData = await getHorarios(medicoData.email);
    setHorarios(horariosData);
    setDisponibilidad(groupHorariosByDay(horariosData));
  } catch (error: any) {
  const msg = (error && (error.message || String(error))) || translate('medico.availability.add_error');
  setNotificacionDisponibilidad({ tipo: 'error', mensaje: msg });
  } finally {
    setLoadingHorarios(false);
    setMostrarConfirmacionAgregar(false);
    setDatosAgregar(null);
    setTimeout(() => setNotificacionDisponibilidad(null), 5000);
  }
};

// Función para cambiar contraseña
export const createPasswordChangeHandler = (
  medicoData: any,
  setMensajePassword: any,
  setNotificacionPassword: any,
  setMostrarCambioPassword: any,
  setPasswordActual: any,
  setNuevoPassword: any,
  setConfirmarPassword: any,
  setCambiandoPassword: any,
  cambiarContrasena: any,
  translate: TranslateFn
) => async (e: React.FormEvent, passwordActual: string, nuevoPassword: string, confirmarPassword: string) => {
  e.preventDefault();
  setMensajePassword("");
  setNotificacionPassword(null);
  
  if (nuevoPassword.length < 6) {
    const msg = translate('medico.password.min_length');
    setMensajePassword(msg);
    setNotificacionPassword({ tipo: 'error', mensaje: msg });
    setTimeout(() => setNotificacionPassword(null), 3500);
    return;
  }
  
  if (nuevoPassword !== confirmarPassword) {
    const msg = translate('medico.password.mismatch');
    setMensajePassword(msg);
    setNotificacionPassword({ tipo: 'error', mensaje: msg });
    setTimeout(() => setNotificacionPassword(null), 3500);
    return;
  }
  
  if (!passwordActual) {
    const msg = translate('medico.password.require_current');
    setMensajePassword(msg);
    setNotificacionPassword({ tipo: 'error', mensaje: msg });
    setTimeout(() => setNotificacionPassword(null), 3500);
    return;
  }
  
  if (!medicoData) {
    const msg = translate('medico.password.missing_user');
    setMensajePassword(msg);
    setNotificacionPassword({ tipo: 'error', mensaje: msg });
    setTimeout(() => setNotificacionPassword(null), 3500);
    return;
  }
  
  setCambiandoPassword(true);
  try {
    const resp = await cambiarContrasena(medicoData.email, passwordActual, nuevoPassword);
    const msg = resp?.message || translate('medico.password.change_success');
    setMensajePassword(msg);
    setNotificacionPassword({ tipo: 'success', mensaje: msg });
    setMostrarCambioPassword(false);
    setPasswordActual("");
    setNuevoPassword("");
    setConfirmarPassword("");
  } catch (error: any) {
    const backendMsg = error?.message;
    const msg = backendMsg && typeof backendMsg === 'string' && backendMsg.trim().length
      ? backendMsg
      : translate('medico.password.change_error');
    setMensajePassword(msg);
    setNotificacionPassword({ tipo: 'error', mensaje: msg });
  } finally {
    setCambiandoPassword(false);
    setTimeout(() => setMensajePassword(""), 3000);
    setTimeout(() => setNotificacionPassword(null), 3500);
  }
};
