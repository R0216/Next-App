import { NextResponse } from "next/server";

export async function GET() {
  const clientID = process.env.GITHUB_CLIENT_ID;
  const redirectURI = "http://localhost:3000/api/auth/callback";
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientID}&redirect_uri=${encodeURIComponent(redirectURI)}&scope=read:user`;
  
  return NextResponse.redirect(githubAuthUrl);
}