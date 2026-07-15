-- Sticky right-sidebar cards under RFQ CTA on /web (admin-managed via homepage CMS).
-- Safe to run multiple times.

INSERT INTO public.homepage_sections (
  slug,
  section_type,
  sort_order,
  enabled,
  title_ar,
  title_en,
  subtitle_ar,
  subtitle_en
)
VALUES (
  'web_sidebar_cards',
  'grid',
  70,
  true,
  'بطاقات الشريط الجانبي',
  'Sidebar cards',
  'بطاقات تحت زر طلب عرض السعر في الصفحة الرئيسية',
  'Cards under the RFQ block on the web home right sidebar'
)
ON CONFLICT (slug) DO NOTHING;
