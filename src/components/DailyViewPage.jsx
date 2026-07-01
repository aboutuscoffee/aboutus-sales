import { useState, useEffect, useCallback } from "react";
import { getMonthReports } from "../lib/db.js";

const DAYS_JA = ["日","月","火","水","木","金","土"];
const fmt = (n) => (n == null || n === "" ? "" : Number(n).toLocaleString());
const toDateStr = (y, m, d) =>
  `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

const WEATHER_LABEL = { sunny:"☀️ 晴れ", cloudy:"⛅ 曇り", rainy:"🌧️ 雨", snowy:"❄️ 雪" };

export default function DailyViewPage({ navigate, searchParams, store }) {
  const today = new Date();
  const defaultDate = toDateStr(today.getFullYear(), today.getMonth()+1, today.getDate());
  const [date, setDate] = useState(searchParams.get("date") || defaultDate);
  const [rep, setRep] = useState(null);
  const [loading, setLoading] = useState(true);

  const dateObj = new Date(date);
  const y = dateObj.getFullYear(), m = dateObj.getMonth() + 1;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const reps = await getMonthReports(y, m, store);
      setRep(reps[date] || null);
    } finally {
      setLoading(false);
    }
  }, [date, store]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const moveDate = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(toDateStr(d.getFullYear(), d.getMonth()+1, d.getDate()));
  };

  const dow = DAYS_JA[dateObj.getDay()];
  const isHol = dateObj.getDay() === 0 || dateObj.getDay() === 6;

  const diaryFields = [
    {k:"diary",       l:"☀️ 一日の様子"},
    {k:"good_points", l:"🔄 振り返り"},
    {k:"handover",    l:"📋 引き継ぎ"},
    {k:"comment",     l:"💬 備考"},
  ];

  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => moveDate(-1)} className="p-1.5 rounded-lg border hover:bg-gray-50">‹</button>
        <div className="flex-1 text-center">
          <span className="font-bold text-base">{date}</span>
          <span className={`ml-2 text-sm ${isHol ? "text-red-500" : "text-gray-500"}`}>({dow})</span>
        </div>
        <button onClick={() => moveDate(1)} className="p-1.5 rounded-lg border hover:bg-gray-50">›</button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 text-sm py-10">読み込み中...</div>
      ) : !rep ? (
        <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">
          この日の日報はまだ入力されていません。
          <div className="mt-3">
            <button onClick={() => navigate(`daily?date=${date}`)}
              className="bg-[#1e3a5f] text-white rounded-lg px-4 py-2 text-sm hover:bg-[#162d4a]">
              日報を入力する
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-2 mb-3">
            <div className="bg-white rounded-xl border p-2 text-center">
              <p className="text-gray-400 text-[10px]">売上</p>
              <p className="font-bold text-sm text-[#1e3a5f]">{rep.sales ? `¥${fmt(rep.sales)}` : "—"}</p>
            </div>
            <div className="bg-white rounded-xl border p-2 text-center">
              <p className="text-gray-400 text-[10px]">豆販売</p>
              <p className="font-bold text-sm text-gray-700">{rep.bean_qty ? `${rep.bean_qty}個` : "—"}</p>
            </div>
            <div className="bg-white rounded-xl border p-2 text-center">
              <p className="text-gray-400 text-[10px]">ドリンク</p>
              <p className="font-bold text-sm text-gray-700">{rep.drink_count ? `${rep.drink_count}杯` : "—"}</p>
            </div>
            <div className="bg-white rounded-xl border p-2 text-center">
              <p className="text-gray-400 text-[10px]">天気</p>
              <p className="font-bold text-sm text-gray-700">{rep.weather ? WEATHER_LABEL[rep.weather] : "—"}</p>
            </div>
          </div>

          {rep.bean_sales && rep.bean_sales.length > 0 && (
            <div className="bg-white rounded-xl border p-3 mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">売れた豆の内訳</p>
              <div className="divide-y">
                {rep.bean_sales.map((b, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-sm">
                    <span>{b.name} × {b.qty}個</span>
                    <span className="text-gray-600">¥{fmt(b.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {rep.staff_comments && Object.keys(rep.staff_comments).length > 0 && (
            <div className="bg-white rounded-xl border p-3 mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">スタッフ評価</p>
              <div className="space-y-1.5">
                {Object.entries(rep.staff_comments).filter(([,v])=>v).map(([name, comment]) => (
                  <div key={name} className="flex gap-2 text-sm">
                    <span className="text-xs font-medium text-[#1e3a5f] w-12 shrink-0">{name}</span>
                    <span className="text-gray-700 text-xs">{comment}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {diaryFields.map(({k,l}) => rep[k] ? (
            <div key={k} className="bg-white rounded-xl border p-3 mb-3">
              <p className="text-xs font-semibold text-gray-600 mb-1.5">{l}</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{rep[k]}</p>
            </div>
          ) : null)}

          {diaryFields.every(({k}) => !rep[k]) && (
            <div className="bg-white rounded-xl border p-4 mb-3 text-center text-gray-400 text-sm">
              日報のテキストはまだ入力されていません。
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => navigate("")} className="flex-1 border rounded-xl py-2.5 text-sm hover:bg-gray-50">← ダッシュボードへ戻る</button>
            <button onClick={() => navigate(`daily?date=${date}`)}
              className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#162d4a]">
              編集する
            </button>
          </div>
        </>
      )}
    </div>
  );
}
