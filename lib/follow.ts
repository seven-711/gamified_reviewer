import { supabase } from "@/lib/supabase";

const GUEST_FOLLOW_KEY_PREFIX = "reviewer_following_";

/**
 * Retrieve local guest following list from localStorage
 */
export function getGuestFollowing(guestId: string): string[] {
  if (typeof window === "undefined" || !guestId) return [];
  try {
    const raw = localStorage.getItem(`${GUEST_FOLLOW_KEY_PREFIX}${guestId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Save guest following state to localStorage
 */
export function setGuestFollowing(guestId: string, targetId: string, isFollowing: boolean) {
  if (typeof window === "undefined" || !guestId) return;
  try {
    const list = getGuestFollowing(guestId);
    let nextList: string[];
    if (isFollowing) {
      nextList = Array.from(new Set([...list, targetId]));
    } else {
      nextList = list.filter((id) => id !== targetId);
    }
    localStorage.setItem(`${GUEST_FOLLOW_KEY_PREFIX}${guestId}`, JSON.stringify(nextList));
  } catch (e) {
    console.warn("Failed to update guest following in localStorage:", e);
  }
}

/**
 * Check if followerId is following targetId
 */
export async function checkIsFollowing(
  followerId: string | null | undefined,
  targetId: string
): Promise<boolean> {
  if (!followerId || !targetId) return false;

  // Check guest storage
  if (followerId.startsWith("guest_") || typeof window !== "undefined" && followerId === localStorage.getItem("guest_session_id")) {
    const guestList = getGuestFollowing(followerId);
    if (guestList.includes(targetId)) return true;
  }

  try {
    const followTag = `follow:${targetId}`;
    const legacyTag = `claimed_achievement_follow:${targetId}`;

    // 1. Check cadet_activity_logs
    const { data: actData } = await supabase
      .from("cadet_activity_logs")
      .select("id")
      .eq("profile_id", followerId)
      .eq("event_type", followTag)
      .limit(1);

    if (actData && actData.length > 0) return true;

    // 2. Check lesson_events (backward compatibility)
    const { data: evtData } = await supabase
      .from("lesson_events")
      .select("id")
      .eq("profile_id", followerId)
      .in("event_type", [followTag, legacyTag])
      .limit(1);

    if (evtData && evtData.length > 0) return true;
  } catch (err) {
    console.warn("Error checking follow status:", err);
  }

  return false;
}

/**
 * Fetch total followers count and following count for a user
 */
export async function fetchFollowCounts(
  userId: string
): Promise<{ followingCount: number; followersCount: number }> {
  if (!userId) return { followingCount: 0, followersCount: 0 };

  const followTag = `follow:${userId}`;
  const legacyTag = `claimed_achievement_follow:${userId}`;

  let followersCount = 0;
  let followingCount = 0;

  try {
    // 1. Count followers (distinct profiles following this userId)
    const [actFollowersRes, evtFollowersRes] = await Promise.all([
      supabase
        .from("cadet_activity_logs")
        .select("profile_id")
        .eq("event_type", followTag),
      supabase
        .from("lesson_events")
        .select("profile_id")
        .in("event_type", [followTag, legacyTag]),
    ]);

    const followerIds = new Set<string>();
    (actFollowersRes.data || []).forEach((row: any) => row.profile_id && followerIds.add(row.profile_id));
    (evtFollowersRes.data || []).forEach((row: any) => row.profile_id && followerIds.add(row.profile_id));
    followersCount = followerIds.size;

    // 2. Count following (cadets this userId is following)
    const [actFollowingRes, evtFollowingRes] = await Promise.all([
      supabase
        .from("cadet_activity_logs")
        .select("event_type")
        .eq("profile_id", userId)
        .like("event_type", "follow:%"),
      supabase
        .from("lesson_events")
        .select("event_type")
        .eq("profile_id", userId)
        .or(`event_type.like.follow:%,event_type.like.claimed_achievement_follow:%`),
    ]);

    const followedIds = new Set<string>();
    (actFollowingRes.data || []).forEach((row: any) => {
      if (row.event_type && row.event_type.startsWith("follow:")) {
        followedIds.add(row.event_type.replace("follow:", ""));
      }
    });
    (evtFollowingRes.data || []).forEach((row: any) => {
      if (row.event_type) {
        if (row.event_type.startsWith("follow:")) {
          followedIds.add(row.event_type.replace("follow:", ""));
        } else if (row.event_type.startsWith("claimed_achievement_follow:")) {
          followedIds.add(row.event_type.replace("claimed_achievement_follow:", ""));
        }
      }
    });

    // Merge guest following if guest
    const guestFollowing = getGuestFollowing(userId);
    guestFollowing.forEach((id) => followedIds.add(id));

    followingCount = followedIds.size;
  } catch (err) {
    console.warn("Failed to fetch follow counts:", err);
  }

  return { followingCount, followersCount };
}

/**
 * Fetch list of follower IDs for a user
 */
export async function fetchFollowerIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  const followTag = `follow:${userId}`;
  const legacyTag = `claimed_achievement_follow:${userId}`;
  const followerIds = new Set<string>();

  try {
    const [actRes, evtRes] = await Promise.all([
      supabase
        .from("cadet_activity_logs")
        .select("profile_id")
        .eq("event_type", followTag),
      supabase
        .from("lesson_events")
        .select("profile_id")
        .in("event_type", [followTag, legacyTag]),
    ]);

    (actRes.data || []).forEach((row: any) => row.profile_id && followerIds.add(row.profile_id));
    (evtRes.data || []).forEach((row: any) => row.profile_id && followerIds.add(row.profile_id));
  } catch (err) {
    console.warn("Failed to fetch follower IDs:", err);
  }

  return Array.from(followerIds);
}

/**
 * Fetch list of IDs of users followed by userId
 */
export async function fetchFollowingIds(userId: string): Promise<string[]> {
  if (!userId) return [];

  const followedIds = new Set<string>();

  try {
    const [actRes, evtRes] = await Promise.all([
      supabase
        .from("cadet_activity_logs")
        .select("event_type")
        .eq("profile_id", userId)
        .like("event_type", "follow:%"),
      supabase
        .from("lesson_events")
        .select("event_type")
        .eq("profile_id", userId)
        .or(`event_type.like.follow:%,event_type.like.claimed_achievement_follow:%`),
    ]);

    (actRes.data || []).forEach((row: any) => {
      if (row.event_type && row.event_type.startsWith("follow:")) {
        followedIds.add(row.event_type.replace("follow:", ""));
      }
    });
    (evtRes.data || []).forEach((row: any) => {
      if (row.event_type) {
        if (row.event_type.startsWith("follow:")) {
          followedIds.add(row.event_type.replace("follow:", ""));
        } else if (row.event_type.startsWith("claimed_achievement_follow:")) {
          followedIds.add(row.event_type.replace("claimed_achievement_follow:", ""));
        }
      }
    });

    const guestFollowing = getGuestFollowing(userId);
    guestFollowing.forEach((id) => followedIds.add(id));
  } catch (err) {
    console.warn("Failed to fetch following IDs:", err);
  }

  return Array.from(followedIds);
}

/**
 * Toggle follow/unfollow a cadet via the API route
 */
export async function toggleFollowCadet(
  followerId: string,
  targetId: string,
  shouldFollow: boolean
): Promise<{ success: boolean; isFollowing: boolean }> {
  if (!followerId || !targetId || followerId === targetId) {
    return { success: false, isFollowing: !shouldFollow };
  }

  // Handle guest sessions
  const isGuest =
    followerId.startsWith("guest_") ||
    (typeof window !== "undefined" && followerId === localStorage.getItem("guest_session_id"));

  if (isGuest) {
    setGuestFollowing(followerId, targetId, shouldFollow);
  }

  try {
    const res = await fetch("/api/profile/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        followerId,
        targetId,
        action: shouldFollow ? "follow" : "unfollow",
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      console.warn("Follow API returned error:", data.error || res.statusText);
      // If server returned an error but user is guest, local state was updated so treat as successful
      if (isGuest) {
        return { success: true, isFollowing: shouldFollow };
      }
      return { success: false, isFollowing: !shouldFollow };
    }

    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("reviewer-db-update"));
      window.dispatchEvent(
        new CustomEvent("reviewer-follow-update", {
          detail: { followerId, targetId, isFollowing: shouldFollow },
        })
      );
    }

    return { success: true, isFollowing: shouldFollow };
  } catch (err) {
    console.error("Network or execution error toggling follow:", err);
    if (isGuest) {
      return { success: true, isFollowing: shouldFollow };
    }
    return { success: false, isFollowing: !shouldFollow };
  }
}
