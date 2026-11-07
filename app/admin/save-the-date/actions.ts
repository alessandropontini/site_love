"use server";

import { requireRsvpAdmin } from "@/lib/admin/auth";
import { readSheets, sourceId } from "@/lib/guest-sync/google";
import { snapshot } from "@/lib/guest-sync/db";
import {
  findRecordedSaveTheDate,
  readSaveTheDateState,
  readSaveTheDateStates,
  recordSaveTheDateInDatabase
} from "@/lib/save-the-date/db";
import { createSaveTheDateAdminActions } from "@/lib/save-the-date/admin-actions";

function service() {
  return createSaveTheDateAdminActions({
    authorize: requireRsvpAdmin,
    sourceId,
    readSheets,
    snapshot,
    state: readSaveTheDateState,
    states: readSaveTheDateStates,
    recorded: findRecordedSaveTheDate,
    record: recordSaveTheDateInDatabase
  });
}

export async function previewSaveTheDate() {
  return service().preview();
}

export async function prepareSaveTheDateAction(input: unknown) {
  return service().prepare(input);
}

export async function recordSaveTheDateAction(input: unknown) {
  return service().record(input);
}
