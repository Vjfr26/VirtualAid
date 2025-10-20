# 🐛 Análisis del Bug: "Próxima Cita" en Dashboard del Médico

## 📋 Resumen del Problema

La sección **"Próxima Cita"** en el dashboard del médico no está mostrando correctamente la siguiente cita. El componente existe y tiene lógica compleja, pero probablemente no funciona por **problemas de timezone y comparación de fechas**.

---

## 🔍 Análisis de la Lógica Actual

### 1. **Obtención del Tiempo de Referencia**

```typescript
// Línea 73-82
const obtenerFechaServidor = () => {
  // TODO: En producción, idealmente obtener la hora real desde el backend.
  const ahora = new Date();
  if (process.env.NODE_ENV === 'development') {
    console.log('📅 obtenerFechaServidor -> usando hora cliente:', ahora.toISOString());
  }
  return ahora;
};

// Línea 88
const [currentTime, setCurrentTime] = useState(obtenerFechaServidor());

// Línea 948-952 - Actualización cada minuto
useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(obtenerFechaServidor());
  }, 60000); // Actualizar cada minuto
  return () => clearInterval(timer);
}, []);
```

**✅ Funcionalidad**: Se actualiza cada minuto para mantener la hora actual.

---

### 2. **Lógica de Filtrado de "Próxima Cita"** (Línea 1331-1410)

```typescript
{(() => {
  // Formatear fecha en YYYY-MM-DD
  const formatDate = (d: Date): string => {
    const pad = (n: number): string => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const ahoraServidor = currentTime;
  const hoy = formatDate(ahoraServidor);

  // PASO 1: Filtrar citas de HOY que aún no han pasado
  const citasHoyFuturas = citas
    .filter(cita => {
      if (cita.fecha !== hoy) return false; // ❌ PROBLEMA #1

      let fechaCitaCompleta;
      try {
        fechaCitaCompleta = new Date(`${cita.fecha}T${cita.hora}`);
        if (isNaN(fechaCitaCompleta.getTime())) {
          fechaCitaCompleta = new Date(`${cita.fecha} ${cita.hora}`);
        }
      } catch (e) {
        return false;
      }

      const estadoCita = cita.estado?.toLowerCase() || 'pendiente';
      const noEsCancelada = estadoCita !== 'cancelada' && estadoCita !== 'cancelado';

      return !isNaN(fechaCitaCompleta.getTime()) &&
            fechaCitaCompleta > ahoraServidor && // ❌ PROBLEMA #2
            noEsCancelada;
    })
    .sort((a, b) => {
      const fechaA = new Date(`${a.fecha}T${a.hora}`);
      const fechaB = new Date(`${b.fecha}T${b.hora}`);
      return fechaA.getTime() - fechaB.getTime();
    });

  // PASO 2: Filtrar citas de DÍAS FUTUROS
  const citasDiasFuturos = citas
    .filter(cita => {
      if (cita.fecha <= hoy) return false; // ❌ PROBLEMA #3

      // ... resto del filtrado
    });

  // PASO 3: Determinar próxima cita
  let proximaCita = null;
  let esHoy = false;
  let esMañana = false;

  if (citasHoyFuturas.length > 0) {
    proximaCita = citasHoyFuturas[0];
    esHoy = true;
  } else if (citasDiasFuturos.length > 0) {
    proximaCita = citasDiasFuturos[0];
    
    const mañana = new Date(ahoraServidor);
    mañana.setDate(mañana.getDate() + 1);
    const mañanaStr = formatDate(mañana);
    esMañana = proximaCita.fecha === mañanaStr;
  }

  return <div>...render del componente...</div>;
})()}
```

---

## 🐛 **Problemas Identificados**

### **PROBLEMA #1: Comparación de Strings de Fecha** ❌

```typescript
if (cita.fecha !== hoy) return false;
```

**¿Por qué falla?**
- `cita.fecha` viene de la base de datos (puede ser `string` o `Date`)
- `hoy` es un string formateado como `"2025-10-20"`
- Si `cita.fecha` es un objeto `Date`, la comparación `!==` SIEMPRE retornará `true`
- Si `cita.fecha` tiene formato diferente (e.g., `"20/10/2025"`), también falla

**Ejemplo del error**:
```typescript
const citaFecha = new Date("2025-10-20"); // objeto Date
const hoy = "2025-10-20"; // string
console.log(citaFecha !== hoy); // true ❌ (debería ser false)
```

---

### **PROBLEMA #2: Timezone en Comparación de Date Objects** ⚠️

```typescript
fechaCitaCompleta > ahoraServidor
```

**¿Por qué puede fallar?**
- `new Date("2025-10-20T10:00")` interpreta la hora en **hora local del navegador**
- Si el servidor está en otra zona horaria, la comparación puede ser incorrecta
- **Ejemplo**: 
  - Cita: `2025-10-20T10:00` (10am hora local)
  - `ahoraServidor` podría estar en UTC o diferente timezone
  - Resultado: cita puede parecer que "ya pasó" cuando realmente es en el futuro

---

### **PROBLEMA #3: Comparación de Strings de Fecha (otra vez)** ❌

```typescript
if (cita.fecha <= hoy) return false;
```

**¿Por qué falla?**
- Comparación lexicográfica de strings funciona **SOLO si ambos están en formato ISO** (`YYYY-MM-DD`)
- Si `cita.fecha` es un `Date` object, la comparación es impredecible
- Ejemplo:
  ```typescript
  const citaFecha = new Date("2025-10-25");
  const hoy = "2025-10-20";
  console.log(citaFecha <= hoy); // false ❌ (compara objeto vs string)
  ```

---

### **PROBLEMA #4: Falta de Normalización de Datos** ⚠️

El código asume que:
- `cita.fecha` siempre está en formato `YYYY-MM-DD`
- `cita.hora` siempre está en formato `HH:MM`

**Pero no valida ni normaliza estos datos antes de usarlos.**

---

## ✅ **Solución Propuesta**

### **Fix #1: Normalizar todas las fechas a strings YYYY-MM-DD**

```typescript
// Función helper para normalizar fecha
const normalizarFecha = (fecha: string | Date): string => {
  let date: Date;
  
  if (fecha instanceof Date) {
    date = fecha;
  } else if (typeof fecha === 'string') {
    // Intentar parsear la fecha
    date = new Date(fecha);
    if (isNaN(date.getTime())) {
      console.error('Fecha inválida:', fecha);
      return '';
    }
  } else {
    return '';
  }
  
  // Formatear a YYYY-MM-DD
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

// Uso:
const hoy = normalizarFecha(ahoraServidor);
const citasHoyFuturas = citas
  .filter(cita => {
    const fechaCita = normalizarFecha(cita.fecha);
    if (fechaCita !== hoy) return false; // ✅ Ahora compara strings correctamente
    
    // resto de la lógica...
  });
```

---

### **Fix #2: Usar UTC para todas las comparaciones de timestamp**

```typescript
// Crear fecha/hora UTC para evitar problemas de timezone
const crearFechaUTC = (fecha: string, hora: string): Date => {
  const [year, month, day] = fecha.split('-').map(Number);
  const [hours, minutes] = hora.split(':').map(Number);
  
  // Crear en UTC para comparaciones consistentes
  return new Date(Date.UTC(year, month - 1, day, hours, minutes));
};

// Uso:
const fechaCitaCompleta = crearFechaUTC(cita.fecha, cita.hora);
const ahoraUTC = new Date(Date.UTC(
  ahoraServidor.getFullYear(),
  ahoraServidor.getMonth(),
  ahoraServidor.getDate(),
  ahoraServidor.getHours(),
  ahoraServidor.getMinutes()
));

if (fechaCitaCompleta > ahoraUTC) {
  // Cita es en el futuro ✅
}
```

---

### **Fix #3: Agregar logging detallado para debugging**

```typescript
const citasHoyFuturas = citas
  .filter(cita => {
    const fechaCita = normalizarFecha(cita.fecha);
    
    console.log('🔍 Debug Próxima Cita:', {
      citaId: cita.id,
      fechaCita,
      hoy,
      esHoy: fechaCita === hoy,
      hora: cita.hora,
      estado: cita.estado,
      paciente: cita.usuario_id
    });
    
    // resto de lógica...
  });

console.log('📊 Resultados filtrado:', {
  totalCitas: citas.length,
  citasHoyFuturas: citasHoyFuturas.length,
  citasDiasFuturos: citasDiasFuturos.length,
  proximaCita: proximaCita?.id || 'ninguna'
});
```

---

## 🔧 **Implementación Completa Corregida**

```typescript
{(() => {
  // 🛠️ HELPERS NORMALIZADOS
  const normalizarFecha = (fecha: string | Date): string => {
    let date: Date;
    if (fecha instanceof Date) {
      date = fecha;
    } else {
      date = new Date(fecha);
      if (isNaN(date.getTime())) return '';
    }
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  };

  const crearFechaCompleta = (fecha: string | Date, hora: string): Date | null => {
    try {
      const fechaNormalizada = normalizarFecha(fecha);
      if (!fechaNormalizada || !hora) return null;
      
      const fechaCompleta = new Date(`${fechaNormalizada}T${hora}`);
      return isNaN(fechaCompleta.getTime()) ? null : fechaCompleta;
    } catch {
      return null;
    }
  };

  const ahoraServidor = currentTime;
  const hoy = normalizarFecha(ahoraServidor);

  // 📋 FILTRAR CITAS DE HOY FUTURAS
  const citasHoyFuturas = citas
    .filter(cita => {
      const fechaCita = normalizarFecha(cita.fecha);
      if (fechaCita !== hoy) return false;

      const fechaCitaCompleta = crearFechaCompleta(cita.fecha, cita.hora);
      if (!fechaCitaCompleta) return false;

      const estadoCita = cita.estado?.toLowerCase() || 'pendiente';
      const noEsCancelada = estadoCita !== 'cancelada' && estadoCita !== 'cancelado';

      return fechaCitaCompleta > ahoraServidor && noEsCancelada;
    })
    .sort((a, b) => {
      const fechaA = crearFechaCompleta(a.fecha, a.hora);
      const fechaB = crearFechaCompleta(b.fecha, b.hora);
      if (!fechaA || !fechaB) return 0;
      return fechaA.getTime() - fechaB.getTime();
    });

  // 📅 FILTRAR CITAS DE DÍAS FUTUROS
  const citasDiasFuturos = citas
    .filter(cita => {
      const fechaCita = normalizarFecha(cita.fecha);
      if (fechaCita <= hoy) return false; // ✅ Ahora compara strings correctamente

      const fechaCitaCompleta = crearFechaCompleta(cita.fecha, cita.hora);
      if (!fechaCitaCompleta) return false;

      const estadoCita = cita.estado?.toLowerCase() || 'pendiente';
      const noEsCancelada = estadoCita !== 'cancelada' && estadoCita !== 'cancelado';

      return noEsCancelada;
    })
    .sort((a, b) => {
      const fechaA = crearFechaCompleta(a.fecha, a.hora);
      const fechaB = crearFechaCompleta(b.fecha, b.hora);
      if (!fechaA || !fechaB) return 0;
      return fechaA.getTime() - fechaB.getTime();
    });

  // 🎯 DETERMINAR PRÓXIMA CITA
  let proximaCita = null;
  let esHoy = false;
  let esMañana = false;

  if (citasHoyFuturas.length > 0) {
    proximaCita = citasHoyFuturas[0];
    esHoy = true;
  } else if (citasDiasFuturos.length > 0) {
    proximaCita = citasDiasFuturos[0];
    
    const mañana = new Date(ahoraServidor);
    mañana.setDate(mañana.getDate() + 1);
    const mañanaStr = normalizarFecha(mañana);
    esMañana = normalizarFecha(proximaCita.fecha) === mañanaStr;
  }

  // 🐛 DEBUG (remover en producción)
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Debug Próxima Cita:', {
      hoy,
      totalCitas: citas.length,
      citasHoyFuturas: citasHoyFuturas.length,
      citasDiasFuturos: citasDiasFuturos.length,
      proximaCita: proximaCita ? {
        id: proximaCita.id,
        fecha: proximaCita.fecha,
        hora: proximaCita.hora,
        paciente: proximaCita.usuario_id
      } : null,
      esHoy,
      esMañana
    });
  }

  return (
    <div className="mt-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
      {/* ... resto del componente de UI ... */}
    </div>
  );
})()}
```

---

## 🧪 **Testing**

Para verificar que funciona:

1. **Agregar logs temporales** en consola del navegador
2. **Verificar datos de citas**:
   ```javascript
   console.table(citas.map(c => ({
     fecha: c.fecha,
     hora: c.hora,
     estado: c.estado,
     paciente: c.usuario_id
   })));
   ```
3. **Verificar hora actual**:
   ```javascript
   console.log('Hora actual:', currentTime);
   console.log('Formato:', normalizarFecha(currentTime));
   ```

---

## 📊 **Resumen de Cambios Necesarios**

| Problema | Solución |
|----------|----------|
| Comparación de Date vs String | Normalizar todas las fechas a strings YYYY-MM-DD |
| Timezone inconsistente | Usar helpers para crear Date objects consistentes |
| Falta de validación | Agregar checks para fechas/horas inválidas |
| Debugging difícil | Agregar logging detallado temporal |

---

## 🚀 **Próximos Pasos**

1. ✅ Implementar funciones helper (`normalizarFecha`, `crearFechaCompleta`)
2. ✅ Refactorizar la lógica de filtrado
3. ✅ Agregar logs de debugging
4. ✅ Probar con diferentes escenarios:
   - Cita en 10 minutos
   - Cita mañana
   - Cita en varios días
   - Sin citas próximas
5. ✅ Remover logs de debugging antes de producción

---

¿Quieres que implemente estos cambios en el código? 🛠️
