import type { HouseholdSheetParse, Snapshot } from "../guest-sync/model";

export type SaveTheDateHousehold = {
  externalHouseholdId: string;
  householdId: string | null;
  contactGuestId: string | null;
  language: "it" | "en" | null;
  memberCount: number;
  eligibleForPreparation: boolean;
  blockers: string[];
};

export type SaveTheDatePlan = {
  sourceId: string;
  eligibleHouseholds: number;
  blockedHouseholds: number;
  blockers: string[];
  households: SaveTheDateHousehold[];
};

/**
 * Read-only mapping and roster checks for a future manually recorded Save the
 * Date. This planner does not read contact values, issue links, or mutate data.
 */
export function planSaveTheDate(
  parsed: HouseholdSheetParse,
  snapshot: Snapshot,
  sourceId: string
): SaveTheDatePlan {
  const globalBlockers: string[] = [];
  if (!sourceId.trim() || sourceId.length > 150)
    globalBlockers.push("A valid source ID is required.");
  if (snapshot.contractVersion !== 3)
    globalBlockers.push("The database snapshot contract is unsupported.");
  if (parsed.mode !== "household_uuid")
    globalBlockers.push("Household UUID source data is required.");
  globalBlockers.push(...parsed.errors);

  const sourceModes = (snapshot.sourceModes ?? []).filter(
    (entry) => entry.sourceId === sourceId
  );
  if (sourceModes.length !== 1)
    globalBlockers.push("The source must have exactly one registered synchronization mode.");
  else if (sourceModes[0].mode !== "household_uuid")
    globalBlockers.push("The source must be registered for Household UUID mode.");

  const rows = parsed.households.map((sourceHousehold, index) => {
    const blockers = [...globalBlockers];
    if (parsed.households.findIndex(
      (candidate) => candidate.externalId === sourceHousehold.externalId
    ) !== index)
      blockers.push("The source contains a duplicate Household UUID.");

    const links = parsed.memberLinks.filter(
      (link) => link.householdUuid === sourceHousehold.externalId
    );
    const sourceGuestIds = links.map((link) => link.externalGuestId);
    if (sourceGuestIds.length === 0)
      blockers.push("The source household has no guest roster.");
    if (sourceGuestIds.length !== new Set(sourceGuestIds).size)
      blockers.push("The source household contains duplicate guest UUIDs.");

    const mappings = (snapshot.householdMappings ?? []).filter(
      (mapping) => mapping.sourceId === sourceId &&
        mapping.externalHouseholdId === sourceHousehold.externalId
    );
    if (mappings.length === 0)
      blockers.push("No approved database mapping exists for this Household UUID.");
    else if (mappings.length > 1)
      blockers.push("The database mapping for this Household UUID is ambiguous.");

    const mapping = mappings.length === 1 ? mappings[0] : undefined;
    const householdId = mapping?.householdId ?? null;
    if (mapping && (snapshot.householdMappings ?? []).filter(
      (candidate) => candidate.householdId === mapping.householdId
    ).length !== 1)
      blockers.push("The database household is mapped more than once.");

    const householdMatches = householdId
      ? snapshot.households.filter((household) => household.id === householdId)
      : [];
    if (mapping && householdMatches.length === 0)
      blockers.push("The mapped database household does not exist.");
    else if (householdMatches.length > 1)
      blockers.push("The mapped database household is ambiguous.");

    if (householdId && (snapshot.exclusions ?? []).some(
      (exclusion) => exclusion.householdId === householdId && exclusion.active
    ))
      blockers.push("The database household is excluded from synchronization.");

    const databaseMembers = householdId
      ? snapshot.members.filter((member) => member.householdId === householdId)
      : [];
    const databaseGuestIds = databaseMembers.map((member) => member.externalId);
    if (databaseGuestIds.length !== new Set(databaseGuestIds).size)
      blockers.push("The database household has duplicate guest mappings.");
    if (sourceGuestIds.length !== databaseGuestIds.length ||
      sourceGuestIds.some((id) => !databaseGuestIds.includes(id)))
      blockers.push("The source and database guest rosters differ.");

    for (const link of links) {
      const sourceGuestMatches = parsed.guests.filter(
        (guest) => guest.externalId === link.externalGuestId
      );
      const databaseGuestMatches = databaseMembers.filter(
        (member) => member.externalId === link.externalGuestId
      );
      if (sourceGuestMatches.length !== 1 || databaseGuestMatches.length !== 1) continue;
      const sourceGuest = sourceGuestMatches[0];
      const databaseGuest = databaseGuestMatches[0];
      if (databaseGuest.externalHouseholdId !== sourceHousehold.externalId)
        blockers.push("A mapped guest belongs to a different Household UUID.");
      if ((sourceGuest.kind === "named") !== (databaseGuest.inviteeId !== null))
        blockers.push("A guest's named or anonymous status differs from its database mapping.");
      if (sourceGuest.kind === "named" && databaseGuest.actualName !== sourceGuest.name)
        blockers.push("A named guest's source and database names differ.");
    }

    const contactGuestId = sourceHousehold.contactGuestUuid;
    if (!contactGuestId)
      blockers.push("A named household contact must be selected in the source.");
    else {
      const sourceContact = parsed.guests.filter(
        (guest) => guest.externalId === contactGuestId && guest.kind === "named"
      );
      const databaseContact = databaseMembers.filter(
        (member) => member.externalId === contactGuestId && member.inviteeId !== null
      );
      if (sourceContact.length !== 1 || databaseContact.length !== 1)
        blockers.push("The selected contact must map to one named invitee in this household.");
    }
    if (!sourceHousehold.language)
      blockers.push("A communication language must be selected in the source.");

    return {
      externalHouseholdId: sourceHousehold.externalId,
      householdId,
      contactGuestId,
      language: sourceHousehold.language,
      memberCount: links.length,
      eligibleForPreparation: blockers.length === 0,
      blockers: [...new Set(blockers)]
    };
  });

  const eligibleHouseholds = rows.filter((row) => row.eligibleForPreparation).length;
  return {
    sourceId,
    eligibleHouseholds,
    blockedHouseholds: rows.length - eligibleHouseholds,
    blockers: [...new Set(globalBlockers)],
    households: rows
  };
}
