"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect } from "react";

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
        // FCM/APNs not configured yet
      }

      const hReg = await PushNotifications.addListener("registration", (token) => {
        if (process.env.NODE_ENV === "development") {
          console.debug("[push] registration", token.value);
        }
      });

      const hErr = await PushNotifications.addListener("registrationError", (err) => {
        if (process.env.NODE_ENV === "development") {
          console.debug("[push] registrationError", err);
        }
      });

      ac.signal.addEventListener("abort", () => {
        void hReg.remove();
        void hErr.remove();
      });
    })();

    return () => ac.abort();
  }, []);

  return null;
}
