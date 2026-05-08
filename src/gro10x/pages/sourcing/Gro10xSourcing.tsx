import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Bookmark, UserPlus, MapPin, Award, Loader2, Lock, Mail, Phone, Linkedin, Wallet } from "lucide-react";
import { useTalentSearch, type TalentSearchRow } from "@/hooks/useTalentSearch";
import { useActiveCompany } from "@/gro10x/hooks/useActiveCompany";
import { useUpsertRelationship } from "@/hooks/useTalentRelationships";
import { useCompanyCredits } from "@/gro10x/hooks/useCompanyCredits";
import { useUnlockCost, useCompanyUnlocks, useUnlockTalent, type UnlockedContact } from "@/gro10x/hooks/useTalentUnlocks";
import { TelegramTopUpModal } from "@/gro10x/components/TelegramTopUpModal";
import { SaveToListSheet } from "@/components/sourcing/SaveToListSheet";
import { GRO10X_BG, GRO10X_PANEL, GRO10X_TEXT, GRO10X_MUTED } from "@/gro10x/lib/tokens";
import { toast } from "sonner";

export default function Gro10xSourcing() {
  const { companyId } = useActiveCompany();
  const { balance } = useCompanyCredits();
  const { data: unlockCost = 10 } = useUnlockCost();
  const { data: unlockedSet } = useCompanyUnlocks(companyId);
  const unlock = useUnlockTalent(companyId);
  const [keyword, setKeyword] = useState("");
  const [country, setCountry] = useState("");
  const [skillsInput, setSkillsInput] = useState("");
  const [appliedFilters, setAppliedFilters] = useState<{ keyword?: string; country?: string; skills?: string[] }>({});
  const [page, setPage] = useState(0);
  const [saveTarget, setSaveTarget] = useState<{ id: string; name: string } | null>(null);
  const [revealed, setRevealed] = useState<Record<string, UnlockedContact>>({});
  const [topupOpen, setTopupOpen] = useState(false);
  const [unlockingId, setUnlockingId] = useState<string | null>(null);

  const { data, isLoading } = useTalentSearch(appliedFilters, page);
  const upsertRel = useUpsertRelationship();

  const apply = () => {
    setPage(0);
    setAppliedFilters({
      keyword: keyword.trim() || undefined,
      country: country.trim() || undefined,
      skills: skillsInput.split(",").map((s) => s.trim()).filter(Boolean),
    });
  };

  const handleTrack = async (talentId: string) => {
    if (!companyId) return toast.error("No active company");
    await upsertRel.mutateAsync({ companyId, talentId, source: "sourcing" });
    toast.success("Added to talent pipeline");
  };

  const handleUnlock = async (t: TalentSearchRow) => {
    if (!companyId) return toast.error("No active company");
    if (balance < unlockCost) {
      setTopupOpen(true);
      return;
    }
    setUnlockingId(t.id);
    try {
      const res = await unlock.mutateAsync(t.id);
      if (res?.contact) {
        setRevealed((m) => ({ ...m, [t.id]: res.contact! }));
        toast.success(res.reused ? "Already unlocked" : `Unlocked for ${res.credits_spent} credits`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unlock failed";
      if (msg.toLowerCase().includes("insufficient")) setTopupOpen(true);
      toast.error(msg);
    } finally {
      setUnlockingId(null);
    }
  };

  return (
    <div className={`min-h-screen ${GRO10X_BG} ${GRO10X_TEXT} pb-24`}>
      <div className="px-4 pt-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold">Sourcing</h1>
          <button
            onClick={() => setTopupOpen(true)}
            className={`text-xs flex items-center gap-1 px-2 py-1 rounded-full border ${
              balance < unlockCost ? "border-amber-400/40 text-amber-300" : "border-white/10 text-slate-300"
            }`}
          >
            <Wallet className="h-3 w-3" />
            {balance.toLocaleString()} cr
          </button>
        </div>
        <p className={`text-sm ${GRO10X_MUTED}`}>
          Discover talent. Unlock contact for {unlockCost} credits — shared across your team.
        </p>

        <div className={`${GRO10X_PANEL} rounded-2xl p-3 space-y-2 border border-white/5`}>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <Input
              placeholder="Keyword (name, role, skill)…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className="bg-transparent border-white/10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              placeholder="Country (e.g. BD)"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="bg-transparent border-white/10"
            />
            <Input
              placeholder="Skills (comma-sep)"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="bg-transparent border-white/10"
            />
          </div>
          <Button onClick={apply} className="w-full" size="sm">
            Search
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <span className={`text-xs ${GRO10X_MUTED}`}>
            {isLoading ? "Searching…" : `${data?.total ?? 0} talents`}
          </span>
          <Link to="/gro10x/sourcing/lists" className="text-xs text-[#33E1E4]">
            My lists →
          </Link>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-5 w-5 text-slate-400" />
          </div>
        )}

        <div className="space-y-2">
          {data?.rows.map((t) => (
            <Card key={t.id} className={`${GRO10X_PANEL} border-white/5 p-3 space-y-2`}>
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={t.profile_photo_url ?? undefined} />
                  <AvatarFallback>{t.full_name?.[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate text-slate-100">{t.full_name}</p>
                  {t.custom_profession && (
                    <p className={`text-xs ${GRO10X_MUTED} truncate`}>{t.custom_profession}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    {t.country && (
                      <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {t.country}
                      </span>
                    )}
                    {t.verified_skills > 0 && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Award className="h-3 w-3" /> {t.verified_skills} verified
                      </Badge>
                    )}
                    {t.avg_mastery > 0 && (
                      <Badge variant="outline" className="text-[10px]">
                        Mastery {(t.avg_mastery * 100).toFixed(0)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {(() => {
                const isUnlocked = revealed[t.id] || unlockedSet?.has(t.id);
                const contact = revealed[t.id];
                const canAfford = balance >= unlockCost;
                return (
                  <>
                    <div className="rounded-xl bg-black/20 border border-white/5 px-2.5 py-2 text-xs space-y-1">
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="h-3 w-3 shrink-0 text-slate-500" />
                        <span className="truncate">
                          {contact?.email ?? (isUnlocked ? "—" : "•••••••@•••••.com")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="h-3 w-3 shrink-0 text-slate-500" />
                        <span className="truncate">
                          {contact?.phone ?? (isUnlocked ? "—" : "+•• ••• ••• ••")}
                        </span>
                      </div>
                      {(contact?.linkedin_url || !isUnlocked) && (
                        <div className="flex items-center gap-2 text-slate-300">
                          <Linkedin className="h-3 w-3 shrink-0 text-slate-500" />
                          {contact?.linkedin_url ? (
                            <a href={contact.linkedin_url} target="_blank" rel="noreferrer" className="truncate text-[#33E1E4]">
                              {contact.linkedin_url.replace(/^https?:\/\//, "")}
                            </a>
                          ) : (
                            <span className="truncate">linkedin.com/in/•••••••</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                        onClick={() => setSaveTarget({ id: t.id, name: t.full_name })}>
                        <Bookmark className="h-3 w-3 mr-1" /> Save
                      </Button>
                      <Button size="sm" variant="outline" className="flex-1 h-8 text-xs"
                        onClick={() => handleTrack(t.id)} disabled={upsertRel.isPending}>
                        <UserPlus className="h-3 w-3 mr-1" /> Track
                      </Button>
                      {isUnlocked ? (
                        <Button size="sm" disabled className="flex-1 h-8 text-xs bg-[#10D576]/20 text-[#10D576] hover:bg-[#10D576]/20">
                          Unlocked
                        </Button>
                      ) : canAfford ? (
                        <Button size="sm" className="flex-1 h-8 text-xs"
                          onClick={() => handleUnlock(t)} disabled={unlockingId === t.id}>
                          {unlockingId === t.id
                            ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            : <Lock className="h-3 w-3 mr-1" />}
                          Unlock ({unlockCost} cr)
                        </Button>
                      ) : (
                        <Button size="sm" variant="outline" className="flex-1 h-8 text-xs border-amber-400/40 text-amber-300 hover:bg-amber-400/10"
                          onClick={() => setTopupOpen(true)}>
                          <Wallet className="h-3 w-3 mr-1" /> Top up to unlock
                        </Button>
                      )}
                    </div>
                    {t.public_handle && (
                      <Link to={`/t/${t.public_handle}`} className="text-[11px] text-[#33E1E4]">
                        View profile →
                      </Link>
                    )}
                  </>
                );
              })()}
            </Card>
          ))}

          {data && data.rows.length === 0 && !isLoading && (
            <div className="text-center text-sm text-slate-400 py-8">
              No talents match these filters.
            </div>
          )}
        </div>

        {(data?.total ?? 0) > 24 && (
          <div className="flex items-center justify-between pt-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              Prev
            </Button>
            <span className="text-xs text-slate-400">Page {page + 1}</span>
            <Button
              size="sm"
              variant="ghost"
              disabled={(page + 1) * 24 >= (data?.total ?? 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {saveTarget && companyId && (
        <SaveToListSheet
          companyId={companyId}
          talentId={saveTarget.id}
          talentName={saveTarget.name}
          onClose={() => setSaveTarget(null)}
        />
      )}

      <TelegramTopUpModal
        open={topupOpen}
        onOpenChange={setTopupOpen}
        companyId={companyId}
        defaultCredits={Math.max(100, unlockCost * 10)}
      />
    </div>
  );
}
