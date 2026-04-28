import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, Check, X, Lightbulb, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * GroUp Academy: Cognitive Recall Node (FlashcardPlayer)
 * CTO Reference: Authoritative gateway for active recall and neural artifact synchronization.
 */

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

export function FlashcardPlayer({ cards, title, onComplete, className }: FlashcardPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<string>>(new Set());
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(cards);

  const currentCard = shuffledCards[currentIndex];
  const totalReviewed = masteredCards.size + reviewCards.size;
  const progress = (totalReviewed / cards.length) * 100;
  const isComplete = totalReviewed === cards.length;

  const handleNext = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex < shuffledCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setShowHint(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleShuffleRegistry = () => {
    const newShuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(newShuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleResetProtocol = () => {
    setShuffledCards(cards);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
    setMasteredCards(new Set());
    setReviewCards(new Set());
  };

  const markAsMastered = () => {
    const newMastered = new Set(masteredCards);
    newMastered.add(currentCard.id);
    const newReview = new Set(reviewCards);
    newReview.delete(currentCard.id);

    setMasteredCards(newMastered);
    setReviewCards(newReview);

    if (newMastered.size + newReview.size === cards.length) {
      onComplete?.();
    }
    handleNext();
  };

  const markForReview = () => {
    const newReview = new Set(reviewCards);
    newReview.add(currentCard.id);
    const newMastered = new Set(masteredCards);
    newMastered.delete(currentCard.id);

    setReviewCards(newReview);
    setMasteredCards(newMastered);

    if (newMastered.size + newReview.size === cards.length) {
      onComplete?.();
    }
    handleNext();
  };

  if (!currentCard) {
    return (
      <Card className={cn("rounded-[32px] border-2 border-dashed border-border/40 bg-muted/5", className)}>
        <CardContent className="p-12 text-center">
          <Zap className="h-10 w-10 text-muted-foreground/20 mx-auto mb-4 animate-pulse" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 italic">
            Registry_Empty: No_Recall_Artifacts
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6 animate-in fade-in duration-700", className)}>
      {/* HUD: SESSION_HEADER */}
      <div className="flex items-center justify-between px-1">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase italic tracking-tighter text-foreground/80 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" /> {title}
          </h3>
          <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest italic">
            Recall_Session_Active
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleShuffleRegistry}
            className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleResetProtocol}
            className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* COMPONENT: TELEMETRY_HUD */}
      <div className="space-y-2 p-4 rounded-2xl bg-muted/20 border border-border/10">
        <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.2em] italic text-muted-foreground/60">
          <span>
            Card_{String(currentIndex + 1).padStart(2, "0")}_of_{cards.length}
          </span>
          <span className="text-primary">{Math.round(progress)}%_SYNCED</span>
        </div>
        <div className="h-1.5 bg-primary/10 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-primary transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* ARTIFACT: 3D_RECALL_CARD */}
      <div className="perspective-1000 cursor-pointer h-[280px]" onClick={() => setIsFlipped(!isFlipped)}>
        <div
          className={cn("relative w-full h-full transition-all duration-700 preserve-3d", isFlipped && "rotate-y-180")}
        >
          {/* FRONT_FACE */}
          <Card
            className={cn(
              "absolute inset-0 backface-hidden rounded-[32px] border-2 border-border/40 bg-card/30 backdrop-blur-xl shadow-2xl flex flex-col items-center justify-center text-center p-8",
              isFlipped && "pointer-events-none opacity-0",
            )}
          >
            <div className="absolute top-6 left-6 p-2 rounded-lg bg-primary/5 text-primary opacity-20">
              <Zap className="h-4 w-4" />
            </div>
            <p className="text-xl font-black italic tracking-tight uppercase leading-tight">{currentCard.front}</p>
            <p className="absolute bottom-6 text-[8px] font-black uppercase tracking-[0.3em] text-muted-foreground/30 animate-pulse">
              Tap_to_Reveal
            </p>
          </Card>

          {/* BACK_FACE */}
          <Card
            className={cn(
              "absolute inset-0 backface-hidden rotate-y-180 rounded-[32px] border-2 border-primary/40 bg-primary/5 backdrop-blur-xl shadow-[0_0_50px_-12px_rgba(var(--primary),0.2)] flex flex-col items-center justify-center text-center p-8",
              !isFlipped && "pointer-events-none opacity-0",
            )}
          >
            <div className="absolute top-6 right-6 p-2 rounded-lg bg-primary/10 text-primary">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <p className="text-lg font-medium italic leading-relaxed text-foreground/90">{currentCard.back}</p>
          </Card>
        </div>
      </div>

      {/* COMPONENT: HINT_INGRESS */}
      {currentCard.hint && (
        <div className="flex flex-col items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowHint(!showHint);
            }}
            className="h-8 rounded-xl font-black italic text-[9px] tracking-widest gap-2 text-primary/60 hover:bg-primary/5"
          >
            <Lightbulb className={cn("h-3.5 w-3.5", showHint ? "fill-primary text-primary" : "")} />
            {showHint ? "HIDE_HINT_NODE" : "REVEAL_HINT_NODE"}
          </Button>
          {showHint && (
            <div className="w-full p-4 rounded-xl bg-primary/5 border border-primary/10 text-[11px] font-medium italic text-center animate-in slide-in-from-top-2 duration-300">
              {currentCard.hint}
            </div>
          )}
        </div>
      )}

      {/* HUD: TRANSACTIONAL_CONTROLS */}
      <div className="flex items-center justify-between gap-4 pt-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="h-12 w-12 rounded-2xl border-2 hover:bg-muted/10"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="flex-1 grid grid-cols-2 gap-3">
          <Button
            onClick={markForReview}
            className="h-12 rounded-2xl border-2 border-rose-500/20 bg-rose-500/5 text-rose-600 font-black uppercase italic text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-lg active:scale-95"
          >
            <X className="h-4 w-4 mr-2" /> Review_Nodes
          </Button>
          <Button
            onClick={markAsMastered}
            className="h-12 rounded-2xl border-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 font-black uppercase italic text-[10px] tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg active:scale-95"
          >
            <Check className="h-4 w-4 mr-2" /> Sync_Mastered
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNext}
          disabled={currentIndex === shuffledCards.length - 1}
          className="h-12 w-12 rounded-2xl border-2 hover:bg-muted/10"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      {/* SUMMARY_VICTORY_NODE */}
      {isComplete && (
        <Card className="rounded-[24px] border-2 border-emerald-500/20 bg-emerald-500/5 backdrop-blur-md animate-in zoom-in-95 duration-500">
          <CardContent className="p-5 text-center flex items-center justify-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <p className="text-[10px] font-black uppercase italic tracking-widest text-emerald-600">
              Protocol_Complete: {masteredCards.size} Nodes_Mastered | {reviewCards.size} Nodes_In_Review
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
