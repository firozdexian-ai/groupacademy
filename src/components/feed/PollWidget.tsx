import { useState } from 'react';
import { Check, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

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
    const result = results?.find(r => r.optionId === optionId);
    return result || { optionId, votes: 0, percentage: 0 };
  };

  return (
    <div className="space-y-3 p-3 bg-muted/30 rounded-lg border border-border/50">
      {/* Poll Options */}
      <div className="space-y-2">
        {options.map((option) => {
          const result = getResultForOption(option.id);
          const isUserVote = userVote === option.id;
          const isSelected = selectedOption === option.id;

          if (showResults) {
            // Show results view
            return (
              <div key={option.id} className="relative">
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-between p-3 rounded-lg border transition-all",
                    isUserVote
                      ? "border-primary bg-primary/5"
                      : "border-border/50 bg-background"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {isUserVote && (
                      <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-primary-foreground" />
                      </div>
                    )}
                    <span className={cn("text-sm", isUserVote && "font-medium")}>
                      {option.text}
                    </span>
                  </div>
                  <span className="text-sm font-semibold">{result.percentage}%</span>
                </div>
                <Progress
                  value={result.percentage}
                  className="absolute inset-0 h-full rounded-lg opacity-20"
                />
              </div>
            );
          }

          // Voting view
          return (
            <button
              key={option.id}
              disabled={disabled}
              onClick={() => setSelectedOption(option.id)}
              className={cn(
                "w-full p-3 rounded-lg border text-left text-sm transition-all",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border/50 bg-background hover:border-primary/50 hover:bg-muted/50",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-4 w-4 rounded-full border-2 transition-all",
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground"
                  )}
                >
                  {isSelected && (
                    <Check className="h-full w-full text-primary-foreground p-0.5" />
                  )}
                </div>
                <span>{option.text}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Vote Button (only when not voted) */}
      {!hasVoted && !isPollEnded && (
        <Button
          size="sm"
          onClick={handleVote}
          disabled={!selectedOption || disabled}
          className="w-full"
        >
          Vote
        </Button>
      )}

      {/* Poll Stats */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</span>
        </div>
        {pollEndsAt && (
          <span>
            {isPollEnded
              ? 'Poll ended'
              : `${formatDistanceToNow(new Date(pollEndsAt))} left`}
          </span>
        )}
      </div>
    </div>
  );
}
