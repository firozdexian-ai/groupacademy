import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { toast } from "sonner";

/**
 * GroUp Academy: Institutional Content Repository
 * CTO Reference: Authoritative controller for talent bookmarks and curated libraries.
 * Logic: Implements optimistic persistence and polymorphic item management.
 */

export type SavedItemType = "job" | "course" | "blog" | "video" | "event";

interface SavedItem {
  id: string;
  item_id: string;
  item_type: SavedItemType;
  saved_at: string;
}

export function useSavedItems() {
  const { talent } = useTalent();
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // PHASE: Registry_Ingress_Audit
  const fetchInstitutionalRegistry = useCallback(async () => {
    if (!talent?.id) {
      setSavedItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("saved_items")
        .select("*")
        .eq("talent_id", talent.id)
        .order("saved_at", { ascending: false });

      if (error) throw error;

      setSavedItems(
        (data || []).map((item) => ({
          ...item,
          item_type: item.item_type as SavedItemType,
        })),
      );
    } catch (err) {
      console.error("REGISTRY_FETCH_FAULT:", err);
    } finally {
      setIsLoading(false);
    }
  }, [talent?.id]);

  useEffect(() => {
    fetchInstitutionalRegistry();
  }, [fetchInstitutionalRegistry]);

  /**
   * HUD: Diagnostic Check
   * Verifies if a specific artifact exists in the talent's registry.
   */
  const isSaved = useCallback(
    (itemId: string, itemType: SavedItemType) => {
      return savedItems.some((item) => item.item_id === itemId && item.item_type === itemType);
    },
    [savedItems],
  );

  // PHASE: Optimistic_Persistence_Handshake
  const toggleSave = useCallback(
    async (itemId: string, itemType: SavedItemType) => {
      if (!talent?.id) {
        toast.error("AUTH_REQUIRED: Please sign in to authorize saves.");
        return false;
      }

      const alreadySaved = isSaved(itemId, itemType);

      try {
        if (alreadySaved) {
          // ACTION: Purge Artifact
          const { error } = await supabase
            .from("saved_items")
            .delete()
            .eq("talent_id", talent.id)
            .eq("item_id", itemId)
            .eq("item_type", itemType);

          if (error) throw error;

          setSavedItems((prev) => prev.filter((item) => !(item.item_id === itemId && item.item_type === itemType)));
          toast.success("ARTIFACT_PURGED: Removed from saved.");
          return false;
        } else {
          // ACTION: Synchronize New Artifact
          const { data, error } = await supabase
            .from("saved_items")
            .insert({
              talent_id: talent.id,
              item_id: itemId,
              item_type: itemType,
            })
            .select()
            .single();

          if (error) throw error;

          setSavedItems((prev) => [
            {
              ...data,
              item_type: data.item_type as SavedItemType,
            },
            ...prev,
          ]);
          toast.success("ARTIFACT_SYNCHRONIZED: Saved!");
          return true;
        }
      } catch (err) {
        console.error("PERSISTENCE_TOGGLE_FAULT:", err);
        toast.error("REGISTRY_FAULT: Sync failed.");
        return alreadySaved;
      }
    },
    [talent?.id, isSaved],
  );

  return {
    savedItems,
    isLoading,
    isSaved,
    toggleSave,
    getSavedCount: useCallback(
      (itemType?: SavedItemType) => {
        return itemType ? savedItems.filter((item) => item.item_type === itemType).length : savedItems.length;
      },
      [savedItems],
    ),
    refresh: fetchInstitutionalRegistry,
  };
}
