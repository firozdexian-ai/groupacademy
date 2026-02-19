import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';

interface FeedHeaderProps {
  talentName?: string;
  talentPhoto?: string;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FeedHeader({
  talentName,
  talentPhoto,
  onRefresh,
  isRefreshing
}: FeedHeaderProps) {
  const navigate = useNavigate();
  const firstName = talentName?.split(' ')[0] || 'there';
  const initials = talentName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const [heroBannerUrl, setHeroBannerUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroBanner = async () => {
      const { data } = await supabase
        .from('banners')
        .select('image_url')
        .eq('is_active', true)
        .eq('placement', 'hero')
        .order('display_order')
        .limit(1);
      if (data && data.length > 0) {
        setHeroBannerUrl(data[0].image_url);
      }
    };
    fetchHeroBanner();
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-md mb-4 p-4 md:p-8 group">
      {/* Background Image Layer */}
      <div
        className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-105"
        style={
          heroBannerUrl
            ? { backgroundImage: `url('${heroBannerUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
            : { background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)/0.7) 100%)' }
        }
      />

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/60 z-0" />

      {/* Content */}
      <div className="relative z-10 flex items-center justify-between text-white mx-0 px-0 pr-0">
        {/* Left: Avatar + Welcome */}
        <div className="flex items-center gap-4">
          <Avatar
            className="h-11 w-11 md:h-14 md:w-14 cursor-pointer ring-2 ring-white/30 hover:ring-white/50 transition-all press-scale shadow-md"
            onClick={() => navigate('/app/profile')}
          >
            <AvatarImage src={talentPhoto} alt={talentName || 'User'} />
            <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-bold text-lg">
              Hi, {firstName}! 👋
            </h1>
            <p className="text-blue-100 text-xs">
              Your personalized career feed
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
