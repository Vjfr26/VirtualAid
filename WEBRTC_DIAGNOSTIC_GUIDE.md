# 🔍 VERIFICACIÓN DEL INTERCAMBIO SDP EN WEBRTC

## 📋 Checklist de Verificación

### ✅ 1. VERIFICAR OFERTA (MÉDICO → BACKEND)

**El médico debe:**
1. Iniciar la reunión desde su dashboard (`CitasSection`)
2. Abrir `/reunion?room={token}&who=doctor`
3. Hacer clic en "Unirse a la videollamada"

**En la consola del navegador del médico buscar:**
```
🏥 ====== MÉDICO (CALLER) INICIANDO REUNIÓN ======
[CALLER] 📝 PASO 1: Creando OFFER...
[CALLER] ✅ Offer creada: { type: 'offer', sdpLength: 2345 }
[CALLER] 📤 PASO 2: POST /api/reunion/{roomId}/offer
[CALLER] ✅ Offer enviada exitosamente al servidor
[CALLER] ✅ Verificación exitosa: Offer disponible en servidor
```

**En la consola del servidor (terminal donde corre `npm run dev`) buscar:**
```
[API-OFFER] 📤 POST /api/reunion/{roomId}/offer
[API-OFFER] ✅ SDP parseado correctamente: type=offer, sdp length=2345
[API-OFFER] ✅ Offer guardada exitosamente en sala {roomId}
[API-OFFER] Sala ahora contiene:
  - Offer: true
  - Answer: false
```

### ❌ **Problema**: No se envía la offer

**Síntomas:**
- Console del médico muestra: `[CALLER] ❌ ERROR al enviar offer`
- Console del servidor NO muestra: `[API-OFFER] 📤 POST`

**Solución:**
1. Verificar que `setupPeer` se ejecutó correctamente
2. Verificar que `pc.createOffer()` no falló
3. Verificar network tab: debe haber `POST /api/reunion/{roomId}/offer` con status 200

---

### ✅ 2. VERIFICAR OBTENCIÓN DE OFERTA (BACKEND → PACIENTE)

**El paciente debe:**
1. Abrir el enlace desde "Mis Citas"
2. Abrir `/reunion?room={token}&who=patient&startAt={ISO}`
3. Esperar a que se habilite "Unirse a la videollamada"
4. Hacer clic en el botón

**En la consola del navegador del paciente buscar:**
```
🧑‍💼 ====== PACIENTE (CALLEE) UNIÉNDOSE A REUNIÓN ======
[CALLEE] 📥 PASO 1: Obteniendo OFFER del médico...
[CALLEE] 🔄 Intento 1 - Tiempo: 500ms, Offer presente: false
[CALLEE] 🔄 Intento 2 - Tiempo: 1000ms, Offer presente: true
[CALLEE] ✅✅✅ OFFER ENCONTRADA después de 1000ms (2 intentos)
[CALLEE] ✅ Offer parseada: { type: 'offer', sdpLength: 2345 }
```

**En la consola del servidor buscar:**
```
[API-OFFER] 📥 GET /api/reunion/{roomId}/offer
[API-OFFER] Offer existe: true
[API-OFFER] Offer válida: type=offer, sdp length=2345
```

### ❌ **Problema**: Paciente no encuentra la offer

**Síntomas:**
```
[CALLEE] ❌❌❌ TIMEOUT: No se encontró offer después de 30 intentos (15 segundos)
```

**Causas posibles:**
1. **Médico no inició:** El médico debe entrar PRIMERO y crear la offer
2. **RoomId incorrecto:** Verificar que ambos usan el mismo `token_sala`
3. **Offer no se guardó:** Revisar logs del servidor en POST /offer

**Solución:**
1. Médico debe entrar primero
2. Verificar en Network tab del médico: `POST /api/reunion/{roomId}/offer` → 200 OK
3. Verificar en Network tab del paciente: `GET /api/reunion/{roomId}/offer` → 200 OK con `{ "offer": "{...}" }`

---

### ✅ 3. VERIFICAR RESPUESTA (PACIENTE → BACKEND)

**En la consola del navegador del paciente buscar:**
```
[CALLEE] 📥 PASO 2: setRemoteDescription(offer)...
[CALLEE] ✅✅✅ setRemoteDescription(offer) COMPLETADO
[CALLEE] 📝 PASO 3: Creando ANSWER...
[CALLEE] ✅ Answer creada: { type: 'answer', sdpLength: 1234 }
[CALLEE] 📤 PASO 4: POST /api/reunion/{roomId}/answer
[CALLEE] ✅✅✅ Answer enviada exitosamente al servidor
[CALLEE] ✅ Verificación exitosa: Answer disponible en servidor
```

**En la consola del servidor buscar:**
```
[API-ANSWER] 📤 POST /api/reunion/{roomId}/answer
[API-ANSWER] ✅ SDP parseado correctamente: type=answer, sdp length=1234
[API-ANSWER] ✅ Answer guardada exitosamente en sala {roomId}
[API-ANSWER] 🎉 NEGOCIACIÓN SDP COMPLETA (offer + answer)
```

### ❌ **Problema**: No se envía la answer

**Síntomas:**
- Console del paciente muestra: `[CALLEE] ❌ ERROR al enviar answer`
- Console del servidor NO muestra: `[API-ANSWER] 📤 POST`

**Solución:**
1. Verificar que `setRemoteDescription(offer)` se ejecutó correctamente
2. Verificar que `pc.createAnswer()` no falló
3. Verificar network tab: debe haber `POST /api/reunion/{roomId}/answer` con status 200

---

### ✅ 4. VERIFICAR OBTENCIÓN DE RESPUESTA (BACKEND → MÉDICO)

**En la consola del navegador del médico buscar:**
```
[CALLER] 📥 PASO 3: Esperando ANSWER del paciente...
[CALLER] 🔄 Polling answer (intento 5) - Signaling: have-local-offer, Answer presente: false
[CALLER] 🔄 Polling answer (intento 10) - Signaling: have-local-offer, Answer presente: true
[CALLER] ✅✅✅ ANSWER RECIBIDA (después de 10 intentos)
[CALLER] Answer parseada: { type: 'answer', sdpLength: 1234 }
[CALLER] 📥 PASO 4: setRemoteDescription(answer)...
[CALLER] ✅✅✅ setRemoteDescription(answer) COMPLETADO
[CALLER] Estado signaling: stable
[CALLER] Estado conexión: connected
```

**En la consola del servidor buscar:**
```
[API-ANSWER] 📥 GET /api/reunion/{roomId}/answer
[API-ANSWER] Answer existe: true
[API-ANSWER] Answer válida: type=answer, sdp length=1234
```

### ❌ **Problema**: Médico no recibe la answer

**Síntomas:**
```
[CALLER] 🔄 Polling answer (intento 50) - Signaling: have-local-offer, Answer presente: false
```

**Causas posibles:**
1. **Paciente no respondió:** Verificar console del paciente
2. **Answer no se guardó:** Revisar logs del servidor en POST /answer
3. **Polling detenido:** Verificar que no se cerró el interval

**Solución:**
1. Verificar en Network tab del paciente: `POST /api/reunion/{roomId}/answer` → 200 OK
2. Verificar en Network tab del médico: `GET /api/reunion/{roomId}/answer` → 200 OK con `{ "answer": "{...}" }`
3. Verificar que `pc.signalingState === 'have-local-offer'` en médico

---

## 🛠️ HERRAMIENTAS DE DIAGNÓSTICO

### 1. Panel de Diagnóstico Visual (EN LA UI)

**Cómo usar:**
1. Abrir la página de reunión
2. Hacer clic en el botón flotante 🔍 (esquina inferior derecha)
3. Click en "▶️ Ejecutar Diagnóstico"
4. Revisar los resultados:
   - ✅ Verde: Todo correcto
   - ⚠️ Amarillo: Advertencias (puede continuar)
   - ❌ Rojo: Errores críticos

**Estados a verificar:**
- **RTCPeerConnection**: `connected` (verde) es óptimo
- **DataChannel**: `open` (verde) significa chat funcional
- **Signaling**: `stable` (verde) después de intercambio SDP
- **ICE Connection**: `connected` (verde) significa video/audio fluyen

### 2. Diagnóstico en Consola

```javascript
// En la consola del navegador (F12)
import { quickDiagnostic } from './diagnostics';

// Médico
quickDiagnostic('room-id-aqui', 'caller');

// Paciente
quickDiagnostic('room-id-aqui', 'callee');
```

### 3. Network Tab (Navegador)

**Filtrar por:**
- `reunion/offer` → Debe mostrar POST (médico) y GET (paciente)
- `reunion/answer` → Debe mostrar POST (paciente) y GET (médico)
- `reunion/candidate` → Debe mostrar múltiples POST de ambos

**Verificar:**
- Status: 200 OK
- Response: `{ "ok": true }` para POST
- Response: `{ "offer": "..." }` o `{ "answer": "..." }` para GET

---

## 📊 FLUJO COMPLETO ESPERADO

```
MÉDICO (CALLER)                    SERVIDOR                    PACIENTE (CALLEE)
     │                                 │                              │
     ├─── createOffer() ───────────────┤                              │
     │                                 │                              │
     ├─── POST /offer ─────────────────┤                              │
     │                                 │                              │
     │                                 │◄───── GET /offer ────────────┤
     │                                 │                              │
     │                                 │                              ├─── setRemoteDescription(offer)
     │                                 │                              │
     │                                 │                              ├─── createAnswer()
     │                                 │                              │
     │                                 │◄───── POST /answer ──────────┤
     │                                 │                              │
     ├───── GET /answer ───────────────┤                              │
     │                                 │                              │
     ├─── setRemoteDescription(answer) │                              │
     │                                 │                              │
     ├─── POST /candidate ─────────────┤◄───── POST /candidate ───────┤
     │                                 │                              │
     ├───── GET /candidates ───────────┤                              │
     │                                 │                              │
     │                                 │◄───── GET /candidates ───────┤
     │                                 │                              │
     ├─── addIceCandidate() ───────────┤                              ├─── addIceCandidate()
     │                                 │                              │
     ├─────────────────── ICE CONNECTED ─────────────────────────────┤
     │                                 │                              │
     ├─────────────────── VIDEO/AUDIO FLOWING ──────────────────────┤
```

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Problema 1: "Missing sdp" en POST /offer o /answer

**Causa:** El frontend está enviando mal el payload

**Verificar:**
```javascript
// Debe ser:
await postOffer(roomId, JSON.stringify(offer));
// NO debe ser:
await postOffer(roomId, offer); // ❌ Incorrecto
```

**Solución:** Verificar que `services.ts` hace `JSON.stringify({ sdp })`

---

### Problema 2: "Invalid SDP format"

**Causa:** El SDP no es JSON válido

**Verificar en consola:**
```javascript
const offer = await pc.createOffer();
console.log('Offer:', JSON.stringify(offer, null, 2));
// Debe mostrar: { "type": "offer", "sdp": "v=0..." }
```

**Solución:** Asegurar que `offer` tiene propiedades `type` y `sdp`

---

### Problema 3: Signaling state incorrecto

**Síntomas:**
- Médico queda en `have-local-offer` indefinidamente
- Paciente no puede crear answer

**Verificar:**
```javascript
console.log('Signaling state:', pc.signalingState);
// Caller después de setLocalDescription(offer): 'have-local-offer'
// Callee después de setRemoteDescription(offer): 'have-remote-offer'
// Caller después de setRemoteDescription(answer): 'stable'
```

**Solución:** Verificar que el flujo es:
1. Caller: `setLocalDescription(offer)` → `have-local-offer`
2. Callee: `setRemoteDescription(offer)` → `have-remote-offer`
3. Callee: `setLocalDescription(answer)` → `stable`
4. Caller: `setRemoteDescription(answer)` → `stable`

---

### Problema 4: ICE candidates no se intercambian

**Síntomas:**
- Connection state queda en `connecting`
- ICE state queda en `checking`

**Verificar:**
```javascript
pc.onicecandidate = (e) => {
  console.log('ICE candidate:', e.candidate);
  // Debe dispararse múltiples veces
};
```

**Solución:**
1. Verificar que `postCandidate` se llama en `onicecandidate`
2. Verificar que el polling de candidates está activo
3. Verificar que `addIceCandidate` no falla

---

## 📝 RESUMEN: LO QUE DEBE PASAR

### ✅ SI TODO FUNCIONA CORRECTAMENTE:

1. **Médico inicia** → Logs de `[CALLER]` muestran offer creada y enviada
2. **Servidor guarda** → Logs de `[API-OFFER] POST` confirman guardado
3. **Paciente obtiene** → Logs de `[CALLEE]` muestran offer recibida
4. **Paciente responde** → Logs de `[CALLEE]` muestran answer creada y enviada
5. **Servidor guarda** → Logs de `[API-ANSWER] POST` confirman guardado
6. **Médico obtiene** → Logs de `[CALLER]` muestran answer recibida
7. **Conexión establecida** → Ambos ven `connectionState: connected`
8. **Video fluye** → Se ven mutuamente en pantalla

### ❌ SI ALGO FALLA:

1. Revisar consola del navegador (F12)
2. Revisar terminal del servidor
3. Revisar Network tab
4. Usar panel de diagnóstico visual
5. Verificar orden: MÉDICO PRIMERO, LUEGO PACIENTE

---

## 🎯 COMANDOS ÚTILES

```bash
# Ver logs del servidor en tiempo real
npm run dev

# Limpiar caché de Next.js
rm -rf .next

# Reiniciar servidor
Ctrl+C
npm run dev
```

---

## 📧 DEBUGGING AVANZADO

Si nada funciona, exportar logs:

```javascript
// En consola del navegador
const logs = [];
const originalLog = console.log;
console.log = (...args) => {
  logs.push(args);
  originalLog(...args);
};

// Después de probar la reunión
copy(JSON.stringify(logs, null, 2));
// Pegar en archivo logs.json
```

---

**Última actualización:** 9 de octubre de 2025
