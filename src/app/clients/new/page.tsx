import { createClientAction } from "@/app/actions/clients";
import { ClientFormFields } from "@/components/client-form-fields";
import Link from "next/link";

export default function NewClientPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/clients"
          className="text-sm font-medium text-teal-700 hover:underline dark:text-teal-400"
        >
          ← Clients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nouveau client</h1>
      </div>
      <form
        action={createClientAction}
        className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950"
      >
        <ClientFormFields />
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
