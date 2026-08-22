import { createHash } from "node:crypto";

const tokenPattern = /^[A-Za-z0-9_-]{22,128}$/;

export function isPlausibleRsvpToken(token: string) {
  return tokenPattern.test(token);
}

export function hashRsvpToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}
