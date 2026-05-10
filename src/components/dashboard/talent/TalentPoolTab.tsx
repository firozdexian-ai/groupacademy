import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { sanitizeIlike } from "@/lib/supabaseQuery";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Zap,
  Activity,
  ShieldCheck,
  Globe,
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
 * GroUp Academy: Talent Pool Management Pipeline
 * CTO Reference: High-fidelity orchestrator for lead activation and outreach telemetry.
 * Updated: Added Phone-First Telemetry for Shomvob/B2B Database Ingestions.
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

export function TalentPoolManager() {
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
          // UPGRADE: Added phone number indexing for CSV datasets
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
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* EXECUTIVE HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 bg-muted/20 p-8 rounded-[40px] border-2 border-border/40 backdrop-blur-md">
        <div className="space-y-1 text-left">
          <div className="flex items-center gap-3 text-primary">
            <Users className="h-8 w-8" />
            <h2 className="text-4xl font-black uppercase tracking-tighter italic leading-none">Talent Pipeline</h2>
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 italic">
            Global Activation & Outreach Command Center
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-14 px-6 rounded-2xl border-2 font-black italic gap-2 text-primary">
            <Activity className="h-4 w-4" /> {totalCount} TOTAL NODES
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadTalents}
            className="h-14 w-14 rounded-2xl border-2 hover:bg-primary/5"
          >
            <RefreshCw className={cn("h-5 w-5", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      <Card className="rounded-[40px] border-2 border-border/40 bg-card/30 shadow-2xl overflow-hidden">
        <CardHeader className="p-8 border-b border-border/10 bg-muted/10">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input
                placeholder="SEARCH NODES BY NAME, EMAIL OR PHONE..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-14 rounded-2xl border-2 pl-12 font-bold uppercase text-[11px] tracking-widest bg-card/50"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-full md:w-[240px] h-14 rounded-2xl border-2 font-black uppercase text-[10px] tracking-widest">
                <SelectValue placeholder="GLOBAL SECTOR" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-2">
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
            <div className="p-8">
              <DashboardTableSkeleton rows={8} columns={5} />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow className="hover:bg-transparent border-b-2">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-6 pl-8">
                    Talent Artifact
                  </TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Market Node</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Registry Status</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Engagement Pulse</TableHead>
                  <TableHead className="text-right py-6 pr-8"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {talents.map((talent) => (
                  <TableRow
                    key={talent.id}
                    className="group border-b border-border/5 hover:bg-muted/10 transition-colors"
                  >
                    <TableCell className="py-6 pl-8">
                      <p className="font-black text-sm uppercase italic tracking-tight">{talent.full_name}</p>
                      <div className="flex flex-col gap-1 mt-1">
                        {talent.email && (
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest italic flex items-center gap-1.5">
                            <Mail className="h-3 w-3" /> {talent.email}
                          </p>
                        )}
                        {talent.phone && (
                          <p className="text-[9px] font-bold text-primary/70 uppercase tracking-widest italic flex items-center gap-1.5">
                            <Phone className="h-3 w-3" /> {talent.phone}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {talent.country && (
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCountryFlag(talent.country)}</span>
                          <span className="font-black text-[10px] uppercase italic tracking-tighter">
                            {talent.country}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={cn(
                          "font-black text-[9px] uppercase italic rounded-full px-4 border-2",
                          talent.user_id
                            ? "bg-green-500/10 text-green-600 border-green-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20",
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
                              ? "text-primary"
                              : "text-muted-foreground/20",
                          )}
                        />
                        <span className="font-black italic text-[10px] uppercase">
                          {outreachRecords.filter((r) => r.talent_id === talent.id).length} TRANSMISSIONS
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1 opacity-20 group-hover:opacity-100 transition-opacity">
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
          )}

          {/* PAGINATION FOOTER */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-6 border-t border-border/10 bg-muted/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic">
                Sector {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-10 rounded-xl border-2 font-black uppercase text-[10px]"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" /> PREV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={talents.length < ITEMS_PER_PAGE}
                  className="h-10 rounded-xl border-2 font-black uppercase text-[10px]"
                >
                  NEXT <ChevronRight className="h-4 w-4 ml-2" />
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
        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-primary/10 transition-all">
          <MoreHorizontal className="h-5 w-5 text-primary" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64 rounded-2xl border-2 shadow-2xl p-2 bg-background">
        <DropdownMenuItem
          onClick={onView}
          className="rounded-xl font-black uppercase italic text-[10px] py-3 cursor-pointer"
        >
          <Eye className="h-4 w-4 mr-3 text-primary" /> View Full Artifact
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-2" />
        <p className="text-[9px] font-black text-primary/40 px-3 py-2 uppercase tracking-[0.2em] italic">
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
    <div className="flex items-center px-3 py-1 text-[10px] font-black uppercase italic group rounded-xl hover:bg-muted/50 transition-colors">
      <Icon className="h-3.5 w-3.5 mr-3 text-muted-foreground group-hover:text-primary transition-colors" /> {label}
      <div className="ml-auto flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-green-500/10"
          onClick={() => onClick("whatsapp")}
        >
          <MessageSquare className="h-3.5 w-3.5 text-green-600" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-blue-500/10"
          onClick={() => onClick("email")}
        >
          <Mail className="h-3.5 w-3.5 text-blue-500" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-lg hover:bg-indigo-500/10"
          onClick={() => onClick("linkedin")}
        >
          <Linkedin className="h-3.5 w-3.5 text-indigo-500" />
        </Button>
      </div>
    </div>
  );
}
