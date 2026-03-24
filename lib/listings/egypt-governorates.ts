/** Egypt’s 27 governorates — Arabic names (stored in `listings.location`). */
export const EGYPT_GOVERNORATES_AR = [
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "البحر الأحمر",
  "البحيرة",
  "الفيوم",
  "الغربية",
  "الإسماعيلية",
  "المنوفية",
  "المنيا",
  "القليوبية",
  "الوادي الجديد",
  "السويس",
  "أسوان",
  "أسيوط",
  "بني سويف",
  "بورسعيد",
  "دمياط",
  "الشرقية",
  "جنوب سيناء",
  "كفر الشيخ",
  "مطروح",
  "الأقصر",
  "قنا",
  "شمال سيناء",
  "سوهاج",
] as const;

export type EgyptGovernorateAr = (typeof EGYPT_GOVERNORATES_AR)[number];

export function isEgyptGovernorateAr(s: string): s is EgyptGovernorateAr {
  return (EGYPT_GOVERNORATES_AR as readonly string[]).includes(s);
}
