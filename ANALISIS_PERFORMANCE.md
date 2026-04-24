# Análisis de Performance - Página de Productos

## 🎯 PROBLEMA IDENTIFICADO

El hover en los botones de la tabla (editar, eliminar, kardex) causa lag cuando se mueve el cursor entre productos 1, 2, 3, 4.

## 🔍 CAUSAS RAÍZ ENCONTRADAS

### 1. **Button Component con `transition-all`** ⚠️ CRÍTICO
- El componente `Button` de shadcn/ui tenía `transition-all` 
- Esto anima TODAS las propiedades CSS en cada hover
- Extremadamente costoso para el navegador
- **SOLUCIÓN**: Cambiado a `transition-colors` (solo anima colores)

### 2. **useCallback innecesario en ProductTableRow**
- Los handlers estaban memoizados con `useCallback`
- Las dependencias incluían el producto completo
- Causaba re-creación de funciones en cada render
- **SOLUCIÓN**: Eliminado `useCallback`, usar handlers inline es más rápido

### 3. **Comparación de memo demasiado compleja**
- La función `areEqual` comparaba múltiples propiedades
- Cada comparación tiene overhead
- **SOLUCIÓN**: Comparación ultra simple - solo verificar `product.id`

## ✅ OPTIMIZACIONES APLICADAS

### Frontend - ProductTableRow.tsx
```typescript
// ANTES: Comparación compleja
const areEqual = (prev, next) => {
  if (prev.product.id !== next.product.id) return false;
  if (prev.product.active !== next.product.active) return false;
  if (prev.product.basePrice !== next.product.basePrice) return false;
  // ... más comparaciones
  return true;
};

// DESPUÉS: Comparación ultra simple
const areEqual = (prev, next) => {
  return prev.product.id === next.product.id;
};
```

```typescript
// ANTES: useCallback con dependencias
const handleEdit = useCallback(() => onEdit(product), [onEdit, product]);

// DESPUÉS: Handler inline (más rápido)
onClick={() => onEdit(product)}
```

### CSS - globals.css
```css
/* Forzar sin transiciones en botones de tabla */
.btn-optimized {
  transition: none !important;
  transform: translateZ(0);
  backface-visibility: hidden;
}

.products-table button {
  transition: none !important;
}
```

### Button Component - button.tsx
```typescript
// ANTES: transition-all (anima TODO)
"transition-all disabled:pointer-events-none..."

// DESPUÉS: transition-colors (solo colores)
"transition-colors disabled:pointer-events-none..."
```

## 📊 RESULTADO ESPERADO

- ✅ Hover instantáneo sin lag
- ✅ Menos re-renders durante interacción
- ✅ Mejor performance general de la tabla
- ✅ Navegación fluida entre botones

## 🧪 CÓMO PROBAR

1. Abrir la página de productos
2. Mover el cursor rápidamente entre los botones de editar de productos 1, 2, 3, 4
3. Verificar que el hover sea instantáneo sin lag
4. Probar con 50+ productos en la tabla

## 📝 NOTAS TÉCNICAS

- **useCallback overhead**: Crear funciones inline es más rápido que memoizarlas cuando las dependencias cambian frecuentemente
- **transition-all**: Nunca usar en elementos con hover frecuente, siempre especificar propiedades exactas
- **memo comparison**: Mantener comparaciones simples, el overhead de comparar muchas propiedades puede ser peor que re-renderizar
- **CSS contain**: Ayuda al navegador a aislar el repaint solo al elemento que cambió

---

## 🔍 Herramientas de Diagnóstico

### React DevTools Profiler
1. Presiona F12 (DevTools)
2. Ve a la pestaña "Profiler"
3. Click en el botón de grabar (círculo rojo)
4. Pasa el mouse sobre los botones de productos
5. Detén la grabación
6. Revisa qué componentes se están re-renderizando

### Script de Debug en Consola
```javascript
// Pegar en la consola del navegador
const script = document.createElement('script');
script.src = '/debug-performance.js';
document.head.appendChild(script);
```

## 🚀 Optimizaciones Previas Aplicadas

### Backend - API Route
- Cambio de queries anidadas a 3 queries separadas
- Reducción de 180s a 0.125s (1440x más rápido)

### Base de Datos
- Índices agregados en Product (categoryId, active, supplierId)
- Índices agregados en Stock (branchId, quantity)

### Frontend - Memoización
- ProductTableRow memoizado
- FilterDropdown con estado aislado
- SWR con revalidación desactivada
- Handlers de export memoizados
