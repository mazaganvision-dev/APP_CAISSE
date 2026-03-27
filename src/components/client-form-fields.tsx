import { clients } from "@/lib/db/schema";

type Client = typeof clients.$inferSelect;

export function ClientFormFields({
  client,
}: {
  client?: Partial<Client>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm sm:col-span-1">
        <span className="font-medium">Nom *</span>
        <input
          name="nom"
          required
          defaultValue={client?.nom ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-1">
        <span className="font-medium">Prénom</span>
        <input
          name="prenom"
          defaultValue={client?.prenom ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Téléphone</span>
        <input
          name="telephone"
          defaultValue={client?.telephone ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          name="email"
          type="email"
          defaultValue={client?.email ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">CIN</span>
        <input
          name="cin"
          defaultValue={client?.cin ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium">Adresse</span>
        <input
          name="adresse"
          defaultValue={client?.adresse ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Type de mutuelle</span>
        <input
          name="typeMutuelle"
          defaultValue={client?.typeMutuelle ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium">Référence monture</span>
        <input
          name="referenceMonture"
          defaultValue={client?.referenceMonture ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium">Médecin traitant</span>
        <input
          name="medecinTraitant"
          defaultValue={client?.medecinTraitant ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium">Notes</span>
        <textarea
          name="notes"
          rows={3}
          defaultValue={client?.notes ?? ""}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
        />
      </label>
    </div>
  );
}
