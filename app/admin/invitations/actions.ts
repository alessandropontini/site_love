"use server";

import { requireRsvpAdmin } from "@/lib/admin/auth";
import { previewImportedHouseholdInvitations } from "@/lib/rsvp/imported-household-activation-service";
import { activateImportedHouseholdInvitation, wasImportedHouseholdActivationCommitted } from "@/lib/rsvp/imported-household-activation-db";
import { createImportedHouseholdActivationAdminActions } from "@/lib/rsvp/imported-household-activation-admin-actions";
import { readSheets, sourceId } from "@/lib/guest-sync/google";
import { snapshot } from "@/lib/guest-sync/db";

function activationService() {
  return createImportedHouseholdActivationAdminActions({
    authorize: requireRsvpAdmin,
    sourceId,
    readSheets,
    snapshot,
    committed: wasImportedHouseholdActivationCommitted,
    activate: activateImportedHouseholdInvitation
  });
}

export async function previewImportedInvitations() {
  await requireRsvpAdmin();

  try {
    return {
      ok: true as const,
      preview: await previewImportedHouseholdInvitations()
    };
  } catch {
    return {
      ok: false as const,
      error:
        "Preview unavailable. Check the Household UUID source and synchronization database, then retry."
    };
  }
}

export async function prepareImportedInvitation(input: unknown) {
  return activationService().prepare(input);
}

export async function confirmImportedInvitation(input: unknown) {
  return activationService().confirm(input);
}
