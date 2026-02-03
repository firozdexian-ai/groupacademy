import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, RefreshCw } from "lucide-react";
import { 
  IR_CONFIG, 
  formatUSD, 
  calculateServiceTargets,
  calculateAutoKPIs,
  type ServiceMix,
  type ServiceKey,
} from "@/lib/irConfig";

export function MRRTargetManager() {
  const queryClient = useQueryClient();
  const currentMonth = new Date().toISOString().slice(0, 7) + "-01";
  
  const [mrrTarget, setMrrTarget] = useState<number>(0);
  const [serviceMix, setServiceMix] = useState<ServiceMix>(IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
  const [targetPayingUsers, setTargetPayingUsers] = useState<number>(0);
  const [targetChurnRate, setTargetChurnRate] = useState<number>(5);
  const [notes, setNotes] = useState<string>("");
  const [hasChanges, setHasChanges] = useState(false);
  
  // Fetch current target
  const { data: target, isLoading } = useQuery({
    queryKey: ["ir-target", currentMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ir_monthly_targets")
        .select("*")
        .eq("month", currentMonth)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setMrrTarget(Number(data.mrr_target_usd) || 0);
        setServiceMix((data.service_mix as ServiceMix) || (IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix));
        setTargetPayingUsers(data.target_paying_users || 0);
        setTargetChurnRate(Number(data.target_churn_rate) || 5);
        setNotes(data.notes || "");
      }
      
      return data;
    },
  });
  
  // Save target mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        month: currentMonth,
        mrr_target_usd: mrrTarget,
        service_mix: serviceMix,
        target_paying_users: targetPayingUsers,
        target_churn_rate: targetChurnRate,
        notes: notes || null,
      };
      
      if (target?.id) {
        const { error } = await supabase
          .from("ir_monthly_targets")
          .update(payload)
          .eq("id", target.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("ir_monthly_targets")
          .insert(payload);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Target saved successfully");
      setHasChanges(false);
      queryClient.invalidateQueries({ queryKey: ["ir-target"] });
    },
    onError: (error) => {
      toast.error("Failed to save target: " + error.message);
    },
  });
  
  const handleMixChange = (service: ServiceKey, value: number) => {
    setServiceMix((prev) => ({ ...prev, [service]: value }));
    setHasChanges(true);
  };
  
  const resetToDefaults = () => {
    setServiceMix(IR_CONFIG.DEFAULT_SERVICE_MIX as ServiceMix);
    setHasChanges(true);
  };
  
  const totalMixPercent = Object.values(serviceMix).reduce((sum, v) => sum + v, 0);
  const serviceTargets = calculateServiceTargets(mrrTarget, serviceMix);
  const autoKPIs = calculateAutoKPIs(mrrTarget, targetPayingUsers > 0 ? mrrTarget / targetPayingUsers : 20);
  const totalCreditsTarget = mrrTarget * IR_CONFIG.USD_TO_CREDITS;
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">MRR Targets</h2>
          <p className="text-muted-foreground">
            Set monthly revenue targets and service mix for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Button 
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending || !hasChanges}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Target
        </Button>
      </div>
      
      {/* MRR Input */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue Target</CardTitle>
          <CardDescription>
            Set your MRR goal in USD. Service targets will be auto-calculated.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mrr">MRR Target (USD)</Label>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">$</span>
                <Input
                  id="mrr"
                  type="number"
                  value={mrrTarget}
                  onChange={(e) => {
                    setMrrTarget(Number(e.target.value));
                    setHasChanges(true);
                  }}
                  placeholder="2000"
                  min={0}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="users">Target Paying Users</Label>
              <Input
                id="users"
                type="number"
                value={targetPayingUsers}
                onChange={(e) => {
                  setTargetPayingUsers(Number(e.target.value));
                  setHasChanges(true);
                }}
                placeholder="100"
                min={0}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="churn">Target Churn Rate (%)</Label>
              <Input
                id="churn"
                type="number"
                value={targetChurnRate}
                onChange={(e) => {
                  setTargetChurnRate(Number(e.target.value));
                  setHasChanges(true);
                }}
                placeholder="5"
                min={0}
                max={100}
                step={0.5}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Total Credits Target</Label>
              <div className="text-2xl font-bold">
                {totalCreditsTarget.toLocaleString()} credits
              </div>
              <p className="text-xs text-muted-foreground">
                {formatUSD(mrrTarget)} × 50 credits/$
              </p>
            </div>
          </div>
          
          {/* Auto KPIs */}
          {mrrTarget > 0 && (
            <div className="grid gap-4 md:grid-cols-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">ARR Target</p>
                <p className="text-lg font-semibold">{formatUSD(autoKPIs.arrUsd)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Required Users</p>
                <p className="text-lg font-semibold">{autoKPIs.requiredPayingUsers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">LTV Estimate</p>
                <p className="text-lg font-semibold">{formatUSD(autoKPIs.ltvEstimate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CAC Ceiling</p>
                <p className="text-lg font-semibold">{formatUSD(autoKPIs.cacCeiling)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Service Mix */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Service Mix Configuration</CardTitle>
            <CardDescription>
              Adjust expected usage distribution across services (Total: {totalMixPercent}%)
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={resetToDefaults}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reset to Defaults
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {(Object.keys(IR_CONFIG.SERVICE_LABELS) as ServiceKey[]).map((service) => {
              const target = serviceTargets.find((s) => s.service === service);
              const mixValue = serviceMix[service] || 0;
              
              return (
                <div key={service} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">{IR_CONFIG.SERVICE_LABELS[service]}</Label>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{target?.usageTarget.toLocaleString() || 0} uses</span>
                      <span>{target?.creditTarget.toLocaleString() || 0} credits</span>
                      <span className="w-16 text-right font-medium">
                        {formatUSD(target?.revenueUsd || 0)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[mixValue]}
                      onValueChange={([v]) => handleMixChange(service, v)}
                      max={50}
                      step={1}
                      className="flex-1"
                    />
                    <div className="w-16 flex items-center gap-1">
                      <Input
                        type="number"
                        value={mixValue}
                        onChange={(e) => handleMixChange(service, Number(e.target.value))}
                        className="h-8 text-center"
                        min={0}
                        max={100}
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {IR_CONFIG.SERVICE_COSTS[service]} credits per use
                  </div>
                </div>
              );
            })}
          </div>
          
          {totalMixPercent !== 100 && (
            <p className="mt-4 text-sm text-yellow-600">
              Note: Mix percentages total {totalMixPercent}%. Consider adjusting to reach 100%.
            </p>
          )}
        </CardContent>
      </Card>
      
      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>
            Add context or assumptions for this month's targets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setHasChanges(true);
            }}
            placeholder="E.g., Expecting higher AI Agent usage due to new marketing campaign..."
            rows={4}
          />
        </CardContent>
      </Card>
    </div>
  );
}
