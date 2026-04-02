"use client";

import { GKQuiz } from "@/types/database";
import { Card } from "@/components/ui/card";
import { 
  Clock, 
  Layers, 
  ArrowRight, 
  ChevronRight,
  Zap
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GKQuizCardProps {
  quiz: GKQuiz;
  compact?: boolean;
}

const categoryImages: Record<string, string> = {
  "Nepal Constitution": "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400",
  "Geography": "https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&q=80&w=400",
  "History": "https://images.unsplash.com/photo-1505664194779-8beaceb93744?auto=format&fit=crop&q=80&w=400",
  "Current Affairs": "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=400",
  "General Knowledge": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=400",
};

export function GKQuizCard({ quiz, compact = false }: GKQuizCardProps) {
  const difficultyColors = {
    easy: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400",
    medium: "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400",
    hard: "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400",
  }[quiz.difficulty] || "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300";

  const thumbnail = quiz.thumbnail_url || categoryImages[quiz.category] || categoryImages["General Knowledge"];

  // COMPACT VERSION (HORIZONTAL MINIMAL)
  if (compact) {
    return (
      <Card className="group border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-500/30 hover:shadow-md dark:hover:shadow-indigo-500/10 transition-all duration-300 rounded-xl overflow-hidden cursor-pointer">
        <Link href={`/dashboard/quizzes/${quiz.id}`} className="flex items-center gap-4">
           <div className="h-20 w-24 relative overflow-hidden shrink-0 border-r border-slate-50 dark:border-slate-800">
              <img src={thumbnail} alt="" className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-110 opacity-90 dark:opacity-70 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-transparent transition-colors" />
           </div>
           <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-0.5">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Module Practice</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                 {quiz.title}
              </h4>
           </div>
           <div className="pr-4">
              <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transform group-hover:translate-x-0.5 transition-transform" />
           </div>
        </Link>
      </Card>
    );
  }

  // PRIMARY VERSION (HORIZONTAL WITH IMAGERY & STATS)
  return (
    <Card className="group flex flex-row h-32 border-slate-200 dark:border-slate-800 hover:shadow-xl dark:hover:shadow-indigo-500/10 hover:border-indigo-100 dark:hover:border-indigo-500/30 transition-all duration-300 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
      <Link href={`/dashboard/quizzes/${quiz.id}`} className="flex-1 flex flex-row">
          {/* Left: Visual Thumbnail */}
          <div className="w-32 sm:w-44 h-full relative overflow-hidden shrink-0 border-r border-slate-50 dark:border-slate-800">
             <img 
               src={thumbnail} 
               alt={quiz.title} 
               className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 dark:opacity-70 group-hover:opacity-100" 
             />
             <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 to-transparent" />
             <div className="absolute bottom-2 left-2">
                <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm", difficultyColors)}>
                   <Zap className="w-3 h-3" />
                   {quiz.difficulty}
                </div>
             </div>
          </div>

          {/* Right: Info Area */}
          <div className="flex-1 p-5 min-w-0 flex flex-col justify-center">
             <div className="flex items-center gap-4 text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1.5">
                <span className="flex items-center gap-1.5">
                   <Clock className="w-3 h-3" /> 10 mins
                </span>
                <span className="flex items-center gap-1.5">
                   <Layers className="w-3 h-3" /> {quiz.total_questions} Questions
                </span>
             </div>
             <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {quiz.title}
             </h3>
             <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1 font-medium">
                {quiz.sub_category} Practice
             </p>
          </div>
          
          <div className="pr-6 flex items-center opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
             <div className="h-8 w-8 rounded-full bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <ArrowRight className="h-4 w-4" />
             </div>
          </div>
      </Link>
    </Card>
  );
}
