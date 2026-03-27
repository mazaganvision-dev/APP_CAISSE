/**
 * Import clients depuis un CSV exporté depuis Access / Excel.
 *
 * Usage:
 *   npm run import:clients -- chemin/vers/fichier.csv
 *
 * Colonnes reconnues (insensible à la casse, espaces → _) :
 *   nom, prenom, telephone, tel, email, cin, adresse, notes,
 *   type_mutuelle, reference_monture, medecin_traitant
 *
 * Nécessite .env.local avec TURSO_DATABASE_URL et TURSO_AUTH_TOKEN.
 */

import { config } from "dotenv";
import { readFileSync, existsSync } from "fs";
import { getDb } from "../src/lib/db";
import { clients } from "../src/lib/db/schema";

config({ path: ".env.local" });
config();

function normHeader(h: string) {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const ALIASES: Record<string, string> = {
  tel: "telephone",
  typemutuelle: "type_mutuelle",
  referencemonture: "reference_monture",
  medecintraitant: "medecin_traitant",
};

function parseDelimited(line: string, delimiter: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i]!;
    if (c === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (c === delimiter && !inQuotes) {
      out.push(cur.trim().replace(/^"|"$/g, ""));
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur.trim().replace(/^"|"$/g, ""));
  return out;
}

async function main() {
  const path = process.argv[2];
  if (!path || !existsSync(path)) {
    console.error("Usage: npm run import:clients -- <fichier.csv>");
    process.exit(1);
  }

  const raw = readFileSync(path, "utf-8");
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    console.error("CSV vide ou sans en-tête");
    process.exit(1);
  }

  const headerLine = lines[0]!;
  const delimiter = headerLine.includes(";") ? ";" : ",";
  const headers = parseDelimited(headerLine, delimiter).map((h) => {
    const n = normHeader(h);
    return ALIASES[n] ?? n;
  });

  const db = getDb();
  let inserted = 0;
  const batch: (typeof clients.$inferInsert)[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseDelimited(lines[i]!, delimiter);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = cells[idx] ?? "";
    });

    const nom = (row.nom ?? "").trim() || "Inconnu";
    const prenom = (row.prenom ?? "").trim();
    const telephone = empty(row.telephone);
    const email = empty(row.email);
    const cin = empty(row.cin);
    const adresse = empty(row.adresse);
    const notes = empty(row.notes);
    const typeMutuelle = empty(row.type_mutuelle);
    const referenceMonture = empty(row.reference_monture);
    const medecinTraitant = empty(row.medecin_traitant);

    batch.push({
      nom,
      prenom,
      telephone,
      email,
      cin,
      adresse,
      notes,
      typeMutuelle,
      referenceMonture,
      medecinTraitant,
    });

    if (batch.length >= 50) {
      await db.insert(clients).values(batch);
      inserted += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length) {
    await db.insert(clients).values(batch);
    inserted += batch.length;
  }

  console.log(`Import terminé : ${inserted} ligne(s).`);
}

function empty(v: string | undefined) {
  const s = v?.trim();
  return s ? s : null;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
