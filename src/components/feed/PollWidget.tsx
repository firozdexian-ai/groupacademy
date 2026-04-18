import { useState } from "react";
import { Check, Users, Timer, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface PollOption {
  id: string;
  text: string;
}

interface PollResult {
  optionId: string;
  votes: number;
  percentage: number;
}

interface PollWidgetProps {
  options: PollOption[];
  results?: PollResult[];
  totalVotes: number;
  hasVoted: boolean;
  userVote: string | null;
  pollEndsAt?: string;
  onVote: (optionId: string) => void;
  disabled?: boolean;
}

export function PollWidget({
  options,
  results,
  totalVotes,
  hasVoted,
  userVote,
  pollEndsAt,
  onVote,
  disabled,
}: PollWidgetProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isPollEnded = pollEndsAt ? new Date(pollEndsAt) < new Date() : false;
  const showResults = hasVoted || isPollEnded;

  const handleVote = () => {
    if (selectedOption && !disabled && !hasVoted) {
      onVote(selectedOption);
    }
  };

  const getResultForOption = (optionId: string): PollResult => {
    const result = results?.find((r) => r.optionId === optionId);
    return result || { optionId, votes: 0, percentage: 0 };
  };

  // CTO Fix: Identify the leading option to highlight the winner
  const leadingOptionId = results?.reduce(
    (prev, current) => (prev.votes > current.votes ? prev : current),
    results[0],
  )?.optionId;

  return (
    <div className="space-y-4 p-4 bg-card border border-border/60 rounded-2xl shadow-sm">
      <div className="space-y-2.5">
        {options.map((option) => {
          const result = getResultForOption(option.id);
          const isUserVote = userVote === option.id;
          const isSelected = selectedOption === option.id;
          const isWinner = showResults && option.id === leadingOptionId && result.votes > 0;

          if (showResults) {
            return (
              <div
                key={option.id}
                className="group relative overflow-hidden rounded-xl border border-transparent transition-all"
              >
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-between p-3.5 transition-all",
                    isWinner ? "bg-primary/5 border-primary/20" : "bg-muted/30",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isWinner ? (
                      <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                    ) : isUserVote ? (
                      <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    ) : (
                      <div className="h-4 w-4 shrink-0" />
                    )}
                    <span
                      className={cn("text-sm truncate font-medium", isUserVote ? "text-primary" : "text-foreground/80")}
                    >
                      {option.text}
                    </span>
                  </div>
                  <span className="text-xs font-black tabular-nums">{result.percentage}%</span>
                </div>
                {/* Result Progress Bar Overlay */}
                <div
                  className={cn(
                    "absolute inset-0 h-full transition-all duration-1000 ease-out opacity-15",
                    isWinner ? "bg-primary" : "bg-muted-foreground",
                  )}
                  style={{ width: `${result.percentage}%` }}
                />
              </div>
            );
          }

          return (
            <button
              key={option.id}
              disabled={disabled}
              onClick={() => setSelectedOption(option.id)}
              className={cn(
                "w-full p-3.5 rounded-xl border text-left text-sm transition-all duration-200",
                "active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-primary",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                  : "border-border/60 bg-background hover:border-primary/40 hover:bg-muted/10",
                disabled && "opacity-50 cursor-not-allowed",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                    isSelected ? "border-primary bg-primary" : "border-muted-foreground/30",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                </div>
                <span className="font-medium">{option.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {!hasVoted && !isPollEnded && (
        <Button
          size="default"
          onClick={handleVote}
          disabled={!selectedOption || disabled}
          className="w-full rounded-xl font-bold shadow-lg shadow-primary/10"
        >
          Submit Vote
        </Button>
      )}

      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 px-1">
        <div className="flex items-center gap-1.5">
          <Users className="h-3 w-3" />
          <span>
            {totalVotes.toLocaleString()} Participant{totalVotes !== 1 ? "s" : ""}
          </span>
        </div>
        {pollEndsAt && (
          <div className="flex items-center gap-1.5">
            <Timer className="h-3 w-3" />
            <span>{isPollEnded ? "Poll Closed" : `${formatDistanceToNow(new Date(pollEndsAt))} remaining`}</span>
          </div>
        )}
      </div>
    </div>
  );
}
