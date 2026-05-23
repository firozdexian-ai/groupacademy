import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deductCreditsRpc,
  addCreditsRpc,
  getTalentCreditBalance,
  listTalentCreditTransactions,
} from "@/domains/finance/repo/financeRepo";
import { useTalent } from "@/hooks/useTalent";
import { ServiceType, getServiceCost } from "@/lib/creditPricing";
import { useToast } from "@/hooks/use-toast";

/**
 * GroUp Academy: Fiscal Ingress & Ledger Node (V4.7.0)
 * CTO Reference: Authoritative transactional store tracking fractional credit models.
 * Architecture: Digital Workforce enabled - logs checkout bottlenecks directly to Admin OS.
 * Phase: Z0 Code Freeze Hardened.
 */

export interface CreditTransaction {
  id: string;
  amount: number;
  balanceAfter: number;
  transactionType: string;
  serviceType: string | null;
  description: string | null;
  createdAt: string;
}

export interface CreditBalanceNode {
  balance: number;
  earned_balance: number;
}

const isValidUUID = (id: any): boolean => {
  if (!id || typeof id !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export function useCredits() {
  const { talent } = useTalent();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // --------------------------------------------------------
  // PHASE: Core Financial Query Sensors
  // --------------------------------------------------------

  // Hydrates wallet balance directly from public database schema nodes
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refreshBalance,
  } = useQuery({
    queryKey: ["talent-credits-balance", talent?.id],
    enabled: !!talent?.id,
    staleTime: 30000, // 30-second ledger consistency window
    queryFn: async (): Promise<CreditBalanceNode> => {
      try {
        return await getTalentCreditBalance(talent!.id);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: talent_credits wallet node read failure.", error);
        throw error;
      }
    },
  });

  // Pulls transactional logs with safety bounds enforced
  const { data: txHistory = [] } = useQuery({
    queryKey: ["talent-credit-transactions", talent?.id],
    enabled: !!talent?.id,
    staleTime: 60000,
    queryFn: async (): Promise<CreditTransaction[]> => {
      let data: any[];
      try {
        data = await listTalentCreditTransactions(talent!.id, 20);
      } catch (error) {
        console.error("[Digital Workforce] FAULT: credit_transactions stream read failure.", error);
        throw error;
      }

      return (data ?? []).map((tx) => ({
        id: tx.id,
        amount: tx.amount,
        balanceAfter: tx.balance_after,
        transactionType: tx.transaction_type,
        serviceType: tx.service_type,
        description: tx.description,
        createdAt: tx.created_at,
      }));
    },
  });

  // --------------------------------------------------------
  // PHASE: Central Fiscal Transaction Mutations
  // --------------------------------------------------------

  /**
   * Safe Atomic Deduction Mutation. Encapsulates business logic splits
   * away from unsafe client calculation routines.
   */
  const deductMutation = useMutation({
    mutationFn: async ({
      amount,
      serviceType,
      referenceId,
      description,
    }: {
      amount: number;
      serviceType: string;
      referenceId?: string | null;
      description?: string;
    }) => {
      if (!talent?.id) throw new Error("AUTH_REQUIRED");

      const currentBalance = balanceData?.balance ?? 0;
      if (currentBalance < amount) {
        throw new Error("INSUFFICIENT_CREDITS");
      }

      const safeRefId = isValidUUID(referenceId) ? referenceId : null;

      // HUD: EXECUTING_RPC_ATOMIC_DEDUCTION
      const data = await deductCreditsRpc({
        amount,
        serviceType,
        referenceId: safeRefId,
        description: description || `Service: ${serviceType}`,
      });
      const result = data as any;
      if (!result?.success) throw new Error(result?.error || "TRANSACTION_DENIED");

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talent-credits-balance", talent?.id] });
      queryClient.invalidateQueries({ queryKey: ["talent-credit-transactions", talent?.id] });
      queryClient.invalidateQueries({ queryKey: ["talent-lifetime-credits", talent?.id] });
    },
    onError: (err: any) => {
      const msg = err.message || "";
      if (msg.includes("INSUFFICIENT_CREDITS") || msg.includes("FISCAL_DEFICIT")) {
        toast({
          title: "Not enough credits",
          description: "Top up your wallet to use this service.",
          variant: "destructive",
        });
      } else {
        console.error("[credits] deduct failed", {
          talentId: talent?.id,
          message: msg,
        });
        toast({
          title: "Couldn't process transaction",
          description: "Please try again in a moment.",
          variant: "destructive",
        });
      }
    },
  });

  /**
   * Safe Credit Ingress Mutation.
   */
  const addMutation = useMutation({
    mutationFn: async ({
      amount,
      type,
      description,
    }: {
      amount: number;
      type: "welcome_bonus" | "purchase" | "refund";
      description?: string;
    }) => {
      if (!talent?.id) throw new Error("AUTH_REQUIRED");

      // HUD: EXECUTING_RPC_ATOMIC_INGRESS
      return await addCreditsRpc({
        amount,
        transactionType: type,
        description: description || `${type} sync`,
      });
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["talent-credits-balance", talent?.id] });
      queryClient.invalidateQueries({ queryKey: ["talent-credit-transactions", talent?.id] });
      if (vars.type === "welcome_bonus") {
        toast({
          title: "Welcome bonus added 🎉",
          description: "250 credits have been added to your wallet.",
        });
      }
    },
    onError: (err: any, vars) => {
      console.error("[Digital Workforce] ANOMALY: add_credits database ingress checkpoint failed.", {
        talentId: talent?.id,
        type: vars.type,
        message: err.message,
      });
    },
  });

  // --------------------------------------------------------
  // PHASE: Viewport Relational Map Mappings (Immutable Return Layer)
  // --------------------------------------------------------
  const currentBalance = balanceData?.balance ?? 0;
  const currentEarned = balanceData?.earned_balance ?? 0;

  const deductCustomAmount = async (
    amount: number,
    serviceType: string,
    referenceId?: string,
    description?: string,
  ): Promise<boolean> => {
    try {
      await deductMutation.mutateAsync({ amount, serviceType, referenceId, description });
      return true;
    } catch {
      return false;
    }
  };

  return {
    balance: currentBalance,
    earnedBalance: currentEarned,
    freeBalance: Math.max(0, currentBalance - currentEarned),
    isLoading: isBalanceLoading,
    canAfford: (s: ServiceType) => currentBalance >= getServiceCost(s),
    canAffordAmount: (a: number) => currentBalance >= a,
    getServiceCost: (s: ServiceType) => getServiceCost(s),
    deductCredits: async (service: ServiceType, referenceId?: string, description?: string) => {
      const cost = getServiceCost(service);
      return await deductCustomAmount(cost, service, referenceId, description);
    },
    deductCustomAmount,
    addCredits: async (amount: number, type: "welcome_bonus" | "purchase" | "refund", description?: string) => {
      try {
        await addMutation.mutateAsync({ amount, type, description });
        return true;
      } catch {
        return false;
      }
    },
    refreshBalance,
    transactionHistory: txHistory,
  };
}
