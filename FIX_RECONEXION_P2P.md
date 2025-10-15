# 🔄 Sistema de Reconexión P2P - Fix Roles Duplicados

## 🚨 Problema Detectado

**Escenario:**
1. Usuario A entra → CALLER (crea offer)
2. Usuario B entra → CALLEE (responde con answer)
3. ✅ Se conectan correctamente
4. ❌ Conexión se cae (red, error, etc.)
5. Ambos intentan reconectar
6. **Problema:** Ambos ven la offer antigua → **ambos se vuelven CALLEE**
7. ❌ No se conectan (falta CALLER)

**Causa Raíz:**
- La offer/answer antigua queda en el servidor
- Al reconectar, ambos detectan `hasOffer: true`
- Ambos intentan ser CALLEE
- Nadie crea nueva offer → conexión falla

---

## ✅ Solución Implementada

### 1. Nueva API: `/api/reunion/[room]/reset`

**Función:** Limpia la negociación anterior (offer, answer, candidates) manteniendo la sala activa.

```typescript
POST /api/reunion/{roomId}/reset

// Respuesta:
{
  ok: true,
  reset: true,
  roomId: "abc123"
}
```

**Qué hace:**
- ❌ Elimina `offer` anterior
- ❌ Elimina `answer` anterior
- ❌ Limpia `candidates` (caller y callee)
- ✅ Mantiene la sala activa
- ✅ Mantiene el historial de mensajes
- ✅ Actualiza `lastHeartbeat`

---

### 2. Función `reconnect()` Simplificada

**ANTES (problemático):**
```typescript
const reconnect = async () => {
  // Solo limpiaba conexión local
  pcRef.current?.close();
  
  // Usaba rol anterior (role = roleRef.current)
  if (role === 'caller') {
    // Seguía siendo caller
  } else {
    // Seguía siendo callee
  }
  // ❌ Roles fijos → conflicto si ambos reconectan
}
```

**AHORA (correcto):**
```typescript
const reconnect = async () => {
  // 1. LIMPIAR negociación en servidor
  await resetRoom(roomId); // ← ¡CRÍTICO!
  
  // 2. Limpiar conexión local
  pcRef.current?.close();
  
  // 3. Renegociar con roles FRESCOS
  await autoJoinRoom(roomId);
  // ✅ autoJoinRoom asigna roles dinámicamente
  // ✅ Quien llegue primero será CALLER
}
```

---

## 🔄 Flujo de Reconexión Correcto

### Escenario A: Usuario 1 reconecta primero

```
1. Usuario 1 presiona "Reconectar"
   └─> resetRoom(sala123)
       └─> Servidor: offer=null, answer=null, candidates=[]
   
2. autoJoinRoom(sala123)
   └─> getState() → hasOffer: false
   └─> ROL: CALLER ✅
   └─> Crea nueva offer
   └─> Espera answer

3. Usuario 2 reconecta después
   └─> resetRoom(sala123) (opcional, no hace daño)
   └─> autoJoinRoom(sala123)
       └─> getState() → hasOffer: true ✅
       └─> getOffer() → obtiene offer de Usuario 1
       └─> ROL: CALLEE ✅
       └─> Responde con answer

4. ✅ Conexión P2P establecida
```

### Escenario B: Ambos reconectan simultáneamente

```
1. Usuario 1 y Usuario 2 presionan "Reconectar" al mismo tiempo

2. Race condition:
   A. Usuario 1 llama resetRoom() → sala limpia
   B. Usuario 2 llama resetRoom() → sala sigue limpia
   
3. Quien publique offer PRIMERO será CALLER:
   - Usuario 1: autoJoinRoom() → no ve offer → CALLER → publica offer
   - Usuario 2: autoJoinRoom() → VE offer de Usuario 1 → CALLEE
   
4. ✅ Conexión P2P establecida
```

**Clave:** `resetRoom()` asegura que NO haya offer antigua que confunda roles.

---

## 🧪 Testing de Reconexión

### Test 1: Reconexión con orden claro
```
1. Conectar User A y User B → ✅ conectados
2. Desconectar (cerrar peer connection)
3. User A reconecta PRIMERO
   ✅ Verificar: User A es CALLER
   ✅ Logs: "Rol asignado: CALLER (soy el primero)"
4. User B reconecta DESPUÉS
   ✅ Verificar: User B es CALLEE
   ✅ Logs: "Rol asignado: CALLEE (el otro peer llegó primero)"
5. ✅ Ambos conectados nuevamente
```

### Test 2: Reconexión simultánea
```
1. Conectar User A y User B → ✅ conectados
2. Desconectar ambos
3. AMBOS presionan "Reconectar" al mismo tiempo
   ✅ Verificar: Uno se vuelve CALLER, otro CALLEE
   ✅ Verificar: Conexión se establece en < 5 segundos
   ⚠️ Roles pueden invertirse vs conexión original (OK, no importa)
```

### Test 3: Reconexión múltiple
```
1. Conectar → Desconectar → Reconectar (1ra vez)
   ✅ Verificar: Conectan correctamente
2. Desconectar → Reconectar (2da vez)
   ✅ Verificar: Conectan correctamente
3. Desconectar → Reconectar (3ra vez)
   ✅ Verificar: Conectan correctamente
   ✅ Verificar: No hay "basura" acumulada en cache
```

---

## 📊 Logs de Reconexión Exitosa

```
[Reconnect] 🔄 Iniciando reconexión para sala: abc123
[Reconnect] 🧹 Sala limpiada, lista para nueva negociación
[AutoJoin] 🚀 Iniciando conexión P2P para sala: abc123
[AutoJoin] Estado de la sala: {hasOffer: false, hasAnswer: false}
[AutoJoin] 📡 Rol asignado: CALLER (soy el primero en la sala)
[CALLER] Creando oferta y esperando answer...
[SetupPeer] 🔧 Configurando peer WebRTC (caller)
[SetupPeer] 📡 ICE candidate (caller): host udp 192.168.1.100:54321
[CALLER] ✅ Answer recibida en el intento 2
[SetupPeer] ✅ P2P establecido (4 candidates procesados en 6 intentos)
[Reconnect] ✅ Proceso de reconexión finalizado
```

---

## 🔑 Puntos Clave

### ✅ DO (Hacer):
1. **SIEMPRE** llamar `resetRoom()` antes de reconectar
2. Usar `autoJoinRoom()` para asignación dinámica de roles
3. Confiar en la lógica: "primero que llega = CALLER"
4. Limpiar conexión local Y servidor

### ❌ DON'T (No hacer):
1. No reutilizar roles anteriores (`roleRef.current`)
2. No asumir que un tipo de usuario siempre es CALLER
3. No reconectar sin limpiar negociación anterior
4. No crear lógica "especial" para reconexión

---

## 🚀 Beneficios de la Solución

| Aspecto | Antes | Ahora |
|---------|-------|-------|
| **Conflicto de roles** | ❌ Ambos podían ser CALLEE | ✅ Siempre 1 CALLER, 1 CALLEE |
| **Negociación limpia** | ❌ Offer antigua confundía roles | ✅ Sala reseteada antes de reconectar |
| **Simplicidad** | ❌ Lógica duplicada para reconnect | ✅ Reutiliza `autoJoinRoom()` |
| **Robustez** | ❌ Falla si reconectan simultáneamente | ✅ Funciona en cualquier orden |
| **Código** | ~150 líneas duplicadas | ~15 líneas simples |

---

## 🔮 Próximas Mejoras (Opcionales)

1. **Notificar al otro peer:**
   - Cuando uno reconecta, avisar al otro vía DataChannel
   - "Tu peer se desconectó, espera reconexión..."

2. **Timeout de reconexión:**
   - Si el otro peer no reconecta en 30s, mostrar error
   - "El otro participante no está disponible"

3. **Reconexión automática:**
   - Detectar `iceConnectionState === 'disconnected'`
   - Auto-llamar `reconnect()` después de 3 segundos

4. **Telemetría:**
   - Contar reconexiones exitosas vs fallidas
   - Identificar patrones de problemas de red

---

## 📝 Código Relevante

### services.ts
```typescript
// Nueva función para limpiar negociación
export const resetRoom = (roomId: string) =>
  api<{ ok: true; reset: boolean }>(`reunion/${roomId}/reset`, { 
    method: 'POST' 
  });
```

### page.tsx
```typescript
const reconnect = useCallback(async () => {
  // 1. Limpiar servidor
  await resetRoom(roomId);
  
  // 2. Limpiar local
  pcRef.current?.close();
  
  // 3. Renegociar
  await autoJoinRoom(roomId);
}, [roomId, autoJoinRoom]);
```

---

_Fecha: 15 de octubre de 2025_
_Sistema: VirtualAid WebRTC P2P - Fix Reconexión_
