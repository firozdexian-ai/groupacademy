import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, MessageCircle, Shield, Loader2, Save, CheckCircle2, AlertCircle, Key, ExternalLink } from 'lucide-react';

type GatewayOption = 'whatsapp' | 'stripe' | 'both';

export function PaymentSettingsManager() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['platform-settings-payment'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .in('key', [
          'payment_gateway',
          'stripe_publishable_key',
          'stripe_mode',
          'currency',
          'whatsapp_purchase_enabled',
        ]);
      if (error) throw error;
      return new Map(data?.map((s) => [s.key, s.value]) || []);
    },
  });

  // Check if Stripe secrets are configured in edge functions
  const { data: stripeSecretStatus } = useQuery({
    queryKey: ['stripe-secret-status'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke('update-stripe-secret', {
          body: { action: 'check' },
        });
        if (error) return { hasSecretKey: false, hasWebhookSecret: false };
        return data as { hasSecretKey: boolean; hasWebhookSecret: boolean };
      } catch {
        return { hasSecretKey: false, hasWebhookSecret: false };
      }
    },
    staleTime: 30_000,
  });

  const [gateway, setGateway] = useState<GatewayOption>('whatsapp');
  const [stripeKey, setStripeKey] = useState('');
  const [stripeMode, setStripeMode] = useState<'test' | 'live'>('test');
  const [currency, setCurrency] = useState('USD');
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  // Secret key validation
  const [testKey, setTestKey] = useState('');
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (settings) {
      setGateway((settings.get('payment_gateway') as GatewayOption) || 'whatsapp');
      setStripeKey(settings.get('stripe_publishable_key') || '');
      setStripeMode((settings.get('stripe_mode') as 'test' | 'live') || 'test');
      setCurrency(settings.get('currency') || 'USD');
      setWhatsappEnabled(settings.get('whatsapp_purchase_enabled') !== 'false');
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = [
        { key: 'payment_gateway', value: gateway },
        { key: 'stripe_publishable_key', value: stripeKey || null },
        { key: 'stripe_mode', value: stripeMode },
        { key: 'currency', value: currency },
        { key: 'whatsapp_purchase_enabled', value: whatsappEnabled ? 'true' : 'false' },
      ];

      for (const u of updates) {
        const { error } = await supabase
          .from('platform_settings')
          .update({ value: u.value, updated_at: new Date().toISOString() })
          .eq('key', u.key);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings-payment'] });
      queryClient.invalidateQueries({ queryKey: ['payment-config'] });
      toast.success('Payment settings saved');
    },
    onError: () => toast.error('Failed to save settings'),
  });

  const handleValidateKey = async () => {
    if (!testKey.startsWith('sk_')) {
      toast.error('Key must start with sk_test_ or sk_live_');
      return;
    }
    setValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-stripe-secret', {
        body: { action: 'validate-key', stripeSecretKey: testKey },
      });
      if (error || !data?.valid) {
        toast.error(data?.error || 'Invalid Stripe key');
      } else {
        toast.success('Key validated! Store it as STRIPE_SECRET_KEY in your project secrets.');
        setTestKey('');
        queryClient.invalidateQueries({ queryKey: ['stripe-secret-status'] });
      }
    } catch {
      toast.error('Failed to validate key');
    } finally {
      setValidating(false);
    }
  };

  const stripeUsed = gateway === 'stripe' || gateway === 'both';
  const stripeConfigured = !!stripeKey;
  const secretKeyConfigured = stripeSecretStatus?.hasSecretKey ?? false;
  const webhookConfigured = stripeSecretStatus?.hasWebhookSecret ?? false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Status Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gateway</p>
                <p className="font-semibold capitalize">{gateway}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${secretKeyConfigured ? 'bg-green-500/10' : 'bg-muted'}`}>
                {secretKeyConfigured ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Secret Key</p>
                <p className="font-semibold">{secretKeyConfigured ? 'Configured' : 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${webhookConfigured ? 'bg-green-500/10' : 'bg-muted'}`}>
                {webhookConfigured ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Webhook</p>
                <p className="font-semibold">{webhookConfigured ? 'Active' : 'Not set'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">WhatsApp</p>
                <p className="font-semibold">{whatsappEnabled ? 'Active' : 'Disabled'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Gateway */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Gateway</CardTitle>
          <CardDescription>Choose how users purchase credits</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Active Gateway</Label>
            <Select value={gateway} onValueChange={(v) => setGateway(v as GatewayOption)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                <SelectItem value="stripe">Stripe Only</SelectItem>
                <SelectItem value="both">Both (WhatsApp + Stripe)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>WhatsApp Purchase</Label>
              <p className="text-xs text-muted-foreground">Manual purchase via WhatsApp chat</p>
            </div>
            <Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} />
          </div>
        </CardContent>
      </Card>

      {/* Stripe Configuration */}
      <Card className={!stripeUsed ? 'opacity-60' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Stripe Configuration</CardTitle>
              <CardDescription>Configure Stripe for card payments</CardDescription>
            </div>
            {!stripeUsed && (
              <Badge variant="secondary">Enable Stripe gateway first</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Publishable Key</Label>
            <Input
              placeholder="pk_test_..."
              value={stripeKey}
              onChange={(e) => setStripeKey(e.target.value)}
              disabled={!stripeUsed}
            />
            <p className="text-xs text-muted-foreground">
              Find this in your Stripe Dashboard → Developers → API keys
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Environment</Label>
              <p className="text-xs text-muted-foreground">
                {stripeMode === 'live' ? 'Processing real payments' : 'Using test cards only'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Test</span>
              <Switch
                checked={stripeMode === 'live'}
                onCheckedChange={(checked) => setStripeMode(checked ? 'live' : 'test')}
                disabled={!stripeUsed}
              />
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
          </div>

          {stripeMode === 'live' && stripeUsed && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
              <Shield className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">
                Live mode processes real payments. Make sure your Stripe account is fully verified.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Secret Key Management */}
      <Card className={!stripeUsed ? 'opacity-60' : ''}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-base">Stripe Secret Key</CardTitle>
              <CardDescription>
                Required for processing payments. Stored securely as a backend secret.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            {secretKeyConfigured ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                <p className="text-sm">STRIPE_SECRET_KEY is configured ✓</p>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-warning shrink-0" />
                <p className="text-sm">STRIPE_SECRET_KEY is not set. Stripe payments won't work until configured.</p>
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label>Validate a Key</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="sk_test_... or sk_live_..."
                value={testKey}
                onChange={(e) => setTestKey(e.target.value)}
                disabled={!stripeUsed || validating}
              />
              <Button
                onClick={handleValidateKey}
                disabled={!stripeUsed || !testKey || validating}
                size="default"
              >
                {validating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Validate'}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Paste your Stripe secret key to verify it works. You'll then need to store it as a project secret named <code className="bg-muted px-1 rounded">STRIPE_SECRET_KEY</code>.
            </p>
          </div>

          {!webhookConfigured && stripeUsed && (
            <div className="space-y-2">
              <Label>Webhook Setup</Label>
              <div className="p-3 bg-muted rounded-lg space-y-2">
                <p className="text-sm">Set up a Stripe webhook pointing to:</p>
                <code className="block text-xs bg-background p-2 rounded border break-all">
                  {`https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/stripe-webhook`}
                </code>
                <p className="text-xs text-muted-foreground">
                  Event: <code className="bg-background px-1 rounded">checkout.session.completed</code>.
                  Then store the webhook signing secret as <code className="bg-muted px-1 rounded">STRIPE_WEBHOOK_SECRET</code>.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currency */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Currency</CardTitle>
          <CardDescription>Default currency for credit pricing</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD ($)</SelectItem>
              <SelectItem value="EUR">EUR (€)</SelectItem>
              <SelectItem value="GBP">GBP (£)</SelectItem>
              <SelectItem value="BDT">BDT (৳)</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Save */}
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} size="lg">
        {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
        Save Payment Settings
      </Button>
    </div>
  );
}
