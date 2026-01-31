import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-10 w-10 ring-2 ring-background">
        {avatar ? (
          <AvatarImage src={avatar} alt={name} />
        ) : null}
        <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-sm text-foreground truncate">{name}</h4>
          <span className="text-muted-foreground text-xs">•</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: false })}
          </span>
        </div>
        {title && (
          <p className="text-xs text-muted-foreground truncate">{title}</p>
        )}
      </div>
    </div>
  );
}
