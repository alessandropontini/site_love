import { parseHouseholdSheets } from "../guest-sync/model";
import type { Snapshot } from "../guest-sync/model";
import { planSaveTheDate } from "./planner";
import {
  prepareSaveTheDate,
  recordSaveTheDate,
  type SaveTheDateWorkflowDependencies
} from "./workflow";

const safeErrors = new Set([
  "INVALID_STD_PREPARATION",
  "INVALID_STD_RECORD",
  "INVALID_STD_RECEIPT",
  "STD_NOT_READY",
  "STD_PREVIEW_EXPIRED",
  "STD_PREVIEW_CHANGED",
  "STD_EVENT_REUSED",
  "STD_UUID_MODE_REQUIRED",
  "STD_MAPPING_CHANGED",
  "STD_HOUSEHOLD_EXCLUDED",
  "STD_VERSION_CONFLICT",
  "STD_INVALID_TRANSITION",
  "STD_DATABASE_NOT_CONFIGURED",
  "STD_DATABASE_BRANCH_MISMATCH"
]);

export type SaveTheDateAdminDependencies = SaveTheDateWorkflowDependencies & {
  authorize(): Promise<{ actorId: string }>;
  states(source: string): Promise<{
    externalHouseholdId: string;
    status: "NOT_SENT" | "READY" | "SENT" | "FAILED";
    version: number;
  }[]>;
};

export type SaveTheDateAdminPreview = {
  eligibleHouseholds: number;
  blockedHouseholds: number;
  blockers: string[];
  households: {
    externalHouseholdId: string;
    householdId: string | null;
    memberCount: number;
    eligibleForPreparation: boolean;
    blockers: string[];
    status: "NOT_SENT" | "READY" | "SENT" | "FAILED";
    version: number;
  }[];
};

export type SaveTheDatePreparation = Awaited<ReturnType<typeof prepareSaveTheDate>>;
export type SaveTheDateAdminRecord = Awaited<ReturnType<typeof recordSaveTheDate>>;

function safeError(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  return safeErrors.has(code) ? code : "STD_UNAVAILABLE";
}

/**
 * Build Clerk-authorized admin operations. Every exported operation authorizes
 * before source/database reads and returns only the minimum review DTO.
 */
export function createSaveTheDateAdminActions(dependencies: SaveTheDateAdminDependencies) {
  return {
    async preview() {
      await dependencies.authorize();
      try {
        const source = dependencies.sourceId();
        const [sheets, database, states] = await Promise.all([
          dependencies.readSheets(),
          dependencies.snapshot(),
          dependencies.states(source)
        ]);
        const parsed = parseHouseholdSheets(sheets.guestList, sheets.households);
        const plan = planSaveTheDate(parsed, database.data as Snapshot, source);
        const stateByHousehold = new Map(
          states.map((state) => [state.externalHouseholdId, state])
        );
        return {
          ok: true as const,
          preview: {
            eligibleHouseholds: plan.eligibleHouseholds,
            blockedHouseholds: plan.blockedHouseholds,
            blockers: plan.blockers,
            households: plan.households.map((household) => {
              const state = stateByHousehold.get(household.externalHouseholdId);
              return {
                externalHouseholdId: household.externalHouseholdId,
                householdId: household.householdId,
                memberCount: household.memberCount,
                eligibleForPreparation: household.eligibleForPreparation,
                blockers: household.blockers,
                status: state?.status ?? "NOT_SENT",
                version: state?.version ?? 0
              };
            })
          }
        };
      } catch {
        return { ok: false as const, error: "STD_UNAVAILABLE" };
      }
    },

    async prepare(input: unknown) {
      const admin = await dependencies.authorize();
      try {
        return {
          ok: true as const,
          preparation: await prepareSaveTheDate(input, admin.actorId, dependencies)
        };
      } catch (error) {
        return { ok: false as const, error: safeError(error) };
      }
    },

    async record(input: unknown) {
      const admin = await dependencies.authorize();
      try {
        return {
          ok: true as const,
          result: await recordSaveTheDate(input, admin.actorId, dependencies)
        };
      } catch (error) {
        return { ok: false as const, error: safeError(error) };
      }
    }
  };
}
