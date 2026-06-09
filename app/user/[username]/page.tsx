import React from "react";
import Link from "next/link";

interface GitHubProfile {
  name: string;
  followers: number;
  public_repos: number;
  avatar_url: string;
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  html_url: string;
}

interface GitHubEvent {
  id: string;
  type: string;
  created_at: string;
  payload: {
    size?: number;
    distinct_size?: number;
    commits?: Array<{
      sha: string;
      message: string;
    }>;
  };
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { username } = await params;
  
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN

  const [profileRes, reposRes, eventsRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { cache: 'no-store', headers: GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {} }),
    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`, { cache: 'no-store', headers: GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {} }),
    fetch(`https://api.github.com/users/${username}/events?per_page=100`, { cache: 'no-store', headers: GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {} })
  ]);

  if (!profileRes.ok || !reposRes.ok) {
    return (
      <main className="p-8 text-center">
        <p className="text-red-500 font-bold">詳細データの取得に失敗しました。</p>
        <Link href="/" className="text-blue-600 underline text-sm mt-4 inline-block">トップへ戻る</Link>
      </main>
    );
  }

  const profileData: GitHubProfile = await profileRes.json();
  const reposData: GitHubRepo[] = await reposRes.json();
  const eventsData: GitHubEvent[] = eventsRes.ok ? await eventsRes.json() : [];

  // ==========================================
  // 📊 使用言語の分析・スター数集計ロジック
  // ==========================================
  const languageCounts: { [key: string]: number } = {};
  let totalLanguages = 0;
  let totalStars = 0;

  reposData.forEach((repo) => {
    totalStars += repo.stargazers_count;
    if (repo.language) {
      languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1;
      totalLanguages++;
    }
  });

  const languageAnalysis = Object.entries(languageCounts)
    .map(([lang, count]) => {
      return {
        language: lang,
        percentage: Math.round((count / totalLanguages) * 100),
      };
    })
    .sort((a, b) => b.percentage - a.percentage);

  const langColors: { [key: string]: string } = {
    TypeScript: "bg-blue-600",
    JavaScript: "bg-yellow-400",
    Python: "bg-sky-600",
    Java: "bg-amber-700",
    C: "bg-gray-500",
    "C++": "bg-pink-500",
    CSharp: "bg-green-600",
    Go: "bg-cyan-500",
    Rust: "bg-orange-400",
    PHP: "bg-indigo-600",
    Ruby: "bg-red-700",
    Kotlin: "bg-purple-500",
    Swift: "bg-orange-500",
    HTML: "bg-orange-500",
    CSS: "bg-purple-500",
  };

  // ==========================================
  // 📈 コミット数の集計ロジック（最終判定版）
  // ==========================================
  let weeklyCommits = 0;
  let monthlyCommits = 0;
  let totalTrackedCommits = 0;

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); 

  eventsData.forEach((event) => {
    if (event.type === "PushEvent" && event.payload) {
      // 💡 commits配列の長さ、またはsize、distinct_sizeから確実に件数を取る
      const commitCount = 
        (event.payload.commits && event.payload.commits.length) || 
        event.payload.distinct_size || 
        event.payload.size || 
        0;

      const eventDate = new Date(event.created_at);

      totalTrackedCommits += commitCount;

      if (eventDate >= oneWeekAgo) {
        weeklyCommits += commitCount;
      }

      if (eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth()) {
        monthlyCommits += commitCount;
      }
    }
  });

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline inline-block">
        ← トップページに戻る
      </Link>

      {/* 👤 プロフィール */}
      <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-lg shadow-sm border">
        <img 
          src={profileData.avatar_url} 
          alt={`${profileData.name || username}'s avatar`} 
          className="w-24 h-24 rounded-full border-2 border-white shadow-sm"
        />
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-gray-900">{profileData.name || username}</h1>
          <p className="text-sm text-gray-500">GitHub ID: <span className="font-mono font-bold text-gray-700">{username}</span></p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 pt-2">
            <span>フォロワー: <strong className="text-blue-600">{profileData.followers}</strong> 人</span>
            <span>リポジトリ: <strong className="text-green-600">{profileData.public_repos}</strong> 個</span>
            <span>総スター数: <strong className="text-yellow-500">⭐ {totalStars}</strong></span>
          </div>
        </div>
      </div>

      {/* 📊 コミット数統計ダッシュボード */}
      <div className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-800">📊 アクティビティ統計</h2>
        <p className="text-xs text-gray-400">※直近の活動データからコミット数を集計しています</p>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
            <div className="text-xs text-blue-600 font-semibold mb-1">今週のコミット</div>
            <div className="text-2xl font-mono font-bold text-blue-900">{weeklyCommits}</div>
          </div>
          <div className="p-3 bg-green-50/50 rounded-lg border border-green-100">
            <div className="text-xs text-green-600 font-semibold mb-1">今月のコミット</div>
            <div className="text-2xl font-mono font-bold text-green-900">{monthlyCommits}</div>
          </div>
          <div className="p-3 bg-purple-50/50 rounded-lg border border-purple-100">
            <div className="text-xs text-purple-600 font-semibold mb-1">総コミット(直近)</div>
            <div className="text-2xl font-mono font-bold text-purple-900">{totalTrackedCommits}</div>
          </div>
        </div>
      </div>

      {/* 🏆 使用言語ランキング */}
      <div className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-800">🏆 使用言語ランキング</h2>
        
        {languageAnalysis.length === 0 ? (
          <p className="text-sm text-gray-500">言語データがありません。</p>
        ) : (
          <div className="space-y-5">
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100">
              {languageAnalysis.map((item, idx) => {
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

            <div className="space-y-2 max-w-md">
              {languageAnalysis.map((item, idx) => {
                const color = langColors[item.language] || "bg-indigo-400";
                const rankColor = idx === 0 ? "text-yellow-500 font-extrabold" : idx === 1 ? "text-gray-400 font-bold" : idx === 2 ? "text-amber-600 font-bold" : "text-gray-500";
                
                return (
                  <div key={item.language} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <span className={`w-8 text-center text-sm ${rankColor}`}>{idx + 1}位</span>
                      <span className={`w-3 h-3 rounded-full ${color} block`} />
                      <span className="font-semibold text-gray-800 text-sm">{item.language}</span>
                    </div>
                    <span className="font-mono font-bold text-gray-900 text-sm">{item.percentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 📦 リポジトリ一覧 */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold border-b pb-2 text-gray-800">公開リポジトリ (最近更新された10件)</h2>
        
        {reposData.length === 0 ? (
          <p className="text-gray-500 text-sm">公開されているリポジトリはありません。</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {reposData.map((repo) => (
              <a 
                key={repo.id} 
                href={repo.html_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all bg-white group"
              >
                <h3 className="font-semibold text-blue-600 group-hover:underline break-words">
                  {repo.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">
                  {repo.description || "説明はありません。"}
                </p>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-600">
                  <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">
                    {repo.language || "Unknown"}
                  </span>
                  <span>⭐ {repo.stargazers_count}</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}