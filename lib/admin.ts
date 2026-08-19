/**
 * Helper to determine if a user has administrator access.
 * Checks environment variable approved emails or user metadata role,
 * and allows auto-access in local development if configured.
 */
export function checkIsAdmin(user: any): boolean {
  if (!user) return false;

  const userEmail = (user.email || user.primaryEmailAddress?.emailAddress || "").toLowerCase();

  // 1. Check environment variable NEXT_PUBLIC_ADMIN_EMAILS (comma-separated string)
  const envAdminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  if (envAdminEmails && userEmail) {
    const adminEmails = envAdminEmails.split(",").map((email) => email.trim().toLowerCase());
    if (adminEmails.includes(userEmail)) {
      return true;
    }
  }

  // 2. Check User Metadata / App Metadata role configuration
  const role = user.user_metadata?.role || user.app_metadata?.role || user.publicMetadata?.role;
  const isAdminMeta = user.user_metadata?.isAdmin || user.publicMetadata?.isAdmin;
  if (role === "admin" || isAdminMeta === true) {
    return true;
  }

  return false;
}
