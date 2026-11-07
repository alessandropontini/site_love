import QRCode from "qrcode";

/** Render an activated opaque RSVP URL in memory as a private downloadable PNG. */
export async function renderPrivateInvitationQr(value: string, expectedOrigin: string) {
  const url = new URL(value);
  const origin = new URL(expectedOrigin);
  const localHttp = origin.protocol === "http:" && ["localhost", "127.0.0.1"].includes(origin.hostname);
  if ((!localHttp && origin.protocol !== "https:") || url.origin !== origin.origin ||
    url.username || url.password ||
    !/^\/rsvp\/[A-Za-z0-9_-]{43}$/.test(url.pathname) || url.search || url.hash) {
    throw new Error("INVALID_PRIVATE_RSVP_URL");
  }

  return QRCode.toDataURL(url.toString(), {
    errorCorrectionLevel: "H",
    type: "image/png",
    width: 512,
    margin: 2
  });
}
