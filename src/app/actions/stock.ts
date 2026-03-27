"use server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { stockItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const stockSchema = z.object({
  marqueMonture: z.string().min(1),
  referenceMonture: z.string().min(1),
  statut: z.enum(["en_stock", "vendu"]),
  quantite: z.coerce.number().int().min(0),
  prixVente: z.coerce.number().min(0),
  clientId: z.string().min(1).nullable().optional(),
});

export async function createStockAction(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié" };

  const clientRaw = formData.get("clientId");
  const clientId =
    typeof clientRaw === "string" && clientRaw.length > 0 ? clientRaw : null;

  const parsed = stockSchema.safeParse({
    marqueMonture: formData.get("marqueMonture"),
    referenceMonture: formData.get("referenceMonture"),
    statut: formData.get("statut"),
    quantite: formData.get("quantite"),
    prixVente: formData.get("prixVente"),
    clientId,
  });
  if (!parsed.success) return { error: "Données invalides" };

  const db = getDb();
  const [row] = await db
    .insert(stockItems)
    .values({
      ...parsed.data,
      clientId: parsed.data.clientId ?? null,
      createdById: session.user.id,
    })
    .returning({ id: stockItems.id });

  await logAudit(db, {
    actorId: session.user.id,
    action: "create",
    entity: "stock_item",
    entityId: row.id,
  });

  revalidatePath("/stock");
  revalidatePath("/");
  redirect(`/stock/${row.id}`);
}

export async function updateStockAction(
  itemId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié" };

  const clientRaw = formData.get("clientId");
  const clientId =
    typeof clientRaw === "string" && clientRaw.length > 0 ? clientRaw : null;

  const parsed = stockSchema.safeParse({
    marqueMonture: formData.get("marqueMonture"),
    referenceMonture: formData.get("referenceMonture"),
    statut: formData.get("statut"),
    quantite: formData.get("quantite"),
    prixVente: formData.get("prixVente"),
    clientId,
  });
  if (!parsed.success) return { error: "Données invalides" };

  const db = getDb();
  await db
    .update(stockItems)
    .set({
      ...parsed.data,
      clientId: parsed.data.clientId ?? null,
      updatedAt: new Date(),
    })
    .where(eq(stockItems.id, itemId));

  await logAudit(db, {
    actorId: session.user.id,
    action: "update",
    entity: "stock_item",
    entityId: itemId,
  });

  revalidatePath("/stock");
  revalidatePath(`/stock/${itemId}`);
  revalidatePath("/");
}

export async function deleteStockAction(
  itemId: string,
  _formData?: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  if (session.user.role !== "admin") throw new Error("Refusé");

  const db = getDb();
  await db.delete(stockItems).where(eq(stockItems.id, itemId));
  await logAudit(db, {
    actorId: session.user.id,
    action: "delete",
    entity: "stock_item",
    entityId: itemId,
  });
  revalidatePath("/stock");
  revalidatePath("/");
  redirect("/stock");
}
