-- Construction-egy marketplace schema
-- Apply via Supabase SQL Editor or: supabase db push

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE public.user_type AS ENUM ('contractor', 'supplier');

CREATE TYPE public.listing_type AS ENUM ('rent', 'sell');

CREATE TYPE public.listing_condition AS ENUM ('new', 'used');

CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'rented');

CREATE TYPE public.order_status AS ENUM (
  'pending',
  'confirmed',
  'paid',
  'shipped',
  'completed',
  'cancelled'
);

CREATE TYPE public.review_role AS ENUM ('buyer_to_seller', 'seller_to_buyer');

-- profiles
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  user_type public.user_type NOT NULL,
  full_name text NOT NULL,
  phone_number text,
  whatsapp_number text,
  location text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- listings
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL,
  type public.listing_type NOT NULL,
  price numeric(14, 2) NOT NULL CHECK (price >= 0),
  price_unit text NOT NULL DEFAULT 'EGP',
  condition public.listing_condition NOT NULL,
  description text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}',
  location text,
  status public.listing_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- chats
CREATE TABLE public.chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  participant2_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  listing_id uuid REFERENCES public.listings (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chats_distinct_participants CHECK (participant1_id <> participant2_id)
);

CREATE UNIQUE INDEX chats_dedupe_idx ON public.chats (
  LEAST(participant1_id, participant2_id),
  GREATEST(participant1_id, participant2_id),
  COALESCE(listing_id, '00000000-0000-0000-0000-000000000000'::uuid)
);

-- messages
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL REFERENCES public.chats (id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  content text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings (id) ON DELETE RESTRICT,
  buyer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  seller_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  status public.order_status NOT NULL DEFAULT 'pending',
  total_amount numeric(14, 2) NOT NULL CHECK (total_amount >= 0),
  currency text NOT NULL DEFAULT 'EGP',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT orders_distinct_roles CHECK (buyer_id <> seller_id)
);

-- reviews (per order + reviewer)
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders (id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reviewee_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  role public.review_role NOT NULL,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reviews_reviewer_not_reviewee CHECK (reviewer_id <> reviewee_id),
  CONSTRAINT reviews_one_per_order_reviewer UNIQUE (order_id, reviewer_id)
);

-- updated_at trigger for listings + orders
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER listings_updated_at
  BEFORE UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Auto-create profile on signup (default contractor; app can UPDATE)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_type, full_name)
  VALUES (
    NEW.id,
    'contractor',
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(COALESCE(NEW.email, ''), '@', 1), 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Indexes for search / filters
CREATE INDEX listings_user_id_idx ON public.listings (user_id);
CREATE INDEX listings_status_created_idx ON public.listings (status, created_at DESC);
CREATE INDEX listings_category_idx ON public.listings (category);
CREATE INDEX listings_price_idx ON public.listings (price);
CREATE INDEX listings_location_idx ON public.listings (location);
CREATE INDEX listings_title_description_fts ON public.listings USING gin (
  to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(description, ''))
);

CREATE INDEX messages_chat_id_created_idx ON public.messages (chat_id, created_at DESC);
CREATE INDEX orders_buyer_idx ON public.orders (buyer_id);
CREATE INDEX orders_seller_idx ON public.orders (seller_id);
CREATE INDEX reviews_reviewee_idx ON public.reviews (reviewee_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_authenticated"
  ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

CREATE POLICY "listings_select_active_or_own"
  ON public.listings FOR SELECT TO authenticated
  USING (
    status = 'active' OR user_id = auth.uid()
  );

CREATE POLICY "listings_insert_own"
  ON public.listings FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "listings_update_own"
  ON public.listings FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "listings_delete_own"
  ON public.listings FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "chats_select_participants"
  ON public.chats FOR SELECT TO authenticated
  USING (participant1_id = auth.uid() OR participant2_id = auth.uid());

CREATE POLICY "chats_insert_participants"
  ON public.chats FOR INSERT TO authenticated
  WITH CHECK (
    participant1_id = auth.uid() OR participant2_id = auth.uid()
  );

CREATE POLICY "messages_select_chat_members"
  ON public.messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

CREATE POLICY "messages_insert_sender_in_chat"
  ON public.messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

CREATE POLICY "messages_update_read_own_chat"
  ON public.messages FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (c.participant1_id = auth.uid() OR c.participant2_id = auth.uid())
    )
  );

CREATE POLICY "orders_select_parties"
  ON public.orders FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "orders_insert_buyer"
  ON public.orders FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "orders_update_parties"
  ON public.orders FOR UPDATE TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "reviews_select_authenticated"
  ON public.reviews FOR SELECT TO authenticated USING (true);

CREATE POLICY "reviews_insert_reviewer_order_party"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (
    reviewer_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
    AND (
      (
        reviewer_id = (SELECT buyer_id FROM public.orders WHERE id = order_id)
        AND reviewee_id = (SELECT seller_id FROM public.orders WHERE id = order_id)
        AND role = 'buyer_to_seller'
      )
      OR
      (
        reviewer_id = (SELECT seller_id FROM public.orders WHERE id = order_id)
        AND reviewee_id = (SELECT buyer_id FROM public.orders WHERE id = order_id)
        AND role = 'seller_to_buyer'
      )
    )
  );
