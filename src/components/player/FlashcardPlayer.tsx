import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trackError, trackEvent } from "@/lib/errorTracking";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, Check, X, Lightbulb, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

interface FlashcardPlayerProps {
  cards: Flashcard[];
  title: string;
  onComplete?: () => void;
  className?: string;
}

/**
 * GroUp Academy: Cognitive Active Recall Terminal Module (FlashcardPlayer)
 * An authoritative operational utility node driving spaced repetition drills and active recall optimization pipelines.
 * Version: Launch Candidate · Phase Z0 Hardened
 */
export function FlashcardPlayer({ cards = [], title, onComplete, className }: FlashcardPlayerProps) {
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<string>>(new Set());
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>([]);

  // Monitor cognitive recall workspace step integrations via metrics trackers
  useEffect(() => {
    trackEvent("flashcard_session_initialized", { totalCardsCount: cards.length, title });
  }, [title, cards.length]);

  // Defensive Synchronization Pass: Sync internal memory structures if the parent data collection mutates
  useEffect(() => {
    if (Array.isArray(cards)) {
      setShuffledCards(cards);
      setCurrentIndex(0);
      setIsFlipped(false);
      setShowHint(false);
    }
  }, [cards]);

  const currentCard = useMemo(() => shuffledCards[currentIndex], [shuffledCards, currentIndex]);
  const totalReviewed = useMemo(() => masteredCards.size + reviewCards.size, [masteredCards, reviewCards]);
  const progressPercentage = useMemo(() => {
    if (cards.length <= 0) return 0;
    return (totalReviewed / cards.length) * 100;
  }, [totalReviewed, cards.length]);

  const isComplete = useMemo(() => totalReviewed === cards.length && cards.length > 0, [totalReviewed, cards.length]);

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleShuffleRegistry = () => {
    trackEvent("flashcard_registry_shuffle_requested");
    const newShuffledCollection = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(newShuffledCollection);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleResetProtocol = () => {
    trackEvent("flashcard_reset_protocol_triggered");
    setShuffledCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setMasteredCards(new Set());
    setReviewCards(new Set());
  };

  const handleCommitCompletionState = async () => {
    trackEvent("flashcard_session_complete_threshold_reached", { masteredCount: masteredCards.size });
    try {
      // Automated Efficiency: Synchronize query status matrices dynamically over adjacent dashboard columns
      await queryClient.invalidateQueries({ queryKey: ["module-analytics"] });
      await queryClient.invalidateQueries({ queryKey: ["talent-stats"] });
      await queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      if (onComplete) onComplete();
    } catch (err) {
      trackError(err, { component: "FlashcardPlayer", action: "execute_on_complete_callback" });
      if (onComplete) onComplete();
    }
  };

  const markAsMastered = () => {
    if (!currentCard) return;
    trackEvent("flashcard_node_marked_mastered", { cardId: currentCard.id });

    const newMastered = new Set(masteredCards);
    newMastered.add(currentCard.id);
    const newReview = new Set(reviewCards);
    newReview.delete(currentCard.id);

    setMasteredCards(newMastered);
    setReviewCards(newReview);

    if (newMastered.size + newReview.size === cards.length) {
      handleCommitCompletionState();
    } else {
      handleNext();
    }
  };

  const markForReview = () => {
    if (!currentCard) return;
    trackEvent("flashcard_node_marked_for_review", { cardId: currentCard.id });

    const newReview = new Set(reviewCards);
    newReview.add(currentCard.id);
    const newMastered = new Set(masteredCards);
    newMastered.delete(currentCard.id);

    setReviewCards(newReview);
    setMasteredCards(newMastered);

    if (newMastered.size + newReview.size === cards.length) {
      handleCommitCompletionState();
    } else {
      handleNext();
    }
  };

  if (!currentCard) {
    return (
      <Card
        className={cn(
          "w-full border border-dashed border-border/60 bg-muted/20 rounded-xl p-8 text-center select-none flex flex-col justify-center items-center py-12",
          className,
        )}
      >
        <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
          <Zap className="h-6 w-6 text-primary/30 animate-pulse stroke-[2.2]" />
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 italic leading-none">
            Recall Registry Vacant: No Active Artifact Cards Configured
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4 text-left w-full transform-gpu antialiased", className)}>
      {/* HUD LEVEL 1: TRACK WORKSPACE SUB-CONTROL PANEL BAR */}
      <div className="flex items-center justify-between gap-4 px-0.5 select-none w-full leading-none">
        <div className="space-y-1 flex flex-col justify-center min-w-0 flex-1 leading-none">
          <h3 className="text-xs sm:text-sm font-bold text-foreground/90 uppercase tracking-wider flex items-center gap-2 leading-none truncate">
            <ShieldCheck className="h-4 w-4 text-primary stroke-[2.2] shrink-0" />
            <span>{title || "Flashcards"}</span>
          </h3>
          <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider block pt-0.5 leading-none italic">
            Cognitive Recall Framework Processing Active
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={handleShuffleRegistry}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-muted/20 hover:text-foreground cursor-pointer transition-colors"
            title="Randomize flashcard array sequence alignment"
          >
            <Shuffle className="h-4 w-4 stroke-[2.2]" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={handleResetProtocol}
            className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-rose-500/10 hover:text-rose-500 cursor-pointer transition-colors"
            title="Re-initialize core session counters"
          >
            <RotateCcw className="h-4 w-4 stroke-[2.2]" />
          </Button>
        </div>
      </div>

      {/* HUD LEVEL 2: CALIBRATION METRIC PLOTS PROGRESS TRACK */}
      <div className="space-y-2 p-3.5 rounded-xl border border-border/40 bg-muted/10 w-full select-none shadow-sm leading-none shrink-0 font-bold text-[10px] tracking-tight text-muted-foreground/70 tabular-nums">
        <div className="flex justify-between items-center w-full leading-none uppercase tracking-wider font-mono">
          <span>
            Node Matrix Block: {String(currentIndex + 1).padStart(2, "0")} of {cards.length}
          </span>
          <span className="text-primary font-black">{Math.round(progressPercentage)}% verified</span>
        </div>
        <Progress
          value={progressPercentage}
          className="h-1.5 rounded-full bg-primary/10 border-none shadow-inner w-full block"
        />
      </div>

      {/* HUD LEVEL 3: 3D SPACE INTERACTIVE FLIP MEMORY CARD LAYER */}
      <div
        className="w-full h-64 [perspective:1000px] cursor-pointer block outline-none select-none rounded-xl"
        onClick={() => {
          trackEvent("flashcard_node_flipped", { cardId: currentCard.id, nextState: !isFlipped });
          setIsFlipped(!isFlipped);
        }}
      >
        <div
          className={cn(
            "relative w-full h-full transition-transform duration-500 [transform-style:preserve-3d]",
            isFlipped && "[transform:rotateY(180deg)]",
          )}
        >
          {/* FRONT SPECIFICATION BLOCK DISPLAY PANEL */}
          <Card
            className={cn(
              "absolute inset-0 [backface-visibility:hidden] rounded-xl border border-border/40 bg-card/60 backdrop-blur-md shadow-sm flex flex-col items-center justify-center text-center p-6 sm:p-8 overflow-hidden transition-opacity duration-300",
              isFlipped && "pointer-events-none opacity-0",
            )}
          >
            <div className="absolute top-4 left-4 p-1.5 rounded-lg bg-primary/5 text-primary opacity-30 pointer-events-none">
              <Zap className="h-4 w-4 stroke-[2.2]" />
            </div>
            <p className="text-sm sm:text-base font-bold italic tracking-tight text-foreground/90 leading-snug break-words px-2 w-full select-text select-none">
              {currentCard.front}
            </p>
            <span className="absolute bottom-4 text-[9px] font-black uppercase tracking-wider text-muted-foreground/30 animate-pulse pointer-events-none">
              Trigger interface selection to expose reverse response
            </span>
          </Card>

          {/* REVERSE RESPONSE CONFIRMATION OVERLAY DISPLAY PANEL */}
          <Card
            className={cn(
              "absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] rounded-xl border border-primary/20 bg-primary/[0.02] backdrop-blur-md shadow-inner flex flex-col items-center justify-center text-center p-6 sm:p-8 overflow-hidden transition-opacity duration-300",
              !isFlipped && "pointer-events-none opacity-0",
            )}
          >
            <div className="absolute top-4 right-4 p-1.5 rounded-lg bg-primary/10 text-primary pointer-events-none">
              <ShieldCheck className="h-4 w-4 stroke-[2.2]" />
            </div>
            <p className="text-xs sm:text-sm font-semibold italic leading-relaxed text-foreground/80 break-words px-2 w-full select-text">
              {currentCard.back}
            </p>
          </Card>
        </div>
      </div>

      {/* HUD LEVEL 4: OPTIONAL HINT DROPOUT INGRESS ASSISTANCE FRAME */}
      {currentCard.hint && (
        <div className="w-full flex flex-col items-center gap-2 select-none shrink-0 leading-none">
          <Button
            variant="ghost"
            size="sm"
            type="button"
            onClick={(e) => {
              e.stopPropagation(); // Shield: Stop parent event triggers from flipping cards accidentally
              trackEvent("flashcard_hint_toggled", { cardId: currentCard.id, targetState: !showHint });
              setShowHint(!showHint);
            }}
            className="h-7 rounded-xl font-bold uppercase text-[9px] tracking-wide gap-1.5 text-primary/60 hover:bg-primary/5 cursor-pointer leading-none"
          >
            <Lightbulb
              className={cn(
                "h-3.5 w-3.5 transition-colors stroke-[2.2]",
                showHint ? "fill-primary text-primary" : "text-current",
              )}
            />
            <span>{showHint ? "Hide Strategy Reference Hint" : "Expose Strategy Reference Hint"}</span>
          </Button>

          {showHint && (
            <div className="w-full p-3.5 rounded-xl border border-primary/10 bg-primary/[0.01] text-[11px] font-semibold text-muted-foreground/80 italic text-center animate-in slide-in-from-top-1 duration-200 shadow-sm pr-1 break-words select-text">
              {currentCard.hint.trim()}
            </div>
          )}
        </div>
      )}

      {/* HUD LEVEL 5: TRANSACTION OPERATIONS CONTROLS BUTTON BAR */}
      <div className="flex items-center justify-between gap-3 pt-1 select-none font-bold text-xs w-full shrink-0">
        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="h-10 w-10 rounded-xl border border-border/60 text-muted-foreground hover:bg-accent shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
          aria-label="Return back to preceding validation milestone layout"
        >
          <ChevronLeft className="h-5 w-5 stroke-[2.5]" />
        </Button>

        <div className="flex-1 grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            onClick={markForReview}
            className="h-10 rounded-xl border border-rose-500/15 bg-rose-500/[0.02] text-rose-600 dark:text-rose-400 font-extrabold uppercase text-[10px] tracking-wider hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-[0.985] cursor-pointer flex items-center justify-center gap-1 leading-none"
          >
            <X className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Flag for Review</span>
          </Button>

          <Button
            type="button"
            onClick={markAsMastered}
            className="h-10 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.02] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase text-[10px] tracking-wider hover:bg-emerald-500 hover:text-white transition-all shadow-sm active:scale-[0.985] cursor-pointer flex items-center justify-center gap-1 leading-none"
          >
            <Check className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Commit Mastered</span>
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          type="button"
          onClick={handleNext}
          disabled={currentIndex === shuffledCards.length - 1}
          className="h-10 w-10 rounded-xl border border-border/60 text-muted-foreground hover:bg-accent shrink-0 shadow-sm cursor-pointer transition-transform active:scale-95 flex items-center justify-center"
          aria-label="Advance forward to subsequent study resource card node"
        >
          <ChevronRight className="h-5 w-5 stroke-[2.5]" />
        </Button>
      </div>

      {/* HUD LEVEL 6: METRIC MILESTONE COMPLETE VERIFIED COMPONENT SHIELD BANNER */}
      {isComplete && (
        <Card className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.005] backdrop-blur-sm shadow-sm select-none animate-in zoom-in-99 duration-200 text-center w-full shrink-0">
          <CardContent className="p-3.5 flex items-center justify-center gap-2 text-center w-full leading-none font-bold text-[10px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="h-4 w-4 text-current stroke-[2.5] shrink-0" />
            <span>
              Spaced Recall Complete &bull; {masteredCards.size} Nodes Synced Mastered &bull; {reviewCards.size}{" "}
              Retained in Review
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
