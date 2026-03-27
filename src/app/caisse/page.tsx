import { createCaisseEntryAction, deleteCaisseEntryAction } from "@/app/actions/caisse";
import { auth } from "@/auth";
import { formatDateFr, formatMad } from "@/lib/format";
import { getDb } from "@/lib/db";
import { caisseEntries, clients } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function CaissePage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const db = getDb();
  const recent = await db
    .select({
      entry: caisseEntries,
      clientNom: clients.nom,
      clientPrenom: clients.prenom,
    })
    .from(caisseEntries)
    .leftJoin(clients, eq(caisseEntries.clientId, clients.id))
    .orderBy(desc(caisseEntries.createdAt))
    .limit(40);

  const clientOptions = await db
    .select({
      id: clients.id,
      nom: clients.nom,
      prenom: clients.prenom,
    })
    .from(clients)
    .orderBy(desc(clients.updatedAt))
    .limit(200);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Caisse</h1>
        <p className="text-sm text-zinc-500">
          Saisie des créances et des encaissements
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Nouveau mouvement
        </h2>
        <form action={createCaisseEntryAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
            <span className="font-medium">Client (optionnel pour encaissement comptant)</span>
            <select
              name="clientId"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="">— Aucun —</option>
              {clientOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.prenom} {c.nom}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
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
              <option value="paye">Encaissement</option>
              <option value="doit">Créance (vente à crédit)</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm sm:col-span-2">
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
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
            >
              Valider
            </button>
          </div>
        </form>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Sens</th>
              <th className="px-4 py-3 text-right">Montant</th>
              {isAdmin ? <th className="px-4 py-3" /> : null}
            </tr>
          </thead>
          <tbody>
            {recent.map(({ entry, clientNom, clientPrenom }) => (
              <tr
                key={entry.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
              >
                <td className="px-4 py-3 whitespace-nowrap text-zinc-600 dark:text-zinc-400">
                  {formatDateFr(entry.createdAt)}
                </td>
                <td className="px-4 py-3">
                  {entry.clientId ? (
                    <Link
                      href={`/clients/${entry.clientId}`}
                      className="text-teal-700 hover:underline dark:text-teal-400"
                    >
                      {clientPrenom} {clientNom}
                    </Link>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {entry.direction === "doit" ? "Créance" : "Encaissement"}
                </td>
                <td
                  className={`px-4 py-3 text-right font-medium tabular-nums ${
                    entry.direction === "doit"
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-teal-700 dark:text-teal-400"
                  }`}
                >
                  {entry.direction === "doit" ? "+" : "−"}
                  {formatMad(entry.montant)}
                </td>
                {isAdmin ? (
                  <td className="px-4 py-3 text-right">
                    <form action={deleteCaisseEntryAction.bind(null, entry.id)}>
                      <button
                        type="submit"
                        className="text-xs text-red-600 hover:underline dark:text-red-400"
                      >
                        Supprimer
                      </button>
                    </form>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
