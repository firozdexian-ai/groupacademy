import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GtmCountry { id: string; iso2: string; name: string; tier: string; is_active: boolean; }
export interface GtmRegion { id: string; country_id: string; name: string; code: string | null; }
export interface GtmCity { id: string; region_id: string; name: string; is_active: boolean; }
export interface GtmCluster { id: string; name: string; description: string | null; countries: string[]; cities: string[]; }
export interface KnowledgePack { id: string; country_code: string; title: string; kind: string; is_published: boolean; }

const client = supabase as any;

function useUpsert(table: string, entityName: string) {
  const qc = useQueryClient();
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
      qc.invalidateQueries({ queryKey: ["gtm_graph_master"] });
      qc.invalidateQueries({ queryKey: ["gtm_dashboard"] });
      toast.success(`${entityName} synchronized.`);
    },
    onError: (e: Error) => toast.error(`Sync failed: ${e.message}`),
  });
}

function useDelete(table: string, entityName: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await client.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gtm_graph_master"] });
      qc.invalidateQueries({ queryKey: ["gtm_dashboard"] });
      toast.success(`${entityName} purged.`);
    },
    onError: (e: Error) => toast.error(`Purge failed: ${e.message}`),
  });
}

export function useGtmGraph() {
  const gtmGraphQuery = useQuery({
    queryKey: ["gtm_graph_master"],
    queryFn: async () => {
      const [countriesRes, regionsRes, citiesRes, clustersRes, knowledgeRes] = await Promise.all([
        client.from("gtm_countries").select("*").order("name"),
        client.from("gtm_regions").select("*").order("name"),
        client.from("gtm_cities").select("*").order("name"),
        client.from("gtm_clusters").select("*").order("name"),
        client.from("country_knowledge_packs").select("*").order("display_order"),
      ]);

      if (countriesRes.error) throw countriesRes.error;
      if (regionsRes.error) throw regionsRes.error;
      if (citiesRes.error) throw citiesRes.error;
      if (clustersRes.error) throw clustersRes.error;
      if (knowledgeRes.error) throw knowledgeRes.error;

      return {
        countries: countriesRes.data as GtmCountry[],
        regions: regionsRes.data as GtmRegion[],
        cities: citiesRes.data as GtmCity[],
        clusters: clustersRes.data as GtmCluster[],
        knowledgePacks: knowledgeRes.data as KnowledgePack[],
      };
    },
  });

  const upsertCountry = useUpsert("gtm_countries", "Country");
  const deleteCountry = useDelete("gtm_countries", "Country");
  const upsertRegion = useUpsert("gtm_regions", "Region");
  const deleteRegion = useDelete("gtm_regions", "Region");
  const upsertCity = useUpsert("gtm_cities", "City");
  const deleteCity = useDelete("gtm_cities", "City");
  const upsertCluster = useUpsert("gtm_clusters", "Cluster");
  const deleteCluster = useDelete("gtm_clusters", "Cluster");
  const upsertKnowledgePack = useUpsert("country_knowledge_packs", "Knowledge Pack");
  const deleteKnowledgePack = useDelete("country_knowledge_packs", "Knowledge Pack");

  return {
    gtmGraphQuery,
    mutations: {
      upsertCountry, deleteCountry,
      upsertRegion, deleteRegion,
      upsertCity, deleteCity,
      upsertCluster, deleteCluster,
      upsertKnowledgePack, deleteKnowledgePack,
    },
  };
}

export function useGtmDashboard() {
  return useQuery({
    queryKey: ["gtm_dashboard"],
    queryFn: async () => {
      const { data, error } = await client.rpc("get_gtm_dashboard");
      if (error) throw error;
      return data as {
        countries: Array<{
          id: string; iso2: string; name: string; tier: string; is_active: boolean;
          region_count: number; city_count: number; talent_count: number;
        }>;
        unmapped_talent_count: number;
        totals: { countries: number; regions: number; cities: number; clusters: number; knowledge_packs: number };
      };
    },
  });
}
