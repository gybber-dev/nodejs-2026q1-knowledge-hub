# Knowledge Hub API

A REST API for a **Knowledge Hub** platform built with [Nest.js](https://nestjs.com/). Manage users, articles, categories, and comments with full CRUD support, JWT-based authentication, role-based access control (RBAC), cascading deletions, request logging, DTO validation, and OpenAPI documentation.

[![Docker Hub](https://img.shields.io/docker/pulls/yeschall/knowledge-hub)](https://hub.docker.com/r/yeschall/knowledge-hub)

> Docker image: `yeschall/knowledge-hub:latest`

---

## Requirements

- [Node.js](https://nodejs.org/en/download/) **24.x** (24.10.0 or higher)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/get-started) + [Docker Compose](https://docs.docker.com/compose/install/) (for DB and/or full stack)
- [Git](https://git-scm.com/downloads)

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/<your-github-id>/nodejs-2026q1-knowledge-hub.git
cd nodejs-2026q1-knowledge-hub
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env
```

Key variables in `.env`:

```env
PORT=4000

# bcrypt salt rounds
CRYPT_SALT=10

# JWT secrets — change to long random strings in production
JWT_SECRET_KEY=your_access_secret_at_least_32_chars
JWT_SECRET_REFRESH_KEY=your_refresh_secret_at_least_32_chars

# Token TTLs
TOKEN_EXPIRE_TIME=1h
TOKEN_REFRESH_EXPIRE_TIME=24h

# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=knowledge_hub
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Connection string:
#   local app + docker db  → host=localhost
#   docker app + docker db → host=db  (service name in docker-compose)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/knowledge_hub?schema=public"
```

---

## Running the Project

There are two ways to run the project: **Docker (recommended)** or **local Node.js + Docker DB only**.

---

### Option A — Full Docker stack (app + database)

Builds the app image, starts PostgreSQL and the NestJS app inside containers,
runs migrations automatically on startup.

```bash
# Build and start all services
docker compose up --build

# Or run in background
docker compose up --build -d
```

The API will be available at `http://localhost:4000`.

```bash
# View logs
docker compose logs -f app

# Stop all containers
docker compose down

# Stop and remove volumes (wipe DB data)
docker compose down -v
```

**Adminer** (DB browser, optional debug UI):

```bash
# Start with the debug profile to enable Adminer on http://localhost:8080
docker compose --profile debug up --build -d
```

---

### Option B — Local Node.js + Docker database only

Start only the PostgreSQL container, then run the app locally.

**Step 1 — Start the database:**

```bash
docker compose up db -d
```

Wait for it to be healthy:

```bash
docker compose ps
# State should show: healthy
```

**Step 2 — Apply migrations and seed the database:**

```bash
# Apply all pending migrations
npx prisma migrate deploy

# (Optional) Seed initial data
npx prisma db seed
```

**Step 3 — Start the app:**

```bash
# Production mode
npm start

# Development watch mode (auto-restart on file changes)
npm run start:dev
```

The API will be available at `http://localhost:4000`.

---

## Database Management

```bash
# Apply pending migrations (production-safe, no schema drift)
npx prisma migrate deploy

# Create and apply a new migration during development
npx prisma migrate dev --name <migration_name>

# Reset database: drop all data, re-apply all migrations, re-run seed
npx prisma migrate reset

# Run seed script only (without resetting)
npx prisma db seed

# Regenerate Prisma Client after schema changes
npx prisma generate

# Open Prisma Studio (GUI for browsing DB data)
npx prisma studio
```

---

## Authentication

The API uses JWT-based authentication with **Access** and **Refresh** tokens.

### Bootstrap Admin

> The **first user** registered via `POST /auth/signup` is automatically assigned the `admin` role.
> All subsequent registrations receive the `viewer` role by default.

This means: on a fresh database, the first signup creates your admin account.

### Auth Endpoints

All `/auth/*` routes are **public** (no token required).

| Method | Path | Description | Success | Errors |
|--------|------|-------------|---------|--------|
| POST | `/auth/signup` | Register new user | 201 | 400 (invalid dto / login taken) |
| POST | `/auth/login` | Login, get token pair | 200 | 400 (invalid dto), 403 (wrong credentials) |
| POST | `/auth/refresh` | Get new token pair by refresh token | 200 | 401 (no token), 403 (invalid/expired) |
| POST | `/auth/logout` | Invalidate refresh token | 204 | — |

**Signup / Login body:**
```json
{
  "login": "alice",
  "password": "SecurePass123"
}
```

**Login response:**
```json
{
  "accessToken": "<jwt>",
  "refreshToken": "<jwt>"
}
```

**Refresh body:**
```json
{
  "refreshToken": "<jwt>"
}
```

### Using the Access Token

Pass the Access Token in the `Authorization` header for all protected endpoints:

```
Authorization: Bearer <accessToken>
```

All routes except `/auth/signup`, `/auth/login`, `/auth/refresh`, `/doc`, and `/` require a valid token.
Expired or missing tokens return **401 Unauthorized**.

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| `viewer` | GET on all resources (read-only) |
| `editor` | GET everywhere + POST/PUT own articles and comments |
| `admin` | Full CRUD on all resources, can change user roles |

Unauthorized operations return **403 Forbidden**.

Only `admin` can change a user's role via `PUT /user/:id` with body `{ "role": "editor" }`.

---

## API Overview

All endpoints except `/auth/*` require `Authorization: Bearer <token>`.

### Auth — `/auth`

See [Authentication](#authentication) section above.

### Users — `/user`

| Method | Path | Description | Roles | Status codes |
|--------|------|-------------|-------|--------------|
| GET | `/user` | Get all users | all | 200 |
| GET | `/user/:id` | Get user by UUID | all | 200, 400, 404 |
| POST | `/user` | Create user | admin | 201, 400 |
| PUT | `/user/:id` | Update password / role | admin | 200, 400, 403, 404 |
| DELETE | `/user/:id` | Delete user | admin | 204, 400, 404 |

`POST /user` and `PUT /user/:id` body:
```json
{
  "login": "string",
  "password": "string",
  "oldPassword": "string (for PUT)",
  "newPassword": "string (for PUT)",
  "role": "admin | editor | viewer (admin only, optional)"
}
```

> Password is **never** returned in responses.

### Articles — `/article`

| Method | Path | Description | Roles | Status codes |
|--------|------|-------------|-------|--------------|
| GET | `/article` | Get all articles (+ filters) | all | 200 |
| GET | `/article/:id` | Get article by UUID | all | 200, 400, 404 |
| POST | `/article` | Create article | editor, admin | 201, 400 |
| PUT | `/article/:id` | Update article | editor (own), admin | 200, 400, 404 |
| DELETE | `/article/:id` | Delete article | admin | 204, 400, 404 |

**Filtering** (query params): `status`, `categoryId`, `tag`

```
GET /article?status=published&tag=nodejs
GET /article?categoryId=<uuid>
```

**Sorting**: `sortBy`, `order` (`asc` | `desc`)

**Pagination**: `page`, `limit` — wraps response in `{ data, total, page, limit }`

### Categories — `/category`

| Method | Path | Description | Roles | Status codes |
|--------|------|-------------|-------|--------------|
| GET | `/category` | Get all | all | 200 |
| GET | `/category/:id` | Get by UUID | all | 200, 400, 404 |
| POST | `/category` | Create | admin | 201, 400 |
| PUT | `/category/:id` | Update | admin | 200, 400, 404 |
| DELETE | `/category/:id` | Delete | admin | 204, 400, 404 |

### Comments — `/comment`

| Method | Path | Description | Roles | Status codes |
|--------|------|-------------|-------|--------------|
| GET | `/comment?articleId=<uuid>` | Get comments for article | all | 200, 400 |
| GET | `/comment/:id` | Get comment by UUID | all | 200, 400, 404 |
| POST | `/comment` | Create comment | editor, admin | 201, 400, 422 |
| DELETE | `/comment/:id` | Delete comment | admin | 204, 400, 404 |

`articleId` query param is **required** for `GET /comment`.

---

## OpenAPI / Swagger

After starting the server, visit:

```
http://localhost:4000/doc
```

To authorize in Swagger UI: click **Authorize**, paste `Bearer <accessToken>`.

---

## Testing

> The server must be **running** and the database must be **clean** before running auth tests.
> Use `npx prisma migrate reset --force` to wipe and re-seed before each test suite.

```bash
# Terminal 1 — start the server (must be running during tests)
npm start

# Terminal 2 — run all non-auth tests (no token required)
npm test
```

### Auth test suites

Each suite **must run against a clean database** (it creates its own admin via the bootstrap mechanism):

```bash
# Reset DB, then run each suite
npx prisma migrate reset --force

# Test that all routes return 401 without a token
npm run test:auth

# Reset again before the next suite
npx prisma migrate reset --force

# Test refresh token flow (get new pair, expired token, missing token)
npm run test:refresh

# Reset again
npx prisma migrate reset --force

# Test RBAC matrix (viewer / editor / admin permissions)
npm run test:rbac
```

### Specific test files

```bash
npm test -- --testPathPattern users
npm test -- --testPathPattern articles
npm test -- --testPathPattern categories
npm test -- --testPathPattern comments
npm test -- --testPathPattern pagination
```

---

## Development

```bash
# Watch mode
npm run start:dev

# Lint (auto-fix)
npm run lint

# Format with Prettier
npm run format

# Build
npm run build
```

---

## Project Structure

```
prisma/
├── schema.prisma                # Data models, relations, enums
├── migrations/                  # SQL migration history
└── seed.ts                      # Initial seed data
src/
├── app.module.ts                # Root module — global guards, middleware, throttler
├── main.ts                      # Bootstrap: ValidationPipe, Swagger, port
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts       # POST /auth/signup|login|refresh|logout
│   ├── auth.service.ts          # signup, login, refresh, logout logic
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser()
│   │   ├── public.decorator.ts         # @Public()
│   │   └── roles.decorator.ts          # @Roles(...)
│   ├── dto/                     # SignupDto, LoginDto, RefreshDto
│   ├── guards/
│   │   ├── jwt-auth.guard.ts    # Global — verifies Access Token
│   │   └── roles.guard.ts       # Global — checks role via @Roles()
│   └── interfaces/
│       └── jwt-payload.interface.ts
├── prisma/
│   ├── prisma.module.ts         # Global PrismaModule
│   └── prisma.service.ts        # PrismaClient with pg connection pool
├── article/
│   ├── article.controller.ts
│   ├── article.module.ts
│   ├── article.service.ts       # Prisma-backed CRUD + ownership check
│   ├── dto/
│   └── entities/
├── category/
├── comment/
├── user/
└── common/
    ├── enums/                   # UserRole, ArticleStatus
    ├── middleware/              # LoggerMiddleware
    └── utils/
        └── list.utils.ts        # Prisma orderBy/skip/take helpers
```

---

## Key Design Decisions

- **PostgreSQL + Prisma ORM** — all data persisted in a real database; Prisma handles queries, migrations, and type safety.
- **JWT authentication** — stateless Access Tokens (short TTL) + Refresh Tokens (long TTL, stored as hash in DB for invalidation on logout).
- **Bootstrap admin** — the first user created via `POST /auth/signup` on a clean database receives the `admin` role automatically.
- **RBAC via Guards** — `JwtAuthGuard` and `RolesGuard` are registered globally via `APP_GUARD`; public routes opt-out with `@Public()`.
- **Ownership checks** — `editor` role can only modify their own articles and comments; enforced inside service methods.
- **Rate limiting** — `/auth/signup` and `/auth/login` are throttled to 5 requests per 60 seconds per IP via `@nestjs/throttler`.
- **Connection pooling** — `pg.Pool` with configurable size via `DB_POOL_SIZE` env var (default: `os.cpus() * 2 + 1`).
- **Cascading deletes** — enforced at the database level via Prisma `onDelete` rules (`SetNull` / `Cascade`).
- **Password security** — hashed with `bcrypt` on write; never returned in API responses.
- **Optional pagination** — without `page`/`limit` returns a plain array; with them returns `{ data, total, page, limit }`.
- **Tag many-to-many** — managed via `connectOrCreate`; updating tags uses `set: []` + `connectOrCreate` atomically.
