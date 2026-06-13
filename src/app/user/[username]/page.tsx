import React from "react";
import Link from "next/link";
import Image from "next/image";
import SortSelector from "../../_components/SortSelector"; 

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
  created_at: string;
}

interface PageProps {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export default async function UserDetailPage({ params, searchParams }: PageProps) {
  const { username } = await params;
  const resolvedSearchParams = await searchParams;
  
  const currentSort = resolvedSearchParams.sort || "updated_desc";
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

  const perPage = currentSort === "updated_desc" ? 10 : 100;

  const [profileRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { cache: 'no-store', headers: GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {} }),
    fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=${perPage}`, { cache: 'no-store', headers: GITHUB_TOKEN ? { 'Authorization': `token ${GITHUB_TOKEN}` } : {} })
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

  if (currentSort === "created_desc") {
    reposData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } else if (currentSort === "created_asc") {
    reposData.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  } else if (currentSort === "stars_desc") {
    reposData.sort((a, b) => b.stargazers_count - a.stargazers_count);
  } else if (currentSort === "stars_asc") {
    reposData.sort((a, b) => a.stargazers_count - b.stargazers_count);
  }

  const displayRepos = reposData.slice(0, 10);

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
    .map(([lang, count]) => ({ language: lang, percentage: Math.round((count / totalLanguages) * 100) || 0 }))
    .sort((a, b) => b.percentage - a.percentage);

  const langColors: { [key: string]: string } = { 
    TypeScript: "bg-blue-600", JavaScript: "bg-yellow-400", Python: "bg-sky-600", 
    Java: "bg-amber-700", C: "bg-gray-500", "C++": "bg-pink-500", CSharp: "bg-green-600", 
    Go: "bg-cyan-500", Rust: "bg-orange-400", PHP: "bg-indigo-600", Ruby: "bg-red-700", 
    Kotlin: "bg-purple-500", Swift: "bg-orange-500", HTML: "bg-orange-500", CSS: "bg-purple-500"
  };

  return (
    <main className="p-8 max-w-2xl mx-auto space-y-8">
      <Link href="/" className="text-sm text-blue-600 hover:underline inline-block">
        ← トップページに戻る
      </Link>

      <div className="flex items-center space-x-6 p-6 bg-gray-50 rounded-lg shadow-sm border">
        <Image src={profileData.avatar_url} alt={username} width={96} height={96} className="rounded-full border" unoptimized />
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
        <h2 className="text-xl font-bold text-gray-800">🏆 使用言語ランキング(下１０件のリポジトリに使用されている)</h2>
        {languageAnalysis.length === 0 ? (
          <p className="text-sm text-gray-500">言語データがありません。</p>
        ) : (
          <div className="space-y-5">
            <div className="w-full h-4 rounded-full overflow-hidden flex bg-gray-100">
              {languageAnalysis.map((item) => {
                const color = langColors[item.language] || "bg-indigo-400";
                return <div key={item.language} style={{ width: `${item.percentage}%` }} className={`${color} h-full transition-all`} title={`${item.language}: ${item.percentage}%`} />;
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
        <div className="flex items-center justify-between border-b pb-2">
          <h2 className="text-xl font-bold text-gray-800">公開リポジトリ (最大10件)</h2>
          <SortSelector username={username} currentSort={currentSort} />
        </div>
        
        {displayRepos.length === 0 ? (
          <p className="text-gray-500 text-sm">公開されているリポジトリはありません。</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {displayRepos.map((repo) => (
              <a key={repo.id} href={repo.html_url} target="_blank" rel="noopener noreferrer" className="block p-4 border rounded-lg hover:border-blue-500 hover:shadow-md transition-all bg-white group" >
                <h3 className="font-semibold text-blue-600 group-hover:underline break-words">{repo.name}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 h-8">{repo.description || "説明はありません。"}</p>
                <div className="flex justify-between items-center mt-3 text-xs text-gray-600">
                  <span className="bg-gray-100 px-2 py-0.5 rounded font-mono">{repo.language || "Unknown"}</span>
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