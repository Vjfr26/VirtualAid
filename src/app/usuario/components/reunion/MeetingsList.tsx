'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import MeetingItem from './MeetingItem';
import { getEspecialistas, type MedicoResumen } from '../../services/medicos';
import { isPagoCompletado } from '../pagos/paymentStatus';

interface MeetingsListProps {
  citasAgendadas: Array<{
    id?: string | number;
    fecha: Date;
    hora: string;
    medico: string;
    especialidad?: string;
    tokenSala?: string;
    idRoom?: string;
    token?: string;
  }>;
  reuniones: Array<{ 
    fecha: string; 
    medico: string; 
    hora: string; 
    archivo?: string | null;
    tokenSala?: string;
    idRoom?: string;
    token?: string;
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

type ProcessedMeeting = {
  id: string | number;
  fecha: string;
  hora: string;
  medico: string;
  especialidad?: string;
  archivo?: string | null;
  token?: string;
  tokenSala?: string;
  idRoom?: string;
  citaOriginal: MeetingsListProps['citasAgendadas'][number];
  reunionCoincidente?: MeetingsListProps['reuniones'][number];
};

type SelectedMeetingState = {
  meeting: ProcessedMeeting;
  pagoRelacionado?: MeetingsListProps['pagos'][number];
  pagado: boolean;
  canJoin: boolean;
};

type ChatArchivePayload = {
  savedAt?: string;
  saved_at?: string;
  meeting?: Record<string, unknown>;
  cita?: Record<string, unknown>;
  appointment?: Record<string, unknown>;
  chatHistory?: unknown[];
  history?: unknown[];
  messages?: unknown[];
  [key: string]: unknown;
};

type ChatModalState = {
  meeting: ProcessedMeeting;
  roomId?: string;
  status: 'loading' | 'success' | 'error';
  data?: ChatArchivePayload;
  error?: string;
  pagoRelacionado?: MeetingsListProps['pagos'][number];
};

type NormalizedChatMessage = {
  id: string;
  author?: string;
  timestamp?: string;
  text: string;
};

export default function MeetingsList({ 
  citasAgendadas, 
  reuniones, 
  pagos, 
  setVista 
}: MeetingsListProps) {
  const { t, i18n } = useTranslation('common');
  const [especialistas, setEspecialistas] = useState<MedicoResumen[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<SelectedMeetingState | null>(null);
  const [chatModal, setChatModal] = useState<ChatModalState | null>(null);

  useEffect(() => {
    const cargarEspecialistas = async () => {
      try {
        const especialistasData = await getEspecialistas();
        setEspecialistas(especialistasData);
      } catch (error) {
        console.error('Error al cargar especialistas:', error);
      }
    };
    cargarEspecialistas();
  }, []);

  useEffect(() => {
    if ((!selectedMeeting && !chatModal) || typeof document === 'undefined') return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [selectedMeeting, chatModal]);

  // Función para encontrar el avatar del médico por nombre
  const encontrarAvatarMedico = (nombreMedico: string): string | undefined => {
    const especialista = especialistas.find(esp => {
      const nombreCompleto = `${esp.nombre} ${esp.apellido || ''}`.trim();
      return nombreCompleto.toLowerCase() === nombreMedico.toLowerCase() || 
             esp.nombre.toLowerCase() === nombreMedico.toLowerCase();
    });
    return especialista?.avatar;
  };

  const EmptyState = () => (
    <div className="px-6 py-12 text-center">
      <div className="flex flex-col items-center">
        <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        <h3 className="text-lg font-medium text-gray-900 mb-2">{t('no_meetings_registered')}</h3>
        <p className="text-gray-500 mb-6 max-w-md">{t('no_meetings_registered_desc')}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setVista('citas')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
          >
            {t('schedule_in_person_appointment')}
          </button>
        </div>
      </div>
    </div>
  );

  // Función para procesar y ordenar las reuniones/citas
  const processItems = (): ProcessedMeeting[] => {
    const items: ProcessedMeeting[] = (citasAgendadas || []).map((c) => {
      const reunionCoincidente = (reuniones || []).find((r) => {
        const dCita = c.fecha;
        const dReu = new Date(r.fecha);
        const mismoDia = dCita.getFullYear() === dReu.getFullYear() && 
                        dCita.getMonth() === dReu.getMonth() && 
                        dCita.getDate() === dReu.getDate();
        const mismaHora = r.hora === c.hora;
        const mismoMedico = r.medico === c.medico;
        return mismoDia && mismaHora && mismoMedico;
      });

      return {
        id: `cita-${String((c as { id?: string|number }).id ?? c.medico + '-' + c.fecha.toISOString())}`,
        fecha: c.fecha.toISOString(),
        hora: c.hora,
        medico: c.medico,
        especialidad: c.especialidad,
        archivo: reunionCoincidente?.archivo ?? null,
        token: c.token,
        tokenSala: c.tokenSala,
        idRoom: c.idRoom,
        citaOriginal: c,
        reunionCoincidente,
      };
    });

    return items.sort((a, b) => {
      const today = new Date();
      const normalize = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const da = new Date(a.fecha);
      const db = new Date(b.fecha);
      const daDay = normalize(da);
      const dbDay = normalize(db);
      const todayDay = normalize(today);

      const isSameDayA = daDay.getTime() === todayDay.getTime();
      const isSameDayB = dbDay.getTime() === todayDay.getTime();

      const rank = (isSame: boolean, d: Date) => {
        if (isSame) return 0; // mismo día primero
        if (d < todayDay) return 1; // pasadas después
        return 2; // futuras al final
      };

      const rankA = rank(isSameDayA, daDay);
      const rankB = rank(isSameDayB, dbDay);
      if (rankA !== rankB) return rankA - rankB;

      // Dentro del mismo grupo, orden específico
      const buildDT = (base: Date, hora: string) => {
        const dt = new Date(base);
        const parts = (hora || '00:00').split(':').map(Number);
        dt.setHours(parts[0] || 0, parts[1] || 0, 0, 0);
        return dt;
      };
      const dta = buildDT(da, a.hora);
      const dtb = buildDT(db, b.hora);

      if (rankA === 0) {
        // Mismo día: por hora ascendente
        return dta.getTime() - dtb.getTime();
      } else if (rankA === 1) {
        // Pasadas: más reciente primero (desc)
        return dtb.getTime() - dta.getTime();
      } else {
        // Futuras: más próxima primero (asc)
        return dta.getTime() - dtb.getTime();
      }
    });
  };

  const items = processItems();

  const extractToken = (obj: unknown): string | undefined => {
    if (!obj || typeof obj !== 'object') return undefined;
    const source = obj as Record<string, unknown>;
    const normalize = (value: unknown) => (typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined);
    return (
      normalize(source.token) ||
      normalize(source.idRoom) ||
      normalize((source as Record<string, unknown>)['id_room']) ||
      normalize(source.tokenSala) ||
      normalize((source as Record<string, unknown>)['token_sala'])
    );
  };

  const closeModal = () => setSelectedMeeting(null);

  const goToPayments = () => {
    setSelectedMeeting(null);
    setVista('pagos');
  };

  const closeChatModal = () => setChatModal(null);

  const extractMessagesFromPayload = (payload?: ChatArchivePayload): unknown[] => {
    if (!payload) return [];
    const candidates = [
      payload.chatHistory,
      payload.history,
      payload.messages,
      (payload as unknown as { chat?: unknown[] }).chat,
    ];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) return candidate;
    }
    return [];
  };

  const extractMeetingDetails = (payload?: ChatArchivePayload): Record<string, unknown> | null => {
    if (!payload) return null;
    const candidates = [payload.meeting, payload.cita, payload.appointment];
    for (const candidate of candidates) {
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        return candidate as Record<string, unknown>;
      }
    }
    return null;
  };

  const extractSavedAt = (payload?: ChatArchivePayload): string | null => {
    if (!payload) return null;
    const raw = payload.savedAt ?? payload.saved_at ?? (payload as Record<string, unknown>)['saved_at_iso'];
    if (typeof raw === 'string' && raw.trim().length > 0) return raw;
    if (typeof raw === 'number') return new Date(raw).toISOString();
    return null;
  };

  const normalizeChatMessages = (raw: unknown[]): NormalizedChatMessage[] => {
    return raw.map((item, index) => {
      const id = `msg-${index}`;

      if (typeof item === 'string') {
        const trimmed = item.trim();
        return { id, text: trimmed.length > 0 ? trimmed : item };
      }

      if (typeof item === 'number' || typeof item === 'boolean') {
        return { id, text: String(item) };
      }

      if (Array.isArray(item)) {
        const text = item
          .map((entry) => {
            if (typeof entry === 'string') return entry;
            if (typeof entry === 'number' || typeof entry === 'boolean') return String(entry);
            try {
              return JSON.stringify(entry);
            } catch {
              return '[sin contenido]';
            }
          })
          .join(' ')
          .trim();
        return { id, text: text.length > 0 ? text : '[sin contenido]' };
      }

      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const payload = typeof record.payload === 'object' && record.payload !== null
          ? (record.payload as Record<string, unknown>)
          : undefined;

        const takeValue = (source: Record<string, unknown> | undefined, keys: string[]): string | undefined => {
          if (!source) return undefined;
          for (const key of keys) {
            if (!(key in source)) continue;
            const candidate = source[key];
            if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
            if (typeof candidate === 'number' && Number.isFinite(candidate)) return String(candidate);
            if (typeof candidate === 'boolean') return candidate ? 'true' : 'false';
          }
          return undefined;
        };

        let text = takeValue(record, ['text', 'message', 'content', 'body', 'detalle', 'resumen']);
        if (!text) text = takeValue(payload, ['text', 'message', 'content']);
        if (!text) {
          try {
            const serialized = JSON.stringify(record, null, 2);
            text = serialized && serialized !== '{}' ? serialized : undefined;
          } catch {
            text = undefined;
          }
        }

        const author = takeValue(record, ['author', 'from', 'sender', 'user', 'role', 'participant', 'emisor']);
        let timestamp = takeValue(record, ['timestamp', 'time', 'date', 'createdAt', 'created_at', 'savedAt', 'saved_at']);
        if (!timestamp) timestamp = takeValue(payload, ['timestamp', 'time', 'date']);

        if (timestamp && /^\d+$/.test(timestamp)) {
          const numericValue = Number(timestamp);
          if (!Number.isNaN(numericValue)) {
            timestamp = new Date(numericValue).toISOString();
          }
        }

        return { id, author, timestamp, text: text ?? '[sin contenido]' };
      }

      try {
        return { id, text: JSON.stringify(item) };
      } catch {
        return { id, text: '[sin contenido]' };
      }
    });
  };

  const formatTimestampForDisplay = (value?: string | null): string | undefined => {
    if (typeof value !== 'string' || value.trim().length === 0) return undefined;
    const trimmed = value.trim();
    const locale = i18n?.language || undefined;

    if (/^\d{10,}$/.test(trimmed)) {
      const numericValue = Number(trimmed);
      if (!Number.isNaN(numericValue)) {
        const inferred = new Date(numericValue);
        if (!Number.isNaN(inferred.getTime())) {
          return inferred.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
        }
      }
    }

    const fromDate = new Date(trimmed);
    if (!Number.isNaN(fromDate.getTime())) {
      return fromDate.toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' });
    }

    return trimmed;
  };

  const openChatArchive = async (
    meeting: ProcessedMeeting,
    pagoRelacionado?: MeetingsListProps['pagos'][number]
  ) => {
    const roomId =
      extractToken(meeting) ||
      extractToken(meeting.reunionCoincidente) ||
      extractToken(meeting.citaOriginal) ||
      extractToken(pagoRelacionado);

    if (!roomId) {
      setChatModal({
        meeting,
        status: 'error',
        error: t('chat_archive_missing_room', 'No se encontró la sala asociada a esta reunión.'),
        pagoRelacionado,
      });
      return;
    }

    setChatModal({ meeting, roomId, status: 'loading', pagoRelacionado });

    try {
      const response = await fetch(`/api/reunion/${encodeURIComponent(roomId)}/chat`, { cache: 'no-store' });
      if (!response.ok) {
        let serverMessage: string | undefined;
        try {
          const errorBody = await response.json();
          serverMessage = typeof errorBody?.message === 'string' ? errorBody.message : undefined;
        } catch {
          const text = await response.text().catch(() => '');
          serverMessage = text?.trim().length ? text : undefined;
        }
        throw new Error(serverMessage || t('chat_archive_request_failed', 'No se pudo obtener el archivo de la reunión.'));
      }

      const data = (await response.json()) as ChatArchivePayload;

      setChatModal((prev) => {
        if (!prev || prev.roomId !== roomId) return prev;
        return { ...prev, status: 'success', data };
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t('chat_archive_generic_error', 'No se pudo cargar el archivo de la reunión.');
      setChatModal((prev) => {
        if (!prev || prev.roomId !== roomId) return prev;
        return { ...prev, status: 'error', error: message };
      });
    }
  };

  const handleJoinNow = () => {
    if (!selectedMeeting || !selectedMeeting.pagado) {
      return;
    }

    const tokenFromCita = extractToken(selectedMeeting.meeting);
    const tokenFromReunion = extractToken(selectedMeeting.meeting.reunionCoincidente);
    const tokenFromPago = extractToken(selectedMeeting.pagoRelacionado);
    const tokenSala = tokenFromCita || tokenFromReunion || tokenFromPago;

    try {
      console.log('[Reunión] Tokens encontrados', {
        tokenFromCita,
        tokenFromReunion,
        tokenFromPago,
        tokenUsado: tokenSala,
      });
    } catch {}

    const startAtISO = new Date(selectedMeeting.meeting.fecha).toISOString();
    const url = new URL('/reunion', window.location.origin);
    if (tokenSala) url.searchParams.set('room', tokenSala);
    url.searchParams.set('startAt', startAtISO);
    url.searchParams.set('who', 'patient');

    if (typeof window !== 'undefined') {
      try {
        console.log('[Reunión] URL de unión construida', url.toString());
      } catch {}
      window.open(url.toString(), '_blank');
    }

    setSelectedMeeting(null);
  };

  const selectedMeetingJoinInfo = selectedMeeting
    ? {
        joinDisabled: !selectedMeeting.pagado || !selectedMeeting.canJoin,
        reason: !selectedMeeting.pagado
          ? t('meeting_payment_pending', 'Debes completar el pago para acceder a la reunión.')
          : !selectedMeeting.canJoin
            ? t('join_meeting_unavailable')
            : '',
      }
    : null;

  // Footer con resumen
  const Footer = () => {
    if ((citasAgendadas?.length ?? 0) === 0) return null;

    const citasConArchivos = (citasAgendadas || []).filter(c => {
      const reunionCoincidente = (reuniones || []).find(r => {
        const dCita = c.fecha;
        const dReu = new Date(r.fecha);
        const mismoDia = dCita.getFullYear() === dReu.getFullYear() && 
                        dCita.getMonth() === dReu.getMonth() && 
                        dCita.getDate() === dReu.getDate();
        const mismaHora = r.hora === c.hora;
        const mismoMedico = r.medico === c.medico;
        return mismoDia && mismaHora && mismoMedico;
      });
      return !!reunionCoincidente?.archivo;
    }).length;

    return (
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>{t('total_meetings', { count: (citasAgendadas?.length ?? 0) })}</span>
            <span>•</span>
            <span>{t('with_files_count', { count: citasConArchivos })}</span>
          </div>
          <div className="mt-2 sm:mt-0 flex items-center space-x-4">
            <button 
              onClick={() => setVista('citas')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              {t('view_my_appointments')} →
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold text-gray-800 mb-2 sm:mb-0">{t('consultations_history')}</h2>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('ordered_by_most_recent')}</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-hidden overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
          {(citasAgendadas?.length ?? 0) === 0 ? (
            <EmptyState />
          ) : (
            <div className="divide-y divide-gray-200">
              {items.map((meeting) => {
                const fechaReunion = new Date(meeting.fecha);
                const esReciente = (new Date().getTime() - fechaReunion.getTime()) < (7 * 24 * 60 * 60 * 1000);

                const pagoRelacionado = pagos.find(p => {
                  const dPago = p.fechaRaw ? new Date(p.fechaRaw) : null;
                  const mismoDia = dPago &&
                                dPago.getFullYear() === fechaReunion.getFullYear() &&
                                dPago.getMonth() === fechaReunion.getMonth() &&
                                dPago.getDate() === fechaReunion.getDate();
                  const mismoMedico = p.medico === meeting.medico;
                  return mismoDia && mismoMedico;
                });

                const pagado = isPagoCompletado(pagoRelacionado?.estado);
                const hoy = new Date();
                const isToday = fechaReunion.getFullYear() === hoy.getFullYear() &&
                              fechaReunion.getMonth() === hoy.getMonth() &&
                              fechaReunion.getDate() === hoy.getDate();
                const canJoin = pagado && isToday;

                const meetingForCard = {
                  id: meeting.id,
                  fecha: meeting.fecha,
                  hora: meeting.hora,
                  medico: meeting.medico,
                  especialidad: meeting.especialidad,
                  archivo: meeting.archivo,
                  token: meeting.token,
                  tokenSala: meeting.tokenSala,
                  idRoom: meeting.idRoom,
                  medicoAvatar: encontrarAvatarMedico(meeting.medico),
                };

                const medicoInfo = especialistas.find(esp => {
                  const nombreCompleto = `${esp.nombre} ${esp.apellido || ''}`.trim();
                  return nombreCompleto.toLowerCase() === meeting.medico.toLowerCase() ||
                         esp.nombre.toLowerCase() === meeting.medico.toLowerCase();
                });

                const archiveLoading = Boolean(
                  chatModal &&
                  chatModal.meeting.id === meeting.id &&
                  chatModal.status === 'loading'
                );

                return (
                  <MeetingItem
                    key={meeting.id}
                    reunion={meetingForCard}
                    esReciente={esReciente}
                    pagado={pagado}
                    canJoin={canJoin}
                    medicoInfo={medicoInfo}
                    archiveLoading={archiveLoading}
                    onViewArchive={() => openChatArchive(meeting, pagoRelacionado)}
                    onRequestJoin={() => setSelectedMeeting({ meeting, pagoRelacionado, pagado, canJoin })}
                  />
                );
                
              })}
            </div>
          )}
        </div>

        <Footer />
      </div>

      {selectedMeeting && (
        <div
          className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={closeModal}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              aria-label={t('close_modal', 'Cerrar')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-gray-900 pr-8">
              {t('meeting_details', 'Detalles de la cita')}
            </h3>

            {(() => {
              const meetingDate = new Date(selectedMeeting.meeting.fecha);
              const joinDisabled = selectedMeetingJoinInfo?.joinDisabled ?? false;
              const isPaid = selectedMeeting.pagado;

              return (
                <>
                  <div className="mt-4 space-y-4 text-sm text-gray-700">
                    <div className="flex items-center gap-3 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                      <div className="shrink-0 rounded-full bg-blue-100 p-2 text-blue-600" aria-hidden="true">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-blue-600 font-semibold">
                          {t('upcoming_consultation', 'Próxima consulta')}
                        </p>
                        <p className="text-base font-semibold text-gray-900">
                          {meetingDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-sm text-gray-600">{t('time', 'Hora')}: {selectedMeeting.meeting.hora}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-600">{t('doctor', 'Doctor')}</span>
                        <span className="text-right font-medium text-gray-900">{t('doctor_short', 'Dr.')} {selectedMeeting.meeting.medico}</span>
                      </div>
                      {selectedMeeting.meeting.especialidad && (
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-gray-600">{t('specialty', 'Especialidad')}</span>
                          <span className="text-right text-blue-600 font-semibold">{selectedMeeting.meeting.especialidad}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <div className="shrink-0 text-amber-500" aria-hidden="true">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 105.656-5.656L12 7.757l-2.828 2.829a4 4 0 105.656 5.656z" />
                      </svg>
                    </div>
                    <div className="text-xs text-amber-700 leading-relaxed">
                      <p className="font-semibold uppercase tracking-wide">{t('confidentiality_heading', 'Confidencialidad de la consulta')}</p>
                      <p>{t('confidentiality_notice_primary', 'Esta videollamada no se grabará.')}</p>
                      <p className="mt-1">{t('confidentiality_notice_secondary', 'No utilices aplicaciones externas para grabarla; hacerlo vulnera la confidencialidad médico-paciente.')}</p>
                    </div>
                  </div>

                  {selectedMeetingJoinInfo?.reason && (
                    <p className={`mt-4 text-xs ${selectedMeeting.pagado ? 'text-gray-500' : 'text-orange-600'}`}>
                      {selectedMeetingJoinInfo.reason}
                    </p>
                  )}

                  <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition"
                    >
                      {t('close', 'Cerrar')}
                    </button>
                    {isPaid ? (
                      <button
                        type="button"
                        onClick={handleJoinNow}
                        disabled={joinDisabled}
                        className={`px-4 py-2 rounded-lg font-semibold transition ${
                          joinDisabled
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700 text-white shadow-md'
                        }`}
                      >
                        {t('go_to_meeting', 'Ir a la reunión')}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={goToPayments}
                        className="px-4 py-2 rounded-lg font-semibold transition bg-amber-500 hover:bg-amber-600 text-white shadow-md"
                      >
                        {t('go_to_payment', 'Ir a pagar')}
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {chatModal && (
        <div
          className="fixed inset-0 z-[11500] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={closeChatModal}
        >
          <div
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeChatModal}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
              aria-label={t('close_modal', 'Cerrar')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h3 className="text-lg font-semibold text-gray-900 pr-10">
              {t('chat_archive_title', 'Archivo de la cita')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {t('chat_archive_subtitle', 'Consulta el historial y los datos guardados de tu reunión médica.')}
            </p>

            {chatModal.status === 'loading' && (
              <div className="py-12 flex flex-col items-center gap-3 text-gray-600">
                <div className="h-10 w-10 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" aria-hidden="true" />
                <span>{t('chat_archive_loading', 'Recuperando historial...')}</span>
              </div>
            )}

            {chatModal.status === 'error' && (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {chatModal.error || t('chat_archive_generic_error', 'No se pudo cargar el archivo de la reunión.')}
                  {chatModal.roomId && (
                    <div className="mt-1 text-xs text-red-600">
                      {t('chat_archive_room_label', 'Sala')}: {chatModal.roomId}
                    </div>
                  )}
                </div>
                {chatModal.roomId && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => openChatArchive(chatModal.meeting, chatModal.pagoRelacionado)}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
                    >
                      {t('retry', 'Reintentar')}
                    </button>
                  </div>
                )}
              </div>
            )}

            {chatModal.status === 'success' && (() => {
              const meetingDate = new Date(chatModal.meeting.fecha);
              const savedAtRaw = extractSavedAt(chatModal.data);
              const savedAtDisplay = formatTimestampForDisplay(savedAtRaw);
              const messageItems = normalizeChatMessages(extractMessagesFromPayload(chatModal.data));
              const meetingDetails = extractMeetingDetails(chatModal.data);
              const detailEntries = meetingDetails
                ? Object.entries(meetingDetails)
                    .filter(([_, value]) => ['string', 'number', 'boolean'].includes(typeof value))
                    .slice(0, 8)
                : [];

              return (
                <>
                  <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 grid gap-4 sm:grid-cols-2 text-sm text-gray-700">
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">{t('chat_archive_room_label', 'Sala')}</p>
                      <p className="font-semibold text-gray-900 break-all">{chatModal.roomId ?? t('chat_archive_room_unknown', 'No disponible')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">{t('saved_at', 'Guardado el')}</p>
                      <p className="font-semibold text-gray-900">{savedAtDisplay ?? t('chat_archive_saved_unknown', 'Sin registro')}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">{t('meeting_date', 'Fecha de la cita')}</p>
                      <p className="font-semibold text-gray-900">
                        {meetingDate.toLocaleDateString(i18n?.language || undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">{t('time', 'Hora')}</p>
                      <p className="font-semibold text-gray-900">{chatModal.meeting.hora}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">{t('doctor', 'Doctor')}</p>
                      <p className="font-semibold text-gray-900">{t('doctor_short', 'Dr.')} {chatModal.meeting.medico}</p>
                    </div>
                    {chatModal.meeting.especialidad && (
                      <div>
                        <p className="text-xs font-semibold uppercase text-gray-500">{t('specialty', 'Especialidad')}</p>
                        <p className="font-semibold text-gray-900">{chatModal.meeting.especialidad}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-semibold uppercase text-gray-500">{t('chat_archive_messages_count', 'Mensajes')}</p>
                      <p className="font-semibold text-gray-900">{messageItems.length}</p>
                    </div>
                  </div>

                  {detailEntries.length > 0 && (
                    <div className="mt-4 rounded-xl border border-gray-200 px-4 py-4">
                      <p className="text-xs font-semibold uppercase text-gray-500 mb-2">{t('chat_archive_additional_details', 'Datos de la cita')}</p>
                      <dl className="grid gap-3 sm:grid-cols-2 text-sm text-gray-700">
                        {detailEntries.map(([key, value]) => (
                          <div key={key} className="space-y-1">
                            <dt className="text-xs uppercase tracking-wide text-gray-500">{key}</dt>
                            <dd className="font-medium text-gray-900 break-words">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}

                  {chatModal.meeting.archivo && (
                    <div className="mt-4">
                      <a
                        href={chatModal.meeting.archivo.startsWith('/perfiles/') ? chatModal.meeting.archivo : `/storage/${chatModal.meeting.archivo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {t('chat_archive_download_file', 'Descargar informe')}
                      </a>
                    </div>
                  )}

                  <div className="mt-6">
                    <p className="text-sm font-semibold text-gray-800 mb-3">{t('chat_archive_history_title', 'Historial de chat')}</p>
                    {messageItems.length === 0 ? (
                      <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                        {t('chat_archive_no_messages', 'No se registraron mensajes durante la cita.')}
                      </div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
                        {messageItems.map((msg) => (
                          <div key={msg.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span className="font-semibold text-gray-700">{msg.author ?? t('chat_archive_unknown_author', 'Participante')}</span>
                              {msg.timestamp && <span>{formatTimestampForDisplay(msg.timestamp)}</span>}
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">
                              {msg.text === '[sin contenido]' ? t('chat_archive_message_empty', 'Mensaje sin contenido') : msg.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
}
