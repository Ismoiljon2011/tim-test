import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    // Verify auth
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) throw new Error("Unauthorized");

    // Check admin role
    const { data: roleCheck } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "super_admin"]);

    if (!roleCheck || roleCheck.length === 0) throw new Error("Admin access required");

    const { subject, count, difficulty } = await req.json();

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) throw new Error("AI API key not configured");

    const difficultyDesc = {
      easy: "simple, suitable for elementary school students",
      medium: "moderate difficulty, suitable for middle school students",
      hard: "challenging, suitable for high school students",
    }[difficulty] || "moderate difficulty";

    const subjectDesc = subject === "math"
      ? `basic mathematics (arithmetic, algebra, geometry basics). Use LaTeX notation for math symbols (e.g., \\frac{1}{2}, \\sqrt{4}, x^2).`
      : `English language (vocabulary, grammar, sentence completion)`;

    const prompt = `Generate exactly ${count} multiple choice questions about ${subjectDesc}. Difficulty: ${difficultyDesc}.

Return ONLY a valid JSON array where each element has:
- "question_text": the question string
- "options": array of exactly 4 answer strings
- "correct_answer": the correct answer (must be one of the options)

Example format:
[{"question_text":"What is 2+2?","options":["3","4","5","6"],"correct_answer":"4"}]

Return ONLY the JSON array, no other text.`;

    const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a test question generator. Return only valid JSON arrays." },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      throw new Error(`AI request failed: ${errText}`);
    }

    const aiData = await aiResponse.json();
    let content = aiData.choices?.[0]?.message?.content || "[]";
    
    // Extract JSON from potential markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }

    const questions = JSON.parse(content);

    return new Response(
      JSON.stringify({ questions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
