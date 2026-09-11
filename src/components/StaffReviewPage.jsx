import { useState, useEffect } from "react";
import { getMonthReports } from "../lib/db.js";

const DAYS_JA = ["日","月","火","水","木","金","土"];

function toDateStr(y, m, d) {
  return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function daysInMonth(y, m) {
  return new Date(y, m, 0).getDate();
}

export default function StaffReviewPage({ navigate, store }) {
  const today = new Date();
  const [year,  setYear]  = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMonthReports(year, month, store)
      .then(r => { setReports(r); setLoading(false); })
      .catch(() => setLoading(false));
  }, [year, month, store]);

  // スタッフ別に全評価を集計
  const aggregated = {};
  Object.entries(reports).forEach(([date, rep]) => {
    if (!rep.staff_comments) return;
    Object.entries(rep.staff_comments).forEach(([name, val]) => {
      const items = typeof val === "string"
        ? (val ? [{ author: "", text: val }] : [])
        : Array.isArray(val) ? val : [];
      items.filter(e => e.text).forEach(e => {
        if (!aggregated[name]) aggregated[name] = [];
        aggregated[name].push({ date, author: e.author, text: e.text });
      });
    });
  });

  const staffNames = Object.keys(aggregated).sort();
  const totalCount = Object.values(aggregated).reduce((s, v) => s + v.length, 0);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="flex-1 overflow-auto p-3">
      {/* ヘッダー */}
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => navigate("admin")}
          className="text-xs text-gray-400 hover:text-gray-600">← 戻る</button>
        <div className="flex-1 text-center font-bold text-sm text-[#1e3a5f]">
          スタッフ評価集計
        </div>
        <button onClick={() => window.print()}
          className="text-xs border rounded px-2 py-1 hover:bg-gray-50">🖨️ 印刷</button>
      </div>

      {/* 月選択 */}
      <div className="flex items-center justify-center gap-3 mb-4">
        <button onClick={prevMonth} className="p-1.5 rounded-lg border hover:bg-gray-50">‹</button>
        <span className="font-bold text-base w-28 text-center">{year}年{month}月</span>
        <button onClick={nextMonth} className="p-1.5 rounded-lg border hover:bg-gray-50">›</button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 text-sm py-10">読み込み中...</div>
      ) : totalCount === 0 ? (
        <div className="bg-white rounded-xl border p-6 text-center text-gray-400 text-sm">
          この月のスタッフ評価データはありません。
        </div>
      ) : (
        <div className="space-y-4">
          {staffNames.map(name => {
            const entries = aggregated[name];
            return (
              <div key={name} className="bg-white rounded-xl border overflow-hidden">
                <div className="bg-[#1e3a5f] text-white px-3 py-2 text-sm font-semibold">
                  To {name}
                  <span className="ml-2 text-white/60 font-normal text-xs">
                    {entries.length}件
                  </span>
                </div>
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left px-3 py-1.5 text-gray-500 font-medium w-20">日付</th>
                      <th className="text-left px-3 py-1.5 text-gray-500 font-medium w-16">From</th>
                      <th className="text-left px-3 py-1.5 text-gray-500 font-medium">コメント</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {entries.map((e, i) => {
                      const d = new Date(e.date);
                      const dow = DAYS_JA[d.getDay()];
                      const isHol = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-gray-500">
                            {e.date.slice(5).replace("-","/")}
                            <span className={`ml-1 ${isHol ? "text-red-400" : "text-gray-400"}`}>
                              ({dow})
                            </span>
                          </td>
                          <td className="px-3 py-2 text-[#1e3a5f] font-medium whitespace-nowrap">
                            {e.author || "—"}
                          </td>
                          <td className="px-3 py-2 text-gray-700">{e.text}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
