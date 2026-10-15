CREATE TABLE public.ai_usage_daily (
  user_id uuid NOT NULL,
  usage_day date NOT NULL,
  used integer NOT NULL DEFAULT 0 CHECK (used >= 0),
  PRIMARY KEY (user_id, usage_day)
);
CREATE TABLE public.ai_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  usage_day date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('threat','workspace','resources')),
  status text NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved','completed','failed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);
CREATE INDEX ai_requests_user_day ON public.ai_requests(user_id, usage_day);

GRANT SELECT ON public.ai_usage_daily TO authenticated;
GRANT SELECT ON public.ai_requests TO authenticated;
GRANT ALL ON public.ai_usage_daily TO service_role;
GRANT ALL ON public.ai_requests TO service_role;

ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own usage" ON public.ai_usage_daily FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users read own requests" ON public.ai_requests FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Atomic reservation: the conditional UPDATE row-locks the counter, so concurrent calls serialize.
CREATE OR REPLACE FUNCTION public.reserve_ai_request(_kind text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _uid uuid := auth.uid();
  _day date := (now() AT TIME ZONE 'utc')::date;
  _limit constant integer := 20;
  _used integer;
  _id uuid;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  INSERT INTO ai_usage_daily(user_id, usage_day, used) VALUES (_uid, _day, 0)
    ON CONFLICT (user_id, usage_day) DO NOTHING;
  UPDATE ai_usage_daily SET used = used + 1
    WHERE user_id = _uid AND usage_day = _day AND used < _limit
    RETURNING used INTO _used;
  IF _used IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'used', _limit, 'limit', _limit);
  END IF;
  INSERT INTO ai_requests(user_id, usage_day, kind) VALUES (_uid, _day, _kind) RETURNING id INTO _id;
  RETURN jsonb_build_object('allowed', true, 'used', _used, 'limit', _limit, 'id', _id);
END $$;

-- Server-only: finalize a reservation. Failed requests are refunded exactly once.
CREATE OR REPLACE FUNCTION public.finish_ai_request(_id uuid, _ok boolean)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _day date;
BEGIN
  UPDATE ai_requests SET status = CASE WHEN _ok THEN 'completed' ELSE 'failed' END, finished_at = now()
    WHERE id = _id AND status = 'reserved' RETURNING user_id, usage_day INTO _uid, _day;
  IF _uid IS NOT NULL AND NOT _ok THEN
    UPDATE ai_usage_daily SET used = GREATEST(used - 1, 0) WHERE user_id = _uid AND usage_day = _day;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.reserve_ai_request(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.reserve_ai_request(text) TO authenticated;
REVOKE ALL ON FUNCTION public.finish_ai_request(uuid, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.finish_ai_request(uuid, boolean) TO service_role;