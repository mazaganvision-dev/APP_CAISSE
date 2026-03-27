import { getDb } from "@/lib/db";
import {
  clients,
  notificationRules,
  notifications,
  stockItems,
  users,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { balancesForClientIds } from "@/lib/balance";
import { sendWhatsAppIfConfigured } from "@/lib/notifications/whatsapp";

function parseRuleNumber(rule: { valueJson: string } | undefined, fallback: number) {
  if (!rule) return fallback;
  try {
    const v = JSON.parse(rule.valueJson) as { value?: number };
    if (typeof v.value === "number" && Number.isFinite(v.value)) return v.value;
  } catch {
    /* ignore */
  }
  return fallback;
}

function parseRuleBool(rule: { valueJson: string } | undefined, fallback: boolean) {
  if (!rule) return fallback;
  try {
    const v = JSON.parse(rule.valueJson) as { value?: boolean };
    if (typeof v.value === "boolean") return v.value;
  } catch {
    /* ignore */
  }
  return fallback;
}

export async function runScheduledNotifications() {
  const db = getDb();
  const rules = await db.select().from(notificationRules);

  const debtRule = rules.find((r) => r.key === "debt_threshold_mad");
  let debtThreshold: number | null = null;
  if (!debtRule) debtThreshold = 500;
  else if (debtRule.enabled) debtThreshold = parseRuleNumber(debtRule, 500);

  const stockRule = rules.find((r) => r.key === "stock_low_qty");
  let stockLow: number | null = null;
  if (!stockRule) stockLow = 2;
  else if (stockRule.enabled) stockLow = parseRuleNumber(stockRule, 2);

  const waRule = rules.find((r) => r.key === "whatsapp_enabled");
  const whatsappEnabled =
    waRule && waRule.enabled ? parseRuleBool(waRule, false) : false;

  const admins = await db
    .select()
    .from(users)
    .where(eq(users.role, "admin"));

  const activeAdmins = admins.filter((u) => u.active);
  if (activeAdmins.length === 0) return { created: 0 };

  const allClients = await db.select({ id: clients.id }).from(clients);
  const balances = await balancesForClientIds(
    db,
    allClients.map((c) => c.id),
  );

  const debtClients =
    debtThreshold === null
      ? []
      : [...balances.entries()].filter(([, b]) => b >= debtThreshold);

  const lowStock = await db
    .select()
    .from(stockItems)
    .where(eq(stockItems.statut, "en_stock"));

  const lowLines =
    stockLow === null
      ? []
      : lowStock.filter((s) => s.quantite <= stockLow);

  let created = 0;
  const titlesBodies: { title: string; body: string; payload?: unknown }[] = [];

  if (debtThreshold !== null && debtClients.length > 0) {
    titlesBodies.push({
      title: "Créances à suivre",
      body: `${debtClients.length} client(s) avec solde ≥ ${debtThreshold} MAD.`,
      payload: { kind: "debt", count: debtClients.length },
    });
  }

  if (stockLow !== null && lowLines.length > 0) {
    titlesBodies.push({
      title: "Stock bas",
      body: `${lowLines.length} ligne(s) de montures en stock ≤ ${stockLow} unité(s).`,
      payload: { kind: "stock_low", count: lowLines.length },
    });
  }

  for (const item of titlesBodies) {
    for (const admin of activeAdmins) {
      await db.insert(notifications).values({
        userId: admin.id,
        title: item.title,
        body: item.body,
        payloadJson: item.payload ? JSON.stringify(item.payload) : null,
      });
      created += 1;
    }
  }

  if (whatsappEnabled && titlesBodies.length > 0) {
    const to = process.env.WHATSAPP_TO_E164 ?? "";
    if (to) {
      const body = titlesBodies.map((t) => `${t.title}: ${t.body}`).join("\n");
      await sendWhatsAppIfConfigured({ toE164: to, body });
    }
  }

  return { created };
}
