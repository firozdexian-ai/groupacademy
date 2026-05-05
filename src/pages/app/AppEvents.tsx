import { EventsTab } from "@/components/learning/EventsTab";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE } from "@/lib/uiTokens";

/**
 * Webinars & Events directory — compact mobile-first shell.
 */
export default function AppEvents() {
  const navigate = useNavigate();
  return (
    <div className={PAGE_SHELL}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/app/learning")}
        className="-ml-2 h-9 px-2 text-xs"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>
      <header className="px-1">
        <h1 className={PAGE_TITLE}>Webinars & Events</h1>
        <p className={PAGE_SUBTITLE}>Live sessions, in-person meetups, and competitions.</p>
      </header>
      <main>
        <EventsTab />
      </main>
    </div>
  );
}
