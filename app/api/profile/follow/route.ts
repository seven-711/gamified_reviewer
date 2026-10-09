import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "placeholder";

// Server admin client (bypasses RLS) or falls back to anon
const supabaseServer = createClient(supabaseUrl, serviceRoleKey || anonKey);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { followerId, targetId, action } = body;

    if (!followerId || !targetId || typeof followerId !== "string" || typeof targetId !== "string") {
      return NextResponse.json({ error: "Missing followerId or targetId" }, { status: 400 });
    }

    if (followerId === targetId) {
      return NextResponse.json({ error: "Cannot follow yourself" }, { status: 400 });
    }

    const followEventType = `follow:${targetId}`;
    const legacyEventType = `claimed_achievement_follow:${targetId}`;

    if (action === "unfollow") {
      // 1. Delete from cadet_activity_logs
      await supabaseServer
        .from("cadet_activity_logs")
        .delete()
        .eq("profile_id", followerId)
        .eq("event_type", followEventType);

      // 2. Also delete from lesson_events (clean up both current and legacy tags)
      try {
        await supabaseServer
          .from("lesson_events")
          .delete()
          .eq("profile_id", followerId)
          .in("event_type", [followEventType, legacyEventType]);
      } catch (e) {
        console.warn("Could not delete from lesson_events during unfollow:", e);
      }

      return NextResponse.json({ success: true, isFollowing: false });
    } else {
      // Action: follow
      // Remove any existing record first to avoid duplicates
      await supabaseServer
        .from("cadet_activity_logs")
        .delete()
        .eq("profile_id", followerId)
        .eq("event_type", followEventType);

      // 1. Insert into cadet_activity_logs (safe table, under 50 chars, no failing cascading triggers)
      const { error: logErr } = await supabaseServer
        .from("cadet_activity_logs")
        .insert({
          profile_id: followerId,
          event_type: followEventType,
          activity_description: "Followed cadet",
          xp_gained: 0,
        });

      if (logErr) {
        console.error("Error inserting follow into cadet_activity_logs:", logErr);
        return NextResponse.json({ error: logErr.message }, { status: 500 });
      }

      // 2. Safely attempt to write to lesson_events if database trigger allows
      try {
        await supabaseServer
          .from("lesson_events")
          .insert({
            profile_id: followerId,
            event_type: followEventType,
            score_delta: 0,
            level_delta: 0,
          });
      } catch (evtErr) {
        // Known cascading trigger or length error on lesson_events; safe to swallow because
        // cadet_activity_logs is already persisted as the authoritative ledger.
        console.warn("Notice: lesson_events insert skipped:", evtErr);
      }

      return NextResponse.json({ success: true, isFollowing: true });
    }
  } catch (error: any) {
    console.error("Error in POST /api/profile/follow:", error);
    return NextResponse.json(
      { error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
