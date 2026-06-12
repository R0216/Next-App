import React from "react";
import Image from "next/image";

interface RepoMeta {
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  pushed_at: string;
}

interface Contributor {
  login: string;
  contributions: number;
  avatar_url: string;
}

interface CommitInfo {
  sha: string;
  commit: {
    author: { name: string; date: string };
    message: string;
  };
}

interface RepoStatsProps {
  repoOwner: string;
  repoName: string;
  meta: RepoMeta | null;
  contributors: Contributor[];
  commits: CommitInfo[];
}

export default function RepoStats({ repoOwner, repoName, meta, contributors, commits }: RepoStatsProps) {
  let healthStatus = "⚪ データなし";
  let healthColor = "text-gray-600 bg-gray-50 border-gray-200";
  let healthDesc = "リポジトリデータを解析できませんでした。";

  if (meta) {
    const lastPush = new Date(meta.pushed_at);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastPush.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      healthStatus = "🟢 活発（健全）";
      healthColor = "text-green-700 bg-green-50 border-green-200";
      healthDesc = `直近1週間以内（${diffDays}日前）にコミットがあり、開発は非常にスムーズです！`;
    } else if (diffDays <= 30) {
      healthStatus = "🟡 緩慢";
      healthColor = "text-amber-700 bg-amber-50 border-amber-200";
      healthDesc = `最終更新が ${diffDays}日前 です。少しペースが落ちているか、安定期に入っています。`;
    } else {
      healthStatus = "🔴 停滞";
      healthColor = "text-red-700 bg-red-50 border-red-200";
      healthDesc = `最終更新が ${diffDays}日前 です。開発がストップしている可能性があります。`;
    }
  }

  return (
    <div className="space-y-8">
      <div className="p-6 bg-gray-900 text-white rounded-2xl shadow-md flex justify-between items-center">
        <div>
          <span className="text-xs text-gray-400 font-mono font-bold">{repoOwner} /</span>
          <h2 className="text-2xl font-black tracking-tight">{repoName}</h2>
        </div>
        <div className="flex gap-4 text-center text-xs font-mono">
          <div><div className="text-gray-400">⭐ Stars</div><div className="font-bold">{meta?.stargazers_count ?? 0}</div></div>
          <div><div className="text-gray-400">🍴 Forks</div><div className="font-bold">{meta?.forks_count ?? 0}</div></div>
          <div><div className="text-gray-400">🚨 Issues</div><div className="font-bold text-red-400">{meta?.open_issues_count ?? 0}</div></div>
        </div>
      </div>

      <div className="p-5 border rounded-2xl bg-white shadow-sm space-y-2">
        <h3 className="text-sm font-bold text-gray-800">🌡️ プロジェクト健康度分析</h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-1">
          <div className={`px-4 py-2 rounded-xl font-bold border text-center text-xs whitespace-nowrap ${healthColor}`}>
            {healthStatus}
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">{healthDesc}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="p-5 border rounded-2xl bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800">👥 開発貢献度（Contributors）</h3>
          {contributors.length === 0 ? (
            <p className="text-xs text-gray-400 italic">データがありません</p>
          ) : (
            <div className="space-y-2">
              {contributors.slice(0, 5).map((c, idx) => (
                <div key={c.login} className="flex items-center justify-between p-2 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="w-5 font-bold text-gray-400 text-center">{idx + 1}</span>
                    <Image src={c.avatar_url} alt={c.login} width={24} height={24} className="rounded-full" unoptimized />
                    <span className="font-mono font-semibold text-gray-700">{c.login}</span>
                  </div>
                  <span className="text-xs font-mono bg-white px-2 py-0.5 rounded border text-gray-600">
                    <strong className="text-gray-900 font-bold">{c.contributions}</strong> commits
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-5 border rounded-2xl bg-white shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-gray-800">📜 最近の活動履歴</h3>
          {commits.length === 0 ? (
            <p className="text-xs text-gray-400 italic">直近のコミット履歴がありません</p>
          ) : (
            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              {commits.map((c) => {
                const commitDate = new Date(c.commit.author.date);
                const dateString = `${commitDate.getMonth() + 1}/${commitDate.getDate()} ${String(commitDate.getHours()).padStart(2, "0")}:${String(commitDate.getMinutes()).padStart(2, "0")}`;
                return (
                  <div key={c.sha} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs space-y-1">
                    <div className="font-semibold text-gray-800 line-clamp-1 break-all">
                      {c.commit.message}
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono">
                      <span>👤 {c.commit.author.name}</span>
                      <span>🕒 {dateString}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}