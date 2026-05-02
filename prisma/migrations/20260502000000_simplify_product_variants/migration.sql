-- Migración: Simplificar variantes de productos
-- Los campos de precio, costo, minStock, etc. se mueven a Product
-- Las variantes solo mantienen atributos distintivos (talla, color, etc.)

-- 1. Agregar nuevos campos a Product
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "cost" DECIMAL(12,2) NOT NULL DEFAULT 0;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "minStock" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "sku" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "barcode" TEXT;

-- 2. Migrar datos de la primera variante al producto (para productos existentes)
UPDATE "Product" p
SET 
  "cost" = COALESCE((
    SELECT v."cost" 
    FROM "ProductVariant" v 
    WHERE v."productId" = p.id 
    ORDER BY v."createdAt" ASC 
    LIMIT 1
  ), 0),
  "minStock" = COALESCE((
    SELECT v."minStock" 
    FROM "ProductVariant" v 
    WHERE v."productId" = p.id 
    ORDER BY v."createdAt" ASC 
    LIMIT 1
  ), 5),
  "sku" = (
    SELECT v."sku" 
    FROM "ProductVariant" v 
    WHERE v."productId" = p.id 
    ORDER BY v."createdAt" ASC 
    LIMIT 1
  ),
  "barcode" = (
    SELECT v."barcode" 
    FROM "ProductVariant" v 
    WHERE v."productId" = p.id 
    ORDER BY v."createdAt" ASC 
    LIMIT 1
  ),
  "wholesalePrice" = COALESCE((
    SELECT v."wholesalePrice" 
    FROM "ProductVariant" v 
    WHERE v."productId" = p.id 
    ORDER BY v."createdAt" ASC 
    LIMIT 1
  ), p."wholesalePrice"),
  "wholesaleMinCount" = COALESCE((
    SELECT v."wholesaleMinCount" 
    FROM "ProductVariant" v 
    WHERE v."productId" = p.id 
    ORDER BY v."createdAt" ASC 
    LIMIT 1
  ), p."wholesaleMinCount");

-- 3. Crear índices para los nuevos campos
CREATE INDEX IF NOT EXISTS "Product_barcode_idx" ON "Product"("barcode");
CREATE INDEX IF NOT EXISTS "Product_sku_idx" ON "Product"("sku");
CREATE INDEX IF NOT EXISTS "ProductVariant_productId_idx" ON "ProductVariant"("productId");
CREATE INDEX IF NOT EXISTS "ProductVariant_barcode_idx" ON "ProductVariant"("barcode");

-- 4. Eliminar campos de ProductVariant (ahora están en Product)
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "price";
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "cost";
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "minStock";
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "wholesalePrice";
ALTER TABLE "ProductVariant" DROP COLUMN IF EXISTS "wholesaleMinCount";

-- Nota: Los campos sku y barcode se mantienen en ProductVariant para variantes específicas
-- pero el producto también tiene su propio sku/barcode principal
