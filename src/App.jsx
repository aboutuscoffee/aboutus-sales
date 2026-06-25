import { useState, useCallback } from "react";
import Dashboard from "./components/Dashboard.jsx";
import DailyPage from "./components/DailyPage.jsx";
import DailyViewPage from "./components/DailyViewPage.jsx";
import AdminPage from "./components/AdminPage.jsx";

export default function App() {
  const [page, setPage] = useState("");
  const [searchParams, setSearchParams] = useState(new URLSearchParams());

  const navigate = useCallback((path) => {
    const [p, q] = path.split("?");
    setPage(p || "");
    setSearchParams(new URLSearchParams(q || ""));
  }, []);

  const navItems = [
    {p:"",           l:"📊", t:"ダッシュボード"},
    {p:"daily-view", l:"📝", t:"日報"},
    {p:"admin",      l:"⚙️", t:"管理画面"},
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      <header className="bg-blue-700 text-white px-4 py-2 flex items-center justify-between shrink-0">
        <span className="font-bold text-sm">☕ 売上管理</span>
        <div className="flex gap-3">
          {navItems.map(({p,l,t}) => (
            <button key={p} onClick={() => navigate(p)}
              className={`text-xs px-2 py-1 rounded ${page===p ? "bg-white/20" : "hover:bg-white/10"}`}>
              {l} {t}
            </button>
          ))}
        </div>
      </header>

      {page === ""           && <Dashboard     navigate={navigate}/>}
      {page === "daily"      && <DailyPage     navigate={navigate} searchParams={searchParams}/>}
      {page === "daily-view" && <DailyViewPage navigate={navigate} searchParams={searchParams}/>}
      {page === "admin"      && <AdminPage     navigate={navigate}/>}
    </div>
  );
}
