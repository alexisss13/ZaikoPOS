import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/security';

// 1. CARGA MANUAL DE .ENV
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  envConfig.split('\n').forEach((line) => {
    if (!line || line.startsWith('#')) return;
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key.trim()] = value;
    }
  });
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ ERROR: DATABASE_URL no cargada.');
  process.exit(1);
}

// 2. INSTANCIA MANUAL
// Al no tener URL en el schema, Prisma 7 permite/exige esto:
const prisma = new PrismaClient();


async function main() {
  console.log('🌱 Iniciando seed...');
  console.log('🔌 Conectando...');

  // Limpieza
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
  } catch (e) { console.log('⚠️  Limpieza omitida'); }

  // Datos
  const business = await prisma.business.create({
    data: { name: 'Bodega "El Primo"', ruc: '20123456789', address: 'Av. Siempre Viva 123' }
  });

  const branch = await prisma.branch.create({
    data: { businessId: business.id, name: 'Sucursal Principal' }
  });

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

  // Productos
  const productsData = [
    { name: 'Coca Cola 600ml', price: 3.50, code: '77501' },
    { name: 'Inca Kola 600ml', price: 3.50, code: '77502' },
    { name: 'Galleta Soda V', price: 0.80, code: 'PROD03' },
    { name: 'Arroz Costeño 1kg', price: 4.20, code: 'PROD04' },
    { name: 'Aceite Primor', price: 12.50, code: 'PROD05' },
    { name: 'Atún Florida', price: 5.50, code: 'PROD06' },
    { name: 'Detergente Bolivar', price: 8.00, code: 'PROD07' },
    { name: 'Leche Gloria Azul', price: 4.00, code: 'PROD08' },
    { name: 'Yogurt Gloria 1L', price: 6.50, code: 'PROD09' },
    { name: 'Cerveza Pilsen', price: 7.00, code: 'PROD10' },
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

  console.log('✅ SEED EXITOSO');
  console.log(`🏪 BRANCH ID: ${branch.id}`); 
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });