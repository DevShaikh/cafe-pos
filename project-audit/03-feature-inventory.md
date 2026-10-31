# Feature Inventory Report: Cafe POS API Server

## Overview

This document catalogs the features discovered in the Cafe Point of Sale (POS) system's Express.js backend.

**Generated:** 2026-10-30  
**Architecture:** Express.js REST API with Prisma ORM

---

## System Architecture

### Entry Points
| File | Description |
|------|-------------|
| `src/server.ts` | HTTP server entry point |
| `src/app.ts` | Express app, middleware config |
| `src/routes/index.ts` | API routes aggregator (`/api/*`) |

---

## API Routes

Located: `server/src/routes/`

| File | Path | Auth? |
|------|------|-------|
| `auth.routes.ts` | `/api/auth/*` | No |
| `health.routes.ts` | `/api/health/*` | No |
| `product.routes.ts` | `/api/products/*` | Yes |
| `order.routes.ts` | `/api/orders/*` | Yes |
| `reports.routes.ts` | `/api/reports/*` | Yes |
| `session.routes.ts` | `/api/sessions/*` | Yes |

### Endpoints
- **Auth**: login/logout, getActiveStaff, getCurrentStaff
- **Health**: GET /health
- **Products**: GET with search/filter
- **Orders**: CRUD + payment recording (idempotent)
- **Reports**: Sales reports
- **Sessions**: Open/close/list sessions

---

## Controllers

Located: `server/src/controllers/`

| File | Handlers |
|------|----------|
| `auth.controller.ts` | login, logout, getActiveStaff, getCurrentStaff |
| `health.controller.ts` | checkHealth |
| `product.controller.ts` | getProducts |
| `order.controller.ts` | listOrders, createOrder, getOrder, recordPayment |
| `reports.controller.ts` | getSales |
| `session.controller.ts` | open, list, getCurrent, close |

---

## Services

Located: `server/src/services/`

| File | Purpose |
|------|---------|
| `auth.service.ts` | JWT token logic |
| `health.service.ts` | DB connectivity checks |
| `session.service.ts` | Session management |
| `order.service.ts` | Order CRUD, idempotency |
| `product.service.ts` | Product filtering |

---

## Middleware

Located: `server/src/middleware/`

- helmet() - Security headers
- cors() - Cross-origin sharing  
- express.json()/urlencoded() - Body parsing
- requestLogger - Custom logging
- cookieParser - Session cookies
- requireAuth - JWT validation
- error-handler.ts - Global errors
- not-found.ts - 404 handling

---

## Schemas

Located: `server/src/schemas/`

| File | Use Case |
|------|----------|
| `auth.ts` | Login schema |
| `order.ts` | Order operations schemas |
| `product.ts` | Product filters |
| `session.ts` | Session schemas |

Uses Zod for validation.

---

## Prisma Models

| Model | Purpose |
|-------|---------|
| Staff | User accounts |
| Settings | Singleton config |
| RegisterSession | Cashier sessions |
| Order | Order records |
| OrderItem | Line items |
| Payment | Payment methods |
| OrderEvent | Audit events |
| AuditLog | General audit |
| Counter | System counters |
| IdempotencyKey | Cache for idempotency |

---

## Utilities

Located: `server/src/utils/`

- `app-error.ts` - Custom error class
- `responseHandler.ts` - Response builder

Error codes in: `src/constants/error-codes.ts`

---

## Configuration

Located: `server/src/config/`

- `env.ts` - Environment variables (JWT secret, CORS, etc.)

---

## Features Summary

| Domain | Capabilities |
|--------|--------------|
| Authentication | JWT login/logout, staff lookup, active sessions |
| Products | Catalog listing with search/filter |
| Orders | Create/retrieve/list/pay (idempotent) |
| Sessions | Cashier session lifecycle |
| Reports | Sales reporting |
| Audit | Order events, audit logs |

---

## Security

1. JWT + httpOnly cookies
2. Helmet headers
3. CORS protection
4. Idempotency keys
5. Role-based access (staff active status)
6. Session isolation

---

## Generated Types

Located: `server/src/generated/prisma/`

- client.ts - Main Prisma client
- browser.ts - Browser client
- models.ts, enums.ts - Type definitions
