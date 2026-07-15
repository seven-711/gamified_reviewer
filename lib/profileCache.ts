interface CacheEntry {
  profile: any;
  rank: number;
  totalUsers: number;
  followingCount: number;
  followersCount: number;
  isFollowing?: boolean;
  viewedUserEvents?: any[];
  activeUserEvents?: any[];
  timestamp: number;
  followingList?: any[];
  followersList?: any[];
}

// Global in-memory cache map
const profileCache: Record<string, CacheEntry> = {};

export const getProfileCache = (userId: string) => {
  const entry = profileCache[userId];
  if (!entry) return null;
  // Cache is valid for 30 seconds
  if (Date.now() - entry.timestamp > 30000) {
    return null;
  }
  return entry;
};

export const setProfileCache = (userId: string, data: Omit<CacheEntry, "timestamp">) => {
  profileCache[userId] = {
    ...data,
    timestamp: Date.now()
  };
};

export const clearProfileCache = (userId: string) => {
  delete profileCache[userId];
};
