# Endpoint de Saldo del Médico - Documentación para Backend Laravel

## Resumen
El frontend ahora solicita el saldo del médico desde el backend. El saldo se calcula sumando los montos de todas las citas pagadas del médico.

## Endpoint Requerido

### GET `/api/medico/{email}/saldo`

**Parámetros:**
- `email` (string, requerido): Email del médico

**Respuesta Exitosa (200):**
```json
{
  "saldo": 525.00,
  "total_citas_pagadas": 3,
  "ultimo_pago": {
    "fecha": "2025-08-25",
    "monto": 175.00
  }
}
```

**Campos de la Respuesta:**
- `saldo` (number): Suma total de los montos de todas las citas pagadas del médico
- `total_citas_pagadas` (number): Cantidad de citas que han sido pagadas
- `ultimo_pago` (object, opcional): Información del último pago recibido
  - `fecha` (string): Fecha del último pago (formato: YYYY-MM-DD)
  - `monto` (number): Monto del último pago

## Lógica de Negocio

### Estados de Pago Considerados
Una cita se considera **pagada** cuando su estado es uno de los siguientes:
- `completado`
- `pagado`
- `confirmado`

**No se cuentan:**
- `pendiente`
- `cancelado`

### Cálculo del Saldo
```sql
SELECT SUM(pagos.monto) as saldo,
       COUNT(pagos.id) as total_citas_pagadas
FROM pagos
INNER JOIN citas ON pagos.cita_id = citas.id
WHERE citas.medico_id = :email
  AND pagos.estado IN ('completado', 'pagado', 'confirmado')
```

### Último Pago
```sql
SELECT pagos.fecha_pago as fecha,
       pagos.monto
FROM pagos
INNER JOIN citas ON pagos.cita_id = citas.id
WHERE citas.medico_id = :email
  AND pagos.estado IN ('completado', 'pagado', 'confirmado')
ORDER BY pagos.fecha_pago DESC
LIMIT 1
```

## Ejemplo de Implementación en Laravel

### Controlador (MedicoController.php)

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Medico;
use App\Models\Pago;
use Illuminate\Http\Request;

class MedicoController extends Controller
{
    /**
     * Obtiene el saldo del médico
     *
     * @param string $email
     * @return \Illuminate\Http\JsonResponse
     */
    public function getSaldo($email)
    {
        try {
            // Verificar que el médico existe
            $medico = Medico::where('email', $email)->firstOrFail();

            // Estados considerados como pagados
            $estadosPagados = ['completado', 'pagado', 'confirmado'];

            // Calcular saldo total y cantidad de citas pagadas
            $resultado = Pago::whereHas('cita', function ($query) use ($email) {
                $query->where('medico_id', $email);
            })
            ->whereIn('estado', $estadosPagados)
            ->selectRaw('SUM(monto) as saldo, COUNT(*) as total_citas_pagadas')
            ->first();

            // Obtener el último pago
            $ultimoPago = Pago::whereHas('cita', function ($query) use ($email) {
                $query->where('medico_id', $email);
            })
            ->whereIn('estado', $estadosPagados)
            ->orderBy('fecha_pago', 'desc')
            ->first();

            $response = [
                'saldo' => (float) ($resultado->saldo ?? 0),
                'total_citas_pagadas' => (int) ($resultado->total_citas_pagadas ?? 0),
            ];

            // Agregar último pago si existe
            if ($ultimoPago) {
                $response['ultimo_pago'] = [
                    'fecha' => $ultimoPago->fecha_pago,
                    'monto' => (float) $ultimoPago->monto,
                ];
            }

            return response()->json($response);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'error' => 'Médico no encontrado',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener el saldo',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
```

### Ruta (api.php)

```php
// En routes/api.php
Route::get('/medico/{email}/saldo', [MedicoController::class, 'getSaldo']);
```

## Modelos Requeridos

### Modelo Pago
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Pago extends Model
{
    protected $table = 'pagos';

    protected $fillable = [
        'cita_id',
        'monto',
        'estado',
        'metodo',
        'fecha_pago',
    ];

    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_pago' => 'date',
    ];

    public function cita()
    {
        return $this->belongsTo(Cita::class);
    }
}
```

### Modelo Cita (fragmento relevante)
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
        // ... otros campos
    ];

    public function pagos()
    {
        return $this->hasMany(Pago::class);
    }

    public function medico()
    {
        return $this->belongsTo(Medico::class, 'medico_id', 'email');
    }
}
```

## Migración de la Tabla Pagos (si no existe)

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('cita_id');
            $table->decimal('monto', 10, 2);
            $table->enum('estado', ['pendiente', 'completado', 'pagado', 'confirmado', 'cancelado'])
                  ->default('pendiente');
            $table->string('metodo')->nullable(); // tarjeta, efectivo, transferencia, etc.
            $table->date('fecha_pago');
            $table->timestamps();

            $table->foreign('cita_id')->references('id')->on('citas')->onDelete('cascade');
        });
    }

    public function down()
    {
        Schema::dropIfExists('pagos');
    }
};
```

## Pruebas

### Usando curl
```bash
curl -X GET http://localhost:8000/api/medico/doctor@example.com/saldo \
  -H "Accept: application/json"
```

### Respuesta Esperada
```json
{
  "saldo": 525.00,
  "total_citas_pagadas": 3,
  "ultimo_pago": {
    "fecha": "2025-08-25",
    "monto": 175.00
  }
}
```

## Integración con el Frontend

El frontend ya está configurado para:
1. Llamar al endpoint `/api/medico/saldo?medico_email={email}` (Next.js proxy)
2. Mostrar el saldo en la sección "Mi Billetera"
3. Actualizar el saldo automáticamente cuando se carga el dashboard

### Archivos Modificados en el Frontend:
- `src/app/api/medico/saldo/route.ts` - Endpoint proxy de Next.js
- `src/app/medico/services/pagos.ts` - Función `getSaldoMedico()`
- `src/app/medico/page.tsx` - Carga del saldo al iniciar
- `src/app/medico/sections/BillingSection.tsx` - Mostrar saldo real

## Flujo Completo

1. **Usuario ingresa al dashboard del médico**
2. **Frontend solicita el saldo**: `GET /api/medico/saldo?medico_email=doctor@example.com`
3. **Proxy de Next.js** redirige a Laravel: `GET http://backend/api/medico/{email}/saldo`
4. **Laravel calcula el saldo**:
   - Busca todas las citas del médico
   - Filtra pagos con estado 'completado', 'pagado' o 'confirmado'
   - Suma los montos
5. **Laravel responde con el JSON**
6. **Frontend muestra el saldo** en la sección "Mi Billetera"

## Notas Importantes

- El saldo se calcula **en tiempo real** cada vez que se solicita
- Solo se cuentan citas con pagos confirmados
- El frontend maneja errores mostrando saldo en 0 si el backend no está disponible
- El cálculo es determinístico y basado en datos de la base de datos

## Seguridad

Recomendaciones:
1. Validar que el usuario autenticado es el médico solicitado
2. Usar middleware de autenticación en la ruta
3. Rate limiting para evitar abuso
4. Log de accesos al saldo para auditoría

```php
// Ejemplo con middleware
Route::middleware(['auth:api', 'medico'])->group(function () {
    Route::get('/medico/{email}/saldo', [MedicoController::class, 'getSaldo']);
});
```
