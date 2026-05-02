/**
 * Professional Roles management panel.
 * - Pick a profession category on the left
 * - Manage roles (add / rename / reorder / disable) on the right
 * - Shows talent counts so the operator knows where the gaps are
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Search, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  is_active: boolean | null;
}
interface Role {
  id: string;
  profession_category_id: string;
  name: string;
  slug: string;
  display_order: number | null;
  is_active: boolean | null;
}

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function ProfessionalRolesPanel() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [talentCountsByCat, setTalentCountsByCat] = useState<Record<string, number>>({});
  const [talentCountsByRole, setTalentCountsByRole] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [newRole, setNewRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const refresh = async () => {
    const [{ data: cats }, { data: rls }, { data: talents }] = await Promise.all([
      supabase
        .from("profession_categories")
        .select("id, name, slug, is_active")
        .order("name"),
      supabase
        .from("professional_roles")
        .select("id, profession_category_id, name, slug, display_order, is_active")
        .order("display_order")
        .order("name"),
      supabase.from("talents").select("profession_category_id, professional_role_id").limit(5000),
    ]);
    setCategories((cats ?? []) as Category[]);
    setRoles((rls ?? []) as Role[]);
    const cmap: Record<string, number> = {};
    const rmap: Record<string, number> = {};
    for (const t of talents ?? []) {
      if (t.profession_category_id) cmap[t.profession_category_id] = (cmap[t.profession_category_id] ?? 0) + 1;
      if (t.professional_role_id) rmap[t.professional_role_id] = (rmap[t.professional_role_id] ?? 0) + 1;
    }
    setTalentCountsByCat(cmap);
    setTalentCountsByRole(rmap);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (!activeCat && categories[0]) setActiveCat(categories[0].id);
  }, [categories, activeCat]);

  const filteredCats = useMemo(
    () =>
      categories.filter((c) =>
        search ? c.name.toLowerCase().includes(search.toLowerCase()) : true,
      ),
    [categories, search],
  );
  const catRoles = useMemo(
    () => roles.filter((r) => r.profession_category_id === activeCat),
    [roles, activeCat],
  );
  const activeCategory = categories.find((c) => c.id === activeCat);

  const addRole = async () => {
    const name = newRole.trim();
    if (!name || !activeCat) return;
    setSaving(true);
    const { error } = await supabase.from("professional_roles").insert({
      profession_category_id: activeCat,
      name,
      slug: slugify(name),
      display_order: catRoles.length,
      is_active: true,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setNewRole("");
    await refresh();
  };

  const toggleActive = async (r: Role) => {
    const { error } = await supabase
      .from("professional_roles")
      .update({ is_active: !r.is_active })
      .eq("id", r.id);
    if (error) toast.error(error.message);
    else refresh();
  };

  const remove = async (r: Role) => {
    if (!confirm(`Delete role "${r.name}"? Talents tagged with it will be untagged.`)) return;
    const { error } = await supabase.from("professional_roles").delete().eq("id", r.id);
    if (error) toast.error(error.message);
    else refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground p-8">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading roles…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
      {/* Categories list */}
      <Card className="rounded-3xl border-2 border-border/40 bg-card/30 backdrop-blur-xl p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories…"
            className="pl-8 h-9 rounded-xl"
          />
        </div>
        <div className="space-y-1 max-h-[60vh] overflow-y-auto">
          {filteredCats.map((c) => {
            const tc = talentCountsByCat[c.id] ?? 0;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCat(c.id)}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm flex items-center justify-between transition ${
                  activeCat === c.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/50"
                }`}
              >
                <span className="truncate">{c.name}</span>
                <Badge variant="secondary" className="text-[10px] ml-2">
                  {tc}
                </Badge>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Roles for selected category */}
      <Card className="rounded-3xl border-2 border-border/40 bg-card/30 backdrop-blur-xl p-6 space-y-4">
        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.3em] italic text-muted-foreground/70">
            Roles in
          </h3>
          <h2 className="text-xl font-bold">{activeCategory?.name ?? "—"}</h2>
        </div>

        <div className="flex gap-2">
          <Input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addRole();
            }}
            placeholder="Add a role (e.g. Senior Motion Designer)…"
            className="rounded-xl"
          />
          <Button onClick={addRole} disabled={saving || !newRole.trim()} className="rounded-xl">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>

        <div className="space-y-1">
          {catRoles.length === 0 && (
            <p className="text-xs text-muted-foreground italic">No roles yet — add the first one.</p>
          )}
          {catRoles.map((r) => {
            const tc = talentCountsByRole[r.id] ?? 0;
            return (
              <div
                key={r.id}
                className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl border border-border/30 hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium truncate">{r.name}</div>
                  <div className="text-[10px] text-muted-foreground">{tc} talents</div>
                </div>
                <Switch checked={!!r.is_active} onCheckedChange={() => toggleActive(r)} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(r)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
