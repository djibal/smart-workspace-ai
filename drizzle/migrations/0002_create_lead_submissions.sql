CREATE TABLE public.lead_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  company text NOT NULL DEFAULT '' CHECK (char_length(company) <= 120),
  phone text NOT NULL DEFAULT '' CHECK (char_length(phone) <= 40),
  message text NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000)
);
GRANT ALL ON public.lead_submissions TO service_role;
REVOKE ALL ON public.lead_submissions FROM anon, authenticated;
ALTER TABLE public.lead_submissions ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.lead_submissions IS 'Private lead inbox. Only the dedicated validated server submission function and privileged owner Cloud tools access this table; no visitor read policies.';
CREATE INDEX lead_submissions_created_at_idx ON public.lead_submissions (created_at DESC);