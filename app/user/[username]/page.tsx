import React from "react";
import Link from "next/link";
import Image from "next/image";

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
  repo: {
    id: number;
    name: string;
    url: string;
  };
  payload: {
    size?: number;
    distinct_size?: number;
    commits?: Record<string, unknown>[];
  }; 
}

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserDetailPage({ params }: PageProps) {
  const { username } = await params;
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

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

  let weeklyCommits = 0;
  let monthlyCommits = 0;
  let totalTrackedCommits = 0;

  const timeSlots = Array(12).fill(0);
  const repoCommitCounts: { [key: string]: number } = {};
  
  let latestRepoName = "";
  
  let latestCommitDate: Date | null = null; 

  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000); 

  eventsData.forEach((event) => {
    if (event.type === "PushEvent") {
      const commitCount = 
        (event.payload && event.payload.commits?.length) || 
        (event.payload && event.payload.distinct_size) || 
        (event.payload && event.payload.size) || 
        1;

      const eventDate = new Date(event.created_at);

      totalTrackedCommits += commitCount;
      if (eventDate >= oneWeekAgo) weeklyCommits += commitCount;
      if (eventDate.getFullYear() === now.getFullYear() && eventDate.getMonth() === now.getMonth()) {
        monthlyCommits += commitCount;
      }

      const jstHour = (eventDate.getUTCHours() + 9) % 24;
      const slotIndex = Math.floor(jstHour / 2);
      timeSlots[slotIndex] += commitCount;

      const repoName = event.repo.name.split("/")[1] || event.repo.name;
      repoCommitCounts[repoName] = (repoCommitCounts[repoName] || 0) + commitCount;

      if (!latestCommitDate || eventDate > latestCommitDate) {
        latestCommitDate = eventDate;
        latestRepoName = repoName;
      }
    }
  });

  let mainProjectName = "";
  let mainProjectCommits = 0;

  Object.entries(repoCommitCounts).forEach(([name, count]) => {
    if (count > mainProjectCommits) {
      mainProjectCommits = count;
      mainProjectName = name;
    }
  });

  let maxCommitsInSlot = 0;
  let peakSlotIndex = 11;
  timeSlots.forEach((count, index) => {
    if (count > maxCommitsInSlot) {
      maxCommitsInSlot = count;
      peakSlotIndex = index;
    }
  });

  const startHour = peakSlotIndex * 2;
  const endHour = startHour + 2;
  const peakTimeRange = `${String(startHour).padStart(2, "0")}:00〜${String(endHour).padStart(2, "0")}:00`;

  let developerType = "お留守番開発者";
  let typeColor = "text-gray-500 bg-gray-50 border-gray-200";

  if (totalTrackedCommits > 0) {
    if (startHour >= 5 && startHour < 11) {
      developerType = "朝活型開発者";
      typeColor = "text-orange-600 bg-orange-50 border-orange-200";
    } else if (startHour >= 11 && startHour < 17) {
      developerType = "昼間集中型開発者";
      typeColor = "text-green-600 bg-green-50 border-green-200";
    } else if (startHour >= 17 && startHour < 22) {
      developerType = "夕暮れ開発者";
      typeColor = "text-indigo-600 bg-indigo-50 border-indigo-200";
    } else {
      developerType = "夜型開発者";
      typeColor = "text-purple-600 bg-purple-50 border-purple-200";
    }
  }

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline inline-block">
        ← トップページに戻る
      </Link>

      <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-lg shadow-sm border">
        <Image
          src={profileData.avatar_url}
          alt={username}
          width={96}
          height={96}
          className="rounded-full border"
          unoptimized
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

      <div className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-800">📊 アクティビティ統計</h2>
        <p className="text-xs text-gray-400">※直近 of 活動データからコミット数を集計しています</p>
        
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

      <div className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-800">🕒 開発リズム分析</h2>
        
        {totalTrackedCommits === 0 ? (
          <p className="text-sm text-gray-500">直近のアクティビティデータがないため、分析できません。</p>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 bg-gray-50 rounded-xl border">
            <div className="space-y-1 text-center sm:text-left">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">最も活動する時間</span>
              <div className="text-3xl font-mono font-extrabold text-gray-900 tracking-tight">
                {peakTimeRange}
              </div>
            </div>
            
            <div className={`px-6 py-3 rounded-full font-bold text-center border shadow-sm text-lg ${typeColor}`}>
              ✨ {developerType}
            </div>
          </div>
        )}
      </div>

      {totalTrackedCommits > 0 && mainProjectName && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 border rounded-lg bg-gradient-to-br from-red-50/40 to-orange-50/20 shadow-sm border-red-100 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">🔥</span>
              <h2 className="text-md font-bold text-gray-700">現在のメインプロジェクト</h2>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-extrabold text-red-900 break-all">{mainProjectName}</div>
              <p className="text-xs text-gray-500">直近データ内: <strong className="text-red-600 font-mono text-sm">{mainProjectCommits}</strong> commits</p>
            </div>
          </div>

          <div className="p-5 border rounded-lg bg-gradient-to-br from-blue-50/40 to-indigo-50/20 shadow-sm border-blue-100 space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">✨</span>
              <h2 className="text-md font-bold text-gray-700">最新の動向</h2>
            </div>
            <div className="space-y-1">
              <div className="text-xl font-extrabold text-blue-900 break-all">{latestRepoName}</div>
              <p className="text-xs text-gray-500">
                最新コミット: <strong className="text-blue-600 text-xs">
                  {latestCommitDate ? `${(latestCommitDate as Date).getMonth() + 1}/${(latestCommitDate as Date).getDate()} ${String((latestCommitDate as Date).getHours()).padStart(2, "0")}:${String((latestCommitDate as Date).getMinutes()).padStart(2, "0")}` : "---"}
                </strong>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="p-6 border rounded-lg bg-white shadow-sm space-y-4">
        <h2 className="text-xl font-bold text-gray-800">🏆 使用言語ランキング</h2>
        
        {languageAnalysis.length === 0 ? (
          <p className="text-sm text-gray-500">言語データがありません。</p>
        ) : (
          <div className="space-y-5">
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100">
              {languageAnalysis.map((item) => {
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