# ProSystem Backend 🚀

A cloud-based, multi-tenant SaaS Point of Sale (POS) platform built with Node.js, Express, TypeScript, Drizzle ORM and PostgreSQL — featuring row-level security multi-tenancy, a plugin architecture, and a customer loyalty engine.

![Node.js](https://img.shields.io/badge/Node.js-v24-339933?logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-v6-3178C6?logo=typescript&logoColor=white)
![Express](https://img.shields.io/badge/Express-v4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-v18-4169E1?logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

---

## 📖 Overview

ProSystem is a full-stack SaaS POS platform designed to serve any retail or service business through a universal core engine and an extensible plugin system. A single shop owner registers, selects a business type, and the platform provisions default categories, tax rules, and business-relevant plugins automatically.

Built as a portfolio project to demonstrate production-grade architecture decisions around multi-tenancy, security, extensibility, and real-world SaaS operational concerns (email notifications, audit trails, role-based access control).

---

## 🛠️ Tech Stack

**Backend**
- Node.js v24 + Express v4 + TypeScript v6
- Drizzle ORM (TypeScript-first, SQL-like syntax)
- PostgreSQL v18 with Row Level Security (RLS)

**Auth & Security**
- JWT (stateless authentication) + bcrypt (password hashing)
- PostgreSQL RLS — database-level tenant isolation, not just application-level
- Manager PIN approval workflow for sensitive cashier actions

**Integrations**
- Nodemailer + Gmail SMTP — transactional emails (receipts, welcome emails, low-stock alerts)

**DevOps**
- Docker + Docker Compose (local containerized development)
- Deployed via Railway (backend), Supabase (PostgreSQL, Singapore region), Vercel (frontend — separate repo)

---

## ✨ Key Features

**Multi-Tenancy & Security**
- Shared-schema architecture with PostgreSQL RLS enforced at the database level
- Role-based access control: `shop_owner`, `shop_manager`, `cashier`
- Manager PIN approval required for cashier-initiated returns
- Full audit log of sensitive actions (staff changes, settings updates, returns, plugin installs)

**Shop Onboarding**
- Business type selection with automatic default category seeding
- Business-type-aware plugin auto-installation

**Products & Inventory**
- Product/Service distinction — services skip inventory tracking entirely
- Dedicated inventory module with low-stock detection and configurable reorder points
- Category management per shop

**Point of Sale**
- Full transaction lifecycle with per-product tax calculation
- Split payment methods (cash / card / online), gated by installed plugins
- Returns & refunds with partial-return support and inventory auto-restoration

**Customer CRM & Loyalty**
- Customer profiles with lifetime spend, visit history, and purchase history
- Points-based loyalty program with Bronze/Silver/Gold tiers
- Configurable earning rates, redemption values, and tier thresholds per shop
- Atomic point redemption — bundled into the transaction itself, never a separate pre-checkout call

**Plugin Architecture**
- Custom-built Plugin Engine with lifecycle hooks (`onInstall`, `onUninstall`, `beforeCheckout`, `afterSale`)
- Business type (what a shop *is*) is fully decoupled from installed plugins (what a shop *uses*)
- Product Variants plugin — dynamic, business-agnostic attributes (size/color for fashion, volume/type for salons, dosage/form for pharmacies) instead of hardcoded fields

**Reports & Notifications**
- Sales, top-products, payment-method, and cashier-performance reports
- Automated email notifications: shop welcome, staff welcome, customer welcome, purchase receipts, daily low-stock alerts — each individually toggleable per shop

---

## 📁 Project Structure

```
src/
├── config/                 → Database connection & app config
├── db/
│   ├── schema/              → Drizzle table definitions
│   └── migrations/          → Sequential SQL migrations
├── enums/                   → Roles, audit actions, category defaults
├── middlewares/             → Auth, RLS context, plugin-access gating
├── modules/
│   ├── auth/                 → Register, login, JWT, manager PIN
│   ├── shops/                 → Onboarding, business type, settings, email preferences
│   ├── products/               → Product CRUD (product / service type)
│   ├── inventory/               → Stock levels, low-stock alerts, reorder points
│   ├── customers/                → Customer CRM
│   ├── pos/                       → Transactions & checkout
│   ├── returns/                    → Return / refund processing
│   ├── staff/                       → Staff management (RBAC)
│   ├── categories/                   → Product categories
│   ├── reports/                       → Sales analytics
│   ├── audit-logs/                     → Activity tracking
│   ├── loyalty/                         → Points, tiers, redemption
│   ├── dashboard/                        → Cashier daily summary
│   └── plugins/                           → Plugin marketplace endpoints
├── plugins/
│   ├── PluginEngine.ts        → Core engine — install/uninstall, hook runner
│   ├── PluginRegistry.ts      → Catalogue of available plugins
│   └── product-variants/      → Dynamic variant plugin (hooks, migrations)
├── services/
│   └── EmailService.ts        → Transactional email templates
├── utils/                     → Audit logging, low-stock checker, helpers
└── app.ts / server.ts
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v24+
- PostgreSQL v18+
- Docker & Docker Compose (optional, for containerized setup)

### Installation

```bash
git clone https://github.com/YOUR_USERNAME/prosystem-backend.git
cd prosystem-backend
npm install
cp .env.example .env
```

Update `.env` with your own values (see table below), then:

```bash
npm run dev
```

### Docker (alternative)

```bash
docker-compose up --build -d
```

---

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | Backend server port |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Strong random secret for signing tokens — never use a placeholder value |
| `JWT_EXPIRES_IN` | Token expiry (e.g. `7d`) |
| `FRONTEND_URL` | Deployed frontend origin, for CORS |
| `GMAIL_USER` | Sender Gmail address for transactional emails |
| `GMAIL_APP_PASSWORD` | Gmail App Password (not your regular account password) |

---

## 📜 Available Scripts

| Script | Command | Description |
|---|---|---|
| Development | `npm run dev` | Start dev server with hot reload |
| Build | `npm run build` | Compile TypeScript |
| Start | `npm start` | Run production build |
| DB Generate | `npm run db:generate` | Generate migrations |
| DB Migrate | `npm run db:migrate` | Run migrations |
| DB Studio | `npm run db:studio` | Open Drizzle Studio |

---

## 🌿 Branch Strategy

Git Flow — feature branches merge to `develop`, `develop` merges to `main` only when stable.

```
main         → production-ready code only
develop      → active development, integration branch
feature/*    → new features, deleted after merge
fix/*        → bug fixes, deleted after merge
```

---

## ☁️ Deployment

| Layer | Platform |
|---|---|
| Backend API | Railway |
| Database | Supabase (PostgreSQL, Singapore region) |
| Frontend | Vercel |

CI/CD is active on push to `main` for both Railway and Vercel.

---

## 🗺️ Roadmap

- [ ] Input validation middleware (Joi) across all endpoints
- [ ] API rate limiting
- [ ] Database indexing pass for high-traffic queries
- [ ] JWT refresh token rotation
- [ ] Redis caching for reports

---

## 👨‍💻 Author

Thisara Chamika