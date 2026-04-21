import { useState, useEffect } from 'react';
import { BasicUserData, ROLE_PERMISSIONS } from '../types/user-management.types';

interface UsePermissionsManagerProps {
  userToEdit: BasicUserData & { permissions?: Record<string, boolean> };
  isOpen: boolean;
}

export function usePermissionsManager({ userToEdit, isOpen }: UsePermissionsManagerProps) {
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [originalPermissions, setOriginalPermissions] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (userToEdit && isOpen) {
      const userPermissions = userToEdit.permissions || {};
      setPermissions(userPermissions);
      setOriginalPermissions(userPermissions);
      setSearchTerm('');
      setExpandedInfo({});
    }
  }, [userToEdit, isOpen]);

  const handlePermissionToggle = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleInfo = (key: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedInfo(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const resetToRoleDefaults = () => {
    const rolePermissions = ROLE_PERMISSIONS[userToEdit.role as keyof typeof ROLE_PERMISSIONS] || {};
    setPermissions(rolePermissions);
    return rolePermissions;
  };

  const getChanges = () => {
    const changes: { key: string; from: boolean; to: boolean }[] = [];
    
    // Compare all possible permissions
    const allKeys = new Set([
      ...Object.keys(originalPermissions),
      ...Object.keys(permissions)
    ]);
    
    allKeys.forEach(key => {
      const originalValue = originalPermissions[key] || false;
      const currentValue = permissions[key] || false;
      
      if (originalValue !== currentValue) {
        changes.push({
          key,
          from: originalValue,
          to: currentValue
        });
      }
    });
    
    return changes;
  };

  const hasChanges = getChanges().length > 0;

  const preparePayload = () => {
    return {
      permissions
    };
  };

  const validatePermissions = () => {
    // Add any validation logic here
    // For example, check for dangerous permission combinations
    if (permissions.canManageGlobalProducts && (!userToEdit.branchId || userToEdit.branchId === 'NONE')) {
      return 'El permiso de Catálogo Global requiere confirmación especial.';
    }
    return null;
  };

  return {
    permissions,
    originalPermissions,
    searchTerm,
    setSearchTerm,
    expandedInfo,
    isLoading,
    setIsLoading,
    handlePermissionToggle,
    toggleInfo,
    resetToRoleDefaults,
    getChanges,
    hasChanges,
    preparePayload,
    validatePermissions
  };
}