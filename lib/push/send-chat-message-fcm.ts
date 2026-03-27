import "server-only";

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";

/**
 * Sends FCM data+notification to multiple device tokens.
 * Requires `FIREBASE_SERVICE_ACCOUNT_JSON` (full service account JSON string) on the server.
 * Returns 0 sent if env is missing (push disabled).
 */
export async function sendChatMessageFcm(params: {
  tokens: string[];
  title: string;
  body: string;
  chatId: string;
}): Promise<{ successCount: number; failureCount: number }> {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw || params.tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { successCount: 0, failureCount: params.tokens.length };
  }

  if (!getApps().length) {
    initializeApp({ credential: cert(parsed as never) });
  }

  const messaging = getMessaging();
  const res = await messaging.sendEachForMulticast({
    tokens: params.tokens,
    notification: {
      title: params.title,
      body: params.body,
    },
    data: {
      chatId: params.chatId,
    },
    android: {
      priority: "high",
    },
  });

  return {
    successCount: res.successCount,
    failureCount: res.failureCount,
  };
}
