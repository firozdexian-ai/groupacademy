import { z } from "zod";

export const AuthActionSchema = z.enum([
  "welcome",
  "collect_email",
  "collect_password",
  "collect_name",
  "collect_country",
  "collect_phone",
  "set_password",
  "verify_human",
  "do_signin",
  "do_signup",
  "do_reset",
  "complete",
]);

export const AuthAgentReplySchema = z.object({
  reply: z.string().min(1),
  action: AuthActionSchema,
  quiz: z.object({ answer: z.string() }).nullable().optional(),
});

export type AuthActionT = z.infer<typeof AuthActionSchema>;
export type AuthAgentReply = z.infer<typeof AuthAgentReplySchema>;
