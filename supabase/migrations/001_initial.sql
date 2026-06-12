-- Festival Crew — initial schema

create table if not exists groups (
  code        text primary key,
  name        text not null,
  expires_at  timestamptz,
  created_at  timestamptz default now()
);

create table if not exists members (
  id           uuid primary key default gen_random_uuid(),
  group_code   text not null references groups(code) on delete cascade,
  display_name text not null check(length(display_name) between 1 and 20),
  color        text not null,
  lat          double precision,
  lng          double precision,
  accuracy_m   integer,
  last_seen    timestamptz default now(),
  is_sos       boolean default false,
  created_at   timestamptz default now()
);

create index if not exists members_group_idx on members(group_code);

create table if not exists pois (
  id          uuid primary key default gen_random_uuid(),
  group_code  text not null references groups(code) on delete cascade,
  label       text not null,
  icon        text not null default 'custom',
  lat         double precision not null,
  lng         double precision not null,
  created_at  timestamptz default now()
);

create index if not exists pois_group_idx on pois(group_code);

create table if not exists bulletin_posts (
  id          uuid primary key default gen_random_uuid(),
  group_code  text not null references groups(code) on delete cascade,
  author_name text not null,
  content     text not null check(length(content) between 1 and 280),
  kind        text not null default 'message' check(kind in ('message', 'sos', 'meetme')),
  lat         double precision,
  lng         double precision,
  created_at  timestamptz default now()
);

create index if not exists posts_group_time_idx on bulletin_posts(group_code, created_at desc);

create table if not exists meet_pins (
  id          uuid primary key default gen_random_uuid(),
  group_code  text not null references groups(code) on delete cascade,
  label       text not null,
  lat         double precision not null,
  lng         double precision not null,
  created_by  uuid not null references members(id) on delete cascade,
  expires_at  timestamptz not null,
  created_at  timestamptz default now()
);

create index if not exists pins_group_expires_idx on meet_pins(group_code, expires_at);

-- Enable Row Level Security (permissive for festival use — no sensitive data)
alter table groups enable row level security;
alter table members enable row level security;
alter table pois enable row level security;
alter table bulletin_posts enable row level security;
alter table meet_pins enable row level security;

-- Allow all operations with anon key (group code is the only secret)
create policy "public read groups" on groups for select using (true);
create policy "public insert groups" on groups for insert with check (true);

create policy "public read members" on members for select using (true);
create policy "public insert members" on members for insert with check (true);
create policy "public update members" on members for update using (true);

create policy "public read pois" on pois for select using (true);
create policy "public insert pois" on pois for insert with check (true);

create policy "public read posts" on bulletin_posts for select using (true);
create policy "public insert posts" on bulletin_posts for insert with check (true);

create policy "public read pins" on meet_pins for select using (true);
create policy "public insert pins" on meet_pins for insert with check (true);
create policy "public delete pins" on meet_pins for delete using (true);

-- Enable realtime on these tables (run in Supabase dashboard if not via migration)
-- ALTER PUBLICATION supabase_realtime ADD TABLE members;
-- ALTER PUBLICATION supabase_realtime ADD TABLE bulletin_posts;
-- ALTER PUBLICATION supabase_realtime ADD TABLE meet_pins;
