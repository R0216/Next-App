import React from "react";
import Image from "next/image";

interface MemberStats {
  profile: {
    login: string;
    name: string;
    avatar_url: string;
  };
  monthlyCommits: number;
  languages: string[];
}

interface GroupStatsProps {
  currentGroup: string;
  validMemberStats: MemberStats[];
  groupTotalCommits: number;
  groupLanguageAnalysis: { language: string; percentage: number }[];
}

export default function GroupStats({
  currentGroup,
  validMemberStats,
  groupTotalCommits,
  groupLanguageAnalysis,
}: GroupStatsProps) {
  if (currentGroup === "未分類" || validMemberStats.length === 0) return null;

  const langColors: { [key: string]: string } = {
    TypeScript: "bg-blue-600", JavaScript: "bg-yellow-400", Python: "bg-sky-600",
    Java: "bg-amber-700", C: "bg-gray-500", "C++": "bg-pink-500", CSharp: "bg-green-600",
    Go: "bg-cyan-500", Rust: "bg-orange-400", PHP: "bg-indigo-600", Ruby: "bg-red-700",
    HTML: "bg-orange-500", CSS: "bg-purple-500",
  };

  const rankingList = [...validMemberStats].sort((a, b) => b.monthlyCommits - a.monthlyCommits);

  return (
    <div className="space-y-6 bg-gray-50/50 p-6 rounded-xl border border-gray-200">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        <span>📊 グループ内統計サマリー</span>
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow-sm text-center space-y-1">
          <div className="text-xs text-purple-600 font-bold">グループ今月の総コミット</div>
          <div className="text-3xl font-mono font-black text-purple-900">{groupTotalCommits}</div>
          <p className="text-[10px] text-gray-400">所属メンバーの今月の活動総量</p>
        </div>

        <div className="p-4 bg-white border rounded-xl shadow-sm sm:col-span-2 space-y-2">
          <div className="text-xs text-gray-500 font-bold">グループ内の開発言語割合</div>
          {groupLanguageAnalysis.length === 0 ? (
            <p className="text-xs text-gray-400 pt-2">言語データがありません</p>
          ) : (
            <div className="space-y-2">
              <div className="w-full h-3 rounded-full overflow-hidden flex bg-gray-100">
                {groupLanguageAnalysis.slice(0, 5).map((item) => {
                  const color = langColors[item.language] || "bg-indigo-400";
                  return (
                    <div 
                      key={item.language} 
                      style={{ width: `${item.percentage}%` }} 
                      className={`${color} h-full transition-all`}
                      title={`${item.language}: ${item.percentage}%`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono font-bold">
                {groupLanguageAnalysis.slice(0, 4).map((item) => (
                  <div key={item.language} className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full inline-block ${langColors[item.language] || "bg-indigo-400"}`} />
                    <span className="text-gray-700">{item.language}</span>
                    <span className="text-gray-400">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-4 bg-white border rounded-xl shadow-sm space-y-3">
        <div className="text-xs text-blue-600 font-bold">🏆 今月のコミット数ランキング（全員分）</div>
        <div className="divide-y border-t border-b overflow-hidden rounded-lg max-h-60 overflow-y-auto">
          {rankingList.map((member, idx) => {
            const isTop = idx === 0;
            const rankColor = idx === 0 ? "text-yellow-500 font-black" : idx === 1 ? "text-gray-400 font-bold" : idx === 2 ? "text-amber-600 font-bold" : "text-gray-500";
            return (
              <div key={member.profile.login} className={`flex items-center justify-between p-2 text-sm ${isTop ? "bg-yellow-50/30" : "bg-white"}`}>
                <div className="flex items-center space-x-3 min-w-0">
                  <span className={`w-6 text-center shrink-0 ${rankColor}`}>{idx + 1}位</span>
                  <Image
                    src={member.profile.avatar_url}
                    alt={member.profile.login}
                    width={32}
                    height={32}
                    className="rounded-full"
                    unoptimized
                  />
                  <span className="font-semibold text-gray-800 truncate">{member.profile.name || member.profile.login}</span>
                  <span className="text-xs font-mono text-gray-400 truncate">(@{member.profile.login})</span>
                </div>
                <div className="font-mono font-extrabold text-gray-900 shrink-0">
                  <span className={isTop ? "text-yellow-600" : "text-gray-700"}>{member.monthlyCommits}</span> <span className="text-[10px] text-gray-400 font-normal">commits</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}