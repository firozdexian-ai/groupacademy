import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ImageUpload } from '@/components/ImageUpload';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Pin, Eye, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';


type PostContentType = 'text' | 'poll' | 'tip' | 'news' | 'announcement' | 'media';

interface PollOption {
  id: string;
  text: string;
}

interface FeedPost {
  id: string;
  author_name: string;
  author_avatar: string | null;
  author_title: string | null;
  content_type: PostContentType;
  text_content: string;
  media_url: string | null;
  poll_options: PollOption[] | null;
  poll_ends_at: string | null;
  link_url: string | null;
  tags: string[];
  is_pinned: boolean;
  is_active: boolean;
  created_at: string;
}

interface PostFormData {
  author_name: string;
  author_avatar: string;
  author_title: string;
  content_type: PostContentType;
  text_content: string;
  media_url: string;
  poll_options: PollOption[];
  poll_ends_at: string;
  link_url: string;
  tags: string;
  is_pinned: boolean;
  is_active: boolean;
}

const defaultFormData: PostFormData = {
  author_name: 'GroUp Academy Team',
  author_avatar: '',
  author_title: 'Career Experts',
  content_type: 'text',
  text_content: '',
  media_url: '',
  poll_options: [{ id: '1', text: '' }, { id: '2', text: '' }],
  poll_ends_at: '',
  link_url: '',
  tags: '',
  is_pinned: false,
  is_active: true,
};

export function FeedPostsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<FeedPost | null>(null);
  const [formData, setFormData] = useState<PostFormData>(defaultFormData);

  // Fetch posts
  const { data: posts, isLoading } = useQuery({
    queryKey: ['feed-posts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feed_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as FeedPost[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      const payload: any = {
        author_name: data.author_name,
        author_avatar: data.author_avatar || null,
        author_title: data.author_title || null,
        content_type: data.content_type,
        text_content: data.text_content,
        media_url: data.media_url || null,
        poll_options: data.content_type === 'poll' 
          ? data.poll_options.filter(o => o.text.trim()) 
          : null,
        poll_ends_at: data.content_type === 'poll' && data.poll_ends_at 
          ? new Date(data.poll_ends_at).toISOString() 
          : null,
        link_url: data.link_url || null,
        tags: data.tags.split(',').map(t => t.trim()).filter(Boolean),
        is_pinned: data.is_pinned,
        is_active: data.is_active,
      };

      if (editingPost) {
        const { error } = await supabase
          .from('feed_posts')
          .update(payload)
          .eq('id', editingPost.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('feed_posts')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast({ title: editingPost ? 'Post updated' : 'Post created' });
      handleCloseDialog();
    },
    onError: (error) => {
      toast({ title: 'Error saving post', description: error.message, variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('feed_posts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
      toast({ title: 'Post deleted' });
    },
  });

  // Toggle pin mutation
  const togglePinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned: boolean }) => {
      const { error } = await supabase
        .from('feed_posts')
        .update({ is_pinned: !isPinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feed-posts'] });
    },
  });

  const handleOpenCreate = () => {
    setEditingPost(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (post: FeedPost) => {
    setEditingPost(post);
    setFormData({
      author_name: post.author_name,
      author_avatar: post.author_avatar || '',
      author_title: post.author_title || '',
      content_type: post.content_type,
      text_content: post.text_content,
      media_url: post.media_url || '',
      poll_options: post.poll_options || [{ id: '1', text: '' }, { id: '2', text: '' }],
      poll_ends_at: post.poll_ends_at ? format(new Date(post.poll_ends_at), "yyyy-MM-dd'T'HH:mm") : '',
      link_url: post.link_url || '',
      tags: post.tags?.join(', ') || '',
      is_pinned: post.is_pinned,
      is_active: post.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingPost(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const addPollOption = () => {
    setFormData(prev => ({
      ...prev,
      poll_options: [...prev.poll_options, { id: String(prev.poll_options.length + 1), text: '' }],
    }));
  };

  const updatePollOption = (index: number, text: string) => {
    setFormData(prev => ({
      ...prev,
      poll_options: prev.poll_options.map((opt, i) => i === index ? { ...opt, text } : opt),
    }));
  };

  const removePollOption = (index: number) => {
    if (formData.poll_options.length > 2) {
      setFormData(prev => ({
        ...prev,
        poll_options: prev.poll_options.filter((_, i) => i !== index),
      }));
    }
  };

  const getTypeBadge = (type: PostContentType) => {
    const config: Record<PostContentType, { label: string; className: string }> = {
      text: { label: 'Text', className: 'bg-muted' },
      poll: { label: 'Poll', className: 'bg-purple-100 text-purple-700' },
      tip: { label: 'Tip', className: 'bg-yellow-100 text-yellow-700' },
      news: { label: 'News', className: 'bg-blue-100 text-blue-700' },
      announcement: { label: 'Announcement', className: 'bg-primary/10 text-primary' },
      media: { label: 'Media', className: 'bg-green-100 text-green-700' },
    };
    return config[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">Feed Posts</h2>
          <p className="text-sm text-muted-foreground">Manage posts, polls, and announcements</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreate} size="sm">
              <Plus className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Create Post</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPost ? 'Edit Post' : 'Create New Post'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Author Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Author Name</Label>
                  <Input
                    value={formData.author_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label>Author Title</Label>
                  <Input
                    value={formData.author_title}
                    onChange={(e) => setFormData(prev => ({ ...prev, author_title: e.target.value }))}
                    placeholder="e.g., Career Coach at GRO10X"
                  />
                </div>
              </div>

              {/* Content Type */}
              <div>
                <Label>Post Type</Label>
                <Select
                  value={formData.content_type}
                  onValueChange={(v) => setFormData(prev => ({ ...prev, content_type: v as PostContentType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Post</SelectItem>
                    <SelectItem value="poll">Poll</SelectItem>
                    <SelectItem value="tip">Quick Tip</SelectItem>
                    <SelectItem value="news">Industry News</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                    <SelectItem value="media">Media Post</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Text Content */}
              <div>
                <Label>Content</Label>
                <Textarea
                  value={formData.text_content}
                  onChange={(e) => setFormData(prev => ({ ...prev, text_content: e.target.value }))}
                  placeholder="Write your post content here..."
                  rows={5}
                  required
                />
              </div>

              {/* Poll Options (only for poll type) */}
              {formData.content_type === 'poll' && (
                <div className="space-y-2">
                  <Label>Poll Options</Label>
                  {formData.poll_options.map((option, index) => (
                    <div key={option.id} className="flex gap-2">
                      <Input
                        value={option.text}
                        onChange={(e) => updatePollOption(index, e.target.value)}
                        placeholder={`Option ${index + 1}`}
                      />
                      {formData.poll_options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePollOption(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {formData.poll_options.length < 4 && (
                    <Button type="button" variant="outline" size="sm" onClick={addPollOption}>
                      Add Option
                    </Button>
                  )}
                  <div className="mt-2">
                    <Label>Poll Ends At</Label>
                    <Input
                      type="datetime-local"
                      value={formData.poll_ends_at}
                      onChange={(e) => setFormData(prev => ({ ...prev, poll_ends_at: e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Media Image */}
              <div>
                <ImageUpload
                  value={formData.media_url || undefined}
                  onUpload={(url) => setFormData(prev => ({ ...prev, media_url: url }))}
                  onRemove={() => setFormData(prev => ({ ...prev, media_url: '' }))}
                  bucket="feed-images"
                />
              </div>

              {/* Link URL */}
              <div>
                <Label>External Link (optional)</Label>
                <Input
                  value={formData.link_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                  placeholder="https://..."
                />
              </div>

              {/* Tags */}
              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="CareerTips, FreshGraduates, Interview"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_pinned}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_pinned: v }))}
                  />
                  <Label>Pin to top</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(v) => setFormData(prev => ({ ...prev, is_active: v }))}
                  />
                  <Label>Published</Label>
                </div>
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending ? 'Saving...' : editingPost ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden sm:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Post</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8">
                      Loading posts...
                    </TableCell>
                  </TableRow>
                ) : posts?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No posts yet. Create your first post!
                    </TableCell>
                  </TableRow>
                ) : (
                  posts?.map((post) => {
                    const typeBadge = getTypeBadge(post.content_type);
                    return (
                      <TableRow key={post.id}>
                        <TableCell className="max-w-xs">
                          <div className="flex items-start gap-2">
                            {post.is_pinned && <Pin className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />}
                            <p className="line-clamp-2 text-sm">{post.text_content}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={typeBadge.className}>
                            {typeBadge.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{post.author_name}</TableCell>
                        <TableCell>
                          <Badge variant={post.is_active ? 'default' : 'secondary'}>
                            {post.is_active ? 'Published' : 'Draft'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(post.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => togglePinMutation.mutate({ id: post.id, isPinned: post.is_pinned })}
                              title={post.is_pinned ? 'Unpin' : 'Pin'}
                            >
                              <Pin className={`h-4 w-4 ${post.is_pinned ? 'text-primary fill-primary' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEdit(post)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm('Delete this post?')) {
                                  deleteMutation.mutate(post.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          {/* Mobile Cards */}
          <div className="sm:hidden p-3 space-y-2">
            {isLoading ? (
              <p className="text-center py-8 text-muted-foreground">Loading posts...</p>
            ) : posts?.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No posts yet.</p>
            ) : (
              posts?.map((post) => {
                const typeBadge = getTypeBadge(post.content_type);
                return (
                  <div key={post.id} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-start gap-2">
                      {post.is_pinned && <Pin className="h-3.5 w-3.5 text-primary flex-shrink-0 mt-0.5" />}
                      <p className="text-sm line-clamp-2 flex-1">{post.text_content}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="secondary" className={`text-xs ${typeBadge.className}`}>{typeBadge.label}</Badge>
                        <Badge variant={post.is_active ? 'default' : 'secondary'} className="text-xs">
                          {post.is_active ? 'Live' : 'Draft'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{format(new Date(post.created_at), 'MMM d')}</span>
                      </div>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => togglePinMutation.mutate({ id: post.id, isPinned: post.is_pinned })}>
                          <Pin className={`h-3.5 w-3.5 ${post.is_pinned ? 'text-primary fill-primary' : ''}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenEdit(post)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { if (confirm('Delete?')) deleteMutation.mutate(post.id); }}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
