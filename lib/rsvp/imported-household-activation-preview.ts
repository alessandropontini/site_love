import { parseHouseholdSheets } from "../guest-sync/model";
import type { Snapshot } from "../guest-sync/model";
import { previewImportedHouseholdActivation } from "./imported-household-activation";
import type { ImportedHouseholdActivationPreview } from "./imported-household-activation";

type GuestSheets = {
  guestList: unknown[][];
  households: unknown[][];
};

type SnapshotResult = {
  data: Snapshot & { sources: string[] };
  hash: string;
};

export type ImportedHouseholdActivationPreviewDependencies = {
  sourceId: string;
  readSheets(): Promise<GuestSheets>;
  snapshot(): Promise<SnapshotResult>;
};

export type AdminImportedHouseholdActivationPreview = Pick<
  ImportedHouseholdActivationPreview,
  "eligible" | "eligibleHouseholds" | "blockedHouseholds" | "blockers" | "households"
>;

/**
 * Load and compare source/database snapshots for an explicitly requested
 * admin preview. The returned DTO contains no guest names, contact details,
 * token material, or raw source/database snapshots.
 */
export async function loadImportedHouseholdActivationPreview(
  dependencies: ImportedHouseholdActivationPreviewDependencies
): Promise<AdminImportedHouseholdActivationPreview> {
  const [sheets, database] = await Promise.all([
    dependencies.readSheets(),
    dependencies.snapshot()
  ]);
  const parsed = parseHouseholdSheets(sheets.guestList, sheets.households);
  const preview = previewImportedHouseholdActivation(
    parsed,
    database.data,
    dependencies.sourceId
  );

  return {
    eligible: preview.eligible,
    eligibleHouseholds: preview.eligibleHouseholds,
    blockedHouseholds: preview.blockedHouseholds,
    blockers: preview.blockers,
    households: preview.households
  };
}
