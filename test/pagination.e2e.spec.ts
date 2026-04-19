import { request } from './lib';
import { StatusCodes } from 'http-status-codes';
import { articlesRoutes, categoriesRoutes, usersRoutes } from './endpoints';
import {
  getTokenAndUserId,
  shouldAuthorizationBeTested,
  removeTokenUser,
} from './utils';

const createUserDto = { login: 'PAGINATION_USER', password: 'TEST_PASSWORD' };
const commonHeaders: Record<string, string> = { Accept: 'application/json' };
let mockUserId: string | undefined;

describe('Pagination & Sorting (e2e)', () => {
  beforeAll(async () => {
    if (shouldAuthorizationBeTested) {
      const result = await getTokenAndUserId(request);
      commonHeaders['Authorization'] = result.token;
      mockUserId = result.mockUserId;
    }
  });

  afterAll(async () => {
    if (mockUserId) {
      await removeTokenUser(request, mockUserId, commonHeaders);
      delete commonHeaders['Authorization'];
      mockUserId = undefined;
    }
  });
  describe('Articles — pagination', () => {
    const ids: string[] = [];

    beforeAll(async () => {
      for (let i = 0; i < 5; i++) {
        const res = await request
          .post(articlesRoutes.create)
          .set(commonHeaders)
          .send({
            title: `PAGINATION_ARTICLE_${i}`,
            content: `Content ${i}`,
            status: 'draft',
          });
        ids.push(res.body.id);
      }
    });

    afterAll(async () => {
      for (const id of ids) {
        await request.delete(articlesRoutes.delete(id)).set(commonHeaders);
      }
    });

    it('should return paginated result with page and limit', async () => {
      const res = await request
        .get(`${articlesRoutes.getAll}?page=1&limit=2`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 2);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeLessThanOrEqual(2);
      expect(typeof res.body.total).toBe('number');
    });

    it('should return plain array without pagination params', async () => {
      const res = await request.get(articlesRoutes.getAll).set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toBeInstanceOf(Array);
    });

    it('should return second page with fewer or equal items', async () => {
      const res = await request
        .get(`${articlesRoutes.getAll}?page=2&limit=2`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('page', 2);
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should sort articles by title asc', async () => {
      const res = await request
        .get(`${articlesRoutes.getAll}?sortBy=title&order=asc`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toBeInstanceOf(Array);

      const titles: string[] = res.body.map((a: any) => a.title);
      const sorted = [...titles].sort();
      expect(titles).toEqual(sorted);
    });

    it('should sort articles by title desc', async () => {
      const res = await request
        .get(`${articlesRoutes.getAll}?sortBy=title&order=desc`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      const titles: string[] = res.body.map((a: any) => a.title);
      const sorted = [...titles].sort().reverse();
      expect(titles).toEqual(sorted);
    });

    it('should combine sorting with pagination', async () => {
      const res = await request
        .get(`${articlesRoutes.getAll}?sortBy=title&order=asc&page=1&limit=3`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('data');
      expect(res.body.data.length).toBeLessThanOrEqual(3);
    });
  });

  describe('Categories — pagination', () => {
    const ids: string[] = [];

    beforeAll(async () => {
      for (let i = 0; i < 4; i++) {
        const res = await request
          .post(categoriesRoutes.create)
          .set(commonHeaders)
          .send({ name: `CAT_PAGINATION_${i}`, description: `Desc ${i}` });
        ids.push(res.body.id);
      }
    });

    afterAll(async () => {
      for (const id of ids) {
        await request.delete(categoriesRoutes.delete(id)).set(commonHeaders);
      }
    });

    it('should return paginated categories', async () => {
      const res = await request
        .get(`${categoriesRoutes.getAll}?page=1&limit=2`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body.data).toBeInstanceOf(Array);
    });

    it('should sort categories by name asc', async () => {
      const res = await request
        .get(`${categoriesRoutes.getAll}?sortBy=name&order=asc`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toBeInstanceOf(Array);

      const names: string[] = res.body.map((c: any) => c.name);
      const sorted = [...names].sort();
      expect(names).toEqual(sorted);
    });
  });

  describe('Users — pagination', () => {
    const ids: string[] = [];

    beforeAll(async () => {
      for (let i = 0; i < 3; i++) {
        const res = await request
          .post(usersRoutes.create)
          .set(commonHeaders)
          .send({ login: `PAGIN_USER_${i}`, password: 'pass' });
        ids.push(res.body.id);
      }
    });

    afterAll(async () => {
      for (const id of ids) {
        await request.delete(usersRoutes.delete(id)).set(commonHeaders);
      }
    });

    it('should return paginated users', async () => {
      const res = await request
        .get(`${usersRoutes.getAll}?page=1&limit=2`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page', 1);
      expect(res.body).toHaveProperty('limit', 2);
    });

    it('should sort users by login asc', async () => {
      const res = await request
        .get(`${usersRoutes.getAll}?sortBy=login&order=asc`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toBeInstanceOf(Array);

      const logins: string[] = res.body.map((u: any) => u.login);
      const sorted = [...logins].sort();
      expect(logins).toEqual(sorted);
    });
  });

  describe('Edge cases', () => {
    it('should create user with explicit role admin', async () => {
      const res = await request
        .post(usersRoutes.create)
        .set(commonHeaders)
        .send({ ...createUserDto, role: 'admin' });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.role).toBe('admin');
      expect(res.body).not.toHaveProperty('password');

      await request.delete(usersRoutes.delete(res.body.id)).set(commonHeaders);
    });

    it('should create user with explicit role editor', async () => {
      const res = await request
        .post(usersRoutes.create)
        .set(commonHeaders)
        .send({ ...createUserDto, role: 'editor' });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.role).toBe('editor');

      await request.delete(usersRoutes.delete(res.body.id)).set(commonHeaders);
    });

    it('should return 400 for invalid role value', async () => {
      const res = await request
        .post(usersRoutes.create)
        .set(commonHeaders)
        .send({ ...createUserDto, role: 'superadmin' });

      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
    });

    it('should return 404 when deleting already deleted article', async () => {
      const create = await request
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({ title: 'TO_DELETE', content: 'content' });

      const { id } = create.body;
      await request.delete(articlesRoutes.delete(id)).set(commonHeaders);

      const second = await request
        .delete(articlesRoutes.delete(id))
        .set(commonHeaders);

      expect(second.status).toBe(StatusCodes.NOT_FOUND);
    });

    it('should return empty array for filter with non-existent categoryId', async () => {
      const randomUUID = '0a35dd62-e09f-444b-a628-f4e7c6954f57';
      const res = await request
        .get(`${articlesRoutes.getAll}?categoryId=${randomUUID}`)
        .set(commonHeaders);

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body).toBeInstanceOf(Array);
      expect(res.body.length).toBe(0);
    });

    it('should create article with empty tags array', async () => {
      const res = await request
        .post(articlesRoutes.create)
        .set(commonHeaders)
        .send({ title: 'EMPTY_TAGS', content: 'content', tags: [] });

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.tags).toEqual([]);

      await request
        .delete(articlesRoutes.delete(res.body.id))
        .set(commonHeaders);
    });
  });
});
