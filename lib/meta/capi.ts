import "server-only";

import { createHash, randomUUID } from "crypto";
import { cookies, headers } from "next/headers";

const GRAPH_VERSION = "v21.0";

export type MetaCapiUserData = {
  em?: string[];
  ph?: string[];
  external_id?: string[];
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
};

export type MetaCapiEventInput = {
  event_name: string;
  event_id?: string;
  event_source_url?: string;
  action_source?: "website";
  user_data?: MetaCapiUserData;
  custom_data?: Record<string, unknown>;
};

export function isMetaCapiConfigured(): boolean {
  return Boolean(
    process.env.META_PIXEL_ID?.trim() && process.env.META_CAPI_ACCESS_TOKEN?.trim(),
  );
}

export function newMetaEventId(): string {
  return randomUUID();
}

/** Meta requires lowercase trim + SHA-256 for PII fields. */
export function hashMetaPii(value: string): string {
  const normalized = value.trim().toLowerCase();
  return createHash("sha256").update(normalized).digest("hex");
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits;
}

export async function getMetaRequestContext(): Promise<{
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
}> {
  const h = await headers();
  const c = await cookies();

  const forwarded = h.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    undefined;
  const ua = h.get("user-agent")?.trim() || undefined;
  const fbp = c.get("_fbp")?.value;
  const fbc = c.get("_fbc")?.value;

  return {
    client_ip_address: ip,
    client_user_agent: ua,
    fbp: fbp || undefined,
    fbc: fbc || undefined,
  };
}

export function buildMetaUserData(input: {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string | null;
  fbc?: string | null;
}): MetaCapiUserData {
  const user_data: MetaCapiUserData = {};

  if (input.email?.trim()) {
    user_data.em = [hashMetaPii(input.email)];
  }
  if (input.phone?.trim()) {
    const ph = normalizePhone(input.phone);
    if (ph) user_data.ph = [hashMetaPii(ph)];
  }
  if (input.externalId?.trim()) {
    user_data.external_id = [hashMetaPii(input.externalId)];
  }
  if (input.client_ip_address) user_data.client_ip_address = input.client_ip_address;
  if (input.client_user_agent) user_data.client_user_agent = input.client_user_agent;
  if (input.fbp?.trim()) user_data.fbp = input.fbp.trim();
  if (input.fbc?.trim()) user_data.fbc = input.fbc.trim();

  return user_data;
}

export async function sendMetaCapiEvents(
  events: MetaCapiEventInput[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  const pixelId = process.env.META_PIXEL_ID?.trim();
  const token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixelId || !token) {
    return { ok: false, message: "Meta CAPI not configured" };
  }
  if (events.length === 0) {
    return { ok: true };
  }

  const testCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
  const body: Record<string, unknown> = {
    data: events.map((e) => ({
      event_name: e.event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: e.event_id || newMetaEventId(),
      event_source_url: e.event_source_url,
      action_source: e.action_source ?? "website",
      user_data: e.user_data ?? {},
      custom_data: e.custom_data,
    })),
  };
  if (testCode) {
    body.test_event_code = testCode;
  }

  try {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(token)}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[meta-capi]", res.status, text.slice(0, 500));
      return { ok: false, message: `Meta CAPI HTTP ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[meta-capi]", err);
    return { ok: false, message: "Meta CAPI request failed" };
  }
}

/** Fire-and-forget; never throws. No-ops if env not set. */
export async function trackMetaServerEvent(
  event: MetaCapiEventInput & {
    email?: string | null;
    phone?: string | null;
    externalId?: string | null;
    fbp?: string | null;
    fbc?: string | null;
  },
): Promise<void> {
  if (!isMetaCapiConfigured()) return;

  try {
    const ctx = await getMetaRequestContext();
    const user_data = buildMetaUserData({
      email: event.email,
      phone: event.phone,
      externalId: event.externalId,
      client_ip_address: ctx.client_ip_address,
      client_user_agent: ctx.client_user_agent,
      fbp: event.fbp ?? ctx.fbp,
      fbc: event.fbc ?? ctx.fbc,
    });

    await sendMetaCapiEvents([
      {
        event_name: event.event_name,
        event_id: event.event_id,
        event_source_url: event.event_source_url,
        action_source: event.action_source ?? "website",
        user_data,
        custom_data: event.custom_data,
      },
    ]);
  } catch (err) {
    console.error("[meta-capi] trackMetaServerEvent", err);
  }
}
