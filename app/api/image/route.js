import OpenAI from "openai";
import { createSupabaseServerClient } from "../../../lib/supabaseServer";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request) {
  const supabase = createSupabaseServerClient();

  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return Response.json(
      {
        error: "Please login to generate images."
      },
      {
        status: 401
      }
    );
  }

  const body = await request.json();
  const prompt = body.prompt;

  const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("image_usage")
    .select("*", {
      count: "exact",
      head: true
    })
    .eq("user_id", userData.user.id)
    .gte("created_at", since);

  if (count >= 10) {
    return Response.json(
      {
        error:
          "You have reached your free limit. Please wait 5 minutes before generating more images."
      },
      {
        status: 429
      }
    );
  }

  const result = await client.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1024x1024"
  });

  const imageBase64 = result.data[0].b64_json;
  const imageUrl = `data:image/png;base64,${imageBase64}`;

  await supabase.from("image_usage").insert({
    user_id: userData.user.id
  });

  return Response.json({
    imageUrl
  });
}
