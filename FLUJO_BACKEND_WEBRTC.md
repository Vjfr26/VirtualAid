# 📡 Flujo WebRTC - Backend Completo Implementado

## 🎯 Implementación del Flujo del Backend

Este documento detalla cómo se ha implementado el flujo completo de WebRTC según las especificaciones del backend.

---

## 🔄 Flujo Completo de Videollamada

### 1️⃣ **Obtener roomId (token) y abrir la sala**

**Backend:**
```powershell
Invoke-RestMethod -Method GET -Uri "http://13.60.223.37/api/cita/1/room"
```

**Frontend Implementado:**
- Automático al navegar con parámetro `?room=<roomId>`
- También soportado al hacer clic en "Iniciar Reunión" desde `CitasSection`

---

### 2️⃣ **Ver estado inicial de la sala**

**Backend:**
```powershell
Invoke-RestMethod -Method GET -Uri "http://13.60.223.37/api/reunion/<roomId>/state"
```

**Frontend Implementado:**
```typescript
// services.ts
export const getState = (roomId: string) => 
  api<RoomState>(`reunion/${roomId}/state`);

// page.tsx - autoJoinRoom()
const remoteState = await getState(rid);
console.log('[AutoJoin] Estado remoto recibido:', remoteState);
```

**API Route:**
- `src/app/api/reunion/[room]/state/route.ts` ✅ Existente

---

### 3️⃣ **Caller publica la oferta con clientId (opcional)**

**Backend:**
```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri "http://13.60.223.37/api/reunion/<roomId>/offer" `
  -Body (@{
      sdp      = "<SDP_DE_LA_OFERTA>"
      clientId = "caller-123"
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

**Frontend Implementado:**
```typescript
// services.ts - ACTUALIZADO ✅
export const postOffer = (roomId: string, sdp: string, clientId?: string) => 
  api<{ ok: true }>(`reunion/${roomId}/offer`, { 
    method: 'POST', 
    body: JSON.stringify({ sdp, clientId }) 
  });

// page.tsx - startAsCaller()
console.log(`\n[CALLER] 📤 PASO 2: POST /api/reunion/${rid}/offer`);
await postOffer(rid, offerJSON);
console.log(`[CALLER] ✅ Offer enviada exitosamente al servidor`);
```

**API Route:**
- `src/app/api/reunion/[room]/offer/route.ts` ✅ Actualizado para aceptar `clientId`

---

### 4️⃣ **Caller hace polling de answer**

**Backend:**
```powershell
Invoke-RestMethod -Method GET -Uri "http://13.60.223.37/api/reunion/<roomId>/answer"
```

**Frontend Implementado:**
```typescript
// services.ts
export const getAnswer = (roomId: string) => 
  api<{ answer: string | null }>(`reunion/${roomId}/answer`);

// page.tsx - startAsCaller()
console.log(`\n[CALLER] 📥 PASO 3: Esperando ANSWER del paciente...`);
pollingRef.current = setInterval(async () => {
  const ans = await getAnswer(rid);
  if (ans.answer && pc.signalingState === 'have-local-offer') {
    console.log(`\n[CALLER] ✅✅✅ ANSWER RECIBIDA`);
    await pc.setRemoteDescription(new RTCSessionDescription(answerDesc));
  }
}, 1000);
```

**API Route:**
- `src/app/api/reunion/[room]/answer/route.ts` ✅ Existente

---

### 5️⃣ **Callee obtiene la oferta**

**Backend:**
```powershell
Invoke-RestMethod -Method GET -Uri "http://13.60.223.37/api/reunion/<roomId>/offer"
```

**Frontend Implementado:**
```typescript
// services.ts
export const getOffer = (roomId: string) => 
  api<{ offer: string | null }>(`reunion/${roomId}/offer`);

// page.tsx - joinAndAnswer()
console.log(`[CALLEE] 📥 PASO 1: Obteniendo OFFER...`);
const offerResponse = await getOffer(rid);
if (offerResponse?.offer) {
  console.log(`[CALLEE] ✅✅✅ OFFER ENCONTRADA`);
}
```

**API Route:**
- `src/app/api/reunion/[room]/offer/route.ts` ✅ Existente

---

### 6️⃣ **Callee publica la respuesta**

**Backend:**
```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri "http://13.60.223.37/api/reunion/<roomId>/answer" `
  -Body (@{ sdp = "<SDP_DE_LA_RESPUESTA>" } | ConvertTo-Json) `
  -ContentType "application/json"
```

**Frontend Implementado:**
```typescript
// services.ts
export const postAnswer = (roomId: string, sdp: string) => 
  api<{ ok: true }>(`reunion/${roomId}/answer`, { 
    method: 'POST', 
    body: JSON.stringify({ sdp }) 
  });

// page.tsx - joinAndAnswer()
console.log(`[CALLEE] 📤 PASO 4: POST /api/reunion/${rid}/answer`);
await postAnswer(rid, answerJSON);
console.log(`[CALLEE] ✅✅✅ Answer enviada exitosamente`);
```

**API Route:**
- `src/app/api/reunion/[room]/answer/route.ts` ✅ Existente

---

### 7️⃣ **Intercambio de ICE candidates**

#### Publicar candidato

**Backend:**
```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri "http://13.60.223.37/api/reunion/<roomId>/candidate" `
  -Body (@{
      from      = "caller"  # o "callee"
      candidate = @{ sdpMid = "0"; candidate = "candidate:..." }
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

**Frontend Implementado:**
```typescript
// services.ts
export const postCandidate = (roomId: string, from: 'caller'|'callee', candidate: RTCIceCandidateInit) =>
  api<{ ok: true }>(`reunion/${roomId}/candidate`, { 
    method: 'POST', 
    body: JSON.stringify({ from, candidate }) 
  });

// page.tsx - setupPeer()
pc.onicecandidate = (e) => {
  if (e.candidate) {
    console.log(`[SetupPeer] 📡 ICE candidate generada (${fromRole})`);
    postCandidate(rid, fromRole, e.candidate.toJSON());
  }
};
```

**API Route:**
- `src/app/api/reunion/[room]/candidate/route.ts` ✅ Actualizado con timestamp

#### Obtener candidatos con filtro `since`

**Backend:**
```powershell
Invoke-RestMethod `
  -Method GET `
  -Uri "http://13.60.223.37/api/reunion/<roomId>/candidates?for=caller&since=2025-10-09T15:45:00Z"
```

**Frontend Implementado:**
```typescript
// services.ts - ACTUALIZADO ✅
export const getCandidates = (roomId: string, _for: 'caller'|'callee', since?: string) => {
  const params = since ? `?for=${_for}&since=${encodeURIComponent(since)}` : `?for=${_for}`;
  return api<{ candidates: RTCIceCandidateInit[] }>(`reunion/${roomId}/candidates${params}`);
};

// page.tsx - setupPeer()
const pollCandidates = setInterval(async () => {
  const { candidates } = await getCandidates(rid, counterpart);
  for (const cand of candidates) {
    if (remoteSet) {
      await pc.addIceCandidate(new RTCIceCandidate(cand));
    }
  }
}, 1000);
```

**API Route:**
- `src/app/api/reunion/[room]/candidates/route.ts` ✅ Actualizado con soporte `since`

---

### 8️⃣ **Mantener la sala viva (Heartbeat)**

**Backend:**
```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri "http://13.60.223.37/api/reunion/<roomId>/heartbeat" `
  -Body (@{
      messages = @(
        @{ type = "text"; sender = "paciente@example.com"; text = "Hola"; timestamp = (Get-Date).ToString("o") }
      )
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

**Frontend Implementado:**
```typescript
// services.ts - NUEVO ✅
export const sendHeartbeat = (roomId: string, messages: ChatMessage[]) =>
  api<{ ok: true }>(`reunion/${roomId}/heartbeat`, { 
    method: 'POST', 
    body: JSON.stringify({ messages }) 
  });

// page.tsx - useEffect con heartbeat ✅
useEffect(() => {
  if (!roomId || connState !== 'connected') return;
  
  console.log(`[Heartbeat] 💓 Iniciando sistema de heartbeat`);
  
  const heartbeatInterval = setInterval(async () => {
    await sendHeartbeat(roomId, messagesToBackup);
    console.log(`[Heartbeat] ✅ Heartbeat enviado`);
  }, 30000); // Cada 30 segundos
  
  return () => clearInterval(heartbeatInterval);
}, [roomId, connState, messages]);
```

**API Route:**
- `src/app/api/reunion/[room]/heartbeat/route.ts` ✅ CREADO

---

### 9️⃣ **Confirmar conexión WebRTC (marca asistencia)**

**Backend:**
```powershell
Invoke-RestMethod -Method POST -Uri "http://13.60.223.37/api/reunion/<roomId>/confirm-connection"
```

**Frontend Implementado:**
```typescript
// services.ts - NUEVO ✅
export const confirmConnection = (roomId: string) =>
  api<{ ok: true }>(`reunion/${roomId}/confirm-connection`, { method: 'POST' });

// page.tsx - setupPeer() onconnectionstatechange ✅
pc.onconnectionstatechange = () => {
  if (pc.connectionState === 'connected') {
    console.log(`[SetupPeer] 🎉 Conexión WebRTC establecida`);
    import('./services').then(({ confirmConnection }) => {
      confirmConnection(rid).then(() => {
        console.log(`[SetupPeer] ✅ Conexión confirmada en el backend`);
      });
    });
  }
};
```

**API Route:**
- `src/app/api/reunion/[room]/confirm-connection/route.ts` ✅ CREADO

---

### 🔟 **Listar salas activas (opcional)**

**Backend:**
```powershell
Invoke-RestMethod -Method GET -Uri "http://13.60.223.37/api/reunion/rooms?open=true"
```

**Frontend Implementado:**
```typescript
// services.ts
export const listRooms = (openOnly = false) => 
  api<{ rooms: RoomInfo[] }>(`reunion/rooms${openOnly ? '?open=true' : ''}`);

// page.tsx - refreshRooms()
const refreshRooms = useCallback(async () => {
  const { rooms } = await listRooms(true);
  setRooms(rooms);
}, []);
```

**API Route:**
- `src/app/api/reunion/rooms/route.ts` ✅ Existente

---

### 1️⃣1️⃣ **Finalizar chat y cerrar sala**

#### Guardar historial completo

**Backend:**
```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri "http://13.60.223.37/api/reunion/<roomId>/finalizar" `
  -Body (@{
      messages = @(
        @{ type = "text"; sender = "paciente@example.com"; text = "Gracias"; timestamp = (Get-Date).ToString("o") }
      )
  } | ConvertTo-Json) `
  -ContentType "application/json"
```

**Frontend Implementado:**
```typescript
// services.ts
export const finalizarChat = (roomId: string, messages: ChatMessage[]) =>
  api<{ saved: boolean; path: string }>(`reunion/${roomId}/finalizar`, { 
    method: 'POST', 
    body: JSON.stringify({ messages }) 
  });

// page.tsx - handleEndCall()
console.log(`[EndCall] 💾 Guardando historial de chat...`);
await finalizarChat(roomId, messages);
console.log(`[EndCall] ✅ Chat guardado exitosamente`);
```

**API Route:**
- `src/app/api/reunion/[room]/finalizar/route.ts` ✅ Existente

#### Eliminar sala en cache

**Backend:**
```powershell
Invoke-RestMethod -Method DELETE -Uri "http://13.60.223.37/api/reunion/<roomId>"
```

**Frontend Implementado:**
```typescript
// services.ts - NUEVO ✅
export const deleteRoom = (roomId: string) =>
  api<{ ok: true; deleted: boolean }>(`reunion/${roomId}`, { method: 'DELETE' });

// page.tsx - handleEndCall()
console.log(`[EndCall] 🗑️ Eliminando sala del cache...`);
const { deleteRoom } = await import('./services');
await deleteRoom(roomId);
console.log(`[EndCall] ✅ Sala eliminada del cache`);
```

**API Route:**
- `src/app/api/reunion/[room]/route.ts` ✅ Existente (DELETE handler)

---

## 📊 Resumen de Cambios

### ✅ Archivos Modificados

1. **`src/app/reunion/services.ts`**
   - ✅ Agregado `clientId` a `postOffer()`
   - ✅ Agregado parámetro `since` a `getCandidates()`
   - ✅ Creado `sendHeartbeat()`
   - ✅ Creado `confirmConnection()`
   - ✅ Creado `deleteRoom()`
   - ✅ Actualizado tipo `ChatMessage` para incluir `text` y `timestamp`

2. **`src/app/reunion/page.tsx`**
   - ✅ Agregado logging de `clientId` en `startAsCaller()`
   - ✅ Implementado sistema de heartbeat (useEffect)
   - ✅ Llamada a `confirmConnection()` en `onconnectionstatechange`
   - ✅ Llamada a `deleteRoom()` en `handleEndCall()`
   - ✅ Logs mejorados para todo el flujo

3. **`src/app/api/reunion/_store.ts`**
   - ✅ Agregado campo `lastHeartbeat?: number`
   - ✅ Agregado campo `connectionConfirmed?: boolean`

4. **`src/app/api/reunion/[room]/offer/route.ts`**
   - ✅ Soporte para `clientId` en POST

5. **`src/app/api/reunion/[room]/candidate/route.ts`**
   - ✅ Timestamp agregado a candidatos en POST
   - ✅ Logging mejorado

6. **`src/app/api/reunion/[room]/candidates/route.ts`**
   - ✅ Soporte para filtro `since` en GET
   - ✅ Timestamp agregado a candidatos en POST

### ✅ Archivos Creados

1. **`src/app/api/reunion/[room]/heartbeat/route.ts`** ✅ NUEVO
   - POST handler para heartbeat
   - Actualiza `lastHeartbeat` timestamp
   - Respaldo opcional de mensajes

2. **`src/app/api/reunion/[room]/confirm-connection/route.ts`** ✅ NUEVO
   - POST handler para confirmar conexión
   - Marca `connectionConfirmed = true`
   - Puede integrarse con marcado de asistencia

---

## 🧪 Pruebas del Flujo

### Orden de Logs Esperado

#### **Médico (Caller):**
```
🏥 ====== MÉDICO (CALLER) INICIANDO REUNIÓN ======
[CALLER] 📝 PASO 1: Creando OFFER...
[CALLER] ✅ Offer creada
[CALLER] 📤 PASO 2: POST /api/reunion/xxx/offer
[API-OFFER] 📤 POST con clientId (si se pasa)
[CALLER] ✅ Offer enviada exitosamente
[CALLER] 📥 PASO 3: Esperando ANSWER...
[CALLER] 🔄 Polling answer...
[CALLER] ✅✅✅ ANSWER RECIBIDA
[CALLER] 📥 PASO 4: setRemoteDescription(answer)
[SetupPeer] 🔄 connectionState: connected
[SetupPeer] 🎉 Conexión WebRTC establecida
[API-CONFIRM] ✅ Conexión confirmada
[Heartbeat] 💓 Iniciando sistema de heartbeat
[Heartbeat] ✅ Heartbeat enviado (cada 30s)
```

#### **Paciente (Callee):**
```
🧑‍💼 ====== PACIENTE (CALLEE) UNIÉNDOSE A REUNIÓN ======
[CALLEE] 📥 PASO 1: Obteniendo OFFER...
[CALLEE] ✅✅✅ OFFER ENCONTRADA
[CALLEE] 📥 PASO 2: setRemoteDescription(offer)
[CALLEE] 📝 PASO 3: Creando ANSWER...
[CALLEE] 📤 PASO 4: POST /api/reunion/xxx/answer
[API-ANSWER] 🎉 NEGOCIACIÓN SDP COMPLETA
[CALLEE] ✅✅✅ Answer enviada exitosamente
[SetupPeer] 🔄 connectionState: connected
[SetupPeer] 🎉 Conexión WebRTC establecida
[API-CONFIRM] ✅ Conexión confirmada
[Heartbeat] 💓 Iniciando sistema de heartbeat
```

#### **Finalizar:**
```
[EndCall] 🔚 Finalizando llamada...
[EndCall] 💾 Guardando historial de chat...
[API-FINALIZAR] Guardando X mensajes
[EndCall] ✅ Chat guardado exitosamente
[EndCall] 🗑️ Eliminando sala del cache...
[API-DELETE] Sala eliminada
[EndCall] ✅ Sala eliminada del cache
[EndCall] ✅ Llamada finalizada completamente
```

---

## 🎯 Endpoints Completos

| Método | Endpoint | Descripción | Estado |
|--------|----------|-------------|--------|
| POST | `/api/reunion/create` | Crear nueva sala | ✅ Existente |
| GET | `/api/reunion/rooms?open=true` | Listar salas activas | ✅ Existente |
| GET | `/api/reunion/[room]/state` | Ver estado de sala | ✅ Existente |
| POST | `/api/reunion/[room]/offer` | Publicar SDP offer (con clientId) | ✅ Actualizado |
| GET | `/api/reunion/[room]/offer` | Obtener SDP offer | ✅ Existente |
| POST | `/api/reunion/[room]/answer` | Publicar SDP answer | ✅ Existente |
| GET | `/api/reunion/[room]/answer` | Obtener SDP answer | ✅ Existente |
| POST | `/api/reunion/[room]/candidate` | Publicar ICE candidate | ✅ Actualizado |
| GET | `/api/reunion/[room]/candidates?for=X&since=Y` | Obtener candidatos con filtro | ✅ Actualizado |
| POST | `/api/reunion/[room]/heartbeat` | Mantener sala viva | ✅ CREADO |
| POST | `/api/reunion/[room]/confirm-connection` | Confirmar conexión WebRTC | ✅ CREADO |
| POST | `/api/reunion/[room]/finalizar` | Guardar chat completo | ✅ Existente |
| DELETE | `/api/reunion/[room]` | Eliminar sala del cache | ✅ Existente |

---

## 🚀 Próximos Pasos

1. **Reiniciar el servidor:**
   ```bash
   npm run dev
   ```

2. **Probar el flujo completo:**
   - Crear reunión como médico
   - Unirse como paciente
   - Verificar logs en consola
   - Revisar que se llame `confirm-connection` al conectar
   - Verificar heartbeat cada 30 segundos
   - Finalizar llamada y verificar eliminación de sala

3. **Verificar endpoints en Network tab:**
   - POST `/api/reunion/xxx/offer` (con clientId si se pasa)
   - GET `/api/reunion/xxx/candidates?for=callee&since=...`
   - POST `/api/reunion/xxx/heartbeat` (cada 30s después de conectar)
   - POST `/api/reunion/xxx/confirm-connection` (al conectar)
   - DELETE `/api/reunion/xxx` (al finalizar)

---

**✅ Flujo completo implementado según especificaciones del backend**
