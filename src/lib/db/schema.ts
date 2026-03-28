import { relations } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const userRoleEnum = ["admin", "worker"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const caisseDirectionEnum = ["doit", "paye"] as const;
export const stockStatutEnum = ["en_stock", "vendu"] as const;

export const users = sqliteTable(
  "users",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: text("role", { enum: userRoleEnum }).notNull().default("worker"),
    active: integer("active", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("users_email_idx").on(t.email)],
);

export const clients = sqliteTable(
  "clients",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    nom: text("nom").notNull(),
    prenom: text("prenom").notNull().default(""),
    telephone: text("telephone"),
    email: text("email"),
    cin: text("cin"),
    adresse: text("adresse"),
    notes: text("notes"),
    typeMutuelle: text("type_mutuelle"),
    referenceMonture: text("reference_monture"),
    medecinTraitant: text("medecin_traitant"),
    createdById: text("created_by_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("clients_telephone_idx").on(t.telephone),
    index("clients_nom_prenom_idx").on(t.nom, t.prenom),
  ],
);

export const caisseEntries = sqliteTable(
  "caisse_entries",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    montant: real("montant").notNull(),
    direction: text("direction", { enum: caisseDirectionEnum }).notNull(),
    typeDetail: text("type_detail").notNull().default("autre"),
    moyenPaiement: text("moyen_paiement"),
    reference: text("reference"),
    note: text("note"),
    createdById: text("created_by_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("caisse_client_idx").on(t.clientId),
    index("caisse_created_idx").on(t.createdAt),
  ],
);

export const stockItems = sqliteTable(
  "stock_items",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    marqueMonture: text("marque_monture").notNull(),
    referenceMonture: text("reference_monture").notNull(),
    statut: text("statut", { enum: stockStatutEnum }).notNull().default("en_stock"),
    quantite: integer("quantite").notNull().default(1),
    prixVente: real("prix_vente").notNull().default(0),
    clientId: text("client_id").references(() => clients.id, {
      onDelete: "set null",
    }),
    createdById: text("created_by_id").references(() => users.id),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [
    index("stock_marque_ref_idx").on(t.marqueMonture, t.referenceMonture),
    index("stock_statut_idx").on(t.statut),
  ],
);

export const notificationRules = sqliteTable("notification_rules", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  key: text("key").notNull().unique(),
  valueJson: text("value_json").notNull().default("{}"),
  enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const notifications = sqliteTable(
  "notifications",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    payloadJson: text("payload_json"),
    readAt: integer("read_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("notif_user_read_idx").on(t.userId, t.readAt)],
);

export const auditLogs = sqliteTable(
  "audit_logs",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    actorId: text("actor_id").references(() => users.id, {
      onDelete: "set null",
    }),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    metadataJson: text("metadata_json"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (t) => [index("audit_entity_idx").on(t.entity, t.entityId)],
);

export const usersRelations = relations(users, ({ many }) => ({
  notifications: many(notifications),
}));

export const clientsRelations = relations(clients, ({ many, one }) => ({
  caisseEntries: many(caisseEntries),
  stockItems: many(stockItems),
  createdBy: one(users, {
    fields: [clients.createdById],
    references: [users.id],
  }),
}));

export const caisseEntriesRelations = relations(caisseEntries, ({ one }) => ({
  client: one(clients, {
    fields: [caisseEntries.clientId],
    references: [clients.id],
  }),
}));

export const stockItemsRelations = relations(stockItems, ({ one }) => ({
  client: one(clients, {
    fields: [stockItems.clientId],
    references: [clients.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
