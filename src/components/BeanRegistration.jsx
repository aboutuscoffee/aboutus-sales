import { useState, useEffect, useCallback, useMemo } from "react";
import { getProducts, upsertProduct, deleteProduct } from "../lib/db.js";

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getProducts();
      setProductsState(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const grouped = useMemo(() => {
    const map = {};
    for (const p of products) {
      if (!map[p.name]) map[p.name] = [];
      map[p.name].push(p);
    }
    Object.values(map).forEach(arr => arr.sort((a,b) => (a.grams||0) - (b.grams||0)));
    return map;
  }, [products]);

  const toggleExpand = (n) => setExpanded(e => ({...e, [n]: !e[n]}));

  const addProduct = async () => {
    if (!name.trim() || grams === "" || price === "") return;
    setError(null);
    const newProduct = {
      id: `p${Date.now()}${Math.floor(Math.random()*1000)}`,
      name: name.trim(),
      grams: Number(grams),
      price: Number(price),
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
      <p className="text-xs font-semibold text-gray-600 mb-3">豆商品の登録（種類名 + グラム数 + 単価）</p>
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
      {loading ? (
        <p className="text-gray-400 text-sm">読み込み中...</p>
      ) : products.length === 0 ? (
        <p className="text-gray-400 text-sm">登録されている商品はありません</p>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([gName, variants]) => {
            const isOpen = !!expanded[gName];
            return (
              <div key={gName} className="border rounded-lg overflow-hidden">
                <button type="button" onClick={() => toggleExpand(gName)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 text-sm">
                  <span className="font-medium flex items-center gap-1.5">
                    <span className={`inline-block transition-transform text-gray-400 ${isOpen ? "rotate-90" : ""}`}>▶</span>
                    {gName}
                  </span>
                  <span className="text-xs text-gray-400">{variants.length}種類</span>
                </button>
                {isOpen && (
                  <div className="divide-y">
                    {variants.map(p => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-2 text-sm">
                        <span>{p.grams}g</span>
                        <div className="flex items-center gap-3">
                          <span className="text-gray-500">¥{fmt(p.price)}</span>
                          <button onClick={() => removeProduct(p.id)} className="text-red-500 text-xs hover:underline">削除</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
