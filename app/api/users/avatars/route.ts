import { NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ users: {} });
    }

    // Filter out guest IDs
    const realUserIds = userIds.filter((id) => id && !id.startsWith("guest_"));

    if (realUserIds.length === 0) {
      return NextResponse.json({ users: {} });
    }

    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    const userListResponse = await clerkClient.users.getUserList({
      userId: realUserIds,
      limit: 100,
    });

    // Handle Clerk API pagination differences across versions
    const usersArray = Array.isArray(userListResponse)
      ? userListResponse
      : (userListResponse.data || []);

    const usersMap: Record<string, { name: string | null; imageUrl: string }> = {};

    usersArray.forEach((u: any) => {
      const name = u.fullName || u.username || (u.firstName ? `${u.firstName} ${u.lastName || ""}`.trim() : null);
      usersMap[u.id] = {
        name,
        imageUrl: u.imageUrl,
      };
    });

    return NextResponse.json({ users: usersMap });
  } catch (error: any) {
    console.error('Error fetching Clerk user avatars:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
