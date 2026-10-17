# Cafe POS

A point-of-sale app for a cafe that runs locally: browse the menu, build a cart, check out and keep order history.

**Status:** backend foundation and product listing are done. Cart, checkout and orders are still to come.

## Tech stack

- **Client:** Next.js (App Router), React, TypeScript, Tailwind CSS
- **Server:** Node.js, Express 5, TypeScript, Zod
- **Database:** PostgreSQL with Prisma 7

The client talks to the server over HTTP. Only the server talks to the database.

## Getting started

You need Node.js 20.9+, npm and a local PostgreSQL.

**1. Install dependencies**

```bash
npm install
npm install --prefix client
npm install --prefix server
```

**2. Create the database**

Create an empty PostgreSQL database named `cafe_pos`. The database user must be allowed to create databases, because Prisma uses a temporary one when it creates migrations.

**3. Configure the server**

Create `server/.env` (it is ignored by Git):

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/cafe_pos?schema=public
CLIENT_ORIGIN=http://localhost:3001
```

**4. Set up the database**

```bash
npm run db:migrate --prefix server
npm run db:seed --prefix server
```

The seed adds demo products and is safe to run again.

**5. Run the app**

```bash
npm run dev
```

- Client: http://localhost:3001
- API: http://localhost:3000/api

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start client and server together |
| `npm run lint` | Lint client and server |
| `npm run typecheck` | Type-check client and server |
| `npm run build` | Build client and server |
| `npm test` | Run server tests |
| `npm run db:status --prefix server` | Show migration status |

## API

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/health` | API and database status |
| GET | `/api/products` | List products |

## Project layout

```text
client/            Next.js app
server/
  prisma/          Schema and migrations
  seeds/           Demo data
  src/             Express app: routes, controllers, services, schemas
```

## Roadmap

1. ~~Project setup~~
2. ~~Database and backend foundation~~
3. Product catalog (in progress)
4. Cart
5. Checkout and saved orders
6. Testing and polish
