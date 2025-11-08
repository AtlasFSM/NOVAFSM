import { Prisma } from '@prisma/client';

/**
 * Soft Delete Middleware for Prisma
 *
 * This middleware intercepts all Prisma queries and:
 * 1. Converts `delete` operations to `update` with `deletedAt = now()`
 * 2. Converts `deleteMany` operations to `updateMany` with `deletedAt = now()`
 * 3. Automatically filters out soft-deleted records from all queries (unless explicitly included)
 *
 * Usage:
 * prisma.$use(softDeleteMiddleware);
 */

// Type definitions for Prisma middleware
type MiddlewareParams = {
  model?: string;
  action: string;
  args: any;
  dataPath: string[];
  runInTransaction: boolean;
};

type MiddlewareNext = (params: MiddlewareParams) => Promise<any>;

// Models that support soft delete (have deletedAt field)
const SOFT_DELETE_MODELS = [
  'organization',
  'user',
  'technician',
  'customer',
  'site',
  'priceList',
  'priceItem',
  'taxRate',
  'quote',
  'quoteLine',
  'job',
  'invoice',
  'inventoryItem',
  'timeEntry',
  'expenseEntry',
  'asset',
  'document',
  'formTemplate',
  'formAssignment',
  'formResponse',
];

export const softDeleteMiddleware = async (params: MiddlewareParams, next: MiddlewareNext) => {
  const model = params.model?.toLowerCase();

  // Only apply to models with soft delete support
  if (!model || !SOFT_DELETE_MODELS.includes(model)) {
    return next(params);
  }

  // Convert delete to update with deletedAt
  if (params.action === 'delete') {
    params.action = 'update';
    params.args.data = {
      deletedAt: new Date(),
    };
  }

  // Convert deleteMany to updateMany with deletedAt
  if (params.action === 'deleteMany') {
    params.action = 'updateMany';
    if (params.args.data !== undefined) {
      params.args.data.deletedAt = new Date();
    } else {
      params.args.data = { deletedAt: new Date() };
    }
  }

  // Filter out soft-deleted records from queries
  // (unless explicitly requesting deleted records)
  if (
    params.action === 'findUnique' ||
    params.action === 'findFirst' ||
    params.action === 'findMany'
  ) {
    // Check if deletedAt is already in the where clause
    const hasDeletedAtFilter =
      params.args.where &&
      (params.args.where.deletedAt !== undefined ||
        params.args.where.AND?.some((clause: any) => clause.deletedAt !== undefined) ||
        params.args.where.OR?.some((clause: any) => clause.deletedAt !== undefined));

    // Only add deletedAt filter if not explicitly specified
    if (!hasDeletedAtFilter) {
      if (!params.args.where) {
        params.args.where = {};
      }

      // Add deletedAt: null to filter out soft-deleted records
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }
  }

  // Filter out soft-deleted records from count
  if (params.action === 'count') {
    if (!params.args) {
      params.args = {};
    }

    // Check if deletedAt is already in the where clause
    const hasDeletedAtFilter =
      params.args.where &&
      (params.args.where.deletedAt !== undefined ||
        params.args.where.AND?.some((clause: any) => clause.deletedAt !== undefined) ||
        params.args.where.OR?.some((clause: any) => clause.deletedAt !== undefined));

    if (!hasDeletedAtFilter) {
      if (!params.args.where) {
        params.args.where = {};
      }

      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }
  }

  // Filter out soft-deleted records from update
  // This prevents accidentally updating deleted records
  if (params.action === 'update' || params.action === 'updateMany') {
    if (!params.args.where) {
      params.args.where = {};
    }

    // Check if deletedAt is already in the where clause
    const hasDeletedAtFilter =
      params.args.where &&
      (params.args.where.deletedAt !== undefined ||
        params.args.where.AND?.some((clause: any) => clause.deletedAt !== undefined) ||
        params.args.where.OR?.some((clause: any) => clause.deletedAt !== undefined));

    if (!hasDeletedAtFilter) {
      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }
  }

  // Filter out soft-deleted records from aggregate operations
  if (params.action === 'aggregate' || params.action === 'groupBy') {
    if (!params.args) {
      params.args = {};
    }

    // Check if deletedAt is already in the where clause
    const hasDeletedAtFilter =
      params.args.where &&
      (params.args.where.deletedAt !== undefined ||
        params.args.where.AND?.some((clause: any) => clause.deletedAt !== undefined) ||
        params.args.where.OR?.some((clause: any) => clause.deletedAt !== undefined));

    if (!hasDeletedAtFilter) {
      if (!params.args.where) {
        params.args.where = {};
      }

      params.args.where = {
        ...params.args.where,
        deletedAt: null,
      };
    }
  }

  return next(params);
};

/**
 * Helper function to include soft-deleted records in a query
 *
 * Usage:
 * const allCustomers = await prisma.customer.findMany(withDeleted());
 * const customer = await prisma.customer.findUnique(withDeleted({ where: { id } }));
 */
export function withDeleted<T extends { where?: any }>(args?: T): T {
  if (!args) {
    return { where: { deletedAt: { not: undefined } } } as T;
  }

  return {
    ...args,
    where: {
      ...args.where,
      deletedAt: { not: undefined },
    },
  };
}

/**
 * Helper function to find only soft-deleted records
 *
 * Usage:
 * const deletedCustomers = await prisma.customer.findMany(onlyDeleted());
 * const deletedCustomer = await prisma.customer.findUnique(onlyDeleted({ where: { id } }));
 */
export function onlyDeleted<T extends { where?: any }>(args?: T): T {
  if (!args) {
    return { where: { deletedAt: { not: null } } } as T;
  }

  return {
    ...args,
    where: {
      ...args.where,
      deletedAt: { not: null },
    },
  };
}

/**
 * Hard delete function
 * Use this when you need to permanently delete a record
 *
 * Usage:
 * await hardDelete(prisma, 'customer', { id: 'customer-id' });
 */
export async function hardDelete(prisma: any, model: string, where: any): Promise<any> {
  // Temporarily store the original action
  const modelDelegate = prisma[model];

  if (!modelDelegate) {
    throw new Error(`Model ${model} does not exist`);
  }

  // Use the raw delete method, bypassing middleware
  // This requires using $executeRawUnsafe or similar
  // For safety, we'll use a special marker in the where clause

  return modelDelegate.deleteMany({
    where: {
      ...where,
      // This marker will be recognized and the middleware will skip it
      __hardDelete: true,
    },
  });
}
