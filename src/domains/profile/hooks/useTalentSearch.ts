import { useQuery } from "@tanstack/react-query";
import { searchPublicTalents } from "@/domains/profile/repo/profileRepo";

/**
 * GroUp Academy: Enterprise Directory Discovery Engine (V5.6.0)
 * CTO Reference: High-performance search observer mapping structured candidate parameters.
 * Architecture: Reference-isolated queries preventing accidental background refetch waterfalls.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export interface TalentSearchFilters {
  keyword?: string;
  country?: string;
  skills?: string[];
}

export interface TalentSearchRow {
  id: string;
  public_handle: string | null;
  full_name: string;
  profile_photo_url: string | null;
  custom_profession: string | null;
  country: string | null;
  public_bio: string | null;
  skills: string[];
  avg_mastery: number;
  verified_skills: number;
  updated_at: string;
}

export interface TalentSearchResponse {
  total: number;
  rows: TalentSearchRow[];
}

/**
 * Executes a reference-stable paginated lookup query against our public talent directory.
 * RPC: search_public_talents
 */
export function useTalentSearch(filters: TalentSearchFilters, page = 0, pageSize = 24) {
  // Isolate object parameters down to stable primitives to decouple the hook from reference changes
  const keywordParam = filters.keyword?.trim() || null;
  const countryParam = filters.country || null;

  // Serialize skills array to a safe string to preserve stable reference matching windows
  const skillsSerialized = useMemo(() => {
    if (!filters.skills || filters.skills.length === 0) return "";
    return [...filters.skills].sort().join(",");
  }, [filters.skills]);

  // HUD: SECURE_REFERENCE_ISOLATED_QUERY_KEY
  const queryKey = ["talent-search", keywordParam, countryParam, skillsSerialized, page, pageSize];

  return useQuery<TalentSearchResponse, Error>({
    queryKey,
    // Performance Baseline: 15-second stability window protecting PostgreSQL computing parameters
    staleTime: 15 * 1000,
    queryFn: async (): Promise<TalentSearchResponse> => {
      const payloadFilters = {
        keyword: keywordParam,
        country: countryParam,
        skills: filters.skills && filters.skills.length > 0 ? filters.skills : null,
      };

      // HUD: EXECUTING_DIRECTORY_RPC_QUERY_INGRESS
      let data: any;
      try {
        data = await searchPublicTalents<any>({
          filters: payloadFilters,
          limit: pageSize,
          offset: page * pageSize,
        });
      } catch (error: any) {
        console.error("[Digital Workforce] ANOMALY: search_public_talents RPC pipeline dropped.", {
          payloadFilters,
          page,
          message: error?.message,
        });
        throw error;
      }

      const obj = (data as any) || {};
      const rawRows = Array.isArray(obj.rows) ? obj.rows : [];

      // Hardened Data Normalization Layer: Sanitizes directory item variables against schema drifts
      const normalizedRows: TalentSearchRow[] = rawRows.map((row: any) => ({
        id: String(row.id),
        public_handle: row.public_handle ? String(row.public_handle) : null,
        full_name: String(row.full_name ?? "Candidate Node"),
        profile_photo_url: row.profile_photo_url ? String(row.profile_photo_url) : null,
        custom_profession: row.custom_profession ? String(row.custom_profession) : null,
        country: row.country ? String(row.country) : null,
        public_bio: row.public_bio ? String(row.public_bio) : null,
        skills: Array.isArray(row.skills) ? row.skills.map(String) : [],
        avg_mastery: Number(row.avg_mastery ?? 0),
        verified_skills: Number(row.verified_skills ?? 0),
        updated_at: String(row.updated_at ?? new Date().toISOString()),
      }));

      return {
        total: Number(obj.total ?? 0),
        rows: normalizedRows,
      };
    },
  });
}

// React import helper mapping for native useMemo parsing dependencies
import { useMemo } from "react";
