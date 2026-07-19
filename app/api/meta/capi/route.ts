import { NextResponse } from "next/server";

import {
  buildMetaUserData,
  getMetaRequestContext,
  isMetaCapiConfigured,
  sendMetaCapiEvents,
} from "@/lib/meta/capi";

const ALLOWED_EVENTS = new Set([
  "PageView",
  "Lead",
  "CompleteRegistration",
  "ViewContent",
  "Search",
  "Contact",
  "AddToWishlist",
]);


type Body = {
  event_name?: string;
  event_id?: string;
  event_source_url?: string;
  email?: string;
  phone?: string;
  external_id?: string;
  fbp?: string;
  fbc?: string;
  custom_data?: Record<string, unknown>;
};

export async function POST(request: Request) {
  if (!isMetaCapiConfigured()) {
    return NextResponse.json({ ok: false, skipped: true }, { status: 200 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, message: "invalid json" }, { status: 400 });
  }

  const eventName = String(body.event_name ?? "").trim();
  if (!ALLOWED_EVENTS.has(eventName)) {
    return NextResponse.json({ ok: false, message: "event not allowed" }, { status: 400 });
  }

  const ctx = await getMetaRequestContext();
  const user_data = buildMetaUserData({
    email: body.email,
    phone: body.phone,
    externalId: body.external_id,
    client_ip_address: ctx.client_ip_address,
    client_user_agent: ctx.client_user_agent,
    fbp: body.fbp ?? ctx.fbp,
    fbc: body.fbc ?? ctx.fbc,
  });

  const result = await sendMetaCapiEvents([
    {
      event_name: eventName,
      event_id: body.event_id,
      event_source_url: body.event_source_url,
      action_source: "website",
      user_data,
      custom_data: body.custom_data,
    },
  ]);

  if (!result.ok) {
    return NextResponse.json({ ok: false, message: result.message }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
