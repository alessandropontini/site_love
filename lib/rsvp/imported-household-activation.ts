import type { HouseholdSheetParse, Snapshot } from "../guest-sync/model";

export type ImportedHouseholdActivationRow = {
  externalHouseholdId: string;
  householdId: string | null;
  label: string;
  sourceMemberCount: number;
  namedInviteeCount: number;
  eligible: boolean;
  blockers: string[];
};

export type ImportedHouseholdActivationPreview = {
  sourceId: string;
  eligible: boolean;
  eligibleHouseholds: number;
  blockedHouseholds: number;
  blockers: string[];
  households: ImportedHouseholdActivationRow[];
};

/**
 * Read-only eligibility plan for issuing invitations to already imported
 * Household UUID records. It deliberately cannot create or activate records.
 */
export function previewImportedHouseholdActivation(
  parsed: HouseholdSheetParse,
  snapshot: Snapshot,
  sourceId: string
): ImportedHouseholdActivationPreview {
  const blockers: string[] = [];
  if (!sourceId.trim() || sourceId.length > 150)
    blockers.push("A valid source ID is required.");
  if (snapshot.contractVersion !== 3)
    blockers.push("The database snapshot contract is unsupported.");
  if (parsed.mode !== "household_uuid")
    blockers.push("Household UUID source data is required.");
  blockers.push(...parsed.errors);

  const sourceModes = snapshot.sourceModes?.filter(
    (source) => source.sourceId === sourceId
  ) ?? [];
  if (sourceModes.length !== 1)
    blockers.push("The source must have exactly one registered synchronization mode.");
  else if (sourceModes[0].mode !== "household_uuid")
    blockers.push("The source must be registered for Household UUID mode.");

  const linksByGuest = new Map<string, string[]>();
  for (const link of parsed.memberLinks) {
    linksByGuest.set(link.externalGuestId, [
      ...(linksByGuest.get(link.externalGuestId) ?? []),
      link.householdUuid
    ]);
  }

  const householdIds = new Set<string>();
  const rows = parsed.households.map((sourceHousehold) => {
    const rowBlockers = [...blockers];
    if (householdIds.has(sourceHousehold.externalId))
      rowBlockers.push("The source contains a duplicate Household UUID.");
    householdIds.add(sourceHousehold.externalId);

    const sourceGuests = parsed.guests.filter((guest) =>
      linksByGuest.get(guest.externalId)?.includes(sourceHousehold.externalId)
    );
    const sourceGuestIds = sourceGuests.map((guest) => guest.externalId);
    if (sourceGuestIds.length === 0)
      rowBlockers.push("The source household has no guest roster.");
    if (sourceGuestIds.length !== new Set(sourceGuestIds).size)
      rowBlockers.push("The source household contains duplicate guest UUIDs.");
    if (parsed.memberLinks.some(
      (link) => linksByGuest.get(link.externalGuestId)?.length !== 1
    ))
      rowBlockers.push("A guest UUID has an ambiguous source household link.");

    const sourceMappings = (snapshot.householdMappings ?? []).filter(
      (mapping) => mapping.sourceId === sourceId &&
        mapping.externalHouseholdId === sourceHousehold.externalId
    );
    if (sourceMappings.length === 0)
      rowBlockers.push("No approved database mapping exists for this Household UUID.");
    else if (sourceMappings.length > 1)
      rowBlockers.push("The database mapping for this Household UUID is ambiguous.");

    const mapping = sourceMappings.length === 1 ? sourceMappings[0] : undefined;
    const householdId = mapping?.householdId ?? null;
    if (mapping && (snapshot.householdMappings ?? []).filter(
      (candidate) => candidate.householdId === mapping.householdId
    ).length !== 1)
      rowBlockers.push("The database household is mapped more than once.");

    const databaseHouseholds = householdId
      ? snapshot.households.filter((household) => household.id === householdId)
      : [];
    const household = databaseHouseholds.length === 1
      ? databaseHouseholds[0]
      : undefined;
    if (mapping && databaseHouseholds.length === 0)
      rowBlockers.push("The mapped database household does not exist.");
    else if (databaseHouseholds.length > 1)
      rowBlockers.push("The mapped database household is ambiguous.");

    if (householdId && (snapshot.exclusions ?? []).some(
      (exclusion) => exclusion.householdId === householdId && exclusion.active
    ))
      rowBlockers.push("The database household is excluded from synchronization.");

    const databaseMembers = householdId
      ? snapshot.members.filter((member) => member.householdId === householdId)
      : [];
    const databaseGuestIds = databaseMembers.map((member) => member.externalId);
    if (databaseGuestIds.length !== new Set(databaseGuestIds).size)
      rowBlockers.push("The database household has duplicate guest mappings.");
    if (
      sourceGuestIds.length !== databaseGuestIds.length ||
      sourceGuestIds.some((id) => !databaseGuestIds.includes(id))
    )
      rowBlockers.push("The source and database guest rosters differ.");

    const namedGuests = sourceGuests.filter((guest) => guest.kind === "named");
    if (household?.namedCount === undefined)
      rowBlockers.push("The database snapshot is missing the named-invitee count.");
    else if (household.namedCount !== namedGuests.length)
      rowBlockers.push("The source and database named-invitee rosters differ.");
    if (databaseMembers.filter((member) => member.inviteeId !== null).length !== namedGuests.length)
      rowBlockers.push("The source and database invitee mappings differ.");

    for (const guest of sourceGuests) {
      const matches = databaseMembers.filter((member) => member.externalId === guest.externalId);
      if (matches.length !== 1) continue;
      const member = matches[0];
      if (member.externalHouseholdId !== sourceHousehold.externalId)
        rowBlockers.push("A mapped guest belongs to a different Household UUID.");
      if ((guest.kind === "named") !== (member.inviteeId !== null))
        rowBlockers.push("A guest's named or anonymous status differs from its database mapping.");
      if (guest.kind === "named" && member.actualName !== guest.name)
        rowBlockers.push("A named guest's source and database names differ.");
    }

    if (household) {
      if (household.status !== "disabled")
        rowBlockers.push("Only a disabled database household can be activated.");
      if (household.issued)
        rowBlockers.push("An invitation token already exists for this household.");
      if (household.responded)
        rowBlockers.push("This household already has RSVP activity.");
      if (household.name !== sourceHousehold.party || household.owner !== sourceHousehold.owner)
        rowBlockers.push("The source household label or owner differs from the database.");
      const sourceAllowsPlusOne = sourceGuests.some((guest) => guest.kind === "plus_one");
      if (household.plusOne !== sourceAllowsPlusOne)
        rowBlockers.push("The source and database plus-one permissions differ.");
    }

    const uniqueBlockers = [...new Set(rowBlockers)];
    return {
      externalHouseholdId: sourceHousehold.externalId,
      householdId,
      label: sourceHousehold.party,
      sourceMemberCount: sourceGuests.length,
      namedInviteeCount: namedGuests.length,
      eligible: uniqueBlockers.length === 0,
      blockers: uniqueBlockers
    };
  });

  const eligibleHouseholds = rows.filter((row) => row.eligible).length;
  return {
    sourceId,
    eligible: blockers.length === 0 && rows.length > 0 && eligibleHouseholds === rows.length,
    eligibleHouseholds,
    blockedHouseholds: rows.length - eligibleHouseholds,
    blockers: [...new Set(blockers)],
    households: rows
  };
}
