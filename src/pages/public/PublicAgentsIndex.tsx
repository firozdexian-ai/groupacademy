import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { PublicLayout } from "@/layouts/PublicLayout";
import { AI_AGENTS } from "@/lib/constants/agents";
import { Sparkles, Bot, ArrowRight, BrainCircuit, Star, Zap } from "lucide-react";

export default function PublicAgentsIndex() {
  const navigate = useNavigate();

  const handleAgentClick = (agentId: string) => {
    navigate(`/auth?returnTo=/app/agents/${agentId}`);
  };

  return (
    <PublicLayout>
      <main className="relative pt-20 pb-32 overflow-hidden selection:bg-primary/10">
        {/* Ambient Radial Gradient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)] pointer-events-none" />

        <div className="container mx-auto px-6 relative z-10">
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto space-y-6 mb-20">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-[0.2em]">
              <BrainCircuit className="w-3.5 h-3.5" /> AI Mentor Network V1.0
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-none">
              Meet Your <span className="text-primary">AI Career Mentors</span>.
            </h1>
            <p className="text-lg text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed">
              Accelerate your professional growth with specialized, round-the-clock AI coaches designed to audit your skills, prepare you for interviews, and negotiate offers.
            </p>
          </div>

          {/* Agents Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {AI_AGENTS.map((agent) => {
              const IconComponent = agent.icon;
              return (
                <Card
                  key={agent.id}
                  className="rounded-[32px] border-border/40 bg-card/45 backdrop-blur-md flex flex-col justify-between hover:border-primary/20 hover:bg-card/65 transition-all duration-300 hover:shadow-xl group overflow-hidden"
                >
                  <div>
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${agent.bgColor || "bg-muted"} ${agent.iconColor || "text-foreground"} group-hover:scale-110 transition-transform duration-300`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-black uppercase tracking-tight">
                            {agent.name}
                          </CardTitle>
                          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-primary mt-0.5">
                            <Star className="w-3 h-3 fill-primary" /> Active Coach
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-8 pb-6 space-y-4">
                      <p className="text-xs text-muted-foreground font-medium leading-relaxed min-h-[40px]">
                        {agent.description}
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-2">
                        {agent.expertise.map((exp, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-muted/50 border border-border/20 text-muted-foreground font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg"
                          >
                            {exp}
                          </span>
                        ))}
                      </div>
                    </CardContent>
                  </div>
                  <CardFooter className="p-8 pt-0">
                    <Button
                      onClick={() => handleAgentClick(agent.id)}
                      className="w-full h-12 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group-hover:bg-primary group-hover:text-primary-foreground"
                      variant="secondary"
                    >
                      Chat with Coach <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          {/* conversion footer */}
          <div className="text-center mt-20 p-8 md:p-12 rounded-[40px] border border-border/40 bg-card/30 max-w-4xl mx-auto backdrop-blur-sm space-y-6">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight uppercase">Ready to get started?</h2>
            <p className="text-xs text-muted-foreground font-medium max-w-lg mx-auto leading-relaxed">
              Create your account now to claim your welcome credits and begin a chat session with any of our specialized AI coaches immediately.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Button
                onClick={() => navigate("/auth?tab=signup")}
                size="lg"
                className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Sign Up for Free
              </Button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" /> Free +250 Credits included
              </div>
            </div>
          </div>
        </div>
      </main>
    </PublicLayout>
  );
}
