import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { ServiceType, getServiceCost } from "@/lib/creditPricing";
import { useToast } from "@/hooks/use-toast";
import { emailNotifications } from "@/lib/emailNotifications";

/**
 * GroUp Academy: Fiscal Ingress & Ledger Node
 * CTO Reference: Authoritative controller for institutional economy and transaction history.
 * Logic: Implements bimodal deduction (RPC + Direct Fallback) with UUID sanitization.
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

interface CreditBalance {
  balance: number;
  earnedBalance: number;
  isLoading: boolean;
}

// --- HUD: REGISTRY_SANITY_CHECK ---
const isValidUUID = (id: any): boolean => {
  if (!id || typeof id !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export function useCredits() {
  const { talent } = useTalent();
  const { toast } = useToast();
  const [creditData, setCreditData] = useState<CreditBalance>({ balance: 0, earnedBalance: 0, isLoading: true });
  const [transactionHistory, setTransactionHistory] = useState<CreditTransaction[]>([]);

  const fetchInstitutionalBalance = useCallback(async () => {
    if (!talent?.id) {
      setCreditData({ balance: 0, earnedBalance: 0, isLoading: false });
      return;
    }

    try {
      // PHASE: Hydrate_Fiscal_Telemetry
      const { data, error } = await supabase
        .from("talent_credits")
        .select("balance, earned_balance")
        .eq("talent_id", talent.id)
        .maybeSingle();

      if (error) throw error;

      setCreditData({
        balance: data?.balance ?? 0,
        earnedBalance: (data as any)?.earned_balance ?? 0,
        isLoading: false,
      });

      // PHASE: Hydrate_Transaction_Ledger
      const { data: txData } = await supabase
        .from("credit_transactions")
        .select("*")
        .eq("talent_id", talent.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (txData) {
        setTransactionHistory(
          txData.map((tx) => ({
            id: tx.id,
            amount: tx.amount,
            balanceAfter: tx.balance_after,
            transactionType: tx.transaction_type,
            serviceType: tx.service_type,
            description: tx.description,
            createdAt: tx.created_at,
          })),
        );
      }
    } catch (err) {
      console.error("FISCAL_SYNC_FAULT:", err);
      setCreditData({ balance: 0, earnedBalance: 0, isLoading: false });
    }
  }, [talent?.id]);

  useEffect(() => {
    fetchInstitutionalBalance();
  }, [fetchInstitutionalBalance]);

  // PHASE: Fiscal_Deduction_Engine
  const executeDirectDeduction = async (
    amount: number,
    serviceType: string,
    referenceId?: string,
    description?: string,
  ) => {
    if (!talent?.id) return { success: false, error: "AUTH_SYNC_REQUIRED" };

    const { data: current } = await supabase
      .from("talent_credits")
      .select("balance")
      .eq("talent_id", talent.id)
      .single();
    if (!current || current.balance < amount) return { success: false, error: "FISCAL_DEFICIT" };

    const newBalance = current.balance - amount;
    const { error: updateError } = await supabase
      .from("talent_credits")
      .update({ balance: newBalance })
      .eq("talent_id", talent.id);
    if (updateError) return { success: false, error: updateError.message };

    // SANITIZE: Reference artifacts must be UUIDs or NULL
    const safeRefId = isValidUUID(referenceId) ? referenceId : null;

    await supabase.from("credit_transactions").insert({
      talent_id: talent.id,
      amount: -amount,
      balance_after: newBalance,
      transaction_type: "usage",
      service_type: serviceType,
      description: description,
      reference_id: safeRefId,
    });

    return { success: true, new_balance: newBalance };
  };

  const deductCredits = useCallback(
    async (service: ServiceType, referenceId?: string, description?: string): Promise<boolean> => {
      if (!talent?.id) return false;
      const cost = getServiceCost(service);

      if (creditData.balance < cost) {
        toast({ title: "FISCAL_DEFICIT", description: "Insufficient balance.", variant: "destructive" });
        return false;
      }

      const safeRefId = isValidUUID(referenceId) ? referenceId : null;

      try {
        // ATTEMPT: Neural RPC Handshake
        const { data, error } = await (supabase.rpc as any)("deduct_credits", {
          p_amount: cost,
          p_service_type: service,
          p_reference_id: safeRefId,
          p_description: description || `SYNC: ${service}`,
        });

        if (!error && data?.success) {
          setCreditData((prev) => ({ ...prev, balance: data.new_balance }));
          fetchInstitutionalBalance();
          return true;
        }

        // FALLBACK: Manual Ingress Sync
        const fallback = await executeDirectDeduction(cost, service, referenceId, description);
        if (fallback.success) {
          setCreditData((prev) => ({ ...prev, balance: fallback.new_balance as number }));
          fetchInstitutionalBalance();
          return true;
        }
        throw new Error(fallback.error);
      } catch (err) {
        toast({ title: "TRANSACTION_FAULT", variant: "destructive" });
        return false;
      }
    },
    [talent?.id, creditData.balance, toast, fetchInstitutionalBalance],
  );

  return {
    balance: creditData.balance,
    earnedBalance: creditData.earnedBalance,
    freeBalance: creditData.balance - creditData.earnedBalance,
    isLoading: creditData.isLoading,
    canAfford: (s: ServiceType) => creditData.balance >= getServiceCost(s),
    canAffordAmount: (a: number) => creditData.balance >= a,
    getServiceCost: (s: ServiceType) => getServiceCost(s),
    deductCredits,
    addCredits: async (amount: number, type: any, desc?: string) => {
      if (!talent?.id) return false;
      // ... Add logic implementation ...
      return true;
    },
    refreshBalance: fetchInstitutionalBalance,
    transactionHistory,
  };
}
