import { z } from "zod";
import type {
  SaveTheDateRecordRequest,
  SaveTheDateRecordResult,
  SaveTheDateState,
  SaveTheDateStatus
} from "./workflow";

export type SaveTheDateEventSummary = {
  id: string;
  externalHouseholdId: string;
  status: SaveTheDateStatus;
  version: number;
  channel: string;
  language: string;
  createdAt: string;
};

type Query = (statement: string, parameters: unknown[]) => Promise<Record<string, unknown>[]>;

const resultSchema = z.object({
  status: z.enum(["NOT_SENT", "READY", "SENT", "FAILED"]),
  version: z.number().int().nonnegative(),
  replayed: z.boolean()
}).strict();

function toDatabaseRequest(request: SaveTheDateRecordRequest) {
  return {
    id: request.id,
    source: request.source,
    household: request.externalHouseholdId,
    householdId: request.householdId,
    contact: request.contactGuestId,
    actor: request.actor,
    expectedVersion: request.expectedVersion,
    status: request.status,
    channel: request.channel,
    language: request.language,
    template: request.template,
    sourceCommitment: request.sourceCommitment,
    databaseCommitment: request.databaseCommitment,
    draftCommitment: request.draftCommitment
  };
}

export function createSaveTheDateStore(query: Query) {
  return {
    async state(source: string, externalHouseholdId: string): Promise<SaveTheDateState | null> {
      const rows = await query(
        `select status, version from rsvp.save_the_date_state
         where source_id=$1 and external_household_id=$2`,
        [source, externalHouseholdId]
      );
      if (!rows[0]) return null;
      return {
        status: z.enum(["NOT_SENT", "READY", "SENT", "FAILED"]).parse(rows[0].status),
        version: z.number().int().positive().parse(rows[0].version)
      };
    },

    async states(source: string) {
      const rows = await query(
        `select external_household_id, household_id, status, version, updated_at::text as updated_at
         from rsvp.save_the_date_state where source_id=$1
         order by external_household_id`,
        [source]
      );
      return rows.map((row) => ({
        externalHouseholdId: z.uuid().parse(row.external_household_id),
        householdId: z.uuid().parse(row.household_id),
        status: z.enum(["NOT_SENT", "READY", "SENT", "FAILED"]).parse(row.status),
        version: z.number().int().positive().parse(row.version),
        updatedAt: z.string().parse(row.updated_at)
      }));
    },

    async events(source: string): Promise<SaveTheDateEventSummary[]> {
      const rows = await query(
        `select id, external_household_id, status, version, channel, language,
          created_at::text as created_at
         from rsvp.save_the_date_events where source_id=$1
         order by created_at desc, id desc limit 100`,
        [source]
      );
      return rows.map((row) => ({
        id: z.uuid().parse(row.id),
        externalHouseholdId: z.uuid().parse(row.external_household_id),
        status: z.enum(["NOT_SENT", "READY", "SENT", "FAILED"]).parse(row.status),
        version: z.number().int().positive().parse(row.version),
        channel: z.string().parse(row.channel),
        language: z.string().parse(row.language),
        createdAt: z.string().parse(row.created_at)
      }));
    },

    async recorded(request: SaveTheDateRecordRequest): Promise<SaveTheDateRecordResult | null> {
      const databaseRequest = toDatabaseRequest(request);
      const rows = await query(
        `select status, version,
          (request_hash=md5($2::jsonb::text) and actor_id=$3 and source_id=$4) as same_request
         from rsvp.save_the_date_events where id=$1`,
        [request.id, JSON.stringify(databaseRequest), request.actor, request.source]
      );
      if (!rows[0]) return null;
      if (rows[0].same_request !== true) throw new Error("STD_EVENT_REUSED");
      return resultSchema.parse({ status: rows[0].status, version: rows[0].version, replayed: true });
    },

    async record(request: SaveTheDateRecordRequest): Promise<SaveTheDateRecordResult> {
      const databaseRequest = toDatabaseRequest(request);
      const rows = await query(
        "select rsvp.record_save_the_date($1::jsonb) as result",
        [JSON.stringify(databaseRequest)]
      );
      return resultSchema.parse(rows[0]?.result);
    }
  };
}
