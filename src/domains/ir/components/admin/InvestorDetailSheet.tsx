import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { getIrInvestorDetail, listIrInvestorInteractions } from "@/domains/ir/repo/irRepo";
import {
 Mail,
 Phone,
 Linkedin,
 Twitter,
 Calendar,
 MessageSquare,
 FileText,
 PhoneCall,
 MailOpen,
 Zap,
 ShieldCheck,
 TrendingUp,
 Activity,
 ArrowUpRight,
} from "lucide-react";
import { format } from "date-fns";
import { IR_CONFIG } from "@/lib/irConfig";
import { InteractionLogger } from "./InteractionLogger";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Stakeholder Intelligence Terminal (InvestorDetailSheet)
 * CTO Reference: High-fidelity node for relationship auditing and sentiment telemetry.
 * 2024 Standard: Slide-out glassmorphic panel with skeleton loading protection.
 */

interface InvestorDetailSheetProps {
 investorId: string | null;
 open: boolean;
 onOpenChange: (open: boolean) => void;
}

export function InvestorDetailSheet({ investorId, open, onOpenChange }: InvestorDetailSheetProps) {
 const [showLogger, setShowLogger] = useState(false);

 const { data: investor, isPending: isLoadingInvestor } = useQuery({
 queryKey: ["ir-investor-detail", investorId],
 queryFn: async () => {
 if (!investorId) return null;
 return await getIrInvestorDetail(investorId);
 },
 enabled: !!investorId,
 });

 const { data: interactions, isPending: isLoadingInteractions } = useQuery({
 queryKey: ["ir-investor-interactions", investorId],
 queryFn: async () => {
 if (!investorId) return [];
 return await listIrInvestorInteractions(investorId, 20);
 },
 enabled: !!investorId,
 });

 const getInteractionIcon = (type: string) => {
 switch (type) {
 case "email_sent":
 return <Mail className="h-4 w-4" />;
 case "reply_received":
 return <MailOpen className="h-4 w-4" />;
 case "meeting":
 return <Calendar className="h-4 w-4" />;
 case "call":
 return <PhoneCall className="h-4 w-4" />;
 case "note":
 return <FileText className="h-4 w-4" />;
 default:
 return <MessageSquare className="h-4 w-4" />;
 }
 };

 const getStatusBadge = (status: string) => {
 const option = IR_CONFIG.SUBSCRIPTION_STATUS_OPTIONS.find((o) => o.value === status);
 return (
 <Badge
 className={cn(
 "font-black text-[10px] border-none px-3 py-1",
 status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground/60",
 )}
 >
 {option?.label || status}
 </Badge>
 );
 };

 return (
 <Sheet open={open} onOpenChange={onOpenChange}>
 <SheetContent className="w-full sm:max-w-xl border-l-2 border-border/40 bg-background/80 p-0 overflow-hidden flex flex-col shadow-sm">
 <div className="h-2 w-full bg-gradient-to-r from-primary via-primary-light to-primary shrink-0" />

 {isLoadingInvestor || !investor ? (
 // CTO FIX: Render Skeletons inside the Sheet to preserve the slide-in animation
 <div className="p-8 space-y-8 flex-1 overflow-hidden">
 <div className="space-y-4">
 <Skeleton className="h-10 w-3/4 rounded-xl bg-muted/40" />
 <Skeleton className="h-4 w-1/2 rounded-md bg-muted/40" />
 </div>
 <Skeleton className="h-24 w-full rounded-xl bg-muted/40" />
 <Skeleton className="h-64 w-full rounded-2xl bg-muted/40" />
 </div>
 ) : (
 <>
 <SheetHeader className="p-8 border-b border-border/10 text-left bg-muted/10 shrink-0">
 <div className="flex justify-between items-start gap-4">
 <div className="space-y-1 min-w-0">
 <SheetTitle className="text-3xl font-semibold font-medium flex items-center gap-3 truncate">
 <ShieldCheck className="h-8 w-8 text-primary shrink-0" />
 <span className="truncate">{investor.full_name}</span>
 </SheetTitle>
 <SheetDescription className="text-sm font-medium text-muted-foreground/60 italic truncate">
 {investor.title ? `${investor.title.toUpperCase()} @ ` : ""}
 <span className="text-primary">{investor.vc_firm?.name?.toUpperCase() || "INDEPENDENT"}</span>
 </SheetDescription>
 </div>
 <div className="shrink-0 pt-1">{getStatusBadge(investor.subscription_status)}</div>
 </div>
 </SheetHeader>

 <ScrollArea className="flex-1 px-8 py-8 no-scrollbar">
 <div className="space-y-10 pb-12">
 {/* CORE CHANNELS */}
 <section className="space-y-4">
 <h4 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary italic flex items-center gap-2">
 <Activity className="h-4 w-4" /> Routing Channels
 </h4>
 <div className="grid grid-cols-1 gap-3">
 {investor.email && (
 <ChannelNode icon={Mail} value={investor.email} href={`mailto:${investor.email}`} />
 )}
 {investor.phone && (
 <ChannelNode icon={Phone} value={investor.phone} href={`tel:${investor.phone}`} />
 )}
 <div className="flex gap-3">
 {investor.linkedin_url && (
 <SocialBadge icon={Linkedin} href={investor.linkedin_url} label="LinkedIn" />
 )}
 {investor.twitter_handle && (
 <SocialBadge
 icon={Twitter}
 href={`https://twitter.com/${investor.twitter_handle.replace("@", "")}`}
 label="Twitter"
 />
 )}
 </div>
 </div>
 </section>

 {/* NEURAL FEEDBACK SUMMARY */}
 {(investor.relationship_summary || investor.last_feedback_summary) && (
 <section className="space-y-4 bg-primary/5 p-6 rounded-2xl border border-primary/10">
 <h4 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-primary italic flex items-center gap-2">
 <Zap className="h-4 w-4 fill-primary/20" /> Neural Context
 </h4>
 <div className="space-y-4">
 {investor.relationship_summary && (
 <div>
 <p className="text-[9px] font-semibold text-muted-foreground uppercase mb-1 tracking-widest">
 Relationship Pulse
 </p>
 <p className="text-sm font-medium italic leading-relaxed text-foreground/80">
 {investor.relationship_summary}
 </p>
 </div>
 )}
 {investor.last_feedback_summary && (
 <div className={cn("pt-4", investor.relationship_summary && "border-t border-primary/10")}>
 <p className="text-[9px] font-semibold text-primary uppercase mb-1 tracking-widest">
 Latest Feedback Artifact
 </p>
 <p className="text-sm font-semibold leading-relaxed">
 "{investor.last_feedback_summary}"
 </p>
 </div>
 )}
 </div>
 </section>
 )}

 {/* PREFERENCE MAPPING */}
 {(investor.investor_interests?.length > 0 || investor.investment_stage_pref) && (
 <section className="space-y-4">
 <h4 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground italic flex items-center gap-2">
 <TrendingUp className="h-4 w-4" /> Sector Preferences
 </h4>
 <div className="flex flex-wrap gap-2">
 {investor.investor_interests?.map((interest: string) => (
 <Badge
 key={interest}
 variant="outline"
 className="bg-background/50 border font-semibold text-[9px] rounded-xl px-3 py-1.5 shadow-sm"
 >
 {interest}
 </Badge>
 ))}
 {investor.investment_stage_pref && (
 <Badge className="bg-primary/10 text-primary border-none font-semibold text-[9px] rounded-xl px-3 py-1.5 shadow-sm">
 STAGE: {investor.investment_stage_pref}
 </Badge>
 )}
 </div>
 </section>
 )}

 {/* INTERACTION TELEMETRY */}
 <section className="space-y-6">
 <div className="flex items-center justify-between">
 <h4 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground italic">
 Interaction Registry
 </h4>
 <Button
 variant="outline"
 size="sm"
 onClick={() => setShowLogger(true)}
 className="rounded-xl border font-semibold uppercase text-[9px] tracking-widest h-9 bg-background/50 hover:bg-primary/5"
 >
 <Zap className="h-3 w-3 mr-1.5 text-primary" /> Log Pulse
 </Button>
 </div>

 <div className="space-y-4">
 {isLoadingInteractions ? (
 <div className="space-y-3">
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-24 w-full rounded-xl bg-muted/40" />
 ))}
 </div>
 ) : interactions && interactions.length > 0 ? (
 interactions.map((interaction) => (
 <div
 key={interaction.id}
 className="group flex gap-4 p-5 rounded-xl bg-muted/10 border border-border/40 hover:border-primary/20 hover:bg-muted/20 transition-all"
 >
 <div
 className={cn(
 "h-10 w-10 rounded-xl flex items-center justify-center border shrink-0 shadow-sm transition-transform group-hover:scale-110",
 interaction.sentiment === "positive"
 ? "bg-success/10 text-success border-success/20"
 : interaction.sentiment === "negative"
 ? "bg-destructive/10 text-destructive border-destructive/20"
 : "bg-muted/50 text-muted-foreground border-border/40",
 )}
 >
 {getInteractionIcon(interaction.interaction_type)}
 </div>
 <div className="flex-1 space-y-1.5 min-w-0">
 <div className="flex items-center justify-between gap-2">
 <p className="text-[11px] font-semibold font-medium truncate">
 {IR_CONFIG.INTERACTION_TYPES.find((t) => t.value === interaction.interaction_type)
 ?.label || interaction.interaction_type}
 </p>
 <span className="text-[9px] font-bold text-muted-foreground/50 shrink-0">
 {format(new Date(interaction.created_at), "MMM d")}
 </span>
 </div>
 {interaction.subject && (
 <p className="text-xs font-bold leading-tight truncate">{interaction.subject}</p>
 )}
 {interaction.content && (
 <p className="text-[11px] font-medium text-muted-foreground leading-relaxed line-clamp-2 italic">
 {interaction.content}
 </p>
 )}
 </div>
 </div>
 ))
 ) : (
 <div className="text-center py-10 opacity-40 font-semibold uppercase text-xs border border-dashed border-border/40 rounded-xl">
 Zero interaction artifacts found
 </div>
 )}
 </div>
 </section>
 </div>
 </ScrollArea>
 </>
 )}

 {/* Keep logger outside ScrollArea so it mounts over the sheet cleanly */}
 <InteractionLogger investorId={investorId} open={showLogger} onOpenChange={setShowLogger} />
 </SheetContent>
 </Sheet>
 );
}

function ChannelNode({ icon: Icon, value, href }: { icon: any; value: string; href: string }) {
 return (
 <a
 href={href}
 className="group flex items-center justify-between p-4 rounded-[20px] bg-card border border-border/40 hover:border-primary/40 hover:shadow-md transition-all"
 >
 <div className="flex items-center gap-3 text-xs font-bold italic truncate pr-4">
 <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
 <Icon className="h-4 w-4 text-primary" />
 </div>
 <span className="truncate">{value}</span>
 </div>
 <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
 </a>
 );
}

function SocialBadge({ icon: Icon, href, label }: { icon: any; href: string; label: string }) {
 return (
 <a
 href={href}
 target="_blank"
 rel="noopener noreferrer"
 className="flex-1 flex items-center justify-center gap-2 p-3.5 rounded-[16px] border border-border/40 bg-card hover:border-primary/30 hover:shadow-sm transition-all group"
 >
 <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
 <span className="text-[9px] font-semibold uppercase italic tracking-widest group-hover:text-primary transition-colors">
 {label}
 </span>
 </a>
 );
}
