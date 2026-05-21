import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { listSavedItemsByTalent, deleteSavedItemRow, insertSavedItemRow } from "@/domains/talent/repo/talentRepo";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";

/**
 * GroUp Academy: Polymorphic Institutional Content Repository (V5.6.0)
 * CTO Reference: Authoritative bookmarked resource layer managing cross-module bookmarks.
 * Architecture: Optimized via TanStack Mutation Hooks with secure rollback buffers.
 * Phase: Z0 Code Freeze Hardened (May 2026 Launch Edition).
 */

export type SavedItemType = "job" | "course" | "blog" | "video" | "event";

export interface SavedItem {
  id: string;
  item_id: string;
  item_type: SavedItemType;
  saved_at: string;
}

/**
 * Orchestrates global user bookmark registries with atomic optimistic execution patterns.
 */
export function useSavedItems() {
  const { talent } = useTalent();
  const qc = useQueryClient();
  const talentId = talent?.id;
  const queryKey = ["saved-items", talentId];

  // --- SENSOR: BOOKMARK_REGISTRY_QUERY ---
  const {
    data: savedItems = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!talentId,
    staleTime: 30 * 1000, // 30-second cache consistency boundary for user assets
    queryFn: async (): Promise<SavedItem[]> => {
      // HUD: EXECUTING_BOOKMARK_REGISTRY_INGRESS
      let data: Array<{ id: string; item_id: string; item_type: string; saved_at: string }> = [];
      try {
        data = await listSavedItemsByTalent(talentId!);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: saved_items collection channel dropped.", error);
        throw error;
      }

      return data.map((item) => ({
        id: item.id,
        item_id: item.item_id,
        item_type: item.item_type as SavedItemType,
        saved_at: item.saved_at,
      }));
    },
  });

  // --- HUD: CORE_SELECTOR_METHODS ---
  const isSaved = useCallback(
    (itemId: string, itemType: SavedItemType) => {
      return savedItems.some((item) => item.item_id === itemId && item.item_type === itemType);
    },
    [savedItems],
  );

  const getSavedCount = useCallback(
    (itemType?: SavedItemType) => {
      return itemType ? savedItems.filter((item) => item.item_type === itemType).length : savedItems.length;
    },
    [savedItems],
  );

  // --- ACTION: ATOMIC_OPTIMISTIC_TOGGLE_MUTATION ---
  const toggleMutation = useMutation({
    mutationFn: async ({
      itemId,
      itemType,
      alreadySaved,
    }: {
      itemId: string;
      itemType: SavedItemType;
      alreadySaved: boolean;
    }) => {
      if (!talentId) throw new Error("AUTH_REQUIRED");

      if (alreadySaved) {
        // HUD: COMMITTING_BOOKMARK_PURGE_TRANSACTION
        await deleteSavedItemRow(talentId, itemId, itemType);
        return { itemId, itemType, action: "purged" as const };
      } else {
        // HUD: COMMITTING_BOOKMARK_INSERTION_TRANSACTION
        const data = await insertSavedItemRow(talentId, itemId, itemType);
        return {
          item: {
            id: data.id,
            item_id: data.item_id,
            item_type: data.item_type as SavedItemType,
            saved_at: data.saved_at,
          },
          action: "synchronized" as const,
        };
      }
    },
    onMutate: async ({ itemId, itemType, alreadySaved }) => {
      // Cancel outbound queries to avoid intercepting background refreshes
      await qc.cancelQueries({ queryKey });
      const previousItems = qc.getQueryData<SavedItem[]>(queryKey) || [];

      // HUD: APPLYING_OPTIMISTIC_REGISTRY_SNAPSHOT
      qc.setQueryData<SavedItem[]>(queryKey, (old = []) => {
        if (alreadySaved) {
          return old.filter((item) => !(item.item_id === itemId && item.item_type === itemType));
        } else {
          const proxyItem: SavedItem = {
            id: `proxy_${Date.now()}`,
            item_id: itemId,
            item_type: itemType,
            saved_at: new Date().toISOString(),
          };
          return [proxyItem, ...old];
        }
      });

      return { previousItems };
    },
    onError: (err: any, { itemId, itemType }, context) => {
      // Restore past data state if transactional error occurs
      if (context?.previousItems) {
        qc.setQueryData(queryKey, context.previousItems);
      }

      // Digital Workforce Anomaly Trigger: Dispatches trace logs straight to monitoring dashboards
      console.error("[Digital Workforce] ANOMALY: toggleSave persistence pipeline failed.", {
        talentId,
        itemId,
        itemType,
        message: err.message,
      });

      toast.error("REGISTRY_FAULT: Bookmark sync failed. Please try again.");
    },
    onSuccess: (data) => {
      if (data?.action === "purged") {
        toast.success("ARTIFACT_PURGED: Removed from saved items.");
      } else {
        toast.success("ARTIFACT_SYNCHRONIZED: Saved successfully!");
      }
    },
    onSettled: () => {
      // Force database revalidation to lock down structural changes completely
      void qc.invalidateQueries({ queryKey });
    },
  });

  const toggleSave = useCallback(
    async (itemId: string, itemType: SavedItemType) => {
      if (!talentId) {
        toast.error("AUTH_REQUIRED: Please sign in to authorize saves.");
        return false;
      }

      const alreadySaved = isSaved(itemId, itemType);

      // Force mutation pipeline to execute with context-safe indicators
      await toggleMutation.mutateAsync({ itemId, itemType, alreadySaved });
      return !alreadySaved;
    },
    [talentId, isSaved, toggleMutation],
  );

  return {
    savedItems,
    isLoading,
    isSaved,
    toggleSave,
    getSavedCount,
    refresh: refetch,
  };
}
