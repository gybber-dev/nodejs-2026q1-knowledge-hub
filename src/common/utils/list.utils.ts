export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ListOptions {
  sortBy?: string;
  order?: string;
  page?: string | number;
  limit?: string | number;
}

export function applyListOptions<T>(
  items: T[],
  options: ListOptions,
): T[] | PaginatedResult<T> {
  const result = [...items];

  if (options.sortBy) {
    const key = options.sortBy as keyof T;
    const direction = options.order === 'desc' ? -1 : 1;
    result.sort((a, b) => {
      if (a[key] < b[key]) return -1 * direction;
      if (a[key] > b[key]) return 1 * direction;
      return 0;
    });
  }

  const rawPage = options.page;
  const rawLimit = options.limit;

  if (rawPage !== undefined || rawLimit !== undefined) {
    const page = rawPage !== undefined ? Number(rawPage) : 1;
    const limit = rawLimit !== undefined ? Number(rawLimit) : 10;
    const total = result.length;
    const data = result.slice((page - 1) * limit, page * limit);
    return { data, total, page, limit };
  }

  return result;
}
