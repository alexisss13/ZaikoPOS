import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

// Cargar variables de entorno desde .env
dotenv.config();

// Verificar que DATABASE_URL esté disponible
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL no está definida en el archivo .env');
}

// Crear conexión usando el mismo patrón que src/lib/prisma.ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function addIndexes() {
  console.log('🚀 Agregando índices para optimizar performance...\n');

  try {
    // Índice para filtrar productos por businessId y active
    console.log('📊 Creando índice: idx_product_business_active...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_product_business_active" 
      ON "Product"("businessId", "active")
    `);
    console.log('✅ Índice idx_product_business_active creado\n');

    // Índice para ordenar por createdAt
    console.log('📊 Creando índice: idx_product_created...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_product_created" 
      ON "Product"("createdAt" DESC)
    `);
    console.log('✅ Índice idx_product_created creado\n');

    // Índice para filtrar variantes activas
    console.log('📊 Creando índice: idx_variant_active...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_variant_active" 
      ON "ProductVariant"("productId", "active")
    `);
    console.log('✅ Índice idx_variant_active creado\n');

    // Índice para stock por branch
    console.log('📊 Creando índice: idx_stock_branch_variant...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_stock_branch_variant" 
      ON "Stock"("branchId", "variantId")
    `);
    console.log('✅ Índice idx_stock_branch_variant creado\n');

    // Índice para categorías por ecommerceCode
    console.log('📊 Creando índice: idx_category_ecommerce...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_category_ecommerce" 
      ON "Category"("ecommerceCode")
    `);
    console.log('✅ Índice idx_category_ecommerce creado\n');

    // Índice compuesto para productos por categoría y activos
    console.log('📊 Creando índice: idx_product_category_active...');
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "idx_product_category_active" 
      ON "Product"("categoryId", "active")
    `);
    console.log('✅ Índice idx_product_category_active creado\n');

    console.log('🎉 ¡Todos los índices fueron creados exitosamente!');
    console.log('\n📈 Beneficios esperados:');
    console.log('   - Queries 10-100x más rápidas');
    console.log('   - API de productos: 3-5s → 200-500ms');
    console.log('   - Mejor experiencia en móvil\n');

  } catch (error) {
    console.error('❌ Error al crear índices:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addIndexes()
  .then(() => {
    console.log('✨ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
