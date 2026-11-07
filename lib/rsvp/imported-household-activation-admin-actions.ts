import {
  confirmImportedHouseholdActivation,
  prepareImportedHouseholdActivation,
  safeImportedActivationError,
  type ImportedHouseholdActivationWorkflowDependencies
} from "./imported-household-activation-workflow";

export type ImportedHouseholdActivationAdminDependencies =
  ImportedHouseholdActivationWorkflowDependencies & {
    authorize(): Promise<{ actorId: string }>;
  };

/** Every operation checks the Clerk identity and email allowlist independently. */
export function createImportedHouseholdActivationAdminActions(
  dependencies: ImportedHouseholdActivationAdminDependencies
) {
  return {
    async prepare(input: unknown) {
      const admin = await dependencies.authorize();
      try {
        return {
          ok: true as const,
          preparation: await prepareImportedHouseholdActivation(input, admin.actorId, dependencies)
        };
      } catch (error) {
        return { ok: false as const, error: safeImportedActivationError(error) };
      }
    },
    async confirm(input: unknown) {
      const admin = await dependencies.authorize();
      try {
        return {
          ok: true as const,
          result: await confirmImportedHouseholdActivation(input, admin.actorId, dependencies)
        };
      } catch (error) {
        return { ok: false as const, error: safeImportedActivationError(error) };
      }
    }
  };
}
