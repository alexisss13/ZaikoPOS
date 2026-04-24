# 📱 Diseño Mobile Home Screen

## 🎯 Concepto

El Home Screen móvil está diseñado como una **app nativa**, priorizando:
- ✅ Acceso rápido a funciones principales
- ✅ Información resumida y visual
- ✅ Navegación intuitiva con un toque
- ✅ Diseño limpio y moderno

## 📐 Estructura

### 1. **Header Personalizado**
```
¡Buenos días, Juan! 👋
📅 lunes, 24 de abril
```
- Saludo dinámico según hora del día
- Nombre del usuario
- Fecha actual

### 2. **Stats Cards (2x2 Grid)**

#### Card 1: Ventas de Hoy (Destacada)
- Fondo: Gradiente verde (emerald-500 → emerald-600)
- Icono: TrendUpIcon
- Datos: Monto total + número de transacciones
- Estilo: Sombra elevada, texto blanco

#### Card 2: Caja Actual (Destacada)
- Fondo: Gradiente azul (blue-500 → blue-600)
- Icono: Money01Icon
- Datos: Monto en caja + estado (Abierta/Cerrada)
- Estilo: Sombra elevada, texto blanco

#### Card 3: Stock Bajo (Alerta)
- Fondo: Blanco con borde amber
- Icono: AlertCircleIcon (amber)
- Datos: Número de productos con stock bajo
- Estilo: Borde de alerta

#### Card 4: Reportes (Acceso)
- Fondo: Blanco con borde gris
- Icono: ChartLineData01Icon
- Acción: Link al dashboard completo
- Estilo: Clickeable con flecha

### 3. **Quick Actions (2x2 Grid)**

Accesos directos a las funciones principales:

| Nueva Venta | Productos |
|-------------|-----------|
| 🛒 Emerald | 📦 Blue |
| POS | Catálogo |

| Inventario | Corte de Caja |
|------------|---------------|
| 🏪 Purple | 💰 Amber |
| Stock | Turnos |

Cada card incluye:
- Icono grande en círculo de color
- Título en negrita
- Descripción breve
- Efecto `active:scale-95` al tocar

### 4. **Alertas/Tips (Condicional)**

Solo se muestra si hay productos con stock bajo:
```
⚠️ Atención requerida
Tienes 5 productos con stock bajo. Ver ahora →
```
- Fondo: amber-50
- Borde: amber-200
- Link directo a inventario

## 🎨 Paleta de Colores

```css
/* Ventas */
emerald-500 → emerald-600 (Gradiente)
emerald-50 (Background icon)
emerald-600 (Text)

/* Caja */
blue-500 → blue-600 (Gradiente)
blue-50 (Background icon)
blue-600 (Text)

/* Inventario */
purple-500 (Solid)
purple-50 (Background icon)
purple-600 (Text)

/* Corte de Caja */
amber-500 (Solid)
amber-50 (Background icon)
amber-600 (Text)

/* Alertas */
amber-50 (Background)
amber-200 (Border)
amber-600 (Icon)
amber-900 (Title)
amber-700 (Text)
```

## 📊 API Endpoint

El componente consume `/api/dashboard/stats`:

```typescript
interface DashboardStats {
  todaySales: number;          // Ventas del día actual
  todayTransactions: number;   // Número de transacciones
  lowStockCount: number;       // Productos con stock bajo
  currentCash: number;         // Efectivo en caja
  hasCashOpen: boolean;        // Estado de la caja
}
```

## 🔄 Comportamiento

### Carga Inicial
1. Muestra skeleton (4 cards animadas)
2. Fetch a `/api/dashboard/stats`
3. Renderiza datos reales

### Interacciones
- **Tap en Quick Action**: Navega a la página correspondiente
- **Tap en "Ver Dashboard"**: Muestra dashboard completo
- **Tap en alerta**: Navega a inventario

### Optimizaciones
- ✅ `WebkitTapHighlightColor: transparent` - Sin flash azul
- ✅ `active:scale-95` - Feedback táctil
- ✅ Lazy loading de stats
- ✅ Skeleton mientras carga

## 📱 Responsive

### Móvil (< 1024px)
- Muestra `MobileHomeScreen`
- Grid 2x2 para stats
- Grid 2x2 para quick actions
- Padding: 16px (px-4)

### Desktop (≥ 1024px)
- Muestra dashboard tradicional
- Gráficos y tablas completas
- Layout de 2-3 columnas

## 🚀 Ventajas vs Dashboard Tradicional

| Aspecto | Dashboard Desktop | Mobile Home |
|---------|-------------------|-------------|
| Carga | ~2s (gráficos) | ~0.5s (cards) |
| Interacción | Scroll + clicks | Taps directos |
| Información | Detallada | Resumida |
| Navegación | Sidebar | Bottom nav |
| Objetivo | Análisis | Acción rápida |

## 🎯 Casos de Uso

### Cajero
1. Abre app
2. Ve ventas del día
3. Tap en "Nueva Venta"
4. Inicia transacción

### Gerente
1. Abre app
2. Ve stats resumidas
3. Tap en "Reportes" para análisis detallado
4. O tap en "Inventario" si hay alerta

### Dueño
1. Abre app
2. Revisa ventas y caja
3. Tap en cualquier quick action según necesidad

## 📝 Mejoras Futuras

### 1. Pull-to-Refresh
```typescript
const handleRefresh = async () => {
  setRefreshing(true);
  await fetchStats();
  setRefreshing(false);
};
```

### 2. Notificaciones Push
- Stock bajo crítico
- Ventas objetivo alcanzado
- Caja sin cerrar

### 3. Widgets Personalizables
- Permitir al usuario elegir qué stats ver
- Reordenar quick actions
- Ocultar/mostrar secciones

### 4. Gráfico Mini
- Ventas de la semana (sparkline)
- Productos más vendidos (top 3)

### 5. Modo Offline
- Cachear última data
- Mostrar indicador "Sin conexión"
- Sincronizar al reconectar
