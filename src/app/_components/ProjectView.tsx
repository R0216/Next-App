import React from "react";
import RepoSidebar from "./RepoSidebar";
import RepoStats from "./Repostats";

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

interface ProjectData {
  repoOwner: string;
  repoName: string;
  meta: RepoMeta | null;
  contributors: Contributor[];
  commits: CommitInfo[];
}

interface ProjectViewProps {
  repositories: { owner: string; repo: string }[];
  currentRepoIdx: number;
  projectData: ProjectData | null;
  addRepository: (formData: FormData) => Promise<void>;
  deleteRepository: (formData: FormData) => Promise<void>;
}

export default function ProjectView({
  repositories,
  currentRepoIdx,
  projectData,
  addRepository,
  deleteRepository,
}: ProjectViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div className="md:col-span-1">
        <RepoSidebar
          repositories={repositories}
          currentRepoIdx={currentRepoIdx}
          addRepository={addRepository}
          deleteRepository={deleteRepository}
        />
      </div>

      <div className="md:col-span-3">
        {projectData ? (
          <RepoStats
            repoOwner={projectData.repoOwner}
            repoName={projectData.repoName}
            meta={projectData.meta}
            contributors={projectData.contributors}
            commits={projectData.commits}
          />
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400">
              {repositories.length === 0 
                ? "左のフォームから、チームのGitHubリポジトリURLを登録してください！" 
                : "分析するリポジトリを左の一覧から選択してください。"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}