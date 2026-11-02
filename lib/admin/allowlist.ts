// Registration or attaching an unverified secondary address is not authorization.
export function hasVerifiedAdminEmail(
  addresses: {
    emailAddress: string;
    verification: { status: string } | null;
  }[],
  allowedEmails: Set<string>
) {
  return addresses.some(
    (address) =>
      address.verification?.status === "verified" &&
      allowedEmails.has(address.emailAddress.trim().toLowerCase())
  );
}
