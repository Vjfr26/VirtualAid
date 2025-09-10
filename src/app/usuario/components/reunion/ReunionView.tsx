'use client';

import React from 'react';
import MeetingsHeader from './MeetingsHeader';
import MeetingsStats from './MeetingsStats';
import MeetingsList from './MeetingsList';

interface ReunionViewProps {
  reuniones: Array<{ 
    fecha: string; 
    medico: string; 
    hora: string; 
    especialidad?: string; 
    archivo?: string | null;
  }>;
  citasAgendadas: Array<{
    id?: string | number;
    fecha: Date;
    hora: string;
    medico: string;
    especialidad?: string;
  }>;
  pagos: Array<{ 
    id: number;
    fecha: string;
    fechaRaw: string; 
    medico: string; 
    especialidad?: string;
    monto: number;
    estado: string;
    idRoom?: string;
    tokenSala?: string;
  }>;
  setVista: (vista: 'inicio' | 'citas' | 'especialistas' | 'pagos' | 'billing' | 'Reunion') => void;
}

export default function ReunionView({ 
  reuniones, 
  citasAgendadas, 
  pagos, 
  setVista 
}: ReunionViewProps) {
  return (
    <div className="space-y-6">
      {/* Header mejorado */}
      <MeetingsHeader reuniones={reuniones} />

      {/* Estadísticas de reuniones */}
      <MeetingsStats reuniones={reuniones} />

      {/* Historial de reuniones mejorado */}
      <MeetingsList 
        citasAgendadas={citasAgendadas}
        reuniones={reuniones}
        pagos={pagos}
        setVista={setVista}
      />
    </div>
  );
}
