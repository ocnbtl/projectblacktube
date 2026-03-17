import { createSupabaseServerClient } from "@/lib/supabase-server";

async function requireAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;

  if (!token) {
    return null;
  }

  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { supabase, user };
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [blocklistsResult, itemsResult] = await Promise.all([
    auth.supabase
      .from("blocklists")
      .select("id, name, enabled, sort_order")
      .eq("user_id", auth.user.id)
      .order("sort_order", { ascending: true }),
    auth.supabase
      .from("blocklist_items")
      .select("id, blocklist_id, type, display_value, normalized_value, source, external_reference")
      .order("created_at", { ascending: false })
  ]);

  if (blocklistsResult.error || itemsResult.error) {
    return Response.json(
      {
        error: blocklistsResult.error?.message ?? itemsResult.error?.message ?? "Failed to load rules."
      },
      { status: 500 }
    );
  }

  return Response.json({
    blocklists: blocklistsResult.data,
    items: itemsResult.data,
    mode: "autoskip",
    source: "supabase"
  });
}
