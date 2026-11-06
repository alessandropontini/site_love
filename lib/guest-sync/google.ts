import "server-only";
import { createSign } from "node:crypto";
import { z } from "zod";

export class SyncError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
  }
}
export function sourceId() {
  const id = process.env.GUEST_SYNC_SPREADSHEET_ID;
  if (!id || !/^[a-zA-Z0-9_-]{20,150}$/.test(id))
    throw new SyncError(
      "CONFIG",
      "Google Sheets synchronization is not configured."
    );
  return id;
}
async function request(url: string, init: RequestInit) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let response: Response;
    try {
      response = await fetch(url, {
        ...init,
        cache: "no-store",
        signal: AbortSignal.timeout(8000)
      });
    } catch {
      throw new SyncError(
        "GOOGLE_UNAVAILABLE",
        "Google Sheets could not be reached. Retry Preview Sync."
      );
    }
    if (response.ok) return response.json();
    if (response.status === 401)
      throw new SyncError(
        "GOOGLE_AUTH",
        "Google authentication failed. Check the service account credentials."
      );
    if (response.status === 403 || response.status === 404)
      throw new SyncError(
        "GOOGLE_ACCESS",
        "Google access denied or spreadsheet missing. Check sharing and the Sheets API configuration."
      );
    if ((response.status === 429 || response.status >= 500) && attempt < 2) {
      const delay = Math.min(
        Number(response.headers.get("retry-after") ?? 1),
        3
      );
      await new Promise((resolve) =>
        setTimeout(resolve, (Number.isFinite(delay) ? delay : 1) * 1000)
      );
      continue;
    }
    throw new SyncError(
      "GOOGLE_API",
      "Google rejected the request. Check configuration or retry later."
    );
  }
  throw new SyncError("GOOGLE_API", "Google request failed.");
}
async function accessToken() {
  const email = process.env.GUEST_SYNC_GOOGLE_CLIENT_EMAIL;
  const key = process.env.GUEST_SYNC_GOOGLE_PRIVATE_KEY?.replaceAll(
    "\\n",
    "\n"
  );
  if (!email || !key)
    throw new SyncError(
      "CONFIG",
      "The Google service account is not configured."
    );
  const encode = (v: unknown) =>
    Buffer.from(JSON.stringify(v)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: email, scope: "https://www.googleapis.com/auth/spreadsheets.readonly", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 600 })}`;
  let signature: string;
  try {
    signature = createSign("RSA-SHA256").update(payload).sign(key, "base64url");
  } catch {
    throw new SyncError("GOOGLE_AUTH", "The Google private key is invalid.");
  }
  const token = z.object({ access_token: z.string() }).safeParse(
    await request("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: `${payload}.${signature}`
      })
    })
  );
  if (!token.success)
    throw new SyncError(
      "GOOGLE_AUTH",
      "Google did not return an access token."
    );
  return token.data.access_token;
}
async function readTab(token: string, id: string, tab: "Guest List" | "Households") {
  // Read the used values of each tab, not a fixed row count that silently truncates.
  const result = z
    .object({
      values: z
        .array(
          z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
        )
        .max(5001)
        .optional()
    })
    .safeParse(
      await request(
        `https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${encodeURIComponent(`'${tab}'`)}?valueRenderOption=UNFORMATTED_VALUE`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
    );
  if (!result.success)
    throw new SyncError(
      "SOURCE_SIZE",
      "Invalid source response or more than 5,000 guest rows. Nothing was imported."
    );
  return result.data.values ?? [];
}

/** Read both planning tabs for the later, explicitly selected Household UUID mode. */
export async function readSheets(): Promise<{ guestList: unknown[][]; households: unknown[][] }> {
  const id = sourceId();
  const token = await accessToken();
  const [guestList, households] = await Promise.all([
    readTab(token, id, "Guest List"),
    readTab(token, id, "Households")
  ]);
  return { guestList, households };
}

/** Preserve the existing legacy integration and its single-tab contract. */
export async function readSheet(): Promise<unknown[][]> {
  const id = sourceId();
  const token = await accessToken();
  return readTab(token, id, "Guest List");
}
