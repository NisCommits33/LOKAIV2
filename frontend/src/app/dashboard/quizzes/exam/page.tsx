"use client";

import { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QuizPlayer } from "@/components/quiz/QuizPlayer";
import { FullPageSpinner } from "@/components/loading";
import { toast } from "sonner";
import { BackButton } from "@/components/ui/back-button";
import { ClipboardCheck, ShieldAlert } from "lucide-react";

export default function MockTestExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mtId = searchParams.get("mt");
  
  const [test, setTest] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mtId) {
      router.push("/dashboard/mock-tests");
      return;
    }

    async function fetchTest() {
      try {
        // Fetch specific mock test. Reusing the user endpoint filtering.
        const res = await fetch("/api/users/mock-tests");
        if (res.ok) {
          const data = await res.json();
          const found = data.find((t: any) => t.id === mtId);
          if (!found) {
            toast.error("Test not found or expired");
            router.push("/dashboard/mock-tests");
            return;
          }
          
          if (found.quiz_attempts && found.quiz_attempts.length > 0) {
            toast.error("You have already attempted this test.");
            router.push("/dashboard/mock-tests");
            return;
          }

          setTest(found);
        }
      } catch (err) {
        toast.error("Failed to load test");
      } finally {
        setLoading(false);
      }
    }
    fetchTest();
  }, [mtId, router]);

  const handleSubmit = async (answers: Record<string, number>, timeSpent: number) => {
    try {
      const res = await fetch(`/api/users/mock-tests/${mtId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, time_spent: timeSpent }),
      });

      if (res.ok) {
        const data = await res.json();
        toast.success("Exam submitted successfully!");
        // Use the existing GK result page or a custom one? 
        // For now, redirect to the mock tests listing to see result
        router.push("/dashboard/mock-tests");
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to submit exam");
      }
    } catch (err) {
      toast.error("Connection error. Your answers might not have been saved.");
    }
  };

  if (loading) return <FullPageSpinner />;
  if (!test) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-orange-100 dark:bg-orange-950/30 rounded-xl flex items-center justify-center text-orange-600">
            <ClipboardCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-slate-100">{test.title}</h1>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Official Organization Assessment</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-100 dark:border-amber-900/30 text-[10px] font-black uppercase tracking-widest">
           <ShieldAlert className="h-3.5 w-3.5" />
           Proctored Environment
        </div>
      </div>

      <div className="py-8">
        <QuizPlayer 
          questions={test.questions}
          timeLimitMinutes={test.time_limit}
          onSubmit={handleSubmit}
          title={test.title}
          description={test.description}
          category={test.quiz_id ? "GK Assessment" : "Document Review"}
          difficulty="Official"
          showStartScreen={true}
        />
      </div>
    </div>
  );
}
