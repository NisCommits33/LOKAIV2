"use client";

import { useState, useEffect, use, useRef } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { QuizPlayer, QuizPlayerQuestion } from "@/components/quiz/QuizPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FullPageSpinner } from "@/components/loading";
import { BackButton } from "@/components/ui/back-button";
import {
  FileText,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tags,
  Building2,
  HelpCircle,
  Brain,
  Download
} from "lucide-react";
import { toast } from "sonner";
import type { PersonalDocument } from "@/types/database";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });
}

interface OrgDocumentDetailData extends PersonalDocument {
  download_url: string | null;
  department_id?: { name: string } | string | null;
  policy_tag?: string | null;
  chapter_tag?: string | null;
  section_tag?: string | null;
}

export default function EmployeeOrgDocumentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { dbUser, isLoading: authLoading } = useAuth();

  const [doc, setDoc] = useState<OrgDocumentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showSummary, setShowSummary] = useState(true);
  const [quizMode, setQuizMode] = useState(false);
  const [quizResults, setQuizResults] = useState<any>(null); // Details of the completed quiz

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/org/documents/${id}`);
        if (res.ok) {
          const data = await res.json();
          setDoc(data);
        }
      } catch (err) {}
      setLoading(false);
    })();
  }, [id]);

  const handleQuizSubmit = async (answers: Record<string, number>, timeSpent: number) => {
    try {
      const res = await fetch(`/api/org/documents/${id}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, time_spent: timeSpent }),
      });
      if (res.ok) {
        const resultData = await res.json();
        // The API returns the scored quiz, complete with correct answers and explanations for rendering!
        // We will update local state to pass it back to the QuizPlayer or a custom result view
        setQuizResults(resultData);
        toast.success(`You scored ${resultData.score} out of ${resultData.total_questions}!`);
      } else {
        toast.error("Failed to submit quiz results");
      }
    } catch {
      toast.error("Failed to submit quiz results");
    }
  };

  if (authLoading || loading) return <FullPageSpinner />;

  if (!dbUser || !doc) {
    return (
      <div className="p-6 text-center py-20">
        <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500 font-medium">Document not found or access denied.</p>
        <div className="mt-6"><BackButton /></div>
      </div>
    );
  }

  // Determine if quiz is available (only if questions exist in DTO and we are ready)
  const hasQuiz = doc.processing_status === "completed" && doc.questions && (doc.questions as any[]).length > 0;

  // Render the quiz session view if active!
  if (quizMode) {
      if (quizResults) {
          // Wrap the detailed results back into the questions array so QuizPlayer's "Review" mode works
          // The API returns detailed `questions` containing `correct_answer` and `explanation`
          return (
             <div className="p-4 sm:p-8 max-w-3xl mx-auto py-10">
                <div className="mb-6"><BackButton onClick={() => setQuizMode(false)} /></div>
                <div className="bg-slate-50/30 p-2 rounded-xl border border-slate-100 shadow-sm">
                   {/* We re-initialize the QuizPlayer, but trick it directly into Review Mode by feeding it the detailed questions and immediate pre-computed results! */}
                   {/* Actually, QuizPlayer handles the result screen natively if we pass an onSubmit that sets state. Wait, QuizPlayer calculates the local score based strictly on questions array holding correct_answer. */}
                   {/* Let's just render the QuizPlayer using the newly enriched question set *after* submission! */}
                   <QuizPlayer 
                      questions={quizResults.questions}
                      title={doc.title}
                      showStartScreen={false}
                      onSubmit={() => {}} // No-op since we already submitted
                   />
                </div>
             </div>
          );
      }

      // Quiz Player mode (Playing)
      // The API stripped 'correct_answer' from doc.questions, which is perfect for client-side playing
      const quizQuestions = [...(doc.questions as QuizPlayerQuestion[])].sort(() => 0.5 - Math.random()).slice(0, 10);
      return (
          <div className="p-4 sm:p-8 max-w-3xl mx-auto py-10">
              <div className="mb-6"><BackButton onClick={() => setQuizMode(false)} /></div>
              <div className="bg-slate-50/30 p-2 rounded-xl border border-slate-100 shadow-sm">
                   <QuizPlayer 
                      questions={quizQuestions}
                      title={`Quiz on: ${doc.title}`}
                      description="Test your knowledge of this document. Your progress will be recorded in your dashboard."
                      showStartScreen={true}
                      timeLimitMinutes={quizQuestions.length > 5 ? 10 : 5}
                      onSubmit={handleQuizSubmit}
                   />
              </div>
          </div>
      );
  }

  return (
    <div className="p-4 sm:p-8 max-w-[1200px] mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-200 pb-6">
        <div className="flex items-start gap-4">
          <div className="mt-1"><BackButton /></div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{doc.title}</h1>
            </div>
            {doc.description && (
                <p className="text-sm text-slate-500 max-w-2xl leading-relaxed mt-2">{doc.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-shrink-0 gap-2 items-center">
          {doc.download_url && (
            <a href={doc.download_url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="font-mono text-xs text-slate-600 border-slate-200 hover:bg-slate-50">
                <Download className="h-3.5 w-3.5 mr-2" /> Download PDF
              </Button>
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <FileText className="h-3.5 w-3.5" /> Document Profile
            </h3>
            
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-2">
              <Tags className="h-3.5 w-3.5" /> Categories
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
               {doc.department_id ? (
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[11px] border-transparent font-medium">
                    <Building2 className="w-3 h-3 mr-1" />
                    {typeof doc.department_id === "object" ? (doc.department_id as any).name : `Dept ${doc.department_id.split("-")[0]}`}
                  </Badge>
               ) : (
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[11px] font-medium">
                    <Building2 className="w-3 h-3 mr-1" />
                    Org-Wide
                  </Badge>
               )}
               {doc.policy_tag && (
                  <Badge variant="outline" className="text-slate-500 font-mono text-[10px] items-center">
                    # {doc.policy_tag}
                  </Badge>
               )}
            </div>

            <div className="space-y-3 font-mono text-[11px] text-slate-500 border-t border-slate-100 pt-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100/50">
                <span className="text-slate-400">File</span>
                <span className="truncate max-w-[150px] font-medium text-slate-600" title={doc.file_name}>{doc.file_name}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100/50">
                <span className="text-slate-400">Size</span>
                <span className="font-medium text-slate-600">{formatFileSize(doc.file_size)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-100/50">
                <span className="text-slate-400">Added</span>
                <span className="font-medium text-slate-600">{formatDate(doc.created_at)}</span>
              </div>
            </div>
          </section>

          {hasQuiz && (
            <section className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-200 to-transparent rounded-bl-full opacity-30 z-0" />
                <div className="relative z-10 flex flex-col items-center text-center space-y-4">
                    <div className="bg-white p-3 rounded-full shadow-sm">
                        <Brain className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900">Knowledge Check</h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed px-2">Take a quick AI-generated quiz to test your understanding of this document.</p>
                    </div>
                    <Button 
                        onClick={() => setQuizMode(true)}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-11 rounded-lg shadow-md shadow-indigo-100"
                    >
                        <HelpCircle className="h-4 w-4 mr-2" /> Take Quiz
                    </Button>
                </div>
            </section>
          )}

          {!hasQuiz && doc.processing_status === "completed" && (
             <div className="bg-slate-50/50 rounded-xl p-5 border border-slate-100 text-center">
                <p className="text-xs text-slate-400 font-medium">No quiz active for this document.</p>
             </div>
          )}

        </div>

        <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 sm:p-8 bg-white min-h-[500px] flex flex-col gap-8">

                {!doc.ai_summary && doc.processing_status === "completed" && (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40">
                      <FileText className="h-16 w-16 text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium tracking-wide">No Summary Available</p>
                    </div>
                )}
                
                {doc.processing_status !== "completed" && (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 opacity-40">
                      <Clock className="h-16 w-16 text-slate-300 mb-4" />
                      <p className="text-slate-500 font-medium tracking-wide">Document Processing...</p>
                      <p className="text-xs text-slate-400 mt-2 max-w-xs text-center">This document is still being indexed by the AI engine.</p>
                    </div>
                )}

                {doc.ai_summary && (
                  <div className="border border-indigo-100 rounded-xl overflow-hidden shadow-sm">
                    <button
                      onClick={() => setShowSummary(!showSummary)}
                      className="w-full flex items-center justify-between p-4 bg-indigo-50/30 hover:bg-indigo-50 transition-colors border-b border-indigo-100/50"
                    >
                      <h3 className="text-xs font-black uppercase tracking-widest text-indigo-900 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-indigo-500" /> AI Executive Summary
                      </h3>
                      {showSummary ? <ChevronUp className="h-4 w-4 text-indigo-400" /> : <ChevronDown className="h-4 w-4 text-indigo-400" />}
                    </button>
                    <AnimatePresence>
                      {showSummary && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-white"
                        >
                          <div className="prose prose-slate prose-sm sm:prose-base max-w-none text-slate-700 leading-relaxed p-6 sm:p-8 whitespace-pre-wrap font-medium">
                            {doc.ai_summary}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}
