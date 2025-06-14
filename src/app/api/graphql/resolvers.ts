import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GraphQLScalarType, Kind } from 'graphql';

// Import individual resolver modules
import { appointmentResolvers } from './resolvers/appointments';
import { dashboardResolvers } from './resolvers/dashboard';
import { documentResolvers } from './resolvers/documents';
import { helpResolvers } from './resolvers/help';
import { notificationResolvers } from './resolvers/notifications';
import { performanceResolvers } from './resolvers/performance';
import { settingsResolvers } from './resolvers/settings';
import { timeEntryResolvers } from './resolvers/timeEntries';
import { taskResolvers } from './resolvers/tasks';
import { projectResolvers } from './resolvers/projects';
import { contactResolvers } from './resolvers/contact';
import { externalLinksResolvers } from './resolvers/externalLinks';
import { userResolvers } from './resolvers/users';
import { roleResolvers } from './resolvers/roles';
import { permissionResolvers } from './resolvers/permissions';
import { userPermissionResolvers } from './resolvers/userPermissions';
import { cmsResolvers } from './resolvers/cms';
import { menuResolvers } from './resolvers/menus';
import { formResolvers } from './resolvers/forms';
import { blogResolvers } from './resolvers/blogs';
import { calendarResolvers } from './resolvers/calendarResolvers';
import { ecommerceResolvers } from './resolvers/ecommerce';
import { reviewResolvers } from './resolvers/reviews';
import { GraphQLContext } from './route';
import { tenantResolvers } from './resolvers/tenants';
import { superAdminResolvers } from './resolvers/superAdmin';

// DateTime scalar type resolver
const dateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'Date custom scalar type',
  serialize(value) {
    if (value instanceof Date) {
      return value.toISOString(); // Convert outgoing Date to ISO string
    }
    return value;
  },
  parseValue(value) {
    if (typeof value === 'string') {
      return new Date(value); // Convert incoming string to Date
    }
    return null;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value); // Convert AST string to Date
    }
    return null;
  },
});

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Helper function to ensure system roles exist
async function ensureSystemRoles() {
  const defaultRoles = [
    // Global Platform Roles
    { name: 'SuperAdmin', description: 'Super Administrator with platform-wide access across all tenants' },
    { name: 'PlatformAdmin', description: 'Platform Administrator with system-wide access' },
    { name: 'SupportAgent', description: 'Support agent with customer assistance capabilities' },
    // Tenant Level Roles
    { name: 'TenantAdmin', description: 'Tenant Administrator with full tenant access' },
    { name: 'TenantManager', description: 'Tenant Manager with management capabilities' },
    { name: 'TenantUser', description: 'Basic tenant user with limited permissions' },
    // CMS Module Roles
    { name: 'ContentManager', description: 'Content Manager with full content management access' },
    { name: 'ContentEditor', description: 'Content Editor with content editing capabilities' },
    // HRMS Module Roles
    { name: 'HRAdmin', description: 'HR Administrator with full HR system access' },
    { name: 'HRManager', description: 'HR Manager with HR management capabilities' },
    { name: 'Employee', description: 'Employee with standard workspace access' },
    // Booking Module Roles
    { name: 'BookingAdmin', description: 'Booking Administrator with full booking system access' },
    { name: 'Agent', description: 'Booking agent with customer service capabilities' },
    { name: 'Customer', description: 'Customer with booking and service access' },
    // E-Commerce Module Roles
    { name: 'StoreAdmin', description: 'Store Administrator with full e-commerce access' },
    { name: 'StoreManager', description: 'Store Manager with store management capabilities' },
    // Future/Complementary Roles
    { name: 'FinanceManager', description: 'Finance Manager with financial system access' },
    { name: 'SalesRep', description: 'Sales Representative with sales capabilities' },
    { name: 'Instructor', description: 'Instructor with educational content access' },
    { name: 'ProjectLead', description: 'Project Lead with project management capabilities' },
  ];
  
  // Check if roles exist, if not create them
  for (const role of defaultRoles) {
    const existingRole = await prisma.roleModel.findFirst({
      where: { name: role.name }
    });
    
    if (!existingRole) {
      await prisma.roleModel.create({
        data: role
      });
      console.log(`Created default role: ${role.name}`);
    } else {
      console.log(`Role ${role.name} already exists`);
    }
  }
  
  // Return all roles
  return await prisma.roleModel.findMany();
}

// Helper function to ensure system permissions exist
async function ensureSystemPermissions() {
  // First ensure that default roles exist
  await ensureSystemRoles();
  
  const defaultPermissions = [
    { name: 'user:read', description: 'View user information' },
    { name: 'user:write', description: 'Create or update users' },
    { name: 'user:delete', description: 'Delete users' },
    { name: 'role:read', description: 'View roles' },
    { name: 'role:write', description: 'Create or update roles' },
    { name: 'role:delete', description: 'Delete roles' },
    { name: 'permission:read', description: 'View permissions' },
    { name: 'permission:write', description: 'Create or update permissions' },
    { name: 'permission:delete', description: 'Delete permissions' },
  ];

  // Check if permissions exist, if not create them
  for (const perm of defaultPermissions) {
    const existingPerm = await prisma.permission.findFirst({
      where: { name: perm.name }
    });

    if (!existingPerm) {
      await prisma.permission.create({
        data: perm
      });
      console.log(`Created default permission: ${perm.name}`);
    }
  }
  
  // Get admin role
  const adminRole = await prisma.roleModel.findFirst({
    where: { name: 'TenantAdmin' }
  });
  
  if (adminRole) {
    // Give admin role all permissions
    const allPermissions = await prisma.permission.findMany();
    
    for (const permission of allPermissions) {
      // Check if the permission is already assigned to the role
      const isAssigned = await prisma.roleModel.findFirst({
        where: {
          id: adminRole.id,
          permissions: {
            some: {
              id: permission.id
            }
          }
        }
      });
      
      if (!isAssigned) {
        await prisma.roleModel.update({
          where: { id: adminRole.id },
          data: {
            permissions: {
              connect: { id: permission.id }
            }
          }
        });
        console.log(`Assigned permission ${permission.name} to ADMIN role`);
      }
    }
  }
  
  // Get manager role
  const managerRole = await prisma.roleModel.findFirst({
    where: { name: 'TenantManager' }
  });
  
  if (managerRole) {
    // Give manager role read permissions
    const readPermissions = await prisma.permission.findMany({
      where: {
        name: {
          endsWith: ':read'
        }
      }
    });
    
    for (const permission of readPermissions) {
      // Check if the permission is already assigned to the role
      const isAssigned = await prisma.roleModel.findFirst({
        where: {
          id: managerRole.id,
          permissions: {
            some: {
              id: permission.id
            }
          }
        }
      });
      
      if (!isAssigned) {
        await prisma.roleModel.update({
          where: { id: managerRole.id },
          data: {
            permissions: {
              connect: { id: permission.id }
            }
          }
        });
        console.log(`Assigned permission ${permission.name} to MANAGER role`);
      }
    }
  }
}

// Merge all resolvers
const resolvers = {
  // Add DateTime scalar resolver
  DateTime: dateTimeScalar,
  
  // Add JSON scalar resolver
  JSON: {
    __serialize(value: unknown) {
      return value;
    },
  },
  
  Query: {
    // User queries
    me: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        // Try to get token from Authorization header first, then from cookies
        let token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          // Try to get token from cookies (check both auth-token and session-token)
          const cookies = context.req.headers.get('cookie');
          if (cookies) {
            const authTokenMatch = cookies.match(/auth-token=([^;]+)/) || cookies.match(/session-token=([^;]+)/);
            token = authTokenMatch ? authTokenMatch[1] : undefined;
          }
        }
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        console.log('Resolving me query with token:', token.substring(0, 10) + '...');
        const decoded = await verifyToken(token) as { userId: string; roleId?: string };
        
        if (!decoded || !decoded.userId) {
          console.error('Invalid token payload:', decoded);
          throw new Error('Invalid token');
        }
        
        // First check if user exists without selecting the problematic role field
        console.log('Checking if user exists with ID:', decoded.userId);
        const userExists = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true }
        });
        
        if (!userExists) {
          console.error('User not found for ID:', decoded.userId);
          throw new Error('User not found');
        }
        
        // Then get the user with role relationship and tenantId
        console.log('Fetching user with ID:', decoded.userId);
        try {
          const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phoneNumber: true,
              roleId: true,
              userTenants: {
                select: {
                  tenantId: true,
                  role: true
                }
              },
              role: {
                select: {
                  id: true,
                  name: true,
                  description: true
                }
              },
              createdAt: true,
              updatedAt: true,
            },
          });
          
          if (!user) {
            throw new Error('User not found');
          }
          
          console.log('User found:', user?.email, 'with role:', user?.role, 'tenants:', user?.userTenants.map(tenant => tenant.tenantId));
          
          // Mantener la estructura del rol como un objeto para que coincida con la definición del tipo
          return {
            ...user,
            // En lugar de devolver role: roleName, devolvemos el objeto role completo
            role: user.role || { id: "default", name: "TenantUser", description: null }
          };
        } catch (prismaError) {
          console.error('Prisma error:', prismaError);
          throw new Error('Database error');
        }
      } catch (error) {
        console.error('GraphQL resolver error:', error);
        throw new Error('Invalid token');
      }
    },

    // Get a single user by ID
    user: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string; roleId?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Check if requester is admin or manager
        const requester = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        const requesterRole = requester?.role?.name || 'TenantUser';
        
        // Only admins and managers can see any user
        // Normal users can only see themselves
        if (!['TenantAdmin', 'PlatformAdmin', 'SuperAdmin', 'TenantManager', 'HRAdmin', 'HRManager'].includes(requesterRole) && decoded.userId !== args.id) {
          throw new Error('Unauthorized: You can only view your own profile');
        }
        
        // Get the requested user
        const user = await prisma.user.findUnique({
          where: { id: args.id },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            isActive: true,
            roleId: true,
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            createdAt: true,
            updatedAt: true,
          }
        });
        
        if (!user) {
          throw new Error(`User with ID ${args.id} not found`);
        }
        
        // Return user with formatted dates
        return {
          ...user,
          role: user.role || { id: "default", name: "TenantUser", description: null },
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        };
      } catch (error) {
        console.error('Get user error:', error);
        throw error;
      }
    },
    
    // Get all users - admin and manager access
    users: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string; roleId?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Check if user is an admin or manager by fetching the user and their role
        const currentUser = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            userTenants: {
              select: {
                tenantId: true,
                role: true
              }
            },
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        const userRole = currentUser?.role?.name || 'TenantUser';
        
        // Allow admins, managers, and super admins to access this endpoint
        if (!['TenantAdmin', 'PlatformAdmin', 'SuperAdmin', 'TenantManager', 'HRAdmin', 'HRManager'].includes(userRole)) {
          throw new Error('Unauthorized: Admin, Manager, or Super Admin access required');
        }
        
        // Build the where clause based on user role
        let whereClause = {};
        
        if (userRole === 'SuperAdmin') {
          // Super admins can see all users across all tenants
          whereClause = {};
        } else if (userRole === 'ADMIN' || userRole === 'MANAGER') {
          // Regular admins and managers can only see users from their tenant
          if (!currentUser?.userTenants.length) {
            throw new Error('Admin/Manager user must be associated with a tenant');
          }
          whereClause = {
            userTenants: {
              some: {
                tenantId: currentUser.userTenants[0].tenantId
              }
            }
          };
        }
        
        // Get users with the appropriate scope
        const users = await prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            roleId: true,
            isActive: true,
            userTenants: {
              select: {
                tenantId: true,
                role: true
              }
            },
            role: {
              select: {
                id: true,
                name: true,
                description: true
              }
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc'
          }
        });
        
        // Mantener la estructura del rol como un objeto para que coincida con la definición del tipo
        return users.map((user: {
          id: string;
          email: string;
          firstName?: string | null;
          lastName?: string | null;
          phoneNumber?: string | null;
          roleId?: string | null;
          isActive?: boolean;
          userTenants?: {
            tenantId: string;
            role: string;
          }[];
          role?: {
            id: string;
            name: string;
            description?: string | null;
          } | null;
          createdAt: Date;
          updatedAt: Date;
        }) => ({
          ...user,
          // Asegurar que el role es siempre un objeto completo
          role: user.role || { id: "default", name: "TenantUser", description: null },
          createdAt: user.createdAt.toISOString(),
          updatedAt: user.updatedAt.toISOString()
        }));
      } catch (error) {
        console.error('Get users error:', error);
        throw error;
      }
    },
    
    // Role and permission queries
    role: async (_parent: unknown, args: { id: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        return prisma.roleModel.findUnique({
          where: { id: args.id }
        });
      } catch (error) {
        console.error('Get role error:', error);
        throw error;
      }
    },
    
    roles: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Ensure default roles exist
        await ensureSystemRoles();
        
        // Add more detailed logging for debugging
        console.log('Fetching roles with count information');
        
        try {
          // Try to get roles with count data first
          const rolesWithCount = await prisma.roleModel.findMany({
            include: {
              _count: {
                select: {
                  users: true,
                  permissions: true
                }
              }
            }
          });
          console.log('Successfully fetched roles with count data');
          return rolesWithCount;
        } catch (countError) {
          // If that fails, fall back to just getting the roles without count
          console.error('Failed to get roles with count, falling back to basic query:', countError);
          return prisma.roleModel.findMany();
        }
      } catch (error) {
        console.error('Get roles error:', error);
        throw error;
      }
    },
    
    rolesWithCounts: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Ensure default roles exist
        await ensureSystemRoles();
        
        // Get all roles
        const roles = await prisma.roleModel.findMany();
        
        // For each role, get user count and permission count
        const rolesWithCounts = await Promise.all(
          roles.map(async (role: {
            id: string;
            name: string;
            description: string | null;
            createdAt: Date;
            updatedAt: Date;
          }) => {
            // Get user count
            const userCount = await prisma.user.count({
              where: {
                roleId: role.id
              }
            });
            
            // Get permission count
            const permissionCount = await prisma.permission.count({
              where: {
                roles: {
                  some: {
                    id: role.id
                  }
                }
              }
            });
            
            return {
              ...role,
              userCount,
              permissionCount
            };
          })
        );
        
        return rolesWithCounts;
      } catch (error) {
        console.error('Get roles with counts error:', error);
        throw error;
      }
    },
    
    permissions: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Ensure default permissions exist
        await ensureSystemPermissions();
        
        return prisma.permission.findMany();
      } catch (error) {
        console.error('Get permissions error:', error);
        throw error;
      }
    },
    
    rolePermissions: async (_parent: unknown, args: { roleId: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        return prisma.permission.findMany({
          where: { 
            roles: {
              some: {
                id: args.roleId
              }
            }
          }
        });
      } catch (error) {
        console.error('Get role permissions error:', error);
        throw error;
      }
    },
    
    // Include tenant queries
    tenants: tenantResolvers.Query.tenants,
    tenant: tenantResolvers.Query.tenant,
    
    // Include other Query resolvers from imported modules - using type assertion
    ...((appointmentResolvers.Query as object) || {}),
    ...((dashboardResolvers.Query as object) || {}),
    ...((documentResolvers.Query as object) || {}),
    ...((helpResolvers.Query as object) || {}),
    ...((notificationResolvers.Query as object) || {}),
    ...((performanceResolvers.Query as object) || {}),
    ...((settingsResolvers.Query as object) || {}),
    ...((timeEntryResolvers.Query as object) || {}),
    ...((taskResolvers.Query as object) || {}),
    ...((projectResolvers.Query as object) || {}),
    ...((contactResolvers.Query as object) || {}),
    ...((externalLinksResolvers.Query as object) || {}),
    ...((userResolvers.Query as object) || {}),
    ...((roleResolvers.Query as object) || {}),
    ...((permissionResolvers.Query as object) || {}),
    ...((userPermissionResolvers.Query as object) || {}),
    ...((formResolvers.Query as object) || {}),
    ...((blogResolvers.Query as object) || {}),
    ...((calendarResolvers.Query as object) || {}),
    ...((superAdminResolvers.Query as object) || {}),
    
    // Add menu queries
    menus: menuResolvers.Query.menus,
    menu: menuResolvers.Query.menu,
    menuByLocation: menuResolvers.Query.menuByLocation,
    menuByName: menuResolvers.Query.menuByName,
    pages: menuResolvers.Query.pages,
    
    // Add explicit fallback for projects query to ensure it exists
    projects: async (_parent: unknown, _args: unknown, context: GraphQLContext) => {
      try {
        if (projectResolvers.Query.projects) {
          return await projectResolvers.Query.projects(_parent, _args, context);
        } else {
          console.error("Project resolver missing - returning fallback empty array");
          return [];
        }
      } catch (error) {
        console.error("Error in projects resolver fallback:", error);
        return [];
      }
    },
    
    // Add CMS queries explicitly
    getSectionComponents: cmsResolvers.Query.getSectionComponents,
    getAllCMSSections: cmsResolvers.Query.getAllCMSSections,
    getAllCMSComponents: cmsResolvers.Query.getAllCMSComponents,
    getCMSComponent: cmsResolvers.Query.getCMSComponent,
    getCMSComponentsByType: cmsResolvers.Query.getCMSComponentsByType,
    getAllCMSPages: cmsResolvers.Query.getAllCMSPages,
    page: cmsResolvers.Query.page,
    getPageBySlug: cmsResolvers.Query.getPageBySlug,
    getDefaultPage: cmsResolvers.Query.getDefaultPage,
    getPagesUsingSectionId: cmsResolvers.Query.getPagesUsingSectionId,

    // Add blog queries now that we have the blog resolver
    blogs: blogResolvers.Query.blogs,
    blog: blogResolvers.Query.blog,
    post: blogResolvers.Query.post,
    posts: blogResolvers.Query.posts,
    postBySlug: blogResolvers.Query.postBySlug,

    // Add e-commerce queries
    shops: ecommerceResolvers.Query.shops,
    shop: ecommerceResolvers.Query.shop,
    products: ecommerceResolvers.Query.products,
    product: ecommerceResolvers.Query.product,
    productBySku: ecommerceResolvers.Query.productBySku,
    productCategories: ecommerceResolvers.Query.productCategories,
    productCategory: ecommerceResolvers.Query.productCategory,
    productCategoryBySlug: ecommerceResolvers.Query.productCategoryBySlug,
    currencies: ecommerceResolvers.Query.currencies,
    currency: ecommerceResolvers.Query.currency,
    currencyByCode: ecommerceResolvers.Query.currencyByCode,
    taxes: ecommerceResolvers.Query.taxes,
    tax: ecommerceResolvers.Query.tax,
    
    // Order queries
    orders: ecommerceResolvers.Query.orders,
    order: ecommerceResolvers.Query.order,
    
    // Payment queries
    paymentProviders: ecommerceResolvers.Query.paymentProviders,
    paymentProvider: ecommerceResolvers.Query.paymentProvider,
    paymentMethods: ecommerceResolvers.Query.paymentMethods,
    paymentMethod: ecommerceResolvers.Query.paymentMethod,
    payments: ecommerceResolvers.Query.payments,
    payment: ecommerceResolvers.Query.payment,
    
    // Customer queries
    customers: ecommerceResolvers.Query.customers,
    customer: ecommerceResolvers.Query.customer,
    customerByEmail: ecommerceResolvers.Query.customerByEmail,
    customerStats: ecommerceResolvers.Query.customerStats,
    
    // Discount queries
    discounts: ecommerceResolvers.Query.discounts,
    discount: ecommerceResolvers.Query.discount,
    discountByCode: ecommerceResolvers.Query.discountByCode,
    validateDiscount: ecommerceResolvers.Query.validateDiscount,
    
    // Review queries (additional ones)
    review: ecommerceResolvers.Query.review,
    
    // Shipping queries
    shippingProviders: async () => {
      try {
        const providers = await prisma.shippingProvider.findMany({
          include: {
            shippingMethods: {
              include: {
                shippingRates: {
                  include: {
                    shippingZone: true
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        });
        
        return providers;
      } catch (error) {
        console.error('Error fetching shipping providers:', error);
        return [];
      }
    },
    
    shippingMethods: async () => {
      try {
        const methods = await prisma.shippingMethod.findMany({
          include: {
            provider: true,
            shippingRates: {
              include: {
                shippingZone: true
              }
            }
          },
          orderBy: { name: 'asc' }
        });
        
        return methods;
      } catch (error) {
        console.error('Error fetching shipping methods:', error);
        return [];
      }
    },
    
    shippingZones: async () => {
      try {
        const zones = await prisma.shippingZone.findMany({
          include: {
            shippingRates: {
              include: {
                shippingMethod: {
                  include: {
                    provider: true
                  }
                }
              }
            }
          },
          orderBy: { name: 'asc' }
        });
        
        return zones;
      } catch (error) {
        console.error('Error fetching shipping zones:', error);
        return [];
      }
    },
    
    shipments: async () => {
      try {
        const shipments = await prisma.shipment.findMany({
          include: {
            order: {
              include: {
                currency: true,
                shop: true
              }
            },
            shippingMethod: {
              include: {
                provider: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        return shipments;
      } catch (error) {
        console.error('Error fetching shipments:', error);
        return [];
      }
    },
    
    // Review queries
    reviews: async () => {
      try {
        const reviews = await prisma.review.findMany({
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        return reviews;
      } catch (error) {
        console.error('Error fetching reviews:', error);
        return [];
      }
    },
    
    reviewsByProduct: async (_parent: unknown, { productId }: { productId: string }) => {
      try {
        const reviews = await prisma.review.findMany({
          where: { 
            productId,
            isApproved: true
          },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        return reviews;
      } catch (error) {
        console.error('Error fetching reviews by product:', error);
        return [];
      }
    },
    
    reviewsByCustomer: async (_parent: unknown, { customerId }: { customerId: string }) => {
      try {
        const reviews = await prisma.review.findMany({
          where: { customerId },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        return reviews;
      } catch (error) {
        console.error('Error fetching reviews by customer:', error);
        return [];
      }
    },
    
    reviewStats: async (_parent: unknown, { productId }: { productId?: string }) => {
      try {
        const where = productId ? { productId } : {};
        
        const [
          totalReviews,
          averageRating,
          ratingDistribution,
          verifiedReviews,
          pendingReviews
        ] = await Promise.all([
          prisma.review.count({ where: { ...where, isApproved: true } }),
          prisma.review.aggregate({
            where: { ...where, isApproved: true },
            _avg: { rating: true }
          }),
          prisma.review.groupBy({
            by: ['rating'],
            where: { ...where, isApproved: true },
            _count: { rating: true }
          }),
          prisma.review.count({ where: { ...where, isApproved: true, isVerified: true } }),
          prisma.review.count({ where: { ...where, isApproved: false } })
        ]);
        
        const ratingCounts = [1, 2, 3, 4, 5].map(rating => {
          const found = ratingDistribution.find((r: { rating: number; _count: { rating: number } }) => r.rating === rating);
          return found ? found._count.rating : 0;
        });
        
        return {
          totalReviews,
          averageRating: averageRating._avg.rating || 0,
          ratingDistribution: ratingCounts,
          verifiedReviews,
          pendingReviews
        };
      } catch (error) {
        console.error('Error fetching review stats:', error);
        return {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: [0, 0, 0, 0, 0],
          verifiedReviews: 0,
          pendingReviews: 0
        };
      }
    },
    
    pendingReviews: async () => {
      try {
        const reviews = await prisma.review.findMany({
          where: { isApproved: false },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: {
              orderBy: { order: 'asc' }
            },
            response: {
              include: {
                responder: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        });
        
        return reviews;
      } catch (error) {
        console.error('Error fetching pending reviews:', error);
        return [];
      }
    },
  },
  
  Mutation: {
    // Auth mutations
    login: async (_parent: unknown, args: { email: string, password: string }) => {
      const { email, password: inputPassword } = args;
      
      const user = await prisma.user.findUnique({ 
        where: { email },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          password: true,
          roleId: true,
          userTenants: {
            select: {
              tenantId: true,
              role: true
            }
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          createdAt: true,
          updatedAt: true,
        }
      });
      
      if (!user) {
        throw new Error('No user found with this email');
      }
      
      if (!user.password) {
        throw new Error('Invalid user account');
      }
      
      const valid = await bcrypt.compare(inputPassword, user.password);
      
      if (!valid) {
        throw new Error('Invalid password');
      }
      
      // Get role name and ID for the token
      const roleName = user.role?.name || 'TenantUser';
      console.log('Login successful for:', email, 'with role:', roleName);
      
      // Include both roleId and role name in the token
      const token = jwt.sign({ 
        userId: user.id, 
        roleId: user.roleId,
        role: roleName 
      }, JWT_SECRET, { expiresIn: '7d' });
      
      // Remove password from returned user object and return role as object
      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        userTenants: user.userTenants, // Include tenantId
        role: user.role || { id: '', name: 'TenantUser', description: null }, // Return role as object
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      // Return user with role as object
      return {
        token,
        user: userWithoutPassword,
      };
    },
    
    register: async (_parent: unknown, args: { 
      email: string, 
      password: string, 
      firstName: string, 
      lastName: string, 
      phoneNumber?: string 
    }) => {
      const { email, password, firstName, lastName, phoneNumber } = args;
      
      const existingUser = await prisma.user.findUnique({ where: { email } });
      
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Find the TenantUser role
      const userRole = await prisma.roleModel.findFirst({
        where: { name: 'TenantUser' }
      });
      
      if (!userRole) {
        // Create default roles if they don't exist
        await ensureSystemRoles();
      }
      
      // Try to get the role again
      const defaultRole = await prisma.roleModel.findFirst({
        where: { name: 'TenantUser' }
      });
      
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phoneNumber,
          roleId: defaultRole?.id, // Connect to the USER role
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phoneNumber: true,
          roleId: true,
          userTenants: {
            select: {
              tenantId: true,
              role: true
            }
          },
          role: {
            select: {
              id: true,
              name: true,
              description: true
            }
          },
          createdAt: true,
          updatedAt: true,
        }
      });
      
      // Get role name
      const roleName = user.role?.name || 'TenantUser';
      console.log('User registered:', email, 'with role:', roleName);
      
      // Include both roleId and role name in token
      const token = jwt.sign({ 
        userId: user.id, 
        roleId: user.roleId, 
        role: roleName 
      }, JWT_SECRET, { expiresIn: '7d' });
      
      const userWithoutPassword = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        userTenants: user.userTenants,
        role: user.role || { id: '', name: 'TenantUser', description: null },
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };
      
      return {
        token,
        user: userWithoutPassword,
      };
    },

    // Include tenant mutations
    createTenant: tenantResolvers.Mutation.createTenant,
    registerUserWithTenant: tenantResolvers.Mutation.registerUserWithTenant,

    // Include other Mutation resolvers - using type assertion for safety
    ...('Mutation' in appointmentResolvers ? (appointmentResolvers.Mutation as object) : {}),
    ...('Mutation' in dashboardResolvers ? (dashboardResolvers.Mutation as object) : {}),
    ...('Mutation' in documentResolvers ? (documentResolvers.Mutation as object) : {}),
    ...('Mutation' in helpResolvers ? (helpResolvers.Mutation as object) : {}),
    ...('Mutation' in notificationResolvers ? (notificationResolvers.Mutation as object) : {}),
    ...('Mutation' in performanceResolvers ? (performanceResolvers.Mutation as object) : {}),
    ...('Mutation' in settingsResolvers ? (settingsResolvers.Mutation as object) : {}),
    ...('Mutation' in timeEntryResolvers ? (timeEntryResolvers.Mutation as object) : {}),
    ...('Mutation' in taskResolvers ? (taskResolvers.Mutation as object) : {}),
    ...('Mutation' in projectResolvers ? (projectResolvers.Mutation as object) : {}),
    ...('Mutation' in contactResolvers ? (contactResolvers.Mutation as object) : {}),
    ...('Mutation' in externalLinksResolvers ? (externalLinksResolvers.Mutation as object) : {}),
    ...('Mutation' in userResolvers ? (userResolvers.Mutation as object) : {}),
    ...('Mutation' in roleResolvers ? (roleResolvers.Mutation as object) : {}),
    ...('Mutation' in permissionResolvers ? (permissionResolvers.Mutation as object) : {}),
    ...('Mutation' in userPermissionResolvers ? (userPermissionResolvers.Mutation as object) : {}),
    ...('Mutation' in formResolvers ? (formResolvers.Mutation as object) : {}),
    ...('Mutation' in blogResolvers ? (blogResolvers.Mutation as object) : {}),
    ...('Mutation' in calendarResolvers ? (calendarResolvers.Mutation as object) : {}),
    ...('Mutation' in superAdminResolvers ? (superAdminResolvers.Mutation as object) : {}),

    // Role and permission mutations
    createRole: async (_parent: unknown, { input }: { input: { name: string; description?: string } }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; roleId?: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Only admin can create roles - check using relationship
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (!['TenantAdmin', 'PlatformAdmin', 'SuperAdmin'].includes(user?.role?.name || '')) {
          throw new Error('Unauthorized: Only admins can create roles');
        }
        
        const { name, description } = input;
        
        const role = await prisma.roleModel.create({
          data: {
            name,
            description
          }
        });
        
        return role;
      } catch (error) {
        console.error('Create role error:', error);
        throw error;
      }
    },

    createPermission: async (_parent: unknown, { input }: { input: { name: string; description?: string; roleId?: string } }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; roleId?: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Only admin can create permissions - check via relationship
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (!['TenantAdmin', 'PlatformAdmin', 'SuperAdmin'].includes(user?.role?.name || '')) {
          throw new Error('Unauthorized: Only admins can create permissions');
        }
        
        const { name, description, roleId } = input;
        
        // If roleId is provided, we'll connect this permission to that role
        const permissionData: { 
          name: string; 
          description?: string; 
          roles?: { 
            connect: { id: string } 
          }
        } = {
          name,
          description
        };
        
        if (roleId) {
          permissionData.roles = {
            connect: { id: roleId }
          };
        }
        
        const permission = await prisma.permission.create({
          data: permissionData
        });
        
        return permission;
      } catch (error) {
        console.error('Create permission error:', error);
        throw error;
      }
    },

    assignPermissionToRole: async (_parent: unknown, { roleId, permissionId }: { roleId: string; permissionId: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; roleId?: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Only admin can assign permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (!['TenantAdmin', 'PlatformAdmin', 'SuperAdmin'].includes(user?.role?.name || '')) {
          throw new Error('Unauthorized: Only admins can assign permissions to roles');
        }
        
        // First, check if both the role and permission exist
        const role = await prisma.roleModel.findUnique({
          where: { id: roleId }
        });
        
        if (!role) {
          throw new Error('Role not found');
        }
        
        const permission = await prisma.permission.findUnique({
          where: { id: permissionId }
        });
        
        if (!permission) {
          throw new Error('Permission not found');
        }
        
        // Add the permission to the role
        await prisma.roleModel.update({
          where: { id: roleId },
          data: {
            permissions: {
              connect: { id: permissionId }
            }
          }
        });
        
        return permission;
      } catch (error) {
        console.error('Assign permission error:', error);
        throw error;
      }
    },

    removePermissionFromRole: async (_parent: unknown, { roleId, permissionId }: { roleId: string; permissionId: string }, context: GraphQLContext) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        const decoded = await verifyToken(token) as { userId: string; roleId?: string; role?: string };
        
        if (!decoded || !decoded.userId) {
          throw new Error('Invalid token');
        }
        
        // Only admin can remove permissions
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: {
            role: {
              select: {
                name: true
              }
            }
          }
        });
        
        if (!['TenantAdmin', 'PlatformAdmin', 'SuperAdmin'].includes(user?.role?.name || '')) {
          throw new Error('Unauthorized: Only admins can remove permissions from roles');
        }
        
        // First, check if both the role and permission exist
        const role = await prisma.roleModel.findUnique({
          where: { id: roleId }
        });
        
        if (!role) {
          throw new Error('Role not found');
        }
        
        const permission = await prisma.permission.findUnique({
          where: { id: permissionId }
        });
        
        if (!permission) {
          throw new Error('Permission not found');
        }
        
        // Remove the permission from the role
        await prisma.roleModel.update({
          where: { id: roleId },
          data: {
            permissions: {
              disconnect: { id: permissionId }
            }
          }
        });
        
        return true;
      } catch (error) {
        console.error('Remove permission error:', error);
        throw error;
      }
    },

    // Settings mutations
    
    // Add CMS mutations explicitly
    saveSectionComponents: cmsResolvers.Mutation.saveSectionComponents,
    deleteCMSSection: cmsResolvers.Mutation.deleteCMSSection,
    updateCMSSection: cmsResolvers.Mutation.updateCMSSection,
    createCMSSection: cmsResolvers.Mutation.createCMSSection,
    createCMSComponent: cmsResolvers.Mutation.createCMSComponent,
    updateCMSComponent: cmsResolvers.Mutation.updateCMSComponent,
    deleteCMSComponent: cmsResolvers.Mutation.deleteCMSComponent,
    createPage: cmsResolvers.Mutation.createPage,
    updatePage: cmsResolvers.Mutation.updatePage,
    deletePage: cmsResolvers.Mutation.deletePage,
    associateSectionToPage: cmsResolvers.Mutation.associateSectionToPage,
    dissociateSectionFromPage: cmsResolvers.Mutation.dissociateSectionFromPage,

    // Add menu mutations
    createMenu: menuResolvers.Mutation.createMenu,
    updateMenu: menuResolvers.Mutation.updateMenu,
    deleteMenu: menuResolvers.Mutation.deleteMenu,
    createMenuItem: menuResolvers.Mutation.createMenuItem,
    updateMenuItem: menuResolvers.Mutation.updateMenuItem,
    deleteMenuItem: menuResolvers.Mutation.deleteMenuItem,
    updateMenuItemOrder: menuResolvers.Mutation.updateMenuItemOrder,
    updateMenuItemsOrder: menuResolvers.Mutation.updateMenuItemsOrder,
    updateHeaderStyle: menuResolvers.Mutation.updateHeaderStyle,
    updateFooterStyle: menuResolvers.Mutation.updateFooterStyle,

    // Add blog mutations
    createBlog: blogResolvers.Mutation.createBlog,
    updateBlog: blogResolvers.Mutation.updateBlog,
    deleteBlog: blogResolvers.Mutation.deleteBlog,
    createPost: blogResolvers.Mutation.createPost,
    updatePost: blogResolvers.Mutation.updatePost,
    deletePost: blogResolvers.Mutation.deletePost,

    // Add e-commerce mutations
    createShop: ecommerceResolvers.Mutation.createShop,
    createProduct: ecommerceResolvers.Mutation.createProduct,
    updateProduct: ecommerceResolvers.Mutation.updateProduct,
    deleteProduct: ecommerceResolvers.Mutation.deleteProduct,
    createCurrency: ecommerceResolvers.Mutation.createCurrency,
    createProductCategory: ecommerceResolvers.Mutation.createProductCategory,
    updateProductCategory: ecommerceResolvers.Mutation.updateProductCategory,
    deleteProductCategory: ecommerceResolvers.Mutation.deleteProductCategory,
    
    // Order mutations
    createOrder: ecommerceResolvers.Mutation.createOrder,
    updateOrder: ecommerceResolvers.Mutation.updateOrder,
    deleteOrder: ecommerceResolvers.Mutation.deleteOrder,
    
    // Customer mutations
    createCustomer: ecommerceResolvers.Mutation.createCustomer,
    updateCustomer: ecommerceResolvers.Mutation.updateCustomer,
    deleteCustomer: ecommerceResolvers.Mutation.deleteCustomer,
    
    // Payment mutations
    createPaymentProvider: ecommerceResolvers.Mutation.createPaymentProvider,
    updatePaymentProvider: ecommerceResolvers.Mutation.updatePaymentProvider,
    deletePaymentProvider: ecommerceResolvers.Mutation.deletePaymentProvider,
    createPaymentMethod: ecommerceResolvers.Mutation.createPaymentMethod,
    updatePaymentMethod: ecommerceResolvers.Mutation.updatePaymentMethod,
    deletePaymentMethod: ecommerceResolvers.Mutation.deletePaymentMethod,
    createPayment: ecommerceResolvers.Mutation.createPayment,
    updatePayment: ecommerceResolvers.Mutation.updatePayment,
    deletePayment: ecommerceResolvers.Mutation.deletePayment,
    
    // Review mutations
    createReview: reviewResolvers.Mutation.createReview,
    updateReview: reviewResolvers.Mutation.updateReview,
    deleteReview: reviewResolvers.Mutation.deleteReview,
    approveReview: reviewResolvers.Mutation.approveReview,
    rejectReview: reviewResolvers.Mutation.rejectReview,
    reportReview: reviewResolvers.Mutation.reportReview,
    markReviewHelpful: reviewResolvers.Mutation.markReviewHelpful,
    createReviewResponse: reviewResolvers.Mutation.createReviewResponse,
    updateReviewResponse: reviewResolvers.Mutation.updateReviewResponse,
    deleteReviewResponse: reviewResolvers.Mutation.deleteReviewResponse,
  },

  // Include form type resolvers
  Form: formResolvers.Form,
  FormStep: formResolvers.FormStep,
  FormField: formResolvers.FormField,
  FormSubmission: formResolvers.FormSubmission,

  // Add the MenuItem resolver for nested children
  MenuItem: menuResolvers.MenuItem,

  // Add calendar field resolvers
  Booking: calendarResolvers.Booking,
  Service: calendarResolvers.Service,
  StaffProfile: calendarResolvers.StaffProfile,
  Location: calendarResolvers.Location,
  StaffSchedule: calendarResolvers.StaffSchedule,

  // Add e-commerce type resolvers
  Shop: ecommerceResolvers.Shop,
  Product: ecommerceResolvers.Product,
  ProductCategory: ecommerceResolvers.ProductCategory,
  Price: ecommerceResolvers.Price,
  Tax: ecommerceResolvers.Tax,
  
  // Order type resolvers
  Order: ecommerceResolvers.Order,
  OrderItem: ecommerceResolvers.OrderItem,
  
  // Payment type resolvers
  PaymentProvider: ecommerceResolvers.PaymentProvider,
  PaymentMethod: ecommerceResolvers.PaymentMethod,
  Payment: ecommerceResolvers.Payment,
  
  // Customer type resolvers
  Customer: ecommerceResolvers.Customer,
  
  // Review type resolvers
  Review: ecommerceResolvers.Review,

  // Add tenant type resolvers
  Tenant: tenantResolvers.Tenant,
  TenantDetails: tenantResolvers.TenantDetails,

  // Add user type resolvers
  User: tenantResolvers.User,
};

export default resolvers; 