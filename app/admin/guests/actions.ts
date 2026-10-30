"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRsvpAdmin } from "@/lib/admin/auth";
import { applySync, cancelSync, previewSync } from "@/lib/guest-sync/service";
import { SyncError } from "@/lib/guest-sync/google";

export async function previewGuests() {
  const admin = await requireRsvpAdmin();
  try {
    return { ok: true as const, preview: await previewSync(admin.actorId) };
  } catch (error) {
    return {
      ok: false as const,
      error:
        error instanceof SyncError
          ? error.message
          : "Preview unavailable. Check the synchronization database, migrations and signing configuration."
    };
  }
}
export async function applyGuests(input: unknown) {
  const admin = await requireRsvpAdmin();
  const parsed = z
    .object({ receipt: z.string().max(4096), confirmed: z.literal(true) })
    .strict()
    .safeParse(input);
  if (!parsed.success)
    return { ok: false as const, error: "Explicit confirmation is required." };
  try {
    const status = await applySync(parsed.data.receipt, admin.actorId);
    revalidatePath("/admin/guests");
    revalidatePath("/admin/rsvp");
    return { ok: true as const, status };
  } catch {
    return {
      ok: false as const,
      error:
        "Apply could not be verified. Keep this preview and retry to check the same batch; do not assume it succeeded."
    };
  }
}
export async function cancelGuests(receipt: unknown) {
  const admin = await requireRsvpAdmin();
  if (typeof receipt !== "string" || receipt.length > 4096)
    return { ok: false as const, error: "Invalid preview." };
  try {
    const status = await cancelSync(receipt, admin.actorId);
    revalidatePath("/admin/guests");
    return { ok: true as const, status };
  } catch {
    return {
      ok: false as const,
      error:
        "Cancellation could not be recorded. Retry when the database is available."
    };
  }
}
