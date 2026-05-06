import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Users } from "lucide-react";

export default function LanguagesHub() {
  const { data: languages, isLoading } = useQuery({
    queryKey: ["languages"],
    queryFn: async () => {
      const { data } = await supabase.from("languages").select("*").eq("is_active", true).order("display_order");
      return data ?? [];
    },
  });

  const { data: myLevels } = useQuery({
    queryKey: ["my-language-levels"],
    queryFn: async () => {
      const { data } = await supabase.from("talent_language_levels").select("language_code, cefr_level, source");
      return data ?? [];
    },
  });

  return (
    <div className="px-4 py-4 space-y-3 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Language Lab</h1>
        <p className="text-sm text-muted-foreground">Practice with an AI partner or book live sessions with native instructors.</p>
      </div>

      {isLoading
        ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
        : languages?.map((l) => {
            const myLevel = myLevels?.find((m: any) => m.language_code === l.code);
            return (
              <Card key={l.code} className="p-3">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{l.flag_emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold">{l.name}</div>
                    {myLevel && <Badge variant="secondary" className="text-[10px]">{myLevel.cefr_level} {myLevel.source !== "self" && "✓"}</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Link to={`/app/languages/${l.code}/practice`}>
                    <button className="w-full text-xs bg-primary text-primary-foreground rounded px-2 py-1.5 flex items-center justify-center gap-1"><MessageCircle className="h-3 w-3" />AI Partner</button>
                  </Link>
                  <Link to={`/app/languages/${l.code}/instructors`}>
                    <button className="w-full text-xs border rounded px-2 py-1.5 flex items-center justify-center gap-1"><Users className="h-3 w-3" />Instructors</button>
                  </Link>
                </div>
              </Card>
            );
          })}
    </div>
  );
}
