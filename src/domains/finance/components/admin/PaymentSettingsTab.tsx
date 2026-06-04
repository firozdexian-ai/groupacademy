import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPaymentConfigSettings, updatePlatformSettingByKey } from "@/domains/finance/repo/financeRepo";
import { updateStripeSecret } from "@/domains/finance/api/financeApi";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  CreditCard,
  MessageCircle,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  Link as LinkIcon,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { InlineSpinner } from "@/components/common/InlineSpinner";

type GatewayOption = "whatsapp" | "stripe" | "both";

/**
 * GroUp Academy: Payment Infrastructure Configuration Console
 * Administrative panel for managing transaction routing, currency variables, and processor security settings.
 */
export function PaymentInfraTab() {
  const queryClient = useQueryClient();

  // Queries core billing configuration flags from platform settings
  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings-payment"],
    queryFn: async () => {
      const data = await getPaymentConfigSettings();
      return new Map(data.map((s) => [s.key, s.value]));
    },
  });

  // Verifies processor configuration token status cleanly without exposing real secrets
  const { data: stripeSecretStatus } = useQuery({
    queryKey: ["stripe-secret-status"],
    queryFn: async () => {
      try {
        const data = await updateStripeSecret({ action: "check" });
        return {
          hasSecretKey: !!data.hasSecretKey,
          hasWebhookSecret: !!data.hasWebhookSecret,
        };
      } catch {
        return { hasSecretKey: false, hasWebhookSecret: false };
      }
    },
    staleTime: 30_000,
    retry: false,
  });

  const [gateway, setGateway] = useState<GatewayOption>("whatsapp");
  const [stripeKey, setStripeKey] = useState("");
  const [stripeMode, setStripeMode] = useState<"test" | "live">("test");
  const [currency, setCurrency] = useState("USD");
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [savingSecret, setSavingSecret] = useState(false);
  const [savingWebhook, setSavingWebhook] = useState(false);

  useEffect(() => {
    if (settings) {
      setGateway((settings.get("payment_gateway") as GatewayOption) || "whatsapp");
      setStripeKey(settings.get("stripe_publishable_key") || "");
      setStripeMode((settings.get("stripe_mode") as "test" | "live") || "test");
      setCurrency(settings.get("currency") || "USD");
      setWhatsappEnabled(settings.get("whatsapp_purchase_enabled") !== "false");
    }
  }, [settings]);

  // Processes state adjustment batches securely back to global platform variables
  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates: Array<{ key: string; value: string | null }> = [
        { key: "payment_gateway", value: gateway },
        { key: "stripe_publishable_key", value: stripeKey || null },
        { key: "stripe_mode", value: stripeMode },
        { key: "currency", value: currency },
        { key: "whatsapp_purchase_enabled", value: whatsappEnabled ? "true" : "false" },
      ];
      for (const u of updates) {
        await updatePlatformSettingByKey(u.key, u.value);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings-payment"] });
      queryClient.invalidateQueries({ queryKey: ["payment-config"] });
      toast.success("Payment preferences successfully saved.");
    },
    onError: () => toast.error("Failed to update payment preferences. Please try again."),
  });

  const handleSaveSecretKey = async () => {
    if (!secretKey.startsWith("sk_")) {
      return toast.error("Invalid key format. Secret keys must begin with sk_test_ or sk_live_");
    }
    setSavingSecret(true);
    try {
      const data = await updateStripeSecret({ action: "save-key", stripeSecretKey: secretKey });
      if (!data?.saved) {
        toast.error(data?.error || "Failed to update API secret key.");
      } else {
        toast.success("Stripe private secret key verified and updated successfully.");
        setSecretKey("");
        queryClient.invalidateQueries({ queryKey: ["stripe-secret-status"] });
      }
    } catch {
      toast.error("An error occurred while updating private access key parameters.");
    } finally {
      setSavingSecret(false);
    }
  };

  const handleSaveWebhookSecret = async () => {
    if (!webhookSecret.startsWith("whsec_")) {
      return toast.error("Invalid secret format. Webhook validation secrets must begin with whsec_");
    }
    setSavingWebhook(true);
    try {
      const data = await updateStripeSecret({ action: "save-webhook", stripeWebhookSecret: webhookSecret });
      if (!data?.saved) {
        toast.error(data?.error || "Failed to link webhook signing secret.");
      } else {
        toast.success("Processor webhook signature verification established.");
        setWebhookSecret("");
        queryClient.invalidateQueries({ queryKey: ["stripe-secret-status"] });
      }
    } catch {
      toast.error("An error occurred while linking webhook parameters.");
    } finally {
      setSavingWebhook(false);
    }
  };

  const stripeUsed = gateway === "stripe" || gateway === "both";
  const secretKeyConfigured = stripeSecretStatus?.hasSecretKey ?? false;
  const webhookConfigured = stripeSecretStatus?.hasWebhookSecret ?? false;

  if (isLoading) {
    return <InlineSpinner size="lg" />;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-300 p-4 md:p-6 text-left">
      {/* Executive Infrastructure Control Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-2xl border border-border/60">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Database className="h-8 w-8 text-primary fill-primary/10" />
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Payment Infrastructure</h2>
          </div>
          <p className="text-xs font-medium text-muted-foreground/80">
            Configure consumer payment gateways, link live API credentials, and manage webhooks.
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="h-11 px-5 rounded-xl font-bold text-xs shadow-sm flex items-center gap-2 shrink-0"
        >
          {saveMutation.isPending ? <InlineSpinner size="sm" /> : <Save className="h-4 w-4 shrink-0" />}
          Save Settings
        </Button>
      </header>

      {/* Real-time Status Indicators Strip */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 select-none">
        <StatusTile
          icon={CreditCard}
          label="Active Routing Option"
          value={gateway === "both" ? "Stripe & WhatsApp" : gateway}
          active={true}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatusTile
          icon={secretKeyConfigured ? CheckCircle2 : AlertCircle}
          label="Private Key Status"
          value={secretKeyConfigured ? "Configured" : "Not Set"}
          active={secretKeyConfigured}
          color={secretKeyConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
          bg={secretKeyConfigured ? "bg-emerald-500/10" : "bg-amber-500/10"}
        />
        <StatusTile
          icon={webhookConfigured ? CheckCircle2 : AlertCircle}
          label="Webhook Sync Status"
          value={webhookConfigured ? "Active" : "Not Set"}
          active={webhookConfigured}
          color={webhookConfigured ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}
          bg={webhookConfigured ? "bg-emerald-500/10" : "bg-amber-500/10"}
        />
        <StatusTile
          icon={MessageCircle}
          label="Manual Support Channel"
          value={whatsappEnabled ? "Enabled" : "Disabled"}
          active={whatsappEnabled}
          color={whatsappEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}
          bg={whatsappEnabled ? "bg-emerald-500/10" : "bg-muted/10"}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Gateway Rules Setup Card */}
        <div className="space-y-8">
          <Card className="rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card">
            <div className="h-1 w-full bg-primary" />
            <CardHeader className="p-6 border-b border-border/10">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                Core Gateway Channels
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Establish primary billing tracks and localized fallbacks for user credit checkouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 ml-0.5">Checkout Route Handler</Label>
                <Select value={gateway} onValueChange={(v) => setGateway(v as GatewayOption)}>
                  <SelectTrigger className="h-11 rounded-xl border font-semibold text-xs bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border font-semibold text-xs">
                    <SelectItem value="whatsapp">WhatsApp Order Verification Only</SelectItem>
                    <SelectItem value="stripe">Stripe Automated Card Processing Only</SelectItem>
                    <SelectItem value="both">Hybrid Processing (Stripe Checkout & WhatsApp Support)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">Support Channel Conversions</Label>
                  <p className="text-xs font-medium text-muted-foreground/80">
                    Allow workspace buyers to complete payments manually via WhatsApp billing agents.
                  </p>
                </div>
                <Switch
                  checked={whatsappEnabled}
                  onCheckedChange={setWhatsappEnabled}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 ml-0.5">
                  Base System Currency Mapping
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-11 rounded-xl border font-semibold text-xs bg-background w-full sm:w-1/2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border font-semibold text-xs">
                    <SelectItem value="USD">United States Dollar (USD)</SelectItem>
                    <SelectItem value="EUR">Euro Zone Currency (EUR)</SelectItem>
                    <SelectItem value="GBP">British Pound Sterling (GBP)</SelectItem>
                    <SelectItem value="BDT">Bangladeshi Taka (BDT)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stripe Private Parameters Vault Card */}
        <div className="space-y-8">
          <Card
            className={cn(
              "rounded-2xl border border-border/60 shadow-sm overflow-hidden bg-card transition-all duration-300",
              !stripeUsed && "opacity-40 grayscale pointer-events-none select-none",
            )}
          >
            <div className="h-1 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
            <CardHeader className="p-6 border-b border-border/10">
              <div className="flex justify-between items-center gap-4">
                <div className="space-y-0.5">
                  <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                    Stripe Configuration Vault
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Manage secure token endpoints for handling continuous automated digital payments.
                  </CardDescription>
                </div>
                {!stripeUsed && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground select-none"
                  >
                    Inactive Route
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-border/40">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold text-foreground">Processing Mode Environment</Label>
                  <p className="text-xs font-medium text-muted-foreground/80">
                    {stripeMode === "live"
                      ? "Live production parameters are active."
                      : "Development sandbox environment is active."}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 font-bold text-xs select-none">
                  <span className={stripeMode === "test" ? "text-primary" : "text-muted-foreground"}>Sandbox</span>
                  <Switch
                    checked={stripeMode === "live"}
                    onCheckedChange={(checked) => setStripeMode(checked ? "live" : "test")}
                    disabled={!stripeUsed}
                    className="data-[state=checked]:bg-rose-500"
                  />
                  <span className={stripeMode === "live" ? "text-rose-600" : "text-muted-foreground"}>Production</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 ml-0.5">Public API Publishable Key</Label>
                <Input
                  placeholder="pk_test_..."
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  disabled={!stripeUsed}
                  className="h-11 rounded-xl border font-mono text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground/70 ml-0.5 flex items-center gap-2">
                  <Key className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  {secretKeyConfigured ? "Update Access Secret Key" : "Add Access Secret Key"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk_test_... or sk_live_..."
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    disabled={!stripeUsed || savingSecret}
                    className="h-11 rounded-xl border font-mono text-xs bg-muted/20 flex-1"
                  />
                  <Button
                    onClick={handleSaveSecretKey}
                    disabled={!stripeUsed || !secretKey || savingSecret}
                    className="h-11 px-4 rounded-xl font-bold text-xs shrink-0"
                  >
                    {savingSecret ? <InlineSpinner size="sm" /> : "Save Private Key"}
                  </Button>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-border/10">
                <Label className="text-xs font-bold text-muted-foreground/70 ml-0.5 flex items-center gap-2">
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" /> Target Webhook Endpoint URL
                </Label>
                <code className="flex items-center h-11 w-full bg-background border border-border rounded-xl text-[11px] text-muted-foreground/80 font-mono px-4 tracking-tight overflow-hidden select-all">
                  https://{import.meta.env.VITE_SUPABASE_PROJECT_ID || "project"}
                  .supabase.co/functions/v1/stripe-webhook
                </code>

                <Label className="text-xs font-bold text-muted-foreground/70 ml-0.5 flex items-center gap-2 mt-3.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  {webhookConfigured ? "Update Webhook Endpoint Secret" : "Add Webhook Endpoint Secret"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="whsec_..."
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    disabled={!stripeUsed || savingWebhook}
                    className="h-11 rounded-xl border font-mono text-xs bg-muted/20 flex-1"
                  />
                  <Button
                    onClick={handleSaveWebhookSecret}
                    disabled={!stripeUsed || !webhookSecret || savingWebhook}
                    className="h-11 px-4 rounded-xl font-bold text-xs shrink-0"
                  >
                    {savingWebhook ? <InlineSpinner size="sm" /> : "Save Webhook Secret"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface StatusTileProps {
  icon: React.ElementType;
  label: string;
  value: string;
  active: boolean;
  color: string;
  bg: string;
}

function StatusTile({ icon: Icon, label, value, active, color, bg }: StatusTileProps) {
  return (
    <Card className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden text-left">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn(
            "p-3 rounded-xl border border-transparent transition-transform duration-200",
            active ? bg : "bg-muted/30 text-muted-foreground",
          )}
        >
          <Icon className={cn("h-5 w-5", active ? color : "text-muted-foreground/60")} />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-wider truncate">{label}</p>
          <p className="font-bold text-sm text-foreground tracking-tight capitalize mt-0.5 truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentInfraTab;
