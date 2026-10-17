# Cafe POS

A locally running cafe point-of-sale application built as a learning and portfolio project.

## Tech Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend:** Node.js, Express, TypeScript
- **Database:** SQLite, Prisma ORM 7

## Prerequisites

- Node.js 20.9+
- npm

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/DevShaikh/cafe-pos.git
   cd cafe-pos
   ```

2. Install dependencies:

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

3. Configure the environment files according to the examples in the `client/` and `server/` directories.

4. Prepare the database from the `server/` directory:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

5. Start the application from the project root:

   ```bash
   npm run dev
   ```

## Useful Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the frontend and backend |
| `npm run lint` | Lint the applications |
| `npm run typecheck` | Type-check the applications |
| `npm run build` | Build the applications |
| `npm test` | Run server tests |

## Current Status

The backend foundation and demo product seeding are in place. Product APIs, the frontend catalog, cart, checkout, and order history are planned for future development.

## Notes

- SQLite stores data locally; a separate database server is not required.
- Keep environment files and secrets private.
- This project is intended for local development and learning.
