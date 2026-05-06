import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export default function LanguageInstructorsPage() {
  const { code } = useParams<{ code: string }>();
  const { data, isLoading } = useQuery({
    queryKey: ["lang-instructors", code],
    queryFn: async () => {
      const { data } = await supabase
        .from("language_instructors")
        .select("*")
        .contains("teaches_languages", [code])
        .eq("is_active", true)
        .order("rating", { ascending: false });
      return data ?? [];
    },
  });

  const book = async (instructorUserId: string) => {
    const when = prompt("Schedule (ISO time, e.g. 2026-05-10T14:00:00Z):");
    if (!when) return;
    const { data, error } = await supabase.functions.invoke("book-language-session", {
      body: { instructor_user_id: instructorUserId, language_code: code, scheduled_at: when, duration_mins: 30 },
    });
    if (error || data?.error) return toast.error(data?.error || error.message);
    toast.success("Booked! Check your sessions.");
  };

  return (
    <div className="px-4 py-4 space-y-3 max-w-3xl mx-auto">
      <h1 className="text-xl font-bold uppercase">{code} Instructors</h1>
      {isLoading
        ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
        : data?.length === 0
        ? <Card className="p-6 text-center text-sm text-muted-foreground">No instructors yet for this language.</Card>
        : data?.map((i) => (
            <Card key={i.id} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{i.display_name}</div>
                  <div className="text-xs text-muted-foreground">Native: {i.native_language ?? "—"}</div>
                  {i.is_verified && <Badge variant="secondary" className="text-[10px] mt-1">Verified</Badge>}
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold">{i.hourly_rate_credits} cr/hr</div>
                  <Button size="sm" className="mt-1" onClick={() => book(i.user_id)}>Book 30min</Button>
                </div>
              </div>
              {i.bio && <div className="text-xs text-muted-foreground mt-2 line-clamp-2">{i.bio}</div>}
            </Card>
          ))}
    </div>
  );
}
