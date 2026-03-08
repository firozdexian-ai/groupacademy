import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTalent } from "@/hooks/useTalent";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { GigCard } from "@/components/gigs/GigCard";
import { MySubmissions } from "@/components/gigs/MySubmissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Gift, Upload, Briefcase, Share2, FileText, BookOpen, ArrowRight } from "lucide-react";

const CATEGORIES = [
  { key: "all", label: "All", icon: Gift },
  { key: "cv_upload", label: "CV Upload", icon: Upload },
  { key: "job_posting", label: "Job Posting", icon: Briefcase },
  { key: "job_sharing", label: "Job Sharing", icon: Share2 },
  { key: "content_creation", label: "Content", icon: FileText },
  { key: "course_resell", label: "Resell", icon: BookOpen },
];

export default function Gigs() {
  const navigate = useNavigate();
  const { talent } = useTalent();
  const [activeTab, setActiveTab] = useState("gigs");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: gigs, isLoading } = useQuery({
    queryKey: ["gigs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gigs")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Get user's submission counts per gig
  const { data: submissionCounts } = useQuery({
    queryKey: ["gig-submission-counts", talent?.id],
    enabled: !!talent?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gig_submissions")
        .select("gig_id, status")
        .eq("talent_id", talent!.id);
      if (error) throw error;
      const counts: Record<string, { total: number; pending: number }> = {};
      data?.forEach((s: any) => {
        if (!counts[s.gig_id]) counts[s.gig_id] = { total: 0, pending: 0 };
        counts[s.gig_id].total++;
        if (s.status === "pending") counts[s.gig_id].pending++;
      });
      return counts;
    },
  });

  const filteredGigs = gigs?.filter(
    (g: any) => selectedCategory === "all" || g.category === selectedCategory
  );

  return (
    <div className="px-4 md:px-0 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Earn Credits</h1>
          <p className="text-muted-foreground text-sm">
            Complete gigs to earn credits you can use or withdraw
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-1 shrink-0" onClick={() => navigate("/app/marketplace")}>
          Marketplace <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="gigs" className="flex-1">Available Gigs</TabsTrigger>
          <TabsTrigger value="submissions" className="flex-1">My Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="gigs" className="mt-4 space-y-4">
          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <cat.icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 rounded-xl" />
              ))}
            </div>
          ) : filteredGigs?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Gift className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>No gigs available in this category yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredGigs?.map((gig: any) => (
                <GigCard
                  key={gig.id}
                  gig={gig}
                  userSubmissions={submissionCounts?.[gig.id]}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submissions" className="mt-4">
          <MySubmissions talentId={talent?.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
