import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ users: {} });
    }

    // Filter out guest IDs if needed
    const realUserIds = userIds.filter((id) => id && !id.startsWith("guest_"));

    if (realUserIds.length === 0) {
      return NextResponse.json({ users: {} });
    }

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', realUserIds);

    if (error) {
      console.error('Error fetching user profiles for avatars:', error);
      return NextResponse.json({ users: {} });
    }

    const usersMap: Record<string, { name: string | null; imageUrl: string }> = {};

    (profiles || []).forEach((p: any) => {
      const nameParts = (p.name || '').split('|');
      const displayName = nameParts[0] || null;
      const avatarUrl = nameParts[1] || '/emoji/profile.webp';

      usersMap[p.id] = {
        name: displayName,
        imageUrl: avatarUrl,
      };
    });

    return NextResponse.json({ users: usersMap });
  } catch (error: any) {
    console.error('Error fetching user avatars:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
