-- Supabase Database Schema for Chat App

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Profiles table: linked to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text unique not null,
  avatar_url text,
  status text check (status in ('online', 'offline', 'typing')) default 'offline',
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Chats table: container for group or private messages
create table if not exists public.chats (
  id uuid primary key default uuid_generate_v4(),
  type text check (type in ('private', 'group')) default 'private',
  name text, -- only used for group chats
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Chat Participants table: join table For users in chats
create table if not exists public.chat_participants (
  id uuid primary key default uuid_generate_v4(),
  chat_id uuid references public.chats(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
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
  for select using (
    exists (
      select 1 from public.chat_participants
      where chat_id = public.chats.id and user_id = auth.uid()
    )
  );

-- Chat Participants: users can see participants in chats they belong to
create policy "Users can view participants in their chats." on public.chat_participants
  for select using (
    exists (
      select 1 from public.chat_participants
      where chat_id = public.chat_participants.chat_id and user_id = auth.uid()
    )
  );

-- Messages: users can see messages in chats they belong to
create policy "Users can view messages in their chats." on public.messages
  for select using (
    exists (
      select 1 from public.chat_participants
      where chat_id = public.messages.chat_id and user_id = auth.uid()
    )
  );

create policy "Users can insert messages in their chats." on public.messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.chat_participants
      where chat_id = public.messages.chat_id and user_id = auth.uid()
    )
  );

-- AUTH TRIGGER for automatic profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, avatar_url)
  values (
    new.id, 
    coalesce(new.raw_user_meta_data->>'full_name', new.email), 
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

create policy "Users can delete their own media." on storage.objects
  for delete using (
    bucket_id = 'chat-media' and
    auth.uid() = owner
  );
