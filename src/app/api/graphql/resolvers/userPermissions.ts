import { PrismaClient } from '@prisma/client';
import { Context } from '@/app/api/graphql/types';
import { verifySession } from '@/app/api/utils/auth';

const prisma = new PrismaClient();

type Parent = object;

export const userPermissionResolvers = {
  Query: {
    // Obtener todos los permisos específicos para un usuario
    userSpecificPermissions: async (_: Parent, { userId }: { userId: string }, context: Context) => {
      // Verificar si el usuario está autenticado y tiene permisos
      const session = await verifySession(context.req);
      const currentUser = session?.user;
      
      if (!currentUser) {
        throw new Error('Unauthorized: You must be logged in to access this information');
      }
      
      // Verificar permisos: El usuario debe tener permiso para ver otros usuarios o ser el mismo usuario
      if (currentUser.role.name !== 'ADMIN' && !currentUser.permissions?.includes('users:read') && currentUser.id !== userId) {
        throw new Error('Forbidden: You do not have permission to access this user\'s permissions');
      }
      
      try {
        const userPermissions = await prisma.userPermission.findMany({
          where: {
            userId: userId,
          },
          orderBy: {
            permissionName: 'asc',
          },
        });
        
        return userPermissions;
      } catch (error) {
        console.error('Error fetching user permissions:', error);
        throw new Error('Failed to fetch user permissions');
      }
    },
  },
  
  Mutation: {
    // Establecer o actualizar un permiso específico para un usuario
    setUserPermission: async (_: Parent, { input }: { input: { userId: string; permissionName: string; granted: boolean | null } }, context: Context) => {
      // Verificar si el usuario está autenticado y tiene permisos
      const session = await verifySession(context.req);
      const currentUser = session?.user;
      
      if (!currentUser) {
        throw new Error('Unauthorized: You must be logged in to modify permissions');
      }
      
      // Solo administradores o usuarios con permiso específico pueden modificar permisos
      if (currentUser.role.name !== 'ADMIN' && !currentUser.permissions?.includes('permissions:update')) {
        throw new Error('Forbidden: You do not have permission to modify user permissions');
      }
      
      const { userId, permissionName, granted } = input;
      
      try {
        // Verificar si existe el usuario
        const user = await prisma.user.findUnique({
          where: { id: userId },
        });
        
        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }
        
        // Verificar si existe el permiso
        const permission = await prisma.permission.findFirst({
          where: { name: permissionName },
        });
        
        if (!permission) {
          throw new Error(`Permission ${permissionName} does not exist`);
        }
        
        // Si granted es null, eliminar el permiso específico
        if (granted === null) {
          const deleted = await prisma.userPermission.deleteMany({
            where: {
              userId: userId,
              permissionName: permissionName,
            },
          });
          
          // Si no se borró ningún registro, lanzar un error
          if (deleted.count === 0) {
            throw new Error(`No specific permission ${permissionName} found for user ${userId}`);
          }
          
          // Devolver un objeto con el permiso removido
          return {
            id: 'removed',
            userId: userId,
            permissionName: permissionName,
            granted: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        }
        
        // Buscar si ya existe el permiso específico
        const existingPermission = await prisma.userPermission.findFirst({
          where: {
            userId: userId,
            permissionName: permissionName,
          },
        });
        
        // Actualizar o crear el permiso específico
        if (existingPermission) {
          return await prisma.userPermission.update({
            where: {
              id: existingPermission.id,
            },
            data: {
              granted: granted,
              updatedAt: new Date(),
            },
          });
        } else {
          return await prisma.userPermission.create({
            data: {
              userId: userId,
              permissionName: permissionName,
              granted: granted,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      } catch (error) {
        console.error('Error setting user permission:', error);
        throw new Error(`Failed to set user permission: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
  },
}; 