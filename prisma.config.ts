import 'dotenv/config';
import { defineConfig } from '@prisma/config';

export default defineConfig({
  // Apuntamos a tu esquema actual
  schema: 'prisma/schema.prisma',
  // Definimos que el seed se ejecuta con tsx
  migrations: {
    seed: 'tsx prisma/seed.ts',
  },
  // La conexión se define AQUÍ, no en el schema
  datasource: {
    url: process.env.DATABASE_URL,
  },
});