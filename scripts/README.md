# Scripts de Optimización

## add-indexes.ts

Script para agregar índices a la base de datos y optimizar el performance de las queries.

### Uso

```bash
npm run db:indexes
```

o

```bash
npm run db:optimize
```

### ¿Qué hace?

Crea los siguientes índices en la base de datos:

1. **idx_product_business_active** - Optimiza filtrado de productos por negocio y estado
2. **idx_product_created** - Optimiza ordenamiento por fecha de creación
3. **idx_variant_active** - Optimiza filtrado de variantes activas
4. **idx_stock_branch_variant** - Optimiza consultas de stock por sucursal
5. **idx_category_ecommerce** - Optimiza búsqueda de categorías por código
6. **idx_product_category_active** - Optimiza filtrado de productos por categoría

### Beneficios

- ⚡ Queries 10-100x más rápidas
- 🚀 API de productos: 3-5s → 200-500ms
- 📱 Mejor experiencia en móvil
- 💾 Menor carga en la base de datos

### Requisitos

- Base de datos PostgreSQL
- Variables de entorno configuradas (DATABASE_URL)
- Permisos para crear índices

### Notas

- El script usa `CREATE INDEX IF NOT EXISTS`, por lo que es seguro ejecutarlo múltiples veces
- Los índices se crean en background y no bloquean la base de datos
- Puedes verificar los índices creados con: `\di` en psql

### Troubleshooting

**Error: "permission denied"**
```bash
# Asegúrate de tener permisos de superusuario o CREATEDB
GRANT CREATE ON DATABASE tu_database TO tu_usuario;
```

**Error: "relation does not exist"**
```bash
# Ejecuta las migraciones primero
npx prisma migrate deploy
```

**Error: "connection refused"**
```bash
# Verifica que la base de datos esté corriendo
# Y que DATABASE_URL esté correctamente configurado en .env
```

### Verificar Índices

Después de ejecutar el script, puedes verificar que los índices fueron creados:

```sql
-- Ver todos los índices
SELECT * FROM pg_indexes WHERE tablename IN ('Product', 'Variant', 'Stock', 'Category');

-- Ver uso de índices en una query
EXPLAIN ANALYZE 
SELECT * FROM "Product" 
WHERE "businessId" = 'xxx' AND "active" = true;
```

### Rollback

Si necesitas eliminar los índices:

```sql
DROP INDEX IF EXISTS "idx_product_business_active";
DROP INDEX IF EXISTS "idx_product_created";
DROP INDEX IF EXISTS "idx_variant_active";
DROP INDEX IF EXISTS "idx_stock_branch_variant";
DROP INDEX IF EXISTS "idx_category_ecommerce";
DROP INDEX IF EXISTS "idx_product_category_active";
```
