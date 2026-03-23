import { Capacitor } from "@capacitor/core";

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

export function getCapacitorPlatform(): string {
  return Capacitor.getPlatform();
}
