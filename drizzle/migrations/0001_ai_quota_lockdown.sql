REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ai_usage_daily, public.ai_requests FROM anon, authenticated;
REVOKE SELECT ON public.ai_usage_daily, public.ai_requests FROM anon;