import { deleteClientAction, updateClientAction } from "@/app/actions/clients";
import { createCaisseEntryAction } from "@/app/actions/caisse";
import { auth } from "@/auth";
import { ClientFormFields } from "@/components/client-form-fields";
import { sumClientBalance } from "@/lib/balance";
import { formatDateFr, formatMad } from "@/lib/format";
import { getDb } from "@/lib/db";
import { caisseEntries, clients } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const db = getDb();
  const client = await db.query.clients.findFirst({
    where: eq(clients.id, id),
  });
  if (!client) notFound();

  const balance = await sumClientBalance(db, id);
  const entries = await db
    .select()
    .from(caisseEntries)
    .where(eq(caisseEntries.clientId, id))
    .orderBy(desc(caisseEntries.createdAt))
    .limit(25);

  const isAdmin = session?.user?.role === "admin";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/clients"
            className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
          >
            ← Clients
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">
            {client.prenom} {client.nom}
          </h1>
          <p className="text-sm text-zinc-500">
            Solde dû :{" "}
            <span
              className={
                balance > 0.005
                  ? "font-semibold text-amber-700 dark:text-amber-400"
                  : ""
              }
            >
              {formatMad(balance)}
            </span>
          </p>
        </div>
        {isAdmin ? (
          <form action={deleteClientAction.bind(null, id)}>
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
              formNoValidate
            >
              Supprimer le client
            </button>
          </form>
        ) : null}
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Fiche client
        </h2>
        <form
          action={updateClientAction.bind(null, id)}
          className="mt-4 space-y-4"
        >
          <ClientFormFields client={client} />
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Mettre à jour
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Mouvement caisse (ce client)
        </h2>
        <form action={createCaisseEntryAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input type="hidden" name="clientId" value={id} />
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Montant (MAD)</span>
            <input
              name="montant"
              type="number"
              step="0.01"
              min="0.01"
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Sens</span>
            <select
              name="direction"
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="doit">Créance (client doit)</option>
              <option value="paye">Paiement reçu</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Type</span>
            <select
              name="typeDetail"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="lunettes">Lunettes</option>
              <option value="lentilles">Lentilles</option>
              <option value="consultation">Consultation</option>
              <option value="autre">Autre</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Moyen de paiement</span>
            <input
              name="moyenPaiement"
              placeholder="Espèces, carte…"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Référence</span>
            <input
              name="reference"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Note</span>
            <input
              name="note"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            >
              Enregistrer le mouvement
            </button>
          </div>
        </form>

        <ul className="mt-6 divide-y divide-zinc-100 text-sm dark:divide-zinc-800">
          {entries.length === 0 ? (
            <li className="py-3 text-zinc-500">Aucun mouvement</li>
          ) : (
            entries.map((e) => (
              <li key={e.id} className="flex flex-wrap justify-between gap-2 py-3">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {formatDateFr(e.createdAt)}
                  {e.typeDetail ? ` · ${e.typeDetail}` : ""}
                  {e.moyenPaiement ? ` · ${e.moyenPaiement}` : ""}
                </span>
                <span
                  className={`font-medium tabular-nums ${
                    e.direction === "doit"
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-teal-700 dark:text-teal-400"
                  }`}
                >
                  {e.direction === "doit" ? "+" : "−"}
                  {formatMad(e.montant)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
