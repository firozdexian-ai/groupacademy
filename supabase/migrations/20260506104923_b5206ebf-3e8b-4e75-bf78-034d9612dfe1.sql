alter table public.saved_items
  drop constraint if exists saved_items_item_type_check;

alter table public.saved_items
  add constraint saved_items_item_type_check
  check (item_type in ('job','course','blog','video','event','post'));