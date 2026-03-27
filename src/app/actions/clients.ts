"use server";

import { auth } from "@/auth";
import { logAudit } from "@/lib/audit";
import { getDb } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { eq, like, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const clientSchema = z.object({
  nom: z.string().min(1),
  prenom: z.string().optional().default(""),
  telephone: z.string().optional().nullable(),
  email: z.union([z.string().email(), z.null()]).optional(),
  cin: z.string().optional().nullable(),
  adresse: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  typeMutuelle: z.string().optional().nullable(),
  referenceMonture: z.string().optional().nullable(),
  medecinTraitant: z.string().optional().nullable(),
});

export async function createClientAction(
  formData: FormData,
): Promise<{ error?: string } | void> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié" };

  const parsed = clientSchema.safeParse({
    nom: formData.get("nom"),
    prenom: formData.get("prenom") ?? "",
    telephone: emptyToNull(formData.get("telephone")),
    email: emptyToNull(formData.get("email")),
    cin: emptyToNull(formData.get("cin")),
    adresse: emptyToNull(formData.get("adresse")),
    notes: emptyToNull(formData.get("notes")),
    typeMutuelle: emptyToNull(formData.get("typeMutuelle")),
    referenceMonture: emptyToNull(formData.get("referenceMonture")),
    medecinTraitant: emptyToNull(formData.get("medecinTraitant")),
  });
  if (!parsed.success) return { error: "Données invalides" };

  const db = getDb();
  const [row] = await db
    .insert(clients)
    .values({
      ...parsed.data,
      email: parsed.data.email ?? null,
      createdById: session.user.id,
    })
    .returning({ id: clients.id });

  await logAudit(db, {
    actorId: session.user.id,
    action: "create",
    entity: "client",
    entityId: row.id,
  });

  revalidatePath("/clients");
  redirect(`/clients/${row.id}`);
}

export async function updateClientAction(
  clientId: string,
  formData: FormData,
): Promise<{ error?: string } | void> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Non authentifié" };

  const parsed = clientSchema.safeParse({
    nom: formData.get("nom"),
    prenom: formData.get("prenom") ?? "",
    telephone: emptyToNull(formData.get("telephone")),
    email: emptyToNull(formData.get("email")),
    cin: emptyToNull(formData.get("cin")),
    adresse: emptyToNull(formData.get("adresse")),
    notes: emptyToNull(formData.get("notes")),
    typeMutuelle: emptyToNull(formData.get("typeMutuelle")),
    referenceMonture: emptyToNull(formData.get("referenceMonture")),
    medecinTraitant: emptyToNull(formData.get("medecinTraitant")),
  });
  if (!parsed.success) return { error: "Données invalides" };

  const db = getDb();
  await db
    .update(clients)
    .set({
      ...parsed.data,
      email: parsed.data.email ?? null,
      updatedAt: new Date(),
    })
    .where(eq(clients.id, clientId));

  await logAudit(db, {
    actorId: session.user.id,
    action: "update",
    entity: "client",
    entityId: clientId,
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);
}

export async function deleteClientAction(
  clientId: string,
  _formData?: FormData,
) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Non authentifié");
  if (session.user.role !== "admin") throw new Error("Refusé");

  const db = getDb();
  await db.delete(clients).where(eq(clients.id, clientId));
  await logAudit(db, {
    actorId: session.user.id,
    action: "delete",
    entity: "client",
    entityId: clientId,
  });
  revalidatePath("/clients");
  redirect("/clients");
}

export async function searchClientsQuery(q: string) {
  const session = await auth();
  if (!session?.user?.id) return [];
  const term = `%${q.trim()}%`;
  if (q.trim().length < 2) return [];

  const db = getDb();
  return db
    .select()
    .from(clients)
    .where(
      or(
        like(clients.nom, term),
        like(clients.prenom, term),
        like(clients.telephone, term),
        like(clients.cin, term),
      ),
    )
    .limit(20);
}

function emptyToNull(v: FormDataEntryValue | null) {
  const s = v?.toString().trim();
  return s ? s : null;
}
