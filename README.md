# Knowledge Hub API

A REST API for a **Knowledge Hub** platform built with [Nest.js](https://nestjs.com/). Manage users, articles, categories, and comments with full CRUD support, cascading deletions, request logging, DTO validation, and OpenAPI documentation.

## Requirements

- [Node.js](https://nodejs.org/en/download/) **24.x** (24.10.0 or higher)
- [npm](https://www.npmjs.com/)
- [Git](https://git-scm.com/downloads)

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

Copy the example file and adjust values if needed:

```bash
cp .env.example .env
```

Default `.env`:

```env
PORT=4000
```

### 4. Start the server

```bash
npm start
```

The server will start on `http://localhost:4000`.

## API Overview

| Resource   | Base route   | Description                        |
|------------|--------------|------------------------------------|
| Users      | `/user`      | CRUD, password update              |
| Articles   | `/article`   | CRUD, filtering, status management |
| Categories | `/category`  | CRUD                               |
| Comments   | `/comment`   | CRUD, scoped to articles           |

### Users — `/user`

| Method | Path        | Description                 | Status codes          |
|--------|-------------|-----------------------------|-----------------------|
| GET    | `/user`     | Get all users               | 200                   |
| GET    | `/user/:id` | Get user by UUID            | 200, 400, 404         |
| POST   | `/user`     | Create user                 | 201, 400              |
| PUT    | `/user/:id` | Update password             | 200, 400, 403, 404    |
| DELETE | `/user/:id` | Delete user                 | 204, 400, 404         |

`POST /user` body:
```json
{
  "login": "string (required)",
  "password": "string (required)",
  "role": "admin | editor | viewer (optional, default: viewer)"
}
```

`PUT /user/:id` body:
```json
{
  "oldPassword": "string (required)",
  "newPassword": "string (required)"
}
```

> Password is **never** returned in responses.

> Deleting a user sets `authorId = null` on their articles and removes their comments.

### Articles — `/article`

| Method | Path           | Description                  | Status codes    |
|--------|----------------|------------------------------|-----------------|
| GET    | `/article`     | Get all articles (+ filters) | 200             |
| GET    | `/article/:id` | Get article by UUID          | 200, 400, 404   |
| POST   | `/article`     | Create article               | 201, 400        |
| PUT    | `/article/:id` | Update article               | 200, 400, 404   |
| DELETE | `/article/:id` | Delete article               | 204, 400, 404   |

**Filtering** (query params): `status`, `categoryId`, `tag`

```
GET /article?status=published&tag=nodejs
GET /article?categoryId=<uuid>
```

**Sorting** (query params): `sortBy`, `order` (`asc` | `desc`)

```
GET /article?sortBy=createdAt&order=desc
```

**Pagination** (query params): `page`, `limit` — when provided, wraps response in `{ data, total, page, limit }`:

```
GET /article?page=1&limit=10
```

> Deleting an article removes all its comments.

> Deleting a category sets `categoryId = null` on its articles.

### Categories — `/category`

| Method | Path              | Description          | Status codes    |
|--------|-------------------|----------------------|-----------------|
| GET    | `/category`       | Get all categories   | 200             |
| GET    | `/category/:id`   | Get category by UUID | 200, 400, 404   |
| POST   | `/category`       | Create category      | 201, 400        |
| PUT    | `/category/:id`   | Update category      | 200, 400, 404   |
| DELETE | `/category/:id`   | Delete category      | 204, 400, 404   |

Supports `sortBy`, `order`, `page`, `limit` query params.

### Comments — `/comment`

| Method | Path              | Description                   | Status codes         |
|--------|-------------------|-------------------------------|----------------------|
| GET    | `/comment`        | Get comments for article      | 200, 400             |
| POST   | `/comment`        | Create comment                | 201, 400, 422        |
| DELETE | `/comment/:id`    | Delete comment                | 204, 400, 404        |

`GET /comment?articleId=<uuid>` — `articleId` query param is **required**.

`POST /comment` body:
```json
{
  "content": "string (required)",
  "articleId": "uuid (required)",
  "authorId": "uuid | null (optional)"
}
```

Returns `422` if `articleId` references a non-existent article.

## OpenAPI / Swagger

After starting the server, visit:

```
http://localhost:4000/doc
```

Full interactive documentation with request/response schemas for all endpoints.

## Testing

> The server must be **running** before executing tests — they make real HTTP requests.

```bash
# Terminal 1: start the server
npm start

# Terminal 2: run all tests
npm test
```

Run a specific test suite:

```bash
npm test -- --testPathPattern users
npm test -- --testPathPattern articles
npm test -- --testPathPattern categories
npm test -- --testPathPattern comments
npm test -- --testPathPattern pagination
```

## Development

```bash
# Watch mode (auto-restart on changes)
npm run start:dev

# Lint (auto-fix)
npm run lint

# Format with Prettier
npm run format

# Build
npm run build
```

## Project Structure

```
src/
├── app.module.ts                # Root module with middleware setup
├── main.ts                      # Bootstrap: ValidationPipe, Swagger, port
├── article/
│   ├── article.controller.ts    # REST endpoints
│   ├── article.module.ts
│   ├── article.service.ts       # In-memory CRUD + filtering
│   ├── dto/                     # CreateArticleDto, UpdateArticleDto
│   └── entities/                # Article entity, ArticleResponseEntity
├── category/                    # Same structure
├── comment/                     # Same structure
├── user/                        # Same structure
└── common/
    ├── enums/                   # UserRole, ArticleStatus
    ├── middleware/              # LoggerMiddleware
    └── utils/
        └── list.utils.ts        # Shared paginate + sort utility
```

## Key Design Decisions

- **In-memory storage** — plain arrays, ready to swap for a database in the next task.
- **Cascading deletes** — handled in services via cross-module injection (`forwardRef` where needed).
- **Password security** — excluded from all API responses via a dedicated `toResponse()` method.
- **Optional pagination** — without `page`/`limit` params the endpoint returns a plain array (backward compatible); with them it returns `{ data, total, page, limit }`.
- **`forwardRef`** — resolves the circular dependency between `ArticleModule` ↔ `CommentModule`.
