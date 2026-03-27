import { createStockAction } from "@/app/actions/stock";
import { getDb } from "@/lib/db";
import { clients } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function NewStockPage() {
  const db = getDb();
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
      <div>
        <Link
          href="/stock"
          className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
        >
          ← Stock
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nouvelle ligne stock</h1>
      </div>
      <form
        action={createStockAction}
        className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Marque monture *</span>
          <input
            name="marqueMonture"
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Référence monture *</span>
          <input
            name="referenceMonture"
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Statut</span>
          <select
            name="statut"
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
            defaultValue={1}
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
            defaultValue={0}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Client lié (si vendu)</span>
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
        <button
          type="submit"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
