import { isNativePlatform } from "./is-native";

/** Capture a photo on native; no-op / reject on web unless you add a web fallback. */
export async function takePhotoFromCamera() {
  if (!isNativePlatform()) {
    throw new Error("Camera is only available inside the native app.");
  }
  const { Camera, CameraResultType } = await import("@capacitor/camera");
  return Camera.getPhoto({
    quality: 90,
    allowEditing: false,
    resultType: CameraResultType.Uri,
  });
}

export async function getCurrentPosition() {
  const { Geolocation } = await import("@capacitor/geolocation");
  return Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
  });
}
