import { siteOrigin } from "@/lib/siteConfig";

type TurnstileVerification = {
  success?: boolean;
  hostname?: string;
  action?: string;
};

export function getTurnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
}

export function isRsvpProtectionReady() {
  if (process.env.NODE_ENV !== "production") {
    return true;
  }

  return Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY &&
      process.env.TURNSTILE_SECRET_KEY
  );
}

export async function verifyRsvpTurnstile(response: FormDataEntryValue | null) {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }

  if (typeof response !== "string" || response.length === 0) {
    return false;
  }

  const formData = new FormData();
  formData.set("secret", secret);
  formData.set("response", response);

  try {
    const verificationResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        cache: "no-store"
      }
    );
    const verification =
      (await verificationResponse.json()) as TurnstileVerification;

    if (!verification.success || verification.action !== "rsvp_submit") {
      return false;
    }

    if (
      siteOrigin.hostname !== "localhost" &&
      verification.hostname !== siteOrigin.hostname
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
