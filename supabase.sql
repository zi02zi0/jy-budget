-- 빵지 가계부 테이블 만들기
-- Supabase 대시보드 → SQL Editor → New query 에 통째로 붙여 넣고 Run 하세요.

create table if not exists public.docs (
  user_id    uuid not null default auth.uid() references auth.users on delete cascade,
  path       text not null,            -- 예: 'tx/2026-11', 'meta/wallets'
  data       jsonb not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);

alter table public.docs enable row level security;

-- 로그인한 본인 데이터만 읽고 쓸 수 있어요
create policy "docs_select_own" on public.docs for select using (auth.uid() = user_id);
create policy "docs_insert_own" on public.docs for insert with check (auth.uid() = user_id);
create policy "docs_update_own" on public.docs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "docs_delete_own" on public.docs for delete using (auth.uid() = user_id);

-- 폰·PC 실시간 동기화
alter publication supabase_realtime add table public.docs;
