-- Update mobile homepage config from i18n keys to bilingual text objects

UPDATE mobile_homepage_config 
SET content = '{
  "hero": {
    "kicker": {"ar": "ابنِ بثقة", "en": "BUILD WITH CONFIDENCE"},
    "title": {"ar": "سوق البناء رقم #1 في مصر", "en": "Egypt''s #1 Construction Marketplace"},
    "subtitle": {"ar": "مواد بناء عالية الجودة من الموردين الموثوقين", "en": "High-quality construction materials from trusted suppliers"},
    "browseDealsText": {"ar": "تصفح الصفقات", "en": "Browse Deals"},
    "postRfqText": {"ar": "نشر طلب عرض", "en": "Post RFQ"},
    "stats": {
      "products": "50K+",
      "suppliers": "3,200",
      "onTime": "98%"
    }
  },
  "flash_deals": {
    "title": {"ar": "الصفقات السريعة", "en": "Flash Deals"},
    "subtitle": {"ar": "عروض محدودة الوقت", "en": "Limited time offers"},
    "timerHours": 5,
    "timerMinutes": 28,
    "timerSeconds": 44
  },
  "membership": {
    "kicker": {"ar": "عضوية مميزة", "en": "PREMIUM MEMBERSHIP"},
    "welcomeText": {"ar": "مرحباً بعودتك", "en": "Welcome Back"},
    "subtitle": {"ar": "استمتع بامتيازات حصرية", "en": "Enjoy exclusive benefits"},
    "redeemButton": {"ar": "استرداد", "en": "Redeem"},
    "perks": [
      {"value": "12%", "label": {"ar": "خصم خاص", "en": "Special Discount"}},
      {"value": "perkFreeVal", "label": {"ar": "شحن مجاني", "en": "Free Shipping"}},
      {"value": "Net-60", "label": {"ar": "شروط دفع مرنة", "en": "Flexible Terms"}},
      {"value": "24/7", "label": {"ar": "دعم على مدار الساعة", "en": "24/7 Support"}}
    ]
  },
  "promo_banners": {
    "cards": [
      {
        "kicker": {"ar": "شحن مجاني", "en": "FREE SHIPPING"},
        "title": {"ar": "على جميع الطلبات", "en": "On All Orders"},
        "cta": {"ar": "اطلب الآن", "en": "Claim Now"},
        "link": "/gallery",
        "color": "primary"
      },
      {
        "kicker": {"ar": "شروط مرنة", "en": "FLEXIBLE TERMS"},
        "title": {"ar": "Net-60 دفع", "en": "Net-60 Payment"},
        "cta": {"ar": "قدم الآن", "en": "Apply Now"},
        "link": "/subscription-required",
        "color": "dark"
      },
      {
        "kicker": {"ar": "موثوق", "en": "TRUSTED"},
        "title": {"ar": "موردين معتمدين", "en": "Verified Suppliers"},
        "cta": {"ar": "اعرف المزيد", "en": "Learn More"},
        "link": "/gallery",
        "color": "orange"
      },
      {
        "kicker": {"ar": "جديد", "en": "NEW"},
        "title": {"ar": "انضم كعامل", "en": "Join as Supplier"},
        "cta": {"ar": "تصفح الكل", "en": "Browse All"},
        "link": "/users",
        "color": "green"
      }
    ]
  },
  "rfq": {
    "title": {"ar": "تحتاج مواد بناء؟", "en": "Need Construction Materials?"},
    "subtitle": {"ar": "احصل على عروض من موردين موثوقين", "en": "Get quotes from trusted suppliers"},
    "cta": {"ar": "نشر طلب عرض", "en": "Post RFQ"}
  }
}'::jsonb
WHERE key = 'default';
