import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listActiveLanguages, listMyTalentLanguageLevels } from "@/domains/talent/repo/talentRepo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Headphones, Users, MessageCircle, Sparkles, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, PAGE_TITLE, PAGE_SUBTITLE, CARD } from "@/lib/uiTokens";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface LanguageRecord {
 code: string;
 name: string;
 flag_emoji: string;
 is_active: boolean;
 display_order: number;
}

interface TalentLanguageLevel {
 language_code: string;
 cefr_level: string;
 source: string;
}

/**
 * GroUp Academy: Language Acquisition Hub (LanguagesHub)
 * Hardened responsive directory mapping language proficiency levels to practice channels and instructor conduits.
 * Version: Launch Candidate · Phase Z1 Production Contract Sealed
 */
export default function LanguagesHub() {
 // =========================================================================
 // DATA ACQUISITION PIPELINE SECURED VIA TANSTACK CACHE CHANNEL
 // =========================================================================
 const { data: languagesRegistry = [], isLoading: isRegistryLoading } = useQuery<LanguageRecord[]>({
 queryKey: ["app-languages-registry"],
 queryFn: async () => {
 const data = await listActiveLanguages();
 return (data as unknown as LanguageRecord[]) ?? [];
 },
 staleTime: 10 * 60 * 1000,
 });

 const { data: talentProficiencyLevels = [] } = useQuery<TalentLanguageLevel[]>({
 queryKey: ["app-talent-language-proficiency-levels"],
 queryFn: async () => {
 const data = await listMyTalentLanguageLevels();
 return (data as unknown as TalentLanguageLevel[]) ?? [];
 },
 });

 // =========================================================================
 // MEMOIZED PARAMETER SECTOR: SECURE O(1) LOOKUP MATRICES
 // =========================================================================
 const proficiencyLookupMap = React.useMemo(() => {
 return new Map(talentProficiencyLevels.map((lvl) => [lvl.language_code, lvl]));
 }, [talentProficiencyLevels]);

 return (
 <div className={cn(PAGE_SHELL, "max-w-3xl mx-auto space-y-6 antialiased block transform-gpu w-full")}>
 {/* HUD LEVEL 1: HUB HEADER BLOCK */}
 <header className="space-y-1 block border-b border-border/10 pb-4">
 <div className="flex items-center gap-2">
 <Brain className="h-5 w-5 text-primary" />
 <h1 className={PAGE_TITLE}>Language Lab</h1>
 </div>
 <p className={PAGE_SUBTITLE}>
 Practice speaking with AI partners or book 1-on-1 sessions with professional tutors.
 </p>
 </header>

 {/* HUD LEVEL 2: DIRECTORY GRID ITERATOR */}
 {isRegistryLoading ? (
 <div className="space-y-2.5 block w-full">
 {[1, 2, 3, 4].map((i) => (
 <Skeleton key={`skeleton-row-${i}`} className="h-24 w-full rounded-lg bg-card/10 block" />
 ))}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 block w-full">
 {languagesRegistry.map((langItem) => {
 const userProficiency = proficiencyLookupMap.get(langItem.code);

 return (
 <Card
 key={`language-card-${langItem.code}`}
 className={cn(CARD, "rounded-lg border border-border/60 p-3.5 shadow-none block w-full")}
 >
 <div className="flex items-center gap-3.5 leading-none w-full block mb-4">
 <div className="text-3xl shrink-0 select-none pointer-events-none">{langItem.flag_emoji}</div>
 <div className="flex-1 min-w-0 leading-none">
 <div className="text-sm font-bold text-foreground block truncate">{langItem.name}</div>
 {userProficiency && (
 <Badge
 variant="secondary"
 className="font-mono text-[9px] font-black uppercase mt-1 px-1.5 h-4.5 rounded-xs select-none"
 >
 {userProficiency.cefr_level} {userProficiency.source !== "self" && "✓"}
 </Badge>
 )}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-2 w-full block">
 <Button
 asChild
 size="sm"
 variant="default"
 className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-widest gap-1.5 shadow-2xs"
 >
 <Link to={`/app/languages/${langItem.code}/practice`}>
 <MessageCircle className="h-3 w-3" /> AI Partner
 </Link>
 </Button>
 <Button
 asChild
 size="sm"
 variant="outline"
 className="h-8 rounded-lg font-mono text-[10px] font-extrabold uppercase tracking-widest gap-1.5 shadow-2xs border-border/60"
 >
 <Link to={`/app/languages/${langItem.code}/instructors`}>
 <Users className="h-3 w-3" /> Instructors
 </Link>
 </Button>
 </div>
 </Card>
 );
 })}
 </div>
 )}
 </div>
 );
}
