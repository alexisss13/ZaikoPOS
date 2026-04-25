# 📱 Plan de Modernización UI Móvil

## 🎯 Objetivo
Modernizar todas las páginas móviles del dashboard con el mismo estilo de app nativa usado en Contabilidad y Dashboard.

---

## ✅ Páginas Completadas

### 1. Dashboard (Home) ✅
- **Archivo**: `src/components/dashboard/MobileHomeScreen.tsx`
- **Estado**: Completado
- **Características**:
  - Header con gradiente oscuro
  - Stats cards con backdrop blur
  - Estado de caja con gradiente dinámico
  - Acciones rápidas con iconos grandes

### 2. Contabilidad ✅
- **Archivo**: `src/components/accounting/AccountingMobile.tsx`
- **Estado**: Completado
- **Características**:
  - Header con gradiente oscuro
  - 4 vistas navegables
  - Stats cards translúcidas
  - Búsqueda y filtros

### 3. POS (Punto de Venta) ✅
- **Archivo**: `src/components/pos/mobile/MobilePOSHeader.tsx`
- **Estado**: Completado
- **Características**:
  - Header con gradiente oscuro
  - Stats cards (Productos en carrito, Total a cobrar)
  - Barra de búsqueda mejorada
  - Botones de acción rápida (4 columnas)
  - Optimizaciones de rendimiento

### 4. Productos ⏳
- **Archivo**: `src/app/(dashboard)/dashboard/products/page.tsx`
- **Estado**: Tiene buen diseño, solo falta header con gradiente
- **Características actuales**:
  - ProductCard expandible optimizado
  - Pull-to-refresh
  - Filtros avanzados
  - Búsqueda en tiempo real

---

## ⏳ Páginas Pendientes (Por Prioridad)

### 🔥 Prioridad Alta

#### 4. POS (Punto de Venta) ✅
- **Archivo**: `src/components/pos/mobile/MobilePOSHeader.tsx`
- **Estado**: ✅ Completado
- **Características implementadas**:
  - Header con gradiente oscuro
  - Stats cards (Productos en carrito, Total a cobrar)
  - Barra de búsqueda mejorada
  - Botones de acción rápida en grid 4x1
  - Optimizaciones de rendimiento

#### 5. Inventario
- **Archivo**: `src/app/(dashboard)/dashboard/inventory/page.tsx`
- **Estado**: Tiene lógica móvil pero diseño antiguo
- **Plan**:
  - Crear `src/components/inventory/InventoryMobile.tsx`
  - Header con gradiente
  - Tabs modernos (Stock, Movimientos, Traslados)
  - Cards de productos con stock
  - Filtros en sheet

#### 6. Corte de Turnos (Cash Sessions)
- **Archivo**: `src/app/(dashboard)/dashboard/cash-sessions/page.tsx`
- **Estado**: Necesita modernización
- **Plan**:
  - Crear `src/components/cash-sessions/CashSessionsMobile.tsx`
  - Header con gradiente
  - Timeline de sesiones
  - Cards de sesión con detalles
  - Botón de abrir/cerrar caja destacado

### 🟡 Prioridad Media

#### 7. Compras
- **Archivo**: `src/app/(dashboard)/dashboard/purchases/page.tsx`
- **Estado**: Necesita modernización
- **Plan**:
  - Crear `src/components/purchases/PurchasesMobile.tsx`
  - Header con gradiente
  - Lista de órdenes de compra
  - Estados con badges de color
  - Filtros por estado

#### 8. Sucursales (Branches)
- **Archivo**: `src/app/(dashboard)/dashboard/branches/page.tsx`
- **Estado**: Necesita modernización
- **Plan**:
  - Crear `src/components/branches/BranchesMobile.tsx`
  - Header con gradiente
  - Cards de sucursales con logos
  - Información de contacto
  - Botón de crear sucursal

### 🟢 Prioridad Baja

#### 9. Usuarios
- **Archivo**: `src/app/(dashboard)/dashboard/users/page.tsx`
- **Estado**: Necesita modernización
- **Plan**:
  - Crear `src/components/users/UsersMobile.tsx`
  - Header con gradiente
  - Lista de usuarios con avatares
  - Roles con badges de color
  - Filtros por rol

#### 10. Clientes (Businesses)
- **Archivo**: `src/app/(dashboard)/dashboard/businesses/page.tsx`
- **Estado**: Solo para SUPER_ADMIN
- **Plan**:
  - Crear `src/components/businesses/BusinessesMobile.tsx`
  - Header con gradiente
  - Lista de negocios
  - Stats por negocio

#### 11. Auditoría
- **Archivo**: `src/app/(dashboard)/dashboard/audit/page.tsx`
- **Estado**: Solo para SUPER_ADMIN
- **Plan**:
  - Crear `src/components/audit/AuditMobile.tsx`
  - Header con gradiente
  - Timeline de eventos
  - Filtros por acción/usuario

---

## 🎨 Estándar de Diseño

### Header con Gradiente
```tsx
<div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 pt-6 pb-8 rounded-b-[2rem] shadow-lg">
  <div className="flex items-center justify-between mb-6">
    <div>
      <h1 className="text-2xl font-bold text-white mb-1">Título</h1>
      <p className="text-sm text-slate-300">Subtítulo</p>
    </div>
    <button className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white">
      <Icon className="w-5 h-5" />
    </button>
  </div>
  
  {/* Stats cards con backdrop blur */}
  <div className="grid grid-cols-2 gap-3">
    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
      {/* Contenido */}
    </div>
  </div>
</div>
```

### Content Area
```tsx
<div className="px-4 py-6 space-y-6">
  {/* Contenido */}
</div>
```

### Cards
```tsx
<div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-[0.97] transition-transform">
  {/* Contenido */}
</div>
```

### Botones Principales
```tsx
<button className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 shadow-lg active:scale-[0.97] transition-transform">
  {/* Contenido */}
</button>
```

---

## 📋 Checklist por Página

Para cada página modernizada:

- [ ] Crear componente Mobile separado
- [ ] Header con gradiente oscuro
- [ ] Stats cards con backdrop blur (si aplica)
- [ ] Búsqueda con SearchBar
- [ ] Filtros en Sheet
- [ ] Cards con bordes redondeados (rounded-2xl)
- [ ] Animaciones suaves (active:scale)
- [ ] Optimizaciones de rendimiento (transform: translateZ(0))
- [ ] Pull-to-refresh (si aplica)
- [ ] Loading states con skeleton
- [ ] Empty states con ilustración
- [ ] Build exitoso sin errores

---

## 🚀 Orden de Implementación

### Fase 1: Páginas Críticas (Hoy)
1. ✅ Dashboard
2. ✅ Contabilidad
3. ⏳ Productos (solo header)
4. ✅ POS
5. ⏳ Inventario

### Fase 2: Páginas Importantes (Siguiente)
6. ⏳ Cash Sessions
7. ⏳ Compras

### Fase 3: Páginas Administrativas (Después)
8. ⏳ Sucursales
9. ⏳ Usuarios
10. ⏳ Clientes
11. ⏳ Auditoría

---

## 📝 Notas de Implementación

### Estructura de Archivos
```
src/components/
├── dashboard/
│   └── MobileHomeScreen.tsx ✅
├── accounting/
│   └── AccountingMobile.tsx ✅
├── pos/
│   └── POSMobile.tsx ⏳
├── inventory/
│   └── InventoryMobile.tsx ⏳
├── cash-sessions/
│   └── CashSessionsMobile.tsx ⏳
├── purchases/
│   └── PurchasesMobile.tsx ⏳
├── branches/
│   └── BranchesMobile.tsx ⏳
├── users/
│   └── UsersMobile.tsx ⏳
├── businesses/
│   └── BusinessesMobile.tsx ⏳
└── audit/
    └── AuditMobile.tsx ⏳
```

### Patrón de Uso en Pages
```tsx
import { useResponsive } from '@/hooks/useResponsive';
import dynamic from 'next/dynamic';

const DesktopComponent = dynamic(() => import('@/components/module/ModuleDesktop'));
const MobileComponent = dynamic(() => import('@/components/module/ModuleMobile'));

export default function ModulePage() {
  const { isMobile } = useResponsive();
  
  return isMobile ? <MobileComponent /> : <DesktopComponent />;
}
```

---

**Fecha de Creación**: 25 de abril de 2026  
**Estado**: En Progreso  
**Progreso**: 4/11 páginas completadas (36%)
