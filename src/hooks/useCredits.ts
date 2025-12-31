import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { CREDIT_CONFIG, ServiceType, getServiceCost } from '@/lib/creditPricing';
import { useToast } from '@/hooks/use-toast';

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
  canAfford: (service: ServiceType, usageCount?: number) => boolean;
  getServiceCost: (service: ServiceType, usageCount?: number) => number;
  getUsageCount: (service: ServiceType) => number;
  isFirstUse: (service: ServiceType) => boolean;
  deductCredits: (service: ServiceType, referenceId?: string, description?: string) => Promise<boolean>;
  addCredits: (amount: number, type: 'welcome_bonus' | 'purchase' | 'refund', description?: string) => Promise<boolean>;
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
        .from('talent_credits')
        .select('balance')
        .eq('talent_id', talent.id)
        .maybeSingle();

      if (error) throw error;

      setCreditData({
        balance: data?.balance ?? 0,
        isLoading: false,
      });

      // Also fetch recent transactions
      const { data: txData } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('talent_id', talent.id)
        .order('created_at', { ascending: false })
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
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching credit balance:', error);
      setCreditData({ balance: 0, isLoading: false });
    }
  }, [talent?.id]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Get usage count for a service from talent's services_used
  const getUsageCount = useCallback((service: ServiceType): number => {
    if (!talent?.servicesUsed) return 0;
    
    // Map service type to the tracked service name
    const serviceNameMap: Record<ServiceType, string> = {
      CAREER_ASSESSMENT: 'career_assessment',
      MOCK_INTERVIEW: 'mock_interview',
      SALARY_ANALYSIS: 'salary_analysis',
      JOB_APPLICATION: 'job_application',
      PORTFOLIO: 'portfolio',
      IELTS_MOCK: 'ielts_mock',
      AI_AGENT_CHAT: 'ai_agent_chat',
      SUGGESTED_JOBS: 'suggested_jobs',
    };
    
    const serviceName = serviceNameMap[service] || service.toLowerCase();
    return talent.servicesUsed.filter((s: string) => s === serviceName).length;
  }, [talent?.servicesUsed]);

  // Check if this is the first use (cost would be 0)
  const isFirstUse = useCallback((service: ServiceType): boolean => {
    const usageCount = getUsageCount(service);
    const cost = getServiceCost(service, usageCount);
    return cost === 0;
  }, [getUsageCount]);

  const canAfford = useCallback((service: ServiceType, usageCount?: number): boolean => {
    const count = usageCount ?? getUsageCount(service);
    const cost = getServiceCost(service, count);
    return creditData.balance >= cost;
  }, [creditData.balance, getUsageCount]);

  const getServiceCostForUser = useCallback((service: ServiceType, usageCount?: number): number => {
    const count = usageCount ?? getUsageCount(service);
    return getServiceCost(service, count);
  }, [getUsageCount]);

  const deductCredits = useCallback(async (
    service: ServiceType,
    referenceId?: string,
    description?: string
  ): Promise<boolean> => {
    if (!talent?.id) return false;

    const usageCount = getUsageCount(service);
    const cost = getServiceCost(service, usageCount);

    if (cost === 0) return true; // Free service

    if (creditData.balance < cost) {
      toast({
        title: 'Insufficient Credits',
        description: `You need ${cost} credits for this service. Current balance: ${creditData.balance}`,
        variant: 'destructive',
      });
      return false;
    }

    try {
      const newBalance = creditData.balance - cost;

      // Update balance
      const { error: updateError } = await supabase
        .from('talent_credits')
        .update({ balance: newBalance })
        .eq('talent_id', talent.id);

      if (updateError) throw updateError;

      // Record transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          talent_id: talent.id,
          amount: -cost,
          balance_after: newBalance,
          transaction_type: 'service_usage',
          service_type: service,
          reference_id: referenceId,
          description: description || `Used ${CREDIT_CONFIG.SERVICES[service].name}`,
        });

      if (transactionError) throw transactionError;

      setCreditData(prev => ({ ...prev, balance: newBalance }));
      return true;
    } catch (error) {
      console.error('Error deducting credits:', error);
      toast({
        title: 'Error',
        description: 'Failed to process credit transaction',
        variant: 'destructive',
      });
      return false;
    }
  }, [talent?.id, getUsageCount, creditData.balance, toast]);

  const addCredits = useCallback(async (
    amount: number,
    type: 'welcome_bonus' | 'purchase' | 'refund',
    description?: string
  ): Promise<boolean> => {
    if (!talent?.id) return false;

    try {
      // Check if credit record exists
      const { data: existing } = await supabase
        .from('talent_credits')
        .select('balance')
        .eq('talent_id', talent.id)
        .maybeSingle();

      const currentBalance = existing?.balance ?? 0;
      const newBalance = currentBalance + amount;

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from('talent_credits')
          .update({ balance: newBalance })
          .eq('talent_id', talent.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from('talent_credits')
          .insert({
            talent_id: talent.id,
            balance: newBalance,
          });

        if (error) throw error;
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('credit_transactions')
        .insert({
          talent_id: talent.id,
          amount,
          balance_after: newBalance,
          transaction_type: type,
          description: description || `${type.replace('_', ' ')} - ${amount} credits`,
        });

      if (transactionError) throw transactionError;

      setCreditData(prev => ({ ...prev, balance: newBalance }));

      if (type === 'welcome_bonus') {
        toast({
          title: 'Welcome Bonus! 🎉',
          description: `You've received ${amount} credits to get started!`,
        });
      }

      return true;
    } catch (error) {
      console.error('Error adding credits:', error);
      toast({
        title: 'Error',
        description: 'Failed to add credits',
        variant: 'destructive',
      });
      return false;
    }
  }, [talent?.id, toast]);

  return {
    balance: creditData.balance,
    isLoading: creditData.isLoading,
    canAfford,
    getServiceCost: getServiceCostForUser,
    getUsageCount,
    isFirstUse,
    deductCredits,
    addCredits,
    refreshBalance: fetchBalance,
    transactionHistory,
  };
}
