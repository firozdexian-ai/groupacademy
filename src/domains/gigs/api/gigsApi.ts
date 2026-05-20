/**
 * Gigs domain — typed edge function wrappers (Phase 9g + 9h).
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AdminGigOpsResponseSchema,
  AiBidCoachResponseSchema,
  AiGigPublicSummaryResponseSchema,
  AiGigScoperResponseSchema,
  AiGigVerifierResponseSchema,
  AiProjectScoperResponseSchema,
  AiReviewerBriefResponseSchema,
  OgImageRenderResponseSchema,
  type AdminGigOpsRequest,
  type AdminGigOpsResponse,
  type AiBidCoachRequest,
  type AiBidCoachResponse,
  type AiGigPublicSummaryRequest,
  type AiGigPublicSummaryResponse,
  type AiGigScoperRequest,
  type AiGigScoperResponse,
  type AiGigVerifierRequest,
  type AiGigVerifierResponse,
  type AiProjectScoperRequest,
  type AiProjectScoperResponse,
  type AiReviewerBriefRequest,
  type AiReviewerBriefResponse,
  type OgImageRenderRequest,
  type OgImageRenderResponse,
} from "@/edge/contracts/gigs";

export async function aiBidCoach(
  req: AiBidCoachRequest,
): Promise<AiBidCoachResponse> {
  const { data, error } = await supabase.functions.invoke("ai-bid-coach", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("ai-bid-coach", error);
  return parseEdgeResponse("ai-bid-coach", AiBidCoachResponseSchema, data ?? {});
}

export async function adminGigOps(
  req: AdminGigOpsRequest,
): Promise<AdminGigOpsResponse> {
  const { data, error } = await supabase.functions.invoke("admin-gig-ops", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("admin-gig-ops", error);
  return parseEdgeResponse(
    "admin-gig-ops",
    AdminGigOpsResponseSchema,
    data ?? {},
  );
}

export async function aiReviewerBrief(
  req: AiReviewerBriefRequest,
): Promise<AiReviewerBriefResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-reviewer-brief",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-reviewer-brief", error);
  return parseEdgeResponse(
    "ai-reviewer-brief",
    AiReviewerBriefResponseSchema,
    data ?? {},
  );
}

export async function aiProjectScoper(
  req: AiProjectScoperRequest,
): Promise<AiProjectScoperResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-project-scoper",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-project-scoper", error);
  return parseEdgeResponse(
    "ai-project-scoper",
    AiProjectScoperResponseSchema,
    data ?? {},
  );
}

export async function aiGigVerifier(
  req: AiGigVerifierRequest,
): Promise<AiGigVerifierResponse> {
  const { data, error } = await supabase.functions.invoke("ai-gig-verifier", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("ai-gig-verifier", error);
  return parseEdgeResponse(
    "ai-gig-verifier",
    AiGigVerifierResponseSchema,
    data ?? {},
  );
}

export async function aiGigScoper(
  req: AiGigScoperRequest,
): Promise<AiGigScoperResponse> {
  const { data, error } = await supabase.functions.invoke("ai-gig-scoper", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("ai-gig-scoper", error);
  return parseEdgeResponse(
    "ai-gig-scoper",
    AiGigScoperResponseSchema,
    data ?? {},
  );
}

export async function aiGigPublicSummary(
  req: AiGigPublicSummaryRequest,
): Promise<AiGigPublicSummaryResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-gig-public-summary",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-gig-public-summary", error);
  return parseEdgeResponse(
    "ai-gig-public-summary",
    AiGigPublicSummaryResponseSchema,
    data ?? {},
  );
}

export async function ogImageRender(
  req: OgImageRenderRequest = {},
): Promise<OgImageRenderResponse> {
  const { data, error } = await supabase.functions.invoke("og-image-render", {
    body: req,
  });
  if (error) throw new EdgeFunctionError("og-image-render", error);
  return parseEdgeResponse(
    "og-image-render",
    OgImageRenderResponseSchema,
    data ?? {},
  );
}
