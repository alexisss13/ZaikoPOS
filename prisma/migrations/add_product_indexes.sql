-- Add performance indexes for Product table
-- These indexes will dramatically speed up product queries

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS "Product_categoryId_idx" ON "Product"("categoryId");

-- Index for filtering active products
CREATE INDEX IF NOT EXISTS "Product_active_idx" ON "Product"("active");

-- Composite index for common query patterns (business + active + category)
CREATE INDEX IF NOT EXISTS "Product_businessId_active_categoryId_idx" ON "Product"("businessId", "active", "categoryId");

-- Index for supplier filtering
CREATE INDEX IF NOT EXISTS "Product_supplierId_idx" ON "Product"("supplierId");

-- Index for variant barcode lookups (already unique, but explicit index helps)
CREATE INDEX IF NOT EXISTS "ProductVariant_barcode_idx" ON "ProductVariant"("barcode") WHERE "barcode" IS NOT NULL;

-- Index for stock queries by branch
CREATE INDEX IF NOT EXISTS "Stock_branchId_quantity_idx" ON "Stock"("branchId", "quantity");
