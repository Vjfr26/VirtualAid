# Endpoint de Citas Canceladas - Documentación para Backend Laravel

## Resumen
El frontend ahora solicita estadísticas de citas canceladas desde el backend. Las estadísticas incluyen el total de citas canceladas en los últimos 7 días y el período anterior (para comparación).

## Campo `cancelada` en la Tabla `citas`

### Agregar el campo a la migración:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->boolean('cancelada')->default(false)->after('estado');
        });
    }

    public function down()
    {
        Schema::table('citas', function (Blueprint $table) {
            $table->dropColumn('cancelada');
        });
    }
};
```

### Lógica de Negocio:
- Cuando se cancela una cita, actualizar `cancelada = true`
- Cuando el estado de una cita cambia a 'cancelada', automáticamente `cancelada = true`

## Endpoint Requerido

### GET `/api/medico/{email}/citas-canceladas-stats`

**Parámetros:**
- `email` (string, requerido): Email del médico

**Respuesta Exitosa (200):**
```json
{
  "total_canceladas_7d": 5,
  "total_canceladas_periodo_anterior": 3,
  "citas_canceladas": [
    {
      "id": 123,
      "usuario_id": "paciente@example.com",
      "medico_id": "doctor@example.com",
      "fecha": "2025-10-20",
      "hora": "10:00",
      "estado": "cancelada",
      "cancelada": true,
      "motivo": "Consulta general",
      "created_at": "2025-10-15T08:00:00.000000Z"
    }
  ]
}
```

**Campos de la Respuesta:**
- `total_canceladas_7d` (number): Total de citas canceladas en los últimos 7 días
- `total_canceladas_periodo_anterior` (number): Total de citas canceladas en los 7 días anteriores (para comparación)
- `citas_canceladas` (array, opcional): Lista de citas canceladas en los últimos 7 días

## Lógica de Negocio

### Período Actual (últimos 7 días):
- Fecha fin: Hoy (23:59:59)
- Fecha inicio: Hace 7 días (00:00:00)

### Período Anterior (7 días previos):
- Fecha fin: Hace 7 días - 1 segundo
- Fecha inicio: Hace 14 días (00:00:00)

### Criterios para contar una cita como cancelada:
1. `cancelada = true` (campo booleano)
2. O `estado LIKE '%cancel%'` (para compatibilidad)

### Cálculo SQL

```sql
-- Total de citas canceladas en los últimos 7 días
SELECT COUNT(*) as total_canceladas_7d
FROM citas
WHERE medico_id = :email
  AND (cancelada = true OR estado LIKE '%cancel%')
  AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  AND fecha <= CURDATE()

-- Total del período anterior (7 días previos)
SELECT COUNT(*) as total_canceladas_periodo_anterior
FROM citas
WHERE medico_id = :email
  AND (cancelada = true OR estado LIKE '%cancel%')
  AND fecha >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
  AND fecha < DATE_SUB(CURDATE(), INTERVAL 7 DAY)

-- Citas canceladas (opcional, con detalles)
SELECT *
FROM citas
WHERE medico_id = :email
  AND (cancelada = true OR estado LIKE '%cancel%')
  AND fecha >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
  AND fecha <= CURDATE()
ORDER BY fecha DESC, hora DESC
```

## Ejemplo de Implementación en Laravel

### Controlador (MedicoController.php)

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Models\Cita;
use Illuminate\Http\Request;
use Carbon\Carbon;

class MedicoController extends Controller
{
    /**
     * Obtiene estadísticas de citas canceladas
     *
     * @param string $email
     * @return \Illuminate\Http\JsonResponse
     */
    public function getCitasCanceladasStats($email)
    {
        try {
            // Verificar que el médico existe
            $medico = Medico::where('email', $email)->firstOrFail();

            // Calcular fechas para los períodos
            $ahora = Carbon::now();
            $inicioActual = Carbon::now()->subDays(6)->startOfDay(); // Últimos 7 días incluye hoy
            $finActual = Carbon::now()->endOfDay();
            
            $inicioPrevio = Carbon::now()->subDays(13)->startOfDay(); // 7 días anteriores
            $finPrevio = Carbon::now()->subDays(7)->endOfDay();

            // Contar citas canceladas en el período actual (últimos 7 días)
            $totalCanceladasActual = Cita::where('medico_id', $email)
                ->where(function ($query) {
                    $query->where('cancelada', true)
                          ->orWhere('estado', 'LIKE', '%cancel%');
                })
                ->whereBetween('fecha', [$inicioActual->toDateString(), $finActual->toDateString()])
                ->count();

            // Contar citas canceladas en el período anterior
            $totalCanceladasPrevio = Cita::where('medico_id', $email)
                ->where(function ($query) {
                    $query->where('cancelada', true)
                          ->orWhere('estado', 'LIKE', '%cancel%');
                })
                ->whereBetween('fecha', [$inicioPrevio->toDateString(), $finPrevio->toDateString()])
                ->count();

            // Obtener las citas canceladas (opcional, para mostrar detalles)
            $citasCanceladas = Cita::where('medico_id', $email)
                ->where(function ($query) {
                    $query->where('cancelada', true)
                          ->orWhere('estado', 'LIKE', '%cancel%');
                })
                ->whereBetween('fecha', [$inicioActual->toDateString(), $finActual->toDateString()])
                ->orderBy('fecha', 'desc')
                ->orderBy('hora', 'desc')
                ->get();

            return response()->json([
                'total_canceladas_7d' => $totalCanceladasActual,
                'total_canceladas_periodo_anterior' => $totalCanceladasPrevio,
                'citas_canceladas' => $citasCanceladas,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Médico no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener estadísticas de citas canceladas',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
```

### Ruta (api.php)

```php
// En routes/api.php
Route::get('/medico/{email}/citas-canceladas-stats', [MedicoController::class, 'getCitasCanceladasStats']);
```

## Modelo Cita (actualizado)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cita extends Model
{
    protected $table = 'citas';

    protected $fillable = [
        'medico_id',
        'usuario_id',
        'fecha',
        'hora',
        'estado',
        'cancelada',
        'motivo',
        'notas',
        'asistio',
        'archivo',
    ];

    protected $casts = [
        'fecha' => 'date',
        'asistio' => 'boolean',
        'cancelada' => 'boolean',
    ];

    /**
     * Marcar la cita como cancelada
     */
    public function cancelar()
    {
        $this->update([
            'estado' => 'cancelada',
            'cancelada' => true,
        ]);
    }

    /**
     * Verificar si la cita está cancelada
     */
    public function estaCancelada(): bool
    {
        return $this->cancelada === true || 
               stripos($this->estado, 'cancel') !== false;
    }

    public function medico()
    {
        return $this->belongsTo(Medico::class, 'medico_id', 'email');
    }

    public function usuario()
    {
        return $this->belongsTo(User::class, 'usuario_id', 'email');
    }

    public function pagos()
    {
        return $this->hasMany(Pago::class);
    }
}
```

## Observer para Sincronizar Estado y Campo `cancelada`

```php
<?php

namespace App\Observers;

use App\Models\Cita;

class CitaObserver
{
    /**
     * Handle the Cita "saving" event.
     * Sincronizar el campo cancelada con el estado
     */
    public function saving(Cita $cita)
    {
        // Si el estado contiene "cancel", marcar como cancelada
        if (stripos($cita->estado, 'cancel') !== false) {
            $cita->cancelada = true;
        }
    }
}
```

### Registrar el Observer en `AppServiceProvider`:

```php
<?php

namespace App\Providers;

use App\Models\Cita;
use App\Observers\CitaObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        Cita::observe(CitaObserver::class);
    }
}
```

## Pruebas

### Usando curl
```bash
curl -X GET http://localhost:8000/api/medico/doctor@example.com/citas-canceladas-stats \
  -H "Accept: application/json"
```

### Respuesta Esperada
```json
{
  "total_canceladas_7d": 5,
  "total_canceladas_periodo_anterior": 3,
  "citas_canceladas": [
    {
      "id": 123,
      "usuario_id": "paciente@example.com",
      "medico_id": "doctor@example.com",
      "fecha": "2025-10-20",
      "hora": "10:00",
      "estado": "cancelada",
      "cancelada": true,
      "motivo": "Consulta general",
      "created_at": "2025-10-15T08:00:00.000000Z"
    }
  ]
}
```

## Integración con el Frontend

El frontend ya está configurado para:
1. Llamar al endpoint `/api/medico/citas-canceladas-stats?medico_email={email}` (Next.js proxy)
2. Usar los datos en el dashboard para mostrar:
   - Total de citas canceladas en los últimos 7 días
   - Comparación con el período anterior
   - Tendencias visuales con flechas (↑↓)

### Archivos Modificados en el Frontend:
- `src/app/api/medico/citas-canceladas-stats/route.ts` - Endpoint proxy de Next.js
- `src/app/medico/services/citas.ts` - Función `getCitasCanceladasStats()` e interfaz `CitasCanceladasStats`
- `src/app/medico/page.tsx` - Carga de estadísticas y uso en tendencias del dashboard

## Flujo Completo

1. **Usuario ingresa al dashboard del médico**
2. **Frontend solicita estadísticas**: `GET /api/medico/citas-canceladas-stats?medico_email=doctor@example.com`
3. **Proxy de Next.js** redirige a Laravel: `GET http://backend/api/medico/{email}/citas-canceladas-stats`
4. **Laravel calcula las estadísticas**:
   - Cuenta citas con `cancelada = true` en los últimos 7 días
   - Cuenta citas con `cancelada = true` en los 7 días anteriores
   - Opcionalmente devuelve la lista de citas canceladas
5. **Laravel responde con el JSON**
6. **Frontend muestra las tendencias** en el panel de "Tendencias"

## Visualización en el Dashboard

El dashboard muestra:
```
📈 Evolución de Asistencia (7d)
┌──────────────┬──────────────┐
│ Asistieron   │ Canceladas   │
│ 12           │ 5            │
│ ↑+3          │ ↓-2          │
│ 70% del total│ 30% del total│
└──────────────┴──────────────┘
```

## Notas Importantes

- El campo `cancelada` debe sincronizarse automáticamente cuando `estado` cambia a 'cancelada'
- El frontend maneja errores mostrando 0 citas canceladas si el backend no está disponible
- Las estadísticas se calculan en tiempo real cada vez que se solicitan
- Se usa el campo `cancelada` (booleano) para mayor precisión que depender solo del estado

## Seguridad

Recomendaciones:
1. Validar que el usuario autenticado es el médico solicitado
2. Usar middleware de autenticación en la ruta
3. Rate limiting para evitar abuso
4. Log de accesos para auditoría

```php
// Ejemplo con middleware
Route::middleware(['auth:api', 'medico'])->group(function () {
    Route::get('/medico/{email}/citas-canceladas-stats', [MedicoController::class, 'getCitasCanceladasStats']);
});
```

## Actualización de Citas Existentes

Para citas existentes que tienen `estado = 'cancelada'` pero no tienen `cancelada = true`:

```sql
UPDATE citas 
SET cancelada = true 
WHERE estado LIKE '%cancel%' 
  AND (cancelada IS NULL OR cancelada = false);
```
