import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, GraduationCap, Sparkles } from "lucide-react";
import { MyCoursesTab } from "@/components/learning/MyCoursesTab";
import { cn } from "@/lib/utils";

export default function AppMyLearning() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Executive Header */}
      <header className="sticky top-0 z-20 w-full bg-background/80 backdrop-blur-xl border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/app/learning")}
              className="rounded-full hover:bg-primary/5 h-10 w-10 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-lg font-black tracking-tighter leading-none flex items-center gap-2">
                My Academy <GraduationCap className="h-4 w-4 text-primary" />
              </h1>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
                Personal Growth Pipeline
              </p>
            </div>
          </div>

          <div className="h-10 w-10 rounded-2xl bg-primary/5 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-primary/40" />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl mx-auto px-4 py-8 pb-32 animate-in fade-in slide-in-from-bottom-2 duration-700">
        <MyCoursesTab />
      </main>
    </div>
  );
}
