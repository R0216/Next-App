import React from "react";
import Link from "next/link";
import DeleteButton from "./DeleteButton";

interface GroupSidebarProps {
  groups: { [key: string]: string[] };
  currentGroup: string;
  createGroupAction: (formData: FormData) => Promise<void>;
  deleteGroupAction: (formData: FormData) => Promise<void>;
}

export default function GroupSidebar({
  groups,
  currentGroup,
  createGroupAction,
  deleteGroupAction,
}: GroupSidebarProps) {
  return (
    <div className="space-y-6 md:border-r md:pr-6 border-gray-200">
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">📂 グループ管理</h2>
        <p className="text-xs text-gray-400">チーム開発の枠組みを作成します</p>
      </div>

      {/* グループ作成フォーム */}
      <form action={createGroupAction} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border shadow-sm">
        <input 
          type="text"
          name="groupName"
          placeholder="新しいグループ名（例：A班）"
          required
          className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
        />
        <button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-md text-sm transition-colors shadow-sm"
        >
          ＋ グループを作成
        </button>
      </form>

      {/* 作成されたグループ一覧 */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-gray-500 px-1">作成グループ一覧</h3>
        <div className="space-y-1">
          {Object.keys(groups)
            .filter((name) => name !== "未分類")
            .map((name) => {
              const isSelected = currentGroup === name;
              return (
                <div 
                  key={name}
                  className={`group/item flex items-center justify-between p-1 rounded-lg border transition-all ${
                    isSelected 
                      ? "border-blue-500 bg-blue-50/50 ring-2 ring-blue-100" 
                      : "border-gray-200 bg-white hover:border-blue-400 hover:bg-gray-50"
                  }`}
                >
                  <Link 
                    href={`/?group=${encodeURIComponent(name)}`}
                    className={`flex-1 p-2 text-sm font-semibold no-underline flex items-center justify-between min-w-0 ${
                      isSelected ? "text-blue-700" : "text-gray-800"
                    }`}
                  >
                    <span className="truncate mr-2">📁 {name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono shrink-0 ${isSelected ? "bg-blue-200 text-blue-800" : "bg-gray-100 text-gray-600"}`}>
                      {groups[name].length}人
                    </span>
                  </Link>

                  {/* グループ削除ボタン */}
                  <DeleteButton
                    action={deleteGroupAction}
                    name="groupName"
                    value={name}
                    title={`${name} グループを削除`}
                    className={`p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-medium shrink-0 ${
                      isSelected ? "opacity-100" : "opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                    }`}
                  />
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
}