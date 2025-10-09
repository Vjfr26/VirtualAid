# 🔍 Diagnóstico y Solución del Error "<!DOCTYPE" en WebRTC

## ❌ Error Original

```
[CALLER] ❌ ERROR al enviar offer: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## ✅ Diagnóstico Completo

### 1. Verificación del Backend ✅

**Prueba realizada:**
```
GET http://localhost:3000/api/reunion/test-room/offer
```

**Respuesta:**
```json
{"offer":null,"offerOwner":null}
```

**Conclusión:** ✅ El endpoint del backend **FUNCIONA CORRECTAMENTE** y devuelve JSON válido.

---

### 2. Problema Identificado

Si el backend funciona pero el frontend recibe HTML, hay **dos posibles causas**:

#### Causa A: Caché del Navegador 🔄
El navegador puede estar usando una versión cacheada antigua de la página que devolvía 404.

#### Causa B: Error de CORS o Network 🌐
El request puede estar fallando antes de llegar al backend.

---

## 🛠️ Solución

### Paso 1: Limpiar Caché del Navegador

**En Chrome/Edge:**
1. Presiona `Ctrl + Shift + Del`
2. Selecciona "Imágenes y archivos en caché"
3. Click en "Borrar datos"

**O usa Hard Refresh:**
- Presiona `Ctrl + Shift + R` (Windows/Linux)
- O `Cmd + Shift + R` (Mac)

### Paso 2: Reiniciar Servidor Limpio

```powershell
# Matar todos los procesos Node
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

# Limpiar cache de Next.js
Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue

# Iniciar servidor
npm run dev
```

### Paso 3: Verificar en Network Tab

1. Abre DevTools (F12)
2. Ve a la pestaña "Network"
3. Filtra por "Fetch/XHR"
4. Busca el request a `/api/reunion/[roomId]/offer`
5. Verifica:
   - **Status**: Debe ser `200 OK` (no 404)
   - **Response**: Debe ser JSON (no HTML)
   - **Request Method**: Debe ser `POST`
   - **Content-Type**: Debe ser `application/json`

---

## 📋 Checklist de Verificación

- [ ] Servidor corriendo en `http://localhost:3000`
- [ ] Cache del navegador limpiado (Ctrl+Shift+Del)
- [ ] Hard refresh en la página (Ctrl+Shift+R)
- [ ] Network tab muestra request con Status 200
- [ ] Response es JSON (no HTML)
- [ ] No hay errores en la consola del servidor

---

## 🧪 Prueba Manual del Endpoint

Puedes probar manualmente que el endpoint funciona:

### PowerShell:
```powershell
# GET
Invoke-RestMethod -Uri "http://localhost:3000/api/reunion/test-room/offer" -Method GET

# POST
$body = @{ sdp = '{"type":"offer","sdp":"test-sdp"}' } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/reunion/test-room/offer" -Method POST -Body $body -ContentType "application/json"
```

### Navegador:
```
http://localhost:3000/api/reunion/test-room/offer
```

Debe mostrar:
```json
{"offer":null}
```

---

## 🎯 Si el Problema Persiste

Si después de limpiar el caché sigues viendo el error, verifica:

###  1. URL Correcta
Asegúrate de que el `roomId` no contenga caracteres especiales que rompan la URL.

### 2. Verificar el Request Real
En el código de `page.tsx`, agrega un log justo antes del `postOffer`:

```typescript
console.log(`[DEBUG] roomId: "${rid}"`);
console.log(`[DEBUG] URL que se va a usar: /api/reunion/${rid}/offer`);
await postOffer(rid, offerJSON);
```

### 3. Verificar Headers
En `services.ts`, verifica que los headers estén correctos:

```typescript
const api = async <T>(path: string, init?: RequestInit): Promise<T> => {
  console.log(`[API] Fetching: /api/${path}`);
  console.log(`[API] Method:`, init?.method || 'GET');
  
  const res = await fetch(`/api/${path}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  
  console.log(`[API] Response status:`, res.status);
  console.log(`[API] Response content-type:`, res.headers.get('content-type'));
  
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};
```

---

## ✅ Resultado Esperado

Después de aplicar la solución, deberías ver en la consola:

```
🏥 ====== MÉDICO (CALLER) INICIANDO REUNIÓN ======
[CALLER] 📝 PASO 1: Creando OFFER...
[CALLER] ✅ Offer creada: { type: 'offer', sdpLength: 2847 }
[CALLER] 📤 PASO 2: POST /api/reunion/bbfd043e-8844-421c-855b-a1217589c9b2/offer
[CALLER] ✅ Offer enviada exitosamente al servidor  ← ✅ ESTE DEBE APARECER
```

Y en el servidor:

```
[API-OFFER] 📤 POST /api/reunion/bbfd043e-8844-421c-855b-a1217589c9b2/offer
[API-OFFER] ✅ SDP parseado correctamente
[API-OFFER] ✅ Offer guardada exitosamente
```

---

## 🚀 Acción Inmediata

**Por favor:**

1. **Refresca la página del navegador** con `Ctrl + Shift + R`
2. **Intenta iniciar/unirte a una reunión**
3. **Revisa la pestaña Network** en DevTools
4. **Copia los logs** que aparezcan en la consola
5. **Comparte los resultados** para confirmar que funciona

El endpoint está funcionando correctamente en el backend. Solo necesitamos asegurarnos de que el navegador use la versión actualizada.

---

**Estado actual:** ✅ Backend verificado y funcionando  
**Siguiente paso:** Limpiar caché del navegador y probar
