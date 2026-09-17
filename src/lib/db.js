import { supabase } from './supabase.js';

const toDateStr = (y, m, d) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// ─── Sales Reports ─────────────────────────────────────────────────

async function sbFetch(path) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function getMonthReports(y, m, store) {
  const start = toDateStr(y, m, 1);
  const lastDay = new Date(y, m, 0).getDate();
  const end = toDateStr(y, m, lastDay);
  const rows = await sbFetch(
    `sales_reports?select=*&store_id=eq.${store}&date=gte.${start}&date=lte.${end}`
  );
  const map = {};
  for (const row of rows) map[row.date] = row;
  return map;
}

export async function upsertDayReport(dateStr, data, store) {
  const { error } = await supabase
    .from('sales_reports')
    .upsert({ date: dateStr, store_id: store, ...data }, { onConflict: 'date,store_id' });
  if (error) throw error;
}

// ─── Bean Products ──────────────────────────────────────────────────

export async function getProducts(store) {
  const col = store === 'fushimi' ? 'show_fushimi' : 'show_nijo';
  const { data, error } = await supabase
    .from('bean_products')
    .select('*')
    .eq(col, true)
    .eq('active', true)
    .order('name')
    .order('grams');
  if (error) throw error;
  return data || [];
}

export async function getAllProducts() {
  const { data, error } = await supabase
    .from('bean_products')
    .select('*')
    .order('name')
    .order('grams');
  if (error) throw error;
  return data || [];
}

export async function upsertProduct(product) {
  const { error } = await supabase
    .from('bean_products')
    .upsert(product, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('bean_products')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ─── Budget Config ──────────────────────────────────────────────────

export async function getBudgetConfig(y, m, store) {
  const { data, error } = await supabase
    .from('budget_configs')
    .select('*')
    .eq('year', y)
    .eq('month', m)
    .eq('store_id', store)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertBudgetConfig(y, m, config, store) {
  const { error } = await supabase
    .from('budget_configs')
    .upsert({ year: y, month: m, store_id: store, ...config }, { onConflict: 'year,month,store_id' });
  if (error) throw error;
}

// ─── Read By ────────────────────────────────────────────────────────

export async function updateReadBy(dateStr, store, readBy) {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const res = await fetch(
    `${url}/rest/v1/sales_reports?date=eq.${dateStr}&store_id=eq.${store}`,
    {
      method: 'PATCH',
      headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ read_by: readBy }),
      cache: 'no-store',
    }
  );
  if (!res.ok) throw new Error(await res.text());
}

export async function getDayReport(dateStr, store) {
  const rows = await sbFetch(
    `sales_reports?select=date,sales,diary,read_by,closed&store_id=eq.${store}&date=eq.${dateStr}&limit=1`
  );
  return rows[0] ?? null;
}
