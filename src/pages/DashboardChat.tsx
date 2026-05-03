/**
 * Dashboard / Chat — WhatsApp-style unified conversational agent surface.
 * Sibling to the data-heavy `/dashboard`. All admin AI agents live here
 * with persistent per-admin threads.
 */
import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AgentRail } from "@/components/dashboard/chat/AgentRail";
import { ChatThread } from "@/components/dashboard/chat/ChatThread";
import { useAdminThreads } from "@/hooks/useAdminChatThread";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { ADMIN_AGENTS, ADMIN_AGENTS_BY_KEY } from "@/lib/adminAgents";

export default function DashboardChat() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialAgent = searchParams.get("agent");
  const [activeKey, setActiveKey] = useState<string | null>(
    initialAgent && ADMIN_AGENTS_BY_KEY[initialAgent] ? initialAgent : ADMIN_AGENTS[0].key,
  );
  const { threads, reload } = useAdminThreads();

  useEffect(() => {
    if (activeKey) setSearchParams({ agent: activeKey }, { replace: true });
  }, [activeKey, setSearchParams]);

  const isDesktop = useMediaQuery("(min-width: 768px)");
  const showThread = activeKey !== null;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* top bar */}
      <header className="h-14 border-b border-border/40 px-4 flex items-center gap-3 bg-card/40 backdrop-blur flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/dashboard")}
          title="Back to dashboard"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <MessageCircle className="h-5 w-5 text-primary" />
        <div className="flex-1">
          <div className="font-bold text-sm">Agentic Dashboard</div>
          <div className="text-[11px] text-muted-foreground">
            All conversational agents · persistent threads
          </div>
        </div>
      </header>

      {/* body */}
      <div className="flex-1 min-h-0 flex">
        <aside
          className={`${
            showThread ? "hidden md:flex" : "flex"
          } w-full md:w-[320px] flex-col border-r border-border/40 bg-card/30 flex-shrink-0`}
        >
          <AgentRail
            activeKey={activeKey}
            threads={threads}
            onSelect={(k) => setActiveKey(k)}
          />
        </aside>
        <main className={`${showThread ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col`}>
          {activeKey ? (
            <ChatThread agentKey={activeKey} onAfterSend={reload} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
              Select an agent to start chatting
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
