import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card"; // FIXED: Restored missing Card imports
import { toast } from "sonner";
import { emailNotifications } from "@/lib/emailNotifications";
import {
 Mail,
 UserPlus,
 Phone,
 Globe,
 Briefcase,
 Calendar,
 CheckCircle2,
 FileText,
 ExternalLink,
 Coins,
 TrendingUp,
 Target,
 GraduationCap,
 Activity,
 ShieldCheck,
 Zap,
} from "lucide-react";
import { getCountryFlag } from "@/lib/constants/countries";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Talent Detail Dialog (Profile Inspector)
 * CTO Reference: High-fidelity terminal for lead auditing and activation management.
 * Resolved TS2304 by restoring Card and CardContent imports.
 */

interface TalentDetailDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 talent?: any;
 talentEmail?: string;
 talentName?: string;
}

export const TalentDetailDialog = ({
 open,
 onOpenChange,
 talent,
 talentEmail,
 talentName,
}: TalentDetailDialogProps) => {
 const [activeTab, setActiveTab] = useState("overview");

 const displayTalent = talent || {
 email: talentEmail,
 full_name: talentName,
 id: null,
 };

 if (!displayTalent.email && !displayTalent.full_name) return null;

 const handlePlatformInvite = async () => {
 if (!displayTalent.id) {
 toast.error("Error: Missing Talent Node ID.");
 return;
 }
 const toastId = toast.loading("Deploying global activation invite...");
 const success = await emailNotifications.talentInvite(
 displayTalent.id,
 "Join GroUp Academy to access AI career tools and exclusive global job matches.",
 );
 toast.dismiss(toastId);
 if (success) toast.success("Deployment Successful: Invite sent.");
 else toast.error("Transmission Fault: Failed to send invite.");
 };

 const handleAwardCredits = () => {
 toast.info("Initializing Credit Adjustment Console...");
 };

 return (
 <Dialog open={open} onOpenChange={onOpenChange}>
 <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-4 border-border/40 bg-background/95 shadow-sm rounded-2xl">
 <div className="h-2 w-full bg-gradient-to-r from-primary via-blue-600 to-primary" />

 <DialogHeader className="p-8 bg-muted/20 border-b border-border/10 text-left">
 <div className="flex justify-between items-start">
 <div className="space-y-1">
 <div className="flex items-center gap-4">
 <DialogTitle className="text-3xl font-semibold font-medium text-foreground">
 {displayTalent.full_name || "Unidentified Node"}
 </DialogTitle>
 {displayTalent.user_id ? (
 <Badge className="bg-green-500/10 text-green-600 border border-green-500/20 font-semibold px-4">
 REGISTERED_NODE
 </Badge>
 ) : (
 <Badge className="bg-amber-500/10 text-amber-600 border border-amber-200 font-semibold px-4 animate-pulse">
 PIPELINE_LEAD
 </Badge>
 )}
 </div>
 <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground/60 italic">
 <span className="flex items-center gap-2">
 <Calendar className="h-3.5 w-3.5 text-primary" />
 LOGGED: {displayTalent.created_at ? new Date(displayTalent.created_at).toLocaleDateString() : "N/A"}
 </span>
 <span className="flex items-center gap-2">
 <Target className="h-3.5 w-3.5 text-primary" />
 ID: {displayTalent.id?.slice(0, 8) || "NULL"}
 </span>
 </div>
 </div>
 <Button
 size="sm"
 variant="outline"
 className="rounded-xl border font-semibold uppercase text-xs h-10 px-4 hover:bg-primary hover:text-white transition-all"
 onClick={handleAwardCredits}
 >
 <Coins className="h-4 w-4 mr-2" /> Adjust Credits
 </Button>
 </div>
 </DialogHeader>

 <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-background">
 <div className="flex flex-wrap gap-4">
 <Button
 onClick={handlePlatformInvite}
 disabled={!displayTalent.id || !!displayTalent.user_id}
 className="bg-primary hover:bg-primary/90 text-white font-semibold uppercase italic tracking-widest h-10 px-4 rounded-xl shadow-sm gap-3"
 >
 <UserPlus className="h-5 w-5" />
 {displayTalent.user_id ? "Activation Verified" : "Deploy Invite"}
 </Button>

 <Button
 variant="secondary"
 className="h-10 px-4 rounded-xl border font-semibold uppercase text-xs gap-3"
 onClick={() => window.open(`mailto:${displayTalent.email}`)}
 >
 <Mail className="h-5 w-5" /> Email Node
 </Button>

 {displayTalent.phone && (
 <Button
 variant="outline"
 className="h-10 px-4 rounded-xl border border-green-500/30 text-green-600 font-semibold uppercase text-xs hover:bg-green-50 gap-3"
 onClick={() => window.open(`https://wa.me/${displayTalent.phone.replace(/\D/g, "")}`, "_blank")}
 >
 <Phone className="h-5 w-5" /> WhatsApp Direct
 </Button>
 )}
 </div>

 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
 <TabsList className="bg-muted/30 rounded-xl border border-border/60 p-1.5 mb-8 w-full max-w-2xl">
 <TabsTrigger
 value="overview"
 className="flex-1 rounded-xl font-semibold uppercase text-xs py-3"
 >
 Overview
 </TabsTrigger>
 <TabsTrigger
 value="cv"
 className="flex-1 rounded-xl font-semibold uppercase text-xs py-3"
 >
 CV Artifact
 </TabsTrigger>
 <TabsTrigger
 value="activity"
 className="flex-1 rounded-xl font-semibold uppercase text-xs py-3"
 >
 Pulse Activity
 </TabsTrigger>
 </TabsList>

 <TabsContent value="overview" className="space-y-8 animate-in fade-in duration-500 text-left">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="space-y-4">
 <h3 className="font-semibold text-xs text-primary italic flex items-center gap-3">
 <Globe className="h-4 w-4" /> Contact info
 </h3>
 <div className="grid gap-4">
 <InfoCard label="Email" value={displayTalent.email || "—"} />
 <InfoCard label="Phone" value={displayTalent.phone || "—"} />
 <div className="bg-muted/20 p-5 rounded-xl border border-border/40">
 <p className="text-[9px] text-muted-foreground/40 uppercase font-semibold tracking-widest">
 Location
 </p>
 <div className="flex items-center gap-3 mt-2">
 <span className="text-2xl">{getCountryFlag(displayTalent.country)}</span>
 <p className="text-lg font-semibold font-medium leading-none">
 {displayTalent.country || "UNNORMALIZED_MARKET"}
 </p>
 </div>
 </div>
 </div>
 </div>

 <div className="space-y-4">
 <h3 className="font-semibold text-xs text-primary italic flex items-center gap-3">
 <Briefcase className="h-4 w-4" /> Structural Class
 </h3>
 <div className="grid gap-4">
 <InfoCard label="Profession" value={displayTalent.custom_profession || "UNCLASSIFIED"} />
 <div className="bg-muted/20 p-5 rounded-xl border border-border/40">
 <p className="text-[9px] text-muted-foreground/40 uppercase font-semibold tracking-widest">
 Verified Artifacts
 </p>
 <div className="flex gap-3 mt-3">
 {displayTalent.cv_url ? (
 <Badge
 className="cursor-pointer gap-2 bg-primary/10 text-primary border border-primary/20 py-2 px-4 font-semibold text-[10px]"
 onClick={() => window.open(displayTalent.cv_url)}
 >
 <FileText className="h-4 w-4" /> CV_READY
 </Badge>
 ) : (
 <Badge
 variant="outline"
 className="text-muted-foreground/40 border-dashed border py-2 px-4 font-semibold text-[10px]"
 >
 CV_MISSING
 </Badge>
 )}
 {displayTalent.linkedin_url && (
 <Badge
 className="cursor-pointer gap-2 bg-blue-600/10 text-blue-600 border border-blue-600/20 py-2 px-4 font-semibold text-[10px]"
 onClick={() => window.open(displayTalent.linkedin_url)}
 >
 <ExternalLink className="h-4 w-4" /> LINKEDIN_NODE
 </Badge>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 </TabsContent>

 <TabsContent value="cv" className="animate-in slide-in-from-right-10 duration-500 text-left">
 <div className="space-y-6">
 <div className="flex items-center justify-between">
 <h3 className="font-semibold text-xs text-primary italic">
 AI_PARSED_TELEMETRY
 </h3>
 {displayTalent.cv_text && (
 <Badge className="bg-primary text-white font-semibold rounded-lg">VERIFIED_READ</Badge>
 )}
 </div>
 <div className="bg-muted/30 border-4 border-muted rounded-2xl p-8 min-h-[400px] max-h-[500px] overflow-y-auto no-scrollbar shadow-inner">
 {displayTalent.cv_text ? (
 <p className="text-sm font-medium text-foreground whitespace-pre-wrap leading-relaxed italic">
 {displayTalent.cv_text}
 </p>
 ) : (
 <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-20 py-20">
 <Zap className="h-16 w-16" />
 <p className="font-semibold uppercase tracking-[0.3em] text-xs">Neural Parsing Required</p>
 </div>
 )}
 </div>
 </div>
 </TabsContent>

 <TabsContent
 value="activity"
 className="space-y-8 animate-in slide-in-from-right-10 duration-500 text-left"
 >
 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
 <StatMetric label="Service Nodes" value={displayTalent.services_used?.length || 0} icon={Briefcase} />
 <StatMetric label="Pulse Credits" value={displayTalent.credit_balance || 250} icon={Coins} />
 <StatMetric
 label="Logic Enrollments"
 value={displayTalent.enrollment_count || 0}
 icon={GraduationCap}
 />
 <StatMetric
 label="Onboarded"
 value={displayTalent.onboarding_completed_at ? "TRUE" : "FALSE"}
 icon={ShieldCheck}
 />
 </div>

 {/* FIXED: Components below are now supported by restored imports */}
 <Card className="rounded-2xl border border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
 <CardContent className="p-8">
 <div className="flex items-center gap-4 mb-4 text-left">
 <TrendingUp className="h-6 w-6 text-primary" />
 <h4 className="text-xl font-semibold font-medium">
 Executive Commission Potential
 </h4>
 </div>
 <div className="flex flex-col md:flex-row justify-between items-center gap-6">
 <p className="text-xs font-bold text-muted-foreground/60 max-w-xl leading-loose italic text-left">
 This talent node is currently in{" "}
 <span className="text-primary">
 {displayTalent.onboarding_completed_at ? "Active Learner" : "Raw Lead"}
 </span>{" "}
 status. Activation into the platform ecosystem enables a{" "}
 <span className="text-primary font-semibold">10% fractional commission</span> for the managing
 executive on all tool consumption.
 </p>
 <div className="flex flex-col items-center bg-background p-6 rounded-2xl border border-primary/10 shadow-inner min-w-[160px]">
 <p className="text-5xl font-semibold text-primary italic leading-none">10%</p>
 <p className="text-[9px] font-semibold text-muted-foreground/40 uppercase tracking-[0.3em] mt-3">
 Yield Rate
 </p>
 </div>
 </div>
 </CardContent>
 </Card>
 </TabsContent>
 </Tabs>
 </div>

 <div className="p-6 bg-muted/10 border-t border-border/10 flex justify-end">
 <Button
 variant="ghost"
 className="font-semibold uppercase text-[10px] tracking-[0.4em] text-muted-foreground italic hover:text-primary transition-all"
 onClick={() => onOpenChange(false)}
 >
 Close Inspector Terminal
 </Button>
 </div>
 </DialogContent>
 </Dialog>
 );
};

function InfoCard({ label, value }: { label: string; value: string }) {
 return (
 <div className="bg-muted/20 p-5 rounded-xl border border-border/40 group hover:border-primary/20 transition-all text-left">
 <p className="text-[9px] text-muted-foreground/40 uppercase font-semibold tracking-widest">{label}</p>
 <p className="text-sm font-semibold text-foreground font-medium mt-1">{value}</p>
 </div>
 );
}

function StatMetric({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) {
 return (
 <div className="bg-card border border-border/60 rounded-2xl p-6 text-center space-y-3 shadow-sm group hover:border-primary/40 transition-all">
 <div className="mx-auto w-12 h-12 flex items-center justify-center bg-muted/50 rounded-2xl text-primary border border-white/5 shadow-inner group-hover:rotate-6 transition-transform">
 <Icon className="h-6 w-6" />
 </div>
 <div>
 <p className="text-2xl font-semibold text-foreground italic leading-none">{value}</p>
 <p className="text-[9px] font-bold text-muted-foreground/40 mt-2">{label}</p>
 </div>
 </div>
 );
}
