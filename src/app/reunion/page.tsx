"use client";
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneMissed, FiMessageSquare, FiUsers, FiMoreVertical, FiPaperclip, FiSend, FiFileText, FiMonitor } from 'react-icons/fi';
import { postOffer, getOffer, postAnswer, getAnswer, postCandidate, getCandidates, finalizarChat, listRooms, roomLink, roomLinkWithName, getUsuario, getMedico, extractDisplayName, getState } from './services';
import DiagnosticPanel from './DiagnosticPanel';


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

const buildResponsiveVideoConstraints = (deviceId?: string): MediaTrackConstraints => {
  if (typeof window === 'undefined') {
    return deviceId ? { deviceId: { exact: deviceId } } : { width: { ideal: 1280 }, height: { ideal: 720 }, aspectRatio: 16 / 9 };
  }

  const minWidth = 640;
  const minHeight = 360;
  const maxWidth = 1920;
  const maxHeight = 1080;
  const targetWidth = Math.min(Math.max(window.innerWidth, minWidth), maxWidth);
  const targetHeight = Math.min(Math.max(window.innerHeight, minHeight), maxHeight);
  const aspectRatio = targetWidth / targetHeight;

  const constraints: MediaTrackConstraints = {
    width: { ideal: targetWidth, max: maxWidth },
    height: { ideal: targetHeight, max: maxHeight },
  };

  if (Number.isFinite(aspectRatio)) {
    constraints.aspectRatio = aspectRatio;
  }

  if (deviceId) {
    constraints.deviceId = { exact: deviceId };
  }

  return constraints;
};

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
  const [isJoining, setIsJoining] = useState<boolean>(false);
  const answerPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const candidatePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Sistema de auto-reconexión inteligente (Google Meet style)
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [lastConnectionTime, setLastConnectionTime] = useState<number>(0);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectionHealthCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor' | 'disconnected'>('excellent');
  const autoReconnectRef = useRef<((reason: 'failed' | 'disconnected' | 'timeout' | 'ice-failed') => Promise<void>) | null>(null);
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
  const [sameIpWarning, setSameIpWarning] = useState<boolean>(false);

  const toggleMic = () => {
    setMicOn((prev: boolean) => {
      const next = !prev;
      const s = localStreamRef.current;
      if (s) s.getAudioTracks().forEach((t: MediaStreamTrack) => (t.enabled = next));
      return next;
    });
  };
  const toggleCamera = () => {
    setCameraOn((prev: boolean) => {
      const next = !prev;
      const s = localStreamRef.current;
      if (s) s.getVideoTracks().forEach((t: MediaStreamTrack) => (t.enabled = next));
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

  // --- WebRTC robusto: ICE deduplicado, logs, polling seguro ---
  const setupPeer = useCallback((rid: string, fromRole: 'caller'|'callee') => {
    // Protección contra múltiples llamadas simultáneas
    if (pcRef.current && pcRef.current.connectionState !== 'closed' && pcRef.current.connectionState !== 'failed') {
      return {
        pc: pcRef.current,
        setRemote: () => {}
      };
    }
    
    // Cerrar peer anterior si existe
    if (pcRef.current) {
      try {
        localStreamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      } catch {}
      try {
        pcRef.current.close();
      } catch {}
    }
    
    // Configuración optimizada tipo Google Meet/Jitsi
    const pc = new RTCPeerConnection({ 
      iceServers: [
        // Google STUN servers (múltiples para alta disponibilidad)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Servidores STUN alternativos para mayor robustez
        { urls: 'stun:stun.cloudflare.com:3478' },
        { urls: 'stun:stun.services.mozilla.com:3478' },
        { urls: 'stun:stun.stunprotocol.org:3478' }
      ],
      iceTransportPolicy: 'all',       // Probar todas las rutas
      iceCandidatePoolSize: 10,        // Pre-generar candidates
      bundlePolicy: 'max-bundle',      // Un solo transport para todo
      rtcpMuxPolicy: 'require'         // RTP+RTCP en mismo puerto
    });
  pcRef.current = pc;

    // Solo loggear errores ICE críticos (no timeouts STUN que son normales)
    pc.onicecandidateerror = (evt) => {
      // Ignorar timeouts de STUN (error 701) - son normales
      if (evt.errorCode === 701) return;
      console.error(`[WebRTC] ICE error ${evt.errorCode}: ${evt.errorText}`);
    };
    
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      console.log(`[WebRTC] 🔌 ${fromRole} ICE: ${state}`);
      
      // Actualizar calidad de conexión según estado ICE
      if (state === 'connected' || state === 'completed') {
        console.log(`[WebRTC] ✅ ICE ${state} - Conexión P2P establecida!`);
        setConnectionQuality('excellent');
        setReconnectAttempts(0); // Reset de contador en conexión exitosa
        setLastConnectionTime(Date.now());
      }
      
      if (state === 'checking') {
        setConnectionQuality('good');
      }
      
      if (state === 'disconnected') {
        console.warn(`[WebRTC] ⚠️ ICE disconnected - esperando reconexión...`);
        setConnectionQuality('poor');
        
        // PRODUCTION: Esperar 10 segundos antes de intentar restart (más tolerante)
        setTimeout(() => {
          if (pc.iceConnectionState === 'disconnected') {
            console.log(`[WebRTC] 🔄 Sigue desconectado tras 10s, intentando restart...`);
            if (pc.signalingState === 'stable') {
              pc.restartIce();
            } else {
              // Si no podemos hacer ICE restart, trigger full reconnect
              autoReconnectRef.current?.('disconnected');
            }
          }
        }, 10000);
      }
      
      if (state === 'failed') {
        console.error(`[WebRTC] ❌ ICE failed - Trigger auto-reconexión...`);
        setConnectionQuality('disconnected');
        
        // Intentar ICE restart primero
        if (pc.signalingState === 'stable') {
          pc.restartIce();
          console.log(`[WebRTC] 🔄 ICE restart iniciado`);
          
          // PRODUCTION: Si ICE restart no funciona en 12s, full reconnect (más tiempo)
          setTimeout(() => {
            if (pc.iceConnectionState === 'failed') {
              console.error(`[WebRTC] ICE restart falló tras 12s, iniciando reconexión completa`);
              autoReconnectRef.current?.('ice-failed');
            }
          }, 12000);
        } else {
          // Si no podemos hacer restart, reconexión inmediata
          autoReconnectRef.current?.('ice-failed');
        }
      }
    };
    
    const addedCandidates = new Set<string>();
    const candidateBuffer: RTCIceCandidateInit[] = [];
    let remoteSet = false;
    
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnState(state);
      console.log(`[WebRTC] 🔌 Connection state: ${state}`);
      
      if (state === 'connected') {
        console.log(`[WebRTC] ✅ Conexión establecida`);
        setConnectionQuality('excellent');
        setReconnectAttempts(0); // Reset contador
        setLastConnectionTime(Date.now());
        
        import('./services').then(({ confirmConnection }) => {
          confirmConnection(rid).catch(() => {});
        });
      }
      
      if (state === 'failed') {
        console.error(`[WebRTC] ❌ Connection failed - trigger auto-reconexión`);
        setConnectionQuality('disconnected');
        autoReconnectRef.current?.('failed');
      }
      
      if (state === 'disconnected') {
        console.warn(`[WebRTC] ⚠️ Connection disconnected`);
        setConnectionQuality('poor');
        
        // PRODUCTION: Esperar 15 segundos antes de reconectar completo (muy tolerante)
        setTimeout(() => {
          if (pc.connectionState === 'disconnected') {
            console.log(`[WebRTC] Sigue desconectado tras 15s, reconectando...`);
            autoReconnectRef.current?.('disconnected');
          }
        }, 15000);
      }
      
      if (["connected","failed","disconnected","closed"].includes(state)) {
        if (candidatePollingRef.current) { 
          clearInterval(candidatePollingRef.current); 
          candidatePollingRef.current = null; 
        }
      }
    };
    
    pc.onicecandidate = (e) => {
      if (e.candidate) {
        const c = e.candidate;
        const candJSON = c.toJSON();
        const addr = c.address || '';
        console.log(`[SetupPeer] 📡 ICE candidate (${fromRole}): ${c.type} ${c.protocol} ${addr}:${c.port}`);
        
        postCandidate(rid, fromRole, candJSON).catch((err) => {
          console.error(`[SetupPeer] Error enviando ICE candidate:`, err);
        });
      } else {
        console.log(`[SetupPeer] ✅ ICE gathering completado (${fromRole})`);
      }
    };
    
    pc.ontrack = (ev) => {
      const track = ev.track;
      console.log(`[SetupPeer] 📹 Track recibido (${fromRole}):`, {
        kind: track.kind,
        id: track.id,
        label: track.label,
        enabled: track.enabled,
        readyState: track.readyState
      });
      
      const [stream] = ev.streams;
      if (stream) {
        remoteStreamRef.current = stream;
        console.log(`[SetupPeer] 📺 Stream remoto configurado con ${stream.getTracks().length} tracks:`, 
          stream.getTracks().map(t => `${t.kind} (${t.readyState})`).join(', '));
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
          console.log(`[SetupPeer] ✅ Video remoto asignado al elemento`);
          
          // Intentar reproducir explícitamente
          remoteVideoRef.current.play()
            .then(() => console.log(`[SetupPeer] ✅ Video remoto reproduciendo`))
            .catch(err => console.warn(`[SetupPeer] ⚠️ Error al reproducir video:`, err));
        }
      }
    };
    
    // Solo el CALLEE necesita ondatachannel (el CALLER crea el canal manualmente)
    if (fromRole === 'callee') {
      pc.ondatachannel = (ev) => {
        console.log(`[SetupPeer] 💬 DataChannel recibido (CALLEE)`);
        const ch = ev.channel;
        dataChannelRef.current = ch;
        ch.onopen = () => { 
          console.log(`[SetupPeer] ✅ DataChannel abierto (CALLEE)`);
          setDcState('open'); 
          sendPresence(); 
        };
        ch.onclose = () => { 
          console.log(`[SetupPeer] ❌ DataChannel cerrado (CALLEE)`);
          setDcState('closed'); 
        };
        ch.onerror = () => { 
          console.log(`[SetupPeer] ⚠️ DataChannel error (CALLEE)`);
          setDcState('error'); 
        };
        ch.onmessage = (msgEvt) => {
          console.log(`[SetupPeer] Mensaje en DataChannel (CALLEE):`, msgEvt.data);
          try {
            const incoming = JSON.parse(msgEvt.data);
            if (incoming && incoming.meta === 'presence' && incoming.participant) {
              setParticipants((prev: ParticipantData[]) => {
                const pIn = incoming.participant;
                const idxById = pIn.id ? prev.findIndex((p: ParticipantData) => p.id === pIn.id) : -1;
                if (idxById >= 0) {
                  const copy = [...prev];
                  const prevItem = copy[idxById];
                  copy[idxById] = { ...prevItem, id: pIn.id ?? prevItem.id, name: pIn.name, avatar: pIn.avatar, isMuted: !!pIn.isMuted, isYou: prevItem.id === localId || prevItem.isYou };
                  return copy;
                }
                if (!pIn.id) {
                  const idxByName = prev.findIndex((p: ParticipantData) => p.name === pIn.name);
                  if (idxByName >= 0) {
                    const copy = [...prev];
                    const prevItem = copy[idxByName];
                    copy[idxByName] = { ...prevItem, name: pIn.name, avatar: pIn.avatar, isMuted: !!pIn.isMuted };
                    return copy;
                  }
                }
                return [...prev, { id: pIn.id, name: pIn.name, avatar: pIn.avatar, isMuted: !!pIn.isMuted } as ParticipantData];
              });
              sendPresence();
            } else if (incoming && (incoming.type === 'text' || incoming.type === 'file')) {
              setMessages((prev: Message[]) => [...prev, incoming]);
              setParticipants((prev: ParticipantData[]) => prev.some((p: ParticipantData) => p.name === incoming.sender) ? prev : [...prev, { name: incoming.sender, avatar: incoming.avatar, isMuted: false } as ParticipantData]);
            }
          } catch {}
        };
      };
    }
    // Polling ULTRA-AGRESIVO de ICE candidates (Trickle ICE optimizado)
    console.log(`[SetupPeer] ⚡ ${fromRole} iniciando Trickle ICE ultra-rápido`);
    
    let candidatePollAttempts = 0;
    let consecutiveEmptyPolls = 0;
    const MAX_CANDIDATE_POLL_ATTEMPTS = 80; // 80 segundos máximo (aumentado para producción)
    const MAX_EMPTY_POLLS = 15; // Más intentos antes de detener (producción)
    let lastCandidateTimestamp = 0;
    let candidatesProcessed = 0;
    let pollInterval = 400; // PRODUCTION: 400ms inicial (más conservador que 200ms)
    
    if (candidatePollingRef.current) clearInterval(candidatePollingRef.current);
    
    const pollCandidates = async () => {
      candidatePollAttempts++;
      
      // 1. Si ya conectó, detener
      if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        console.log(`[SetupPeer] ✅ P2P establecido, deteniendo polling (${candidatesProcessed} candidates procesados en ${candidatePollAttempts} intentos)`);
        if (candidatePollingRef.current) {
          clearInterval(candidatePollingRef.current);
          candidatePollingRef.current = null;
        }
        return;
      }
      
      // 2. Si timeout general, detener
      if (candidatePollAttempts >= MAX_CANDIDATE_POLL_ATTEMPTS) {
        console.warn(`[SetupPeer] ⏱️ Timeout: ${MAX_CANDIDATE_POLL_ATTEMPTS} intentos sin conexión`);
        if (candidatePollingRef.current) {
          clearInterval(candidatePollingRef.current);
          candidatePollingRef.current = null;
        }
        console.error(`[SetupPeer] ❌ Diagnóstico: connectionState=${pc.connectionState}, iceConnectionState=${pc.iceConnectionState}, candidates=${candidatesProcessed}`);
        return;
      }
      
      // 3. Si muchos polls sin candidates nuevos, detener (el otro peer ya terminó de enviar)
      if (consecutiveEmptyPolls >= MAX_EMPTY_POLLS) {
        console.log(`[SetupPeer] 🛑 Deteniendo polling: ${MAX_EMPTY_POLLS} intentos sin candidates nuevos (total procesados: ${candidatesProcessed})`);
        if (candidatePollingRef.current) {
          clearInterval(candidatePollingRef.current);
          candidatePollingRef.current = null;
        }
        return;
      }
      
      try {
        const sinceParam = lastCandidateTimestamp > 0 
          ? new Date(lastCandidateTimestamp).toISOString() 
          : undefined;
        
        const cands = await getCandidates(rid, fromRole, sinceParam);
        
        if (cands.candidates.length > 0) {
          consecutiveEmptyPolls = 0; // Reset contador
          console.log(`[SetupPeer] 📥 ${cands.candidates.length} candidates nuevos (total: ${candidatesProcessed + cands.candidates.length})`);
          
          for (const c of cands.candidates) {
            const key = JSON.stringify(c);
            if (!addedCandidates.has(key)) {
              if (remoteSet) {
                try { 
                  await pc.addIceCandidate(new RTCIceCandidate(c));
                  candidatesProcessed++;
                  console.log(`[SetupPeer] ✅ Candidate #${candidatesProcessed} agregada`); 
                } catch (err) { 
                  console.warn(`[SetupPeer] ⚠️ Error agregando candidate:`, err); 
                }
              } else {
                console.log(`[SetupPeer] 📦 Candidate bufferizada`);
                candidateBuffer.push(c);
              }
              addedCandidates.add(key);
              
              if ((c as any).timestamp) {
                const candTimestamp = typeof (c as any).timestamp === 'number' 
                  ? (c as any).timestamp 
                  : new Date((c as any).timestamp).getTime();
                if (candTimestamp > lastCandidateTimestamp) {
                  lastCandidateTimestamp = candTimestamp;
                }
              }
            }
          }
          
          // PRODUCTION: Acelerar solo si hay mucha actividad de candidates
          if (pollInterval > 300) {
            pollInterval = 300; // Volver a velocidad alta (no ultra-rápida como 200ms)
            if (candidatePollingRef.current) clearInterval(candidatePollingRef.current);
            candidatePollingRef.current = setInterval(pollCandidates, pollInterval);
            console.log(`[SetupPeer] ⚡ Polling acelerado a 300ms (actividad detectada)`);
          }
        } else {
          consecutiveEmptyPolls++;
          
          // PRODUCTION: Desacelerar más gradualmente para compensar latencias
          if (candidatePollAttempts > 15 && pollInterval < 2000) {
            pollInterval = Math.min(pollInterval + 150, 2000); // Max 2s (más tolerante)
            if (candidatePollingRef.current) clearInterval(candidatePollingRef.current);
            candidatePollingRef.current = setInterval(pollCandidates, pollInterval);
            console.log(`[SetupPeer] 🐌 Polling desacelerado a ${pollInterval}ms`);
          }
        }
      } catch (err) {
        console.error(`[SetupPeer] Error en polling (intento ${candidatePollAttempts}):`, err);
      }
    };
    
    // Iniciar polling adaptativo
    candidatePollingRef.current = setInterval(pollCandidates, pollInterval);
    
    return {
      pc,
      setRemote: () => { 
        remoteSet = true; 
        candidateBuffer.splice(0).forEach(async c => { 
          try { 
            await pc.addIceCandidate(new RTCIceCandidate(c)); 
          } catch (err) { 
            console.warn(`[WebRTC] Error agregando candidate del buffer:`, err); 
          } 
        }); 
      },
    };
  }, [sendPresence, localId]); // autoReconnect se define después

  const ensureLocalStream = useCallback(async () => {
    if (!localStreamRef.current) {
      try {
        console.log(`[Media] Intentando obtener stream con dispositivos específicos...`);
        let constraints: MediaStreamConstraints = {
          audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
          video: buildResponsiveVideoConstraints(selectedVideoId),
        };
        
        let stream: MediaStream | null = null;
        
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          console.log(`[Media] ✅ Stream obtenido con dispositivos específicos`);
        } catch (specificErr) {
          console.warn(`[Media] ⚠️ Error con dispositivos específicos, intentando valores por defecto:`, specificErr);
          // Fallback a dispositivos por defecto
          constraints = { audio: true, video: buildResponsiveVideoConstraints() };
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log(`[Media] ✅ Stream obtenido con dispositivos por defecto`);
          } catch (defaultErr) {
            console.warn(`[Media] ⚠️ Error con dispositivos por defecto, intentando solo audio:`, defaultErr);
            // Fallback a solo audio
            constraints = { audio: true, video: false };
            try {
              stream = await navigator.mediaDevices.getUserMedia(constraints);
              console.log(`[Media] ✅ Stream obtenido solo con audio`);
            } catch (audioErr) {
              console.error(`[Media] ❌ No se pudo obtener ningún stream:`, audioErr);
              // Crear stream vacío para continuar con la conexión
              stream = new MediaStream();
              console.log(`[Media] 📦 Usando stream vacío para continuar`);
            }
          }
        }
        
        if (stream) {
          // aplicar estado inicial de toggles
          stream.getAudioTracks().forEach((t: MediaStreamTrack) => (t.enabled = micOn));
          stream.getVideoTracks().forEach((t: MediaStreamTrack) => (t.enabled = cameraOn));
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          console.log(`[Media] Stream configurado. Audio tracks: ${stream.getAudioTracks().length}, Video tracks: ${stream.getVideoTracks().length}`);
          // cargar dispositivos con labels
          await loadDevices();
        }
      } catch (err) {
        console.warn('[Media] Error general obteniendo stream:', err);
        // Asegurar que siempre tengamos un stream, aunque esté vacío
        localStreamRef.current = new MediaStream();
        console.log(`[Media] 📦 Stream vacío asignado como fallback`);
      }
    } else {
      // actualizar estado de pistas según toggles
      const s = localStreamRef.current;
  s.getAudioTracks().forEach((t: MediaStreamTrack) => (t.enabled = micOn));
  s.getVideoTracks().forEach((t: MediaStreamTrack) => (t.enabled = cameraOn));
    }
    return localStreamRef.current;
  }, [micOn, cameraOn, selectedAudioId, selectedVideoId, loadDevices]);

  // Cambiar dispositivos en caliente si ya tenemos permisos/stream
  useEffect(() => {
    const switchDevices = async () => {
      // No cambiar dispositivos durante conexión inicial
      if (!localStreamRef.current || isJoining) {
        console.log(`[Media] 🛡️ Saltando cambio de dispositivos - joining: ${isJoining}`);
        return;
      }
      
      try {
        const constraints: MediaStreamConstraints = {
          audio: selectedAudioId ? { deviceId: { exact: selectedAudioId } } : true,
          video: buildResponsiveVideoConstraints(selectedVideoId),
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
          const audioSender = senders.find((s: RTCRtpSender) => s.track && s.track.kind === 'audio');
          const videoSender = senders.find((s: RTCRtpSender) => s.track && s.track.kind === 'video');
          if (audioSender && newAudio) await audioSender.replaceTrack(newAudio);
          if (videoSender && newVideo) await videoSender.replaceTrack(newVideo);
        }
        const old = localStreamRef.current;
        localStreamRef.current = newStream;
        if (localVideoRef.current) localVideoRef.current.srcObject = newStream;
  old?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
      } catch (e) {
        console.warn('[Media] No se pudo cambiar dispositivos:', e);
      }
    };
    switchDevices();
  }, [selectedAudioId, selectedVideoId, micOn, cameraOn, isJoining]);

  // Eliminado: creación manual de sala no permitida

  // Iniciar como caller en una sala predefinida (rid) sin crear en backend
  // Eliminado flujo de creación local: las salas se crean en backend

  const joinAndAnswer = useCallback(async (rid: string, prefetchedOffer?: string | null) => {
    setRoomId(rid);
    roleRef.current = 'callee';
    const peerObj = setupPeer(rid, 'callee');
    const pc = peerObj.pc;
    const setRemote = peerObj.setRemote;
    
    const stream = await ensureLocalStream();
    if (stream) {
      stream.getTracks().forEach((trk: MediaStreamTrack) => pc.addTrack(trk, stream));
    }
    
    let offerStr: string | null = prefetchedOffer ?? null;
    
    if (!offerStr) {
      const start = Date.now();
      while (!offerStr && Date.now() - start < 15000) {
        try {
          const off = await getOffer(rid);
          if (off.offer) { 
            offerStr = off.offer;
            break; 
          }
        } catch (err) {}
        await new Promise(r => setTimeout(r, 500));
      }
      
      if (!offerStr) {
        setJoinError('No se encontró la sala. Asegúrate de que el médico haya iniciado la reunión.');
        return;
      }
    }
    
    let offerDesc;
    try {
      offerDesc = JSON.parse(offerStr);
      if (offerDesc.type !== 'offer') return;
    } catch (parseErr) {
      console.error(`[WebRTC] Error parseando offer`);
      return;
    }
    
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));
    } catch (remoteErr) {
      console.error(`[WebRTC] Error en setRemoteDescription:`, remoteErr);
      throw remoteErr;
    }
    
    setRemote();
    
    const answer = await pc.createAnswer();
    if (!answer || answer.type !== 'answer') {
      throw new Error('Answer inválida');
    }
    
    await pc.setLocalDescription(answer);
    const answerStr = JSON.stringify(answer);
    try {
      await postAnswer(rid, answerStr);
    } catch (postErr) {
      console.error(`[WebRTC] Error enviando answer:`, postErr);
      throw postErr;
    }
  }, [setupPeer, ensureLocalStream]);

  // Iniciar como caller (doctor): crea y publica la oferta, y hace polling de answer/candidates
  const startAsCaller = useCallback(async (rid: string, clientId?: string) => {
    if (pcRef.current && pcRef.current.connectionState !== 'closed' && pcRef.current.connectionState !== 'failed') {
      return;
    }
    
    setRoomId(rid);
    roleRef.current = 'caller';
    
    const myClientId = clientId || `caller-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`[CALLER] Mi clientId para negociación: ${myClientId}`);
    const peerObj = setupPeer(rid, 'caller');
    const pc = peerObj.pc;
    
    const stream = localStreamRef.current || await ensureLocalStream();
    if (stream) {
      stream.getTracks().forEach((t: MediaStreamTrack) => pc.addTrack(t, stream));
    }
    const dc = pc.createDataChannel('chat');
    dataChannelRef.current = dc;
    dc.onopen = () => { 
      console.log(`[CALLER] ✅ DataChannel ABIERTO`);
      setDcState('open'); 
      sendPresence(); 
    };
    dc.onclose = () => {
      console.warn(`[CALLER] ❌ DataChannel CERRADO`);
      setDcState('closed');
    };
    dc.onerror = (err) => {
      console.error(`[CALLER] ⚠️ DataChannel ERROR:`, err);
      setDcState('error');
    };
    dc.onmessage = (msgEvt: MessageEvent) => { 
      console.log(`[CALLER] 💬 Mensaje recibido en DataChannel:`, msgEvt.data);
      try {
        const incoming = JSON.parse(msgEvt.data);
        if (incoming && incoming.meta === 'presence' && incoming.participant) {
          setParticipants((prev: ParticipantData[]) => {
            const pIn = incoming.participant;
            const idxById = pIn.id ? prev.findIndex((p: ParticipantData) => p.id === pIn.id) : -1;
            if (idxById >= 0) {
              const copy = [...prev];
              const prevItem = copy[idxById];
              copy[idxById] = { ...prevItem, id: pIn.id ?? prevItem.id, name: pIn.name, avatar: pIn.avatar, isMuted: !!pIn.isMuted, isYou: prevItem.id === localId || prevItem.isYou };
              return copy;
            }
            if (!pIn.id) {
              const idxByName = prev.findIndex((p: ParticipantData) => p.name === pIn.name);
              if (idxByName >= 0) {
                const copy = [...prev];
                const prevItem = copy[idxByName];
                copy[idxByName] = { ...prevItem, name: pIn.name, avatar: pIn.avatar, isMuted: !!pIn.isMuted };
                return copy;
              }
            }
            return [...prev, { id: pIn.id, name: pIn.name, avatar: pIn.avatar, isMuted: !!pIn.isMuted } as ParticipantData];
          });
          sendPresence();
        } else if (incoming && (incoming.type === 'text' || incoming.type === 'file')) {
          setMessages((prev: Message[]) => [...prev, incoming]);
          setParticipants((prev: ParticipantData[]) => prev.some((p: ParticipantData) => p.name === incoming.sender) ? prev : [...prev, { name: incoming.sender, avatar: incoming.avatar, isMuted: false } as ParticipantData]);
        }
      } catch {}
    };
    
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    
    // Añadir clientId a la offer para Perfect Negotiation (glare detection)
    const offerWithClientId = {
      ...offer,
      clientId: myClientId
    };
    const offerJSON = JSON.stringify(offerWithClientId);
    
    try {
      await postOffer(rid, offerJSON, myClientId);
    } catch (err: any) {
      // 🔒 Si recibimos 409 Conflict, otro cliente ya envió offer
      if (err?.status === 409 || err?.message?.includes('already exists')) {
        console.warn(`[CALLER] ⚠️ Offer rechazada: Otro cliente ya es CALLER`);
        console.warn(`[CALLER] 🔄 Cerrando intento de CALLER, obtendré offer remota`);
        
        // Cerrar este intento de conexión
        pc.close();
        pcRef.current = null;
        
        // Retornar error especial para que autoJoinRoom cambie a CALLEE
        const error = new Error('OFFER_CONFLICT') as any;
        error.shouldBeCallee = true;
        throw error;
      }
      
      console.error(`[WebRTC] Error enviando offer:`, err);
      throw err;
    }
    
    const flushCandidates = peerObj.setRemote;
    
    let answerPollAttempts = 0;
    const MAX_ANSWER_POLL_ATTEMPTS = 60; // 60 segundos para answer (más tiempo)
    
    if (answerPollingRef.current) clearInterval(answerPollingRef.current);
    // Polling MUY RÁPIDO de answer (cada 300ms = ~3 req/seg)
    answerPollingRef.current = setInterval(async () => {
      answerPollAttempts++;
      
      // Si alcanzó el máximo de intentos, detener
      if (answerPollAttempts >= MAX_ANSWER_POLL_ATTEMPTS) {
        console.error(`[CALLER] ⏱️ Timeout: No se recibió answer después de ${MAX_ANSWER_POLL_ATTEMPTS}s`);
        console.error(`[CALLER] El paciente puede no haber ingresado a la sala o hay un problema de conexión`);
        if (answerPollingRef.current) {
          clearInterval(answerPollingRef.current);
          answerPollingRef.current = null;
        }
        setJoinError('No se pudo conectar con el paciente. Asegúrate de que haya ingresado a la sala.');
        return;
      }
      
      try {
        const ans = await getAnswer(rid);
        if (ans.answer && pc.signalingState === 'have-local-offer') {
          console.log(`[CALLER] ✅ Answer recibida en el intento ${answerPollAttempts}`);
          let answerDesc;
          try {
            answerDesc = JSON.parse(ans.answer);
          } catch (parseErr) {
            console.error(`[WebRTC] Error parseando answer`);
            return;
          }
          
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
            flushCandidates();
            
            if (answerPollingRef.current) {
              clearInterval(answerPollingRef.current);
              answerPollingRef.current = null;
            }
          } catch (remoteErr) {
            console.error(`[WebRTC] Error en setRemoteDescription:`, remoteErr);
          }
        }
      } catch (err) {
        console.error(`[CALLER] Error en polling de answer (intento ${answerPollAttempts}):`, err);
      }
    }, 300); // ⚡ ULTRA-RÁPIDO: 300ms polling
  }, [setupPeer, ensureLocalStream, sendPresence, localId]);

  // Perfect Negotiation: Resuelve race conditions automáticamente
  // Si ambos crean offer simultáneamente, uno cede basándose en clientId
  const autoJoinRoom = useCallback(async (rid: string, forceNewClientId: boolean = false) => {
    console.log(`[AutoJoin] 🚀 Iniciando conexión P2P para sala: ${rid}`);

    if (isJoining) {
      console.log(`[AutoJoin] ⚠️ Ya hay una conexión en progreso, cancelando...`);
      return;
    }

    setIsJoining(true);
    setJoinError("");
    setRoomId(rid);
    setDcState('connecting');
    setConnState('new');

    // 🔥 CRITICAL: Generar NUEVO clientId en reconexiones (como Google Meet)
    // Esto asegura que cada reconexión sea como "entrar de nuevo"
    const myClientId = (forceNewClientId || !localId) 
      ? `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      : localId;
    console.log(`[AutoJoin] Mi clientId: ${myClientId} ${forceNewClientId ? '(NUEVO - Reconexión)' : '(Primera entrada)'}`);


    try {
      // 🎲 PRODUCTION OPTIMIZATION: Mayor jitter para redes lentas
      // Si ambos entran EXACTAMENTE al mismo tiempo, este delay aleatorio hace que
      // uno vea la offer del otro antes de crear la suya
      // En producción, necesitamos más margen debido a latencias variables
      const jitter = Math.floor(Math.random() * 800) + 200; // 200-1000ms aleatorio
      console.log(`[AutoJoin] ⏱️ Jitter aleatorio: ${jitter}ms (evita glare simultáneo en producción)`);
      await new Promise(resolve => setTimeout(resolve, jitter));

      // 1. Verificar estado de la sala y detectar conflictos
      let existingOffer: string | null = null;
      let existingClientId: string | null = null;
      let shouldBeCallee = false;
      let needsReset = false;

      try {
        const remoteState = await getState(rid);
        console.log('[AutoJoin] Estado de la sala:', remoteState);
        
        // Si hay OFFER Y ANSWER, es una negociación completada anterior
        if (remoteState?.hasOffer && remoteState?.hasAnswer) {
          console.warn('[AutoJoin] ⚠️ Negociación completa anterior detectada');
          needsReset = true;
        }
        // Si solo hay OFFER sin ANSWER, verificar si es válida o hay conflicto
        else if (remoteState?.hasOffer && !remoteState?.hasAnswer) {
          try {
            const offerResponse = await getOffer(rid);
            if (offerResponse?.offer) {
              existingOffer = offerResponse.offer;
              
              // Extraer clientId de la offer (si existe)
              try {
                const offerObj = JSON.parse(existingOffer);
                existingClientId = (offerObj as any).clientId || null;
              } catch {}
              
              console.log(`[AutoJoin] Offer existente (clientId: ${existingClientId || 'none'})`);
              
              // SOLO ser CALLEE si el clientId es DIFERENTE al mío
              if (existingClientId && existingClientId !== myClientId) {
                shouldBeCallee = true;
              } else {
                console.log('[AutoJoin] La offer es MÍA o sin clientId - ignorando');
              }
            }
          } catch (err) {
            console.warn('[AutoJoin] Error obteniendo offer:', err);
          }
        }
      } catch (err) {
        console.log('[AutoJoin] No hay estado previo en la sala:', err);
      }

      // 2. Si necesita reset, limpiar antes de continuar
      if (needsReset) {
        try {
          const { resetRoom } = await import('./services');
          await resetRoom(rid);
          console.log('[AutoJoin] 🧹 Sala limpiada');
          existingOffer = null;
          existingClientId = null;
          shouldBeCallee = false;
        } catch (resetErr) {
          console.warn('[AutoJoin] ⚠️ Error limpiando sala:', resetErr);
        }
      }

      // 3. Decidir rol basado en si hay offer DE OTRO PEER
      if (shouldBeCallee && existingOffer && existingClientId) {
        // HAY OFERTA VÁLIDA DE OTRO PEER → Seré CALLEE (responder)
        console.log(`[AutoJoin] 📞 Rol: CALLEE (respondiendo a offer de ${existingClientId})`);
        await joinAndAnswer(rid, existingOffer);
      } else {
        // NO HAY OFERTA → Intentar ser CALLER
        console.log('[AutoJoin] 📞 Rol: CALLER (creando offer)');
        
        // CRITICAL: Enviar offer con clientId para desempate
        try {
          await startAsCaller(rid, myClientId);
        } catch (err: any) {
          // 🔒 Si backend rechazó offer (409), otro cliente ya es CALLER
          if (err?.shouldBeCallee || err?.message === 'OFFER_CONFLICT') {
            console.warn('[AutoJoin] 🔄 Offer rechazada por backend - cambiando a CALLEE');
            
            // Obtener la offer del otro cliente y responder
            const offerResponse = await getOffer(rid);
            if (offerResponse?.offer) {
              console.log('[AutoJoin] 📞 Respondiendo como CALLEE a offer existente');
              await joinAndAnswer(rid, offerResponse.offer);
              return; // Conexión iniciada como CALLEE
            } else {
              console.error('[AutoJoin] ❌ Backend dijo que hay offer pero no la encontré');
              throw new Error('Offer conflict pero no hay offer disponible');
            }
          }
          throw err; // Re-lanzar otros errores
        }
        
        // 🚀 PRODUCTION OPTIMIZATION: Esperar Answer con timeouts adaptativos
        // En producción, las respuestas pueden tardar más debido a latencias de red
        let answerReceived = false;
        
        const checkForAnswer = async (): Promise<boolean> => {
          // 15 iteraciones * 300ms = 4500ms máximo (vs 800ms en versión anterior)
          // Esto da suficiente margen para latencias de producción
          for (let i = 0; i < 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 300));
            
            try {
              const state = await getState(rid);
              if (state?.hasAnswer) {
                answerReceived = true;
                console.log(`[AutoJoin] ⚡ Answer recibida en ${(i + 1) * 300}ms`);
                return true;
              }
            } catch (err) {
              console.warn(`[AutoJoin] Error verificando answer (intento ${i + 1}):`, err);
              // Continuar intentando incluso si hay error de red
            }
          }
          return false;
        };
        
        // Esperar answer o timeout de 4500ms (lo que ocurra primero)
        await checkForAnswer();
        
        if (answerReceived) {
          // Conexión rápida exitosa - no necesitamos glare detection
          console.log('[AutoJoin] ✅ Conexión establecida exitosamente');
          return;
        }
        
        // Si llegamos aquí, pasaron 4.5s sin answer - verificar glare con reintentos
        console.log('[AutoJoin] ⏳ No se recibió answer después de 4.5s, verificando estado...');
        
        try {
          let recheckState: { hasOffer?: boolean; hasAnswer?: boolean } | null = null;
          
          // Reintentar getState con backoff (importante para redes lentas)
          for (let retry = 0; retry < 3; retry++) {
            try {
              recheckState = await getState(rid);
              break; // Éxito, salir del loop
            } catch (err) {
              console.warn(`[AutoJoin] Error obteniendo estado (intento ${retry + 1}/3):`, err);
              if (retry < 2) {
                await new Promise(resolve => setTimeout(resolve, 500 * (retry + 1)));
              }
            }
          }
          
          if (!recheckState) {
            console.error('[AutoJoin] ❌ No se pudo obtener estado de la sala después de 3 intentos');
            throw new Error('No se pudo verificar estado de la sala');
          }
          
          // Double-check por si answer llegó justo ahora
          if (recheckState?.hasAnswer) {
            console.log('[AutoJoin] ✅ Answer recibida después de verificación');
            return;
          }
          
          // Si hay OFFER pero no ANSWER, verificar si hay conflicto
          if (recheckState?.hasOffer) {
            const recheckOffer = await getOffer(rid);
            if (recheckOffer?.offer) {
              try {
                const currentOfferObj = JSON.parse(recheckOffer.offer);
                const currentClientId = (currentOfferObj as any).clientId || null;
                
                // Si el clientId es diferente al mío, hay GLARE COLLISION
                if (currentClientId && currentClientId !== myClientId) {
                  console.warn(`[AutoJoin] ⚠️ GLARE COLLISION detectada!`);
                  console.warn(`[AutoJoin] Mi clientId: ${myClientId}, Remoto: ${currentClientId}`);
                  
                  // Desempate: el clientId MAYOR alfabéticamente cede (se vuelve CALLEE)
                  // Esto garantiza que ambos peers tomen decisiones consistentes
                  const iShouldYield = myClientId > currentClientId;
                  
                  if (iShouldYield) {
                    console.log('[AutoJoin] 🔄 Cediendo: Me convierto en CALLEE (mi ID es mayor)');
                    
                    // Cerrar mi intento de CALLER
                    if (answerPollingRef.current) {
                      clearInterval(answerPollingRef.current);
                      answerPollingRef.current = null;
                    }
                    if (pcRef.current) {
                      pcRef.current.close();
                      pcRef.current = null;
                    }
                    
                    // Limpiar estado
                    setConnState('new');
                    
                    // PRODUCTION: Mayor delay para asegurar limpieza completa en redes lentas
                    console.log('[AutoJoin] ⏳ Esperando 800ms para limpieza completa...');
                    await new Promise(resolve => setTimeout(resolve, 800));
                    console.log('[AutoJoin] 📞 Respondiendo como CALLEE a la offer remota');
                    await joinAndAnswer(rid, recheckOffer.offer);
                  } else {
                    console.log('[AutoJoin] 💪 Mantengo CALLER: El otro peer cederá (mi ID es menor)');
                    // El otro peer tiene clientId mayor, él detectará y cederá
                    // Yo continúo esperando su answer
                  }
                } else {
                  // Es mi propia offer, todo normal - continuar esperando answer
                  console.log('[AutoJoin] ℹ️ Mi offer sigue activa, esperando answer...');
                }
              } catch (parseErr) {
                console.warn('[AutoJoin] Error parseando offer para glare detection:', parseErr);
              }
            }
          }
        } catch (recheckErr) {
          console.warn('[AutoJoin] Error en glare detection:', recheckErr);
        }
      }
    } catch (e) {
      console.error(`[AutoJoin] ❌ Error en autoJoinRoom:`, e);
      setJoinError('No se pudo conectar. Intenta de nuevo.');
    } finally {
      setIsJoining(false);
      console.log(`[AutoJoin] ✅ Proceso completado`);
    }
  }, [isJoining, joinAndAnswer, startAsCaller, localId]);

  // 🔥 SISTEMA DE AUTO-RECONEXIÓN INTELIGENTE (Google Meet style)
  // Monitorea la calidad de conexión y reconecta automáticamente si es necesario
  const autoReconnect = useCallback(async (reason: 'failed' | 'disconnected' | 'timeout' | 'ice-failed') => {
    if (!roomId || reconnecting || isJoining) {
      console.log(`[AutoReconnect] ⚠️ Reconexión ya en progreso o sin sala`);
      return;
    }
    
    const MAX_RECONNECT_ATTEMPTS = 5;
    const currentAttempt = reconnectAttempts + 1;
    
    if (currentAttempt > MAX_RECONNECT_ATTEMPTS) {
      console.error(`[AutoReconnect] ❌ Máximo de intentos alcanzado (${MAX_RECONNECT_ATTEMPTS})`);
      setJoinError('No se pudo establecer conexión estable. Por favor, recarga la página.');
      setConnectionQuality('disconnected');
      return;
    }
    
    // Backoff exponencial: 2s, 4s, 8s, 16s, 32s
    const delay = Math.min(2000 * Math.pow(2, currentAttempt - 1), 32000);
    
    console.log(`[AutoReconnect] 🔄 Intento ${currentAttempt}/${MAX_RECONNECT_ATTEMPTS} por: ${reason}`);
    console.log(`[AutoReconnect] ⏱️ Esperando ${delay}ms antes de reconectar...`);
    
    setReconnecting(true);
    setReconnectAttempts(currentAttempt);
    setConnectionQuality('poor');
    
    // Limpiar timeout anterior si existe
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    reconnectTimeoutRef.current = setTimeout(async () => {
      try {
        console.log(`[AutoReconnect] 🧹 LIMPIEZA TOTAL - Simulando entrada fresca (como Google Meet)...`);
        
        // 🔥 CRITICAL: Limpiar polling y conexiones PRIMERO
        if (answerPollingRef.current) {
          clearInterval(answerPollingRef.current);
          answerPollingRef.current = null;
        }
        if (candidatePollingRef.current) {
          clearInterval(candidatePollingRef.current);
          candidatePollingRef.current = null;
        }
        
        // Cerrar conexiones WebRTC
        try { 
          if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
          }
        } catch (e) {
          console.warn('[AutoReconnect] Error cerrando dataChannel:', e);
        }
        
        try {
          if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
          }
        } catch (e) {
          console.warn('[AutoReconnect] Error cerrando peerConnection:', e);
        }
        
        // 🔥 CRITICAL: Limpiar servidor (negociación completa)
        try {
          const { resetRoom } = await import('./services');
          await resetRoom(roomId);
          console.log(`[AutoReconnect] ✅ Sala limpiada en servidor`);
        } catch (err) {
          console.warn(`[AutoReconnect] ⚠️ No se pudo limpiar servidor (continuando):`, err);
        }
        
        // 🔥 GOOGLE MEET TECHNIQUE: Delay suficiente para asegurar limpieza completa
        // En producción con latencias altas, esto es crítico
        console.log(`[AutoReconnect] ⏳ Esperando 1500ms para limpieza total...`);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // 🔥 CRITICAL: Resetear TODOS los estados como en entrada fresca
        setDcState('connecting');
        setConnState('new');
        setIsJoining(false); // IMPORTANTE: Resetear flag para permitir nueva entrada
        
        // 🔥 GOOGLE MEET TECHNIQUE: Reconectar como ENTRADA FRESCA
        // autoJoinRoom generará un NUEVO clientId automáticamente
        // Esto es equivalente a salir y entrar manualmente
        console.log(`[AutoReconnect] 🚀 Iniciando reconexión FRESCA (nuevo clientId, roles limpios)...`);
        await autoJoinRoom(roomId, true); // ← CRITICAL: forceNewClientId = true
        
        console.log(`[AutoReconnect] ✅ Reconexión completada exitosamente`);
        
      } catch (err) {
        console.error(`[AutoReconnect] ❌ Error en reconexión automática:`, err);
        setJoinError(`Reintentando conexión (${currentAttempt}/${MAX_RECONNECT_ATTEMPTS})...`);
        
        // Reintentar si no hemos alcanzado el máximo
        if (currentAttempt < MAX_RECONNECT_ATTEMPTS) {
          setTimeout(() => autoReconnect(reason), 1000);
        }
      } finally {
        setReconnecting(false);
      }
    }, delay);
    
  }, [roomId, reconnecting, isJoining, reconnectAttempts, autoJoinRoom]);

  // Sincronizar ref con función para que setupPeer pueda usarla
  useEffect(() => {
    autoReconnectRef.current = autoReconnect;
  }, [autoReconnect]);

  // Reconexión manual (botón de usuario)
  const reconnect = useCallback(async () => {
    if (!roomId || reconnecting || isJoining) {
      console.log(`[Reconnect] ⚠️ Cancelando reconexión - roomId: ${!!roomId}, reconnecting: ${reconnecting}, isJoining: ${isJoining}`);
      return;
    }
    
    console.log(`[Reconnect] 🔄 Reconexión manual iniciada para sala: ${roomId}`);
    
    // Reset de intentos en reconexión manual
    setReconnectAttempts(0);
    setJoinError('');
    
    await autoReconnect('disconnected');
  }, [roomId, reconnecting, isJoining, autoReconnect]);

  useEffect(() => () => {
    if (answerPollingRef.current) clearInterval(answerPollingRef.current);
    if (candidatePollingRef.current) clearInterval(candidatePollingRef.current);
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    if (connectionHealthCheckRef.current) clearInterval(connectionHealthCheckRef.current);
    pcRef.current?.close();
  }, []);

  // 🔥 HEALTH MONITOR: Monitoreo proactivo de conexión (Google Meet style)
  // Verifica cada 5 segundos si la conexión está saludable
  useEffect(() => {
    if (!roomId || !pcRef.current) {
      // Sin sala activa, limpiar monitor
      if (connectionHealthCheckRef.current) {
        clearInterval(connectionHealthCheckRef.current);
        connectionHealthCheckRef.current = null;
      }
      return;
    }
    
    console.log('[HealthMonitor] 🏥 Iniciando monitoreo de salud de conexión');
    
    // Verificar cada 5 segundos
    connectionHealthCheckRef.current = setInterval(() => {
      const pc = pcRef.current;
      if (!pc) return;
      
      const iceState = pc.iceConnectionState;
      const connState = pc.connectionState;
      
      console.log(`[HealthMonitor] 💊 Check: ICE=${iceState}, Connection=${connState}`);
      
      // Detectar estados problemáticos
      if (iceState === 'failed' || connState === 'failed') {
        console.error('[HealthMonitor] ❌ Conexión fallida detectada en health check');
        clearInterval(connectionHealthCheckRef.current!);
        connectionHealthCheckRef.current = null;
      }
      
      if (iceState === 'disconnected' && connState === 'disconnected') {
        console.warn('[HealthMonitor] ⚠️ Ambos estados desconectados, posible problema');
        // Si está desconectado más de 10s (2 checks consecutivos), el timeout de setupPeer se encargará
      }
      
      // Actualizar calidad basado en estados
      if ((iceState === 'connected' || iceState === 'completed') && connState === 'connected') {
        setConnectionQuality('excellent');
      } else if (iceState === 'checking' || connState === 'connecting') {
        setConnectionQuality('good');
      } else if (iceState === 'disconnected' || connState === 'disconnected') {
        setConnectionQuality('poor');
      }
      
    }, 5000);
    
    return () => {
      if (connectionHealthCheckRef.current) {
        clearInterval(connectionHealthCheckRef.current);
        connectionHealthCheckRef.current = null;
      }
    };
  }, [roomId]);

  // 🔥 GOOGLE MEET OPTIMIZATION: Pre-warming de media stream
  // Obtener permisos y stream ANTES de que usuario haga clic en "Unirse"
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const prewarmMedia = async () => {
      // Esperar 500ms para no interrumpir carga inicial de página
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (localStreamRef.current) {
        // Ya hay stream, no es necesario pre-warm
        return;
      }
      
      try {
        console.log('[Prewarm] 🔥 Iniciando pre-warming de media...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: buildResponsiveVideoConstraints(),
          audio: true
        });
        
        // Aplicar estado inicial de toggles
        stream.getAudioTracks().forEach(t => t.enabled = micOn);
        stream.getVideoTracks().forEach(t => t.enabled = cameraOn);
        
        localStreamRef.current = stream;
        
        // Mostrar video local INMEDIATAMENTE (Early Media)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          console.log('[Prewarm] ✅ Video local mostrado instantáneamente');
        }
        
        // Cargar dispositivos con labels
        await loadDevices();
        
        console.log('[Prewarm] ✅ Pre-warming completado - listo para conexión instantánea');
      } catch (err) {
        // Usuario puede denegar permisos o no tener cámara - no es crítico
        console.log('[Prewarm] ℹ️ Pre-warming omitido:', err);
      }
    };
    
    const prewarmTimeout = setTimeout(prewarmMedia, 0);
    
    return () => {
      clearTimeout(prewarmTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar el componente - micOn/cameraOn son estado inicial

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
    // ⏰ RESTRICCIÓN DE HORARIO COMENTADA PARA PRUEBAS ⏰
    // Descomentar estas líneas para restaurar la ventana de 5 minutos antes de la cita
    /* 
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
    */
    // 🧪 MODO PRUEBAS: Permitir unirse en cualquier momento
    if (startAtStr) {
      const start = new Date(startAtStr);
      if (!isNaN(start.getTime())) {
        setAppointmentStartAt(start);
      }
    }
  }, []);

  // 🚀 Auto-join cuando hay autoParams con autostart=true
  useEffect(() => {
    if (!autoParams?.rid || !autoParams.autostart || accessDenied) {
      console.log('[AutoJoin] ⏸️ Esperando condiciones:', { 
        hasRid: !!autoParams?.rid, 
        autostart: autoParams?.autostart,
        accessGranted: !accessDenied 
      });
      return;
    }

    // Evitar múltiples intentos simultáneos
    if (isJoining || roomId) {
      console.log('[AutoJoin] ⏸️ Ya está uniéndose o en sala:', { isJoining, roomId });
      return;
    }

    console.log('[AutoJoin] 🎬 Iniciando conexión automática...', {
      roomId: autoParams.rid,
      who: autoParams.who,
      uid: autoParams.uid,
      did: autoParams.did
    });

    // Pequeño delay para asegurar que el componente está completamente montado
    const timer = setTimeout(() => {
      console.log('[AutoJoin] ▶️ Ejecutando autoJoinRoom()');
      autoJoinRoom(autoParams.rid!);
    }, 500);

    return () => clearTimeout(timer);
  }, [autoParams, accessDenied, isJoining, roomId, autoJoinRoom]);

  const handleEndCall = useCallback(async () => {
    console.log(`\n[EndCall] 🔚 Finalizando llamada...`);
    
    // 10. Finalizar chat y guardar historial completo
    try {
      if (roomId) {
        console.log(`[EndCall] 💾 Guardando historial de chat...`);
        await finalizarChat(roomId, messages);
        console.log(`[EndCall] ✅ Chat guardado exitosamente`);
        
        // 10. Eliminar sala en cache
        console.log(`[EndCall] 🗑️ Eliminando sala del cache...`);
        const { deleteRoom } = await import('./services');
        await deleteRoom(roomId);
        console.log(`[EndCall] ✅ Sala eliminada del cache`);
      }
    } catch (err) {
      console.error(`[EndCall] ⚠️ Error al finalizar:`, err);
    }
    
    // Limpiar conexiones
    if (answerPollingRef.current) {
      console.log(`[EndCall] 🛑 Deteniendo polling de answer`);
      clearInterval(answerPollingRef.current);
    }
    if (candidatePollingRef.current) {
      console.log(`[EndCall] 🛑 Deteniendo polling de candidates`);
      clearInterval(candidatePollingRef.current);
    }
    dataChannelRef.current?.close();
    pcRef.current?.close();
    
    // detener compartir pantalla si está activo
    try {
      if (isScreenSharing) {
        console.log(`[EndCall] 🖥️ Deteniendo compartir pantalla`);
        screenStreamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      }
    } catch {}
    
    // detener medios
    console.log(`[EndCall] 📹 Liberando stream local`);
    try { localStreamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop()); } catch {}
    localStreamRef.current = null;
    try { if (localVideoRef.current) localVideoRef.current.srcObject = null; } catch {}
    try { if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null; } catch {}
    
    console.log(`[EndCall] ✅ Llamada finalizada completamente\n`);
  }, [messages, roomId, isScreenSharing]);

  // Abordar cambios de toggles en pistas ya capturadas
  useEffect(() => {
    const s = localStreamRef.current;
  if (s) s.getAudioTracks().forEach((t: MediaStreamTrack) => (t.enabled = micOn));
  }, [micOn]);
  useEffect(() => {
    const s = localStreamRef.current;
  if (s) s.getVideoTracks().forEach((t: MediaStreamTrack) => (t.enabled = cameraOn));
  }, [cameraOn]);

  // Abandonar sala sin guardar chat
  const leaveRoom = useCallback(() => {
    if (answerPollingRef.current) clearInterval(answerPollingRef.current);
    if (candidatePollingRef.current) clearInterval(candidatePollingRef.current);
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
  screenStreamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop());
        screenStreamRef.current = null;
        setIsScreenSharing(false);
      }
    } catch {}
  // detener medios y liberar cámara
  try { localStreamRef.current?.getTracks().forEach((t: MediaStreamTrack) => t.stop()); } catch {}
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

  // 7. Sistema de Heartbeat - Mantener la sala viva y respaldar chat
  useEffect(() => {
    if (!roomId || connState !== 'connected') return;
    
    console.log(`[Heartbeat] 💓 Iniciando sistema de heartbeat para sala ${roomId}`);
    
    const heartbeatInterval = setInterval(async () => {
      try {
        // Importar sendHeartbeat desde services
        const { sendHeartbeat } = await import('./services');
        
        // Enviar mensajes actuales como respaldo
        const messagesToBackup = messages.map((msg: Message) => ({
          type: msg.type,
          sender: msg.sender,
          text: msg.type === 'text' ? msg.content as string : undefined,
          content: msg.content,
          avatar: msg.avatar,
          timestamp: new Date().toISOString()
        }));
        
        await sendHeartbeat(roomId, messagesToBackup);
        console.log(`[Heartbeat] ✅ Heartbeat enviado (${messagesToBackup.length} mensajes respaldados)`);
      } catch (err) {
        console.error(`[Heartbeat] ⚠️ Error enviando heartbeat:`, err);
      }
    }, 30000); // Cada 30 segundos
    
    return () => {
      console.log(`[Heartbeat] 🛑 Deteniendo heartbeat`);
      clearInterval(heartbeatInterval);
    };
  }, [roomId, connState, messages]);

  // Salir del lobby (cuando no hay sala activa)
  const exitLobby = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      window.close();
      // Si el navegador impide el cierre (pestaña no creada por script), caer al plan B
      if (!window.closed) {
        if (window.history.length > 1) window.history.back();
        else window.location.href = '/';
      }
    } catch {
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
  const sender = videoSenderRef.current || pc?.getSenders().find((s: RTCRtpSender) => s.track && s.track.kind === 'video') || null;
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
  const sender = pc?.getSenders().find((s: RTCRtpSender) => s.track && s.track.kind === 'video') || null;
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
    setParticipants((prev: ParticipantData[]) => {
      const idx = prev.findIndex((p: ParticipantData) => p.isYou);
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
          <section className="flex-1 relative bg-black overflow-hidden flex items-center justify-center">
            <video ref={remoteVideoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover bg-black" />
            <video ref={localVideoRef} autoPlay muted playsInline className="absolute bottom-4 right-4 w-36 h-24 md:w-40 md:h-28 bg-black/70 rounded-lg shadow-lg object-cover border border-gray-700/80" />
            
            {/* 🔥 Indicador de calidad de conexión (Google Meet style) */}
            {roomId && (
              <div className="absolute top-4 left-4 z-10">
                <div className={`flex items-center gap-2 px-3 py-2 rounded-full backdrop-blur-sm shadow-lg transition-all duration-300 ${
                  connectionQuality === 'excellent' ? 'bg-green-500/20 border border-green-500/50' :
                  connectionQuality === 'good' ? 'bg-blue-500/20 border border-blue-500/50' :
                  connectionQuality === 'poor' ? 'bg-yellow-500/20 border border-yellow-500/50' :
                  'bg-red-500/20 border border-red-500/50'
                }`}>
                  {/* Icono de señal */}
                  <div className="flex gap-0.5 items-end">
                    <div className={`w-1 h-2 rounded-sm transition-all ${
                      connectionQuality !== 'disconnected' ? 'bg-white' : 'bg-gray-500'
                    }`} />
                    <div className={`w-1 h-3 rounded-sm transition-all ${
                      connectionQuality === 'excellent' || connectionQuality === 'good' ? 'bg-white' : 'bg-gray-500'
                    }`} />
                    <div className={`w-1 h-4 rounded-sm transition-all ${
                      connectionQuality === 'excellent' ? 'bg-white' : 'bg-gray-500'
                    }`} />
                  </div>
                  
                  {/* Texto de estado */}
                  <span className="text-xs font-medium text-white">
                    {connectionQuality === 'excellent' ? 'Excelente' :
                     connectionQuality === 'good' ? 'Buena' :
                     connectionQuality === 'poor' ? 'Débil' :
                     'Desconectado'}
                  </span>
                  
                  {/* Indicador de reconexión */}
                  {reconnecting && (
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                      <span className="text-xs text-white">
                        Reconectando{reconnectAttempts > 0 ? ` (${reconnectAttempts}/5)` : ''}...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </section>
          {/* Sidebar expandible/colapsable */}
          <aside className={`w-80 bg-gray-900 p-4 flex flex-col transition-all duration-300 ${sidebarVisible ? 'block' : 'hidden'}`} style={{ minWidth: sidebarVisible ? 320 : 0 }}>
            <div>
          </div>
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
                    onClick={() => joinCode.trim() && autoJoinRoom(joinCode.trim())}
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
                              onClick={() => autoJoinRoom(r.roomId)}
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
            ) : 
            /* ⏰ RESTRICCIÓN DE COUNTDOWN COMENTADA PARA PRUEBAS ⏰
            allowedJoinFrom && new Date() < allowedJoinFrom ? (
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
            ) : 
            */ 
            // 🧪 MODO PRUEBAS: Siempre mostrar botón de unirse
            (
              <>
                <p className="text-sm text-gray-300 mb-4">🧪 Modo pruebas: Puedes unirte en cualquier momento.</p>
                {(autoParams?.rid || roomId) && (
                  <button
                    className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white font-semibold mt-2"
                    onClick={() => autoJoinRoom(autoParams?.rid || roomId!)}
                    disabled={isJoining}
                  >
                    {isJoining ? 'Conectando...' : 'Unirse a la videollamada'}
                  </button>
                )}
              </>
            )}
            {appointmentStartAt && (
              <p className="text-xs text-gray-400">Cita: {appointmentStartAt.toLocaleString()}</p>
            )}
            {joinError && <p className="text-sm text-red-400 mt-2">{joinError}</p>}
            <div className="mt-4 flex items-center justify-center gap-2">
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
                onClick={() => joinCode.trim() && autoJoinRoom(joinCode.trim())}
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
                        onClick={() => autoJoinRoom(r.roomId)}
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
      <footer className="bg-gray-900/90 border-t border-gray-800 px-4 py-3 md:px-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300">
          <span className="font-medium text-gray-100 leading-tight">{roomId ? `Sala: ${roomId}` : 'Sin sala activa'}</span>
          <span className="text-gray-400">RTC: {connState}</span>
          <span className="text-gray-400">DC: {dcState}</span>
        </div>

        <div className="flex items-center justify-center gap-3 flex-wrap">
          {roomId && !isJoining && (connState === 'failed' || connState === 'disconnected' || connState === 'closed' || dcState === 'closed' || dcState === 'error') && (
            <button
              onClick={reconnect}
              disabled={reconnecting}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${reconnecting ? 'bg-gray-700 text-gray-400' : 'bg-amber-600 hover:bg-amber-700 text-white'}`}
            >
              {reconnecting ? 'Reconectando...' : 'Reconectar'}
            </button>
          )}
          {roomId && (
            <button onClick={leaveRoom} className="px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-xs font-medium">
              Salir
            </button>
          )}
          <button
            onClick={async () => {
              if (!isScreenSharing) {
                await startScreenShare();
              } else {
                await stopScreenShare();
              }
            }}
            className={`h-10 w-10 flex items-center justify-center rounded-full transition ${isScreenSharing ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-gray-100'}`}
            title={isScreenSharing ? 'Detener compartir pantalla' : 'Compartir pantalla'}
            disabled={!roomId}
          >
            <FiMonitor />
          </button>
          <button
            onClick={toggleMic}
            className={`h-10 w-10 flex items-center justify-center rounded-full transition ${micOn ? 'bg-gray-600 hover:bg-gray-700 text-gray-100' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            title={micOn ? 'Silenciar micrófono' : 'Activar micrófono'}
          >
            {micOn ? <FiMic /> : <FiMicOff />}
          </button>
          <button
            onClick={toggleCamera}
            className={`h-10 w-10 flex items-center justify-center rounded-full transition ${cameraOn ? 'bg-gray-600 hover:bg-gray-700 text-gray-100' : 'bg-red-500 hover:bg-red-600 text-white'}`}
            title={cameraOn ? 'Apagar cámara' : 'Encender cámara'}
          >
            {cameraOn ? <FiVideo /> : <FiVideoOff />}
          </button>
          <button
            onClick={handleEndCall}
            className="h-11 w-11 flex items-center justify-center rounded-full bg-red-500 hover:bg-red-600 text-white transition"
            title="Finalizar y guardar chat"
          >
            <FiPhoneMissed />
          </button>
        </div>

        <div className="flex items-center justify-end gap-2 text-gray-400 text-xs">
          <button className="h-9 w-9 flex items-center justify-center rounded-full bg-gray-800 hover:bg-gray-700 transition">
            <FiMoreVertical />
          </button>
        </div>
      </footer>

      <div className="bg-gray-900/80 border-t border-gray-800 px-4 py-3 text-[0.7rem] sm:text-xs text-gray-400 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <span>© {new Date().getFullYear()} VirtualAid. Comunicación médica cifrada y privada.</span>
        <div className="flex items-center gap-3">
          <a href="/P&T/privacy" className="hover:text-white transition-colors">Privacidad</a>
          <a href="/P&T/terms" className="hover:text-white transition-colors">Términos</a>
        </div>
      </div>
      
      {/* Panel de diagnóstico WebRTC */}
      <DiagnosticPanel
        roomId={roomId}
        role={roleRef.current}
        connectionState={connState}
        dataChannelState={dcState}
        signalingState={pcRef.current?.signalingState}
        iceConnectionState={pcRef.current?.iceConnectionState}
      />
    </div>
  );
}
