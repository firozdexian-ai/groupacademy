import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Users } from "lucide-react";
import {
  TALENT_REL_STAGES,
  useTalentRelationships,
  useMoveRelationshipStage,
  type TalentRelStage,
} from "@/hooks/useTalentRelationships";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { GRO10X_PANEL, GRO10X_MUTED } from "@/gro10x/lib/tokens";

interface Props {
  companyId: string;
}

export function TalentPipelinePanel({ companyId }: Props) {
  const { data, isLoading } = useTalentRelationships(companyId);
  const move = useMoveRelationshipStage();
  const [activeStage, setActiveStage] = useState<TalentRelStage>("prospect");

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const counts = TALENT_REL_STAGES.reduce<Record<TalentRelStage, number>>((acc, s) => {
    acc[s.id] = (data ?? []).filter((r) => r.stage === s.id).length;
    return acc;
  }, {} as any);
  const filtered = (data ?? []).filter((r) => r.stage === activeStage);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-1.5">
        {TALENT_REL_STAGES.slice(0, 8).map((s) => {
          const active = activeStage === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStage(s.id)}
              className={`px-2 py-1.5 rounded-full text-[11px] font-medium border transition ${
                active ? "bg-[#33E1E4] text-[#06121A] border-[#33E1E4]" : "bg-white/5 border-white/10 text-slate-300"
              }`}
            >
              {s.label} <span className="opacity-70 tabular-nums">{counts[s.id] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-xs text-slate-500 py-12 space-y-2">
          <Users className="h-6 w-6 mx-auto text-slate-600" />
          <p>No talents in {activeStage}.</p>
          <Link to="/gro10x/sourcing" className="text-[#33E1E4] underline">
            Go source talent →
          </Link>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((r) => (
          <Card key={r.id} className={`${GRO10X_PANEL} border-white/5 p-3`}>
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9">
                <AvatarImage src={r.talent?.profile_photo_url ?? undefined} />
                <AvatarFallback>{r.talent?.full_name?.[0] ?? "?"}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate text-slate-100">
                  {r.talent?.full_name ?? "Unknown"}
                </p>
                {r.talent?.custom_profession && (
                  <p className={`text-xs ${GRO10X_MUTED} truncate`}>{r.talent.custom_profession}</p>
                )}
              </div>
              {r.source && (
                <Badge variant="outline" className="text-[10px]">
                  {r.source}
                </Badge>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Select
                value={r.stage}
                onValueChange={(v) => move.mutate({ id: r.id, stage: v as TalentRelStage })}
              >
                <SelectTrigger className="h-7 text-xs flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TALENT_REL_STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs">
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {r.talent?.public_handle && (
                <Link to={`/t/${r.talent.public_handle}`} className="text-xs text-[#33E1E4] px-2">
                  View
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
