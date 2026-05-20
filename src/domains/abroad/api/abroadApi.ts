/**
 * Typed wrappers around abroad-domain edge functions (Phase 9e).
 *
 * Convention (locked in Phase 9b):
 *   - One async function per edge function — import by name.
 *   - No `*Api` const, no `<DOMAIN>_EDGE_FUNCTIONS` array.
 *   - Responses validated at runtime via `parseEdgeResponse`.
 *   - Failures throw `EdgeFunctionError`.
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import {
  AiDestinationAgentResponseSchema,
  AiIeltsEvaluateResponseSchema,
  AiLanguagePartnerResponseSchema,
  BookLanguageSessionResponseSchema,
  GenerateStudyRoadmapResponseSchema,
  type AiDestinationAgentRequest,
  type AiDestinationAgentResponse,
  type AiIeltsEvaluateRequest,
  type AiIeltsEvaluateResponse,
  type AiLanguagePartnerRequest,
  type AiLanguagePartnerResponse,
  type BookLanguageSessionRequest,
  type BookLanguageSessionResponse,
  type GenerateStudyRoadmapRequest,
  type GenerateStudyRoadmapResponse,
} from "@/edge/contracts/abroad";

export async function aiDestinationAgent(
  req: AiDestinationAgentRequest,
): Promise<AiDestinationAgentResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-destination-agent",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-destination-agent", error);
  return parseEdgeResponse(
    "ai-destination-agent",
    AiDestinationAgentResponseSchema,
    data ?? {},
  );
}

export async function generateStudyRoadmap(
  req: GenerateStudyRoadmapRequest,
): Promise<GenerateStudyRoadmapResponse> {
  const { data, error } = await supabase.functions.invoke(
    "generate-study-roadmap",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("generate-study-roadmap", error);
  return parseEdgeResponse(
    "generate-study-roadmap",
    GenerateStudyRoadmapResponseSchema,
    data ?? {},
  );
}

export async function bookLanguageSession(
  req: BookLanguageSessionRequest,
): Promise<BookLanguageSessionResponse> {
  const { data, error } = await supabase.functions.invoke(
    "book-language-session",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("book-language-session", error);
  return parseEdgeResponse(
    "book-language-session",
    BookLanguageSessionResponseSchema,
    data ?? {},
  );
}

export async function aiLanguagePartner(
  req: AiLanguagePartnerRequest,
): Promise<AiLanguagePartnerResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-language-partner",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-language-partner", error);
  return parseEdgeResponse(
    "ai-language-partner",
    AiLanguagePartnerResponseSchema,
    data ?? {},
  );
}

export async function aiIeltsEvaluate(
  req: AiIeltsEvaluateRequest,
): Promise<AiIeltsEvaluateResponse> {
  const { data, error } = await supabase.functions.invoke(
    "ai-ielts-evaluate",
    { body: req },
  );
  if (error) throw new EdgeFunctionError("ai-ielts-evaluate", error);
  return parseEdgeResponse(
    "ai-ielts-evaluate",
    AiIeltsEvaluateResponseSchema,
    data ?? {},
  );
}
