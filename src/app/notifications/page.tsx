import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { auth } from "@/auth";
import { formatDateFr } from "@/lib/format";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import Link from "next/link";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const db = getDb();
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, session.user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Notifications</h1>
          <p className="text-sm text-zinc-500">
            Alertes générées par les règles (cron) et événements
          </p>
        </div>
        <form action={markAllNotificationsReadAction}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700"
          >
            Tout marquer lu
          </button>
        </form>
      </div>

      <ul className="space-y-3">
        {rows.length === 0 ? (
          <li className="rounded-2xl border border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950">
            Aucune notification
          </li>
        ) : (
          rows.map((n) => (
            <li
              key={n.id}
              className={`rounded-2xl border p-4 dark:border-zinc-800 ${
                n.readAt
                  ? "border-zinc-100 bg-zinc-50/80 dark:bg-zinc-900/40"
                  : "border-amber-200 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {n.body}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    {formatDateFr(n.createdAt)}
                  </p>
                </div>
                {!n.readAt ? (
                  <form action={markNotificationReadAction.bind(null, n.id)}>
                    <button
                      type="submit"
                      className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
                    >
                      Marquer lu
                    </button>
                  </form>
                ) : null}
              </div>
            </li>
          ))
        )}
      </ul>

      <p className="text-sm text-zinc-500">
        Les règles d’alerte sont configurées dans{" "}
        <Link href="/admin/notifications" className="text-teal-700 underline dark:text-teal-400">
          Administration → Alertes
        </Link>{" "}
        (comptes admin).
      </p>
    </div>
  );
}
