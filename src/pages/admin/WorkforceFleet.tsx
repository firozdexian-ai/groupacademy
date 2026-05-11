import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bot, Rocket, Coins, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Template = {
  id: string;
  template_key: string;
  name: string;
  description: string | null;
  base_message_credit_cost: number | null;
  default_model: string | null;
  capabilities: string[] | null;
  is_active: boolean | null;
};

type Company = { id: string; name: string };

export default function WorkforceFleet() {
  const [deployTarget, setDeployTarget] = useState<Template | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ["workforce-master-templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("workforce_master_templates")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Template[];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Master Fleet
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Workforce Command Center</h1>
            <p className="text-muted-foreground mt-1">
              Deploy hired instances of your master agent templates to client tenants.
            </p>
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !templates?.length ? (
          <Card className="border-dashed">
            <CardContent className="py-16 text-center text-muted-foreground">
              <Bot className="h-10 w-10 mx-auto mb-3 opacity-50" />
              No master templates yet. Seed your fleet to get started.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {templates.map((t) => (
              <Card key={t.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary" />
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {t.template_key}
                    </Badge>
                  </div>
                  <CardTitle className="text-lg">{t.name}</CardTitle>
                  <CardDescription className="line-clamp-3 min-h-[3.75rem]">
                    {t.description || "No description provided."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1.5">
                      <Coins className="h-3.5 w-3.5" />
                      Per-message credits
                    </span>
                    <span className="font-semibold">
                      {t.base_message_credit_cost ?? 0}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => setDeployTarget(t)}
                    disabled={!t.is_active}
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Deploy to Client
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <DeployDialog
        template={deployTarget}
        onClose={() => setDeployTarget(null)}
      />
    </div>
  );
}

function DeployDialog({
  template,
  onClose,
}: {
  template: Template | null;
  onClose: () => void;
}) {
  const [tenantId, setTenantId] = useState("");
  const [nameOverride, setNameOverride] = useState("");
  const [clusterGeo, setClusterGeo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: companies } = useQuery({
    queryKey: ["workforce-deploy-companies"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("id, name")
        .order("name")
        .limit(500);
      if (error) throw error;
      return data as Company[];
    },
    enabled: !!template,
  });

  const reset = () => {
    setTenantId("");
    setNameOverride("");
    setClusterGeo("");
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!template) return;
    if (!tenantId) {
      toast.error("Select a tenant first");
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from("workforce_hired_instances")
      .insert({
        template_id: template.id,
        tenant_id: tenantId,
        name_override: nameOverride || null,
        cluster_geo_id: clusterGeo || null,
        status: "active",
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
      setSubmitting(false);
      return;
    }

    toast.success(`Agent successfully deployed to client!`);
    setSubmitting(false);
    reset();
    onClose();
  };

  return (
    <Dialog open={!!template} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-primary" />
            Deploy {template?.name}
          </DialogTitle>
          <DialogDescription>
            Provision a hired instance of this master template for a client tenant.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tenant / Company</Label>
            <Select value={tenantId} onValueChange={setTenantId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a company…" />
              </SelectTrigger>
              <SelectContent>
                {(companies ?? []).map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Instance name override</Label>
            <Input
              value={nameOverride}
              onChange={(e) => setNameOverride(e.target.value)}
              placeholder={template?.name ?? ""}
            />
          </div>

          <div className="space-y-2">
            <Label>Cluster Geo ID</Label>
            <Input
              value={clusterGeo}
              onChange={(e) => setClusterGeo(e.target.value)}
              placeholder="e.g. Dhaka-Mirpur"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4 mr-2" />
            )}
            Deploy Agent
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
