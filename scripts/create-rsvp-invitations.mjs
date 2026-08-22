import { createHash, randomBytes } from "node:crypto";
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { neon } from "@neondatabase/serverless";
import QRCode from "qrcode";
import { z } from "zod";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

const invitationSchema = z
  .array(
    z
      .object({
        householdName: z.string().trim().min(1).max(120),
        locale: z.enum(["it", "en"]).default("it"),
        deadline: z.string().datetime({ offset: true }).nullable().optional(),
        invitees: z.array(z.string().trim().min(1).max(120)).min(1).max(20)
      })
      .strict()
  )
  .min(1)
  .max(500);

function isInsideRepository(candidatePath) {
  const relativePath = path.relative(repositoryRoot, candidatePath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function csvCell(value) {
  let text = String(value).replaceAll("\0", "");
  if (/^[\t\r\n ]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }
  return `"${text.replaceAll('"', '""')}"`;
}

function fail(message) {
  console.error(message);
  process.exit(2);
}

const inputArgument = process.argv[2];
const outputArgument = process.argv[3];

if (!inputArgument) {
  fail(
    "Uso: npm run create:rsvp-invitations -- /percorso/lista.json [/percorso/output]"
  );
}

if (!process.env.DATABASE_URL) {
  fail("DATABASE_URL non è impostata.");
}

const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost");
if (siteUrl.protocol !== "https:" || siteUrl.hostname === "localhost") {
  fail("NEXT_PUBLIC_SITE_URL deve essere il dominio HTTPS definitivo.");
}

const inputPath = path.resolve(inputArgument);
const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
const outputPath = path.resolve(
  outputArgument ?? path.join(path.dirname(inputPath), `rsvp-output-${timestamp}`)
);

if (isInsideRepository(inputPath) || isInsideRepository(outputPath)) {
  fail("Lista invitati e output QR devono restare fuori dalla cartella del progetto.");
}

let parsedInput;
try {
  parsedInput = invitationSchema.parse(
    JSON.parse(await readFile(inputPath, "utf8"))
  );
} catch {
  fail("Il file JSON non rispetta il formato documentato in docs/rsvp.md.");
}

await mkdir(outputPath, { recursive: false, mode: 0o700 });

const prepared = await Promise.all(
  parsedInput.map(async (invitation, index) => {
    const token = randomBytes(32).toString("base64url");
    const tokenHash = createHash("sha256").update(token, "utf8").digest("hex");
    const invitationUrl = new URL(`/rsvp/${token}`, siteUrl).toString();
    const qrFile = `invite-${String(index + 1).padStart(3, "0")}.png`;
    const qrBuffer = await QRCode.toBuffer(invitationUrl, {
      type: "png",
      errorCorrectionLevel: "H",
      margin: 4,
      width: 1200,
      color: { dark: "#000000", light: "#ffffff" }
    });

    return {
      ...invitation,
      batchIndex: index + 1,
      deadline: invitation.deadline ?? null,
      invitationUrl,
      qrBuffer,
      qrFile,
      tokenHash
    };
  })
);

const databasePayload = JSON.stringify(
  prepared.map((invitation) => ({
    batch_index: invitation.batchIndex,
    display_name: invitation.householdName,
    token_hash: invitation.tokenHash,
    preferred_locale: invitation.locale,
    deadline: invitation.deadline,
    invitees: invitation.invitees
  }))
);

const sql = neon(process.env.DATABASE_URL);
await sql.query(
  `with input_households as (
    select *
    from jsonb_to_recordset($1::jsonb) as household(
      batch_index integer,
      display_name text,
      token_hash text,
      preferred_locale text,
      deadline timestamptz,
      invitees jsonb
    )
  ),
  inserted_households as (
    insert into rsvp.households (
      display_name,
      token_hash,
      preferred_locale,
      deadline
    )
    select display_name, token_hash, preferred_locale, deadline
    from input_households
    returning id, token_hash
  ),
  inserted_invitees as (
    insert into rsvp.invitees (household_id, display_name, sort_order)
    select
      inserted_households.id,
      invitee.display_name,
      (invitee.ordinality - 1)::smallint
    from input_households
    join inserted_households using (token_hash)
    cross join lateral jsonb_array_elements_text(input_households.invitees)
      with ordinality as invitee(display_name, ordinality)
    returning id
  )
  select
    (select count(*)::int from inserted_households) as households_created,
    (select count(*)::int from inserted_invitees) as invitees_created`,
  [databasePayload]
);

await Promise.all(
  prepared.map(async (invitation) => {
    const qrPath = path.join(outputPath, invitation.qrFile);
    await writeFile(qrPath, invitation.qrBuffer, { mode: 0o600, flag: "wx" });
    await chmod(qrPath, 0o600);
  })
);

const manifest = [
  ["Nucleo", "URL personale", "File QR"].map(csvCell).join(","),
  ...prepared.map((invitation) =>
    [invitation.householdName, invitation.invitationUrl, invitation.qrFile]
      .map(csvCell)
      .join(",")
  )
].join("\r\n");

const manifestPath = path.join(outputPath, "manifest.csv");
await writeFile(manifestPath, `\uFEFF${manifest}`, { mode: 0o600, flag: "wx" });
await chmod(manifestPath, 0o600);

console.log(`Creati ${prepared.length} inviti in ${outputPath}`);
console.log("Il manifest contiene link personali: conservalo in uno spazio cifrato e privato.");
