# 🐛 Debug: Error "View [<!DOCTYPE html>] not found"

## 📋 Descripción del Problema

Al intentar enviar un recordatorio de cita, el frontend recibe una respuesta **HTML en lugar de JSON** del backend, causando el error:

```
❌ View [<!DOCTYPE html> <html lang="es"> ...] not found.
```

## 🔍 Causa Raíz

El backend está devolviendo el **contenido HTML de la plantilla de correo electrónico** en lugar de una respuesta JSON estructurada.

### Respuesta Actual del Backend (❌ INCORRECTA)
```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Recordatorio de Cita</title>
  ...
</head>
<body>
  <div class="email-container">
    <!-- Contenido del correo -->
  </div>
</body>
</html>
```

### Respuesta Esperada del Backend (✅ CORRECTA)
```json
{
  "message": "Recordatorio enviado correctamente",
  "cita_id": 2,
  "email": "pedro@example.com",
  "fecha": "2025-10-02",
  "hora": "16:00"
}
```

## 🛠️ Solución Implementada en el Frontend

Se agregó **validación del tipo de contenido** para detectar respuestas no-JSON:

```typescript
// src/app/usuario/services/recordatorios.ts
export async function enviarRecordatorio(citaId: number | string) {
  const response = await fetch(`/api/cita/${citaId}/recordatorio`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // ✅ NUEVO: Verificar el tipo de contenido
  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const textResponse = await response.text();
    console.error('❌ Respuesta no-JSON del backend:', textResponse.substring(0, 300));
    
    return {
      success: false,
      message: 'El servidor devolvió una respuesta inválida (HTML en lugar de JSON).'
    };
  }

  const data = await response.json();
  // ... resto del código
}
```

## 🔧 Qué Debe Corregir el Backend

El endpoint `/api/cita/{id}/recordatorio` debe:

1. **Enviar el correo electrónico internamente** usando la plantilla HTML
2. **Devolver una respuesta JSON** al frontend

### Ejemplo de Implementación Backend Correcta

```python
# Backend (Python/Flask ejemplo)
@app.route('/api/cita/<int:id>/recordatorio', methods=['POST'])
def enviar_recordatorio(id):
    # 1. Obtener datos de la cita
    cita = obtener_cita(id)
    
    # 2. Generar HTML del correo
    html_correo = generar_plantilla_html(cita)
    
    # 3. Enviar correo electrónico
    enviar_email(
        destinatario=cita.email_paciente,
        asunto="Recordatorio de Cita",
        html=html_correo
    )
    
    # 4. ✅ IMPORTANTE: Devolver JSON, NO HTML
    return jsonify({
        "message": "Recordatorio enviado correctamente",
        "cita_id": cita.id,
        "email": cita.email_paciente,
        "fecha": cita.fecha.isoformat(),
        "hora": cita.hora
    }), 200
```

## 📊 Flujo Correcto

```
┌─────────────┐                ┌─────────────┐                ┌─────────────┐
│  Frontend   │                │   Backend   │                │   Email     │
│             │                │             │                │   Server    │
└──────┬──────┘                └──────┬──────┘                └──────┬──────┘
       │                              │                              │
       │ POST /api/cita/2/recordatorio│                              │
       │─────────────────────────────>│                              │
       │                              │                              │
       │                              │ 1. Obtener datos cita ID=2   │
       │                              │                              │
       │                              │ 2. Generar HTML del correo   │
       │                              │                              │
       │                              │ 3. Enviar correo HTML        │
       │                              │─────────────────────────────>│
       │                              │                              │
       │                              │      Correo enviado OK       │
       │                              │<─────────────────────────────│
       │                              │                              │
       │  ✅ JSON Response            │                              │
       │  {message, cita_id, email}   │                              │
       │<─────────────────────────────│                              │
       │                              │                              │
       │ Mostrar toast de éxito       │                              │
       │                              │                              │
```

## 🧪 Cómo Probar

1. **Verificar la respuesta del backend:**
   ```bash
   # En el navegador, abrir DevTools > Network
   # Hacer clic en "Enviar recordatorio"
   # Inspeccionar la respuesta del endpoint
   ```

2. **Revisar la consola del navegador:**
   ```javascript
   // Debería aparecer si el backend devuelve HTML:
   "❌ Respuesta no-JSON del backend: <!DOCTYPE html> <html lang..."
   ```

3. **Verificar headers de respuesta:**
   - ✅ Content-Type: `application/json`
   - ❌ Content-Type: `text/html` (PROBLEMA)

## 📝 Checklist para el Equipo Backend

- [ ] El endpoint devuelve `Content-Type: application/json`
- [ ] La respuesta es un objeto JSON válido
- [ ] El HTML del correo se envía SOLO al servidor de email (no al frontend)
- [ ] La respuesta incluye: `message`, `cita_id`, `email`, `fecha`, `hora`
- [ ] Los errores también se devuelven como JSON (no HTML de error)

## 🎯 Resultado Esperado

Después de la corrección:
- ✅ El paciente recibe el correo con la plantilla HTML bonita
- ✅ El frontend recibe JSON con la confirmación
- ✅ Se muestra el toast: "✅ Recordatorio enviado a pedro@example.com"
- ✅ No hay errores en la consola

---

**Fecha:** 2 de octubre de 2025  
**Archivo actualizado:** `src/app/usuario/services/recordatorios.ts`
