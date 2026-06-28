import { useState, useEffect, useCallback } from "react";
import { getBudgetConfig, upsertBudgetConfig } from "../lib/db.js";

export default function BudgetSettings() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [form, setForm] = useState({ target:"", weekday_budget:"", holiday_budget:"" });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getBudgetConfig(year, month);
      if (r) setForm({ target: r.target ?? "", weekday_budget: r.weekday_budget ?? "", holiday_budget: r.holiday_budget ?? "" });
      else setForm({ target:"", weekday_budget:"", holiday_budget:"" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaved(false);
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setError(null);
    try {
      await upsertBudgetConfig(year, month, {
        target: Number(form.target),
        weekday_budget: Number(form.weekday_budget),
        holiday_budget: Number(form.holiday_budget),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    }
  };

  const set = (k, v) => setForm(f => ({...f, [k]: v}));

  return (
    <div className="bg-white rounded-xl border p-4 space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">年</label>
          <input type="number" value={year} onChange={e=>setYear(Number(e.target.value))}
            className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
        </div>
        <div>
          <label className="text-xs text-gray-500 block mb-0.5">月</label>
          <select value={month} onChange={e=>setMonth(Number(e.target.value))}
            className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]">
            {Array.from({length:12},(_,i) => <option key={i+1} value={i+1}>{i+1}月</option>)}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="text-center text-gray-400 text-sm py-4">読み込み中...</div>
      ) : [
        {k:"target",         l:"月次目標 (¥)"},
        {k:"weekday_budget", l:"平日予算 (¥)"},
        {k:"holiday_budget", l:"休日予算 (¥)"},
      ].map(({k,l}) => (
        <div key={k}>
          <label className="text-xs text-gray-500 block mb-0.5">{l}</label>
          <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)}
            className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
        </div>
      ))}
      <button onClick={save} className="w-full bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#162d4a]">
        {saved ? "✓ 保存しました" : "保存する"}
      </button>
    </div>
  );
}
