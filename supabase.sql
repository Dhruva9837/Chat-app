-- Supabase Database Schema for Chat App

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table: linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  username text unique, -- Added for friend searches
  email text unique not null,
  avatar_url text,
  bio text,
  gender text,
  status text check (status in ('online', 'offline', 'typing', 'idle', 'dnd')) default 'offline',
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  -- Extended Account Details
  full_name text,
  phone_number text,
  website text,
  location text,
  birth_date date,
  job_title text,
  is_verified boolean default false,
  account_tier text default 'free' check (account_tier in ('free', 'pro', 'enterprise'))
);

-- Chats table: container for group or private messages
create table if not exists public.chats (
  id uuid primary key default uuid_generate_v4(),
  type text check (type in ('private', 'group')) default 'private',
  name text, -- only used for group chats
  group_icon text,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Chat Participants table: join table For users in chats
create table if not exists public.chat_participants (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references public.chats(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text check (role in ('owner', 'admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()),
  unique(chat_id, user_id)
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references auth.users(id) on delete set null,
  content text not null,
  message_type text check (message_type in ('text', 'image')) default 'text',
  image_url text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Member check function to prevent RLS recursion
create or replace function public.check_chat_membership(p_chat_id uuid, p_user_id uuid)
returns boolean as $$
begin
  return exists (
    select 1 from public.chat_participants
    where chat_id = p_chat_id and user_id = p_user_id
  );
end;
$$ language plpgsql security definer;

-- Grant access to the function
grant execute on function public.check_chat_membership(uuid, uuid) to authenticated;
grant execute on function public.check_chat_membership(uuid, uuid) to service_role;

-- ENABLE ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.chats enable row level security;
alter table public.chat_participants enable row level security;
alter table public.messages enable row level security;

-- RLS POLICIES

-- Profiles: anyone can see anyone else (for search/display)
create policy "Public profiles are viewable by everyone." on public.profiles
  for select using (true);

create policy "Users can update their own profile." on public.profiles
  for update using (auth.uid() = id);

-- Chats: users can see chats they are part of
create policy "Users can view chats they participate in." on public.chats
  for select using (public.check_chat_membership(id, auth.uid()));

-- Chat Participants: users can see participants in chats they belong to
create policy "Users can view participants in their chats." on public.chat_participants
  for select using (public.check_chat_membership(chat_id, auth.uid()));

create policy "Users can create chats." on public.chats
  for insert with check (auth.uid() is not null);

create policy "Users can add participants." on public.chat_participants
  for insert with check (auth.uid() is not null);

create policy "Users can delete chats they participate in." on public.chats
  for delete using (public.check_chat_membership(id, auth.uid()));

-- Messages: users can see messages in chats they belong to
create policy "Users can view messages in their chats." on public.messages
  for select using (public.check_chat_membership(chat_id, auth.uid()));

create policy "Users can insert messages in their chats." on public.messages
  for insert with check (
    auth.uid() = sender_id and
    public.check_chat_membership(chat_id, auth.uid())
  );

-- AUTH TRIGGER for automatic profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, username, email, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.email), 
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email, 
    coalesce(
      new.raw_user_meta_data->>'avatar_url', 
      'https://api.dicebear.com/7.x/avataaars/svg?seed=' || new.email
    )
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ENABLE REALTIME for messages and profiles
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.chat_participants;
alter publication supabase_realtime add table public.chats;

-- STORAGE SETUP
-- 1. Create a public bucket for chat media
insert into storage.buckets (id, name, public) 
values ('chat-media', 'chat-media', true)
on conflict (id) do nothing;

-- 2. Storage RLS Policies
create policy "Media is publicly accessible." on storage.objects
  for select using (bucket_id = 'chat-media');

create policy "Authenticated users can upload media." on storage.objects
  for insert with check (
    bucket_id = 'chat-media' and
    auth.role() = 'authenticated'
  );


-- Add avatar_decoration support
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_decoration TEXT;

-- Friend Requests table
create table if not exists public.friend_requests (
  id uuid primary key default uuid_generate_v4(),
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(sender_id, receiver_id)
);

-- RLS for Friend Requests
alter table public.friend_requests enable row level security;

create policy "Users can view requests involving them" on public.friend_requests
  for select using (auth.uid() = sender_id or auth.uid() = receiver_id);

create policy "Users can send requests" on public.friend_requests
  for insert with check (auth.uid() = sender_id);

create policy "Users can update requests received" on public.friend_requests
  for update using (auth.uid() = receiver_id);

-- ENABLE REALTIME for friend requests
alter publication supabase_realtime add table public.friend_requests;

-- Friends Table (Accepted friendships)
create table if not exists public.friends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, friend_id)
);

-- RLS for Friends
alter table public.friends enable row level security;

create policy "Users can view their friends" on public.friends
  for select using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can insert friendships" on public.friends
  for insert with check (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can manage their friendships" on public.friends
  for delete using (auth.uid() = user_id or auth.uid() = friend_id);

-- Blocks Table
create table if not exists public.blocks (
  id uuid primary key default uuid_generate_v4(),
  blocker_id uuid references public.profiles(id) on delete cascade not null,
  blocked_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(blocker_id, blocked_id)
);

-- RLS for Blocks
alter table public.blocks enable row level security;

create policy "Users can see who they blocked" on public.blocks
  for select using (auth.uid() = blocker_id);

create policy "Users can block others" on public.blocks
  for insert with check (auth.uid() = blocker_id);

create policy "Users can unblock" on public.blocks
  for delete using (auth.uid() = blocker_id);

-- ENABLE REALTIME for new tables
alter publication supabase_realtime add table public.friends;
alter publication supabase_realtime add table public.blocks;

-- Calendar Events table
create table if not exists public.calendar_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  time text,
  type text check (type in ('video', 'meeting', 'holiday')) default 'meeting',
  members integer default 1,
  event_date date not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for Calendar Events
alter table public.calendar_events enable row level security;

create policy "Users can manage their own calendar events" on public.calendar_events
  for all using (auth.uid() = user_id);

-- ENABLE REALTIME for calendar_events
alter publication supabase_realtime add table public.calendar_events;

-- USER SETTINGS TABLE
create table if not exists public.user_settings (
  id uuid primary key references public.profiles(id) on delete cascade,
  theme text default 'dark' check (theme in ('dark', 'light', 'midnight')),
  font_size integer default 16,
  allow_dms boolean default true,
  safe_messaging boolean default true,
  reduced_motion boolean default false,
  notifications_enabled boolean default true,
  sound_enabled boolean default true,
  read_receipts boolean default true,
  online_status_visible boolean default true,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS for user_settings
alter table public.user_settings enable row level security;

create policy "Users can manage their own settings" on public.user_settings
  for all using (auth.uid() = id);

-- Trigger for automatic user_settings creation
create or replace function public.handle_new_user_settings()
returns trigger as $$
begin
  insert into public.user_settings (id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created_settings
  after insert on public.profiles
  for each row execute procedure public.handle_new_user_settings();

-- ENABLE REALTIME for user_settings
alter publication supabase_realtime add table public.user_settings;
