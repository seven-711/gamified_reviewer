/**
 * Helper to determine if a user has administrator access.
 * Checks environment variable approved emails, Clerk public metadata roles,
 * and allows auto-access in local development.
 */
export function checkIsAdmin(user: any): boolean {
  // 1. Local Development bypass
  if (process.env.NODE_ENV === "development") {
    return true;
  }

  if (!user) return false;

  // 2. Check environment variable NEXT_PUBLIC_ADMIN_EMAILS (comma-separated string)
  const envAdminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  if (envAdminEmails) {
    const adminEmails = envAdminEmails.split(",").map((email) => email.trim().toLowerCase());
    const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();
    if (userEmail && adminEmails.includes(userEmail)) {
      return true;
    }
  }

  // 3. Check Clerk Public Metadata role configuration
  const role = user.publicMetadata?.role;
  const isAdminMeta = user.publicMetadata?.isAdmin;
  if (role === "admin" || isAdminMeta === true) {
    return true;
  }

  return false;
}
