import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { GOAL_TO_AGENTS, DEFAULT_PINNED_AGENTS, type ProGoalKey } from "../lib/tokens";
import {
  getActiveCompanyMembership,
  getCompanyGoals,
} from "@/domains/companies/repo/companiesRepo";
import {
  listGro10xThreads,
  insertGro10xThreads,
  upsertGro10xThread,
  bumpGro10xThread,
  markGro10xThreadRead,
} from "@/domains/messaging/repo/messagingRepo";

export interface Gro10xThread {
  id: string;
  user_id: string;
  company_id: string;
  agent_key: string;
  agent_thread_id: string | null;
  last_message: string | null;
  last_message_at: string | null;
  unread_count: number;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface State {
  threads: Gro10xThread[];
  companyId: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Returns the user's Gro10x inbox rows (one per agent) for their active
 * company workspace. Auto-seeds pinned threads on first load based on the
 * goals collected by Riya during signup.
 */
export function useGro10xThreads() {
  const { user } = useAuth();
  const [state, setState] = useState<State>({ threads: [], companyId: null, loading: true, error: null });

  const refresh = useCallback(async () => {
    if (!user?.id) {
      setState({ threads: [], companyId: null, loading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const membership = await getActiveCompanyMembership(user.id);
      const companyId = membership?.company_id ?? null;

      if (!companyId) {
        setState({ threads: [], companyId: null, loading: false, error: null });
        return;
      }

      let threads = (await listGro10xThreads(user.id, companyId)) as Gro10xThread[];

      // Auto-seed if empty
      if (threads.length === 0) {
        const goals = (await getCompanyGoals(companyId)) as ProGoalKey[];
        const seed = new Set<string>(DEFAULT_PINNED_AGENTS);
        for (const g of goals) {
          (GOAL_TO_AGENTS[g] ?? []).forEach((a) => seed.add(a));
        }
        const rows = Array.from(seed).map((agent_key) => ({
          user_id: user.id,
          company_id: companyId,
          agent_key,
          pinned: true,
        }));
        if (rows.length) {
          threads = (await insertGro10xThreads(rows)) as Gro10xThread[];
        }
      }

      setState({ threads, companyId, loading: false, error: null });
    } catch (e: any) {
      setState({ threads: [], companyId: null, loading: false, error: e?.message ?? "Failed to load inbox" });
    }
  }, [user?.id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Pin (and create if missing) a thread for the current company. */
  const pinAgent = useCallback(
    async (agent_key: string) => {
      if (!user?.id || !state.companyId) return null;
      const { data, error } = await upsertGro10xThread({
        user_id: user.id,
        company_id: state.companyId,
        agent_key,
        pinned: true,
      });
      if (error) return null;
      await refresh();
      return data as Gro10xThread;
    },
    [user?.id, state.companyId, refresh],
  );

  /** Mark thread as read (unread_count -> 0). */
  const markRead = useCallback(
    async (agent_key: string) => {
      if (!user?.id || !state.companyId) return;
      await markGro10xThreadRead(user.id, state.companyId, agent_key);
    },
    [user?.id, state.companyId],
  );

  /** Bump last_message after a chat exchange. */
  const bumpThread = useCallback(
    async (agent_key: string, last_message: string, agent_thread_id?: string | null) => {
      if (!user?.id || !state.companyId) return;
      await bumpGro10xThread({
        user_id: user.id,
        company_id: state.companyId,
        agent_key,
        last_message: last_message.slice(0, 200),
        last_message_at: new Date().toISOString(),
        ...(agent_thread_id ? { agent_thread_id } : {}),
      });
    },
    [user?.id, state.companyId],
  );

  return { ...state, refresh, pinAgent, markRead, bumpThread };
}
