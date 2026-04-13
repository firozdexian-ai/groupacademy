import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
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
  Filter,
} from "lucide-react";
import { TalentDetailDialog } from "./TalentDetailDialog";
import {
  getOutreachWhatsAppLink,
  getOutreachEmailLink,
  getOutreachLinkedInMessage,
  OutreachProduct,
} from "@/lib/outreachTemplates";
import { COUNTRIES_WITH_PHONE, getCountryFlag } from "@/lib/constants/countries";
import { extractFirstName } from "@/lib/utils";

interface Talent {
  id: string;
  full_name: string;
  email: string;
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
      let query = supabase
        .from("talents" as any)
        .select("*", { count: "exact" })
        .order("updated_at", { ascending: false });
      if (searchQuery) query = query.or(`full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%`);
      if (countryFilter !== "all") query = query.eq("country", countryFilter);

      const from = (page - 1) * ITEMS_PER_PAGE;
      const result = (await withTimeout(
        query.range(from, from + ITEMS_PER_PAGE - 1) as any,
        TIMEOUTS.DEFAULT,
        "Timeout",
      )) as any;

      setTalents(result.data || []);
      setTotalCount(result.count || 0);

      if (result.data?.length > 0) {
        const { data: outData } = await supabase
          .from("outreach_messages" as any)
          .select("*")
          .in(
            "talent_id",
            result.data.map((t: any) => t.id),
          );
        setOutreachRecords(outData || []);
      }
    } catch (err) {
      toast.error("Failed to sync talent pipeline");
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
      .from("outreach_messages" as any)
      .insert({ talent_id: talent.id, product, channel, sent_at: new Date().toISOString() });
    loadTalents();
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-sm border-muted bg-card">
        <CardHeader className="pb-3 border-b border-muted/50 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2 font-bold text-foreground">
              <Users className="w-5 h-5 text-primary" /> Talent Management Pipeline
            </CardTitle>
            <CardDescription className="text-muted-foreground font-medium">
              Managing {totalCount} profiles for global activation.
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadTalents}
            disabled={isLoading}
            className="rounded-full hover:bg-muted"
          >
            <RefreshCw className={`h-4 w-4 text-foreground ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>

        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/20 border-muted-foreground/20 text-foreground"
              />
            </div>
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[180px] bg-muted/20 border-muted-foreground/20 text-foreground">
                <SelectValue placeholder="All Markets" />
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
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={8} columns={5} />
          ) : (
            <div className="rounded-lg border border-muted/50 overflow-hidden bg-background">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent border-muted/50">
                    <TableHead className="text-foreground font-bold py-3">Talent Info</TableHead>
                    <TableHead className="text-foreground font-bold">Market</TableHead>
                    <TableHead className="text-foreground font-bold">Registration</TableHead>
                    <TableHead className="text-foreground font-bold">Engagement</TableHead>
                    <TableHead className="text-right text-foreground font-bold px-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {talents.map((talent) => (
                    <TableRow
                      key={talent.id}
                      className="border-muted/30 hover:bg-muted/10 transition-colors duration-200"
                    >
                      <TableCell className="py-3">
                        <div className="font-bold text-foreground">{talent.full_name}</div>
                        <div className="text-[11px] text-muted-foreground font-medium">{talent.email}</div>
                      </TableCell>
                      <TableCell>
                        {talent.country && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-bold bg-muted/50 border-none text-foreground px-2 py-0.5 rounded-full"
                          >
                            {getCountryFlag(talent.country)} {talent.country}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            talent.user_id
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }
                        >
                          {talent.user_id ? "Registered" : "Uploaded"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <Check
                            className={`h-3.5 w-3.5 ${outreachRecords.some((r) => r.talent_id === talent.id) ? "text-primary" : "text-muted-foreground/30"}`}
                          />
                          {outreachRecords.filter((r) => r.talent_id === talent.id).length} contact(s)
                        </div>
                      </TableCell>
                      <TableCell className="text-right px-4">
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

          <div className="flex justify-between items-center mt-6">
            <p className="text-xs text-muted-foreground font-bold">
              Page {page} of {Math.ceil(totalCount / ITEMS_PER_PAGE)}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 border-muted/50 hover:bg-muted text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={talents.length < ITEMS_PER_PAGE}
                className="h-8 border-muted/50 hover:bg-muted text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
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
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-muted transition-colors">
          <MoreHorizontal className="h-5 w-5 text-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 shadow-2xl border-muted bg-card">
        <DropdownMenuItem onClick={onView} className="font-bold text-foreground py-2 focus:bg-muted cursor-pointer">
          <Eye className="h-4 w-4 mr-2" /> View Full Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-muted" />
        <p className="text-[10px] font-extrabold text-primary px-3 py-2 uppercase tracking-[0.1em]">Service Pitches</p>
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
    <div className="flex items-center px-3 py-2 text-xs font-bold text-foreground hover:bg-muted/50 cursor-default rounded-md group">
      <Icon className="h-4 w-4 mr-2 text-muted-foreground group-hover:text-primary transition-colors" /> {label}
      <div className="ml-auto flex gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-green-500/20"
          onClick={() => onClick("whatsapp")}
        >
          <MessageSquare className="h-4 w-4 text-emerald-500" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-500/20" onClick={() => onClick("email")}>
          <Mail className="h-4 w-4 text-blue-400" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 hover:bg-indigo-500/20"
          onClick={() => onClick("linkedin")}
        >
          <Linkedin className="h-4 w-4 text-indigo-400" />
        </Button>
      </div>
    </div>
  );
}
