import { NextResponse } from "next/server";

import { sendChatMessageFcm } from "@/lib/push/send-chat-message-fcm";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type MessageRecord = {
  id?: string;
  chat_id?: string;
  sender_id?: string;
  content?: string | null;
};

type WebhookBody = {
  type?: string;
  table?: string;
  record?: MessageRecord;
  payload?: { record?: MessageRecord };
  /** Some webhook proxies use `new` for the row. */
  new?: MessageRecord;
};

function extractRecord(body: unknown): MessageRecord | null {
  if (!body || typeof body !== "object") return null;
  const b = body as WebhookBody & MessageRecord;
  if (b.record && typeof b.record === "object" && b.record.chat_id) return b.record;
  const nested = b.payload?.record;
  if (nested && typeof nested === "object" && nested.chat_id) return nested;
  if (b.new && typeof b.new === "object" && b.new.chat_id) return b.new;
  /* Some proxies send the row as the root object */
  if (typeof b.chat_id === "string" && typeof b.sender_id === "string") {
    return { id: b.id, chat_id: b.chat_id, sender_id: b.sender_id, content: b.content ?? null };
  }
  return null;
}

function getWebhookSecret(request: Request): string | null {
  const h = request.headers.get("authorization");
  if (h?.startsWith("Bearer ")) {
    const v = h.slice(7).trim();
    if (v) return v;
  }
  const x = request.headers.get("x-webhook-secret")?.trim();
  return x || null;
}

/**
 * Called by Supabase Database Webhooks on `public.messages` INSERT.
 * Configure: URL = https://<your-domain>/api/push/notify
 * Auth: Header `Authorization: Bearer <PUSH_NOTIFY_SECRET>` or `x-webhook-secret: <PUSH_NOTIFY_SECRET>`
 *
 * Also set: SUPABASE_SERVICE_ROLE_KEY, FIREBASE_SERVICE_ACCOUNT_JSON (optional; skips FCM if unset).
 */
export async function POST(request: Request) {
  const secret = process.env.PUSH_NOTIFY_SECRET?.trim();
  if (!secret) {
    return NextResponse.json({ error: "push_not_configured" }, { status: 503 });
  }

  const bearer = getWebhookSecret(request);
  if (bearer !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const record = extractRecord(raw);
  if (!record?.chat_id || !record?.sender_id) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json({ error: "no_service_role" }, { status: 503 });
  }

  const { data: chat, error: chatErr } = await admin
    .from("chats")
    .select("participant1_id, participant2_id")
    .eq("id", record.chat_id)
    .maybeSingle();

  if (chatErr || !chat) {
    return NextResponse.json({ error: "chat_not_found" }, { status: 404 });
  }

  const recipientId =
    chat.participant1_id === record.sender_id ? chat.participant2_id : chat.participant1_id;

  if (!recipientId || recipientId === record.sender_id) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const { data: senderProfile } = await admin
    .from("profiles")
    .select("full_name")
    .eq("id", record.sender_id)
    .maybeSingle();

  const senderName = senderProfile?.full_name?.trim() || "construction-egy";
  const preview = (record.content ?? "").trim();
  const bodyShort = preview.length > 160 ? `${preview.slice(0, 157)}…` : preview || "—";

  const { data: tokenRows } = await admin
    .from("user_push_tokens")
    .select("token")
    .eq("user_id", recipientId);

  const tokens = [...new Set((tokenRows ?? []).map((r) => r.token).filter(Boolean))];
  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, no_tokens: true });
  }

  const res = await sendChatMessageFcm({
    tokens,
    title: senderName,
    body: bodyShort,
    chatId: record.chat_id,
  });

  return NextResponse.json({
    ok: true,
    sent: res.successCount,
    failed: res.failureCount,
  });
}
