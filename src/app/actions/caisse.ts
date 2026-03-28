"use server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { caisseEntries } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const entrySchema = z.object({
  clientId: z.string().min(1).nullable().optional(),
  montant: z.coerce.number().positive(),
  direction: z.enum(["doit", "paye"]),
  typeDetail: z.string().min(1).max(80).default("autre"),
  moyenPaiement: z.string().max(80).optional().nullable(),
  reference: z.string().max(120).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function createCaisseEntryAction(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;

  const clientRaw = formData.get("clientId");
  const clientId =
    typeof clientRaw === "string" && clientRaw.length > 0 ? clientRaw : null;

  const parsed = entrySchema.safeParse({
    clientId,
    montant: formData.get("montant"),
    direction: formData.get("direction"),
    typeDetail: formData.get("typeDetail") ?? "autre",
    moyenPaiement: emptyToNull(formData.get("moyenPaiement")),
    reference: emptyToNull(formData.get("reference")),
    note: emptyToNull(formData.get("note")),
  });
  if (!parsed.success) return;

  if (parsed.data.direction === "doit" && !parsed.data.clientId) {
    return;
  }

  const db = getDb();
  await db.insert(caisseEntries).values({
    clientId: parsed.data.clientId,
    montant: parsed.data.montant,
    direction: parsed.data.direction,
    typeDetail: parsed.data.typeDetail,
    moyenPaiement: parsed.data.moyenPaiement,
    reference: parsed.data.reference,
    note: parsed.data.note,
    createdById: session.user.id,
  });

  await logAudit(db, {
    actorId: session.user.id,
    action: "create",
    entity: "caisse_entry",
    metadata: { clientId: parsed.data.clientId },
  });

  revalidatePath("/caisse");
  if (parsed.data.clientId) revalidatePath(`/clients/${parsed.data.clientId}`);
  revalidatePath("/");
}

export async function deleteCaisseEntryAction(
  entryId: string,
  _formData?: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  if (session.user.role !== "admin") throw new Error("Refusé");

  const db = getDb();
  const row = await db.query.caisseEntries.findFirst({
    where: eq(caisseEntries.id, entryId),
  });
  await db.delete(caisseEntries).where(eq(caisseEntries.id, entryId));
  await logAudit(db, {
    actorId: session.user.id,
    action: "delete",
    entity: "caisse_entry",
    entityId: entryId,
  });
  revalidatePath("/caisse");
  if (row?.clientId) revalidatePath(`/clients/${row.clientId}`);
  revalidatePath("/");
}

function emptyToNull(v: FormDataEntryValue | null) {
  const s = v?.toString().trim();
  return s ? s : null;
}
