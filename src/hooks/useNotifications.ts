import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as repoDeleteNotification,
} from "@/domains/talent/repo/talentRepo";
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
      try {
        const data = await listNotifications(talentId!, 50);
        return (data || []).map(mapNotificationRow);
      } catch (error) {
        console.error("[Digital Workforce] ANOMALY: notifications fetch rejected.", error);
        throw error;
      }
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
      await markNotificationRead(id, timestamp);
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
      await markAllNotificationsRead(talentId, timestamp);
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
      await repoDeleteNotification(id);
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
