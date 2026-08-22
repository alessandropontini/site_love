export type RsvpLocale = "it" | "en";
export type Attendance = "yes" | "no";
export type InvitationSource = "bride" | "groom" | "both";
export type MealPreference =
  | "standard"
  | "vegetarian"
  | "vegan"
  | "children"
  | "not_needed";

export type RsvpAnswer = {
  inviteeId: string;
  attendance: Attendance;
  mealPreference: MealPreference;
};

export type RsvpInvitee = {
  id: string;
  displayName: string;
  attendance: Attendance | null;
  mealPreference: MealPreference | null;
};

export type RsvpInvitation = {
  id: string;
  householdName: string;
  locale: RsvpLocale;
  deadline: string | null;
  revision: number;
  invitees: RsvpInvitee[];
};

export type RsvpLookupResult =
  | { status: "ready"; invitation: RsvpInvitation }
  | { status: "invalid" }
  | { status: "unavailable" };

export type RsvpSaveResult =
  | { status: "saved"; revision: number }
  | { status: "unchanged" }
  | { status: "conflict" }
  | { status: "rate_limited" }
  | { status: "unavailable" };

export type AdminRsvpRow = {
  householdId: string;
  householdName: string;
  householdSize: number;
  preferredLocale: RsvpLocale;
  householdStatus: "active" | "closed" | "disabled";
  responseVersion: number;
  deadline: string | null;
  inviteeId: string | null;
  inviteeName: string | null;
  invitedBy: InvitationSource;
  attendance: Attendance | null;
  mealPreference: MealPreference | null;
  responseUpdatedAt: string | null;
  changedInLatestSubmission: boolean;
};

export type AdminRsvpDashboard = {
  summary: {
    households: number;
    householdsResponded: number;
    invitees: number;
    attending: number;
    householdsWithChanges: number;
    householdsInvitedByBride: number;
    householdsInvitedByGroom: number;
    householdsInvitedByBoth: number;
  };
  rows: AdminRsvpRow[];
};

export type AdminRsvpResult =
  | { status: "ready"; dashboard: AdminRsvpDashboard }
  | { status: "unavailable" };
