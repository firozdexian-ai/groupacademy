/**
 * Group Academy — Abroad Domain API Layer
 * Version: Phase 10i.2 Hardened (Production Candidate)
 * Security Profile: Strictly typed edge wrappers utilizing runtime response mapping.
 * Convention (Locked in Phase 9b):
 *    - One async function per edge function — import by name[cite: 10].
 *    - No `*Api` const, no `<DOMAIN>_EDGE_FUNCTIONS` array[cite: 10].
 *    - Responses validated at runtime via `parseEdgeResponse`[cite: 10].
 *    - Failures throw `EdgeFunctionError`[cite: 10].
 */
import { supabase } from "@/integrations/supabase/client";
import { EdgeFunctionError } from "@/edge/EdgeFunctionError";
import { parseEdgeResponse } from "@/edge/parseEdgeResponse";
import { trackError } from "@/lib/errorTracking";
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

/**
 * Invokes the destination agent orchestrator to handle regional study plans.
 */
export async function aiDestinationAgent(req: AiDestinationAgentRequest): Promise<AiDestinationAgentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-destination-agent", { body: req });

    if (error) {
      throw new EdgeFunctionError("ai-destination-agent", error);
    }

    return parseEdgeResponse("ai-destination-agent", AiDestinationAgentResponseSchema, data ?? {});
  } catch (err: any) {
    trackError("ai-destination-agent-failure", { error: err.message, payload: req });
    throw err;
  }
}

/**
 * Communicates with the 'admin-abroad-counselor' proxy to generate dynamic roadmaps[cite: 1].
 */
export async function generateStudyRoadmap(req: GenerateStudyRoadmapRequest): Promise<GenerateStudyRoadmapResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("generate-study-roadmap", { body: req });

    if (error) {
      throw new EdgeFunctionError("generate-study-roadmap", error);
    }

    return parseEdgeResponse("generate-study-roadmap", GenerateStudyRoadmapResponseSchema, data ?? {});
  } catch (err: any) {
    trackError("generate-study-roadmap-failure", { error: err.message, payload: req });
    throw err;
  }
}

/**
 * Enforces transaction structures for booking live language learning practice channels.
 */
export async function bookLanguageSession(req: BookLanguageSessionRequest): Promise<BookLanguageSessionResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("book-language-session", { body: req });

    if (error) {
      throw new EdgeFunctionError("book-language-session", error);
    }

    return parseEdgeResponse("book-language-session", BookLanguageSessionResponseSchema, data ?? {});
  } catch (err: any) {
    trackError("book-language-session-failure", { error: err.message, payload: req });
    throw err;
  }
}

/**
 * Links user interactions to the automated interactive language tutor engines.
 */
export async function aiLanguagePartner(req: AiLanguagePartnerRequest): Promise<AiLanguagePartnerResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-language-partner", { body: req });

    if (error) {
      throw new EdgeFunctionError("ai-language-partner", error);
    }

    return parseEdgeResponse("ai-language-partner", AiLanguagePartnerResponseSchema, data ?? {});
  } catch (err: any) {
    trackError("ai-language-partner-failure", { error: err.message, payload: req });
    throw err;
  }
}

/**
 * Accesses the IELTS grading agent to process voice recording fragments or essay texts[cite: 1].
 */
export async function aiIeltsEvaluate(req: AiIeltsEvaluateRequest): Promise<AiIeltsEvaluateResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("ai-ielts-evaluate", { body: req });

    if (error) {
      throw new EdgeFunctionError("ai-ielts-evaluate", error);
    }

    return parseEdgeResponse("ai-ielts-evaluate", AiIeltsEvaluateResponseSchema, data ?? {});
  } catch (err: any) {
    trackError("ai-ielts-evaluate-failure", { error: err.message, payload: req });
    throw err;
  }
}
