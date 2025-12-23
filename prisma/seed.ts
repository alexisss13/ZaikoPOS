import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/security';
// No olvides dotenv para que el script lea el .env al ejecutarse directo
import 'dotenv/config'; 

// 1. Configurar la conexión usando el Driver Adapter (La forma Prisma 7)
const connectionString = `${process.env.DATABASE_URL}`;

// Usamos pg.Pool como indica el estándar para adaptadores
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed (Modo Adapter)...');

  // Limpieza de datos
  try {
      await prisma.salePayment.deleteMany();
      await prisma.saleItem.deleteMany();
      await prisma.sale.deleteMany();
      await prisma.cashSession.deleteMany();
      await prisma.stock.deleteMany();
      await prisma.product.deleteMany();
      await prisma.user.deleteMany();
      await prisma.branch.deleteMany();
      await prisma.business.deleteMany();
      console.log('🗑️  BD Limpiada');
  } catch (e) {
      console.log('⚠️  Limpieza omitida.');
  }

  // Crear Negocio
  const business = await prisma.business.create({
    data: { name: 'Bodega "El Primo"', ruc: '20123456789', address: 'Av. Siempre Viva 123' }
  });

  // Crear Sucursal
  const branch = await prisma.branch.create({
    data: { businessId: business.id, name: 'Sucursal Principal' }
  });

  // Crear Usuario
  const passwordHash = await hashPassword('123456'); 
  
  await prisma.user.create({
    data: {
      businessId: business.id,
      name: 'Primo Admin',
      email: 'admin@zaiko.com',
      password: passwordHash,
      role: Role.OWNER,
    }
  });

  // Crear Productos
  const productsData = [
    { name: 'Coca Cola 600ml', price: 3.50, code: '77501' },
    { name: 'Inca Kola 600ml', price: 3.50, code: '77502' },
    { name: 'Galleta Soda V', price: 0.80, code: 'PROD03' },
    { name: 'Arroz Costeño 1kg', price: 4.20, code: 'PROD04' },
    { name: 'Aceite Primor', price: 12.50, code: 'PROD05' },
    { name: 'Atún Florida', price: 5.50, code: 'PROD06' },
  ];

  console.log('📦 Creando productos...');

  for (const p of productsData) {
    const product = await prisma.product.create({
      data: { businessId: business.id, name: p.name, price: p.price, code: p.code }
    });

    await prisma.stock.create({
      data: { branchId: branch.id, productId: product.id, quantity: 100 }
    });
  }

  console.log('------------------------------------------------');
  console.log('✅ SEED EXITOSO');
  console.log(`🏪 BRANCH ID: ${branch.id}`); 
  console.log('------------------------------------------------');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });