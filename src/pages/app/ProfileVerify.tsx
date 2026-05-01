import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, ShieldCheck, ChevronRight } from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { IdentityDocsUpload } from "@/components/profile/IdentityDocsUpload";
import { PayoutAccountsManager } from "@/components/profile/PayoutAccountsManager";

interface Check {
  key: string;
  label: string;
  description: string;
  done: boolean;
  cta: string;
  action: () => void;
}

export default function ProfileVerify() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [hasIdVerified, setHasIdVerified] = useState(false);
  const [hasIdPending, setHasIdPending] = useState(false);
  const [hasPrimaryPayout, setHasPrimaryPayout] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>("unverified");

  useEffect(() => {
    if (!talent?.id) return;
    (async () => {
      const [{ data: idDocs }, { data: payouts }, { data: t }] = await Promise.all([
        supabase.from("talent_id_documents" as any).select("status").eq("talent_id", talent.id),
        supabase.from("talent_payout_accounts" as any).select("is_primary").eq("talent_id", talent.id),
        supabase.from("talents").select("verification_status").eq("id", talent.id).maybeSingle(),
      ]);
      setHasIdVerified(((idDocs as any) || []).some((d: any) => d.status === "verified"));
      setHasIdPending(((idDocs as any) || []).some((d: any) => d.status === "pending"));
      setHasPrimaryPayout(((payouts as any) || []).some((p: any) => p.is_primary));
      setVerificationStatus(((t as any)?.verification_status) || "unverified");
    })();
  }, [talent?.id]);

  const checks: Check[] = [
    {
      key: "photo", label: "Profile photo",
      description: "Add a clear headshot — verified profiles get 3× more views.",
      done: !!talent?.profilePhotoUrl,
      cta: "Upload photo", action: () => navigate("/app/profile/edit"),
    },
    {
      key: "phone", label: "Phone number",
      description: "Required for application updates and recruiter contact.",
      done: !!talent?.phone,
      cta: "Add phone", action: () => navigate("/app/profile/edit"),
    },
    {
      key: "country", label: "Country",
      description: "Helps us show roles relevant to your region.",
      done: !!talent?.countryCode,
      cta: "Set country", action: () => navigate("/app/profile/edit"),
    },
    {
      key: "id", label: "Government ID",
      description: "Upload National ID (both sides) or passport.",
      done: hasIdVerified,
      cta: hasIdPending ? "Pending review" : "Upload ID",
      action: () => document.getElementById("verify-id-section")?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      key: "payout", label: "Disbursement account",
      description: "Add at least one primary account for payouts.",
      done: hasPrimaryPayout,
      cta: "Add account",
      action: () => document.getElementById("verify-payout-section")?.scrollIntoView({ behavior: "smooth" }),
    },
  ];

  const completed = checks.filter((c) => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);
  const verified = verificationStatus === "verified";

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 space-y-5">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Verify your profile</h1>
          <p className="text-sm text-muted-foreground">Required to withdraw earned credits.</p>
        </div>
      </header>

      <Card>
        <CardContent className="p-5 flex items-center gap-4">
          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center", verified ? "bg-emerald-100" : "bg-primary/10")}>
            <ShieldCheck className={cn("h-6 w-6", verified ? "text-emerald-600" : "text-primary")} />
          </div>
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">
                {verified ? "Profile verified" : verificationStatus === "pending" ? "Review in progress" : "Almost there"}
              </p>
              <Badge variant="outline" className="text-[10px] capitalize">{verificationStatus}</Badge>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-[11px] text-muted-foreground">{completed}/{checks.length} steps complete</p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {checks.map((c) => (
          <Card key={c.key} className={cn("transition-colors", c.done && "bg-muted/30")}>
            <CardContent className="p-4 flex items-center gap-3">
              {c.done ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/40 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={cn("text-sm font-medium", c.done && "line-through text-muted-foreground")}>{c.label}</p>
                <p className="text-xs text-muted-foreground">{c.description}</p>
              </div>
              {!c.done && (
                <Button size="sm" variant="ghost" className="gap-1" onClick={c.action}>
                  {c.cta} <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div id="verify-id-section">
        <IdentityDocsUpload />
      </div>
      <div id="verify-payout-section">
        <PayoutAccountsManager />
      </div>
    </div>
  );
}
