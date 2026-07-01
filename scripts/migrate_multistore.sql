-- ============================================================
-- 多店舗対応マイグレーション
-- Supabase SQL Editor で実行してください
-- ============================================================

-- ─── sales_reports: store_id 追加・PK 変更 ─────────────────

-- 既存データを二条として扱う
alter table sales_reports add column if not exists store_id text not null default 'nijo';

-- PK を (date, store_id) に変更
alter table sales_reports drop constraint sales_reports_pkey;
alter table sales_reports add primary key (date, store_id);

-- 新スタッフ用チェック列
alter table sales_reports add column if not exists check_munekiyo boolean default false;
alter table sales_reports add column if not exists check_miyao     boolean default false;
alter table sales_reports add column if not exists check_kawamoto  boolean default false;
alter table sales_reports add column if not exists check_nakao     boolean default false;

-- 天気・スタッフ評価コメント
alter table sales_reports add column if not exists weather        text;
alter table sales_reports add column if not exists staff_comments jsonb default '{}';

-- ─── budget_configs: store_id 追加・PK 変更 ────────────────

alter table budget_configs add column if not exists store_id text not null default 'nijo';

alter table budget_configs drop constraint budget_configs_pkey;
alter table budget_configs add primary key (year, month, store_id);

-- ─── bean_products: 店舗表示フラグ追加 ─────────────────────

alter table bean_products add column if not exists show_nijo    boolean default true;
alter table bean_products add column if not exists show_fushimi boolean default true;

-- ─── RLS ポリシー再作成（既存の "anon all" はそのまま有効）─
-- 変更不要。既存ポリシーが store_id 列含む行にも適用される。
