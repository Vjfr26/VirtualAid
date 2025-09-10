"use client";
import React from "react";
import { listMedicos, listUsuarios, listCitasPorMedico, type AdminMedico, type AdminUsuario, type AdminCita, fullName, avatarUrl } from './services';
import TopActions from '../components/TopActions';
import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import style from './calendar.module.css';
import Image from "next/image";
import HeaderLogo from "../components/HeaderLogo";
import Footer from "../components/Footer";

const resumen = [
  { titulo: "Total Citas", valor: 120, icono: "📅", color: "#e3f2fd", bg: "from-blue-500 to-blue-600", accent: "from-blue-100 to-blue-200" },
  { titulo: "Total Médicos", valor: 15, icono: "🩺", color: "#b2f2e5", bg: "from-emerald-500 to-emerald-600", accent: "from-emerald-100 to-emerald-200" },
  { titulo: "Total Pacientes", valor: 250, icono: "👤", color: "#90caf9", bg: "from-purple-500 to-purple-600", accent: "from-purple-100 to-purple-200" },
  { titulo: "Total Usuarios", valor: 50, icono: "👥", color: "#ececec", bg: "from-amber-500 to-amber-600", accent: "from-amber-100 to-amber-200" },
];

// Gradientes mejorados para cards de resumen con más profundidad visual
const resumenGradients = [
  'from-blue-50 via-blue-100/80 to-blue-200/60',
  'from-emerald-50 via-emerald-100/80 to-emerald-200/60',
  'from-purple-50 via-purple-100/80 to-purple-200/60',
  'from-amber-50 via-amber-100/80 to-amber-200/60',
] as const;

// Iconos SVG mejorados para el dashboard
const icons = {
  dashboard: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
    </svg>
  ),
  citas: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
    </svg>
  ),
  medicos: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
    </svg>
  ),
  pacientes: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
    </svg>
  ),
  admin: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
    </svg>
  ),
};

// Las citas se cargan desde backend

// Datos se cargan desde backend

const estados = ["Activo", "Inactivo", "Pendiente"] as const;

export default function DashboardAdmin() {
  const [fechaSeleccionada, setFechaSeleccionada] = React.useState<Date | null>(null);
  const [activeTab, setActiveTab] = React.useState("dashboard");
  const [busquedaMedico, setBusquedaMedico] = React.useState("");
  const [busquedaPaciente, setBusquedaPaciente] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [medicosState, setMedicosState] = React.useState<AdminMedico[]>([]);
  const [usuariosState, setUsuariosState] = React.useState<AdminUsuario[]>([]);
  const [cargando, setCargando] = React.useState(false);
  const [citasState, setCitasState] = React.useState<AdminCita[]>([]);

  // Cargar datos de backend al montar
  React.useEffect(() => {
    let cancel = false;
    const load = async () => {
      setCargando(true);
      try {
  const [docs, usrs] = await Promise.all([listMedicos(), listUsuarios()]);
        if (cancel) return;
        setMedicosState(docs);
        setUsuariosState(usrs);
  // cargar citas por médico
  const medEmails = docs.map(d => d.email).filter(Boolean) as string[];
  const citasArrays = await Promise.all(medEmails.map(e => listCitasPorMedico(e)));
  if (cancel) return;
  setCitasState(citasArrays.flat());
      } catch {
        // fallback: dejar vacío
        if (!cancel) {
          setMedicosState([]);
          setUsuariosState([]);
        }
      } finally {
        if (!cancel) setCargando(false);
      }
    };
    load();
    return () => { cancel = true; };
  }, []);

  // Filtrado
  const medicosFiltrados = medicosState.filter(m => {
    const name = fullName(m).toLowerCase();
    const esp = String(m.especializacion ?? '').toLowerCase();
    const q = busquedaMedico.toLowerCase();
    return name.includes(q) || esp.includes(q);
  });
  const pacientesFiltrados = usuariosState
    .map(u => ({ nombre: fullName(u), edad: undefined as number | undefined, historial: [] as string[] }))
    .filter(p => p.nombre.toLowerCase().includes(busquedaPaciente.toLowerCase()));

  // Derivados para renderizar
  const dashboardCitas = React.useMemo(() => {
    return citasState.slice(0, 8).map(c => {
      const u = usuariosState.find(u => u.email === c.usuario_id);
      return {
        nombre: u ? fullName(u) : String(c.usuario_id ?? '—'),
        contacto: u?.tlf ? String(u.tlf) : '—',
      };
    });
  }, [citasState, usuariosState]);

  const citasPorMedicoRows = React.useMemo(() => {
    return citasState.map(c => {
      const m = medicosState.find(m => m.email === c.medico_id);
      const u = usuariosState.find(u => u.email === c.usuario_id);
      return {
        medico: m ? fullName(m) : String(c.medico_id ?? '—'),
        especialidad: m?.especializacion ? String(m.especializacion) : '-',
        paciente: u ? fullName(u) : String(c.usuario_id ?? '—'),
        fecha: c.fecha ? String(c.fecha) : '-',
        hora: c.hora ? String(c.hora).slice(0,5) : '-',
      };
    });
  }, [citasState, medicosState, usuariosState]);

  // Función para obtener días con citas
  const diasConCitas = React.useMemo(() => {
    const fechas = new Set<string>();
    
    // Agregar citas reales del estado
    citasState.forEach(cita => {
      if (cita.fecha) {
        fechas.add(cita.fecha);
      }
    });
    
    // Agregar algunas fechas de ejemplo para testing (se pueden remover después)
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    const pasadoManana = new Date(hoy);
    pasadoManana.setDate(hoy.getDate() + 2);
    
    fechas.add(hoy.toISOString().split('T')[0]);
    fechas.add(manana.toISOString().split('T')[0]);
    fechas.add(pasadoManana.toISOString().split('T')[0]);
    
    console.log('Días con citas:', Array.from(fechas));
    console.log('Total citas:', citasState.length);
    return fechas;
  }, [citasState]);

  // Función para contar citas por día
  const citasPorDia = React.useMemo(() => {
    const conteo: { [fecha: string]: number } = {};
    
    // Contar citas reales
    citasState.forEach(cita => {
      if (cita.fecha) {
        conteo[cita.fecha] = (conteo[cita.fecha] || 0) + 1;
      }
    });
    
    // Agregar datos de ejemplo para testing
    const hoy = new Date();
    const manana = new Date(hoy);
    manana.setDate(hoy.getDate() + 1);
    const pasadoManana = new Date(hoy);
    pasadoManana.setDate(hoy.getDate() + 2);
    
    const hoyStr = hoy.toISOString().split('T')[0];
    const mananaStr = manana.toISOString().split('T')[0];
    const pasadoMananaStr = pasadoManana.toISOString().split('T')[0];
    
    conteo[hoyStr] = (conteo[hoyStr] || 0) + 3;
    conteo[mananaStr] = (conteo[mananaStr] || 0) + 2;
    conteo[pasadoMananaStr] = (conteo[pasadoMananaStr] || 0) + 1;
    
    return conteo;
  }, [citasState]);

  // Función para renderizar contenido de cada día en el calendario
  const renderTileContent = ({ date, view }: { date: Date; view: string }) => {
    if (view === 'month') {
      const fechaString = date.toISOString().split('T')[0];
      const numeroCitas = citasPorDia[fechaString] || 0;
      
      if (numeroCitas > 0) {
        return (
          <div style={{
            position: 'absolute',
            top: '2px',
            right: '2px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
          }}>
            {numeroCitas}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Barra superior mejorada - responsive */}
      <div className="fixed top-0 left-0 lg:left-64 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm transition-all duration-300">
        <div className="flex justify-between items-center h-16 px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden bg-gradient-to-r from-slate-800 to-blue-800 hover:from-slate-900 hover:to-blue-900 text-white rounded-lg p-2 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
              onClick={() => setSidebarOpen(v => !v)}
              aria-label="Abrir menú"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <HeaderLogo variant="horizontal" />
          </div>
          <div className="flex items-center gap-4">
            <TopActions />
            <button onClick={() => window.location.href = "/login"}
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar mejorado con colores vibrantes - responsive */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 backdrop-blur-md border-r border-blue-800/30 shadow-xl z-40 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="pt-20 p-6 h-full flex flex-col">
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
              Panel Admin
            </h2>
            <div className="h-1 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-500 rounded-full shadow-lg"></div>
          </div>
          <nav>
            <ul className="space-y-3">
              {[
                { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
                { id: "citas", label: "Citas", icon: icons.citas },
                { id: "medicos", label: "Médicos", icon: icons.medicos },
                { id: "pacientes", label: "Pacientes", icon: icons.pacientes },
                { id: "admin", label: "Administración", icon: icons.admin },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200 ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-white shadow-lg shadow-blue-500/25 transform scale-105 ring-2 ring-cyan-300/50'
                        : 'text-slate-300 hover:bg-gradient-to-r hover:from-slate-800/60 hover:to-blue-800/60 hover:text-white hover:scale-102 hover:shadow-md'
                    }`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false);
                    }}
                  >
                    <div className={`transition-colors duration-200 ${
                      activeTab === item.id ? 'text-white' : 'text-slate-400'
                    }`}>
                      {item.icon}
                    </div>
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Elemento decorativo en la parte inferior */}
          <div className="mt-auto">
            <div className="border-t border-blue-800/30 pt-4 mt-8">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-slate-800/50 to-blue-800/50 backdrop-blur-sm">
                <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-white">Sistema Activo</div>
                  <div className="text-xs text-slate-300">Todos los servicios operando</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal mejorado - completamente responsive */}
      <main className="pt-16 transition-all duration-300 ease-in-out lg:ml-64 bg-gradient-to-br from-gray-50 to-white min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8 max-w-full">
          {/* Header mejorado */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-2">
              Panel de Administración
            </h1>
            <p className="text-gray-600">Gestiona tu sistema médico desde un solo lugar</p>
          </div>

          {activeTab === "dashboard" && (
            <div className="space-y-8">
              {/* Tarjetas de resumen mejoradas */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {resumen.map((item, idx) => {
                  const grad = resumenGradients[idx % resumenGradients.length];
                  return (
                    <div
                      key={idx}
                      className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50`}
                    >
                      {/* Efecto de brillo */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      
                      {/* Contenido de la tarjeta */}
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-r ${item.bg} text-white shadow-lg`}>
                            <span className="text-2xl">{item.icono}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-800">{item.valor}</div>
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                          {item.titulo}
                        </div>
                      </div>
                      
                      {/* Decoración inferior */}
                      <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${item.bg}`}></div>
                    </div>
                  );
                })}
              </div>
              {/* Paneles principales mejorados */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Panel de Citas rediseñado */}
                <section className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-sky-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Header del panel */}
                  <div className="bg-gradient-to-r from-sky-500 to-blue-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold">Gestión de Citas</h2>
                    </div>
                  </div>
                  
                  {/* Contenido del panel */}
                  <div className="p-6 space-y-6">
                    {/* Calendario mejorado */}
                    <div className="bg-gradient-to-br from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-100">
                      <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 bg-sky-500 rounded-full"></span>
                        Calendario de Citas
                      </h3>
                      <div className="flex justify-center">
                        <Calendar
                          className={style.calendarBox}
                          onChange={date => setFechaSeleccionada(date instanceof Date ? date : null)}
                          value={fechaSeleccionada}
                          minDate={new Date('2024-01-01')}
                          tileContent={renderTileContent}
                          tileClassName={({ date, view }) => {
                            if (view === 'month') {
                              const fechaString = date.toISOString().split('T')[0];
                              const tieneCitas = diasConCitas.has(fechaString);
                              return tieneCitas ? 'has-appointments' : '';
                            }
                            return '';
                          }}
                          tileDisabled={({ date, view }) => {
                            if (view === 'month') {
                              return date.getDay() === 0 || date.getDay() === 6;
                            }
                            return false;
                          }}
                        />
                      </div>
                    </div>

                    {/* Lista de citas recientes */}
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                        <h4 className="font-semibold text-gray-800">Citas Recientes</h4>
                      </div>
                      <div className="max-h-64 overflow-y-auto">
                        {dashboardCitas.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                            </svg>
                            Sin citas programadas
                          </div>
                        ) : (
                          dashboardCitas.map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 hover:bg-sky-50 transition-colors border-b border-gray-100 last:border-b-0">
                              <div>
                                <div className="font-medium text-gray-800">{c.nombre}</div>
                                <div className="text-sm text-gray-500">{c.contacto}</div>
                              </div>
                              <div className="text-xs bg-sky-100 text-sky-700 px-2 py-1 rounded-full">
                                Programada
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </section>
                {/* Panel de Médicos rediseñado */}
                <section className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Header del panel */}
                  <div className="bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold">Equipo Médico</h2>
                    </div>
                  </div>
                  
                  {/* Contenido del panel */}
                  <div className="p-6">
                    {cargando ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                        <span className="ml-3 text-gray-600">Cargando médicos...</span>
                      </div>
                    ) : medicosState.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                        </svg>
                        Sin médicos registrados
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {medicosState.slice(0, 4).map((m, idx) => (
                          <div key={idx} className="group flex items-center gap-4 bg-gradient-to-r from-emerald-50/50 to-green-50/50 hover:from-emerald-100/70 hover:to-green-100/70 border border-emerald-100 rounded-xl p-4 transition-all duration-200 hover:scale-102 hover:shadow-md">
                            <div className="relative">
                              <Image 
                                src={avatarUrl(m.nombre, (m as { avatar?: string }).avatar)} 
                                alt={fullName(m)} 
                                width={56} 
                                height={56} 
                                className="rounded-full ring-4 ring-white shadow-lg" 
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 text-lg">{fullName(m)}</div>
                              <div className="text-emerald-600 font-medium">{String(m.especializacion ?? '-')}</div>
                              <div className="text-gray-500 text-sm">{String(m.tlf ?? 'Sin teléfono')}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                                {String(m.estado ?? 'Activo')}
                              </span>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                              </svg>
                            </div>
                          </div>
                        ))}
                        
                        {medicosState.length > 4 && (
                          <button 
                            onClick={() => setActiveTab("medicos")}
                            className="w-full py-3 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors font-medium"
                          >
                            Ver todos los médicos ({medicosState.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </section>
                {/* Panel de Pacientes rediseñado */}
                <section className="relative bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Header del panel */}
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-6 text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                      </div>
                      <h2 className="text-xl font-bold">Pacientes Registrados</h2>
                    </div>
                  </div>
                  
                  {/* Contenido del panel */}
                  <div className="p-6">
                    {cargando ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <span className="ml-3 text-gray-600">Cargando pacientes...</span>
                      </div>
                    ) : usuariosState.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                        </svg>
                        Sin pacientes registrados
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {usuariosState.slice(0, 4).map((u, idx) => (
                          <div key={idx} className="group flex items-center gap-4 bg-gradient-to-r from-purple-50/50 to-pink-50/50 hover:from-purple-100/70 hover:to-pink-100/70 border border-purple-100 rounded-xl p-4 transition-all duration-200 hover:scale-102 hover:shadow-md">
                            <div className="relative">
                              <Image 
                                src={avatarUrl(u.nombre, (u as { avatar?: string }).avatar)} 
                                alt={fullName(u)} 
                                width={56} 
                                height={56} 
                                className="rounded-full ring-4 ring-white shadow-lg" 
                              />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 border-2 border-white rounded-full"></div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-gray-800 text-lg">{fullName(u)}</div>
                              <div className="text-purple-600 font-medium">{u.email}</div>
                              <div className="text-gray-500 text-sm">{u.tlf ? String(u.tlf) : 'Sin teléfono'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                Activo
                              </span>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 111.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/>
                              </svg>
                            </div>
                          </div>
                        ))}
                        
                        {usuariosState.length > 4 && (
                          <button 
                            onClick={() => setActiveTab("pacientes")}
                            className="w-full py-3 text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-xl transition-colors font-medium"
                          >
                            Ver todos los pacientes ({usuariosState.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Panel de estadísticas adicionales */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                {/* Panel de Actividad Reciente */}
                <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg text-white">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Actividad Reciente</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Nueva cita programada hace 2 minutos</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Nuevo médico registrado hace 1 hora</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      <span className="text-sm text-gray-700">Paciente actualizado hace 3 horas</span>
                    </div>
                  </div>
                </section>

                {/* Panel de Métricas Rápidas */}
                <section className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg text-white">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Métricas del Sistema</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">{citasState.length}</div>
                      <div className="text-sm text-gray-600">Citas Totales</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">98%</div>
                      <div className="text-sm text-gray-600">Satisfacción</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">24/7</div>
                      <div className="text-sm text-gray-600">Disponibilidad</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl">
                      <div className="text-2xl font-bold text-orange-600">5.0</div>
                      <div className="text-sm text-gray-600">Calificación</div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        {activeTab === "citas" && (
          <div className="space-y-8">
            {/* Header de sección */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl text-white shadow-lg">
                  {icons.citas}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Gestión de Citas</h2>
                  <p className="text-gray-600">Administra y programa las citas médicas</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Calendario mejorado */}
              <div className="xl:col-span-1">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    Calendario
                  </h3>
                  <div className="flex justify-center">
                      <Calendar
                          className={style.calendarBox}
                          onChange={date => setFechaSeleccionada(date instanceof Date ? date : null)}
                          value={fechaSeleccionada}
                          minDate={new Date('2024-01-01')}
                          tileContent={renderTileContent}
                          tileClassName={({ date, view }) => {
                            if (view === 'month') {
                              const fechaString = date.toISOString().split('T')[0];
                              const tieneCitas = diasConCitas.has(fechaString);
                              return tieneCitas ? 'has-appointments' : '';
                            }
                            return '';
                          }}
                          tileDisabled={({ date, view }) => {
                            if (view === 'month') {
                              return date.getDay() === 0 || date.getDay() === 6;
                            }
                            return false;
                          }}
                        />
                      </div>
                </div>
              </div>

              {/* Tabla de citas mejorada */}
              <div className="xl:col-span-2">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800">Citas Programadas</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="py-4 px-6 text-left font-semibold text-gray-700">Médico</th>
                          <th className="py-4 px-6 text-left font-semibold text-gray-700">Especialidad</th>
                          <th className="py-4 px-6 text-left font-semibold text-gray-700">Paciente</th>
                          <th className="py-4 px-6 text-left font-semibold text-gray-700">Fecha</th>
                          <th className="py-4 px-6 text-left font-semibold text-gray-700">Hora</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {citasPorMedicoRows.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-500">
                              <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                              </svg>
                              No hay citas programadas
                            </td>
                          </tr>
                        ) : (
                          citasPorMedicoRows.map((r, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                              <td className="py-4 px-6 font-medium text-gray-800">{r.medico}</td>
                              <td className="py-4 px-6 text-gray-600">{r.especialidad}</td>
                              <td className="py-4 px-6 text-gray-600">{r.paciente}</td>
                              <td className="py-4 px-6 text-gray-600">{r.fecha}</td>
                              <td className="py-4 px-6">
                                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                  {r.hora}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "medicos" && (
          <div className="space-y-8">
            {/* Header de sección */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white shadow-lg">
                    {icons.medicos}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Equipo Médico</h2>
                    <p className="text-gray-600">Administra los profesionales de la salud</p>
                  </div>
                </div>
                <button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-105">
                  + Agregar Médico
                </button>
              </div>
            </div>

            {/* Buscador mejorado */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar médico por nombre o especialidad..."
                  value={busquedaMedico}
                  onChange={e => setBusquedaMedico(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Lista de médicos mejorada */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">
                  Médicos Registrados ({medicosFiltrados.length})
                </h3>
              </div>
              
              {cargando ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                  <span className="ml-4 text-gray-600">Cargando médicos...</span>
                </div>
              ) : medicosFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd"/>
                  </svg>
                  {busquedaMedico ? 'No se encontraron médicos' : 'Sin médicos registrados'}
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {medicosFiltrados.map((m, idx) => (
                    <div key={idx} className="group p-6 hover:bg-emerald-50/50 transition-all duration-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <Image 
                              src={avatarUrl(m.nombre, (m as { avatar?: string }).avatar)} 
                              alt={fullName(m)} 
                              width={64} 
                              height={64} 
                              className="rounded-full ring-4 ring-white shadow-lg group-hover:ring-emerald-100" 
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800">{fullName(m)}</h4>
                            <p className="text-emerald-600 font-medium">{String(m.especializacion ?? '-')}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                                </svg>
                                {String(m.tlf ?? 'Sin teléfono')}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                                </svg>
                                {m.email || 'Sin email'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                            String(m.estado ?? 'Activo') === 'Activo' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : String(m.estado) === 'Inactivo'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {String(m.estado ?? 'Activo')}
                          </span>
                          <button
                            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 hover:scale-105 shadow-lg"
                            onClick={() => {
                              setMedicosState(prev => prev.map((med) => {
                                const same = (med.email && m.email) ? med.email === m.email : fullName(med) === fullName(m);
                                const current = String(med.estado ?? 'Activo') as typeof estados[number];
                                const idx = Math.max(0, estados.indexOf(current));
                                const next = estados[(idx + 1) % estados.length];
                                return same ? { ...med, estado: next } : med;
                              }));
                            }}
                          >
                            Cambiar Estado
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "pacientes" && (
          <div className="space-y-8">
            {/* Header de sección */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl text-white shadow-lg">
                    {icons.pacientes}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">Pacientes Registrados</h2>
                    <p className="text-gray-600">Gestiona la información de los pacientes</p>
                  </div>
                </div>
                <button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-all duration-200 hover:scale-105">
                  + Agregar Paciente
                </button>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{usuariosState.length}</div>
                    <div className="text-sm font-medium text-gray-600">Total Pacientes</div>
                  </div>
                  <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6 border border-emerald-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">{usuariosState.filter(u => u.tlf).length}</div>
                    <div className="text-sm font-medium text-gray-600">Con Teléfono</div>
                  </div>
                  <svg className="w-8 h-8 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                </div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{citasState.length}</div>
                    <div className="text-sm font-medium text-gray-600">Citas Activas</div>
                  </div>
                  <svg className="w-8 h-8 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200/50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-orange-600">98%</div>
                    <div className="text-sm font-medium text-gray-600">Satisfacción</div>
                  </div>
                  <svg className="w-8 h-8 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Buscador mejorado */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Buscar paciente por nombre..."
                  value={busquedaPaciente}
                  onChange={e => setBusquedaPaciente(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white/70 backdrop-blur-sm"
                />
              </div>
            </div>

            {/* Lista de pacientes mejorada */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 border-b border-gray-200">
                <h3 className="text-lg font-bold text-gray-800">
                  Pacientes ({pacientesFiltrados.length})
                </h3>
              </div>

              {cargando ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
                  <span className="ml-4 text-gray-600">Cargando pacientes...</span>
                </div>
              ) : pacientesFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd"/>
                  </svg>
                  {busquedaPaciente ? 'No se encontraron pacientes' : 'Sin pacientes registrados'}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                  {pacientesFiltrados.map((p, idx) => {
                    const usuario = usuariosState[idx];
                    return (
                      <div key={idx} className="group bg-gradient-to-br from-purple-50/50 to-pink-50/50 hover:from-purple-100/70 hover:to-pink-100/70 border border-purple-100 rounded-xl p-6 transition-all duration-200 hover:scale-102 hover:shadow-lg">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative">
                            <Image 
                              src={avatarUrl(p.nombre, (usuario as { avatar?: string } | undefined)?.avatar)} 
                              alt={p.nombre} 
                              width={56} 
                              height={56} 
                              className="rounded-full ring-4 ring-white shadow-lg group-hover:ring-purple-100" 
                            />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-white rounded-full"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-lg font-semibold text-gray-800 truncate">{p.nombre}</h4>
                            <p className="text-purple-600 text-sm truncate">{usuario?.email || 'Sin email'}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                            </svg>
                            <span>{usuario?.tlf ? String(usuario.tlf) : 'Sin teléfono'}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                            </svg>
                            <span>Última visita: {new Date().toLocaleDateString()}</span>
                          </div>

                          <div className="pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Activo
                              </span>
                              <button className="text-purple-600 hover:text-purple-700 text-sm font-medium">
                                Ver historial
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "admin" && (
          <div className="space-y-8">
            {/* Header de sección */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                  {icons.admin}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Configuración del Sistema</h2>
                  <p className="text-gray-600">Gestiona las configuraciones avanzadas</p>
                </div>
              </div>
            </div>

            {/* Panel de configuraciones */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Configuraciones generales */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full"></span>
                  Configuraciones Generales
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                    <div>
                      <div className="font-semibold text-gray-800">Modo mantenimiento</div>
                      <div className="text-sm text-gray-600">Activar/desactivar el sistema</div>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200">
                    <div>
                      <div className="font-semibold text-gray-800">Notificaciones email</div>
                      <div className="text-sm text-gray-600">Envío automático de emails</div>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                    <div>
                      <div className="font-semibold text-gray-800">Backup automático</div>
                      <div className="text-sm text-gray-600">Respaldo diario de datos</div>
                    </div>
                    <div className="flex items-center">
                      <input type="checkbox" defaultChecked className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Estadísticas del sistema */}
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                  Estadísticas del Sistema
                </h3>
                <div className="space-y-4">
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">Uso de almacenamiento</span>
                      <span className="text-sm text-blue-600 font-medium">2.3 GB / 10 GB</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{width: '23%'}}></div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">Rendimiento del servidor</span>
                      <span className="text-sm text-emerald-600 font-medium">Excelente</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-emerald-500 to-green-500 h-2 rounded-full" style={{width: '95%'}}></div>
                    </div>
                  </div>

                  <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-gray-800">Conexiones activas</span>
                      <span className="text-sm text-purple-600 font-medium">127 usuarios</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '64%'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Acciones de administrador */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full"></span>
                Acciones de Administrador
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105">
                  <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  Exportar Datos
                </button>
                
                <button className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105">
                  <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                  Sincronizar
                </button>
                
                <button className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transition-all duration-200 hover:scale-105">
                  <svg className="w-6 h-6 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd"/>
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 001 1h6a1 1 0 001-1V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zM8 8a1 1 0 012 0v3a1 1 0 11-2 0V8zm4 0a1 1 0 10-2 0v3a1 1 0 102 0V8z" clipRule="evenodd"/>
                  </svg>
                  Limpiar Cache
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Footer responsive */}
        <footer className="mt-12 border-t border-gray-200/60 bg-white/50 backdrop-blur-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                <div className="text-sm text-gray-600 font-medium">
                  © 2025 VirtualAid
                </div>
                <div className="hidden sm:block w-1 h-1 bg-gray-400 rounded-full"></div>
                <div className="text-sm text-gray-500">
                  Sistema de Gestión Médica
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-gray-500">Online</span>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs text-gray-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                  Última actualización: {new Date().toLocaleDateString('es-ES')}
                </div>
              </div>
            </div>
          </div>
          <Footer color="oklch(12.9% 0.042 264.695)" background="transparent" borderColor="transparent" />
        </footer>
        </div>
      </main>
    </div>
  );
}
