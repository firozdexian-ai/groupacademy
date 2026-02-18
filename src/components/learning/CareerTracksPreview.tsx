import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Target, Briefcase, Building2, Code, HeartPulse, Megaphone, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionHeader } from "@/components/ui/section-header";
import { supabase } from "@/integrations/supabase/client";

// Icon mapping for profession categories
const PROFESSION_ICONS: Record<string, React.ElementType> = {
  sales: Megaphone,
  banking: Building2,
  finance: DollarSign,
  tech: Code,
  healthcare: HeartPulse,
  default: Briefcase,
};

function getIconForCategory(name: string): React.ElementType {
  const lowerName = name.toLowerCase();
  for (const [key, icon] of Object.entries(PROFESSION_ICONS)) {
    if (lowerName.includes(key)) return icon;
  }
  return PROFESSION_ICONS.default;
}

// Color palette for track cards
const TRACK_COLORS = [
  "bg-primary/10 text-primary",
  "bg-accent/10 text-accent-foreground",
  "bg-muted text-foreground",
  "bg-secondary/50 text-secondary-foreground",
];

export function CareerTracksPreview() {
  const navigate = useNavigate();

  const { data: tracks = [], isLoading } = useQuery({
    queryKey: ["career-tracks-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profession_categories")
        .select("id, name, slug, icon, description")
        .eq("is_active", true)
        .order("display_order")
        .limit(6);

      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-8 w-20" />
        </div>
        <div className="flex gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-32 rounded-xl shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (tracks.length === 0) return null;

  return (
    <section className="space-y-3">
      <SectionHeader
        icon={Target}
        title="Career Tracks"
        viewAllPath="/app/learning/tracks"
      />

      <ScrollArea className="w-full -mx-4 px-4">
        <div className="flex gap-3 pb-2">
          {tracks.map((track, index) => {
            const Icon = getIconForCategory(track.name);
            const colorClass = TRACK_COLORS[index % TRACK_COLORS.length];

            return (
              <Card
                key={track.id}
                className="cursor-pointer hover:shadow-lg transition-all shrink-0 w-28 sm:w-32 active:scale-[0.98]"
                onClick={() => navigate(`/app/learning/tracks/${track.slug}`)}
              >
                <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                  <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <p className="font-medium text-xs line-clamp-2">{track.name}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" className="invisible" />
      </ScrollArea>
    </section>
  );
}
