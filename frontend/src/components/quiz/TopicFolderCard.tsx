"use client";

import { motion } from "framer-motion";
import { BookOpen, Map, History, Sparkles, Layers, ChevronRight } from "lucide-react";

interface TopicFolderProps {
  topic: string;
  count: number;
  chapters: number;
  onClick: () => void;
  index: number;
  mastery?: number;
}

const topicMetadata: Record<string, { icon: any; color: string; gradient: string; darkGradient: string }> = {
  "Nepal Constitution": {
    icon: BookOpen,
    color: "text-indigo-600 dark:text-indigo-400",
    gradient: "from-indigo-500/10 to-indigo-100/0",
    darkGradient: "from-indigo-500/20 to-transparent",
  },
  "Geography": {
    icon: Map,
    color: "text-emerald-600 dark:text-emerald-400",
    gradient: "from-emerald-500/10 to-emerald-100/0",
    darkGradient: "from-emerald-500/20 to-transparent",
  },
  "History": {
    icon: History,
    color: "text-amber-600 dark:text-amber-400",
    gradient: "from-amber-500/10 to-amber-100/0",
    darkGradient: "from-amber-500/20 to-transparent",
  },
  "Current Affairs": {
    icon: Sparkles,
    color: "text-violet-600 dark:text-violet-400",
    gradient: "from-violet-500/10 to-violet-100/0",
    darkGradient: "from-violet-500/20 to-transparent",
  },
  "General Knowledge": {
    icon: Layers,
    color: "text-slate-600 dark:text-slate-400",
    gradient: "from-slate-500/10 to-slate-100/0",
    darkGradient: "from-slate-500/20 to-transparent",
  },
};

export function TopicFolderCard({ topic, count, chapters, onClick, index, mastery = 0 }: TopicFolderProps) {
  const meta = topicMetadata[topic] || topicMetadata["General Knowledge"];
  const Icon = meta.icon;

  return (
    <div
      onClick={onClick}
      className="group cursor-pointer h-full"
    >
      <div className="relative h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 transition-all duration-300 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xl dark:hover:shadow-indigo-500/10 group-active:scale-[0.98] overflow-hidden">
        {/* Subtle Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} dark:${meta.darkGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        <div className="relative z-10 h-full flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 ${meta.color} transition-all duration-500 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-slate-700 group-hover:shadow-md`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">{chapters} Chapters</p>
             <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{topic}</h3>
             <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{count} Practice Modules</p>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-black tracking-widest text-slate-400 dark:text-slate-500 uppercase">Readiness</span>
               <span className="text-lg font-bold text-slate-900 dark:text-slate-100">{mastery}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${mastery}%` }}
                  className="h-full bg-indigo-600 dark:bg-indigo-500" 
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
