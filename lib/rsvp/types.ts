export type RsvpLocale = "it" | "en";
export type Attendance = "yes" | "no";
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
  | { status: "conflict" }
  | { status: "rate_limited" }
  | { status: "unavailable" };

export type AdminRsvpRow = {
  householdId: string;
  householdName: string;
  preferredLocale: RsvpLocale;
  householdStatus: "active" | "closed" | "disabled";
  deadline: string | null;
  inviteeId: string | null;
  inviteeName: string | null;
  attendance: Attendance | null;
  mealPreference: MealPreference | null;
  responseUpdatedAt: string | null;
};

export type AdminRsvpDashboard = {
  summary: {
    households: number;
    householdsResponded: number;
    invitees: number;
    attending: number;
  };
  rows: AdminRsvpRow[];
};

export type AdminRsvpResult =
  | { status: "ready"; dashboard: AdminRsvpDashboard }
  | { status: "unavailable" };
