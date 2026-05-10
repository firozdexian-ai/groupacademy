import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface MktChannel { id: string; name: string; type: string; notes?: string; created_at: string; }
export interface CommunityGroup { id: string; name: string; platform: string; member_count: number; link?: string; created_at: string; }
export interface TalentOutreach { id: string; talent_id: string; channel: string; campaign_name?: string; sent_at: string; }
export interface CompanyOutreach { id: string; company_id: string; contact_id?: string; channel: string; sent_at: string; }
export interface Banner { id: string; placement: string; media_url: string; link_url?: string; is_active: boolean; created_at: string; }
export interface ProfileTheme { id: string; name: string; priority: number; media_type: string; gradient_css: string; media_url?: string; poster_url?: string; overlay_opacity: number; text_color: string; start_at?: string; end_at?: string; is_active: boolean; created_at: string; }
export interface AccessCode { id: string; code: string; content_id?: string; max_uses: number; current_uses: number; expires_at?: string; }

export function useMarketingGraph() {
  const queryClient = useQueryClient();

  // 1. The Master Marketing Graph Query
  const marketingGraphQuery = useQuery({
    queryKey: ["marketing_graph_master"],
    queryFn: async () => {
      const [
        channelsRes, 
        groupsRes, 
        talentOutreachRes, 
        companyOutreachRes, 
        bannersRes, 
        themesRes, 
        codesRes
      ] = await Promise.all([
        supabase.from("mkt_channels").select("id, name, type, notes, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("mkt_community_groups").select("id, name, platform, member_count, link, created_at").order("created_at", { ascending: false }).limit(200),
        supabase.from("talent_outreach_log").select("id, talent_id, channel, sent_at").order("sent_at", { ascending: false }).limit(500),
        supabase.from("company_outreach_log").select("id, company_id, contact_id, channel, sent_at").order("sent_at", { ascending: false }).limit(500),
        supabase.from("banners").select("id, placement, image_url, link_url, is_active, created_at").order("created_at", { ascending: false }).limit(100),
        supabase.from("profile_card_themes").select("id, name, priority, media_type, gradient_css, media_url, poster_url, overlay_opacity, text_color, start_at, end_at, is_active, created_at").order("priority", { ascending: false }).limit(50),
        supabase.from("access_codes").select("id, code, content_id, max_uses, current_uses, expires_at").order("created_at", { ascending: false }).limit(200),
      ]);

      if (channelsRes.error) throw channelsRes.error;
      if (groupsRes.error) throw groupsRes.error;
      if (talentOutreachRes.error) throw talentOutreachRes.error;
      if (companyOutreachRes.error) throw companyOutreachRes.error;
      if (bannersRes.error) throw bannersRes.error;
      if (themesRes.error) throw themesRes.error;
      if (codesRes.error) throw codesRes.error;

      // Map schema differences to standard UI interfaces
      const banners: Banner[] = (bannersRes.data ?? []).map((b: any) => ({
        id: b.id, placement: b.placement, media_url: b.image_url, link_url: b.link_url, 
        is_active: !!b.is_active, created_at: b.created_at
      }));

      return {
        channels: channelsRes.data as MktChannel[],
        communityGroups: groupsRes.data as CommunityGroup[],
        talentOutreach: talentOutreachRes.data as TalentOutreach[],
        companyOutreach: companyOutreachRes.data as CompanyOutreach[],
        banners,
        themes: themesRes.data as ProfileTheme[],
        accessCodes: codesRes.data as AccessCode[],
      };
    },
  });

  // 2. Generic Mutation Generator
  const createUpsertMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (payload: any) => {
        if (payload.id) {
          const { error } = await supabase.from(table as any).update(payload).eq("id", payload.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from(table as any).insert(payload);
          if (error) throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["marketing_graph_master"] });
        toast.success(`${entityName} synchronized successfully.`);
      },
      onError: (e: Error) => toast.error(`Sync Failed: ${e.message}`),
    });
  };

  const createDeleteMutation = (table: string, entityName: string) => {
    return useMutation({
      mutationFn: async (id: string) => {
        const { error } = await supabase.from(table as any).delete().eq("id", id);
        if (error) throw error;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["marketing_graph_master"] });
        toast.success(`${entityName} purged from the network.`);
      },
      onError: (e: Error) => toast.error(`Purge Failed: ${e.message}`),
    });
  };

  return {
    marketingGraphQuery,
    mutations: {
      upsertChannel: createUpsertMutation("mkt_channels", "Marketing Channel"),
      deleteChannel: createDeleteMutation("mkt_channels", "Marketing Channel"),
      upsertGroup: createUpsertMutation("mkt_community_groups", "Community Group"),
      deleteGroup: createDeleteMutation("mkt_community_groups", "Community Group"),
      upsertBanner: createUpsertMutation("banners", "Display Banner"),
      deleteBanner: createDeleteMutation("banners", "Display Banner"),
      upsertTheme: createUpsertMutation("profile_card_themes", "Profile Theme"),
      deleteTheme: createDeleteMutation("profile_card_themes", "Profile Theme"),
      upsertAccessCode: createUpsertMutation("access_codes", "Access Code"),
      deleteAccessCode: createDeleteMutation("access_codes", "Access Code"),
    }
  };
}
