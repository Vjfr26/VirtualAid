"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useMediaQuery } from 'react-responsive';
import { useTranslation } from 'react-i18next';
import Image from 'next/image';
import HeaderLogo from '../components/HeaderLogo';
import i18n from '../../i18n';
import Footer from '../components/Footer';

import 'react-calendar/dist/Calendar.css';
import styles from './calendar.module.css';
import { getEspecialistas, getUsuarioPerfil, getCitasDeUsuario, getPagosDeUsuario, getSession, fetchJSON, type Cita as TCita, createOrUpdateBillingProfile, type BillingProfile, createAddress, updateAddress, type Address, listPaymentMethodsByProfile, createPaymentMethod, updatePaymentMethod, deletePaymentMethod, type PaymentMethod, crearCita, changeUsuarioPassword, updateUsuarioAvatar, getCitasDeMedico, marcarPagoGratis, descargarRecibo } from './services';
// Definimos un tipo compatible con el requerido por BillingView (structural typing)
interface BillingInvoice { id: string; amount: number; currency: string; status: string; created_at: string; paid_at?: string }
import { createOrder as paypalCreateOrder, captureOrder as paypalCaptureOrder } from './services/paypal';
import { getHorarios, type Horario } from '../medico/services/horarios';
import { useToast } from '../components/Toast';

// Componentes modularizados del dashboard
import { 
  QuickActionCards, 
  BookAppointmentCard, 
  SpecialistsCard, 
  WelcomeHeader,
  AppointmentsHeader,
  AppointmentsCalendar,
  AppointmentsList,
  SpecialistsPageHeader,
  SpecialistsSearchFilters,
  SpecialistsList,
  ReunionView,
  PaymentsView,
  BillingView
} from './components';

// Datos iniciales mínimos para evitar layout shift mientras carga
import type { MedicoResumen } from './services/medicos';

const especialistasEjemplo: MedicoResumen[] = [];

// Idiomas disponibles
const languages = [
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'ja', label: '日本語', flag: '🇯🇵' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { code: 'pl', label: 'Polski', flag: '🇵🇱' },
];

export default function DashboardPaciente() {
  const { t, i18n: i18nHook } = useTranslation('common');
  const [showLangMenu, setShowLangMenu] = useState(false);
  
  // Citas reales
  const [citasAgendadas, setCitasAgendadas] = useState<{ id?: number|string; fecha: Date; hora: string; medico: string; especialidad?: string; tokenSala?: string; idRoom?: string; token?: string }[]>([]);
  // Estados para la mejora del apartado de citas
  const [filtroCitas, setFiltroCitas] = useState<'todas' | 'proximas' | 'pasadas'>('todas');
  const [fechaSeleccionadaCalendario, setFechaSeleccionadaCalendario] = useState<Date | null>(null);
  
  // Computar citas filtradas
  const hoy = new Date();
  const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  
  const citasProximas = citasAgendadas.filter(c => c.fecha >= inicioHoy);
  const citasPasadas = citasAgendadas.filter(c => c.fecha < inicioHoy);
  
  const citasFiltradas = filtroCitas === 'proximas' 
    ? citasProximas 
    : filtroCitas === 'pasadas' 
      ? citasPasadas 
      : citasAgendadas;

  const citasFiltradasCalendario = fechaSeleccionadaCalendario
    ? citasAgendadas.filter(c => c.fecha.toDateString() === fechaSeleccionadaCalendario.toDateString())
    : citasAgendadas;
  // Reuniones
  const [reuniones, setReuniones] = useState<Array<{ id: number|string; fecha: string; hora: string; medico: string; especialidad?: string; archivo?: string|null }>>([]);
  const { addToast } = useToast();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [vista, setVista] = useState<'inicio' | 'citas' | 'especialistas' | 'pagos' | 'billing' | 'Reunion'>('inicio');
  // Pagos combinados con citas
  // Guardamos fechaRaw (ISO) para ordenar correctamente por fecha real
  const [pagos, setPagos] = useState<{ id: number; fecha: string; fechaRaw: string; medico: string; especialidad?: string; monto: number; estado: string; tokenSala?: string; idRoom?: string }[]>([]);
  // PayPal SDK
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoadFailed, setPaypalLoadFailed] = useState(false);
  // PayPal env vars
  const paypalClientIdEnv = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
  if (typeof window !== 'undefined' && !paypalClientIdEnv) {
    console.warn('[PayPal] NEXT_PUBLIC_PAYPAL_CLIENT_ID vacío o no definido. Asegúrate de crear .env.local (con punto) en la raíz y reiniciar el servidor.');
  }
  // Si el valor contiene palabras de placeholder lo consideramos inválido para evitar petición 400
  const paypalClientId = /REEMPLAZA|TU_CLIENT_ID|PLACEHOLDER/i.test(paypalClientIdEnv) ? '' : paypalClientIdEnv.trim();
  const paypalMisconfigured = !!paypalClientIdEnv && !paypalClientId; // había algo pero era placeholder
  const paypalCurrency = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || 'EUR';
  const paypalLocale = process.env.NEXT_PUBLIC_PAYPAL_LOCALE || 'es_ES';
  // No deshabilitamos 'card' aquí para permitir el pago con tarjeta dentro del SDK
  // (siempre que la cuenta/paypal config lo permita). Solo deshabilitamos "credit".
  const paypalDisableFunding = 'credit';

  // Simular pago (obsoleto con PayPal) — eliminado
  // Datos de usuario logueado (evitar SSR/CSR mismatch)
  const [usuario, setUsuario] = useState<{
    nombre: string;
    apellido?: string;
    avatar?: string;
    email: string;
    telefono?: string;
    dni?: string;
    pais?: string;
  }>({
    nombre: 'Usuario',
    apellido: '',
    avatar: "https://randomuser.me/api/portraits/lego/1.jpg",
    email: '',
    telefono: '',
    dni: '',
    pais: ''
  });

  // Sincronizar usuario con sesión solo en cliente
  useEffect(() => {
    const session = getSession();
    if (session) {
      setUsuario(prev => ({
        ...prev,
        nombre: session.nombre || prev.nombre,
        email: session.email || prev.email
      }));
    }
  }, []);


  // Funciones para manejo de idiomas
  const getCurrentLang = () => {
    const found = languages.find(l => l.code === i18nHook.language);
    return found || languages[0];
  };

  const changeLanguage = (lng: string) => {
    // Cambiamos idioma vía i18next; el hook de react-i18next re-renderiza el componente
    i18n.changeLanguage(lng);
    if (typeof window !== 'undefined') {
      localStorage.setItem('virtualaid_lang', lng);
    }
    setShowLangMenu(false);
  };

  // Al montar, restaurar idioma guardado
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = localStorage.getItem('virtualaid_lang');
      if (savedLang && savedLang !== i18n.language) {
        i18n.changeLanguage(savedLang);
      }
    }
  }, []);

  // Cerrar menú de idiomas al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showLangMenu && !(event.target as Element).closest('.relative')) {
        setShowLangMenu(false);
      }
    };

    if (showLangMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showLangMenu]);

  // Limpiar overflow cuando el componente se desmonte
  useEffect(() => {
    return () => {
      // Restaurar scroll del body al desmontar el componente
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Estado para modal de edición de perfil
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState({
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    avatar: usuario.avatar,
    email: usuario.email,
  telefono: usuario.telefono || '',
  dni: usuario.dni || '',
  pais: usuario.pais || ''
  });
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [mensajePerfil, setMensajePerfil] = useState("");
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);

  // Cerrar sesión (usuario)
  const handleLogout = useCallback(async () => {
    try {
      if (typeof window !== 'undefined') {
        // Limpiar sesión y token
        localStorage.removeItem('session');
        localStorage.removeItem('token');
        // Limpiar avatar cacheado del usuario (si aplica)
        if (usuario?.email) {
          localStorage.removeItem(`virtualaid_avatar_usuario_${usuario.email}`);
        }
      }
    } finally {
      // Redirigir a login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
  }, [usuario?.email]);
  // const [hoverUpload, setHoverUpload] = useState(false);
  // Cambiar contraseña
  const [mostrarPwd, setMostrarPwd] = useState(false);
  const [pwdActual, setPwdActual] = useState('');
  const [pwdNueva, setPwdNueva] = useState('');
  const [pwdConfirm, setPwdConfirm] = useState('');
  const [cambiandoPwd, setCambiandoPwd] = useState(false);
  const [msgPwd, setMsgPwd] = useState<string | null>(null);

  // Manejar tecla Escape para cerrar el modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mostrarEditarPerfil) {
        cerrarEditarPerfil();
      }
    };

    if (mostrarEditarPerfil) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => document.removeEventListener('keydown', handleEscapeKey);
    }
  }, [mostrarEditarPerfil]);

  // Abrir modal y sincronizar datos
  const abrirEditarPerfil = () => {
    setFormPerfil({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      avatar: usuario.avatar,
      email: usuario.email,
      telefono: usuario.telefono || '',
      dni: usuario.dni || '',
      pais: usuario.pais || ''
    });
    setMensajePerfil("");
    setMostrarEditarPerfil(true);
    // Bloquear scroll del body
    document.body.style.overflow = 'hidden';
  };
  const cerrarEditarPerfil = () => {
    setMostrarEditarPerfil(false);
    setMensajePerfil("");
  // reset pwd state al cerrar
  setMostrarPwd(false);
  setPwdActual('');
  setPwdNueva('');
  setPwdConfirm('');
  setMsgPwd(null);
  // Restaurar scroll del body
  document.body.style.overflow = 'unset';
  };
  // Guardar perfil en backend
  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoPerfil(true);
    setMensajePerfil("");
    try {
      await (async () => {
        if (!usuario.email) throw new Error('No hay email en sesión');
        await fetch(`/api/usuario/${encodeURIComponent(usuario.email)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: formPerfil.nombre,
            apellido: formPerfil.apellido,
            telefono: formPerfil.telefono,
            dni: formPerfil.dni,
            pais: formPerfil.pais
          }),
        });
      })();
      setUsuario({ ...usuario, ...formPerfil });
      setMensajePerfil("¡Perfil actualizado correctamente!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al actualizar';
      setMensajePerfil(msg);
    } finally {
      setCargandoPerfil(false);
      setTimeout(() => { setMostrarEditarPerfil(false); setMensajePerfil(""); }, 1200);
    }
  };

  const [busqueda, setBusqueda] = useState("");
  const [especialidadFiltro, setEspecialidadFiltro] = useState("");
  const [ordenamiento, setOrdenamiento] = useState<'nombre' | 'especialidad' | 'disponibilidad'>('nombre');
  const [especialistaSeleccionado, setEspecialistaSeleccionado] = useState<MedicoResumen | null>(null);
  const [mostrarPerfilEspecialista, setMostrarPerfilEspecialista] = useState(false);
  // Horarios reales para el modal de perfil
  const [horariosPerfil, setHorariosPerfil] = useState<Horario[]>([]);
  const [cargandoHorariosPerfil, setCargandoHorariosPerfil] = useState(false);
  const [errorHorariosPerfil, setErrorHorariosPerfil] = useState<string | null>(null);
  const [especialistas, setEspecialistas] = useState<MedicoResumen[]>(especialistasEjemplo);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(""); // email del médico seleccionado
  const [creandoCita, setCreandoCita] = useState(false);
  // Ref a la sección "Solicitar Nueva Cita" para hacer scroll al ir a agendar
  const solicitarCitaRef = useRef<HTMLDivElement | null>(null);
  // Navegar a inicio > solicitar cita y precargar médico + abrir calendario
  const irASolicitarCita = (email?: string) => {
    if (email) setMedicoSeleccionado(email);
    setVista('inicio');
    setMostrarCalendario(true);
    // Desplazar suavemente a la sección tras el re-render
    setTimeout(() => {
      solicitarCitaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };
  // Cargar horarios reales al abrir el modal de perfil del especialista
  useEffect(() => {
    const cargar = async () => {
      if (!mostrarPerfilEspecialista || !especialistaSeleccionado?.email) {
        setHorariosPerfil([]);
        setErrorHorariosPerfil(null);
        return;
      }
      try {
        setCargandoHorariosPerfil(true);
        setErrorHorariosPerfil(null);
        const hs = await getHorarios(especialistaSeleccionado.email);
        setHorariosPerfil(Array.isArray(hs) ? hs : []);
      } catch {
        setHorariosPerfil([]);
        setErrorHorariosPerfil('No se pudieron cargar los horarios.');
      } finally {
        setCargandoHorariosPerfil(false);
      }
    };
    cargar();
  }, [mostrarPerfilEspecialista, especialistaSeleccionado?.email]);

  // Billing state
  const [billingProfile, setBillingProfile] = useState<BillingProfile | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [addressForm, setAddressForm] = useState<Address>({
    id: 0,
    line1: '',
    line2: '',
    city: '',
    region: '',
    postal_code: '',
    country: 'ES',
    is_billing: true,
  });
  const [pmList, setPmList] = useState<PaymentMethod[]>([]);
  const [pmFormOpen, setPmFormOpen] = useState(false);
  const [pmForm, setPmForm] = useState<{ provider: string; token?: string; brand?: string; last4?: string; exp_month?: number; exp_year?: number; is_default?: boolean }>({ provider: 'manual' });
  const [pmLoading, setPmLoading] = useState(false);
  const [invoices] = useState<BillingInvoice[]>([]);
  const [pmEditForm, setPmEditForm] = useState<{ brand?: string | null; last4?: string | null; exp_month?: number | null; exp_year?: number | null; token?: string | null; status?: string; is_default?: boolean }>({});
  const [pmEditingId, setPmEditingId] = useState<number | null>(null);
  // Orden pagos
  const [pagosSort, setPagosSort] = useState<{ key: 'fecha' | 'medico' | 'monto' | 'estado'; dir: 'asc' | 'desc' }>({ key: 'fecha', dir: 'asc' });
  const fmtMonto = (m: unknown) => {
    const n = typeof m === 'number' ? m : parseFloat(typeof m === 'string' ? m : '0');
    return isNaN(n) ? '0.00' : n.toFixed(2);
  };
  const pagosOrdenados = (() => {
    const copia = [...pagos];
    const factor = pagosSort.dir === 'asc' ? 1 : -1;
    return copia.sort((a,b) => {
      const k = pagosSort.key;
      if (k === 'monto') {
        const am = typeof a.monto === 'number' ? a.monto : parseFloat(String(a.monto));
        const bm = typeof b.monto === 'number' ? b.monto : parseFloat(String(b.monto));
        return ((isNaN(am) ? 0 : am) - (isNaN(bm) ? 0 : bm)) * factor;
      }
      if (k === 'fecha') {
        const da = a.fechaRaw ? Date.parse(a.fechaRaw) : 0;
        const db = b.fechaRaw ? Date.parse(b.fechaRaw) : 0;
        return (da - db) * factor;
      }
      const va: string = k === 'medico' ? a.medico : a.estado;
      const vb: string = k === 'medico' ? b.medico : b.estado;
      return va.localeCompare(vb) * factor;
    });
  })();
  const toggleSort = (key: 'fecha' | 'medico' | 'monto' | 'estado') => {
    setPagosSort(prev => prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  // ESTADO DE CARGA PARA CITAS
  const [loadingCitas, setLoadingCitas] = useState(true);

  // Estados y utilidades faltantes para la UI de citas
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  // Horarios del médico seleccionado
  const [horariosMedico, setHorariosMedico] = useState<Horario[]>([]);
  const [horasDisponibles, setHorasDisponibles] = useState<string[]>([]);
  const [citasMedico, setCitasMedico] = useState<TCita[]>([]);
  // Genera slots de 60 min (o 30 min si se ajusta) entre hora_inicio y hora_fin
  function generarSlots(horaInicio: string, horaFin: string, stepMin = 60): string[] {
    const [hI, mI] = horaInicio.split(':').map(Number);
    const [hF, mF] = horaFin.split(':').map(Number);
    const inicio = new Date(2000,0,1,hI,mI,0,0);
    const fin = new Date(2000,0,1,hF,mF,0,0);
    const slots: string[] = [];
    for (let d = new Date(inicio); d < fin; d.setMinutes(d.getMinutes()+stepMin)) {
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      slots.push(`${hh}:${mm}`);
    }
    return slots;
  }
  // Al cambiar médico cargar horarios
  useEffect(() => {
    const loadHorarios = async () => {
      if (!medicoSeleccionado) { setHorariosMedico([]); setHorasDisponibles([]); return; }
      try {
        const hs = await getHorarios(medicoSeleccionado);
        // Cargar citas del médico para deshabilitar horas ocupadas
        let cms: TCita[] = [];
        try {
          cms = await getCitasDeMedico(medicoSeleccionado);
        } catch { cms = []; }
        setHorariosMedico(hs);
        setCitasMedico(Array.isArray(cms) ? cms : []);
        // Recalcular horas si ya hay fecha elegida
        if (fecha) recalcularHoras(hs, fecha);
      } catch { setHorariosMedico([]); setHorasDisponibles([]); }
    };
    loadHorarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [medicoSeleccionado]);
  // Al cambiar fecha, recalcular horas
  useEffect(() => {
    if (fecha && horariosMedico.length) {
      recalcularHoras(horariosMedico, fecha);
    } else if (!fecha) {
      setHorasDisponibles([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fecha, horariosMedico]);
  function recalcularHoras(hs: Horario[], day: Date) {
    const diaSemana = day.getDay(); // 0=Domingo
    const coincidencias = hs.filter(h => h.dia_semana === diaSemana);
  const slots = coincidencias.flatMap(h => generarSlots(h.hora_inicio, h.hora_fin));
  // Desduplicar y ordenar de más temprano a más tarde (HH:mm)
  const unicos = Array.from(new Set(slots)).sort((a, b) => a.localeCompare(b));
  setHorasDisponibles(unicos);
    setHoraSeleccionada('');
  }
  // Utilidad para ordenar citas: futuras primero (más próximas -> más lejanas), luego pasadas (más reciente -> más antigua)
  const ordenarCitas = (citas: { fecha: Date; hora: string; medico: string; especialidad?: string }[]) => {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const futuras = citas.filter(c => c.fecha >= inicioHoy);
    const pasadas = citas.filter(c => c.fecha < inicioHoy);
    futuras.sort((a,b) => a.fecha.getTime() - b.fecha.getTime()); // más próxima primero
    pasadas.sort((a,b) => b.fecha.getTime() - a.fecha.getTime()); // la más reciente (menos lejana) primero
    return [...futuras, ...pasadas];
  };
  
  // --- Manejo consistente de fechas/hora (evitar sesgos de zona horaria) ---
  // El backend envía fecha (YYYY-MM-DD) y hora (HH:mm) sin zona. Interpretaremos que representan un día y hora "local" del usuario/servidor
  // y construiremos un Date usando la zona local del navegador SIN aplicar conversiones extra (no usar Date con sólo la fecha, que asume UTC en algunos navegadores).
  // Además generamos una representación ISO local (sin Z) para mostrar y ordenar.
  type FechaHoraParse = { date: Date; isoLocal: string };
  function combinarFechaHoraLocal(fechaStr: string, horaStr?: string | null): FechaHoraParse {
    // fechaStr esperado: YYYY-MM-DDTHH:mm:ss(.SSS)Z ; horaStr: HH:mm(:ss) opcional
    if (!fechaStr) {
      const now = new Date();
      return { date: now, isoLocal: now.toISOString().slice(0,16).replace('T',' ') };
    }
    let fechaIso = fechaStr;
    // Si la hora viene aparte y es válida, reemplazar la hora en el string ISO
    if (horaStr && /^\d{2}:\d{2}(:\d{2})?$/.test(horaStr)) {
      // Extraer solo la parte de fecha y la zona (Z o +...)
      const match = fechaStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(\.\d+)?(Z|[+-]\d{2}:?\d{2})?$/);
      if (match) {
        const [ , ymd, , , zone ] = match;
        // Si horaStr no tiene segundos, añadir :00
        const horaFull = horaStr.length === 5 ? horaStr + ':00' : horaStr;
        fechaIso = `${ymd}T${horaFull}${zone || 'Z'}`;
      }
    }
    const dt = new Date(fechaIso);
    const isoLocal = fechaIso.replace('T', ' ');
    return { date: dt, isoLocal };
  }
  // Formateadores consistentes (pueden luego centralizarse o internacionalizarse)
  function formatearFechaDisplay(date: Date, locale?: string) {
    try { return date.toLocaleDateString(locale || undefined, { year: 'numeric', month: '2-digit', day: '2-digit' }); } catch { return ''; }
  }

  // Estado local de recordatorios activados (por id de cita)
  const [recordatoriosActivos, setRecordatoriosActivos] = useState<Set<string>>(new Set());
  const isRecordatorioOn = (c: { id?: number|string; fecha: Date; hora: string; medico: string }) => {
    const key = c.id != null ? String(c.id) : `${c.medico}|${c.fecha.toDateString()}|${c.hora}`;
    return recordatoriosActivos.has(key);
  };
  const toggleRecordatorio = async (c: { id?: number|string; fecha: Date; hora: string; medico: string }) => {
    const key = c.id != null ? String(c.id) : `${c.medico}|${c.fecha.toDateString()}|${c.hora}`;
    const enable = !recordatoriosActivos.has(key);
    // Simulación: asumimos éxito inmediato sin llamar al backend
    setRecordatoriosActivos(prev => {
      const next = new Set(prev);
      if (enable) next.add(key); else next.delete(key);
      return next;
    });
    addToast(enable ? (t('email_reminder_enabled') as string || 'Se te recordará por correo electrónico.') : (t('email_reminder_disabled') as string || 'La notificación por correo está desactivada.'), 'success');
  };
  const filtrarEspecialistas = especialistas.filter((m) => {
    const q = busqueda.trim().toLowerCase();
    const especialidadMatch = !especialidadFiltro || (m.especialidad && m.especialidad.toLowerCase() === especialidadFiltro.toLowerCase());
    
    if (!q && !especialidadFiltro) return true;
    if (!q) return especialidadMatch;
    if (!especialidadFiltro) {
      return (
        (m.nombre && m.nombre.toLowerCase().includes(q)) ||
        (m.apellido && m.apellido.toLowerCase().includes(q)) ||
        (m.especialidad && m.especialidad.toLowerCase().includes(q)) ||
        (m.email && m.email.toLowerCase().includes(q))
      );
    }
    
    return especialidadMatch && (
      (m.nombre && m.nombre.toLowerCase().includes(q)) ||
      (m.apellido && m.apellido.toLowerCase().includes(q)) ||
      (m.especialidad && m.especialidad.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q))
    );
  }).sort((a, b) => {
    switch (ordenamiento) {
      case 'nombre':
        return (a.nombre || '').localeCompare(b.nombre || '');
      case 'especialidad':
        return (a.especialidad || '').localeCompare(b.especialidad || '');
      case 'disponibilidad':
        return (b.disponible ? 1 : 0) - (a.disponible ? 1 : 0);
      default:
        return 0;
    }
  });

  // Obtener especialidades únicas para el filtro
  const especialidadesUnicas = Array.from(new Set(especialistas.map(m => m.especialidad).filter(Boolean)));

  // Listado para el dashboard (sin afectar por filtros de búsqueda de la vista de especialistas)
  // Orden: disponibles primero, luego por nombre
  const especialistasInicio = [...especialistas].sort((a, b) => {
    const ad = a.disponible ? 1 : 0;
    const bd = b.disponible ? 1 : 0;
    if (bd - ad !== 0) return bd - ad;
    return (a.nombre || '').localeCompare(b.nombre || '');
  });
  const solicitarCita = () => {
    if (!medicoSeleccionado || !fecha || !horaSeleccionada) {
      addToast('Selecciona médico, fecha y hora', 'error');
      return;
    }
    setMostrarConfirmacion(true);
  };
  const cancelarConfirmacion = () => setMostrarConfirmacion(false);
  const confirmarCita = async () => {
    try {
      setCreandoCita(true);
      if (!usuario.email || !medicoSeleccionado || !fecha || !horaSeleccionada) {
        throw new Error('Faltan datos para crear la cita');
      }
      // Formatear fecha a YYYY-MM-DD
      const yyyy = fecha.getFullYear();
      const mm = String(fecha.getMonth() + 1).padStart(2, '0');
      const dd = String(fecha.getDate()).padStart(2, '0');
      const payload = {
        medico_id: medicoSeleccionado,
        usuario_id: usuario.email,
        fecha: `${yyyy}-${mm}-${dd}`,
        hora: horaSeleccionada,
      };
      await crearCita(payload);
      // Refrescar citas y pagos desde el backend
      const [citas, pagosUsuario] = await Promise.all([
        getCitasDeUsuario(usuario.email),
        getPagosDeUsuario(usuario.email),
      ]);
      const map = new Map<string, { nombre: string; apellido?: string; especialidad?: string }>();
      especialistas.forEach((m) => { if (m.email) map.set(m.email, { nombre: m.nombre, apellido: m.apellido, especialidad: m.especialidad }); });
  const citasFmtRaw = citas.map((c: TCita) => {
        const m = map.get(c.medico_id);
        const nombreMedico = m ? `${m.nombre}${m.apellido ? ' ' + m.apellido : ''}` : c.medico_id;
      const { date } = combinarFechaHoraLocal(c.fecha, c.hora);
          return { id: c.id, fecha: date, hora: c.hora, medico: nombreMedico, especialidad: m?.especialidad, tokenSala: c.tokenSala, idRoom: c.idRoom, token: c.token };
      });
  setCitasAgendadas(ordenarCitas(citasFmtRaw));
    setPagos(pagosUsuario.map(({ pago, cita }: { pago: { id: number; fecha_pago?: string | null; monto: number; estado: string; tokenSala?: string; idRoom?: string }; cita: TCita | null }) => {
        const baseFecha = cita?.fecha || pago.fecha_pago || '';
        const baseHora = cita?.hora || null;
        const parsed = combinarFechaHoraLocal(baseFecha, baseHora);
        return {
          id: pago.id,
          fecha: baseFecha ? formatearFechaDisplay(parsed.date) : '',
          fechaRaw: parsed.isoLocal,
          medico: (() => {
            if (!cita) return '-';
            const m = map.get(cita.medico_id);
            return m ? `${m.nombre}${m.apellido ? ' ' + m.apellido : ''}` : cita.medico_id;
          })(),
          especialidad: cita ? map.get(cita.medico_id)?.especialidad : undefined,
          monto: Number(pago.monto) || 0,
          estado: pago.estado,
          tokenSala: pago.tokenSala,
          idRoom: pago.idRoom,
    };
  }));      
      // Reset selección
      setHoraSeleccionada('');
      setFecha(null);
      setMostrarCalendario(false);
      addToast('Cita creada', 'success');
    } catch (e) {
      addToast(e instanceof Error ? e.message : 'Error al crear cita', 'error');
    } finally {
      setCreandoCita(false);
      setMostrarConfirmacion(false);
    }
  };

  const onAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!usuario.email) return;
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setSubiendoAvatar(true);
      const form = new FormData();
      form.append('archivo', file);
      // Nuevo backend: guardamos en el front
      form.append('tipo', 'usuario');
      form.append('id', usuario.email);
      const res = await fetch(`/api/perfil/upload`, { method: 'POST', body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Error al subir imagen');
      const url: string | undefined = data?.url;
      if (url) {
        setUsuario(prev => ({ ...prev, avatar: url }));
        setFormPerfil(prev => ({ ...prev, avatar: url }));
  // Persistir en backend (campo avatar únicamente)
  try { await updateUsuarioAvatar(usuario.email, url); } catch (e) { console.warn('No se pudo persistir avatar en backend:', e); }
        // Persistir avatar local para futuras sesiones
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`virtualaid_avatar_usuario_${usuario.email}`, url);
          }
        } catch {}
        addToast('Foto actualizada', 'success');
      }
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Error al subir imagen', 'error');
    } finally {
      setSubiendoAvatar(false);
      e.currentTarget.value = '';
    }
  };

  // Evitar error de hidratación SSR/CSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Los hooks siempre se llaman, pero solo se usan si mounted
  const isTabletOrMobileValue = useMediaQuery({ query: '(max-width: 1024px)' });
  const isMobileValue = useMediaQuery({ query: '(max-width: 700px)' });
  const isTabletOrMobile = mounted ? isTabletOrMobileValue : false;
  const isMobile = mounted ? isMobileValue : false;
  // Cargas iniciales desde backend
  const [loadingEspecialistas, setLoadingEspecialistas] = useState(true);
  const [loadingPagos, setLoadingPagos] = useState(true);
  // Cargar PayPal SDK en cliente
const loadPaypalSdk = useCallback(() => {
  if (typeof window === 'undefined') return;
  if (!paypalClientId) return;
  setPaypalLoadFailed(false);
  let cancelled = false;
  const mark = (ok: boolean, failed = false) => {
    if (!cancelled) {
      setPaypalReady(ok);
      setPaypalLoadFailed(failed);
    }
  };
  const ensureLoaded = () => {
    const w = window as unknown as { paypal?: unknown };
    if (w.paypal) { mark(true, false); return true; }
    return false;
  };
  if (ensureLoaded()) return;

  // Eliminar script previo si existe
  const old = document.querySelector('script[data-paypal-sdk="1"]');
  if (old) old.remove();

  const s = document.createElement('script');
  s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=${encodeURIComponent(paypalCurrency)}&intent=capture&components=buttons,funding-eligibility&locale=${encodeURIComponent(paypalLocale)}&enable-funding=card,paypal&disable-funding=${encodeURIComponent(paypalDisableFunding)}`;
  s.async = true;
  s.setAttribute('data-paypal-sdk', '1');
  s.onload = () => { if (!ensureLoaded()) mark(false, true); };
  s.onerror = () => mark(false, true);
  document.head.appendChild(s);

  const start = Date.now();
  const interval = setInterval(() => {
    if (ensureLoaded()) { clearInterval(interval); }
    else if (Date.now() - start > 12000) { clearInterval(interval); mark(false, true); }
  }, 300);

  return () => { cancelled = true; clearInterval(interval); };
}, [paypalClientId, paypalCurrency, paypalLocale, paypalDisableFunding]);

  useEffect(() => {
    if (paypalMisconfigured) {
      setPaypalReady(false);
      setPaypalLoadFailed(true);
      console.warn('[PayPal] Client ID inválido o placeholder. Edita .env.local (NEXT_PUBLIC_PAYPAL_CLIENT_ID) y reinicia el servidor.');
      return;
    }
    if (paypalClientId) loadPaypalSdk();
  }, [paypalClientId, paypalMisconfigured, loadPaypalSdk]);

  // Refrescar pagos tras capturar
  const refreshPagos = useCallback(async () => {
    if (!usuario.email) return;
    try {
      setLoadingPagos(true);
      const pagosUsuario = await getPagosDeUsuario(usuario.email);
      const map = new Map<string, { nombre: string; apellido?: string; especialidad?: string }>();
      especialistas.forEach((m) => { if (m.email) map.set(m.email, { nombre: m.nombre, apellido: m.apellido, especialidad: m.especialidad }); });
    setPagos(pagosUsuario.map(({ pago, cita }: { pago: { id: number; fecha_pago?: string | null; monto: number; estado: string; tokenSala?: string; idRoom?: string }; cita: TCita | null }) => {
        const iso = cita?.fecha || pago.fecha_pago || '';
        return {
          id: pago.id,
          fecha: iso ? new Date(iso).toLocaleDateString() : '',
          fechaRaw: iso,
          medico: (() => {
            if (!cita) return '-';
            const m = map.get(cita.medico_id);
            return m ? `${m.nombre}${m.apellido ? ' ' + m.apellido : ''}` : cita.medico_id;
          })(),
          especialidad: cita ? map.get(cita.medico_id)?.especialidad : undefined,
          monto: Number(pago.monto) || 0,
          estado: pago.estado,
          tokenSala: pago.tokenSala,
          idRoom: pago.idRoom,
        };
      }));
    } finally {
      setLoadingPagos(false);
    }
  }, [usuario.email, especialistas]);

  // Botón de PayPal por fila
  type PayPalButtonsOptions = {
    style?: {
      layout?: 'vertical' | 'horizontal';
      color?: 'gold' | 'blue' | 'silver' | 'black' | 'white';
      shape?: 'rect' | 'pill';
      label?: 'paypal' | 'checkout' | 'buynow' | 'pay';
      tagline?: boolean;
    };
    createOrder: () => Promise<string> | string;
    onApprove: (data: { orderID: string }) => Promise<void> | void;
    onError?: (err: unknown) => void;
    onCancel?: () => void;
  };
  type PayPalSDK = {
    Buttons: (opts: PayPalButtonsOptions) => { render: (el: HTMLElement | string) => Promise<void> | void; close: () => void };
  };
  const PayPalButtonsCell: React.FC<{ pagoId: number }> = ({ pagoId }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [creating, setCreating] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!paypalClientId) return;
    if (!paypalReady) return;
    const w = window as unknown as { paypal?: PayPalSDK };
    if (!w.paypal || !containerRef.current) return;

    // Limpiar contenedor antes de re-renderizar
    containerRef.current.innerHTML = '';

    const buttons = w.paypal.Buttons({
      style: {
        layout: "vertical", // vertical u horizontal
        color: "blue",      // gold | blue | silver | black | white
        shape: "pill",      // rect | pill
        label: "checkout",  // paypal | checkout | buynow | pay
        tagline: false      // quita "Powered by PayPal"
      },
      createOrder: async () => {
        try {
          setLastError(null);
          setCreating(true);
          const { orderID } = await paypalCreateOrder(pagoId, undefined);
          return orderID;
        } catch (e) {
          const msg = e instanceof Error ? e.message : 'Error creando orden';
          setLastError(msg);
          throw e;
        } finally {
          setCreating(false);
        }
      },
      onApprove: async (data: { orderID: string }) => {
        setCapturing(true);
        try {
          // Pasamos tambien el pagoId (prop del componente) para correlacion en backend
          const cap = await paypalCaptureOrder(data.orderID, pagoId);
          console.log('Capture result:', cap);
          if (cap?.status && cap.status.toLowerCase() === 'completed') {
            addToast('Pago completado', 'success');
            await refreshPagos();
            if (cap.tokenSala) {
              try {
                const url = new URL(window.location.origin + '/reunion');
                url.searchParams.set('room', cap.tokenSala);
                window.open(url.toString(), '_blank');
              } catch {}
            }
          } else {
            addToast('Pago no completado', 'error');
          }
        } catch (e: unknown) {
          const err = e as { status?: number; message?: string };
          if (err?.status === 403) addToast('Este pago no pertenece a tu cuenta.', 'error');
          else if (err?.status === 409) { addToast('El pago ya fue procesado.', 'info'); await refreshPagos(); }
          else addToast(err?.message || 'Error al capturar el pago', 'error');
          setLastError(err?.message || 'Error al capturar');
        } finally {
          setCapturing(false);
        }
      },
      onError: (err: unknown) => {
        console.error('PayPal error:', err);
        addToast('Error de PayPal', 'error');
      },
      onCancel: () => {
        addToast('Pago cancelado', 'info');
      }
    });

  buttons.render(containerRef.current);

    return () => {
      try { buttons.close(); } catch {}
    };
  }, [pagoId]);

  if (paypalMisconfigured) {
    return (
      <div className="text-[11px] leading-tight text-red-600 bg-red-50 border border-red-200 p-2 rounded-md max-w-[180px]">
        <strong>{t('paypal_configure_title')}</strong><br />{t('paypal_configure_id')}
      </div>
    );
  }

  if (!paypalClientId) {
    return (
      <button className="bg-gray-200 text-gray-600 font-medium py-2 px-3 rounded-lg cursor-not-allowed" title={t('paypal_configure_id')}>
        {t('pay_now')}
      </button>
    );
  }

  if (paypalLoadFailed) {
    return (
      <button
        type="button"
        onClick={() => loadPaypalSdk()}
        className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-2 rounded-lg hover:bg-red-200"
      >
        {t('paypal_retry')}
      </button>
    );
  }

  if (!paypalReady) {
    return (
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent animate-spin rounded-full"></div>
        {t('paypal_loading')}
      </div>
    );
  }
  return (
    <div>
      <div ref={containerRef}></div>
      {/* Estado y errores visibles para el usuario */}
      <div className="mt-2 text-xs text-gray-600 flex items-center gap-3">
        {creating && <span className="inline-flex items-center gap-2 text-sm text-blue-600"><svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581" /></svg> {t('creating_order') || 'Creando orden...'}</span>}
        {capturing && <span className="inline-flex items-center gap-2 text-sm text-green-600"><svg className="animate-spin w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581" /></svg> {t('processing_payment') || 'Procesando pago...'}</span>}
        {lastError && <span className="text-xs text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded">{lastError}</span>}
      </div>
    </div>
  );
};
  // Modal genérico para opciones de pago
  const [pagoSeleccionado, setPagoSeleccionado] = useState<number | null>(null);
  const [mostrarModalPago, setMostrarModalPago] = useState(false);
  // Pestaña activa en el modal de pago: 'paypal' | 'card'
  const [modalPaymentTab] = useState<'paypal' | 'card'>('paypal');
  const abrirModalPago = (pagoId: number) => { setPagoSeleccionado(pagoId); setMostrarModalPago(true); document.body.style.overflow='hidden'; };
  const cerrarModalPago = () => { setMostrarModalPago(false); setPagoSeleccionado(null); document.body.style.overflow='unset'; };
  useEffect(() => {
      // Solo ejecutar si hay email de usuario
      if (!usuario.email) return;
      const load = async () => {
        try {
          // 1) Especialistas y mapa por email
          setLoadingEspecialistas(true);
          let meds: MedicoResumen[] = [];
          try {
            meds = await getEspecialistas();
            setEspecialistas(meds);
          } catch {
            setEspecialistas([]);
          } finally {
            setLoadingEspecialistas(false);
          }
          const map = new Map<string, { nombre: string; apellido?: string; especialidad?: string }>();
          meds.forEach((m) => { if (m.email) map.set(m.email, { nombre: m.nombre, apellido: m.apellido, especialidad: m.especialidad }); });

          // 2) Perfil + 3) Citas + 4) Pagos
          console.log('Cargando perfil de usuario:', usuario.email);
          type PerfilResp = { nombre?: string; apellido?: string; email: string; tlf?: string; dni?: string; avatar?: string; pais?: string };
          const u = await getUsuarioPerfil(usuario.email) as unknown as PerfilResp;
          // Resolver avatar priorizando el guardado local en /perfiles/ si existe
          let avatar: string | undefined = undefined;
          try {
            const key = `virtualaid_avatar_usuario_${u.email}`;
            const local = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
            if (local && local.startsWith('/perfiles/')) {
              avatar = local;
            } else if (u.avatar) {
              const raw: string = u.avatar as string;
              if (raw?.startsWith('/perfiles/')) {
                avatar = raw;
              } else if (raw?.startsWith('/storage/') || raw?.startsWith('http')) {
                avatar = raw;
              } else if (raw) {
                avatar = `/storage/${raw}`;
              }
            } else if (usuario.avatar && usuario.avatar.startsWith('/perfiles/')) {
              avatar = usuario.avatar;
            } else {
              avatar = usuario.avatar || undefined;
            }
          } catch {
            avatar = usuario.avatar || undefined;
          }
          console.log('Final avatar URL:', avatar);
          setUsuario((prev) => ({
            ...prev,
            nombre: u.nombre || prev.nombre,
            apellido: u.apellido || prev.apellido,
            email: u.email,
            avatar: avatar || prev.avatar,
            telefono: u.tlf || prev.telefono,
            dni: u.dni || prev.dni,
            pais: u.pais || prev.pais
          }));
          setFormPerfil((prev) => ({
            ...prev,
            nombre: u.nombre || prev.nombre,
            apellido: u.apellido || prev.apellido,
            email: u.email,
            avatar: avatar || prev.avatar,
            telefono: u.tlf || prev.telefono,
            dni: u.dni || prev.dni
          }));

          setLoadingCitas(true);
          console.log('Cargando citas para el usuario:', usuario.email);
          const citas = await getCitasDeUsuario(usuario.email);
          const citasFmt = citas.map((c: TCita) => {
            const m = map.get(c.medico_id);
            const nombreMedico = m ? `${m.nombre}${m.apellido ? ' ' + m.apellido : ''}` : c.medico_id;
            const { date } = combinarFechaHoraLocal(c.fecha, c.hora);
            return { id: c.id, fecha: date, hora: c.hora, medico: nombreMedico, especialidad: m?.especialidad, tokenSala: c.tokenSala, idRoom: c.idRoom, token: c.token };
          });
          setCitasAgendadas(ordenarCitas(citasFmt));
          setLoadingCitas(false);

          setLoadingPagos(true);
          const pagosUsuario = await getPagosDeUsuario(usuario.email);
      setPagos(pagosUsuario.map(({ pago, cita }: { pago: { id: number; fecha_pago?: string | null; monto: number; estado: string; tokenSala?: string; idRoom?: string }; cita: TCita | null }) => {
            const baseFecha = cita?.fecha || pago.fecha_pago || '';
            const baseHora = cita?.hora || null;
            const parsed = combinarFechaHoraLocal(baseFecha, baseHora);
            return {
              id: pago.id,
              fecha: baseFecha ? formatearFechaDisplay(parsed.date) : '',
              fechaRaw: parsed.isoLocal,
              medico: (() => {
                if (!cita) return '-';
                const m = map.get(cita.medico_id);
                return m ? `${m.nombre}${m.apellido ? ' ' + m.apellido : ''}` : cita.medico_id;
              })(),
              especialidad: cita ? map.get(cita.medico_id)?.especialidad : undefined,
              monto: Number(pago.monto) || 0,
              estado: pago.estado,
              tokenSala: pago.tokenSala,
              idRoom: pago.idRoom,
            };
          })); 
          setLoadingPagos(false);

          // 5) Reuniones (citas pasadas asistidas)
          try {
            const r = await fetchJSON<Array<{ id: number|string; medico_id: string; fecha: string; hora: string; archivo?: string|null }>>(`/api/usuario/${encodeURIComponent(usuario.email)}/reuniones`);
            const mapped = r.map(item => {
              const m = map.get(item.medico_id);
              return {
                id: item.id,
                fecha: item.fecha,
                hora: item.hora,
                medico: m ? `${m.nombre}${m.apellido ? ' ' + m.apellido : ''}` : item.medico_id,
                especialidad: m?.especialidad,
                archivo: item.archivo || null,
              };
            });
            setReuniones(mapped);
          } catch {
            setReuniones([]);
          }

        } catch {
          // Silencio errores iniciales
        }
      };
      load();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [usuario.email]);

  // Pantalla de carga global: hasta que todos los bloques hayan cargado (o no sean necesarios)
  const globalLoading = !usuario.email || loadingEspecialistas || loadingPagos || loadingCitas;
  if (globalLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center relative"
        style={{
          background: `linear-gradient(120deg, #60a5fa85 0%, #bbf7d098 100%), url('/imagenes/fondo_usuario.jpg') center center / cover no-repeat`
        }}
      >
        <div className="flex flex-col items-center gap-4 bg-white/70 rounded-2xl px-10 py-12 shadow-2xl border border-blue-200">
          <div className="h-14 w-14 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
          <h1 className="text-xl font-bold text-blue-700">{t('loading_dashboard')}</h1>
          <p className="text-sm text-gray-600 text-center max-w-xs">{t('loading_dashboard_desc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center relative"
      style={{
        background: `
          linear-gradient(120deg, #60a5fa85 0%, #bbf7d098 100%),
          url('/imagenes/fondo_usuario.jpg') center center / cover no-repeat
        `
      }}
    >
      <div className="w-full max-w-6xl px-2 md:px-6 py-5">
        <div className="flex items-center justify-between h-16 bg-white/70 rounded-t-xl shadow-sm px-4">
        <div className="flex flex-row items-center">
          <div className="flex items-center justify-center ml-2">
            {/* Uso de componente reutilizable para evitar warnings de aspecto */}
            <HeaderLogo variant="horizontal" className="object-contain w-[150px] h-auto" />
          </div>
        </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 ml-2">
              {/* Selector de idiomas */}
              <div className="relative">
                <button
                  className="bg-white/90 hover:bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg shadow-sm transition text-xs font-medium flex items-center gap-2 cursor-pointer"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                >
                  <span className="text-lg">{getCurrentLang().flag}</span>
                  <span className="hidden sm:inline">{getCurrentLang().label}</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showLangMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
                    <div className="py-1">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 flex items-center gap-3 cursor-pointer ${
                            getCurrentLang().code === lang.code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                        >
                          <span className="text-lg">{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg shadow transition text-xs flex items-center gap-2 cursor-pointer min-w-0"
                onClick={abrirEditarPerfil}
              >
                <Image 
                  src={usuario.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"} 
                  alt="avatar usuario" 
                  className="flex-shrink-0 w-6 h-6 rounded-full border-2 border-white bg-white" 
                  width={24} 
                  height={24}
                  onError={(e) => {
                    console.error('Error cargando imagen:', usuario.avatar);
                    const target = e.target as HTMLImageElement;
                    target.src = "https://randomuser.me/api/portraits/lego/1.jpg";
                  }}
                />
                <span className="inline-block truncate max-w-[90px] sm:max-w-[160px]">
                  {t('profile')}
                </span>
              </button>
              <button
                type="button"
                className="bg-gradient-to-r from-red-400 to-pink-500 hover:from-red-500 hover:to-pink-600 text-white font-semibold px-3 sm:px-4 py-2 rounded-lg shadow transition text-xs inline-flex items-center justify-center cursor-pointer"
                onClick={handleLogout}
                aria-label={t('sign_out')}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 5v14" />
                  <path d="M14 12h6" />
                  <path d="M17 9l3 3-3 3" />
                </svg>
                <span className="sr-only">{t('sign_out')}</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Modal de confirmación de cita */}
        {mostrarConfirmacion && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]">
          <div className="bg-white rounded-xl p-8 shadow-xl min-w-[320px] max-w-[400px] text-gray-900 overflow-x-hidden">
            <h2 className="mb-4 text-center text-lg font-bold">{t('confirm_appointment')}</h2>
            <div className="mb-3 text-sm">
              <strong>{t('doctor')}:</strong> {(() => { const med = especialistas.find(m => m.email === medicoSeleccionado); return med ? med.nombre : medicoSeleccionado; })()}<br/>
              <strong>{t('specialty')}:</strong> {(() => { const med = especialistas.find(m => m.email === medicoSeleccionado); return med?.especialidad; })()}<br/>
              <strong>{t('date')}:</strong> {fecha instanceof Date ? fecha.toLocaleDateString() : ""}<br/>
              <strong>{t('time')}:</strong> {horaSeleccionada}
            </div>
            <div className="flex justify-center gap-4">
              <button
                className={`bg-green-700 hover:bg-green-800 text-white rounded-md px-6 py-2 font-semibold transition ${creandoCita ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                onClick={confirmarCita}
                disabled={creandoCita}
              >
                {creandoCita ? t('creating') + '...' : t('confirm')}
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md px-6 py-2 font-semibold transition cursor-pointer"
                onClick={cancelarConfirmacion}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
        
      {/* Modal de edición de perfil */}
      {mostrarEditarPerfil && (
        <div 
          className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[9999] p-2 sm:p-4"
          onClick={cerrarEditarPerfil}
        >
          <div 
            className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-[95vw] sm:max-w-4xl max-h-[98vh] sm:max-h-[95vh] mx-auto relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cerrar dentro del modal */}
            <button 
              className="absolute top-3 right-3 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full text-white transition-all duration-200 hover:scale-110 z-50 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                cerrarEditarPerfil();
              }}
              aria-label={t('close_modal')}
              type="button"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Header del modal con diseño mejorado */}
            <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-green-600 p-4 sm:p-8 overflow-hidden">
              {/* Elementos decorativos */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
              
              <div className="relative z-10">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mb-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white">{t('my_profile')}</h2>
                    <p className="text-sm sm:text-base text-blue-100">Personaliza tu experiencia en VirtualAid</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contenido del modal con layout mejorado */}
            <div className="p-0 max-h-[calc(98vh-120px)] sm:max-h-[calc(95vh-120px)] overflow-y-auto">
              <form onSubmit={guardarPerfil} className="flex flex-col lg:flex-row">
                {/* Columna izquierda - Avatar y acciones rápidas */}
                <div className="w-full lg:w-1/3 bg-gradient-to-b from-gray-50 to-white p-4 sm:p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-100 order-1 lg:order-1 lg:max-h-[calc(98vh-120px)] lg:overflow-y-auto">
                  <div className="space-y-4 sm:space-y-6">
                    {/* Sección de avatar mejorada */}
                    <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                      <div className="relative group">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden border-2 sm:border-3 border-white shadow-lg bg-gradient-to-br from-blue-100 to-green-100 relative">
                          <Image 
                            src={formPerfil.avatar || "https://randomuser.me/api/portraits/lego/1.jpg"} 
                            alt="avatar" 
                            fill
                            className="object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>
                        {/* Indicador de estado online */}
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full"></div>
                        </div>
                      </div>
                      
                      <input 
                        id="avatarUpload" 
                        type="file" 
                        accept="image/png,image/jpeg,image/jpg,image/webp" 
                        className="hidden" 
                        onChange={onAvatarFileChange} 
                        disabled={subiendoAvatar} 
                      />
                      <label
                        htmlFor="avatarUpload"
                        className={`group relative overflow-hidden bg-gradient-to-r from-blue-500 to-green-400 hover:from-blue-600 hover:to-green-500 text-white rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer ${subiendoAvatar ? 'opacity-60 cursor-not-allowed' : 'hover:shadow-md transform hover:scale-105'}`}
                      >
                        <div className="relative z-10 flex items-center space-x-1 sm:space-x-2">
                          {subiendoAvatar ? (
                            <svg className="animate-spin w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                          )}
                          <span className="hidden sm:inline">{subiendoAvatar ? t('uploading') : t('change_photo')}</span>
                          <span className="sm:hidden">{subiendoAvatar ? t('uploading') : t('change')}</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      </label>
                    </div>

                    {/* Stats del usuario */}
                    <div className="bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 shadow-md border border-gray-100">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2 sm:mb-3">{t('stats')}</h3>
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-500 rounded-full"></div>
                            <span className="text-xs sm:text-sm text-gray-600">{t('scheduled_appointments')}</span>
                          </div>
                          <span className="text-sm sm:text-lg font-bold text-gray-900">{citasAgendadas.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
                            <span className="text-xs sm:text-sm text-gray-600">{t('payments_made')}</span>
                          </div>
                          <span className="text-sm sm:text-lg font-bold text-gray-900">{pagos.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-purple-500 rounded-full"></div>
                            <span className="text-xs sm:text-sm text-gray-600">{t('specialists')}</span>
                          </div>
                          <span className="text-sm sm:text-lg font-bold text-gray-900">{especialistas.length}</span>
                        </div>
                      </div>
                    </div>

                    {/* Estadísticas del usuario */}
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('my_activity')}</h3>
                      
                      {/* Contador de citas */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xl sm:text-2xl font-bold text-blue-700">{citasAgendadas.length}</p>
                            <p className="text-xs text-blue-600 font-medium">{t('scheduled_appointments')}</p>
                          </div>
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Estado del perfil */}
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-green-600 font-medium">{t('profile_complete')}</p>
                            <div className="flex items-center mt-1">
                              <div className="flex -space-x-1">
                                {[
                                  usuario.nombre ? 'text-green-500' : 'text-gray-300',
                                  usuario.email ? 'text-green-500' : 'text-gray-300',
                                  usuario.telefono ? 'text-green-500' : 'text-gray-300',
                                  usuario.pais ? 'text-green-500' : 'text-gray-300'
                                ].map((color, idx) => (
                                  <svg key={idx} className={`w-3 h-3 ${color}`} fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-green-700">
                              {[usuario.nombre, usuario.email, usuario.telefono, usuario.pais].filter(Boolean).length}/4
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Información de cuenta */}
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-purple-600 font-medium">{t('member_since')}</p>
                            <p className="text-sm font-semibold text-purple-700">
                              {new Date().getFullYear()}
                            </p>
                          </div>
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500 rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Acciones rápidas */}
                    <div className="space-y-2 sm:space-y-3">
                      <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wide">{t('quick_actions')}</h3>
                      <button
                        type="button"
                        className="w-full flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white hover:bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100 transition-all hover:shadow-md cursor-pointer"
                        onClick={() => setVista('citas')}
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 block">{t('view_my_appointments')}</span>
                          <span className="text-xs text-gray-500">{citasAgendadas.length} {t('appointments_scheduled')}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white hover:bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100 transition-all hover:shadow-md cursor-pointer"
                        onClick={() => setVista('especialistas')}
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 block">{t('search_specialists')}</span>
                          <span className="text-xs text-gray-500">{t('schedule_new_appointment')}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center space-x-2 sm:space-x-3 p-2 sm:p-3 bg-white hover:bg-gray-50 rounded-lg sm:rounded-xl border border-gray-100 transition-all hover:shadow-md cursor-pointer"
                        onClick={() => setVista('pagos')}
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <span className="text-xs sm:text-sm font-medium text-gray-700 block">{t('payment_methods')}</span>
                          <span className="text-xs text-gray-500">{t('manage_payments')}</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Columna derecha - Formulario */}
                <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 order-2 lg:order-2 lg:max-h-[calc(98vh-120px)] lg:overflow-y-auto">
                  <div className="space-y-6 sm:space-y-8">{/* Información personal */}
                    <div className="space-y-4 sm:space-y-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900">{t('personal_information')}</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">{t('first_name')}</label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-gray-400"
                              placeholder={t('your_first_name')}
                              value={formPerfil.nombre}
                              disabled
                              onChange={e => setFormPerfil(f => ({ ...f, nombre: e.target.value }))}
                              required
                            />
                            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">{t('last_name')}</label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-gray-400"
                              placeholder={t('your_last_name')}
                              value={formPerfil.apellido}
                              disabled
                              onChange={e => setFormPerfil(f => ({ ...f, apellido: e.target.value }))}
                              required
                            />
                            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700">{t('email')}</label>
                          <div className="relative">
                            <input
                              type="email"
                              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-gray-400"
                              placeholder={t('your_email')}
                              value={formPerfil.email}
                              onChange={e => setFormPerfil(f => ({ ...f, email: e.target.value }))}
                              required
                              disabled
                            />
                            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">{t('phone_number')}</label>
                          <div className="relative">
                            <input
                              type="tel"
                              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-gray-400"
                              placeholder={t('phone_placeholder')}
                              value={formPerfil.telefono}
                              disabled
                              onChange={e => setFormPerfil(f => ({ ...f, telefono: e.target.value }))}
                            />
                            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-sm font-semibold text-gray-700">{t('dni')}</label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full bg-gray-50 border-0 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all placeholder-gray-400"
                              placeholder={t('dni_placeholder')}
                              value={formPerfil.dni}
                              disabled
                              onChange={e => setFormPerfil(f => ({ ...f, dni: e.target.value }))}
                            />
                            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V4a2 2 0 114 0v2m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="block text-sm font-semibold text-gray-700">{t('country')}</label>
                          <div className="relative">
                            <input
                              type="text"
                              className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder-gray-400"
                              placeholder={t('your_country')}
                              value={formPerfil.pais}
                              onChange={e => setFormPerfil(f => ({ ...f, pais: e.target.value }))}
                            />
                            <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sección de seguridad */}
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">{t('security')}</h3>
                        </div>
                        <button
                          type="button"
                          className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors cursor-pointer"
                          onClick={() => setMostrarPwd(v => !v)}
                        >
                          <span>{t('change_password')}</span>
                          <svg className={`w-4 h-4 transition-transform duration-200 ${mostrarPwd ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {mostrarPwd && (
                        <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-6 space-y-6 border border-blue-100">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2 md:col-span-2">
                              <label className="block text-sm font-semibold text-gray-700">{t('current_password')}</label>
                              <input
                                type="password"
                                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="••••••••"
                                value={pwdActual}
                                onChange={e => setPwdActual(e.target.value)}
                                disabled={cambiandoPwd}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">{t('new_password')}</label>
                              <input
                                type="password"
                                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="Mínimo 6 caracteres"
                                value={pwdNueva}
                                onChange={e => setPwdNueva(e.target.value)}
                                disabled={cambiandoPwd}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="block text-sm font-semibold text-gray-700">{t('confirm_password')}</label>
                              <input
                                type="password"
                                className="w-full bg-white border-2 border-gray-200 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                                placeholder="••••••••"
                                value={pwdConfirm}
                                onChange={e => setPwdConfirm(e.target.value)}
                                disabled={cambiandoPwd}
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl px-6 py-3 font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                            disabled={cambiandoPwd}
                            onClick={async () => {
                              setMsgPwd(null);
                              if (!usuario.email) { setMsgPwd(t('no_email_in_session')); return; }
                              if (!pwdActual || !pwdNueva || !pwdConfirm) { setMsgPwd(t('fill_all_fields')); return; }
                              if (pwdNueva.length < 6) { setMsgPwd(t('password_min_length')); return; }
                              if (pwdNueva !== pwdConfirm) { setMsgPwd(t('password_mismatch')); return; }
                              try {
                                setCambiandoPwd(true);
                                await changeUsuarioPassword(usuario.email, pwdActual, pwdNueva);
                                addToast('Contraseña cambiada', 'success');
                                setMsgPwd('Contraseña cambiada correctamente');
                                setPwdActual(''); setPwdNueva(''); setPwdConfirm('');
                                setMostrarPwd(false);
                              } catch (e: unknown) {
                                const msg = e instanceof Error ? e.message : 'Error al cambiar contraseña';
                                setMsgPwd(msg);
                                addToast(msg, 'error');
                              } finally {
                                setCambiandoPwd(false);
                              }
                            }}
                          >
                            {cambiandoPwd ? (
                              <>
                                <svg className="animate-spin w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                <span>{t('updating_password')}...</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <span>{t('update_password')}</span>
                              </>
                            )}
                          </button>
                          {msgPwd && (
                            <div className={`rounded-xl p-4 flex items-center space-x-3 ${msgPwd.includes('correcta') || msgPwd.toLowerCase().includes('cambiada') ? 'bg-green-50 border-2 border-green-200' : 'bg-red-50 border-2 border-red-200'}`}>
                              {msgPwd.includes('correcta') || msgPwd.toLowerCase().includes('cambiada') ? (
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              <span className={`font-medium ${msgPwd.includes('correcta') || msgPwd.toLowerCase().includes('cambiada') ? 'text-green-700' : 'text-red-700'}`}>{msgPwd}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                      <button
                        type="submit"
                        className="flex-1 min-w-0 bg-gradient-to-r from-blue-600 via-blue-700 to-green-600 hover:from-blue-700 hover:via-blue-800 hover:to-green-700 text-white rounded-xl px-4 sm:px-8 py-3 sm:py-4 font-bold transition-all disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2 sm:space-x-3 shadow-xl hover:shadow-2xl transform hover:scale-[1.02]"
                        disabled={cargandoPerfil}
                      >
                        {cargandoPerfil ? (
                          <>
                            <svg className="animate-spin w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span className="text-base sm:text-lg">{t('saving_changes')}...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-base sm:text-lg">{t('save_changes')}</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl px-4 sm:px-8 py-3 sm:py-4 font-bold transition-all border-2 border-gray-200 hover:border-gray-300 cursor-pointer"
                        onClick={cerrarEditarPerfil}
                        disabled={cargandoPerfil}
                      >
                        {t('cancel')}
                      </button>
                    </div>

                    {mensajePerfil && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4 flex items-center space-x-3">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-green-700 font-semibold text-lg">{mensajePerfil}</span>
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
        
  <div className="bg-white shadow-xl p-4 md:p-8 flex flex-row gap-8 mt-0">
          <div className="hidden md:flex flex-col min-w-[180px] max-w-[220px] pr-2 border-r-0 relative">
            {/* Línea lateral derecha con gradiente */}
            <div className="absolute top-0 right-0 h-full w-0.5 rounded-r-xl bg-gradient-to-b from-blue-600 to-green-500" style={{pointerEvents:'none'}} />
            <div className="font-bold text-blue-700 mb-2">{t('menu')}</div>
            <div className="h-px bg-blue-200 mb-2" />
            <nav className="flex flex-col gap-2">
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'inicio' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('inicio')}>{t('nav_home')}</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'citas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('citas')}>{t('nav_appointments')}</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'especialistas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('especialistas')}>{t('nav_specialists')}</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'Reunion' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('Reunion')}>{t('nav_meetings')}</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'pagos' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('pagos')}>{t('nav_payments')}</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'billing' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('billing')}>{t('nav_billing')}</button>
            </nav>
          </div>
          <div className="flex-1 min-w-0">
            {/* Menú móvil */}
            {mounted && isTabletOrMobile && (
              <div className="md:hidden mb-4">
                <button
                  className="text-blue-700 text-2xl p-2 rounded-lg border border-blue-200 bg-white shadow-sm cursor-pointer"
                  aria-label={menuAbierto ? t('close_menu') : t('open_menu')}
                  onClick={() => setMenuAbierto((v) => !v)}
                >
                  {menuAbierto ? (
                    <span>&#10005;</span>
                  ) : (
                    <span>&#9776;</span>
                  )}
                </button>
                {menuAbierto && (
                  <nav className="flex flex-col gap-2 mt-2 bg-blue-50 rounded-lg p-2 shadow-md">
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'inicio' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('inicio'); setMenuAbierto(false); }}>{t('nav_home')}</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'citas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('citas'); setMenuAbierto(false); }}>{t('nav_appointments')}</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'especialistas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('especialistas'); setMenuAbierto(false); }}>{t('nav_specialists')}</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'Reunion' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('Reunion'); setMenuAbierto(false); }}>{t('nav_meetings')}</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'pagos' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('pagos'); setMenuAbierto(false); }}>{t('nav_payments')}</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${vista === 'billing' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('billing'); setMenuAbierto(false); }}>{t('nav_billing')}</button>
                  </nav>
                )}
              </div>
            )}
            {/* Vistas dinámicas */}
            {vista === 'inicio' && (
              <>
                {/* Header de bienvenida modularizado */}
                <WelcomeHeader
                  userName={usuario.nombre}
                  nextAppointment={citasAgendadas.length > 0 ? citasAgendadas[0].fecha : null}
                  appointmentsCount={citasAgendadas.length}
                />

                {/* Cards de acciones r?pidas modularizadas */}
                <QuickActionCards
                  citasCount={citasAgendadas.length}
                  especialistasCount={especialistas.length}
                  pagosCount={pagos.length}
                  onViewCitas={() => setVista('citas')}
                  onViewEspecialistas={() => setVista('especialistas')}
                  onViewPagos={() => setVista('pagos')}
                />

                {/* Secci?n de solicitar cita modularizada */}
                <div ref={solicitarCitaRef}>
                  <BookAppointmentCard
                    busqueda={busqueda}
                    setBusqueda={setBusqueda}
                    mostrarCalendario={mostrarCalendario}
                    setMostrarCalendario={setMostrarCalendario}
                    medicoSeleccionado={medicoSeleccionado}
                    setMedicoSeleccionado={setMedicoSeleccionado}
                    fecha={fecha}
                    setFecha={setFecha}
                    horaSeleccionada={horaSeleccionada}
                    setHoraSeleccionada={setHoraSeleccionada}
                    especialistas={especialistas}
                    citasAgendadas={citasAgendadas}
                    citasMedico={citasMedico}
                    horariosMedico={horariosMedico}
                    horasDisponibles={horasDisponibles}
                    onSolicitarCita={solicitarCita}
                    onCancelarCalendario={() => setMostrarCalendario(false)}
                  />
                </div>

                {/* Secci?n de especialistas modularizada */}
                <SpecialistsCard
                  especialistas={especialistasInicio}
                  loadingEspecialistas={loadingEspecialistas}
                  onViewAll={() => setVista('especialistas')}
                  onScheduleWith={irASolicitarCita}
                  onSelectSpecialist={(medico) => {
                    setMedicoSeleccionado(medico.email || '');
                    setMostrarCalendario(true);
                  }}
                />
              </>
            )}
            {vista === 'citas' && (
              <div className="space-y-6">
                <AppointmentsHeader
                  filtroCitas={filtroCitas}
                  setFiltroCitas={setFiltroCitas}
                  loadingCitas={loadingCitas}
                />

                {!loadingCitas && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <AppointmentsCalendar
                      fechaSeleccionadaCalendario={fechaSeleccionadaCalendario}
                      setFechaSeleccionadaCalendario={setFechaSeleccionadaCalendario}
                      citasFiltradas={citasFiltradas}
                      citasFiltradasCalendario={citasFiltradasCalendario}
                      citasProximas={citasProximas}
                      citasPasadas={citasPasadas}
                      citasAgendadas={citasAgendadas}
                    />

                    <AppointmentsList
                      citasFiltradas={citasFiltradas}
                      filtroCitas={filtroCitas}
                      setVista={setVista}
                      isRecordatorioOn={isRecordatorioOn}
                      toggleRecordatorio={toggleRecordatorio}
                    />
                  </div>
                )}
              </div>
            )}
            {/* (El bloque de pagos con tabla duplicada fue eliminado; la ordenaci?n se a?ade a la tabla original m?s abajo) */}
            {vista === 'especialistas' && (
              <div className="space-y-6">
                <SpecialistsPageHeader 
                  totalSpecialists={filtrarEspecialistas.length}
                />
                
                <SpecialistsSearchFilters
                  busqueda={busqueda}
                  setBusqueda={setBusqueda}
                  especialidadFiltro={especialidadFiltro}
                  setEspecialidadFiltro={setEspecialidadFiltro}
                  ordenamiento={ordenamiento}
                  setOrdenamiento={setOrdenamiento}
                  especialidadesUnicas={especialidadesUnicas.filter((esp): esp is string => esp !== undefined)}
                  filteredCount={filtrarEspecialistas.length}
                />
                
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <SpecialistsList
                    especialistasFiltrados={filtrarEspecialistas}
                    loadingEspecialistas={loadingEspecialistas}
                    onScheduleAppointment={(email) => {
                      setMedicoSeleccionado(email);
                      irASolicitarCita(email);
                    }}
                    onViewProfile={(medico) => {
                      setEspecialistaSeleccionado(medico);
                      setMostrarPerfilEspecialista(true);
                    }}
                  />
                </div>
              </div>
            )}
            {vista === 'billing' && (
              <BillingView
                billingProfiles={billingProfile ? [billingProfile] : []}
                currentProfile={billingProfile}
                billingAddress={{
                  ...addressForm,
                  line2: addressForm.line2 ?? '',
                  city: addressForm.city ?? '',
                  region: addressForm.region ?? '',
                  postal_code: addressForm.postal_code ?? '',
                  country: addressForm.country ?? ''
                }}
                paymentMethods={pmList}
                invoices={invoices}
                loadingProfiles={billingLoading}
                loadingPaymentMethods={pmLoading}
                loadingInvoices={billingLoading}
                showCreateProfile={!billingProfile}
                showEditProfile={false}
                showAddPayment={pmFormOpen}
                editingPayment={pmEditingId ? pmList.find(pm => pm.id === pmEditingId) || null : null}
                newProfile={{
                  legal_name: billingProfile?.legal_name || `${usuario.nombre}${usuario.apellido ? ' ' + usuario.apellido : ''}`,
                  tax_id: billingProfile?.tax_id || ''
                }}
                newPaymentMethod={{
                  type: pmForm.provider === 'paypal' ? 'paypal' : 'card',
                  provider: pmForm.provider,
                  holder_name: pmForm.brand || '',
                  email: pmForm.token || ''
                }}
                setShowCreateProfile={() => {}}
                setShowEditProfile={() => {}}
                setShowAddPayment={setPmFormOpen}
                setEditingPayment={(payment) => setPmEditingId(payment?.id || null)}
                setNewProfile={(profile) => {
                  if (billingProfile) {
                    setBillingProfile({
                      ...billingProfile,
                      legal_name: profile.legal_name,
                      tax_id: profile.tax_id
                    });
                  }
                }}
                setNewPaymentMethod={(method) => {
                  setPmForm({
                    provider: method.provider,
                    token: method.email,
                    brand: method.holder_name,
                    last4: '',
                    exp_month: undefined,
                    exp_year: undefined
                  });
                }}
                setBillingAddress={(address) => setAddressForm({
                  ...addressForm,
                  line1: address.line1,
                  line2: address.line2 || null,
                  city: address.city || null,
                  region: address.region || null,
                  postal_code: address.postal_code || null,
                  country: address.country || null,
                })}
                handleCreateProfile={async () => {
                  if (!billingProfile) {
                    try {
                      setBillingLoading(true);
                      const created = await createOrUpdateBillingProfile({
                        billable_type: 'App\\Models\\Usuario',
                        billable_id: usuario.email,
                        legal_name: `${usuario.nombre}${usuario.apellido ? ' ' + usuario.apellido : ''}`,
                      });
                      setBillingProfile(created);
                      addToast(t('billing_profile_created'), 'success');
                    } catch (e) {
                      addToast(e instanceof Error ? e.message : 'Error al crear perfil', 'error');
                    } finally {
                      setBillingLoading(false);
                    }
                  }
                }}
                handleEditProfile={async () => {
                  if (!billingProfile) return;
                  try {
                    await createOrUpdateBillingProfile({ 
                      id: billingProfile.id, 
                      legal_name: billingProfile.legal_name, 
                      tax_id: billingProfile.tax_id 
                    });
                    addToast('Perfil actualizado', 'success');
                  } catch (e) {
                    addToast(e instanceof Error ? e.message : 'Error al actualizar perfil', 'error');
                  }
                }}
                handleSaveAddress={async () => {
                  if (!billingProfile) return;
                  try {
                    let addrId = addressForm.id;
                    if (addrId && addrId > 0) {
                      await updateAddress(addrId, {
                        line1: addressForm.line1, 
                        line2: addressForm.line2, 
                        city: addressForm.city, 
                        region: addressForm.region, 
                        postal_code: addressForm.postal_code, 
                        country: addressForm.country, 
                        is_billing: true,
                      });
                    } else {
                      const created = await createAddress({
                        line1: addressForm.line1, 
                        line2: addressForm.line2, 
                        city: addressForm.city, 
                        region: addressForm.region, 
                        postal_code: addressForm.postal_code, 
                        country: addressForm.country, 
                        is_billing: true,
                      });
                      addrId = created.id;
                      setAddressForm(a => ({ ...a, id: created.id }));
                    }
                    await createOrUpdateBillingProfile({ id: billingProfile.id, address_id: addrId });
                    addToast('Dirección guardada', 'success');
                  } catch (e) {
                    addToast(e instanceof Error ? e.message : 'Error al guardar dirección', 'error');
                  }
                }}
                handleAddPaymentMethod={async () => {
                  if (!billingProfile) return;
                  try {
                    setPmLoading(true);
                    await createPaymentMethod({
                      billing_profile_id: billingProfile.id,
                      provider: pmForm.provider,
                      token: pmForm.token,
                      brand: pmForm.provider === 'paypal' ? 'PayPal' : pmForm.brand,
                      last4: pmForm.provider === 'paypal' ? undefined : pmForm.last4,
                      exp_month: pmForm.provider === 'paypal' ? undefined : pmForm.exp_month,
                      exp_year: pmForm.provider === 'paypal' ? undefined : pmForm.exp_year,
                      is_default: pmList.length === 0,
                      status: 'active',
                    });
                    const methods = await listPaymentMethodsByProfile(billingProfile.id);
                    setPmList(methods);
                    setPmFormOpen(false);
                    setPmForm({ provider: 'manual' });
                    addToast('Método de pago agregado', 'success');
                  } catch (e) {
                    addToast(e instanceof Error ? e.message : 'Error al agregar método', 'error');
                  } finally {
                    setPmLoading(false);
                  }
                }}
                handleEditPaymentMethod={async () => {
                  const pm = pmList.find(p => p.id === pmEditingId);
                  if (!pm) return;
                  try {
                    if (pm.provider === 'paypal') {
                      await updatePaymentMethod(pm.id, {
                        token: pmEditForm.token ?? pm.token,
                      });
                    } else {
                      await updatePaymentMethod(pm.id, {
                        brand: pmEditForm.brand ?? pm.brand,
                        last4: pmEditForm.last4 ?? pm.last4,
                        exp_month: pmEditForm.exp_month ?? pm.exp_month,
                        exp_year: pmEditForm.exp_year ?? pm.exp_year,
                      });
                    }
                    const methods = await listPaymentMethodsByProfile(pm.billing_profile_id);
                    setPmList(methods);
                    setPmEditingId(null);
                    setPmEditForm({});
                    addToast('Método actualizado', 'success');
                  } catch (e) {
                    addToast(e instanceof Error ? e.message : 'Error al guardar', 'error');
                  }
                }}
                handleDeletePaymentMethod={async (id: number) => {
                  try {
                    await deletePaymentMethod(id);
                    setPmList(list => list.filter(x => x.id !== id));
                    addToast('Método eliminado', 'success');
                  } catch (e) {
                    addToast(e instanceof Error ? e.message : 'Error al eliminar', 'error');
                  }
                }}
                handleSetDefaultPayment={async (id: number) => {
                  try {
                    await updatePaymentMethod(id, { is_default: true });
                    setPmList(list => list.map(x => ({ ...x, is_default: x.id === id })));
                    addToast('Predeterminado actualizado', 'success');
                  } catch (e) {
                    addToast(e instanceof Error ? e.message : 'Error al actualizar', 'error');
                  }
                }}
              />
            )}
            {/* Vista de Pagos mejorada */}
            {/* Vista de Pagos modularizada */}
            {vista === 'pagos' && (
              <PaymentsView 
                pagos={pagos}
                pagosOrdenados={pagosOrdenados}
                pagosSort={pagosSort}
                toggleSort={toggleSort}
                loadingPagos={loadingPagos}
                fmtMonto={fmtMonto}
                abrirModalPago={abrirModalPago}
                marcarPagoGratis={marcarPagoGratis}
                descargarRecibo={descargarRecibo}
                addToast={addToast}
                refreshPagos={refreshPagos}
                setVista={setVista}
              />
            )}
            {/* Vista de Reuniones modularizada */}
            {vista === 'Reunion' && (
              <ReunionView 
                reuniones={reuniones}
                citasAgendadas={citasAgendadas}
                pagos={pagos}
                setVista={setVista}
              />
            )}
          </div>
        </div>

        {/* Modal de perfil del especialista */}
        {mostrarPerfilEspecialista && especialistaSeleccionado && (
          <div 
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[10050] ${styles.specialistModal}`}
            onClick={() => setMostrarPerfilEspecialista(false)}
          >
            <div 
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setMostrarPerfilEspecialista(false)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white border border-gray-200 shadow-md hover:bg-gray-50 text-gray-600 hover:text-gray-800 flex items-center justify-center transition"
                aria-label={t('close_modal')}
                type="button"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="p-6">
                {/* Header del modal */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {especialistaSeleccionado.avatar ? (
                      <Image
                        src={especialistaSeleccionado.avatar}
                        alt={`${especialistaSeleccionado.nombre} avatar`}
                        width={80}
                        height={80}
                        className="rounded-full object-cover border-2 border-blue-200"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://randomuser.me/api/portraits/lego/1.jpg';
                        }}
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center border-2 border-blue-200">
                        <span className="text-blue-600 font-bold text-3xl">
                          {especialistaSeleccionado.nombre?.charAt(0).toUpperCase() || 'D'}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        <span className="truncate max-w-[260px] inline-block" title={`${t('doctor_short')} ${especialistaSeleccionado.nombre} ${especialistaSeleccionado.apellido || ''}`}>
                          {t('doctor_short')} {especialistaSeleccionado.nombre} {especialistaSeleccionado.apellido || ''}
                        </span>
                      </h2>
                      <p className="text-blue-600 font-medium text-lg">{especialistaSeleccionado.especialidad}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          especialistaSeleccionado.disponible 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          <div className={`w-2 h-2 rounded-full mr-1 ${
                            especialistaSeleccionado.disponible ? 'bg-green-500' : 'bg-red-500'
                          }`}></div>
                          {especialistaSeleccionado.disponible ? t('available') : t('not_available')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setMostrarPerfilEspecialista(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Información del especialista (sin correo electrónico) */}
                <div className="bg-gray-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">{t('info_section_title')}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {especialistaSeleccionado.telefono && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                        </svg>
                        <span className="text-sm text-gray-700">{especialistaSeleccionado.telefono}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experiencia y Educación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  {especialistaSeleccionado.experiencia && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6z" />
                        </svg>
                        {t('experience')}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{especialistaSeleccionado.experiencia}</p>
                    </div>
                  )}
                  {especialistaSeleccionado.educacion && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <svg className="w-4 h-4 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                        </svg>
                        {t('education')}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{especialistaSeleccionado.educacion}</p>
                    </div>
                  )}
                </div>

                {/* Horarios de atención (reales) */}
                <div className="bg-orange-50 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <svg className="w-4 h-4 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t('working_hours')}
                  </h3>
                  {cargandoHorariosPerfil ? (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <div className="inline-block animate-spin rounded-full border-2 border-orange-200 border-t-orange-600 h-5 w-5"></div>
                      {t('loading_hours')}
                    </div>
                  ) : errorHorariosPerfil ? (
                    <div className="text-sm text-red-600">{errorHorariosPerfil}</div>
                  ) : horariosPerfil.length === 0 ? (
                    <div className="text-sm text-gray-600">{t('no_hours_configured')}</div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-800">
                      {(() => {
                        // Utilidades para manejar horas H:MM
                        // Nombres de días localizados usando Intl según el idioma activo
                        const dias = Array.from({ length: 7 }, (_, i) =>
                          new Intl.DateTimeFormat(i18nHook.language || 'es', { weekday: 'long' })
                            .format(new Date(2024, 0, 7 + i))
                        );
                        const toMinutes = (t: string) => {
                          const [hh, mm] = t.split(':');
                          const h = parseInt(hh, 10) || 0;
                          const m = parseInt(mm || '0', 10) || 0;
                          return h * 60 + m;
                        };
                        const fmtTime = (mins: number) => {
                          const h = Math.floor(mins / 60);
                          const m = mins % 60;
                          return `${h}:${String(m).padStart(2,'0')}`;
                        };
                        const mergeRanges = (rangos: Array<{inicio: string; fin: string}>) => {
                          const sorted = [...rangos]
                            .map(r => ({ s: toMinutes(r.inicio), e: toMinutes(r.fin) }))
                            .sort((a,b) => a.s - b.s);
                          const merged: Array<{ s: number; e: number }> = [];
                          for (const r of sorted) {
                            if (!merged.length) { merged.push({ ...r }); continue; }
                            const last = merged[merged.length - 1];
                            if (r.s <= last.e) {
                              // Solapado
                              last.e = Math.max(last.e, r.e);
                            } else if (r.s === last.e) {
                              // Contiguo (conectado)
                              last.e = r.e;
                            } else {
                              merged.push({ ...r });
                            }
                          }
                          return merged.map(({s,e}) => ({ inicio: fmtTime(s), fin: fmtTime(e) }));
                        };
                        const joinDays = (idxs: number[]) => {
                          const names = idxs.map(i => dias[i]);
                          const andWord = t('and');
                          if (names.length === 1) return names[0];
                          if (names.length === 2) return `${names[0]} ${andWord} ${names[1]}`;
                          return `${names.slice(0,-1).join(', ')} ${andWord} ${names[names.length-1]}`;
                        };

                        // 1) Agrupar por día y fusionar rangos contiguos/solapados
                        const porDia = new Map<number, Array<{inicio:string, fin:string}>>();
                        horariosPerfil.forEach(h => {
                          const arr = porDia.get(h.dia_semana) || [];
                          arr.push({ inicio: h.hora_inicio, fin: h.hora_fin });
                          porDia.set(h.dia_semana, arr);
                        });
                        const porDiaFusionado = new Map<number, Array<{inicio:string, fin:string}>>();
                        porDia.forEach((rangos, dia) => {
                          porDiaFusionado.set(dia, mergeRanges(rangos));
                        });

                        // 2) Agrupar días que comparten exactamente los mismos rangos fusionados
                        type Rango = { inicio: string; fin: string };
                        const firmaDe = (rs: Rango[]) => rs.map(r => `${r.inicio}-${r.fin}`).join(';');
                        const gruposPorFirma = new Map<string, { dias: number[]; rangos: Rango[] }>();
                        Array.from(porDiaFusionado.entries())
                          .sort((a,b) => a[0]-b[0])
                          .forEach(([dia, rangos]) => {
                            const firma = firmaDe(rangos);
                            const g = gruposPorFirma.get(firma);
                            if (g) g.dias.push(dia);
                            else gruposPorFirma.set(firma, { dias: [dia], rangos });
                          });

                        // 3) Render por grupos (días unidos + rangos)
                        return Array.from(gruposPorFirma.values())
                          .sort((a,b) => Math.min(...a.dias) - Math.min(...b.dias))
                          .map((g, idx) => (
                            <div key={idx} className="flex items-start gap-2">
                              <span className="font-semibold min-w-[88px]">{joinDays(g.dias)}:</span>
                              <span className="text-gray-700">
                                {g.rangos.map(r => `${r.inicio} - ${r.fin}`).join(', ')}
                              </span>
                            </div>
                          ));
                      })()}
                    </div>
                  )}
                </div>

                {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setMostrarPerfilEspecialista(false);
                      irASolicitarCita(especialistaSeleccionado.email || undefined);
                    }}
                    className="flex-1 min-w-0 bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{t('schedule_appointment')}</span>
                  </button>
                  
                  <button
                    onClick={() => setMostrarPerfilEspecialista(false)}
                    className="flex-1 min-w-0 sm:flex-initial border border-gray-300 hover:border-gray-400 text-gray-700 hover:text-gray-900 px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    {t('close')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      <Footer color="oklch(12.9% 0.042 264.695)" background="" className="shadow-lg rounded-b-lg bg-white/70" style={{ padding: '2rem'}}/>
      {mostrarModalPago && pagoSeleccionado != null && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={cerrarModalPago}>
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-gray-800 transition cursor-pointer border border-gray-100 shadow"
              onClick={cerrarModalPago}
              aria-label={t('close_modal') || 'Cerrar'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            {/* Header con título y pestañas */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-green-500 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2v1c0 1.105 1.343 2 3 2s3 .895 3 2v1c0 1.105-1.343 2-3 2" /></svg>
                <div>
                  <h3 className="text-lg font-bold">{t('choose_payment_method') || 'Selecciona método de pago'}</h3>
                  <div className="text-sm opacity-90">{t('payment_modal_sub') || 'Paga de forma segura con el método que prefieras'}</div>
                </div>
              </div>
            </div>

            {/* Contenido: dos columnas (izq: resumen, der: opciones de pago) */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-sm text-gray-600">{t('amount_to_pay') || 'Importe'}</div>
                <div className="text-2xl font-bold text-gray-900 mt-2">€{fmtMonto(pagos.find(p => p.id === pagoSeleccionado)?.monto)}</div>
                <div className="mt-3 text-sm text-gray-700">
                  {t('payment_security_note') || 'Transacción segura. Tus datos no son almacenados aquí.'}
                </div>
                <div className="mt-4 text-sm">
                  <div className="font-semibold">{t('payment_details') || 'Detalle'}</div>
                  <div className="text-gray-600 text-sm mt-1">{pagos.find(p => p.id === pagoSeleccionado)?.medico || '—'}</div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white rounded-lg p-4 border border-gray-100">
                {/* PayPal tab */}
                {modalPaymentTab === 'paypal' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('paypal') || 'Pagar con PayPal'}</h4>
                    <div className="text-xs text-gray-600 mb-3">{t('paypal_description') || 'Usa tu cuenta PayPal o tarjeta a través de PayPal. Rápido y seguro.'}</div>
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <PayPalButtonsCell pagoId={pagoSeleccionado} />
                    </div>
                  </div>
                )}

                {/* Card tab (UI básica, integrar gateway real según backend) */}
                {modalPaymentTab === 'card' && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">{t('card') || 'Pagar con tarjeta'}</h4>
                    <div className="text-xs text-gray-600 mb-3">{t('card_description') || 'Introduce los datos de tu tarjeta. El cobro requiere una pasarela (p. ej. Stripe) en el servidor.'}</div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input className="border border-gray-200 rounded-md px-3 py-2" placeholder={t('card_name_placeholder') || 'Nombre completo (como en la tarjeta)'} />
                        <input className="border border-gray-200 rounded-md px-3 py-2" placeholder={t('card_number_placeholder') || 'Número de tarjeta'} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input className="border border-gray-200 rounded-md px-3 py-2" placeholder={t('card_expiry_placeholder') || 'MM/AA'} />
                        <input className="border border-gray-200 rounded-md px-3 py-2" placeholder={t('card_cvc_placeholder') || 'CVC/CVV'} />
                      </div>
                      <div className="text-xs text-gray-500">{t('card_payment_note') || 'La integración de tarjeta requiere un gateway (Stripe/Adyen) en backend.'}</div>
                      <div className="flex justify-end">
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md" onClick={() => addToast(t('card_flow_not_implemented') || 'Integración de tarjeta no implementada', 'info')}>{t('pay_with_card') || 'Pagar con tarjeta'}</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}
      </div>
    </div>
  );
}