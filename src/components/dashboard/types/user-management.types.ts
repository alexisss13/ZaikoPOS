// Types for user management components

export interface BasicUserData {
  id?: string;
  name: string;
  email: string;
  role: string;
  businessId?: string | null;
  branchId?: string | null;
  image?: string | null;
}

export interface ExtendedUserData extends BasicUserData {
  permissions?: Record<string, boolean>;
}

export interface SimpleBusiness {
  id: string;
  name: string;
}

export interface Branch {
  id: string;
  name: string;
  logoUrl?: string | null;
}

export interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: BasicUserData | null;
}

export interface PermissionConfig {
  key: string;
  label: string;
  description: string;
  category: 'inventory' | 'pos' | 'privacy';
  type?: 'default' | 'warning' | 'critical';
}

export const PERMISSION_CATEGORIES = {
  inventory: 'Inventario y Logística',
  pos: 'Operaciones de Caja',
  privacy: 'Privacidad y Reportes'
} as const;

export const DEFAULT_PERMISSIONS: PermissionConfig[] = [
  // Inventory permissions
  {
    key: 'canCreateProducts',
    label: 'Crear Productos',
    description: 'Registrar nueva mercadería en el catálogo de su sucursal.',
    category: 'inventory'
  },
  {
    key: 'canEditProducts',
    label: 'Editar Precios y Stock',
    description: 'Modificar el precio de venta público y mantener el stock al día.',
    category: 'inventory'
  },
  {
    key: 'canViewOtherBranches',
    label: 'Ver Stock Externo',
    description: 'Saber si otra tienda tiene el producto que busca el cliente (Solo lectura).',
    category: 'inventory'
  },
  {
    key: 'canAdjustStock',
    label: 'Ajuste de Mermas',
    description: 'Reducir el stock manualmente sin registrar una venta (Por robos, daños o caducidad).',
    category: 'inventory',
    type: 'warning'
  },
  {
    key: 'canTransferStock',
    label: 'Traslados',
    description: 'Enviar cajas o productos desde su almacén hacia el almacén de otra sucursal.',
    category: 'inventory',
    type: 'warning'
  },
  {
    key: 'canManageGlobalProducts',
    label: 'Catálogo Global (Peligroso)',
    description: 'Acceso total para editar cualquier producto sin importar a qué tienda pertenezca.',
    category: 'inventory',
    type: 'critical'
  },
  // POS permissions
  {
    key: 'canOpenCloseCash',
    label: 'Abrir / Cerrar Turnos',
    description: 'Permite ingresar la base de efectivo en la mañana y generar el ticket Z en la noche.',
    category: 'pos'
  },
  {
    key: 'canApplyDiscounts',
    label: 'Aplicar Descuentos',
    description: 'Autorización para rebajar manualmente el precio final al momento de cobrar al cliente.',
    category: 'pos'
  },
  {
    key: 'canViewDailySummary',
    label: 'Ver Total de Caja',
    description: 'Si se desactiva, obliga al cajero a contar y declarar el dinero a ciegas (Evita robos).',
    category: 'pos',
    type: 'warning'
  },
  {
    key: 'canVoidSales',
    label: 'Anular Ventas',
    description: 'Poder borrar un ticket emitido, regresar el stock al sistema y restar el dinero.',
    category: 'pos',
    type: 'critical'
  },
  // Privacy permissions
  {
    key: 'canViewCosts',
    label: 'Ver Costos de Proveedor',
    description: 'Oculta el precio al que compraste la mercadería. Solo verá el precio de venta final.',
    category: 'privacy'
  },
  {
    key: 'canManageCustomers',
    label: 'Gestionar Clientes',
    description: 'Tener acceso a la base de datos completa de nombres, correos y teléfonos.',
    category: 'privacy'
  },
  {
    key: 'canViewReports',
    label: 'Ver Estadísticas',
    description: 'Acceso a la pantalla principal (Dashboard) para ver las ganancias y ventas totales de la tienda.',
    category: 'privacy'
  }
];

export const ROLE_PERMISSIONS = {
  MANAGER: {
    canCreateProducts: true,
    canEditProducts: true,
    canManageGlobalProducts: false,
    canViewOtherBranches: true,
    canAdjustStock: true,
    canTransferStock: true,
    canApplyDiscounts: true,
    canVoidSales: true,
    canOpenCloseCash: true,
    canViewDailySummary: true,
    canViewCosts: true,
    canViewReports: true,
    canManageCustomers: true,
    canAccessSettings: true,
  },
  CASHIER: {
    canCreateProducts: false,
    canEditProducts: false,
    canManageGlobalProducts: false,
    canViewOtherBranches: false,
    canAdjustStock: false,
    canTransferStock: false,
    canApplyDiscounts: false,
    canVoidSales: false,
    canOpenCloseCash: true,
    canViewDailySummary: false,
    canViewCosts: false,
    canViewReports: false,
    canManageCustomers: false,
    canAccessSettings: false,
  },
  SUPER_ADMIN: {} // Gets all permissions by default in backend
} as const;