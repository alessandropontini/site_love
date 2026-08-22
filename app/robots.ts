import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/rsvp/",
        "/duomo-proposals/",
        "/rsvp/",
        "/sign-in/",
        "/sun-proposals/"
      ]
    }
  };
}
