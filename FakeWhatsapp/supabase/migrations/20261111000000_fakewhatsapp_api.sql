-- FakeWhatsapp schema: profiles, devices, direct/group conversations and messages.
-- Apply with `supabase db push` or the Supabase SQL editor.

create extension if not exists pgcrypto;
create extension if not exists pg_net;
create extension if not exists supabase_vault with schema vault;

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text not null default 'Usuario',
    avatar_path text,
    last_seen_at timestamptz,
    created_at timestamptz not null default now()
);

create table if not exists public.push_devices (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    provider text not null check (provider in ('fcm')),
    token text not null,
    device_name text,
    updated_at timestamptz not null default now(),
    unique (provider, token)
);

create table if not exists public.conversations (
    id uuid primary key default gen_random_uuid(),
    title text,
    is_group boolean not null default false,
    direct_key text unique,
    created_by uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    constraint direct_key_for_direct_only check (
        (is_group and direct_key is null) or (not is_group and direct_key is not null)
    )
);

create table if not exists public.conversation_members (
    conversation_id uuid not null references public.conversations (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    member_role text not null default 'member' check (member_role in ('admin', 'member')),
    joined_at timestamptz not null default now(),
    primary key (conversation_id, user_id)
);

create table if not exists public.messages (
    id uuid primary key default gen_random_uuid(),
    conversation_id uuid not null references public.conversations (id) on delete cascade,
    sender_id uuid not null references public.profiles (id) on delete cascade,
    body text,
    image_path text,
    created_at timestamptz not null default now(),
    read_at timestamptz,
    deleted_at timestamptz,
    constraint message_has_content check (
        nullif(btrim(body), '') is not null or image_path is not null
    )
);

create index if not exists conversation_members_user_idx
    on public.conversation_members (user_id, conversation_id);
create index if not exists messages_conversation_created_idx
    on public.messages (conversation_id, created_at desc);
create index if not exists messages_sender_idx
    on public.messages (sender_id);

create or replace function public.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select exists (
        select 1
        from public.conversation_members cm
        where cm.conversation_id = p_conversation_id
          and cm.user_id = (select auth.uid())
    );
$$;

revoke all on function public.is_conversation_member(uuid) from public;
grant execute on function public.is_conversation_member(uuid) to authenticated;

create or replace function public.can_view_profile(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
    select p_user_id = (select auth.uid()) or exists (
        select 1
          from public.conversation_members mine
          join public.conversation_members theirs using (conversation_id)
         where mine.user_id = (select auth.uid())
           and theirs.user_id = p_user_id
    );
$$;

revoke all on function public.can_view_profile(uuid) from public, anon;
grant execute on function public.can_view_profile(uuid) to authenticated;

create or replace function public.try_uuid(p_value text)
returns uuid
language plpgsql
immutable
set search_path = ''
as $$
begin
    return p_value::uuid;
exception when others then
    return null;
end;
$$;

revoke all on function public.try_uuid(text) from public, anon;
grant execute on function public.try_uuid(text) to authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, display_name)
    values (
        new.id,
        coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(new.email, 'Usuario'), '@', 1))
    )
    on conflict (id) do nothing;
    return new;
end;
$$;

drop trigger if exists on_auth_user_created_fakewhatsapp on auth.users;
create trigger on_auth_user_created_fakewhatsapp
    after insert on auth.users
    for each row execute function public.handle_new_user();

create or replace function public.create_conversation(
    p_title text,
    p_member_ids uuid[],
    p_is_group boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_creator uuid := auth.uid();
    v_members uuid[];
    v_direct_key text;
    v_conversation_id uuid;
    v_member_id uuid;
begin
    if v_creator is null then
        raise exception 'Debes iniciar sesión para crear una conversación';
    end if;

    select coalesce(array_agg(distinct member_id order by member_id), array[]::uuid[])
      into v_members
      from unnest(coalesce(p_member_ids, array[]::uuid[])) as member_id
     where member_id is not null and member_id <> v_creator;

    if not p_is_group and cardinality(v_members) <> 1 then
        raise exception 'Un chat individual requiere exactamente otro participante';
    end if;
    if p_is_group and cardinality(v_members) < 1 then
        raise exception 'Un grupo requiere al menos otro participante';
    end if;
    if p_is_group and nullif(btrim(p_title), '') is null then
        raise exception 'El grupo necesita un nombre';
    end if;

    if not p_is_group then
        v_direct_key := least(v_creator::text, v_members[1]::text) || ':' || greatest(v_creator::text, v_members[1]::text);
        select id into v_conversation_id
          from public.conversations
         where direct_key = v_direct_key;
        if v_conversation_id is not null then
            return v_conversation_id;
        end if;
    end if;

    insert into public.conversations (title, is_group, direct_key, created_by)
    values (nullif(btrim(p_title), ''), p_is_group, v_direct_key, v_creator)
    on conflict (direct_key) do nothing
    returning id into v_conversation_id;

    -- If two requests create the same direct chat at once, reuse the winner.
    if v_conversation_id is null and v_direct_key is not null then
        select id into v_conversation_id
          from public.conversations
         where direct_key = v_direct_key;
        if v_conversation_id is not null then
            return v_conversation_id;
        end if;
    end if;

    insert into public.conversation_members (conversation_id, user_id, member_role)
    values (v_conversation_id, v_creator, 'admin');

    foreach v_member_id in array v_members loop
        insert into public.conversation_members (conversation_id, user_id)
        values (v_conversation_id, v_member_id);
    end loop;

    return v_conversation_id;
end;
$$;

create or replace function public.register_push_device(
    p_token text,
    p_device_name text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_user_id uuid := auth.uid();
    v_device_id uuid;
begin
    if v_user_id is null then
        raise exception 'Debes iniciar sesión para registrar el dispositivo';
    end if;
    if nullif(btrim(p_token), '') is null then
        raise exception 'El token FCM es obligatorio';
    end if;

    insert into public.push_devices (user_id, provider, token, device_name, updated_at)
    values (v_user_id, 'fcm', p_token, p_device_name, now())
    on conflict (provider, token) do update
       set user_id = excluded.user_id,
           device_name = excluded.device_name,
           updated_at = now()
    returning id into v_device_id;
    return v_device_id;
end;
$$;

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if auth.uid() is null or not public.is_conversation_member(p_conversation_id) then
        raise exception 'No tienes acceso a esta conversación';
    end if;
    update public.messages
       set read_at = coalesce(read_at, now())
     where conversation_id = p_conversation_id
       and sender_id <> auth.uid()
       and read_at is null;
end;
$$;

create or replace function public.delete_message(p_message_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    update public.messages
       set body = 'Mensaje eliminado',
           image_path = null,
           deleted_at = coalesce(deleted_at, now())
     where id = p_message_id
       and sender_id = auth.uid()
       and deleted_at is null;
    if not found then
        raise exception 'No se pudo eliminar el mensaje';
    end if;
end;
$$;

create or replace function public.unregister_push_device(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    delete from public.push_devices
     where user_id = auth.uid()
       and provider = 'fcm'
       and token = p_token;
end;
$$;

grant execute on function public.create_conversation(text, uuid[], boolean) to authenticated;
grant execute on function public.register_push_device(text, text) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.delete_message(uuid) to authenticated;
grant execute on function public.unregister_push_device(text) to authenticated;
revoke all on function public.create_conversation(text, uuid[], boolean) from public, anon;
revoke all on function public.register_push_device(text, text) from public, anon;
revoke all on function public.mark_conversation_read(uuid) from public, anon;
revoke all on function public.delete_message(uuid) from public, anon;
revoke all on function public.unregister_push_device(text) from public, anon;

-- Existing accounts created before this migration also get a profile row.
insert into public.profiles (id, display_name)
select id, coalesce(nullif(btrim(raw_user_meta_data ->> 'display_name'), ''), split_part(coalesce(email, 'Usuario'), '@', 1))
from auth.users
on conflict (id) do nothing;

alter table public.profiles enable row level security;
alter table public.push_devices enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

drop policy if exists "Profiles are visible to signed-in users" on public.profiles;
create policy "Profiles are visible to signed-in users"
    on public.profiles for select to authenticated using (true);
drop policy if exists "Users update their own profile" on public.profiles;
create policy "Users update their own profile"
    on public.profiles for update to authenticated
    using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists "Users see their own push devices" on public.push_devices;
create policy "Users see their own push devices"
    on public.push_devices for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Members see conversations" on public.conversations;
create policy "Members see conversations"
    on public.conversations for select to authenticated
    using (public.is_conversation_member(id));

drop policy if exists "Members see participant lists" on public.conversation_members;
create policy "Members see participant lists"
    on public.conversation_members for select to authenticated
    using (public.is_conversation_member(conversation_id));

drop policy if exists "Members see messages" on public.messages;
create policy "Members see messages"
    on public.messages for select to authenticated
    using (public.is_conversation_member(conversation_id));
drop policy if exists "Members send messages as themselves" on public.messages;
create policy "Members send messages as themselves"
    on public.messages for insert to authenticated
    with check (
        sender_id = (select auth.uid())
        and public.is_conversation_member(conversation_id)
    );

-- Only authenticated users can call the REST API; RLS keeps data scoped to membership.
grant select on public.profiles, public.conversations, public.conversation_members, public.messages, public.push_devices to authenticated;
grant insert on public.messages to authenticated;
grant update on public.profiles to authenticated;

insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', false), ('message-images', 'message-images', false)
on conflict (id) do nothing;

drop policy if exists "Users upload their profile photos" on storage.objects;
create policy "Users upload their profile photos"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'profile-photos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );
drop policy if exists "Users read profile photos" on storage.objects;
create policy "Users read profile photos"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'profile-photos'
        and public.can_view_profile(public.try_uuid((storage.foldername(name))[1]))
    );
drop policy if exists "Users update their profile photos" on storage.objects;
create policy "Users update their profile photos"
    on storage.objects for update to authenticated
    using (
        bucket_id = 'profile-photos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    )
    with check (
        bucket_id = 'profile-photos'
        and (storage.foldername(name))[1] = (select auth.uid())::text
    );
drop policy if exists "Members upload conversation images" on storage.objects;
create policy "Members upload conversation images"
    on storage.objects for insert to authenticated
    with check (
        bucket_id = 'message-images'
        and (storage.foldername(name))[1] = (select auth.uid())::text
        and public.is_conversation_member(public.try_uuid((storage.foldername(name))[2]))
    );
drop policy if exists "Members read conversation images" on storage.objects;
create policy "Members read conversation images"
    on storage.objects for select to authenticated
    using (
        bucket_id = 'message-images'
        and public.is_conversation_member(public.try_uuid((storage.foldername(name))[2]))
    );

-- The webhook secret and project URL are stored in Vault, never committed here.
create or replace function public.notify_fakewhatsapp_new_message()
returns trigger
language plpgsql
security definer
set search_path = public, vault, net
as $$
declare
    v_project_url text;
    v_webhook_secret text;
begin
    select decrypted_secret into v_project_url
      from vault.decrypted_secrets
     where name = 'fakewhatsapp_project_url'
     limit 1;
    select decrypted_secret into v_webhook_secret
      from vault.decrypted_secrets
     where name = 'fakewhatsapp_webhook_secret'
     limit 1;

    if nullif(v_project_url, '') is null or nullif(v_webhook_secret, '') is null then
        raise warning 'FakeWhatsapp push webhook skipped: configure both Supabase Vault secrets.';
        return new;
    end if;

    perform net.http_post(
        url := rtrim(v_project_url, '/') || '/functions/v1/send-message-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'X-Webhook-Secret', v_webhook_secret
        ),
        body := to_jsonb(new),
        timeout_milliseconds := 10000
    );
    return new;
end;
$$;

drop trigger if exists on_fakewhatsapp_message_inserted on public.messages;
create trigger on_fakewhatsapp_message_inserted
    after insert on public.messages
    for each row execute function public.notify_fakewhatsapp_new_message();

-- Enable message change events when the standard Supabase Realtime publication exists.
do $$
begin
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
       and not exists (
           select 1 from pg_publication_tables
            where pubname = 'supabase_realtime'
              and schemaname = 'public'
              and tablename = 'messages'
       ) then
        alter publication supabase_realtime add table public.messages;
    end if;
end;
$$;
