import { fetchJSON } from './api';
import type { Cita } from './citas';
import { getPacientePorEmail } from './pacientes';

const isBrowser = typeof window !== 'undefined';
const RAW_API_URL = isBrowser ? '' : (process.env.NEXT_PUBLIC_API_URL ?? '');
const API_URL = RAW_API_URL.replace(/\/$/, '');

export interface Factura {
  id: number;
  paciente: string;
  fecha: string;
  monto: string;
  estado: string;
  metodo?: string;
}

// Función para simular facturas basadas en citas (opcional, para pruebas)
export function generarFacturasSimuladas(citas: Cita[]): Factura[] {
  return citas.slice(0, 3).map((cita, idx) => ({
    id: idx + 1,
    paciente: cita.usuario_id.split('@')[0] || "Usuario",
    fecha: cita.fecha,
    monto: `${Math.floor(Math.random() * 150) + 50}.00€`,
    estado: Math.random() > 0.3 ? "Pagado" : "Pendiente"
  }));
}

// Define the Pago type based on expected API response
interface Pago {
  id: number;
  cita: {
    medico_id: string;
    usuario_id: string;
    fecha: string;
  };
  fecha_pago?: string;
  monto: string;
  estado: string;
  metodo?: string;
}

// Obtiene las facturas reales desde la tabla pagos
export async function getFacturasMedico(email: string): Promise<Factura[]> {
  try {
    // Obtener todos los pagos
    const pagos = await fetchJSON<Pago[]>(`${API_URL}/api/pagos`);
    // Filtrar pagos por médico (usando la relación cita.medico_id)
    const facturas: Factura[] = [];
    for (const pago of pagos) {
      // Obtener la cita asociada (debería venir anidada o hacer fetch extra si no)
      const cita = pago.cita;
      if (!cita || cita.medico_id !== email) continue;
      // Obtener nombre del paciente
      let paciente = cita.usuario_id;
      try {
        const datosPaciente = await getPacientePorEmail(cita.usuario_id);
        paciente = datosPaciente?.nombre || paciente;
      } catch {}
      facturas.push({
        id: pago.id,
        paciente,
        fecha: pago.fecha_pago || cita.fecha,
        monto: pago.monto + '€',
        estado: pago.estado,
        metodo: pago.metodo
      });
    }
    return facturas;
  } catch (error) {
    console.error("Error obteniendo facturas:", error);
    return [];
  }
}
