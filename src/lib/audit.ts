import type { Db } from "@/lib/db";
import { auditLogs } from "@/lib/db/schema";

export async function logAudit(
  db: Db,
  input: {
    actorId: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  },
) {
  await db.insert(auditLogs).values({
    actorId: input.actorId,
    action: input.action,
    entity: input.entity,
    entityId: input.entityId ?? null,
    metadataJson: input.metadata ? JSON.stringify(input.metadata) : null,
  });
}
