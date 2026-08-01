import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Legend,
} from "recharts";
import { getMonthReports, getBudgetConfig, upsertDayReport } from "../lib/db.js";

const DAYS_JA = ["日","月","火","水","木","金","土"];
const WEATHER_ICON = { sunny:"☀️", cloudy:"⛅", rainy:"🌧️", snowy:"❄️" };
const fmt = (n) => (n == null || n === "" ? "" : Number(n).toLocaleString());
const daysInMonth = (y, m) => new Date(y, m, 0).getDate();
const toDateStr = (y, m, d) =>
  `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

const SOLID_DIVIDER = new Set([3, 5, 7, 9, 10]);
const DOTTED_DIVIDER = new Set([8]);
const divider = (i) =>
  SOLID_DIVIDER.has(i) ? "border-l border-l-gray-400"
  : DOTTED_DIVIDER.has(i) ? "border-l border-dotted border-l-gray-400" : "";

const HEADERS = [
  {main:"日付"},
  {main:"区分"},
  {main:"日別売上"},
  {main:"累計(A)"},
  {main:"達成率"},
  {main:"累計予算(B)"},
  {main:"差額"},
  {main:"豆(個)"},
  {main:"豆金額"},
  {main:"杯数"},
  {main:"確認"},
  {main:""},
];

const STAFF_BY_STORE = {
  nijo:    [{k:"check_kanagawa",l:"金川"},{k:"check_yoshino",l:"芳野"},{k:"check_matsuda",l:"松田"},{k:"check_munekiyo",l:"宗清"},{k:"check_miyata",l:"宮田"}],
  fushimi: [{k:"check_kanagawa",l:"金川"},{k:"check_miyao",l:"宮尾"},{k:"check_miyata",l:"宮田"},{k:"check_kawabata",l:"川端"},{k:"check_nakao",l:"中尾"}],
};

function CardView({ rows, todayStr, navigate, toggleCheck, staffKeys }) {
  return (
    <div className="space-y-2 mb-3">
      {rows.map(row => {
        const isToday = row.dateStr === todayStr;
        const dowStr = DAYS_JA[row.dow];
        return (
          <div key={row.dateStr}
            className={`bg-white rounded-xl border p-3 ${row.isFuture ? "opacity-30" : ""} ${isToday ? "border-[#1e3a5f] bg-blue-50" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="shrink-0 w-16">
                <p className={`text-sm font-bold ${row.isHol ? "text-red-500" : "text-gray-800"}`}>
                  {String(row.d).padStart(2,"0")}日/{dowStr}
                  {row.rep.weather && <span className="ml-0.5 text-[12px]">{WEATHER_ICON[row.rep.weather]}</span>}
                </p>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${row.isHol ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                  {row.isHol ? "休日" : "平日"}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {/* 累計 vs 目標累計差額・達成率 */}
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-base font-bold text-gray-900">
                    {row.cumSales != null ? `¥${fmt(row.cumSales)}` : "—"}
                  </span>
                  {row.cumRate != null && (
                    <span className={`text-sm font-bold ${row.cumRate >= 100 ? "text-[#1e3a5f]" : "text-red-500"}`}>
                      {row.cumRate}%
                    </span>
                  )}
                </div>
                <div className="flex gap-3 mt-0.5 text-[11px] flex-wrap">
                  {row.diff != null && (
                    <span className={`font-medium ${row.diff >= 0 ? "text-[#1e3a5f]" : "text-red-500"}`}>
                      差額 {row.diff >= 0 ? "+" : ""}¥{fmt(row.diff)}
                    </span>
                  )}
                  <span className="text-gray-400">日別 {row.sales > 0 ? `¥${fmt(row.sales)}` : "—"}</span>
                </div>
                <div className="flex gap-1 mt-1.5 flex-nowrap">
                  {staffKeys.map(({k,l}) => (
                    <button key={k} onClick={() => !row.isFuture && toggleCheck(row.dateStr, k)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition ${row.rep[k] ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div className="shrink-0">
                <button onClick={() => navigate(`daily?date=${row.dateStr}`)}
                  className="px-2.5 py-1 bg-[#1e3a5f] text-white rounded-lg text-xs hover:bg-[#162d4a] whitespace-nowrap">
                  {row.rep.sales ? "編集" : "入力"}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ navigate, store }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [config, setConfig] = useState(null);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState(
    () => localStorage.getItem("dashboard-view") || "table"
  );

  const staffKeys = STAFF_BY_STORE[store] || STAFF_BY_STORE.nijo;

  const switchView = (v) => {
    setView(v);
    localStorage.setItem("dashboard-view", v);
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cfg, reps] = await Promise.all([
        getBudgetConfig(year, month, store),
        getMonthReports(year, month, store),
      ]);
      setConfig(cfg);
      setReports(reps);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [year, month, store]);

  useEffect(() => { load(); }, [load]);

  const days = daysInMonth(year, month);
  const todayStr = toDateStr(today.getFullYear(), today.getMonth()+1, today.getDate());

  const rows = useMemo(() => {
    let cumSales = 0, cumBudget = 0;
    return Array.from({length: days}, (_, i) => {
      const d = i + 1;
      const dateStr = toDateStr(year, month, d);
      const dow = new Date(dateStr).getDay();
      const isHol = dow === 0 || dow === 6;
      const rep = reports[dateStr] || {};
      const budget = rep.budget != null && rep.budget !== ""
        ? rep.budget
        : (isHol ? config?.holiday_budget : config?.weekday_budget) || 0;
      const sales = rep.sales || 0;
      const isFuture = dateStr > todayStr;
      cumBudget += budget;
      if (!isFuture) { cumSales += sales; }
      const dayRate = budget > 0 ? Math.round(sales / budget * 100) : null;
      const cumRate = cumBudget > 0 ? (cumSales / cumBudget * 100).toFixed(1) : null;
      const diff = cumSales - cumBudget;
      return {
        d, dateStr, dow, isHol, rep, budget, sales,
        cumSales: isFuture ? null : cumSales,
        cumBudget,
        dayRate, cumRate, diff: isFuture ? null : diff, isFuture,
      };
    });
  }, [days, year, month, reports, config, todayStr]);

  const chartData = useMemo(() => {
    let paceCum = 0;
    return rows.map(r => {
      const dayBudget = r.isHol
        ? (config?.holiday_budget || 0)
        : (config?.weekday_budget || 0);
      paceCum += dayBudget;
      return {
        day: r.d,
        累計売上: r.isFuture ? null : r.cumSales,
        累計予算: r.isFuture ? null : r.cumBudget,
        目標ペース: paceCum,
      };
    });
  }, [rows, config]);

  const kpi = useMemo(() => {
    const actual = rows.filter(r => !r.isFuture);
    const totalSales    = actual.reduce((s, r) => s + r.sales, 0);
    const totalBudget   = actual.reduce((s, r) => s + r.budget, 0);
    const totalBean     = actual.reduce((s, r) => s + (r.rep.bean_qty || 0), 0);
    const totalBeanAmt  = actual.reduce((s, r) => s + (r.rep.bean_amount || 0), 0);
    const totalDrink    = actual.reduce((s, r) => s + (r.rep.drink_count || 0), 0);
    const rate = config?.target ? (totalSales / config.target * 100).toFixed(1) : null;
    return { totalSales, totalBudget, totalBean, totalBeanAmt, totalDrink, rate };
  }, [rows, config]);

  const toggleCheck = async (dateStr, key) => {
    const rep = reports[dateStr] || {};
    const updated = { ...rep, [key]: !rep[key] };
    setReports(prev => ({ ...prev, [dateStr]: updated }));
    try {
      await upsertDayReport(dateStr, { [key]: !rep[key] }, store);
    } catch {
      setReports(prev => ({ ...prev, [dateStr]: rep }));
    }
  };

  const prevMonth = () => { if (month === 1) { setYear(y => y-1); setMonth(12); } else setMonth(m => m-1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y+1); setMonth(1); } else setMonth(m => m+1); };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-sm gap-2">
      <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"/>
      読み込み中...
    </div>
  );

  return (
    <div className="flex-1 overflow-auto p-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">
          データの読み込みに失敗しました: {error}
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">‹</button>
        <span className="font-bold text-base">{year}年{month}月</span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">›</button>
        <div className="ml-auto flex rounded-lg border overflow-hidden text-xs font-medium">
          <button onClick={() => switchView("table")}
            className={`px-3 py-1.5 transition ${view === "table" ? "bg-[#1e3a5f] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            テーブル
          </button>
          <button onClick={() => switchView("card")}
            className={`px-3 py-1.5 border-l transition ${view === "card" ? "bg-[#1e3a5f] text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}>
            カード
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-3 mb-3">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-600 mb-2">月次累計チャート</p>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData} margin={{top:4,right:8,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis dataKey="day" tick={{fontSize:9}} tickFormatter={v=>`${v}日`}/>
                <YAxis tick={{fontSize:9}} tickFormatter={v=>`${(v/10000).toFixed(0)}万`} width={38}/>
                <Tooltip formatter={(v)=>`¥${fmt(v)}`} labelFormatter={v=>`${v}日`}/>
                <Legend wrapperStyle={{fontSize:10}}/>
                {config?.target && (
                  <ReferenceLine y={config.target} stroke="#f59e0b" strokeDasharray="4 4"
                    label={{value:"目標",fontSize:9,fill:"#f59e0b"}}/>
                )}
                <Line type="monotone" dataKey="累計売上" stroke="#2563eb" strokeWidth={2} dot={false}/>
                <Line type="monotone" dataKey="累計予算" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 4" dot={false}/>
                <Line type="monotone" dataKey="目標ペース" stroke="#f97316" strokeWidth={1.5} strokeDasharray="2 3" dot={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="sm:w-44 shrink-0 flex sm:flex-col gap-3 sm:border-l sm:pl-4 sm:justify-center">
            <div>
              <p className="text-[11px] text-gray-400">目標売上</p>
              <p className="text-lg font-bold text-[#1e3a5f]">¥{fmt(config?.target) || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">平日予算</p>
              <p className="text-lg font-bold text-gray-700">¥{fmt(config?.weekday_budget) || "—"}</p>
            </div>
            <div>
              <p className="text-[11px] text-gray-400">休日予算</p>
              <p className="text-lg font-bold text-red-500">¥{fmt(config?.holiday_budget) || "—"}</p>
            </div>
          </div>
        </div>
      </div>

      {view === "table" ? (
        <div className="bg-white rounded-xl border mb-3" style={{overflow:"auto", maxHeight:"calc(100vh - 300px)"}}>
          <table className="w-full" style={{fontSize:12}}>
            <thead className="sticky top-0 z-10">
              <tr className="border-b-2 border-b-gray-300 bg-gray-50">
                {HEADERS.map(({main, sub}, i) => (
                  <th key={i} className={`px-1.5 py-1.5 text-center font-medium text-gray-400 whitespace-nowrap bg-gray-50 ${divider(i)}`}>
                    <div>{main}</div>
                    {sub && <div className="text-[9px] font-normal text-gray-300">{sub}</div>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => {
                const isToday = row.dateStr === todayStr;
                const rowCls = `border-b ${row.isFuture ? "opacity-30" : ""} ${isToday ? "bg-blue-50" : ""}`;
                const dowStr = DAYS_JA[row.dow];
                const isWknd = row.isHol;
                return (
                  <tr key={row.dateStr} className={rowCls}>
                    <td className="px-1.5 py-1 text-center whitespace-nowrap">
                      <span className={isWknd ? "text-red-500 font-medium" : ""}>
                        {String(row.d).padStart(2,"0")}/{dowStr}
                      </span>
                      {row.rep.weather && (
                        <span className="ml-0.5 text-[11px]">{WEATHER_ICON[row.rep.weather]}</span>
                      )}
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <span className={`px-1 py-0.5 rounded text-[10px] font-medium ${isWknd ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                        {isWknd ? "休" : "平"}
                      </span>
                    </td>
                    <td className="px-1.5 py-1 text-right">
                      <div>{row.sales > 0 ? `¥${fmt(row.sales)}` : "—"}</div>
                      {row.dayRate != null && (
                        <div className={`text-[9px] ${row.dayRate >= 100 ? "text-[#2563aa]" : "text-red-400"}`}>{row.dayRate}%</div>
                      )}
                    </td>
                    <td className={`px-1.5 py-1 text-right bg-lime-50 ${divider(3)}`}>
                      <span className="font-bold text-sm">{row.sales > 0 && row.cumSales != null ? `¥${fmt(row.cumSales)}` : ""}</span>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      {row.sales > 0 && row.cumRate != null && (
                        <span className={`text-sm font-bold ${row.cumRate >= 100 ? "text-[#1e3a5f]" : "text-red-500"}`}>{row.cumRate}%</span>
                      )}
                    </td>
                    <td className={` px-1.5 py-1 text-right bg-blue-50 ${divider(5)}`}>
                      <span className="font-bold text-sm">{row.cumBudget != null ? `¥${fmt(row.cumBudget)}` : ""}</span>
                    </td>
                    <td className=" px-1.5 py-1 text-right font-medium">
                      {row.diff != null && (
                        <span className={row.diff >= 0 ? "text-[#1e3a5f]" : "text-red-500"}>
                          {row.diff >= 0 ? "+" : ""}¥{fmt(row.diff)}
                        </span>
                      )}
                    </td>
                    <td className={` px-1.5 py-1 text-center ${divider(7)}`}>{row.rep.bean_qty ? `${row.rep.bean_qty}個` : ""}</td>
                    <td className={` px-1.5 py-1 text-right ${divider(8)}`}>{row.rep.bean_amount ? `¥${fmt(row.rep.bean_amount)}` : ""}</td>
                    <td className={` px-1.5 py-1 text-center text-[10px] whitespace-nowrap ${divider(9)}`}>{row.rep.drink_count ? `${row.rep.drink_count}杯` : ""}</td>
                    <td className={`px-1 py-1 ${divider(10)}`}>
                      <div className="flex gap-0.5 flex-wrap" style={{maxWidth:"72px"}}>
                        {staffKeys.map(({k,l}) => (
                          <button key={k} onClick={() => !row.isFuture && toggleCheck(row.dateStr, k)}
                            className={`px-1 py-0.5 rounded text-[10px] font-medium transition whitespace-nowrap ${row.rep[k] ? "bg-green-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-1.5 py-1 text-center">
                      <button onClick={() => navigate(`daily?date=${row.dateStr}`)}
                        className="px-2 py-0.5 bg-[#1e3a5f] text-white rounded text-[10px] hover:bg-[#162d4a] whitespace-nowrap">
                        {row.rep.sales ? "編集" : "入力"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <CardView rows={rows} todayStr={todayStr} navigate={navigate} toggleCheck={toggleCheck} staffKeys={staffKeys}/>
      )}

      <div className="grid grid-cols-3 gap-2 mb-2">
        {[
          {l:"累計売上",    v:`¥${fmt(kpi.totalSales)}`,                         c:"text-[#1e3a5f]"},
          {l:"累計予算",    v:`¥${fmt(kpi.totalBudget)}`,                        c:"text-gray-700"},
          {l:"目標達成率",  v:kpi.rate!=null?`${kpi.rate}%`:"—",                c:kpi.rate>=100?"text-[#1e3a5f]":"text-red-500"},
          {l:"豆販売(個)",  v:fmt(kpi.totalBean)||"—",                           c:"text-gray-700"},
          {l:"豆販売金額",  v:kpi.totalBeanAmt?`¥${fmt(kpi.totalBeanAmt)}`:"—", c:"text-gray-700"},
          {l:"ドリンク杯数",v:fmt(kpi.totalDrink)||"—",                          c:"text-gray-700"},
        ].map(({l,v,c},i) => (
          <div key={i} className="bg-white rounded-xl border p-2 text-center">
            <p className="text-gray-400 text-[10px]">{l}</p>
            <p className={`font-bold text-sm ${c}`}>{v}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
