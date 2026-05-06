import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

interface PostAuthorProps {
  name: string;
  title?: string;
  avatar?: string;
  createdAt: string;
}

export function PostAuthor({ name, title, avatar, createdAt }: PostAuthorProps) {
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
    timeAgo = "";
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={avatar} alt={name} className="object-cover" />
        <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate leading-tight">{name}</p>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
          {title && <span className="truncate">{title}</span>}
          {title && timeAgo && <span className="opacity-50">·</span>}
          {timeAgo && <span className="whitespace-nowrap">{timeAgo}</span>}
        </div>
      </div>
    </div>
  );
}
