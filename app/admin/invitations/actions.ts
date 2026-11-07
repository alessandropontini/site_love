"use server";

import { requireRsvpAdmin } from "@/lib/admin/auth";
import { previewImportedHouseholdInvitations } from "@/lib/rsvp/imported-household-activation-service";

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
