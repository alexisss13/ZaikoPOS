import { useState, useEffect } from 'react';
import { BasicUserData } from '@/components/dashboard/BasicUserModal';

interface UseBasicUserFormProps {
  userToEdit?: BasicUserData | null;
  isOpen: boolean;
  branches?: Array<{ id: string; name: string; logoUrl?: string | null }>;
}

export function useBasicUserForm({ userToEdit, isOpen, branches }: UseBasicUserFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER',
    businessId: 'NONE',
    branchId: '',
    image: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    if (userToEdit && isOpen) {
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        password: '',
        role: userToEdit.role,
        businessId: userToEdit.businessId || 'NONE',
        branchId: userToEdit.branchId || (branches && branches.length > 0 ? branches[0].id : ''),
        image: userToEdit.image || '',
      });
    } else if (isOpen) {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'CASHIER',
        businessId: 'NONE',
        branchId: branches && branches.length > 0 ? branches[0].id : '',
        image: ''
      });
    }
  }, [userToEdit, isOpen, branches]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleChange = (val: string) => {
    setFormData(prev => ({ ...prev, role: val }));
    
    if (val === 'SUPER_ADMIN') {
      setFormData(prev => ({ ...prev, branchId: 'NONE' }));
    }
  };

  const handleBusinessChange = (businessId: string) => {
    setFormData(prev => ({ ...prev, businessId }));
  };

  const handleBranchChange = (branchId: string) => {
    setFormData(prev => ({ ...prev, branchId }));
  };

  const setImage = (image: string) => {
    setFormData(prev => ({ ...prev, image }));
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  // Apply automatic permissions based on role without showing them
  const getPermissionsByRole = (role: string) => {
    if (role === 'MANAGER') {
      return {
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
      };
    } else if (role === 'CASHIER') {
      return {
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
      };
    }
    // SUPER_ADMIN gets all permissions by default in the backend
    return {};
  };

  const validateForm = (currentUserRole: string) => {
    // Validation logic
    if (currentUserRole === 'SUPER_ADMIN' && formData.role !== 'SUPER_ADMIN' && (!formData.businessId || formData.businessId === 'NONE')) {
      return 'Debes seleccionar a qué negocio pertenece este empleado.';
    }
    if (formData.role !== 'SUPER_ADMIN' && (!formData.branchId || formData.branchId === 'NONE')) {
      return 'El empleado debe estar asignado a una sucursal.';
    }
    return null;
  };

  const preparePayload = () => {
    const permissions = getPermissionsByRole(formData.role);
    
    return {
      ...formData,
      image: formData.image.trim() === '' ? null : formData.image,
      businessId: formData.role === 'SUPER_ADMIN' ? null : (formData.businessId === 'NONE' ? undefined : formData.businessId),
      branchId: formData.role === 'SUPER_ADMIN' || formData.branchId === 'NONE' ? null : formData.branchId,
      permissions
    };
  };

  return {
    formData,
    isLoading,
    setIsLoading,
    isUploadingImage,
    setIsUploadingImage,
    handleChange,
    handleRoleChange,
    handleBusinessChange,
    handleBranchChange,
    setImage,
    removeImage,
    validateForm,
    preparePayload,
    getPermissionsByRole
  };
}