"use server";

import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { notificationRules, notifications } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export async function markNotificationReadAction(
  id: string,
  _formData?: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const db = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(eq(notifications.id, id));

  revalidatePath("/notifications");
  revalidatePath("/");
}

export async function markAllNotificationsReadAction() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");

  const db = getDb();
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        isNull(notifications.readAt),
      ),
    );
  revalidatePath("/notifications");
  revalidatePath("/");
}

const ruleSchema = z.object({
  key: z.string().min(1),
  valueJson: z.string().min(1),
  enabled: z.boolean(),
});

export async function upsertNotificationRuleAction(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Refusé" };
  }

  const parsed = ruleSchema.safeParse({
    key: formData.get("key"),
    valueJson: formData.get("valueJson"),
    enabled: formData.get("enabled") === "on" ? true : false,
  });
  if (!parsed.success) return { error: "Données invalides" };

  try {
    JSON.parse(parsed.data.valueJson);
  } catch {
    return { error: "JSON invalide" };
  }

  const db = getDb();
  const existing = await db.query.notificationRules.findFirst({
    where: eq(notificationRules.key, parsed.data.key),
  });

  if (existing) {
    await db
      .update(notificationRules)
      .set({
        valueJson: parsed.data.valueJson,
        enabled: parsed.data.enabled,
        updatedAt: new Date(),
      })
      .where(eq(notificationRules.id, existing.id));
  } else {
    await db.insert(notificationRules).values({
      key: parsed.data.key,
      valueJson: parsed.data.valueJson,
      enabled: parsed.data.enabled,
    });
  }

  revalidatePath("/admin/notifications");
}
