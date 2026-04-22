# SOLUCIÓN: Carga Lenta al Entrar a Productos

## Problema Identificado

Al cambiar de una página a `/dashboard/products` en móvil, demora **varios segundos** antes de mostrar contenido.

### Causa Raíz

1. **4 Fetches Bloqueantes Simultáneos**
   - `/api/products`
   - `/api/branches`
   - `/api/categories`
   - `/api/suppliers`

2. **Sin Prefetching**
   - Los datos se cargan solo cuando entras a la página
   - No hay cache previa

3. **Renderizado Bloqueado**
   - React espera a que todos los datos estén listos
   - No hay renderizado progresivo

## Soluciones Implementadas

### 1. ⚡ Prefetching en Layout

**Estrategia:** Cargar datos críticos en background desde el layout.

```tsx
// src/app/(dashboard)/layout.tsx
export default function DashboardLayout({ children }) {
  // Prefetch datos críticos
  useSWR('/api/products', fetcher, { 
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  });
  useSWR('/api/branches', fetcher, { 
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
  useSWR('/api/categories', fetcher, { 
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  });
  
  return <>{children}</>;
}
```

**Beneficio:** Los datos ya están en cache cuando entras a productos.

### 2. 🎯 Carga Progresiva

**Estrategia:** Cargar productos primero, lo demás después.

```tsx
// Cargar productos primero (crítico)
const { data: products, isLoading } = useSWR('/api/products', fetcher);

// Cargar branches solo después de tener productos
const { data: branches } = useSWR(
  products ? '/api/branches' : null,
  fetcher
);

// Cargar categories y suppliers después
const { data: categories } = useSWR(
  products ? '/api/categories' : null,
  fetcher
);
```

**Beneficio:** La página se renderiza apenas llegan los productos.

### 3. 🚀 Skeleton Inmediato

**Estrategia:** Mostrar skeleton sin esperar nada.

```tsx
if (isMobile && isLoading) {
  return <ProductsLoadingSkeleton />;
}
```

**Beneficio:** Feedback visual instantáneo.

### 4. 📦 Optimización de SWR

**Estrategia:** Evitar revalidaciones innecesarias.

```tsx
useSWR('/api/products', fetcher, {
  revalidateOnFocus: false,      // No revalidar al volver
  revalidateOnReconnect: false,  // No revalidar al reconectar
  dedupingInterval: 5000,        // Deduplicar por 5s
});
```

**Beneficio:** Usa cache cuando es posible.

## Flujo de Carga Optimizado

### Antes (Lento)
```
Usuario hace click → Espera 3-5s → Todo carga junto → Render
```

### Después (Rápido)
```
Layout prefetch (background) → Usuario hace click → 
Skeleton (0ms) → Productos (300ms) → Branches (100ms) → 
Categories (100ms) → Render completo
```

## Métricas Esperadas

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Tiempo hasta skeleton | 0ms | 0ms | ✅ |
| Tiempo hasta productos | 3-5s | 300ms | 90% |
| Tiempo total | 3-5s | 500ms | 85% |
| Percepción de velocidad | Lento | Rápido | ✅ |

## Optimizaciones Adicionales (Si Necesario)

### 1. Server-Side Rendering (SSR)

```tsx
// app/(dashboard)/products/page.tsx
export async function generateStaticParams() {
  // Pre-renderizar en build time
}
```

### 2. Streaming SSR

```tsx
import { Suspense } from 'react';

<Suspense fallback={<ProductsLoadingSkeleton />}>
  <ProductsList />
</Suspense>
```

### 3. API Route Optimization

```tsx
// app/api/products/route.ts
export const dynamic = 'force-dynamic';
export const revalidate = 60; // Cache por 60s
```

### 4. Database Query Optimization

```sql
-- Agregar índices
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_products_branch ON products(branchOwnerId);

-- Usar select específico
SELECT id, title, basePrice, active FROM products;
```

### 5. Response Compression

```tsx
// next.config.ts
module.exports = {
  compress: true,
  experimental: {
    optimizeCss: true,
  },
};
```

## Checklist de Verificación

### Primera Carga (Sin Cache)
- [ ] Skeleton aparece en <50ms
- [ ] Productos cargan en <500ms
- [ ] Página completa en <1s
- [ ] Sin flash de contenido

### Segunda Carga (Con Cache)
- [ ] Skeleton aparece en <50ms
- [ ] Productos desde cache en <100ms
- [ ] Página completa en <200ms
- [ ] Transición suave

### Navegación
- [ ] Click responde inmediatamente
- [ ] Skeleton aparece sin delay
- [ ] Datos cargan progresivamente
- [ ] Sin bloqueo de UI

## Debugging

### Si Aún Es Lento

1. **Verificar Network Tab**
   ```
   - ¿Cuánto tarda /api/products?
   - ¿Hay requests duplicados?
   - ¿El tamaño de response es grande?
   ```

2. **Verificar SWR Cache**
   ```tsx
   import { useSWRConfig } from 'swr';
   const { cache } = useSWRConfig();
   console.log(cache); // Ver qué está en cache
   ```

3. **Verificar Performance Tab**
   ```
   - ¿Hay long tasks >50ms?
   - ¿El parsing de JSON es lento?
   - ¿Hay re-renders innecesarios?
   ```

4. **Verificar API Response Time**
   ```bash
   curl -w "@curl-format.txt" -o /dev/null -s "http://localhost:3000/api/products"
   ```

## Próximos Pasos

Si después de estas optimizaciones aún es lento:

1. **Implementar Pagination**
   - Cargar solo 20 productos inicialmente
   - Infinite scroll para el resto

2. **Implementar Virtual Scrolling**
   - Renderizar solo items visibles
   - Usar react-window

3. **Implementar Service Worker**
   - Cache agresivo de datos
   - Offline support

4. **Optimizar Backend**
   - Agregar Redis cache
   - Optimizar queries SQL
   - Comprimir responses

## Resultado Esperado

Con todas estas optimizaciones:
- ✅ Skeleton aparece instantáneamente
- ✅ Productos cargan en <500ms (primera vez)
- ✅ Productos cargan en <100ms (con cache)
- ✅ Navegación se siente fluida
- ✅ Sin lag perceptible
