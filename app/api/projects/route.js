import { createSupabaseServerClient } from "../../../lib/supabaseServer";

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return Response.json({
      projects: []
    });
  }

  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", userData.user.id)
    .order("created_at", {
      ascending: false
    });

  return Response.json({
    projects: data || []
  });
}

export async function POST(request) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return Response.json(
      {
        error: "Please login first."
      },
      {
        status: 401
      }
    );
  }

  const body = await request.json();

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userData.user.id,
      name: body.name
    })
    .select()
    .single();

  if (error) {
    return Response.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );
  }

  return Response.json({
    project: data
  });
}
