import { useState } from "react";
import { Check, Users, Timer, Trophy, Zap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

/**
 * GroUp Academy: Community Consensus Node (PollWidget)
 * CTO Reference: Interactive engagement module for community feedback loops.
 */

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

  const handleVoteProtocol = () => {
    if (selectedOption && !disabled && !hasVoted) {
      onVote(selectedOption);
    }
  };

  const getResultForOption = (optionId: string): PollResult => {
    const result = results?.find((r) => r.optionId === optionId);
    return result || { optionId, votes: 0, percentage: 0 };
  };

  // PROTOCOL: Identify the top engagement node
  const leadingOptionId = results?.reduce(
    (prev, current) => (prev.votes > current.votes ? prev : current),
    results[0],
  )?.optionId;

  return (
    <div className="space-y-5 p-5 bg-card/30 border-2 border-border/40 rounded-[28px] shadow-xl backdrop-blur-md animate-in fade-in duration-500">
      <div className="space-y-3">
        {options.map((option) => {
          const result = getResultForOption(option.id);
          const isUserVote = userVote === option.id;
          const isSelected = selectedOption === option.id;
          const isWinner = showResults && option.id === leadingOptionId && result.votes > 0;

          if (showResults) {
            return (
              <div
                key={option.id}
                className="group relative overflow-hidden rounded-[20px] border-2 transition-all duration-500"
                style={{ borderColor: isWinner ? "hsl(var(--primary)/0.2)" : "transparent" }}
              >
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-between p-4 transition-all",
                    isWinner ? "bg-primary/[0.03]" : "bg-muted/20",
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    {isWinner ? (
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
                      </div>
                    ) : isUserVote ? (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                        <Check className="h-3 w-3 text-white stroke-[3px]" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-[15px] truncate font-black italic tracking-tight uppercase",
                        isUserVote ? "text-primary" : "text-foreground/80",
                      )}
                    >
                      {option.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUserVote && (
                      <span className="text-[9px] font-black uppercase text-primary/40 tracking-[0.2em] italic">
                        MY_VOTE
                      </span>
                    )}
                    <span className="text-xs font-black tabular-nums tracking-tighter">{result.percentage}%</span>
                  </div>
                </div>
                {/* NEURAL PROGRESS OVERLAY */}
                <div
                  className={cn(
                    "absolute inset-0 h-full transition-all duration-[2000ms] ease-in-out opacity-10",
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
                "w-full p-4 rounded-[20px] border-2 text-left text-sm transition-all duration-300 transform-gpu",
                "active:scale-[0.97] outline-none",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                  : "border-border/40 bg-background/50 hover:border-primary/30 hover:bg-primary/[0.02]",
                disabled && "opacity-40 cursor-not-allowed",
              )}
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "h-6 w-6 rounded-xl border-2 flex items-center justify-center transition-all duration-500",
                    isSelected
                      ? "border-primary bg-primary rotate-12 scale-110"
                      : "border-muted-foreground/20 bg-muted/10",
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 text-white stroke-[4px]" />}
                </div>
                <span className="font-bold text-[14px] uppercase italic tracking-tight">{option.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {!hasVoted && !isPollEnded && (
        <Button
          size="lg"
          onClick={handleVoteProtocol}
          disabled={!selectedOption || disabled}
          className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest text-xs gap-3 shadow-2xl active:scale-95 transition-all"
        >
          <Zap className="h-4 w-4 fill-current" />
          Authorize Vote
        </Button>
      )}

      {/* FOOTER TELEMETRY */}
      <div className="flex items-center justify-between pt-2 px-1 border-t border-border/10">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="h-6 gap-1.5 px-3 rounded-full font-black text-[9px] uppercase italic border-primary/20 bg-primary/5 text-primary"
          >
            <Users className="h-3 w-3" />
            {totalVotes.toLocaleString()} NODES_SYNCED
          </Badge>
        </div>
        {pollEndsAt && (
          <div className="flex items-center gap-2 text-[10px] font-black uppercase italic tracking-tighter text-muted-foreground/60">
            <Timer className="h-3.5 w-3.5" />
            <span>
              {isPollEnded
                ? "PROTOCOL_CLOSED"
                : `EXPIRES_IN: ${formatDistanceToNow(new Date(pollEndsAt)).toUpperCase()}`}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
