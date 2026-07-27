import { supabase } from './supabase.js';

const toDateStr = (y, m, d) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// ─── Sales Reports ─────────────────────────────────────────────────

export async function getMonthReports(y, m, store) {
  const start = toDateStr(y, m, 1);
  const lastDay = new Date(y, m, 0).getDate();
  const end = toDateStr(y, m, lastDay);
  const { data, error } = await supabase
    .from('sales_reports')
    .select('*')
    .eq('store_id', store)
    .gte('date', start)
    .lte('date', end);
  if (error) throw error;
  const map = {};
  for (const row of data || []) {
    map[row.date] = row;
  }
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
