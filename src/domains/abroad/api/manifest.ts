import { supabase } from "@/integrations/supabase/client";
import type {
  AiDestinationAgentRequest,
  AiDestinationAgentResponse,
  GenerateStudyRoadmapRequest,
  GenerateStudyRoadmapResponse,
} from "@/edge/contracts/abroad";

export const abroadApi = {
  async aiDestinationAgent(body: AiDestinationAgentRequest) {
    return supabase.functions.invoke<AiDestinationAgentResponse>(
      "ai-destination-agent",
      { body }
    );
  },
  async generateStudyRoadmap(body: GenerateStudyRoadmapRequest) {
    return supabase.functions.invoke<GenerateStudyRoadmapResponse>(
      "generate-study-roadmap",
      { body }
    );
  },
};
