import { useState, useEffect, useCallback, useMemo } from "react";
import { getMonthReports, getProducts, upsertDayReport } from "../lib/db.js";

const DAYS_JA = ["日","月","火","水","木","金","土"];
const fmt = (n) => (n == null || n === "" ? "" : Number(n).toLocaleString());
const toDateStr = (y, m, d) =>
  `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

const WEATHER_OPTIONS = [
  {v:"sunny",  l:"☀️ 晴れ"},
  {v:"cloudy", l:"⛅ 曇り"},
  {v:"rainy",  l:"🌧️ 雨"},
  {v:"snowy",  l:"❄️ 雪"},
];

const STAFF_BY_STORE = {
  nijo:    ["金川","芳野","松田","宗清"],
  fushimi: ["金川","宮尾","宮田","川本","中尾"],
};

const STAFF_KEYS = {
  "金川": "check_kanagawa",
  "芳野": "check_yoshino",
  "松田": "check_matsuda",
  "宗清": "check_munekiyo",
  "宮尾": "check_miyao",
  "宮田": "check_miyata",
  "川本": "check_kawamoto",
  "中尾": "check_nakao",
};

export default function DailyPage({ navigate, searchParams, store }) {
  const today = new Date();
  const defaultDate = toDateStr(today.getFullYear(), today.getMonth()+1, today.getDate());
  const [date, setDate] = useState(searchParams.get("date") || defaultDate);
  const [form, setForm] = useState({ sales:"", drink_count:"", weather:"", diary:"", good_points:"", handover:"", comment:"" });
  const [products, setProductsList] = useState([]);
  const [beanQty, setBeanQty] = useState({});
  const [expanded, setExpanded] = useState({});
  const [legacy, setLegacy] = useState(null);
  const [staffChecks, setStaffChecks] = useState({});
  const [staffComments, setStaffComments] = useState({});
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const storeStaff = STAFF_BY_STORE[store] || STAFF_BY_STORE.nijo;

  const dateObj = new Date(date);
  const y = dateObj.getFullYear(), m = dateObj.getMonth() + 1;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [reps, prods] = await Promise.all([getMonthReports(y, m, store), getProducts(store)]);
      setProductsList(prods);
      const r = reps[date];
      if (r) {
        setForm({
          sales: r.sales ?? "",
          drink_count: r.drink_count ?? "",
          weather: r.weather || "",
          diary: r.diary || "",
          good_points: r.good_points || "",
          handover: r.handover || "",
          comment: r.comment || "",
        });
        if (r.bean_sales && r.bean_sales.length > 0) {
          const map = {};
          r.bean_sales.forEach(b => { map[b.product_id] = String(b.qty); });
          setBeanQty(map);
          setLegacy(null);
        } else {
          setBeanQty({});
          setLegacy(r.bean_qty ? { qty: r.bean_qty, amount: r.bean_amount } : null);
        }
        const checks = {};
        storeStaff.forEach(name => { checks[name] = !!r[STAFF_KEYS[name]]; });
        setStaffChecks(checks);
        setStaffComments(r.staff_comments || {});
      } else {
        setForm({ sales:"", drink_count:"", weather:"", diary:"", good_points:"", handover:"", comment:"" });
        setBeanQty({});
        setLegacy(null);
        const checks = {};
        storeStaff.forEach(name => { checks[name] = false; });
        setStaffChecks(checks);
        setStaffComments({});
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setSaved(false);
      setLoading(false);
    }
  }, [date, store]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const moveDate = (delta) => {
    const d = new Date(date);
    d.setDate(d.getDate() + delta);
    setDate(toDateStr(d.getFullYear(), d.getMonth()+1, d.getDate()));
  };

  const grouped = useMemo(() => {
    const map = {};
    for (const p of products) {
      if (!map[p.name]) map[p.name] = [];
      map[p.name].push(p);
    }
    Object.values(map).forEach(arr => arr.sort((a,b) => (a.grams||0) - (b.grams||0)));
    return map;
  }, [products]);

  const toggleExpand = (name) => setExpanded(e => ({...e, [name]: !e[name]}));

  const beanEntries = useMemo(() =>
    products
      .map(p => ({ p, qty: Number(beanQty[p.id]) || 0 }))
      .filter(x => x.qty > 0)
      .map(x => ({
        product_id: x.p.id,
        name: `${x.p.name} ${x.p.grams}g`,
        price: x.p.price,
        qty: x.qty,
        amount: x.p.price * x.qty,
      })),
  [products, beanQty]);

  const beanTotalQty = beanEntries.reduce((s,b) => s+b.qty, 0);
  const beanTotalAmount = beanEntries.reduce((s,b) => s+b.amount, 0);

  const save = async () => {
    setError(null);
    try {
      const checkFields = {};
      storeStaff.forEach(name => { checkFields[STAFF_KEYS[name]] = !!staffChecks[name]; });
      await upsertDayReport(date, {
        sales: form.sales === "" ? null : Number(form.sales),
        drink_count: form.drink_count === "" ? null : Number(form.drink_count),
        weather: form.weather || null,
        diary: form.diary,
        good_points: form.good_points,
        handover: form.handover,
        comment: form.comment,
        bean_sales: beanEntries,
        bean_qty: beanTotalQty,
        bean_amount: beanTotalAmount,
        staff_comments: staffComments,
        ...checkFields,
      }, store);
      setLegacy(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e.message);
    }
  };

  const set = (k, v) => setForm(f => ({...f, [k]: v}));
  const dow = DAYS_JA[dateObj.getDay()];
  const isHol = dateObj.getDay() === 0 || dateObj.getDay() === 6;
  const checkedStaff = storeStaff.filter(name => staffChecks[name]);

  return (
    <div className="flex-1 overflow-auto p-3">
      <div className="flex items-center gap-2 mb-4">
        <button onClick={() => moveDate(-1)} className="p-1.5 rounded-lg border hover:bg-gray-50">‹</button>
        <div className="flex-1 text-center">
          <span className="font-bold text-base">{date}</span>
          <span className={`ml-2 text-sm ${isHol ? "text-red-500" : "text-gray-500"}`}>({dow})</span>
          <span className={`ml-2 text-xs px-2 py-0.5 rounded ${isHol ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>{isHol?"休日":"平日"}</span>
        </div>
        <button onClick={() => moveDate(1)} className="p-1.5 rounded-lg border hover:bg-gray-50">›</button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">{error}</div>
      )}

      {loading ? (
        <div className="text-center text-gray-400 text-sm py-10">読み込み中...</div>
      ) : (
        <>
          {/* 売上データ + 天気 */}
          <div className="bg-white rounded-xl border p-3 mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">売上データ</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{k:"sales",l:"売上 (¥)"},{k:"drink_count",l:"ドリンク杯数"}].map(({k,l}) => (
                <div key={k}>
                  <label className="text-xs text-gray-500 block mb-0.5">{l}</label>
                  <input type="number" value={form[k]} onChange={e=>set(k,e.target.value)}
                    className="w-full border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">天気</label>
              <div className="flex gap-2 flex-wrap">
                {WEATHER_OPTIONS.map(({v,l}) => (
                  <button key={v} type="button" onClick={() => set("weather", form.weather === v ? "" : v)}
                    className={`px-3 py-1 rounded-lg text-sm border transition ${form.weather === v ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-600 hover:bg-gray-50"}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 豆販売 */}
          <div className="bg-white rounded-xl border p-3 mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">豆販売(種類ごとに開いて個数を入力)</p>
            {products.length === 0 ? (
              <p className="text-xs text-gray-400">商品が登録されていません。管理画面の「豆商品登録」から登録してください。</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(grouped).map(([name, variants]) => {
                  const groupQty = variants.reduce((s,p) => s + (Number(beanQty[p.id]) || 0), 0);
                  const groupAmount = variants.reduce((s,p) => s + (Number(beanQty[p.id]) || 0) * p.price, 0);
                  const isOpen = !!expanded[name];
                  return (
                    <div key={name} className="border rounded-lg overflow-hidden">
                      <button type="button" onClick={() => toggleExpand(name)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm">
                        <span className="font-medium flex items-center gap-1.5">
                          <span className={`inline-block transition-transform text-gray-400 ${isOpen ? "rotate-90" : ""}`}>▶</span>
                          {name}
                        </span>
                        <span className={`text-xs font-semibold ${groupAmount > 0 ? "text-[#1e3a5f]" : "text-gray-400"}`}>
                          {groupQty}個 / ¥{fmt(groupAmount)}
                        </span>
                      </button>
                      {isOpen && (
                        <div className="px-3 py-2 space-y-1.5 bg-white">
                          {variants.map(p => (
                            <div key={p.id} className="flex items-center gap-2">
                              <span className="flex-1 text-xs text-gray-600">{p.grams}g <span className="text-gray-400">(¥{fmt(p.price)})</span></span>
                              <input type="number" min="0" value={beanQty[p.id] || ""} placeholder="0"
                                onChange={e => setBeanQty(b => ({...b, [p.id]: e.target.value}))}
                                className="w-16 border rounded px-1.5 py-1 text-xs text-right focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="text-right text-sm font-bold pt-2 border-t">
                  合計: {beanTotalQty}個 / ¥{fmt(beanTotalAmount)}
                </div>
              </div>
            )}
            {legacy && (
              <p className="text-[10px] text-amber-600 mt-2">
                ※ 以前の入力データ: {legacy.qty}個 / ¥{fmt(legacy.amount)}（商品登録前のデータ。保存すると上記の選択内容で上書きされます）
              </p>
            )}
          </div>

          {/* 出勤者チェック＋スタッフ評価 */}
          <div className="bg-white rounded-xl border p-3 mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">出勤者・スタッフ評価</p>
            <div className="flex gap-2 flex-wrap mb-3">
              {storeStaff.map(name => (
                <button key={name} type="button"
                  onClick={() => setStaffChecks(c => ({...c, [name]: !c[name]}))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${staffChecks[name] ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-600"}`}>
                  {name}
                </button>
              ))}
            </div>
            {checkedStaff.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[11px] text-gray-400">良かった動き・コメント（出勤者が各自記入）</p>
                {checkedStaff.map(name => (
                  <div key={name} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-[#1e3a5f] w-12 shrink-0">{name}</span>
                    <input type="text" value={staffComments[name] || ""}
                      onChange={e => setStaffComments(c => ({...c, [name]: e.target.value}))}
                      placeholder="例: 接客の対応が丁寧だった"
                      className="flex-1 border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">出勤者を選択するとコメント欄が表示されます</p>
            )}
          </div>

          {/* 日報テキスト */}
          <div className="bg-white rounded-xl border p-3 mb-3 space-y-3">
            <p className="text-xs font-semibold text-gray-600">日報</p>
            {[
              {k:"diary",       l:"☀️ 一日の様子", rows:4},
              {k:"good_points", l:"🔄 振り返り",   rows:3},
              {k:"handover",    l:"📋 引き継ぎ",   rows:3},
              {k:"comment",     l:"💬 備考",       rows:2},
            ].map(({k,l,rows}) => (
              <div key={k}>
                <label className="text-xs text-gray-500 block mb-0.5">{l}</label>
                <textarea rows={rows} value={form[k]} onChange={e=>set(k,e.target.value)}
                  className="w-full border rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => navigate("")} className="flex-1 border rounded-xl py-2.5 text-sm hover:bg-gray-50">← 戻る</button>
            <button onClick={save} className="flex-1 bg-[#1e3a5f] text-white rounded-xl py-2.5 text-sm font-medium hover:bg-[#162d4a]">
              {saved ? "✓ 保存しました" : "保存する"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
