import { useState, useEffect, useCallback, useMemo } from "react";
import { getAllProducts, upsertProduct, deleteProduct } from "../lib/db.js";
import { TIER_ORDER, buildTieredGroups } from "../lib/productUtils.js";

const fmt = (n) => (n == null || n === "" ? "" : Number(n).toLocaleString());

export default function BeanRegistration() {
  const [products, setProductsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("");
  const [price, setPrice] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [showInactive, setShowInactive] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getAllProducts();
      setProductsState(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const activeProducts = useMemo(() => products.filter(p => p.active !== false), [products]);
  const inactiveProducts = useMemo(() => products.filter(p => p.active === false), [products]);
  const visibleProducts = useMemo(() =>
    showInactive ? products : activeProducts,
  [products, activeProducts, showInactive]);

  const tieredGroups = useMemo(() => buildTieredGroups(visibleProducts), [visibleProducts]);

  const toggleExpand = (n) => setExpanded(e => ({...e, [n]: !e[n]}));

  const addProduct = async () => {
    if (!name.trim() || grams === "" || price === "") return;
    setError(null);
    const newProduct = {
      id: `p${Date.now()}${Math.floor(Math.random()*1000)}`,
      name: name.trim(),
      grams: Number(grams),
      price: Number(price),
      show_nijo: true,
      show_fushimi: true,
      active: true,
    };
    try {
      await upsertProduct(newProduct);
      const updated = [...products, newProduct];
      setProductsState(updated);
      setExpanded(e => ({...e, [name.trim()]: true}));
      setName(""); setGrams(""); setPrice("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e.message);
    }
  };

  const toggleStoreFlag = async (product, flag) => {
    const updated = { ...product, [flag]: !product[flag] };
    setProductsState(prev => prev.map(p => p.id === product.id ? updated : p));
    try {
      await upsertProduct(updated);
    } catch (e) {
      setProductsState(prev => prev.map(p => p.id === product.id ? product : p));
      setError(e.message);
    }
  };

  const toggleActive = async (product) => {
    const updated = { ...product, active: product.active === false ? true : false };
    setProductsState(prev => prev.map(p => p.id === product.id ? updated : p));
    try {
      await upsertProduct(updated);
    } catch (e) {
      setProductsState(prev => prev.map(p => p.id === product.id ? product : p));
      setError(e.message);
    }
  };

  const removeProduct = async (id) => {
    setError(null);
    try {
      await deleteProduct(id);
      setProductsState(prev => prev.filter(p => p.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="bg-white rounded-xl border p-4">
      <p className="text-xs font-semibold text-gray-600 mb-1">豆商品の登録（種類名 + グラム数 + 単価）</p>
      <p className="text-[11px] text-gray-400 mb-3">二条・伏見ボタンで各店舗への表示をON/OFFできます。終売ボタンで日報入力画面から非表示にできます（記録は残ります）</p>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2 mb-3">{error}</div>
      )}
      <div className="flex flex-wrap gap-2 mb-4">
        <input placeholder="種類名（例: エチオピア）" value={name} onChange={e=>setName(e.target.value)}
          className="flex-1 min-w-[120px] border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
        <input type="number" placeholder="g数" value={grams} onChange={e=>setGrams(e.target.value)}
          className="w-20 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
        <input type="number" placeholder="単価(¥)" value={price} onChange={e=>setPrice(e.target.value)}
          className="w-28 border rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"/>
        <button onClick={addProduct} className="bg-[#1e3a5f] text-white rounded px-3 py-1.5 text-sm hover:bg-[#162d4a] whitespace-nowrap">追加</button>
      </div>
      {saved && <p className="text-green-600 text-xs mb-2">✓ 登録しました</p>}

      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] text-gray-400">
          販売中 {activeProducts.length}件
          {inactiveProducts.length > 0 && <span className="ml-1">/ 終売 {inactiveProducts.length}件</span>}
        </p>
        {inactiveProducts.length > 0 && (
          <button
            onClick={() => setShowInactive(v => !v)}
            className={`px-2.5 py-1 rounded text-[11px] font-medium border transition ${
              showInactive
                ? "bg-gray-700 text-white border-gray-700"
                : "bg-white text-gray-500 border-gray-300 hover:bg-gray-50"
            }`}>
            {showInactive ? "終売を非表示" : "終売を表示"}
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : visibleProducts.length === 0 ? (
        <p className="text-gray-400 text-sm">登録されている商品はありません</p>
      ) : (
        <div className="space-y-3">
          {TIER_ORDER.filter(tier => tieredGroups[tier]).map(tier => (
            <div key={tier}>
              <p className="text-[11px] font-bold text-gray-400 mb-1 px-0.5">{tier}</p>
              <div className="space-y-1.5">
                {tieredGroups[tier].map(({ name: gName, variants }) => {
                  const isOpen = !!expanded[gName];
                  const allInactive = variants.every(p => p.active === false);
                  return (
                    <div key={gName} className={`border rounded-lg overflow-hidden ${allInactive ? "opacity-50" : ""}`}>
                      <button type="button" onClick={() => toggleExpand(gName)}
                        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm">
                        <span className="font-medium flex items-center gap-1.5 text-left">
                          <span className={`inline-block transition-transform text-gray-400 shrink-0 ${isOpen ? "rotate-90" : ""}`}>▶</span>
                          {gName}
                          {allInactive && <span className="text-[10px] font-normal text-gray-400 ml-1">終売</span>}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0 ml-2">{variants.length}種類</span>
                      </button>
                      {isOpen && (
                        <div className="divide-y">
                          {variants.map(p => (
                            <div key={p.id} className={`flex items-center gap-2 px-3 py-2 text-sm ${p.active === false ? "bg-gray-50" : ""}`}>
                              <span className="w-14 shrink-0 text-gray-700">{p.grams}g</span>
                              <span className="text-gray-500 flex-1">¥{fmt(p.price)}</span>
                              <button onClick={() => toggleStoreFlag(p, 'show_nijo')}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${p.show_nijo !== false ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-400 border-gray-200"}`}>
                                二条
                              </button>
                              <button onClick={() => toggleStoreFlag(p, 'show_fushimi')}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${p.show_fushimi !== false ? "bg-[#1e3a5f] text-white border-[#1e3a5f]" : "bg-white text-gray-400 border-gray-200"}`}>
                                伏見
                              </button>
                              <button onClick={() => toggleActive(p)}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium border transition ${p.active === false ? "bg-amber-100 text-amber-700 border-amber-300" : "bg-white text-gray-400 border-gray-200 hover:border-amber-300 hover:text-amber-600"}`}>
                                {p.active === false ? "終売中" : "終売"}
                              </button>
                              <button onClick={() => removeProduct(p.id)} className="text-red-500 text-xs hover:underline shrink-0">削除</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
