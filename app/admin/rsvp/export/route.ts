import { requireRsvpAdmin } from "@/lib/admin/auth";
import {
  getAdminRsvpExportRows,
  recordAdminEvent
} from "@/lib/rsvp/db";
import {
  invitationSourceLabels,
  mealPreferenceLabels
} from "@/lib/rsvp/display";

export const dynamic = "force-dynamic";

function csvCell(value: string | number | null) {
  let text = value === null ? "" : String(value);
  text = text.replaceAll("\0", "");

  if (/^[\t\r\n ]*[=+\-@]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replaceAll('"', '""')}"`;
}

export async function GET() {
  const admin = await requireRsvpAdmin();
  const rows = await getAdminRsvpExportRows();

  if (!rows) {
    return new Response("Esportazione temporaneamente non disponibile.", {
      status: 503,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": "text/plain; charset=utf-8"
      }
    });
  }

  const header = [
    "Nucleo",
    "Persone nel nucleo",
    "Lingua",
    "Stato invito",
    "Scadenza",
    "Email di contatto",
    "+1 autorizzato",
    "Figli presenti",
    "Invitato",
    "Tipo invitato",
    "Nucleo invitato da",
    "Presenza",
    "Menu",
    "Modificata nell’ultimo invio",
    "Ultimo aggiornamento"
  ];

  const body = [
    header.map(csvCell).join(","),
    ...rows.map((row) =>
      [
        row.householdName,
        row.householdSize,
        row.preferredLocale,
        row.householdStatus,
        row.deadline,
        row.contactEmail,
        row.allowPlusOne ? "Sì" : "No",
        row.hasChildren ? "Sì" : "No",
        row.inviteeName,
        row.guestType,
        invitationSourceLabels.it[row.invitedBy],
        row.attendance,
        row.mealPreference
          ? mealPreferenceLabels.it[row.mealPreference]
          : null,
        row.changedInLatestSubmission ? "Sì" : "No",
        row.responseUpdatedAt
      ]
        .map(csvCell)
        .join(",")
    )
  ].join("\r\n");

  await recordAdminEvent(admin.actorId, "rsvp_exported", {
    exported_rows: rows.length
  });

  const date = new Date().toISOString().slice(0, 10);

  return new Response(`\uFEFF${body}`, {
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Content-Disposition": `attachment; filename="rsvp-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff"
    }
  });
}
