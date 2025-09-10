# API de Recordatorios - Especificación

## Endpoint del Backend

**URL:** `/api/cita/{id}/recordatorio`  
**Método:** `POST`  
**Content-Type:** `application/json`

---

## Petición al Backend

### URL Completa
```
POST https://tu-dominio.com/api/cita/1/recordatorio
```

### Parámetros de URL

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `id` | number | ✅ Sí | ID de la cita | `1` |

### Headers
```json
{
  "Content-Type": "application/json"
}
```

### Body
**No requiere body** - El backend obtiene toda la información de la cita usando el ID.

### Ejemplo Simple
```javascript
// Enviar recordatorio para la cita con ID 1
fetch('/api/cita/1/recordatorio', { method: 'POST' })
  .then(res => res.json())
  .then(data => alert(`✅ Enviado a ${data.email}`));
```

---

## Respuestas del Backend

### Respuesta Exitosa (200 OK)
```json
{
  "message": "Recordatorio enviado correctamente",
  "cita_id": 1,
  "email": "usuario@example.com",
  "fecha": "lunes 15 de octubre de 2025",
  "hora": "14:30"
}
```

### Campos de la Respuesta

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `message` | string | Mensaje de confirmación | `"Recordatorio enviado correctamente"` |
| `cita_id` | number | ID de la cita | `1` |
| `email` | string | Email al que se envió el recordatorio | `"usuario@example.com"` |
| `fecha` | string | Fecha de la cita en formato legible | `"lunes 15 de octubre de 2025"` |
| `hora` | string | Hora de la cita | `"14:30"` |

### Error - Cita No Encontrada (404 Not Found)
```json
{
  "error": "Cita no encontrada"
}
```

### Error Interno (500 Internal Server Error)
```json
{
  "error": "Error al enviar el recordatorio"
}
```

---

## Implementación en el Frontend

### Servicio Creado
**Archivo:** `src/app/usuario/services/recordatorios.ts`

```typescript
import { enviarRecordatorio } from './services/recordatorios';

// Ejemplo de uso - Solo necesita el ID de la cita
const resultado = await enviarRecordatorio(1);

if (resultado.success && resultado.data) {
  console.log('✅ Recordatorio enviado a:', resultado.data.email);
  console.log('📅 Fecha:', resultado.data.fecha);
  console.log('🕐 Hora:', resultado.data.hora);
} else {
  console.error('❌ Error:', resultado.message);
}
```

### Interfaz de Respuesta
```typescript
export interface EnviarRecordatorioResponse {
  message: string;
  cita_id: number;
  email: string;
  fecha: string;
  hora: string;
}
```

### Función Modificada
**Archivo:** `src/app/usuario/page.tsx`
**Función:** `toggleRecordatorio`

La función ahora:
1. Valida que la cita tenga ID
2. Llama a `enviarRecordatorio(citaId)` - solo necesita el ID
3. El backend obtiene todos los datos de la cita automáticamente
4. Muestra un toast con el email al que se envió
5. Activa/desactiva el recordatorio localmente

---

## Archivos Creados/Modificados

### ✅ Archivos Creados
1. **`src/app/usuario/services/recordatorios.ts`**
   - Servicio de frontend
   - Función `enviarRecordatorio()`
   - Manejo de errores
   - Tipado TypeScript

### ✅ Archivos Modificados
1. **`src/app/usuario/page.tsx`**
   - ❌ Eliminado: Todo el código de EmailJS (cliente)
   - ❌ Eliminado: Script de EmailJS  
   - ❌ Eliminado: Formulario oculto de contacto
   - ✅ Modificado: Función `toggleRecordatorio()` ahora solo envía el ID de la cita
   - ✅ Agregado: Importación del servicio `enviarRecordatorio`
   - ✅ Agregado: Toast mostrando el email al que se envió el recordatorio

---

## Nota Importante

**El backend ya tiene implementado el endpoint `/api/cita/{id}/recordatorio`** que:
- Recibe el ID de la cita
- Obtiene toda la información de la cita de la base de datos
- Envía el correo al paciente
- Retorna la confirmación con los datos de la cita

**No es necesario implementar nada en el backend.** El frontend ya está preparado para usar este endpoint.

---

## Flujo Completo

```
┌─────────────────────┐
│   Usuario Click     │
│  "Activar Record."  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  toggleRecordatorio │
│   (Frontend)        │
│   - Valida ID cita  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ enviarRecordatorio  │
│    (Service)        │
│ - Solo envía ID     │
└──────────┬──────────┘
           │
           ▼ POST /api/cita/1/recordatorio
┌─────────────────────┐
│   Backend API       │
│  (Tu servidor)      │
│ - Busca la cita     │
│ - Obtiene datos     │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Enviar Email       │
│ (Backend maneja)    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Respuesta JSON     │
│  {                  │
│   message: "...",   │
│   email: "...",     │
│   fecha: "...",     │
│   hora: "..."       │
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Toast al Usuario   │
│ "✅ Enviado a       │
│  usuario@email.com" │
└─────────────────────┘
```

---

## Resumen de Cambios

✅ **Eliminado:** EmailJS (cliente completo)  
✅ **Creado:** Servicio `enviarRecordatorio(citaId)` en frontend  
✅ **Modificado:** Función `toggleRecordatorio()` - ahora solo envía ID  
✅ **Integrado:** Endpoint del backend `/api/cita/{id}/recordatorio`  
✅ **Listo:** El sistema ya funciona con el backend existente

**Ventajas:**
- ✅ Mayor seguridad (credenciales en servidor)
- ✅ Simplificación (frontend solo envía ID)
- ✅ Backend maneja toda la lógica de datos
- ✅ No depende de servicios externos del cliente
- ✅ Plantillas personalizadas en el servidor
- ✅ Logs centralizados en el backend
- ✅ Menos código en el frontend
