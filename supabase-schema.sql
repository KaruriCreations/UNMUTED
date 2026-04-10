-- ============================================================
--  UNMUTED — Supabase Database Schema
--  Run this in the Supabase SQL editor (Database → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text default 'Signal over noise.',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- VIDEOS
-- ============================================================
create table if not exists public.videos (
  id uuid default uuid_generate_v4() primary key,
  tiktok_url text not null unique,
  tiktok_id text,
  title text not null default 'TikTok Video',
  author_name text default 'Unknown',
  author_url text,
  thumbnail_url text,
  submitted_by uuid references public.profiles(id) on delete set null,
  view_count integer default 0,
  comment_count integer default 0,
  created_at timestamptz default now()
);

alter table public.videos enable row level security;

create policy "Videos are viewable by everyone" on public.videos
  for select using (true);

create policy "Anyone can insert videos" on public.videos
  for insert with check (true);

-- ============================================================
-- COMMENTS
-- ============================================================
create table if not exists public.comments (
  id uuid default uuid_generate_v4() primary key,
  video_id uuid references public.videos(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  parent_id uuid references public.comments(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 1000),
  upvotes integer default 0,
  downvotes integer default 0,
  created_at timestamptz default now()
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone" on public.comments
  for select using (true);

create policy "Authenticated users can insert comments" on public.comments
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Users can update their own comments" on public.comments
  for update using (auth.uid() = user_id);

create policy "Users can delete their own comments" on public.comments
  for delete using (auth.uid() = user_id);

-- ============================================================
-- VOTES
-- ============================================================
create table if not exists public.votes (
  id uuid default uuid_generate_v4() primary key,
  comment_id uuid references public.comments(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vote_type text check (vote_type in ('up', 'down')) not null,
  created_at timestamptz default now(),
  unique(comment_id, user_id)
);

alter table public.votes enable row level security;

create policy "Votes are viewable by everyone" on public.votes
  for select using (true);

create policy "Authenticated users can vote" on public.votes
  for insert with check (auth.role() = 'authenticated' and auth.uid() = user_id);

create policy "Users can change their vote" on public.votes
  for update using (auth.uid() = user_id);

create policy "Users can delete their vote" on public.votes
  for delete using (auth.uid() = user_id);

-- ============================================================
-- Refresh vote counts on votes table changes
-- ============================================================
create or replace function public.refresh_comment_votes()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_comment_id uuid;
begin
  v_comment_id := coalesce(new.comment_id, old.comment_id);
  update public.comments
  set
    upvotes   = (select count(*) from public.votes where comment_id = v_comment_id and vote_type = 'up'),
    downvotes = (select count(*) from public.votes where comment_id = v_comment_id and vote_type = 'down')
  where id = v_comment_id;
  return null;
end;
$$;

create or replace trigger on_vote_change
  after insert or update or delete on public.votes
  for each row execute procedure public.refresh_comment_votes();

-- ============================================================
-- Realtime subscriptions (enable replication for tables)
-- ============================================================
alter publication supabase_realtime add table public.comments;
alter publication supabase_realtime add table public.votes;

-- ============================================================
-- Refresh comment counts on comments table changes
-- ============================================================
create or replace function public.refresh_video_comment_count()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_video_id uuid;
begin
  v_video_id := coalesce(new.video_id, old.video_id);
  update public.videos
  set comment_count = (select count(*) from public.comments where video_id = v_video_id)
  where id = v_video_id;
  return null;
end;
$$;

create or replace trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.refresh_video_comment_count();
