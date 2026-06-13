import React from "react";
import GroupStats from "./GroupStats";

interface MemberStats {
  profile: {
    login: string;
    name: string;
    avatar_url: string;
    followers: number;
    public_repos: number;
  };
  monthlyCommits: number;
  languages: string[];
}

interface GuestViewProps {
  searchParamsUser?: string;
  guestMemberStats: MemberStats[];
  groupTotalCommits: number;
  groupLanguageAnalysis: { language: string; percentage: number }[];
}

export default function GuestView({
  searchParamsUser,
  guestMemberStats,
  groupTotalCommits,
  groupLanguageAnalysis,
}: GuestViewProps) {
  return (
    <div className="space-y-8 py-4">
      <div className="text-center py-12 bg-gradient-to-br from-gray-900 to-slate-800 text-white rounded-2xl shadow-xl space-y-4">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          🔍 GitHub ユーザー探索エンジン
        </h2>
        <p className="max-w-xl mx-auto text-sm text-gray-300">
          GitHubIDを入力するだけで、今月のコミット活動量や得意な開発言語の比率を瞬時に解析します。
        </p>
        
        <form method="GET" action="/" className="max-w-md mx-auto flex gap-2 px-4">
          <input
            type="text"
            name="searchUser"
            defaultValue={searchParamsUser || ""}
            placeholder="GitHubユーザー名を入力（例: torvalds）"
            required
            className="flex-1 px-4 py-3 border rounded-xl text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold shadow-inner"
          />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl text-sm transition-all shadow-md shrink-0"
          >
            解析する
          </button>
        </form>
      </div>

      {searchParamsUser ? (
        <div className="space-y-6">
          <div className="border-b pb-2">
            <h3 className="text-xl font-bold text-white">
              🎯 「{searchParamsUser}」のリアルタイム分析結果
            </h3>
          </div>
          <GroupStats
            currentGroup="ゲスト検索"
            validMemberStats={guestMemberStats}
            groupTotalCommits={groupTotalCommits}
            groupLanguageAnalysis={groupLanguageAnalysis}
          />
        </div>
      ) : (
        <div className="text-center py-12 border border-dashed rounded-2xl text-gray-400 text-sm bg-gray-50">
          💡 上の検索窓にエンジニアのIDを入力してみましょう！
        </div>
      )}
    </div>
  );
}