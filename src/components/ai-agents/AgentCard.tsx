import { LucideIcon, MessageCircle, Coins, Bot } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

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
  name = "AI Agent",
  description,
  icon: IconComponent,
  color,
  bgColor,
  creditCost,
  avatarUrl,
  hasActiveSession,
  onClick,
  onResume,
}: AgentCardProps) {
  // CTO Fix: Hardened initials logic
  const initials = (name || "AI")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const isHex = (str: string) => /^#([0-9A-F]{3}){1,2}$/i.test(str);

  return (
    <Card
      className="group relative cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/40 hover:border-primary/40 overflow-hidden bg-card/50 backdrop-blur-sm rounded-3xl"
      onClick={onClick}
    >
      {/* Dynamic Background Glow */}
      <div
        className="absolute -top-12 -right-12 w-24 h-24 blur-3xl opacity-10 group-hover:opacity-20 transition-opacity rounded-full"
        style={{ backgroundColor: isHex(color) ? color : "hsl(var(--primary))" }}
      />

      <CardContent className="p-4 flex flex-col items-center text-center gap-3">
        {/* Avatar / Icon Section */}
        <div className="relative">
          <Avatar className="h-16 w-16 ring-4 ring-background shadow-lg">
            {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} className="object-cover" /> : null}
            <AvatarFallback
              className="font-black"
              style={{
                backgroundColor: isHex(bgColor) ? bgColor : undefined,
                color: isHex(color) ? color : undefined,
              }}
            >
              {IconComponent ? <IconComponent className="h-7 w-7" /> : <span className="text-sm">{initials}</span>}
            </AvatarFallback>
          </Avatar>

          {hasActiveSession && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border-2 border-background"></span>
            </span>
          )}
        </div>

        {/* Text Content */}
        <div className="space-y-1">
          <h3 className="font-black text-sm tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
            {name}
          </h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-medium px-2">
            {description}
          </p>
        </div>

        {/* Credit Metadata */}
        <div className="flex items-center justify-center h-6">
          {creditCost !== undefined ? (
            <Badge
              variant="outline"
              className="text-[9px] font-black uppercase tracking-widest gap-1 border-primary/20 bg-primary/5"
            >
              <Coins className="h-2.5 w-2.5 text-primary" />
              {creditCost} Credits
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-[9px] font-black uppercase tracking-widest text-emerald-600 border-emerald-500/20 bg-emerald-50"
            >
              Free Access
            </Badge>
          )}
        </div>

        {/* Action Button */}
        <div className="w-full pt-1">
          {hasActiveSession && onResume ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full h-9 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all hover:bg-primary hover:text-white"
              onClick={(e) => {
                e.stopPropagation();
                onResume();
              }}
            >
              <MessageCircle className="h-3.5 w-3.5 mr-2" />
              Resume Session
            </Button>
          ) : (
            <Button
              size="sm"
              className="w-full h-9 text-[10px] font-black uppercase tracking-widest rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-95"
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              Start Chat
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
