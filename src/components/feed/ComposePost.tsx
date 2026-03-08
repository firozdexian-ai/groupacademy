import { useState } from 'react';
import { Send, Image, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useTalent } from '@/hooks/useTalent';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ComposePostProps {
  onPostCreated: () => void;
}

const MAX_LENGTH = 1000;
const MAX_TAGS = 5;

export function ComposePost({ onPostCreated }: ComposePostProps) {
  const { talent } = useTalent();
  const [text, setText] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = talent?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || !talent?.id) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('feed_posts').insert({
        text_content: trimmed,
        author_name: talent.fullName || 'Anonymous',
        author_avatar: talent.profilePhotoUrl || null,
        author_title: talent.customProfession || null,
        talent_id: talent.id,
        content_type: 'text' as const,
        tags: tags.length > 0 ? tags : null,
        status: 'published',
        is_active: true,
      });

      if (error) throw error;

      toast.success('Post shared!');
      setText('');
      setTags([]);
      setTagInput('');
      setIsExpanded(false);
      onPostCreated();
    } catch (err: any) {
      console.error('Create post error:', err);
      toast.error('Could not create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase();
    if (tag && tags.length < MAX_TAGS && !tags.includes(tag)) {
      setTags(prev => [...prev, tag]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  if (!talent) return null;

  return (
    <Card className="rounded-xl border-border/50 overflow-hidden">
      <CardContent className="p-3">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 ring-2 ring-background shrink-0">
            <AvatarImage src={talent.profilePhotoUrl} alt={talent.fullName || ''} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {!isExpanded ? (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-left text-sm text-muted-foreground bg-muted/40 hover:bg-muted/60 rounded-full px-4 py-2.5 transition-colors"
              >
                Share something with the community…
              </button>
            ) : (
              <div className="space-y-3">
                <Textarea
                  autoFocus
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX_LENGTH))}
                  placeholder="What's on your mind?"
                  className="min-h-[100px] resize-none border-0 bg-transparent p-0 text-sm focus-visible:ring-0 placeholder:text-muted-foreground/60"
                />

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs gap-1 pr-1"
                      >
                        #{tag}
                        <button onClick={() => removeTag(tag)} className="ml-0.5 hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions Row */}
                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagKeyDown}
                      onBlur={addTag}
                      placeholder={tags.length < MAX_TAGS ? '#tag' : ''}
                      disabled={tags.length >= MAX_TAGS}
                      className="text-xs bg-transparent border-0 outline-none w-20 text-muted-foreground placeholder:text-muted-foreground/40"
                    />
                    <span className={cn(
                      'text-[10px]',
                      text.length > MAX_LENGTH * 0.9 ? 'text-destructive' : 'text-muted-foreground/50'
                    )}>
                      {text.length}/{MAX_LENGTH}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => {
                        setIsExpanded(false);
                        setText('');
                        setTags([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 gap-1.5 rounded-full text-xs"
                      disabled={!text.trim() || isSubmitting}
                      onClick={handleSubmit}
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      Post
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
