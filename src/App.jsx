import { useState, useCallback } from "react";
import Dashboard from "./components/Dashboard.jsx";
import DailyPage from "./components/DailyPage.jsx";
import DailyViewPage from "./components/DailyViewPage.jsx";
import AdminPage from "./components/AdminPage.jsx";

const STORES = {
  nijo:    { label: "二条城店", short: "二条" },
  fushimi: { label: "伏見店",   short: "伏見" },
};

function StoreSelector() {
  const select = (id) => {
    window.location.search = `?store=${id}`;
  };
  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans items-center justify-center gap-6">
      <div className="text-center mb-2">
        <p className="text-2xl font-bold text-[#1e3a5f]">☕ 売上管理</p>
        <p className="text-sm text-gray-400 mt-1">About Us Coffee</p>
      </div>
      <p className="text-sm text-gray-600">店舗を選択してください</p>
      <div className="flex gap-4">
        {Object.entries(STORES).map(([id, {label}]) => (
          <button key={id} onClick={() => select(id)}
            className="w-40 py-6 bg-[#1e3a5f] text-white rounded-2xl text-base font-bold hover:bg-[#162d4a] shadow-md">
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const storeId = new URLSearchParams(window.location.search).get("store");

  const [page, setPage] = useState("");
  const [searchParams, setSearchParams] = useState(new URLSearchParams());

  const navigate = useCallback((path) => {
    const [p, q] = path.split("?");
    setPage(p || "");
    setSearchParams(new URLSearchParams(q || ""));
  }, []);

  if (!STORES[storeId]) return <StoreSelector />;

  const storeName = STORES[storeId].short;
  const otherStore = storeId === 'nijo' ? 'fushimi' : 'nijo';
  const otherStoreName = STORES[otherStore].short;

  const switchStore = () => {
    window.location.search = `?store=${otherStore}`;
  };

  const navItems = [
    {p:"",           l:"📊", t:"ダッシュボード"},
    {p:"daily-view", l:"📝", t:"日報"},
    {p:"admin",      l:"⚙️", t:"管理画面"},
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="bg-[#1e3a5f] text-white px-4 py-2 flex items-center justify-between shrink-0">
        <button onClick={switchStore}
          className="flex items-center gap-1.5 font-bold text-sm hover:bg-white/10 rounded px-1.5 py-0.5 transition group">
          ☕ {storeName} 売上管理
          <span className="text-[10px] text-white/50 group-hover:text-white/80">⇄ {otherStoreName}</span>
        </button>
        <div className="flex gap-3">
          {navItems.map(({p,l,t}) => (
            <button key={p} onClick={() => navigate(p)}
              className={`text-xs px-2 py-1 rounded ${page===p ? "bg-white/20" : "hover:bg-white/10"}`}>
              {l} {t}
            </button>
          ))}
        </div>
      </header>

      {page === ""           && <Dashboard     navigate={navigate} store={storeId}/>}
      {page === "daily"      && <DailyPage     navigate={navigate} searchParams={searchParams} store={storeId}/>}
      {page === "daily-view" && <DailyViewPage navigate={navigate} searchParams={searchParams} store={storeId}/>}
      {page === "admin"      && <AdminPage     navigate={navigate} store={storeId}/>}
    </div>
  );
}
