import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, Role, Division } from '@prisma/client';
import { hash } from 'bcryptjs';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// ==========================================
// 1. CARGA MANUAL DE VARIABLES DE ENTORNO
// ==========================================
const envPath = path.resolve(__dirname, '../.env');

if (fs.existsSync(envPath)) {
  console.log('📂 Leyendo archivo .env...');
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

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ ERROR: DATABASE_URL no se cargó. Verifica tu .env');
  process.exit(1);
}

// ==========================================
// 2. INICIALIZACIÓN DE PRISMA 7 CON ADAPTADOR
// ==========================================
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter }); 

async function main() {
  console.log('🌱 Iniciando seed...');

  // ==========================================
  // 3. LIMPIEZA DE BD (POS Únicamente)
  // ==========================================
  try {
    await prisma.auditLog.deleteMany();
    await prisma.sunatConfig.deleteMany();
    await prisma.invoice.deleteMany();
    await prisma.salePayment.deleteMany();
    await prisma.saleItem.deleteMany();
    await prisma.sale.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.cashSession.deleteMany();
    await prisma.stock.deleteMany();
    
    await prisma.product.deleteMany({ where: { businessId: { not: null } } });
    await prisma.category.deleteMany({ where: { businessId: { not: null } } }); 
    await prisma.user.deleteMany({ where: { role: { in: [Role.SUPER_ADMIN, Role.OWNER, Role.MANAGER, Role.CASHIER] } } });
    
    await prisma.branch.deleteMany();
    await prisma.business.deleteMany();
    console.log('🗑️  Datos antiguos del POS limpiados (E-commerce intacto)');
  } catch (e) {
    console.log('⚠️  Nota: La BD ya estaba vacía o hubo un error menor al limpiar.');
  }

  // ==========================================
  // 4. CREACIÓN DE ROLES GLOBALES
  // ==========================================
  
  console.log('👤 Creando usuario Software TI (SUPER_ADMIN)...');
  const superAdminPassword = await hash('ti123456', 10);
  const tiUser = await prisma.user.create({
    data: {
      name: 'Software TI',
      email: 'ti@zaiko.com',
      password: superAdminPassword,
      role: Role.SUPER_ADMIN,
      // No le asignamos businessId porque él controla todo
    }
  });

  // ==========================================
  // 5. CREACIÓN DE NEGOCIOS (ALINEADOS AL E-COMMERCE)
  // ==========================================
  
  console.log('🏢 Creando negocios (Juguetería y Fiestas)...');

  // Negocio 1: JUGUETERÍA
  const businessJugueteria = await prisma.business.create({
    data: {
      name: 'Festamas Juguetería',
      ruc: '20100000001',
      address: 'Av. Juguetes 123, Lima',
      brandColors: { primary: "#fb3099", secondary: "#1e293b" },
      maxBranches: 2, maxManagers: 2, maxEmployees: 10
    }
  });

  const branchJugueteria = await prisma.branch.create({
    data: { name: 'Sede Juguetería Central', businessId: businessJugueteria.id }
  });

  // Negocio 2: FIESTAS
  const businessFiestas = await prisma.business.create({
    data: {
      name: 'Festamas Fiestas',
      ruc: '20100000002',
      address: 'Av. Fiestas 456, Lima',
      brandColors: { primary: "#3b82f6", secondary: "#1e293b" },
      maxBranches: 2, maxManagers: 2, maxEmployees: 10
    }
  });

  const branchFiestas = await prisma.branch.create({
    data: { name: 'Sede Fiestas Central', businessId: businessFiestas.id }
  });

  // ==========================================
  // 6. CREACIÓN DE DUEÑOS
  // ==========================================
  const ownerPassword = await hash('admin123', 10);
  
  const ownerJugueteria = await prisma.user.create({
    data: {
      name: 'Dueño Juguetería',
      email: 'admin@zaiko.com',
      password: ownerPassword,
      role: Role.OWNER,
      businessId: businessJugueteria.id,
      branchId: branchJugueteria.id
    }
  });

  // ==========================================
  // 7. CATEGORÍAS Y PRODUCTOS
  // ==========================================
  console.log('📦 Poblando catálogos de productos...');

  // Cat Juguetes
  const catJuguetes = await prisma.category.create({
    data: {
      name: 'Muñecas y Figuras',
      slug: 'munecas-figuras-pos',
      division: Division.JUGUETERIA,
      businessId: businessJugueteria.id
    }
  });

  // Cat Fiestas
  const catFiestas = await prisma.category.create({
    data: {
      name: 'Globos y Decoración',
      slug: 'globos-decoracion-pos',
      division: Division.FIESTAS,
      businessId: businessFiestas.id
    }
  });

  // Productos Juguetería
  const juguetes = [
    { name: 'Muñeca Barbie', price: 45.00, code: 'JUG-001', stock: 20 },
    { name: 'Max Steel Clásico', price: 35.00, code: 'JUG-002', stock: 15 },
  ];

  for (const j of juguetes) {
    const prod = await prisma.product.create({
      data: {
        title: j.name,
        description: `Juguete original: ${j.name}`,
        slug: `juguete-${j.code.toLowerCase()}`,
        price: j.price,
        code: j.code,
        division: Division.JUGUETERIA, // Mapeado al e-commerce
        businessId: businessJugueteria.id,
        categoryId: catJuguetes.id,
        active: true
      }
    });
    await prisma.stock.create({
      data: { branchId: branchJugueteria.id, productId: prod.id, quantity: j.stock }
    });
  }

  // Productos Fiestas
  const fiestas = [
    { name: 'Globo Metálico Número 1', price: 5.00, code: 'FIE-001', stock: 100 },
    { name: 'Vela de Cumpleaños Mágica', price: 3.50, code: 'FIE-002', stock: 50 },
  ];

  for (const f of fiestas) {
    const prod = await prisma.product.create({
      data: {
        title: f.name,
        description: `Accesorio de fiesta: ${f.name}`,
        slug: `fiesta-${f.code.toLowerCase()}`,
        price: f.price,
        code: f.code,
        division: Division.FIESTAS, // Mapeado al e-commerce
        businessId: businessFiestas.id,
        categoryId: catFiestas.id,
        active: true
      }
    });
    await prisma.stock.create({
      data: { branchId: branchFiestas.id, productId: prod.id, quantity: f.stock }
    });
  }

  console.log('------------------------------------------------');
  console.log('✅ SEED COMPLETADO EXITOSAMENTE 🚀');
  console.log('\n--- Cuentas de Acceso ---');
  console.log(`👨‍💻 Software TI   : ti@zaiko.com / ti123456`);
  console.log(`🏬 Dueño Juguetes: admin@zaiko.com / admin123`);
  console.log('\n--- IDs para Desarrollo (Juguetería) ---');
  console.log(`🏪 BRANCH ID: ${branchJugueteria.id}`); 
  console.log(`👤 USER ID:   ${ownerJugueteria.id}`); 
  console.log('------------------------------------------------');
}

main()
  .catch(e => {
    console.error('❌ Error fatal en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });