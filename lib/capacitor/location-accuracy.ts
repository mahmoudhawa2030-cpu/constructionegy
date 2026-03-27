import { registerPlugin } from "@capacitor/core";

export type LocationAccuracyResult = {
  /** Settings already meet high-accuracy request (no sheet shown). */
  alreadySatisfied?: boolean;
  /** User closed the system sheet. */
  userReturned?: boolean;
  /** User tapped Turn on (RESULT_OK). */
  ok?: boolean;
};

export interface LocationAccuracyPlugin {
  requestHighAccuracySheet(): Promise<LocationAccuracyResult>;
}

export const LocationAccuracy = registerPlugin<LocationAccuracyPlugin>("LocationAccuracy");
