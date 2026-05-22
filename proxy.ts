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

  // Redirect logic: desktop users at certain paths go to /web equivalents.
  // Preserve Supabase cookies on the redirect.
  const desktopRedirectPaths: [RegExp, (m: RegExpMatchArray) => string][] = [
    [/^\/$/, () => "/web"],
    [/^\/gallery$/, () => "/web/gallery"],
    [/^\/listings\/([^/]+)$/, (m) => `/web/listings/${m[1]}`],
  ];

  if (!mobile) {
    for (const [pattern, toPath] of desktopRedirectPaths) {
      const match = pathname.match(pattern);
      if (match) {
        const url = request.nextUrl.clone();
        url.pathname = toPath(match);
        const redirectResponse = NextResponse.redirect(url);
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
    }
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
