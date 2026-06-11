import React from "react";
import Link from "next/link";
import DeleteButton from "./DeleteButton";
import Image from "next/image";

interface Member {
  profile: {
    login: string;
    name: string;
    followers: number;
    public_repos: number;
    avatar_url: string;
  };
}

interface MemberListProps {
  currentGroup: string;
  validMemberStats: Member[];
  addUserAction: (formData: FormData) => Promise<void>;
  deleteUserAction: (formData: FormData) => Promise<void>;
}

export default function MemberList({
  currentGroup,
  validMemberStats,
  addUserAction,
  deleteUserAction,
}: MemberListProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <form action={addUserAction} className="flex gap-2 p-4 bg-gray-50 rounded-lg border shadow-sm">
          <input type="hidden" name="targetGroup" value={currentGroup} />
          <input 
            type="text"
            name="username"
            placeholder={`${currentGroup === "未分類" ? "未分類" : currentGroup} に追加する GitHub ユーザー名`}
            required
            className="flex-1 px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md text-sm transition-colors shadow-sm animate-none"
          >
            追加する
          </button>
        </form>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-gray-500 px-1">所属メンバー 一覧</h3>
        
        {validMemberStats.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50 text-gray-400 text-sm">
            このグループにはまだメンバーが登録されていません。
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {validMemberStats.map((member) => {
              const user = member.profile;
              return (
                <div 
                  key={user.login}
                  className="relative flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
                >
                  <Link
                    href={`/user/${user.login}`}
                    className="flex items-center space-x-4 flex-1 min-w-0 no-underline text-current cursor-pointer"
                  >
                    <Image
                      src={user.avatar_url}
                      alt=""
                      className="w-16 h-16 rounded-full border flex-shrink-0"
                    />
                    <div className="space-y-0.5 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {user.name || user.login}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        ID: <span className="font-mono font-bold text-gray-700">{user.login}</span>
                      </p>
                      <div className="flex space-x-3 text-xs text-gray-600 pt-1">
                        <span>👤 {user.followers}</span>
                        <span>📦 {user.public_repos}</span>
                      </div>
                    </div>
                  </Link>
                  
                  <DeleteButton
                    action={deleteUserAction}
                    name="username"
                    value={user.login}
                    title="このグループから削除"
                    label="🗑️ 削除"
                    className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium ml-2 flex-shrink-0"
                    extraHiddenInput={{ name: "targetGroup", value: currentGroup }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}