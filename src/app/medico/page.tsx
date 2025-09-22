/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import Footer from "../components/Footer";
import TopActions from '../components/TopActions';
import { useMediaQuery } from 'react-responsive';
import Image from "next/image";
import { useRouter } from 'next/navigation';
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import styles from './calendar.module.css';
import HeaderLogo from "../components/HeaderLogo";

// Servicios
import {
  getMedicoPerfil, getHorarios, agregarHorario, eliminarHorario as eliminarHorarioService,
  getCitas, logout, getPagosMedico, formatearMonto, calcularIngresosPorPeriodo,
  cambiarContrasena, updateMedicoAvatar, resolverAvatarDeterministaMedico,
  type Medico, type Horario, type Cita, type Paciente, type Pago
} from './services';
import { getSession as getSessionFromApi } from './services/api';
import {
  getBillingProfileByOwner, createOrUpdateBillingProfile, listPaymentMethodsByProfile,
  listInvoices, createAddress, updateAddress, createPaymentMethod, 
  updatePaymentMethod, deletePaymentMethod,
  type BillingProfile, type Address, type PaymentMethod, type Invoice
} from './services/billing';
import { extraerPacientes } from './services/pacientes';

// Componentes de secciones
import CitasSection from './sections/CitasSection';
import DisponibilidadSection from './sections/DisponibilidadSection';
import PacientesSection from './sections/PacientesSection';
import BillingSection from './sections/BillingSection';
import PerfilSection from './sections/PerfilSection';
import MedicoNavbar from './components/MedicoNavbar';
import MedicoSidebar from './components/MedicoSidebar';
import DashboardHeader from './components/DashboardHeader';
import DashboardCards from './components/DashboardCards';

// Utilidades
import { 
  resumenGradients, 
  fusionarHorariosPorDia, 
  createPasswordChangeHandler, 
  groupHorariosByDay, 
  verificarCitasEnHorario,
  createEliminarHorarioHandler,
  createAgregarHorariosHandler
} from './utils';

// Constantes
const DIAS_IDX_MAP: Record<string, number> = { 
  'Domingo': 0, 'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 
  'Jueves': 4, 'Viernes': 5, 'Sábado': 6 
};

// Componente de carga
function PantallaCarga() {
  return (
    <div className="fixed inset-0 bg-white/85 z-[10000] flex items-center justify-center flex-col">
      <div className="animate-spin rounded-full border-8 border-primary-200 border-t-primary h-20 w-20 mb-6"></div>
      <span className="text-primary-700 text-xl font-bold">Cargando panel...</span>
    </div>
  );
}

export default function MedicoDashboard() {
  const router = useRouter();
  
  // FUNCIÓN PARA OBTENER LA FECHA CORRECTA DEL SERVIDOR
  const obtenerFechaServidor = () => {
    // TODO: En producción, idealmente obtener la hora real desde el backend.
    // Por ahora devolver la fecha local actual para evitar cálculos con una fecha fija
    // que provocaba comparaciones incorrectas con las citas tomadas desde la DB.
    const ahora = new Date();
    if (process.env.NODE_ENV === 'development') {
      console.log('📅 obtenerFechaServidor -> usando hora cliente:', ahora.toISOString());
    }
    return ahora;
  };
  
  // Estados principales
  const [medicoData, setMedicoData] = useState<Medico | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [currentTime, setCurrentTime] = useState(obtenerFechaServidor()); // Usar fecha del servidor
  
  // Estados de perfil y contraseñas
  const [notificacionPassword, setNotificacionPassword] = useState<{ tipo: 'success' | 'error', mensaje: string } | null>(null);
  const [mostrarCambioPassword, setMostrarCambioPassword] = useState(false);
  const [passwordActual, setPasswordActual] = useState("");
  const [nuevoPassword, setNuevoPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mensajePassword, setMensajePassword] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File|null>(null);
  
  // Estados para datos del backend
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [totalIngresos, setTotalIngresos] = useState(0);
  const [loadingPagos, setLoadingPagos] = useState(true);
  const [mostrarDetalleIngresos, setMostrarDetalleIngresos] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usuariosMap, setUsuariosMap] = useState<Map<string, string>>(new Map());
  
  // Estados de carga por sección
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [loadingHorarios, setLoadingHorarios] = useState(true);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);
  const [errorHorarios, setErrorHorarios] = useState<string | null>(null);
  const [errorDisponibilidad] = useState<string | null>(null);
  
  // Estados de disponibilidad UI
  const [disponibilidad, setDisponibilidad] = useState([
    { id: 1, dia: "Lunes", horas: "9:00 - 13:00" },
    { id: 2, dia: "Miércoles", horas: "14:00 - 18:00" },
  ]);
  
  // Función para cambiar contraseña
  const cambiarPassword = async (e: React.FormEvent) => {
    const handler = createPasswordChangeHandler(
      medicoData,
      setMensajePassword,
      setNotificacionPassword,
      setMostrarCambioPassword,
      setPasswordActual,
      setNuevoPassword,
      setConfirmarPassword,
      setCambiandoPassword,
      cambiarContrasena
    );
    await handler(e, passwordActual, nuevoPassword, confirmarPassword);
  };
  
  // Estados de disponibilidad
  const [notificacionDisponibilidad, setNotificacionDisponibilidad] = useState<{ tipo: 'success' | 'error' | 'warning' | 'delete', mensaje: string } | null>(null);
  const [loadingEliminar, setLoadingEliminar] = useState<number | null>(null);
  const [nuevoDia, setNuevoDia] = useState("");
  const [nuevasHoras, setNuevasHoras] = useState<string[]>([]);
  // Estados para confirmación de eliminación
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [horarioAEliminar, setHorarioAEliminar] = useState<{dia: string, hora: string, horario: any} | null>(null);
  // Estados para confirmación de agregar horario
  const [mostrarConfirmacionAgregar, setMostrarConfirmacionAgregar] = useState(false);
  const [datosAgregar, setDatosAgregar] = useState<{dia: string, horas: string[], diaSemana: number} | null>(null);
  // Horas disponibles formateadas con dos dígitos (09:00 - 10:00)
  const horasDisponibles = Array.from({length: 14}, (_, i) => {
    const hour = 7 + i;
    const start = String(hour).padStart(2, '0');
    const end = String(hour + 1).padStart(2, '0');
    return `${start}:00 - ${end}:00`;
  });
  
  // Conjunto de horas ya agregadas para el día seleccionado (para deshabilitar)
  const horasAgregadasForDia = React.useMemo(() => {
    const diaIdx = DIAS_IDX_MAP[nuevoDia as string];
    if (typeof diaIdx === 'undefined') return new Set<string>();
    const set = new Set<string>();
    horarios.forEach(hr => {
      if (hr.dia_semana === diaIdx) {
        // Normalizar formato: quitar segundos si existen (HH:MM:SS -> HH:MM)
        const inicio = hr.hora_inicio.split(':').slice(0, 2).join(':');
        const fin = hr.hora_fin.split(':').slice(0, 2).join(':');
        set.add(`${inicio} - ${fin}`);
      }
    });
    return set;
  }, [horarios, nuevoDia]);

  // Limpiar selección de horas cuando cambia el día
  useEffect(() => {
    setNuevasHoras([]);
  }, [nuevoDia]);

  // Funciones de manejo de horarios usando utils
  const confirmarEliminacion = async () => {
    const handler = createEliminarHorarioHandler(
      setLoadingEliminar, eliminarHorarioService, getHorarios, setHorarios, 
      groupHorariosByDay, setDisponibilidad, setNotificacionDisponibilidad,
      setMostrarConfirmacion, setHorarioAEliminar
    );
    await handler(medicoData, horarioAEliminar);
  };
  
  const verificarCitasWrapper = (dia: string, hora: string) => {
    return verificarCitasEnHorario(dia, hora, citas);
  };
  
  const confirmarAgregarHorarios = async () => {
    const handler = createAgregarHorariosHandler(
      setLoadingHorarios, agregarHorario, setNotificacionDisponibilidad, setNuevoDia,
      setNuevasHoras, getHorarios, setHorarios, groupHorariosByDay, setDisponibilidad,
      setMostrarConfirmacionAgregar, setDatosAgregar
    );
    await handler(medicoData, datosAgregar);
  };
  const [search, setSearch] = useState("");
  // const [searchFacturas, setSearchFacturas] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null);
  

  // Filtro de citas: 'hoy', 'semana', 'todas', 'canceladas', 'finalizadas'
  const [filtroCitas, setFiltroCitas] = useState<'hoy' | 'semana' | 'todas' | 'canceladas' | 'finalizadas'>('hoy');
  // Lógica de filtrado y ordenado
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  
  // Calcular primer día de la semana (Lunes)
  const primerDiaSemana = new Date(hoy);
  const diaActual = hoy.getDay(); // 0 = Domingo, 1 = Lunes, etc.
  const diasHastaLunes = diaActual === 0 ? -6 : 1 - diaActual; // Si es domingo, retroceder 6 días
  primerDiaSemana.setDate(hoy.getDate() + diasHastaLunes);
  
  // Último día de la semana (Domingo)
  const ultimoDiaSemana = new Date(primerDiaSemana);
  ultimoDiaSemana.setDate(primerDiaSemana.getDate() + 6);
  
  // Debug del rango de semana
  if (process.env.NODE_ENV === 'development' && filtroCitas === 'semana') {
    console.log('📅 Rango de semana calculado:');
    console.log('- Hoy:', hoy.toISOString().split('T')[0]);
    console.log('- Primer día (Lunes):', primerDiaSemana.toISOString().split('T')[0]);
    console.log('- Último día (Domingo):', ultimoDiaSemana.toISOString().split('T')[0]);
    console.log('- Fechas disponibles en citas:', [...new Set(citas.map(c => c.fecha))].sort());
  }

  let citasFiltradas: Cita[] = [];
  if (filtroCitas === 'hoy') {
    // Mostrar todas las citas del día (sin importar la hora), excepto canceladas
    const hoyString = hoy.toISOString().split('T')[0];
    citasFiltradas = citas.filter(cita => {
      const fechaCitaString = new Date(cita.fecha).toISOString().split('T')[0];
      return fechaCitaString === hoyString && (cita.estado || '').toLowerCase() !== 'cancelada';
    }).sort((a, b) => {
      const fa = new Date(`${a.fecha}T${a.hora || '00:00'}`);
      const fb = new Date(`${b.fecha}T${b.hora || '00:00'}`);
      return fa.getTime() - fb.getTime();
    });
  } else if (filtroCitas === 'semana') {
    // Mostrar TODAS las citas de la semana actual (de lunes a domingo)
    citasFiltradas = citas.filter(cita => {
      const fechaCita = new Date(cita.fecha);
      fechaCita.setHours(0,0,0,0);
      return fechaCita >= primerDiaSemana && fechaCita <= ultimoDiaSemana && (cita.estado || '').toLowerCase() !== 'cancelada';
    }).sort((a, b) => {
      const fa = new Date(`${a.fecha}T${a.hora || '00:00'}`);
      const fb = new Date(`${b.fecha}T${b.hora || '00:00'}`);
      return fa.getTime() - fb.getTime();
    });
  } else if (filtroCitas === 'canceladas') {
    // Mostrar solo las citas canceladas (más recientes primero)
    citasFiltradas = citas.filter(cita => (cita.estado || '').toLowerCase() === 'cancelada')
      .sort((a, b) => {
        const fa = new Date(`${a.fecha}T${a.hora || '00:00'}`);
        const fb = new Date(`${b.fecha}T${b.hora || '00:00'}`);
        return fb.getTime() - fa.getTime();
      });
  } else if (filtroCitas === 'finalizadas') {
    // Mostrar solo las citas cuya fecha y hora ya pasaron (más recientes primero)
    const ahora = new Date();
    citasFiltradas = citas.filter(cita => {
      const fechaCompleta = new Date(`${cita.fecha}T${cita.hora || '00:00'}`);
      return fechaCompleta.getTime() < ahora.getTime();
    }).sort((a, b) => {
      const fa = new Date(`${a.fecha}T${a.hora || '00:00'}`);
      const fb = new Date(`${b.fecha}T${b.hora || '00:00'}`);
      return fb.getTime() - fa.getTime();
    });
  } else {
    // Todas: primero las citas que aún no han ocurrido (ahora o después), ordenadas por fecha/hora
    // (hoy, mañana, pasado mañana...), y al final las que ya pasaron.
    const ahora = new Date();
    const futuras = citas
      .filter(cita => {
        const fechaCita = new Date(`${cita.fecha}T${cita.hora || '00:00'}`);
        return fechaCita.getTime() >= ahora.getTime();
      })
      .sort((a, b) => {
        const fa = new Date(`${a.fecha}T${a.hora || '00:00'}`);
        const fb = new Date(`${b.fecha}T${b.hora || '00:00'}`);
        return fa.getTime() - fb.getTime();
      });

    const pasadas = citas
      .filter(cita => {
        const fechaCita = new Date(`${cita.fecha}T${cita.hora || '00:00'}`);
        return fechaCita.getTime() < ahora.getTime();
      })
      .sort((a, b) => {
        // Mostrar las pasadas con las más recientes primero (más cercanas a ahora)
        const fa = new Date(`${a.fecha}T${a.hora || '00:00'}`);
        const fb = new Date(`${b.fecha}T${b.hora || '00:00'}`);
        return fb.getTime() - fa.getTime();
      });

    citasFiltradas = [...futuras, ...pasadas];
  }
  // Paginación visual (solo para 'todas')
  const [mostrarTodasLasCitas, setMostrarTodasLasCitas] = useState(false);
  // Para 'todas', mostrar todas las citas ordenadas por fecha y hora ascendente
  const citasAMostrar = filtroCitas === 'todas'
    ? (mostrarTodasLasCitas ? [...citas].sort((a, b) => {
        const fa = new Date(`${a.fecha}T${a.hora || '00:00'}`);
        const fb = new Date(`${b.fecha}T${b.hora || '00:00'}`);
        return fa.getTime() - fb.getTime();
      }) : [...citas].sort((a, b) => {
        const fa = new Date(`${a.fecha}T${a.hora || '00:00'}`);
        const fb = new Date(`${b.fecha}T${b.hora || '00:00'}`);
        return fa.getTime() - fb.getTime();
      }).slice(0, 4))
    : citasFiltradas;
  
  // Estado de perfil editable
  const [perfil, setPerfil] = useState({
    nombre: "",
    apellido: "",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
    email: "",
    especialidad: ""
  });
  
  // Nombre del médico formateado
  const doctorName = medicoData 
    ? `Dr. ${medicoData.nombre} ${medicoData.apellido}` 
    : `Dr. ${perfil.nombre} ${perfil.apellido}`;

  // Edición inline de perfil
  const [formPerfil, setFormPerfil] = useState({ ...perfil });
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [mensajePerfil, setMensajePerfil] = useState("");
  
  // Efecto para actualizar el formulario cuando cambia el perfil
  useEffect(() => { 
    setFormPerfil({ ...perfil }); 
  }, [perfil, activeTab]);
  
  // Cargar datos del médico desde el backend al iniciar
  useEffect(() => {
    const fetchDashboardData = async () => {
      // Obtener el email/token del médico desde la utilidad central si están disponibles.
      // Hacemos fallback a la antigua key 'session' por compatibilidad con sesiones previas.
      let email: string | null = null;
      try {
        const sess = getSessionFromApi();
        email = sess?.email ?? null;
        // Si la util exportada no tiene session pero existe la key 'session' (legacy), usarla.
        if (!email) {
          const raw = localStorage.getItem('session');
          if (raw) {
            const parsed = JSON.parse(raw);
            email = parsed?.email ?? null;
            // Si el login antiguo guardó token en el objeto 'session', persistir en las claves que usa fetchJSON
            if (parsed?.token) {
              localStorage.setItem('medicoToken', parsed.token);
            }
            if (parsed?.email) {
              localStorage.setItem('medicoEmail', parsed.email);
            }
          }
        }
      } catch (err) {
        console.debug('No session object found in storage', err);
      }

      if (!email || email.trim() === '') {
        router.push('/login');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        // Ejecutar llamadas en paralelo para obtener todos los datos necesarios
        console.log('Debug - Cargando datos para médico:', email);
        
        const [medicoData, horariosData, citasData, pagosData] = await Promise.all([
          getMedicoPerfil(email).catch(err => {
            console.error('Error cargando perfil médico:', err);
            throw err;
          }),
          getHorarios(email).catch(err => {
            console.error('Error cargando horarios:', err);
            setErrorHorarios(`Error cargando horarios: ${err.message}`);
            return [];
          }),
          getCitas(email).catch(err => {
            console.error('Error cargando citas:', err);
            setErrorCitas(`Error cargando citas: ${err.message}`);
            return [];
          }),
          getPagosMedico(email).catch(err => {
            console.error('Error cargando pagos:', err);
            return { pagos: [], total_ingresos: 0, cantidad_pagos: 0 };
          })
        ]);

        console.log('Debug - Datos cargados:', {
          medico: medicoData,
          citas: citasData,
          horarios: horariosData,
          pagos: pagosData
        });

        setMedicoData(medicoData);
        // Resolver avatar determinista si el back no lo provee
        const avatarDet = await resolverAvatarDeterministaMedico(medicoData.email);
        setPerfil({
          nombre: medicoData.nombre,
          apellido: medicoData.apellido,
          avatar: avatarDet || "https://randomuser.me/api/portraits/men/45.jpg",
          email: medicoData.email,
          especialidad: medicoData.especializacion.toString()
        });

        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  // Guardar horarios crudos y actualizar vista agrupada
  setHorarios(horariosData);
  setDisponibilidad(groupHorariosByDay(horariosData));
        setCitas(citasData);
  // (opcional) cargar especialidades si se requiere en UI

        // Procesar datos de pagos
        setPagos(pagosData.pagos);
        setTotalIngresos(pagosData.total_ingresos);
        setLoadingPagos(false);

        // Obtener nombres de usuarios para las citas sin saturar el backend
        const usuariosIds = Array.from(new Set(citasData.map(cita => cita.usuario_id)));
        const usuariosNombres = new Map<string, string>();
        usuariosIds.forEach((usuarioId) => {
          // Mejorar el formato del nombre del usuario
          if (usuarioId && usuarioId.includes('@')) {
            const nombreBase = usuarioId.split('@')[0];
            // Capitalizar y formatear nombre
            const nombreFormateado = nombreBase
              .split('.')
              .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
              .join(' ');
            usuariosNombres.set(usuarioId, nombreFormateado);
          } else {
            usuariosNombres.set(usuarioId, usuarioId || 'Usuario');
          }
        });
        console.log('Debug - Mapa de usuarios creado:', usuariosNombres);
        setUsuariosMap(usuariosNombres);
      } catch (err) {
        console.error("Error al cargar datos del médico:", err);
        setError("No se pudieron cargar los datos del perfil del médico.");
        // Agregamos la asignación a los errores específicos
        setErrorCitas("No se pudieron cargar las citas.");
        setErrorHorarios("No se pudieron cargar los horarios.");
  // Error de pagos ya controlado en catch de la promesa de pagos
        setPerfil({
          nombre: "",
          apellido: "",
          avatar: "https://randomuser.me/api/portraits/men/45.jpg",
          email: "",
          especialidad: ""
        });
      } finally {
        setLoading(false);
        setLoadingCitas(false);
        setLoadingHorarios(false);
        setLoadingPagos(false);
      }
    };
    fetchDashboardData();
  }, [router]);

  // Función para refrescar datos manualmente
  const refrescarDatos = async () => {
    setLoadingCitas(true);
    setErrorCitas(null);
    
    try {
      const email = getSessionFromApi()?.email;
      if (!email) {
        throw new Error('No hay sesión activa');
      }
      
      // Obtener todas las citas del médico
      const todasLasCitas = await getCitas(email);
      setCitas(todasLasCitas);
      
      // Actualizar mapa de usuarios
      const usuariosIds = Array.from(new Set(todasLasCitas.map(cita => cita.usuario_id)));
      const usuariosNombres = new Map<string, string>();
      usuariosIds.forEach((usuarioId) => {
        // Mejorar el formato del nombre del usuario
        if (usuarioId && usuarioId.includes('@')) {
          const nombreBase = usuarioId.split('@')[0];
          // Capitalizar y formatear nombre
          const nombreFormateado = nombreBase
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
            .join(' ');
          usuariosNombres.set(usuarioId, nombreFormateado);
        } else {
          usuariosNombres.set(usuarioId, usuarioId || 'Usuario');
        }
      });
      setUsuariosMap(usuariosNombres);
      
    } catch (err) {
      console.error('Error al refrescar citas:', err);
      setErrorCitas(`Error al refrescar: ${err}`);
    } finally {
      setLoadingCitas(false);
    }
  };
  
  // Función helper para verificar si una fecha tiene citas
  const tieneCitasEnFecha = (fecha: Date): boolean => {
    const fechaString = fecha.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    return citas.some(cita => {
      // Convertir la fecha de la cita al mismo formato
      const fechaCita = new Date(cita.fecha).toISOString().split('T')[0];
      return fechaCita === fechaString;
    });
  };

  // Función para contar citas en una fecha específica
  const contarCitasEnFecha = (fecha: Date): number => {
    const fechaString = fecha.toISOString().split('T')[0];
    const citasEncontradas = citas.filter(cita => {
      const fechaCita = new Date(cita.fecha).toISOString().split('T')[0];
      return fechaCita === fechaString;
    });
    
    // Debug específico para fechas problemáticas
    if (process.env.NODE_ENV === 'development' && ['2025-09-06', '2025-09-08'].includes(fechaString)) {
      console.log(`🗓️ contarCitasEnFecha(${fechaString}):`, {
        citasEncontradas: citasEncontradas.length,
        citas: citasEncontradas.map(c => `${c.hora} - ${c.usuario_id}`),
        totalCitasDisponibles: citas.length
      });
    }
    
    return citasEncontradas.length;
  };

  // Función para obtener las citas del día seleccionado
  const getCitasDelDia = (fecha: Date | null): Cita[] => {
    if (!fecha) return [];
    const fechaString = fecha.toISOString().split('T')[0];
    return citas.filter(cita => {
      const fechaCita = new Date(cita.fecha).toISOString().split('T')[0];
      return fechaCita === fechaString;
    });
  };

  // Función para determinar el estilo de la cita según su estado
  const getEstiloCita = (cita: Cita, fechaCita: Date) => {
    const ahora = new Date();
    const fechaCitaCompleta = new Date(`${cita.fecha}T${cita.hora}`);
    const estado = cita.estado?.toLowerCase() || 'programada';
    
    // Colores según el estado
    if (estado === 'cancelada') {
      return {
        borderColor: 'border-red-500',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      };
    } else if (estado === 'completada' || estado === 'exitosa') {
      return {
        borderColor: 'border-green-500',
        bgColor: 'bg-green-50',
        textColor: 'text-green-800',
        iconColor: 'text-green-600'
      };
    } else if (fechaCitaCompleta < ahora) {
      // Cita ya pasó
      return {
        borderColor: 'border-gray-500',
        bgColor: 'bg-gray-50',
        textColor: 'text-gray-700',
        iconColor: 'text-gray-500'
      };
    } else {
      // Cita próxima (programada/pendiente)
      return {
        borderColor: 'border-blue-500',
        bgColor: 'bg-blue-50',
        textColor: 'text-blue-800',
        iconColor: 'text-blue-600'
      };
    }
  };

  // Contenido personalizado para mostrar en las fechas del calendario
  const tileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month' && tieneCitasEnFecha(date)) {
      const numCitas = contarCitasEnFecha(date);
      return (
        <div className={styles.citaMark}>
          <div className={styles.citaDot}></div>
          <span className={styles.citaCount}>{numCitas}</span>
        </div>
      );
    }
    return null;
  };
  
  // Guardar cambios del perfil (no usado actualmente)
  // const guardarPerfil = async (e: React.FormEvent) => { /* ... */ };

  // Agregar disponibilidad/horario
  const agregarDisponibilidad = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (nuevoDia && nuevasHoras.length > 0) {
      if (medicoData) {
        // Validación adicional: prevenir duplicados contra lo que ya hay en backend
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const diaSemana = dias.indexOf(nuevoDia);
        if (diaSemana === -1) {
          setNotificacionDisponibilidad({ tipo: 'error', mensaje: 'Día inválido seleccionado.' });
          setTimeout(() => setNotificacionDisponibilidad(null), 4000);
          return;
        }
        
        const existentesEnDia = nuevasHoras.filter((f: string) => {
          const diasIdx: any = { 'Domingo':0,'Lunes':1,'Martes':2,'Miércoles':3,'Jueves':4,'Viernes':5,'Sábado':6 };
          const diaIdx = diasIdx[nuevoDia];
          return horarios.some(hr => {
            if (hr.dia_semana !== diaIdx) return false;
            // Normalizar formato: quitar segundos si existen
            const inicio = hr.hora_inicio.split(':').slice(0, 2).join(':');
            const fin = hr.hora_fin.split(':').slice(0, 2).join(':');
            return `${inicio} - ${fin}` === f;
          });
        });
        
        if (existentesEnDia.length > 0) {
          setNotificacionDisponibilidad({ tipo: 'error', mensaje: `Ya existen las franjas: ${existentesEnDia.join(', ')} para ${nuevoDia}` });
          setTimeout(() => setNotificacionDisponibilidad(null), 4500);
          return;
        }

        // Mostrar confirmación de agregar
        setDatosAgregar({
          dia: nuevoDia,
          horas: nuevasHoras,
          diaSemana: diaSemana
        });
        setMostrarConfirmacionAgregar(true);
      }
    }
  };
  
  // Eliminar disponibilidad/horario
  const eliminarHorario = async (id: number) => {
    setLoadingEliminar(id);
    try {
      if (medicoData) {
        // Buscar el horario correspondiente en la lista de horarios del backend
        const horarioEncontrado = horarios.find(h => h.id === id);
        if (horarioEncontrado) {
          await eliminarHorarioService(medicoData.email, id);
          setNotificacionDisponibilidad({ tipo: 'success', mensaje: 'Horario eliminado correctamente.' });
          // Refrescar horarios desde el backend y la tabla de disponibilidad
          const horariosData = await getHorarios(medicoData.email);
          setHorarios(horariosData);
          setDisponibilidad(groupHorariosByDay(horariosData));
        }
      }
    } catch (error) {
      setNotificacionDisponibilidad({ tipo: 'error', mensaje: 'Error al eliminar el horario.' });
      console.error("Error al eliminar horario:", error);
    } finally {
      setLoadingEliminar(null);
      setTimeout(() => setNotificacionDisponibilidad(null), 3000);
    }
  };

  // Usamos los datos de citas para extraer pacientes únicos (simulación)
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loadingPacientes, setLoadingPacientes] = useState<boolean>(true);
  
  useEffect(() => {
    // Extraer información real de pacientes usando la API
    const cargarPacientes = async () => {
      setLoadingPacientes(true);
      try {
        if (citas.length > 0) {
          const pacientesApi = await extraerPacientes(citas);
          setPacientes(pacientesApi);
        } else {
          setPacientes([]);
        }
      } catch (error) {
        console.error("Error al cargar pacientes:", error);
      } finally {
        setLoadingPacientes(false);
      }
    };
    cargarPacientes();
  }, [citas]);
  
  // Filtrar pacientes por nombre o email
  const pacientesFiltrados = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  // Billing (facturación real)
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingNotImplemented, setBillingNotImplemented] = useState(false);
  const [billingProfileEditing, setBillingProfileEditing] = useState(false);
  const [billingProfileForm, setBillingProfileForm] = useState<{legal_name?: string, tax_id?: string}>({});
  const [addressForm, setAddressForm] = useState<Address | null>(null);
  const [addressEditing, setAddressEditing] = useState(false);
  const [addressFormEdit, setAddressFormEdit] = useState<Partial<Address>>({});
  const [pmList, setPmList] = useState<PaymentMethod[]>([]);
  const [pmFormOpen, setPmFormOpen] = useState(false);
  const [pmForm, setPmForm] = useState<Partial<PaymentMethod>>({ provider: 'manual' });
  const [pmLoading, setPmLoading] = useState(false);
  const [pmEditingId, setPmEditingId] = useState<number | null>(null);
  const [pmEditForm, setPmEditForm] = useState<Partial<PaymentMethod>>({});
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  // const [facturas, setFacturas] = useState<Factura[]>([]); // Para compatibilidad visual
  // const [loadingFacturas, setLoadingFacturas] = useState(true);

  // Cargar billing al entrar en la pestaña
  useEffect(() => {
    const cargarBilling = async () => {
      if (!medicoData) return;
      setBillingLoading(true);
      setBillingNotImplemented(false);
      try {
        const profile = await getBillingProfileByOwner('medico', medicoData.email);
        setBillingProfile(profile);
        if (profile.address) setAddressForm(profile.address);
        const methods = await listPaymentMethodsByProfile(profile.id);
        setPmList(methods);
        const allInvoices = await listInvoices();
        setInvoices(allInvoices.filter(inv => inv.billing_profile_id === profile.id));
      } catch (error: any) {
        if (error.message === 'BILLING_NOT_IMPLEMENTED') {
          setBillingNotImplemented(true);
          console.warn('Sistema de billing no implementado en el backend');
        } else {
          console.error('Error cargando billing:', error);
        }
        setBillingProfile(null);
        setPmList([]);
        setInvoices([]);
      } finally {
        setBillingLoading(false);
      }
    };
    if (activeTab === 'billing' && medicoData) cargarBilling();
  }, [activeTab, medicoData]);

  // Resumen para el grid superior
  const resumen = [
    { titulo: "Total Citas", valor: citas.length, icono: "📅", color: "#e3f2fd", bg: "bg-blue-300/40", accent: "bg-gradient-primary-soft" },
    { titulo: "Total Pacientes", valor: pacientes.length, icono: "👤", color: "#90caf9", bg: "bg-orange-200/40", accent: "bg-gradient-secondary-soft" },
    { titulo: "Disponibilidad", valor: disponibilidad.length, icono: "🕒", color: "#ececec", bg: "bg-purple-300/40", accent: "bg-gradient-accent-soft" },
    { 
      titulo: "Ingresos", 
      valor: loadingPagos ? "..." : formatearMonto(totalIngresos), 
      icono: "💰", 
      color: "#fff0d4ff", 
      bg: "bg-emerald-300/40", 
      accent: "bg-gradient-accent-soft" 
    },
  ];

  const handleLogout = async () => {
    try {
      // Intentar cerrar sesión en el backend
      const medicoEmail = localStorage.getItem('medicoEmail');
      if (medicoEmail) {
        await logout();
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    } finally {
      // Limpiar localStorage y redirigir a login
      localStorage.removeItem('medicoEmail');
      localStorage.removeItem('medicoToken');
      localStorage.removeItem('medicoData');
      window.location.href = "/login";
    }
  };

  // Responsive breakpoints
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Actualizar tiempo cada minuto para mantener actualizada la "Próxima Cita"
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(obtenerFechaServidor()); // Usar fecha del servidor
    }, 60000); // Actualizar cada minuto

    return () => clearInterval(timer);
  }, []);
  const isMobileValue = useMediaQuery({ query: '(max-width: 700px)' });
  const isTabletValue = useMediaQuery({ query: '(min-width: 701px) and (max-width: 1024px)' });
  const isDesktopValue = useMediaQuery({ query: '(min-width: 1025px)' });
  const isMobile = mounted ? isMobileValue : false;
  const isTablet = mounted ? isTabletValue : false;
  const isDesktop = mounted ? isDesktopValue : false;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  useEffect(() => {
    if (isDesktop) {
      setSidebarOpen(true);
    } else {
      setSidebarOpen(false);
    }
  }, [isDesktop, isTablet, isMobile]);

  // Crear objeto de contexto para componentes de sections
  const ctx = {
    // Estados de citas (principales)
    citas,
    fechaSeleccionada,
    setFechaSeleccionada,
    filtroCitas,
    setFiltroCitas,
    mostrarTodasLasCitas,
    setMostrarTodasLasCitas,
    loadingCitas,
    errorCitas,
    usuariosMap,
    getCitasDelDia,
    citasAMostrar,
    citasFiltradas,
    tileContent,
    styles,
    
    // Estados de disponibilidad
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
    verificarCitasEnHorario: verificarCitasWrapper,
    setNotificacionDisponibilidad,
    setHorarioAEliminar,
    setMostrarConfirmacion,
    
    // Estados de pacientes
    pacientes,
    loadingPacientes,
    search,
    setSearch,
    pacientesFiltrados,
    
    // Estados de billing
    billingProfile,
    setBillingProfile,
    billingLoading,
    setBillingLoading,
    billingNotImplemented,
    setBillingNotImplemented,
    billingProfileEditing,
    setBillingProfileEditing,
    billingProfileForm,
    setBillingProfileForm,
    createOrUpdateBillingProfile,
    invoices,
    addressForm,
    setAddressForm,
    addressEditing,
    setAddressEditing,
    addressFormEdit,
    setAddressFormEdit,
    updateAddress,
    createAddress,
    pmList,
    setPmList,
    pmForm,
    setPmForm,
    pmFormOpen,
    setPmFormOpen,
    pmLoading,
    setPmLoading,
    pmEditingId,
    setPmEditingId,
    pmEditForm,
    setPmEditForm,
    createPaymentMethod,
    listPaymentMethodsByProfile,
    updatePaymentMethod,
    deletePaymentMethod,
    
    // Estados de perfil
    notificacionPassword,
    formPerfil,
    avatarFile,
    setAvatarFile,
    setCargandoPerfil,
    setMensajePerfil,
    setPerfil,
    setFormPerfil,
    updateMedicoAvatar,
    mensajePerfil,
    cargandoPerfil,
    mostrarCambioPassword,
    setMostrarCambioPassword,
    passwordActual,
    setPasswordActual,
    nuevoPassword,
    setNuevoPassword,
    confirmarPassword,
    setConfirmarPassword,
    cambiarPassword,
    cambiandoPassword,
    setMensajePassword,
    mensajePassword
  };

  return (
    <>
      {loading && <PantallaCarga />}
      
      {/* Notificaciones fijas en esquina superior derecha de la pantalla */}
      {notificacionDisponibilidad && (
        <div className={`fixed top-24 right-8 z-[60] p-4 rounded-2xl font-semibold border shadow-lg transition-all duration-500 transform animate-bounce max-w-md ${
          notificacionDisponibilidad.tipo === 'success' 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-200' 
            : notificacionDisponibilidad.tipo === 'warning'
            ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-800 border-orange-200'
            : notificacionDisponibilidad.tipo === 'delete'
            ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-200'
            : 'bg-gradient-to-r from-red-50 to-pink-50 text-red-800 border-red-200'
        }`}>
          <div className="flex items-center justify-center gap-2">
            <span className="text-lg">
              {notificacionDisponibilidad.tipo === 'success' ? '✅' : 
               notificacionDisponibilidad.tipo === 'warning' ? '⚠️' : 
               notificacionDisponibilidad.tipo === 'delete' ? '🗑️' : '❌'}
            </span>
            {notificacionDisponibilidad.mensaje}
          </div>
          <button 
            onClick={() => setNotificacionDisponibilidad(null)}
            className="absolute -top-2 -right-2 bg-gray-200 hover:bg-gray-300 rounded-full w-6 h-6 flex items-center justify-center text-gray-600 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Modal de confirmación para eliminar horario */}
      {mostrarConfirmacion && horarioAEliminar && (
        <div className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-md mx-4 shadow-2xl border border-red-200/50">
            <div className="text-center">
              <div className="mb-4">
                <span className="text-4xl">🗑️</span>
              </div>
              <h3 className="text-lg font-bold text-red-800 mb-2">
                Confirmar Eliminación de Horario
              </h3>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-gray-700 mb-3 text-sm">
                  Estás a punto de eliminar permanentemente el siguiente horario de atención:
                </p>
                <div className="bg-white border border-red-300 rounded-lg p-3 mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📅</span>
                    <span className="font-bold text-red-800">Día:</span>
                    <span className="text-gray-800 font-semibold">{horarioAEliminar.dia}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⏰</span>
                    <span className="font-bold text-red-800">Horario:</span>
                    <span className="text-gray-800 font-semibold">{horarioAEliminar.hora}</span>
                  </div>
                </div>
                <p className="text-red-700 text-sm font-medium">
                  ⚠️ Esta acción no se puede deshacer
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setMostrarConfirmacion(false);
                    setHorarioAEliminar(null);
                  }}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminacion}
                  disabled={loadingEliminar === horarioAEliminar?.horario?.id}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingEliminar === horarioAEliminar?.horario?.id ? (
                    <>
                      <div className="animate-spin rounded-full border-2 border-white/30 border-t-white h-4 w-4"></div>
                      Eliminando...
                    </>
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación para agregar horarios */}
      {mostrarConfirmacionAgregar && datosAgregar && (
        <div className="fixed inset-0 z-[70] bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 max-w-md mx-4 shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="mb-4">
                <span className="text-4xl">📅</span>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Confirmar Agregar Horarios
              </h3>
              <p className="text-gray-600 mb-4">
                ¿Estás seguro de que deseas agregar las siguientes franjas horarias para el día <span className="font-semibold text-gray-800">{datosAgregar.dia}</span>?
              </p>
              <div className="mb-6 max-h-32 overflow-y-auto">
                <div className="flex flex-wrap gap-1 justify-center">
                  {datosAgregar.horas.map((hora, index) => (
                    <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-lg text-sm font-medium">
                      {hora}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setMostrarConfirmacionAgregar(false);
                    setDatosAgregar(null);
                  }}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarAgregarHorarios}
                  disabled={loadingHorarios}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingHorarios ? (
                    <>
                      <div className="animate-spin rounded-full border-2 border-white/30 border-t-white h-4 w-4"></div>
                      Agregando...
                    </>
                  ) : (
                    'Agregar Horarios'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Navbar mejorado que respeta el sidebar */}
      <MedicoNavbar
        isMobile={isMobile}
        isTablet={isTablet}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
      />
      
      {/* Botón para mostrar/ocultar el menú en mobile/tablet */}
      <div className="relative flex min-h-screen text-[#1f2937] bg-gradient-to-br from-slate-50/95 via-blue-100/90 to-indigo-50/95 overflow-hidden">
        {/* Sidebar */}
        <MedicoSidebar
          isMobile={isMobile}
          isTablet={isTablet}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        {/* Main content */}
        <main className={`flex-1 flex flex-col overflow-hidden ${
          isMobile || isTablet ? 'ml-0' : 'ml-72'
        }`}>
        <div className="flex-1 min-h-screen pt-24 overflow-x-hidden overflow-y-auto">
        
        {/* Panel del Médico mejorado */}
        <div className="p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12 overflow-hidden">
        <DashboardHeader doctorName={doctorName} />
        {loading && (
          <div className="w-full bg-primary-100 text-primary-700 p-3 rounded-lg mb-4 text-center">
            Cargando datos del médico...
          </div>
        )}
        {error && (
          <div className="w-full bg-red-100 text-red-800 p-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {activeTab === 'perfil' && <PerfilSection ctx={ctx} />}
        {activeTab === 'dashboard' && (
          <>
            <DashboardCards
              resumen={resumen}
              mostrarDetalleIngresos={mostrarDetalleIngresos}
              setMostrarDetalleIngresos={setMostrarDetalleIngresos}
              pagos={pagos}
              loadingPagos={loadingPagos}
              totalIngresos={totalIngresos}
            />
            
            {/* Grid principal reorganizado para mejor balance visual */}
            <div className="space-y-8">
              {/* Grid con las 4 secciones: estadísticas + citas */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Panel de Estadísticas de Hoy */}
                <section className="bg-gradient-to-br from-white via-blue-50/30 to-cyan-50/20 backdrop-blur-sm rounded-2xl shadow-xl border border-blue-200/50 flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-cyan-700 p-5 md:p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <span className="text-xl">📈</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-white uppercase tracking-wide">Estadísticas de Hoy</h2>
                      <p className="text-blue-100 text-xs">{new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 md:p-6">
                  <div className="w-full h-1 bg-gradient-to-r from-blue-400 to-cyan-500 rounded mb-4" />
                  {(() => {
                    const hoy = new Date().toISOString().split('T')[0];
                    const citasHoy = citas.filter(cita => {
                      const fechaCita = new Date(cita.fecha).toISOString().split('T')[0];
                      return fechaCita === hoy;
                    });
                    const citasCompletadas = citasHoy.filter(cita => cita.estado?.toLowerCase() === 'completada').length;
                    const citasCanceladas = citasHoy.filter(cita => cita.estado?.toLowerCase() === 'cancelada').length;
                    const citasPendientes = citasHoy.filter(cita => !cita.estado || cita.estado.toLowerCase() === 'programada').length;
                    
                    return (
                      <div className="grid grid-cols-2 gap-4">
                        {/* Total de citas hoy */}
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-blue-700 mb-1">{citasHoy.length}</div>
                          <div className="text-xs text-blue-600 font-medium">Citas Hoy</div>
                        </div>
                        
                        {/* Citas completadas */}
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-green-700 mb-1">{citasCompletadas}</div>
                          <div className="text-xs text-green-600 font-medium">Completadas</div>
                        </div>
                        
                        {/* Citas pendientes */}
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-orange-700 mb-1">{citasPendientes}</div>
                          <div className="text-xs text-orange-600 font-medium">Pendientes</div>
                        </div>
                        
                        {/* Citas canceladas */}
                        <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200 rounded-xl p-4 text-center">
                          <div className="text-2xl font-bold text-red-700 mb-1">{citasCanceladas}</div>
                          <div className="text-xs text-red-600 font-medium">Canceladas</div>
                        </div>
                      </div>
                    );
                  })()}
                  {/* Próxima cita */}
                    {(() => {
                      // Utilidad para formatear YYYY-MM-DD en zona local del servidor
                      const formatDate = (d: Date): string => {
                        const pad = (n: number): string => String(n).padStart(2, '0');
                        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
                      };

                      // USAR EL ESTADO currentTime (se actualiza cada minuto)
                      const ahoraServidor = currentTime;
                      const hoy = formatDate(ahoraServidor);

                      // Citas de hoy que aún no han pasado
                      const citasHoyFuturas = citas
                        .filter(cita => {
                          if (cita.fecha !== hoy) return false;

                          let fechaCitaCompleta;
                          try {
                            fechaCitaCompleta = new Date(`${cita.fecha}T${cita.hora}`);
                            if (isNaN(fechaCitaCompleta.getTime())) {
                              fechaCitaCompleta = new Date(`${cita.fecha} ${cita.hora}`);
                            }
                          } catch (e) {
                            return false;
                          }

                          const estadoCita = cita.estado?.toLowerCase() || 'pendiente';
                          const noEsCancelada = estadoCita !== 'cancelada' && estadoCita !== 'cancelado';

                          return !isNaN(fechaCitaCompleta.getTime()) &&
                                fechaCitaCompleta > ahoraServidor &&
                                noEsCancelada;
                        })
                        .sort((a, b) => {
                          const fechaA = new Date(`${a.fecha}T${a.hora}`);
                          const fechaB = new Date(`${b.fecha}T${b.hora}`);
                          return fechaA.getTime() - fechaB.getTime();
                        });

                      // Citas de días futuros (no hoy)
                      const citasDiasFuturos = citas
                        .filter(cita => {
                          if (cita.fecha <= hoy) return false;

                          let fechaCitaCompleta;
                          try {
                            fechaCitaCompleta = new Date(`${cita.fecha}T${cita.hora}`);
                            if (isNaN(fechaCitaCompleta.getTime())) {
                              fechaCitaCompleta = new Date(`${cita.fecha} ${cita.hora}`);
                            }
                          } catch (e) {
                            return false;
                          }

                          const estadoCita = cita.estado?.toLowerCase() || 'pendiente';
                          const noEsCancelada = estadoCita !== 'cancelada' && estadoCita !== 'cancelado';

                          return !isNaN(fechaCitaCompleta.getTime()) && noEsCancelada;
                        })
                        .sort((a, b) => {
                          const fechaA = new Date(`${a.fecha}T${a.hora}`);
                          const fechaB = new Date(`${b.fecha}T${b.hora}`);
                          return fechaA.getTime() - fechaB.getTime();
                        });

                      // Determinar la próxima cita según la lógica solicitada
                      let proximaCita = null;
                      let esHoy = false;
                      let esMañana = false;

                      if (citasHoyFuturas.length > 0) {
                        // Hay citas hoy pendientes
                        proximaCita = citasHoyFuturas[0];
                        esHoy = true;
                      } else if (citasDiasFuturos.length > 0) {
                        // No hay más citas hoy, mostrar la primera de días futuros
                        proximaCita = citasDiasFuturos[0];
                        // Verificar si es mañana
                        const mañana = new Date(ahoraServidor);
                        mañana.setDate(mañana.getDate() + 1);
                        const mañanaStr = formatDate(mañana);
                        esMañana = proximaCita.fecha === mañanaStr;
                      }

                      return (
                        <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2 justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">⏰</span>
                              <h3 className="font-semibold text-indigo-800 text-sm">Próxima Cita</h3>
                            </div>
                            <div className="flex gap-1">
                              <button
                                onClick={refrescarDatos}
                                disabled={loadingCitas}
                                className="text-xs bg-indigo-100 hover:bg-indigo-200 text-indigo-700 px-2 py-1 rounded transition-colors"
                                title="Refrescar datos de citas"
                              >
                                {loadingCitas ? '⟳' : '🔄'}
                              </button>
                            </div>
                          </div>
                          {loadingCitas ? (
                            <div className="text-xs text-gray-500">Cargando próximas citas...</div>
                          ) : errorCitas ? (
                            <div className="text-xs text-red-500">Error al cargar citas: {errorCitas}</div>
                          ) : proximaCita ? (
                            <div className="space-y-1">
                              <div className="font-medium text-indigo-700">
                                {usuariosMap.get(proximaCita.usuario_id) || 
                                (proximaCita.usuario_id?.includes('@') 
                                  ? proximaCita.usuario_id.split('@')[0].split('.').map(part => 
                                      part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
                                    ).join(' ')
                                  : proximaCita.usuario_id || 'Usuario sin nombre')}
                              </div>
                              <div className="text-xs text-indigo-600">
                                📅 {esHoy ? 'Hoy' : esMañana ? 'Mañana' : new Date(proximaCita.fecha).toLocaleDateString('es-ES', {
                                  weekday: 'short',
                                  day: 'numeric', 
                                  month: 'short'
                                })} • 🕐 {proximaCita.hora}
                              </div>
                              {proximaCita.motivo && (
                                <div className="text-xs text-indigo-500 italic">
                                  💬 {proximaCita.motivo}
                                </div>
                              )}
                              <div className="text-xs text-indigo-400">
                                📋 {proximaCita.estado || 'Pendiente'}
                              </div>
                              {/* Mostrar tiempo restante con contexto mejorado */}
                              {(() => {
                                const fechaCita = new Date(`${proximaCita.fecha}T${proximaCita.hora}`);
                                const diff = fechaCita.getTime() - ahoraServidor.getTime();
                                const minutos = Math.floor(diff / (1000 * 60));
                                const horas = Math.floor(minutos / 60);
                                const dias = Math.floor(horas / 24);

                                if (esHoy) {
                                  if (minutos <= 15) {
                                    return <div className="text-xs text-red-600 font-semibold">⚠️ ¡En {minutos} minuto{minutos !== 1 ? 's' : ''}!</div>;
                                  } else if (minutos < 60) {
                                    return <div className="text-xs text-orange-600">⏱️ En {minutos} minuto{minutos !== 1 ? 's' : ''}</div>;
                                  } else {
                                    const horasRestantes = Math.floor(minutos / 60);
                                    const minutosRestantes = minutos % 60;
                                    if (minutosRestantes > 0) {
                                      return <div className="text-xs text-orange-600">⏱️ En {horasRestantes}h {minutosRestantes}m</div>;
                                    } else {
                                      return <div className="text-xs text-orange-600">⏱️ En {horasRestantes} hora{horasRestantes !== 1 ? 's' : ''}</div>;
                                    }
                                  }
                                } else if (esMañana) {
                                  const horasCita = new Date(`${proximaCita.fecha}T${proximaCita.hora}`).getHours();
                                  const periodo = horasCita < 12 ? 'mañana' : horasCita < 18 ? 'tarde' : 'noche';
                                  return <div className="text-xs text-blue-600">🌅 Mañana por la {periodo}</div>;
                                } else if (dias === 1) {
                                  return <div className="text-xs text-green-600">📅 Mañana</div>;
                                } else if (dias > 0) {
                                  return <div className="text-xs text-green-600">⏱️ En {dias} día{dias > 1 ? 's' : ''}</div>;
                                } else {
                                  return <div className="text-xs text-green-600">⏱️ Próximamente</div>;
                                }
                              })()}
                            </div>
                          ) : (
                            <div className="text-xs text-gray-500">
                              {citas.length === 0 ? 
                                '📋 No hay citas registradas' : 
                                '📅 No hay citas próximas programadas'
                              }
                              {/* Info simplificada */}
                              {citas.length > 0 && (
                                <div className="mt-2 text-xs text-gray-400">
                                  📊 {citas.length} citas totales | 🗓️ Hoy: {citas.filter(c => c.fecha === hoy).length}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                </div>
              </section>
              
              {/* Panel de Métricas Mensuales */}
              <section className="bg-gradient-to-br from-white via-amber-50/30 to-orange-50/20 backdrop-blur-sm rounded-2xl shadow-xl border border-amber-200/50 flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-orange-700 p-5 md:p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 to-transparent"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <span className="text-xl">📊</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-white uppercase tracking-wide">Métricas del Mes</h2>
                      <p className="text-amber-100 text-xs">{new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 md:p-6">
                  <div className="w-full h-1 bg-gradient-to-r from-amber-400 to-orange-500 rounded mb-4" />
                  {(() => {
                    const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
                    const finMes = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
                    
                    const citasMes = citas.filter(cita => {
                      const fechaCita = new Date(cita.fecha);
                      return fechaCita >= inicioMes && fechaCita <= finMes;
                    });
                    
                    const citasCompletadasMes = citasMes.filter(c => c.estado?.toLowerCase() === 'completada').length;
                    const citasCanceladasMes = citasMes.filter(c => c.estado?.toLowerCase() === 'cancelada').length;
                    const tasaExito = citasMes.length > 0 ? ((citasCompletadasMes / citasMes.length) * 100).toFixed(1) : 0;
                    
                    const pacientesUnicos = new Set(citasMes.map(c => c.usuario_id)).size;
                    
                    return (
                      <div className="space-y-4">
                        {/* Métricas principales */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-blue-700 mb-1">{citasMes.length}</div>
                            <div className="text-xs text-blue-600 font-medium">Citas Totales</div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-green-700 mb-1">{citasCompletadasMes}</div>
                            <div className="text-xs text-green-600 font-medium">Completadas</div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-purple-700 mb-1">{pacientesUnicos}</div>
                            <div className="text-xs text-purple-600 font-medium">Pacientes</div>
                          </div>
                          
                          <div className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-3 text-center">
                            <div className="text-xl font-bold text-amber-700 mb-1">{tasaExito}%</div>
                            <div className="text-xs text-amber-600 font-medium">Tasa Éxito</div>
                          </div>
                        </div>
                        
                        {/* Progreso visual */}
                        <div className="bg-white/80 border border-amber-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-700">Progreso del mes</span>
                            <span className="text-xs text-gray-500">{citasCompletadasMes}/{citasMes.length}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-green-400 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${citasMes.length > 0 ? (citasCompletadasMes / citasMes.length) * 100 : 0}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Días más activos */}
                        {(() => {
                          const diasActividad = citasMes.reduce((acc: { [key: string]: number }, cita) => {
                            const dia = new Date(cita.fecha).toLocaleDateString('es-ES', { weekday: 'long' });
                            acc[dia] = (acc[dia] || 0) + 1;
                            return acc;
                          }, {});
                          
                          const diasMasActivos = Object.entries(diasActividad)
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 2);
                          
                          return diasMasActivos.length > 0 ? (
                            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3">
                              <div className="text-xs font-semibold text-amber-800 mb-2">📅 Días más activos:</div>
                              <div className="space-y-1">
                                {diasMasActivos.map(([dia, cantidad]) => (
                                  <div key={dia} className="flex justify-between items-center">
                                    <span className="text-xs text-amber-700 capitalize">{dia}</span>
                                    <span className="bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full text-xs font-bold">
                                      {cantidad} citas
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    );
                  })()}
                </div>
              </section>
              
              {/* Panel de Citas (como cuarta tarjeta del grid) */}
              <section className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/20 backdrop-blur-sm rounded-2xl shadow-xl border border-indigo-200/50 flex flex-col overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 via-indigo-700 to-blue-700 p-5 md:p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-transparent"></div>
                  <div className="relative flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <span className="text-xl">📅</span>
                    </div>
                    <div>
                      <h2 className="font-bold text-white uppercase tracking-wide">Citas</h2>
                      <p className="text-indigo-100 text-xs">Calendario interactivo</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 md:p-4 lg:p-2 overflow-hidden">
                  <div className="w-full h-1 bg-gradient-to-r from-indigo-400 to-blue-500 rounded my-4" />
                  
                  {/* Calendario con márgenes controlados - responsive mejorado */}
                  <div className="flex flex-col gap-3 overflow-hidden">
                    <div className="w-full flex justify-center overflow-hidden">
                      <div className={`${styles.calendarContainer} w-full max-w-full h-96 sm:h-56 md:h-64 lg:h-80 xl:h-80`} style={{ margin: '0 auto' }}>
                        <Calendar
                          className={`${styles.calendarBox} h-full`}
                          onChange={date => setFechaSeleccionada(date instanceof Date ? date : null)}
                          value={fechaSeleccionada}
                          minDate={new Date('2024-01-01')}
                          tileContent={tileContent}
                          tileDisabled={() => false}
                        />
                      </div>
                    </div>
                    
                    {/* Resumen compacto de citas */}
                    <div className="bg-white/80 border border-indigo-200 rounded-xl p-3">
                      {fechaSeleccionada ? (
                        <>
                          <div className="text-xs font-semibold text-indigo-800 mb-2">
                            {fechaSeleccionada.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                          </div>
                          {getCitasDelDia(fechaSeleccionada).length === 0 ? (
                            <div className="text-center text-gray-500 py-2">
                              <div className="text-lg mb-1">📅</div>
                              <p className="text-xs">Sin citas</p>
                            </div>
                          ) : (
                            <div className="space-y-1 max-h-[80px] overflow-y-auto">
                              {getCitasDelDia(fechaSeleccionada).slice(0, 3).map((cita, idx) => (
                                <div key={idx} className="bg-blue-50 rounded p-1.5 border border-blue-200">
                                  <div className="text-xs font-medium text-blue-800">
                                    {usuariosMap.get(cita.usuario_id) || `Usuario ${cita.usuario_id}`}
                                  </div>
                                  <div className="text-xs text-blue-600">🕐 {cita.hora}</div>
                                </div>
                              ))}
                              {getCitasDelDia(fechaSeleccionada).length > 3 && (
                                <div className="text-xs text-center text-indigo-600 font-medium">
                                  +{getCitasDelDia(fechaSeleccionada).length - 3} más
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
              </section>
            </div>
            </div>
          </>
        )}
        {activeTab === 'citas' && (
          <CitasSection ctx={ctx} />
        )}
        {activeTab === 'disponibilidad' && (
          <DisponibilidadSection ctx={ctx} />
        )}
        {activeTab === 'pacientes' && (
          <PacientesSection ctx={ctx} />
        )}
        {activeTab === 'billing' && <BillingSection ctx={ctx} />}
        </div>
        </div>
        <Footer 
          variant="medical"
          sticky={false}
          style={{
            borderRadius: '16px 16px 0 0',
            marginTop: '2rem',
          }}
        />
      </main>
    </div>
    </>
  );
}
