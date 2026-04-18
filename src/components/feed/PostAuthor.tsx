import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface PostAuthorProps {
  name: string;
  title?: string;
  avatar?: string;
  createdAt: string;
}

export function PostAuthor({ name, title, avatar, createdAt }: PostAuthorProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  let timeAgo = '';
  try {
    timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });
  } catch {
    timeAgo = '';
  }

  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={avatar} alt={name} />
        <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold leading-tight truncate">{name}</p>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {title && <span className="truncate">{title}</span>}
          {title && timeAgo && <span>·</span>}
          {timeAgo && <span className="whitespace-nowrap">{timeAgo}</span>}
        </div>
      </div>
    </div>
  );
}
