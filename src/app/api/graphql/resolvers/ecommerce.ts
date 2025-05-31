import { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

// Define types for Prisma entities with relations
type ShopWithRelations = {
  id: string;
  name: string;
  defaultCurrencyId: string;
  adminUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  defaultCurrency: unknown;
  acceptedCurrencies: Array<{ currency: unknown }>;
  adminUser: unknown;
  products: unknown[];
  _count: { products: number };
};

type ProductCategoryWithCount = {
  id: string;
  name: string;
  description?: string | null;
  slug: string;
  parentId?: string | null;
  shopId?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  _count: { products: number };
};

interface Context {
  req: NextRequest;
}

interface ShopFilterInput {
  search?: string;
  adminUserId?: string;
  currencyId?: string;
}

interface ProductFilterInput {
  search?: string;
  shopId?: string;
  categoryId?: string;
  inStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductCategoryFilterInput {
  search?: string;
  shopId?: string;
  parentId?: string;
  isActive?: boolean;
}

interface PaginationInput {
  limit?: number;
  offset?: number;
  page?: number;
  pageSize?: number;
}

interface OrderFilterInput {
  search?: string;
  shopId?: string;
  customerId?: string;
  status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
  dateFrom?: string;
  dateTo?: string;
}

interface PaymentProviderFilterInput {
  search?: string;
  type?: string;
  isActive?: boolean;
}

interface PaymentMethodFilterInput {
  search?: string;
  providerId?: string;
  type?: string;
  isActive?: boolean;
}

interface PaymentFilterInput {
  search?: string;
  orderId?: string;
  status?: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED' | 'PARTIALLY_REFUNDED';
  providerId?: string;
  paymentMethodId?: string;
  dateFrom?: string;
  dateTo?: string;
}

type CustomerWithRelations = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phoneNumber?: string | null;
  profileImageUrl?: string | null;
  isActive: boolean;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  orders: Array<{
    id: string;
    totalAmount: number;
    createdAt: Date;
    items: unknown[];
  }>;
  reviews: unknown[];
  _count: {
    orders: number;
    reviews: number;
  };
};

export const ecommerceResolvers = {
  Query: {
    // Shop queries
    shops: async (
      _parent: unknown,
      { filter, pagination }: { filter?: ShopFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.name = {
            contains: filter.search,
            mode: 'insensitive'
          };
        }

        if (filter?.adminUserId) {
          where.adminUserId = filter.adminUserId;
        }

        if (filter?.currencyId) {
          where.defaultCurrencyId = filter.currencyId;
        }

        const shops = await prisma.shop.findMany({
          where,
          include: {
            defaultCurrency: true,
            acceptedCurrencies: {
              include: {
                currency: true
              }
            },
            adminUser: true,
            products: true,
            _count: {
              select: {
                products: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return shops.map((shop: ShopWithRelations) => ({
          ...shop,
          acceptedCurrencies: shop.acceptedCurrencies.map((ac: { currency: unknown }) => ac.currency)
        }));
      } catch (error) {
        console.error('Error fetching shops:', error);
        throw error;
      }
    },

    shop: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const shop = await prisma.shop.findUnique({
          where: { id },
          include: {
            defaultCurrency: true,
            acceptedCurrencies: {
              include: {
                currency: true
              }
            },
            adminUser: true,
            products: {
              include: {
                prices: {
                  include: {
                    currency: true
                  }
                }
              }
            }
          }
        });

        if (!shop) {
          throw new Error('Shop not found');
        }

        return {
          ...shop,
          acceptedCurrencies: shop.acceptedCurrencies.map((ac: { currency: unknown }) => ac.currency)
        };
      } catch (error) {
        console.error('Error fetching shop:', error);
        throw error;
      }
    },

    // Product queries
    products: async (
      _parent: unknown,
      { filter, pagination }: { filter?: ProductFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { sku: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        if (filter?.shopId) {
          where.shopId = filter.shopId;
        }

        if (filter?.inStock !== undefined) {
          if (filter.inStock) {
            where.stockQuantity = { gt: 0 };
          } else {
            where.stockQuantity = { lte: 0 };
          }
        }

        const products = await prisma.product.findMany({
          where,
          include: {
            shop: true,
            prices: {
              include: {
                currency: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return products;
      } catch (error) {
        console.error('Error fetching products:', error);
        throw error;
      }
    },

    product: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const product = await prisma.product.findUnique({
          where: { id },
          include: {
            shop: true,
            prices: {
              include: {
                currency: true
              }
            }
          }
        });

        if (!product) {
          throw new Error('Product not found');
        }

        return product;
      } catch (error) {
        console.error('Error fetching product:', error);
        throw error;
      }
    },

    productBySku: async (_parent: unknown, { sku }: { sku: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const product = await prisma.product.findUnique({
          where: { sku },
          include: {
            shop: true,
            prices: {
              include: {
                currency: true
              }
            }
          }
        });

        if (!product) {
          throw new Error('Product not found');
        }

        return product;
      } catch (error) {
        console.error('Error fetching product by SKU:', error);
        throw error;
      }
    },

    // Currency queries
    currencies: async (_parent: unknown, _args: unknown, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const currencies = await prisma.currency.findMany({
          orderBy: { code: 'asc' }
        });

        return currencies;
      } catch (error) {
        console.error('Error fetching currencies:', error);
        throw error;
      }
    },

    currency: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const currency = await prisma.currency.findUnique({
          where: { id }
        });

        if (!currency) {
          throw new Error('Currency not found');
        }

        return currency;
      } catch (error) {
        console.error('Error fetching currency:', error);
        throw error;
      }
    },

    currencyByCode: async (_parent: unknown, { code }: { code: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const currency = await prisma.currency.findUnique({
          where: { code }
        });

        if (!currency) {
          throw new Error('Currency not found');
        }

        return currency;
      } catch (error) {
        console.error('Error fetching currency by code:', error);
        throw error;
      }
    },

    // Tax queries
    taxes: async (_parent: unknown, { shopId }: { shopId?: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};
        if (shopId) {
          where.shopId = shopId;
        }

        const taxes = await prisma.tax.findMany({
          where,
          include: {
            shop: true
          },
          orderBy: { name: 'asc' }
        });

        return taxes;
      } catch (error) {
        console.error('Error fetching taxes:', error);
        throw error;
      }
    },

    tax: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const tax = await prisma.tax.findUnique({
          where: { id },
          include: {
            shop: true
          }
        });

        if (!tax) {
          throw new Error('Tax not found');
        }

        return tax;
      } catch (error) {
        console.error('Error fetching tax:', error);
        throw error;
      }
    },

    // Order queries
    orders: async (
      _parent: unknown,
      { filter, pagination }: { filter?: OrderFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        console.log('Orders resolver called with filter:', filter, 'pagination:', pagination);
        
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          console.error('No token provided for orders query');
          return []; // Return empty array instead of throwing
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          console.error('Invalid token for orders query');
          return []; // Return empty array instead of throwing
        }

        console.log('User authenticated:', decoded.userId);

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { customerName: { contains: filter.search, mode: 'insensitive' } },
            { customerEmail: { contains: filter.search, mode: 'insensitive' } },
            { id: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        if (filter?.shopId) {
          where.shopId = filter.shopId;
        }

        if (filter?.customerId) {
          where.customerId = filter.customerId;
        }

        if (filter?.status) {
          where.status = filter.status;
        }

        if (filter?.dateFrom || filter?.dateTo) {
          where.createdAt = {};
          if (filter.dateFrom) {
            (where.createdAt as Record<string, unknown>).gte = new Date(filter.dateFrom);
          }
          if (filter.dateTo) {
            (where.createdAt as Record<string, unknown>).lte = new Date(filter.dateTo);
          }
        }

        console.log('Query where clause:', JSON.stringify(where, null, 2));

        // First, let's try a simple count to see if the database is accessible
        const totalCount = await prisma.order.count({ where });
        console.log('Total orders count:', totalCount);

        // If count works, try the full query
        const orders = await prisma.order.findMany({
          where,
          include: {
            customer: true,
            shop: true,
            currency: true,
            items: {
              include: {
                product: true
              }
            },
            shipments: true
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50),
          orderBy: { createdAt: 'desc' }
        });

        console.log('Orders query result:', orders ? orders.length : 'null', 'orders found');
        
        return orders || []; // Ensure we always return an array
      } catch (error) {
        console.error('Error fetching orders:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
        return []; // Return empty array instead of throwing
      }
    },

    order: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          console.error('No token provided for order query');
          return null;
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          console.error('Invalid token for order query');
          return null;
        }

        const order = await prisma.order.findUnique({
          where: { id },
          include: {
            customer: true,
            shop: true,
            currency: true,
            items: {
              include: {
                product: {
                  include: {
                    prices: {
                      include: {
                        currency: true
                      }
                    }
                  }
                }
              }
            },
            payments: {
              include: {
                currency: true,
                paymentMethod: {
                  include: {
                    provider: true
                  }
                },
                provider: true
              }
            },
            shipments: true
          }
        });

        return order; // This can be null if not found, which is fine for nullable field
      } catch (error) {
        console.error('Error fetching order:', error);
        return null; // Return null instead of throwing
      }
    },

    // Product Category queries
    productCategories: async (
      _parent: unknown,
      { filter, pagination }: { filter?: ProductCategoryFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { slug: { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        if (filter?.shopId) {
          where.shopId = filter.shopId;
        }

        if (filter?.parentId !== undefined) {
          where.parentId = filter.parentId;
        }

        if (filter?.isActive !== undefined) {
          where.isActive = filter.isActive;
        }

        const categories = await prisma.productCategory.findMany({
          where,
          include: {
            shop: true,
            parent: true,
            children: true,
            products: true,
            _count: {
              select: {
                products: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return categories.map((category: ProductCategoryWithCount) => ({
          ...category,
          productCount: category._count.products
        }));
      } catch (error) {
        console.error('Error fetching product categories:', error);
        throw error;
      }
    },

    productCategory: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const category = await prisma.productCategory.findUnique({
          where: { id },
          include: {
            shop: true,
            parent: true,
            children: true,
            products: {
              include: {
                prices: {
                  include: {
                    currency: true
                  }
                }
              }
            },
            _count: {
              select: {
                products: true
              }
            }
          }
        });

        if (!category) {
          throw new Error('Product category not found');
        }

        return {
          ...category,
          productCount: category._count.products
        };
      } catch (error) {
        console.error('Error fetching product category:', error);
        throw error;
      }
    },

    productCategoryBySlug: async (_parent: unknown, { slug }: { slug: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const category = await prisma.productCategory.findUnique({
          where: { slug },
          include: {
            shop: true,
            parent: true,
            children: true,
            products: {
              include: {
                prices: {
                  include: {
                    currency: true
                  }
                }
              }
            },
            _count: {
              select: {
                products: true
              }
            }
          }
        });

        if (!category) {
          throw new Error('Product category not found');
        }

        return {
          ...category,
          productCount: category._count.products
        };
      } catch (error) {
        console.error('Error fetching product category by slug:', error);
        throw error;
      }
    },

    // Payment Provider queries
    paymentProviders: async (
      _parent: unknown,
      { filter, pagination }: { filter?: PaymentProviderFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { type: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        if (filter?.type) {
          where.type = filter.type;
        }

        if (filter?.isActive !== undefined) {
          where.isActive = filter.isActive;
        }

        const providers = await prisma.paymentProvider.findMany({
          where,
          include: {
            paymentMethods: true,
            payments: true,
            _count: {
              select: {
                paymentMethods: true,
                payments: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return providers;
      } catch (error) {
        console.error('Error fetching payment providers:', error);
        throw error;
      }
    },

    paymentProvider: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const provider = await prisma.paymentProvider.findUnique({
          where: { id },
          include: {
            paymentMethods: true,
            payments: {
              include: {
                order: true,
                currency: true,
                paymentMethod: true
              }
            }
          }
        });

        if (!provider) {
          throw new Error('Payment provider not found');
        }

        return provider;
      } catch (error) {
        console.error('Error fetching payment provider:', error);
        throw error;
      }
    },

    // Payment Method queries
    paymentMethods: async (
      _parent: unknown,
      { filter, pagination }: { filter?: PaymentMethodFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { name: { contains: filter.search, mode: 'insensitive' } },
            { type: { contains: filter.search, mode: 'insensitive' } }
          ];
        }

        if (filter?.providerId) {
          where.providerId = filter.providerId;
        }

        if (filter?.type) {
          where.type = filter.type;
        }

        if (filter?.isActive !== undefined) {
          where.isActive = filter.isActive;
        }

        const methods = await prisma.paymentMethod.findMany({
          where,
          include: {
            provider: true,
            payments: true,
            _count: {
              select: {
                payments: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50)
        });

        return methods;
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        throw error;
      }
    },

    paymentMethod: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const method = await prisma.paymentMethod.findUnique({
          where: { id },
          include: {
            provider: true,
            payments: {
              include: {
                order: true,
                currency: true
              }
            }
          }
        });

        if (!method) {
          throw new Error('Payment method not found');
        }

        return method;
      } catch (error) {
        console.error('Error fetching payment method:', error);
        throw error;
      }
    },

    // Payment queries
    payments: async (
      _parent: unknown,
      { filter, pagination }: { filter?: PaymentFilterInput; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.orderId) {
          where.orderId = filter.orderId;
        }

        if (filter?.status) {
          where.status = filter.status;
        }

        if (filter?.providerId) {
          where.providerId = filter.providerId;
        }

        if (filter?.paymentMethodId) {
          where.paymentMethodId = filter.paymentMethodId;
        }

        if (filter?.dateFrom || filter?.dateTo) {
          where.createdAt = {};
          if (filter.dateFrom) {
            (where.createdAt as Record<string, unknown>).gte = new Date(filter.dateFrom);
          }
          if (filter.dateTo) {
            (where.createdAt as Record<string, unknown>).lte = new Date(filter.dateTo);
          }
        }

        const payments = await prisma.payment.findMany({
          where,
          include: {
            order: {
              include: {
                customer: true,
                shop: true
              }
            },
            currency: true,
            paymentMethod: {
              include: {
                provider: true
              }
            },
            provider: true
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50),
          orderBy: { createdAt: 'desc' }
        });

        return payments;
      } catch (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
    },

    payment: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const payment = await prisma.payment.findUnique({
          where: { id },
          include: {
            order: {
              include: {
                customer: true,
                shop: true,
                items: {
                  include: {
                    product: true
                  }
                }
              }
            },
            currency: true,
            paymentMethod: {
              include: {
                provider: true
              }
            },
            provider: true
          }
        });

        if (!payment) {
          throw new Error('Payment not found');
        }

        return payment;
      } catch (error) {
        console.error('Error fetching payment:', error);
        throw error;
      }
    },

    // Customer queries
    customers: async (
      _parent: unknown,
      { filter, pagination }: { filter?: Record<string, unknown>; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const where: Record<string, unknown> = {
          role: {
            name: 'CUSTOMER'
          }
        };

        if (filter?.search) {
          where.OR = [
            { firstName: { contains: filter.search as string, mode: 'insensitive' } },
            { lastName: { contains: filter.search as string, mode: 'insensitive' } },
            { email: { contains: filter.search as string, mode: 'insensitive' } }
          ];
        }

        if (filter?.isActive !== undefined) {
          where.isActive = filter.isActive;
        }

        if (filter?.registeredFrom || filter?.registeredTo) {
          where.createdAt = {};
          if (filter.registeredFrom) {
            (where.createdAt as Record<string, unknown>).gte = new Date(filter.registeredFrom as string);
          }
          if (filter.registeredTo) {
            (where.createdAt as Record<string, unknown>).lte = new Date(filter.registeredTo as string);
          }
        }

        const customers = await prisma.user.findMany({
          where,
          include: {
            orders: {
              include: {
                items: true
              }
            },
            reviews: true,
            _count: {
              select: {
                orders: true,
                reviews: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50),
          orderBy: { createdAt: 'desc' }
        });

        // Transform to include customer-specific fields
        return customers.map((customer: CustomerWithRelations) => ({
          ...customer,
          totalOrders: customer._count.orders,
          totalSpent: customer.orders.reduce((sum: number, order) => sum + order.totalAmount, 0),
          averageOrderValue: customer._count.orders > 0 
            ? customer.orders.reduce((sum: number, order) => sum + order.totalAmount, 0) / customer._count.orders 
            : 0,
          lastOrderDate: customer.orders.length > 0 
            ? customer.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt 
            : null
        }));
      } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
      }
    },

    customer: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const customer = await prisma.user.findUnique({
          where: { id },
          include: {
            orders: {
              include: {
                items: true
              }
            },
            reviews: true,
            _count: {
              select: {
                orders: true,
                reviews: true
              }
            }
          }
        });

        if (!customer) {
          throw new Error('Customer not found');
        }

        return {
          ...customer,
          totalOrders: customer._count.orders,
          totalSpent: customer.orders.reduce((sum: number, order) => sum + order.totalAmount, 0),
          averageOrderValue: customer._count.orders > 0 
            ? customer.orders.reduce((sum: number, order) => sum + order.totalAmount, 0) / customer._count.orders 
            : 0,
          lastOrderDate: customer.orders.length > 0 
            ? customer.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt 
            : null
        };
      } catch (error) {
        console.error('Error fetching customer:', error);
        throw error;
      }
    },

    customerByEmail: async (_parent: unknown, { email }: { email: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const customer = await prisma.user.findUnique({
          where: { email },
          include: {
            orders: {
              include: {
                items: true
              }
            },
            reviews: true,
            _count: {
              select: {
                orders: true,
                reviews: true
              }
            }
          }
        });

        if (!customer) {
          throw new Error('Customer not found');
        }

        return {
          ...customer,
          totalOrders: customer._count.orders,
          totalSpent: customer.orders.reduce((sum: number, order) => sum + order.totalAmount, 0),
          averageOrderValue: customer._count.orders > 0 
            ? customer.orders.reduce((sum: number, order) => sum + order.totalAmount, 0) / customer._count.orders 
            : 0,
          lastOrderDate: customer.orders.length > 0 
            ? customer.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt 
            : null
        };
      } catch (error) {
        console.error('Error fetching customer by email:', error);
        throw error;
      }
    },

    customerStats: async (_parent: unknown, _args: unknown, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const totalCustomers = await prisma.user.count({
          where: {
            role: {
              name: 'CUSTOMER'
            }
          }
        });

        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const newCustomersThisMonth = await prisma.user.count({
          where: {
            role: {
              name: 'CUSTOMER'
            },
            createdAt: {
              gte: thisMonth
            }
          }
        });

        const activeCustomers = await prisma.user.count({
          where: {
            role: {
              name: 'CUSTOMER'
            },
            orders: {
              some: {
                createdAt: {
                  gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
                }
              }
            }
          }
        });

        const orderStats = await prisma.order.aggregate({
          _avg: {
            totalAmount: true
          }
        });

        const topCustomers = await prisma.user.findMany({
          where: {
            role: {
              name: 'CUSTOMER'
            }
          },
          include: {
            orders: true,
            _count: {
              select: {
                orders: true
              }
            }
          },
          take: 5
        });

        return {
          totalCustomers,
          newCustomersThisMonth,
          activeCustomers,
          averageOrderValue: orderStats._avg.totalAmount || 0,
          topCustomers: topCustomers.map(customer => ({
            ...customer,
            totalOrders: customer._count.orders,
            totalSpent: customer.orders.reduce((sum, order) => sum + order.totalAmount, 0),
            averageOrderValue: customer._count.orders > 0 
              ? customer.orders.reduce((sum, order) => sum + order.totalAmount, 0) / customer._count.orders 
              : 0,
            lastOrderDate: customer.orders.length > 0 
              ? customer.orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt 
              : null
          }))
        };
      } catch (error) {
        console.error('Error fetching customer stats:', error);
        throw error;
      }
    },

    // Discount queries
    discounts: async (
      _parent: unknown,
      { filter, pagination }: { filter?: Record<string, unknown>; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { code: { contains: filter.search as string, mode: 'insensitive' } },
            { name: { contains: filter.search as string, mode: 'insensitive' } },
            { description: { contains: filter.search as string, mode: 'insensitive' } }
          ];
        }

        if (filter?.type) {
          where.type = filter.type;
        }

        if (filter?.isActive !== undefined) {
          where.isActive = filter.isActive;
        }

        if (filter?.startsFrom || filter?.startsTo) {
          where.startsAt = {};
          if (filter.startsFrom) {
            (where.startsAt as Record<string, unknown>).gte = new Date(filter.startsFrom as string);
          }
          if (filter.startsTo) {
            (where.startsAt as Record<string, unknown>).lte = new Date(filter.startsTo as string);
          }
        }

        if (filter?.expiresFrom || filter?.expiresTo) {
          where.expiresAt = {};
          if (filter.expiresFrom) {
            (where.expiresAt as Record<string, unknown>).gte = new Date(filter.expiresFrom as string);
          }
          if (filter.expiresTo) {
            (where.expiresAt as Record<string, unknown>).lte = new Date(filter.expiresTo as string);
          }
        }

        const discounts = await prisma.discount.findMany({
          where,
          include: {
            applicableProducts: {
              include: {
                product: true
              }
            },
            applicableCategories: {
              include: {
                category: true
              }
            },
            orders: true
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50),
          orderBy: { createdAt: 'desc' }
        });

        return discounts;
      } catch (error) {
        console.error('Error fetching discounts:', error);
        throw error;
      }
    },

    discount: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const discount = await prisma.discount.findUnique({
          where: { id },
          include: {
            applicableProducts: {
              include: {
                product: true
              }
            },
            applicableCategories: {
              include: {
                category: true
              }
            },
            orders: true
          }
        });

        if (!discount) {
          throw new Error('Discount not found');
        }

        return discount;
      } catch (error) {
        console.error('Error fetching discount:', error);
        throw error;
      }
    },

    discountByCode: async (_parent: unknown, { code }: { code: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const discount = await prisma.discount.findUnique({
          where: { code },
          include: {
            applicableProducts: {
              include: {
                product: true
              }
            },
            applicableCategories: {
              include: {
                category: true
              }
            },
            orders: true
          }
        });

        if (!discount) {
          throw new Error('Discount not found');
        }

        return discount;
      } catch (error) {
        console.error('Error fetching discount by code:', error);
        throw error;
      }
    },

    validateDiscount: async (
      _parent: unknown,
      { code, orderTotal, customerId }: { code: string; orderTotal: number; customerId?: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const discount = await prisma.discount.findUnique({
          where: { code },
          include: {
            orders: customerId ? {
              where: {
                customerId: customerId
              }
            } : true
          }
        });

        if (!discount) {
          return {
            isValid: false,
            discount: null,
            discountAmount: 0,
            message: 'Discount code not found',
            errors: ['Invalid discount code']
          };
        }

        const errors: string[] = [];
        let discountAmount = 0;

        // Check if discount is active
        if (!discount.isActive) {
          errors.push('Discount is not active');
        }

        // Check if discount has started
        if (discount.startsAt && new Date() < discount.startsAt) {
          errors.push('Discount has not started yet');
        }

        // Check if discount has expired
        if (discount.expiresAt && new Date() > discount.expiresAt) {
          errors.push('Discount has expired');
        }

        // Check minimum order amount
        if (discount.minimumOrderAmount && orderTotal < discount.minimumOrderAmount) {
          errors.push(`Minimum order amount of ${discount.minimumOrderAmount} required`);
        }

        // Check usage limit
        if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
          errors.push('Discount usage limit reached');
        }

        // Check customer usage limit
        if (customerId && discount.customerUsageLimit) {
          const customerUsage = discount.orders.filter(order => order.customerId === customerId).length;
          if (customerUsage >= discount.customerUsageLimit) {
            errors.push('Customer usage limit reached');
          }
        }

        // Calculate discount amount if valid
        if (errors.length === 0) {
          switch (discount.type) {
            case 'PERCENTAGE':
              discountAmount = (orderTotal * discount.value) / 100;
              if (discount.maximumDiscountAmount && discountAmount > discount.maximumDiscountAmount) {
                discountAmount = discount.maximumDiscountAmount;
              }
              break;
            case 'FIXED_AMOUNT':
              discountAmount = Math.min(discount.value, orderTotal);
              break;
            case 'FREE_SHIPPING':
              // This would need to be calculated based on shipping costs
              discountAmount = 0; // Placeholder
              break;
            default:
              discountAmount = 0;
          }
        }

        return {
          isValid: errors.length === 0,
          discount: errors.length === 0 ? discount : null,
          discountAmount,
          message: errors.length === 0 ? 'Discount is valid' : 'Discount is not valid',
          errors
        };
      } catch (error) {
        console.error('Error validating discount:', error);
        return {
          isValid: false,
          discount: null,
          discountAmount: 0,
          message: 'Error validating discount',
          errors: ['Internal server error']
        };
      }
    },

    // Review queries
    reviews: async (
      _parent: unknown,
      { filter, pagination }: { filter?: Record<string, unknown>; pagination?: PaginationInput },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const where: Record<string, unknown> = {};

        if (filter?.search) {
          where.OR = [
            { title: { contains: filter.search as string, mode: 'insensitive' } },
            { comment: { contains: filter.search as string, mode: 'insensitive' } },
            { customerName: { contains: filter.search as string, mode: 'insensitive' } }
          ];
        }

        if (filter?.productId) {
          where.productId = filter.productId;
        }

        if (filter?.customerId) {
          where.customerId = filter.customerId;
        }

        if (filter?.rating) {
          where.rating = filter.rating;
        }

        if (filter?.isVerified !== undefined) {
          where.isVerified = filter.isVerified;
        }

        if (filter?.isApproved !== undefined) {
          where.isApproved = filter.isApproved;
        }

        if (filter?.isReported !== undefined) {
          where.isReported = filter.isReported;
        }

        if (filter?.dateFrom || filter?.dateTo) {
          where.createdAt = {};
          if (filter.dateFrom) {
            (where.createdAt as Record<string, unknown>).gte = new Date(filter.dateFrom as string);
          }
          if (filter.dateTo) {
            (where.createdAt as Record<string, unknown>).lte = new Date(filter.dateTo as string);
          }
        }

        const reviews = await prisma.review.findMany({
          where,
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: true,
            response: {
              include: {
                responder: true
              }
            }
          },
          take: pagination?.limit || pagination?.pageSize || 50,
          skip: pagination?.offset || ((pagination?.page || 1) - 1) * (pagination?.pageSize || 50),
          orderBy: { createdAt: 'desc' }
        });

        return reviews;
      } catch (error) {
        console.error('Error fetching reviews:', error);
        throw error;
      }
    },

    review: async (_parent: unknown, { id }: { id: string }, context: Context) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const review = await prisma.review.findUnique({
          where: { id },
          include: {
            product: true,
            customer: true,
            orderItem: true,
            images: true,
            response: {
              include: {
                responder: true
              }
            }
          }
        });

        if (!review) {
          throw new Error('Review not found');
        }

        return review;
      } catch (error) {
        console.error('Error fetching review:', error);
        throw error;
      }
    }
  },

  Mutation: {
    // Shop mutations
    createShop: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const shop = await prisma.shop.create({
          data: {
            name: input.name as string,
            defaultCurrencyId: input.defaultCurrencyId as string,
            adminUserId: input.adminUserId as string,
            acceptedCurrencies: input.acceptedCurrencyIds ? {
              create: (input.acceptedCurrencyIds as string[]).map((currencyId: string) => ({
                currencyId
              }))
            } : undefined
          },
          include: {
            defaultCurrency: true,
            acceptedCurrencies: {
              include: {
                currency: true
              }
            },
            adminUser: true
          }
        });

        return {
          success: true,
          message: 'Shop created successfully',
          shop: {
            ...shop,
            acceptedCurrencies: shop.acceptedCurrencies.map((ac: { currency: unknown }) => ac.currency)
          }
        };
      } catch (error) {
        console.error('Error creating shop:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create shop',
          shop: null
        };
      }
    },

    // Currency mutations
    createCurrency: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const currency = await prisma.currency.create({
          data: {
            code: input.code as string,
            name: input.name as string,
            symbol: input.symbol as string
          }
        });

        return {
          success: true,
          message: 'Currency created successfully',
          currency
        };
      } catch (error) {
        console.error('Error creating currency:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create currency',
          currency: null
        };
      }
    },

    // Product Category mutations
    createProductCategory: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const category = await prisma.productCategory.create({
          data: {
            name: input.name as string,
            description: input.description as string || null,
            slug: input.slug as string,
            parentId: input.parentId as string || null,
            isActive: input.isActive as boolean ?? true,
            shopId: input.shopId as string || null
          },
          include: {
            shop: true,
            parent: true,
            children: true,
            _count: {
              select: {
                products: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Product category created successfully',
          category: {
            ...category,
            productCount: category._count.products
          }
        };
      } catch (error) {
        console.error('Error creating product category:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create product category',
          category: null
        };
      }
    },

    updateProductCategory: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const category = await prisma.productCategory.update({
          where: { id },
          data: {
            name: input.name as string,
            description: input.description as string || null,
            slug: input.slug as string,
            parentId: input.parentId as string || null,
            isActive: input.isActive as boolean
          },
          include: {
            shop: true,
            parent: true,
            children: true,
            _count: {
              select: {
                products: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Product category updated successfully',
          category: {
            ...category,
            productCount: category._count.products
          }
        };
      } catch (error) {
        console.error('Error updating product category:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update product category',
          category: null
        };
      }
    },

    deleteProductCategory: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        // Check if category has products
        const categoryWithProducts = await prisma.productCategory.findUnique({
          where: { id },
          include: {
            products: true,
            children: true
          }
        });

        if (!categoryWithProducts) {
          throw new Error('Product category not found');
        }

        if (categoryWithProducts.products.length > 0) {
          throw new Error('Cannot delete category with associated products');
        }

        if (categoryWithProducts.children.length > 0) {
          throw new Error('Cannot delete category with child categories');
        }

        await prisma.productCategory.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Product category deleted successfully',
          category: null
        };
      } catch (error) {
        console.error('Error deleting product category:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete product category',
          category: null
        };
      }
    },

    // Payment Provider mutations
    createPaymentProvider: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const provider = await prisma.paymentProvider.create({
          data: {
            name: input.name as string,
            type: input.type as string,
            isActive: input.isActive as boolean ?? true,
            apiKey: input.apiKey as string || null,
            secretKey: input.secretKey as string || null,
            webhookUrl: input.webhookUrl as string || null
          }
        });

        return {
          success: true,
          message: 'Payment provider created successfully',
          provider
        };
      } catch (error) {
        console.error('Error creating payment provider:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create payment provider',
          provider: null
        };
      }
    },

    updatePaymentProvider: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const provider = await prisma.paymentProvider.update({
          where: { id },
          data: {
            name: input.name as string,
            type: input.type as string,
            isActive: input.isActive as boolean,
            apiKey: input.apiKey as string || null,
            secretKey: input.secretKey as string || null,
            webhookUrl: input.webhookUrl as string || null
          }
        });

        return {
          success: true,
          message: 'Payment provider updated successfully',
          provider
        };
      } catch (error) {
        console.error('Error updating payment provider:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update payment provider',
          provider: null
        };
      }
    },

    deletePaymentProvider: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        // Check if provider has payment methods or payments
        const providerWithRelations = await prisma.paymentProvider.findUnique({
          where: { id },
          include: {
            paymentMethods: true,
            payments: true
          }
        });

        if (!providerWithRelations) {
          throw new Error('Payment provider not found');
        }

        if (providerWithRelations.paymentMethods.length > 0) {
          throw new Error('Cannot delete provider with associated payment methods');
        }

        if (providerWithRelations.payments.length > 0) {
          throw new Error('Cannot delete provider with associated payments');
        }

        await prisma.paymentProvider.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Payment provider deleted successfully',
          provider: null
        };
      } catch (error) {
        console.error('Error deleting payment provider:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete payment provider',
          provider: null
        };
      }
    },

    // Payment Method mutations
    createPaymentMethod: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const method = await prisma.paymentMethod.create({
          data: {
            name: input.name as string,
            type: input.type as string,
            providerId: input.providerId as string,
            isActive: input.isActive as boolean ?? true,
            processingFeeRate: input.processingFeeRate as number || null,
            fixedFee: input.fixedFee as number || null
          },
          include: {
            provider: true
          }
        });

        return {
          success: true,
          message: 'Payment method created successfully',
          method
        };
      } catch (error) {
        console.error('Error creating payment method:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create payment method',
          method: null
        };
      }
    },

    updatePaymentMethod: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const method = await prisma.paymentMethod.update({
          where: { id },
          data: {
            name: input.name as string,
            type: input.type as string,
            providerId: input.providerId as string,
            isActive: input.isActive as boolean,
            processingFeeRate: input.processingFeeRate as number || null,
            fixedFee: input.fixedFee as number || null
          },
          include: {
            provider: true
          }
        });

        return {
          success: true,
          message: 'Payment method updated successfully',
          method
        };
      } catch (error) {
        console.error('Error updating payment method:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update payment method',
          method: null
        };
      }
    },

    deletePaymentMethod: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        // Check if method has payments
        const methodWithPayments = await prisma.paymentMethod.findUnique({
          where: { id },
          include: {
            payments: true
          }
        });

        if (!methodWithPayments) {
          throw new Error('Payment method not found');
        }

        if (methodWithPayments.payments.length > 0) {
          throw new Error('Cannot delete payment method with associated payments');
        }

        await prisma.paymentMethod.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Payment method deleted successfully',
          method: null
        };
      } catch (error) {
        console.error('Error deleting payment method:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete payment method',
          method: null
        };
      }
    },

    // Payment mutations
    createPayment: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const payment = await prisma.payment.create({
          data: {
            orderId: input.orderId as string || null,
            amount: input.amount as number,
            currencyId: input.currencyId as string,
            paymentMethodId: input.paymentMethodId as string,
            providerId: input.providerId as string,
            transactionId: input.transactionId as string || null
          },
          include: {
            order: true,
            currency: true,
            paymentMethod: {
              include: {
                provider: true
              }
            },
            provider: true
          }
        });

        return {
          success: true,
          message: 'Payment created successfully',
          payment
        };
      } catch (error) {
        console.error('Error creating payment:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create payment',
          payment: null
        };
      }
    },

    updatePayment: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const updateData: Record<string, unknown> = {};
        if (input.status) updateData.status = input.status as string;
        if (input.customerName) updateData.customerName = input.customerName as string;
        if (input.customerEmail) updateData.customerEmail = input.customerEmail as string;

        const payment = await prisma.payment.update({
          where: { id },
          data: {
            status: input.status as PaymentStatus,
            transactionId: input.transactionId as string || null,
            gatewayResponse: input.gatewayResponse as string || null,
            failureReason: input.failureReason as string || null,
            refundAmount: input.refundAmount as number || null
          },
          include: {
            order: true,
            currency: true,
            paymentMethod: {
              include: {
                provider: true
              }
            },
            provider: true
          }
        });

        return {
          success: true,
          message: 'Payment updated successfully',
          payment
        };
      } catch (error) {
        console.error('Error updating payment:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update payment',
          payment: null
        };
      }
    },

    deletePayment: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        await prisma.payment.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Payment deleted successfully',
          payment: null
        };
      } catch (error) {
        console.error('Error deleting payment:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete payment',
          payment: null
        };
      }
    },

    // Order mutations
    createOrder: async (
      _parent: unknown,
      { input }: { input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        // Validate shop exists
        const shop = await prisma.shop.findUnique({
          where: { id: input.shopId as string }
        });
        if (!shop) {
          throw new Error('Shop not found');
        }

        // Calculate total amount from items
        const items = input.items as Array<{ productId: string; quantity: number; unitPrice: number }>;
        const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

        // Create order with items
        const order = await prisma.order.create({
          data: {
            customerId: input.customerId as string || null,
            customerName: input.customerName as string,
            customerEmail: input.customerEmail as string,
            shopId: input.shopId as string,
            totalAmount,
            currencyId: shop.defaultCurrencyId,
            items: {
              create: items.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.quantity * item.unitPrice
              }))
            }
          },
          include: {
            customer: true,
            shop: true,
            currency: true,
            items: {
              include: {
                product: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Order created successfully',
          order
        };
      } catch (error) {
        console.error('Error creating order:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to create order',
          order: null
        };
      }
    },

    updateOrder: async (
      _parent: unknown,
      { id, input }: { id: string; input: Record<string, unknown> },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        const updateData: Record<string, unknown> = {};
        if (input.status) updateData.status = input.status as string;
        if (input.customerName) updateData.customerName = input.customerName as string;
        if (input.customerEmail) updateData.customerEmail = input.customerEmail as string;

        const order = await prisma.order.update({
          where: { id },
          data: updateData,
          include: {
            customer: true,
            shop: true,
            currency: true,
            items: {
              include: {
                product: true
              }
            }
          }
        });

        return {
          success: true,
          message: 'Order updated successfully',
          order
        };
      } catch (error) {
        console.error('Error updating order:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to update order',
          order: null
        };
      }
    },

    deleteOrder: async (
      _parent: unknown,
      { id }: { id: string },
      context: Context
    ) => {
      try {
        const token = context.req.headers.get('authorization')?.split(' ')[1];
        if (!token) {
          throw new Error('Not authenticated');
        }

        const decoded = await verifyToken(token) as { userId: string };
        if (!decoded?.userId) {
          throw new Error('Invalid token');
        }

        // Check if order has payments or shipments
        const orderWithRelations = await prisma.order.findUnique({
          where: { id },
          include: {
            payments: true,
            shipments: true
          }
        });

        if (!orderWithRelations) {
          throw new Error('Order not found');
        }

        if (orderWithRelations.payments.length > 0) {
          throw new Error('Cannot delete order with associated payments');
        }

        if (orderWithRelations.shipments.length > 0) {
          throw new Error('Cannot delete order with associated shipments');
        }

        await prisma.order.delete({
          where: { id }
        });

        return {
          success: true,
          message: 'Order deleted successfully',
          order: null
        };
      } catch (error) {
        console.error('Error deleting order:', error);
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Failed to delete order',
          order: null
        };
      }
    }
  },

  // Type resolvers
  Shop: {
    acceptedCurrencies: async (parent: Record<string, unknown>) => {
      const acceptedCurrencies = await prisma.shopAcceptedCurrencies.findMany({
        where: { shopId: parent.id as string },
        include: { currency: true }
      });
      return acceptedCurrencies.map((ac: { currency: unknown }) => ac.currency);
    },
    
    products: async (parent: Record<string, unknown>) => {
      return await prisma.product.findMany({
        where: { shopId: parent.id as string },
        include: {
          prices: {
            include: {
              currency: true
            }
          }
        }
      });
    },

    productCategories: async (parent: Record<string, unknown>) => {
      const categories = await prisma.productCategory.findMany({
        where: { shopId: parent.id as string },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });
      return categories.map((category: ProductCategoryWithCount) => ({
        ...category,
        productCount: category._count.products
      }));
    }
  },

  Product: {
    shop: async (parent: Record<string, unknown>) => {
      return await prisma.shop.findUnique({
        where: { id: parent.shopId as string },
        include: {
          defaultCurrency: true,
          adminUser: true
        }
      });
    },

    category: async (parent: Record<string, unknown>) => {
      if (!parent.categoryId) return null;
      const category = await prisma.productCategory.findUnique({
        where: { id: parent.categoryId as string },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });
      return category ? {
        ...category,
        productCount: category._count.products
      } : null;
    },

    prices: async (parent: Record<string, unknown>) => {
      return await prisma.price.findMany({
        where: { productId: parent.id as string },
        include: {
          currency: true
        }
      });
    },

    reviews: async (parent: Record<string, unknown>) => {
      try {
        return await prisma.review.findMany({
          where: { productId: parent.id as string },
          include: {
            customer: true,
            orderItem: true,
            images: true,
            response: true
          },
          orderBy: { createdAt: 'desc' }
        });
      } catch (error) {
        console.error('Error fetching product reviews:', error);
        return [];
      }
    }
  },

  ProductCategory: {
    shop: async (parent: Record<string, unknown>) => {
      if (!parent.shopId) return null;
      return await prisma.shop.findUnique({
        where: { id: parent.shopId as string },
        include: {
          defaultCurrency: true,
          adminUser: true
        }
      });
    },

    parent: async (parent: Record<string, unknown>) => {
      if (!parent.parentId) return null;
      const parentCategory = await prisma.productCategory.findUnique({
        where: { id: parent.parentId as string },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });
      return parentCategory ? {
        ...parentCategory,
        productCount: parentCategory._count.products
      } : null;
    },

    children: async (parent: Record<string, unknown>) => {
      const children = await prisma.productCategory.findMany({
        where: { parentId: parent.id as string },
        include: {
          _count: {
            select: {
              products: true
            }
          }
        }
      });
      return children.map((child: ProductCategoryWithCount) => ({
        ...child,
        productCount: child._count.products
      }));
    },

    products: async (parent: Record<string, unknown>) => {
      return await prisma.product.findMany({
        where: { categoryId: parent.id as string },
        include: {
          shop: true,
          prices: {
            include: {
              currency: true
            }
          }
        }
      });
    }
  },

  Price: {
    currency: async (parent: Record<string, unknown>) => {
      return await prisma.currency.findUnique({
        where: { id: parent.currencyId as string }
      });
    }
  },

  Tax: {
    shop: async (parent: Record<string, unknown>) => {
      if (!parent.shopId) return null;
      return await prisma.shop.findUnique({
        where: { id: parent.shopId as string }
      });
    }
  },

  PaymentProvider: {
    paymentMethods: async (parent: Record<string, unknown>) => {
      return await prisma.paymentMethod.findMany({
        where: { providerId: parent.id as string },
        include: {
          provider: true
        }
      });
    },

    payments: async (parent: Record<string, unknown>) => {
      return await prisma.payment.findMany({
        where: { providerId: parent.id as string },
        include: {
          order: true,
          currency: true,
          paymentMethod: true
        }
      });
    }
  },

  PaymentMethod: {
    provider: async (parent: Record<string, unknown>) => {
      return await prisma.paymentProvider.findUnique({
        where: { id: parent.providerId as string }
      });
    },

    payments: async (parent: Record<string, unknown>) => {
      return await prisma.payment.findMany({
        where: { paymentMethodId: parent.id as string },
        include: {
          order: true,
          currency: true,
          provider: true
        }
      });
    }
  },

  Payment: {
    order: async (parent: Record<string, unknown>) => {
      if (!parent.orderId) return null;
      return await prisma.order.findUnique({
        where: { id: parent.orderId as string },
        include: {
          customer: true,
          shop: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });
    },

    currency: async (parent: Record<string, unknown>) => {
      return await prisma.currency.findUnique({
        where: { id: parent.currencyId as string }
      });
    },

    paymentMethod: async (parent: Record<string, unknown>) => {
      return await prisma.paymentMethod.findUnique({
        where: { id: parent.paymentMethodId as string },
        include: {
          provider: true
        }
      });
    },

    provider: async (parent: Record<string, unknown>) => {
      return await prisma.paymentProvider.findUnique({
        where: { id: parent.providerId as string }
      });
    }
  },

  Order: {
    customer: async (parent: Record<string, unknown>) => {
      if (!parent.customerId) return null;
      return await prisma.user.findUnique({
        where: { id: parent.customerId as string }
      });
    },

    shop: async (parent: Record<string, unknown>) => {
      return await prisma.shop.findUnique({
        where: { id: parent.shopId as string },
        include: {
          defaultCurrency: true,
          adminUser: true
        }
      });
    },

    currency: async (parent: Record<string, unknown>) => {
      return await prisma.currency.findUnique({
        where: { id: parent.currencyId as string }
      });
    },

    items: async (parent: Record<string, unknown>) => {
      return await prisma.orderItem.findMany({
        where: { orderId: parent.id as string },
        include: {
          product: {
            include: {
              prices: {
                include: {
                  currency: true
                }
              }
            }
          }
        }
      });
    },

    shipments: async (parent: Record<string, unknown>) => {
      return await prisma.shipment.findMany({
        where: { orderId: parent.id as string },
        include: {
          shippingMethod: {
            include: {
              provider: true
            }
          }
        }
      });
    }
  },

  OrderItem: {
    order: async (parent: Record<string, unknown>) => {
      return await prisma.order.findUnique({
        where: { id: parent.orderId as string },
        include: {
          customer: true,
          shop: true,
          currency: true
        }
      });
    },

    product: async (parent: Record<string, unknown>) => {
      return await prisma.product.findUnique({
        where: { id: parent.productId as string },
        include: {
          shop: true,
          prices: {
            include: {
              currency: true
            }
          }
        }
      });
    }
  },

  Customer: {
    orders: async (parent: Record<string, unknown>) => {
      return await prisma.order.findMany({
        where: { customerId: parent.id as string },
        include: {
          items: {
            include: {
              product: true
            }
          },
          shop: true,
          currency: true
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    reviews: async (parent: Record<string, unknown>) => {
      return await prisma.review.findMany({
        where: { customerId: parent.id as string },
        include: {
          product: true,
          images: true,
          response: {
            include: {
              responder: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    },

    addresses: async (parent: Record<string, unknown>) => {
      return await prisma.customerAddress.findMany({
        where: { customerId: parent.id as string },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }]
      });
    }
  },

  Review: {
    product: async (parent: Record<string, unknown>) => {
      return await prisma.product.findUnique({
        where: { id: parent.productId as string },
        include: {
          shop: true,
          prices: {
            include: {
              currency: true
            }
          }
        }
      });
    },

    customer: async (parent: Record<string, unknown>) => {
      if (!parent.customerId) return null;
      return await prisma.user.findUnique({
        where: { id: parent.customerId as string }
      });
    },

    orderItem: async (parent: Record<string, unknown>) => {
      if (!parent.orderItemId) return null;
      return await prisma.orderItem.findUnique({
        where: { id: parent.orderItemId as string },
        include: {
          order: true,
          product: true
        }
      });
    },

    images: async (parent: Record<string, unknown>) => {
      return await prisma.reviewImage.findMany({
        where: { reviewId: parent.id as string },
        orderBy: { order: 'asc' }
      });
    },

    response: async (parent: Record<string, unknown>) => {
      return await prisma.reviewResponse.findUnique({
        where: { reviewId: parent.id as string },
        include: {
          responder: true
        }
      });
    }
  }
};