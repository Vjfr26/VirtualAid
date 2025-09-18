"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneMissed, FiMessageSquare, FiUsers, FiMoreVertical, FiPaperclip, FiSend, FiFileText, FiMonitor } from 'react-icons/fi';
import { postOffer, getOffer, postAnswer, getAnswer, postCandidate, getCandidates, finalizarChat, listRooms, roomLink, roomLinkWithName, getUsuario, getMedico, extractDisplayName } from './services';
import Footer from '../components/Footer';

interface ParticipantProps {
  name: string;
  avatar: string;
  isMuted: boolean;
}

interface ParticipantData {
  id?: string;
    name: string;
    avatar: string;
    isMuted: boolean;
    isYou?: boolean;
}

interface Message {
  type: 'text' | 'file';
  content: string | { name: string; url: string };
  sender: string;
  avatar: string;
}

const Participant = ({ name, avatar, isMuted }: ParticipantProps) => (
  <li className="flex items-center justify-between py-2">
    <div className="flex items-center gap-3">
      <Image src={avatar} alt={name} width={32} height={32} className="w-8 h-8 rounded-full" />
      <span>{name}</span>
    </div>
    <div className="flex items-center gap-3 text-gray-400">
      {isMuted ? <FiMicOff /> : <FiMic />}
      <FiMoreVertical />
    </div>
  </li>
);

export default function ReunionPage() {
  // Identidad local y avatar derivado del nombre
  const [displayName, setDisplayName] = useState<string>('Tú');
  const [localId] = useState<string>(() => Math.random().toString(36).slice(2));
  const avatarFor = (name: string) => `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}`;
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [participantsOpen, setParticipantsOpen] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ParticipantData[]>([{
    id: localId,
    name: displayName,
    avatar: avatarFor(displayName),
    isMuted: false,
    isYou: true,
  }]);
  const [inputValue, setInputValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  // Media (audio/video)
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const lastPresenceSentRef = useRef<number>(0);
  const [connState, setConnState] = useState<string>('new');
  const [dcState, setDcState] = useState<string>('closed');
  const [roomId, setRoomId] = useState<string | null>(null);
  const roleRef = useRef<null | 'caller' | 'callee'>(null);
  const [reconnecting, setReconnecting] = useState<boolean>(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Screen share
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const videoSenderRef = useRef<RTCRtpSender | null>(null);
  // rol actual no es necesario almacenar; se pasa explícito a setupPeer
  const [rooms, setRooms] = useState<{ roomId: string; createdAt: string; hasOffer: boolean; hasAnswer: boolean }[]>([]);
  const [roomsLoading, setRoomsLoading] = useState<boolean>(false);
  const [joinCode, setJoinCode] = useState<string>("");
  // Dispositivos
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioId, setSelectedAudioId] = useState<string>("");
  const [selectedVideoId, setSelectedVideoId] = useState<string>("");
  const [devicesLoading, setDevicesLoading] = useState<boolean>(false);
  const [joinError, setJoinError] = useState<string>("");
  // Meeting gating & ACL
  const [appointmentStartAt, setAppointmentStartAt] = useState<Date | null>(null);
  const [allowedJoinFrom, setAllowedJoinFrom] = useState<Date | null>(null);
  const [countdownMs, setCountdownMs] = useState<number>(0);
  const [accessDenied, setAccessDenied] = useState<boolean>(false);
  const [autoParams, setAutoParams] = useState<{ rid?: string; who?: 'patient'|'doctor'; uid?: string; did?: string; autostart?: boolean } | null>(null);

  const toggleMic = () => {
    setMicOn((prev) => {
      const next = !prev;
      const s = localStreamRef.current;
      if (s) s.getAudioTracks().forEach((t) => (t.enabled = next));
      return next;
    });
  };
  const toggleCamera = () => {
    setCameraOn((prev) => {
      const next = !prev;
      const s = localStreamRef.current;
      if (s) s.getVideoTracks().forEach((t) => (t.enabled = next));
      return next;
    });
  };

  const handleSidebarToggle = (panel: 'chat' | 'participants') => {
    setSidebarVisible(true);
    if (panel === 'chat') {
      setChatOpen(true);
      setParticipantsOpen(false);
    } else {
      setChatOpen(false);
      setParticipantsOpen(true);
    }
  };

  // Helper para enviar presencia con pequeño throttling
  const sendPresence = useCallback(() => {
    const now = Date.now();
    if (now - lastPresenceSentRef.current < 800) return; // evita spam
    lastPresenceSentRef.current = now;
    const payload = { meta: 'presence', participant: { id: localId, name: displayName, avatar: avatarFor(displayName), isMuted: !micOn } };
    try {
      if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
        dataChannelRef.current.send(JSON.stringify(payload));
      }
    } catch {}
  }, [localId, displayName, micOn]);

  // Cargar lista de dispositivos (labels visibles tras permisos)
  const loadDevices = useCallback(async () => {
    if (!navigator?.mediaDevices?.enumerateDevices) return;
    setDevicesLoading(true);
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const aud = devices.filter((d) => d.kind === 'audioinput');
      const vid = devices.filter((d) => d.kind === 'videoinput');
      setAudioInputs(aud);
      setVideoInputs(vid);
      // Establecer valores por defecto si aún no hay selección
      if (!selectedAudioId && aud[0]?.deviceId) setSelectedAudioId(aud[0].deviceId);
      if (!selectedVideoId && vid[0]?.deviceId) setSelectedVideoId(vid[0].deviceId);
    } catch {}
    setDevicesLoading(false);
  }, [selectedAudioId, selectedVideoId]);

  // Resolver nombre inicial desde query/localStorage cuando cargue en cliente
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const resolveInitialName = () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const n = params.get('name');
        if (n && n.trim()) return n.trim();
      } catch {}
      // Preferir nombre desde la sesión local
      try {
        const sraw = localStorage.getItem('session');
        if (sraw) {
          const sobj = JSON.parse(sraw);
          // Intentar nombre directo (session.nombre/name)
          let candidate = extractDisplayName(sobj);
          // Intentar objetos anidados por tipo
          if (!candidate && sobj?.tipo === 'usuario' && sobj.usuario) candidate = extractDisplayName(sobj.usuario);
          if (!candidate && sobj?.tipo === 'medico' && sobj.medico) candidate = extractDisplayName(sobj.medico);
          if (!candidate && sobj.user) candidate = extractDisplayName(sobj.user);
          if (!candidate && sobj.profile) candidate = extractDisplayName(sobj.profile);
          if (candidate) return candidate;
        }
      } catch {}
      // Luego, parámetros para lookup a backend si el flujo lo requiere
      try {
        const params = new URLSearchParams(window.location.search);
        const uid = params.get('userId');
        const med = params.get('medicoEmail');
        if (uid) return { lookup: 'usuario', id: uid } as const;
        if (med) return { lookup: 'medico', id: med } as const;
      } catch {}
      try {
        const tryKeys = ['usuario', 'medico', 'user', 'profile'];
        for (const k of tryKeys) {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const obj = JSON.parse(raw);
          const candidate = extractDisplayName(obj);
          if (candidate) return candidate;
        }
      } catch {}
      return `Invitado-${Math.random().toString(36).slice(2, 6)}`;
    };
    const resolved = resolveInitialName();
    const apply = async () => {
      if (typeof resolved === 'string') {
        if (resolved && resolved !== displayName) setDisplayName(resolved);
        return;
      }
      if (resolved && resolved.lookup === 'usuario') {
        try { const prof = await getUsuario(resolved.id); const name = extractDisplayName(prof); if (name) setDisplayName(name); } catch {}
        return;
      }
      if (resolved && resolved.lookup === 'medico') {
        try { const prof = await getMedico(String(resolved.id)); const name = extractDisplayName(prof); if (name) setDisplayName(name); } catch {}
        return;
      }
    };
    apply();
  }, [displayName]);

  // Cargar salas disponibles periódicamente mientras no estés en una sala
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    const load = async () => {
      setRoomsLoading(true);
      try {
        const { rooms } = await listRooms(true);
        setRooms(rooms);
      } catch {
        setRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    };
    if (!roomId) {
      load();
      timer = setInterval(load, 3000);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [roomId]);

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;
    const newMessage: Message = {
        type: 'text',
        content: inputValue,
  sender: displayName,
  avatar: avatarFor(displayName)
    };
    setMessages([...messages, newMessage]);
  // mandar por datachannel si está abierto
  try { dataChannelRef.current?.send(JSON.stringify(newMessage)); } catch {}
    setInputValue("");
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const newFileMessage: Message = {
          type: 'file',
          content: {
              name: file.name,
              url: URL.createObjectURL(file)
          },
          sender: displayName,
          avatar: avatarFor(displayName)
      };
      setMessages([...messages, newFileMessage]);
  };

  // --- WebRTC minimal (solo chat por datachannel en MVP) ---
  const setupPeer = useCallback((rid: string, fromRole: 'caller'|'callee') => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    pc.onconnectionstatechange = () => {
      // Logs mínimos de diagnóstico
      setConnState(pc.connectionState);
      console.log('[RTC] connectionState:', pc.connectionState);
    };
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        postCandidate(rid, fromRole, e.candidate.toJSON()).catch(() => {});
      }
    };
    pc.ontrack = (ev) => {
      const [stream] = ev.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      }
    };
    pc.ondatachannel = (ev) => {
    const ch = ev.channel;
    dataChannelRef.current = ch;
  ch.onopen = () => { setDcState('open'); console.log('[RTC] DataChannel abierto (callee)'); sendPresence(); };
    ch.onclose = () => { setDcState('closed'); };
    ch.onerror = () => { setDcState('error'); };
      ch.onmessage = (msgEvt) => {
        try {
          const incoming = JSON.parse(msgEvt.data);
          if (incoming && incoming.meta === 'presence' && incoming.participant) {
            setParticipants((prev) => {
              const pIn = incoming.participant;
              const idxById = pIn.id ? prev.findIndex(p => p.id === pIn.id) : -1;
              if (idxById >= 0) {
                const copy = [...prev];
                const prevItem = copy[idxById];
                copy[idxById] = { ...prevItem, id: pIn.id ?? prevItem.id, name: pIn.name, avatar: pIn.avatar, isMuted: !!pIn.isMuted, isYou: prevItem.id === localId || prevItem.isYou };
                return copy;
              }
              if (!pIn.id) {
                const idxByName = prev.findIndex(p => p.name === pIn.name);
                if (idxByName >= 0) {
                  const copy = [...prev];
                  const prevItem = copy[idxByName];
                  copy[idxByName] = { ...prevItem, name: pIn.name, avatar: pIn.avatar, isMuted: !!pIn.isMuted };
                  return copy;
                }
              }
              return [...prev, { id: pIn.id, name: pIn.name, avatar: pIn.avatar, isMuted: !!pIn.isMuted } as ParticipantData];
            });
            // Responder con nuestra presencia para asegurar bi-direccionalidad
            sendPresence();
          } else if (incoming && (incoming.type === 'text' || incoming.type === 'file')) {
            setMessages((prev) => [...prev, incoming]);
            setParticipants((prev) => prev.some(p => p.name === incoming.sender) ? prev : [...prev, { name: incoming.sender, avatar: incoming.avatar, isMuted: false } as ParticipantData]);
          }
        } catch {}
      };
    };
    pcRef.current = pc;
    return pc;
  }, [sendPresence, localId]);

  const ensureLocalStream = useCallback(async () => {
    if (!localStreamRef.current) {
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
          video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        // aplicar estado inicial de toggles
        stream.getAudioTracks().forEach((t) => (t.enabled = micOn));
        stream.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        // cargar dispositivos con labels
        await loadDevices();
      } catch (err) {
        console.warn('[Media] No se pudo obtener cámara/micrófono:', err);
      }
    } else {
      // actualizar estado de pistas según toggles
      const s = localStreamRef.current;
      s.getAudioTracks().forEach((t) => (t.enabled = micOn));
      s.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
    }
    return localStreamRef.current;
  }, [micOn, cameraOn, selectedAudioId, selectedVideoId, loadDevices]);

  // Cambiar dispositivos en caliente si ya tenemos permisos/stream
  useEffect(() => {
    const switchDevices = async () => {
      if (!localStreamRef.current) return; // aún no hay permisos/stream
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
          video: selectedVideoId ? { deviceId: { exact: selectedVideoId } } : true,
        };
        const newStream = await navigator.mediaDevices.getUserMedia(constraints);
        // aplicar toggles
        newStream.getAudioTracks().forEach((t) => (t.enabled = micOn));
        newStream.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
        const pc = pcRef.current;
        if (pc) {
          const senders = pc.getSenders();
          const newAudio = newStream.getAudioTracks()[0];
          const newVideo = newStream.getVideoTracks()[0];
          const audioSender = senders.find((s) => s.track && s.track.kind === 'audio');
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
          if (audioSender && newAudio) await audioSender.replaceTrack(newAudio);
          if (videoSender && newVideo) await videoSender.replaceTrack(newVideo);
        }
        const old = localStreamRef.current;
        localStreamRef.current = newStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
        old?.getTracks().forEach((t) => t.stop());
      } catch (e) {
        console.warn('[Media] No se pudo cambiar dispositivos:', e);
      }
    };
    switchDevices();
  }, [selectedAudioId, selectedVideoId, micOn, cameraOn]);

  // Eliminado: creación manual de sala no permitida

  // Iniciar como caller en una sala predefinida (rid) sin crear en backend
  // Eliminado flujo de creación local: las salas se crean en backend

  const joinAndAnswer = useCallback(async (rid: string) => {
  setRoomId(rid);
  // rol 'callee'
  roleRef.current = 'callee';
  const pc = setupPeer(rid, 'callee');
    // Adjuntar medios locales
    const stream = await ensureLocalStream();
    if (stream) {
      stream.getTracks().forEach((trk) => pc.addTrack(trk, stream));
    }
    // Esperar la oferta del caller con reintentos (hasta 15s)
    let offerStr: string | null = null;
    const start = Date.now();
    while (Date.now() - start < 15000) {
      try {
        const off = await getOffer(rid);
        if (off.offer) { offerStr = off.offer; break; }
      } catch {}
      await new Promise(r => setTimeout(r, 500));
    }
    if (!offerStr) {
      console.warn('[RTC] No se encontró oferta para la sala en el tiempo esperado');
      return; // aborta unión silenciosamente
    }
    await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(offerStr)));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await postAnswer(rid, JSON.stringify(answer));
    // poll por candidatos del caller
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      const cands = await getCandidates(rid, 'callee');
      for (const c of cands.candidates) {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {}
      }
    }, 1000);
  }, [setupPeer, ensureLocalStream]);

  // Iniciar como caller (doctor): crea y publica la oferta, y hace polling de answer/candidates
  const startAsCaller = useCallback(async (rid: string) => {
    setRoomId(rid);
    roleRef.current = 'caller';
    const pc = setupPeer(rid, 'caller');
    const stream = localStreamRef.current || await ensureLocalStream();
    if (stream) {
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
    }
    const dc = pc.createDataChannel('chat');
    dataChannelRef.current = dc;
    dc.onopen = () => { setDcState('open'); try { console.log('[RTC] DataChannel abierto (caller)'); } catch{} sendPresence(); };
    dc.onclose = () => setDcState('closed');
    dc.onerror = () => setDcState('error');
    dc.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m?.meta === 'presence') sendPresence(); else if (m?.type) setMessages((p)=>[...p,m]); } catch {} };
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await postOffer(rid, JSON.stringify(offer));
    // Polling de answer y candidates del callee
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(async () => {
      try {
        const ans = await getAnswer(rid);
        if (ans.answer && pc.signalingState !== 'stable') {
          await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(ans.answer)));
        }
        const cands = await getCandidates(rid, 'caller');
        for (const c of cands.candidates) { try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {} }
      } catch {}
    }, 1000);
  }, [setupPeer, ensureLocalStream, sendPresence]);

  // Reconectar en la misma sala reintentando la negociación
  const reconnect = useCallback(async () => {
    if (!roomId || reconnecting) return;
    setReconnecting(true);
    try {
      // limpiar polling y conexiones actuales
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      try { dataChannelRef.current?.close(); } catch {}
      try { pcRef.current?.close(); } catch {}
      dataChannelRef.current = null;
      pcRef.current = null;
      setDcState('connecting');
      setConnState('new');
      const role = roleRef.current;
      if (role === 'caller') {
        // como caller: crear nueva oferta en la misma sala
        const pc = setupPeer(roomId, 'caller');
        const stream = localStreamRef.current || await ensureLocalStream();
        if (stream) stream.getTracks().forEach((t) => pc.addTrack(t, stream));
        const dc = pc.createDataChannel('chat');
        dataChannelRef.current = dc;
        dc.onopen = () => { setDcState('open'); sendPresence(); };
        dc.onclose = () => setDcState('closed');
        dc.onerror = () => setDcState('error');
        dc.onmessage = (e) => { try { const m = JSON.parse(e.data); if (m?.meta === 'presence') sendPresence(); else if (m?.type) setMessages((p)=>[...p,m]); } catch {} };
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        await postOffer(roomId, JSON.stringify(offer));
        // reiniciar polling
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(async () => {
          try {
            const ans = await getAnswer(roomId);
            if (ans.answer && pc.signalingState !== 'stable') {
              await pc.setRemoteDescription(new RTCSessionDescription(JSON.parse(ans.answer)));
            }
            const cands = await getCandidates(roomId, 'caller');
            for (const c of cands.candidates) { try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch {} }
          } catch {}
        }, 1000);
      } else {
        // callee o desconocido: reintentar unirse
        await joinAndAnswer(roomId);
      }
    } finally {
      setReconnecting(false);
    }
  }, [roomId, reconnecting, setupPeer, ensureLocalStream, sendPresence, joinAndAnswer]);

  useEffect(() => () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pcRef.current?.close();
  }, []);

  // Leer parámetros y configurar sala de espera / ACL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
  const rid = params.get('room') || params.get('rid') || params.get('roomId') || undefined;
    const startAtStr = params.get('startAt') || undefined; // ISO
    const whoParam = (params.get('who') as 'patient'|'doctor'|null) || undefined;
    const uid = params.get('uid') || undefined;
    const did = params.get('did') || undefined;
    const autostart = params.get('autostart') === '1' || params.get('autostart') === 'true';
    const name = params.get('name');
    try {
      console.log('[Reunión] Parámetros recibidos', {
        room: rid,
        startAt: startAtStr,
        who: whoParam,
        uid,
        did,
        autostart,
        name,
      });
    } catch {}
    if (name && name.trim()) setDisplayName(name.trim());
    setAutoParams({ rid, who: whoParam, uid, did, autostart });
    // ACL básica por parámetros (mejorar con backend más adelante)
    if ((uid || did) && whoParam) {
      // sin identidad real, permitimos siempre; esta marca simula verificación
      setAccessDenied(false);
    }
    // Tiempo de cita
    if (startAtStr) {
      const start = new Date(startAtStr);
      if (!isNaN(start.getTime())) {
        setAppointmentStartAt(start);
        // Backend abre a falta de <= 5 minutos
        const joinFrom = new Date(start.getTime() - 5 * 60 * 1000);
        setAllowedJoinFrom(joinFrom);
        const updateCountdown = () => {
          const now = new Date();
          const target = joinFrom;
          const ms = target.getTime() - now.getTime();
          setCountdownMs(ms > 0 ? ms : 0);
        };
        updateCountdown();
        const int = setInterval(updateCountdown, 1000);
        return () => clearInterval(int);
      }
    }
  }, []);

  // Eliminado auto-join; mostrará botón "Unirse ahora" cuando sea hora

  const handleEndCall = useCallback(async () => {
    try {
      if (roomId) {
    await finalizarChat(roomId, messages);
      }
    } catch {}
    if (pollingRef.current) clearInterval(pollingRef.current);
    dataChannelRef.current?.close();
    pcRef.current?.close();
    // detener compartir pantalla si está activo
    try {
      if (isScreenSharing) {
        screenStreamRef.current?.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      }
    } catch {}
    // detener medios
  try { localStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
  localStreamRef.current = null;
  try { if (localVideoRef.current) localVideoRef.current.srcObject = null; } catch {}
  try { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null; } catch {}
  }, [messages, roomId, isScreenSharing]);

  // Abordar cambios de toggles en pistas ya capturadas
  useEffect(() => {
    const s = localStreamRef.current;
    if (s) s.getAudioTracks().forEach((t) => (t.enabled = micOn));
  }, [micOn]);
  useEffect(() => {
    const s = localStreamRef.current;
    if (s) s.getVideoTracks().forEach((t) => (t.enabled = cameraOn));
  }, [cameraOn]);

  // Abandonar sala sin guardar chat
  const leaveRoom = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    try { dataChannelRef.current?.close(); } catch {}
    try { pcRef.current?.close(); } catch {}
    dataChannelRef.current = null;
    pcRef.current = null;
    setDcState('closed');
    setConnState('new');
    setRoomId(null);
    setMessages([]);
    // detener compartir pantalla si está activo
    try {
      if (isScreenSharing) {
        screenStreamRef.current?.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      }
    } catch {}
  // detener medios y liberar cámara
  try { localStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch {}
  localStreamRef.current = null;
  try { if (localVideoRef.current) localVideoRef.current.srcObject = null; } catch {}
  try { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null; } catch {}
    // limpiar ?room de la URL si existe
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href);
        url.searchParams.delete('room');
        window.history.replaceState({}, '', url.toString());
      } catch {}
    }
    // volver a dejar solo al usuario local en la lista
    setParticipants([
      {
        id: localId,
        name: displayName,
        avatar: avatarFor(displayName),
        isMuted: !micOn,
        isYou: true,
      },
    ]);
  }, [displayName, localId, micOn, isScreenSharing]);

  // Salir del lobby (cuando no hay sala activa)
  const exitLobby = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        if (window.history.length > 1) window.history.back();
        else window.location.href = '/';
      } catch {}
    }
  }, []);

  // Refrescar salas manualmente en el lobby
  const refreshRooms = useCallback(async () => {
    setRoomsLoading(true);
    try {
      const { rooms } = await listRooms(true);
      setRooms(rooms);
    } catch {
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  }, []);

  // Detener compartir pantalla y volver a cámara
  const stopScreenShare = useCallback(async () => {
    try {
      const pc = pcRef.current;
      const camTrack = localStreamRef.current?.getVideoTracks()[0] || null;
      const sender = videoSenderRef.current || pc?.getSenders().find((s) => s.track && s.track.kind === 'video') || null;
      if (sender && camTrack) await sender.replaceTrack(camTrack);
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      if (localVideoRef.current && localStreamRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      setIsScreenSharing(false);
    } catch (e) {
      console.warn('[ScreenShare] No se pudo detener compartir pantalla:', e);
    }
  }, []);

  // Iniciar compartir pantalla
  const startScreenShare = useCallback(async () => {
    if (!pcRef.current) {
      alert('Necesitas estar en una sala para compartir pantalla.');
      return;
    }
    try {
      const md = navigator.mediaDevices as unknown as { getDisplayMedia: (constraints?: MediaStreamConstraints) => Promise<MediaStream> };
      const ds = await md.getDisplayMedia({ video: { frameRate: 15 }, audio: false });
      const track = ds.getVideoTracks()[0];
      if (!track) return;
      // cuando usuario detenga desde el diálogo del navegador
      track.onended = () => {
        stopScreenShare();
      };
      const pc = pcRef.current;
      const sender = pc?.getSenders().find((s) => s.track && s.track.kind === 'video') || null;
      videoSenderRef.current = sender;
      if (sender) await sender.replaceTrack(track);
      screenStreamRef.current = ds;
      if (localVideoRef.current) localVideoRef.current.srcObject = ds;
      setIsScreenSharing(true);
    } catch (e) {
      console.warn('[ScreenShare] No se pudo iniciar compartir pantalla:', e);
    }
  }, [stopScreenShare]);

  // Actualizar presencia local (nombre/mute) y reflejar en la lista
  useEffect(() => {
    setParticipants((prev) => {
      const idx = prev.findIndex(p => p.isYou);
  const me: ParticipantData = { id: localId, name: displayName, avatar: avatarFor(displayName), isMuted: !micOn, isYou: true };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = me;
        return copy;
      }
      return [me, ...prev];
    });
    if (dataChannelRef.current && dataChannelRef.current.readyState === 'open') {
      sendPresence();
    }
  }, [displayName, micOn, localId, sendPresence]);


    return (
      <div className="bg-gray-800 text-white min-h-screen flex flex-col">
        {/* Botón flotante para abrir el sidebar si está contraído */}
        {!sidebarVisible && (
          <button
            className="fixed top-6 left-4 z-50 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg flex items-center gap-2"
            onClick={() => setSidebarVisible(true)}
            aria-label="Abrir menú lateral"
          >
            <FiUsers size={20} />
            <span className="hidden sm:inline">Panel</span>
          </button>
        )}
        <main className="flex-1 flex overflow-hidden">
          {/* Área de video */}
          <section className="flex-1 relative bg-black flex items-center justify-center">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
            <video ref={localVideoRef} autoPlay muted playsInline className="absolute bottom-4 right-4 w-40 h-28 bg-black rounded shadow-lg object-cover border border-gray-700" />
          </section>
          {/* Sidebar expandible/colapsable */}
          <aside className={`w-80 bg-gray-900 p-4 flex flex-col transition-all duration-300 ${sidebarVisible ? 'block' : 'hidden'}`} style={{ minWidth: sidebarVisible ? 320 : 0 }}>
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Meeting details</h2>
                <button onClick={() => setSidebarVisible(false)} className="text-gray-400 hover:text-white text-2xl leading-none">
                  &times;
                </button>
              </div>
              <div className="flex border-b border-gray-700 mb-4">
                <button onClick={() => handleSidebarToggle('participants')} className={`py-2 px-4 ${participantsOpen ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>
                  <FiUsers className="inline mr-2" /> People ({participants.length})
                </button>
                <button onClick={() => handleSidebarToggle('chat')} className={`py-2 px-4 ${chatOpen ? 'border-b-2 border-blue-500 text-white' : 'text-gray-400'}`}>
                  <FiMessageSquare className="inline mr-2" /> Chat
                </button>
              </div>
              {/* Selección de dispositivos (oculta en Chat) */}
              {!chatOpen && (
                <div className="mb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-300">Dispositivos</span>
                    <button onClick={loadDevices} className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600" disabled={devicesLoading}>{devicesLoading ? 'Actualizando…' : 'Actualizar'}</button>
                  </div>
                  <label className="block text-xs text-gray-400">Micrófono</label>
                  <select
                    value={selectedAudioId}
                    onChange={(e) => setSelectedAudioId(e.target.value)}
                    className="w-full bg-gray-800 rounded p-2 text-sm"
                  >
                    {audioInputs.length === 0 && <option value="">Predeterminado</option>}
                    {audioInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Mic ${d.deviceId.slice(0,6)}`}</option>
                    ))}
                  </select>
                  <label className="block text-xs text-gray-400 mt-2">Cámara</label>
                  <select
                    value={selectedVideoId}
                    onChange={(e) => setSelectedVideoId(e.target.value)}
                    className="w-full bg-gray-800 rounded p-2 text-sm"
                  >
                    {videoInputs.length === 0 && <option value="">Predeterminado</option>}
                    {videoInputs.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Cam ${d.deviceId.slice(0,6)}`}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {!roomId && participantsOpen && (
              <div className="space-y-3">
                <h3 className="font-semibold mb-2">Salas abiertas</h3>
                {!autoParams?.rid && (
                  <div className="flex gap-2 mb-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Código de sala"
                    className="flex-1 bg-gray-800 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => joinCode.trim() && joinAndAnswer(joinCode.trim())}
                    className="px-3 py-2 text-sm rounded bg-green-600 hover:bg-green-700"
                  >Unirse</button>
                  </div>
                )}
                {!autoParams?.rid && (
                  <>
                    {roomsLoading && <p className="text-gray-400 text-sm">Cargando…</p>}
                    {!roomsLoading && rooms.length === 0 && (
                      <p className="text-gray-400 text-sm">No hay salas abiertas por ahora.</p>
                    )}
                    <ul className="space-y-2">
                      {rooms.map(r => (
                        <li key={r.roomId} className="flex items-center justify-between bg-gray-800 rounded p-2">
                          <div>
                            <p className="text-sm font-medium">{r.roomId}</p>
                            <p className="text-xs text-gray-400">Creada: {new Date(r.createdAt).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={async () => { await navigator.clipboard.writeText(roomLink(r.roomId)); }}
                              className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600"
                            >Copiar enlace</button>
                            <a href={roomLinkWithName(r.roomId, displayName)} className="px-2 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700">Abrir</a>
                            <button
                              onClick={() => joinAndAnswer(r.roomId)}
                              className="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700"
                            >Unirse</button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {roomId && participantsOpen && (
              <div>
                <div className="mb-3">
                  <label className="block text-xs text-gray-400 mb-1">Tu nombre</label>
                  <input
                    value={displayName}
                    disabled
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Escribe tu nombre"
                    className="w-full bg-gray-800 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <ul>
                  {participants.map(p => (
                    <Participant key={p.id ?? p.name} {...p} />
                  ))}
                </ul>
              </div>
            )}

            {chatOpen && (
              <div className="flex flex-col flex-grow h-full">
                <div className="flex-1 overflow-y-auto p-2 space-y-4">
                  {messages.length === 0 ? (
                      <p className="text-gray-400 text-center mt-4">Chat is empty.</p>
                  ) : (
                      messages.map((msg, index) => (
                        <div key={index} className={`flex items-start gap-3 ${msg.sender === displayName ? 'justify-end' : ''}`}>
                          {msg.sender !== displayName && <Image src={msg.avatar} alt={msg.sender} width={32} height={32} className="w-8 h-8 rounded-full" />}
                          <div className={`rounded-lg p-3 max-w-xs ${msg.sender === displayName ? 'bg-blue-600' : 'bg-gray-700'}`}>
                            <p className="text-xs text-gray-300 mb-1">{msg.sender}</p>
                            {msg.type === 'text' && typeof msg.content === 'string' ? (
                              <p className="text-sm">{msg.content}</p>
                            ) : msg.type === 'file' && typeof msg.content === 'object' && msg.content !== null ? (
                              <a href={msg.content.url} download={msg.content.name} className="flex items-center gap-2 text-sm underline hover:text-blue-300">
                                <FiFileText />
                                <span>{msg.content.name}</span>
                              </a>
                            ) : null}
                          </div>
                          {msg.sender === displayName && <Image src={msg.avatar} alt={msg.sender} width={32} height={32} className="w-8 h-8 rounded-full" />}
                        </div>
                      ))
                  )}
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-full hover:bg-gray-700">
                    <FiPaperclip />
                  </button>
                  <input
                    type="text"
                    placeholder="Send a message"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-gray-800 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={handleSendMessage} className="p-2 rounded-full bg-blue-600 hover:bg-blue-700">
                    <FiSend />
                  </button>
                </div>
              </div>
            )}
          </aside>
        </main>

      {/* Controls */}
      {/* Sala de espera (siempre antes de entrar): obligatorio */}
      {!roomId && !accessDenied && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-6">
          <div className="bg-gray-900 text-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl border border-gray-800">
            <h2 className="text-xl font-bold mb-2">Sala de espera</h2>
            {!autoParams?.rid ? (
              <p className="text-sm text-gray-300 mb-4">Esperando el código de sala. Vuelve desde tu historial o enlace de cita.</p>
            ) : allowedJoinFrom && new Date() < allowedJoinFrom ? (
              <>
                <p className="text-sm text-gray-300 mb-4">La sala se habilita 10 minutos antes de la hora de la cita.</p>
                <div className="text-3xl font-mono mb-4">
                  {(() => {
                    const ms = countdownMs;
                    const s = Math.max(0, Math.floor(ms / 1000));
                    const hh = Math.floor(s / 3600).toString().padStart(2, '0');
                    const mm = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
                    const ss = Math.floor(s % 60).toString().padStart(2, '0');
                    return `${hh}:${mm}:${ss}`;
                  })()}
                </div>
              </>
            ) : (
              <p className="text-sm text-gray-300 mb-4">Puedes unirte cuando estés listo.</p>
            )}
            {appointmentStartAt && (
              <p className="text-xs text-gray-400">Cita: {appointmentStartAt.toLocaleString()}</p>
            )}
            {joinError && <p className="text-sm text-red-400 mt-2">{joinError}</p>}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={async () => {
                  try {
                    setJoinError("");
                    const rid = autoParams?.rid;
                    if (!rid) return;
                    // Si es temprano, no permitir
                    if (allowedJoinFrom && new Date() < allowedJoinFrom) return;
                    // Si es doctor, actúa como caller y publica la oferta
                    if (autoParams?.who === 'doctor') {
                      await startAsCaller(rid);
                    } else {
                      // paciente (callee): requiere que exista la oferta
                      const off = await getOffer(rid);
                      if (off.offer) {
                        await joinAndAnswer(rid);
                      } else {
                        setJoinError('La sala aún no está abierta por el médico. Intenta en unos minutos.');
                      }
                    }
                  } catch {
                    setJoinError('No se pudo conectar. Reintenta en unos segundos.');
                  }
                }}
                disabled={Boolean(!autoParams?.rid || (allowedJoinFrom && new Date() < allowedJoinFrom))}
                className={`px-3 py-2 rounded text-sm ${(!autoParams?.rid || (allowedJoinFrom && new Date() < allowedJoinFrom)) ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
              >Unirse ahora</button>
              {(process.env.NODE_ENV !== 'production' || (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('dev') === '1') || process.env.NEXT_PUBLIC_SHOW_DEV_BUTTON === '1') && autoParams?.rid && (
                <button
                  onClick={async () => {
                    try {
                      setJoinError("");
                      const rid = autoParams?.rid;
                      if (!rid) return;
                      // Simulación DEV: publicar una oferta mínima para habilitar el flujo de unión
                      const pc = new RTCPeerConnection();
                      pc.createDataChannel('dev');
                      const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
                      await pc.setLocalDescription(offer);
                      await postOffer(rid, JSON.stringify(offer));
                      pc.close();
                    } catch {
                      setJoinError('No se pudo simular la oferta (DEV).');
                    }
                  }}
                  className="px-3 py-2 rounded bg-blue-700 hover:bg-blue-600 text-sm"
                  title="Solo para pruebas locales: publica una oferta mínima en el backend"
                >Simular oferta (DEV)</button>
              )}
              <button onClick={exitLobby} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">Salir</button>
            </div>
          </div>
        </div>
      )}

      {/* Acceso denegado (básico) */}
      {!roomId && accessDenied && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-6">
          <div className="bg-gray-900 text-white rounded-2xl p-6 max-w-md w-full text-center shadow-2xl border border-gray-800">
            <h2 className="text-xl font-bold mb-2">Acceso restringido</h2>
            <p className="text-sm text-gray-300">Solo el médico y el paciente de esta cita pueden entrar.</p>
            <div className="mt-4">
              <button onClick={exitLobby} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">Volver</button>
            </div>
          </div>
        </div>
      )}
  {/* Lobby deshabilitado (creación manual no permitida) */}
  {!roomId && !autoParams?.rid && false && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-2xl flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-900 text-white rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-bold mb-2">Reunión</h2>
            <p className="text-sm text-gray-300 mb-4">Crea una sala o ingresa con un código.</p>
            <div className="flex gap-2 mb-4">
              <input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Código de sala"
                className="flex-1 bg-gray-800 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => joinCode.trim() && joinAndAnswer(joinCode.trim())}
                className="px-3 py-2 text-sm rounded bg-green-600 hover:bg-green-700"
              >Unirse</button>
            </div>
            {/* Lista de salas abiertas */}
            <div className="mb-4 max-h-64 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold">Salas abiertas</h3>
                <button
                  onClick={refreshRooms}
                  disabled={roomsLoading}
                  className={`text-xs px-2 py-1 rounded ${roomsLoading ? 'bg-gray-700 text-gray-400' : 'bg-gray-700 hover:bg-gray-600'}`}
                >{roomsLoading ? 'Actualizando…' : 'Actualizar'}</button>
              </div>
              {roomsLoading && rooms.length === 0 && (
                <p className="text-gray-400 text-sm">Cargando…</p>
              )}
              {!roomsLoading && rooms.length === 0 && (
                <p className="text-gray-400 text-sm">No hay salas abiertas por ahora.</p>
              )}
              <ul className="space-y-2">
                {rooms.map(r => (
                  <li key={r.roomId} className="flex items-center justify-between bg-gray-800 rounded p-2">
                    <div>
                      <p className="text-sm font-medium break-all">{r.roomId}</p>
                      <p className="text-xs text-gray-400">Creada: {new Date(r.createdAt).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => { await navigator.clipboard.writeText(roomLink(r.roomId)); }}
                        className="px-2 py-1 text-xs rounded bg-gray-700 hover:bg-gray-600"
                      >Copiar</button>
                      <button
                        onClick={() => joinAndAnswer(r.roomId)}
                        className="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700"
                      >Unirse</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button onClick={exitLobby} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">Salir</button>
            </div>
          </div>
        </div>
      )}

  {/* Overlay único; el botón de unión se habilita según la hora/oferta */}
      
      {/* Footer de controles principal */}
      <footer className="bg-gray-900 p-4 flex items-center justify-between">
    <div className="flex items-center gap-2">
      <span className="text-sm">{roomId ? `Sala: ${roomId}` : 'Sin sala'}</span>
      <span className="text-xs text-gray-400">RTC: {connState} | DC: {dcState}</span>
    </div>
        <div className="flex items-center gap-4">
          {roomId && (connState === 'failed' || connState === 'disconnected' || connState === 'closed' || dcState === 'closed' || dcState === 'error') && (
            <button onClick={reconnect} disabled={reconnecting} className={`px-3 py-2 rounded ${reconnecting ? 'bg-gray-700 text-gray-400' : 'bg-amber-600 hover:bg-amber-700'} text-sm`}>
              {reconnecting ? 'Reconectando…' : 'Reconectar'}
            </button>
          )}
          {/* Botón crear sala eliminado: creación manual deshabilitada */}
          {roomId && (
            <button onClick={leaveRoom} className="px-3 py-2 rounded bg-gray-700 hover:bg-gray-600 text-sm">Salir</button>
          )}
          <button
            onClick={async () => {
              if (!isScreenSharing) {
                await startScreenShare();
              } else {
                await stopScreenShare();
              }
            }}
            className={`p-3 rounded-full ${isScreenSharing ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600 hover:bg-gray-700'}`}
            title={isScreenSharing ? 'Detener compartir pantalla' : 'Compartir pantalla'}
            disabled={!roomId}
          >
            <FiMonitor />
          </button>
          <button onClick={toggleMic} className={`p-3 rounded-full ${micOn ? 'bg-gray-600' : 'bg-red-500'}`}>
            {micOn ? <FiMic /> : <FiMicOff />}
          </button>
          <button onClick={toggleCamera} className={`p-3 rounded-full ${cameraOn ? 'bg-gray-600' : 'bg-red-500'}`}>
            {cameraOn ? <FiVideo /> : <FiVideoOff />}
          </button>
          <button onClick={handleEndCall} className="p-3 rounded-full bg-red-500 hover:bg-red-600" title="Finalizar y guardar chat">
            <FiPhoneMissed />
          </button>
        </div>
        <div className="flex items-center gap-4">
            <button className="text-gray-400 hover:text-white">
                <FiMoreVertical />
            </button>
        </div>
      </footer>
      <Footer  borderColor="transparent" background="transparent" />
    </div>
  );
}
