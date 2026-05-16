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
  // First, handle Supabase session
  let response = await updateSession(request);

  // Then add device detection
  const userAgent = request.headers.get("user-agent") || "";
  const mobile = isMobileDevice(userAgent) || isNativeApp(userAgent);

  // Get current path
  const pathname = request.nextUrl.pathname;

  // Redirect logic: desktop users at root go to /web
  // Mobile users stay at root (or any path they requested)
  // Also don't redirect if already on /web or /web/*
  if (!mobile && pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/web";
    response = NextResponse.redirect(url);
  } else {
    // Clone response to modify it for non-redirect cases
    response = NextResponse.next({
      request,
      headers: response.headers,
    });
  }

  // Set cookie to remember device preference
  response.cookies.set("device-type", mobile ? "mobile" : "desktop", {
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  // Add header for server components to detect device
  response.headers.set("x-device-type", mobile ? "mobile" : "desktop");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static assets and metadata.
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
