-- Migration: In-app messaging (threads + messages) using Supabase RLS + Realtime
-- Adds:
-- - threads
-- - thread_participants (with last_read_at)
-- - messages
-- - listing_requests.thread_id + fixed UUID-safe RLS policies
-- - RPC: accept_listing_request(request_id) => thread_id (atomic)

-- ============================================================
-- 1) THREADS
-- ============================================================
create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  last_message_preview text
);

alter table public.threads enable row level security;

-- ============================================================
-- 2) THREAD PARTICIPANTS
-- ============================================================
create table if not exists public.thread_participants (
  thread_id uuid not null references public.threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (thread_id, user_id)
);

create index if not exists thread_participants_user_id_idx
  on public.thread_participants(user_id);

alter table public.thread_participants enable row level security;

drop policy if exists "Participants can view participants" on public.thread_participants;
create policy "Participants can view participants"
  on public.thread_participants
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = thread_participants.thread_id
        and tp.user_id = auth.uid()
    )
  );

drop policy if exists "Users can update their own last_read_at" on public.thread_participants;
create policy "Users can update their own last_read_at"
  on public.thread_participants
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Threads are only visible to participants
drop policy if exists "Participants can view threads" on public.threads;
create policy "Participants can view threads"
  on public.threads
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = threads.id
        and tp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3) MESSAGES
-- ============================================================
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) > 0),
  created_at timestamptz not null default now()
);

create index if not exists messages_thread_created_at_idx
  on public.messages(thread_id, created_at desc);

create index if not exists messages_sender_id_idx
  on public.messages(sender_id);

alter table public.messages enable row level security;

drop policy if exists "Participants can read messages" on public.messages;
create policy "Participants can read messages"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = messages.thread_id
        and tp.user_id = auth.uid()
    )
  );

drop policy if exists "Only participants can send messages as themselves" on public.messages;
create policy "Only participants can send messages as themselves"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.thread_participants tp
      where tp.thread_id = messages.thread_id
        and tp.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4) THREAD METADATA UPDATE ON NEW MESSAGE (DB-enforced)
-- ============================================================
create or replace function public.handle_message_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.threads
    set last_message_at = new.created_at,
        last_message_preview = left(new.body, 140)
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists on_message_insert on public.messages;
create trigger on_message_insert
  after insert on public.messages
  for each row
  execute function public.handle_message_insert();

-- ============================================================
-- 5) LISTING_REQUESTS: add thread_id + fix UUID-safe RLS
-- ============================================================
alter table public.listing_requests
  add column if not exists thread_id uuid references public.threads(id) on delete set null;

create index if not exists listing_requests_to_user_status_created_at_idx
  on public.listing_requests(to_user_id, status, created_at desc);

create index if not exists listing_requests_thread_id_idx
  on public.listing_requests(thread_id);

-- Drop old policies (some were created when user IDs were text)
drop policy if exists "Users can view their sent listing requests" on public.listing_requests;
drop policy if exists "Users can create listing requests" on public.listing_requests;
drop policy if exists "Listing owners can update requests" on public.listing_requests;

create policy "Users can view their listing requests"
  on public.listing_requests
  for select
  to authenticated
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can create listing requests"
  on public.listing_requests
  for insert
  to authenticated
  with check (
    auth.uid() = from_user_id
    and status = 'pending'
    and thread_id is null
    and exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.user_id = to_user_id
        and l.user_id <> auth.uid()
    )
  );

create policy "Recipients can update listing request status"
  on public.listing_requests
  for update
  to authenticated
  using (auth.uid() = to_user_id)
  with check (auth.uid() = to_user_id);

-- ============================================================
-- 6) RPC: accept_listing_request (atomic thread creation)
-- ============================================================
create or replace function public.accept_listing_request(p_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.listing_requests%rowtype;
  v_thread_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select *
    into v_req
  from public.listing_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Listing request not found' using errcode = 'P0002';
  end if;

  if v_req.to_user_id <> auth.uid() then
    raise exception 'Only the recipient can accept this request' using errcode = '42501';
  end if;

  if v_req.status <> 'pending' then
    if v_req.status = 'accepted' and v_req.thread_id is not null then
      return v_req.thread_id;
    end if;
    raise exception 'Request is not pending' using errcode = 'P0001';
  end if;

  insert into public.threads (last_message_at, last_message_preview)
  values (null, null)
  returning id into v_thread_id;

  insert into public.thread_participants (thread_id, user_id)
  values
    (v_thread_id, v_req.from_user_id),
    (v_thread_id, v_req.to_user_id);

  update public.listing_requests
    set status = 'accepted',
        thread_id = v_thread_id,
        responded_at = now()
  where id = p_request_id;

  return v_thread_id;
end;
$$;

revoke all on function public.accept_listing_request(uuid) from public;
grant execute on function public.accept_listing_request(uuid) to authenticated;

-- ============================================================
-- 7) Realtime: publish messages inserts
-- ============================================================
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'messages'
    ) then
      execute 'alter publication supabase_realtime add table public.messages';
    end if;
  end if;
end $$;

