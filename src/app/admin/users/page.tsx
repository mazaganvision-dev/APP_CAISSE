import {
  createUserAction,
  setUserActiveFromFormAction,
} from "@/app/actions/admin-users";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import Link from "next/link";

export default async function AdminUsersPage() {
  const db = getDb();
  const rows = await db.select().from(users).orderBy(desc(users.createdAt));

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-teal-700 hover:underline dark:text-teal-400">
          ← Tableau de bord
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Équipe &amp; comptes</h1>
        <p className="text-sm text-zinc-500">
          Administrateurs : accès complet. Employés : pas d’administration.
        </p>
      </div>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Nouvel utilisateur
        </h2>
        <form action={createUserAction} className="mt-4 grid max-w-md gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Nom affiché</span>
            <input
              name="name"
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Email</span>
            <input
              name="email"
              type="email"
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Mot de passe (min. 8)</span>
            <input
              name="password"
              type="password"
              minLength={8}
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Rôle</span>
            <select
              name="role"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="worker">Employé</option>
              <option value="admin">Administrateur</option>
            </select>
          </label>
          <button
            type="submit"
            className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Créer
          </button>
        </form>
      </section>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Actif</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr
                key={u.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800/80"
              >
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3 uppercase">{u.role}</td>
                <td className="px-4 py-3">{u.active ? "Oui" : "Non"}</td>
                <td className="px-4 py-3 text-right">
                  <form action={setUserActiveFromFormAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <input
                      type="hidden"
                      name="toActive"
                      value={u.active ? "false" : "true"}
                    />
                    <button
                      type="submit"
                      className="text-xs text-teal-700 hover:underline dark:text-teal-400"
                    >
                      {u.active ? "Désactiver" : "Activer"}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
