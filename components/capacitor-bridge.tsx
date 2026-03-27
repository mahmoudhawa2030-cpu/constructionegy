"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

async function registerTokenWithServer(token: string, platform: string) {
  try {
    await fetch("/api/push/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ token, platform }),
    });
  } catch {
    /* ignore */
  }
}

/**
 * Initializes native-only behavior on the client. Do not import Capacitor plugins in RSC.
 */
export function CapacitorBridge() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const ac = new AbortController();

    void (async () => {
      const { StatusBar, Style } = await import("@capacitor/status-bar");
      if (ac.signal.aborted) return;

      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Default });
      } catch {
        // Status bar may be unavailable on some webviews
      }

      const { PushNotifications } = await import("@capacitor/push-notifications");
      if (ac.signal.aborted) return;

      try {
        await PushNotifications.requestPermissions();
        await PushNotifications.register();
      } catch {
        // FCM/APNs not configured on device
      }

      const hReg = await PushNotifications.addListener("registration", (token) => {
        const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
        void registerTokenWithServer(token.value, platform);
      });

      const hErr = await PushNotifications.addListener("registrationError", () => {
        /* optional dev logging */
      });

      const hTap = await PushNotifications.addListener("pushNotificationActionPerformed", (event) => {
        const chatId =
          typeof event.notification.data?.chatId === "string"
            ? event.notification.data.chatId
            : undefined;
        if (chatId && typeof window !== "undefined") {
          window.location.href = `/messages/${chatId}`;
        }
      });

      ac.signal.addEventListener("abort", () => {
        void hReg.remove();
        void hErr.remove();
        void hTap.remove();
      });
    })();

    return () => ac.abort();
  }, []);

  return null;
}
