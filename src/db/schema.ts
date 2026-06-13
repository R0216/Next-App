import { pgTable, serial, text, integer, unique } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  githubId: text("github_id").unique().notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
});

export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: integer("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  username: text("username").notNull(),
}, (table) => [
  unique("group_members_group_id_username_unique").on(table.groupId, table.username),
]);

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id")
    .notNull()
    .references(() => groups.id, { onDelete: "cascade" }),
  repoOwner: text("repo_owner").notNull(),
  repoName: text("repo_name").notNull(),
}, (table) => [
  unique("repositories_group_id_repo_owner_repo_name_unique").on(table.groupId, table.repoOwner, table.repoName),
]);