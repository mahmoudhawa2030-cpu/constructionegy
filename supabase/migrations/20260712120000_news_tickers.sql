-- News ticker system: configurable data sources + placement (web/mobile/pages)

CREATE TABLE IF NOT EXISTS public.news_tickers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'Main ticker',
  enabled boolean NOT NULL DEFAULT true,
  -- web | mobile | both
  platform text NOT NULL DEFAULT 'both'
    CHECK (platform IN ('web', 'mobile', 'both')),
  -- all | home | listings | blog | rfq | custom
  page_scope text NOT NULL DEFAULT 'all'
    CHECK (page_scope IN ('all', 'home', 'listings', 'blog', 'rfq', 'custom')),
  -- when page_scope = custom: match pathname prefix, e.g. /gallery
  page_path text NOT NULL DEFAULT '',
  -- custom | seo_posts | listings | rfq
  data_source text NOT NULL DEFAULT 'custom'
    CHECK (data_source IN ('custom', 'seo_posts', 'listings', 'rfq')),
  max_items integer NOT NULL DEFAULT 10 CHECK (max_items >= 1 AND max_items <= 50),
  speed_seconds integer NOT NULL DEFAULT 28 CHECK (speed_seconds >= 8 AND speed_seconds <= 120),
  label_ar text NOT NULL DEFAULT 'عاجل',
  label_en text NOT NULL DEFAULT 'News',
  bg_color text NOT NULL DEFAULT '#0f172a',
  text_color text NOT NULL DEFAULT '#f8fafc',
  accent_color text NOT NULL DEFAULT '#ef4444',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.news_ticker_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticker_id uuid NOT NULL REFERENCES public.news_tickers(id) ON DELETE CASCADE,
  text_ar text NOT NULL DEFAULT '',
  text_en text NOT NULL DEFAULT '',
  href text NOT NULL DEFAULT '',
  enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_tickers_enabled_platform_idx
  ON public.news_tickers (enabled, platform, sort_order);

CREATE INDEX IF NOT EXISTS news_ticker_items_ticker_idx
  ON public.news_ticker_items (ticker_id, enabled, sort_order);

DROP TRIGGER IF EXISTS news_tickers_set_updated_at ON public.news_tickers;
CREATE TRIGGER news_tickers_set_updated_at
  BEFORE UPDATE ON public.news_tickers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS news_ticker_items_set_updated_at ON public.news_ticker_items;
CREATE TRIGGER news_ticker_items_set_updated_at
  BEFORE UPDATE ON public.news_ticker_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.news_tickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_ticker_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "news_tickers_public_select" ON public.news_tickers;
CREATE POLICY "news_tickers_public_select"
  ON public.news_tickers FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

DROP POLICY IF EXISTS "news_tickers_admin_all" ON public.news_tickers;
CREATE POLICY "news_tickers_admin_all"
  ON public.news_tickers FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "news_ticker_items_public_select" ON public.news_ticker_items;
CREATE POLICY "news_ticker_items_public_select"
  ON public.news_ticker_items FOR SELECT
  TO anon, authenticated
  USING (
    enabled = true
    AND EXISTS (
      SELECT 1 FROM public.news_tickers t
      WHERE t.id = ticker_id AND t.enabled = true
    )
  );

DROP POLICY IF EXISTS "news_ticker_items_admin_all" ON public.news_ticker_items;
CREATE POLICY "news_ticker_items_admin_all"
  ON public.news_ticker_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

COMMENT ON TABLE public.news_tickers IS 'Scrolling news ticker configs: data source + web/mobile/page placement.';
COMMENT ON TABLE public.news_ticker_items IS 'Manual ticker lines when data_source=custom.';
