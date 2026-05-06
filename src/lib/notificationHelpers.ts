import {
  Bell, CheckCircle, Briefcase, GraduationCap, Coins, Megaphone, Sparkles,
  Flame, MessageSquare, AtSign, Reply,
  type LucideIcon
} from 'lucide-react';

export type NotificationType =
  | 'system' | 'service' | 'job_match' | 'course' | 'credit' | 'announcement'
  | 'feed_hype' | 'feed_comment' | 'feed_reply' | 'feed_mention'
  | string;

export interface Notification {
  id: string;
  talentId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

const iconMap: Record<string, LucideIcon> = {
  bell: Bell, 'check-circle': CheckCircle, briefcase: Briefcase,
  'graduation-cap': GraduationCap, coins: Coins, megaphone: Megaphone, sparkles: Sparkles,
  flame: Flame, 'message-square': MessageSquare, 'at-sign': AtSign, reply: Reply,
};

const typeIconMap: Record<string, LucideIcon> = {
  system: Bell, service: CheckCircle, job_match: Briefcase,
  course: GraduationCap, credit: Coins, announcement: Megaphone,
  feed_hype: Flame, feed_comment: MessageSquare, feed_reply: Reply, feed_mention: AtSign,
};

const typeColorMap: Record<string, string> = {
  system: 'text-blue-500', service: 'text-green-500', job_match: 'text-purple-500',
  course: 'text-orange-500', credit: 'text-yellow-500', announcement: 'text-red-500',
  feed_hype: 'text-orange-500', feed_comment: 'text-primary',
  feed_reply: 'text-primary', feed_mention: 'text-cyan-500',
};

export const FEED_NOTIFICATION_TYPES = ['feed_hype', 'feed_comment', 'feed_reply', 'feed_mention'];
export function isAgenticNotification(type: string): boolean {
  return FEED_NOTIFICATION_TYPES.includes(type) || type === 'system' || type === 'announcement';
}

export function getNotificationIcon(iconName: string, type: NotificationType): LucideIcon {
  // First try to get icon by name
  if (iconName && iconMap[iconName]) {
    return iconMap[iconName];
  }
  // Fall back to type-based icon
  return typeIconMap[type] || Bell;
}

export function getNotificationColor(type: NotificationType): string {
  return typeColorMap[type] || 'text-muted-foreground';
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return date.toLocaleDateString();
}

export function mapNotificationRow(row: any): Notification {
  return {
    id: row.id,
    talentId: row.talent_id,
    type: row.type as NotificationType,
    title: row.title,
    message: row.message,
    icon: row.icon || 'bell',
    link: row.link,
    isRead: row.is_read,
    createdAt: row.created_at,
    readAt: row.read_at,
  };
}
