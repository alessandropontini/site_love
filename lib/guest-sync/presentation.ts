import type { Change, Guest, Plan } from "./model";

const fields = [
  ["sourceName", "Guest name"], ["surname", "Surname"],
  ["name", "Display name"], ["kind", "Guest type"],
  ["party", "Party / family"], ["owner", "List owner"],
  ["group", "Group"], ["planning", "Planning status"],
  ["priority", "Priority"], ["table", "Table"]
] as const;

function value(guest: Guest | null, field: typeof fields[number][0]): string {
  if (!guest) return "—";
  if (["name", "sourceName", "surname"].includes(field) && guest.kind !== "named") return "—";
  if (field === "sourceName") return guest.sourceName ?? guest.name ?? "—";
  if (field === "kind") return { named: "Named adult", plus_one: "Unnamed companion", child: "Child place" }[guest.kind];
  if (field === "owner") return { groom: "Ale", bride: "Bridget", both: "Both" }[guest.owner];
  return guest[field] || "—";
}

export function planningDetails(change: Change) {
  return fields.map(([field, label]) => ({
    field, label, before: value(change.current, field), after: value(change.next, field)
  })).filter(row => change.operation !== "UPDATE" || row.before !== row.after);
}

export function householdSummary(plan: Plan) {
  const groups = new Map<string, { name: string; rows: number; changed: boolean; blocked: boolean }>();
  for (const change of plan.changes) {
    const guest = change.next ?? change.current;
    if (!guest) continue;
    const key = change.householdId ? `id:${change.householdId}` : `new:${guest.party.toLocaleLowerCase("en")}`;
    const group = groups.get(key) ?? { name: guest.party, rows: 0, changed: false, blocked: false };
    group.rows++;
    group.changed ||= change.operation === "INSERT" || change.operation === "UPDATE";
    group.blocked ||= change.errors.length > 0;
    groups.set(key, group);
  }
  return [...groups.values()];
}
