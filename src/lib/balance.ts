import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db";
import { caisseEntries, clients } from "@/lib/db/schema";

export async function sumClientBalance(db: Db, clientId: string) {
  const rows = await db
    .select({
      direction: caisseEntries.direction,
      montant: caisseEntries.montant,
    })
    .from(caisseEntries)
    .where(eq(caisseEntries.clientId, clientId));

  let balance = 0;
  for (const r of rows) {
    balance += r.direction === "doit" ? r.montant : -r.montant;
  }
  return balance;
}

export async function balancesForClientIds(db: Db, clientIds: string[]) {
  const map = new Map<string, number>();
  for (const id of clientIds) map.set(id, 0);
  if (clientIds.length === 0) return map;

  const rows = await db
    .select({
      clientId: caisseEntries.clientId,
      direction: caisseEntries.direction,
      montant: caisseEntries.montant,
    })
    .from(caisseEntries);

  for (const r of rows) {
    if (!r.clientId || !map.has(r.clientId)) continue;
    const delta = r.direction === "doit" ? r.montant : -r.montant;
    map.set(r.clientId, (map.get(r.clientId) ?? 0) + delta);
  }
  return map;
}

export async function topDebtors(db: Db, limit = 8) {
  const allClients = await db.select({ id: clients.id }).from(clients);
  const ids = allClients.map((c) => c.id);
  const bal = await balancesForClientIds(db, ids);
  const sorted = [...bal.entries()]
    .filter(([, v]) => v > 0.005)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const result = [];
  for (const [clientId, amount] of sorted) {
    const c = await db.query.clients.findFirst({
      where: eq(clients.id, clientId),
    });
    if (c) result.push({ client: c, balance: amount });
  }
  return result;
}
