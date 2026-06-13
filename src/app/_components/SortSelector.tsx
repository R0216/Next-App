"use client";
import React from "react";
import { useRouter } from "next/navigation";

interface SortSelectorProps {
  username: string;
  currentSort: string;
}

export default function SortSelector({ username, currentSort }: SortSelectorProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSort = e.target.value;
    router.push(`/user/${username}?sort=${newSort}`);
  };

  return (
    <select
      name="sort"
      defaultValue={currentSort}
      onChange={handleChange}
      className="text-xs font-medium border border-gray-200 rounded-lg px-2.5 py-1.5 bg-gray-50 text-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-900"
    >
      <option value="updated_desc">🕒 最近更新された順</option>
      <option value="created_desc">📅 作成が新しい順</option>
      <option value="created_asc">⏳ 作成が古い順 (原点)</option>
      <option value="stars_desc">⭐ スターが多い順</option>
      <option value="stars_asc">📉 スターが少ない順</option>
    </select>
  );
}