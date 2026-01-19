import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { CREDIT_CONFIG, ServiceType, getServiceCost } from "@/lib/creditPricing";
import { useToast } from "@/hooks/use-toast";

/* SECURITY WARNING: 
  Currently, this hook allows the frontend to write to the 'talent_credits' table.
  In a production environment, 'talent_credits' should have RLS policies that DENY 
  updates from the frontend. All credit additions/deductions should happen via 
  Supabase Database Functions (RPC) or Edge Functions to prevent tampering.
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

  const deductCredits = useCallback(
    async (service: ServiceType, referenceId?: string, description?: string): Promise<boolean> => {
      if (!talent?.id) return false;

      const cost = getServiceCost(service);
      
      // Quick client-side check for immediate feedback
      if (creditData.balance < cost) {
        toast({
          title: "Insufficient Credits",
          description: `You need ${cost} credits. Current balance: ${creditData.balance}`,
          variant: "destructive",
        });
        return false;
      }

      try {
        // Use secure RPC function for atomic deduction
        const { data, error } = await (supabase.rpc as any)("deduct_credits", {
          p_amount: cost,
          p_service_type: service,
          p_reference_id: referenceId || null,
          p_description: description || `Used ${CREDIT_CONFIG.SERVICES[service]?.name || service}`,
        });

        if (error) {
          console.error("RPC error:", error);
          throw error;
        }

        if (!data?.success) {
          toast({
            title: "Transaction Failed",
            description: data?.error || "Could not deduct credits",
            variant: "destructive",
          });
          fetchBalance(); // Sync state
          return false;
        }

        // Update local state with returned balance
        setCreditData((prev) => ({ ...prev, balance: data.new_balance }));
        fetchBalance(); // Refresh history
        return true;
      } catch (error) {
        console.error("Error deducting credits:", error);
        toast({
          title: "Transaction Failed",
          description: "Could not process credit deduction.",
          variant: "destructive",
        });
        return false;
      }
    },
    [talent?.id, creditData.balance, toast, fetchBalance],
  );

  // Generic deduction function using secure RPC
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
        // Use secure RPC function for atomic deduction
        const { data, error } = await (supabase.rpc as any)("deduct_credits", {
          p_amount: amount,
          p_service_type: serviceType,
          p_reference_id: referenceId || null,
          p_description: description || `Service: ${serviceType}`,
        });

        if (error) throw error;

        if (!data?.success) {
          toast({ title: "Insufficient Credits", variant: "destructive" });
          fetchBalance();
          return false;
        }

        setCreditData((prev) => ({ ...prev, balance: data.new_balance }));
        fetchBalance();
        return true;
      } catch (error) {
        console.error("Error deducting credits:", error);
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
        // 1. Get current balance (or create if missing)
        const { data: existing } = await supabase
          .from("talent_credits")
          .select("balance")
          .eq("talent_id", talent.id)
          .maybeSingle();

        const currentBalance = existing?.balance ?? 0;
        const newBalance = currentBalance + amount;

        // 2. Update DB
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

        // 3. Log Transaction
        await supabase.from("credit_transactions").insert({
          talent_id: talent.id,
          amount,
          balance_after: newBalance,
          transaction_type: type,
          description: description || `${type.replace("_", " ")} - ${amount} credits`,
        });

        // 4. Update UI
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
