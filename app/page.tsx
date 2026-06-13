import React from "react";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "../src/db/index"; 
import { users, groups, groupMembers, repositories } from "../src/db/schema";

import GuestView from "./_components/GuestView";
import DashboardView from "./_components/DashboardView";

interface GitHubProfile { login: string; name: string; followers: number; public_repos: number; avatar_url: string; }
interface GitHubRepo { language: string | null; }
interface GitHubEvent {
  type: string;
  created_at: string;
  payload: { size?: number; distinct_size?: number; commits?: { message: string; sha: string }[]; }; 
}
interface MemberStats { profile: GitHubProfile; monthlyCommits: number; languages: string[]; }

interface RepoMeta { stargazers_count: number; forks_count: number; open_issues_count: number; pushed_at: string; created_at: string; }
interface Contributor { login: string; contributions: number; avatar_url: string; }
interface CommitInfo { sha: string; commit: { author: { name: string; date: string }; message: string; }; }

interface PageProps {
  searchParams: Promise<{ group?: string; searchUser?: string; tab?: string; repoIdx?: string; sort?: string }>;
}

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const cleanUrl = url.replace(/\.git$/, "").replace(/\/$/, "");
    const parts = cleanUrl.split("github.com/")[1]?.split("/");
    if (parts && parts.length >= 2) return { owner: parts[0], repo: parts[1] };
  } catch { /**/ }
  return null;
}

export default async function Home({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const sessionUser = cookieStore.get("auth_session")?.value || null;
  const sessionToken = cookieStore.get("auth_github_token")?.value || null;

  const GITHUB_TOKEN = sessionToken || process.env.GITHUB_TOKEN;
  const reqHeaders: HeadersInit = GITHUB_TOKEN ? { Authorization: `token ${GITHUB_TOKEN}` } : {};

  const resolvedSearchParams = await searchParams;
  const currentGroup = resolvedSearchParams.group || "未分類";
  const searchUser = resolvedSearchParams.searchUser || "";
  const currentTab = (resolvedSearchParams.tab === "project" ? "project" : "member") as "member" | "project";
  const currentRepoIdx = parseInt(resolvedSearchParams.repoIdx || "0", 10);
  const currentSort = resolvedSearchParams.sort || "created_desc";

  let userInDb: typeof users.$inferSelect | null = null;
  let myGroups: { [key: string]: string[] } = { "未分類": [] };
  let dbRepositories: { owner: string; repo: string }[] = [];

  if (sessionUser) {
    const existingUsers = await db.select().from(users).where(eq(users.githubId, sessionUser));
    userInDb = existingUsers[0] || null;
    
    if (userInDb) {
      const existingGroups = await db.select().from(groups).where(eq(groups.ownerId, userInDb.id));
      if (!existingGroups.some(g => g.name === "未分類")) {
        await db.insert(groups).values({ name: "未分類", ownerId: userInDb.id });
      }

      const allGroups = await db.select().from(groups).where(eq(groups.ownerId, userInDb.id));
      myGroups = {};
      
      for (const g of allGroups) {
        const members = await db.select().from(groupMembers).where(eq(groupMembers.groupId, g.id));
        myGroups[g.name] = members.map(m => m.username);
      }

      const currentGroupRow = allGroups.find(g => g.name === currentGroup);
      if (currentGroupRow) {
        const repos = await db.select().from(repositories).where(eq(repositories.groupId, currentGroupRow.id));
        dbRepositories = repos.map(r => ({ owner: r.repoOwner, repo: r.repoName }));
      }
    }
  }

  async function addRepository(formData: FormData) {
    "use server";
    if (!sessionUser || !userInDb) return;
    const repoUrl = (formData.get("repoUrl") as string)?.trim();
    if (!repoUrl) return;
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) return;

    const allGroups = await db.select().from(groups).where(eq(groups.ownerId, userInDb.id));
    const group = allGroups.find(g => g.name === currentGroup);
    
    if (group) {
      try {
        await db.insert(repositories).values({
          groupId: group.id,
          repoOwner: parsed.owner,
          repoName: parsed.repo
        });
      } catch { /**/ }
    }
    revalidatePath(`/?group=${currentGroup}&tab=project`);
  }

  async function deleteRepository(formData: FormData) {
    "use server";
    if (!sessionUser || !userInDb) return;
    const owner = formData.get("owner") as string;
    const repo = formData.get("repo") as string;

    const allGroups = await db.select().from(groups).where(eq(groups.ownerId, userInDb.id));
    const group = allGroups.find(g => g.name === currentGroup);
    
    if (group) {
      await db.delete(repositories).where(
        and(
          eq(repositories.groupId, group.id),
          eq(repositories.repoOwner, owner),
          eq(repositories.repoName, repo)
        )
      );
    }
    revalidatePath(`/?group=${currentGroup}&tab=project`);
  }

  async function createGroup(formData: FormData) { "use server"; if (!sessionUser || !userInDb) return; const name = (formData.get("groupName") as string)?.trim(); if (!name) return; try { await db.insert(groups).values({ name, ownerId: userInDb.id }); } catch { /**/ } revalidatePath("/"); }
  async function deleteGroup(formData: FormData) { "use server"; if (!sessionUser || !userInDb) return; const name = formData.get("groupName") as string; if (!name || name === "未分類") return; await db.delete(groups).where(and(eq(groups.name, name), eq(groups.ownerId, userInDb.id))); revalidatePath("/"); }
  async function addUser(formData: FormData) { "use server"; if (!sessionUser || !userInDb) return; const username = (formData.get("username") as string)?.trim(); const targetGroupName = formData.get("targetGroup") as string || "未分類"; if (!username) return; const allGroups = await db.select().from(groups).where(eq(groups.ownerId, userInDb.id)); const group = allGroups.find(g => g.name === targetGroupName); if (group) { try { await db.insert(groupMembers).values({ groupId: group.id, username }); } catch { /**/ } } revalidatePath("/"); }
  async function deleteUser(formData: FormData) { "use server"; if (!sessionUser || !userInDb) return; const username = formData.get("username") as string; const targetGroupName = formData.get("targetGroup") as string || "未分類"; const allGroups = await db.select().from(groups).where(eq(groups.ownerId, userInDb.id)); const group = allGroups.find(g => g.name === targetGroupName); if (group) { await db.delete(groupMembers).where(and(eq(groupMembers.groupId, group.id), eq(groupMembers.username, username))); } revalidatePath("/"); }

  const displayUsernames = searchUser ? [searchUser] : (sessionUser ? (myGroups[currentGroup] || []) : []);
  const memberStatsPromises = displayUsernames.map(async (username) => {
    try {
      const [profileRes, reposRes, eventsRes] = await Promise.all([
        fetch(`https://api.github.com/users/${username}`, { cache: "no-store", headers: reqHeaders }),
        fetch(`https://api.github.com/users/${username}/repos?per_page=20`, { cache: "no-store", headers: reqHeaders }),
        fetch(`https://api.github.com/users/${username}/events?per_page=100`, { cache: "no-store", headers: reqHeaders })
      ]);
      if (!profileRes.ok) return null;
      const reposData = (await reposRes.json()) as GitHubRepo[] || [];
      const eventsData = (await eventsRes.json()) as GitHubEvent[] || [];
      let userMonthlyCommits = 0;
      eventsData.forEach((event) => { if (event.type === "PushEvent") { userMonthlyCommits += event.payload?.commits?.length || event.payload?.distinct_size || event.payload?.size || 1; } });
      return { profile: await profileRes.json() as GitHubProfile, languages: reposData.map(r => r.language).filter((l): l is string => l !== null), monthlyCommits: userMonthlyCommits } as MemberStats;
    } catch { return null; }
  });

  const validMemberStats = (await Promise.all(memberStatsPromises)).filter((m): m is MemberStats => m !== null);
  const groupTotalCommits = validMemberStats.reduce((sum, m) => sum + m.monthlyCommits, 0);
  const groupLanguageCounts: { [key: string]: number } = {};
  let groupTotalLanguages = 0;
  validMemberStats.forEach((m) => { m.languages.forEach((l) => { groupLanguageCounts[l] = (groupLanguageCounts[l] || 0) + 1; groupTotalLanguages++; }); });
  const groupLanguageAnalysis = Object.entries(groupLanguageCounts).map(([language, count]) => ({ language, percentage: Math.round((count / groupTotalLanguages) * 100) || 0 })).sort((a, b) => b.percentage - a.percentage);

  let sortedRepositories = dbRepositories.map(r => ({ ...r, created_at: "1970-01-01", stargazers_count: 0 }));
  let activeProjectData = null;

  if (dbRepositories.length > 0) {
    try {
      const metaPromises = dbRepositories.map(async (repo) => {
        try {
          const res = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}`, { cache: "no-store", headers: reqHeaders });
          if (res.ok) {
            const data = await res.json();
            return { ...repo, created_at: data.created_at, stargazers_count: data.stargazers_count };
          }
        } catch { /**/ }
        return { ...repo, created_at: "1970-01-01", stargazers_count: 0 };
      });
      
      const reposWithMeta = await Promise.all(metaPromises);

      reposWithMeta.sort((a, b) => {
        if (currentSort === "created_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (currentSort === "created_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (currentSort === "stars_desc") return b.stargazers_count - a.stargazers_count;
        if (currentSort === "stars_asc") return a.stargazers_count - b.stargazers_count;
        return 0;
      });

      sortedRepositories = reposWithMeta;

      const targetRepo = sortedRepositories[currentRepoIdx];
      if (currentTab === "project" && targetRepo) {
        const [metaRes, contribRes, commitsRes] = await Promise.all([
          fetch(`https://api.github.com/repos/${targetRepo.owner}/${targetRepo.repo}`, { cache: "no-store", headers: reqHeaders }),
          fetch(`https://api.github.com/repos/${targetRepo.owner}/${targetRepo.repo}/contributors?per_page=10`, { cache: "no-store", headers: reqHeaders }),
          fetch(`https://api.github.com/repos/${targetRepo.owner}/${targetRepo.repo}/commits?per_page=15`, { cache: "no-store", headers: reqHeaders }),
        ]);

        activeProjectData = {
          repoOwner: targetRepo.owner,
          repoName: targetRepo.repo,
          meta: metaRes.ok ? (await metaRes.json()) as RepoMeta : null,
          contributors: contribRes.ok ? (await contribRes.json()) as Contributor[] : [],
          commits: commitsRes.ok ? (await commitsRes.json()) as CommitInfo[] : [],
        };
      }
    } catch (e) {
      console.error("プロジェクトソートエラー:", e);
    }
  }

  return (
    <main className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="border-b pb-4 flex justify-between items-center bg-white">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">GitHub Analyzer</h1>
          <p className="text-xs text-gray-400 mt-0.5">マルチモード・エンジニアダッシュボード</p>
        </div>
        <div>
          {sessionUser ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-gray-700 hidden sm:inline">👤 {sessionUser} でログイン中</span>
              <a href="/api/auth/logout" className="bg-red-50 hover:bg-red-100 text-red-600 font-bold px-4 py-2 rounded-xl text-xs transition-colors border border-red-200">ログアウト</a>
            </div>
          ) : (
            <a href="/api/auth/login" className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-2"><span>🐈</span> GitHubでログイン（管理モード）</a>
          )}
        </div>
      </div>

      {sessionUser ? (
        <DashboardView
          groups={myGroups}
          currentGroup={currentGroup}
          validMemberStats={validMemberStats}
          groupTotalCommits={groupTotalCommits}
          groupLanguageAnalysis={groupLanguageAnalysis}
          createGroup={createGroup}
          deleteGroup={deleteGroup}
          addUser={addUser}
          deleteUser={deleteUser}
          searchParamsUser={searchUser}
          
          currentTab={currentTab}
          repositories={sortedRepositories} 
          currentRepoIdx={currentRepoIdx}
          projectData={activeProjectData}
          addRepository={addRepository}
          deleteRepository={deleteRepository}
        />
      ) : (
        <GuestView
          searchParamsUser={searchUser}
          guestMemberStats={validMemberStats}
          groupTotalCommits={groupTotalCommits}
          groupLanguageAnalysis={groupLanguageAnalysis}
        />
      )}
    </main>
  );
}