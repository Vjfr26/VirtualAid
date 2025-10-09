# 🧪 Restricciones de Horario Comentadas para Pruebas

## 📅 Fecha: 9 de octubre de 2025

---

## ✅ Cambios Realizados

Se han **comentado** las restricciones de horario en el sistema de videollamadas para permitir pruebas sin limitaciones de tiempo.

### Archivo modificado:
`src/app/reunion/page.tsx`

---

## 🔧 Cambios Específicos

### 1️⃣ **Validación del tiempo de cita (Líneas ~1047-1073)**

**ANTES (Activo):**
```typescript
// Tiempo de cita
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
```

**AHORA (Comentado):**
```typescript
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
```

---

### 2️⃣ **UI del Countdown (Líneas ~1438-1455)**

**ANTES (Activo):**
```typescript
) : allowedJoinFrom && new Date() < allowedJoinFrom ? (
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
) : (
```

**AHORA (Comentado):**
```typescript
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
```

---

## 🎯 Comportamiento Actual (Modo Pruebas)

### ✅ Lo que FUNCIONA ahora:

1. **✅ Unirse en cualquier momento**: No hay restricción de tiempo
2. **✅ Sin countdown**: No aparece el temporizador de espera
3. **✅ Botón siempre visible**: "Unirse a la videollamada" disponible inmediatamente
4. **✅ Mensaje de modo pruebas**: Indica claramente que está en modo de pruebas

### ⚠️ Lo que está DESACTIVADO:

1. **⏰ Validación de 5 minutos antes**: Originalmente solo permitía unirse 5 minutos antes de la cita
2. **⏰ Countdown timer**: El reloj que contaba el tiempo hasta poder unirse
3. **⏰ Mensaje de espera**: "La sala se habilita 10 minutos antes de la hora de la cita"

---

## 🔄 Cómo Restaurar las Restricciones

Cuando termines las pruebas y quieras **restaurar** las restricciones originales:

### Paso 1: Busca los comentarios marcados con `⏰`

En el archivo `src/app/reunion/page.tsx`, busca:
- `// ⏰ RESTRICCIÓN DE HORARIO COMENTADA PARA PRUEBAS ⏰`
- `/* ⏰ RESTRICCIÓN DE COUNTDOWN COMENTADA PARA PRUEBAS ⏰`

### Paso 2: Descomenta el código original

**Líneas ~1047-1073:**
```typescript
// ELIMINA esta sección temporal:
// 🧪 MODO PRUEBAS: Permitir unirse en cualquier momento
if (startAtStr) {
  const start = new Date(startAtStr);
  if (!isNaN(start.getTime())) {
    setAppointmentStartAt(start);
  }
}

// DESCOMENTA esto (quita /* y */):
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
```

**Líneas ~1438-1455:**
```typescript
// ELIMINA este comentario:
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

// CAMBIA el mensaje:
<p className="text-sm text-gray-300 mb-4">🧪 Modo pruebas: Puedes unirte en cualquier momento.</p>
// POR:
<p className="text-sm text-gray-300 mb-4">Puedes unirte cuando estés listo.</p>
```

### Paso 3: Reinicia el servidor
```bash
npm run dev
```

---

## 📝 Notas Importantes

- ✅ Los cambios son **reversibles**
- ✅ El código original está **comentado**, no eliminado
- ✅ Los comentarios con emoji `⏰` facilitan encontrar las secciones
- ✅ No hay cambios en la base de datos ni en otros archivos
- ✅ Solo afecta al frontend (página de reunión)

---

## 🧪 Pruebas Recomendadas

Ahora que las restricciones están comentadas, puedes probar:

1. **✅ Crear reunión como médico** en cualquier momento
2. **✅ Unirse como paciente** sin esperar
3. **✅ Verificar que el SDP exchange funciona** correctamente
4. **✅ Probar todas las funciones** (chat, compartir pantalla, etc.)
5. **✅ Verificar diagnósticos** (panel 🔍)

---

## 🚀 Próximos Pasos

1. **Reinicia el servidor** si no lo has hecho:
   ```bash
   npm run dev
   ```

2. **Refresca el navegador** (Ctrl+Shift+R)

3. **Prueba crear/unirse a una reunión**

4. **Revisa los logs** en la consola para verificar el SDP exchange

5. **Cuando termines las pruebas**, usa este documento para restaurar las restricciones

---

**¡Listo para probar! 🎉**
