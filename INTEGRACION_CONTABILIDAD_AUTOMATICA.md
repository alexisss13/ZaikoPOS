# 🔄 INTEGRACIÓN AUTOMÁTICA DE CONTABILIDAD

## ❌ **PROBLEMA ACTUAL**

**Estado**: Todo se ingresa **MANUALMENTE** en el módulo de contabilidad.

Esto significa que:
- ❌ Cuando vendes en el POS → NO se crea asiento automático
- ❌ Cuando recibes una compra → NO se crea asiento automático
- ❌ Cuando abres/cierras caja → NO se crea asiento automático
- ❌ Tienes que registrar TODO manualmente en Contabilidad

**Consecuencias:**
1. 😫 Trabajo doble (registras en POS Y en Contabilidad)
2. ⚠️ Propenso a errores (puedes olvidar registrar algo)
3. ⏰ Pérdida de tiempo
4. 📊 Datos desactualizados (si olvidas registrar)

---

## ✅ **CÓMO DEBERÍA FUNCIONAR**

### **Integración Automática**

Cuando haces operaciones en otros módulos, el sistema **automáticamente** crea los asientos contables correspondientes.

---

## 🎯 **CASOS DE USO**

### **1️⃣ VENTA EN EL POS**

#### **Escenario:**
Vendes un juguete por S/ 100 en efectivo (costo del producto: S/ 40)

#### **Lo que haces:**
```
POS → Agregar producto → Cobrar → Efectivo S/ 100 → Finalizar Venta
```

#### **Lo que el sistema DEBERÍA hacer automáticamente:**

**Asiento Contable Automático #1: Registro de la venta**
```
Fecha: 25/04/2026
Descripción: Venta #VTA-001 - POS
Fuente: SALE
Referencia: venta-id-12345

┌─────────────────────────────────────────┐
│ DÉBITO:  Caja General      S/ 100.00   │ ← Entró efectivo
│ CRÉDITO: Ventas            S/ 100.00   │ ← Ingreso por venta
├─────────────────────────────────────────┤
│ TOTAL:   S/ 100.00 = S/ 100.00  ✓      │
└─────────────────────────────────────────┘
```

**Asiento Contable Automático #2: Costo de la venta**
```
Fecha: 25/04/2026
Descripción: Costo de Venta #VTA-001
Fuente: SALE
Referencia: venta-id-12345

┌─────────────────────────────────────────┐
│ DÉBITO:  Costo de Ventas   S/ 40.00    │ ← Gasto por costo
│ CRÉDITO: Inventario        S/ 40.00    │ ← Salió mercadería
├─────────────────────────────────────────┤
│ TOTAL:   S/ 40.00 = S/ 40.00  ✓        │
└─────────────────────────────────────────┘
```

**Resultado en Contabilidad:**
- ✅ Caja aumentó S/ 100
- ✅ Ventas aumentaron S/ 100
- ✅ Costo de Ventas aumentó S/ 40
- ✅ Inventario disminuyó S/ 40
- ✅ **Utilidad Neta: S/ 60** (100 - 40)

---

### **2️⃣ VENTA CON MÚLTIPLES MÉTODOS DE PAGO**

#### **Escenario:**
Vendes por S/ 200: S/ 100 en efectivo + S/ 100 con tarjeta

#### **Lo que haces:**
```
POS → Total S/ 200 → Efectivo S/ 100 → Tarjeta S/ 100 → Finalizar
```

#### **Asiento Automático:**
```
Fecha: 25/04/2026
Descripción: Venta #VTA-002 - Pago mixto
Fuente: SALE

┌─────────────────────────────────────────┐
│ DÉBITO:  Caja General      S/ 100.00   │ ← Efectivo
│ DÉBITO:  Banco (Tarjetas)  S/ 100.00   │ ← Tarjeta
│ CRÉDITO: Ventas            S/ 200.00   │ ← Ingreso total
├─────────────────────────────────────────┤
│ TOTAL:   S/ 200.00 = S/ 200.00  ✓      │
└─────────────────────────────────────────┘
```

---

### **3️⃣ RECEPCIÓN DE COMPRA A PROVEEDOR**

#### **Escenario:**
Recibes mercadería por S/ 1,000 (a crédito, pagarás después)

#### **Lo que haces:**
```
Compras → Orden de Compra → Marcar como RECIBIDA
```

#### **Asiento Automático:**
```
Fecha: 25/04/2026
Descripción: Compra #COM-001 - Proveedor ABC
Fuente: PURCHASE
Referencia: purchase-id-67890

┌─────────────────────────────────────────┐
│ DÉBITO:  Inventario        S/ 1,000.00 │ ← Entró mercadería
│ CRÉDITO: Cuentas por Pagar S/ 1,000.00 │ ← Deuda al proveedor
├─────────────────────────────────────────┤
│ TOTAL:   S/ 1,000.00 = S/ 1,000.00  ✓  │
└─────────────────────────────────────────┘
```

**Resultado:**
- ✅ Inventario aumentó S/ 1,000
- ✅ Cuentas por Pagar aumentaron S/ 1,000
- ✅ Sabes cuánto debes al proveedor

---

### **4️⃣ APERTURA DE CAJA**

#### **Escenario:**
Abres caja con S/ 200 de fondo inicial

#### **Lo que haces:**
```
POS → Abrir Caja → Fondo Inicial: S/ 200
```

#### **Asiento Automático:**
```
Fecha: 25/04/2026 08:00 AM
Descripción: Apertura de Caja - Turno Mañana
Fuente: CASH_SESSION
Referencia: session-id-111

┌─────────────────────────────────────────┐
│ DÉBITO:  Caja General      S/ 200.00   │ ← Fondo inicial
│ CRÉDITO: Fondo de Caja     S/ 200.00   │ ← Cuenta temporal
├─────────────────────────────────────────┤
│ TOTAL:   S/ 200.00 = S/ 200.00  ✓      │
└─────────────────────────────────────────┘
```

---

### **5️⃣ CIERRE DE CAJA**

#### **Escenario:**
Cierras caja: Inicial S/ 200 + Ventas S/ 1,500 = Total S/ 1,700

#### **Lo que haces:**
```
POS → Cerrar Caja → Contar efectivo: S/ 1,700 → Cerrar
```

#### **Asiento Automático:**
```
Fecha: 25/04/2026 06:00 PM
Descripción: Cierre de Caja - Turno Mañana
Fuente: CASH_SESSION
Referencia: session-id-111

┌─────────────────────────────────────────┐
│ DÉBITO:  Fondo de Caja     S/ 200.00   │ ← Devuelve fondo
│ CRÉDITO: Caja General      S/ 200.00   │ ← Quita fondo
├─────────────────────────────────────────┤
│ TOTAL:   S/ 200.00 = S/ 200.00  ✓      │
└─────────────────────────────────────────┘
```

**Resultado:**
- ✅ Caja General queda con S/ 1,500 (ventas netas)
- ✅ Fondo de caja vuelve a 0

---

### **6️⃣ AJUSTE DE INVENTARIO**

#### **Escenario:**
Encuentras 5 productos dañados que debes dar de baja (valor: S/ 100)

#### **Lo que haces:**
```
Inventario → Movimiento → Tipo: AJUSTE → Cantidad: -5 → Razón: Dañados
```

#### **Asiento Automático:**
```
Fecha: 25/04/2026
Descripción: Ajuste de Inventario - Productos dañados
Fuente: INVENTORY
Referencia: movement-id-999

┌─────────────────────────────────────────┐
│ DÉBITO:  Pérdida por Daños S/ 100.00   │ ← Gasto por pérdida
│ CRÉDITO: Inventario        S/ 100.00   │ ← Salió mercadería
├─────────────────────────────────────────┤
│ TOTAL:   S/ 100.00 = S/ 100.00  ✓      │
└─────────────────────────────────────────┘
```

---

## 🔧 **IMPLEMENTACIÓN REQUERIDA**

### **Archivos a modificar:**

#### **1. API de Ventas** (`src/app/api/sales/route.ts`)

```typescript
// Después de crear la venta
const sale = await prisma.sale.create({ ... });

// 🆕 CREAR ASIENTO AUTOMÁTICO
await createSaleJournalEntry(sale);
```

**Función a crear:**
```typescript
async function createSaleJournalEntry(sale: Sale) {
  // 1. Obtener cuentas contables necesarias
  const cashAccount = await getCashAccount(sale.businessId);
  const salesAccount = await getSalesAccount(sale.businessId);
  const costAccount = await getCostOfSalesAccount(sale.businessId);
  const inventoryAccount = await getInventoryAccount(sale.businessId);
  
  // 2. Calcular totales por método de pago
  const paymentsByMethod = groupPaymentsByMethod(sale.payments);
  
  // 3. Crear asiento de venta
  const lines = [];
  
  // Débitos por cada método de pago
  for (const [method, amount] of paymentsByMethod) {
    const account = getAccountForPaymentMethod(method);
    lines.push({
      accountId: account.id,
      debit: amount,
      credit: 0,
      description: `Pago ${method}`
    });
  }
  
  // Crédito a ventas
  lines.push({
    accountId: salesAccount.id,
    debit: 0,
    credit: sale.total,
    description: 'Venta de productos'
  });
  
  // 4. Crear el asiento
  await prisma.journalEntry.create({
    data: {
      businessId: sale.businessId,
      branchId: sale.branchId,
      entryNumber: await getNextEntryNumber(sale.businessId),
      entryDate: sale.createdAt,
      description: `Venta ${sale.code}`,
      source: 'SALE',
      sourceId: sale.id,
      createdById: sale.userId,
      lines: { create: lines }
    }
  });
  
  // 5. Crear asiento de costo (si hay items con costo)
  const totalCost = calculateTotalCost(sale.items);
  if (totalCost > 0) {
    await prisma.journalEntry.create({
      data: {
        businessId: sale.businessId,
        branchId: sale.branchId,
        entryNumber: await getNextEntryNumber(sale.businessId),
        entryDate: sale.createdAt,
        description: `Costo de Venta ${sale.code}`,
        source: 'SALE',
        sourceId: sale.id,
        createdById: sale.userId,
        lines: {
          create: [
            {
              accountId: costAccount.id,
              debit: totalCost,
              credit: 0,
              description: 'Costo de mercadería vendida'
            },
            {
              accountId: inventoryAccount.id,
              debit: 0,
              credit: totalCost,
              description: 'Salida de inventario'
            }
          ]
        }
      }
    });
  }
  
  // 6. Actualizar saldos de cuentas
  await updateAccountBalances(lines);
}
```

---

#### **2. API de Compras** (`src/app/api/purchases/[id]/receive/route.ts`)

```typescript
// Después de marcar como recibida
await prisma.purchaseOrder.update({ status: 'RECEIVED' });

// 🆕 CREAR ASIENTO AUTOMÁTICO
await createPurchaseJournalEntry(purchaseOrder);
```

---

#### **3. API de Caja** (`src/app/api/cash/open/route.ts` y `close/route.ts`)

```typescript
// Al abrir caja
const session = await prisma.cashSession.create({ ... });

// 🆕 CREAR ASIENTO AUTOMÁTICO
await createCashOpenJournalEntry(session);

// Al cerrar caja
await prisma.cashSession.update({ status: 'CLOSED' });

// 🆕 CREAR ASIENTO AUTOMÁTICO
await createCashCloseJournalEntry(session);
```

---

#### **4. API de Inventario** (`src/app/api/inventory/movements/route.ts`)

```typescript
// Después de crear movimiento
const movement = await prisma.stockMovement.create({ ... });

// 🆕 CREAR ASIENTO AUTOMÁTICO (solo para ajustes)
if (movement.type === 'ADJUSTMENT') {
  await createInventoryAdjustmentJournalEntry(movement);
}
```

---

## 📋 **PLAN DE CUENTAS REQUERIDO**

Para que funcione la integración automática, necesitas estas cuentas:

```
ACTIVOS:
├─ 101 - Caja General (efectivo)
├─ 102 - Banco - Tarjetas (pagos con tarjeta)
├─ 103 - Banco - Yape/Plin (pagos digitales)
├─ 104 - Inventario
├─ 105 - Cuentas por Cobrar
└─ 106 - Fondo de Caja (temporal)

PASIVOS:
└─ 201 - Cuentas por Pagar

INGRESOS:
├─ 401 - Ventas
└─ 402 - Otros Ingresos

GASTOS:
├─ 501 - Costo de Ventas
├─ 502 - Pérdida por Daños
├─ 503 - Alquiler
├─ 504 - Sueldos
└─ 505 - Servicios
```

---

## ✅ **BENEFICIOS DE LA INTEGRACIÓN**

### **1. Automatización**
- ✅ No tienes que registrar nada manualmente
- ✅ Cada venta crea su asiento automáticamente
- ✅ Cada compra crea su asiento automáticamente

### **2. Precisión**
- ✅ Cero errores humanos
- ✅ Siempre balanceado (débitos = créditos)
- ✅ Datos consistentes entre módulos

### **3. Tiempo Real**
- ✅ Contabilidad siempre actualizada
- ✅ Reportes reflejan la realidad
- ✅ Tomas decisiones con datos actuales

### **4. Trazabilidad**
- ✅ Cada asiento tiene referencia a la transacción original
- ✅ Puedes ver qué venta generó qué asiento
- ✅ Auditoría completa

### **5. Cumplimiento**
- ✅ Registro completo de todas las operaciones
- ✅ Listo para auditorías
- ✅ Cumple con normas contables

---

## 🎯 **COMPARACIÓN**

### **❌ SIN INTEGRACIÓN (Actual)**

```
1. Vendes en POS → Venta registrada
2. Vas a Contabilidad → Creas asiento manualmente
3. Olvidas registrar una venta → Datos incorrectos
4. Al final del día → Tienes que revisar todo
```

**Tiempo**: 5-10 minutos por venta
**Errores**: Altos
**Actualización**: Manual

---

### **✅ CON INTEGRACIÓN (Propuesto)**

```
1. Vendes en POS → Venta registrada + Asiento creado automáticamente
2. Fin.
```

**Tiempo**: 0 minutos adicionales
**Errores**: Cero
**Actualización**: Automática en tiempo real

---

## 📊 **EJEMPLO COMPLETO DE UN DÍA**

### **Operaciones del día:**
1. Abres caja con S/ 200
2. Vendes S/ 500 en efectivo
3. Vendes S/ 300 con tarjeta
4. Recibes compra de S/ 1,000 (a crédito)
5. Pagas alquiler S/ 800 en efectivo
6. Cierras caja

### **Con integración automática:**

**Asientos creados automáticamente:**
1. ✅ Apertura de caja (automático)
2. ✅ Venta #1 por S/ 500 (automático)
3. ✅ Venta #2 por S/ 300 (automático)
4. ✅ Compra por S/ 1,000 (automático)
5. ⚠️ Pago de alquiler (manual - no es transacción del sistema)
6. ✅ Cierre de caja (automático)

**Resultado en Contabilidad:**
```
PANEL:
- Ingresos: S/ 800 (ventas)
- Gastos: S/ 800 (alquiler)
- Utilidad: S/ 0
- Efectivo: S/ 100 (200 inicial + 500 venta - 800 alquiler + 200 fondo)
```

**Trabajo manual requerido:**
- Solo registrar el pago de alquiler (1 asiento)
- Todo lo demás es automático

---

## 🚀 **RECOMENDACIÓN**

**¿Debería implementarse?**
**SÍ, DEFINITIVAMENTE.**

**Razones:**
1. Es el estándar en sistemas ERP modernos
2. Ahorra tiempo y reduce errores
3. Mantiene datos consistentes
4. Facilita auditorías y reportes
5. Mejora la toma de decisiones

**Prioridad:**
**ALTA** - Es una funcionalidad crítica para un sistema de contabilidad profesional.

**Tiempo estimado:**
- Integración con Ventas: 1 día
- Integración con Compras: 1 día
- Integración con Caja: 0.5 días
- Integración con Inventario: 0.5 días
- Testing: 1 día
- **Total: 4 días**

---

## 📝 **PRÓXIMOS PASOS**

Si decides implementar la integración:

1. **Crear plan de cuentas estándar** (las cuentas básicas necesarias)
2. **Implementar integración con Ventas** (lo más usado)
3. **Implementar integración con Compras**
4. **Implementar integración con Caja**
5. **Implementar integración con Inventario**
6. **Testing exhaustivo**
7. **Documentación para usuarios**

---

**Fecha**: 25 de abril de 2026
**Versión**: 1.0
**Estado**: Propuesta de implementación
