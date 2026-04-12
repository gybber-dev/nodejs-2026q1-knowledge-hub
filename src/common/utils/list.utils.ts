export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ListQuery {
  sortBy?: string;
  order?: string;
  page?: string;
  limit?: string;
}

export interface PrismaListArgs {
  orderBy: Record<string, 'asc' | 'desc'> | undefined;
  skip: number | undefined;
  take: number | undefined;
  pagination: { page: number; limit: number } | null;
}

export function parsePrismaListArgs(query: ListQuery): PrismaListArgs {
  const direction: 'asc' | 'desc' =
    query.order === 'desc' ? 'desc' : 'asc';
  const orderBy = query.sortBy
    ? { [query.sortBy]: direction }
    : undefined;

  const hasPagination =
    query.page !== undefined || query.limit !== undefined;
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : 10;

  return {
    orderBy,
    skip: hasPagination ? (page - 1) * limit : undefined,
    take: hasPagination ? limit : undefined,
    pagination: hasPagination ? { page, limit } : null,
  };
}