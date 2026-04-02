# ProSystem Backend 🚀

A cloud-based multi-tenant SaaS Point of Sale (POS) platform built with Node.js, Express, TypeScript, DrizzleORM and PostgreSQL.

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **Language:** TypeScript
- **ORM:** Drizzle ORM
- **Database:** PostgreSQL
- **Architecture:** Multi-tenant with Row Level Security (RLS)

## 📁 Project Structure
```
src/
├── config/          → App configuration
├── db/
│   ├── schema/      → Drizzle table definitions
│   └── migrations/  → Database migrations
├── modules/
│   ├── auth/        → Authentication
│   ├── products/    → Products management
│   └── pos/         → Point of Sale
├── middlewares/     → Error handling, auth
├── utils/           → Helper functions
├── types/           → TypeScript types
└── enums/           → TypeScript enums
```

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- PostgreSQL v13+

### Installation

1. Clone the repository
```bash
git clone https://github.com/YOUR_USERNAME/prosystem-backend.git
```

2. Install dependencies
```bash
npm install
```

3. Setup environment variables
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials

5. Run the development server
```bash
npm run dev
```

## 📜 Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Development | `npm run dev` | Start dev server with hot reload |
| Build | `npm run build` | Compile TypeScript |
| Start | `npm start` | Run production build |
| DB Generate | `npm run db:generate` | Generate migrations |
| DB Migrate | `npm run db:migrate` | Run migrations |
| DB Studio | `npm run db:studio` | Open Drizzle Studio |

## 🌿 Branch Strategy

- `main` → Production ready code only
- `develop` → Main development branch
- `feature/*` → New features
- `fix/*` → Bug fixes
- `hotfix/*` → Emergency production fixes

## 👨‍💻 Author
Thisara Chamika
```

---

**Now let's set up the branching strategy! 🌿**

This is called **Git Flow** — the most popular branching strategy in the industry!

> Think of it like a **river system:**
> - `main` = The **ocean** — only clean, finished water gets here
> - `develop` = The **main river** — all work flows through here
> - `feature/*` = **Small streams** — each new feature has its own stream
> - `fix/*` = **Repair canals** — for fixing bugs
> - `hotfix/*` = **Emergency pipeline** — for critical production fixes

---

**Here's how it works visually:**
```
main ────────────────────────────── (production)
         ↑                    ↑
develop ─────────────────────────── (development)
         ↑          ↑
feature/auth    feature/products    (features)