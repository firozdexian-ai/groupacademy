import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { toast } from 'sonner';

export type SavedItemType = 'job' | 'course' | 'blog' | 'video' | 'event';

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

  const fetchSavedItems = useCallback(async () => {
    if (!talent?.id) {
      setSavedItems([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_items')
        .select('*')
        .eq('talent_id', talent.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      setSavedItems((data || []).map(item => ({
        ...item,
        item_type: item.item_type as SavedItemType
      })));
    } catch (error) {
      console.error('Error fetching saved items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [talent?.id]);

  useEffect(() => {
    fetchSavedItems();
  }, [fetchSavedItems]);

  const isSaved = useCallback((itemId: string, itemType: SavedItemType) => {
    return savedItems.some(item => item.item_id === itemId && item.item_type === itemType);
  }, [savedItems]);

  const toggleSave = useCallback(async (itemId: string, itemType: SavedItemType) => {
    if (!talent?.id) {
      toast.error('Please sign in to save items');
      return false;
    }

    const alreadySaved = isSaved(itemId, itemType);

    try {
      if (alreadySaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_items')
          .delete()
          .eq('talent_id', talent.id)
          .eq('item_id', itemId)
          .eq('item_type', itemType);

        if (error) throw error;
        
        setSavedItems(prev => prev.filter(
          item => !(item.item_id === itemId && item.item_type === itemType)
        ));
        toast.success('Removed from saved');
        return false;
      } else {
        // Add to saved
        const { data, error } = await supabase
          .from('saved_items')
          .insert({
            talent_id: talent.id,
            item_id: itemId,
            item_type: itemType
          })
          .select()
          .single();

        if (error) throw error;
        
        setSavedItems(prev => [{
          ...data,
          item_type: data.item_type as SavedItemType
        }, ...prev]);
        toast.success('Saved!');
        return true;
      }
    } catch (error) {
      console.error('Error toggling save:', error);
      toast.error('Failed to save. Please try again.');
      return alreadySaved;
    }
  }, [talent?.id, isSaved]);

  const getSavedCount = useCallback((itemType?: SavedItemType) => {
    if (itemType) {
      return savedItems.filter(item => item.item_type === itemType).length;
    }
    return savedItems.length;
  }, [savedItems]);

  return {
    savedItems,
    isLoading,
    isSaved,
    toggleSave,
    getSavedCount,
    refresh: fetchSavedItems
  };
}
