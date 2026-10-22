import { createServerFn } from "@tanstack/react-start";
import { leadSchema } from "./leads.schemas";

// Deliberately public: this action can only insert a validated lead, never read private data.
export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => leadSchema.parse(input))
  .handler(async ({ data }): Promise<{ success: boolean; error?: string }> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { website: _website, ...lead } = data;
    const { error } = await supabaseAdmin.from("lead_submissions").insert(lead);
    if (error) {
      // Do not log visitor contact details.
      console.error("[submitLead] save failed", error.code);
      return { success: false, error: "Your message couldn't be saved. Please try again." };
    }
    return { success: true };
  });