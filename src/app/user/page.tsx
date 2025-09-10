"use client";
import React, { useState, useEffect } from "react";
import TopActions from '../components/TopActions';
import { useMediaQuery } from 'react-responsive';
import Image from 'next/image';

import Calendar from "react-calendar";
import 'react-calendar/dist/Calendar.css';
import styles from './calendar.module.css';


const especialistasEjemplo = [
  { nombre: "Dra. Ana López", especialidad: "Cardiología" },
  { nombre: "Dr. Juan Pérez", especialidad: "Dermatología" },
  { nombre: "Dra. María García", especialidad: "Pediatría" },
  { nombre: "Dr. Carlos Ruiz", especialidad: "Neurología" },
];

export default function DashboardPaciente() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [vista, setVista] = useState('inicio'); // 'inicio' | 'citas' | 'especialistas' | 'pagos'
  // Ejemplo de pagos de citas
  const [pagos, setPagos] = useState([
    {
      id: 1,
      fecha: "28/07/2025",
      medico: "Dra. Ana López",
      especialidad: "Cardiología",
      monto: 80,
      estado: "Pendiente",
      enlacePago: "/pago/1"
    },
    {
      id: 2,
      fecha: "02/08/2025",
      medico: "Dr. Juan Pérez",
      especialidad: "Dermatología",
      monto: 60,
      estado: "Pagado",
      enlacePago: ""
    }
  ]);

  // Simular pago
  const realizarPago = (id: number) => {
    setPagos(pagos.map(p => p.id === id ? { ...p, estado: "Pagado", enlacePago: "" } : p));
    alert("¡Pago realizado con éxito!");
  };

  // Ejemplo de citas agendadas
  const citasAgendadas = [
    {
      fecha: new Date(2025, 6, 28),
      hora: '10:00',
      medico: 'Dra. Ana López',
      especialidad: 'Cardiología',
    },
    {
      fecha: new Date(2025, 7, 2),
      hora: '12:00',
      medico: 'Dr. Juan Pérez',
      especialidad: 'Dermatología',
    },
  ];
  // Datos de usuario de ejemplo
  // Estado de usuario editable
  const [usuario, setUsuario] = useState({
    nombre: "Benjamín",
    apellido: "Torres",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
    email: "benjamin.torres@email.com"
  });

  // Estado para modal de edición de perfil
  const [mostrarEditarPerfil, setMostrarEditarPerfil] = useState(false);
  const [formPerfil, setFormPerfil] = useState({
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    avatar: usuario.avatar,
    email: usuario.email
  });
  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [mensajePerfil, setMensajePerfil] = useState("");

  // Abrir modal y sincronizar datos
  const abrirEditarPerfil = () => {
    setFormPerfil({
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      avatar: usuario.avatar,
      email: usuario.email
    });
    setMensajePerfil("");
    setMostrarEditarPerfil(true);
  };
  const cerrarEditarPerfil = () => {
    setMostrarEditarPerfil(false);
    setMensajePerfil("");
  };
  // Simular petición al backend
  const guardarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargandoPerfil(true);
    setMensajePerfil("");
    // Simulación de delay de petición
    setTimeout(() => {
      setUsuario({ ...usuario, ...formPerfil });
      setCargandoPerfil(false);
      setMensajePerfil("¡Perfil actualizado correctamente!");
      setTimeout(() => {
        setMostrarEditarPerfil(false);
        setMensajePerfil("");
      }, 1200);
    }, 1200);
  };

  const [busqueda, setBusqueda] = useState("");
  const [especialistas] = useState(especialistasEjemplo);
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [fecha, setFecha] = useState<Date | null>(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState("");
  const [medicoSeleccionado, setMedicoSeleccionado] = useState("");

  // Horas de ejemplo
  const horasDisponibles = [
    "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "16:00", "17:00"
  ];

  const filtrarEspecialistas = especialistas.filter((medico) =>
    medico.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    medico.especialidad.toLowerCase().includes(busqueda.toLowerCase())
  );

  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);

  const solicitarCita = () => {
    if (!fecha || !horaSeleccionada || !medicoSeleccionado) return;
    setMostrarConfirmacion(true);
  };

  const confirmarCita = () => {
    const medico = especialistas.find(m => m.nombre === medicoSeleccionado);
    const fechaStr = fecha instanceof Date ? fecha.toLocaleDateString() : "";
    alert(`Cita solicitada con ${medico?.nombre} (${medico?.especialidad}) para el ${fechaStr} a las ${horaSeleccionada}`);
    setMostrarCalendario(false);
    setFecha(null);
    setHoraSeleccionada("");
    setMedicoSeleccionado("");
    setMostrarConfirmacion(false);
  };

  const cancelarConfirmacion = () => {
    setMostrarConfirmacion(false);
  };


  // Evitar error de hidratación SSR/CSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  // Los hooks siempre se llaman, pero solo se usan si mounted
  const isTabletOrMobileValue = useMediaQuery({ query: '(max-width: 1024px)' });
  // const isMobileValue = useMediaQuery({ query: '(max-width: 700px)' });
  const isTabletOrMobile = mounted ? isTabletOrMobileValue : false;
  // const isMobile = mounted ? isMobileValue : false;

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
      <div className="w-full max-w-6xl mx-auto pt-4 px-2 md:px-6">
        <TopActions />
      </div>
      {mostrarConfirmacion && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]">
          <div className="bg-white rounded-xl p-8 shadow-xl min-w-[320px] max-w-[400px] text-gray-900 overflow-x-hidden">
            <h2 className="mb-4 text-center text-lg font-bold">Confirmar cita</h2>
            <div className="mb-3 text-sm">
              <strong>Médico:</strong> {medicoSeleccionado}<br/>
              <strong>Especialidad:</strong> {especialistas.find(m => m.nombre === medicoSeleccionado)?.especialidad}<br/>
              <strong>Fecha:</strong> {fecha instanceof Date ? fecha.toLocaleDateString() : ""}<br/>
              <strong>Hora:</strong> {horaSeleccionada}
            </div>
            <div className="flex justify-center gap-4">
              <button
                className="bg-green-700 hover:bg-green-800 text-white rounded-md px-6 py-2 font-semibold transition"
                onClick={confirmarCita}
              >
                Confirmar
              </button>
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md px-6 py-2 font-semibold transition"
                onClick={cancelarConfirmacion}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="w-full max-w-6xl px-2 md:px-6 py-6">
        <div className="flex items-center justify-between h-16 bg-white/70 rounded-t-xl shadow-sm px-4">
          <div className="flex flex-col items-start justify-center leading-tight">
            <span className="text-base text-blue-700 font-normal">Bienvenido,</span>
             <span className="text-xl font-bold text-blue-700">{usuario.nombre}</span>
          </div>
          <div className="flex items-center gap-2">
            <Image src={usuario.avatar} alt="avatar usuario" className="w-8 h-8 rounded-full border-2 border-blue-500 bg-white" width={42} height={42} />
            <div className="flex items-center gap-2 ml-2">
              <button type="button" className="text-blue-600 hover:underline text-xs" onClick={abrirEditarPerfil}>Ver perfil</button>
              <a href="/login" className="text-blue-600 hover:underline text-xs">Cerrar sesión</a>
            </div>
          </div>
      {/* Modal de edición de perfil */}
      {mostrarEditarPerfil && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-[9999]">
          <div className="bg-white rounded-xl p-4 sm:p-8 shadow-xl w-full max-w-xs sm:max-w-md text-gray-900 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl" onClick={cerrarEditarPerfil} aria-label="Cerrar">×</button>
            <h2 className="mb-4 text-center text-lg font-bold">Editar Perfil</h2>
            <form onSubmit={guardarPerfil} className="flex flex-col gap-4 w-full">
              <div className="flex flex-col items-center gap-2 w-full">
                <Image src={formPerfil.avatar} alt="avatar" width={64} height={64} className="rounded-full border-2 border-blue-400 bg-white" />
                <input
                  type="url"
                  className="w-full border border-blue-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-xs"
                  placeholder="URL de foto de perfil"
                  value={formPerfil.avatar}
                  onChange={e => setFormPerfil(f => ({ ...f, avatar: e.target.value }))}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="text"
                  className="w-full sm:w-1/2 border border-blue-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Nombre"
                  value={formPerfil.nombre}
                  onChange={e => setFormPerfil(f => ({ ...f, nombre: e.target.value }))}
                  required
                />
                <input
                  type="text"
                  className="w-full sm:w-1/2 border border-blue-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Apellido"
                  value={formPerfil.apellido}
                  onChange={e => setFormPerfil(f => ({ ...f, apellido: e.target.value }))}
                  required
                />
              </div>
              <input
                type="email"
                className="w-full border border-blue-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Correo electrónico"
                value={formPerfil.email}
                onChange={e => setFormPerfil(f => ({ ...f, email: e.target.value }))}
                required
                disabled
              />
              <div className="flex justify-center gap-4 mt-2 w-full">
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-md px-6 py-2 font-semibold transition disabled:opacity-60"
                  disabled={cargandoPerfil}
                >
                  {cargandoPerfil ? 'Guardando...' : 'Guardar cambios'}
                </button>
                <button
                  type="button"
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-md px-6 py-2 font-semibold transition"
                  onClick={cerrarEditarPerfil}
                  disabled={cargandoPerfil}
                >
                  Cancelar
                </button>
              </div>
              {mensajePerfil && <div className="text-green-600 text-center font-semibold mt-2">{mensajePerfil}</div>}
            </form>
          </div>
        </div>
      )}
        </div>
        <div className="bg-white rounded-b-xl shadow-xl p-4 md:p-8 flex flex-row gap-8 mt-0 overflow-x-auto">
          <div className="hidden md:flex flex-col min-w-[180px] max-w-[220px] pr-2 border-r-0 relative">
            {/* Línea lateral derecha con gradiente */}
            <div className="absolute top-0 right-0 h-full w-0.5 rounded-r-xl bg-gradient-to-b from-blue-600 to-green-500" style={{pointerEvents:'none'}} />
            <div className="font-bold text-blue-700 mb-2">Menú</div>
            <div className="h-px bg-blue-200 mb-2" />
            <nav className="flex flex-col gap-2">
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'inicio' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('inicio')}>Inicio</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'citas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('citas')}>Mis Citas</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'especialistas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('especialistas')}>Especialistas</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'Reunion' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('Reunion')}>Reuniones</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'pagos' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('pagos')}>Pagos</button>
              <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'billing' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => setVista('billing')}>Billing</button>
            </nav>
          </div>
          <div className="flex-1">
            {/* Menú móvil */}
            {mounted && isTabletOrMobile && (
              <div className="md:hidden mb-4">
                <button
                  className="text-blue-700 text-2xl p-2 rounded-lg border border-blue-200 bg-white shadow-sm"
                  aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
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
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'inicio' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('inicio'); setMenuAbierto(false); }}>Inicio</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'citas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('citas'); setMenuAbierto(false); }}>Mis Citas</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'especialistas' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('especialistas'); setMenuAbierto(false); }}>Especialistas</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'Reunion' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('Reunion'); setMenuAbierto(false); }}>Reuniones</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'pagos' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('pagos'); setMenuAbierto(false); }}>Pagos</button>
                    <button className={`text-left px-3 py-2 rounded-lg font-medium transition ${vista === 'billing' ? 'bg-blue-100 text-blue-700' : 'hover:bg-blue-50 text-gray-700'}`} onClick={() => { setVista('billing'); setMenuAbierto(false); }}>Billing</button>
                  </nav>
                )}
              </div>
            )}
            {/* Vistas dinámicas */}
            {vista === 'inicio' && (
              <>
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                  <input
                    className="w-full max-w-xs border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 shadow-sm"
                    type="text"
                    placeholder="Buscar médico o especialidad..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                  />
                </div>
                <div className="flex justify-center mb-8">
                  {!mostrarCalendario ? (
                    <button className="bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold py-3 px-8 rounded-lg shadow-md hover:from-blue-700 hover:to-green-600 transition" onClick={() => setMostrarCalendario(true)}>
                      Solicitar Cita
                    </button>
                  ) : (
                    <div className={styles.calendarBox}>
                      <select
                        className="w-full mb-4 border border-blue-200 rounded-lg px-3 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
                        value={medicoSeleccionado}
                        onChange={e => {
                          setMedicoSeleccionado(e.target.value);
                          setFecha(null);
                          setHoraSeleccionada("");
                          setMostrarCalendario(true);
                        }}
                      >
                        <option value="">Selecciona un médico</option>
                        {especialistas.map((medico, idx) => (
                          <option key={idx} value={medico.nombre}>
                            {medico.nombre} ({medico.especialidad})
                          </option>
                        ))}
                      </select>
                      {medicoSeleccionado && (
                        <>
                          <h2 className="font-bold mb-2">Elige una fecha</h2>
                          <div className="mb-4">
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
                              tileDisabled={({ date, view }) => {
                                if (view === 'month') {
                                  return date.getDay() === 0 || date.getDay() === 6;
                                }
                                return false;
                              }}
                            />
                          </div>
                          {fecha && (
                            <>
                              <div className="flex flex-wrap gap-2 mb-4">
                                {horasDisponibles.map(hora => (
                                  <button
                                    key={hora}
                                    className={`px-4 py-2 rounded-lg border font-medium transition ${horaSeleccionada === hora ? 'bg-blue-600 text-white border-blue-700' : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'}`}
                                    onClick={() => setHoraSeleccionada(hora)}
                                    type="button"
                                  >
                                    {hora}
                                  </button>
                                ))}
                              </div>
                              <div className="flex justify-center gap-2">
                                <button
                                  className="bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold py-2 px-6 rounded-lg shadow hover:from-blue-700 hover:to-green-600 transition"
                                  onClick={solicitarCita}
                                  disabled={!horaSeleccionada}
                                >
                                  Solicitar Cita
                                </button>
                                <button
                                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg px-6 py-2 font-semibold transition"
                                  onClick={() => setMostrarCalendario(false)}
                                  type="button"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="font-bold mb-2 text-blue-700">Médicos Especialistas</div>
                  {filtrarEspecialistas.length === 0 ? (
                    <div className="text-gray-500">No se encontraron especialistas.</div>
                  ) : (
                    filtrarEspecialistas.map((medico, idx) => (
                      <div key={idx} className="py-2 border-b last:border-b-0 text-gray-700">
                        {medico.nombre} — <span className="text-blue-600">{medico.especialidad}</span>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
            {vista === 'citas' && (
              <div className="flex flex-col items-center">
                <h2 className="text-xl font-bold text-blue-700 mb-4">Mis Citas</h2>
                <div className={styles.calendarBox}>
                  <Calendar
                    className={styles.calendarBox}
                    value={citasAgendadas.length > 0 ? citasAgendadas[0].fecha : new Date()}
                    selectRange={false}
                    onClickDay={() => {}}
                    tileContent={({ date, view }) => {
                      if (view === 'month') {
                        const found = citasAgendadas.find(c => c.fecha.toDateString() === date.toDateString());
                        if (found) {
                          return <span className="text-red-600 font-bold">•</span>;
                        }
                      }
                      return null;
                    }}
                  />
                </div>
                <div className="w-full max-w-md flex flex-col gap-3">
                  {citasAgendadas.map((cita, idx) => (
                    <div key={idx} className="bg-blue-50 rounded-lg p-4 shadow-sm">
                      <div className="font-bold text-blue-700 mb-1">{cita.fecha.toLocaleDateString()} — {cita.hora}</div>
                      <div className="text-black"><strong>Médico:</strong> {cita.medico}</div>
                      <div className="text-black"><strong>Especialidad:</strong> {cita.especialidad}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {vista === 'especialistas' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="font-bold mb-2 text-blue-700">Médicos Especialistas</div>
                {filtrarEspecialistas.length === 0 ? (
                  <div className="text-gray-500">No se encontraron especialistas.</div>
                ) : (
                  filtrarEspecialistas.map((medico, idx) => (
                    <div key={idx} className="py-2 border-b last:border-b-0 text-gray-700">
                      {medico.nombre} — <span className="text-blue-600">{medico.especialidad}</span>
                    </div>
                  ))
                )}
              </div>
            )}
            {vista === 'billing' && (
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-2xl font-bold text-blue-800 mb-6">Información de Pago</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Billing Information */}
                  <div className="bg-blue-50 p-5 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-lg text-blue-700">Información de facturación</h3>
                      <button className="text-sm bg-blue-200 hover:bg-blue-300 text-blue-800 font-semibold py-1 px-4 rounded-lg transition-colors">Editar</button>
                    </div>
                    <div className="text-gray-700 space-y-1">
                      <p>Benjamín Torres</p>
                      <p>Calle Falsa 123</p>
                      <p>Madrid, 28001, España</p>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="bg-green-50 p-5 rounded-xl shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-bold text-lg text-green-800">Método de pago</h3>
                      <button className="text-sm bg-green-200 hover:bg-green-300 text-green-900 font-semibold py-1 px-4 rounded-lg transition-colors">Editar</button>
                    </div>
                    <div className="text-gray-700 space-y-1">
                      <p>Tarjeta de Crédito: Visa terminada en 0677</p>
                      <p>Expira 4/2030</p>
                    </div>
                  </div>

                  {/* Coupon */}
                  <div className="bg-yellow-50 p-5 rounded-xl shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-yellow-800">Cupón</h3>
                        <p className="text-gray-600">No tienes un cupón activo.</p>
                      </div>
                      <button className="text-sm bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-2 px-4 rounded-lg transition-colors">Canjear cupón</button>
                    </div>
                  </div>

                  {/* Additional Information */}
                  <div className="bg-gray-100 p-5 rounded-xl shadow-sm lg:col-span-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800">Información adicional</h3>
                        <p className="text-gray-600">No se ha añadido información a tus recibos.</p>
                      </div>
                      <button className="text-sm bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition-colors">Añadir</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Vista de Pagos */}
            {vista === 'pagos' && (
              <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg p-4 sm:p-6 mx-auto overflow-x-auto">
                <h1 className="text-2xl font-bold text-blue-700 mb-6 text-center">Pagos de Citas</h1>
                <table className="min-w-[600px] w-full text-sm border overflow-x-scroll rounded mb-6">
                  <thead className="bg-blue-100 text-blue-900">
                    <tr>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Médico</th>
                      <th className="py-2 px-3">Especialidad</th>
                      <th className="py-2 px-3">Monto</th>
                      <th className="py-2 px-3">Estado</th>
                      <th className="py-2 px-3">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagos.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4 text-gray-800">No hay pagos registrados.</td>
                      </tr>
                    ) : (
                      pagos.map((pago) => (
                        <tr key={pago.id} className="even:bg-blue-50 text-gray-800">
                          <td className="py-2 px-3">{pago.fecha}</td>
                          <td className="py-2 px-3">{pago.medico}</td>
                          <td className="py-2 px-3">{pago.especialidad}</td>
                          <td className="py-2 px-3">${pago.monto}</td>
                          <td className="py-2 px-3 font-semibold">
                            {pago.estado === "Pagado" ? (
                              <span className="text-green-600">Pagado</span>
                            ) : (
                              <span className="text-yellow-600">Pendiente</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {pago.estado === "Pendiente" ? (
                              <button
                                className="bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold py-1 px-4 rounded-lg shadow-md hover:from-blue-700 hover:to-green-600 transition text-xs"
                                onClick={() => realizarPago(pago.id)}
                              >
                                Pagar
                              </button>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
            {/* Vista de Reuniones */}
            {vista === 'Reunion' && (
              <div className="bg-white rounded-xl shadow-md p-2 sm:p-6 flex flex-col gap-6 w-full max-w-full min-w-0">
                <div className="font-bold mb-4 text-blue-700 text-base sm:text-lg text-center sm:text-left break-words min-w-0">Historial de Reuniones</div>
                <div className="w-full overflow-x-auto min-w-0">
                  <table className="w-full min-w-[320px] text-xs sm:text-sm border rounded mb-4 text-gray-800 table-fixed break-words min-w-0">
                    <thead className="bg-blue-100 text-blue-900">
                      <tr>
                        <th className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">Fecha</th>
                        <th className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">Médico</th>
                        <th className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">Especialidad</th>
                        <th className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">Archivo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Ejemplo de reuniones con archivo */}
                      <tr>
                        <td className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">28/07/2025</td>
                        <td className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">Dra. Ana López</td>
                        <td className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">Cardiología</td>
                        <td className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">
                          <a href="/archivos/resultado-280725.pdf" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline break-words min-w-0">Ver archivo</a>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">02/08/2025</td>
                        <td className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">Dr. Juan Pérez</td>
                        <td className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">Dermatología</td>
                        <td className="py-1 px-1 sm:py-2 sm:px-3 break-words min-w-0">
                          <span className="text-gray-400 break-words min-w-0">Sin archivo</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  <div className="flex justify-center w-full">
                    <a
                      href="/reunion"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full max-w-xs sm:w-auto bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold py-2 px-8 rounded-lg shadow-md hover:from-blue-700 hover:to-green-600 transition text-sm sm:text-base text-center"
                    >
                      Iniciar Reunión
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* El footer global se encuentra en layout.tsx y aparecerá siempre al final */}
    </div>
  );
}