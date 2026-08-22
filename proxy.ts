import { clerkMiddleware } from "@clerk/nextjs/server";
import {
  NextFetchEvent,
  NextRequest,
  NextResponse
} from "next/server";

const hasClerkConfiguration = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
    process.env.CLERK_SECRET_KEY
);
const configuredClerkProxy = hasClerkConfiguration
  ? clerkMiddleware()
  : null;

export default function proxy(request: NextRequest, event: NextFetchEvent) {
  if (!configuredClerkProxy) {
    if (request.nextUrl.pathname.startsWith("/admin")) {
      return new NextResponse("Not found", {
        status: 404,
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow, noarchive"
        }
      });
    }

    return NextResponse.next();
  }

  return configuredClerkProxy(request, event);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/sign-in/:path*"
  ]
};
