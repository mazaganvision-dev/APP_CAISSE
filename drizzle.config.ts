import { defineConfig } from "drizzle-kit";

const url = process.env.TURSO_DATABASE_URL?.trim();
const authToken = process.env.TURSO_AUTH_TOKEN?.trim();

if (!url || !authToken) {
  throw new Error(
    "drizzle.config: define TURSO_DATABASE_URL and TURSO_AUTH_TOKEN (see .env.example). On Vercel, these must be available at build time if you use npm run vercel-build.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url,
    authToken,
  },
});
