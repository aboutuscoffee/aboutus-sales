-- ============================================================
-- About Us Coffee 売上管理 — Supabase セットアップ
-- Supabase の SQL Editor で実行してください
-- ============================================================

-- ─── テーブル設計の考え方 ──────────────────────────────────
--
-- [sales_reports] 1行 = 1日の実績
--   sales      → 日別売上入力 の保存先
--   budget     → 特定日だけ予算を上書きしたい場合の日別予算
--                null の場合は budget_configs の平日/休日デフォルト値を使用
--
-- [budget_configs] 1行 = 1ヶ月の予算設定
--   target         → 月間目標売上
--   weekday_budget → 平日のデフォルト日別予算
--   holiday_budget → 休日のデフォルト日別予算
--
-- 達成率・残り必要売上はすべてアプリ側で計算（追加テーブル不要）:
--   達成率         = 累計売上 ÷ 累計予算 × 100
--   残り必要売上   = 月間目標 − 今日までの累計売上
--   1日あたり必要額 = 残り必要売上 ÷ 残り日数
-- ──────────────────────────────────────────────────────────

-- ─── テーブル作成 ──────────────────────────────────────────

create table if not exists sales_reports (
  date            date primary key,
  sales           numeric,           -- 日別売上
  budget          numeric,           -- 日別予算上書き（null = budget_configs のデフォルト使用）
  drink_count     integer,
  bean_qty        integer,
  bean_amount     numeric,
  bean_sales      jsonb,
  diary           text,
  good_points     text,
  handover        text,
  comment         text,
  check_kanagawa  boolean default false,
  check_yoshino   boolean default false,
  check_miyata    boolean default false,
  check_matsuda   boolean default false,
  updated_at      timestamptz default now()
);

create table if not exists budget_configs (
  year              integer not null,
  month             integer not null,
  target            numeric,          -- 月間目標売上
  weekday_budget    numeric,          -- 平日デフォルト日別予算
  holiday_budget    numeric,          -- 休日デフォルト日別予算
  primary key (year, month)
);

create table if not exists bean_products (
  id      text primary key,
  name    text not null,
  grams   integer not null,
  price   numeric not null
);

-- ─── RLS ───────────────────────────────────────────────────
-- Beans Profile と同じ方針: SELECT/INSERT/UPDATE/DELETE すべて anon 可
-- パスワードはアプリ側でガード

alter table sales_reports  enable row level security;
alter table budget_configs enable row level security;
alter table bean_products  enable row level security;

create policy "anon all" on sales_reports  for all to anon using (true) with check (true);
create policy "anon all" on budget_configs for all to anon using (true) with check (true);
create policy "anon all" on bean_products  for all to anon using (true) with check (true);

-- ─── 2026-06 シードデータ ──────────────────────────────────

insert into sales_reports (date, sales, bean_qty, bean_amount, drink_count) values
  ('2026-06-01', null,   null,  null,  41),
  ('2026-06-02', null,   null,  null,  44),
  ('2026-06-03', 64250,  3,     8500,  33),
  ('2026-06-04', 41900,  2,     5650,  31),
  ('2026-06-05', 51100,  1,     2350,  48),
  ('2026-06-06', 84510,  5,    13100,  58),
  ('2026-06-07', 40900,  1,     3000,  35),
  ('2026-06-08', 75100,  9,    31700,  33),
  ('2026-06-09', 43350,  3,     8250,  27),
  ('2026-06-10', 108210, 9,    31700,  53),
  ('2026-06-11', 86350,  10,   37336,  39),
  ('2026-06-12', 50450,  4,    11760,  24),
  ('2026-06-13', 59514,  5,    15094,  36),
  ('2026-06-14', 93900,  9,    28650,  47),
  ('2026-06-15', 75950,  4,    46200,  37),
  ('2026-06-16', 63350,  2,     5100,  0),
  ('2026-06-17', 61200,  5,    13844,  37),
  ('2026-06-18', 48600,  2,     8334,  32)
on conflict (date) do nothing;
