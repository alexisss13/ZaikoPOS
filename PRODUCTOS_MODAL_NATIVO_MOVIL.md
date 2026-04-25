# Formulario Nativo Móvil - Productos

## ✅ COMPLETADO

### Objetivo
Convertir el modal de productos en una página nativa de pantalla completa para móvil, siguiendo el patrón de app nativa como en inventario.

## Implementación

### Nuevo Componente: ProductMobileForm

**Archivo**: `src/components/dashboard/products/ProductMobileForm.tsx`

#### Estructura de 3 Pasos:

**Paso 1: Información Básica**
- Nombre del producto *
- Catálogo (Compartido / Sucursales)
- Categoría *
- Proveedor (opcional)

**Paso 2: Precios**
- Precio de venta *
- Costo (opcional)
- Precio por mayor (opcional)
- Cantidad mínima para precio por mayor
- Stock mínimo

**Paso 3: Códigos e Imágenes**
- SKU (opcional)
- Código de barras (opcional)
- Imágenes (opcional)
  - Upload múltiple
  - Preview con opción de eliminar

### Características

#### Header Dinámico:
```tsx
[← Atrás] [Nuevo/Editar Producto - Paso X de 3] [Guardar]
```
- Botón atrás: Vuelve al paso anterior o cierra
- Título dinámico según modo (crear/editar)
- Botón guardar: Solo aparece en paso 3

#### Progress Bar:
- Barra visual que muestra el progreso (33%, 66%, 100%)
- Transición suave entre pasos

#### Validaciones:
- **Paso 1**: Requiere nombre y categoría para continuar
- **Paso 2**: Requiere precio de venta para continuar
- **Paso 3**: Todos los campos opcionales, botón guardar siempre disponible

#### Upload de Imágenes:
- Soporte para múltiples imágenes
- Preview en grid 3 columnas
- Botón para eliminar cada imagen
- Indicador de carga durante upload
- Integración con `/api/upload`

#### Catálogo Dinámico:
- Botones para seleccionar catálogo (Compartido/Sucursales)
- Filtra categorías según catálogo seleccionado
- Diseño responsive en grid

### Integración en Página de Productos

**Archivo**: `src/app/(dashboard)/dashboard/products/page.tsx`

#### Lazy Loading:
```tsx
const ProductMobileForm = dynamic(
  () => import('@/components/dashboard/products/ProductMobileForm')
    .then(m => ({ default: m.ProductMobileForm })), 
  { ssr: false }
);
```

#### Renderizado Condicional:
```tsx
{/* Móvil: Formulario nativo */}
{isModalOpen && isMobile && (
  <ProductMobileForm
    onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }}
    onSuccess={() => { mutate(); setIsModalOpen(false); setSelectedProduct(null); }}
    productToEdit={selectedProduct}
    categories={categories}
    suppliers={suppliers}
    branches={branches}
  />
)}

{/* Desktop: Modal tradicional */}
{isModalOpen && !isMobile && (
  <ProductModal ... />
)}
```

## Flujo de Usuario

### Crear Producto:
```
1. Usuario toca botón "+" en header
2. Se abre ProductMobileForm en pantalla completa
3. Paso 1: Completa nombre, catálogo, categoría
4. Toca "Continuar"
5. Paso 2: Ingresa precios
6. Toca "Continuar"
7. Paso 3: Agrega códigos e imágenes (opcional)
8. Toca "Guardar" en header
9. Se crea el producto y cierra el formulario
```

### Editar Producto:
```
1. Usuario toca producto en lista
2. Se abre ProductMobileForm con datos precargados
3. Navega por los 3 pasos editando campos
4. Toca "Guardar" en paso 3
5. Se actualiza el producto y cierra el formulario
```

## Ventajas del Diseño Nativo

### UX Móvil:
- ✅ Pantalla completa sin distracciones
- ✅ Navegación por pasos clara
- ✅ Progress bar visual
- ✅ Botón guardar siempre visible en header
- ✅ Validaciones por paso
- ✅ Transiciones suaves

### Performance:
- ✅ Lazy loading (solo se carga en móvil cuando se necesita)
- ✅ No carga el modal desktop en móvil
- ✅ Componente independiente y optimizado

### Consistencia:
- ✅ Mismo patrón que inventario móvil
- ✅ Mismos estilos y componentes UI
- ✅ Misma experiencia en toda la app

## Campos del Formulario

### Requeridos:
- `title`: Nombre del producto
- `categoryId`: Categoría
- `basePrice`: Precio de venta

### Opcionales:
- `supplierId`: Proveedor
- `cost`: Costo
- `wholesalePrice`: Precio por mayor
- `wholesaleMinCount`: Cantidad mínima para precio por mayor
- `minStock`: Stock mínimo (default: 5)
- `sku`: SKU
- `barcode`: Código de barras
- `images`: Array de URLs de imágenes

## API Integration

### Crear Producto:
```typescript
POST /api/products
Body: {
  title, categoryId, supplierId, basePrice, cost,
  wholesalePrice, wholesaleMinCount, minStock,
  sku, barcode, images, active
}
```

### Editar Producto:
```typescript
PUT /api/products/[id]
Body: { ...mismo que crear }
```

### Upload de Imágenes:
```typescript
POST /api/upload
Body: FormData con archivo
Response: { url: string }
```

## Archivos Modificados

1. ✅ **Nuevo**: `src/components/dashboard/products/ProductMobileForm.tsx`
   - Formulario nativo de 3 pasos
   - Upload de imágenes
   - Validaciones por paso

2. ✅ `src/app/(dashboard)/dashboard/products/page.tsx`
   - Importado ProductMobileForm con lazy loading
   - Renderizado condicional según isMobile
   - Mantiene ProductModal para desktop

## Build Exitoso ✅

```bash
npm run build
✓ Compiled successfully in 8.8s
✓ Finished TypeScript in 22.4s
```

## Próximos Pasos (Opcional)

Los siguientes modales también podrían convertirse a páginas nativas:
- [ ] CategoryModal → CategoryMobileForm
- [ ] ImportProductsModal → ImportMobileForm
- [ ] BarcodeGeneratorModal → BarcodeMobileForm

Por ahora, estos modales siguen funcionando como modales tradicionales en móvil, pero el más importante (ProductModal) ya está convertido.

## Resultado Final

El formulario de productos en móvil ahora:
- ✅ Se ve como una app nativa
- ✅ Tiene navegación por pasos clara
- ✅ Botón guardar visible en header
- ✅ Upload de imágenes funcional
- ✅ Validaciones por paso
- ✅ Experiencia fluida y profesional
- ✅ Consistente con el resto de la app

La experiencia móvil de productos ahora es tan buena como la de inventario.
