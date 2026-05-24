import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listActiveDestinationAgents } from "@/domains/abroad/repo/abroadRepo";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plane, Languages, Mic, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DestinationAgent {
 id: string;
 country_code: string;
 display_name: string;
 tagline: string | null;
 flag_emoji: string | null;
 is_active: boolean;
 display_order: number | null;
}

/**
 * Study Abroad hub — destination directory + quick links to IELTS & language tools.
 */
export default function AbroadHub() {
 const { data: destinations = [], isLoading } = useQuery<DestinationAgent[]>({
 queryKey: ["destination-agents-registry-list"],
 queryFn: async (): Promise<DestinationAgent[]> => {
 const rows = await listActiveDestinationAgents();
 return (rows as unknown as DestinationAgent[]) ?? [];
 },
 });

 return (
 <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto text-left antialiased block transform-gpu w-full">
 <header className="block w-full select-none pb-2 border-b border-border/10">
 <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-wide text-foreground leading-none pt-0.5">
 Study Abroad
 </h1>
 <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground/60 leading-none block mt-1">
 Pick a destination to start planning your studies overseas.
 </p>
 </header>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 block w-full select-none">
 <Link
 to="/app/abroad/ielts"
 className="group block rounded-lg outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
 >
 <Card className="rounded-lg border border-border/60 bg-card shadow-none transition-colors duration-100 hover:border-border-foreground/10">
 <CardContent className="p-3 flex items-center gap-2.5 leading-none w-full block">
 <Mic className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
 <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground group-hover:text-primary transition-colors block pt-0.5">
 IELTS prep & speaking coach
 </span>
 </CardContent>
 </Card>
 </Link>

 <Link
 to="/app/languages"
 className="group block rounded-lg outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
 >
 <Card className="rounded-lg border border-border/60 bg-card shadow-none transition-colors duration-100 hover:border-border-foreground/10">
 <CardContent className="p-3 flex items-center gap-2.5 leading-none w-full block">
 <Languages className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
 <span className="text-xs sm:text-sm font-bold uppercase tracking-wide text-foreground group-hover:text-primary transition-colors block pt-0.5">
 Language learning lab
 </span>
 </CardContent>
 </Card>
 </Link>
 </div>

 <div className="space-y-2 block w-full">
 <h2 className="text-xs font-mono font-extrabold uppercase tracking-wide text-muted-foreground/50 select-none block leading-none pb-2 border-b border-border/5">
 Destinations
 </h2>

 {isLoading ? (
 <div className="space-y-2 block w-full">
 {Array.from({ length: 3 }).map((_, i) => (
 <div
 key={`destination-skeleton-${i}`}
 className="rounded-lg border border-border/40 p-3 flex items-center gap-3.5 leading-none bg-card/10 block w-full"
 >
 <Skeleton className="h-8 w-8 rounded-md shrink-0 block" />
 <div className="flex-1 min-w-0 space-y-1.5 block leading-none">
 <Skeleton className="h-3 w-1/4 rounded-xs block" />
 <Skeleton className="h-2.5 w-1/2 rounded-xs block" />
 </div>
 </div>
 ))}
 </div>
 ) : destinations.length === 0 ? (
 <div className="rounded-xl border border-dashed border-border/60 bg-card/20 p-8 text-center select-none block">
 <Inbox className="h-5 w-5 text-muted-foreground/30 mx-auto stroke-[2.2] pointer-events-none" />
 <p className="text-xs font-semibold text-muted-foreground/60 leading-normal mt-2 max-w-xs mx-auto">
 No destinations available right now. Check back soon.
 </p>
 </div>
 ) : (
 <div className="space-y-2 block w-full">
 {destinations.map((agent) => (
 <Link
 key={`destination-${agent.country_code}`}
 to={`/app/abroad/destinations/${agent.country_code}`}
 className="group block rounded-lg outline-none focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
 >
 <Card className="rounded-lg border border-border/60 bg-card/40 shadow-none transition-colors duration-100 hover:border-border-foreground/10 overflow-hidden">
 <CardContent className="p-3 flex items-center gap-3.5 leading-none w-full block">
 <span
 role="img"
 aria-label={`${agent.display_name} flag`}
 className="text-2xl shrink-0 select-none pointer-events-none block leading-none h-8 w-8 grid place-items-center bg-muted/30 rounded border border-border/5"
 >
 {agent.flag_emoji ?? "🌍"}
 </span>

 <div className="flex-1 min-w-0 leading-none space-y-1 block">
 <p className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors truncate block pt-0.5 uppercase tracking-wide">
 {agent.display_name}
 </p>
 {agent.tagline && (
 <p className="text-[11px] font-semibold text-muted-foreground/60 leading-tight block select-text truncate pr-4">
 {agent.tagline}
 </p>
 )}
 </div>

 <Plane className="h-3.5 w-3.5 text-muted-foreground/40 stroke-[2.2] shrink-0 group-hover:text-foreground group-hover:translate-x-0.5 transition-all select-none pointer-events-none" />
 </CardContent>
 </Card>
 </Link>
 ))}
 </div>
 )}
 </div>

 <div className="pt-2 block w-full shrink-0 select-none">
 <Button
 type="button"
 variant="outline"
 asChild
 className="w-full h-9 rounded-lg font-bold uppercase text-[10px] sm:text-xs tracking-wider border border-border/60 bg-background/50 hover:bg-accent transition-colors shadow-2xs transform-gpu active:scale-[0.995] cursor-pointer block"
 >
 <Link to="/app/abroad/applications">My applications</Link>
 </Button>
 </div>
 </div>
 );
}
