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
    __metaRecentEvents?: Map<string, number>;
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

function shouldSkipDuplicate(eventName: string, eventSourceUrl: string | undefined, eventId: string | undefined): boolean {
  if (typeof window === "undefined") return false;
  if (!window.__metaRecentEvents) window.__metaRecentEvents = new Map();
  const map = window.__metaRecentEvents;
  const key = eventId ? `id:${eventId}` : `${eventName}|${eventSourceUrl ?? ""}`;
  const now = Date.now();
  const prev = map.get(key);
  // Drop exact same event_id or same name+url within 2s (React strict/remount)
  if (prev && now - prev < 2000) return true;
  map.set(key, now);
  // prune
  if (map.size > 100) {
    for (const [k, ts] of map) {
      if (now - ts > 10000) map.delete(k);
    }
  }
  return false;
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

  if (shouldSkipDuplicate(eventName, eventSourceUrl, options?.eventId ? eventId : undefined)) {
    // Still allow intentional unique eventIds; only skip when no id was forced and same url recently
    // When eventId is newly generated each call, key by name+url for PageView-like spam
  }

  // Always dedupe PageView by URL for 2s even with new ids (prevents double bridge fire)
  if (eventName === "PageView" && shouldSkipDuplicate(eventName, eventSourceUrl, undefined)) {
    return eventId;
  }
  // mark this PageView url
  if (eventName === "PageView") {
    shouldSkipDuplicate(eventName, eventSourceUrl, undefined);
  }

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
