# 🔄 Flujo WebRTC - Diagrama Completo

## 📊 Secuencia de Comunicación

```
┌─────────────────┐                    ┌─────────────────┐                    ┌─────────────────┐
│   MÉDICO        │                    │    SERVIDOR     │                    │   PACIENTE      │
│   (Caller)      │                    │   (Signaling)   │                    │   (Callee)      │
└────────┬────────┘                    └────────┬────────┘                    └────────┬────────┘
         │                                      │                                      │
         │ 1. Navega a reunión                 │                                      │
         │ ?room=xxx                            │                                      │
         ├─────────────────────────────────────▶│                                      │
         │                                      │                                      │
         │ 2. GET /api/reunion/xxx/state       │                                      │
         ├─────────────────────────────────────▶│                                      │
         │◀─────────────────────────────────────┤                                      │
         │ { hasOffer: false, hasAnswer: false }│                                      │
         │                                      │                                      │
         │ 3. Actúa como CALLER                │                                      │
         │ createOffer()                        │                                      │
         │                                      │                                      │
         │ 4. POST /api/reunion/xxx/offer      │                                      │
         │ { sdp: "...", clientId: "..." }     │                                      │
         ├─────────────────────────────────────▶│                                      │
         │◀─────────────────────────────────────┤                                      │
         │ { ok: true }                         │                                      │
         │                                      │                                      │
         │ 5. Poll GET /api/reunion/xxx/answer │                                      │
         │ (cada 1 segundo)                     │                                      │
         ├─────────────────────────────────────▶│                                      │
         │◀─────────────────────────────────────┤                                      │
         │ { answer: null }                     │                                      │
         │                                      │                                      │
         │                                      │ 6. Navega a reunión                  │
         │                                      │ ?room=xxx                             │
         │                                      │◀─────────────────────────────────────┤
         │                                      │                                      │
         │                                      │ 7. GET /api/reunion/xxx/state        │
         │                                      │◀─────────────────────────────────────┤
         │                                      ├─────────────────────────────────────▶│
         │                                      │ { hasOffer: true, hasAnswer: false } │
         │                                      │                                      │
         │                                      │ 8. Actúa como CALLEE                 │
         │                                      │                                      │
         │                                      │ 9. GET /api/reunion/xxx/offer        │
         │                                      │◀─────────────────────────────────────┤
         │                                      ├─────────────────────────────────────▶│
         │                                      │ { offer: "..." }                     │
         │                                      │                                      │
         │                                      │ 10. setRemoteDescription(offer)      │
         │                                      │ createAnswer()                        │
         │                                      │                                      │
         │                                      │ 11. POST /api/reunion/xxx/answer     │
         │                                      │ { sdp: "..." }                        │
         │                                      │◀─────────────────────────────────────┤
         │                                      ├─────────────────────────────────────▶│
         │                                      │ { ok: true }                         │
         │                                      │                                      │
         │ 12. GET /api/reunion/xxx/answer     │                                      │
         ├─────────────────────────────────────▶│                                      │
         │◀─────────────────────────────────────┤                                      │
         │ { answer: "..." } ✅                 │                                      │
         │                                      │                                      │
         │ 13. setRemoteDescription(answer)    │                                      │
         │                                      │                                      │
         │════════════════════════════════════════════════════════════════════════════│
         │               🎉 NEGOCIACIÓN SDP COMPLETA                                   │
         │════════════════════════════════════════════════════════════════════════════│
         │                                      │                                      │
         │ 14. onicecandidate                   │ 14. onicecandidate                   │
         │ POST /api/reunion/xxx/candidate     │ POST /api/reunion/xxx/candidate      │
         │ { from: "caller", candidate: {...} } │ { from: "callee", candidate: {...} } │
         ├─────────────────────────────────────▶│◀─────────────────────────────────────┤
         │                                      │                                      │
         │ 15. Poll candidates                  │ 15. Poll candidates                  │
         │ GET /candidates?for=callee&since=... │ GET /candidates?for=caller&since=... │
         ├─────────────────────────────────────▶│◀─────────────────────────────────────┤
         │◀─────────────────────────────────────┤──────────────────────────────────────▶│
         │ { candidates: [...] }                │ { candidates: [...] }                │
         │                                      │                                      │
         │ addIceCandidate(...)                 │ addIceCandidate(...)                 │
         │                                      │                                      │
         │════════════════════════════════════════════════════════════════════════════│
         │              ✅ CONEXIÓN ICE ESTABLECIDA                                    │
         │════════════════════════════════════════════════════════════════════════════│
         │                                      │                                      │
         │ 16. onconnectionstatechange:         │ 16. onconnectionstatechange:         │
         │     "connected"                      │     "connected"                      │
         │                                      │                                      │
         │ POST /api/reunion/xxx/confirm-conn  │ POST /api/reunion/xxx/confirm-conn   │
         ├─────────────────────────────────────▶│◀─────────────────────────────────────┤
         │◀─────────────────────────────────────┤──────────────────────────────────────▶│
         │ { ok: true } ✅ Asistencia marcada   │ { ok: true } ✅                      │
         │                                      │                                      │
         │════════════════════════════════════════════════════════════════════════════│
         │            🎥 VIDEOLLAMADA EN CURSO                                         │
         │════════════════════════════════════════════════════════════════════════════│
         │                                      │                                      │
         │ 17. Heartbeat (cada 30s)             │ 17. Heartbeat (cada 30s)             │
         │ POST /api/reunion/xxx/heartbeat     │ POST /api/reunion/xxx/heartbeat      │
         │ { messages: [...] }                  │ { messages: [...] }                  │
         ├─────────────────────────────────────▶│◀─────────────────────────────────────┤
         │◀─────────────────────────────────────┤──────────────────────────────────────▶│
         │ { ok: true }                         │ { ok: true }                         │
         │                                      │                                      │
         │ DataChannel: Mensajes de chat en    │ DataChannel: Mensajes de chat en     │
         │              tiempo real             │              tiempo real             │
         │◀─────────────────────────────────────┼──────────────────────────────────────▶│
         │                                      │                                      │
         │════════════════════════════════════════════════════════════════════════════│
         │            🔚 FINALIZAR LLAMADA                                             │
         │════════════════════════════════════════════════════════════════════════════│
         │                                      │                                      │
         │ 18. POST /api/reunion/xxx/finalizar │                                      │
         │ { messages: [...] }                  │                                      │
         ├─────────────────────────────────────▶│                                      │
         │◀─────────────────────────────────────┤                                      │
         │ { saved: true, path: "..." }         │                                      │
         │                                      │                                      │
         │ 19. DELETE /api/reunion/xxx          │                                      │
         ├─────────────────────────────────────▶│                                      │
         │◀─────────────────────────────────────┤                                      │
         │ { ok: true, deleted: true }          │                                      │
         │                                      │                                      │
         │ Close connections                    │ Close connections                    │
         │                                      │                                      │
         ▼                                      ▼                                      ▼
```

---

## 🎯 Estados de Conexión

### 1. **Signaling State** (Negociación SDP)
```
Médico:  stable → have-local-offer → stable
Paciente: stable → have-remote-offer → stable
```

### 2. **Connection State** (P2P)
```
new → connecting → connected → (disconnected/failed/closed)
```

### 3. **ICE Connection State**
```
new → checking → connected → completed
```

### 4. **DataChannel State**
```
connecting → open → (closing → closed)
```

---

## 📡 Endpoints por Etapa

| Etapa | Médico (Caller) | Paciente (Callee) |
|-------|----------------|-------------------|
| **Setup** | GET /state | GET /state |
| **Offer** | POST /offer | GET /offer |
| **Answer** | GET /answer (poll) | POST /answer |
| **ICE** | POST /candidate<br>GET /candidates?for=callee | POST /candidate<br>GET /candidates?for=caller |
| **Confirm** | POST /confirm-connection | POST /confirm-connection |
| **Active** | POST /heartbeat (30s) | POST /heartbeat (30s) |
| **End** | POST /finalizar<br>DELETE /room | - |

---

## 🔍 Verificación de Logs

### ✅ Logs que DEBEN aparecer en orden:

#### Médico:
1. `🏥 ====== MÉDICO (CALLER) INICIANDO REUNIÓN ======`
2. `[CALLER] 📝 PASO 1: Creando OFFER...`
3. `[CALLER] 📤 PASO 2: POST /api/reunion/xxx/offer`
4. `[API-OFFER] 📤 POST (con clientId si se pasa)`
5. `[CALLER] 📥 PASO 3: Esperando ANSWER...`
6. `[CALLER] ✅✅✅ ANSWER RECIBIDA`
7. `[CALLER] 📥 PASO 4: setRemoteDescription(answer)`
8. `[SetupPeer] 🔄 connectionState: connected`
9. `[API-CONFIRM] ✅ Conexión confirmada`
10. `[Heartbeat] 💓 Iniciando sistema de heartbeat`

#### Paciente:
1. `🧑‍💼 ====== PACIENTE (CALLEE) UNIÉNDOSE A REUNIÓN ======`
2. `[CALLEE] 📥 PASO 1: Obteniendo OFFER...`
3. `[CALLEE] ✅✅✅ OFFER ENCONTRADA`
4. `[CALLEE] 📥 PASO 2: setRemoteDescription(offer)`
5. `[CALLEE] 📝 PASO 3: Creando ANSWER...`
6. `[CALLEE] 📤 PASO 4: POST /api/reunion/xxx/answer`
7. `[API-ANSWER] 🎉 NEGOCIACIÓN SDP COMPLETA`
8. `[SetupPeer] 🔄 connectionState: connected`
9. `[API-CONFIRM] ✅ Conexión confirmada`
10. `[Heartbeat] 💓 Iniciando sistema de heartbeat`

---

## ⚠️ Problemas Comunes

### Error: "Unexpected token '<', '<!DOCTYPE'..."
**Causa:** El servidor devolvió HTML (página 404) en lugar de JSON  
**Solución:** Reiniciar servidor con `npm run dev` para recargar API routes

### Error: No se recibe ANSWER
**Causa:** Paciente no puede encontrar la OFFER  
**Verificar:**
- Logs `[API-OFFER] ✅ Offer guardada` en servidor
- Médico recibe confirmación POST exitoso
- Paciente hace GET correctamente

### Error: ICE candidates no se aplican
**Causa:** `setRemoteDescription` no se ha llamado todavía  
**Verificar:**
- Buffer de candidates se llena
- Cuando `remoteSet = true`, se aplican del buffer

### Error: DataChannel no se abre
**Causa:** Conexión P2P no se estableció  
**Verificar:**
- Estado ICE: debe ser `connected` o `completed`
- Candidatos se intercambiaron correctamente
- Firewall/NAT no bloquea tráfico

---

## 🚀 Testing Checklist

- [ ] Médico puede crear sala y ver estado inicial
- [ ] Offer se publica correctamente (con `clientId` opcional)
- [ ] Paciente detecta offer existente
- [ ] Paciente obtiene offer y crea answer
- [ ] Médico recibe answer en polling
- [ ] Ambos intercambian ICE candidates
- [ ] Filtro `since` funciona en `/candidates`
- [ ] Conexión WebRTC se establece (`connected`)
- [ ] Se llama `confirm-connection` al conectar
- [ ] Heartbeat se envía cada 30 segundos
- [ ] DataChannel se abre y mensajes fluyen
- [ ] Chat se guarda al finalizar
- [ ] Sala se elimina del cache al cerrar

---

**✅ Flujo completo implementado según backend**
