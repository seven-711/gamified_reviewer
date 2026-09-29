/**
 * Helper to determine if a user has administrator access.
 * Checks environment variable approved emails or user metadata role.
 */
export function getAdminEmails(): string[] {
  const envAdminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  const list = (envAdminEmails || "claridadjulyfranz@gmail.com")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Always ensure default project owner email is recognized
  if (!list.includes("claridadjulyfranz@gmail.com")) {
    list.push("claridadjulyfranz@gmail.com");
  }

  return list;
}

export function checkIsAdmin(user: any): boolean {
  if (!user) return false;

  const userEmail = (user.email || user.primaryEmailAddress?.emailAddress || "").toLowerCase();

  // 1. Check approved admin emails list
  if (userEmail) {
    const adminEmails = getAdminEmails();
    if (adminEmails.includes(userEmail)) {
      return true;
    }
  }

  // 2. Check User Metadata / App Metadata role configuration
  const role = user.user_metadata?.role || user.app_metadata?.role || user.publicMetadata?.role;
  const isAdminMeta =
    user.user_metadata?.isAdmin ||
    user.user_metadata?.is_admin ||
    user.publicMetadata?.isAdmin;

  if (role === "admin" || isAdminMeta === true) {
    return true;
  }

  return false;
}
