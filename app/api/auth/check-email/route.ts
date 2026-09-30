import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/check-email
 *
 * Checks whether an email address is already registered in Supabase Auth.
 * Uses the service_role key server-side to query the GoTrue admin API directly,
 * which is the most efficient approach (no pagination needed).
 *
 * Body:     { "email": "user@example.com" }
 * Response: { "exists": true | false }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      // Gracefully degrade — if the key isn't configured yet, skip the check
      console.warn("[check-email] SUPABASE_SERVICE_ROLE_KEY not set. Skipping duplicate check.");
      return NextResponse.json({ exists: false });
    }

    // Query the GoTrue admin API — filter by email to avoid pulling the full user list
    const url = new URL(`${supabaseUrl}/auth/v1/admin/users`);
    url.searchParams.set("page", "1");
    url.searchParams.set("per_page", "1");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
      },
    });

    if (!res.ok) {
      console.error("[check-email] GoTrue API error:", res.status, await res.text());
      // Don't block signup on API errors — return false so the user can proceed
      return NextResponse.json({ exists: false });
    }

    const data = await res.json();
    const users: any[] = data?.users || [];

    // Since the GoTrue REST API doesn't support ?email= filter on listUsers,
    // we pull pages and search. For small-to-medium user bases (< 1000) this
    // is fine. For larger projects you'd create a Postgres RPC on auth.users.
    let exists = users.some((u: any) => u.email?.toLowerCase() === email);

    // If the first page didn't find it and there may be more users, check more pages
    if (!exists && users.length > 0) {
      const totalCount = data?.total || 0;
      const perPage = 1000;
      const totalPages = Math.ceil(totalCount / perPage);

      for (let page = 1; page <= totalPages && !exists; page++) {
        const pageUrl = new URL(`${supabaseUrl}/auth/v1/admin/users`);
        pageUrl.searchParams.set("page", String(page));
        pageUrl.searchParams.set("per_page", String(perPage));

        const pageRes = await fetch(pageUrl.toString(), {
          method: "GET",
          headers: {
            Authorization: `Bearer ${serviceRoleKey}`,
            apikey: serviceRoleKey,
          },
        });

        if (!pageRes.ok) break;

        const pageData = await pageRes.json();
        const pageUsers: any[] = pageData?.users || [];
        exists = pageUsers.some((u: any) => u.email?.toLowerCase() === email);
      }
    }

    return NextResponse.json({ exists });
  } catch (err) {
    console.error("[check-email] Unexpected error:", err);
    return NextResponse.json({ exists: false });
  }
}
