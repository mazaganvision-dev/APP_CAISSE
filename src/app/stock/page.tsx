import { getDb } from "@/lib/db";
import { stockItems } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";
import { formatMad } from "@/lib/format";

export default async function StockPage() {
  const db = getDb();
  const rows = await db
    .select()
    .from(stockItems)
    .orderBy(desc(stockItems.updatedAt))
    .limit(200);

  const enStock = rows.filter((r) => r.statut === "en_stock");
  const vendu = rows.filter((r) => r.statut === "vendu");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Stock montures</h1>
          <p className="text-sm text-zinc-500">
            Marque, référence, statut, quantité, prix de vente
          </p>
        </div>
        <Link
          href="/stock/new"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Ajouter
        </Link>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        En stock : {enStock.length} ligne(s) · Vendu : {vendu.length} ligne(s)
      </p>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Marque</th>
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Qté</th>
              <th className="px-4 py-3 text-right">Prix</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                  Aucune ligne
                </td>
              </tr>
            ) : (
              rows.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/stock/${s.id}`}
                      className="font-medium text-teal-700 hover:underline dark:text-teal-400"
                    >
                      {s.marqueMonture}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{s.referenceMonture}</td>
                  <td className="px-4 py-3">
                    {s.statut === "en_stock" ? (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        En stock
                      </span>
                    ) : (
                      <span className="rounded bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                        Vendu
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{s.quantite}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatMad(s.prixVente)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
