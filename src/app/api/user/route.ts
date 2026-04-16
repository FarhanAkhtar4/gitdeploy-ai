import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/user — Get current user info
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        github_username: true,
        avatar_url: true,
        plan: true,
        created_at: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get GitHub credential info (without exposing the token)
    const credential = await db.gitHubCredential.findFirst({
      where: { user_id: userId },
      select: {
        token_hint: true,
        scopes: true,
        validated_at: true,
      },
    });

    return NextResponse.json({
      user,
      github: credential ? {
        connected: true,
        tokenHint: credential.token_hint,
        scopes: credential.scopes,
        validatedAt: credential.validated_at,
      } : { connected: false },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Failed to get user' }, { status: 500 });
  }
}
