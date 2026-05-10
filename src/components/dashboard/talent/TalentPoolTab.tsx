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

/**
 * Platform Logic: Global CRM Talent Pool
 * 2026 Standard: Blended Phase 6 UI (High-Fidelity Orchestrator)
 */

interface Talent {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  user_id: string | null;
  updated_at: string;
}

const ITEMS_PER_PAGE = 10;

export function TalentPoolTab() {
  const [talents, setTalents] = useState<Talent[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);

  const loadTalents = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchProtocol = async () => {
        let query = supabase.from("talents").select("*", { count: "exact" }).order("updated_at", { ascending: false });

        if (searchQuery) {
          const safe = sanitizeIlike(searchQuery);
          if (safe) query = query.or(`full_name.ilike.%${safe}%,email.ilike.%${safe}%,phone.ilike.%${safe}%`);
        }
        if (countryFilter !== "all") query = query.eq("country", countryFilter);

        const from = (page - 1) * ITEMS_PER_PAGE;
        return await query.range(from, from + ITEMS_PER_PAGE - 1);
      };

      const result = (await withTimeout(fetchProtocol(), TIMEOUTS.DEFAULT, "Talent registry sync timed out")) as {
        data: Talent[] | null;
        count: number | null;
        error: any;
      };

      if (result.error) throw result.error;

      setTalents(result.data || []);
      setTotalCount(result.count || 0);

      if (result.data && result.data.length > 0) {
        const { data: outData } = await supabase
          .from("outreach_messages")
          .select("*")
          .in(
            "talent_id",
            result.data.map((t) => t.id),
          );
        setOutreachRecords(outData || []);
      }
    } catch (err) {
      console.error("Pipeline Fault:", err);
      toast.error("System Error: Failed to sync talent pipeline");
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, countryFilter]);

  useEffect(() => {
    loadTalents();
  }, [loadTalents]);

  const handleOutreach = async (
    talent: Talent,
    product: OutreachProduct,
    channel: "whatsapp" | "email" | "linkedin",
  ) => {
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

    await supabase
      .from("outreach_messages")
      .insert({ talent_id: talent.id, product, channel, sent_at: new Date().toISOString() });
    loadTalents();
  };

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return (
    <div className="space-y-10 animate-in fade-in duration-1000 p-4 md:p-6">
      {/* EXECUTIVE HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-blue-500">
            <Users className="h-8 w-8 text-blue-500 fill-blue-500/20" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none text-foreground">
              Talent Pool
            </h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Global Activation & Outreach Command
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Badge
            variant="outline"
            className="h-14 px-6 rounded-2xl border-2 font-black italic gap-2 text-blue-500 border-blue-500/20 bg-blue-500/10"
          >
            <Activity className="h-4 w-4" /> {totalCount} TOTAL NODES
          </Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={loadTalents}
            className="h-14 w-14 rounded-2xl border-2 hover:bg-blue-500 hover:text-white transition-all text-blue-500 border-blue-500/20 bg-blue-500/10"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </header>

      {/* MASTER GRID */}
      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-400 to-indigo-500" />
        <CardHeader className="p-8 border-b border-border/10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-blue-500 transition-colors" />
              <Input
                placeholder="Search nodes by name, email or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[11px] tracking-widest bg-muted/20"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full md:w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest bg-muted/20">
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
              <DashboardTableSkeleton rows={8} columns={5} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/10 border-b-2 border-border/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                      Talent Artifact
                    </TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Market Node</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Registry Status</TableHead>
                    <TableHead className="font-black uppercase text-[10px] tracking-widest">Engagement Pulse</TableHead>
                    <TableHead className="text-right py-6 pr-8"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/5">
                  {talents.map((talent) => (
                    <TableRow key={talent.id} className="group hover:bg-blue-500/[0.02] transition-colors text-left">
                      <TableCell className="py-6 pl-8">
                        <p className="font-black text-sm uppercase italic tracking-tight group-hover:text-blue-500 transition-colors">
                          {talent.full_name}
                        </p>
                        <div className="flex flex-col gap-1 mt-1">
                          {talent.email && (
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                              <Mail className="h-3 w-3" /> {talent.email}
                            </p>
                          )}
                          {talent.phone && (
                            <p className="text-[9px] font-bold text-blue-500/70 uppercase tracking-widest flex items-center gap-1.5">
                              <Phone className="h-3 w-3" /> {talent.phone}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {talent.country && (
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getCountryFlag(talent.country)}</span>
                            <span className="font-black text-[10px] uppercase italic tracking-tighter text-muted-foreground">
                              {talent.country}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            "font-black text-[9px] uppercase italic rounded-full px-3 py-1 border-none",
                            talent.user_id ? "bg-emerald-500/20 text-emerald-600" : "bg-amber-500/20 text-amber-600",
                          )}
                        >
                          {talent.user_id ? "REGISTERED" : "UPLOADED_LEAD"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Check
                            className={cn(
                              "h-3.5 w-3.5",
                              outreachRecords.some((r) => r.talent_id === talent.id)
                                ? "text-blue-500"
                                : "text-muted-foreground/30",
                            )}
                          />
                          <span
                            className={cn(
                              "font-black italic text-[10px] uppercase",
                              outreachRecords.some((r) => r.talent_id === talent.id)
                                ? "text-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {outreachRecords.filter((r) => r.talent_id === talent.id).length} TRANSMISSIONS
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1 opacity-30 group-hover:opacity-100 transition-opacity">
                          <OutreachDropdown
                            talent={talent}
                            onOutreach={handleOutreach}
                            onView={() => setSelectedTalent(talent)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-8 border-t border-border/10 bg-muted/5">
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 italic">
                Sector <span className="text-foreground">{page}</span> of {totalPages}
              </p>
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-12 w-12 rounded-xl border-2 hover:bg-blue-600 hover:text-white transition-all"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={talents.length < ITEMS_PER_PAGE}
                  className="h-12 w-12 rounded-xl border-2 hover:bg-blue-600 hover:text-white transition-all"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTalent && (
        <TalentDetailDialog
          open={!!selectedTalent}
          onOpenChange={() => setSelectedTalent(null)}
          talent={selectedTalent}
          talentEmail={selectedTalent.email || "NO_EMAIL_PROVIDED"}
          talentName={selectedTalent.full_name}
        />
      )}
    </div>
  );
}

function OutreachDropdown({ talent, onOutreach, onView }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-blue-500/10 border-2 transition-all"
        >
          <MoreHorizontal className="h-5 w-5 text-blue-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 rounded-[24px] border-2 shadow-2xl p-3 bg-background/95 backdrop-blur-xl"
      >
        <DropdownMenuItem
          onClick={onView}
          className="rounded-xl font-black uppercase italic text-[10px] py-4 cursor-pointer focus:bg-blue-500/10 focus:text-blue-600"
        >
          <Eye className="h-4 w-4 mr-3" /> View Full Artifact
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2 bg-border/10" />
        <p className="text-[9px] font-black text-muted-foreground/60 px-3 py-2 uppercase tracking-[0.2em] italic mb-1">
          Service Deployment
        </p>
        <OutreachItem icon={Hand} label="Global Welcome" onClick={(c: any) => onOutreach(talent, "welcome", c)} />
        <OutreachItem icon={Bot} label="AI Expert Pitch" onClick={(c: any) => onOutreach(talent, "ai_agent", c)} />
        <OutreachItem
          icon={GraduationCap}
          label="Course Catalog"
          onClick={(c: any) => onOutreach(talent, "course", c)}
        />
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
    <div className="flex items-center px-3 py-1.5 text-[10px] font-black uppercase italic group rounded-xl hover:bg-muted/50 transition-colors">
      <Icon className="h-4 w-4 mr-3 text-muted-foreground/50 group-hover:text-foreground transition-colors" />{" "}
      <span className="flex-1">{label}</span>
      <div className="flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-emerald-500/10 hover:border-emerald-500/20 border border-transparent"
          onClick={() => onClick("whatsapp")}
        >
          <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/20 border border-transparent"
          onClick={() => onClick("email")}
        >
          <Mail className="h-3.5 w-3.5 text-blue-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-indigo-500/10 hover:border-indigo-500/20 border border-transparent"
          onClick={() => onClick("linkedin")}
        >
          <Linkedin className="h-3.5 w-3.5 text-indigo-500" />
        </Button>
      </div>
    </div>
  );
}

export default TalentPoolTab;
