import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Circle, ShieldCheck, ChevronRight, Loader2 } from "lucide-react";
import { useTalent } from "@/hooks/useTalent";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  listIdDocStatuses,
  listPayoutAccountPrimaryFlags,
  getTalentVerificationStatus,
} from "@/domains/talent/repo/talentRepo";
import { cn } from "@/lib/utils";
import { IdentityDocsUpload } from "@/domains/profile/components/talent/IdentityDocsUpload";
import { PayoutAccountsManager } from "@/domains/profile/components/talent/PayoutAccountsManager";

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
  const [isLoading, setIsLoading] = useState(true);

  // Digital Workforce Anomaly Protocol — telemetry no-op.
  // The legacy `ai-support-assistant` invoke here always failed server-side
  // because the body shape doesn't match the edge function (`{ image, context }`).
  // Logged in `.lovable/known-edge-contract-drift.md`. Replace with real
  // telemetry sink when one is wired up.
  const reportAnomalyToAdmin = async (error: string, context: any) => {
    console.warn(`[Digital Workforce Anomaly] ${error}`, context);
  };

  useEffect(() => {
    if (!talent?.id) return;

    const syncIdentityState = async () => {
      try {
        setIsLoading(true);
        const [idDocs, payouts, verificationStatusVal] = await Promise.all([
          listIdDocStatuses(talent.id),
          listPayoutAccountPrimaryFlags(talent.id),
          getTalentVerificationStatus(talent.id),
        ]);

        setHasIdVerified((idDocs || []).some((d: any) => d.status === "verified"));
        setHasIdPending((idDocs || []).some((d: any) => d.status === "pending"));
        setHasPrimaryPayout((payouts || []).some((p: any) => p.is_primary));
        setVerificationStatus(verificationStatusVal || "unverified");
      } catch (e) {
        await reportAnomalyToAdmin("VerificationStateSyncFailure", { error: e });
        toast.error("Failed to sync verification state.");
      } finally {
        setIsLoading(false);
      }
    };

    syncIdentityState();
  }, [talent?.id]);

  const checks: Check[] = [
    {
      key: "photo",
      label: "Profile photo",
      description: "Add a clear headshot — verified profiles get 3× more views.",
      done: !!talent?.profilePhotoUrl,
      cta: "Upload photo",
      action: () => navigate("/app/profile/edit"),
    },
    {
      key: "phone",
      label: "Phone number",
      description: "Required for application updates and recruiter contact.",
      done: !!talent?.phone,
      cta: "Add phone",
      action: () => navigate("/app/profile/edit"),
    },
    {
      key: "country",
      label: "Country",
      description: "Helps us show roles relevant to your region.",
      done: !!talent?.countryCode,
      cta: "Set country",
      action: () => navigate("/app/profile/edit"),
    },
    {
      key: "id",
      label: "Government ID",
      description: "Upload National ID (both sides) or passport.",
      done: hasIdVerified,
      cta: hasIdPending ? "Pending review" : "Upload ID",
      action: () => document.getElementById("verify-id-section")?.scrollIntoView({ behavior: "smooth" }),
    },
    {
      key: "payout",
      label: "Disbursement account",
      description: "Add at least one primary account for payouts.",
      done: hasPrimaryPayout,
      cta: "Add account",
      action: () => document.getElementById("verify-payout-section")?.scrollIntoView({ behavior: "smooth" }),
    },
  ];

  const completed = checks.filter((c) => c.done).length;
  const pct = Math.round((completed / checks.length) * 100);
  const verified = verificationStatus === "verified";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-10 pb-40 space-y-8 animate-in fade-in duration-700">
      <header className="flex items-center gap-5">
        <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-6 w-6 text-primary" />
        </Button>
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter italic">Verify Identity</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            Required for credit disbursement.
          </p>
        </div>
      </header>

      <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-sm shadow-xl">
        <CardContent className="p-8 flex items-center gap-6">
          <div
            className={cn(
              "h-16 w-16 rounded-2xl flex items-center justify-center",
              verified ? "bg-emerald-500/10" : "bg-primary/10",
            )}
          >
            <ShieldCheck className={cn("h-8 w-8", verified ? "text-emerald-600" : "text-primary")} />
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-black uppercase tracking-tight italic">
                {verified
                  ? "Profile Verified"
                  : verificationStatus === "pending"
                    ? "Review In Progress"
                    : "Identity Sync Pending"}
              </p>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-muted/50">
                {verificationStatus}
              </Badge>
            </div>
            <Progress value={pct} className="h-2" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              {completed}/{checks.length} Logic Gates Cleared
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {checks.map((c) => (
          <Card
            key={c.key}
            className={cn("transition-all duration-300 rounded-[24px]", c.done && "bg-muted/30 opacity-70")}
          >
            <CardContent className="p-6 flex items-center gap-5">
              {c.done ? (
                <CheckCircle2 className="h-7 w-7 text-emerald-600 shrink-0" />
              ) : (
                <Circle className="h-7 w-7 text-muted-foreground/30 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm font-black uppercase italic tracking-tight",
                    c.done && "line-through text-muted-foreground",
                  )}
                >
                  {c.label}
                </p>
                <p className="text-[11px] font-medium text-muted-foreground leading-snug">{c.description}</p>
              </div>
              {!c.done && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl font-black uppercase text-[9px] tracking-widest"
                  onClick={c.action}
                >
                  {c.cta} <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div id="verify-id-section" className="scroll-mt-20">
        <IdentityDocsUpload />
      </div>
      <div id="verify-payout-section" className="scroll-mt-20">
        <PayoutAccountsManager />
      </div>
    </div>
  );
}
