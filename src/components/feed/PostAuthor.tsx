import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck } from "lucide-react";

/**
 * GroUp Academy: Author Identity Node (PostAuthor)
 * CTO Reference: Authoritative atomic component for community attribution.
 */

interface PostAuthorProps {
  name: string;
  title?: string;
  avatar?: string;
  createdAt: string;
}

export function PostAuthor({ name, title, avatar, createdAt }: PostAuthorProps) {
  // PROTOCOL: Synchronize Identity Trace
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "??";

  let timeAgo = "";
  try {
    timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  } catch {
    timeAgo = "RECENT_SYNC";
  }

  return (
    <div className="flex items-center gap-3 min-w-0 group animate-in fade-in duration-500">
      {/* IDENTITY: Visual Node */}
      <div className="relative shrink-0">
        <Avatar className="h-10 w-10 border-2 border-border/40 transition-all group-hover:border-primary/40 shadow-sm">
          <AvatarImage src={avatar} alt={name} className="object-cover" />
          <AvatarFallback className="text-[10px] font-black italic bg-primary/5 text-primary border border-primary/20">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5 shadow-sm">
          <ShieldCheck className="h-3 w-3 text-primary fill-primary/10" />
        </div>
      </div>

      {/* IDENTITY: Meta Registry */}
      <div className="min-w-0 flex-1 flex flex-col justify-center">
        <p className="text-sm font-black uppercase italic tracking-tight leading-none text-foreground truncate group-hover:text-primary transition-colors">
          {name}
        </p>
        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground italic mt-1.5 opacity-70 group-hover:opacity-100 transition-opacity">
          {title && <span className="truncate max-w-[120px]">{title}</span>}
          {title && timeAgo && <span className="opacity-30">|</span>}
          {timeAgo && <span className="whitespace-nowrap text-primary/80">{timeAgo}</span>}
        </div>
      </div>
    </div>
  );
}
