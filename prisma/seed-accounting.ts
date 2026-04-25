// prisma/seed-accounting.ts
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient, AccountType } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Load environment variables
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

// Initialize Prisma Client with PG adapter
const pool = new Pool({ connectionString: dbUrl });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface AccountSeed {
  code: string;
  name: string;
  type: AccountType;
  parentCode?: string;
}

// Standard Chart of Accounts (Plan Contable General Empresarial - Perú)
const defaultAccounts: AccountSeed[] = [
  // ASSETS (ACTIVO)
  { code: '10', name: 'EFECTIVO Y EQUIVALENTES DE EFECTIVO', type: 'ASSET' },
  { code: '1010', name: 'Caja', type: 'ASSET', parentCode: '10' },
  { code: '1020', name: 'Bancos', type: 'ASSET', parentCode: '10' },
  
  { code: '12', name: 'CUENTAS POR COBRAR COMERCIALES', type: 'ASSET' },
  { code: '1210', name: 'Facturas por Cobrar', type: 'ASSET', parentCode: '12' },
  { code: '1220', name: 'Letras por Cobrar', type: 'ASSET', parentCode: '12' },
  
  { code: '20', name: 'MERCADERÍAS', type: 'ASSET' },
  { code: '2010', name: 'Mercaderías Manufacturadas', type: 'ASSET', parentCode: '20' },
  { code: '2020', name: 'Mercaderías de Extracción', type: 'ASSET', parentCode: '20' },
  
  { code: '33', name: 'INMUEBLES, MAQUINARIA Y EQUIPO', type: 'ASSET' },
  { code: '3310', name: 'Terrenos', type: 'ASSET', parentCode: '33' },
  { code: '3320', name: 'Edificaciones', type: 'ASSET', parentCode: '33' },
  { code: '3330', name: 'Maquinarias y Equipos', type: 'ASSET', parentCode: '33' },
  { code: '3340', name: 'Equipos de Transporte', type: 'ASSET', parentCode: '33' },
  { code: '3350', name: 'Muebles y Enseres', type: 'ASSET', parentCode: '33' },
  { code: '3360', name: 'Equipos de Cómputo', type: 'ASSET', parentCode: '33' },
  
  // LIABILITIES (PASIVO)
  { code: '40', name: 'TRIBUTOS POR PAGAR', type: 'LIABILITY' },
  { code: '4010', name: 'IGV por Pagar', type: 'LIABILITY', parentCode: '40' },
  { code: '4020', name: 'Impuesto a la Renta por Pagar', type: 'LIABILITY', parentCode: '40' },
  
  { code: '42', name: 'CUENTAS POR PAGAR COMERCIALES', type: 'LIABILITY' },
  { code: '4210', name: 'Facturas por Pagar', type: 'LIABILITY', parentCode: '42' },
  { code: '4220', name: 'Letras por Pagar', type: 'LIABILITY', parentCode: '42' },
  
  { code: '45', name: 'OBLIGACIONES FINANCIERAS', type: 'LIABILITY' },
  { code: '4510', name: 'Préstamos Bancarios', type: 'LIABILITY', parentCode: '45' },
  { code: '4520', name: 'Contratos de Arrendamiento Financiero', type: 'LIABILITY', parentCode: '45' },
  
  // EQUITY (PATRIMONIO)
  { code: '50', name: 'CAPITAL', type: 'EQUITY' },
  { code: '5010', name: 'Capital Social', type: 'EQUITY', parentCode: '50' },
  { code: '5020', name: 'Acciones en Tesorería', type: 'EQUITY', parentCode: '50' },
  
  { code: '59', name: 'RESULTADOS ACUMULADOS', type: 'EQUITY' },
  { code: '5910', name: 'Utilidades Acumuladas', type: 'EQUITY', parentCode: '59' },
  { code: '5920', name: 'Pérdidas Acumuladas', type: 'EQUITY', parentCode: '59' },
  
  // REVENUE (INGRESOS)
  { code: '70', name: 'VENTAS', type: 'REVENUE' },
  { code: '7010', name: 'Ventas de Mercaderías', type: 'REVENUE', parentCode: '70' },
  { code: '7020', name: 'Ventas de Productos Terminados', type: 'REVENUE', parentCode: '70' },
  { code: '7030', name: 'Ventas de Servicios', type: 'REVENUE', parentCode: '70' },
  
  { code: '75', name: 'OTROS INGRESOS DE GESTIÓN', type: 'REVENUE' },
  { code: '7510', name: 'Ingresos por Alquileres', type: 'REVENUE', parentCode: '75' },
  { code: '7520', name: 'Ingresos por Servicios', type: 'REVENUE', parentCode: '75' },
  
  // EXPENSES (GASTOS)
  { code: '60', name: 'COMPRAS', type: 'EXPENSE' },
  { code: '6010', name: 'Compras de Mercaderías', type: 'EXPENSE', parentCode: '60' },
  { code: '6020', name: 'Compras de Materias Primas', type: 'EXPENSE', parentCode: '60' },
  
  { code: '69', name: 'COSTO DE VENTAS', type: 'EXPENSE' },
  { code: '6910', name: 'Costo de Ventas - Mercaderías', type: 'EXPENSE', parentCode: '69' },
  { code: '6920', name: 'Costo de Ventas - Productos Terminados', type: 'EXPENSE', parentCode: '69' },
  
  { code: '62', name: 'GASTOS DE PERSONAL', type: 'EXPENSE' },
  { code: '6210', name: 'Sueldos y Salarios', type: 'EXPENSE', parentCode: '62' },
  { code: '6220', name: 'Gratificaciones', type: 'EXPENSE', parentCode: '62' },
  { code: '6230', name: 'CTS', type: 'EXPENSE', parentCode: '62' },
  { code: '6240', name: 'Essalud', type: 'EXPENSE', parentCode: '62' },
  
  { code: '63', name: 'GASTOS DE SERVICIOS PRESTADOS POR TERCEROS', type: 'EXPENSE' },
  { code: '6310', name: 'Alquileres', type: 'EXPENSE', parentCode: '63' },
  { code: '6320', name: 'Servicios Públicos', type: 'EXPENSE', parentCode: '63' },
  { code: '6330', name: 'Publicidad', type: 'EXPENSE', parentCode: '63' },
  { code: '6340', name: 'Mantenimiento y Reparaciones', type: 'EXPENSE', parentCode: '63' },
  
  { code: '64', name: 'GASTOS POR TRIBUTOS', type: 'EXPENSE' },
  { code: '6410', name: 'Impuesto Predial', type: 'EXPENSE', parentCode: '64' },
  { code: '6420', name: 'Licencias y Permisos', type: 'EXPENSE', parentCode: '64' },
  
  { code: '65', name: 'OTROS GASTOS DE GESTIÓN', type: 'EXPENSE' },
  { code: '6510', name: 'Seguros', type: 'EXPENSE', parentCode: '65' },
  { code: '6520', name: 'Suministros', type: 'EXPENSE', parentCode: '65' },
  
  { code: '67', name: 'GASTOS FINANCIEROS', type: 'EXPENSE' },
  { code: '6710', name: 'Intereses Bancarios', type: 'EXPENSE', parentCode: '67' },
  { code: '6720', name: 'Comisiones Bancarias', type: 'EXPENSE', parentCode: '67' },
];

export async function seedAccountingForBusiness(businessId: string) {
  console.log(`🌱 Seeding accounting chart of accounts for business: ${businessId}`);
  
  const accountMap = new Map<string, string>(); // code -> id mapping
  
  // First pass: Create parent accounts
  for (const account of defaultAccounts.filter(a => !a.parentCode)) {
    const created = await prisma.accountingAccount.create({
      data: {
        businessId,
        code: account.code,
        name: account.name,
        type: account.type,
        isActive: true,
        balance: 0,
      },
    });
    accountMap.set(account.code, created.id);
    console.log(`  ✓ Created account: ${account.code} - ${account.name}`);
  }
  
  // Second pass: Create child accounts
  for (const account of defaultAccounts.filter(a => a.parentCode)) {
    const parentId = accountMap.get(account.parentCode!);
    if (!parentId) {
      console.warn(`  ⚠ Parent account not found for ${account.code}`);
      continue;
    }
    
    const created = await prisma.accountingAccount.create({
      data: {
        businessId,
        code: account.code,
        name: account.name,
        type: account.type,
        parentId,
        isActive: true,
        balance: 0,
      },
    });
    accountMap.set(account.code, created.id);
    console.log(`  ✓ Created account: ${account.code} - ${account.name}`);
  }
  
  console.log(`✅ Seeded ${defaultAccounts.length} accounts for business ${businessId}`);
  return accountMap;
}

// Main seed function
async function main() {
  console.log('🌱 Starting accounting seed...');
  
  // Get all businesses
  const businesses = await prisma.business.findMany();
  
  if (businesses.length === 0) {
    console.log('⚠️  No businesses found. Please create a business first.');
    return;
  }
  
  for (const business of businesses) {
    // Check if accounts already exist
    const existingAccounts = await prisma.accountingAccount.count({
      where: { businessId: business.id },
    });
    
    if (existingAccounts > 0) {
      console.log(`⏭️  Skipping business ${business.name} - already has ${existingAccounts} accounts`);
      continue;
    }
    
    await seedAccountingForBusiness(business.id);
  }
  
  console.log('✅ Accounting seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding accounting:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
