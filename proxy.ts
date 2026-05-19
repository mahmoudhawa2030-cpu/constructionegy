import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Detect mobile devices from user agent
function isMobileDevice(userAgent: string): boolean {
  const mobileKeywords = [
    "Android",
    "iPhone",
    "iPad",
    "iPod",
    "BlackBerry",
    "Windows Phone",
    "Mobile",
    "Opera Mini",
    "Opera Mobi",
  ];

  return mobileKeywords.some((keyword) =>
    userAgent.toLowerCase().includes(keyword.toLowerCase())
  );
}

// Check if request is from a native app (Capacitor/Cordova)
function isNativeApp(userAgent: string): boolean {
  return userAgent.includes("Capacitor") || userAgent.includes("Cordova");
}

export async function proxy(request: NextRequest) {
  // First, handle Supabase session (this response carries refreshed auth cookies)
  const supabaseResponse = await updateSession(request);

  // Then add device detection
  const userAgent = request.headers.get("user-agent") || "";
  const mobile = isMobileDevice(userAgent) || isNativeApp(userAgent);
  const pathname = request.nextUrl.pathname;

  // Redirect logic: desktop users at root go to /web
  // Mobile users stay at root. Preserve Supabase cookies on the redirect.
  if (!mobile && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/web";
    const redirectResponse = NextResponse.redirect(url);
    // Forward all Supabase auth cookies onto the redirect response
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }
    redirectResponse.cookies.set("device-type", "desktop", {
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
    redirectResponse.headers.set("x-device-type", "desktop");
    return redirectResponse;
  }

  // Non-redirect: reuse the Supabase response so cookies stay intact
  supabaseResponse.cookies.set("device-type", mobile ? "mobile" : "desktop", {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  supabaseResponse.headers.set("x-device-type", mobile ? "mobile" : "desktop");

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and metadata.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
