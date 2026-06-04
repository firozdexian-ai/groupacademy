import { useState } from "react";
import { SimpleAdminRegistry } from "@/platform/admin/ui/SimpleAdminRegistry";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreditCard, Settings2, Activity, ShieldCheck, HelpCircle, AlertTriangle } from "lucide-react";

/**
 * GroUp Academy: Payment Infrastructure Gateway Controller Tab
 * Provides programmatic administrative oversight for live transactional processing channels and billing endpoints.
 */
export default function PaymentInfraTab() {
  const [activeGatewaysCount, setActiveGatewaysCount] = useState(2);

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300 p-1 md:p-2">
      {/* Executive Infrastructure Header Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 relative overflow-hidden border border-border/60 bg-card/60 backdrop-blur-md rounded-2xl shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Payment Infrastructure Routing
                </CardTitle>
                <CardDescription>
                  Configure active payment processing networks, toggle localized token routes, and set verification
                  parameters for incoming consumer transactions.
                </CardDescription>
              </div>
              <Badge
                variant="outline"
                className="bg-emerald-500/5 text-emerald-600 border-emerald-500/20 gap-1.5 px-3 py-1 font-semibold text-xs h-8 select-none"
              >
                <Activity className="h-3.5 w-3.5 animate-pulse" /> Channels Monitored
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border/10 text-sm">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                  Stripe Core
                </p>
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" /> Live Mode
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                  Paddle Engine
                </p>
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" /> Deactivated
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                  bKash Routing
                </p>
                <span className="text-xs font-bold text-amber-600 flex items-center gap-1 mt-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" /> Manual Sync
                </span>
              </div>
              <div className="p-3 rounded-xl bg-muted/30 border border-border/40">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-0.5">
                  Active Gateways
                </p>
                <p className="text-base font-bold text-foreground tracking-tight mt-0.5">
                  {activeGatewaysCount} Systems
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Safeguard Notice Box */}
        <div className="flex flex-col justify-center">
          <Alert className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-5">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="ml-3 text-left">
              <AlertTitle className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Transactional Integrity Guard
              </AlertTitle>
              <AlertDescription className="text-xs text-amber-700/90 dark:text-amber-500/90 leading-relaxed mt-1">
                Modifying payment configuration provider tokens directly shifts regional workspace checkout flows.
                Ensure all webhook configurations match updated database states to prevent balance drops.
              </AlertDescription>
            </div>
          </Alert>
        </div>
      </div>

      {/* Primary Configuration Registry Engine Interface */}
      <Card className="border border-border/40 shadow-sm rounded-2xl overflow-hidden bg-card">
        <div className="h-1 w-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />
        <CardContent className="p-0">
          <SimpleAdminRegistry
            table="fin_payment_configs"
            title="Gateway Configuration Matrix"
            description="Register gateway properties, set routing rules, and maintain transactional processing logs."
            fields={[
              {
                key: "label",
                label: "Configuration Name Label",
                required: true,
                placeholder: "e.g., Stripe Production Core",
              },
              {
                key: "provider",
                label: "Payment System Provider Channel",
                required: true,
                placeholder: "Select from: stripe / paddle / bkash / manual",
              },
              {
                key: "status",
                label: "Channel Activity Status",
                placeholder: "Select from: active / inactive",
              },
              {
                key: "notes",
                label: "Internal Operations Reference Notes",
                type: "textarea",
                placeholder: "Provide ledger parameters or tracking tokens for security audits...",
              },
            ]}
            primaryKey="label"
          />
        </CardContent>
      </Card>

      {/* Infrastructure Verification Support Footer */}
      <div className="flex items-center gap-3 p-4 bg-muted/20 border border-border/40 rounded-xl justify-center">
        <ShieldCheck className="h-4 w-4 text-primary opacity-70 shrink-0" />
        <p className="text-xs font-medium text-muted-foreground/80">
          All connection endpoints utilize end-to-end encryption protocols. Configuration changes sync immediately with
          platform serverless hooks.
        </p>
      </div>
    </div>
  );
}
