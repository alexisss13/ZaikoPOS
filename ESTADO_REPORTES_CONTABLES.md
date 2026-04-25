# 📊 ESTADO DE LOS REPORTES CONTABLES

## ✅ **LO QUE FUNCIONA ACTUALMENTE**

### 1. **Panel (Dashboard)**
✅ **FUNCIONAL** - Muestra métricas en tiempo real:
- Ingresos totales del mes
- Gastos totales del mes
- Utilidad neta (Ingresos - Gastos)
- Efectivo disponible (Caja y Bancos)
- Actividad reciente (últimos 5 asientos)

### 2. **Asientos Contables**
✅ **FUNCIONAL** - Permite:
- Ver lista completa de asientos
- Crear asientos manuales
- Ver detalles de cada asiento
- Búsqueda y filtros por fecha
- Validación de partida doble

### 3. **Cuentas Contables**
✅ **FUNCIONAL** - Permite:
- Ver plan de cuentas completo
- Crear nuevas cuentas
- Editar cuentas existentes
- Ver saldos actualizados
- Búsqueda y filtros por tipo

---

## ⚠️ **LO QUE ESTÁ PENDIENTE**

### 4. **Reportes Financieros**
❌ **NO IMPLEMENTADO** - Solo muestra botones sin funcionalidad

Los reportes que deberían estar disponibles:

#### 📊 **Balance General** (Balance Sheet)
**Estado**: Pendiente de implementar

**¿Qué debería mostrar?**
```
BALANCE GENERAL al 25/04/2026

ACTIVOS:
  Activos Corrientes:
    Caja General          S/ 5,000
    Banco                 S/ 10,000
    Inventario            S/ 15,000
    Cuentas por Cobrar    S/ 3,000
    ─────────────────────────────
    Total Activos         S/ 33,000

PASIVOS:
  Pasivos Corrientes:
    Cuentas por Pagar     S/ 8,000
    Préstamos             S/ 5,000
    ─────────────────────────────
    Total Pasivos         S/ 13,000

PATRIMONIO:
  Capital               S/ 15,000
  Utilidades Retenidas  S/ 5,000
  ─────────────────────────────
  Total Patrimonio      S/ 20,000

TOTAL PASIVO + PATRIMONIO: S/ 33,000 ✓
```

**Funcionalidad requerida**:
- Seleccionar fecha específica
- Agrupar cuentas por tipo
- Calcular subtotales
- Verificar ecuación contable (Activos = Pasivos + Patrimonio)
- Exportar a PDF/Excel

---

#### 📈 **Estado de Resultados** (Income Statement)
**Estado**: Pendiente de implementar

**¿Qué debería mostrar?**
```
ESTADO DE RESULTADOS
Del 01/04/2026 al 25/04/2026

INGRESOS:
  Ventas                S/ 50,000
  Servicios             S/ 5,000
  Otros Ingresos        S/ 1,000
  ─────────────────────────────
  TOTAL INGRESOS        S/ 56,000

COSTO DE VENTAS:
  Costo de Mercadería   S/ 20,000
  ─────────────────────────────
  UTILIDAD BRUTA        S/ 36,000

GASTOS OPERATIVOS:
  Alquiler              S/ 800
  Sueldos               S/ 2,500
  Servicios             S/ 300
  Publicidad            S/ 500
  Mantenimiento         S/ 200
  ─────────────────────────────
  TOTAL GASTOS          S/ 4,300

UTILIDAD OPERATIVA      S/ 31,700

OTROS GASTOS:
  Intereses             S/ 200
  ─────────────────────────────

UTILIDAD NETA           S/ 31,500 ✓
```

**Funcionalidad requerida**:
- Seleccionar rango de fechas (inicio - fin)
- Agrupar ingresos y gastos por categoría
- Calcular utilidad bruta, operativa y neta
- Comparar con período anterior
- Exportar a PDF/Excel

---

#### 💵 **Flujo de Efectivo** (Cash Flow Statement)
**Estado**: Pendiente de implementar

**¿Qué debería mostrar?**
```
FLUJO DE EFECTIVO
Del 01/04/2026 al 25/04/2026

Saldo Inicial de Efectivo    S/ 5,000

ACTIVIDADES OPERATIVAS:
  Cobros por ventas           S/ 30,000
  Pagos a proveedores         (S/ 10,000)
  Pagos de gastos operativos  (S/ 3,600)
  ─────────────────────────────────────
  Efectivo de Operaciones     S/ 16,400

ACTIVIDADES DE INVERSIÓN:
  Compra de equipos           (S/ 2,000)
  ─────────────────────────────────────
  Efectivo de Inversión       (S/ 2,000)

ACTIVIDADES DE FINANCIAMIENTO:
  Préstamos recibidos         S/ 5,000
  Pago de préstamos           (S/ 1,000)
  ─────────────────────────────────────
  Efectivo de Financiamiento  S/ 4,000

AUMENTO NETO EN EFECTIVO      S/ 18,400

Saldo Final de Efectivo       S/ 23,400 ✓
```

**Funcionalidad requerida**:
- Seleccionar rango de fechas
- Clasificar movimientos por tipo de actividad
- Calcular flujo neto
- Verificar con saldo de cuentas de efectivo
- Exportar a PDF/Excel

---

## 🔧 **IMPLEMENTACIÓN REQUERIDA**

Para hacer funcionales los reportes, se necesita:

### **Backend (API)**

1. **Endpoint: `/api/accounting/reports/balance-sheet`**
   ```typescript
   GET /api/accounting/reports/balance-sheet?date=2026-04-25
   
   Response:
   {
     date: "2026-04-25",
     assets: {
       current: [...],
       nonCurrent: [...],
       total: 33000
     },
     liabilities: {
       current: [...],
       nonCurrent: [...],
       total: 13000
     },
     equity: {
       items: [...],
       total: 20000
     }
   }
   ```

2. **Endpoint: `/api/accounting/reports/income-statement`**
   ```typescript
   GET /api/accounting/reports/income-statement?startDate=2026-04-01&endDate=2026-04-25
   
   Response:
   {
     period: { start: "2026-04-01", end: "2026-04-25" },
     revenue: {
       items: [...],
       total: 56000
     },
     expenses: {
       items: [...],
       total: 4300
     },
     netIncome: 31500
   }
   ```

3. **Endpoint: `/api/accounting/reports/cash-flow`**
   ```typescript
   GET /api/accounting/reports/cash-flow?startDate=2026-04-01&endDate=2026-04-25
   
   Response:
   {
     period: { start: "2026-04-01", end: "2026-04-25" },
     openingBalance: 5000,
     operating: { items: [...], total: 16400 },
     investing: { items: [...], total: -2000 },
     financing: { items: [...], total: 4000 },
     closingBalance: 23400
   }
   ```

### **Frontend (UI)**

1. **Componente: `BalanceSheetReport.tsx`**
   - Selector de fecha
   - Tabla con activos, pasivos y patrimonio
   - Verificación de ecuación contable
   - Botón de exportar

2. **Componente: `IncomeStatementReport.tsx`**
   - Selector de rango de fechas
   - Tabla con ingresos y gastos
   - Cálculo de utilidades
   - Comparación con período anterior
   - Botón de exportar

3. **Componente: `CashFlowReport.tsx`**
   - Selector de rango de fechas
   - Tabla con actividades clasificadas
   - Cálculo de flujo neto
   - Botón de exportar

---

## 🎯 **ALTERNATIVA TEMPORAL**

Mientras se implementan los reportes completos, puedes:

### **Opción 1: Usar el Dashboard**
El Panel muestra las métricas principales en tiempo real.

### **Opción 2: Exportar Asientos**
Puedes exportar la lista de asientos y procesarla en Excel:
1. Ve a **Asientos**
2. Filtra por fecha
3. Copia los datos
4. Pega en Excel
5. Crea tus propios reportes

### **Opción 3: Consultar Cuentas**
Ve a **Cuentas** y revisa los saldos de cada cuenta:
- Suma manualmente los activos
- Suma manualmente los pasivos
- Calcula patrimonio = Activos - Pasivos

---

## 📅 **PRIORIDAD DE IMPLEMENTACIÓN**

Si se van a implementar los reportes, el orden sugerido es:

1. **Estado de Resultados** (más usado, más simple)
2. **Balance General** (importante para análisis)
3. **Flujo de Efectivo** (más complejo, menos usado)

---

## 📝 **NOTAS TÉCNICAS**

### **Cálculos requeridos:**

**Balance General:**
```sql
-- Activos
SELECT SUM(balance) FROM AccountingAccount 
WHERE type = 'ASSET' AND isActive = true

-- Pasivos
SELECT SUM(balance) FROM AccountingAccount 
WHERE type = 'LIABILITY' AND isActive = true

-- Patrimonio
SELECT SUM(balance) FROM AccountingAccount 
WHERE type = 'EQUITY' AND isActive = true
```

**Estado de Resultados:**
```sql
-- Ingresos del período
SELECT SUM(credit - debit) FROM JournalEntryLine
JOIN JournalEntry ON ...
JOIN AccountingAccount ON ...
WHERE account.type = 'REVENUE'
AND entryDate BETWEEN startDate AND endDate

-- Gastos del período
SELECT SUM(debit - credit) FROM JournalEntryLine
JOIN JournalEntry ON ...
JOIN AccountingAccount ON ...
WHERE account.type = 'EXPENSE'
AND entryDate BETWEEN startDate AND endDate
```

---

## ✅ **CONCLUSIÓN**

**Estado actual:**
- ✅ Módulo de contabilidad funcional (cuentas y asientos)
- ✅ Dashboard con métricas en tiempo real
- ❌ Reportes financieros pendientes de implementar

**Para uso inmediato:**
- Usa el Dashboard para ver métricas generales
- Usa la sección de Cuentas para ver saldos
- Usa la sección de Asientos para ver transacciones

**Para reportes completos:**
- Se requiere implementación adicional de backend y frontend
- Estimado: 2-3 días de desarrollo
- Prioridad: Media (el sistema funciona sin ellos)

---

**Fecha**: 25 de abril de 2026
**Versión**: 1.0
