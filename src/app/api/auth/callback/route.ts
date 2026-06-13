import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "../../../../db/index"; 
import { users } from "../../../../db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${accessToken}`,
      },
    });

    const githubUserInfo = await userResponse.json();

    if (!githubUserInfo || !githubUserInfo.login) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const existingUser = await db.select().from(users).where(eq(users.githubId, githubUserInfo.login));

    if (existingUser.length === 0) {
      await db.insert(users).values({
        githubId: githubUserInfo.login,
        name: githubUserInfo.name || githubUserInfo.login,
        avatarUrl: githubUserInfo.avatar_url,
      });
    }

    const cookieStore = await cookies();

    cookieStore.set("auth_session", githubUserInfo.login, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.set("auth_github_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });

    return NextResponse.redirect(new URL("/", request.url));

  } catch (error) {
    console.error("Authentication error:", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}