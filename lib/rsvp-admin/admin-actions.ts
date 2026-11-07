import { manualHouseholdIdSchema, createManualResponseRequest, type ManualResponseRequest } from "./model";

const safeErrors = new Set([
  "MANUAL_DATABASE_NOT_CONFIGURED",
  "MANUAL_DATABASE_BRANCH_MISMATCH",
  "MANUAL_DUPLICATE_INVITEE",
  "MANUAL_EVENT_REUSED",
  "MANUAL_INVALID",
  "MANUAL_INVALID_ACTOR",
  "MANUAL_INVALID_EXTRAS",
  "MANUAL_INVALID_OR_RATE_LIMITED",
  "MANUAL_NOT_FOUND",
  "MANUAL_READ_COMMITTED_REQUIRED",
  "MANUAL_REASON_STATE_MISMATCH",
  "MANUAL_SIGNING_NOT_CONFIGURED",
  "MANUAL_UNCHANGED",
  "MANUAL_VERSION_CONFLICT"
]);

export type ManualResponseAdminDependencies = {
  authorize(): Promise<{ actorId: string }>;
  household(id: string): Promise<unknown | null>;
  record(request: ManualResponseRequest): Promise<{ revision: number; replayed: boolean }>;
};

function safeError(error: unknown) {
  if (error instanceof Error && error.name === "ZodError") return "MANUAL_INVALID_REQUEST";
  const code = error instanceof Error ? error.message : "";
  return safeErrors.has(code) ? code : "MANUAL_UNAVAILABLE";
}

/** Clerk authorization runs independently before every private read or write. */
export function createManualResponseAdminActions(dependencies: ManualResponseAdminDependencies) {
  return {
    async household(input: unknown) {
      await dependencies.authorize();
      const parsed = manualHouseholdIdSchema.safeParse(input);
      if (!parsed.success) return { ok: false as const, error: "MANUAL_INVALID_REQUEST" };

      try {
        const household = await dependencies.household(parsed.data);
        if (!household) return { ok: false as const, error: "MANUAL_NOT_FOUND" };
        return { ok: true as const, household };
      } catch (error) {
        return { ok: false as const, error: safeError(error) };
      }
    },

    async record(input: unknown) {
      const admin = await dependencies.authorize();
      try {
        const request = createManualResponseRequest(input, admin.actorId);
        return { ok: true as const, result: await dependencies.record(request) };
      } catch (error) {
        return { ok: false as const, error: safeError(error) };
      }
    }
  };
}
