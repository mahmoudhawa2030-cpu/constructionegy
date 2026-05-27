-- Mobile homepage configuration table
-- Allows admin to control sections visibility, order, and content

CREATE TABLE IF NOT EXISTS mobile_homepage_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE mobile_homepage_config ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (public config)
CREATE POLICY "mobile_homepage_config_public_select"
  ON mobile_homepage_config
  FOR SELECT
  USING (true);

-- Only admins can modify
CREATE POLICY "mobile_homepage_config_admin_all"
  ON mobile_homepage_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Insert default config
INSERT INTO mobile_homepage_config (key, sections, content)
VALUES (
  'default',
  '[
    {"id": "stories", "enabled": true, "order": 1, "title": "Categories"},
    {"id": "hero", "enabled": true, "order": 2, "title": "Hero Banner"},
    {"id": "membership", "enabled": true, "order": 3, "title": "Membership Card"},
    {"id": "flash_deals", "enabled": true, "order": 4, "title": "Flash Deals"},
    {"id": "categories", "enabled": true, "order": 5, "title": "Categories Grid"},
    {"id": "trending", "enabled": true, "order": 6, "title": "Trending Products"},
    {"id": "promo_banners", "enabled": true, "order": 7, "title": "Promo Banners"},
    {"id": "suppliers", "enabled": true, "order": 8, "title": "Top Suppliers"},
    {"id": "rfq", "enabled": true, "order": 9, "title": "RFQ Form"},
    {"id": "recent_orders", "enabled": true, "order": 10, "title": "Recent Orders"}
  ]'::jsonb,
  '{
    "hero": {
      "kicker": "heroKicker",
      "title": "heroTitle",
      "subtitle": "heroSubtitle",
      "browseDealsText": "browseDeals",
      "postRfqText": "postRfq",
      "stats": {
        "products": "50K+",
        "suppliers": "3,200",
        "onTime": "98%"
      }
    },
    "flash_deals": {
      "title": "flashDeals",
      "subtitle": "flashSub",
      "timerHours": 5,
      "timerMinutes": 28,
      "timerSeconds": 44
    },
    "membership": {
      "kicker": "memberKicker",
      "welcomeText": "welcomeBack",
      "subtitle": "memberSub",
      "redeemButton": "redeem",
      "perks": [
        {"value": "12%", "label": "perkDiscount"},
        {"value": "perkFreeVal", "label": "perkFreight"},
        {"value": "Net-60", "label": "perkTerms"},
        {"value": "24/7", "label": "perkSupport"}
      ]
    },
    "promo_banners": {
      "cards": [
        {
          "kicker": "promoShippingKicker",
          "title": "promoShipping",
          "cta": "claimNow",
          "link": "/gallery",
          "color": "primary"
        },
        {
          "kicker": "promoTermsKicker",
          "title": "promoTerms",
          "cta": "applyNow",
          "link": "/subscription-required",
          "color": "dark"
        },
        {
          "kicker": "promoTrustKicker",
          "title": "promoTrust",
          "cta": "learnMore",
          "link": "/gallery",
          "color": "orange"
        },
        {
          "kicker": "promoNewKicker",
          "title": "promoNew",
          "cta": "browseAll",
          "link": "/users",
          "color": "green"
        }
      ]
    },
    "rfq": {
      "title": "rfqTitle",
      "subtitle": "rfqSub",
      "cta": "rfqCta"
    }
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for updated_at
DROP TRIGGER IF EXISTS mobile_homepage_config_updated_at ON mobile_homepage_config;
CREATE TRIGGER mobile_homepage_config_updated_at
  BEFORE UPDATE ON mobile_homepage_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grants
GRANT SELECT ON mobile_homepage_config TO authenticated, anon;
GRANT INSERT, UPDATE, DELETE ON mobile_homepage_config TO authenticated;
