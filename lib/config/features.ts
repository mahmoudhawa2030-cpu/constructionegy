// Feature flags for toggling app modules
// Set to false to disable, true to enable

export const FEATURES = {
  // Social module: posting, commenting, liking, feed
  social: false,

  // Feed/homepage posts
  feedPosts: false,

  // Comments on posts
  comments: false,

  // Post reactions (likes, saves)
  reactions: false,

  // Always enabled core features
  listings: true,
  messages: true,
  notifications: true,
  tools: true,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature];
}
