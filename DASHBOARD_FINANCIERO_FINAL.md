# Dashboard Financiero - Reforma Final 💰

## 🎯 Enfoque
Dashboard enfocado en **métricas financieras y de negocio**: ganancias, costos, ventas, top productos por rentabilidad y balances.

## 📊 Estructura del Dashboard

### **Layout: 3 Columnas Especializadas**

```
┌──────────────────┬──────────────────┬──────────────────┐
│   FINANCIERO     │  TOP PRODUCTOS   │   POR SUCURSAL   │
│                  │                  │                  │
│ • Ingresos       │ • Ranking por    │ • Análisis       │
│ • Costos         │   rentabilidad   │   financiero     │
│ • Ganancias      │ • Margen %       │   por sucursal   │
│ • Margen         │ • Unidades       │                  │
│ • Ventas         │                  │ • Ingresos       │
│ • Balance        │                  │ • Costos         │
│                  │                  │ • Ganancias      │
└──────────────────┴──────────────────┴──────────────────┘
```

## 💰 COLUMNA IZQUIERDA - Métricas Financieras

### 1. **Card de Ingresos Totales** (Grande)
- Valor principal en **text-4xl**
- Badge de tendencia (↑↓ con %)
- Barra de progreso visual
- Icono: DollarCircleIcon (azul)

### 2. **Grid 2x2: Costos y Ganancias**

#### **Costos**
- Icono: MoneyBag02Icon (rojo)
- Valor en text-xl
- Barra de progreso mostrando % del ingreso
- Color: Red (gastos)

#### **Ganancias**
- Icono: ChartLineData03Icon (verde)
- Valor en text-xl con color emerald
- Badge de tendencia con %
- Color: Emerald (positivo)

### 3. **Grid 2x2: Margen y Ventas**

#### **Margen de Ganancia**
- Icono: Calculator01Icon (púrpura)
- Muestra el % de ganancia sobre ingresos
- Fórmula: `(Ganancia / Ingresos) * 100`
- text-2xl para el porcentaje

#### **Ventas (Órdenes)**
- Icono: ShoppingCart01Icon (ámbar)
- Número total de órdenes
- Badge de tendencia con %
- text-2xl para el valor

### 4. **Balance Financiero** (Card Especial)
- Fondo degradado: `from-slate-50 to-slate-100`
- Muestra:
  - ✅ Ingresos (azul)
  - ❌ Costos (rojo, con signo negativo)
  - ➖ Separador
  - 💰 **Ganancia Neta** (emerald, destacada)
- Formato contable claro

## 📦 COLUMNA CENTRAL - Top Productos

### **Ranking por Rentabilidad**
- **Ordenados por ganancia** (no por ventas)
- Cada producto muestra:
  - Posición con colores:
    - 🥇 #1: Amber (dorado)
    - 🥈 #2: Slate (plateado)
    - 🥉 #3: Orange (bronce)
  - Nombre del producto
  - Unidades vendidas
  - **Margen de ganancia %**
  - **Ganancia en soles** (destacado en verde)
  - Ingreso total (secundario)
- **Barra de fondo verde** proporcional a la ganancia

### **Información Mostrada**
```
#1  Producto A
    150 uds · 45% margen
    +S/ 450.00
    S/ 1,000.00
```

## 🏢 COLUMNA DERECHA - Adaptativa según Rol

### **Para OWNERS (múltiples sucursales)**
Muestra análisis financiero por sucursal:
- Nombre y número de ventas
- **Desglose financiero**:
  - Ingresos (azul)
  - Costos (rojo)
  - Ganancia (emerald, destacada)
- **Barra de margen de ganancia**
- Porcentaje de rentabilidad

### **Para MANAGERS/JEFES DE TIENDA (una sucursal)**
Muestra análisis detallado de su tienda:

#### 1. **Desglose de Costos**
- Costo de Productos Vendidos
- Costo Promedio por Venta
- Ratio Costo/Ingreso (%)

#### 2. **Análisis de Rentabilidad**
- Ganancia por Venta (promedio)
- Ganancia por Producto (por unidad)
- Total de Productos Vendidos

#### 3. **Resumen del Período**
- Total de Órdenes
- Ticket Promedio
- Items por Venta
- Eficiencia (margen %)

### **Lógica de Visualización**
```typescript
if (isOwner && salesByBranch.length > 1) {
  // Mostrar comparación entre sucursales
} else {
  // Mostrar análisis detallado de la tienda
}
```

## 🔢 Cálculos Financieros

### **Métricas Calculadas**

1. **Ingresos Totales**
   ```typescript
   totalRevenue = Σ(sale.total)
   ```

2. **Costos Totales**
   ```typescript
   totalCost = Σ(item.variant.cost * item.quantity)
   ```

3. **Ganancias**
   ```typescript
   totalProfit = totalRevenue - totalCost
   ```

4. **Margen de Ganancia**
   ```typescript
   profitMargin = (totalProfit / totalRevenue) * 100
   ```

5. **Por Producto**
   ```typescript
   productProfit = productRevenue - (cost * quantity)
   productMargin = (productProfit / productRevenue) * 100
   ```

6. **Tendencias**
   ```typescript
   profitChange = ((currentProfit - previousProfit) / previousProfit) * 100
   ```

## 🎨 Colores y Diseño

### **Paleta Financiera**
- **Azul** (`blue-50/600`): Ingresos
- **Rojo** (`red-50/600`): Costos/Gastos
- **Emerald** (`emerald-50/600`): Ganancias/Positivo
- **Púrpura** (`purple-50/600`): Cálculos/Margen
- **Ámbar** (`amber-50/600`): Ventas/Órdenes
- **Slate** (`slate-900/100/200`): Base/Neutro

### **Jerarquía Visual**
- `text-4xl font-black`: Ingresos principales
- `text-2xl font-black`: Métricas secundarias
- `text-xl font-black`: Valores en grid
- `text-sm/xs font-black`: Valores en listas
- `text-[10px] font-bold uppercase`: Labels

## 📈 Mejoras vs Versión Anterior

### **Antes**
- ❌ Sin información de costos
- ❌ Sin cálculo de ganancias
- ❌ Top productos por ventas (no rentabilidad)
- ❌ Sin análisis de margen
- ❌ Sin balance financiero
- ❌ Métricas operativas (stock, métodos pago, recientes)

### **Después**
- ✅ Costos calculados por producto
- ✅ Ganancias netas visibles
- ✅ Top productos por **rentabilidad**
- ✅ Margen de ganancia destacado
- ✅ Balance financiero completo
- ✅ **Enfoque 100% financiero**
- ✅ Análisis por sucursal con desglose
- ✅ Tendencias de ganancias

## 🔄 API Actualizada

### **Nuevos Campos en Response**
```typescript
{
  totalRevenue: number,
  totalCost: number,        // NUEVO
  totalProfit: number,      // NUEVO
  profitMargin: number,     // NUEVO
  topProducts: [{
    revenue: number,
    cost: number,           // NUEVO
    profit: number          // NUEVO
  }],
  salesByBranch: [{
    revenue: number,
    cost: number,           // NUEVO
    profit: number          // NUEVO
  }],
  todayVsYesterday: {
    profit: number,         // NUEVO
    profitChange: number    // NUEVO
  }
}
```

### **Cálculos en Backend**
- Incluye `variant` en queries para obtener `cost`
- Calcula costos por item: `cost * quantity`
- Calcula ganancias: `revenue - cost`
- Ordena productos por ganancia (no por ventas)
- Ordena sucursales por ganancia (no por ingresos)

## 🎯 Casos de Uso

### **Para Dueños**
- Ver rentabilidad real del negocio
- Identificar productos más rentables
- Comparar sucursales por ganancia
- Tomar decisiones basadas en margen

### **Para Gerentes**
- Monitorear costos vs ingresos
- Optimizar mix de productos
- Analizar tendencias de ganancia
- Evaluar eficiencia operativa

## 📱 Responsive
- Desktop: 3 columnas
- Tablet: 1 columna (stack)
- Mobile: Usa MobileHomeScreen

## 🚀 Características Técnicas

### **Performance**
- SWR con refresh cada 30s
- Cálculos optimizados en backend
- Lazy loading de componentes
- Memoización de valores calculados

### **Datos en Tiempo Real**
- Actualización automática
- Comparación con período anterior
- Tendencias calculadas dinámicamente

## 📝 Archivos Modificados

1. ✅ `src/components/dashboard/StoreDashboardModern.tsx` - Dashboard financiero
2. ✅ `src/app/api/dashboard/stats/route.ts` - API con cálculos de costos y ganancias
3. ✅ Colores cohesivos con el resto de la app

## 🎯 Resultado Final

Un dashboard **100% enfocado en finanzas** que muestra:
- ✅ Ganancias reales (no solo ventas)
- ✅ Costos y márgenes
- ✅ Rentabilidad por producto
- ✅ Balance financiero claro
- ✅ Análisis por sucursal con desglose
- ✅ Tendencias de ganancia
- ✅ Diseño limpio y profesional
- ✅ Colores cohesivos con la app

**Perfecto para tomar decisiones financieras informadas** 💰📊
