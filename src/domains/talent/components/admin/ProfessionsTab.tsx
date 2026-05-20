import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Building2, GraduationCap, Briefcase, Bot, DatabaseZap, Globe } from "lucide-react";
import { getIcon } from "@/lib/iconMap";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardCardSkeleton } from "../DashboardSkeleton";
import { cn } from "@/lib/utils";
import { ProfessionalRolesPanel } from "@/components/dashboard/talent/ProfessionalRolesPanel";

// Types aligned with Master Spec & Technical Reference
interface Academy {
  id: string;
  name: string;
  slug: string;
  academy_type: string;
  icon: string | null;
  is_active: boolean | null;
}

interface School {
  id: string;
  name: string;
  slug: string;
  academy_id: string;
  executive_capability_goal: string | null;
  is_active: boolean | null;
}

interface ProfessionLine {
  id: string;
  name: string;
  slug: string;
  school_id: string | null;
  credit_cost: number | null;
  is_active: boolean | null;
  icon: string | null;
}

export function ProfessionsTab() {
  const [academies, setAcademies] = useState<Academy[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [professionLines, setProfessionLines] = useState<ProfessionLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog States
  const [activeTab, setActiveTab] = useState("academies");
  const [academyDialog, setAcademyDialog] = useState(false);
  const [schoolDialog, setSchoolDialog] = useState(false);
  const [professionDialog, setProfessionDialog] = useState(false);

  // Edit States
  const [editingItem, setEditingItem] = useState<any>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const results = await withTimeout(
        Promise.all([
          supabase.from("academies").select("*").order("display_order"),
          supabase.from("schools").select("*").order("display_order"),
          supabase.from("profession_categories").select("*").order("display_order"),
        ]),
        TIMEOUTS.DEFAULT,
        "Structural sync timed out",
      );

      setAcademies(results[0].data || []);
      setSchools(results[1].data || []);
      setProfessionLines(results[2].data || []);
    } catch (error) {
      toast.error("Structural sync failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>, table: string, setOpen: (o: boolean) => void) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const raw = Object.fromEntries(formData.entries()) as Record<string, any>;
    const payload: Record<string, any> = { ...raw };

    // Convert checkbox
    if ("is_active" in raw) payload.is_active = raw.is_active === "on";

    const tbl = supabase.from(table as any) as any;
    const query = editingItem?.id
      ? tbl.update(payload).eq("id", editingItem.id)
      : tbl.insert(payload);

    const { error } = await query;
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`${table} updated`);
      setOpen(false);
      loadData();
    }
  };

  if (isLoading)
    return (
      <div className="p-10">
        <DashboardCardSkeleton />
      </div>
    );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 p-4">
      {/* Deduped Header Action Row (P2 Fix) */}
      <div className="flex justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">Academic Governance</h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            Manage Academies, Schools & Programs
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "academies" && (
            <Button
              size="sm"
              className="rounded-xl font-black"
              onClick={() => {
                setEditingItem(null);
                setAcademyDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Academy
            </Button>
          )}
          {activeTab === "schools" && (
            <Button
              size="sm"
              className="rounded-xl font-black"
              onClick={() => {
                setEditingItem(null);
                setSchoolDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New School
            </Button>
          )}
          {activeTab === "professions" && (
            <Button
              size="sm"
              className="rounded-xl font-black"
              onClick={() => {
                setEditingItem(null);
                setProfessionDialog(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> New Program
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="h-14 w-full max-w-2xl mx-auto grid grid-cols-4 bg-muted/20 border-2 border-border/10 p-1.5 rounded-2xl mb-8">
          {["academies", "schools", "professions", "roles"].map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-xl font-black uppercase italic text-[10px] tracking-widest"
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="academies" className="grid gap-6 md:grid-cols-3">
          {academies.map((a) => (
            <AcademyCard
              key={a.id}
              academy={a}
              onEdit={() => {
                setEditingItem(a);
                setAcademyDialog(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="schools" className="grid gap-6 md:grid-cols-3">
          {schools.map((s) => (
            <SchoolCard
              key={s.id}
              school={s}
              academyName={academies.find((a) => a.id === s.academy_id)?.name}
              onEdit={() => {
                setEditingItem(s);
                setSchoolDialog(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="professions" className="grid gap-6 md:grid-cols-3">
          {professionLines.map((p) => (
            <ProfessionCard
              key={p.id}
              profession={p}
              schoolName={schools.find((s) => s.id === p.school_id)?.name}
              onEdit={() => {
                setEditingItem(p);
                setProfessionDialog(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="roles">
          <ProfessionalRolesPanel />
        </TabsContent>
      </Tabs>

      {/* CRUD Dialogs (B1 & B2 Fix) */}
      <StructuralDialog
        title="School Node"
        open={schoolDialog}
        setOpen={setSchoolDialog}
        onSave={(e) => handleSave(e, "schools", setSchoolDialog)}
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>School Name</Label>
            <Input name="name" defaultValue={editingItem?.name} required />
          </div>
          <div className="grid gap-2">
            <Label>Slug</Label>
            <Input name="slug" defaultValue={editingItem?.slug} required />
          </div>
          <div className="grid gap-2">
            <Label>Parent Academy</Label>
            <Select name="academy_id" defaultValue={editingItem?.academy_id}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {academies.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Executive Goal</Label>
            <Input name="executive_capability_goal" defaultValue={editingItem?.executive_capability_goal} />
          </div>
        </div>
      </StructuralDialog>

      <StructuralDialog
        title="Program Node"
        open={professionDialog}
        setOpen={setProfessionDialog}
        onSave={(e) => handleSave(e, "profession_categories", setProfessionDialog)}
      >
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label>Program Name</Label>
            <Input name="name" defaultValue={editingItem?.name} required />
          </div>
          <div className="grid gap-2">
            <Label>Credit Cost (1 cr = ৳2)</Label>
            <Input type="number" name="credit_cost" defaultValue={editingItem?.credit_cost} required />
          </div>
          <div className="grid gap-2">
            <Label>Parent School</Label>
            <Select name="school_id" defaultValue={editingItem?.school_id}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </StructuralDialog>
    </div>
  );
}

function StructuralDialog({ title, open, setOpen, onSave, children }: any) {
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md rounded-[32px] border-4">
        <form onSubmit={onSave}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-black italic tracking-tighter uppercase">{title}</DialogTitle>
          </DialogHeader>
          <div className="py-6 text-left">{children}</div>
          <DialogFooter>
            <Button type="submit" className="w-full h-12 rounded-xl font-black uppercase text-xs">
              Commit Structure Change
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function AcademyCard({ academy, onEdit }: any) {
  const Icon = getIcon(academy.icon || "building-2");
  return (
    <Card className="rounded-[28px] border-2 bg-card/40 p-5 flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border-2 border-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="text-left">
          <h4 className="font-black uppercase italic text-sm">{academy.name}</h4>
          <Badge variant="outline" className="text-[8px] uppercase">
            {academy.academy_type}
          </Badge>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="opacity-20 group-hover:opacity-100" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
    </Card>
  );
}

function SchoolCard({ school, academyName, onEdit }: any) {
  return (
    <Card className="rounded-[28px] border-2 bg-card/40 p-5 flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border-2 border-emerald-500/20">
          <GraduationCap className="h-5 w-5 text-emerald-500" />
        </div>
        <div className="text-left">
          <h4 className="font-black uppercase italic text-sm">{school.name}</h4>
          <p className="text-[8px] font-bold text-muted-foreground uppercase">{academyName}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="opacity-20 group-hover:opacity-100" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
    </Card>
  );
}

function ProfessionCard({ profession, schoolName, onEdit }: any) {
  return (
    <Card className="rounded-[28px] border-2 bg-card/40 p-5 flex items-center justify-between group">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center border-2 border-orange-500/20">
          <Briefcase className="h-5 w-5 text-orange-500" />
        </div>
        <div className="text-left">
          <h4 className="font-black uppercase italic text-sm">{profession.name}</h4>
          <p className="text-[8px] font-bold text-muted-foreground uppercase">{schoolName || "No School"}</p>
        </div>
      </div>
      <Button variant="ghost" size="icon" className="opacity-20 group-hover:opacity-100" onClick={onEdit}>
        <Pencil className="h-4 w-4" />
      </Button>
    </Card>
  );
}
