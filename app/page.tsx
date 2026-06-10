import React from "react";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

// 作成したコンポーネント群をインポート
import GroupSidebar from "./_components/GroupSidebar";
import GroupStats from "./_components/GroupStats";
import MemberList from "./_components/MemberList";

interface GitHubProfile {
  login: string;
  name: string;
  followers: number;
  public_repos: number;
  avatar_url: string;
}
interface GitHubRepo { language: string | null; }
interface GitHubEvent {
  type: string;
  created_at: string;
  payload: {
    size?: number;
    distinct_size?: number;
    commits?: { message: string; sha: string }[];
  }; 
}
interface MemberStats {
  profile: GitHubProfile;
  monthlyCommits: number;
  languages: string[];
}

const filePath = path.join(process.cwd(), "groups.json");
interface GroupData { [groupName: string]: string[]; }

function loadGroups(): GroupData {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    }
  } catch (e) { console.error(e); }
  return { "未分類": ["R0216", "torvalds"] };
}

function saveGroups(data: GroupData) {
  try { fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8"); } catch (e) { console.error(e); }
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

  // ==========================================
  // Server Actions (サーバー側の処理ロジック)
  // ==========================================
  async function createGroup(formData: FormData) {
    "use server";
    const groupName = formData.get("groupName") as string;
    if (!groupName) return;
    const currentGroups = loadGroups();
    if (!currentGroups[groupName.trim()]) {
      currentGroups[groupName.trim()] = [];
      saveGroups(currentGroups);
    }
    revalidatePath("/");
  }

  async function deleteGroup(formData: FormData) {
    "use server";
    const groupToDelete = formData.get("groupName") as string;
    if (!groupToDelete || groupToDelete === "未分類") return;
    const currentGroups = loadGroups();
    if (currentGroups[groupToDelete]) {
      delete currentGroups[groupToDelete];
      saveGroups(currentGroups);
    }
    revalidatePath("/");
  }

  async function addUser(formData: FormData) {
    "use server";
    const username = formData.get("username") as string;
    const targetGroup = formData.get("targetGroup") as string || "未分類";
    if (!username) return;
    const currentGroups = loadGroups();
    if (!currentGroups[targetGroup]) currentGroups[targetGroup] = [];
    if (!currentGroups[targetGroup].includes(username.trim())) {
      currentGroups[targetGroup].push(username.trim());
      saveGroups(currentGroups);
    }
    revalidatePath("/");
  }

  async function deleteUser(formData: FormData) {
    "use server";
    const username = formData.get("username") as string;
    const targetGroup = formData.get("targetGroup") as string || "未分類";
    if (!username) return;
    const currentGroups = loadGroups();
    if (currentGroups[targetGroup]) {
      currentGroups[targetGroup] = currentGroups[targetGroup].filter((n) => n !== username);
      saveGroups(currentGroups);
    }
    revalidatePath("/");
  }

  // ==========================================
  // 📈 データフェッチ・集計処理
  // ==========================================
  const now = new Date();
  const reqHeaders: HeadersInit = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

  const memberStatsPromises = displayUsernames.map(async (username) => {
    try {
      const [profileRes, reposRes, eventsRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`, { cache: "no-store", headers: reqHeaders }),
        fetch(`https://api.github.com/users/${username}/repos?per_page=20`, { cache: "no-store", headers: reqHeaders }),
        fetch(`https://api.github.com/users/${username}/events?per_page=100`, { cache: "no-store", headers: reqHeaders })
      ]);
      if (!profileRes.ok) return null;

      const profile: GitHubProfile = await profileRes.json();
      const repos: GitHubRepo[] = reposRes.ok ? await reposRes.json() : [];
      const events: GitHubEvent[] = eventsRes.ok ? await eventsRes.json() : [];

      const userLanguages = repos.map(r => r.language).filter((l): l is string => l !== null);
      let userMonthlyCommits = 0;
      events.forEach((event) => {
        if (event.type === "PushEvent") {
          userMonthlyCommits += event.payload?.commits?.length || event.payload?.distinct_size || event.payload?.size || 1;
        }
      });

      return { profile, monthlyCommits: userMonthlyCommits, languages: userLanguages } as MemberStats;
    } catch (e) { return null; }
  });

  const validMemberStats = (await Promise.all(memberStatsPromises)).filter((m): m is MemberStats => m !== null);
  
  // 統計集計
  const groupTotalCommits = validMemberStats.reduce((sum, m) => sum + m.monthlyCommits, 0);
  const groupLanguageCounts: { [key: string]: number } = {};
  let groupTotalLanguages = 0;
  validMemberStats.forEach((m) => {
    m.languages.forEach((l) => { groupLanguageCounts[l] = (groupLanguageCounts[l] || 0) + 1; groupTotalLanguages++; });
  });

  const groupLanguageAnalysis = Object.entries(groupLanguageCounts)
    .map(([language, count]) => ({ language, percentage: Math.round((count / groupTotalLanguages) * 100) || 0 }))
    .sort((a, b) => b.percentage - a.percentage);

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8">
      {/* 1. ヘッダー */}
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

      {/* 2. 左右2カラムレイアウト */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* 左側：グループ管理サイドバー */}
        <GroupSidebar 
          groups={groups} 
          currentGroup={currentGroup} 
          createGroupAction={createGroup} 
          deleteGroupAction={deleteGroup} 
        />
        
        {/* 右側：メインコンテンツ領域 */}
        <div className="md:col-span-2 space-y-8">
          {/* 統計情報（コンポーネント内で条件分岐） */}
          <GroupStats 
            currentGroup={currentGroup} 
            validMemberStats={validMemberStats} 
            groupTotalCommits={groupTotalCommits} 
            groupLanguageAnalysis={groupLanguageAnalysis} 
          />
          {/* メンバー登録フォーム ＆ カード一覧 */}
          <MemberList 
            currentGroup={currentGroup} 
            validMemberStats={validMemberStats} 
            addUserAction={addUser} 
            deleteUserAction={deleteUser} 
          />
        </div>
      </div>
    </main>
  );
}