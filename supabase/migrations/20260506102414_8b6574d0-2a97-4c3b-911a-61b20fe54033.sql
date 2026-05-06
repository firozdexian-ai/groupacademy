alter table public.banners
  add column if not exists media_type text not null default 'image'
    check (media_type in ('image','gif','video')),
  add column if not exists media_url text,
  add column if not exists poster_url text,
  add column if not exists link_url text,
  add column if not exists cta_label text,
  add column if not exists focal_point text default 'center'
    check (focal_point in ('center','top','bottom','left','right')),
  add column if not exists start_at timestamptz,
  add column if not exists end_at timestamptz;

create index if not exists idx_banners_schedule on public.banners (is_active, start_at, end_at);