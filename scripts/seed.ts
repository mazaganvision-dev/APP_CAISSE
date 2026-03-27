import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { notificationRules, users } from "../src/lib/db/schema";

config({ path: ".env.local" });
config();

async function main() {
  const adminEmail =
    process.env.SEED_ADMIN_EMAIL ?? "admin@optique.local";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const workerEmail =
    process.env.SEED_WORKER_EMAIL ?? "employe@optique.local";
  const workerPassword = process.env.SEED_WORKER_PASSWORD;

  const db = getDb();

  const existingAdmin = await db.query.users.findFirst({
    where: eq(users.email, adminEmail.toLowerCase()),
  });
  if (!existingAdmin) {
    if (!adminPassword) {
      console.error(
        "SEED_ADMIN_PASSWORD requis pour créer le compte admin initial.",
      );
      process.exit(1);
    }
    await db.insert(users).values({
      email: adminEmail.trim().toLowerCase(),
      name: "Administrateur",
      role: "admin",
      passwordHash: await bcrypt.hash(adminPassword, 12),
    });
    console.log("Admin créé:", adminEmail);
  } else {
    console.log("Admin déjà présent:", adminEmail);
  }

  const existingWorker = await db.query.users.findFirst({
    where: eq(users.email, workerEmail.toLowerCase()),
  });
  if (!existingWorker) {
    if (!workerPassword) {
      console.error(
        "SEED_WORKER_PASSWORD requis pour créer le compte employé initial.",
      );
      process.exit(1);
    }
    await db.insert(users).values({
      email: workerEmail.trim().toLowerCase(),
      name: "Employé",
      role: "worker",
      passwordHash: await bcrypt.hash(workerPassword, 12),
    });
    console.log("Employé créé:", workerEmail);
  } else {
    console.log("Employé déjà présent:", workerEmail);
  }

  const defaults: { key: string; valueJson: string }[] = [
    { key: "debt_threshold_mad", valueJson: JSON.stringify({ value: 500 }) },
    { key: "stock_low_qty", valueJson: JSON.stringify({ value: 2 }) },
    { key: "whatsapp_enabled", valueJson: JSON.stringify({ value: false }) },
  ];

  for (const d of defaults) {
    const row = await db.query.notificationRules.findFirst({
      where: eq(notificationRules.key, d.key),
    });
    if (!row) {
      await db.insert(notificationRules).values(d);
      console.log("Règle ajoutée:", d.key);
    }
  }

  console.log("Terminé.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
