import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import {
  Building2,
  User,
  GraduationCap,
  Layers,
  Briefcase,
  ArrowRight,
  MessageSquare,
  Activity,
  Newspaper,
  Bot,
  Users,
  Search as SearchIcon,
  Package,
  CreditCard,
} from "lucide-react";

const NAV_ITEMS = [
  { url: "/gro10x/inbox", label: "Inbox", icon: MessageSquare },
  { url: "/gro10x/work", label: "Activities", icon: Activity },
  { url: "/gro10x/learn", label: "Learn", icon: GraduationCap },
  { url: "/gro10x/feed", label: "Feed", icon: Newspaper },
  { url: "/gro10x/page", label: "Company Page", icon: Building2 },
  { url: "/gro10x/agents", label: "Agents", icon: Bot },
  { url: "/gro10x/crm", label: "CRM", icon: Users },
  { url: "/gro10x/sourcing", label: "Sourcing", icon: SearchIcon },
  { url: "/gro10x/offerings", label: "Offerings", icon: Package },
  { url: "/gro10x/learn/ops", label: "Learning Ops", icon: Briefcase },
  { url: "/gro10x/billing", label: "Billing", icon: CreditCard },
];

const ICONS: Record<string, any> = {
  company: Building2,
  talent: User,
  course: GraduationCap,
  track: Layers,
  job: Briefcase,
};

interface SearchResult {
  kind: string;
  id: string;
  title: string;
  subtitle?: string | null;
  url: string;
}

export function Gro10xCommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Record<string, SearchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Debounced search
  useEffect(() => {
    if (q.trim().length < 2) {
      setResults({});
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase.rpc("gro10x_global_search", {
        _q: q,
        _limit: 6,
      });
      const d = (data ?? {}) as any;
      setResults({
        company: d.companies ?? [],
        talent: d.talents ?? [],
        course: d.courses ?? [],
        track: d.tracks ?? [],
        job: d.jobs ?? [],
      });
      setLoading(false);
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  const go = useCallback(
    (url: string) => {
      setOpen(false);
      setQ("");
      navigate(url);
    },
    [navigate],
  );

  const filteredNav = NAV_ITEMS.filter((n) =>
    q.length < 2 ? true : n.label.toLowerCase().includes(q.toLowerCase()),
  );

  const groupOrder: Array<[string, string]> = [
    ["company", "Companies"],
    ["talent", "Talents"],
    ["job", "Jobs"],
    ["track", "Tracks"],
    ["course", "Courses"],
  ];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Search companies, talents, jobs, courses…"
        value={q}
        onValueChange={setQ}
      />
      <CommandList>
        <CommandEmpty>
          {loading ? "Searching…" : "No results found."}
        </CommandEmpty>

        <CommandGroup heading="Navigate">
          {filteredNav.map((item) => {
            const Icon = item.icon;
            return (
              <CommandItem
                key={item.url}
                value={`nav-${item.label}`}
                onSelect={() => go(item.url)}
              >
                <Icon className="mr-2 h-4 w-4" />
                {item.label}
                <ArrowRight className="ml-auto h-3 w-3 opacity-40" />
              </CommandItem>
            );
          })}
        </CommandGroup>

        {groupOrder.map(([kind, heading]) => {
          const items = results[kind] ?? [];
          if (!items.length) return null;
          const Icon = ICONS[kind];
          return (
            <div key={kind}>
              <CommandSeparator />
              <CommandGroup heading={heading}>
                {items.map((r) => (
                  <CommandItem
                    key={`${kind}-${r.id}`}
                    value={`${kind}-${r.id}-${r.title}`}
                    onSelect={() => go(r.url)}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{r.title}</span>
                      {r.subtitle && (
                        <span className="text-[11px] text-muted-foreground truncate">
                          {r.subtitle}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
