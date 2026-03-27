import { Geolocation } from "@capacitor/geolocation";

import { isNativePlatform } from "@/lib/capacitor/is-native";

/**
 * High-accuracy fix: Capacitor on native apps, `navigator.geolocation` in the browser
 * (Capacitor Geolocation permission helpers are not implemented on web — Firefox/Chrome, etc.).
 */
export async function getPrecisePosition(): Promise<{ lat: number; lng: number }> {
  if (isNativePlatform()) {
    let status = await Geolocation.checkPermissions();
    if (status.location !== "granted") {
      status = await Geolocation.requestPermissions();
    }
    if (status.location !== "granted") {
      throw new Error("permission_denied");
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 25_000,
      maximumAge: 0,
    });

    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
  }

  return getPrecisePositionWeb();
}

function getPrecisePositionWeb(): Promise<{ lat: number; lng: number }> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return Promise.reject(new Error("geolocation_unavailable"));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (err) => {
        if (err?.code === 1) {
          reject(new Error("permission_denied"));
          return;
        }
        reject(err instanceof Error ? err : new Error(String(err?.message ?? "geolocation_failed")));
      },
      {
        enableHighAccuracy: true,
        timeout: 25_000,
        maximumAge: 0,
      },
    );
  });
}
