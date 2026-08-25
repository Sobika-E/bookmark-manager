# Bookmark Manager GraphQL API

A GraphQL API for managing bookmarks and folders, built with Bun, TypeScript, GraphQL Yoga, PostgreSQL, and Prisma.

## Overview

This application provides a GraphQL API that allows users to:
- Create and manage folders
- Create and manage bookmarks
- Move bookmarks between folders
- Search bookmarks by title
- Fetch folders with nested bookmarks
- Filter bookmarks by folder
- Paginate bookmarks using cursor-based pagination

## Tech Stack

- **Bun** - JavaScript runtime and package manager
- **TypeScript** - Strict mode enabled
- **GraphQL Yoga** - GraphQL server
- **PostgreSQL** - Database (via Docker Compose)
- **Prisma** - ORM with migrations
- **Docker Compose** - PostgreSQL containerization

## Setup

### 1. Clone the repository

```bash
git clone <repository-url>
cd bookmark-manager
```

### 2. Install dependencies

```bash
bun install
```

### 3. Create environment file

Copy the example environment file and create your local `.env`:

```bash
cp .env.example .env
```

Your `.env` file should contain:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/bookmark_db"
```

### 4. Start PostgreSQL using Docker Compose

```bash
docker compose up -d
```

This will:
- Start PostgreSQL in a Docker container
- Map host port 5433 to container port 5432
- Create a persistent volume for data
- Use the database `bookmark_db` with username `postgres` and password `postgres`

Verify PostgreSQL is running:
```bash
docker compose ps
```

### 5. Generate Prisma Client

```bash
bun run gendb
```

### 6. Run Prisma migrations

```bash
bun run migrate
```

This will create the database schema with Folder and Bookmark tables.

### 7. Start the development server

```bash
bun run dev
```

The GraphQL server will be available at `http://localhost:4000/graphql`

## Environment Variables

- `DATABASE_URL` - PostgreSQL connection string
  - Format: `postgresql://postgres:postgres@localhost:5433/bookmark_db`
  - Required for Prisma to connect to the database

## Database Documentation

### PostgreSQL Setup

PostgreSQL is run through Docker Compose as specified in `docker-compose.yml`. The database uses:
- PostgreSQL 16 Alpine image
- Database name: `bookmark_db`
- Username: `postgres`
- Password: `postgres` (development-only)
- Port mapping: Host 5433 → Container 5432

### Prisma ORM

Prisma is used as the ORM with schema-first approach. The schema is defined in `prisma/schema.prisma`.

### Migrations

Database schema changes are managed through Prisma migrations:
- Generate migration: `bun run migrate`
- Deploy migrations (production): `bun run migrate:deploy`
- View database: `bun run studio`

### Database Relationships

**Folder Model:**
- `id` - Primary key (CUID)
- `name` - Folder name
- `createdAt` - Creation timestamp
- `bookmarks` - One-to-many relation to Bookmark

**Bookmark Model:**
- `id` - Primary key (CUID)
- `title` - Bookmark title
- `url` - Bookmark URL
- `tags` - Array of string tags
- `folderId` - Foreign key to Folder
- `createdAt` - Creation timestamp
- `folder` - Many-to-one relation to Folder

### Indexes and Constraints

- Index on `Bookmark.folderId` for efficient filtering by folder
- Index on `Bookmark.createdAt` for cursor pagination
- Foreign key constraint on `Bookmark.folderId` with cascade delete

## GraphQL API Documentation

### Queries

#### folders

Returns all folders.

```graphql
query {
  folders {
    id
    name
    createdAt
  }
}
```

#### folder(id)

Returns a single folder with its nested bookmarks.

```graphql
query {
  folder(id: "folder-id") {
    id
    name
    createdAt
    bookmarks {
      id
      title
      url
      tags
      folderId
      createdAt
    }
  }
}
```

#### bookmarks(folderId?, search?, take?, cursor?)

Returns bookmarks with optional filtering and pagination.

```graphql
# Basic pagination
query {
  bookmarks(take: 10) {
    items {
      id
      title
      url
      tags
      folderId
      createdAt
    }
    nextCursor
    hasNextPage
  }
}

# With cursor (next page)
query {
  bookmarks(take: 10, cursor: "previous-cursor") {
    items {
      id
      title
      url
      tags
      folderId
      createdAt
    }
    nextCursor
    hasNextPage
  }
}

# Filter by folder
query {
  bookmarks(folderId: "folder-id", take: 10) {
    items {
      id
      title
      url
      tags
      folderId
      createdAt
    }
    nextCursor
    hasNextPage
  }
}

# Search by title
query {
  bookmarks(search: "java", take: 10) {
    items {
      id
      title
      url
      tags
      folderId
      createdAt
    }
    nextCursor
    hasNextPage
  }
}

# Combined filters
query {
  bookmarks(folderId: "folder-id", search: "java", take: 10) {
    items {
      id
      title
      url
      tags
      folderId
      createdAt
    }
    nextCursor
    hasNextPage
  }
}
```

### Mutations

#### createFolder

Creates a new folder.

```graphql
mutation {
  createFolder(name: "Development") {
    id
    name
    createdAt
  }
}
```

#### createBookmark

Creates a new bookmark.

```graphql
mutation {
  createBookmark(
    title: "GitHub"
    url: "https://github.com"
    tags: ["git", "development"]
    folderId: "folder-id"
  ) {
    id
    title
    url
    tags
    folderId
    createdAt
    folder {
      id
      name
    }
  }
}
```

#### updateBookmark

Updates an existing bookmark.

```graphql
mutation {
  updateBookmark(
    id: "bookmark-id"
    title: "GitHub - Social Coding"
    tags: ["git", "development", "social"]
  ) {
    id
    title
    url
    tags
    folderId
    createdAt
  }
}
```

#### deleteBookmark

Deletes an existing bookmark.

```graphql
mutation {
  deleteBookmark(id: "bookmark-id") {
    id
    title
    url
    tags
    folderId
  }
}
```

#### moveBookmark

Moves a bookmark to another folder.

```graphql
mutation {
  moveBookmark(id: "bookmark-id", folderId: "target-folder-id") {
    id
    title
    url
    tags
    folderId
    folder {
      id
      name
    }
  }
}
```

## Cursor Pagination

The API uses cursor-based pagination with the bookmark's `id` as the cursor. The pagination response includes:
- `items` - Array of bookmarks for the current page
- `nextCursor` - Cursor for the next page (null if no more pages)
- `hasNextPage` - Boolean indicating if more pages exist

**Example workflow:**

1. Request first page:
```graphql
query {
  bookmarks(take: 10) {
    items { id title }
    nextCursor
    hasNextPage
  }
}
```

2. Request second page using the cursor from the first response:
```graphql
query {
  bookmarks(take: 10, cursor: "cursor-from-page-1") {
    items { id title }
    nextCursor
    hasNextPage
  }
}
```

## Validation

The API validates input at the application level:

**Bookmark Title:**
- Cannot be empty
- Cannot contain only whitespace
- Trimmed before validation

**Bookmark URL:**
- Must be a valid URL format
- Uses JavaScript URL API for validation

**Folder Validation:**
- Folder must exist when creating/updating/moving bookmarks

## Error Handling

The API returns meaningful GraphQL errors for:
- Bookmark not found
- Folder not found
- Invalid bookmark title
- Invalid bookmark URL
- Invalid cursor
- Invalid input

Raw Prisma exceptions are not exposed to clients.

## Testing

### Run unit tests

```bash
bun test
```

### Run integration tests

Integration tests require PostgreSQL to be running:

```bash
docker compose up -d
bun test tests/integration.test.ts
```

Integration tests verify:
- Prisma connects successfully to PostgreSQL
- Database operations work correctly
- Data can be inserted and retrieved
- Foreign key constraints are enforced

## Available Scripts

- `bun run dev` - Start development server
- `bun run build` - Build for production
- `bun run start` - Start production server
- `bun run test` - Run all tests
- `bun run typecheck` - Run TypeScript type checking
- `bun run gendb` - Generate Prisma Client
- `bun run migrate` - Create and apply Prisma migration
- `bun run migrate:deploy` - Deploy migrations (production)
- `bun run studio` - Open Prisma Studio

## How I'd Extend This

If this were to evolve into a production system, I would consider adding:

**Authentication & Authorization:**
- User authentication (JWT, OAuth)
- Role-based access control (RBAC)
- Per-user data isolation

**Search Improvements:**
- Full-text search with PostgreSQL tsvector
- Elasticsearch for advanced search capabilities
- Search across bookmark content/descriptions

**Caching:**
- Redis for caching frequently accessed data
- GraphQL response caching
- Database query caching

**Observability:**
- Structured logging
- Metrics collection (Prometheus)
- Distributed tracing
- Error monitoring (Sentry)

**API Versioning:**
- GraphQL schema versioning strategy
- Deprecation policies for fields/mutations

**Scaling:**
- Database read replicas
- Connection pooling
- Rate limiting
- Load balancing

**Infrastructure:**
- Container orchestration (Kubernetes)
- CI/CD pipelines
- Automated backups
- Multi-region deployment

These features were intentionally left out of this assignment to keep the scope focused on the core requirements.

