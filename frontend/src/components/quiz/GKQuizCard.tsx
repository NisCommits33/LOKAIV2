"use client";

import { GKQuiz } from "@/types/database";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Layers, 
  Trophy, 
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
    easy: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-700",
    hard: "bg-red-50 text-red-700",
  }[quiz.difficulty] || "bg-slate-50 text-slate-700";

  const thumbnail = categoryImages[quiz.category] || categoryImages["General Knowledge"];

  // COMPACT VERSION (HORIZONTAL MINIMAL)
  if (compact) {
    return (
      <Card className="group border border-slate-100 bg-white hover:border-indigo-200 hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden cursor-pointer">
        <Link href={`/dashboard/quizzes/${quiz.id}`} className="flex items-center gap-4">
           <div className="h-20 w-24 relative overflow-hidden shrink-0">
              <img src={thumbnail} alt="" className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-105 group-hover:scale-110" />
              <div className="absolute inset-0 bg-indigo-900/10 group-hover:bg-transparent transition-colors" />
           </div>
           <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-0.5">
                 <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Module Practice</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                 {quiz.title}
              </h4>
           </div>
           <div className="pr-4">
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transform group-hover:translate-x-0.5 transition-transform" />
           </div>
        </Link>
      </Card>
    );
  }

  // PRIMARY VERSION (HORIZONTAL WITH IMAGERY & STATS)
  return (
    <Card className="group flex flex-row h-32 border-slate-200 hover:shadow-xl hover:border-indigo-100 transition-all duration-300 rounded-2xl overflow-hidden bg-white">
      <Link href={`/dashboard/quizzes/${quiz.id}`} className="flex-1 flex flex-row">
          {/* Left: Visual Thumbnail */}
          <div className="w-32 sm:w-44 h-full relative overflow-hidden shrink-0 border-r border-slate-50">
             <img 
               src={thumbnail} 
               alt={quiz.title} 
               className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
             />
             <div className="absolute inset-0 bg-gradient-to-r from-slate-900/20 to-transparent" />
             <div className="absolute bottom-2 left-2">
                <div className={cn("px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest flex items-center gap-1", difficultyColors)}>
                   <Zap className="w-3 h-3" />
                   {quiz.difficulty}
                </div>
             </div>
          </div>

          {/* Right: Content Block */}
          <CardContent className="flex-1 p-4 flex flex-col justify-between min-w-0">
             <div className="space-y-1">
                <div className="flex items-center justify-between gap-2">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                      <span>{quiz.category}</span>
                      {quiz.reward_xp > 0 && (
                        <>
                           <div className="h-1 w-1 rounded-full bg-slate-200" />
                           <span className="text-indigo-600 flex items-center gap-1">
                              <Trophy className="w-3 h-3" />
                              {quiz.reward_xp} XP
                           </span>
                        </>
                      )}
                   </div>
                </div>
                <h3 className="text-base font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {quiz.title}
                </h3>
             </div>

             {/* Footer Row (Integrated Header Style) */}
             <div className="flex items-center justify-between gap-4 mt-auto">
                <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                   <div className="flex items-center gap-1.5 font-mono">
                      <Layers className="h-3.5 w-3.5" />
                      {quiz.total_questions}
                   </div>
                   {quiz.time_limit_minutes > 0 && (
                      <div className="flex items-center gap-1.5 font-mono">
                         <Clock className="h-3.5 w-3.5" />
                         {quiz.time_limit_minutes}m
                      </div>
                   )}
                </div>
                
                <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-900 group-hover:text-indigo-600 transition-colors">
                   Practice
                   <ArrowRight className="h-3.5 w-3.5 transform group-hover:translate-x-0.5 transition-transform" />
                </div>
             </div>
          </CardContent>
      </Link>
    </Card>
  );
}
