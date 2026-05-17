import OpenAI from "openai";
import { createSupabaseServerClient } from "../../../lib/supabaseServer";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function allowed(plan, mode) {
  if (mode === "Free") return true;
  if (mode === "Fast") return ["fast", "premium", "ultra"].includes(plan);
  if (mode === "Pro") return ["pro", "premium", "ultra"].includes(plan);
  if (mode === "Work") return ["pro", "premium", "ultra"].includes(plan);
  if (mode === "Ultra") return plan === "ultra";
  return false;
}

function prompt(mode) {
  if (mode === "Fast") {
    return "You are AskWise Fast Mode. Answer quickly and clearly.";
  }

  if (mode === "Pro") {
    return "You are AskWise Pro Mode. Give smarter, better and more useful answers.";
  }

  if (mode === "Work") {
    return "You are AskWise Work Mode. Help professionally with work, school, emails, documents, planning and business.";
  }

  if (mode === "Ultra") {
    return "You are AskWise Ultra Mode. Give the best possible premium quality answers.";
  }

  return "You are AskWise Free Mode. Give clear helpful answers.";
}

export async function POST(request) {
  const supabase = createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  const body = await request.json();

  const mode = body.mode || "Free";
  const messages = body.messages || [];

  let plan = "free";

  if (userData.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userData.user.id)
      .single();

    plan = profile?.plan || "free";
  }

  if (!allowed(plan, mode)) {
    return Response.json({
      reply: "Upgrade required. Please choose a paid plan to use this mode."
    });
  }

  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: prompt(mode)
      },
      ...messages
    ]
  });

  return Response.json({
    reply: completion.choices[0].message.content
  });
}
