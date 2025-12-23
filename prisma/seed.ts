import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, Role } from '@prisma/client';
import { hashPassword } from '../src/lib/security';

// ==========================================
// 1. CARGA MANUAL DE VARIABLES DE ENTORNO
// ==========================================
// Esto evita depender de 'dotenv' o configuraciones de CLI que están fallando
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  console.log('📂 Leyendo archivo .env manualmente...');
  const envConfig = fs.readFileSync(envPath, 'utf-8');
  
  envConfig.split('\n').forEach((line) => {
    // Ignoramos comentarios y líneas vacías
    if (!line || line.startsWith('#')) return;
    
    // Separamos clave y valor
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^["']|["']$/g, ''); // Quitamos comillas
      process.env[key.trim()] = value;
    }
  });
} else {
  console.warn('⚠️ No se encontró el archivo .env en la raíz');
}

// Verificación de seguridad
if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL no se cargó. Verifica tu archivo .env');
  process.exit(1);
}

// ==========================================
// 2. INICIO DEL SEED
// ==========================================

// Instanciamos Prisma (ahora sí encontrará la variable en process.env)
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');
  console.log('🔌 Conectando a la base de datos...');

  // 1. Limpiar BD
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
      console.log('🗑️  Base de datos limpiada');
  } catch (e) {
      console.log('⚠️  Limpieza omitida (BD vacía o error menor).');
  }

  // 2. Crear Negocio
  const business = await prisma.business.create({
    data: {
      name: 'Bodega "El Primo"',
      ruc: '20123456789',
      address: 'Av. Siempre Viva 123',
    }
  });

  // 3. Crear Sucursal
  const branch = await prisma.branch.create({
    data: {
      businessId: business.id,
      name: 'Sucursal Principal',
      address: 'Av. Siempre Viva 123',
    }
  });

  // 4. Crear Usuario
  const passwordHash = await hashPassword('123456'); 
  
  const user = await prisma.user.create({
    data: {
      businessId: business.id,
      name: 'Primo Admin',
      email: 'admin@zaiko.com',
      password: passwordHash,
      role: Role.OWNER,
    }
  });

  // 5. Crear Productos
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
      data: {
        businessId: business.id,
        name: p.name,
        price: p.price,
        code: p.code,
      }
    });

    await prisma.stock.create({
      data: {
        branchId: branch.id,
        productId: product.id,
        quantity: 100,
      }
    });
  }

  console.log('------------------------------------------------');
  console.log('✅ SEED EXITOSO');
  console.log(`🏪 BRANCH ID: ${branch.id}`); 
  console.log('------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });