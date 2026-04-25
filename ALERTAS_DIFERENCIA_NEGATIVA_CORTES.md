# ⚠️ SISTEMA DE ALERTAS - DIFERENCIA NEGATIVA EN CORTES

## 📋 RESUMEN
Se implementó un sistema visual de alertas para identificar rápidamente cuando hay una diferencia negativa (falta dinero) en los cortes de turno cerrados.

---

## 🎯 OBJETIVO

Permitir identificar de manera inmediata y visual cuando un corte de turno tiene una diferencia negativa entre el efectivo esperado en caja y el efectivo declarado, indicando que **falta dinero**.

---

## 🎨 IMPLEMENTACIÓN

### 1. ✅ Vista Móvil - Lista de Turnos

**Archivo**: `src/components/cash-sessions/CashSessionsMobile.tsx`

#### Indicadores Visuales:
```typescript
// Tarjeta del turno
- Fondo: bg-red-50 (en lugar de bg-white)
- Borde: border-red-200 (en lugar de border-slate-200)

// Badge adicional
- "FALTA DINERO" en rojo (bg-red-600 text-white)

// Tarjeta de estadística
- Cambia de "EN CAJA" a "DIFERENCIA"
- Fondo: bg-red-100 (en lugar de bg-emerald-50)
- Texto: text-red-700/900 (en lugar de text-emerald-700/900)
- Muestra el monto negativo
```

#### Lógica:
```typescript
const hasNegativeDifference = session.status === 'CLOSED' && stats.cashDifference < 0;
```

### 2. ✅ Vista Móvil - Detalle del Turno

**Archivo**: `src/components/cash-sessions/CashSessionsMobile.tsx`

#### Alerta Destacada:
```typescript
{selectedSession.status === 'CLOSED' && stats.cashDifference < 0 && (
  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center">
        {/* Icono de advertencia */}
      </div>
      <div>
        <h3>⚠️ Falta Dinero en Caja</h3>
        <p>Hay una diferencia negativa de S/ {Math.abs(stats.cashDifference).toFixed(2)}</p>
      </div>
    </div>
  </div>
)}
```

### 3. ✅ Vista Desktop - Lista de Turnos

**Archivo**: `src/app/(dashboard)/dashboard/cash-sessions/page.tsx`

#### Indicadores Visuales:
```typescript
// Tarjeta del turno
- Fondo: bg-red-50 (en lugar de bg-white)
- Borde: border-red-200 (en lugar de border-slate-200)
- Hover: border-red-300 bg-red-100

// Badge de advertencia
- Emoji "⚠️" en badge rojo antes del estado
```

#### Lógica:
```typescript
const stats = getSessionStats(session);
const hasNegativeDifference = session.status === 'CLOSED' && stats.cashDifference < 0;
```

### 4. ✅ Vista Desktop - Panel de Detalles

**Archivo**: `src/app/(dashboard)/dashboard/cash-sessions/page.tsx`

#### Alerta Destacada:
```typescript
{selectedSession.status === 'CLOSED' && stats.cashDifference < 0 && (
  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-red-600 flex items-center justify-center">
        {/* Icono de advertencia */}
      </div>
      <div>
        <h3>⚠️ Falta Dinero en Caja</h3>
        <p>
          Diferencia negativa: S/ {Math.abs(stats.cashDifference).toFixed(2)}
          Declarado: S/ {stats.declaredCash.toFixed(2)}
          Esperado: S/ {stats.totalInCash.toFixed(2)}
        </p>
      </div>
    </div>
  </div>
)}
```

---

## 🎨 COLORES Y ESTILOS

### Estados Normales (Sin diferencia negativa)
```css
- Fondo tarjeta: bg-white
- Borde: border-slate-200
- Tarjeta "EN CAJA": bg-emerald-50, text-emerald-700/900
```

### Estados de Alerta (Diferencia negativa)
```css
- Fondo tarjeta: bg-red-50
- Borde: border-red-200
- Badge: bg-red-600 text-white "FALTA DINERO"
- Tarjeta "DIFERENCIA": bg-red-100, text-red-700/900
- Alerta completa: bg-red-50 border-2 border-red-200
- Icono: bg-red-600 con SVG de advertencia
```

---

## 📊 EJEMPLOS VISUALES

### Móvil - Lista

#### Turno Normal:
```
┌─────────────────────────────────┐
│ 🟢 Corte N°123  [CERRADO]      │
│ Juan Pérez · Sucursal Centro    │
│ 25/04 14:30                     │
│ ┌──────────┐ ┌──────────┐      │
│ │ VENTAS   │ │ EN CAJA  │      │
│ │ S/ 500.00│ │ S/ 450.00│      │
│ └──────────┘ └──────────┘      │
└─────────────────────────────────┘
```

#### Turno con Diferencia Negativa:
```
┌─────────────────────────────────┐ ← Fondo rojo claro
│ 🔴 Corte N°123  [CERRADO]      │
│    [FALTA DINERO] ⚠️           │
│ Juan Pérez · Sucursal Centro    │
│ 25/04 14:30                     │
│ ┌──────────┐ ┌──────────┐      │
│ │ VENTAS   │ │DIFERENCIA│ ← Rojo
│ │ S/ 500.00│ │ S/ -20.00│      │
│ └──────────┘ └──────────┘      │
└─────────────────────────────────┘
```

### Móvil - Detalle

```
┌─────────────────────────────────┐
│ ⚠️ ALERTA                       │
│ ┌───┐                           │
│ │ ⚠ │ Falta Dinero en Caja     │
│ └───┘                           │
│ Hay una diferencia negativa de  │
│ S/ 20.00. El efectivo declarado │
│ es menor al esperado.           │
└─────────────────────────────────┘
```

### Desktop - Lista

```
Turnos Normales:        Turnos con Alerta:
┌──────────────┐       ┌──────────────┐
│ Corte N°123  │       │ ⚠️ Corte N°124│ ← Fondo rojo
│ [CERRADO]    │       │ [CERRADO]    │
│ 25/04 14:30  │       │ 25/04 16:45  │
│ Juan Pérez   │       │ María López  │
└──────────────┘       └──────────────┘
```

---

## 🔍 CONDICIONES DE ACTIVACIÓN

La alerta se activa cuando se cumplen **TODAS** estas condiciones:

1. ✅ El turno está **CERRADO** (`session.status === 'CLOSED'`)
2. ✅ La diferencia es **NEGATIVA** (`stats.cashDifference < 0`)

### Cálculo de la Diferencia:
```typescript
const totalInCash = initialCash + cashInSales + totalIncome - totalExpense;
const declaredCash = session.finalCash; // Lo que el usuario declaró
const cashDifference = declaredCash - totalInCash;

// Si cashDifference < 0 → FALTA DINERO
// Si cashDifference > 0 → SOBRA DINERO
// Si cashDifference === 0 → EXACTO
```

---

## 📱 EXPERIENCIA DE USUARIO

### Flujo Normal (Sin Alerta):
1. Usuario ve lista de turnos con fondo blanco
2. Selecciona un turno
3. Ve detalles normales
4. Todo en colores neutros (slate/emerald)

### Flujo con Alerta (Diferencia Negativa):
1. Usuario ve turno con **fondo rojo claro** en la lista
2. Ve badge **"FALTA DINERO"** en rojo
3. La tarjeta muestra **"DIFERENCIA"** en lugar de "EN CAJA"
4. Al seleccionar, ve **alerta destacada** en la parte superior
5. Alerta explica:
   - Que falta dinero
   - Cuánto falta
   - Comparación entre declarado y esperado

---

## 🎯 BENEFICIOS

### Para Gerentes/Administradores:
- ✅ Identificación inmediata de problemas
- ✅ No necesitan revisar cada turno manualmente
- ✅ Alertas visuales claras y destacadas
- ✅ Información detallada del faltante

### Para Auditores:
- ✅ Fácil identificación de turnos con discrepancias
- ✅ Información completa para investigación
- ✅ Registro visual permanente

### Para el Sistema:
- ✅ Prevención de pérdidas
- ✅ Control de caja mejorado
- ✅ Transparencia en operaciones

---

## 🔧 CASOS DE USO

### Caso 1: Turno Normal
```
Dinero inicial: S/ 100.00
Ventas efectivo: S/ 350.00
Total esperado: S/ 450.00
Efectivo declarado: S/ 450.00
Diferencia: S/ 0.00 ✅ SIN ALERTA
```

### Caso 2: Falta Dinero
```
Dinero inicial: S/ 100.00
Ventas efectivo: S/ 350.00
Total esperado: S/ 450.00
Efectivo declarado: S/ 430.00
Diferencia: S/ -20.00 ⚠️ ALERTA ROJA
```

### Caso 3: Sobra Dinero
```
Dinero inicial: S/ 100.00
Ventas efectivo: S/ 350.00
Total esperado: S/ 450.00
Efectivo declarado: S/ 470.00
Diferencia: S/ +20.00 ✅ SIN ALERTA (pero se muestra en verde)
```

---

## 📊 ESTADÍSTICAS

### Archivos Modificados: 2
- `src/components/cash-sessions/CashSessionsMobile.tsx`
- `src/app/(dashboard)/dashboard/cash-sessions/page.tsx`

### Líneas Agregadas: ~80
- Lógica de detección: ~10 líneas
- Alertas visuales: ~40 líneas
- Estilos condicionales: ~30 líneas

### Componentes Afectados: 4
- Lista móvil
- Detalle móvil
- Lista desktop
- Detalle desktop

---

## ✅ TESTING

### Build
```bash
✓ Compiled successfully in 8.8s
✓ Finished TypeScript in 29.9s
✓ No errors
```

### Verificaciones
- ✅ Alertas se muestran solo en turnos cerrados
- ✅ Alertas se muestran solo con diferencia negativa
- ✅ Colores correctos en móvil y desktop
- ✅ Badges adicionales funcionan
- ✅ Información detallada en alertas
- ✅ No afecta turnos normales

---

## 🎉 CONCLUSIÓN

El sistema de alertas de diferencia negativa está **100% implementado y funcional** en ambas vistas (móvil y desktop). Proporciona una forma clara, visual e inmediata de identificar cuando falta dinero en un corte de turno.

**Estado**: ✅ COMPLETADO Y FUNCIONAL
**Build**: ✅ EXITOSO
**UX**: ✅ OPTIMIZADA

---

**Fecha de implementación**: 25 de Abril, 2026
**Desarrollado por**: Kiro AI Assistant
