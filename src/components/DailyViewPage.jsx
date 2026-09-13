import { useState, useEffect, useCallback } from "react";
import { getMonthReports, updateReadBy } from "../lib/db.js";

const DAYS_JA = ["日","月","火","水","木","金","土"];
const fmt = (n) => (n == null || n === "" ? "" : Number(n).toLocaleString());
const toDateStr = (y, m, d) =>
  `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

const WEATHER_LABEL = { sunny:"☀️ 晴れ", cloudy:"⛅ 曇り", rainy:"🌧️ 雨", snowy:"❄️ 雪" };

const NAMES_BY_STORE = {
  nijo:    ["澤野井","金川","芳野","宗清","松田","宮田","宮尾","川端","中尾"],
  fushimi: ["澤野井","金川","宮尾","宮田","川端","中尾","芳野","宗清","松田"],
};
const AVATAR_COLORS = {
  "澤野井":"#1e3a5f","金川":"#4a7a9b","芳野":"#2a7a45","宗清":"#7a4a2a",
  "松田":"#5a2a7a","宮田":"#1a6050","宮尾":"#7a6020","川端":"#602060","中尾":"#204060",
};
const INI = {
  "澤野井":"澤","金川":"金","芳野":"芳","宗清":"宗","松田":"松",
  "宮田":"宮","宮尾":"尾","川端":"端","中尾":"中",
};

export default function DailyViewPage({ navigate, searchParams, store }) {
  const today = new Date();
  const defaultDate = toDateStr(today.getFullYear(), today.getMonth()+1, today.getDate());
  const [date, setDate] = useState(searchParams.get("date") || defaultDate);
  const [rep, setRep] = useState(null);
  const [loading, setLoading] = useState(true);

  const [readBy, setReadBy] = useState([]);
  const [myName, setMyName] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState("add");
  const [whoOpen, setWhoOpen] = useState(false);

  const names = NAMES_BY_STORE[store] || NAMES_BY_STORE.nijo;

  const dateObj = new Date(date);
  const y = dateObj.getFullYear(), m = dateObj.getMonth() + 1;

  const load = useCallback(async () => {
    setLoading(true);
    setMyName(null);
    setWhoOpen(false);
    try {
      const reps = await getMonthReports(y, m, store);
      const r = reps[date] || null;
      setRep(r);
      setReadBy(Array.isArray(r?.read_by) ? r.read_by : []);
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

  const addRead = async (name) => {
    const next = [...readBy, name];
    setReadBy(next);
    setMyName(name);
    setPickerOpen(false);
    await updateReadBy(date, store, next);
  };

  const removeRead = async (name) => {
    const next = readBy.filter(n => n !== name);
    setReadBy(next);
    if (myName === name) setMyName(null);
    setPickerOpen(false);
    await updateReadBy(date, store, next);
  };

  const dow = DAYS_JA[dateObj.getDay()];
  const isHol = dateObj.getDay() === 0 || dateObj.getDay() === 6;

  const diaryFields = [
    {k:"diary",       l:"☀️ 一日の様子"},
    {k:"good_points", l:"🔄 改善点・注意点・やってみたいこと"},
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

          {rep.staff_comments && Object.keys(rep.staff_comments).length > 0 && (() => {
            const entries = Object.entries(rep.staff_comments).filter(([,v]) => {
              if (!v) return false;
              if (typeof v === "string") return !!v;
              return Array.isArray(v) && v.some(e => e.text);
            });
            if (entries.length === 0) return null;
            return (
              <div className="bg-white rounded-xl border p-3 mb-3">
                <p className="text-xs font-semibold text-gray-600 mb-2">スタッフ評価</p>
                <div className="space-y-2.5">
                  {entries.map(([name, val]) => (
                    <div key={name}>
                      <p className="text-xs font-semibold text-[#1e3a5f] mb-0.5">To {name}</p>
                      {typeof val === "string" ? (
                        <p className="text-xs text-gray-700 pl-2">{val}</p>
                      ) : (
                        <div className="space-y-0.5 pl-2">
                          {val.filter(e => e.text).map((e, i) => (
                            <div key={i} className="flex gap-1.5 text-xs text-gray-700">
                              {e.author && <span className="font-medium text-gray-400 shrink-0">From {e.author}：</span>}
                              <span>{e.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

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

          {/* 既読バー */}
          <div className="bg-white rounded-xl border px-3 py-2.5 mb-3 flex items-center gap-2 relative">
            <button
              onClick={() => setWhoOpen(o => !o)}
              className="flex items-center gap-1.5 flex-1 text-left">
              <span className="text-xs font-semibold text-gray-600">
                既読 {readBy.length}件
              </span>
              {readBy.length > 0 && (
                <div className="flex">
                  {readBy.map((name, i) => (
                    <div key={name} style={{
                      width:20, height:20, borderRadius:"50%",
                      background: AVATAR_COLORS[name] || "#888",
                      color:"#fff", fontSize:8, fontWeight:700,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      border:"1.5px solid #fff", marginLeft: i===0 ? 0 : -5,
                    }}>
                      {INI[name] || name[0]}
                    </div>
                  ))}
                </div>
              )}
            </button>
            {myName ? (
              <button
                onClick={() => { setPickerMode("remove"); setPickerOpen(true); setWhoOpen(false); }}
                className="text-xs border rounded-lg px-2.5 py-1.5 text-red-400 border-red-200 bg-red-50 hover:bg-red-100 shrink-0">
                取り消す
              </button>
            ) : (
              <button
                onClick={() => { setPickerMode("add"); setPickerOpen(true); setWhoOpen(false); }}
                className="text-xs border rounded-lg px-2.5 py-1.5 text-[#1e3a5f] border-[#c5d5e8] bg-[#f0f4fa] hover:bg-[#e0eaf8] shrink-0 font-semibold">
                ✓ 既読にする
              </button>
            )}

            {/* 誰が読んだかポップアップ */}
            {whoOpen && readBy.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 bg-white border rounded-xl shadow-lg p-3 z-10 min-w-[140px]">
                <p className="text-[10px] font-semibold text-gray-400 mb-2">既読したスタッフ</p>
                {readBy.map(name => (
                  <div key={name} className="flex items-center gap-2 py-1">
                    <div style={{
                      width:8, height:8, borderRadius:"50%",
                      background: AVATAR_COLORS[name] || "#888", flexShrink:0,
                    }}/>
                    <span className="text-xs text-gray-700">{name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button onClick={() => navigate("")} className="flex-1 border rounded-xl py-2.5 text-sm hover:bg-gray-50">← ダッシュボードへ戻る</button>
            <button onClick={() => navigate(`daily?date=${date}`)}
              className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#162d4a]">
              編集する
            </button>
          </div>
        </>
      )}

      {/* 名前ピッカー */}
      {pickerOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-end justify-center z-50"
          onClick={() => setPickerOpen(false)}>
          <div
            className="bg-white rounded-t-2xl w-full max-w-md p-4 pb-8"
            onClick={e => e.stopPropagation()}>
            <p className="text-xs font-semibold text-gray-500 text-center mb-3">
              {pickerMode === "add" ? "名前を選んでください" : "取り消す名前を選んでください"}
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {names.map(name => {
                const inList = readBy.includes(name);
                const disabled = pickerMode === "add" ? inList : !inList;
                return (
                  <button key={name}
                    disabled={disabled}
                    onClick={() => pickerMode === "add" ? addRead(name) : removeRead(name)}
                    className={`py-3 rounded-xl border text-sm font-medium transition
                      ${disabled
                        ? "opacity-30 bg-gray-50 text-gray-400 cursor-not-allowed"
                        : "bg-gray-50 text-[#1e3a5f] border-gray-200 hover:bg-blue-50 hover:border-blue-200"
                      }
                      ${inList && pickerMode === "add" ? "text-xs" : ""}
                    `}>
                    {name}{inList && pickerMode === "add" ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
            <button onClick={() => setPickerOpen(false)}
              className="w-full py-2.5 rounded-xl border text-sm text-gray-400 hover:bg-gray-50">
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
