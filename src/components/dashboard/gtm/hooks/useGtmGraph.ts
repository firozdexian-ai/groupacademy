import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GtmCountry { id: string; iso2: string; name: string; tier: string; is_active: boolean; }
export interface GtmRegion { id: string; country_id: string; name: string; code: string | null; }
export interface GtmCity { id: string; region_id: string; name: string; is_active: boolean; }
export interface GtmCluster { id: string; name: string; description: string | null; countries: string[]; cities: string[]; }
export interface KnowledgePack { id: string; country_code: string; title: string; kind: string; is_published: boolean; }

export function useGtmGraph() {
  const queryClient = useQueryClient();
  const client = supabase as any;

  // 1. The Master Geographical Query
  const gtmGraphQuery = useQuery({
    queryKey: ["gtm_graph_master"],
    queryFn: async () => {
      const [countriesRes, regionsRes, citiesRes, clustersRes, knowledgeRes, talentsRes] = await Promise.all([
        client.from("gtm_countries").select("*").order("name"),
        client.from("gtm_regions").select("*").order("name"),
        client.from("gtm_cities").select("*").order("name"),
        client.from("gtm_clusters").select("*").order("name"),
        client.from("country_knowledge_packs").select("*").order("display_order"),
        client.from("talents").select("country"),
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (regionsRes.error) throw regionsRes.error;
      if (citiesRes.error) throw citiesRes.error;
      if (clustersRes.error) throw clustersRes.error;
      if (knowledgeRes.error) throw knowledgeRes.error;

      // Calculate Talent Density by Country Name (string-bridge from legacy denormalized data)
      const talentDensity: Record<string, number> = {};
      talentsRes.data?.forEach((t: any) => {
        if (t.country) {
          const normalized = t.country.trim();
          talentDensity[normalized] = (talentDensity[normalized] || 0) + 1;
        }
      });

      return {
        countries: countriesRes.data as GtmCountry[],
        regions: regionsRes.data as GtmRegion[],
        cities: citiesRes.data as GtmCity[],
        clusters: clustersRes.data as GtmCluster[],
        knowledgePacks: knowledgeRes.data as KnowledgePack[],
        talentDensity,
      };
    },
  });

  // 2. Generic Mutation Generator
  const createUpsertMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (payload: any) => {
        if (payload.id) {
          const { error } = await client.from(table).update(payload).eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await client.from(table).insert(payload);
          if (error) throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["gtm_graph_master"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });
  };

  const createDeleteMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await client.from(table).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["gtm_graph_master"] });
        toast.success(`${entityName} purged from graph.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });
  };

  return {
    gtmGraphQuery,
    mutations: {
      upsertCountry: createUpsertMutation("gtm_countries", "Country Node"),
      deleteCountry: createDeleteMutation("gtm_countries", "Country Node"),
      upsertRegion: createUpsertMutation("gtm_regions", "Region/State Node"),
      deleteRegion: createDeleteMutation("gtm_regions", "Region/State Node"),
      upsertCity: createUpsertMutation("gtm_cities", "City Node"),
      deleteCity: createDeleteMutation("gtm_cities", "City Node"),
      upsertCluster: createUpsertMutation("gtm_clusters", "GTM Cluster"),
      deleteCluster: createDeleteMutation("gtm_clusters", "GTM Cluster"),
      upsertKnowledgePack: createUpsertMutation("country_knowledge_packs", "Knowledge Pack"),
      deleteKnowledgePack: createDeleteMutation("country_knowledge_packs", "Knowledge Pack"),
    },
  };
}
