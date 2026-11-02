import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { notFound } from "next/navigation";
import { hasVerifiedAdminEmail } from "./allowlist";

function configuredAdminEmails() {
  return new Set(
    (process.env.RSVP_ADMIN_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export async function requireRsvpAdmin() {
  const allowedEmails = configuredAdminEmails();

  if (
    allowedEmails.size === 0 ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    !process.env.CLERK_SECRET_KEY
  ) {
    notFound();
  }

  await auth.protect();

  const [{ userId }, user] = await Promise.all([auth(), currentUser()]);
  const isAllowed = hasVerifiedAdminEmail(user?.emailAddresses ?? [], allowedEmails);

  if (!userId || !user || !isAllowed) {
    notFound();
  }

  return {
    actorId: userId,
    displayName: user.firstName || "Administrator"
  };
}
