import { NextResponse, type NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") || "";
  const { pathname } = request.nextUrl;

  // Skip for static files, API routes, and auth callbacks
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/auth") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const mobile = isMobileDevice(userAgent) || isNativeApp(userAgent);
  
  // Set cookie to remember device preference
  const response = NextResponse.next();
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
    // Skip all internal paths
    "/((?!_next/static|_next/image|favicon.ico|api/|auth/).*)",
  ],
};
