import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { mapNotificationRow, type Notification } from "@/lib/notificationHelpers";

/**
 * GroUp Academy: Neural Event Broadcaster
 * CTO Reference: Authoritative engine for real-time engagement and notification sync.
 * Performance: Implements full-lifecycle Postgres change listeners.
 */

export function useNotifications() {
  const { talent } = useTalent();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const talentId = talent?.id;

  // PHASE: Registry_Ingress
  const fetchNotifications = useCallback(async () => {
    if (!talentId) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("talent_id", talentId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications((data || []).map(mapNotificationRow));
    } catch (err) {
      console.error("NOTIF_SYNC_FAULT:", err);
    } finally {
      setIsLoading(false);
    }
  }, [talentId]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // PHASE: Neural_Realtime_Handshake
  useEffect(() => {
    if (!talentId) return;

    const channel = supabase
      .channel(`notif_sync_${talentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `talent_id=eq.${talentId}` },
        (payload) => {
          const newNotif = mapNotificationRow(payload.new);
          setNotifications((prev) => [newNotif, ...prev]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `talent_id=eq.${talentId}` },
        (payload) => {
          const updated = mapNotificationRow(payload.new);
          setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `talent_id=eq.${talentId}` },
        (payload) => {
          setNotifications((prev) => prev.filter((n) => n.id !== (payload.old as any).id));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [talentId]);

  // PHASE: Telemetry_Calculation
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // PHASE: Registry_Cleanup_Actions
  const markAsRead = useCallback(async (id: string) => {
    const timestamp = new Date().toISOString();
    const { error } = await supabase.from("notifications").update({ is_read: true, read_at: timestamp }).eq("id", id);

    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: timestamp } : n)));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!talentId) return;
    const timestamp = new Date().toISOString();
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true, read_at: timestamp })
      .eq("talent_id", talentId)
      .eq("is_read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true, readAt: timestamp })));
    }
  }, [talentId]);

  const deleteNotification = useCallback(async (id: string) => {
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (!error) setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
