import { LucideIcon, MessageCircle, Coins } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  icon?: LucideIcon;
  color: string;
  bgColor: string;
  expertise: string[];
  creditCost?: number;
  avatarUrl?: string | null;
  hasActiveSession?: boolean;
  onClick: () => void;
  onResume?: () => void;
}

export function AgentCard({
  name,
  description,
  icon,
  color,
  bgColor,
  expertise,
  creditCost,
  avatarUrl,
  hasActiveSession,
  onClick,
  onResume
}: AgentCardProps) {
  const IconComponent = icon;

  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-3 flex flex-col items-center text-center gap-2">
        {/* Avatar / Icon */}
        <div>
          {avatarUrl ? (
            <Avatar className="h-14 w-14 ring-2 ring-border">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className={`${bgColor} ${color}`}>
                {name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className={`h-14 w-14 rounded-full ${bgColor} flex items-center justify-center transition-transform group-hover:scale-105`}>
              {IconComponent ? <IconComponent className={`h-6 w-6 ${color}`} /> : <MessageCircle className={`h-6 w-6 ${color}`} />}
            </div>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Credit Cost */}
        {creditCost !== undefined && (
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Coins className="h-3 w-3" />
            {creditCost} pts
          </Badge>
        )}

        {/* CTA Button */}
        {hasActiveSession && onResume ? (
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-full mt-1 h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onResume();
            }}
          >
            <MessageCircle className="h-3.5 w-3.5 mr-1.5" />
            Resume
          </Button>
        ) : (
          <Button 
            size="sm" 
            className="w-full mt-1 h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            Chat Now
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
