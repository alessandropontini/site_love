import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gestione RSVP — Alessandro & Bridget",
  robots: { index: false, follow: false, nocache: true }
};

export default function AdminLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return children;
  }

  return <ClerkProvider telemetry={false}>{children}</ClerkProvider>;
}
