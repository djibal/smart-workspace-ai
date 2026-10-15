import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** UI hint only — the server enforces sign-in on every AI call. */
export function useAiAccess() {
  const [state, setState] = useState<"checking" | "signed-in" | "signed-out">("checking");
  useEffect(() => {
    let alive = true;
    supabase.auth
      .getSession()
      .then(({ data }) => alive && setState(data.session ? "signed-in" : "signed-out"))
      .catch(() => alive && setState("signed-out"));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setState(s ? "signed-in" : "signed-out"));
    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return { allowed: state === "signed-in", state };
}
