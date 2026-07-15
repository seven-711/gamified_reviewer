"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { supabase } from "@/lib/supabase";
import { fetchFullProfile } from "@/lib/session";

interface ProfileItem {
  id: string;
  name: string | null;
  isFollowingViewer?: boolean;
  isFollowedByViewer?: boolean;
}

function FollowersContent({ userId }: { userId: string }) {
  const router = useRouter();
  const { user: currentUser, isLoaded: isCurrentUserLoaded } = useUser();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [followersList, setFollowersList] = useState<ProfileItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFollowers() {
      try {
        // 1. Fetch target user's details
        const fetchedProfile = await fetchFullProfile(userId);
        setTargetUser(fetchedProfile);

        // 2. Fetch the list of user IDs following the target user
        const { data: followEvents, error: followError } = await supabase
          .from("lesson_events")
          .select("profile_id")
          .eq("event_type", `claimed_achievement_follow:${userId}`);

        if (followError) throw followError;

        const followerIds = followEvents 
          ? followEvents.map((e: any) => e.profile_id) 
          : [];

        if (followerIds.length > 0) {
          // 3. Get profile details for followers
          const { data: profiles, error: profilesError } = await supabase
            .from("profiles")
            .select("id, name")
            .in("id", followerIds);

          if (profilesError) throw profilesError;

          // 4. Check which of these the current viewer is following
          const currentUserId = currentUser ? currentUser.id : (typeof window !== "undefined" ? localStorage.getItem("guest_session_id") : null);
          let viewerFollowsIds: string[] = [];

          if (currentUserId) {
            const { data: viewerEvents } = await supabase
              .from("lesson_events")
              .select("event_type")
              .eq("profile_id", currentUserId)
              .like("event_type", "claimed_achievement_follow:%");

            viewerFollowsIds = viewerEvents 
              ? viewerEvents.map((e: any) => e.event_type.replace("claimed_achievement_follow:", "")) 
              : [];
          }

          const mapped: ProfileItem[] = (profiles || []).map((p) => ({
            id: p.id,
            name: p.name,
            isFollowedByViewer: viewerFollowsIds.includes(p.id)
          }));

          setFollowersList(mapped);
        }
      } catch (err) {
        console.error("Failed to load followers list:", err);
      } finally {
        setLoading(false);
      }
    }

    if (isCurrentUserLoaded) {
      loadFollowers();
    }
  }, [userId, currentUser, isCurrentUserLoaded]);

  const handleFollowAction = async (targetProfileId: string, isCurrentlyFollowed: boolean) => {
    const currentUserId = currentUser ? currentUser.id : localStorage.getItem("guest_session_id");
    if (!currentUserId) {
      router.push("/signup");
      return;
    }

    // Prevent following self
    if (currentUserId === targetProfileId) return;

    // Optimistically update list UI
    setFollowersList((prev) =>
      prev.map((item) =>
        item.id === targetProfileId ? { ...item, isFollowedByViewer: !isCurrentlyFollowed } : item
      )
    );

    try {
      if (isCurrentlyFollowed) {
        // Unfollow
        const { error } = await supabase
          .from("lesson_events")
          .delete()
          .eq("profile_id", currentUserId)
          .eq("event_type", `claimed_achievement_follow:${targetProfileId}`);
        
        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from("lesson_events")
          .insert({
            profile_id: currentUserId,
            event_type: `claimed_achievement_follow:${targetProfileId}`
          });
        
        if (error) throw error;
      }
    } catch (err) {
      console.error("Failed to follow/unfollow user in list:", err);
      // Rollback on failure
      setFollowersList((prev) =>
        prev.map((item) =>
          item.id === targetProfileId ? { ...item, isFollowedByViewer: isCurrentlyFollowed } : item
        )
      );
    }
  };

  const currentUserId = currentUser ? currentUser.id : (typeof window !== "undefined" ? localStorage.getItem("guest_session_id") : null);
  const isOwnList = currentUserId === userId;

  return (
    <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 pt-2 px-4 font-din-round min-w-0">
      
      {/* Header Row */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => router.push(isOwnList ? "/profile" : `/profile/${userId}`)}
          className="p-2.5 rounded-xl border-0 border-cloud-gray hover:bg-white/5 text-white transition-all cursor-pointer select-none"
          title="Back to Profile"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex flex-col min-w-0">
          <h1 className="font-feather text-xl md:text-2xl text-white font-bold tracking-wide select-none leading-tight">
            Followers
          </h1>
          {targetUser ? (
            <span className="text-silver text-xs font-semibold select-none leading-none mt-1">
              {targetUser?.name || "Learner"}'s follower list
            </span>
          ) : (
            <div className="h-3 w-28 bg-cloud-gray/15 rounded-md animate-pulse mt-1.5" />
          )}
        </div>
      </div>

      {/* List container */}
      <div className="w-full">
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-2xl border-2 border-cloud-gray bg-[#131f24] gap-4 animate-pulse select-none"
              >
                <div className="flex items-center gap-4.5 min-w-0 flex-1">
                  <div className="w-12 h-12 rounded-full bg-cloud-gray/15 shrink-0" />
                  <div className="min-w-0 flex flex-col gap-2 flex-1">
                    <div className="h-4 bg-cloud-gray/15 rounded-md w-[40%] max-w-[150px]" />
                    <div className="h-3 bg-cloud-gray/15 rounded-md w-[25%] max-w-[80px]" />
                  </div>
                </div>
                <div className="w-20 h-8.5 bg-cloud-gray/15 rounded-xl shrink-0" />
              </div>
            ))}
          </div>
        ) : followersList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border-2 border-dashed border-cloud-gray/25 rounded-3xl p-6 bg-gradient-to-br from-cloud-gray/5 to-transparent">
            <span className="text-5xl select-none">👥</span>
            <div className="flex flex-col gap-1">
              <p className="text-white font-bold text-lg">No followers yet</p>
              <p className="text-silver text-sm max-w-[320px]">
                {isOwnList 
                  ? "Share your profile details or climb the leaderboard to get followers!"
                  : "This user has no followers yet."}
              </p>
            </div>
            {isOwnList && (
              <button
                onClick={() => router.push("/leaderboard")}
                className="mt-2 bg-duo-green hover:brightness-105 text-white font-bold px-6 py-3 rounded-2xl transition-all uppercase tracking-widest text-xs cursor-pointer shadow-[0_4px_0_#3f8f01] active:translate-y-0.5"
              >
                Find Friends
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {followersList.map((item) => {
              const showActionBtn = currentUserId && currentUserId !== item.id;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-2xl border-2 border-cloud-gray bg-[#131f24] hover:bg-[#1a282f] transition-all gap-4"
                >
                  <div
                    onClick={() => router.push(`/profile/${item.id}`)}
                    className="flex items-center gap-4.5 min-w-0 cursor-pointer flex-1 group"
                  >
                    <div className="w-15 h-15 rounded-full overflow-hidden border border-cloud-gray/20 bg-[#1f2e35] shrink-0 flex items-center justify-center select-none group-hover:scale-105 transition-transform">
                      <img src="/emoji/profile.webp" alt="Avatar" className="w-15 h-15 object-contain" />
                    </div>
                    <div className="min-w-0 flex flex-col gap-0.5">
                      <span className="font-bold text-white text-base group-hover:text-sky-blue transition-colors truncate leading-tight">
                        {item.name || "Learner"}
                      </span>
                      <span className="text-silver text-xs font-semibold truncate leading-none">
                        @{item.name?.toLowerCase().replace(/\s+/g, "") || "learner"}
                      </span>
                    </div>
                  </div>

                  {showActionBtn && (
                    <button
                      onClick={() => handleFollowAction(item.id, !!item.isFollowedByViewer)}
                      className={`font-extrabold py-2.5 px-4.5 rounded-xl transition-all uppercase tracking-wider text-[10px] sm:text-xs shrink-0 cursor-pointer border active:translate-y-0.5 ${
                        item.isFollowedByViewer
                          ? "bg-transparent border-cloud-gray text-silver hover:text-white hover:border-white"
                          : "bg-sky-blue border-sky-blue text-white hover:brightness-105"
                      }`}
                    >
                      {item.isFollowedByViewer ? "Following" : "Follow"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </main>
  );
}

const FollowersSkeletonPage = () => (
  <main className="flex-1 w-full max-w-[600px] mx-auto pb-24 pt-2 px-4 font-din-round min-w-0">
    <div className="flex items-center gap-4 mb-8">
      <div className="p-2.5 rounded-xl bg-cloud-gray/15 w-10 h-10 animate-pulse" />
      <div className="flex flex-col min-w-0 flex-1">
        <h1 className="font-feather text-xl md:text-2xl text-white font-bold tracking-wide select-none leading-tight">
          Followers
        </h1>
        <div className="h-3 w-28 bg-cloud-gray/15 rounded-md animate-pulse mt-1.5" />
      </div>
    </div>
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-2xl border-2 border-cloud-gray bg-[#131f24] gap-4 animate-pulse select-none"
          >
            <div className="flex items-center gap-4.5 min-w-0 flex-1">
              <div className="w-12 h-12 rounded-full bg-cloud-gray/15 shrink-0" />
              <div className="min-w-0 flex flex-col gap-2 flex-1">
                <div className="h-4 bg-cloud-gray/15 rounded-md w-[40%] max-w-[150px]" />
                <div className="h-3 bg-cloud-gray/15 rounded-md w-[25%] max-w-[80px]" />
              </div>
            </div>
            <div className="w-20 h-8.5 bg-cloud-gray/15 rounded-xl shrink-0" />
          </div>
        ))}
      </div>
    </div>
  </main>
);

export default function FollowersPage({ params }: { params: any }) {
  const [resolvedUserId, setResolvedUserId] = useState<string | null>(null);

  useEffect(() => {
    async function unwrap() {
      const resolved = await params;
      if (resolved && resolved.userId) {
        setResolvedUserId(resolved.userId);
      }
    }
    unwrap();
  }, [params]);

  if (!resolvedUserId) {
    return <FollowersSkeletonPage />;
  }

  return (
    <Suspense fallback={<FollowersSkeletonPage />}>
      <FollowersContent userId={resolvedUserId} />
    </Suspense>
  );
}
