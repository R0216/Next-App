import React from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

interface GitHubProfile {
  login: string;
  name: string;
  followers: number;
  public_repos: number;
  avatar_url: string;
}

const filePath = path.join(process.cwd(), "groups.json");

interface GroupData {
  [groupName: string]: string[];
}

function loadGroups(): GroupData {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("ファイル読み込みエラー:", error);
  }
  return {
    "未分類": ["R0216", "torvalds"]
  };
}

function saveGroups(data: GroupData) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("ファイル書き込みエラー:", error);
  }
}

interface PageProps {
  searchParams: Promise<{ group?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  
  const resolvedSearchParams = await searchParams;
  const currentGroup = resolvedSearchParams.group || "未分類";
  
  const groups = loadGroups();
  const displayUsernames = groups[currentGroup] || [];

  // 📂 グループ作成アクション
  async function createGroup(formData: FormData) {
    "use server";
    const groupName = formData.get("groupName") as string;
    if (!groupName) return;

    const trimmedGroupName = groupName.trim();
    const currentGroups = loadGroups();

    if (trimmedGroupName && !currentGroups[trimmedGroupName]) {
      currentGroups[trimmedGroupName] = [];
      saveGroups(currentGroups);
    }
    revalidatePath("/");
  }

  // 📂 🆕 新設：グループ削除アクション
  async function deleteGroup(formData: FormData) {
    "use server";
    const groupToDelete = formData.get("groupName") as string;
    if (!groupToDelete || groupToDelete === "未分類") return;

    const currentGroups = loadGroups();

    // 💡 安全装置：削除対象のグループが存在する場合のみ処理
    if (currentGroups[groupToDelete]) {
      delete currentGroups[groupToDelete];
      saveGroups(currentGroups);
    }
    
    // もし今開いているグループを削除した場合は、安全のためにトップ（未分類）に戻す
    revalidatePath("/");
  }

  // 👤 メンバー追加アクション
  async function addUser(formData: FormData) {
    "use server";
    const newUserName = formData.get("username") as string;
    const targetGroup = formData.get("targetGroup") as string || "未分類";
    if (!newUserName) return;

    const trimmedName = newUserName.trim();
    const currentGroups = loadGroups();

    if (!currentGroups[targetGroup]) {
      currentGroups[targetGroup] = [];
    }

    if (trimmedName && !currentGroups[targetGroup].includes(trimmedName)) {
      currentGroups[targetGroup].push(trimmedName);
      saveGroups(currentGroups);
    }
    revalidatePath("/");
  }

  // 🗑️ メンバー削除アクション
  async function deleteUser(formData: FormData) {
    "use server";
    const usernameToDelete = formData.get("username") as string;
    const targetGroup = formData.get("targetGroup") as string || "未分類";
    if (!usernameToDelete) return;

    const currentGroups = loadGroups();
    if (currentGroups[targetGroup]) {
      currentGroups[targetGroup] = currentGroups[targetGroup].filter((name) => name !== usernameToDelete);
      saveGroups(currentGroups);
    }
    revalidatePath("/");
  }

  // 選択されているグループのメンバーのプロフィールを取得
  const profilePromises = displayUsernames.map(async (username) => {
    const res = await fetch(`https://api.github.com/users/${username}`, {
      cache: "no-store",
      headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {},
    });
    if (!res.ok) {
      console.error(`GitHub API Error: ${res.status} ${res.statusText}`);
      return null;
    }
    return res.json() as Promise<GitHubProfile>;
  });
  
  const allProfiles = await Promise.all(profilePromises);
  const validProfiles = allProfiles.filter((p): p is GitHubProfile => p !== null);
 
  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8">
      {/* ヘッダータイトル */}
      <div className="text-center sm:text-left border-b pb-4 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white">GitHub Analyzer</h1>
          <p className="text-sm text-gray-500 mt-1">チーム開発マネジメントダッシュボード</p>
        </div>
        {currentGroup !== "未分類" && (
          <Link href="/" className="text-sm text-blue-600 hover:underline font-semibold pb-1">
            ← 個別登録（未分類）に戻る
          </Link>
        )}
      </div>

      {/* 左右2カラムレイアウト */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* 📂 【左側】グループ作成 ＆ グループ一覧 */}
        <div className="space-y-6 md:border-r md:pr-6 border-gray-200">
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">📂 グループ管理</h2>
            <p className="text-xs text-gray-400">チーム開発の枠組みを作成します</p>
          </div>

          {/* グループ作成フォーム */}
          <form action={createGroup} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-lg border shadow-sm">
            <input 
              type="text"
              name="groupName"
              placeholder="新しいグループ名（例：A班）"
              required
              className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
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
                      {/* グループ詳細への切り替えリンク（はみ出さないようにflex-1に設定） */}
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

                      {/* 🗑️ 🆕 新設：グループ削除ボタン */}
                      <form action={deleteGroup} className="pr-1">
                        <input type="hidden" name="groupName" value={name} />
                        {/* 💡 普段は薄いグレー、ホバーすると赤くなる親切設計。isSelected時は常に表示、通常時は行ホバーでうっすら浮き出ます */}
                        <button
                          type="submit"
                          className={`p-1.5 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all text-xs font-medium shrink-0 ${
                            isSelected ? "opacity-100" : "opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                          }`}
                          title={`${name} グループを削除`}
                        >
                          🗑️
                        </button>
                      </form>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* 👤 【右側】選択されたグループのメンバー表示領域 */}
        <div className="md:col-span-2 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1 border-b pb-2">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{currentGroup === "未分類" ? "👤 分析対象メンバー (未分類)" : `👥 グループ: ${currentGroup}`}</span>
              </h2>
              <p className="text-xs text-gray-400">このグループに所属しているメンバーの一覧です</p>
            </div>
            
            {/* メンバー追加フォーム */}
            <form action={addUser} className="flex gap-2 p-4 bg-gray-50 rounded-lg border shadow-sm">
              <input type="hidden" name="targetGroup" value={currentGroup} />
              <input 
                type="text"
                name="username"
                placeholder={`${currentGroup === "未分類" ? "未分類" : currentGroup} に追加する GitHub ユーザー名`}
                required
                className="flex-1 px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-black"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md text-sm transition-colors shadow-sm"
              >
                追加する
              </button>
            </form>
          </div>

          {/* メンバーカード一覧 */}
          {validProfiles.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50 text-gray-400 text-sm">
              {currentGroup === "未分類" ? (
                "メンバーが登録されていません。"
              ) : (
                <>
                  このグループにはまだメンバーが登録されていません。
                  <br />
                  <span className="text-xs text-gray-400 mt-1 inline-block">※右上の「個別登録に戻る」から既存のアカウントをグループに新しく追加し直すことができます</span>
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {validProfiles.map((user) => {
                if (!user || !user.login) return null;

                return (
                  <div 
                    key={user.login}
                    className="relative flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
                  >
                    <Link
                      href={`/user/${user.login}`}
                      className="flex items-center space-x-4 flex-1 min-w-0 no-underline text-current cursor-pointer"
                    >
                      <img
                        src={user.avatar_url}
                        alt={`${user.name || user.login}'s avatar`}
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

                    {/* メンバー削除フォーム */}
                    <form action={deleteUser} className="ml-2 flex-shrink-0">
                      <input type="hidden" name="username" value={user.login} />
                      <input type="hidden" name="targetGroup" value={currentGroup} />
                      <button
                        type="submit"
                        className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium"
                        title="このグループから削除"
                      >
                        🗑️ 削除
                      </button>
                    </form>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}