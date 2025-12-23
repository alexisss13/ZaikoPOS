'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Search, AlertTriangle, FileEdit, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { UIProduct } from '@/types/product';

interface APIResponse {
    data: UIProduct[];
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductsPage() {
  const { branchId } = useAuth();
  const [search, setSearch] = useState('');
  
  const { data, isLoading } = useSWR<APIResponse>(
    branchId ? `/api/products?branchId=${branchId}&q=${search}` : null,
    fetcher
  );

  const products = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Inventario</h2>
          <p className="text-muted-foreground">Gestiona el catálogo de productos y existencias.</p>
        </div>
        <Button onClick={() => toast.info('Función Crear: Próximamente')}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Producto
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Productos</CardTitle>
          <CardDescription>Listado general de productos en la sucursal actual.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por nombre o código..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-center">Stock</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-5 w-5 animate-spin" /> Cargando...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No se encontraron productos.
                    </TableCell>
                  </TableRow>
                ) : (
                  products.map((product) => (
                    <TableRow key={product.id} className={!product.active ? 'bg-slate-50 opacity-70' : ''}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{product.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {product.code || 'S/C'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {product.category ? (
                            <Badge variant="secondary" className="font-normal text-slate-600">
                                {product.category}
                            </Badge>
                        ) : <span className="text-muted-foreground text-xs">-</span>}
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        S/ {product.price.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.stock}
                      </TableCell>
                      <TableCell className="text-center">
                        {!product.active ? (
                            <Badge variant="outline" className="text-slate-500 border-slate-300 gap-1">
                                <XCircle className="w-3 h-3" /> Inactivo
                            </Badge>
                        ) : product.stock <= 0 ? (
                          <Badge variant="destructive" className="gap-1">Agotado</Badge>
                        ) : product.stock <= product.minStock ? (
                          <Badge variant="secondary" className="text-amber-600 bg-amber-100 border-amber-200 gap-1">
                            <AlertTriangle className="h-3 w-3" /> Bajo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Activo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => toast.info("Edición próximamente")}>
                          <FileEdit className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}