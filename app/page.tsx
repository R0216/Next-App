import React from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";

interface GitHubProfile {
  login: string;
  name: string;
  followers: number;
  public_repos: number;
  avatar_url: string;
}

let globalUesrnames = ['R0216', 'torvalds'];

export default async function Home() {
  const GITHUB_TOKEN = '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';
  async function addUser(formData: FormData) {
    'use server';
    const newUSerName = formData.get('username') as string;

    if (newUSerName && !globalUesrnames.includes(newUSerName.trim())) {
      globalUesrnames.push(newUSerName.trim());
    }
    revalidatePath('/');
  }

  async function deleteUser(formData:FormData) {
    'use server';
    const usernameToDelete = formData.get('username') as string;

    globalUesrnames = globalUesrnames.filter(name => name !== usernameToDelete);
    revalidatePath('/')
  }

  const profilePromises = globalUesrnames.map(async (username) => {
    const res = await fetch(`https://api.github.com/users/${username}`,{
      cache: 'no-store',
      headers: GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {}
    });
    if(!res.ok) {
      console.error(`GitHub API Error: ${res.status} ${res.statusText}`);
      return null;
    }
    return res.json() as Promise<GitHubProfile>;
  });
  
  const allProfiles = await Promise.all(profilePromises);
  const validProfiles = allProfiles.filter((p): p is GitHubProfile => p !== null);
 
  return(
    <main className="p-8 max-w-2xl mx-auto space-y-8">
      <div className="text-center sm:text-left">
        <h1 className="text-3xl font-bold text-gray-900">GitHub Analyzer</h1>
        <p className="text-sm text-gray-500 mt-1">GitHub IDを入力してメンバーを追加</p>
      </div>
      <form action={addUser} className="flex gap-2 p-4 bg-gray-50 rounded-lg border shadow-sm">
        <input 
          type="text"
          name="username"
          placeholder="GitHub ユーザー名を入力（例：gaearon）"
          required
          className="flex-1 px-4 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md text-sm transition-colors shadow-sm"
        >
          追加する
        </button>
      </form>

      <div className="space-y-3">
        <h2 className="text-xl font-bold text-gray-800 px-1">分析対象メンバー</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {validProfiles.map((user) => {
            if (!user || !user.login) return null;

            return (
              <div 
                key={user.login}
                className="relative flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
              >
                {/* 1. 左側全体を詳細ページへのリンクにする（ボタンとエリアを分離してバグを回避） */}
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

                {/* 2. 右側に独立した削除用のフォームとボタンを配置 */}
                <form action={deleteUser} className="ml-2 flex-shrink-0">
                  {/* サーバーに誰を消すかを伝えるための隠し入力欄 */}
                  <input type="hidden" name="username" value={user.login} />
                  <button
                    type="submit"
                    className="p-2 text-gray-400 hover:text-red-500 rounded-md hover:bg-gray-50 transition-colors text-xs font-medium"
                    title="このメンバーを削除"
                  >
                    🗑️ 削除
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}


