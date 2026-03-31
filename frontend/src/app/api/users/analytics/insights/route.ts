import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Fetch user performance by category
  const { data: categories } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", user.id);

  if (!categories || categories.length === 0) {
    return NextResponse.json({ 
        persona: "Eager Newbie", 
        badges: ["Newcomer"],
        insight: "Your learning journey begins! Start with some basics in 'Nepal Constitution' to unlock your first persona." 
    });
  }

  // 2. Analyze data for persona
  const avgAccuracy = categories.reduce((acc, c) => acc + c.accuracy_pct, 0) / categories.length;
  const totalAttempts = categories.reduce((acc, c) => acc + c.total_attempts, 0);
  
  let persona = "Consistent Learner";
  let badges = ["Knowledge Seeker"];
  let advice = "You are making steady progress. Focus on your weak areas to boost your overall readiness.";

  // Intelligence for "Analytical Thinker" (High accuracy but lower attempts)
  if (avgAccuracy > 85 && totalAttempts < 10) {
      persona = "Analytical Thinker";
      badges.push("High Precision");
      advice = "You have excellent accuracy! Now try to increase your volume of questions to build endurance.";
  } 
  // Intelligence for "Knowledge Master" (High accuracy and high attempts)
  else if (avgAccuracy > 85 && totalAttempts >= 10) {
      persona = "Subject Matter Expert";
      badges.push("Mastery", "Focused");
      advice = "Incredible work! You have shown mastery over several subjects. Have you tried the 'Hard' difficulty setting yet?";
  }
  // Intelligence for "Resilient Learner" (Multiple attempts on weak areas)
  else if (avgAccuracy < 60 && totalAttempts > 15) {
      persona = "Resilient Grit";
      badges.push("Determined");
      advice = "You're showing great persistence. Try reviewing the 'Explanations' more closely after each quiz to break through that 60% barrier.";
  }

  // 3. Identification of "Gap Topics"
  const weakTopics = categories.filter(c => c.accuracy_pct < 65).sort((a, b) => a.accuracy_pct - b.accuracy_pct);
  const gapInsight = weakTopics.length > 0 
    ? `Your biggest opportunity for growth is in ${weakTopics[0].category_tag}. Focus your next 3 sessions there.`
    : "You have a very balanced profile. Keep rotating between categories to maintain your knowledge.";

  return NextResponse.json({
    persona,
    badges,
    overview: advice,
    gap: gapInsight,
    stats: {
        avg_accuracy: Math.round(avgAccuracy),
        total_attempts: totalAttempts
    },
    narrative: `As a ${persona}, you tend to ${avgAccuracy > 75 ? "excel in high-stakes questions" : "thrive when you have multiple attempts"}. ${gapInsight}`
  });
}
