import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { JobPreferencesSheet } from "./JobPreferencesSheet";

export function JobsHubHeader() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [prefsOpen, setPrefsOpen] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/app/jobs/all?q=${encodeURIComponent(q)}` : "/app/jobs/all");
  };

  return (
    <header className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Jobs Hub</h1>
          <p className="text-sm text-muted-foreground">Browse roles, companies and locations.</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1.5"
          onClick={() => navigate("/app/jobs/all")}
        >
          <ListFilter className="h-3.5 w-3.5" /> View all
        </Button>
      </div>

      <form onSubmit={onSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search jobs, companies, skills…"
            className="pl-9 h-10"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => setPrefsOpen(true)}
          aria-label="Job preferences"
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>

      <JobPreferencesSheet open={prefsOpen} onOpenChange={setPrefsOpen} />
    </header>
  );
}
