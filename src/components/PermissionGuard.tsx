/**
 * @fileoverview This file defines the PermissionGuard component, a client-side
 * higher-order component used to protect content or routes based on user roles
 * and/or specific permissions. It provides a fallback UI for users who do not
 * meet the criteria and includes a debug panel (available in non-production
 * environments) to inspect permission checks.
 */
'use client';

import { ReactNode, useState } from 'react';
import { usePermission, RoleName } from '@/hooks/usePermission';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldIcon } from 'lucide-react';

/**
 * Props for the PermissionGuard component.
 */
interface PermissionGuardProps {
  /** Optional. A single permission string required to access the content. */
  permission?: string;
  /** Optional. An array of permission strings. Behavior depends on `requireAll`. */
  permissions?: string[];
  /** Optional. A single user role (`RoleName`) required to access the content. */
  role?: RoleName;
  /** Optional. An array of user roles (`RoleName`). If any match, access may be granted (unless `requireAll` is used in a specific context, though typically roles are OR'd). */
  roles?: RoleName[];
  /**
   * Optional (default: `false`). If `true` and `permissions` array is provided,
   * the user must have *all* specified permissions. If `false`, the user needs
   * at least *one* of the specified permissions. This prop primarily applies to the `permissions` array.
   * For roles, typically any matching role grants access.
   */
  requireAll?: boolean;
  /** Optional. A ReactNode to display if the user does not meet the required permissions/roles. If not provided, a default alert message is shown. */
  fallback?: ReactNode;
  /** The content to be rendered if the user meets the required permissions/roles. */
  children: ReactNode;
}

/**
 * `PermissionGuard` is a client-side component that conditionally renders its `children`
 * based on the current user's roles and/or permissions. It utilizes the `usePermission`
 * hook to fetch user permissions and perform checks.
 *
 * Access Control Logic:
 * 1. **Loading State**: While `isLoading` from `usePermission` is true, it displays a "Cargando permisos..." message.
 * 2. **Role Checks (Priority)**:
 *    - If a single `role` prop is provided, it checks if the user has that specific role.
 *    - If `roles` array is provided and no access was granted by a single `role`, it checks if the user has *any* of the roles in the array.
 * 3. **Permission Checks**: If no access is granted by role checks:
 *    - If a single `permission` prop is provided, it checks for that specific permission.
 *    - If a `permissions` array is provided:
 *      - If `requireAll` is true, it checks if the user has *all* permissions in the array.
 *      - If `requireAll` is false (default), it checks if the user has *any* permission in the array.
 * 4. **Default Access**: If no `role`, `roles`, `permission`, or `permissions` props are provided, access is granted by default.
 *
 * Fallback UI:
 * - If access is denied, it renders the custom `fallback` component if provided.
 * - Otherwise, it displays a default `Alert` component with a "No tienes permisos..." message.
 *
 * Debug Panel (Non-Production Only):
 * - A "Debug Permissions" button is shown in the bottom-left corner in non-production environments.
 * - Clicking this button toggles the visibility of a `DebugPanel`.
 * - The `DebugPanel` displays:
 *   - The roles/permissions being checked for by the `PermissionGuard` instance.
 *   - The current user's actual permissions (from `usePermission`).
 *   - The results of individual role and permission checks.
 *   - The final access decision (GRANTED/DENIED).
 * 
 * @param {PermissionGuardProps} props - The props for the component.
 * @returns {React.JSX.Element | ReactNode | null} The children if access is granted,
 *          the fallback UI if access is denied, or a loading indicator.
 */
export default function PermissionGuard({
  permission,
  permissions = [],
  role,
  roles = [],
  requireAll = false,
  fallback,
  children,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole, isLoading, userPermissions } = usePermission();
  const [showDebug, setShowDebug] = useState(false);
  
  // Si está cargando, no mostrar nada todavía
  if (isLoading) {
    return <div>Cargando permisos...</div>;
  }
  
  let hasAccess = false;
  const debugInfo = {
    roleChecks: [] as {role: string, hasRole: boolean}[],
    permissionChecks: [] as {permission: string, hasPermission: boolean}[],
    finalDecision: false
  };
  
  // Verificar por rol específico
  if (role) {
    const result = hasRole(role);
    debugInfo.roleChecks.push({role, hasRole: result});
    hasAccess = result;
  } 
  
  // Verificar por lista de roles
  if (!hasAccess && roles.length > 0) {
    for (const r of roles) {
      const result = hasRole(r);
      debugInfo.roleChecks.push({role: r, hasRole: result});
      if (result) {
        hasAccess = true;
        break;
      }
    }
  }
  
  // Si no tiene acceso por rol, verificar permisos
  if (!hasAccess) {
    // Si se proporciona un permiso único
    if (permission) {
      const result = hasPermission(permission);
      debugInfo.permissionChecks.push({permission, hasPermission: result});
      hasAccess = result;
    } 
    // Si se proporciona una lista de permisos
    else if (permissions.length > 0) {
      if (requireAll) {
        hasAccess = hasAllPermissions(permissions);
        permissions.forEach(p => {
          const result = hasPermission(p);
          debugInfo.permissionChecks.push({permission: p, hasPermission: result});
        });
      } else {
        hasAccess = hasAnyPermission(permissions);
        permissions.forEach(p => {
          const result = hasPermission(p);
          debugInfo.permissionChecks.push({permission: p, hasPermission: result});
        });
      }
    } 
    // Si no se proporcionan permisos ni roles, permitir acceso
    else if (!role && roles.length === 0) {
      hasAccess = true;
    }
  }
  
  debugInfo.finalDecision = hasAccess;
  
  // Componente de depuración
  const DebugPanel = () => (
    <div className="fixed bottom-2 right-2 z-50 p-4 bg-black bg-opacity-80 text-white rounded-lg max-w-md text-xs overflow-auto max-h-[80vh]">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold">PermissionGuard Debug</h4>
        <button 
          onClick={() => setShowDebug(false)}
          className="px-2 py-1 bg-red-500 text-white rounded"
        >
          Close
        </button>
      </div>
      
      <div className="mb-2">
        <p className="font-semibold">Checking for:</p>
        {role && <p>Role: {role}</p>}
        {roles.length > 0 && <p>Roles: {roles.join(', ')}</p>}
        {permission && <p>Permission: {permission}</p>}
        {permissions.length > 0 && (
          <p>Permissions: {permissions.join(', ')} ({requireAll ? 'Require ALL' : 'Require ANY'})</p>
        )}
      </div>
      
      <div className="mb-2">
        <p className="font-semibold">User has permissions:</p>
        <ul className="list-disc list-inside">
          {userPermissions.map(p => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </div>
      
      {debugInfo.roleChecks.length > 0 && (
        <div className="mb-2">
          <p className="font-semibold">Role Checks:</p>
          <ul className="list-disc list-inside">
            {debugInfo.roleChecks.map(({role, hasRole}, i) => (
              <li key={i} className={hasRole ? 'text-green-400' : 'text-red-400'}>
                {role}: {hasRole ? '✓' : '✗'}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {debugInfo.permissionChecks.length > 0 && (
        <div className="mb-2">
          <p className="font-semibold">Permission Checks:</p>
          <ul className="list-disc list-inside">
            {debugInfo.permissionChecks.map(({permission, hasPermission}, i) => (
              <li key={i} className={hasPermission ? 'text-green-400' : 'text-red-400'}>
                {permission}: {hasPermission ? '✓' : '✗'}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      <div className={`font-bold mt-2 ${debugInfo.finalDecision ? 'text-green-400' : 'text-red-400'}`}>
        Final Decision: {debugInfo.finalDecision ? 'ACCESS GRANTED' : 'ACCESS DENIED'}
      </div>
    </div>
  );
  
  // Si tiene acceso, mostrar el contenido
  if (hasAccess) {
    return (
      <>
        {process.env.NODE_ENV !== 'production' && (
          <>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="fixed bottom-2 left-2 z-50 px-3 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Debug Permissions
            </button>
            {showDebug && <DebugPanel />}
          </>
        )}
        {children}
      </>
    );
  }
  
  // Si el usuario no tiene los permisos necesarios, mostrar el fallback o una alerta por defecto
  if (fallback) {
    return (
      <>
        {process.env.NODE_ENV !== 'production' && (
          <>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="fixed bottom-2 left-2 z-50 px-3 py-1 bg-blue-500 text-white rounded text-xs"
            >
              Debug Permissions
            </button>
            {showDebug && <DebugPanel />}
          </>
        )}
        {fallback}
      </>
    );
  }
  
  // Fallback por defecto
  return (
    <Alert className="my-4">
      <ShieldIcon className="h-4 w-4 mr-2" />
      <AlertDescription>
        No tienes permisos para acceder a este contenido.
      </AlertDescription>
    </Alert>
  );
} 