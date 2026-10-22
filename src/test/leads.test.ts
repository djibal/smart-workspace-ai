import { describe, expect, it } from "vitest";
import { leadSchema } from "@/lib/leads.schemas";

const lead = { name: "Visitor", email: "visitor@example.com", company: "Example", phone: "+44 (20) 1234-5678", message: "Interested in AegisDesk", website: "" };

describe("public lead validation", () => {
  it("accepts the five contact fields and trims input", () => {
    expect(leadSchema.parse({ ...lead, name: " Visitor " }).name).toBe("Visitor");
  });
  it("requires name, valid email and a message", () => {
    for (const invalid of [{ name: " " }, { email: "not-email" }, { message: " " }]) {
      expect(leadSchema.safeParse({ ...lead, ...invalid }).success).toBe(false);
    }
  });
  it("allows optional company and phone", () => {
    expect(leadSchema.safeParse({ ...lead, company: "", phone: "" }).success).toBe(true);
  });
  it("enforces contact field lengths", () => {
    for (const [key, limit] of [["name", 100], ["company", 120], ["phone", 40], ["message", 2000]] as const) {
      expect(leadSchema.safeParse({ ...lead, [key]: "1".repeat(limit + 1) }).success).toBe(false);
    }
  });
  it("rejects filled honeypots and client-supplied ownership", () => {
    expect(leadSchema.safeParse({ ...lead, website: "spam" }).success).toBe(false);
    expect(leadSchema.safeParse({ ...lead, userId: "visitor" }).success).toBe(false);
  });
});