/** Display helper: resolve label from a map (from DB) or show slug. */
export function labelForCategorySlug(slug: string, labelMap?: Record<string, string>): string {
  if (labelMap && labelMap[slug]) {
    return labelMap[slug];
  }
  return slug;
}
