import { supabase } from './supabase.js';

const toDateStr = (y, m, d) =>
  `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

// ─── Sales Reports ─────────────────────────────────────────────────

export async function getMonthReports(y, m) {
  const start = toDateStr(y, m, 1);
  const lastDay = new Date(y, m, 0).getDate();
  const end = toDateStr(y, m, lastDay);
  const { data, error } = await supabase
    .from('sales_reports')
    .select('*')
    .gte('date', start)
    .lte('date', end);
  if (error) throw error;
  const map = {};
  for (const row of data || []) {
    map[row.date] = row;
  }
  return map;
}

export async function upsertDayReport(dateStr, data) {
  const { error } = await supabase
    .from('sales_reports')
    .upsert({ date: dateStr, ...data }, { onConflict: 'date' });
  if (error) throw error;
}

// ─── Bean Products ──────────────────────────────────────────────────

export async function getProducts() {
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

export async function getBudgetConfig(y, m) {
  const { data, error } = await supabase
    .from('budget_configs')
    .select('*')
    .eq('year', y)
    .eq('month', m)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertBudgetConfig(y, m, config) {
  const { error } = await supabase
    .from('budget_configs')
    .upsert({ year: y, month: m, ...config }, { onConflict: 'year,month' });
  if (error) throw error;
}
