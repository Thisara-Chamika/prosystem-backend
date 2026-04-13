# ── Base Image ────────────────────────────────────
FROM node:24-alpine

# ── Set working directory ─────────────────────────
WORKDIR /app

# ── Copy package files first ──────────────────────
COPY package*.json ./

# ── Install ALL dependencies (need tsc to build) ──
RUN npm ci

# ── Copy source code ──────────────────────────────
COPY . .

# ── Build TypeScript ──────────────────────────────
RUN npm run build

# ── Remove dev dependencies after build ───────────
RUN npm prune --production

# ── Expose port ───────────────────────────────────
EXPOSE 5000

# ── Start the app ─────────────────────────────────
CMD ["node", "dist/server.js"]