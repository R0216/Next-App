# GitHub Analyzer 🚀

マルチモード・エンジニアダッシュボード。GitHub APIと連携し、個人やチームのリポジトリ・プロジェクト分析をリアルタイムで行うWebアプリケーションです。

## 🛠️ 主な機能

- **ダッシュボードビュー**: チームごとの「メンバー分析」「プロジェクト分析」の瞬時切り替え
- **GitHub OAuth 認証**: 安全なセッション管理とアクセストークンのセキュアな保持
- **グループ管理機能**: メンバーの未分類・チーム分類をシームレスに操作
- **クラウドデータ永続化**: Supabase (PostgreSQL) を利用した堅牢なデータ管理

## 🏗️ テックスタック

- **Framework**: Next.js 16.x (Turbopack)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Drizzle ORM (`drizzle-orm`, `postgres`)
- **Authentication**: GitHub OAuth
- **Styling**: Tailwind CSS

---

## 🚀 開発環境の構築

### 1. リポジトリのクローン
```bash
git clone <あなたのリポジトリURL>
cd devgrowth
2. パッケージのインストール
Bash
npm install
3. 環境変数の設定 (.env.local)
プロジェクトのルートディレクトリに .env.local ファイルを作成し、以下の必要な環境変数を設定してください。

コード スニペット
# 💡 データベース接続設定 (Supabase Transaction pooler - IPv4対応)
DATABASE_URL="postgres://postgres.[PROJECT_ID]:[PASSWORD]@aws-0-[REGION][.pooler.supabase.com:6543/postgres](https://.pooler.supabase.com:6543/postgres)"

# 🔑 GitHub API & OAuth 認証設定
GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GITHUB_CLIENT_ID="xxxxxxxxxxxxxxxxxxxx"
GITHUB_CLIENT_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# 🔒 セキュリティ設定
JWT_SECRET="YOUR_SUPER_SECRET_KEY"
Note: DATABASE_URL には、ネットワーク制限やIPv6環境に強いSupabaseの Transaction pooler (ポート: 6543) のURLを使用し、接続時のオプションとして prepare: false を適用しています。

4. データベースのマイグレーション
Drizzle ORM を使用して、Supabase 側にスキーマを適用します。

Bash
# マイグレーションファイルの生成
npx drizzle-kit generate

# データベースへの反映
npx drizzle-kit push
5. ローカルサーバーの起動
Turbopack モードで高速にローカル環境を立ち上げます。

Bash
npm run dev
起動後、ブラウザで http://localhost:3000 を開いて確認してください。