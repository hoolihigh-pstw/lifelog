-- ============================================================
-- 日記台 資料庫設定
-- 在 Supabase 控制台 → SQL Editor 貼上整段執行一次即可
-- ============================================================

-- 1. 紀錄表
create table if not exists public.entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  type       text not null default 'other',   -- exercise / food / reading / reflection / habit / other
  title      text default '',
  content    text default '',
  value      numeric,                         -- 數值（例如吊單槓幾下、看了幾頁）
  unit       text,                            -- 單位（下 / 頁 / 分鐘…）
  feeling    text,                            -- 飲食：之後身體的感覺
  photos     text[] not null default '{}',    -- Storage 裡的照片路徑
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_date_idx on public.entries (user_id, date desc);

-- 自動更新 updated_at
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists entries_touch on public.entries;
create trigger entries_touch before update on public.entries
  for each row execute function public.touch_updated_at();

-- 2. 列級安全：每個人只看得到、改得了自己的紀錄
alter table public.entries enable row level security;

drop policy if exists "own entries select" on public.entries;
drop policy if exists "own entries insert" on public.entries;
drop policy if exists "own entries update" on public.entries;
drop policy if exists "own entries delete" on public.entries;

create policy "own entries select" on public.entries for select using (auth.uid() = user_id);
create policy "own entries insert" on public.entries for insert with check (auth.uid() = user_id);
create policy "own entries update" on public.entries for update using (auth.uid() = user_id);
create policy "own entries delete" on public.entries for delete using (auth.uid() = user_id);

-- 3. 照片儲存桶（公開讀取，但只有本人能上傳 / 刪除自己資料夾裡的檔案）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('photos', 'photos', true, 10485760, array['image/jpeg','image/png','image/webp','image/heic'])
on conflict (id) do nothing;

drop policy if exists "photos public read" on storage.objects;
drop policy if exists "photos own insert" on storage.objects;
drop policy if exists "photos own update" on storage.objects;
drop policy if exists "photos own delete" on storage.objects;

create policy "photos public read" on storage.objects
  for select using (bucket_id = 'photos');

-- 檔案路徑第一層資料夾必須是自己的 user id（app 會自動這樣命名）
create policy "photos own insert" on storage.objects
  for insert with check (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photos own update" on storage.objects
  for update using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "photos own delete" on storage.objects
  for delete using (bucket_id = 'photos' and auth.uid()::text = (storage.foldername(name))[1]);
