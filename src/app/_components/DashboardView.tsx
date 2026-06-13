import React from "react";
import Link from "next/link";
import GroupSidebar from "./GroupSidebar";
import GroupStats from "./GroupStats";
import MemberList from "./MemberList";
import ProjectView from "./ProjectView";

interface GitHubProfile {
  login: string;
  name: string;
  followers: number;
  public_repos: number;
  avatar_url: string;
}
interface MemberStats {
  profile: GitHubProfile;
  monthlyCommits: number;
  languages: string[];
}
interface LanguageAnalysis {
  language: string;
  percentage: number;
}

interface RepoMeta { stargazers_count: number; forks_count: number; open_issues_count: number; pushed_at: string; }
interface Contributor { login: string; contributions: number; avatar_url: string; }
interface CommitInfo { sha: string; commit: { author: { name: string; date: string }; message: string; }; }
interface ProjectData { repoOwner: string; repoName: string; meta: RepoMeta | null; contributors: Contributor[]; commits: CommitInfo[]; }

interface DashboardViewProps {
  groups: { [key: string]: string[] };
  currentGroup: string;
  validMemberStats: MemberStats[];
  groupTotalCommits: number;
  groupLanguageAnalysis: LanguageAnalysis[];
  createGroup: (formData: FormData) => Promise<void>;
  deleteGroup: (formData: FormData) => Promise<void>;
  addUser: (formData: FormData) => Promise<void>;
  deleteUser: (formData: FormData) => Promise<void>;
  searchParamsUser: string;
  currentTab: "member" | "project";
  repositories: { owner: string; repo: string }[];
  currentRepoIdx: number;
  projectData: ProjectData | null;
  addRepository: (formData: FormData) => Promise<void>;
  deleteRepository: (formData: FormData) => Promise<void>;
}

export default function DashboardView({
  groups,
  currentGroup,
  validMemberStats,
  groupTotalCommits,
  groupLanguageAnalysis,
  createGroup,
  deleteGroup,
  addUser,
  deleteUser,
  searchParamsUser,
  currentTab,
  repositories,
  currentRepoIdx,
  projectData,
  addRepository,
  deleteRepository,
}: DashboardViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
        <Link
          href={`/?group=${currentGroup}&tab=member`}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${
            currentTab === "member"
              ? "border-gray-950 text-white"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          👥 メンバー分析
        </Link>
        <Link
          href={`/?group=${currentGroup}&tab=project`}
          className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${
            currentTab === "project"
              ? "border-gray-950 text-white"
              : "border-transparent text-gray-400 hover:text-gray-600"
          }`}
        >
          🚀 プロジェクト分析
        </Link>
        <Link
          href="/"
          className="ml-6 text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <span>🏠</span> トップに戻る
        </Link>
      </div>

      {currentTab === "member" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <GroupSidebar
              groups={groups}
              currentGroup={currentGroup}
              createGroupAction={createGroup}
              deleteGroupAction={deleteGroup}
            />
          </div>

          <div className="md:col-span-3 space-y-8">
            {searchParamsUser && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl text-xs font-medium">
                💡 現在、検索窓の指定による個別ユーザー「{searchParamsUser}」のクイック解析結果を表示しています。グループ表示に戻るには検索窓を空にしてください。
              </div>
            )}

            <GroupStats
              currentGroup={currentGroup}
              groupTotalCommits={groupTotalCommits}
              groupLanguageAnalysis={groupLanguageAnalysis}
              validMemberStats={validMemberStats}
            />

            <MemberList
              validMemberStats={validMemberStats}
              currentGroup={currentGroup}
              addUserAction={addUser}
              deleteUserAction={deleteUser}
              isGuest={false}
            />
          </div>
        </div>
      ) : (
        <ProjectView
          repositories={repositories}
          currentRepoIdx={currentRepoIdx}
          projectData={projectData}
          addRepository={addRepository}
          deleteRepository={deleteRepository}
        />
      )}
    </div>
  );
}