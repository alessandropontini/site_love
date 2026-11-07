import { z } from "zod";

import type { RsvpInvitation } from "../rsvp/types";
import type { ManualResponseRequest } from "./model";

export type ManualResponseDashboardEvent = {
  householdId: string;
  actorId: string;
  provenance: "phone" | "message" | "paper" | "in_person";
  recordingReason: "initial_offsite_response" | "correction";
  revision: number;
  createdAt: string;
};

type Query = (statement: string, parameters: unknown[]) => Promise<Record<string, unknown>[]>;

const invitationSchema = z.object({
  id: z.uuid(),
  householdName: z.string(),
  contactEmail: z.email().nullable(),
  allowPlusOne: z.boolean(),
  locale: z.enum(["it", "en"]),
  deadline: z.string().nullable(),
  revision: z.number().int().nonnegative(),
  invitees: z.array(z.object({
    id: z.uuid(),
    displayName: z.string(),
    attendance: z.enum(["yes", "no"]).nullable(),
    mealPreference: z.enum(["standard", "vegetarian", "vegan", "children", "not_needed"]).nullable()
  })),
  plusOne: z.object({
    id: z.uuid(),
    firstName: z.string(),
    lastName: z.string(),
    mealPreference: z.enum(["standard", "vegetarian", "vegan", "children"]).nullable()
  }).nullable(),
  hasChildren: z.boolean()
}).strict();

const resultSchema = z.object({
  revision: z.number().int().positive(),
  replayed: z.boolean()
}).strict();

const dashboardEventsSchema = z.array(z.object({
  household_id: z.uuid(),
  actor_id: z.string().min(1).max(255),
  provenance: z.enum(["phone", "message", "paper", "in_person"]),
  recording_reason: z.enum(["initial_offsite_response", "correction"]),
  revision: z.number().int().positive(),
  created_at: z.union([z.string().min(1), z.date()])
}).strict());

export function createManualResponseStore(query: Query) {
  return {
    async household(id: string): Promise<RsvpInvitation | null> {
      const rows = await query(
        "select rsvp.admin_household($1::uuid) as data",
        [id]
      );
      const data = rows[0]?.data;
      if (data === null || data === undefined) return null;
      return invitationSchema.parse(data);
    },

    async record(request: ManualResponseRequest): Promise<{ revision: number; replayed: boolean }> {
      const rows = await query(
        "select rsvp.record_manual_response($1::jsonb) as result",
        [JSON.stringify(request)]
      );
      return resultSchema.parse(rows[0]?.result);
    },

    async dashboardEvents(): Promise<ManualResponseDashboardEvent[]> {
      const rows = await query(
        "select * from rsvp.manual_response_dashboard_events()",
        []
      );
      return dashboardEventsSchema.parse(rows).map((event) => ({
        householdId: event.household_id,
        actorId: event.actor_id,
        provenance: event.provenance,
        recordingReason: event.recording_reason,
        revision: event.revision,
        createdAt: event.created_at instanceof Date
          ? event.created_at.toISOString()
          : event.created_at
      }));
    }
  };
}
