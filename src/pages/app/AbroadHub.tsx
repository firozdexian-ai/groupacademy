import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Plane, Languages, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AbroadHub() {
  const { data: countries, isLoading } = useQuery({
    queryKey: ["destination-agents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("destination_agents")
        .select("*")
        .eq("is_active", true)
        .order("display_order");
      return data ?? [];
    },
  });

  return (
    <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Career Abroad</h1>
        <p className="text-sm text-muted-foreground">Pick a destination to chat with its agent and build your roadmap.</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link to="/app/abroad/ielts" className="block">
          <Card className="p-3 flex items-center gap-2 hover:bg-muted/50">
            <Mic className="h-5 w-5 text-primary" />
            <div className="text-sm font-semibold">IELTS Coach</div>
          </Card>
        </Link>
        <Link to="/app/languages" className="block">
          <Card className="p-3 flex items-center gap-2 hover:bg-muted/50">
            <Languages className="h-5 w-5 text-primary" />
            <div className="text-sm font-semibold">Language Lab</div>
          </Card>
        </Link>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Destinations</h2>
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          : countries?.map((c) => (
              <Link key={c.country_code} to={`/app/abroad/destinations/${c.country_code}`}>
                <Card className="p-3 flex items-center gap-3 hover:bg-muted/50">
                  <div className="text-3xl">{c.flag_emoji ?? "🌍"}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{c.display_name}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{c.tagline}</div>
                  </div>
                  <Plane className="h-4 w-4 text-muted-foreground" />
                </Card>
              </Link>
            ))}
      </div>

      <Link to="/app/abroad/applications">
        <Button variant="outline" className="w-full">My Applications</Button>
      </Link>
    </div>
  );
}
