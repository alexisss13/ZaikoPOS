# Sistema de Navegación Móvil

## Descripción General

El sistema implementa una navegación híbrida que mantiene el sidebar en desktop y agrega un bottom navbar en móvil, siguiendo las mejores prácticas de UX móvil.

## Estructura

### Desktop (lg+)
- **Sidebar lateral**: Mantiene la navegación actual sin cambios
- **Tooltips**: Información contextual al hacer hover
- **Iconos compactos**: Diseño minimalista y eficiente

### Móvil (< lg)
- **Bottom Navigation**: 4 tabs principales fijas
- **Drawer "Más"**: Panel deslizante para opciones adicionales
- **Safe Area**: Soporte para dispositivos con notch/home indicator

## Configuración por Rol

### SUPER_ADMIN
**Bottom Nav:**
- 🏠 Inicio
- 🏢 Clientes  
- 🏪 Sucursales
- ⚙️ Más

**Drawer "Más":**
- 👥 Usuarios
- 🛡️ Auditoría

### Usuarios Regulares (OWNER, MANAGER, CASHIER)
**Bottom Nav:**
- 🏠 Inicio
- 📦 Catálogo (Productos + Inventario)
- 💰 Ventas (POS + Corte de Turnos)
- ⚙️ Más

**Drawer "Más":**
- **Inventario**: 📦 Inventario
- **Ventas**: 💰 Corte de Turnos  
- **Compras**: 🛒 Compras
- **Próximamente**: 🧮 Contabilidad, 📊 Reportes, ⚙️ Configuración

## Características Técnicas

### Responsive Design
- `lg:hidden`: Bottom nav solo visible en móvil
- `hidden lg:flex`: Sidebar solo visible en desktop
- Breakpoint en 1024px (lg)

### Accesibilidad
- Iconos semánticos con labels descriptivos
- Estados activos claramente diferenciados
- Áreas de toque optimizadas (44px mínimo)

### Performance
- Componentes lazy-loaded
- Estados locales para drawer
- Transiciones CSS optimizadas

### Safe Area Support
- `safe-area-pb`: Padding bottom para home indicator
- `env(safe-area-inset-bottom)`: Soporte nativo iOS/Android

## Escalabilidad

### Agregar Nuevas Páginas
1. **Páginas principales**: Modificar `getBottomNavItems()`
2. **Páginas secundarias**: Agregar a `getDrawerItems()`
3. **Módulos futuros**: Usar `category: 'Próximamente'`

### Ejemplo de Nuevo Módulo
```typescript
{
  href: '/dashboard/accounting',
  label: 'Contabilidad',
  icon: Calculator,
  isActive: pathname === '/dashboard/accounting',
  category: 'Finanzas'
}
```

## Archivos Modificados

- `src/components/layout/MobileBottomNav.tsx` - Componente principal
- `src/app/(dashboard)/layout.tsx` - Integración al layout
- `src/app/globals.css` - Estilos safe area y scrollbar
- `docs/mobile-navigation.md` - Esta documentación

## Próximas Mejoras

- [ ] Badges de notificación en tabs
- [ ] Animaciones de transición entre páginas
- [ ] Gestos de swipe para navegación
- [ ] Modo oscuro para bottom nav
- [ ] Personalización por usuario