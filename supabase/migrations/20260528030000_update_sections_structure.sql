-- Update sections structure to support bilingual titles and new types

UPDATE mobile_homepage_config 
SET sections = '[
  {
    "id": "stories", 
    "type": "stories", 
    "enabled": true, 
    "order": 1, 
    "title": {"ar": "الفئات", "en": "Categories"}
  },
  {
    "id": "hero", 
    "type": "hero", 
    "enabled": true, 
    "order": 2, 
    "title": {"ar": "بانر العرض", "en": "Hero Banner"}
  },
  {
    "id": "membership", 
    "type": "membership", 
    "enabled": true, 
    "order": 3, 
    "title": {"ar": "بطاقة العضوية", "en": "Membership Card"}
  },
  {
    "id": "flash_deals", 
    "type": "flash_deals", 
    "enabled": true, 
    "order": 4, 
    "title": {"ar": "الصفقات السريعة", "en": "Flash Deals"}
  },
  {
    "id": "categories", 
    "type": "categories", 
    "enabled": true, 
    "order": 5, 
    "title": {"ar": "شبكة الفئات", "en": "Categories Grid"}
  },
  {
    "id": "trending", 
    "type": "trending", 
    "enabled": true, 
    "order": 6, 
    "title": {"ar": "المنتجات الرائجة", "en": "Trending Products"}
  },
  {
    "id": "promo_banners", 
    "type": "promo_banners", 
    "enabled": true, 
    "order": 7, 
    "title": {"ar": "لافتات ترويجية", "en": "Promo Banners"}
  },
  {
    "id": "suppliers", 
    "type": "suppliers", 
    "enabled": true, 
    "order": 8, 
    "title": {"ar": "الموردون الرئيسيون", "en": "Top Suppliers"}
  },
  {
    "id": "rfq", 
    "type": "rfq", 
    "enabled": true, 
    "order": 9, 
    "title": {"ar": "نموذج طلب العرض", "en": "RFQ Form"}
  },
  {
    "id": "recent_orders", 
    "type": "recent_orders", 
    "enabled": true, 
    "order": 10, 
    "title": {"ar": "الطلبات الأخيرة", "en": "Recent Orders"}
  }
]'::jsonb
WHERE key = 'default';
