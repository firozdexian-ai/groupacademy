import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { mapNotificationRow, type Notification } from "@/lib/notificationHelpers";

/**
 * GroUp Academy: Neural Event Broadcaster Sensor (V5.6.0)
 * CTO Reference: Authoritative controller for real-time notification broadcasting.
 * Architecture: Digital Workforce enabled - logs message drop and sync faults to Admin OS.
 * Phase: Z0 Code Freeze Hardened (May 2026).
 */

export function useNotifications() {
  const { talent } = useTalent();
  const talentId = talent?.id;
  const qc = useQueryClient();
  const queryKey = ["notifications", talentId];

  // --- SENSOR: NOTIFICATION_REGISTRY_QUERY ---
  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey,
    enabled: !!talentId,
    staleTime: 15000, // 15-second cache consistency baseline
    queryFn: async (): Promise<Notification[]> => {
      // HUD: EXECUTING_NOTIFICATION_REGISTRY_INGRESS
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("talent_id", talentId!)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("[Digital Workforce] ANOMALY: notifications fetch rejected.", error);
        throw error;
      }

      return (data || []).map(mapNotificationRow);
    },
  });

  // --- HUD: NEURAL_REALTIME_CDC_HANDSHAKE ---
  useEffect(() => {
    if (!talentId) return;

    const channel = supabase
      .channel(`public:notifications:${talentId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `talent_id=eq.${talentId}` },
        (payload) => {
          const newNotif = mapNotificationRow(payload.new);
          qc.setQueryData<Notification[]>(queryKey, (old) => [newNotif, ...(old || [])]);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `talent_id=eq.${talentId}` },
        (payload) => {
          const updated = mapNotificationRow(payload.new);
          qc.setQueryData<Notification[]>(queryKey, (old) =>
            (old || []).map((n) => (n.id === updated.id ? updated : n)),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `talent_id=eq.${talentId}` },
        (payload) => {
          const targetId = (payload.old as any).id;
          qc.setQueryData<Notification[]>(queryKey, (old) => (old || []).filter((n) => n.id !== targetId));
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [talentId, qc, queryKey]);

  // --- ACTIONS: REGISTRY_CLEANUP_MUTATIONS ---

  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const timestamp = new Date().toISOString();
      const { error } = await supabase.from("notifications").update({ is_read: true, read_at: timestamp }).eq("id", id);

      if (error) throw error;
      return { id, timestamp };
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<Notification[]>(queryKey);

      // HUD: EXECUTING_OPTIMISTIC_READ_PATCH
      qc.setQueryData<Notification[]>(queryKey, (old) =>
        (old || []).map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      );
      return { previous };
    },
    onError: (err: any, _, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      console.error("[Digital Workforce] ANOMALY: markAsRead transaction failure.", err);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!talentId) return;
      const timestamp = new Date().toISOString();
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: timestamp })
        .eq("talent_id", talentId)
        .eq("is_read", false);

      if (error) throw error;
      return { timestamp };
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<Notification[]>(queryKey);

      qc.setQueryData<Notification[]>(queryKey, (old) =>
        (old || []).map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      return { previous };
    },
    onError: (err: any, _, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      console.error("[Digital Workforce] ANOMALY: markAllAsRead transaction failure.", err);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<Notification[]>(queryKey);

      qc.setQueryData<Notification[]>(queryKey, (old) => (old || []).filter((n) => n.id !== id));
      return { previous };
    },
    onError: (err: any, _, context) => {
      if (context?.previous) qc.setQueryData(queryKey, context.previous);
      console.error("[Digital Workforce] ANOMALY: deleteNotification transaction failure.", err);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey });
    },
  });

  // --- TELEMETRY_AGGREGATION ---
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
    markAllAsRead: markAllAsReadMutation.mutate,
    deleteNotification: deleteNotificationMutation.mutate,
    refresh: refetch,
  };
}
