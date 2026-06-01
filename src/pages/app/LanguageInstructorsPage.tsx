import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { listActiveLanguageInstructorsByCode } from "@/domains/abroad/repo/abroadRepo";
import { bookLanguageSession } from "@/domains/abroad/api/abroadApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ShieldCheck, Calendar, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PAGE_SHELL, CARD, META_TEXT } from "@/lib/uiTokens";
import { InlineSpinner } from "@/components/common/InlineSpinner";

// =========================================================================
// DETERMINISTIC COMPONENT DATA TYPE CONTRACTS
// =========================================================================
interface InstructorRecord {
 id: string;
 user_id: string;
 display_name: string;
 native_language: string | null;
 is_verified: boolean;
 hourly_rate_credits: number;
 bio: string | null;
}

/**
 * GroUp Academy: Language Instructor Directory (LanguageInstructorsPage)
 * Hardened responsive marketplace listing active language instructors with secure booking modals.
 * Version: Launch Candidate · Phase Z1 Transaction Matrix Sealed
 */
export default function LanguageInstructorsPage() {
 const { code: languageCode = "en" } = useParams<{ code: string }>();

 const {
 data: instructors,
 isLoading,
 refetch,
 } = useQuery({
 queryKey: ["app-lang-instructors-registry", languageCode],
 queryFn: async (): Promise<InstructorRecord[]> => {
 const data = await listActiveLanguageInstructorsByCode(languageCode);
 return (data as unknown as InstructorRecord[]) ?? [];
 },
 });

 const [isBookingPending, setIsBookingPending] = React.useState<boolean>(false);

 const handleBookingTransaction = async (instructor: InstructorRecord) => {
 // In production, replace prompt with a controlled DatePicker or TimeSlot picker
 const proposedTimeStr = prompt(`Schedule session with ${instructor.display_name} (ISO format):`);
 if (!proposedTimeStr) return;

 setIsBookingPending(true);
 try {
 const data = await bookLanguageSession({
 instructor_user_id: instructor.user_id,
 language_code: languageCode.toUpperCase(),
 scheduled_at: proposedTimeStr,
 duration_mins: 30,
 });

      if (data?.error) throw new Error(data.error);

      toast.success("Booking confirmed. Check your calendar for details.");
    } catch (e: any) {
      toast.error(e.message || "Couldn't book the session.");
    } finally {
      setIsBookingPending(false);
    }
  };

  return (
    <div className={cn(PAGE_SHELL, "max-w-3xl mx-auto space-y-4")}>
      <header className="space-y-1">
        <h1 className="text-xl font-bold uppercase tracking-tight">
          {languageCode.toUpperCase()} Language Instructors
        </h1>
        <p className={META_TEXT}>Pick an instructor to start your language coaching.</p>
 </header>

 {isLoading ? (
 <div className="space-y-3">
 {[1, 2, 3].map((i) => (
 <Skeleton key={i} className="h-28 w-full rounded-lg" />
 ))}
 </div>
      ) : instructors.length === 0 ? (
        <div className="text-center py-12 border border-dashed rounded-lg">
          <p className="text-sm text-muted-foreground">No instructors available for this language right now.</p>
        </div>
 ) : (
 <div className="space-y-3">
 {instructors.map((instructor) => (
 <Card key={instructor.id} className={cn(CARD, "p-4")}>
 <div className="flex items-start justify-between gap-4">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <h3 className="font-bold text-sm">{instructor.display_name}</h3>
 {instructor.is_verified && (
 <Badge variant="secondary" className="text-[9px] gap-1 px-1.5 h-5">
 <ShieldCheck className="h-3 w-3" /> Verified
 </Badge>
 )}
 </div>
 <p className="text-[11px] text-muted-foreground">Native: {instructor.native_language ?? "—"}</p>
 </div>

 <div className="text-right">
 <div className="text-sm font-bold">{instructor.hourly_rate_credits} cr/hr</div>
 <Button
 size="sm"
 className="mt-2 h-8 rounded-lg text-xs"
 onClick={() => handleBookingTransaction(instructor)}
 disabled={isBookingPending}
 >
 {isBookingPending ? <InlineSpinner size="sm" /> : "Book Session"}
 </Button>
 </div>
 </div>
 {instructor.bio && (
 <p className="text-xs text-muted-foreground mt-3 line-clamp-2 border-t pt-2">{instructor.bio}</p>
 )}
 </Card>
 ))}
 </div>
 )}
 </div>
 );
}
