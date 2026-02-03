import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { 
  TrendingUp, 
  Users, 
  Mail, 
  Building2, 
  Target, 
  DollarSign,
  Coins,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { 
  IR_CONFIG, 
  formatUSD, 
  creditsToUsd, 
  calculateServiceTargets,
  calculateAutoKPIs,
  type ServiceMix,
} from "@/lib/irConfig";

interface IRDashboardProps {
  onNavigate: (tab: string) => void;
}

export function IRDashboard({ onNavigate }: IRDashboardProps) {
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  
  // Fetch current month's target
  const { data: target, isLoading: targetLoading } = useQuery({
    queryKey: ["ir-target", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_monthly_targets")
        .select("*")
        .eq("month", currentMonth)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
  
  // Fetch VC firms count
  const { data: vcCount } = useQuery({
    queryKey: ["ir-vc-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("ir_vc_firms")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });
  
  // Fetch investors count
  const { data: investorCount } = useQuery({
    queryKey: ["ir-investor-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("ir_investors")
        .select("*", { count: "exact", head: true });
      
      if (error) throw error;
      return count || 0;
    },
  });
  
  // Fetch emails sent this month
  const { data: emailsCount } = useQuery({
    queryKey: ["ir-emails-count", currentMonth],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from("ir_email_communications")
        .select("*", { count: "exact", head: true })
        .eq("status", "sent")
        .gte("sent_at", startOfMonth.toISOString());
      
      if (error) throw error;
      return count || 0;
    },
  });
  
  // Fetch current month credit usage
  const { data: creditUsage } = useQuery({
    queryKey: ["ir-credit-usage", currentMonth],
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      
      const { data, error } = await supabase
        .from("credit_transactions")
        .select("amount, service_type")
        .eq("transaction_type", "service_usage")
        .gte("created_at", startOfMonth.toISOString());
      
      if (error) throw error;
      
      // Sum credits consumed (negative amounts)
      const totalCredits = data?.reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      
      // Group by service
      const byService: Record<string, number> = {};
      data?.forEach((t) => {
        if (t.service_type) {
          byService[t.service_type] = (byService[t.service_type] || 0) + Math.abs(t.amount);
        }
      });
      
      return { totalCredits, byService };
    },
  });
  
  const mrrTarget = target?.mrr_target_usd || 0;
  const serviceMix = (target?.service_mix as ServiceMix) || (IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
  const totalCreditsTarget = mrrTarget * IR_CONFIG.USD_TO_CREDITS;
  const currentCredits = creditUsage?.totalCredits || 0;
  const currentMRR = creditsToUsd(currentCredits);
  const progressPercent = totalCreditsTarget > 0 ? Math.min(100, (currentCredits / totalCreditsTarget) * 100) : 0;
  
  const serviceTargets = calculateServiceTargets(mrrTarget, serviceMix);
  const autoKPIs = calculateAutoKPIs(mrrTarget);
  
  if (targetLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Investor Relations Dashboard</h2>
          <p className="text-muted-foreground">
            Track KPIs and manage investor communications
          </p>
        </div>
        <Button onClick={() => onNavigate("ir-targets")}>
          <Target className="mr-2 h-4 w-4" />
          {target ? "Edit Target" : "Set Target"}
        </Button>
      </div>
      
      {/* Top Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">MRR Target</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(mrrTarget)}</div>
            <p className="text-xs text-muted-foreground">
              {formatUSD(autoKPIs.arrUsd)} ARR target
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current MRR</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatUSD(currentMRR)}</div>
            <p className="text-xs text-muted-foreground">
              {progressPercent.toFixed(0)}% of target
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Credits Used</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {currentCredits.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              / {totalCreditsTarget.toLocaleString()} target
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active VCs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vcCount}</div>
            <p className="text-xs text-muted-foreground">
              {investorCount} investors tracked
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* MRR Progress */}
      <Card>
        <CardHeader>
          <CardTitle>MRR Progress - {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</CardTitle>
          <CardDescription>
            Credit revenue converted to USD at $1 = 50 credits
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span>{formatUSD(currentMRR)}</span>
            <span className="text-muted-foreground">{formatUSD(mrrTarget)}</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {(totalCreditsTarget - currentCredits).toLocaleString()} credits remaining to hit target
          </p>
        </CardContent>
      </Card>
      
      {/* Service Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Service-Wise Targets</CardTitle>
          <CardDescription>
            Auto-calculated breakdown based on {formatUSD(mrrTarget)} MRR target
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {serviceTargets.slice(0, 6).map((service) => {
              const actualUsage = creditUsage?.byService?.[service.service] || 0;
              const serviceProgress = service.creditTarget > 0 
                ? Math.min(100, (actualUsage / service.creditTarget) * 100) 
                : 0;
              
              return (
                <div key={service.service} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{service.label}</span>
                    <span className="text-muted-foreground">
                      {service.usageTarget.toLocaleString()} uses @ {service.creditCost} credits
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <Progress value={serviceProgress} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-20 text-right">
                      {formatUSD(service.revenueUsd)} ({service.mixPercent}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          <Button 
            variant="ghost" 
            className="mt-4 w-full" 
            onClick={() => onNavigate("ir-targets")}
          >
            View Full Breakdown & Edit Mix
          </Button>
        </CardContent>
      </Card>
      
      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onNavigate("ir-vcs")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-base">VC Firms</CardTitle>
              <CardDescription>{vcCount} firms tracked</CardDescription>
            </div>
          </CardHeader>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onNavigate("ir-investors")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-base">Investors</CardTitle>
              <CardDescription>{investorCount} contacts</CardDescription>
            </div>
          </CardHeader>
        </Card>
        
        <Card 
          className="cursor-pointer hover:bg-accent/50 transition-colors"
          onClick={() => onNavigate("ir-emails")}
        >
          <CardHeader className="flex flex-row items-center gap-4">
            <Mail className="h-8 w-8 text-primary" />
            <div>
              <CardTitle className="text-base">Email Updates</CardTitle>
              <CardDescription>{emailsCount} sent this month</CardDescription>
            </div>
          </CardHeader>
        </Card>
      </div>
      
      {/* Auto-Calculated KPIs */}
      {mrrTarget > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Auto-Calculated KPIs</CardTitle>
            <CardDescription>
              Based on {formatUSD(mrrTarget)} MRR target with $20 ARPU assumption
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Target ARR</p>
                <p className="text-lg font-semibold">{formatUSD(autoKPIs.arrUsd)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Required Paying Users</p>
                <p className="text-lg font-semibold">{autoKPIs.requiredPayingUsers}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">LTV Estimate</p>
                <p className="text-lg font-semibold">{formatUSD(autoKPIs.ltvEstimate)}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">CAC Ceiling (4:1)</p>
                <p className="text-lg font-semibold">{formatUSD(autoKPIs.cacCeiling)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
