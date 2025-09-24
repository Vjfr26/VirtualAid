export const runtime = 'nodejs';

import jsPDF from 'jspdf';
import { readFileSync } from 'fs';
import { join } from 'path';

interface PagoInfo {
  id: string;
  cita_id?: number;
  monto: number;
  estado: string;
  metodo?: string;
  fecha_pago?: string;
  paciente_nombre?: string;
  paciente_email?: string;
  medico_nombre?: string;
  medico_especialidad?: string;
  fecha_cita?: string;
  hora_cita?: string;
}

// Función para obtener información completa del pago
async function obtenerInfoPago(pagoId: string): Promise<PagoInfo> {
  const baseUrl = 'http://13.60.223.37';
  
  try {
    // Obtener información del pago
    const pagoResponse = await fetch(`${baseUrl}/api/pagos/${pagoId}`);
    
    if (!pagoResponse.ok) {
      throw new Error(`Error obteniendo pago: ${pagoResponse.status}`);
    }
    
    const pago = await pagoResponse.json();
    
    // Obtener información de la cita si existe
    let citaInfo = null;
    if (pago.cita_id) {
      try {
        const citaResponse = await fetch(`${baseUrl}/api/cita/${pago.cita_id}`);
        if (citaResponse.ok) {
          citaInfo = await citaResponse.json();
        }
      } catch (e) {
        console.warn('No se pudo obtener información de la cita:', e);
      }
    }
    
    // Obtener información del paciente/usuario
    let pacienteInfo = null;
    if (pago.usuario_id || citaInfo?.usuario_id) {
      try {
        const usuarioId = pago.usuario_id || citaInfo?.usuario_id;
        const pacienteResponse = await fetch(`${baseUrl}/api/usuario/${usuarioId}`);
        if (pacienteResponse.ok) {
          pacienteInfo = await pacienteResponse.json();
        }
      } catch (e) {
        console.warn('No se pudo obtener información del paciente:', e);
      }
    }
    
    // Obtener información del médico
    let medicoInfo = null;
    if (pago.medico_id || citaInfo?.medico_id) {
      try {
        const medicoId = pago.medico_id || citaInfo?.medico_id;
        const medicoResponse = await fetch(`${baseUrl}/api/medico/${medicoId}`);
        if (medicoResponse.ok) {
          medicoInfo = await medicoResponse.json();
        }
      } catch (e) {
        console.warn('No se pudo obtener información del médico:', e);
      }
    }
    
    // Construir objeto con información completa
    const pagoInfo: PagoInfo = {
      id: pagoId,
      cita_id: pago.cita_id || citaInfo?.id,
      monto: parseFloat(pago.monto) || 0,
      estado: pago.estado || 'Pendiente',
      metodo: pago.metodo || pago.payment_method || 'N/A',
      fecha_pago: pago.fecha_pago || pago.created_at,
      paciente_nombre: pacienteInfo ? `${pacienteInfo.nombre || ''} ${pacienteInfo.apellido || ''}`.trim() : 'N/A',
      paciente_email: pacienteInfo?.email || 'N/A',
      medico_nombre: medicoInfo ? `Dr. ${medicoInfo.nombre || ''} ${medicoInfo.apellido || ''}`.trim() : 'N/A',
      medico_especialidad: medicoInfo?.especialidad || medicoInfo?.especializacion || 'N/A',
      fecha_cita: citaInfo?.fecha || undefined,
      hora_cita: citaInfo?.hora || undefined
    };

    return pagoInfo;
    
  } catch (error) {
    console.error('Error obteniendo información del pago:', error);
    
    // Fallback con datos básicos si falla la conexión
    return {
      id: pagoId,
      monto: 0,
      estado: 'Error al conectar con backend',
      metodo: 'N/A',
      fecha_pago: new Date().toISOString().split('T')[0],
      paciente_nombre: 'Error al cargar datos',
      paciente_email: 'N/A',
      medico_nombre: 'Error al cargar datos',
      medico_especialidad: 'N/A',
      fecha_cita: undefined,
      hora_cita: undefined
    };
  }
}

// Función para formatear fecha en español
function formatearFecha(fecha: string): string {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  
  const fechaObj = new Date(fecha);
  const dia = fechaObj.getDate();
  const mes = meses[fechaObj.getMonth()];
  const año = fechaObj.getFullYear();
  
  return `${dia} de ${mes} de ${año}`;
}

// Función para generar el PDF del recibo
function generarReciboPDF(pagoInfo: PagoInfo): Uint8Array {
  const doc = new jsPDF();
  
  // Configuración de colores corporativos
  const colorPrimario: [number, number, number] = [120, 200, 240]; // Azul VirtualAid
  const colorSecundario: [number, number, number] = [52, 73, 94]; // Gris oscuro
  const colorTexto: [number, number, number] = [44, 62, 80]; // Gris texto
  
  // Intentar cargar y agregar el logo
  try {
    const logoPath = join(process.cwd(), 'public', 'imagenes', 'Logo', 'Logo Transparente', 'Logo sin fondo Horizontal.png');
    const logoBuffer = readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    
    // Header con fondo azul
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Agregar logo en el header con proporción correcta
    doc.addImage(logoBase64, 'PNG', 5, 10, 60, 15); // x, y, width, height - proporción horizontal
    
    // Título del recibo (ajustado para no solapar con el logo)
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE PAGO', 80, 20);
    
    // Información de la empresa (ajustada)
    doc.setTextColor(44, 62, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Servicios Médicos Online', 80, 28);
    
  } catch (error) {
    console.warn('No se pudo cargar el logo:', error);
    
    // Header sin logo (fallback)
    doc.setFillColor(...colorPrimario);
    doc.rect(0, 0, 210, 30, 'F');
    
    // Título del recibo
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RECIBO DE PAGO', 20, 20);
    
    // Información de la empresa
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('VirtualAid - Servicios Médicos Online', 140, 20);
  }
  
  // Información del recibo
  let yPos = 55; // Ajustado para dar más espacio al header con logo
  
  // Número de recibo y fecha
  doc.setFillColor(245, 245, 245);
  doc.rect(20, yPos - 5, 170, 20, 'F');
  
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL RECIBO', 25, yPos + 5);
  
  yPos += 25;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Número de Recibo:`, 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`#${pagoInfo.id}`, 80, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de Emisión:`, 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(formatearFecha(pagoInfo.fecha_pago || new Date().toISOString().split('T')[0]), 80, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Estado:`, 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(39, 174, 96); // Verde para pagado
  doc.text(pagoInfo.estado, 80, yPos);
  
  yPos += 8;
  doc.setTextColor(...colorTexto);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nombre:`, 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(pagoInfo.paciente_nombre || 'N/A', 80, yPos);

  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Monto:`, 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(`€${pagoInfo.monto.toFixed(2)}`, 80, yPos);

  yPos += 8;
  doc.setTextColor(...colorTexto);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método de Pago:`, 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(pagoInfo.metodo || 'N/A', 80, yPos);
  
  // Información del servicio
  yPos += 25;
  doc.setTextColor(...colorSecundario);
  doc.setFillColor(245, 245, 245);
  doc.rect(20, yPos - 5, 170, 20, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMACIÓN DEL SERVICIO', 25, yPos + 5);
  
  yPos += 25;
  doc.setTextColor(...colorTexto);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Médico:`, 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(pagoInfo.medico_nombre || 'N/A', 80, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Especialidad:`, 25, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(pagoInfo.medico_especialidad || 'N/A', 80, yPos);
  
  if (pagoInfo.fecha_cita) {
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha de Cita:`, 25, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(formatearFecha(pagoInfo.fecha_cita), 80, yPos);
  }
  
  if (pagoInfo.hora_cita) {
    yPos += 8;
    doc.setFont('helvetica', 'normal');
    doc.text(`Hora de Cita:`, 25, yPos);
    doc.setFont('helvetica', 'bold');
    doc.text(pagoInfo.hora_cita, 80, yPos);
  }
  
  // Footer
  yPos += 40;
  doc.setTextColor(...colorTexto);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Este recibo es válido como comprobante de pago.', 25, yPos);
  doc.text('Gracias por confiar en VirtualAid para sus servicios médicos.', 25, yPos + 6);
  
  yPos += 20;
  doc.setTextColor(...colorSecundario);
  doc.setFontSize(9);
  doc.text('VirtualAid - Servicios Médicos Online', 25, yPos);
  doc.text('Email: contacto@virtualaid.com | Web: www.virtualaid.com', 25, yPos + 5);
  doc.text(`Generado el ${formatearFecha(new Date().toISOString().split('T')[0])}`, 25, yPos + 10);
  
  return new Uint8Array(doc.output('arraybuffer'));
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const pagoId = url.searchParams.get('id');
    const preview = url.searchParams.get('preview');
    
    if (!pagoId) {
      return new Response('ID de pago requerido', { status: 400 });
    }
    
    // Obtener información completa del pago
    const pagoInfo = await obtenerInfoPago(pagoId);
    
    // Generar el PDF del recibo
    const pdfBytes = generarReciboPDF(pagoInfo);
    const buf = Buffer.from(pdfBytes);
    
    const filename = `recibo_${pagoId}.pdf`;
    
    // Si es para vista previa, no incluir Content-Disposition attachment
    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'X-Filename': filename,
      'Cache-Control': 'no-store'
    };
    
    // Solo añadir attachment para descarga, no para preview
    if (!preview) {
      headers['Content-Disposition'] = `attachment; filename=${filename}`;
    } else {
      headers['Content-Disposition'] = `inline; filename=${filename}`;
    }
    
    return new Response(buf, {
      status: 200,
      headers
    });
  } catch (error) {
    console.error('Error generando recibo:', error);
    return new Response('Error generando recibo', { status: 500 });
  }
}