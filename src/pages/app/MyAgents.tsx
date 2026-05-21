import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listOwnedAiAgentsForTalent,
  listTalentAgentMarketplaceEarnings,
  listAgentPayoutRequestsForTalent,
  getTalentMarketplaceSummary,
} from "@/domains/agents/repo/agentsRepo";
import { useTalent } from "@/hooks/useTalent";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Bot, TrendingUp, Coins, Wallet, PlusCircle, Rocket, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { CreatorOnboardingDialog } from "@/components/agents/CreatorOnboardingDialog";
import { PayoutDialog } from "@/components/agents/PayoutDialog"; // Recommended extraction
import { cn } from "@/lib/utils";

// =========================================================================
// DETERMINISTIC CONTRACTS
// =========================================================================
interface SummaryRecord {
  lifetime_earned: number;
  paid_out: number;
  pending_payout: number;
  available: number;
}

export default function MyAgents() {
  const { talent } = useTalent();
  const queryClient = useQueryClient();

  // Unified dashboard state fetching
  const {
    data: dashboardData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["talent-agent-dashboard", talent?.id],
    enabled: !!talent?.id,
    queryFn: async () => {
      const [agents, earnings, payouts, summary] = await Promise.all([
        listOwnedAiAgentsForTalent(talent!.id),
        listTalentAgentMarketplaceEarnings(talent!.id, 100),
        listAgentPayoutRequestsForTalent(talent!.id),
        getTalentMarketplaceSummary(),
      ]);

      return {
        agents: agents ?? [],
        earnings: earnings ?? [],
        payouts: payouts ?? [],
        summary: summary as SummaryRecord,
      };
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin" />
      </div>
    );
  if (!dashboardData) return null;

  const { agents, earnings, payouts, summary } = dashboardData;

  return (
    <div className="container max-w-5xl py-6 space-y-5 pb-24">
      <header className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> My Agents
          </h1>
          <p className="text-sm text-muted-foreground">Build, publish and earn.</p>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <SummaryTile
          label="Lifetime Earned"
          value={summary.lifetime_earned}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <SummaryTile
          label="Available"
          value={summary.available}
          icon={<Coins className="h-4 w-4" />}
          accent="text-emerald-500"
        />
        <SummaryTile label="Pending" value={summary.pending_payout} icon={<Wallet className="h-4 w-4" />} />
        <SummaryTile label="Paid Out" value={summary.paid_out} icon={<Wallet className="h-4 w-4" />} />
      </div>

      <div className="flex flex-wrap gap-2">
        <CreatorOnboardingDialog
          open={false}
          onOpenChange={() => {}}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["talent-agent-dashboard"] })}
        />
        <Button>
          <Rocket className="h-4 w-4 mr-2" />
          Become a builder
        </Button>
        <PayoutDialog
          available={summary.available}
          onCreated={() => queryClient.invalidateQueries({ queryKey: ["talent-agent-dashboard"] })}
        />
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">My agents ({agents.length})</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-3">
          {agents.map((a: any) => (
            <Card key={a.id} className="p-4">
              <h3 className="font-semibold">{a.name}</h3>
              <p className="text-xs text-muted-foreground mt-1">{a.description}</p>
            </Card>
          ))}
        </TabsContent>
        {/* ... Implement Earnings/Payouts Content tabs using similar pattern ... */}
      </Tabs>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className={cn("text-xl font-bold mt-1", accent)}>{Number(value).toFixed(1)}</div>
      </CardContent>
    </Card>
  );
}
