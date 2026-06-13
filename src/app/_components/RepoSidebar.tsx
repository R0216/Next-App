import React from "react";
import Link from "next/link";

interface RepoSidebarProps {
  repositories: { owner: string; repo: string }[];
  currentRepoIdx: number;
  addRepository: (formData: FormData) => Promise<void>;
  deleteRepository: (formData: FormData) => Promise<void>;
}

export default function RepoSidebar({
  repositories,
  currentRepoIdx,
  addRepository,
  deleteRepository,
}: RepoSidebarProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">📦 リポジトリを登録</h3>
        <form action={addRepository} className="space-y-2">
          <input
            type="url"
            name="repoUrl"
            required
            placeholder="https://github.com/owner/repo"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 bg-gray-50 text-gray-800"
          />
          <button
            type="submit"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 rounded-xl text-xs transition-colors shadow-sm"
          >
            プロジェクトを追加
          </button>
        </form>
      </div>

      <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">一覧</h3>
        {repositories.length === 0 ? (
          <p className="text-xs text-gray-400 italic">登録されたリポジトリはありません</p>
        ) : (
          <div className="space-y-1">
            {repositories.map((repo, idx) => {
              const isActive = idx === currentRepoIdx;
              return (
                <div
                  key={`${repo.owner}-${repo.repo}`}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all text-xs group ${
                    isActive 
                      ? "bg-gray-900 text-white font-bold shadow-sm" 
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Link 
                    href={`/?repoIdx=${idx}&tab=project`} 
                    className="flex-1 block truncate pr-2 font-mono"
                  >
                    🚀 {repo.owner}/{repo.repo}
                  </Link>

                  <form action={deleteRepository} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <input type="hidden" name="owner" value={repo.owner} />
                    <input type="hidden" name="repo" value={repo.repo} />
                    <button 
                      type="submit" 
                      className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                        isActive ? "text-red-400 hover:text-red-300" : "text-gray-400 hover:text-red-500"
                      }`}
                    >
                      削
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}