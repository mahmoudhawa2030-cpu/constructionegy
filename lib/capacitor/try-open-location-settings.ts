import { Capacitor } from "@capacitor/core";

/** Opens Android system Location (GPS) settings when possible; no-op on web/iOS. */
export function tryOpenAndroidLocationSettings(): void {
  if (typeof window === "undefined") return;
  if (Capacitor.getPlatform() !== "android") return;
  window.location.href = "intent:#Intent;action=android.settings.LOCATION_SOURCE_SETTINGS;end";
}
