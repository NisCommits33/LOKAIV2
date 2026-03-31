import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { addDays, format, subDays, differenceInDays, startOfDay } from "date-fns";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get("days") || "30");

  const startDate = subDays(new Date(), days);
  const startDateStr = format(startDate, 'yyyy-MM-dd');

  // Fetch performance history from the view `user_readiness_history`
  const { data: history, error } = await supabase
    .from("user_readiness_history")
    .select("attempt_date, daily_avg_score")
    .eq("user_id", user.id)
    .gte("attempt_date", startDateStr)
    .order("attempt_date", { ascending: true });

  if (error || !history || history.length === 0) {
    return NextResponse.json({ 
        history: [], 
        forecast: [],
        insight: "Start taking quizzes to see your performance trend." 
    });
  }

  // Linear Regression Calculation for Predictive Forecast
  // y = mx + c
  const n = history.length;
  if (n < 2) {
    return NextResponse.json({ 
        history, 
        forecast: [],
        insight: "Keep practicing! We need more data point to generate a forecast." 
    });
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;

  const baseDate = startOfDay(new Date(history[0].attempt_date));

  const points = history.map((h) => {
    const x = differenceInDays(new Date(h.attempt_date), baseDate);
    const y = h.daily_avg_score;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    return { x, y, date: h.attempt_date };
  });

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Generate Forecast for next 14 days
  const forecast = [];
  const lastX = points[n - 1].x;
  const lastDate = new Date(points[n - 1].date);

  for (let i = 1; i <= 14; i++) {
    const nextX = lastX + i;
    const predictedY = Math.min(100, Math.max(0, slope * nextX + intercept));
    const nextDate = addDays(lastDate, i);
    forecast.push({
      date: format(nextDate, 'yyyy-MM-dd'),
      predicted_score: Math.round(predictedY * 10) / 10,
      is_forecast: true
    });
  }

  // Calculate improvement trend
  const firstScore = points[0].y;
  const lastScore = points[n-1].y;
  const improvement = lastScore - firstScore;

  return NextResponse.json({
    history: points.map(p => ({ date: p.date, score: Math.round(p.y * 10) / 10 })),
    forecast,
    stats: {
        total_days: days,
        points_count: n,
        slope: Math.round(slope * 100) / 100,
        net_improvement: Math.round(improvement * 10) / 10,
        trend: slope > 0 ? "improving" : slope < 0 ? "declining" : "stable"
    },
    message: slope > 0 
        ? `You're on a great trajectory! Improving by ~${Math.round(slope * 7)}% per week.`
        : slope < 0 
        ? "Warning: Your recent scores have dipped. Let's review your weak areas."
        : "Steady as she goes! Your performance is consistent."
  });
}
