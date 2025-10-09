"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import Image from "next/image";
import { getRecetasPaciente, crearReceta, getInfoMedicoActual, type NuevaRecetaData } from '../services/recetas';

interface PacientesSectionProps {
  ctx: any;
}

export default function PacientesSection({ ctx }: PacientesSectionProps) {
  const {
    pacientes,
    loadingCitas,
    errorCitas,
    search,
    setSearch,
    pacientesFiltrados
  } = ctx;

  // Estados para los modales
  const [modalAbierto, setModalAbierto] = useState<string | null>(null);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<any>(null);

  // Funciones para los botones de acción
  const handleHistorialMedico = (paciente: any) => {
    setPacienteSeleccionado(paciente);
    setModalAbierto('historial');
  };

  const handleAgendarCita = (paciente: any) => {
    setPacienteSeleccionado(paciente);
    setModalAbierto('cita');
  };

  const handleVerRecetas = (paciente: any) => {
    setPacienteSeleccionado(paciente);
    setModalAbierto('recetas');
    // Cargar recetas del paciente cuando se abre el modal
    cargarRecetasPaciente(paciente.email);
  };

  // Función para cargar recetas de un paciente desde la base de datos
  const cargarRecetasPaciente = async (emailPaciente: string) => {
    setLoadingRecetas(true);
    try {
      const recetas = await getRecetasPaciente(emailPaciente);
      setRecetasPaciente(recetas);
    } catch (error) {
      console.error('Error cargando recetas:', error);
      setRecetasPaciente([]);
    } finally {
      setLoadingRecetas(false);
    }
  };

  const handleEnviarMensaje = (paciente: any) => {
    setPacienteSeleccionado(paciente);
    setModalAbierto('mensaje');
  };

  const handleReportarPaciente = (paciente: any) => {
    // Abrir modal de reportar en vez de usar confirm/alert
    setPacienteSeleccionado(paciente);
    setModalAbierto('reportar');
  };

  const cerrarModal = () => {
    setModalAbierto(null);
    setPacienteSeleccionado(null);
    // Resetear filtro de citas al cerrar modal
    setFiltroCitas('confirmadas');
  };

  // Función para imprimir el historial médico del paciente (abre nueva ventana y llama a print)
  const handlePrintHistorial = (paciente: any) => {
    if (!paciente) return;
    // Construir contenido inline (sin <html>) para inyectar en la misma página
    const logoPath = '/imagenes/Logo/Logo Transparente/Logo sin fondo Horizontal.png';

    // Escapar texto para evitar HTML inesperado
    const escapeHtml = (str: any) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Preparar datos del paciente y del historial (normalizar claves)
    const normalizeEntry = (e: any) => {
      const out: Record<string, any> = {};
      Object.keys(e || {}).forEach(k => { out[String(k).toLowerCase()] = e[k as keyof typeof e]; });
      return out;
    };

    const defaults = [
      {
        titulo: 'Consulta',
        fecha: '15 Nov 2024',
        sintomas: 'Dolor de cabeza, mareos',
        diagnostico: 'Migraña tensional',
        tratamiento: 'Ibuprofeno 400mg cada 8h',
        observaciones: 'Recomendar reducir estrés y mejorar hábitos de sueño'
      },
      {
        titulo: 'Consulta',
        fecha: '02 Nov 2024',
        sintomas: 'Tos persistente, congestión',
        diagnostico: 'Bronquitis aguda',
        tratamiento: 'Antibióticos, jarabe expectorante',
        observaciones: 'Evolución favorable, continuar tratamiento'
      },
      {
        titulo: 'Examen',
        fecha: '20 Oct 2024',
        tipo: 'Análisis de sangre completo',
        resultados: 'Todos los valores dentro del rango normal',
        observaciones: 'Estado de salud general excelente'
      }
    ];

    const entries: Array<Record<string, any>> = [];
    if (paciente.historial && Array.isArray(paciente.historial) && paciente.historial.length > 0) {
      paciente.historial.forEach((h: any) => entries.push(normalizeEntry(h)));
    }
    // Rellenar con defaults para asegurar 3 entradas si faltan
    for (let i = entries.length; i < 3; i++) {
      entries.push(defaults[i]);
    }

    const consultasHtml = entries.map((c) => {
      const titulo = escapeHtml(c.titulo || c.tipo || 'Consulta');
      const fecha = escapeHtml(c.fecha || c.date || '');

      const parts: string[] = [];
      const add = (key: string, label: string) => {
        if (c[key]) parts.push(`<p style="margin:6px 0"><strong>${label}:</strong> ${escapeHtml(c[key])}</p>`);
      };
      add('sintomas', 'Síntomas');
      add('diagnostico', 'Diagnóstico');
      add('tratamiento', 'Tratamiento');
      add('tipo', 'Tipo');
      add('resultados', 'Resultados');
      add('observaciones', 'Observaciones');
      add('resumen', 'Resumen');
      add('descripcion', 'Descripción');
      add('notas', 'Notas');

      return `
        <div style="border:1px solid #e5e7eb; padding:12px; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:#111827">${titulo}</strong>
            <span style="font-size:12px; color:#6b7280">${fecha}</span>
          </div>
          <div style="margin-top:8px; color:#374151">${parts.join('')}</div>
        </div>
      `;
    }).join('<div style="height:10px"></div>');

    // Escapar y preparar campos del paciente (incluyendo contacto de emergencia con teléfono)
    const nombrePaciente = escapeHtml(paciente.nombre || '—');
    const edadPaciente = escapeHtml(paciente.edad || 'N/A');
    const pesoPaciente = escapeHtml(paciente.peso || 'N/A');
    const alturaPaciente = escapeHtml(paciente.altura || 'N/A');
    const tipoSangrePaciente = escapeHtml(paciente.tipoSangre || paciente.tipo_sangre || 'N/A');
    const estatusMedico = escapeHtml(paciente.estatus || paciente.estado || paciente.estadoMedico || '');
    const emergencia = paciente.contactoEmergencia || paciente.contacto_emergencia || paciente.emergencyContact || {};

    // Build per-entry HTML generator
    const renderEntry = (c: any) => {
      const titulo = escapeHtml(c.titulo || c.tipo || 'Consulta');
      const fecha = escapeHtml(c.fecha || c.date || '');
      const parts: string[] = [];
      const add = (key: string, label: string) => { if (c[key]) parts.push(`<p style="margin:6px 0"><strong>${label}:</strong> ${escapeHtml(c[key])}</p>`); };
      add('sintomas', 'Síntomas'); add('diagnostico', 'Diagnóstico'); add('tratamiento', 'Tratamiento'); add('tipo', 'Tipo'); add('resultados', 'Resultados'); add('observaciones', 'Observaciones'); add('resumen', 'Resumen'); add('descripcion', 'Descripción'); add('notas', 'Notas');

      return `
        <div style="border:1px solid #e5e7eb; padding:12px; border-radius:8px;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <strong style="color:#111827">${titulo}</strong>
            <span style="font-size:12px; color:#6b7280">${fecha}</span>
          </div>
          <div style="margin-top:8px; color:#374151">${parts.join('')}</div>
        </div>
      `;
    };

    // Build a single container: metadata + sequential entries.
    // Let the browser paginate naturally: show as much as fits on the first page,
    // and continue remaining entries on the next pages. Each entry uses
    // avoid-break to avoid splitting an entry across pages.
    const entriesHtml = entries.map(e => `<div class="avoid-break">${renderEntry(e)}</div>`).join('<div style="height:10px"></div>');

    const contenidoInner = `
      <div id="va-print-inner" style="padding:24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color:#1f2937; box-sizing:border-box;">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e5e7eb; padding-bottom:12px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${logoPath}" alt="VirtualAid" style="height:48px; object-fit:contain;" />
            <div style="font-size:14px; color:#374151;"></div>
          </div>
          <div style="text-align:right; font-size:12px; color:#374151;"><div>${new Date().toLocaleDateString()}</div></div>
        </div>

        <section style="margin-bottom:12px;">
          <h2 style="margin:0 0 6px 0; font-size:16px;">Paciente</h2>
          <div style="background:#fff; border:1px solid #e5e7eb; padding:12px; border-radius:8px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            <div><strong>Nombre:</strong> ${nombrePaciente}</div>
            <div><strong>Edad:</strong> ${edadPaciente}</div>
            <div><strong>Peso:</strong> ${pesoPaciente}</div>
            <div><strong>Altura:</strong> ${alturaPaciente}</div>
            <div><strong>Tipo de sangre:</strong> ${tipoSangrePaciente}</div>
            <div><strong>Estatus médico:</strong> ${estatusMedico || '—'}</div>
          </div>
        </section>

        <section>
          <h2 style="font-size:16px; margin-bottom:8px;">Historial de Consultas</h2>
          <div style="display:flex; flex-direction:column; gap:12px;">
            ${entriesHtml}
          </div>
        </section>

        <footer style="margin-top:20px; font-size:12px; color:#6b7280;">Generado desde VirtualAid</footer>
      </div>
    `;

    // Crear reglas temporales para impresión que oculten todo menos nuestro contenedor
    // Antes de inyectar, eliminar cualquier contenedor/estilo previo para evitar duplicados en páginas
    try {
      const prevStyle = document.querySelector('style[data-va-print]');
      if (prevStyle && prevStyle.parentNode) prevStyle.parentNode.removeChild(prevStyle);
      const prevContainer = document.getElementById('va-print-container');
      if (prevContainer && prevContainer.parentNode) prevContainer.parentNode.removeChild(prevContainer);

      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-va-print', 'true');
      styleEl.innerHTML = `
        @page { size: auto; margin: 10mm }
        @media print {
          html, body { height: auto !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          #va-print-container, #va-print-container * { visibility: visible !important; }
          #va-print-container { position: absolute; left: 0; top: 0; width: 100%; box-sizing: border-box; padding: 0; margin: 0; }
          .avoid-break { break-inside: avoid; page-break-inside: avoid; -webkit-column-break-inside: avoid; }
          /* Reduce default margins that may create a second blank page */
          body { -webkit-print-color-adjust: exact; }
        }
      `;

      document.head.appendChild(styleEl);
      const container = document.createElement('div');
      container.id = 'va-print-container';
      container.innerHTML = contenidoInner;
      document.body.appendChild(container);

      // Forzar reflow y luego imprimir
      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error('Error al imprimir en la misma página', err);
          alert('No se pudo iniciar la impresión. Usa el diálogo de impresión del navegador (Ctrl/Cmd+P) o revisa la configuración.');
        }

        // Limpiar después de impresión
        setTimeout(() => {
          try { if (container.parentNode) container.parentNode.removeChild(container); } catch (e) { /* ignore */ }
          try { if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl); } catch (e) { /* ignore */ }
        }, 500);
      }, 250);
    } catch (err) {
      console.error('Error inyectando contenido para impresión', err);
      alert('No se pudo preparar la vista de impresión. Intenta usar el menú del navegador.');
    }
  };

  // Función para imprimir recetas médicas en PDF
  const handlePrintRecetas = (paciente: any) => {
    if (!paciente) return;
    
    const logoPath = '/imagenes/Logo/Logo Transparente/Logo sin fondo Horizontal.png';

    // Escapar texto para evitar HTML inesperado
    const escapeHtml = (str: any) => {
      if (str === null || str === undefined) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    };

    // Usar las recetas reales cargadas desde la base de datos
    const recetas = recetasPaciente.length > 0 ? recetasPaciente : [];

    if (recetas.length === 0) {
      alert('No hay recetas para este paciente. Por favor, cree una receta antes de imprimir.');
      return;
    }

    const recetasHtml = recetas.map((receta: any, index: number) => {
      return `
        <div style="border: 2px solid ${receta.estado === 'Activa' ? '#10b981' : '#f59e0b'}; padding: 16px; border-radius: 12px; margin-bottom: 16px; background: ${receta.estado === 'Activa' ? '#f0fdf4' : '#fffbeb'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; color: #1f2937; font-size: 18px; font-weight: bold;">${escapeHtml(receta.medicamento)}</h3>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: ${receta.estado === 'Activa' ? '#10b981' : '#f59e0b'}; color: white; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold;">${escapeHtml(receta.estado)}</span>
              <span style="color: #6b7280; font-size: 12px;">${escapeHtml(receta.fecha)}</span>
            </div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
            <div>
              <p style="margin: 4px 0; color: #374151;"><strong>Dosis:</strong> ${escapeHtml(receta.dosis)}</p>
              <p style="margin: 4px 0; color: #374151;"><strong>Duración:</strong> ${escapeHtml(receta.duracion)}</p>
              <p style="margin: 4px 0; color: #374151;"><strong>Cantidad:</strong> ${escapeHtml(receta.cantidad)}</p>
            </div>
            <div>
              <p style="margin: 4px 0; color: #374151;"><strong>Con comidas:</strong> ${escapeHtml(receta.conComidas)}</p>
              <p style="margin: 4px 0; color: #374151;"><strong>Indicaciones:</strong> ${escapeHtml(receta.indicaciones)}</p>
              <p style="margin: 4px 0; color: #374151;"><strong>ID Receta:</strong> ${escapeHtml(receta.id)}</p>
            </div>
          </div>
        </div>
      `;
    }).join('');

    const nombrePaciente = escapeHtml(paciente.nombre || '—');
    const edadPaciente = escapeHtml(paciente.edad || 'N/A');
    const fechaActual = new Date().toLocaleDateString('es-ES', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const contenidoInner = `
      <div id="va-print-recetas" style="padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; color: #1f2937; box-sizing: border-box;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 16px; margin-bottom: 24px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <img src="${logoPath}" alt="VirtualAid" style="height: 60px; object-fit: contain;" />
            <div>
              <h1 style="margin: 0; color: #7c3aed; font-size: 24px; font-weight: bold;">Recetas Médicas</h1>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">Sistema de Gestión Médica</p>
            </div>
          </div>
          <div style="text-align: right;">
            <div style="color: #374151; font-size: 14px; font-weight: bold;">Fecha: ${fechaActual}</div>
          </div>
        </div>

        <div style="margin-bottom: 24px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px;">
          <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #1f2937;">Información del Paciente</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div><strong>Nombre:</strong> ${nombrePaciente}</div>
            <div><strong>Edad:</strong> ${edadPaciente} años</div>
            <div><strong>Fecha de emisión:</strong> ${fechaActual}</div>
            <div><strong>Total de recetas:</strong> ${recetas.length}</div>
          </div>
        </div>

        <div style="margin-bottom: 24px;">
          <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #1f2937;">Prescripciones Médicas</h2>
          ${recetasHtml}
        </div>

        <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Documento generado desde VirtualAid</p>
              <p style="margin: 4px 0 0 0; font-size: 12px; color: #6b7280;">Para consultas médicas: contacte a su médico tratante</p>
            </div>
            <div style="text-align: right;">
              <div style="border-top: 1px solid #9ca3af; width: 200px; margin-bottom: 4px;"></div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Firma y sello médico</p>
            </div>
          </div>
        </div>
      </div>
    `;

    try {
      const prevStyle = document.querySelector('style[data-va-print-recetas]');
      if (prevStyle && prevStyle.parentNode) prevStyle.parentNode.removeChild(prevStyle);
      const prevContainer = document.getElementById('va-print-recetas-container');
      if (prevContainer && prevContainer.parentNode) prevContainer.parentNode.removeChild(prevContainer);

      const styleEl = document.createElement('style');
      styleEl.setAttribute('data-va-print-recetas', 'true');
      styleEl.innerHTML = `
        @page { size: auto; margin: 15mm }
        @media print {
          html, body { height: auto !important; margin: 0 !important; padding: 0 !important; }
          body * { visibility: hidden !important; }
          #va-print-recetas-container, #va-print-recetas-container * { visibility: visible !important; }
          #va-print-recetas-container { position: absolute; left: 0; top: 0; width: 100%; box-sizing: border-box; padding: 0; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
        }
      `;

      document.head.appendChild(styleEl);
      const container = document.createElement('div');
      container.id = 'va-print-recetas-container';
      container.innerHTML = contenidoInner;
      document.body.appendChild(container);

      setTimeout(() => {
        try {
          window.print();
        } catch (err) {
          console.error('Error al imprimir recetas', err);
          alert('No se pudo iniciar la impresión de recetas. Usa Ctrl/Cmd+P para imprimir.');
        }

        setTimeout(() => {
          try { if (container.parentNode) container.parentNode.removeChild(container); } catch (e) { /* ignore */ }
          try { if (styleEl.parentNode) styleEl.parentNode.removeChild(styleEl); } catch (e) { /* ignore */ }
        }, 500);
      }, 250);
    } catch (err) {
      console.error('Error preparando impresión de recetas', err);
      alert('No se pudo preparar la vista de impresión de recetas.');
    }
  };

  // Función para manejar nueva receta
  const handleNuevaReceta = () => {
    setModalNuevaReceta(true);
  };

  // Función para guardar nueva receta
  const handleGuardarReceta = async () => {
    // Validar campos requeridos
    if (!nuevaReceta.medicamento || !nuevaReceta.dosis || !nuevaReceta.duracion) {
      alert('Por favor complete los campos requeridos: Medicamento, Dosis y Duración');
      return;
    }

    if (!pacienteSeleccionado) {
      alert('Error: No hay paciente seleccionado');
      return;
    }

    try {
      // Obtener información del médico actual
      const medicoInfo = getInfoMedicoActual();
      
      // Preparar datos de la receta
      const recetaData: NuevaRecetaData = {
        medicamento: nuevaReceta.medicamento,
        dosis: nuevaReceta.dosis,
        frecuencia: nuevaReceta.frecuencia,
        duracion: nuevaReceta.duracion,
        cantidad: nuevaReceta.cantidad,
        conComidas: nuevaReceta.conComidas,
        indicaciones: nuevaReceta.indicaciones,
        medico: medicoInfo.medico,
        medicoEmail: medicoInfo.medicoEmail
      };

      // Crear la receta en la base de datos
      const resultado = await crearReceta(pacienteSeleccionado.email, recetaData);

      if (resultado.success) {
        // Recargar las recetas del paciente
        await cargarRecetasPaciente(pacienteSeleccionado.email);
        
        // Limpiar formulario y cerrar modal
        setNuevaReceta({
          medicamento: '',
          dosis: '',
          frecuencia: '',
          duracion: '',
          cantidad: '',
          conComidas: '',
          indicaciones: ''
        });
        setModalNuevaReceta(false);
        alert('Receta guardada exitosamente en la base de datos');
      } else {
        alert(`Error guardando receta: ${resultado.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error creando receta:', error);
      alert('Error al crear la receta. Por favor intente nuevamente.');
    }
  };

  // Estado para el modal de reportar
  const [reportReason, setReportReason] = useState<string>('');
  const [confirmStage, setConfirmStage] = useState<boolean>(false);

  // Estado para el filtro de citas
  const [filtroCitas, setFiltroCitas] = useState<string>('confirmadas');

  // Estados para el modal de nueva receta
  const [modalNuevaReceta, setModalNuevaReceta] = useState<boolean>(false);
  const [nuevaReceta, setNuevaReceta] = useState({
    medicamento: '',
    dosis: '',
    frecuencia: '',
    duracion: '',
    cantidad: '',
    conComidas: '',
    indicaciones: ''
  });

  // Estados para las recetas del paciente
  const [recetasPaciente, setRecetasPaciente] = useState<any[]>([]);
  const [loadingRecetas, setLoadingRecetas] = useState<boolean>(false);

  // Bloquear scroll del body cuando un modal esté abierto
  useEffect(() => {
    if (!modalAbierto) return;

    const originalOverflow = document.body.style.overflow;
    const originalPaddingRight = document.body.style.paddingRight;

    // Compensar el ancho del scrollbar para evitar salto de layout
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }

    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow || '';
      document.body.style.paddingRight = originalPaddingRight || '';
    };
  }, [modalAbierto]);


  return (
    <>
      <div className="bg-gradient-to-br from-white via-purple-50/40 to-pink-50/30 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-200/60 flex flex-col overflow-hidden min-h-[80vh]">
      {/* Header mejorado */}
      <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-700 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-transparent"></div>
        <div className="relative flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
            <span className="text-2xl">👥</span>
          </div>
          <div>
            <h2 className="font-bold text-white text-xl tracking-wide">Mis Pacientes</h2>
            <p className="text-purple-100 text-sm">{pacientes.length} pacientes registrados</p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 flex flex-col min-h-0">
        {/* Barra de búsqueda mejorada */}
        <div className="mb-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 shadow-sm">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-lg">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Buscar paciente por nombre o motivo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white/90 backdrop-blur-sm placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-sm font-medium"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                <span className="text-gray-400 hover:text-gray-600 text-lg">✕</span>
              </button>
            )}
          </div>
          {search && (
            <div className="mt-2 text-sm text-purple-600">
              <span className="font-medium">{pacientesFiltrados.length}</span> resultado(s) encontrado(s)
            </div>
          )}
        </div>

        {/* Contenido principal */}
        <div className="flex-1 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-sm min-h-0 overflow-hidden">
          {loadingCitas ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 h-12 w-12 mb-4"></div>
              <p className="text-purple-600 font-semibold text-lg">Cargando pacientes...</p>
              <p className="text-gray-500 text-sm mt-2">Por favor espere un momento</p>
            </div>
          ) : errorCitas ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-red-100 rounded-full mb-4">
                <span className="text-2xl text-red-600">⚠️</span>
              </div>
              <p className="text-red-700 font-semibold text-lg">Error al cargar pacientes</p>
              <p className="text-red-600 text-sm mt-2 text-center max-w-md">{errorCitas}</p>
              <button className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg transition-colors text-sm font-semibold">
                Reintentar
              </button>
            </div>
          ) : pacientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-purple-100 rounded-full mb-4">
                <span className="text-3xl text-purple-500">👥</span>
              </div>
              <p className="text-purple-700 font-semibold text-lg">No hay pacientes registrados</p>
              <p className="text-gray-500 text-sm mt-2 text-center max-w-md">
                Cuando tenga pacientes asignados, aparecerán aquí con toda la información detallada.
              </p>
            </div>
          ) : pacientesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="p-4 bg-yellow-100 rounded-full mb-4">
                <span className="text-3xl text-yellow-500">🔍</span>
              </div>
              <p className="text-yellow-700 font-semibold text-lg">No se encontraron pacientes</p>
              <p className="text-gray-500 text-sm mt-2 text-center max-w-md">
                Intente con otros términos de búsqueda o revise la lista completa.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 max-h-[60vh] overflow-y-auto">
              {pacientesFiltrados.map((p: any, idx: number) => {
                let avatarUrl = p.avatar || '';
                if (avatarUrl.startsWith('/perfiles/')) {
                  // Ya tiene prefijo correcto
                } else if (avatarUrl.startsWith('/storage/')) {
                  // Ya tiene prefijo correcto
                } else if (avatarUrl.startsWith('http')) {
                  // URL absoluta, ok
                } else if (avatarUrl) {
                  // Solo agregar /storage/ si no lo tiene
                  avatarUrl = `/storage/${avatarUrl}`;
                } else {
                  avatarUrl = 'https://randomuser.me/api/portraits/lego/1.jpg';
                }
                
                return (
                  <div key={idx} className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Avatar del paciente */}
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border-3 border-purple-200 shadow-lg bg-white">
                          <Image
                            src={avatarUrl}
                            alt={p.nombre}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                            onError={(e) => { 
                              (e.target as HTMLImageElement).src = 'https://randomuser.me/api/portraits/lego/1.jpg'; 
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                          <span className="text-xs text-white">✓</span>
                        </div>
                      </div>
                      
                      {/* Información del paciente */}
                      <div className="flex-1 min-w-0">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Nombre y edad */}
                          <div className="md:col-span-1">
                            <h3 className="font-bold text-gray-800 text-lg leading-tight mb-1">
                              {p.nombre}
                            </h3>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <span>👤</span>
                              <span>{p.edad} años</span>
                            </div>
                          </div>
                          
                          {/* Motivo de consulta - mejorado */}
                          <div className="md:col-span-1">
                            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 border border-purple-200 shadow-sm">
                              <div className="text-sm font-semibold text-purple-800 mb-2 flex items-center gap-2">
                                <span className="text-purple-600 text-base">🏥</span>
                                <span>Motivo de consulta</span>
                              </div>
                              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                {p.motivo || 'No especificado'}
                              </p>
                            </div>
                          </div>
                          
                          {/* Botones de acción */}
                          <div className="md:col-span-1">
                            <div className="flex flex-col gap-2">
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => handleHistorialMedico(p)}
                                  className="px-3 py-2 bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 justify-center hover:bg-blue-600 transition-colors cursor-pointer"
                                  title="Ver historial médico"
                                >
                                  <span>📋</span>
                                  <span>Historial</span>
                                </button>

                                <button
                                  onClick={() => handleAgendarCita(p)}
                                  className="px-3 py-2 bg-green-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 justify-center hover:bg-green-600 transition-colors cursor-pointer"
                                  title="Agendar nueva cita"
                                >
                                  <span>📅</span>
                                  <span>Cita</span>
                                </button>

                                <button
                                  onClick={() => handleVerRecetas(p)}
                                  className="px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 justify-center hover:bg-orange-600 transition-colors cursor-pointer"
                                  title="Ver recetas médicas"
                                >
                                  <span>💊</span>
                                  <span>Recetas</span>
                                </button>

                                <button
                                  onClick={() => handleReportarPaciente(p)}
                                  className="px-3 py-2 bg-red-500 text-white rounded-lg text-xs font-semibold shadow-sm flex items-center gap-1 justify-center hover:bg-red-600 transition-colors cursor-pointer"
                                  title="Reportar como caso urgente"
                                >
                                  <span>⚠️</span>
                                  <span>Reportar</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Información adicional y estadísticas */}
        {pacientes.length > 0 && (
          <div className="mt-6 space-y-4">
            {/* Estadísticas principales */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{pacientes.length}</div>
                  <div className="text-sm text-purple-700 font-medium">Total Pacientes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{Math.floor(pacientes.length * 0.8)}</div>
                  <div className="text-sm text-green-700 font-medium">Pacientes Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{search ? pacientesFiltrados.length : pacientes.length}</div>
                  <div className="text-sm text-blue-700 font-medium">Resultados Mostrados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{Math.floor(pacientes.length * 0.15)}</div>
                  <div className="text-sm text-orange-700 font-medium">Consultas Pendientes</div>
                </div>
              </div>
            </div>
            
            {/* Consejos */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-2xl p-4 border border-indigo-100">
              <div className="flex items-center gap-2 text-sm text-indigo-700">
                <span className="text-lg">💡</span>
                <span className="font-semibold">Consejo:</span>
                <span>Utiliza los botones de acción para gestionar tus pacientes de manera eficiente</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modales */}
      {modalAbierto && pacienteSeleccionado && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-white/20 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={cerrarModal}
          >
            <div 
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header del Modal */}
              <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <span className="text-2xl">
                        {modalAbierto === 'historial' ? '📋' : 
                         modalAbierto === 'cita' ? '📅' :
                         modalAbierto === 'recetas' ? '💊' : '💬'}
                      </span>
                    </div>
                    <div>
                      <h2 className="font-bold text-xl">
                        {modalAbierto === 'historial' ? 'Historial Médico' : 
                         modalAbierto === 'cita' ? 'Agendar Cita' :
                         modalAbierto === 'recetas' ? 'Recetas Médicas' : 'Enviar Mensaje'}
                      </h2>
                      <p className="text-purple-100">{pacienteSeleccionado.nombre}</p>
                    </div>
                  </div>
                  <button 
                    onClick={cerrarModal}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                  >
                    <span className="text-white text-xl">✕</span>
                  </button>
                </div>
              </div>

              {/* Contenido del Modal */}
              <div className="p-6">
                {modalAbierto === 'historial' && (
                  <div className="space-y-6">
                    {/* Información del Paciente */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Información del Paciente</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Nombre:</span>
                          <p className="font-medium">{pacienteSeleccionado.nombre}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Edad:</span>
                          <p className="font-medium">{pacienteSeleccionado.edad} años</p>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-600">Motivo actual:</span>
                          <p className="font-medium">{pacienteSeleccionado.motivo || 'No especificado'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Historial de Consultas */}
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-3">Historial de Consultas</h3>
                      <div className="space-y-3">
                        {/* Consulta simulada */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-blue-600">Consulta General</h4>
                            <span className="text-xs text-gray-500">15/08/2024</span>
                          </div>
                          <p className="text-sm text-gray-700">Revisión rutinaria. Paciente en buen estado general.</p>
                          <p className="text-xs text-gray-500 mt-2">Dr. {ctx.medicoInfo?.nombre || 'Médico'}</p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-orange-600">Control de Seguimiento</h4>
                            <span className="text-xs text-gray-500">02/08/2024</span>
                          </div>
                          <p className="text-sm text-gray-700">Control post-tratamiento. Evolución favorable.</p>
                          <p className="text-xs text-gray-500 mt-2">Dr. {ctx.medicoInfo?.nombre || 'Médico'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {modalAbierto === 'cita' && (
                  <div className="space-y-6">
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h3 className="font-semibold text-blue-800 mb-3">Agendar Nueva Cita</h3>
                      <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                            <input 
                              type="date" 
                              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hora</label>
                            <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                              <option>09:00</option>
                              <option>10:00</option>
                              <option>11:00</option>
                              <option>14:00</option>
                              <option>15:00</option>
                              <option>16:00</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Consulta</label>
                          <select className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option>Consulta General</option>
                            <option>Control de Seguimiento</option>
                            <option>Consulta Especializada</option>
                            <option>Emergencia</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de la Cita</label>
                          <textarea 
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={3}
                            placeholder="Describa el motivo de la consulta..."
                          ></textarea>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button 
                            type="button"
                            onClick={cerrarModal}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="button"
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={() => {
                              alert('Cita agendada exitosamente');
                              cerrarModal();
                            }}
                          >
                            Agendar Cita
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {modalAbierto === 'recetas' && (
                  <div className="space-y-6">
                    <div className="bg-orange-50 rounded-xl p-4">
                      <h3 className="font-semibold text-orange-800 mb-3">Recetas Médicas</h3>
                      <div className="space-y-4">
                        {/* Receta simulada */}
                        <div className="bg-white border border-orange-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-orange-600">Receta #001</h4>
                            <span className="text-xs text-gray-500">Fecha: 15/08/2024</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Medicamento:</span>
                              <p>Ibuprofeno 400mg - Tomar cada 8 horas por 5 días</p>
                            </div>
                            <div>
                              <span className="font-medium">Indicaciones:</span>
                              <p>Tomar después de las comidas. No exceder la dosis.</p>
                            </div>
                          </div>
                        </div>
                        <div className="bg-white border border-orange-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-orange-600">Receta #002</h4>
                            <span className="text-xs text-gray-500">Fecha: 02/08/2024</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div>
                              <span className="font-medium">Medicamento:</span>
                              <p>Vitamina D3 1000UI - Una cápsula diaria</p>
                            </div>
                            <div>
                              <span className="font-medium">Indicaciones:</span>
                              <p>Tomar con el desayuno durante 3 meses.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        onClick={() => alert('Funcionalidad de nueva receta')}
                      >
                        + Nueva Receta
                      </button>
                    </div>
                  </div>
                )}

                {modalAbierto === 'mensaje' && (
                  <div className="space-y-6">
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h3 className="font-semibold text-purple-800 mb-3">Enviar Mensaje</h3>
                      <form className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Asunto</label>
                          <input 
                            type="text" 
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="Escriba el asunto del mensaje..."
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje</label>
                          <textarea 
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            rows={6}
                            placeholder="Escriba su mensaje aquí..."
                          ></textarea>
                        </div>
                        <div>
                          <label className="flex items-center gap-2">
                            <input type="checkbox" className="rounded" />
                            <span className="text-sm text-gray-600">Marcar como importante</span>
                          </label>
                        </div>
                        <div className="flex gap-3 pt-4">
                          <button 
                            type="button"
                            onClick={cerrarModal}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button 
                            type="button"
                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                            onClick={() => {
                              alert('Mensaje enviado exitosamente');
                              cerrarModal();
                            }}
                          >
                            Enviar Mensaje
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>

    {/* Modales - Ahora fuera del contenedor principal */}
    {modalAbierto === 'historial' && pacienteSeleccionado && (
      <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[80vh] sm:max-h-[85vh] lg:max-h-[90vh] overflow-y-auto mx-4 sm:mx-6 lg:mx-8">
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 sm:p-6 lg:p-8 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Historial Médico</h3>
              <button
                onClick={() => setModalAbierto(null)}
                className="text-white hover:text-gray-200 text-2xl font-bold cursor-pointer self-end sm:self-auto"
              >
                ×
              </button>
            </div>
            <p className="text-blue-100 mt-2 text-sm sm:text-base">
              Paciente: {pacienteSeleccionado.nombre}
            </p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Información Personal</h4>
                <p><strong>Edad:</strong> {pacienteSeleccionado.edad} años</p>
                <p><strong>Peso:</strong> {pacienteSeleccionado.peso || '70 kg'}</p>
                <p><strong>Altura:</strong> {pacienteSeleccionado.altura || '1.75 m'}</p>
                <p><strong>Tipo de Sangre:</strong> {pacienteSeleccionado.tipoSangre || 'O+'}</p>
              </div>
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Contacto de Emergencia</h4>
                <p><strong>Nombre:</strong> Ana García</p>
                <p><strong>Relación:</strong> Esposa</p>
                <p><strong>Teléfono:</strong> +34 655 987 321</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                  Consulta - 15 Nov 2024
                </h4>
                <p className="text-gray-600 mb-2"><strong>Síntomas:</strong> Dolor de cabeza, mareos</p>
                <p className="text-gray-600 mb-2"><strong>Diagnóstico:</strong> Migraña tensional</p>
                <p className="text-gray-600 mb-2"><strong>Tratamiento:</strong> Ibuprofeno 400mg cada 8h</p>
                <p className="text-gray-600"><strong>Observaciones:</strong> Recomendar reducir estrés y mejorar hábitos de sueño</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
                  Consulta - 02 Nov 2024
                </h4>
                <p className="text-gray-600 mb-2"><strong>Síntomas:</strong> Tos persistente, congestión</p>
                <p className="text-gray-600 mb-2"><strong>Diagnóstico:</strong> Bronquitis aguda</p>
                <p className="text-gray-600 mb-2"><strong>Tratamiento:</strong> Antibióticos, jarabe expectorante</p>
                <p className="text-gray-600"><strong>Observaciones:</strong> Evolución favorable, continuar tratamiento</p>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                  Examen - 20 Oct 2024
                </h4>
                <p className="text-gray-600 mb-2"><strong>Tipo:</strong> Análisis de sangre completo</p>
                <p className="text-gray-600 mb-2"><strong>Resultados:</strong> Todos los valores dentro del rango normal</p>
                <p className="text-gray-600"><strong>Observaciones:</strong> Estado de salud general excelente</p>
              </div>
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button
                onClick={() => setModalAbierto(null)}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
              <button onClick={() => handlePrintHistorial(pacienteSeleccionado)} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                Imprimir Historial
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {modalAbierto === 'cita' && pacienteSeleccionado && (
      <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 lg:p-8">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg lg:max-w-2xl xl:max-w-3xl mx-4 sm:mx-6 lg:mx-8 max-h-[80vh] sm:max-h-[70vh] lg:max-h-[85vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4 sm:p-6 lg:p-8 rounded-t-2xl">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Agendar Cita</h3>
              <button
                onClick={() => setModalAbierto(null)}
                className="text-white hover:text-gray-200 text-2xl font-bold cursor-pointer self-end sm:self-auto"
              >
                ×
              </button>
            </div>
            <p className="text-green-100 mt-2 text-sm sm:text-base">
              Paciente: {pacienteSeleccionado.nombre}
            </p>
          </div>

          <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Estadísticas de citas al principio */}
            {(() => {
              const citas = pacienteSeleccionado.citas || [
                { estado: 'confirmada' },
                { estado: 'completada' },
                { estado: 'completada' },
                { estado: 'cancelada' }
              ];
              
              const totalCitas = citas.length;
              const completadas = citas.filter((c: any) => c.estado === 'completada').length;
              const proximas = citas.filter((c: any) => c.estado === 'confirmada' || c.estado === 'programada').length;
              const canceladas = citas.filter((c: any) => c.estado === 'cancelada').length;

              return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="text-lg font-bold text-gray-700">{totalCitas}</div>
                    <div className="text-xs text-gray-600">Total</div>
                  </div>
                  <div className="bg-green-100 p-3 rounded-lg">
                    <div className="text-lg font-bold text-green-700">{proximas}</div>
                    <div className="text-xs text-green-600">Próximas</div>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <div className="text-lg font-bold text-blue-700">{completadas}</div>
                    <div className="text-xs text-blue-600">Completadas</div>
                  </div>
                  <div className="bg-red-100 p-3 rounded-lg">
                    <div className="text-lg font-bold text-red-700">{canceladas}</div>
                    <div className="text-xs text-red-600">Canceladas</div>
                  </div>
                </div>
              );
            })()}

            {/* Citas del Paciente */}
            <div>
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                    <span className="text-lg text-white">📅</span>
                  </div>
                  <h4 className="font-bold text-gray-800 text-lg">
                    Citas del Paciente
                  </h4>
                </div>
                
                {/* Filtro de citas mejorado */}
                <div className="flex items-center gap-3 bg-gradient-to-r from-gray-50 to-blue-50 p-3 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center gap-2">
                    <div className="p-1 bg-blue-100 rounded-lg">
                      <span className="text-sm">🔍</span>
                    </div>
                    <label className="text-sm font-semibold text-gray-700">Filtrar por:</label>
                  </div>
                  <select 
                    value={filtroCitas}
                    onChange={(e) => setFiltroCitas(e.target.value)}
                    className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700 focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer"
                  >
                    <option value="todas">📋 Todas las citas</option>
                    <option value="proximas">⏰ Próximas</option>
                    <option value="completadas">✅ Completadas</option>
                    <option value="canceladas">❌ Canceladas</option>
                    <option value="confirmadas">✔️ Confirmadas</option>
                  </select>
                </div>
              </div>
              
              
              <div className="bg-white border-2 border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {/* Citas desde la base de datos - se pueden obtener del paciente seleccionado */}
                  {(() => {
                  // Función para filtrar citas
                  const filtrarCitas = (citas: any[]) => {
                    if (filtroCitas === 'todas') return citas;
                    
                    return citas.filter((cita: any) => {
                      const fechaCita = new Date(cita.fecha);
                      const esProxima = fechaCita > new Date();
                      const estado = cita.estado || (esProxima ? 'programada' : 'completada');
                      
                      switch (filtroCitas) {
                        case 'proximas':
                          return esProxima || estado === 'programada' || estado === 'confirmada';
                        case 'completadas':
                          return estado === 'completada';
                        case 'canceladas':
                          return estado === 'cancelada';
                        case 'confirmadas':
                          return estado === 'confirmada';
                        default:
                          return true;
                      }
                    });
                  };

                  // Obtener citas (de DB o ejemplos)
                  const citasOriginales = pacienteSeleccionado.citas && pacienteSeleccionado.citas.length > 0 
                    ? pacienteSeleccionado.citas 
                    : [
                        {
                          fecha: '2024-12-20',
                          hora: '10:00 AM',
                          tipo: 'Consulta de Seguimiento',
                          motivo: 'Revisión de tratamiento',
                          estado: 'confirmada'
                        },
                        {
                          fecha: '2024-11-15',
                          hora: '3:30 PM',
                          tipo: 'Consulta General',
                          motivo: 'Dolor de cabeza',
                          estado: 'completada',
                          notas: 'Tratamiento efectivo'
                        },
                        {
                          fecha: '2024-11-02',
                          hora: '11:00 AM',
                          tipo: 'Consulta General',
                          motivo: 'Tos persistente',
                          estado: 'completada',
                          notas: 'Prescripción antibiótico'
                        },
                        {
                          fecha: '2024-10-20',
                          hora: '9:00 AM',
                          tipo: 'Consulta Especializada',
                          motivo: 'Chequeo general',
                          estado: 'cancelada',
                          notas: 'Cancelada por paciente'
                        }
                      ];

                  const citasFiltradas = filtrarCitas(citasOriginales);

                  if (citasFiltradas.length === 0) {
                    return (
                      <div className="text-center py-8">
                        <div className="p-4 bg-gray-50 rounded-full mb-4 w-16 h-16 mx-auto flex items-center justify-center">
                          <span className="text-2xl text-gray-400">📅</span>
                        </div>
                        <p className="text-gray-500 font-medium">No hay citas que coincidan con el filtro seleccionado</p>
                        <p className="text-gray-400 text-sm mt-2">Intente con otro filtro o revise todas las citas</p>
                      </div>
                    );
                  }

                  return citasFiltradas.map((cita: any, index: number) => {
                    const fechaCita = new Date(cita.fecha);
                    const esProxima = fechaCita > new Date();
                    const estado = cita.estado || (esProxima ? 'programada' : 'completada');
                    
                    // Definir colores según el estado
                    const getEstadoClasses = (estado: string) => {
                      switch (estado) {
                        case 'confirmada':
                        case 'programada':
                          return 'bg-green-100 text-green-700 border-green-200';
                        case 'completada':
                          return 'bg-blue-100 text-blue-700 border-blue-200';
                        case 'cancelada':
                          return 'bg-red-100 text-red-700 border-red-200';
                        default:
                          return 'bg-gray-100 text-gray-700 border-gray-200';
                      }
                    };

                    const getEstadoEmoji = (estado: string) => {
                      switch (estado) {
                        case 'confirmada':
                        case 'programada':
                          return '✔️';
                        case 'completada':
                          return '✅';
                        case 'cancelada':
                          return '❌';
                        default:
                          return '📋';
                      }
                    };
                    
                    return (
                      <div key={index} className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getEstadoClasses(estado)}`}>
                                {getEstadoEmoji(estado)} {estado.charAt(0).toUpperCase() + estado.slice(1)}
                              </span>
                              <span className="text-sm font-medium text-gray-600">
                                {fechaCita.toLocaleDateString('es-ES', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </span>
                            </div>
                            <h5 className="font-bold text-gray-800 mb-1">{cita.tipo}</h5>
                            <p className="text-gray-600 text-sm mb-1">{cita.motivo}</p>
                            {cita.notas && (
                              <p className="text-gray-500 text-xs italic">Nota: {cita.notas}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">{cita.hora}</div>
                            <div className="text-xs text-gray-500">Hora de cita</div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">📋 Información</h4>
              <p className="text-sm text-blue-600">
                Las citas son gestionadas por el sistema de agendamiento. Los pacientes pueden solicitar nuevas citas a través de su portal.
              </p>
            </div>

            {/* Botón para cerrar */}
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setModalAbierto(null)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {modalAbierto === 'recetas' && pacienteSeleccionado && (
      <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[85vh] overflow-y-auto m-4">
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Recetas Médicas</h3>
              <button
                onClick={() => setModalAbierto(null)}
                className="text-white hover:text-gray-200 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            <p className="text-purple-100 mt-2">
              Paciente: {pacienteSeleccionado.nombre}
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <button 
                onClick={handleNuevaReceta}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>💊</span>
                <span>+ Nueva Receta</span>
              </button>
            </div>

            <div className="space-y-4">
              {loadingRecetas ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <div className="animate-spin rounded-full border-4 border-purple-200 border-t-purple-600 h-12 w-12 mb-4"></div>
                  <p className="text-purple-600 font-semibold">Cargando recetas...</p>
                </div>
              ) : recetasPaciente.length === 0 ? (
                <div className="text-center py-8">
                  <div className="p-4 bg-purple-100 rounded-full mb-4 w-16 h-16 mx-auto flex items-center justify-center">
                    <span className="text-2xl text-purple-500">💊</span>
                  </div>
                  <p className="text-purple-700 font-semibold text-lg">No hay recetas registradas</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Este paciente no tiene recetas médicas. Puede crear una nueva receta usando el botón superior.
                  </p>
                </div>
              ) : (
                recetasPaciente.map((receta: any, index: number) => (
                  <div key={receta.id || index} className={`bg-white border-2 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow ${
                    receta.estado === 'Activa' 
                      ? 'border-green-200 bg-green-50' 
                      : 'border-yellow-200 bg-yellow-50'
                  }`}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{receta.medicamento}</h4>
                        <p className="text-sm text-gray-600 flex items-center gap-2">
                          <span>📅</span>
                          <span>{receta.fecha}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          receta.estado === 'Activa' 
                            ? 'bg-green-100 text-green-800 border border-green-300' 
                            : 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                        }`}>
                          {receta.estado === 'Activa' ? '🟢' : '🟡'} {receta.estado}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="text-gray-700 flex items-start gap-2">
                          <span className="font-semibold text-purple-600">💉 Dosis:</span> 
                          <span>{receta.dosis}</span>
                        </p>
                        <p className="text-gray-700 flex items-start gap-2">
                          <span className="font-semibold text-blue-600">⏰ Duración:</span> 
                          <span>{receta.duracion}</span>
                        </p>
                        <p className="text-gray-700 flex items-start gap-2">
                          <span className="font-semibold text-green-600">📦 Cantidad:</span> 
                          <span>{receta.cantidad}</span>
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-gray-700 flex items-start gap-2">
                          <span className="font-semibold text-orange-600">🍽️ Con comidas:</span> 
                          <span>{receta.conComidas}</span>
                        </p>
                        <p className="text-gray-700 flex items-start gap-2">
                          <span className="font-semibold text-red-600">📋 Indicación:</span> 
                          <span>{receta.indicaciones}</span>
                        </p>
                        <p className="text-gray-700 flex items-start gap-2">
                          <span className="font-semibold text-gray-600">🏷️ ID:</span> 
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{receta.id}</span>
                        </p>
                      </div>
                    </div>
                    {receta.medico && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Prescrita por: <span className="font-semibold">{receta.medico}</span>
                          {receta.fechaCreacion && (
                            <span className="ml-2">
                              el {new Date(receta.fechaCreacion).toLocaleDateString('es-ES', { 
                                year: 'numeric', month: 'long', day: 'numeric', 
                                hour: '2-digit', minute: '2-digit' 
                              })}
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={() => setModalAbierto(null)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>❌</span>
                <span>Cerrar</span>
              </button>
              <button 
                onClick={() => handlePrintRecetas(pacienteSeleccionado)}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>🖨️</span>
                <span>Imprimir Recetas PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )}

    {modalAbierto === 'mensaje' && pacienteSeleccionado && (
      <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg lg:max-w-2xl mx-4 sm:mx-6 lg:mx-8 max-h-[70vh] sm:max-h-[75vh] lg:max-h-[80vh] overflow-y-auto">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold">Enviar Mensaje</h3>
              <button
                onClick={() => setModalAbierto(null)}
                className="text-white hover:text-gray-200 text-2xl font-bold cursor-pointer"
              >
                ×
              </button>
            </div>
            <p className="text-blue-100 mt-2">
              Para: {pacienteSeleccionado.nombre}
            </p>
          </div>

          <form className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Asunto
              </label>
              <input
                type="text"
                placeholder="Ingresa el asunto del mensaje"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Mensaje
              </label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <option>Recordatorio de Cita</option>
                <option>Instrucciones Médicas</option>
                <option>Resultados de Exámenes</option>
                <option>Seguimiento</option>
                <option>Información General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mensaje
              </label>
              <textarea
                rows={6}
                placeholder="Escribe tu mensaje aquí..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              ></textarea>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="urgent"
                  className="mt-1 rounded"
                />
                <div>
                  <label htmlFor="urgent" className="text-sm font-medium text-blue-800">
                    Marcar como urgente
                  </label>
                  <p className="text-xs text-blue-600 mt-1">
                    El paciente recibirá una notificación inmediata
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => setModalAbierto(null)}
                className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-teal-600 text-white rounded-lg hover:from-blue-700 hover:to-teal-700 transition-all transform hover:scale-105 cursor-pointer"
              >
                Enviar Mensaje
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    
    {modalAbierto === 'reportar' && pacienteSeleccionado && (
      <div className="fixed inset-0 bg-white/20 backdrop-blur-md flex items-center justify-center z-50 p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-lg lg:max-w-2xl mx-4 sm:mx-6 lg:mx-8">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 sm:p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-lg sm:text-2xl font-bold">Reportar Paciente</h3>
              <button onClick={cerrarModal} className="text-white text-2xl font-bold cursor-pointer">×</button>
            </div>
            <p className="text-red-100 mt-2 text-sm">Pac: {pacienteSeleccionado.nombre}</p>
          </div>

          <div className="p-4 sm:p-6 space-y-4">
            {!confirmStage ? (
              <div className="space-y-4">
                <p className="text-gray-700">¿Confirmas que quieres reportar a este paciente?</p>
                <div className="flex justify-end space-x-3">
                  <button onClick={cerrarModal} className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 cursor-pointer">Cancelar</button>
                  <button onClick={() => setConfirmStage(true)} className="px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer">Confirmar</button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                // Simular envío del reporte
                console.log('Reporte enviado', { paciente: pacienteSeleccionado, reason: reportReason });
                alert(`Reporte enviado para ${pacienteSeleccionado.nombre}`);
                setReportReason('');
                setConfirmStage(false);
                cerrarModal();
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo del reporte</label>
                  <select required value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg">
                    <option value="">Selecciona una opción</option>
                    <option value="mala conducta">Mala conducta</option>
                    <option value="falta de pago">Falta de pago</option>
                    <option value="violacion de normas">Violación de normas</option>
                    <option value="otro">Otro (especificar)</option>
                  </select>
                </div>
                {reportReason === 'otro' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Especifica</label>
                    <textarea required value={reportReason} onChange={(e) => setReportReason(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg" rows={3}></textarea>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setConfirmStage(false)} className="px-4 py-2 bg-gray-200 rounded-lg text-gray-700 cursor-pointer">Volver</button>
                  <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg cursor-pointer">Enviar Reporte</button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Modal de Nueva Receta */}
    {modalNuevaReceta && pacienteSeleccionado && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-t-2xl">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <span className="text-2xl">💊</span>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Nueva Receta Médica</h3>
                  <p className="text-purple-100 mt-1">Paciente: {pacienteSeleccionado.nombre}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setModalNuevaReceta(false);
                  setNuevaReceta({
                    medicamento: '',
                    dosis: '',
                    frecuencia: '',
                    duracion: '',
                    cantidad: '',
                    conComidas: '',
                    indicaciones: ''
                  });
                }}
                className="text-white hover:text-gray-200 text-2xl font-bold cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                ×
              </button>
            </div>
          </div>

          <form className="p-6 space-y-6" onSubmit={(e) => { e.preventDefault(); handleGuardarReceta(); }}>
            {/* Información del medicamento */}
            <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
              <h4 className="font-bold text-purple-800 mb-4 flex items-center gap-2">
                <span>💉</span>
                <span>Información del Medicamento</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Medicamento <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevaReceta.medicamento}
                    onChange={(e) => setNuevaReceta({...nuevaReceta, medicamento: e.target.value})}
                    placeholder="Ej: Ibuprofeno 400mg"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-3 focus:ring-purple-200 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Dosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevaReceta.dosis}
                    onChange={(e) => setNuevaReceta({...nuevaReceta, dosis: e.target.value})}
                    placeholder="Ej: 1 tablet cada 8 horas"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-3 focus:ring-purple-200 focus:border-purple-500 transition-all"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Información de administración */}
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-bold text-blue-800 mb-4 flex items-center gap-2">
                <span>⏰</span>
                <span>Administración y Duración</span>
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Frecuencia</label>
                  <select
                    value={nuevaReceta.frecuencia}
                    onChange={(e) => setNuevaReceta({...nuevaReceta, frecuencia: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                  >
                    <option value="">Seleccionar</option>
                    <option value="cada-4h">Cada 4 horas</option>
                    <option value="cada-6h">Cada 6 horas</option>
                    <option value="cada-8h">Cada 8 horas</option>
                    <option value="cada-12h">Cada 12 horas</option>
                    <option value="cada-24h">Una vez al día</option>
                    <option value="personalizada">Personalizada</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Duración <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={nuevaReceta.duracion}
                    onChange={(e) => setNuevaReceta({...nuevaReceta, duracion: e.target.value})}
                    placeholder="Ej: 7 días"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cantidad Total</label>
                  <input
                    type="text"
                    value={nuevaReceta.cantidad}
                    onChange={(e) => setNuevaReceta({...nuevaReceta, cantidad: e.target.value})}
                    placeholder="Ej: 21 tablets"
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-3 focus:ring-blue-200 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Instrucciones adicionales */}
            <div className="bg-green-50 rounded-xl p-4 border border-green-200">
              <h4 className="font-bold text-green-800 mb-4 flex items-center gap-2">
                <span>📋</span>
                <span>Instrucciones Adicionales</span>
              </h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Administrar con comidas</label>
                  <select
                    value={nuevaReceta.conComidas}
                    onChange={(e) => setNuevaReceta({...nuevaReceta, conComidas: e.target.value})}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Si">Sí - Con comidas</option>
                    <option value="No">No necesario</option>
                    <option value="Antes">Antes de comer</option>
                    <option value="Después">Después de comer</option>
                    <option value="Con mucha agua">Con abundante agua</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Indicaciones y notas</label>
                  <textarea
                    value={nuevaReceta.indicaciones}
                    onChange={(e) => setNuevaReceta({...nuevaReceta, indicaciones: e.target.value})}
                    placeholder="Escriba las indicaciones específicas para el paciente..."
                    rows={4}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-3 focus:ring-green-200 focus:border-green-500 transition-all resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="flex gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setModalNuevaReceta(false);
                  setNuevaReceta({
                    medicamento: '',
                    dosis: '',
                    frecuencia: '',
                    duracion: '',
                    cantidad: '',
                    conComidas: '',
                    indicaciones: ''
                  });
                }}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-semibold flex items-center gap-2 justify-center"
              >
                <span>❌</span>
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors font-semibold flex items-center gap-2 justify-center"
              >
                <span>💾</span>
                <span>Guardar Receta</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
    </>
  );
}
