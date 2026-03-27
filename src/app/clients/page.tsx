import { getDb } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { balancesForClientIds } from "@/lib/balance";
import { formatMad } from "@/lib/format";
import { desc, like, or } from "drizzle-orm";
import Link from "next/link";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const db = getDb();
  const term = q?.trim();
  const pattern = term && term.length >= 1 ? `%${term}%` : "%";

  const rows = term
    ? await db
        .select()
        .from(clients)
        .where(
          or(
            like(clients.nom, pattern),
            like(clients.prenom, pattern),
            like(clients.telephone, pattern),
            like(clients.cin, pattern),
          ),
        )
        .orderBy(desc(clients.updatedAt))
        .limit(100)
    : await db
        .select()
        .from(clients)
        .orderBy(desc(clients.updatedAt))
        .limit(100);

  const balances = await balancesForClientIds(
    db,
    rows.map((r) => r.id),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-zinc-500">
            Recherche par nom, téléphone ou CIN
          </p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Nouveau client
        </Link>
      </div>

      <form className="flex max-w-md gap-2" method="get">
        <input
          name="q"
          defaultValue={term ?? ""}
          placeholder="Rechercher…"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
        >
          OK
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Mutuelle</th>
              <th className="px-4 py-3 text-right">Solde</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  Aucun client trouvé
                </td>
              </tr>
            ) : (
              rows.map((c) => {
                const bal = balances.get(c.id) ?? 0;
                return (
                  <tr
                    key={c.id}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/clients/${c.id}`}
                        className="font-medium text-teal-800 hover:underline dark:text-teal-400"
                      >
                        {c.prenom} {c.nom}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                      {c.telephone ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {c.typeMutuelle ?? "—"}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium tabular-nums ${
                        bal > 0.005
                          ? "text-amber-700 dark:text-amber-400"
                          : "text-zinc-600 dark:text-zinc-400"
                      }`}
                    >
                      {formatMad(bal)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
