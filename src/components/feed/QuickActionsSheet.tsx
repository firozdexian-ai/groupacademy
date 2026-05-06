import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bot, LucideIcon } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { iconMap } from "@/lib/iconMap";
import { cn } from "@/lib/utils";

interface QuickActionsSheetProps {
  open: boolean;
  onClose: () => void;
}

interface AgentRow {
  agent_key: string;
  name: string;
  icon: string | null;
  color: string | null;
  bg_color: string | null;
  avatar_url: string | null;
}

export function QuickActionsSheet({ open, onClose }: QuickActionsSheetProps) {
  const navigate = useNavigate();

  const { data: agents = [] } = useQuery({
    queryKey: ["all-quick-agents"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_agents")
        .select("agent_key, name, icon, color, bg_color, avatar_url, total_conversations")
        .eq("is_active", true)
        .order("total_conversations", { ascending: false });
      return (data || []) as AgentRow[];
    },
    enabled: open,
    staleTime: 1000 * 60 * 5,
  });

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[80vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="text-base">All AI agents</SheetTitle>
        </SheetHeader>
        <div className="grid grid-cols-4 gap-3 gap-y-4 mt-4 pb-6">
          {agents.map((a) => {
            const ResolvedIcon = (a.icon && iconMap[a.icon] ? (iconMap[a.icon] as LucideIcon) : Bot);
            return (
              <button
                key={a.agent_key}
                onClick={() => {
                  onClose();
                  navigate(`/app/agents/${a.agent_key}`);
                }}
                className="flex flex-col items-center gap-1.5 outline-none active:scale-95 transition-transform"
              >
                <div
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center border border-border/40 bg-muted/40 overflow-hidden",
                  )}
                  style={a.bg_color ? { backgroundColor: a.bg_color } : {}}
                >
                  {a.avatar_url ? (
                    <img src={a.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <ResolvedIcon className="h-5 w-5" style={{ color: a.color || undefined }} />
                  )}
                </div>
                <span className="text-[10px] font-medium text-center text-muted-foreground line-clamp-2 leading-tight px-0.5">
                  {a.name?.split(" ").slice(0, 2).join(" ") || "Agent"}
                </span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
