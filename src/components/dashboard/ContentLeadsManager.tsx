import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

interface Lead {
  id: string;
  user_id: string;
  scope_school_id: string | null;
  talent?: { full_name: string | null; email: string | null } | null;
  school?: { name: string | null } | null;
}

interface School {
  id: string;
  name: string;
}

export function ContentLeadsManager() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [schoolId, setSchoolId] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: roles }, { data: sch }] = await Promise.all([
      supabase
        .from("user_roles")
        .select("id, user_id, scope_school_id")
        .eq("role", "content_lead" as any),
      supabase.from("schools").select("id, name").order("name"),
    ]);

    const userIds = (roles || []).map((r: any) => r.user_id);
    const schoolIds = (roles || []).map((r: any) => r.scope_school_id).filter(Boolean);

    const [{ data: talents }, { data: schoolDetails }] = await Promise.all([
      userIds.length
        ? supabase.from("talents").select("user_id, full_name, email").in("user_id", userIds)
        : Promise.resolve({ data: [] as any[] } as any),
      schoolIds.length
        ? supabase.from("schools").select("id, name").in("id", schoolIds)
        : Promise.resolve({ data: [] as any[] } as any),
    ]);

    const tMap = new Map((talents || []).map((t: any) => [t.user_id, t]));
    const sMap = new Map((schoolDetails || []).map((s: any) => [s.id, s]));

    setLeads(
      (roles || []).map((r: any) => ({
        ...r,
        talent: tMap.get(r.user_id) || null,
        school: r.scope_school_id ? sMap.get(r.scope_school_id) || null : null,
      })),
    );
    setSchools((sch as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addLead = async () => {
    if (!email.trim()) return toast.error("Enter the talent's email.");
    setBusy(true);
    const { data: talent, error: tErr } = await supabase
      .from("talents")
      .select("user_id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();
    if (tErr || !talent?.user_id) {
      setBusy(false);
      return toast.error("No talent with that email.");
    }
    const { error } = await supabase.from("user_roles").insert({
      user_id: talent.user_id,
      role: "content_lead" as any,
      scope_school_id: schoolId || null,
    } as any);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Content lead added.");
    setEmail("");
    setSchoolId("");
    load();
  };

  const removeLead = async (id: string) => {
    const { error } = await supabase.from("user_roles").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Removed.");
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold">Content leads</h2>
        <p className="text-xs text-muted-foreground">
          Hire a talent to fill a school's missing resources. Leave the school empty for cross-school leads.
        </p>
      </div>

      <Card className="p-4 space-y-3">
        <p className="text-sm font-semibold">Add a content lead</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr,1fr,auto] gap-2">
          <Input
            placeholder="Talent email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <select
            className="h-10 rounded-md border bg-background px-3 text-sm"
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
          >
            <option value="">All schools</option>
            {schools.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button onClick={addLead} disabled={busy}>Add</Button>
        </div>
      </Card>

      {loading ? (
        <Skeleton className="h-40 w-full rounded-xl" />
      ) : leads.length === 0 ? (
        <Card className="p-4 text-sm text-muted-foreground">No content leads yet.</Card>
      ) : (
        <div className="space-y-2">
          {leads.map((l) => (
            <Card key={l.id} className="p-3 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{l.talent?.full_name || l.talent?.email || l.user_id}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {l.talent?.email || ""} · Scope: {l.school?.name || "All schools"}
                </p>
              </div>
              <Button size="icon" variant="ghost" onClick={() => removeLead(l.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default ContentLeadsManager;
