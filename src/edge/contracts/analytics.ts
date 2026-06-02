/**
 * Analytics domain — edge function contracts (Phase 9g).
 */
import { z } from "zod";

export interface AdminReportBuilderRequest {
  brief: string;
  [k: string]: unknown;
}

export const AdminReportBuilderResponseSchema = z
  .object({
    spec: z.unknown().optional(),
    data: z.record(z.unknown()).optional(),
    error: z.string().optional(),
    detail: z.unknown().optional(),
  })
  .passthrough();
export type AdminReportBuilderResponse = z.infer<
  typeof AdminReportBuilderResponseSchema
>;

export interface AdminAnalystRequest {
  question?: string;
  [k: string]: unknown;
}

export const AdminAnalystResponseSchema = z
  .object({
    answer: z.string().optional(),
    data: z.unknown().optional(),
    error: z.string().optional(),
    detail: z.unknown().optional(),
  })
  .passthrough();
export type AdminAnalystResponse = z.infer<typeof AdminAnalystResponseSchema>;
