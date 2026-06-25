import { useState } from "react";
import BudgetSettings from "./BudgetSettings.jsx";
import BeanRegistration from "./BeanRegistration.jsx";

export default function AdminPage({ navigate }) {
  const [tab, setTab] = useState("budget");

  return (
    <div className="flex-1 overflow-auto p-3">
      <h2 className="font-bold text-base mb-4">管理画面</h2>
      <div className="flex gap-2 mb-4">
        <button onClick={() => setTab("budget")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab==="budget" ? "bg-blue-600 text-white" : "bg-white border text-gray-600"}`}>
          月次予算設定
        </button>
        <button onClick={() => setTab("beans")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${tab==="beans" ? "bg-blue-600 text-white" : "bg-white border text-gray-600"}`}>
          豆商品登録
        </button>
      </div>

      {tab === "budget" ? <BudgetSettings/> : <BeanRegistration/>}

      <div className="mt-4">
        <button onClick={() => navigate("")} className="border rounded-xl py-2.5 px-4 text-sm hover:bg-gray-50">← ダッシュボードへ戻る</button>
      </div>
    </div>
  );
}
