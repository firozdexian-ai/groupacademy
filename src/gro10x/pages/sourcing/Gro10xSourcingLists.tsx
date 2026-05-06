import { useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTalentLists, useCreateTalentList } from "@/hooks/useTalentLists";
import { useActiveCompany } from "@/gro10x/hooks/useActiveCompany";
import { GRO10X_BG, GRO10X_TEXT, GRO10X_PANEL, GRO10X_MUTED } from "@/gro10x/lib/tokens";
import { Plus, Users } from "lucide-react";
import { toast } from "sonner";

export default function Gro10xSourcingLists() {
  const { companyId } = useActiveCompany();
  const { data: lists, isLoading } = useTalentLists(companyId);
  const create = useCreateTalentList();
  const [name, setName] = useState("");

  const handleCreate = async () => {
    if (!companyId || !name.trim()) return;
    await create.mutateAsync({ companyId, name: name.trim() });
    setName("");
    toast.success("List created");
  };

  return (
    <div className={`min-h-screen ${GRO10X_BG} ${GRO10X_TEXT} pb-24 px-4 pt-4 space-y-3`}>
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Talent Lists</h1>
        <Link to="/gro10x/sourcing" className="text-xs text-[#33E1E4]">
          Search →
        </Link>
      </div>

      <div className={`${GRO10X_PANEL} rounded-2xl p-3 border border-white/5 flex gap-2`}>
        <Input
          placeholder="New list name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent border-white/10"
        />
        <Button size="sm" onClick={handleCreate} disabled={!name.trim() || create.isPending}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isLoading && <p className={`text-sm ${GRO10X_MUTED}`}>Loading…</p>}

      <div className="space-y-2">
        {(lists ?? []).map((l) => (
          <Card key={l.id} className={`${GRO10X_PANEL} border-white/5 p-3`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-slate-100">{l.name}</p>
                {l.description && (
                  <p className={`text-xs ${GRO10X_MUTED} truncate`}>{l.description}</p>
                )}
              </div>
              <span className="text-xs text-slate-400 inline-flex items-center gap-1">
                <Users className="h-3 w-3" /> {l.member_count}
              </span>
            </div>
          </Card>
        ))}
        {!isLoading && (lists ?? []).length === 0 && (
          <p className={`text-sm ${GRO10X_MUTED} text-center py-8`}>
            No lists yet. Create one to start curating talent.
          </p>
        )}
      </div>
    </div>
  );
}
