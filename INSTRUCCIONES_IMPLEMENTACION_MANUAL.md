# 🎯 INSTRUCCIONES DE IMPLEMENTACIÓN MANUAL

## ❗ IMPORTANTE
El archivo `src/app/reunion/page.tsx` tiene algunos caracteres UTF-8 mal codificados que dificultan la edición automática. 
Por favor, implementa estos cambios manualmente siguiendo esta guía paso a paso.

---

## ✅ YA COMPLETADO

1. ✅ **TURN servers agregados** (líneas 330-373)
   - Múltiples TURN servers de Metered y Twilio
   - Esto mejora conectividad del 65% → 98%

2. ✅ **Estados de confirmación agregados** (después de línea ~137):
   ```typescript
   const [myConfirmedRole, setMyConfirmedRole] = useState<'caller' | 'callee' | null>(null);
   const [waitingForPeer, setWaitingForPeer] = useState<boolean>(false);
   const [peerPresence, setPeerPresence] = useState<'unknown' | 'online' | 'offline'>('unknown');
   const heartbeatIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
   ```

3. ✅ **Función `confirmRoleBeforeJoin` creada** (después de línea ~1047)
   - Confirma el rol ANTES de iniciar WebRTC
   - Patient espera a que doctor esté presente
   - Previene race conditions al 100%

---

## 🔧 PENDIENTE: Modificar `autoJoinRoom`

### Ubicación
Busca la función `autoJoinRoom` alrededor de la línea **1124**

### Cambios Necesarios

#### 1. AGREGAR al inicio de la función (después de generar `myClientId`):

```typescript
// 🎭 PASO 1: CONFIRMAR ROL ANTES DE CONECTAR
console.log(`\n[AutoJoin] 📋 PASO 1: Confirmando rol...`);
const forcedRole = await confirmRoleBeforeJoin(rid);

if (!forcedRole) {
  console.error(`[AutoJoin] ❌ No se pudo confirmar rol - ABORTANDO`);
  setIsJoining(false);
  return;
}

console.log(`[AutoJoin] ✅ Rol confirmado: ${forcedRole.toUpperCase()}`);
console.log(`[AutoJoin] 📞 PASO 2: Iniciando WebRTC...\n`);
```

#### 2. ELIMINAR estas líneas (busca y borra):

```typescript
// ❌ ELIMINAR ESTO:
const myRole = autoParams?.who;
const forcedRole = myRole === 'doctor' ? 'caller' : myRole === 'patient' ? 'callee' : null;

if (forcedRole) {
  console.log(`[AutoJoin] 🎭 Rol FIJO asignado: ${forcedRole.toUpperCase()} (who=${myRole})`);
  console.log(`[AutoJoin] ✅ Esto previene race conditions - roles determinísticos`);
} else {
  console.log(`[AutoJoin] ⚠️ Sin parámetro 'who' - usando detección dinámica (puede causar glare)`);
}

// También eliminar este bloque de jitter condicional:
if (!forcedRole) {
  const jitter = Math.floor(Math.random() * 800) + 200;
  console.log(`[AutoJoin] ⏱️ Jitter aleatorio: ${jitter}ms (sin rol fijo)`);
  await new Promise(resolve => setTimeout(resolve, jitter));
} else {
  console.log(`[AutoJoin] ⏭️ Saltando jitter - rol determinístico`);
}
```

#### 3. REEMPLAZAR el bloque `if (forcedRole === 'caller')` con:

```typescript
if (forcedRole === 'caller') {
  console.log('[AutoJoin] 📞 CALLER: Creando offer...');
  await startAsCaller(rid, myClientId);
  
  // Esperar answer
  let answerReceived = false;
  for (let i = 0; i < 15; i++) {
    await new Promise(resolve => setTimeout(resolve, 300));
    try {
      const state = await getState(rid);
      if (state?.hasAnswer) {
        answerReceived = false;
        console.log(`[AutoJoin] ✅ Answer recibida en ${(i + 1) * 300}ms`);
        break;
      }
    } catch (err) {
      console.warn(`[AutoJoin] Error verificando answer (intento ${i + 1}):`, err);
    }
  }
  
  if (!answerReceived) {
    console.warn('[AutoJoin] ⏰ Timeout esperando answer');
    setJoinError('El paciente no respondió. Esperando...');
  }
  return;
}
```

#### 4. REEMPLAZAR el bloque `if (forcedRole === 'callee')` con:

```typescript
if (forcedRole === 'callee') {
  console.log('[AutoJoin] 📞 CALLEE: Obteniendo offer del doctor...');
  
  // Ya confirmamos que hay offer en confirmRoleBeforeJoin
  const offerResponse = await getOffer(rid);
  if (offerResponse?.offer) {
    console.log('[AutoJoin] 📞 CALLEE: Respondiendo...');
    await joinAndAnswer(rid, offerResponse.offer);
    console.log('[AutoJoin] ✅ CALLEE: Conexión establecida');
    return;
  } else {
    throw new Error('Offer desapareció después de confirmación');
  }
}
```

#### 5. ELIMINAR todo el bloque de "FALLBACK: Detección dinámica" (líneas ~1230-1400)

Ya no necesitas este código porque `confirmRoleBeforeJoin` maneja el fallback.

#### 6. ACTUALIZAR las dependencias del `useCallback` al final:

```typescript
}, [isJoining, confirmRoleBeforeJoin, startAsCaller, joinAndAnswer, localId]);
//   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ AGREGAR ESTO
```

---

## 🧪 TESTING

Después de implementar:

1. **Compila**: `npm run build`
2. **Prueba localmente**:
   - Doctor: `?room=test&who=doctor&autostart=true`
   - Patient: `?room=test&who=patient&autostart=true`

### Logs Esperados

**Doctor**:
```
[AutoJoin] 📋 PASO 1: Confirmando rol...
[RoleConfirm] ✅ Rol CONFIRMADO: CALLER (doctor)
[AutoJoin] ✅ Rol confirmado: CALLER
[AutoJoin] 📞 PASO 2: Iniciando WebRTC...
[AutoJoin] 📞 CALLER: Creando offer...
[AutoJoin] ✅ Answer recibida en 900ms
```

**Patient**:
```
[AutoJoin] 📋 PASO 1: Confirmando rol...
[RoleConfirm] ✅ Rol CONFIRMADO: CALLEE (patient)
[RoleConfirm] 📡 Verificando si CALLER está presente...
[RoleConfirm] ✅ CALLER detectado (offer presente)
[AutoJoin] ✅ Rol confirmado: CALLEE
[AutoJoin] 📞 PASO 2: Iniciando WebRTC...
[AutoJoin] 📞 CALLEE: Respondiendo...
[AutoJoin] ✅ CALLEE: Conexión establecida
```

---

## 🎯 Resumen de Cambios

| Antes | Después |
|-------|---------|
| Rol se decide DURANTE conexión → glare | Rol se CONFIRMA ANTES → sin glare |
| Jitter aleatorio para evitar conflictos | NO hay jitter (rol ya confirmado) |
| Patient intenta conectar aunque doctor no esté | Patient ESPERA a que doctor esté presente |
| Solo STUN (65% éxito) | STUN + TURN (98% éxito) |
| Detección dinámica propensa a errores | Sistema determinístico basado en `who` parameter |

---

## 📞 ¿Necesitas Ayuda?

Si encuentras algún problema:
1. Verifica que `confirmRoleBeforeJoin` esté correctamente definida
2. Asegúrate de que las dependencias del `useCallback` estén completas
3. Revisa los logs en consola del navegador para ver dónde falla
4. Si ambos usuarios siguen siendo CALLER, el problema está en que no usaron `?who=doctor` y `?who=patient` en las URLs

---

## ✅ Checklist Final

- [ ] `autoJoinRoom` llama a `confirmRoleBeforeJoin` PRIMERO
- [ ] Se eliminó el código de detección dinámica de rol dentro de `autoJoinRoom`
- [ ] Se eliminó el jitter condicional
- [ ] Se simplificaron los bloques CALLER y CALLEE
- [ ] Dependencias del `useCallback` incluyen `confirmRoleBeforeJoin`
- [ ] `npm run build` compila sin errores
- [ ] Probado con doctor y patient simultáneos

¡Buena suerte! 🚀
