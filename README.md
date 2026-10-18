# Cafe POS

A locally running cafe point-of-sale app, built as a learning and portfolio project.

**Status:** the backend foundation and product list API are done. The product catalog UI is in progress. Cart, checkout and orders come later.

## Tech stack

- **Client:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui, Zustand
- **Server:** Node.js, Express, TypeScript, Zod
- **Database:** SQLite (a single local file) with Prisma 7

## Getting started

You need Node.js 20.9+ and npm. No database server is needed.

**1. Clone and install**

```bash
git clone https://github.com/DevShaikh/cafe-pos.git
cd cafe-pos
npm install
npm install --prefix client
npm install --prefix server
```

**2. Configure the server**

Create `server/.env` (it is ignored by Git):

```env
NODE_ENV=development
PORT=4000
CLIENT_ORIGIN=http://localhost:3001
```

`CLIENT_ORIGIN` must match the address the client runs on, or the browser will block its requests. The database needs no setting: it is created at `server/data/cafe-pos.db`. To use another location, add `DATABASE_URL=file:./path/to/cafe-pos.db`.

**3. Set up the database**

```bash
npm run db:migrate --prefix server
npm run db:seed --prefix server
```

The seed adds 20 demo products and is safe to run again.

**4. Run the app**

```bash
npm run dev
```

- Client: http://localhost:3001
- API: http://localhost:4000/api

## Commands

| Command                                     | What it does                                                   |
| ------------------------------------------- | -------------------------------------------------------------- |
| `npm run dev`                               | Start client and server together                               |
| `npm run dev:client` / `npm run dev:server` | Start one of them                                              |
| `npm run lint`                              | Lint client and server                                         |
| `npm run typecheck`                         | Type-check client and server                                   |
| `npm run build`                             | Build client and server                                        |
| `npm test`                                  | Run server tests                                               |
| `npm run db:migrate --prefix server`        | Create or apply database migrations                            |
| `npm run db:seed --prefix server`           | Add the demo products                                          |
| `npm run db:status --prefix server`         | Show migration status                                          |
| `npm run desktop`                           | Open the app in an Electron window (start `npm run dev` first) |

## API

| Method | Path            | Description             |
| ------ | --------------- | ----------------------- |
| GET    | `/api`          | Welcome message         |
| GET    | `/api/health`   | API and database status |
| GET    | `/api/products` | List products           |

Prices are returned as strings with two decimals, for example `"120.00"`. The client adds the currency.

## Project layout

```text
client/          Next.js app (src/app, components, store, lib)
electron/        Electron window for the desktop version
server/
  prisma/        Schema and migrations
  seeds/         Demo data
  src/           Express app: routes, controllers, services, schemas
```

## Roadmap

1. ~~Project setup~~
2. ~~SQLite and backend foundation~~
3. Product catalog (in progress)
4. Cart
5. Checkout and saved orders
6. Testing, polish and the desktop installer

## Troubleshooting

- **"Could not locate the bindings file" (better-sqlite3):** your npm blocked the driver's install script. Run `npm rebuild better-sqlite3 --prefix server`. If it is still blocked, run `npm install-scripts approve better-sqlite3` inside `server/` and rebuild.
- **Database missing or empty:** run the two commands in step 3.
- **Keep private:** `.env` files and the `server/data/` folder are never committed.
