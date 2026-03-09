import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
      easy: "suitable for 4th-5th grade students (ages 9-11). Include basic arithmetic, simple fractions, basic geometry shapes, and simple word problems",
      medium: "suitable for 6th-7th grade students (ages 11-13). Include multi-step arithmetic, fractions/decimals, basic algebra, and geometry with formulas",
      hard: "suitable for 8th-9th grade students (ages 13-15). Include algebra, equations, advanced geometry, and complex word problems",
    }[difficulty] || "suitable for 4th-5th grade students";

    const subjectDesc = subject === "math"
      ? `mathematics for school students. Use LaTeX notation for math symbols (e.g., \\frac{1}{2}, \\sqrt{4}, x^2). Topics should include arithmetic operations, fractions, geometry basics, simple word problems, and number patterns.`
      : `English language (vocabulary, grammar, sentence completion, reading comprehension)`;

    const prompt = `Generate exactly ${count} unique multiple choice questions about ${subjectDesc}. Difficulty: ${difficultyDesc}.

CRITICAL RULES:
1. Every question MUST be unique - no duplicate or similar questions
2. The correct answer position MUST be randomized - do NOT always put it as the first option
3. All 4 options must be plausible but only one correct
4. Vary the question types and topics within the subject

Return ONLY a valid JSON array where each element has:
- "question_text": the question string
- "options": array of exactly 4 answer strings (correct answer should be in a RANDOM position, not always first)
- "correct_answer": the correct answer (must exactly match one of the options)

Example format:
[{"question_text":"What is 2+2?","options":["3","5","4","6"],"correct_answer":"4"}]

Return ONLY the JSON array, no other text.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a test question generator for school students. Return only valid JSON arrays. Every question must be unique. Randomize the position of the correct answer among the options." },
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const errText = await aiResponse.text();
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
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
    console.error("generate-questions error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
