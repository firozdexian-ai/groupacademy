import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { CREDIT_CONFIG, ServiceType, getServiceCost } from "@/lib/creditPricing";
import { useToast } from "@/hooks/use-toast";

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
  isLoading: boolean;
}

interface UseCreditsReturn {
  balance: number;
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

export function useCredits(): UseCreditsReturn {
  const { talent } = useTalent();
  const { toast } = useToast();
  const [creditData, setCreditData] = useState<CreditBalance>({ balance: 0, isLoading: true });
  const [transactionHistory, setTransactionHistory] = useState<CreditTransaction[]>([]);

  const fetchBalance = useCallback(async () => {
    if (!talent?.id) {
      setCreditData({ balance: 0, isLoading: false });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("talent_credits")
        .select("balance")
        .eq("talent_id", talent.id)
        .maybeSingle();

      if (error) throw error;

      setCreditData({
        balance: data?.balance ?? 0,
        isLoading: false,
      });

      // Also fetch recent transactions
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
      setCreditData({ balance: 0, isLoading: false });
    }
  }, [talent?.id]);

  // Initial fetch
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  const canAfford = useCallback(
    (service: ServiceType): boolean => {
      const cost = getServiceCost(service);
      return creditData.balance >= cost;
    },
    [creditData.balance],
  );

  const canAffordAmount = useCallback(
    (amount: number): boolean => {
      return creditData.balance >= amount;
    },
    [creditData.balance],
  );

  const getServiceCostForUser = useCallback((service: ServiceType): number => {
    return getServiceCost(service);
  }, []);

  // --- Helper: Direct DB Fallback for Deductions ---
  // This runs if the secure RPC function is missing
  const performDirectDeduction = async (
    amount: number,
    serviceType: string,
    referenceId?: string,
    description?: string,
  ) => {
    if (!talent?.id) return { success: false, error: "No talent ID" };

    // 1. Get latest balance to ensure we have enough
    const { data: currentData, error: fetchError } = await supabase
      .from("talent_credits")
      .select("balance")
      .eq("talent_id", talent.id)
      .single();

    if (fetchError || !currentData) return { success: false, error: "Could not fetch balance" };

    if (currentData.balance < amount) {
      return { success: false, error: "Insufficient balance" };
    }

    const newBalance = currentData.balance - amount;

    // 2. Update Balance
    const { error: updateError } = await supabase
      .from("talent_credits")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("talent_id", talent.id);

    if (updateError) return { success: false, error: updateError.message };

    // 3. Log Transaction
    await supabase.from("credit_transactions").insert({
      talent_id: talent.id,
      amount: -amount, // Negative for deduction
      balance_after: newBalance,
      transaction_type: "usage",
      service_type: serviceType,
      description: description,
      reference_id: referenceId || null,
    });

    return { success: true, new_balance: newBalance };
  };

  const deductCredits = useCallback(
    async (service: ServiceType, referenceId?: string, description?: string): Promise<boolean> => {
      if (!talent?.id) return false;

      const cost = getServiceCost(service);

      // Client-side pre-check
      if (creditData.balance < cost) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${cost} credits. Current balance: ${creditData.balance}`,
          variant: "destructive",
        });
        return false;
      }

      try {
        // Attempt 1: Try Secure RPC
        const { data, error } = await (supabase.rpc as any)("deduct_credits", {
          p_amount: cost,
          p_service_type: service,
          p_reference_id: referenceId || null,
          p_description: description || `Used ${CREDIT_CONFIG.SERVICES[service]?.name || service}`,
        });

        // If RPC works, great!
        if (!error && data?.success) {
          setCreditData((prev) => ({ ...prev, balance: data.new_balance }));
          fetchBalance();
          return true;
        }

        // If RPC failed specifically because it doesn't exist, try fallback
        if (
          error &&
          (error.code === "PGRST202" || error.message.includes("function") || error.message.includes("not found"))
        ) {
          console.warn("RPC deduct_credits not found, using direct fallback...");
          const fallbackResult = await performDirectDeduction(
            cost,
            service,
            referenceId,
            description || `Used ${CREDIT_CONFIG.SERVICES[service]?.name || service}`,
          );

          if (fallbackResult.success) {
            setCreditData((prev) => ({ ...prev, balance: fallbackResult.new_balance as number }));
            fetchBalance();
            return true;
          } else {
            throw new Error(fallbackResult.error);
          }
        }

        // If RPC failed for other reasons (logic error in SQL)
        if (error || !data?.success) {
          throw new Error(data?.error || error?.message || "Unknown error");
        }

        return true;
      } catch (error: any) {
        console.error("Error deducting credits:", error);
        toast({
          title: "Transaction Failed",
          description: error.message || "Could not process credit deduction.",
          variant: "destructive",
        });
        return false;
      }
    },
    [talent?.id, creditData.balance, toast, fetchBalance],
  );

  const deductCustomAmount = useCallback(
    async (amount: number, serviceType: string, referenceId?: string, description?: string): Promise<boolean> => {
      if (!talent?.id) return false;

      if (creditData.balance < amount) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${amount} credits.`,
          variant: "destructive",
        });
        return false;
      }

      try {
        // Attempt 1: RPC
        const { data, error } = await (supabase.rpc as any)("deduct_credits", {
          p_amount: amount,
          p_service_type: serviceType,
          p_reference_id: referenceId || null,
          p_description: description || `Service: ${serviceType}`,
        });

        if (!error && data?.success) {
          setCreditData((prev) => ({ ...prev, balance: data.new_balance }));
          fetchBalance();
          return true;
        }

        // Attempt 2: Fallback
        if (error && (error.code === "PGRST202" || error.message.includes("function"))) {
          const fallbackResult = await performDirectDeduction(amount, serviceType, referenceId, description);
          if (fallbackResult.success) {
            setCreditData((prev) => ({ ...prev, balance: fallbackResult.new_balance as number }));
            fetchBalance();
            return true;
          } else {
            throw new Error(fallbackResult.error);
          }
        }

        if (error || !data?.success) throw new Error(data?.error || error?.message);

        return true;
      } catch (error: any) {
        console.error("Error deducting credits:", error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
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
