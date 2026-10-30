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
const short = z.string().trim().min(1).max(120);
export const guestSchema = z
  .object({
    externalId: z.uuid(),
    name: z.string().max(120).nullable(),
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
export type Snapshot = {
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

// Row order and the volatile formula ID are not identities. No free text from L/M
// is retained in planning records, previews, logs, or database snapshots.
export function parseSheet(values: unknown[][]) {
  const names = (values[0] ?? []).map(String);
  const errors: string[] = [];
  for (const h of headers)
    if (names.filter((n) => n === h).length !== 1)
      errors.push(`Missing or duplicate column: ${h}`);
  const guests: Guest[] = [];
  let sourceCount = 0;
  const seen = new Set<string>();
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const get = (key: string) => String(row[names.indexOf(key)] ?? "").trim();
    if (!names.some((h, col) => h !== "ID" && String(row[col] ?? "").trim()))
      continue;
    sourceCount++;
    const rawName = get("Guest name");
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
      name: kind === "named" ? rawName : null,
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
    sourceCount
  };
}
export function buildPlan(
  parsed: ReturnType<typeof parseSheet>,
  snapshot: Snapshot
): Plan {
  const errors = [...parsed.errors];
  if (
    snapshot.households.some(
      (h) => !snapshot.members.some((m) => m.householdId === h.id)
    )
  )
    errors.push(
      "Existing households have no source mapping. A maintainer must reconcile them before importing to avoid duplicates."
    );
  const changes: Change[] = [];
  const groups = new Map<string, Guest[]>();
  for (const guest of parsed.guests) {
    const key = guest.party.toLocaleLowerCase("en");
    groups.set(key, [...(groups.get(key) ?? []), guest]);
  }
  const members = new Map(snapshot.members.map((m) => [m.externalId, m]));
  const households = new Map(snapshot.households.map((h) => [h.id, h]));
  for (const group of groups.values()) {
    const problems: string[] = [];
    const party = group[0].party;
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
        : hash(old.data) === hash(guest)
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
  const incoming = new Set(parsed.guests.map((g) => g.externalId));
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
    changes,
    errors,
    sourceCount: parsed.sourceCount,
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
