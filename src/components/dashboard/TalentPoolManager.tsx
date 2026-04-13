import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
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
  Download,
  RefreshCw,
  Eye,
  Loader2,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Mic,
  Banknote,
  ClipboardCheck,
  Filter,
  MoreHorizontal,
  Phone,
  UserPlus,
  Mail,
  Upload,
  Linkedin,
  Bot,
  GraduationCap,
  Hand,
  Check,
} from "lucide-react";
import { BatchTalentUpload } from "./BatchTalentUpload";
import { TalentDetailDialog } from "./TalentDetailDialog";
import {
  getOutreachWhatsAppLink,
  getOutreachEmailLink,
  getOutreachLinkedInMessage,
  OutreachProduct,
} from "@/lib/outreachTemplates";
import { COUNTRIES_WITH_PHONE, getCountryFlag } from "@/lib/constants/countries";
import { extractFirstName } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Talent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession_category_id: string | null;
  custom_profession: string | null;
  cv_url: string | null;
  country: string | null;
  user_id: string | null;
  updated_at: string;
  created_at: string;
}

interface OutreachRecord {
  id: string;
  talent_id: string;
  product: string;
  sent_at: string;
}

const ITEMS_PER_PAGE = 10;

export function TalentPoolManager() {
  const isMobile = useIsMobile();
  const [talents, setTalents] = useState<Talent[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);

  const loadTalents = useCallback(async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("talents" as any)
        .select("*", { count: "exact" })
        .order("updated_at", { ascending: false });

      if (searchQuery) query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      if (countryFilter !== "all") query = query.eq("country", countryFilter);
      if (sourceFilter === "registered") query = query.not("user_id", "is", null);
      else if (sourceFilter === "uploaded") query = query.is("user_id", null);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      const result = (await withTimeout(
        query.range(from, to) as any,
        TIMEOUTS.DEFAULT,
        "Loading talent pool timed out",
      )) as { data: Talent[] | null; count: number | null; error: any };

      if (result.error) throw result.error;

      const talentData = result.data || [];
      setTalents(talentData);
      setTotalCount(result.count || 0);

      if (talentData.length > 0) {
        const { data: outData } = await supabase
          .from("outreach_messages" as any)
          .select("id, talent_id, product, sent_at")
          .in(
            "talent_id",
            talentData.map((t) => t.id),
          );

        // CTO Double-Cast to fix TS2352
        setOutreachRecords((outData as unknown as OutreachRecord[]) || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, countryFilter, sourceFilter]);

  useEffect(() => {
    loadTalents();
  }, [loadTalents]);

  const handleOutreach = async (
    talent: Talent,
    product: OutreachProduct,
    channel: "whatsapp" | "email" | "linkedin",
  ) => {
    const firstName = extractFirstName(talent.full_name);
    try {
      if (channel === "whatsapp" && talent.phone) {
        window.open(getOutreachWhatsAppLink(talent.phone, product, firstName, talent.country || undefined), "_blank");
      } else if (channel === "email" && talent.email) {
        window.open(getOutreachEmailLink(talent.email, product, firstName, talent.country || undefined), "_blank");
      } else if (channel === "linkedin") {
        const msg = getOutreachLinkedInMessage(product, firstName, talent.country || undefined);
        await navigator.clipboard.writeText(msg);
        toast.success("LinkedIn message copied!");
      }

      await supabase.from("outreach_messages" as any).insert({
        talent_id: talent.id,
        product,
        channel,
        sent_at: new Date().toISOString(),
      });

      const { data: outData } = await supabase
        .from("outreach_messages" as any)
        .select("id, talent_id, product, sent_at")
        .in(
          "talent_id",
          talents.map((t) => t.id),
        );

      setOutreachRecords((outData as unknown as OutreachRecord[]) || []);
    } catch (err) {
      toast.error("Failed to track outreach");
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <BatchTalentUpload onComplete={loadTalents} />

      <Card className="shadow-sm border-muted">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 font-bold">
              <Users className="w-5 h-5 text-primary" /> Talent Management Pipeline
            </CardTitle>
            <CardDescription>Managing {totalCount} profiles for global activation.</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTalents}
            disabled={isLoading}
            className="rounded-full shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search name, email, profession..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[160px] bg-background">
                  <SelectValue placeholder="Market" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Markets</SelectItem>
                  {COUNTRIES_WITH_PHONE.map((c) => (
                    <SelectItem key={c.code} value={c.name}>
                      {c.flag} {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v)}>
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="uploaded">Uploaded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : (
            <div className="rounded-xl border shadow-sm overflow-hidden bg-white">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="font-bold">Talent</TableHead>
                    <TableHead className="font-bold">Market</TableHead>
                    <TableHead className="font-bold">Status</TableHead>
                    <TableHead className="font-bold">Outreach</TableHead>
                    <TableHead className="text-right font-bold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {talents.map((talent) => (
                    <TableRow key={talent.id} className="hover:bg-muted/5 transition-colors">
                      <TableCell>
                        <div className="font-semibold">{talent.full_name}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{talent.email}</div>
                      </TableCell>
                      <TableCell>
                        {talent.country && (
                          <Badge variant="outline" className="text-[10px] font-medium">
                            {getCountryFlag(talent.country)} {talent.country}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {talent.user_id ? (
                          <Badge className="bg-green-500/10 text-green-700 border-green-200 shadow-none text-[10px]">
                            Registered
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/10 text-amber-700 border-amber-200 shadow-none text-[10px]">
                            Uploaded
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          {outreachRecords.some((r) => r.talent_id === talent.id) ? (
                            <Check className="h-3 w-3 text-primary" />
                          ) : (
                            <Filter className="h-3 w-3" />
                          )}
                          {outreachRecords.filter((r) => r.talent_id === talent.id).length} contact(s)
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <OutreachDropdown
                          talent={talent}
                          onOutreach={handleOutreach}
                          onView={() => setSelectedTalent(talent)}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <p className="text-[11px] text-muted-foreground font-medium">Synced {talents.length} profiles</p>
            <PaginationControls page={page} setPage={setPage} totalPages={Math.ceil(totalCount / ITEMS_PER_PAGE)} />
          </div>
        </CardContent>
      </Card>

      {selectedTalent && (
        <TalentDetailDialog
          open={!!selectedTalent}
          onOpenChange={() => setSelectedTalent(null)}
          talent={selectedTalent}
          talentEmail={selectedTalent.email}
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
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 shadow-xl border-muted">
        <DropdownMenuItem onClick={onView} className="font-medium">
          <Eye className="h-4 w-4 mr-2" /> View Full Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <p className="text-[10px] font-extrabold text-primary px-2 py-1.5 uppercase tracking-widest">
          Global Outreach Tools
        </p>
        <OutreachItem icon={Hand} label="Welcome Message" onClick={(c: any) => onOutreach(talent, "welcome", c)} />
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
    <div className="flex items-center px-2 py-2 text-xs font-semibold hover:bg-muted/50 cursor-default rounded-md group">
      <Icon className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" /> {label}
      <div className="ml-auto flex gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-green-50" onClick={() => onClick("whatsapp")}>
          <MessageSquare className="h-4 w-4 text-green-600" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-50" onClick={() => onClick("email")}>
          <Mail className="h-4 w-4 text-blue-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-indigo-50" onClick={() => onClick("linkedin")}>
          <Linkedin className="h-4 w-4 text-indigo-700" />
        </Button>
      </div>
    </div>
  );
}

function PaginationControls({ page, setPage, totalPages }: any) {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => setPage((p: number) => Math.max(1, p - 1))}
        disabled={page === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="text-[11px] font-bold">
        Page {page} / {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-8"
        onClick={() => setPage((p: number) => Math.min(totalPages, p + 1))}
        disabled={page === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
