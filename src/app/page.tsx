import { auth } from "@/auth";
import { formatMad, formatDateFr } from "@/lib/format";
import { getDb } from "@/lib/db";
import { caisseEntries, clients, stockItems } from "@/lib/db/schema";
import { topDebtors } from "@/lib/balance";
import { and, count, eq, gte, sum } from "drizzle-orm";
import Link from "next/link";

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfDay() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user?.role ?? "worker";
  const db = getDb();
  const monthStart = startOfMonth();
  const dayStart = startOfDay();

  const [[{ totalClients }], [{ newClientsMonth }], [{ payeMonth }], [{ payeToday }]] =
    await Promise.all([
      db.select({ totalClients: count() }).from(clients),
      db
        .select({ newClientsMonth: count() })
        .from(clients)
        .where(gte(clients.createdAt, monthStart)),
      db
        .select({ payeMonth: sum(caisseEntries.montant) })
        .from(caisseEntries)
        .where(
          and(
            eq(caisseEntries.direction, "paye"),
            gte(caisseEntries.createdAt, monthStart),
          ),
        ),
      db
        .select({ payeToday: sum(caisseEntries.montant) })
        .from(caisseEntries)
        .where(
          and(
            eq(caisseEntries.direction, "paye"),
            gte(caisseEntries.createdAt, dayStart),
          ),
        ),
    ]);

  const [[{ enStock }], [{ vendu }], lowStock] = await Promise.all([
    db
      .select({ enStock: sum(stockItems.quantite) })
      .from(stockItems)
      .where(eq(stockItems.statut, "en_stock")),
    db
      .select({ vendu: count() })
      .from(stockItems)
      .where(eq(stockItems.statut, "vendu")),
    db
      .select()
      .from(stockItems)
      .where(eq(stockItems.statut, "en_stock"))
      .then((rows) => rows.filter((r) => r.quantite <= 2).slice(0, 6)),
  ]);

  const debtors = role === "admin" ? await topDebtors(db, 6) : [];

  const payeMonthNum = Number(payeMonth ?? 0);
  const payeTodayNum = Number(payeToday ?? 0);
  const enStockNum = Number(enStock ?? 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Tableau de bord
        </h1>
        <p className="text-sm text-zinc-500">
          Vue d’ensemble — {formatDateFr(new Date())}
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Clients"
          value={String(totalClients)}
          hint={`+${newClientsMonth} ce mois`}
        />
        {role === "admin" ? (
          <>
            <StatCard
              title="Encaissements (mois)"
              value={formatMad(payeMonthNum)}
              hint="Mouvements caisse « payé »"
            />
            <StatCard
              title="Encaissements (jour)"
              value={formatMad(payeTodayNum)}
            />
          </>
        ) : (
          <>
            <StatCard
              title="Encaissements (jour)"
              value={formatMad(payeTodayNum)}
              hint="Vue partielle"
            />
            <StatCard title="Rôle" value="Employé" hint="Métriques sensibles masquées" />
          </>
        )}
        <StatCard
          title="Stock (unités)"
          value={String(enStockNum)}
          hint={`${vendu} lignes vendues`}
        />
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Stock bas (≤ 2)
          </h2>
          <ul className="mt-3 space-y-2 text-sm">
            {lowStock.length === 0 ? (
              <li className="text-zinc-500">Rien à signaler</li>
            ) : (
              lowStock.map((s) => (
                <li key={s.id} className="flex justify-between gap-2">
                  <span>
                    {s.marqueMonture} — {s.referenceMonture}
                  </span>
                  <span className="shrink-0 font-medium">{s.quantite} u.</span>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/stock"
            className="mt-4 inline-block text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
          >
            Voir le stock
          </Link>
        </section>

        {role === "admin" ? (
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Principaux impayés
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {debtors.length === 0 ? (
                <li className="text-zinc-500">Aucun solde positif</li>
              ) : (
                debtors.map(({ client, balance }) => (
                  <li key={client.id} className="flex justify-between gap-2">
                    <Link
                      href={`/clients/${client.id}`}
                      className="truncate hover:underline"
                    >
                      {client.prenom} {client.nom}
                    </Link>
                    <span className="shrink-0 font-medium text-amber-700 dark:text-amber-400">
                      {formatMad(balance)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/clients/new"
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Nouveau client
        </Link>
        <Link
          href="/caisse"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Saisie caisse
        </Link>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}
