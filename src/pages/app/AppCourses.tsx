import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, Sparkles } from "lucide-react";
import { CoursesTab } from "@/components/learning/CoursesTab";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function AppCourses() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
      {/* Navigation & Context */}
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/app/learning")}
            className="rounded-full h-10 pl-2 pr-4 font-bold text-xs uppercase tracking-widest hover:bg-primary/5 -ml-2 transition-all"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Hub
          </Button>

          <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-widest px-3 py-1">
            <Sparkles className="w-3 h-3 mr-1.5" /> Premium Catalog
          </Badge>
        </div>

        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
            Academy Courses <BookOpen className="h-6 w-6 text-primary/40" />
          </h1>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
            Self-paced professional certification & workshops
          </p>
        </div>
      </div>

      {/* Hardened Courses Grid */}
      <main className="min-h-[60vh]">
        <CoursesTab />
      </main>
    </div>
  );
}
