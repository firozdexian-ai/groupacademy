import { LucideIcon, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentCardProps {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  expertise: string[];
  hasActiveSession?: boolean;
  onClick: () => void;
  onResume?: () => void;
}

export function AgentCard({
  name,
  description,
  icon: Icon,
  color,
  bgColor,
  expertise,
  hasActiveSession,
  onClick,
  onResume
}: AgentCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/30 group"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className={`p-3 rounded-xl ${bgColor} transition-transform group-hover:scale-105`}>
            <Icon className={`h-6 w-6 ${color}`} />
          </div>
          {hasActiveSession ? (
            <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
              Active Session
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              Start Chat
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">
          {name}
        </CardTitle>
        <CardDescription className="mb-3">{description}</CardDescription>
        
        <div className="flex flex-wrap gap-1.5 mb-3">
          {expertise.map(skill => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
        </div>

        {hasActiveSession && onResume && (
          <Button 
            size="sm" 
            variant="secondary" 
            className="w-full mt-2"
            onClick={(e) => {
              e.stopPropagation();
              onResume();
            }}
          >
            <MessageCircle className="h-4 w-4 mr-2" />
            Resume Session
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
