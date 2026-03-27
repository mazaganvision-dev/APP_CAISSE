import { auth } from "@/auth";
import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { getDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { and, count, eq, isNull } from "drizzle-orm";

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return <>{children}</>;

  const db = getDb();
  const [row] = await db
    .select({ c: count() })
    .from(notifications)
    .where(
      and(
        eq(notifications.userId, session.user.id),
        isNull(notifications.readAt),
      ),
    );

  const unread = Number(row?.c ?? 0);
  const isAdmin = session.user.role === "admin";

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-900">
              {/* Remplacez par /brand/logo.png si vous ajoutez votre fichier */}
              <img
                src="/brand/logo.svg"
                alt="Abdo Optique Mazagan"
                width={36}
                height={36}
                className="h-9 w-9 object-contain p-1"
              />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                Optique Mazagan
              </p>
              <p className="text-xs text-zinc-500">Caisse &amp; clients</p>
            </div>
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            <NavLink href="/">Tableau de bord</NavLink>
            <NavLink href="/clients">Clients</NavLink>
            <NavLink href="/caisse">Caisse</NavLink>
            <NavLink href="/stock">Stock</NavLink>
            <NavLink href="/notifications">
              Notifications
              {unread > 0 ? (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
            </NavLink>
            {isAdmin ? (
              <>
                <NavLink href="/admin/users">Équipe</NavLink>
                <NavLink href="/admin/notifications">Alertes</NavLink>
              </>
            ) : null}
          </nav>
          <div className="flex items-center gap-2 text-sm">
            <span className="hidden text-zinc-600 sm:inline dark:text-zinc-400">
              {session.user.name}
              <span className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 text-xs uppercase text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {session.user.role}
              </span>
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-lg px-2.5 py-1.5 text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-900"
    >
      {children}
    </Link>
  );
}
