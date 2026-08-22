import "server-only";

import { neon } from "@neondatabase/serverless";

import type {
  AdminRsvpResult,
  AdminRsvpRow,
  Attendance,
  InvitationSource,
  MealPreference,
  RsvpAnswer,
  RsvpInvitation,
  RsvpLookupResult,
  RsvpSaveResult
} from "@/lib/rsvp/types";
import { hashRsvpToken, isPlausibleRsvpToken } from "@/lib/rsvp/token";

type HouseholdRow = {
  id: string;
  display_name: string;
  preferred_locale: "it" | "en";
  deadline: string | null;
  response_version: number;
};

type InviteeRow = {
  id: string;
  display_name: string;
  attendance: Attendance | null;
  meal_preference: MealPreference | null;
};

type SaveRow = {
  response_version: number | null;
  saved_count: number;
  rate_limited: boolean;
  unchanged: boolean;
};

type AdminRow = {
  household_id: string;
  household_name: string;
  household_size: number;
  preferred_locale: "it" | "en";
  household_status: "active" | "closed" | "disabled";
  response_version: number;
  deadline: string | null;
  invitee_id: string | null;
  invitee_name: string | null;
  invited_by: InvitationSource;
  attendance: Attendance | null;
  meal_preference: MealPreference | null;
  response_updated_at: string | null;
  changed_in_latest_submission: boolean;
};

export function hasRsvpDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function getSql() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("RSVP database is not configured");
  }

  return neon(databaseUrl);
}

export async function getRsvpInvitation(
  token: string
): Promise<RsvpLookupResult> {
  if (!hasRsvpDatabase()) {
    return { status: "unavailable" };
  }

  if (!isPlausibleRsvpToken(token)) {
    return { status: "invalid" };
  }

  const sql = getSql();
  const tokenHash = hashRsvpToken(token);

  try {
    const households = (await sql.query(
      `select
        id,
        display_name,
        preferred_locale,
        deadline,
        response_version
      from rsvp.households
      where token_hash = $1
        and status = 'active'
        and revoked_at is null
        and (deadline is null or deadline >= now())
      limit 1`,
      [tokenHash]
    )) as HouseholdRow[];

    const household = households[0];

    if (!household) {
      return { status: "invalid" };
    }

    const invitees = (await sql.query(
      `select
        invitees.id,
        invitees.display_name,
        responses.attendance,
        responses.meal_preference
      from rsvp.invitees
      left join rsvp.responses
        on responses.household_id = invitees.household_id
       and responses.invitee_id = invitees.id
      where invitees.household_id = $1
      order by invitees.sort_order, invitees.id`,
      [household.id]
    )) as InviteeRow[];

    if (invitees.length === 0) {
      return { status: "invalid" };
    }

    const invitation: RsvpInvitation = {
      id: household.id,
      householdName: household.display_name,
      locale: household.preferred_locale,
      deadline: household.deadline,
      revision: Number(household.response_version),
      invitees: invitees.map((invitee) => ({
        id: invitee.id,
        displayName: invitee.display_name,
        attendance: invitee.attendance,
        mealPreference: invitee.meal_preference
      }))
    };

    return { status: "ready", invitation };
  } catch {
    return { status: "unavailable" };
  }
}

export async function saveRsvpAnswers(
  invitation: RsvpInvitation,
  revision: number,
  answers: RsvpAnswer[]
): Promise<RsvpSaveResult> {
  if (!hasRsvpDatabase()) {
    return { status: "unavailable" };
  }

  const sql = getSql();

  try {
    const serializedAnswers = JSON.stringify(
      answers.map((answer) => ({
        invitee_id: answer.inviteeId,
        attendance: answer.attendance,
        meal_preference: answer.mealPreference
      }))
    );

    const rows = (await sql.query(
      `with incoming as (
        select *
        from jsonb_to_recordset($3::jsonb) as answer(
          invitee_id uuid,
          attendance text,
          meal_preference text
        )
      ),
      eligible as (
        select incoming.*
        from incoming
        join rsvp.invitees
          on invitees.id = incoming.invitee_id
         and invitees.household_id = $1
      ),
      classified as (
        select
          eligible.*,
          responses.invitee_id is null
            or responses.attendance is distinct from eligible.attendance
            or responses.meal_preference is distinct from eligible.meal_preference
            as should_write,
          responses.invitee_id is not null
            and (
              responses.attendance is distinct from eligible.attendance
              or responses.meal_preference is distinct from eligible.meal_preference
            ) as changed
        from eligible
        left join rsvp.responses
          on responses.household_id = $1
         and responses.invitee_id = eligible.invitee_id
      ),
      bumped as (
        update rsvp.households
        set response_version = response_version + 1,
            updated_at = now(),
            submission_window_started_at = case
              when submission_window_started_at is null
                or submission_window_started_at <= now() - interval '1 hour'
              then now()
              else submission_window_started_at
            end,
            submission_count = case
              when submission_window_started_at is null
                or submission_window_started_at <= now() - interval '1 hour'
              then 1
              else submission_count + 1
            end
        where id = $1
          and response_version = $2
          and status = 'active'
          and revoked_at is null
          and (deadline is null or deadline >= now())
          and (
            submission_window_started_at is null
            or submission_window_started_at <= now() - interval '1 hour'
            or submission_count < 10
          )
          and (select count(*) from incoming) = (select count(*) from eligible)
          and (select count(*) from eligible) = (
            select count(*) from rsvp.invitees where household_id = $1
          )
          and exists (
            select 1 from classified where should_write
          )
        returning id, response_version
      ),
      upserted as (
        insert into rsvp.responses (
          household_id,
          invitee_id,
          attendance,
          meal_preference,
          updated_at
        )
        select
          bumped.id,
          classified.invitee_id,
          classified.attendance,
          classified.meal_preference,
          now()
        from classified
        join bumped on true
        where classified.should_write
        on conflict (household_id, invitee_id) do update
          set attendance = excluded.attendance,
              meal_preference = excluded.meal_preference,
              updated_at = excluded.updated_at
        returning invitee_id
      ),
      audited as (
        insert into rsvp.audit_events (
          household_id,
          event_type,
          metadata
        )
        select
          bumped.id,
          'response_updated',
          jsonb_build_object(
            'revision', bumped.response_version,
            'invitee_count', (select count(*) from eligible),
            'written_invitee_count', (select count(*) from upserted),
            'changed_invitee_count', (
              select count(*) from classified where changed
            )
          )
        from bumped
        returning id
      )
      select
        (select response_version::int from bumped) as response_version,
        (
          select count(*)::int
          from eligible
          join bumped on true
        ) as saved_count,
        (
          not exists (select 1 from classified where should_write)
          and exists (
            select 1
            from rsvp.households
            where id = $1
              and response_version = $2
              and status = 'active'
              and revoked_at is null
              and (deadline is null or deadline >= now())
          )
          and (select count(*) from incoming) = (select count(*) from eligible)
          and (select count(*) from eligible) = (
            select count(*) from rsvp.invitees where household_id = $1
          )
        ) as unchanged,
        case
          when exists (select 1 from bumped) then false
          else exists (
            select 1
            from rsvp.households
            where id = $1
              and submission_window_started_at > now() - interval '1 hour'
              and submission_count >= 10
          )
        end as rate_limited`,
      [invitation.id, revision, serializedAnswers]
    )) as SaveRow[];

    const saved = rows[0];

    if (saved?.unchanged) {
      return { status: "unchanged" };
    }

    if (!saved || Number(saved.saved_count) !== invitation.invitees.length) {
      if (saved?.rate_limited) {
        return { status: "rate_limited" };
      }

      return { status: "conflict" };
    }

    return {
      status: "saved",
      revision: Number(saved.response_version)
    };
  } catch {
    return { status: "unavailable" };
  }
}

async function queryAdminRsvpRows(): Promise<AdminRsvpRow[]> {
  const rows = (await getSql().query(
    `select
      households.id::text as household_id,
      households.display_name as household_name,
      count(invitees.id) over (
        partition by households.id
      )::int as household_size,
      households.preferred_locale,
      households.status as household_status,
      households.response_version::int,
      households.deadline::text,
      invitees.id::text as invitee_id,
      invitees.display_name as invitee_name,
      households.invited_by,
      responses.attendance,
      responses.meal_preference,
      responses.updated_at::text as response_updated_at,
      (
        households.response_version > 1
        and responses.updated_at = households.updated_at
      ) as changed_in_latest_submission
    from rsvp.households
    left join rsvp.invitees
      on invitees.household_id = households.id
    left join rsvp.responses
      on responses.household_id = households.id
     and responses.invitee_id = invitees.id
    order by households.display_name, invitees.sort_order, invitees.id`,
    []
  )) as AdminRow[];

  return rows.map((row) => ({
    householdId: row.household_id,
    householdName: row.household_name,
    householdSize: Number(row.household_size),
    preferredLocale: row.preferred_locale,
    householdStatus: row.household_status,
    responseVersion: Number(row.response_version),
    deadline: row.deadline,
    inviteeId: row.invitee_id,
    inviteeName: row.invitee_name,
    invitedBy: row.invited_by,
    attendance: row.attendance,
    mealPreference: row.meal_preference,
    responseUpdatedAt: row.response_updated_at,
    changedInLatestSubmission: row.changed_in_latest_submission
  }));
}

export async function getAdminRsvpDashboard(): Promise<AdminRsvpResult> {
  if (!hasRsvpDatabase()) {
    return { status: "unavailable" };
  }

  try {
    const rows = await queryAdminRsvpRows();
    const households = new Map<
      string,
      {
        invitees: number;
        answered: number;
        invitedBy: InvitationSource;
        changedInLatestSubmission: boolean;
      }
    >();

    for (const row of rows) {
      const household = households.get(row.householdId) ?? {
        invitees: 0,
        answered: 0,
        invitedBy: row.invitedBy,
        changedInLatestSubmission: false
      };

      household.changedInLatestSubmission ||=
        row.changedInLatestSubmission;

      if (row.inviteeId) {
        household.invitees += 1;
      }

      if (row.attendance) {
        household.answered += 1;
      }

      households.set(row.householdId, household);
    }

    return {
      status: "ready",
      dashboard: {
        summary: {
          households: households.size,
          householdsResponded: [...households.values()].filter(
            (household) =>
              household.invitees > 0 &&
              household.answered === household.invitees
          ).length,
          invitees: rows.filter((row) => row.inviteeId).length,
          attending: rows.filter((row) => row.attendance === "yes").length,
          householdsWithChanges: [...households.values()].filter(
            (household) => household.changedInLatestSubmission
          ).length,
          householdsInvitedByBride: [...households.values()].filter(
            (household) => household.invitedBy === "bride"
          ).length,
          householdsInvitedByGroom: [...households.values()].filter(
            (household) => household.invitedBy === "groom"
          ).length,
          householdsInvitedByBoth: [...households.values()].filter(
            (household) => household.invitedBy === "both"
          ).length
        },
        rows
      }
    };
  } catch {
    return { status: "unavailable" };
  }
}

export async function getAdminRsvpExportRows() {
  if (!hasRsvpDatabase()) {
    return null;
  }

  try {
    return await queryAdminRsvpRows();
  } catch {
    return null;
  }
}

export async function recordAdminEvent(
  actorId: string,
  eventType: "rsvp_exported",
  metadata: Record<string, number | string>
) {
  if (!hasRsvpDatabase()) {
    return;
  }

  try {
    await getSql().query(
      `insert into rsvp.admin_events (actor_id, event_type, metadata)
       values ($1, $2, $3::jsonb)`,
      [actorId, eventType, JSON.stringify(metadata)]
    );
  } catch {
    // Export remains available if the audit table has not been migrated yet.
  }
}
