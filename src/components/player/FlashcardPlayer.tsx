import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Shuffle, RotateCcw, Check, X, Lightbulb } from "lucide-react";
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

export function FlashcardPlayer({ cards, title, onComplete, className }: FlashcardPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [masteredCards, setMasteredCards] = useState<Set<string>>(new Set());
  const [reviewCards, setReviewCards] = useState<Set<string>>(new Set());
  const [shuffledCards, setShuffledCards] = useState<Flashcard[]>(cards);

  const currentCard = shuffledCards[currentIndex];
  const progress = ((masteredCards.size + reviewCards.size) / cards.length) * 100;
  const isComplete = masteredCards.size + reviewCards.size === cards.length;

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

  const handleShuffle = () => {
    const newShuffled = [...shuffledCards].sort(() => Math.random() - 0.5);
    setShuffledCards(newShuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleReset = () => {
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
    reviewCards.delete(currentCard.id);
    setMasteredCards(newMastered);
    
    if (newMastered.size + reviewCards.size === cards.length) {
      onComplete?.();
    }
    
    if (currentIndex < shuffledCards.length - 1) {
      handleNext();
    }
  };

  const markForReview = () => {
    const newReview = new Set(reviewCards);
    newReview.add(currentCard.id);
    masteredCards.delete(currentCard.id);
    setReviewCards(newReview);
    
    if (masteredCards.size + newReview.size === cards.length) {
      onComplete?.();
    }
    
    if (currentIndex < shuffledCards.length - 1) {
      handleNext();
    }
  };

  if (!currentCard) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No flashcards available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium">{title}</h3>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={handleShuffle}>
            <Shuffle className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Card {currentIndex + 1} of {shuffledCards.length}</span>
          <span>{Math.round(progress)}% reviewed</span>
        </div>
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div 
        className="perspective-1000 cursor-pointer"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={cn(
          "relative w-full min-h-[200px] transition-transform duration-500 transform-style-3d",
          isFlipped && "rotate-y-180"
        )}>
          {/* Front */}
          <Card className={cn(
            "absolute inset-0 backface-hidden",
            isFlipped && "invisible"
          )}>
            <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
              <p className="text-lg">{currentCard.front}</p>
              <p className="text-xs text-muted-foreground mt-4">Tap to flip</p>
            </CardContent>
          </Card>

          {/* Back */}
          <Card className={cn(
            "absolute inset-0 backface-hidden rotate-y-180 bg-primary/5",
            !isFlipped && "invisible"
          )}>
            <CardContent className="p-6 h-full flex flex-col items-center justify-center text-center">
              <p className="text-lg font-medium">{currentCard.back}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hint */}
      {currentCard.hint && (
        <div className="flex justify-center">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowHint(!showHint)}
          >
            <Lightbulb className="h-4 w-4 mr-1" />
            {showHint ? "Hide Hint" : "Show Hint"}
          </Button>
        </div>
      )}
      
      {showHint && currentCard.hint && (
        <p className="text-sm text-muted-foreground text-center bg-muted p-2 rounded">
          💡 {currentCard.hint}
        </p>
      )}

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handlePrev}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={markForReview}
            className="text-orange-600"
          >
            <X className="h-4 w-4 mr-1" />
            Review Again
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={markAsMastered}
            className="text-green-600"
          >
            <Check className="h-4 w-4 mr-1" />
            Got It
          </Button>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={handleNext}
          disabled={currentIndex === shuffledCards.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary */}
      {isComplete && (
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-green-600 font-medium">
              🎉 All cards reviewed! {masteredCards.size} mastered, {reviewCards.size} for review.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
