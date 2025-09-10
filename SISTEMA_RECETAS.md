# Sistema de Recetas Médicas - VirtualAid

## Descripción General

Este documento describe la implementación completa del sistema de recetas médicas para VirtualAid, incluyendo la estructura de base de datos, APIs y integración frontend.

## Estructura de Base de Datos

### Tablas Principales

#### 1. `usuarios`
- **Propósito**: Almacena información de todos los usuarios (pacientes, médicos, admin)
- **Campos principales**:
  - `id`: Clave primaria
  - `email`: Email único del usuario
  - `nombre`: Nombre completo
  - `tipo_usuario`: ENUM('paciente', 'medico', 'admin')
  - Campos adicionales: teléfono, edad, peso, altura, tipo_sangre, etc.

#### 2. `medicos`
- **Propósito**: Información adicional específica para médicos
- **Campos principales**:
  - `usuario_id`: FK a usuarios
  - `numero_colegiado`: Número de colegiado único
  - `especialidad`: Especialidad médica
  - `hospital_clinica`: Centro de trabajo

#### 3. `recetas`
- **Propósito**: Almacena todas las recetas médicas
- **Campos principales**:
  - `id`: Clave primaria
  - `codigo_receta`: Código único generado automáticamente
  - `paciente_id`: FK a usuarios (paciente)
  - `medico_id`: FK a usuarios (médico)
  - `medicamento`: Nombre del medicamento
  - `dosis`: Dosis prescrita
  - `frecuencia`: Frecuencia de administración
  - `duracion`: Duración del tratamiento
  - `estado`: ENUM('Activa', 'Completada', 'Cancelada', 'Suspendida')

#### 4. `recetas_historial`
- **Propósito**: Auditoría de cambios en recetas
- **Función**: Tracking de modificaciones para compliance

#### 5. `recetas_seguimiento`
- **Propósito**: Seguimiento de adherencia al tratamiento
- **Función**: Registro de tomas y efectos observados

## Endpoints API

### Recetas por Paciente
```http
GET /api/recetas/paciente/[email]
POST /api/recetas/paciente/[email]
```

### Gestión de Recetas Individuales
```http
PUT /api/recetas/[id]          # Actualizar receta completa
DELETE /api/recetas/[id]       # Cancelar receta
PATCH /api/recetas/[id]/estado # Cambiar solo el estado
```

### Base de Datos
```http
POST /api/database/migrate     # Ejecutar migraciones
GET /api/database/migrate      # Verificar estado de DB
```

## Configuración

### Variables de Entorno

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://13.60.223.37
```

### Archivos Principales

```
src/
├── lib/
│   └── database.ts              # Servicio de base de datos
├── app/
│   ├── medico/
│   │   └── services/
│   │       └── recetas.ts       # Servicio de recetas (frontend)
│   └── api/
│       ├── recetas/
│       │   ├── route.ts         # CRUD general
│       │   ├── paciente/
│       │   │   └── [email]/
│       │   │       └── route.ts # Recetas por paciente
│       │   └── [id]/
│       │       ├── route.ts     # Receta individual
│       │       └── estado/
│       │           └── route.ts # Cambio de estado
│       └── database/
│           └── migrate/
│               └── route.ts     # Migraciones
```

## Scripts de Migración

### Ejecutar Migración Inicial

```sql
-- Ejecutar el archivo: database/migrations/001_create_recetas_tables.sql
-- En tu base de datos remota (MySQL/MariaDB)
```

### Migración desde Next.js

```http
POST http://localhost:3000/api/database/migrate
```

## Uso en el Frontend

### Importar el Servicio

```typescript
import { getRecetasPaciente, crearReceta } from '@/app/medico/services/recetas';
```

### Obtener Recetas de un Paciente

```typescript
const recetas = await getRecetasPaciente('paciente@ejemplo.com');
```

### Crear Nueva Receta

```typescript
const resultado = await crearReceta('paciente@ejemplo.com', {
  medicamento: 'Ibuprofeno 400mg',
  dosis: '1 tablet cada 8 horas',
  duracion: '7 días',
  // ... otros campos
});
```

## Características Implementadas

### ✅ Completadas

1. **Estructura de Base de Datos**: Tablas normalizadas con relaciones apropiadas
2. **APIs RESTful**: Endpoints completos para todas las operaciones CRUD
3. **Integración Frontend**: Servicio actualizado para usar la nueva DB
4. **Fallback System**: Si la nueva DB falla, usa el sistema anterior
5. **Auditoría**: Tabla de historial para tracking de cambios
6. **Estados de Recetas**: Sistema completo de estados (Activa, Completada, etc.)
7. **Validaciones**: Validación de datos tanto en frontend como backend

### 🚧 Próximas Mejoras

1. **Autenticación**: Integrar sistema de autenticación para APIs
2. **Notificaciones**: Sistema de notificaciones para pacientes
3. **Recordatorios**: Alertas automáticas para tomas de medicamentos
4. **Reportes**: Dashboard con estadísticas de adherencia
5. **Interacciones**: Base de datos de interacciones medicamentosas

## Flujo de Trabajo

### Para el Médico:
1. Selecciona paciente en el dashboard
2. Hace clic en "Ver Recetas" 
3. Puede ver todas las recetas existentes
4. Hace clic en "Nueva Receta" para crear una
5. Rellena el formulario y guarda
6. La receta se almacena en la base de datos remota

### Para el Paciente:
1. Puede ver sus recetas a través de su portal
2. Marcar medicamentos como tomados (futuro)
3. Reportar efectos secundarios (futuro)

## Troubleshooting

### Error: "No se puede conectar a la base de datos"
- Verificar que la API remota esté funcionando
- Comprobar las variables de entorno
- El sistema automáticamente hace fallback al sistema JSON

### Error: "Receta no encontrada"
- Verificar que el código de receta sea correcto
- Comprobar que el paciente tenga recetas en el sistema

### Error de Migración
- Ejecutar manualmente el SQL en la base de datos remota
- Verificar permisos de creación de tablas

## Contacto

Para soporte técnico o preguntas sobre el sistema de recetas, contactar al equipo de desarrollo.
