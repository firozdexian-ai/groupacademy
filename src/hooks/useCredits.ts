import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { CREDIT_CONFIG, ServiceType, getServiceCost } from "@/lib/creditPricing";
import { useToast } from "@/hooks/use-toast";
import { emailNotifications } from "@/lib/emailNotifications";

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

interface UseCreditsReturn {
  balance: number;
  earnedBalance: number;
  freeBalance: number;
  isLoading: boolean;
  canAfford: (service: ServiceType) => boolean;
  canAffordAmount: (amount: number) => boolean;
  getServiceCost: (service: ServiceType) => number;
  deductCredits: (service: ServiceType, referenceId?: string, description?: string) => Promise<boolean>;
  deductCustomAmount: (
    amount: number,
    serviceType: string,
    referenceId?: string,
    description?: string,
  ) => Promise<boolean>;
  addCredits: (amount: number, type: "welcome_bonus" | "purchase" | "refund", description?: string) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
  transactionHistory: CreditTransaction[];
}

// --- Helper: STRICT UUID Validation ---
// Returns true ONLY if the string is a valid UUID (e.g., "123e4567-e89b-12d3-a456-426614174000")
const isValidUUID = (id: any) => {
  if (!id || typeof id !== "string") return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

export function useCredits(): UseCreditsReturn {
  const { talent } = useTalent();
  const { toast } = useToast();
  const [creditData, setCreditData] = useState<CreditBalance>({ balance: 0, earnedBalance: 0, isLoading: true });
  const [transactionHistory, setTransactionHistory] = useState<CreditTransaction[]>([]);

  const fetchBalance = useCallback(async () => {
    if (!talent?.id) {
      setCreditData({ balance: 0, earnedBalance: 0, isLoading: false });
      return;
    }

    try {
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
    } catch (error) {
      console.error("Error fetching credit balance:", error);
      setCreditData({ balance: 0, earnedBalance: 0, isLoading: false });
    }
  }, [talent?.id]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const canAfford = useCallback(
    (service: ServiceType) => creditData.balance >= getServiceCost(service),
    [creditData.balance],
  );
  const canAffordAmount = useCallback((amount: number) => creditData.balance >= amount, [creditData.balance]);
  const getServiceCostForUser = useCallback((service: ServiceType) => getServiceCost(service), []);

  // --- Fallback: Direct DB Update (Runs if RPC is missing) ---
  const performDirectDeduction = async (
    amount: number,
    serviceType: string,
    referenceId?: string,
    description?: string,
  ) => {
    if (!talent?.id) return { success: false, error: "No talent ID" };

    // 1. Check Balance
    const { data: currentData } = await supabase
      .from("talent_credits")
      .select("balance")
      .eq("talent_id", talent.id)
      .single();

    if (!currentData || currentData.balance < amount) {
      return { success: false, error: "Insufficient balance" };
    }

    const newBalance = currentData.balance - amount;

    // 2. Update Balance
    const { error: updateError } = await supabase
      .from("talent_credits")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("talent_id", talent.id);

    if (updateError) return { success: false, error: updateError.message };

    // 3. Log Transaction - SANITIZE ID HERE
    // If referenceId is "career_assessment" (text), it becomes NULL to prevent DB error
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
        toast({ title: "Insufficient Credits", variant: "destructive" });
        return false;
      }

      // PRE-SANITIZE: Ensure we never pass text to UUID fields
      const safeRefId = isValidUUID(referenceId) ? referenceId : null;

      try {
        // Attempt 1: RPC
        const { data, error } = await (supabase.rpc as any)("deduct_credits", {
          p_amount: cost,
          p_service_type: service,
          p_reference_id: safeRefId, // Pass sanitized ID
          p_description: description || `Used ${service}`,
        });

        if (!error && data?.success) {
          setCreditData((prev) => ({ ...prev, balance: data.new_balance }));
          fetchBalance();
          return true;
        }

        // Attempt 2: Fallback (This handles the missing RPC case)
        console.warn("RPC failed or missing, using direct fallback...");

        // Pass original args, helper will sanitize again
        const fallback = await performDirectDeduction(cost, service, referenceId, description);

        if (fallback.success) {
          setCreditData((prev) => ({ ...prev, balance: fallback.new_balance as number }));
          fetchBalance();
          return true;
        }

        throw new Error(fallback.error || "Transaction failed");
      } catch (error: any) {
        console.error("Deduct error:", error);
        toast({ title: "Transaction Failed", description: "Could not process deduction", variant: "destructive" });
        return false;
      }
    },
    [talent?.id, creditData.balance, toast, fetchBalance],
  );

  const deductCustomAmount = useCallback(
    async (amount: number, serviceType: string, referenceId?: string, description?: string): Promise<boolean> => {
      if (!talent?.id) return false;

      if (creditData.balance < amount) {
        toast({ title: "Insufficient Credits", variant: "destructive" });
        return false;
      }

      const safeRefId = isValidUUID(referenceId) ? referenceId : null;

      try {
        const { data, error } = await (supabase.rpc as any)("deduct_credits", {
          p_amount: amount,
          p_service_type: serviceType,
          p_reference_id: safeRefId,
          p_description: description || `Service: ${serviceType}`,
        });

        if (!error && data?.success) {
          setCreditData((prev) => ({ ...prev, balance: data.new_balance }));
          fetchBalance();
          return true;
        }

        console.warn("RPC failed or missing, using direct fallback...");
        const fallback = await performDirectDeduction(amount, serviceType, referenceId, description);

        if (fallback.success) {
          setCreditData((prev) => ({ ...prev, balance: fallback.new_balance as number }));
          fetchBalance();
          return true;
        }

        throw new Error(fallback.error || "Transaction failed");
      } catch (error: any) {
        console.error("Deduct error:", error);
        toast({ title: "Error", description: "Transaction failed", variant: "destructive" });
        return false;
      }
    },
    [talent?.id, creditData.balance, toast, fetchBalance],
  );

  const addCredits = useCallback(
    async (amount: number, type: "welcome_bonus" | "purchase" | "refund", description?: string): Promise<boolean> => {
      if (!talent?.id) return false;

      try {
        const { data: existing } = await supabase
          .from("talent_credits")
          .select("balance")
          .eq("talent_id", talent.id)
          .maybeSingle();

        const currentBalance = existing?.balance ?? 0;
        const newBalance = currentBalance + amount;

        if (existing) {
          const { error } = await supabase
            .from("talent_credits")
            .update({ balance: newBalance })
            .eq("talent_id", talent.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("talent_credits").insert({ talent_id: talent.id, balance: newBalance });
          if (error) throw error;
        }

        await supabase.from("credit_transactions").insert({
          talent_id: talent.id,
          amount,
          balance_after: newBalance,
          transaction_type: type,
          description: description || `${type.replace("_", " ")} - ${amount} credits`,
        });

        setCreditData((prev) => ({ ...prev, balance: newBalance }));
        fetchBalance();

        if (type === "welcome_bonus") {
          toast({
            title: "Welcome Bonus! 🎉",
            description: `You've received ${amount} credits!`,
          });
        }

        // Fire-and-forget email receipt for purchases and refunds
        if ((type === "purchase" || type === "refund") && talent.id) {
          emailNotifications.creditReceipt(talent.id, amount, newBalance, type);
        }

        return true;
      } catch (error) {
        console.error("Error adding credits:", error);
        toast({ title: "Error", description: "Failed to add credits", variant: "destructive" });
        return false;
      }
    },
    [talent?.id, toast, fetchBalance],
  );

  return {
    balance: creditData.balance,
    earnedBalance: creditData.earnedBalance,
    freeBalance: creditData.balance - creditData.earnedBalance,
    isLoading: creditData.isLoading,
    canAfford,
    canAffordAmount,
    getServiceCost: getServiceCostForUser,
    deductCredits,
    deductCustomAmount,
    addCredits,
    refreshBalance: fetchBalance,
    transactionHistory,
  };
}
