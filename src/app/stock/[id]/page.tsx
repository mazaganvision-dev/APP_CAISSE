import { deleteStockAction, updateStockAction } from "@/app/actions/stock";
import { auth } from "@/auth";
import { formatMad } from "@/lib/format";
import { getDb } from "@/lib/db";
import { clients, stockItems } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const db = getDb();
  const item = await db.query.stockItems.findFirst({
    where: eq(stockItems.id, id),
  });
  if (!item) notFound();

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
    <div className="mx-auto max-w-xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/stock"
            className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
          >
            ← Stock
          </Link>
          <h1 className="mt-2 text-2xl font-semibold">
            {item.marqueMonture} — {item.referenceMonture}
          </h1>
          <p className="text-sm text-zinc-500">
            Prix affiché : {formatMad(item.prixVente)}
          </p>
        </div>
        {isAdmin ? (
          <form action={deleteStockAction.bind(null, id)}>
            <button
              type="submit"
              className="rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400"
            >
              Supprimer
            </button>
          </form>
        ) : null}
      </div>

      <form
        action={updateStockAction.bind(null, id)}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Marque monture *</span>
          <input
            name="marqueMonture"
            required
            defaultValue={item.marqueMonture}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Référence monture *</span>
          <input
            name="referenceMonture"
            required
            defaultValue={item.referenceMonture}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Statut</span>
          <select
            name="statut"
            defaultValue={item.statut}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="en_stock">En stock</option>
            <option value="vendu">Vendu</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Quantité</span>
          <input
            name="quantite"
            type="number"
            min={0}
            defaultValue={item.quantite}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Prix de vente (MAD)</span>
          <input
            name="prixVente"
            type="number"
            step="0.01"
            min={0}
            defaultValue={item.prixVente}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Client lié</span>
          <select
            name="clientId"
            defaultValue={item.clientId ?? ""}
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
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Mettre à jour
        </button>
      </form>
    </div>
  );
}
