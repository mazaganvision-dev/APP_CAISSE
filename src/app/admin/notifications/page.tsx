import { upsertNotificationRuleAction } from "@/app/actions/notifications";
import { getDb } from "@/lib/db";
import { notificationRules } from "@/lib/db/schema";
import Link from "next/link";

const DEFAULT_HELP: Record<string, string> = {
  debt_threshold_mad:
    "Notifier si le solde d’un client atteint au moins ce montant (MAD). JSON : {\"value\":500}",
  stock_low_qty:
    "Notifier si une ligne « en stock » a une quantité inférieure ou égale à ce seuil. JSON : {\"value\":2}",
  whatsapp_enabled:
    "Activer l’envoi WhatsApp (nécessite variables d’environnement). JSON : {\"value\":true}",
};

export default async function AdminNotificationsPage() {
  const db = getDb();
  const rules = await db.select().from(notificationRules);

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-teal-700 hover:underline dark:text-teal-400">
          ← Tableau de bord
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Règles de notification</h1>
        <p className="text-sm text-zinc-500">
          Utilisées par le cron Vercel{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-900">
            /api/cron/notifications
          </code>
          . Configurez{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-900">
            CRON_SECRET
          </code>{" "}
          en production.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Ajouter ou mettre à jour une règle
        </h2>
        <form action={upsertNotificationRuleAction} className="mt-4 grid max-w-xl gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Clé</span>
            <select
              name="key"
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="debt_threshold_mad">debt_threshold_mad</option>
              <option value="stock_low_qty">stock_low_qty</option>
              <option value="whatsapp_enabled">whatsapp_enabled</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Valeur (JSON)</span>
            <textarea
              name="valueJson"
              required
              rows={3}
              defaultValue='{"value":500}'
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-xs dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="enabled" defaultChecked className="rounded" />
            <span>Activée</span>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Enregistrer
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Règles actuelles
        </h2>
        <ul className="mt-4 space-y-4 text-sm">
          {rules.length === 0 ? (
            <li className="text-zinc-500">
              Aucune règle en base — exécutez{" "}
              <code className="rounded bg-zinc-100 px-1 text-xs dark:bg-zinc-900">
                npm run seed
              </code>{" "}
              pour les valeurs par défaut.
            </li>
          ) : (
            rules.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border border-zinc-100 p-3 dark:border-zinc-800"
              >
                <p className="font-mono text-xs font-semibold">{r.key}</p>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {DEFAULT_HELP[r.key] ?? "Paramètre personnalisé"}
                </p>
                <pre className="mt-2 overflow-x-auto rounded bg-zinc-50 p-2 text-xs dark:bg-zinc-900">
                  {r.valueJson}
                </pre>
                <p className="mt-1 text-xs text-zinc-500">
                  {r.enabled ? "Activée" : "Désactivée"}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
