import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { getIcon } from "@/lib/iconMap";
import { useTalent } from "@/hooks/useTalent";
import { ArrowLeft, ArrowRight, Bot, Briefcase, GraduationCap, UserPlus, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  slug: string;
  description: string;
  academies: { name: string; slug: string } | null;
}

interface ProfessionLine {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  career_outcome: string;
  school_id: string;
  ai_instructors: { id: string; name: string } | { id: string; name: string }[] | null;
}

export default function SchoolDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [school, setSchool] = useState<School | null>(null);
  const [professions, setProfessions] = useState<ProfessionLine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());

  const [openProfession, setOpenProfession] = useState<ProfessionLine | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (slug) loadData();
  }, [slug]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .select("*, academies(name, slug)")
        .eq("slug", slug)
        .maybeSingle();
      if (schoolError) throw schoolError;
      if (!schoolData) throw new Error("School not found");
      setSchool(schoolData as School);

      const { data: professionData } = await supabase
        .from("profession_categories")
        .select("*, ai_instructors(id, name)")
        .eq("school_id", schoolData.id)
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      setProfessions((professionData as unknown as ProfessionLine[]) || []);

      if (talent?.id) {
        const { data: existing } = await supabase
          .from("instructor_connection_requests" as any)
          .select("profession_id")
          .eq("talent_id", talent.id)
          .eq("school_id", schoolData.id);
        setRequestedIds(new Set(((existing as any[]) || []).map((r) => r.profession_id).filter(Boolean)));
      }
    } catch (err: any) {
      console.error("[SchoolDetail] load error:", err);
      toast.error(err.message || "Couldn't load school");
    } finally {
      setIsLoading(false);
    }
  };

  const getInstructor = (p: ProfessionLine): { id: string; name: string } | null => {
    if (!p.ai_instructors) return null;
    if (Array.isArray(p.ai_instructors)) return p.ai_instructors[0] || null;
    return p.ai_instructors;
  };

  const submitRequest = async () => {
    if (!talent?.id || !openProfession || !school) return;
    setSubmitting(true);
    try {
      const instructor = getInstructor(openProfession);
      const { error } = await supabase.from("instructor_connection_requests" as any).insert({
        talent_id: talent.id,
        school_id: school.id,
        profession_id: openProfession.id,
        instructor_id: instructor?.id || null,
        message: message.trim() || null,
      } as any);
      if (error) throw error;
      setRequestedIds((prev) => new Set([...prev, openProfession.id]));
      toast.success("Request sent. We'll notify you when an instructor responds.");
      setOpenProfession(null);
      setMessage("");
    } catch (err: any) {
      toast.error(err.message || "Couldn't send request");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 py-3 space-y-4">
        <Skeleton className="h-8 w-32 rounded-lg" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!school) {
    return (
      <div className="max-w-4xl mx-auto px-3 py-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">School not found.</p>
        <Button size="sm" onClick={() => navigate("/app/learning?tab=tracks")}>Back to Career Path</Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 py-3 pb-28 space-y-4">
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/learning?tab=tracks")} className="-ml-2 text-muted-foreground">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Career Path
      </Button>

      <header className="space-y-2 px-1">
        {school.academies && (
          <Badge variant="outline" className="text-[10px]">
            <GraduationCap className="h-3 w-3 mr-1" /> {school.academies.name}
          </Badge>
        )}
        <h1 className="text-xl font-bold leading-tight">{school.name}</h1>
        {school.description && <p className="text-sm text-muted-foreground">{school.description}</p>}
      </header>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold px-1">Specialized tracks</h2>

        {professions.length === 0 ? (
          <div className="py-12 text-center border border-dashed rounded-2xl">
            <p className="text-sm text-muted-foreground">Tracks coming soon for this school.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {professions.map((profession) => {
              const Icon = getIcon(profession.icon) || Briefcase;
              const instructor = getInstructor(profession);
              const alreadyRequested = requestedIds.has(profession.id);

              return (
                <Card key={profession.id} className="rounded-2xl border border-border/40 overflow-hidden">
                  <CardContent className="p-3 space-y-2.5">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold leading-tight">{profession.name}</p>
                        {instructor && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Bot className="h-3 w-3" /> {instructor.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {profession.description && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{profession.description}</p>
                    )}

                    {profession.career_outcome && (
                      <p className="text-[11px] font-medium text-foreground line-clamp-1">
                        → {profession.career_outcome}
                      </p>
                    )}

                    <div className="flex gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        onClick={() => navigate(`/app/learning/tracks/${profession.slug}`)}
                      >
                        Explore <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 h-8 text-xs"
                        disabled={alreadyRequested || !talent?.id}
                        onClick={() => {
                          if (!talent?.id) {
                            navigate("/auth");
                            return;
                          }
                          setOpenProfession(profession);
                        }}
                      >
                        {alreadyRequested ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Requested
                          </>
                        ) : (
                          <>
                            <UserPlus className="h-3 w-3 mr-1" /> Connect
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!openProfession} onOpenChange={(o) => !o && setOpenProfession(null)}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Request to connect</DialogTitle>
          </DialogHeader>
          {openProfession && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Tell the instructor for <span className="font-semibold text-foreground">{openProfession.name}</span> why you're interested. We'll notify you when they respond.
              </p>
              <Textarea
                placeholder="I'm interested because..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenProfession(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitRequest} disabled={submitting}>
              {submitting ? "Sending…" : "Send request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
