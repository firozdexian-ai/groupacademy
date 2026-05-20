import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { financeApi } from "@/domains/finance/api/manifest";
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
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle,
  Key,
  Link as LinkIcon,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Platform Logic: Payment Infrastructure Manager (Pay Infra)
 * 2026 Standard: Blended Phase 6 UI (Stripe Secrets & API Telemetry)
 */

type GatewayOption = "whatsapp" | "stripe" | "both";

export function PaymentInfraTab() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["platform-settings-payment"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*")
        .in("key", [
          "payment_gateway",
          "stripe_publishable_key",
          "stripe_mode",
          "currency",
          "whatsapp_purchase_enabled",
        ]);
      if (error) throw error;
      return new Map(data?.map((s) => [s.key, s.value]) || []);
    },
  });

  const { data: stripeSecretStatus } = useQuery({
    queryKey: ["stripe-secret-status"],
    queryFn: async () => {
      try {
        const { data, error } = await financeApi.updateStripeSecret({ action: "check" });
        if (error) return { hasSecretKey: false, hasWebhookSecret: false };
        return data as { hasSecretKey: boolean; hasWebhookSecret: boolean };
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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { key: "payment_gateway", value: gateway },
        { key: "stripe_publishable_key", value: stripeKey || null },
        { key: "stripe_mode", value: stripeMode },
        { key: "currency", value: currency },
        { key: "whatsapp_purchase_enabled", value: whatsappEnabled ? "true" : "false" },
      ];
      for (const u of updates) {
        const { error } = await supabase
          .from("platform_settings")
          .update({ value: u.value, updated_at: new Date().toISOString() })
          .eq("key", u.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-settings-payment"] });
      queryClient.invalidateQueries({ queryKey: ["payment-config"] });
      toast.success("Payment Protocol Authenticated & Saved");
    },
    onError: () => toast.error("Failed to commit settings"),
  });

  const handleSaveSecretKey = async () => {
    if (!secretKey.startsWith("sk_")) return toast.error("Key must start with sk_test_ or sk_live_");
    setSavingSecret(true);
    try {
      const { data, error } = await financeApi.updateStripeSecret({ action: "save-key", stripeSecretKey: secretKey });
      if (error || !data?.saved) toast.error(data?.error || "Failed to save Stripe key");
      else {
        toast.success("Stripe Secret Key Validated & Saved!");
        setSecretKey("");
        queryClient.invalidateQueries({ queryKey: ["stripe-secret-status"] });
      }
    } catch {
      toast.error("Failed to save key");
    } finally {
      setSavingSecret(false);
    }
  };

  const handleSaveWebhookSecret = async () => {
    if (!webhookSecret.startsWith("whsec_")) return toast.error("Webhook secret must start with whsec_");
    setSavingWebhook(true);
    try {
      const { data, error } = await financeApi.updateStripeSecret({ action: "save-webhook", stripeWebhookSecret: webhookSecret });
      if (error || !data?.saved) toast.error(data?.error || "Failed to save webhook secret");
      else {
        toast.success("Webhook Secret Registered!");
        setWebhookSecret("");
        queryClient.invalidateQueries({ queryKey: ["stripe-secret-status"] });
      }
    } catch {
      toast.error("Failed to save webhook secret");
    } finally {
      setSavingWebhook(false);
    }
  };

  const stripeUsed = gateway === "stripe" || gateway === "both";
  const secretKeyConfigured = stripeSecretStatus?.hasSecretKey ?? false;
  const webhookConfigured = stripeSecretStatus?.hasWebhookSecret ?? false;

  if (isLoading)
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* Executive Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Database className="h-8 w-8 text-primary fill-primary/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Pay Infra
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            API Gateway & Vault Control
          </p>
        </div>
        <Button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="h-14 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-2xl shadow-primary/30 flex items-center gap-3"
        >
          {saveMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}{" "}
          Commit Changes
        </Button>
      </header>

      {/* KPI Status Strip */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatusTile
          icon={CreditCard}
          label="Gateway Logic"
          value={gateway}
          active={true}
          color="text-primary"
          bg="bg-primary/10"
        />
        <StatusTile
          icon={secretKeyConfigured ? CheckCircle2 : AlertCircle}
          label="Secret Key"
          value={secretKeyConfigured ? "Configured" : "Not Set"}
          active={secretKeyConfigured}
          color={secretKeyConfigured ? "text-emerald-500" : "text-amber-500"}
          bg={secretKeyConfigured ? "bg-emerald-500/10" : "bg-amber-500/10"}
        />
        <StatusTile
          icon={webhookConfigured ? CheckCircle2 : AlertCircle}
          label="Webhook Link"
          value={webhookConfigured ? "Active" : "Not Set"}
          active={webhookConfigured}
          color={webhookConfigured ? "text-emerald-500" : "text-amber-500"}
          bg={webhookConfigured ? "bg-emerald-500/10" : "bg-amber-500/10"}
        />
        <StatusTile
          icon={MessageCircle}
          label="WhatsApp Direct"
          value={whatsappEnabled ? "Active" : "Disabled"}
          active={whatsappEnabled}
          color={whatsappEnabled ? "text-green-500" : "text-muted-foreground"}
          bg={whatsappEnabled ? "bg-green-500/10" : "bg-muted/10"}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Core Gateway Config */}
        <div className="space-y-8">
          <Card className="rounded-[40px] border-2 border-border/40 shadow-xl overflow-hidden bg-card/30 backdrop-blur-md">
            <div className="h-1.5 w-full bg-primary" />
            <CardHeader className="p-8 border-b border-border/10 text-left">
              <CardTitle className="text-xl font-black uppercase italic tracking-tighter">Core Gateway Rules</CardTitle>
              <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                Configure primary payment rails
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6 text-left">
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Active Gateway Router
                </Label>
                <Select value={gateway} onValueChange={(v) => setGateway(v as GatewayOption)}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2 font-bold">
                    <SelectItem value="whatsapp">WhatsApp Protocol Only</SelectItem>
                    <SelectItem value="stripe">Stripe Protocol Only</SelectItem>
                    <SelectItem value="both">Dual Protocol (WhatsApp + Stripe)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border-2 border-border/5">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                    WhatsApp Purchase Node
                  </Label>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    Manual purchase via WhatsApp chat
                  </p>
                </div>
                <Switch
                  checked={whatsappEnabled}
                  onCheckedChange={setWhatsappEnabled}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Global Currency Base
                </Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-muted/20 w-full sm:w-1/2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-2 font-bold">
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                    <SelectItem value="BDT">BDT (৳)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stripe Vault Config */}
        <div className="space-y-8">
          <Card
            className={cn(
              "rounded-[40px] border-2 border-border/40 shadow-xl overflow-hidden bg-card/30 backdrop-blur-md transition-opacity duration-500",
              !stripeUsed && "opacity-40 grayscale pointer-events-none",
            )}
          >
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 to-indigo-600" />
            <CardHeader className="p-8 border-b border-border/10 text-left">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-black uppercase italic tracking-tighter">
                    Stripe API Vault
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                    Configure Stripe for card processing
                  </CardDescription>
                </div>
                {!stripeUsed && (
                  <Badge variant="outline" className="text-[9px] uppercase tracking-widest">
                    Router Disabled
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6 text-left">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border-2 border-border/5">
                <div>
                  <Label className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Execution Environment
                  </Label>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                    {stripeMode === "live" ? "Processing Real Capital" : "Development Test Mode"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      stripeMode === "test" ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    Test
                  </span>
                  <Switch
                    checked={stripeMode === "live"}
                    onCheckedChange={(checked) => setStripeMode(checked ? "live" : "test")}
                    disabled={!stripeUsed}
                    className="data-[state=checked]:bg-rose-500"
                  />
                  <span
                    className={cn(
                      "text-[9px] font-black uppercase tracking-widest",
                      stripeMode === "live" ? "text-rose-500" : "text-muted-foreground",
                    )}
                  >
                    Live
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1">
                  Publishable Key
                </Label>
                <Input
                  placeholder="pk_test_..."
                  value={stripeKey}
                  onChange={(e) => setStripeKey(e.target.value)}
                  disabled={!stripeUsed}
                  className="h-14 rounded-2xl border-2 font-mono text-xs bg-muted/20"
                />
              </div>

              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-2">
                  <Key className="h-3 w-3" /> {secretKeyConfigured ? "Replace Secret Key" : "Inject Secret Key"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="sk_test_... or sk_live_..."
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    disabled={!stripeUsed || savingSecret}
                    className="h-14 rounded-2xl border-2 font-mono text-xs bg-muted/20 flex-1"
                  />
                  <Button
                    onClick={handleSaveSecretKey}
                    disabled={!stripeUsed || !secretKey || savingSecret}
                    className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    {savingSecret ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vault Key"}
                  </Button>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/10">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-2">
                  <LinkIcon className="h-3 w-3" /> Webhook Target Node
                </Label>
                <code className="flex items-center h-12 w-full bg-background border-2 rounded-xl text-[9px] text-muted-foreground font-mono px-4 tracking-widest overflow-hidden">
                  https://{import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/stripe-webhook
                </code>

                <Label className="text-[10px] font-black uppercase tracking-widest text-primary ml-1 flex items-center gap-2 mt-4">
                  <Shield className="h-3 w-3" />{" "}
                  {webhookConfigured ? "Replace Webhook Secret" : "Inject Webhook Secret"}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    placeholder="whsec_..."
                    value={webhookSecret}
                    onChange={(e) => setWebhookSecret(e.target.value)}
                    disabled={!stripeUsed || savingWebhook}
                    className="h-14 rounded-2xl border-2 font-mono text-xs bg-muted/20 flex-1"
                  />
                  <Button
                    onClick={handleSaveWebhookSecret}
                    disabled={!stripeUsed || !webhookSecret || savingWebhook}
                    className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest text-[10px]"
                  >
                    {savingWebhook ? <Loader2 className="h-4 w-4 animate-spin" /> : "Vault Webhook"}
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

function StatusTile({ icon: Icon, label, value, active, color, bg }: any) {
  return (
    <Card className="rounded-[24px] border-2 border-border/40 shadow-sm overflow-hidden text-left">
      <CardContent className="p-5 flex items-center gap-4">
        <div
          className={cn("p-3 rounded-xl border-2 transition-transform", active ? bg : "bg-muted/30 border-border/10")}
        >
          <Icon className={cn("h-5 w-5", active ? color : "text-muted-foreground")} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60 italic">{label}</p>
          <p className="font-bold text-sm uppercase tracking-tight capitalize mt-0.5">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentInfraTab;
