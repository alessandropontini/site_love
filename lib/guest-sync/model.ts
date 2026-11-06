import { createHash } from "node:crypto";
import { z } from "zod";

export const headers = [
  "Guest name",
  "Guest type",
  "Group",
  "List owner",
  "Party / family",
  "Planning status",
  "Invitation",
  "RSVP",
  "Priority",
  "Table",
  "Dietary requirements",
  "Notes",
  "Sync UUID"
];
export const householdHeaders = [
  "Household UUID",
  "Party / family",
  "List owner",
  "Contact guest UUID",
  "Contact email",
  "Contact phone",
  "Language"
];
export const householdGuestHeaders = [
  ...headers,
  "Household UUID",
  "Host Sync UUID"
];
const short = z.string().trim().min(1).max(120);
export const guestSchema = z
  .object({
    externalId: z.uuid(),
    // name remains the display name consumed by the existing SQL/RSVP contract.
    name: z.string().max(120).nullable(),
    // Guest name is the given-name input; retain legacy full values without splitting.
    sourceName: z.string().max(120).nullable().optional(),
    surname: z.string().max(120).nullable().optional(),
    kind: z.enum(["named", "plus_one", "child"]),
    party: short,
    owner: z.enum(["groom", "bride", "both"]),
    group: short,
    planning: short,
    priority: short,
    table: z.string().max(120)
  })
  .strict();
export type Guest = z.infer<typeof guestSchema>;
export type Household = {
  id: string;
  name: string;
  owner: string;
  plusOne: boolean;
  issued: boolean;
  responded: boolean;
  version: number;
  status: string;
  namedCount?: number;
};
export type Member = {
  externalId: string;
  householdId: string;
  inviteeId: string | null;
  data: Guest;
  actualName: string | null;
};
export const SYNC_CONTRACT_VERSION = 2;
export type Snapshot = {
  contractVersion?: number;
  exclusions?: { householdId: string; active: boolean; revision: number }[];
  households: Household[];
  members: Member[];
  inviteeCount: number;
};
export type Change = {
  guest: string;
  operation: "INSERT" | "UPDATE" | "NO CHANGE" | "MISSING FROM SOURCE";
  current: Guest | null;
  next: Guest | null;
  householdId: string | null;
  errors: string[];
};
export type Plan = {
  contractVersion: number;
  mode: "legacy" | "household_uuid";
  sourceHouseholdCount: number;
  sourceHouseholdIds: string[];
  warnings: string[];
  excludedHouseholds: number;
  excludedInvitees: number;
  changes: Change[];
  errors: string[];
  counts: {
    created: number;
    updated: number;
    unchanged: number;
    missing: number;
    errors: number;
  };
  sourceCount: number;
  skippedRows: number[];
};
export type HouseholdSheet = {
  /** Permanent source identity. Labels are descriptive and never keys. */
  externalId: string;
  party: string;
  owner: "groom" | "bride" | "both";
  contactGuestUuid: string | null;
  language: "it" | "en" | null;
};
export type HouseholdMemberLink = {
  externalGuestId: string;
  householdUuid: string;
  hostSyncUuid: string | null;
};
export type HouseholdSheetParse = {
  mode: "household_uuid";
  households: HouseholdSheet[];
  guests: Guest[];
  memberLinks: HouseholdMemberLink[];
  errors: string[];
  warnings: string[];
  sourceCount: number;
  skippedRows: number[];
};
export type LegacySheetParse = {
  mode: "legacy";
  guests: ReturnType<typeof parseSheet> extends { guests: infer T } ? T : never;
  errors: string[];
  sourceCount: number;
  skippedRows: number[];
};
export type GuestSheets = {
  guestList: unknown[][];
  households: unknown[][];
};
export function hash(value: unknown) {
  // PostgreSQL jsonb does not preserve object-key order; arrays remain ordered.
  const canonical = JSON.stringify(value, (_key, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => a.localeCompare(b))
        )
      : item
  );
  return createHash("sha256").update(canonical).digest("hex");
}

// Keep the source spelling; use normalized text only to detect an existing suffix.
// Never split a legacy full name or infer a missing surname.
function displayName(sourceName: string, surname: string) {
  const comparable = (value: string) =>
    value.normalize("NFC").replace(/\s+/gu, " ").toLocaleLowerCase("en");
  const name = comparable(sourceName);
  const last = comparable(surname);
  return !surname || name === last || name.endsWith(` ${last}`)
    ? sourceName
    : `${sourceName} ${surname}`;
}

// Older JSONB records lack these optional fields. Empty new columns alone must
// not turn unchanged households (especially answered invitations) into updates.
function comparableGuest(guest: Guest) {
  return {
    ...guest,
    sourceName: guest.sourceName ?? guest.name,
    surname: guest.surname ?? null
  };
}

// Row order and the volatile formula ID are not identities. Notes and dietary
// free text are never retained in plans, logs, or database snapshots.
export function parseSheet(values: unknown[][]) {
  const names = (values[0] ?? []).map(String);
  const errors: string[] = [];
  for (const h of headers)
    if (names.filter((n) => n === h).length !== 1)
      errors.push(`Missing or duplicate column: ${h}`);
  if (names.filter((name) => name === "Surname").length > 1)
    errors.push("Duplicate column: Surname");
  const guests: Guest[] = [];
  let sourceCount = 0;
  const skippedRows: number[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const get = (key: string) => String(row[names.indexOf(key)] ?? "").trim();
    if (!names.some((h, col) => h !== "ID" && String(row[col] ?? "").trim()))
      continue;

    const rawName = get("Guest name");
    const surname = get("Surname");
    const provisionalFields = [
      "Guest type", "Group", "List owner", "Party / family",
      "Planning status", "Invitation", "RSVP", "Priority", "Table",
      "Dietary requirements", "Notes"
    ];
    // A surname alone does not make an unassigned draft ready for import.
    const isProvisional =
      rawName !== "" && get("Sync UUID") === "" &&
      provisionalFields.every((field) => get(field) === "");
    if (isProvisional) {
      skippedRows.push(i + 1);
      continue;
    }
    sourceCount++;
    const rawKind = get("Guest type");
    const kind =
      rawKind === "Child"
        ? "child"
        : /^Plus-one of .+$/i.test(rawName)
          ? "plus_one"
          : "named";
    if (!["Adult", "Child"].includes(rawKind) || !rawName)
      errors.push(
        `Row ${i + 1}: guest name and Adult/Child type are required.`
      );
    // Ambiguous spellings must never become named invitees accidentally.
    if (kind === "named" && /(?:plus[ -]?one|\+\s*1)/i.test(rawName))
      errors.push(
        `Row ${i + 1}: use "Plus-one of <host>" for an unnamed companion.`
      );
    const parsed = guestSchema.safeParse({
      externalId: get("Sync UUID").toLowerCase(),
      name: kind === "named" ? displayName(rawName, surname) : null,
      sourceName: kind === "named" ? rawName : null,
      surname: kind === "named" ? surname || null : null,
      kind,
      party: get("Party / family"),
      owner: (
        { Ale: "groom", Bridget: "bride", Both: "both" } as Record<
          string,
          string
        >
      )[get("List owner")],
      group: get("Group"),
      planning: get("Planning status"),
      priority: get("Priority"),
      table: get("Table")
    });
    if (!parsed.success) {
      errors.push(
        `Row ${i + 1}: invalid or missing ${[...new Set(parsed.error.issues.map((x) => x.path.join(".")))].join(", ")}.`
      );
      continue;
    }
    if (seen.has(parsed.data.externalId))
      errors.push(`Row ${i + 1}: duplicate Sync UUID.`);
    seen.add(parsed.data.externalId);
    guests.push(parsed.data);
  }
  if (!sourceCount)
    errors.push(
      "The source is empty. Review the spreadsheet before continuing."
    );
  return {
    guests: guests.sort((a, b) => a.externalId.localeCompare(b.externalId)),
    errors,
    sourceCount,
    skippedRows
  };
}

const ownerValues: Record<string, HouseholdSheet["owner"]> = {
  Ale: "groom",
  Bridget: "bride",
  Both: "both"
};
const optionalEmail = z.union([z.literal(""), z.string().trim().max(254).email()]);
const optionalPhone = z.string().trim().max(64);
const optionalLanguage = z.union([z.literal(""), z.enum(["it", "en"])]);
const normalizedLabel = (value: string) =>
  value.normalize("NFC").trim().replace(/\\s+/gu, " ").toLocaleLowerCase("en");

function indexHeaders(values: unknown[][], required: string[], label: string, errors: string[]) {
  const names = (values[0] ?? []).map(String);
  for (const header of required) {
    const count = names.filter((name) => name === header).length;
    if (count !== 1) errors.push(`${label}: missing or duplicate column ${header}.`);
  }
  return { names, get: (row: unknown[], header: string) =>
    String(row[names.indexOf(header)] ?? "").trim() };
}

/**
 * Validates the two-tab Household UUID contract without changing the legacy
 * parser or returning contact email/phone values to callers. This is a
 * preparation model only; it is not consumed by Preview, Apply, or Neon.
 */
export function parseHouseholdSheets(
  guestValues: unknown[][],
  householdValues: unknown[][]
): HouseholdSheetParse {
  const errors: string[] = [];
  const warnings: string[] = [];
  const guestTab = indexHeaders(
    guestValues,
    [...headers, "Household UUID", "Host Sync UUID"],
    "Guest List",
    errors
  );
  const householdTab = indexHeaders(
    householdValues,
    householdHeaders,
    "Households",
    errors
  );
  if (errors.length) {
    return {
      mode: "household_uuid", households: [], guests: [], memberLinks: [],
      errors, warnings, sourceCount: 0, skippedRows: []
    };
  }

  const households: HouseholdSheet[] = [];
  const householdsById = new Map<string, HouseholdSheet>();
  for (let rowIndex = 1; rowIndex < householdValues.length; rowIndex++) {
    const row = householdValues[rowIndex];
    if (!householdTab.names.some((name, column) =>
      name !== "ID" && String(row[column] ?? "").trim())) continue;
    const rowNumber = rowIndex + 1;
    const rawId = householdTab.get(row, "Household UUID").toLowerCase();
    const party = householdTab.get(row, "Party / family");
    const rawOwner = householdTab.get(row, "List owner");
    const rawContact = householdTab.get(row, "Contact guest UUID").toLowerCase();
    const rawEmail = householdTab.get(row, "Contact email");
    const rawPhone = householdTab.get(row, "Contact phone");
    const rawLanguage = householdTab.get(row, "Language");
    const rowErrors: string[] = [];
    if (!rawId || !z.uuid().safeParse(rawId).success)
      rowErrors.push(`Households row ${rowNumber}: invalid or missing Household UUID.`);
    if (!party || party.length > 120)
      rowErrors.push(`Households row ${rowNumber}: Party / family is required and must be at most 120 characters.`);
    if (!ownerValues[rawOwner])
      rowErrors.push(`Households row ${rowNumber}: List owner must be Ale, Bridget, or Both.`);
    if (rawContact && !z.uuid().safeParse(rawContact).success)
      rowErrors.push(`Households row ${rowNumber}: Contact guest UUID is invalid.`);
    if (!optionalEmail.safeParse(rawEmail).success)
      rowErrors.push(`Households row ${rowNumber}: Contact email is invalid.`);
    if (!optionalPhone.safeParse(rawPhone).success)
      rowErrors.push(`Households row ${rowNumber}: Contact phone is too long.`);
    if (!optionalLanguage.safeParse(rawLanguage).success)
      rowErrors.push(`Households row ${rowNumber}: Language must be it or en.`);
    if (rawId && z.uuid().safeParse(rawId).success && householdsById.has(rawId))
      rowErrors.push(`Households row ${rowNumber}: duplicate Household UUID.`);
    if (rowErrors.length) {
      errors.push(...rowErrors);
      continue;
    }
    const household: HouseholdSheet = {
      externalId: rawId,
      party,
      owner: ownerValues[rawOwner],
      contactGuestUuid: rawContact || null,
      language: rawLanguage ? rawLanguage as "it" | "en" : null
    };
    households.push(household);
    householdsById.set(rawId, household);
  }

  const parsedGuests = parseSheet(guestValues);
  errors.push(...parsedGuests.errors);
  const guestById = new Map(parsedGuests.guests.map((guest) => [guest.externalId, guest]));
  const sourceHouseholdByGuest = new Map<string, string>();
  const memberLinks: HouseholdMemberLink[] = [];

  for (let rowIndex = 1; rowIndex < guestValues.length; rowIndex++) {
    const row = guestValues[rowIndex];
    if (!guestTab.names.some((name, column) =>
      name !== "ID" && String(row[column] ?? "").trim())) continue;
    const rowNumber = rowIndex + 1;
    const externalGuestId = guestTab.get(row, "Sync UUID").toLowerCase();
    const rawHouseholdId = guestTab.get(row, "Household UUID").toLowerCase();
    const rawHostId = guestTab.get(row, "Host Sync UUID").toLowerCase();
    const rawName = guestTab.get(row, "Guest name");
    const provisionalFields = [
      "Guest type", "Group", "List owner", "Party / family", "Planning status",
      "Invitation", "RSVP", "Priority", "Table", "Dietary requirements", "Notes"
    ];
    const isProvisional = rawName !== "" && externalGuestId === "" &&
      provisionalFields.every((field) => guestTab.get(row, field) === "");
    if (isProvisional) {
      if (rawHouseholdId || rawHostId)
        errors.push(`Guest List row ${rowNumber}: provisional rows cannot have Household UUID or Host Sync UUID.`);
      continue;
    }
    if (!rawHouseholdId) {
      errors.push(`Guest List row ${rowNumber}: Household UUID is required for a complete row.`);
    } else if (!z.uuid().safeParse(rawHouseholdId).success) {
      errors.push(`Guest List row ${rowNumber}: Household UUID is invalid.`);
    } else if (!householdsById.has(rawHouseholdId)) {
      errors.push(`Guest List row ${rowNumber}: Household UUID does not exist in Households.`);
    }
    if (rawHostId && !z.uuid().safeParse(rawHostId).success)
      errors.push(`Guest List row ${rowNumber}: Host Sync UUID is invalid.`);

    if (!externalGuestId || !z.uuid().safeParse(externalGuestId).success) continue;
    if (sourceHouseholdByGuest.has(externalGuestId)) continue;
    sourceHouseholdByGuest.set(externalGuestId, rawHouseholdId);
    const guest = guestById.get(externalGuestId);
    if (!guest) continue;
    if (rawHouseholdId && householdsById.has(rawHouseholdId)) {
      const household = householdsById.get(rawHouseholdId)!;
      if (guest.party !== household.party)
        errors.push(`Guest List row ${rowNumber}: Party / family differs from its Household UUID record.`);
      if (guest.owner !== household.owner)
        errors.push(`Guest List row ${rowNumber}: List owner differs from its Household UUID record.`);
    }
    memberLinks.push({
      externalGuestId,
      householdUuid: rawHouseholdId,
      hostSyncUuid: rawHostId || null
    });
  }

  const guestIdsByHousehold = new Map<string, Set<string>>();
  for (const link of memberLinks) {
    if (!z.uuid().safeParse(link.householdUuid).success) continue;
    const ids = guestIdsByHousehold.get(link.householdUuid) ?? new Set<string>();
    ids.add(link.externalGuestId);
    guestIdsByHousehold.set(link.householdUuid, ids);
    const guest = guestById.get(link.externalGuestId);
    if (link.hostSyncUuid) {
      if (link.hostSyncUuid === link.externalGuestId) {
        errors.push(`Guest ${link.externalGuestId}: Host Sync UUID cannot refer to itself.`);
      } else if (guest?.kind !== "plus_one") {
        errors.push(`Guest ${link.externalGuestId}: Host Sync UUID is only valid for a +1 place.`);
      }
      const host = guestById.get(link.hostSyncUuid);
      if (!host) {
        errors.push(`Guest ${link.externalGuestId}: Host Sync UUID does not reference a complete guest row.`);
      } else if (sourceHouseholdByGuest.get(link.hostSyncUuid) !== link.householdUuid) {
        errors.push(`Guest ${link.externalGuestId}: host must belong to the same household.`);
      } else if (host.kind !== "named") {
        errors.push(`Guest ${link.externalGuestId}: host must be a named adult, not a child or anonymous +1.`);
      }
    }
  }

  for (const household of households) {
    const memberIds = guestIdsByHousehold.get(household.externalId) ?? new Set<string>();
    if (memberIds.size === 0)
      errors.push(`Household ${household.externalId}: no complete Guest List members were found.`);
    const members = [...memberIds].map((id) => guestById.get(id)).filter((guest): guest is Guest => !!guest);
    const named = members.filter((guest) => guest.kind === "named");
    const plusOnes = members.filter((guest) => guest.kind === "plus_one");
    if (named.length === 0)
      errors.push(`Household ${household.externalId}: at least one named adult is required.`);
    if (plusOnes.length > 1 || (plusOnes.length > 0 && named.length !== 1))
      errors.push(`Household ${household.externalId}: one anonymous +1 is supported only with one named adult.`);
    const names = named.map((guest) => guest.name!.normalize("NFC").toLocaleLowerCase("en"));
    if (new Set(names).size !== names.length)
      errors.push(`Household ${household.externalId}: duplicate named guests require manual review.`);
    if (household.contactGuestUuid) {
      const contact = guestById.get(household.contactGuestUuid);
      if (!contact) {
        errors.push(`Household ${household.externalId}: Contact guest UUID does not reference a complete guest row.`);
      } else if (sourceHouseholdByGuest.get(household.contactGuestUuid) !== household.externalId) {
        errors.push(`Household ${household.externalId}: Contact guest UUID must belong to this household.`);
      } else if (contact.kind !== "named") {
        errors.push(`Household ${household.externalId}: contact must be a named adult, not a child or anonymous +1.`);
      }
    }
  }

  const labels = new Map<string, string[]>();
  for (const household of households) {
    const label = normalizedLabel(household.party);
    const ids = labels.get(label) ?? [];
    ids.push(household.externalId);
    labels.set(label, ids);
  }
  for (const ids of labels.values()) {
    if (ids.length > 1)
      warnings.push(`Household label is shared by ${ids.length} distinct UUIDs; records remain separate.`);
  }

  return {
    mode: "household_uuid",
    households: households.sort((a, b) => a.externalId.localeCompare(b.externalId)),
    guests: parsedGuests.guests,
    memberLinks: memberLinks.sort((a, b) => a.externalGuestId.localeCompare(b.externalGuestId)),
    errors: [...new Set(errors)],
    warnings,
    sourceCount: parsedGuests.sourceCount,
    skippedRows: parsedGuests.skippedRows
  };
}

/** New columns never switch the active parser. Callers must choose the mode. */
export function parseGuestSheets(sheets: GuestSheets, mode: "legacy" | "household_uuid" = "legacy") {
  if (mode === "household_uuid")
    return parseHouseholdSheets(sheets.guestList, sheets.households);
  const parsed = parseSheet(sheets.guestList);
  return { mode: "legacy" as const, guests: parsed.guests, errors: parsed.errors, sourceCount: parsed.sourceCount, skippedRows: parsed.skippedRows };
}
export function buildPlan(
  parsed: ReturnType<typeof parseSheet> | HouseholdSheetParse,
  snapshot: Snapshot
): Plan {
  if ("mode" in parsed && parsed.mode === "household_uuid")
    return buildHouseholdUuidPlan(parsed, snapshot);
  const legacy: ReturnType<typeof parseSheet> = "mode" in parsed
    ? { guests: parsed.guests, errors: parsed.errors, sourceCount: parsed.sourceCount, skippedRows: parsed.skippedRows }
    : parsed;
  const errors = [...legacy.errors];
  const exclusions = snapshot.exclusions ?? [];
  const excluded = new Set(exclusions.filter((e) => e.active).map((e) => e.householdId));
  if (snapshot.contractVersion !== SYNC_CONTRACT_VERSION)
    errors.push("Unsupported synchronization contract. Update database and application together.");
  if (snapshot.members.some((m) => excluded.has(m.householdId)))
    errors.push("An excluded test household has source mappings. Resolve the conflict manually.");
  if (
    snapshot.households.some(
      (h) => !excluded.has(h.id) && !snapshot.members.some((m) => m.householdId === h.id)
    )
  )
    errors.push(
      "Existing households have no source mapping. A maintainer must reconcile them before importing to avoid duplicates."
    );
  const changes: Change[] = [];
  const groups = new Map<string, Guest[]>();
  for (const guest of legacy.guests) {
    const key = guest.party.toLocaleLowerCase("en");
    groups.set(key, [...(groups.get(key) ?? []), guest]);
  }
  const members = new Map(snapshot.members.map((m) => [m.externalId, m]));
  const households = new Map(snapshot.households.map((h) => [h.id, h]));
  for (const group of groups.values()) {
    const problems: string[] = [];
    const party = group[0].party;
    if (snapshot.households.some((h) => excluded.has(h.id) && h.name.toLowerCase() === party.toLowerCase()))
      problems.push("This label belongs to an excluded test household. Review the source; no adoption is allowed.");
    if (new Set(group.map((g) => g.party)).size !== 1)
      problems.push("Household labels differ only by letter case.");
    if (new Set(group.map((g) => g.owner)).size !== 1)
      problems.push("All household members must have the same List owner.");
    const named = group.filter((g) => g.kind === "named");
    const plus = group.filter((g) => g.kind === "plus_one");
    if (!named.length) problems.push("A household must contain a named adult.");
    if (new Set(named.map((g) => g.name!.toLowerCase())).size !== named.length)
      problems.push("Duplicate names in the household require manual review.");
    if (plus.length > 1 || (plus.length && named.length !== 1))
      problems.push(
        "One unnamed companion is supported only for a household with one named adult."
      );
    const ids = new Set(
      group.flatMap((g) => {
        const m = members.get(g.externalId);
        return m ? [m.householdId] : [];
      })
    );
    if (ids.size > 1)
      problems.push(
        "Merging existing households is not allowed by synchronization."
      );
    let householdId = [...ids][0] ?? null;
    if (!householdId) {
      const matches = snapshot.households.filter(
        (h) => h.name.toLowerCase() === party.toLowerCase()
      );
      if (matches.length) {
        const tracked =
          matches.length === 1 &&
          snapshot.members.some(
            (m) => m.householdId === matches[0].id && m.data.party === party
          );
        if (tracked) householdId = matches[0].id;
        else
          problems.push(
            "An existing household matches this label. Reconcile its permanent IDs manually; no name-based adoption is performed."
          );
      }
      // Guard against lost/replaced IDs followed by a household rename.
      if (
        named.some((g) =>
          snapshot.members.some(
            (m) => m.data.name?.toLowerCase() === g.name!.toLowerCase()
          )
        )
      )
        problems.push(
          "A name already exists under another identity. Review possible duplicate or lost IDs."
        );
    }
    const household = householdId ? households.get(householdId) : undefined;
    const baseline = snapshot.members.find(
      (m) => m.householdId === householdId
    )?.data;
    for (const guest of group) {
      const old = members.get(guest.externalId);
      const rowErrors = [...problems];
      if (householdId && excluded.has(householdId))
        rowErrors.push("Excluded test households cannot be synchronized.");
      if (
        household &&
        household.plusOne !==
          snapshot.members.some(
            (m) => m.householdId === household.id && m.data.kind === "plus_one"
          )
      )
        rowErrors.push(
          "Database plus-one permission differs from its source mapping. Reconcile manually."
        );
      if (old && old.data.party !== guest.party)
        rowErrors.push(
          "Changing Party / family requires manual household reconciliation."
        );
      if (old && old.data.kind !== guest.kind)
        rowErrors.push(
          "Changing guest type or naming a previously unnamed companion requires manual review."
        );
      if (old && old.data.kind === "named" && old.actualName !== old.data.name)
        rowErrors.push(
          "The database name was changed outside synchronization. Resolve the conflict first."
        );
      const operation = !old
        ? "INSERT"
        : hash(comparableGuest(old.data)) === hash(comparableGuest(guest))
          ? "NO CHANGE"
          : "UPDATE";
      if (
        household &&
        household.owner !==
          (old?.data.owner ?? baseline?.owner ?? group[0].owner)
      )
        rowErrors.push(
          "The database List owner differs from the source mapping."
        );
      if (household && household.name !== (old?.data.party ?? group[0].party))
        rowErrors.push(
          "The database household label differs from the source mapping."
        );
      if (
        household?.namedCount !== undefined &&
        household.namedCount !==
          snapshot.members.filter(
            (m) => m.householdId === household.id && m.data.kind === "named"
          ).length
      )
        rowErrors.push(
          "The database household roster was changed outside synchronization."
        );
      if (household?.responded && operation !== "NO CHANGE")
        rowErrors.push(
          "This household has RSVP responses. Resolve planning changes manually."
        );
      if (
        household?.issued &&
        operation !== "NO CHANGE" &&
        (!old ||
          old.data.name !== guest.name ||
          household.plusOne !== !!plus.length)
      )
        rowErrors.push(
          "An invitation has been issued. Roster and plus-one changes require manual review."
        );
      changes.push({
        guest: `${party} / ${guest.name ?? (guest.kind === "child" ? "Child place" : "Unnamed companion")}`,
        operation,
        current: old?.data ?? null,
        next: guest,
        householdId,
        errors: rowErrors
      });
    }
  }
  const incoming = new Set(legacy.guests.map((g) => g.externalId));
  for (const old of snapshot.members)
    if (!incoming.has(old.externalId)) {
      changes.push({
        guest: `${old.data.party} / ${old.data.name ?? old.data.kind}`,
        operation: "MISSING FROM SOURCE",
        current: old.data,
        next: null,
        householdId: old.householdId,
        errors: []
      });
      // Retained rows must not silently disagree with a changed household owner or permission.
      for (const c of changes)
        if (
          c.next &&
          c.householdId === old.householdId &&
          c.operation !== "NO CHANGE"
        )
          c.errors.push(
            "This household has a missing source member. Resolve it before changing the household."
          );
    }
  for (const change of changes)
    errors.push(...change.errors.map((e) => `${change.guest}: ${e}`));
  return {
    contractVersion: SYNC_CONTRACT_VERSION,
    mode: "legacy",
    sourceHouseholdCount: 0,
    sourceHouseholdIds: [],
    warnings: [],
    excludedHouseholds: snapshot.households.filter((h) => excluded.has(h.id)).length,
    excludedInvitees: snapshot.households.filter((h) => excluded.has(h.id)).reduce((n, h) => n + (h.namedCount ?? 0), 0),
    changes,
    errors,
    sourceCount: legacy.sourceCount,
    skippedRows: legacy.skippedRows,
    counts: {
      created: changes.filter((c) => c.operation === "INSERT").length,
      updated: changes.filter((c) => c.operation === "UPDATE").length,
      unchanged: changes.filter((c) => c.operation === "NO CHANGE").length,
      missing: changes.filter((c) => c.operation === "MISSING FROM SOURCE")
        .length,
      errors: errors.length
    }
  };
}

/**
 * Household UUID preview planning. Existing Neon groups are matched only by
 * guest external UUIDs already mapped together; unmapped existing groups block
 * the entire plan. Labels never select or merge a database household.
 */
function buildHouseholdUuidPlan(parsed: HouseholdSheetParse, snapshot: Snapshot): Plan {
  const errors = [...parsed.errors];
  const warnings = [...parsed.warnings];
  const exclusions = snapshot.exclusions ?? [];
  const excluded = new Set(exclusions.filter((e) => e.active).map((e) => e.householdId));
  if (snapshot.contractVersion !== SYNC_CONTRACT_VERSION)
    errors.push("Unsupported synchronization contract. Update database and application together.");
  if (snapshot.members.some((m) => excluded.has(m.householdId)))
    errors.push("An excluded test household has source mappings. Resolve the conflict manually.");
  if (snapshot.households.some((h) => !excluded.has(h.id) && !snapshot.members.some((m) => m.householdId === h.id)))
    errors.push("Existing households have no source mapping. A maintainer must reconcile them before importing to avoid duplicates.");

  const membersByExternal = new Map(snapshot.members.map((member) => [member.externalId, member]));
  const householdByExternal = new Map(parsed.households.map((household) => [household.externalId, household]));
  const sourceLinks = new Map(parsed.memberLinks.map((link) => [link.externalGuestId, link]));
  const sourceGuests = new Map(parsed.guests.map((guest) => [guest.externalId, guest]));
  const changes: Change[] = [];
  const sourceByHousehold = new Map<string, Guest[]>();
  for (const guest of parsed.guests) {
    const link = sourceLinks.get(guest.externalId);
    if (!link) continue;
    sourceByHousehold.set(link.householdUuid, [...(sourceByHousehold.get(link.householdUuid) ?? []), guest]);
  }

  for (const [externalHouseholdId, guests] of sourceByHousehold) {
    const sourceHousehold = householdByExternal.get(externalHouseholdId);
    if (!sourceHousehold) continue;
    const mappedIds = new Set(guests.flatMap((guest) => {
      const old = membersByExternal.get(guest.externalId);
      return old ? [old.householdId] : [];
    }));
    const rowErrors: string[] = [];
    if (mappedIds.size > 1) rowErrors.push("This Household UUID spans multiple existing database households. Reconcile membership manually.");
    let householdId = [...mappedIds][0] ?? null;
    const existingSourceMap = snapshot.households.filter((household) =>
      snapshot.members.some((member) => member.householdId === household.id && member.externalId === guests[0]?.externalId)
    );
    if (existingSourceMap.length > 1) rowErrors.push("The guest identity is mapped ambiguously in the database.");
    const household = householdId ? snapshot.households.find((entry) => entry.id === householdId) : undefined;
    const knownExternalMembers = snapshot.members.filter((member) => member.householdId === householdId);
    if (household && knownExternalMembers.some((member) => {
      const link = sourceLinks.get(member.externalId);
      return link && link.householdUuid !== externalHouseholdId;
    })) rowErrors.push("A mapped guest belongs to a different Household UUID in the source. Reconcile manually.");
    if (household && household.name !== sourceHousehold.party)
      rowErrors.push("Changing the household label requires the approved Household UUID database mapping and a fresh schema version.");
    if (household && household.owner !== sourceHousehold.owner)
      rowErrors.push("The database List owner differs from the source household mapping.");
    if (household?.responded && guests.some((guest) => {
      const old = membersByExternal.get(guest.externalId);
      return !old || hash(comparableGuest(old.data)) !== hash(comparableGuest(guest));
    })) rowErrors.push("This household has RSVP responses. Resolve planning changes manually.");
    if (household?.issued && guests.some((guest) => {
      const old = membersByExternal.get(guest.externalId);
      return !old || hash(comparableGuest(old.data)) !== hash(comparableGuest(guest));
    })) rowErrors.push("An invitation has been issued. Roster and name changes require manual review.");
    const sourceIds = new Set(guests.map((guest) => guest.externalId));
    if (household && knownExternalMembers.some((member) => !sourceIds.has(member.externalId)))
      rowErrors.push("The source household omits a mapped member. Missing members are retained; reconcile before changing this roster.");

    for (const guest of guests) {
      const old = membersByExternal.get(guest.externalId);
      if (old && old.householdId !== householdId)
        rowErrors.push("Changing an existing guest Household UUID requires manual reconciliation.");
      if (old && old.data.kind !== guest.kind)
        rowErrors.push("Changing guest type or naming a previously anonymous companion requires manual review.");
      if (old && old.data.kind === "named" && old.actualName !== old.data.name)
        rowErrors.push("The database name was changed outside synchronization. Resolve the conflict first.");
      const operation = !old ? "INSERT" : hash(comparableGuest(old.data)) === hash(comparableGuest(guest)) ? "NO CHANGE" : "UPDATE";
      changes.push({
        guest: `${sourceHousehold.party} / ${guest.name ?? (guest.kind === "child" ? "Child place" : "Unnamed companion")}`,
        operation,
        current: old?.data ?? null,
        next: guest,
        householdId,
        errors: [...rowErrors]
      });
    }
    if (!household) warnings.push(`Household ${externalHouseholdId} is new; Preview does not create or adopt a database household.`);
  }

  const incoming = new Set(parsed.guests.map((guest) => guest.externalId));
  for (const old of snapshot.members) if (!incoming.has(old.externalId)) {
    changes.push({
      guest: `${old.data.party} / ${old.data.name ?? old.data.kind}`,
      operation: "MISSING FROM SOURCE",
      current: old.data,
      next: null,
      householdId: old.householdId,
      errors: []
    });
  }
  for (const change of changes) errors.push(...change.errors.map((error) => `${change.guest}: ${error}`));
  return {
    contractVersion: SYNC_CONTRACT_VERSION,
    mode: "household_uuid",
    sourceHouseholdCount: parsed.households.length,
    sourceHouseholdIds: parsed.households.map((household) => household.externalId),
    warnings: [...new Set(warnings)],
    excludedHouseholds: snapshot.households.filter((household) => excluded.has(household.id)).length,
    excludedInvitees: snapshot.households.filter((household) => excluded.has(household.id)).reduce((count, household) => count + (household.namedCount ?? 0), 0),
    changes,
    errors,
    sourceCount: parsed.sourceCount,
    skippedRows: parsed.skippedRows,
    counts: {
      created: changes.filter((change) => change.operation === "INSERT").length,
      updated: changes.filter((change) => change.operation === "UPDATE").length,
      unchanged: changes.filter((change) => change.operation === "NO CHANGE").length,
      missing: changes.filter((change) => change.operation === "MISSING FROM SOURCE").length,
      errors: errors.length
    }
  };
}
