import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RSVP — Alessandro & Bridget",
  robots: {
    index: false,
    follow: false,
    nocache: true
  }
};

export default function RsvpLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
