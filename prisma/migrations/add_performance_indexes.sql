-- Agregar índices para mejorar performance de queries

-- Índice para filtrar productos por businessId y active
CREATE INDEX IF NOT EXISTS "idx_product_business_active" ON "Product"("businessId", "active");

-- Índice para ordenar por createdAt
CREATE INDEX IF NOT EXISTS "idx_product_created" ON "Product"("createdAt" DESC);

-- Índice para filtrar variantes activas
CREATE INDEX IF NOT EXISTS "idx_variant_active" ON "Variant"("productId", "active");

-- Índice para stock por branch
CREATE INDEX IF NOT EXISTS "idx_stock_branch_variant" ON "Stock"("branchId", "variantId");

-- Índice para categorías por ecommerceCode
CREATE INDEX IF NOT EXISTS "idx_category_ecommerce" ON "Category"("ecommerceCode");

-- Índice compuesto para productos por categoría y activos
CREATE INDEX IF NOT EXISTS "idx_product_category_active" ON "Product"("categoryId", "active");
