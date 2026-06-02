/**
 * Employer Outreach Messaging Terminal — Phase Z0 Hardened
 * Version: 2024 Highly Professional SAAS UI
 * Rules: Enforces Human-in-the-loop validation for white-glove client success paths.
 */
import { MessagingChannelsTab } from "@/domains/messaging/components/admin/MessagingChannelsTab";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Info, Radio } from "lucide-react";

export function EmployerMessagingChannelTab() {
  return (
    <div className="space-y-6 p-4 animate-in fade-in duration-500">
      {/* Upper Operational Status Card Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border bg-muted/10">
        <div className="flex items-center gap-3 text-left">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Radio className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-foreground">Outreach Channel Terminal</h4>
            <p className="text-[10px] text-muted-foreground italic">Managing employer messaging streams and conversational integrations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[9px] font-bold border-emerald-500/20 text-emerald-500 bg-emerald-500/5">
            Channel Connected
          </Badge>
        </div>
      </div>

      {/* Main Agent Ingress Component (Immutable Properties Fully Restored) */}
      <div className="rounded-2xl border bg-background shadow-sm overflow-hidden">
        <div className="p-2">
          <MessagingChannelsTab
            agentKey="employer-outreach"
            defaultLabel="Employer Outreach — BD"
            defaultRegion="Bangladesh"
            title="Employer WhatsApp Line"
            description="Direct 1-on-1 with employers and B2B contacts. Auto-reply is OFF by default; enable per-channel for white-glove client-success groups."
          />
        </div>
      </div>

      {/* Digital Workforce Telemetry & Guardrail Summary Card */}
      <Card className="rounded-xl border border-amber-500/20 bg-amber-500/5 overflow-hidden text-left">
        <CardContent className="p-4 flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <h5 className="text-xs font-bold uppercase tracking-wider text-amber-600">SaaS Compliance Guardrail</h5>
            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
              Auto-reply settings are restricted for corporate clients. All outbound employer communications must pass through internal point-of-contact verification queues to safeguard client accounts and preserve outreach reputation bounds.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmployerMessagingChannelTab;