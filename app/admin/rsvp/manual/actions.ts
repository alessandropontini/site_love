"use server";

import { revalidatePath } from "next/cache";

import { requireRsvpAdmin } from "@/lib/admin/auth";
import { createManualResponseAdminActions } from "@/lib/rsvp-admin/admin-actions";
import { readManualResponseHousehold, recordManualResponse } from "@/lib/rsvp-admin/db";

const actions = createManualResponseAdminActions({
  authorize: async () => {
    const admin = await requireRsvpAdmin();
    return { actorId: admin.actorId };
  },
  household: readManualResponseHousehold,
  record: recordManualResponse
});

export async function loadManualResponseHousehold(input: unknown) {
  return actions.household(input);
}

export async function saveManualResponse(input: unknown) {
  const result = await actions.record(input);
  if (result.ok) revalidatePath("/admin/rsvp");
  return result;
}
