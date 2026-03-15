import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { withTimeout } from "@/hooks/useQueryWithTimeout";
import { TIMEOUTS } from "@/lib/timeoutConfig";
import { DashboardTableSkeleton, DashboardErrorState } from "./DashboardSkeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { toast } from "sonner";
import {
  Search, Users, MessageSquare, Download, RefreshCw, Eye, Loader2, Briefcase,
  ChevronLeft, ChevronRight, Hand, Check, Mic, Banknote, ClipboardCheck,
  Globe, Filter, MoreHorizontal, FileText, Phone, UserPlus, Mail, Upload, Linkedin, Copy, Send,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { BatchTalentUpload } from "./BatchTalentUpload";
import { TalentDetailDialog } from "./TalentDetailDialog";
import { OUTREACH_TEMPLATES, getOutreachWhatsAppLink, getOutreachEmailLink, getOutreachLinkedInMessage, OutreachProduct } from "@/lib/outreachTemplates";
import { COUNTRIES_WITH_PHONE, getCountryFlag } from "@/lib/constants/countries";
import { formatWhatsAppLink, extractFirstName } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// --- Internal Hook for Debounce ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

interface Talent {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  profession_category_id: string | null;
  custom_profession: string | null;
  cv_url: string | null;
  cv_text: string | null;
  linkedin_url: string | null;
  portfolio_url: string | null;
  services_used: string[];
  created_at: string;
  updated_at: string;
  welcome_sent_at: string | null;
  country: string | null;
  country_code: string | null;
  user_id: string | null;
}

interface OutreachRecord {
  id: string;
  talent_id: string;
  product: string;
  sent_at: string;
  channel: string;
}

interface ProfessionCategory {
  id: string;
  name: string;
}

type SourceFilter = "all" | "registered" | "uploaded";
type EmailFilter = "all" | "has_email" | "linkedin_only";

const isPlaceholderEmail = (email: string) =>
  !email || email.includes("placeholder") || email.includes("noemail") || email.includes("no-email") || email.endsWith("@linkedin.com");

const ITEMS_PER_PAGE = 10;

// Outreach action config for DRY rendering
const OUTREACH_ACTIONS: { product: OutreachProduct; icon: typeof Briefcase; label: string; colorClass: string }[] = [
  { product: "portfolio", icon: Briefcase, label: "Pitch Portfolio", colorClass: "text-purple-600" },
  { product: "mock_interview", icon: Mic, label: "Pitch Mock Interview", colorClass: "text-green-600" },
  { product: "salary_analysis", icon: Banknote, label: "Pitch Salary Analysis", colorClass: "text-amber-600" },
  { product: "career_scorecard", icon: ClipboardCheck, label: "Pitch Career Scorecard", colorClass: "text-teal-600" },
];

export function TalentPoolManager() {
  const isMobile = useIsMobile();
  // Data State
  const [talents, setTalents] = useState<Talent[]>([]);
  const [professionCategories, setProfessionCategories] = useState<ProfessionCategory[]>([]);
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // KPI State
  const [kpiStats, setKpiStats] = useState({ total: 0, newThisWeek: 0, withCV: 0, withoutPhone: 0, registered: 0, uploaded: 0, noEmail: 0, contacted: 0, unreached: 0 });

  // Pagination & Search & Filters
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [outreachFilter, setOutreachFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [emailFilter, setEmailFilter] = useState<EmailFilter>("all");
  const debouncedSearch = useDebounce(searchQuery, 500);

  // UI State
  const [selectedTalent, setSelectedTalent] = useState<Talent | null>(null);
  const [portfolioDialogOpen, setPortfolioDialogOpen] = useState(false);
  const [portfolioNotes, setPortfolioNotes] = useState("");
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [portfolioTalent, setPortfolioTalent] = useState<Talent | null>(null);
  const [sendingOutreach, setSendingOutreach] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  // Load KPI stats
  const loadKpiStats = useCallback(async () => {
    try {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      const [totalRes, newRes, cvRes, noPhoneRes, registeredRes, uploadedRes, noEmailRes, contactedRes] = await Promise.all([
        supabase.from("talents").select("*", { count: "exact", head: true }),
        supabase.from("talents").select("*", { count: "exact", head: true }).gte("created_at", oneWeekAgo.toISOString()),
        supabase.from("talents").select("*", { count: "exact", head: true }).not("cv_url", "is", null),
        supabase.from("talents").select("*", { count: "exact", head: true }).is("phone", null),
        supabase.from("talents").select("*", { count: "exact", head: true }).not("user_id", "is", null),
        supabase.from("talents").select("*", { count: "exact", head: true }).is("user_id", null),
        supabase.from("talents").select("*", { count: "exact", head: true }).or("email.ilike.%placeholder%,email.ilike.%noemail%,email.ilike.%@linkedin.com"),
        supabase.from("outreach_messages").select("talent_id", { count: "exact", head: false }).gte("sent_at", oneWeekAgo.toISOString()),
      ]);
      const contactedThisWeek = new Set((contactedRes.data || []).map((r: any) => r.talent_id)).size;
      setKpiStats({
        total: totalRes.count || 0,
        newThisWeek: newRes.count || 0,
        withCV: cvRes.count || 0,
        withoutPhone: noPhoneRes.count || 0,
        registered: registeredRes.count || 0,
        uploaded: uploadedRes.count || 0,
        noEmail: noEmailRes.count || 0,
        contacted: contactedThisWeek,
        unreached: (totalRes.count || 0) - contactedThisWeek,
      });
    } catch (err) {
      console.error("Error loading KPI stats:", err);
    }
  }, []);

  // Fetch Data (Paginated)
  const loadTalents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase.from("talents").select("*", { count: "exact" }).order("updated_at", { ascending: false });

      if (debouncedSearch) {
        query = query.or(
          `full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%,custom_profession.ilike.%${debouncedSearch}%`,
        );
      }

      if (countryFilter && countryFilter !== "all") {
        query = query.eq("country", countryFilter);
      }

      // Server-side source filter
      if (sourceFilter === "registered") {
        query = query.not("user_id", "is", null);
      } else if (sourceFilter === "uploaded") {
        query = query.is("user_id", null);
      }

      // Server-side outreach filters
      if (outreachFilter === "no_welcome") {
        query = query.is("welcome_sent_at", null);
      }

      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const result = await withTimeout(Promise.resolve(query), TIMEOUTS.DEFAULT, "Loading talent pool timed out");

      if (result.error) throw result.error;

      setTalents((result.data as unknown as Talent[]) || []);
      setTotalCount(result.count || 0);
    } catch (err: any) {
      console.error("Error loading talents:", err);
      setError(err.message || "Failed to load talent pool");
      toast.error("Failed to load talent pool");
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, countryFilter, outreachFilter, sourceFilter]);

  const loadProfessionCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase.from("profession_categories").select("id, name").eq("is_active", true);
      if (error) throw error;
      setProfessionCategories(data || []);
    } catch (err: any) {
      console.error("Error loading profession categories:", err);
    }
  }, []);

  const loadOutreachRecords = useCallback(async (talentIds: string[]) => {
    if (talentIds.length === 0) return;
    try {
      const { data } = await supabase
        .from("outreach_messages")
        .select("id, talent_id, product, sent_at, channel")
        .in("talent_id", talentIds);
      setOutreachRecords((data as unknown as OutreachRecord[]) || []);
    } catch (err) {
      console.error("Error loading outreach records:", err);
    }
  }, []);

  const getOutreachSentAt = (talentId: string, product: OutreachProduct): string | null => {
    const record = outreachRecords.find((r) => r.talent_id === talentId && r.product === product);
    return record?.sent_at || null;
  };

  const getLastOutreachForTalent = (talentId: string) => {
    const records = outreachRecords.filter(r => r.talent_id === talentId);
    if (records.length === 0) return null;
    return records.sort((a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime())[0];
  };

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email': return <Mail className="h-3 w-3 text-blue-600" />;
      case 'linkedin': return <Linkedin className="h-3 w-3 text-blue-700" />;
      default: return <MessageSquare className="h-3 w-3 text-green-600" />;
    }
  };

  const sendProductOutreach = async (talent: Talent, product: OutreachProduct) => {
    if (!talent.phone) {
      toast.error("No phone number available");
      return;
    }

    const outreachKey = `${talent.id}-${product}`;
    setSendingOutreach(outreachKey);

    try {
      const firstName = extractFirstName(talent.full_name);
      const link = getOutreachWhatsAppLink(talent.phone, product, firstName);

      const { error } = await supabase.from("outreach_messages").insert({
        talent_id: talent.id,
        product,
        message_content: OUTREACH_TEMPLATES[product].template(firstName),
      });

      if (error) {
        if (error.code === "23505") {
          toast.info("Already sent this message");
        } else {
          throw error;
        }
      } else {
        window.open(link, "_blank");
        await loadOutreachRecords(talents.map((t) => t.id));
        toast.success(`${OUTREACH_TEMPLATES[product].name} message sent!`);
      }
    } catch (error: any) {
      console.error("Error sending outreach:", error);
      toast.error("Failed to track outreach");
    } finally {
      setSendingOutreach(null);
    }
  };

  const formatWelcomeWhatsAppLink = (phone: string | null, name: string) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    if (cleaned.startsWith("0")) cleaned = `880${cleaned.slice(1)}`;
    else if (cleaned.length === 10) cleaned = `880${cleaned}`;

    const message = encodeURIComponent(
      `Hi ${name}! 👋\n\nWe're so glad to see you sign up with GroUp Academy!\n\nWe're building an AI-powered career platform designed specifically for Bangladesh's job market — and you're now part of it.\n\nFeel free to knock us if you face any difficulties or have questions.\n\nBest regards,\nGroUp Academy Team`,
    );
    return `https://wa.me/${cleaned}?text=${message}`;
  };

  const formatInviteWhatsAppLink = (phone: string | null, name: string) => {
    if (!phone) return null;
    let cleaned = phone.replace(/[\s\-\(\)\+]/g, "");
    if (cleaned.startsWith("0")) cleaned = `880${cleaned.slice(1)}`;
    else if (cleaned.length === 10) cleaned = `880${cleaned}`;

    const message = encodeURIComponent(
      `Hi ${name}! 👋\n\nWe found your profile and think you'd be a great fit for GroUp Academy — an AI-powered career platform with personalized job matching, career assessments, and upskilling courses.\n\nSign up here to unlock your full profile:\nhttps://groupacademy.lovable.app/auth\n\nLooking forward to having you on board! 🚀\n\nBest regards,\nGroUp Academy Team`,
    );
    return `https://wa.me/${cleaned}?text=${message}`;
  };

  useEffect(() => {
    loadTalents();
    loadProfessionCategories();
    loadKpiStats();
  }, [loadTalents, loadProfessionCategories, loadKpiStats]);

  useEffect(() => {
    if (talents.length > 0) {
      loadOutreachRecords(talents.map((t) => t.id));
    }
  }, [talents, loadOutreachRecords]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, countryFilter, outreachFilter, sourceFilter, emailFilter]);

  const getProfessionName = (categoryId: string | null, customProfession: string | null) => {
    if (customProfession) return customProfession;
    if (!categoryId) return "Not set";
    const category = professionCategories.find((c) => c.id === categoryId);
    return category?.name || "Unknown";
  };

  const handleCreatePortfolioRequest = async () => {
    if (!portfolioTalent) return;
    setCreatingPortfolio(true);
    try {
      const { error } = await withTimeout(
        Promise.resolve(
          supabase.from("portfolio_requests").insert({
            full_name: portfolioTalent.full_name,
            email: portfolioTalent.email,
            phone: portfolioTalent.phone || "",
            profession_category_id: portfolioTalent.profession_category_id,
            cv_url: portfolioTalent.cv_url,
            additional_notes: portfolioNotes || `Created from Talent Pool on ${new Date().toLocaleDateString()}`,
            status: "pending",
          }),
        ),
        TIMEOUTS.DEFAULT,
        "Insert timed out",
      );
      if (error) throw error;
      toast.success("Portfolio request created!", {
        description: "View it in the Portfolio Requests tab.",
        action: { label: "View", onClick: () => { window.location.href = "/dashboard?tab=portfolios"; } },
      });
      setPortfolioDialogOpen(false);
      setPortfolioNotes("");
      setPortfolioTalent(null);
    } catch (error: any) {
      console.error("Error creating portfolio request:", error);
      toast.error("Failed to create portfolio request");
    } finally {
      setCreatingPortfolio(false);
    }
  };

  const exportToCSV = async (exportAll = false) => {
    let rows: string[][] = [];
    const headers = ["Name", "Email", "Phone", "Category", "Country", "Source", "Services Used", "Created At"];

    if (exportAll) {
      setExportingAll(true);
      try {
        let allTalents: Talent[] = [];
        let offset = 0;
        const batchSize = 1000;
        while (true) {
          let query = supabase.from("talents").select("*").order("updated_at", { ascending: false }).range(offset, offset + batchSize - 1);
          if (debouncedSearch) {
            query = query.or(`full_name.ilike.%${debouncedSearch}%,email.ilike.%${debouncedSearch}%,phone.ilike.%${debouncedSearch}%`);
          }
          if (countryFilter !== "all") query = query.eq("country", countryFilter);
          if (outreachFilter === "no_welcome") query = query.is("welcome_sent_at", null);
          if (sourceFilter === "registered") query = query.not("user_id", "is", null);
          else if (sourceFilter === "uploaded") query = query.is("user_id", null);

          const { data } = await query;
          if (!data || data.length === 0) break;
          allTalents = [...allTalents, ...(data as unknown as Talent[])];
          if (data.length < batchSize) break;
          offset += batchSize;
        }
        rows = allTalents.map((t) => [
          t.full_name, t.email, t.phone || "", getProfessionName(t.profession_category_id, t.custom_profession),
          t.country || "", t.user_id ? "Registered" : "Uploaded", t.services_used?.join("; ") || "", new Date(t.created_at).toLocaleDateString(),
        ]);
      } catch (err) {
        toast.error("Export failed");
        setExportingAll(false);
        return;
      } finally {
        setExportingAll(false);
      }
    } else {
      rows = talents.map((t) => [
        t.full_name, t.email, t.phone || "", getProfessionName(t.profession_category_id, t.custom_profession),
        t.country || "", t.user_id ? "Registered" : "Uploaded", t.services_used?.join("; ") || "", new Date(t.created_at).toLocaleDateString(),
      ]);
    }

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `talent-pool-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`CSV exported (${exportAll ? "All Filtered" : "Current Page"} — ${rows.length} rows)`);
  };

  // Client-side filtering for outreach products and email filter
  const filteredTalents = talents.filter((talent) => {
    // Email filter
    if (emailFilter === "has_email" && isPlaceholderEmail(talent.email)) return false;
    if (emailFilter === "linkedin_only" && !isPlaceholderEmail(talent.email)) return false;

    if (outreachFilter === "all" || outreachFilter === "no_welcome") return true;
    const talentOutreach = outreachRecords.filter((r) => r.talent_id === talent.id);
    const hasOutreachFor = (product: string) => talentOutreach.some((r) => r.product === product);
    switch (outreachFilter) {
      case "no_portfolio": return !hasOutreachFor("portfolio");
      case "no_mock": return !hasOutreachFor("mock_interview");
      case "no_salary": return !hasOutreachFor("salary_analysis");
      case "no_scorecard": return !hasOutreachFor("career_scorecard");
      default: return true;
    }
  });

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Source badge renderer
  const renderSourceBadge = (talent: Talent) => {
    if (talent.user_id) {
      return <Badge className="text-[10px] px-1.5 py-0 bg-green-600/10 text-green-700 border-green-200">Registered</Badge>;
    }
    return <Badge className="text-[10px] px-1.5 py-0 bg-amber-600/10 text-amber-700 border-amber-200">Uploaded</Badge>;
  };

  // Outreach status badge for table
  const renderOutreachBadge = (talent: Talent) => {
    const last = getLastOutreachForTalent(talent.id);
    if (!last) return <span className="text-xs text-muted-foreground">—</span>;
    const daysSince = Math.floor((Date.now() - new Date(last.sent_at).getTime()) / 86400000);
    return (
      <div className="flex items-center gap-1">
        {getChannelIcon(last.channel)}
        <span className="text-xs text-muted-foreground">{daysSince === 0 ? 'Today' : `${daysSince}d ago`}</span>
      </div>
    );
  };

  // Renders the actions dropdown for a talent row
  const renderActionsDropdown = (talent: Talent) => {
    const hasPhone = !!talent.phone;
    const isRegistered = !!talent.user_id;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => setSelectedTalent(talent)}>
            <Eye className="w-4 h-4 mr-2" /> View Details
          </DropdownMenuItem>
          {hasPhone && (
            <DropdownMenuItem onClick={() => window.open(formatWhatsAppLink(talent.phone), "_blank")}>
              <MessageSquare className="w-4 h-4 mr-2 text-green-600" /> Open WhatsApp
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => { setPortfolioTalent(talent); setPortfolioDialogOpen(true); }}>
            <FileText className="w-4 h-4 mr-2 text-purple-600" /> Create Portfolio
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {/* Email & LinkedIn outreach for phoneless talents */}
          {talent.email && !isPlaceholderEmail(talent.email) && !hasPhone && (
            <DropdownMenuItem onClick={async () => {
              const firstName = extractFirstName(talent.full_name);
              const link = getOutreachEmailLink(talent.email, 'welcome', firstName);
              window.open(link, '_blank');
              await supabase.from("outreach_messages").insert({ talent_id: talent.id, product: 'welcome', message_content: 'Email invite', channel: 'email' } as any);
              await loadOutreachRecords(talents.map(t => t.id));
              toast.success("Email invite opened");
            }}>
              <Mail className="w-4 h-4 mr-2 text-blue-600" /> Email Invite
            </DropdownMenuItem>
          )}
          {talent.linkedin_url && !hasPhone && (
            <DropdownMenuItem onClick={async () => {
              const firstName = extractFirstName(talent.full_name);
              const message = getOutreachLinkedInMessage('welcome', firstName);
              navigator.clipboard.writeText(message);
              window.open(talent.linkedin_url!, '_blank');
              await supabase.from("outreach_messages").insert({ talent_id: talent.id, product: 'welcome', message_content: 'LinkedIn invite', channel: 'linkedin' } as any);
              await loadOutreachRecords(talents.map(t => t.id));
              toast.success("LinkedIn message copied — paste in DM");
            }}>
              <Linkedin className="w-4 h-4 mr-2 text-blue-700" /> LinkedIn Invite
            </DropdownMenuItem>
          )}
          {/* Welcome / Invite (WhatsApp) */}
          {hasPhone && (
            talent.welcome_sent_at ? (
              <DropdownMenuItem disabled>
                <Check className="w-4 h-4 mr-2 text-green-600" /> {isRegistered ? "Welcome Sent" : "Invite Sent"}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={async () => {
                const { error } = await supabase.from("talents").update({ welcome_sent_at: new Date().toISOString() }).eq("id", talent.id);
                if (!error) {
                  const link = isRegistered
                    ? formatWelcomeWhatsAppLink(talent.phone, extractFirstName(talent.full_name))
                    : formatInviteWhatsAppLink(talent.phone, extractFirstName(talent.full_name));
                  if (link) window.open(link, "_blank");
                  loadTalents();
                }
              }}>
                {isRegistered ? (
                  <><Hand className="w-4 h-4 mr-2 text-blue-600" /> Send Welcome</>
                ) : (
                  <><Mail className="w-4 h-4 mr-2 text-orange-600" /> Send Invite</>
                )}
              </DropdownMenuItem>
            )
          )}
          {/* Product outreach actions */}
          {hasPhone && OUTREACH_ACTIONS.map(({ product, icon: Icon, label, colorClass }) => {
            const sentAt = getOutreachSentAt(talent.id, product);
            const isLoadingOutreach = sendingOutreach === `${talent.id}-${product}`;
            return sentAt ? (
              <DropdownMenuItem key={product} disabled>
                <Check className={`w-4 h-4 mr-2 ${colorClass}`} /> {label.replace("Pitch ", "")} Sent
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem key={product} disabled={isLoadingOutreach} onClick={() => sendProductOutreach(talent, product)}>
                {isLoadingOutreach ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Icon className={`w-4 h-4 mr-2 ${colorClass}`} />}
                {label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // Mobile card layout for a talent
  const renderTalentCard = (talent: Talent) => (
    <div key={talent.id} className="p-4 border rounded-xl space-y-3">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{talent.full_name}</p>
            {renderSourceBadge(talent)}
          </div>
          <p className="text-xs text-muted-foreground truncate">{talent.email}</p>
          {talent.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{talent.phone}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {talent.country && <span className="text-sm">{getCountryFlag(talent.country)}</span>}
          {renderActionsDropdown(talent)}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary" className="text-xs">{getProfessionName(talent.profession_category_id, talent.custom_profession)}</Badge>
        {talent.cv_url && <Badge variant="outline" className="text-xs">Has CV</Badge>}
        {talent.welcome_sent_at && <Badge className="text-xs bg-green-600/10 text-green-700 border-green-200">Welcome ✓</Badge>}
        {isPlaceholderEmail(talent.email) && <Badge className="text-[10px] px-1.5 py-0 bg-blue-600/10 text-blue-700 border-blue-200">LinkedIn Only</Badge>}
        {renderOutreachBadge(talent)}
      </div>
      <p className="text-xs text-muted-foreground">Updated {new Date(talent.updated_at).toLocaleDateString()}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <BatchTalentUpload onComplete={() => { loadTalents(); loadKpiStats(); }} />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xl font-bold">{kpiStats.total}</p>
              <p className="text-xs text-muted-foreground">Total Talents</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xl font-bold">{kpiStats.newThisWeek}</p>
              <p className="text-xs text-muted-foreground">New This Week</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xl font-bold">{kpiStats.registered}</p>
              <p className="text-xs text-muted-foreground">Registered</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-xl font-bold">{kpiStats.uploaded}</p>
              <p className="text-xs text-muted-foreground">Uploaded</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xl font-bold">{kpiStats.withCV}</p>
              <p className="text-xs text-muted-foreground">With CV</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-destructive" />
            <div>
              <p className="text-xl font-bold">{kpiStats.withoutPhone}</p>
              <p className="text-xs text-muted-foreground">No Phone</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Outreach KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-destructive" />
            <div>
              <p className="text-xl font-bold">{kpiStats.noEmail}</p>
              <p className="text-xs text-muted-foreground">No Real Email</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xl font-bold">{kpiStats.contacted}</p>
              <p className="text-xs text-muted-foreground">Contacted This Week</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-600" />
            <div>
              <p className="text-xl font-bold">{kpiStats.unreached}</p>
              <p className="text-xs text-muted-foreground">Unreached</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-5 h-5" />
                Talent Pool
              </CardTitle>
              <CardDescription>
                {sourceFilter !== "all"
                  ? `${totalCount} ${sourceFilter} talents`
                  : outreachFilter !== "all"
                    ? `${totalCount} talents match criteria`
                    : `${totalCount} talents in the database`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => loadTalents()} disabled={isLoading}>
                <RefreshCw className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
                {!isMobile && "Refresh"}
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={exportingAll}>
                    {exportingAll ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                    {!isMobile && "Export"}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => exportToCSV(false)}>Export Current Page</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => exportToCSV(true)}>Export All Filtered</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Source Filter Toggle */}
          <div className="mb-4">
            <ToggleGroup type="single" value={sourceFilter} onValueChange={(v) => { if (v) setSourceFilter(v as SourceFilter); }} className="justify-start">
              <ToggleGroupItem value="all" className="text-xs px-3">All</ToggleGroupItem>
              <ToggleGroupItem value="registered" className="text-xs px-3">
                <Check className="w-3 h-3 mr-1" /> Registered
              </ToggleGroupItem>
              <ToggleGroupItem value="uploaded" className="text-xs px-3">
                <Upload className="w-3 h-3 mr-1" /> Uploaded
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          {/* Filters Row */}
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Name, email, phone..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Country</Label>
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-50 max-h-60">
                  <SelectItem value="all"><div className="flex items-center gap-2"><Globe className="h-4 w-4" />All Countries</div></SelectItem>
                  {COUNTRIES_WITH_PHONE.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <div className="flex items-center gap-2"><span>{country.flag}</span>{country.name}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Outreach Status</Label>
                <Select value={outreachFilter} onValueChange={setOutreachFilter}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all"><div className="flex items-center gap-2"><Filter className="h-4 w-4" />All Talents</div></SelectItem>
                    <SelectItem value="no_welcome"><div className="flex items-center gap-2"><Hand className="h-4 w-4 text-blue-500" />No Welcome Sent</div></SelectItem>
                    <SelectItem value="no_portfolio"><div className="flex items-center gap-2"><Briefcase className="h-4 w-4 text-purple-500" />No Portfolio Pitch</div></SelectItem>
                    <SelectItem value="no_mock"><div className="flex items-center gap-2"><Mic className="h-4 w-4 text-green-500" />No Mock Interview Pitch</div></SelectItem>
                    <SelectItem value="no_salary"><div className="flex items-center gap-2"><Banknote className="h-4 w-4 text-amber-500" />No Salary Pitch</div></SelectItem>
                    <SelectItem value="no_scorecard"><div className="flex items-center gap-2"><ClipboardCheck className="h-4 w-4 text-teal-500" />No Scorecard Pitch</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Email Status</Label>
                <Select value={emailFilter} onValueChange={(v) => setEmailFilter(v as EmailFilter)}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="all">All Emails</SelectItem>
                    <SelectItem value="has_email">Has Real Email</SelectItem>
                    <SelectItem value="linkedin_only">LinkedIn Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {(countryFilter !== "all" || outreachFilter !== "all" || sourceFilter !== "all" || emailFilter !== "all") && (
                <Button variant="ghost" size="sm" onClick={() => { setCountryFilter("all"); setOutreachFilter("all"); setSourceFilter("all"); setEmailFilter("all"); }} className="text-muted-foreground shrink-0">
                  Clear
                </Button>
              )}
            </div>
          </div>

          {isLoading ? (
            <DashboardTableSkeleton rows={5} columns={6} />
          ) : error ? (
            <DashboardErrorState title="Failed to load talent pool" message={error} onRetry={loadTalents} />
          ) : filteredTalents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
              {talents.length === 0 ? (
                <p>No talents found</p>
              ) : (
                <>
                  <p>No talents match the current filters</p>
                  <Button variant="link" onClick={() => { setCountryFilter("all"); setOutreachFilter("all"); setSourceFilter("all"); }} className="mt-2">Clear filters</Button>
                </>
              )}
            </div>
          ) : (
            <>
              {/* Mobile: Card Layout */}
              {isMobile ? (
                <div className="space-y-3">
                  {filteredTalents.map(renderTalentCard)}
                </div>
              ) : (
                /* Desktop: Table Layout */
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Contact</TableHead>
                        <TableHead>Country</TableHead>
                        <TableHead>Profession</TableHead>
                         <TableHead>Source</TableHead>
                        <TableHead>Outreach</TableHead>
                        <TableHead>Updated</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTalents.map((talent) => (
                        <TableRow key={talent.id}>
                          <TableCell><p className="font-medium">{talent.full_name}</p></TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{talent.email}</p>
                              <p className="text-muted-foreground">{talent.phone || "No phone"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {talent.country ? (
                              <Badge variant="outline" className="gap-1"><span>{getCountryFlag(talent.country)}</span>{talent.country}</Badge>
                            ) : <span className="text-xs text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell><Badge variant="secondary">{getProfessionName(talent.profession_category_id, talent.custom_profession)}</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              {renderSourceBadge(talent)}
                              {isPlaceholderEmail(talent.email) && <Badge className="text-[10px] px-1 py-0 bg-blue-600/10 text-blue-700 border-blue-200">LinkedIn Only</Badge>}
                            </div>
                          </TableCell>
                          <TableCell>{renderOutreachBadge(talent)}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{new Date(talent.updated_at).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right">{renderActionsDropdown(talent)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                  </Button>
                  <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Talent Detail Dialog */}
      {selectedTalent && (
        <TalentDetailDialog
          open={!!selectedTalent}
          onOpenChange={() => setSelectedTalent(null)}
          talentEmail={selectedTalent.email}
          talentName={selectedTalent.full_name}
        />
      )}

      {/* Portfolio Request Dialog */}
      <Dialog open={portfolioDialogOpen} onOpenChange={setPortfolioDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Portfolio Request</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {portfolioTalent && (
              <div className="bg-muted p-3 rounded-lg text-sm">
                <p><strong>Name:</strong> {portfolioTalent.full_name}</p>
                <p><strong>Email:</strong> {portfolioTalent.email}</p>
                <p><strong>Phone:</strong> {portfolioTalent.phone || "N/A"}</p>
              </div>
            )}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea id="notes" value={portfolioNotes} onChange={(e) => setPortfolioNotes(e.target.value)} placeholder="Add any notes for this portfolio request..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPortfolioDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePortfolioRequest} disabled={creatingPortfolio}>
              {creatingPortfolio ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : "Create Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
