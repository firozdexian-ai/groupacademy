/**
 * Professional Roles management panel.
 * - Pick a profession category on the left
 * - Manage roles (add / rename / reorder / disable) on the right
 * - Shows talent counts so the operator knows where the gaps are
 */
import { useEffect, useMemo, useState } from "react";
import { talentRepo } from "@/domains/talent/repo/talentRepo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Trash2, Loader2, Briefcase, LayoutList, Tags } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

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
      talentRepo.listProfessionCategoriesLite(),
      talentRepo.listProfessionalRoles(),
      talentRepo.listTalentRoleAssignments(),
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
    () => categories.filter((c) => (search ? c.name.toLowerCase().includes(search.toLowerCase()) : true)),
    [categories, search],
  );

  const catRoles = useMemo(() => roles.filter((r) => r.profession_category_id === activeCat), [roles, activeCat]);

  const activeCategory = categories.find((c) => c.id === activeCat);

  const addRole = async () => {
    const name = newRole.trim();
    if (!name || !activeCat) return;
    setSaving(true);
    const { error } = await talentRepo.insertProfessionalRole({
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
    toast.success(`Added role: ${name}`);
    setNewRole("");
    await refresh();
  };

  const toggleActive = async (r: Role) => {
    const { error } = await talentRepo.toggleProfessionalRole(r.id, !r.is_active);
    if (error) toast.error(error.message);
    else {
      toast.success(`${r.name} is now ${!r.is_active ? "active" : "inactive"}`);
      refresh();
    }
  };

  const remove = async (r: Role) => {
    if (!confirm(`Delete role "${r.name}"? Talents tagged with it will be untagged.`)) return;
    const { error } = await talentRepo.deleteProfessionalRole(r.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Deleted role: ${r.name}`);
      refresh();
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-[40px]" />
        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <Skeleton className="h-[600px] rounded-[32px]" />
          <Skeleton className="h-[600px] rounded-[32px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3 text-primary">
            <Briefcase className="h-8 w-8" />
            <h2 className="text-3xl font-black uppercase tracking-tighter italic leading-none">Taxonomy & Roles</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Workforce categorization & talent distribution
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        {/* Categories list */}
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl flex flex-col h-[70vh] overflow-hidden shadow-lg">
          <div className="p-5 border-b border-border/20 bg-muted/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories…"
                className="pl-9 h-11 rounded-xl border-2"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredCats.length === 0 ? (
              <div className="text-center py-10">
                <LayoutList className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                  No categories found
                </p>
              </div>
            ) : (
              filteredCats.map((c) => {
                const tc = talentCountsByCat[c.id] ?? 0;
                const isActive = activeCat === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCat(c.id)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-2xl text-sm flex items-center justify-between transition-all group",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "hover:bg-muted/50 text-foreground",
                    )}
                  >
                    <span className={cn("truncate font-medium", isActive ? "font-bold" : "")}>{c.name}</span>
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={cn(
                        "text-[10px] ml-2 font-bold",
                        isActive ? "bg-background/20 text-primary-foreground border-transparent" : "border-border/50",
                      )}
                    >
                      {tc}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        {/* Roles for selected category */}
        <Card className="rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl flex flex-col h-[70vh] overflow-hidden shadow-lg relative">
          <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full blur-3xl opacity-10 bg-primary pointer-events-none" />

          <CardHeader className="p-6 border-b border-border/20 bg-muted/5 z-10">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] italic text-muted-foreground/70 flex items-center gap-2">
                <Tags className="h-3 w-3" /> Mapping Roles For
              </h3>
              <h2 className="text-2xl font-black italic tracking-tight">{activeCategory?.name ?? "—"}</h2>
            </div>
          </CardHeader>

          <CardContent className="p-6 flex-1 flex flex-col gap-6 overflow-hidden z-10">
            <div className="flex gap-2 shrink-0">
              <Input
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !saving && newRole.trim()) addRole();
                }}
                placeholder="Add a specific role (e.g. Senior Motion Designer)…"
                className="h-12 rounded-xl border-2"
                disabled={!activeCat || saving}
              />
              <Button
                onClick={addRole}
                disabled={saving || !newRole.trim() || !activeCat}
                className="h-12 rounded-xl px-6 font-bold uppercase tracking-wider text-[10px]"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Role
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
              {catRoles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full border-2 border-dashed border-border/40 rounded-2xl bg-muted/5">
                  <Tags className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                    No roles mapped
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Add the first specific role above.</p>
                </div>
              ) : (
                catRoles.map((r) => {
                  const tc = talentCountsByRole[r.id] ?? 0;
                  return (
                    <div
                      key={r.id}
                      className="group flex items-center justify-between gap-4 p-4 rounded-2xl border-2 border-border/40 bg-card hover:border-primary/30 transition-all hover:shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            "text-sm font-bold truncate",
                            !r.is_active && "text-muted-foreground line-through opacity-70",
                          )}
                        >
                          {r.name}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-1 flex items-center gap-1.5">
                          <Badge variant="secondary" className="px-1.5 py-0 text-[9px] h-4">
                            {tc}
                          </Badge>{" "}
                          Talents Assigned
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <Switch
                          checked={!!r.is_active}
                          onCheckedChange={() => toggleActive(r)}
                          title={r.is_active ? "Deactivate role" : "Activate role"}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => remove(r)}
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete role"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
