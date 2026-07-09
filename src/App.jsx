import { useState, useCallback } from "react";
import Dashboard from "./components/Dashboard.jsx";
import DailyPage from "./components/DailyPage.jsx";
import DailyViewPage from "./components/DailyViewPage.jsx";
import AdminPage from "./components/AdminPage.jsx";

const YOY_APP_URL = "https://aboutuscoffee.github.io/aboutus-sales-yoy/";

const STORES = {
  nijo:    { label: "二条城店", short: "二条" },
  fushimi: { label: "伏見店",   short: "伏見" },
};

function StoreSelector() {
  const select = (id) => {
    const url = new URL(window.location.href);
    url.searchParams.set('store', id);
    window.location.href = url.toString();
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
    const url = new URL(window.location.href);
    url.searchParams.set('store', otherStore);
    window.location.href = url.toString();
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="bg-[#1e3a5f] text-white px-2 py-2 flex items-center gap-1 shrink-0">
        {/* 店舗名 + 切り替え */}
        <button onClick={switchStore}
          className="flex flex-col items-start leading-tight px-2 py-1 rounded hover:bg-white/10 transition shrink-0">
          <span className="text-[11px] font-bold whitespace-nowrap">☕ {storeName}売上管理</span>
          <span className="text-[9px] text-white/50 whitespace-nowrap">⇄ {otherStoreName}</span>
        </button>

        <div className="flex-1"/>

        {/* ナビ */}
        <button onClick={() => navigate("")}
          className={`text-[11px] px-2 py-1 rounded whitespace-nowrap ${page==="" ? "bg-white/20" : "hover:bg-white/10"}`}>
          推移
        </button>
        <button onClick={() => navigate("daily-view")}
          className={`text-[11px] px-2 py-1 rounded whitespace-nowrap ${page==="daily-view" ? "bg-white/20" : "hover:bg-white/10"}`}>
          日報
        </button>
        <a href={`${YOY_APP_URL}?store=${storeId}`} target="_blank" rel="noopener noreferrer"
          className="text-[11px] px-2 py-1 rounded whitespace-nowrap hover:bg-white/10">
          昨対 ↗
        </a>
        <button onClick={() => navigate("admin")}
          className={`text-[11px] px-2 py-1 rounded ${page==="admin" ? "bg-white/20" : "hover:bg-white/10"}`}>
          ⚙️
        </button>
      </header>

      {page === ""           && <Dashboard     navigate={navigate} store={storeId}/>}
      {page === "daily"      && <DailyPage     navigate={navigate} searchParams={searchParams} store={storeId}/>}
      {page === "daily-view" && <DailyViewPage navigate={navigate} searchParams={searchParams} store={storeId}/>}
      {page === "admin"      && <AdminPage     navigate={navigate} store={storeId}/>}
    </div>
  );
}
