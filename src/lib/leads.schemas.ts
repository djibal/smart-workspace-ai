import { z } from "zod";

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(100),
  email: z.string().trim().email("Enter a valid email address.").max(254),
  company: z.string().trim().max(120),
  phone: z.string().trim().max(40).refine((value) => !value || /^[+\d\s().-]+$/.test(value), "Enter a valid phone number."),
  message: z.string().trim().min(1, "Enter your message.").max(2000),
  website: z.string().max(0, "Submission not accepted."),
}).strict();

export type LeadInput = z.infer<typeof leadSchema>;