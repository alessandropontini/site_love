import "server-only";

import { snapshot } from "../guest-sync/db";
import { readSheets, sourceId } from "../guest-sync/google";
import { loadImportedHouseholdActivationPreview } from "./imported-household-activation-preview";

export function previewImportedHouseholdInvitations() {
  return loadImportedHouseholdActivationPreview({
    sourceId: sourceId(),
    readSheets,
    snapshot
  });
}
