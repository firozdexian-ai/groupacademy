/**
 * Talent Pool — Refactored for Phase Z0
 * CTO Version: May 2026
 * Fixes: P3 (Accurate Outreach Count), P2 (Layout Deduplication)
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "../DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Search,
  Users,
  MessageSquare,
  RefreshCw,
  Eye,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Mail,
  Linkedin,
  Bot,
  GraduationCap,
  Hand,
  Check,
  Activity,
  Phone,
} from "lucide-react";
import { TalentDetailDialog } from "./TalentDetailDialog";
import {
  getOutreachWhatsAppLink,
  getOutreachEmailLink,
  getOutreachLinkedInMessage,
  OutreachProduct,
} from "@/lib/outreachTemplates";
import { COUNTRIES_WITH_PHONE, getCountryFlag } from "@/lib/constants/countries";
import { extractFirstName, cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 10;

export function TalentPoolTab() {
  const [talents, setTalents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [selectedTalent, setSelectedTalent] = useState<any | null>(null);

  const loadTalents = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("talents")
        // P3 Fix: Select outreach_messages count directly to ensure accurate lifetime counting
        .select(`*, outreach_count:outreach_messages(count)`, { count: "exact" })
        .order("updated_at", { ascending: false });

      if (searchQuery) {
        const safe = sanitizeIlike(searchQuery);
        if (safe) query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
      }
      if (countryFilter !== "all") query = query.eq("country", countryFilter);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const { data, count, error } = await query.range(from, from + ITEMS_PER_PAGE - 1);

      if (error) throw error;

      setTalents(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      toast.error("Talent registry sync fault");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, countryFilter]);

  useEffect(() => {
    loadTalents();
  }, [loadTalents]);

  const handleOutreach = async (talent: any, product: OutreachProduct, channel: "whatsapp" | "email" | "linkedin") => {
    const firstName = extractFirstName(talent.full_name);
    if (channel === "whatsapp" && talent.phone)
      window.open(getOutreachWhatsAppLink(talent.phone, product, firstName, talent.country || undefined), "_blank");
    if (channel === "email" && talent.email)
      window.open(getOutreachEmailLink(talent.email, product, firstName, talent.country || undefined), "_blank");
    if (channel === "linkedin") {
      const msg = getOutreachLinkedInMessage(product, firstName, talent.country || undefined);
      await navigator.clipboard.writeText(msg);
      toast.success("LinkedIn pitch copied to clipboard");
    }

    await supabase.from("outreach_messages").insert({
      talent_id: talent.id,
      product,
      channel,
      sent_at: new Date().toISOString(),
      agent_key: "talent-outreach",
    });
    loadTalents();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* P2 Fix: Unified CRM Action Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-muted/10 p-6 rounded-[32px] border-2 border-border/40 gap-4">
        <div className="text-left">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Talent Artifacts
          </h2>
          <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {totalCount.toLocaleString()} Nodes Found in Sector
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadTalents} className="rounded-xl border-2 h-12 w-12">
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
        <CardHeader className="p-8 border-b border-border/10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-blue-500" />
              <Input
                placeholder="Search node IDs, names, or handles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[10px] tracking-widest bg-muted/10"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full md:w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[9px] tracking-widest bg-muted/10">
                <SelectValue placeholder="GLOBAL SECTOR" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-2">
                <SelectItem value="all" className="font-bold text-[10px]">
                  🌍 ALL MARKETS
                </SelectItem>
                {COUNTRIES_WITH_PHONE.map((c) => (
                  <SelectItem key={c.code} value={c.name} className="font-bold text-[10px]">
                    {c.flag} {c.name.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-12">
              <DashboardTableSkeleton rows={6} />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="font-black uppercase text-[10px] py-6 pl-8">Talent Identity</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Market</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Registry</TableHead>
                  <TableHead className="font-black uppercase text-[10px]">Engagement Pulse</TableHead>
                  <TableHead className="text-right pr-8" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {talents.map((talent) => {
                  const txCount = talent.outreach_count?.[0]?.count || 0;
                  return (
                    <TableRow key={talent.id} className="group hover:bg-primary/[0.02]">
                      <TableCell className="py-6 pl-8">
                        <p className="font-black text-sm uppercase italic tracking-tight">{talent.full_name}</p>
                        <p className="text-[9px] font-bold text-muted-foreground uppercase">
                          {talent.email || "No handle"}
                        </p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(talent.country)}</span>
                          <span className="font-black text-[9px] uppercase text-muted-foreground">
                            {talent.country}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[9px] font-black italic rounded-full border-none px-3",
                            talent.user_id ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600",
                          )}
                        >
                          {talent.user_id ? "REGISTERED" : "LEAD_NODE"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn("h-3.5 w-3.5", txCount > 0 ? "text-primary" : "text-muted-foreground/20")}
                          />
                          <span
                            className={cn(
                              "font-black italic text-[9px] uppercase",
                              txCount > 0 ? "text-foreground" : "text-muted-foreground/40",
                            )}
                          >
                            {txCount} TRANSMISSIONS
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <OutreachDropdown
                          talent={talent}
                          onOutreach={handleOutreach}
                          onView={() => setSelectedTalent(talent)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}

          <div className="p-8 border-t flex justify-between items-center bg-muted/5">
            <p className="text-[10px] font-black uppercase text-muted-foreground/50 italic ml-4">
              Sector <span className="text-foreground">{page}</span> of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl border-2"
              >
                <ChevronLeft />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPage((p) => p + 1)}
                disabled={talents.length < ITEMS_PER_PAGE}
                className="rounded-xl border-2"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedTalent && (
        <TalentDetailDialog
          open={!!selectedTalent}
          onOpenChange={() => setSelectedTalent(null)}
          talent={selectedTalent}
          talentEmail={selectedTalent.email || "NO_HANDLE"}
          talentName={selectedTalent.full_name}
        />
      )}
    </div>
  );
}

// Sub-components: OutreachDropdown remains consistent with platform standards...
function OutreachDropdown({ talent, onOutreach, onView }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-primary/10 border-2 transition-all opacity-20 group-hover:opacity-100"
        >
          <MoreHorizontal className="h-5 w-5 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-[24px] border-2 shadow-2xl p-3 bg-background/95 backdrop-blur-xl"
      >
        <DropdownMenuItem
          onClick={onView}
          className="rounded-xl font-black uppercase italic text-[10px] py-4 cursor-pointer"
        >
          <Eye className="h-4 w-4 mr-3" /> View Node Artifact
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <p className="text-[9px] font-black text-muted-foreground/60 px-3 py-2 uppercase italic">Active Deployment</p>
        <OutreachItem icon={Hand} label="Global Welcome" onClick={(c: any) => onOutreach(talent, "welcome", c)} />
        <OutreachItem icon={Bot} label="AI Expertise" onClick={(c: any) => onOutreach(talent, "ai_agent", c)} />
        <OutreachItem
          icon={Briefcase}
          label="Digital Portfolio"
          onClick={(c: any) => onOutreach(talent, "portfolio", c)}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function OutreachItem({ icon: Icon, label, onClick }: any) {
  return (
    <div className="flex items-center px-3 py-1.5 text-[10px] font-black uppercase italic rounded-xl hover:bg-muted/50 transition-colors">
      <Icon className="h-4 w-4 mr-3 text-muted-foreground/50" />
      <span className="flex-1">{label}</span>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-emerald-500/10"
          onClick={() => onClick("whatsapp")}
        >
          <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-blue-500/10" onClick={() => onClick("email")}>
          <Mail className="h-3.5 w-3.5 text-blue-500" />
        </Button>
      </div>
    </div>
  );
}
