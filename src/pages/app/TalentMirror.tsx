import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TalentMirrorPanel } from "@/components/learning/TalentMirrorPanel";
import { SkillCredentialsPanel } from "@/components/learning/SkillCredentialsPanel";

export default function TalentMirror() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background pb-safe-bottom">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border/40 px-4 py-3 flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-base font-black">Talent Mirror</h1>
          <p className="text-[11px] text-muted-foreground">Your mastery across every program.</p>
        </div>
      </header>
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        <SkillCredentialsPanel />
        <TalentMirrorPanel />
      </div>
    </div>
  );
}
