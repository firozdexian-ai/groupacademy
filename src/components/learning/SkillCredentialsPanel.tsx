import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeCheck, Award, Trophy, ExternalLink, Sparkles, Share2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSkillCredentials, useIssueSkillCredentials, type SkillCredential } from "@/hooks/useSkillCredentials";
import { useTalent } from "@/hooks/useTalent";
import { usePublicProfileSettings } from "@/hooks/usePublicProfileSettings";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const LEVEL_META: Record<SkillCredential["level"], { icon: any; label: string; tone: string }> = {
  foundational: { icon: BadgeCheck, label: "Foundational", tone: "text-primary bg-primary/10 border-primary/30" },
  proficient: { icon: Award, label: "Proficient", tone: "text-success-green bg-success-green/10 border-success-green/30" },
  expert: { icon: Trophy, label: "Expert", tone: "text-amber-500 bg-amber-500/10 border-amber-500/30" },
};

export function SkillCredentialsPanel({ compact = false, limit }: { compact?: boolean; limit?: number }) {
  const { talent } = useTalent();
  const { data, isLoading } = useSkillCredentials(talent?.id);
  const issue = useIssueSkillCredentials();
  const { data: pub } = usePublicProfileSettings();
  const { toast } = useToast();

  // Opportunistic mint once per session per talent — cheap, idempotent.
  useEffect(() => {
    if (!talent?.id) return;
    const key = `skill-cred-mint:${talent.id}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    issue.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [talent?.id]);

  if (isLoading) return <Skeleton className="h-32 rounded-2xl" />;
  if (!data || data.length === 0) return null;

  const items = limit ? data.slice(0, limit) : data;

  return (
    <Card className="rounded-2xl border-border/60">
      <CardHeader className="pb-2 px-3 pt-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" />
          Skill credentials
          <span className="ml-auto text-xs font-normal text-muted-foreground">{data.length} earned</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3 space-y-2">
        {items.map((c) => {
          const meta = LEVEL_META[c.level];
          const Icon = meta.icon;
          return (
            <div
              key={c.id}
              className={cn("flex items-center gap-2 rounded-xl border p-2", meta.tone)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate capitalize">
                  {c.topic_tag.replace(/_/g, " ")}
                </p>
                {!compact && (
                  <p className="text-[11px] opacity-80 truncate">
                    {meta.label} · {(c as any).content?.title ?? "Cross-course"} ·{" "}
                    {Math.round(Number(c.mastery_at_issue) * 100)}% mastery
                  </p>
                )}
              </div>
              <Link
                to={`/verify/skill/${c.verify_code}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold inline-flex items-center gap-0.5 hover:underline"
                aria-label="Verify credential"
              >
                Verify <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
          );
        })}
        {limit && data.length > limit && (
          <Link
            to="/app/talent-mirror"
            className="block text-center text-xs font-medium text-primary hover:underline pt-1"
          >
            See all {data.length} credentials →
          </Link>
        )}
        {pub?.public_profile_enabled && pub.public_handle ? (
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/t/${pub.public_handle}`;
              navigator.clipboard.writeText(url);
              toast({ title: "Public profile link copied" });
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary hover:underline pt-1"
          >
            <Share2 className="h-3 w-3" /> Share public profile
          </button>
        ) : (
          <Link
            to="/app/profile"
            className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary pt-1"
          >
            <Lock className="h-3 w-3" /> Make your skills public →
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
