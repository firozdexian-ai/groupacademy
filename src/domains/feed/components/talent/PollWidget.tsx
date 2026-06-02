import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Users, Timer, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { trackError, trackEvent } from "@/lib/errorTracking";

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
  contextData?: {
    postId?: string;
    talentId?: string;
  };
}

/**
 * Community Consensus Node (PollWidget)
 * Interactive engagement module for handling real-time community polls and choices.
 */
export function PollWidget({
  options = [],
  results = [],
  totalVotes = 0,
  hasVoted,
  userVote,
  pollEndsAt,
  onVote,
  disabled,
  contextData,
}: PollWidgetProps) {
  const queryClient = useQueryClient();
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const isPollEnded = pollEndsAt ? new Date(pollEndsAt) < new Date() : false;
  const showResults = hasVoted || isPollEnded;

  // Track rendering impressions safely for analytics evaluation
  useEffect(() => {
    if (contextData?.postId) {
      trackEvent("poll_widget_rendered", {
        postId: contextData.postId,
        totalCurrentVotes: totalVotes,
        isClosed: isPollEnded,
      });
    }
  }, [contextData, totalVotes, isPollEnded]);

  const handleVoteProtocol = async () => {
    if (!selectedOption || disabled || hasVoted) return;

    trackEvent("poll_vote_submission_initiated", {
      ...contextData,
      selectedOptionId: selectedOption,
    });

    try {
      // Execute the native transactional update handler
      await onVote(selectedOption);

      // Invalidate queries to sync metrics across viewports immediately
      queryClient.invalidateQueries({ queryKey: ["feed-posts"] });

      trackEvent("poll_vote_submission_success", {
        ...contextData,
        selectedOptionId: selectedOption,
      });
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "PollWidget",
        action: "submit_vote_transaction",
        ...contextData,
        selectedOptionId: selectedOption,
      });
    }
  };

  const getResultForOption = (optionId: string): PollResult => {
    const fallbackResult = { optionId, votes: 0, percentage: 0 };
    if (!results || !Array.isArray(results)) return fallbackResult;
    const result = results.find((r) => r?.optionId === optionId);
    return result || fallbackResult;
  };

  const getLeadingOptionId = (): string | null => {
    if (!results || !Array.isArray(results) || results.length === 0) return null;
    try {
      const leader = results.reduce(
        (prev, current) => ((prev?.votes ?? 0) > (current?.votes ?? 0) ? prev : current),
        results[0],
      );
      return leader?.optionId || null;
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "PollWidget",
        action: "compute_leading_option",
      });
      return null;
    }
  };

  const leadingOptionId = getLeadingOptionId();

  const renderTimeRemaining = (endsAt: string) => {
    try {
      const dateInstance = new Date(endsAt);
      if (isNaN(dateInstance.getTime())) throw new Error("Invalid poll deadline timestamp schema.");

      return isPollEnded ? "Poll closed" : `Ends in ${formatDistanceToNow(dateInstance)}`;
    } catch (err) {
      trackError(err instanceof Error ? err : String(err), {
        component: "PollWidget",
        action: "format_distance_to_now",
        providedTimestamp: endsAt,
      });
      return "Poll closed";
    }
  };

  if (!options || !Array.isArray(options) || options.length === 0) return null;

  return (
    <div className="space-y-4 p-4 bg-card/60 backdrop-blur-md border border-border/40 rounded-2xl shadow-sm transition-all duration-300 antialiased w-full">
      <div className="space-y-3">
        {options.map((option) => {
          if (!option || !option.id) return null;

          const result = getResultForOption(option.id);
          const isUserVote = userVote === option.id;
          const isSelected = selectedOption === option.id;
          const isWinner = showResults && option.id === leadingOptionId && result.votes > 0;

          if (showResults) {
            return (
              <div
                key={option.id}
                className="group relative overflow-hidden rounded-xl border border-border/30 transition-all duration-300"
                style={{ borderColor: isWinner ? "hsl(var(--primary)/0.25)" : undefined }}
              >
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-between p-3.5 transition-all w-full select-text",
                    isWinner ? "bg-primary/[0.02]" : "bg-muted/10",
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {isWinner ? (
                      <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 shadow-sm animate-in zoom-in-95 duration-200">
                        <Trophy className="h-4 w-4 text-amber-500 shrink-0 fill-amber-500/10" />
                      </div>
                    ) : isUserVote ? (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm animate-in scale-in duration-200">
                        <Check className="h-3 w-3 text-white stroke-[3px]" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 shrink-0" />
                    )}
                    <span
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate tracking-tight pr-2 flex-1",
                        isUserVote ? "text-primary" : "text-foreground/90",
                      )}
                    >
                      {option.text}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 select-none">
                    {isUserVote && (
                      <span className="text-[10px] font-bold text-primary/70 tracking-tight uppercase">Your vote</span>
                    )}
                    <span className="text-xs font-bold tabular-nums tracking-wide bg-background/50 border border-border/30 px-2 py-0.5 rounded-md">
                      {result.percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress bar visual indicator overlay */}
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 h-full transition-all duration-[1200ms] ease-out opacity-10 transform-gpu",
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
              type="button"
              onClick={() => {
                setSelectedOption(option.id);
                trackEvent("poll_widget_option_selected", { optionId: option.id, ...contextData });
              }}
              className={cn(
                "w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-bold tracking-tight transition-all duration-200 transform-gpu select-none cursor-pointer",
                "active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isSelected
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border/40 bg-background/40 hover:border-primary/30 hover:bg-primary/[0.01]",
                disabled && "opacity-40 cursor-not-allowed pointer-events-none",
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-5 w-5 rounded-lg border flex items-center justify-center transition-all duration-300 shrink-0",
                    isSelected
                      ? "border-primary bg-primary transform-gpu rotate-6"
                      : "border-muted-foreground/30 bg-muted/10",
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                </div>
                <span className="text-foreground/90 font-bold">{option.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Submission action button */}
      {!hasVoted && !isPollEnded && (
        <Button
          size="lg"
          onClick={handleVoteProtocol}
          disabled={!selectedOption || disabled}
          className="w-full h-10 rounded-xl font-bold text-xs tracking-wide gap-2 shadow-sm active:scale-[0.99] transition-all select-none cursor-pointer mt-1"
        >
          <Zap className="h-3.5 w-3.5 fill-current" />
          <span>Submit vote</span>
        </Button>
      )}

      {/* Info status footer */}
      <div className="flex items-center justify-between pt-2.5 px-0.5 border-t border-border/30 select-none">
        <Badge
          variant="outline"
          className="h-6 gap-1.5 px-3 rounded-full text-[10px] font-bold tracking-wide border-border/40 bg-muted/5 shadow-inner tabular-nums uppercase"
        >
          <Users className="h-3 w-3 text-muted-foreground/80" />
          <span>
            {totalVotes.toLocaleString()} {totalVotes === 1 ? "vote" : "votes"}
          </span>
        </Badge>

        {pollEndsAt && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground/80 tracking-tight">
            <Timer className="h-3 w-3 text-primary" />
            <span>{renderTimeRemaining(pollEndsAt)}</span>
          </div>
        )}
      </div>
    </div>
  );
}