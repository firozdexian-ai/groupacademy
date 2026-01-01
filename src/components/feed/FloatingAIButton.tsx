import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FloatingAIButtonProps {
  showPrompt?: boolean;
}

export function FloatingAIButton({ showPrompt = true }: FloatingAIButtonProps) {
  const navigate = useNavigate();
  const [isPromptDismissed, setIsPromptDismissed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleClick = () => {
    navigate('/app/ai-agents');
  };

  const dismissPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPromptDismissed(true);
  };

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 md:bottom-6">
      {/* Tooltip/Prompt */}
      {showPrompt && !isPromptDismissed && (
        <div className="animate-in slide-in-from-right-2 fade-in bg-card border shadow-lg rounded-lg p-3 max-w-[200px] relative">
          <button
            onClick={dismissPrompt}
            className="absolute -top-2 -right-2 bg-muted rounded-full p-1 hover:bg-muted-foreground/20"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium">Need career advice?</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Chat with our AI assistants
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <Button
        size="lg"
        className={cn(
          'h-14 w-14 rounded-full shadow-lg transition-all duration-200',
          'bg-primary hover:bg-primary/90',
          'touch-action-manipulation',
          isHovered && 'scale-110'
        )}
        style={{ touchAction: 'manipulation' }}
        onClick={handleClick}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleClick();
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Bot className="h-6 w-6" />
      </Button>
    </div>
  );
}
