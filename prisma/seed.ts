// 1. Cargar variables de entorno ANTES de cualquier otra importación
import "dotenv/config";
import { Role } from '@prisma/client';
import { hash } from 'bcryptjs';
// 2. Importar la instancia configurada de prisma
import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🌱 Iniciando seed...');

  // Limpieza inicial para evitar duplicados
  await prisma.stock.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.business.deleteMany();

  // 1. Crear Negocio
  const business = await prisma.business.create({
    data: {
      name: 'Zaiko Market Demo',
      ruc: '20601234567',
      address: 'Av. Larco 123, Lima',
    }
  });

  // 2. Crear Sucursal
  const branch = await prisma.branch.create({
    data: {
      name: 'Sede Principal',
      address: 'Av. Larco 123',
      businessId: business.id
    }
  });

  // 3. Crear Usuario Dueño
  const password = await hash('admin123', 10);
  const owner = await prisma.user.create({
    data: {
      name: 'Primo Admin',
      email: 'admin@zaiko.com',
      password,
      role: Role.OWNER,
      businessId: business.id,
      branchId: branch.id
    }
  });

  // 4. Crear Categoría
  const category = await prisma.category.create({
    data: {
      name: 'Bebidas',
      businessId: business.id
    }
  });

  // 5. Crear Productos
  const productsData = [
    { name: 'Coca Cola 600ml', price: 3.50, code: '7750123001', stock: 50 },
    { name: 'Inca Kola 600ml', price: 3.50, code: '7750123002', stock: 40 },
    { name: 'Agua San Mateo', price: 2.00, code: '7750123003', stock: 100 },
    { name: 'Cerveza Pilsen', price: 5.00, code: '7750123004', stock: 24 },
  ];

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: {
        name: p.name,
        price: p.price,
        code: p.code,
        businessId: business.id,
        categoryId: category.id,
        active: true
      }
    });

    await prisma.stock.create({
      data: {
        branchId: branch.id,
        productId: product.id,
        quantity: p.stock
      }
    });
  }

  console.log('✅ Seed completado exitosamente! 🚀');
  console.log({ businessId: business.id, branchId: branch.id, ownerId: owner.id });
}

main()
  .catch(e => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });