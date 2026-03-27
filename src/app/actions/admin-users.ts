"use server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import type { UserRole } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["admin", "worker"]),
});

export async function createUserAction(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Refusé" };
  }

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: "Données invalides" };

  const db = getDb();
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    await db.insert(users).values({
      email: parsed.data.email.trim().toLowerCase(),
      passwordHash,
      name: parsed.data.name.trim(),
      role: parsed.data.role as UserRole,
    });
  } catch {
    return { error: "Email déjà utilisé" };
  }

  await logAudit(db, {
    actorId: session.user.id,
    action: "create",
    entity: "user",
    metadata: { email: parsed.data.email },
  });

  revalidatePath("/admin/users");
}

export async function setUserActiveAction(userId: string, active: boolean) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Refusé");
  }
  if (userId === session.user.id && !active) {
    throw new Error("Impossible de vous désactiver vous-même");
  }

  const db = getDb();
  await db
    .update(users)
    .set({ active, updatedAt: new Date() })
    .where(eq(users.id, userId));

  await logAudit(db, {
    actorId: session.user.id,
    action: active ? "activate" : "deactivate",
    entity: "user",
    entityId: userId,
  });

  revalidatePath("/admin/users");
}

export async function setUserActiveFromFormAction(formData: FormData) {
  const userId = formData.get("userId")?.toString();
  const toActive = formData.get("toActive")?.toString() === "true";
  if (!userId) throw new Error("userId manquant");
  await setUserActiveAction(userId, toActive);
}
