/** Browser-only Meta helpers (Pixel + CAPI bridge). */

export type MetaBrowserEventName =
  | "PageView"
  | "Lead"
  | "CompleteRegistration"
  | "ViewContent"
  | "Search"
  | "Contact";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

export function newBrowserEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ev_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}

function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function trackMetaBrowserEvent(
  eventName: MetaBrowserEventName,
  options?: {
    eventId?: string;
    customData?: Record<string, unknown>;
    email?: string;
    phone?: string;
    externalId?: string;
    eventSourceUrl?: string;
  },
): string {
  const eventId = options?.eventId ?? newBrowserEventId();
  const eventSourceUrl =
    options?.eventSourceUrl ??
    (typeof window !== "undefined" ? window.location.href : undefined);

  // Browser Pixel (deduped with CAPI via eventID)
  try {
    if (typeof window !== "undefined" && typeof window.fbq === "function") {
      window.fbq(
        "track",
        eventName,
        options?.customData ?? {},
        { eventID: eventId },
      );
    }
  } catch {
    // ignore pixel errors
  }

  // Server Conversion API
  try {
    const body = {
      event_name: eventName,
      event_id: eventId,
      event_source_url: eventSourceUrl,
      email: options?.email,
      phone: options?.phone,
      external_id: options?.externalId,
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
      custom_data: options?.customData,
    };
    void fetch("/api/meta/capi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // ignore
  }

  return eventId;
}
