import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function AbroadLanguageLabTab() {
  const { data: languages, isLoading: l1 } = useQuery({
    queryKey: ["admin-languages"],
    queryFn: async () => {
      const { data } = await supabase.from("languages").select("*").order("display_name");
      return data ?? [];
    },
  });

  const { data: instructors, isLoading: l2 } = useQuery({
    queryKey: ["admin-language-instructors"],
    queryFn: async () => {
      const { data } = await supabase.from("language_instructors").select("*").limit(100);
      return data ?? [];
    },
  });

  const { data: bookings, isLoading: l3 } = useQuery({
    queryKey: ["admin-language-bookings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("language_bookings")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return data ?? [];
    },
  });

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-lg font-bold">Language Lab</h2>
        <p className="text-sm text-muted-foreground">Languages catalog, expert roster, and 1:1 bookings.</p>
      </div>

      <Tabs defaultValue="languages">
        <TabsList>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="instructors">Experts</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
        </TabsList>

        <TabsContent value="languages" className="space-y-2 mt-3">
          {l1 ? <Skeleton className="h-32 w-full" /> : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {languages?.map((lng) => (
                <Card key={lng.code} className="p-3 flex items-center gap-2">
                  <div className="text-2xl">{lng.flag_emoji ?? "🌐"}</div>
                  <div className="min-w-0">
                    <div className="font-semibold truncate">{lng.name}</div>
                    <div className="text-xs text-muted-foreground">{lng.code}</div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="instructors" className="space-y-2 mt-3">
          {l2 ? <Skeleton className="h-32 w-full" /> : (
            <div className="space-y-2">
              {instructors?.length === 0 && <Card className="p-4 text-sm text-muted-foreground text-center">No experts onboarded yet.</Card>}
              {instructors?.map((i) => (
                <Card key={i.id} className="p-3 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm truncate">{i.display_name ?? i.user_id?.slice(0,8)}</div>
                    <div className="text-xs text-muted-foreground">{(i.teaches_languages ?? []).join(", ")}</div>
                  </div>
                  <Badge variant={i.is_verified ? "default" : "outline"}>{i.is_verified ? "Verified" : "Pending"}</Badge>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookings" className="space-y-2 mt-3">
          {l3 ? <Skeleton className="h-32 w-full" /> : (
            <div className="space-y-2">
              {bookings?.length === 0 && <Card className="p-4 text-sm text-muted-foreground text-center">No bookings yet.</Card>}
              {bookings?.map((b) => (
                <Card key={b.id} className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{b.language_code?.toUpperCase()} · {b.duration_mins ?? "—"}m</div>
                    <div className="text-xs text-muted-foreground">{b.scheduled_at ? new Date(b.scheduled_at).toLocaleString() : "Unscheduled"}</div>
                  </div>
                  <Badge variant="outline" className="capitalize">{b.status ?? "pending"}</Badge>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
