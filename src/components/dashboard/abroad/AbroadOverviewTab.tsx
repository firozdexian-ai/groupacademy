import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, GraduationCap, Map, BookOpen, Users, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AbroadOverviewTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["abroad-overview-stats"],
    queryFn: async () => {
      // Execute parallel counts for performance
      const [programs, leads, resources] = await Promise.all([
        supabase.from("study_abroad_programs").select("id", { count: "exact", head: true }),
        supabase.from("study_abroad_roadmaps").select("id", { count: "exact", head: true }),
        supabase.from("ielts_resources").select("id", { count: "exact", head: true }),
      ]);

      return {
        programs: programs.count ?? 0,
        leads: leads.count ?? 0,
        resources: resources.count ?? 0,
      };
    },
  });

  const stats = [
    {
      title: "University Programs",
      value: data?.programs,
      icon: GraduationCap,
      description: "Active international listings",
      color: "text-blue-600",
    },
    {
      title: "Roadmap Leads",
      value: data?.leads,
      icon: Map,
      description: "Al study plans generated",
      color: "text-emerald-600",
    },
    {
      title: "IELTS Resources",
      value: data?.resources,
      icon: BookOpen,
      description: "Prep materials available",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Abroad Operations</h2>
        <p className="text-muted-foreground">Real-time overview of global education programs and student pipelines.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat, index) => (
          <Card key={index} className="overflow-hidden border-border/50 shadow-sm transition-all hover:shadow-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{stat.value?.toLocaleString()}</div>
              )}
              <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-muted/30 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8 text-center">
          <Globe className="h-10 w-10 text-muted-foreground/40 mb-3" />
          <h3 className="font-medium">Market Expansion Insight</h3>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Current data reflects the primary 6 countries. Expand study abroad program entries to target the remaining
            31 configured regions.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
