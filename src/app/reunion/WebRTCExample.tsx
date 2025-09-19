
import React, { useRef, useState } from "react";

// Simula tus funciones de signaling (reemplaza por tus endpoints reales)
async function postOffer(roomId: string, offer: RTCSessionDescriptionInit): Promise<void> { /* ... */ }
async function getOffer(roomId: string): Promise<RTCSessionDescriptionInit | null> { return null; }
async function postAnswer(roomId: string, answer: RTCSessionDescriptionInit): Promise<void> { /* ... */ }
async function getAnswer(roomId: string): Promise<RTCSessionDescriptionInit | null> { return null; }
async function postCandidate(roomId: string, role: "caller"|"callee", candidate: RTCIceCandidateInit): Promise<void> { /* ... */ }
async function getCandidates(roomId: string, role: "caller"|"callee"): Promise<{ candidates: RTCIceCandidateInit[] }> { return { candidates: [] }; }

export default function WebRTCExample() {
  const [roomId, setRoomId] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const dcRef = useRef<RTCDataChannel | null>(null);
  const pollingIntervals = useRef<NodeJS.Timeout[]>([]);

  // Utilidad para limpiar todos los intervalos
  const clearAllIntervals = () => {
    pollingIntervals.current.forEach(clearInterval);
    pollingIntervals.current = [];
  };

  // Crear sala (caller)
  const createRoom = async () => {
    clearAllIntervals();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;
    const dc = pc.createDataChannel("chat");
    dcRef.current = dc;
    dc.onopen = () => { setConnected(true); console.log("Caller: DataChannel open"); };
    dc.onclose = () => { setConnected(false); console.log("Caller: DataChannel closed"); };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        postCandidate(roomId, "caller", e.candidate.toJSON());
        console.log("Caller: ICE candidate sent", e.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Caller: RTC state", pc.connectionState);
      if (["connected", "failed", "disconnected", "closed"].includes(pc.connectionState)) clearAllIntervals();
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await postOffer(roomId, offer);
    console.log("Caller: offer creada y enviada", offer.sdp);

    // Esperar answer
    const answerInterval = setInterval(async () => {
      const answer = await getAnswer(roomId);
      if (answer) {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        console.log("Caller: answer recibida y aplicada", answer.sdp);
        clearInterval(answerInterval);
      }
    }, 1000);
    pollingIntervals.current.push(answerInterval);

    // Recibir candidates del callee (sin duplicados)
    const addedCandidates = new Set<string>();
    const candidateInterval = setInterval(async () => {
      const { candidates } = await getCandidates(roomId, "caller");
      for (const c of candidates) {
        const key = JSON.stringify(c);
        if (!addedCandidates.has(key)) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(c));
            console.log("Caller: ICE candidate recibida y agregada", c);
          } catch (err) {
            console.warn("Caller: Error agregando candidate", err, c);
          }
          addedCandidates.add(key);
        }
      }
    }, 1000);
    pollingIntervals.current.push(candidateInterval);
  };

  // Unirse a sala (callee)
  const joinRoom = async () => {
    clearAllIntervals();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pcRef.current = pc;
    let remoteSet = false;
    const candidateBuffer: RTCIceCandidateInit[] = [];
    const addedCandidates = new Set<string>();

    pc.ondatachannel = (e) => {
      dcRef.current = e.channel;
      e.channel.onopen = () => { setConnected(true); console.log("Callee: DataChannel open"); };
      e.channel.onclose = () => { setConnected(false); console.log("Callee: DataChannel closed"); };
    };

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        postCandidate(roomId, "callee", e.candidate.toJSON());
        console.log("Callee: ICE candidate sent", e.candidate);
      }
    };

    pc.onconnectionstatechange = () => {
      console.log("Callee: RTC state", pc.connectionState);
      if (["connected", "failed", "disconnected", "closed"].includes(pc.connectionState)) clearAllIntervals();
    };

    // Esperar offer
    let offer: RTCSessionDescriptionInit | null = null;
    while (!offer) {
      offer = await getOffer(roomId);
      if (!offer) await new Promise((r) => setTimeout(r, 500));
    }
    await pc.setRemoteDescription(new RTCSessionDescription(offer));
    remoteSet = true;
    console.log("Callee: offer recibida y aplicada", offer.sdp);

    // Agregar candidates en buffer si llegaron antes de setRemoteDescription
    for (const c of candidateBuffer) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
        console.log("Callee: ICE candidate buffered y agregada", c);
      } catch (err) {
        console.warn("Callee: Error agregando candidate bufferizado", err, c);
      }
    }
    candidateBuffer.length = 0;

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await postAnswer(roomId, answer);
    console.log("Callee: answer creada y enviada", answer.sdp);

    // Recibir candidates del caller (sin duplicados, buffer si no está remoteSet)
    const candidateInterval = setInterval(async () => {
      const { candidates } = await getCandidates(roomId, "callee");
      for (const c of candidates) {
        const key = JSON.stringify(c);
        if (!addedCandidates.has(key)) {
          if (remoteSet) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(c));
              console.log("Callee: ICE candidate recibida y agregada", c);
            } catch (err) {
              console.warn("Callee: Error agregando candidate", err, c);
            }
          } else {
            candidateBuffer.push(c);
            console.log("Callee: ICE candidate recibida y bufferizada", c);
          }
          addedCandidates.add(key);
        }
      }
    }, 1000);
    pollingIntervals.current.push(candidateInterval);
  };

  return (
    <div>
      <input value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="Room ID" />
      <button onClick={createRoom}>Crear sala</button>
      <button onClick={joinRoom}>Unirse a sala</button>
      <div>Estado: {connected ? "Conectado" : "Desconectado"}</div>
    </div>
  );
}
