-- Registered legal name collected before verification document uploads (profile KYC).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS legal_company_name text;

COMMENT ON COLUMN public.profiles.legal_company_name IS 'Legal / registered company name for verification and RFQ.';
