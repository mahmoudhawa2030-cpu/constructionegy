import { Geolocation } from "@capacitor/geolocation";

/**
 * Requests permission and returns a single high-accuracy fix (browser GPS on web, native on Capacitor).
 */
export async function getPrecisePosition(): Promise<{ lat: number; lng: number }> {
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
