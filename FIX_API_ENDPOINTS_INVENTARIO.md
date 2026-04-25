# Fix API Endpoints - Inventario Móvil

## ✅ COMPLETADO

### Problemas Encontrados

#### 1. Error 400 Bad Request - `/api/inventory/movements`
```
POST http://localhost:3000/api/inventory/movements 400 (Bad Request)
Error: Error al crear movimiento
```

**Causa**: El componente móvil estaba enviando datos incorrectos:
- Enviaba `branchId` pero el endpoint esperaba `targetBranchId`
- Enviaba `reason: null` pero el endpoint requiere un string

#### 2. Error 404 Not Found - `/api/transfers/[id]`
```
PATCH http://localhost:3000/api/transfers/ea1727e1-2ab1-44c6-9480-a2ed9da518a4 404 (Not Found)
```

**Causa**: URL incorrecta del endpoint
- Usaba: `/api/transfers/[id]`
- Correcto: `/api/stock-transfers/[id]`

## Soluciones Implementadas

### 1. NewMovementMobile - Corrección de Datos

**Archivo**: `src/components/inventory/NewMovementMobile.tsx`

#### ANTES (Incorrecto):
```typescript
body: JSON.stringify({
  type,
  branchId,              // ❌ Campo incorrecto
  variantId: selectedVariant.id,
  quantity: parseInt(quantity),
  reason: reason || null, // ❌ null no es válido
}),
```

#### DESPUÉS (Correcto):
```typescript
body: JSON.stringify({
  type,
  targetBranchId: branchId,  // ✅ Campo correcto
  variantId: selectedVariant.id,
  quantity: parseInt(quantity),
  reason: reason || 'Movimiento manual desde móvil', // ✅ String por defecto
}),
```

#### Mejoras Adicionales:
```typescript
// ✅ Manejo de errores mejorado
if (!res.ok) {
  const errorData = await res.json();
  throw new Error(errorData.error || 'Error al crear movimiento');
}

// ✅ Mensajes de error específicos
catch (error: any) {
  console.error(error);
  toast.error(error.message || 'Error al registrar el movimiento');
}
```

### 2. useInventoryLogic - Corrección de URL

**Archivo**: `src/components/inventory/useInventoryLogic.ts`

#### ANTES (Incorrecto):
```typescript
const res = await fetch(`/api/transfers/${transferId}`, {
  method: 'PATCH',
  // ...
});
```

#### DESPUÉS (Correcto):
```typescript
const res = await fetch(`/api/stock-transfers/${transferId}`, {
  method: 'PATCH',
  // ...
});
```

## Validaciones del Endpoint

### `/api/inventory/movements` (POST)

**Campos Requeridos**:
```typescript
{
  variantId: string,      // ID de la variante del producto
  type: string,           // 'INPUT' | 'OUTPUT' | 'ADJUSTMENT'
  quantity: number,       // Debe ser > 0
  reason: string,         // Motivo del movimiento (requerido)
  targetBranchId: string  // ID de la sucursal afectada
}
```

**Validaciones**:
- ✅ `quantity` debe ser mayor a 0
- ✅ `targetBranchId` no puede ser 'NONE'
- ✅ `reason` debe ser un string (no null)
- ✅ Para OUTPUT, verifica stock suficiente
- ✅ Solo OWNER, MANAGER y ADMIN pueden crear movimientos

**Respuesta Exitosa**:
```typescript
{
  id: string,
  variantId: string,
  branchId: string,
  userId: string,
  type: string,
  quantity: number,
  previousStock: number,
  currentStock: number,
  reason: string,
  createdAt: Date,
  variant: { product: { title: string } },
  branch: { name: string },
  user: { name: string }
}
```

### `/api/stock-transfers/[id]` (PATCH)

**Campos Requeridos**:
```typescript
{
  status: 'APPROVED' | 'REJECTED'
}
```

**Validaciones**:
- ✅ El traslado debe existir
- ✅ El traslado debe estar en estado 'PENDING'
- ✅ Solo OWNER, MANAGER de sucursal origen pueden aprobar
- ✅ Si se aprueba, verifica stock suficiente en origen

**Proceso de Aprobación**:
1. Actualiza estado del traslado
2. Si APPROVED:
   - Resta stock de sucursal origen
   - Suma stock a sucursal destino
   - Registra movimientos en kardex (TRANSFER)
3. Crea notificación para el solicitante

## Archivos Modificados

1. ✅ `src/components/inventory/NewMovementMobile.tsx`
   - Cambiado `branchId` → `targetBranchId`
   - Agregado reason por defecto
   - Mejorado manejo de errores

2. ✅ `src/components/inventory/useInventoryLogic.ts`
   - Corregido URL: `/api/transfers/` → `/api/stock-transfers/`

## Testing

### Casos de Prueba:

#### Nuevo Movimiento:
- ✅ INPUT: Agregar stock
- ✅ OUTPUT: Retirar stock (valida stock suficiente)
- ✅ ADJUSTMENT: Ajustar cantidad exacta
- ✅ Validación de campos requeridos
- ✅ Validación de cantidad > 0
- ✅ Validación de sucursal válida

#### Traslados:
- ✅ Aprobar traslado (mueve stock)
- ✅ Rechazar traslado (no mueve stock)
- ✅ Validación de permisos
- ✅ Validación de stock suficiente
- ✅ Notificación al solicitante

## Build Exitoso ✅

```bash
npm run build
✓ Compiled successfully in 7.3s
✓ Finished TypeScript in 13.4s
```

## Resultado Final

Ahora los endpoints funcionan correctamente:
- ✅ Movimientos de inventario se crean sin errores
- ✅ Traslados se aprueban/rechazan correctamente
- ✅ Validaciones del backend funcionan
- ✅ Mensajes de error específicos
- ✅ Stock se actualiza correctamente
- ✅ Kardex registra todos los movimientos
- ✅ Notificaciones se envían correctamente

La funcionalidad de inventario móvil ahora está completamente operativa.
