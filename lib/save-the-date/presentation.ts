import type { SaveTheDateStatus } from "./workflow";

export function manualConfirmationText(status: SaveTheDateStatus) {
  switch (status) {
    case "READY":
      return "I reviewed this draft and prepared it manually. It has not been sent.";
    case "SENT":
      return "I confirm that I sent this Save the Date manually outside SITE LOVE.";
    case "FAILED":
      return "I confirm that a manual attempt was made and failed.";
    case "NOT_SENT":
      return "I confirm that this status corrects the previous manual record.";
  }
}

export function canRecordManualStatus(
  status: SaveTheDateStatus | "",
  allowedStatuses: readonly SaveTheDateStatus[],
  confirmed: boolean
) {
  return confirmed && status !== "" && allowedStatuses.includes(status);
}
