/**
 * Vercel build: drizzle-kit push (schema) then next build.
 * Requires TURSO_DATABASE_URL + TURSO_AUTH_TOKEN to be available during the build step.
 */
import { execSync } from "node:child_process";

const url = process.env.TURSO_DATABASE_URL?.trim();
const token = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url || !token) {
  console.error(`
[vercel-build] Missing Turso credentials for drizzle-kit push.

Set these in Vercel → Project → Settings → Environment Variables
(for Production, and Preview if you use preview deploys):

  TURSO_DATABASE_URL   = your libsql://... URL from Turso
  TURSO_AUTH_TOKEN     = your database auth token from Turso

Important:
- Names must match exactly (case-sensitive).
- In Vercel, if a variable is marked "Sensitive", it may NOT be injected during
  the build step—only at runtime. Then drizzle-kit sees url: undefined.
  Fix: disable Sensitive for these two variables, OR set Build Command to
  "npm run build" and run "npm run db:push" locally once with prod credentials.

See README → Déploiement Vercel.
`);
  process.exit(1);
}

execSync("npx drizzle-kit push", { stdio: "inherit", env: process.env });
execSync("npx next build", { stdio: "inherit", env: process.env });
