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

const topicMetadata: Record<string, { icon: any; color: string; gradient: string }> = {
  "Nepal Constitution": {
    icon: BookOpen,
    color: "text-indigo-600",
    gradient: "from-indigo-500/10 to-indigo-100/0",
  },
  "Geography": {
    icon: Map,
    color: "text-emerald-600",
    gradient: "from-emerald-500/10 to-emerald-100/0",
  },
  "History": {
    icon: History,
    color: "text-amber-600",
    gradient: "from-amber-500/10 to-amber-100/0",
  },
  "Current Affairs": {
    icon: Sparkles,
    color: "text-violet-600",
    gradient: "from-violet-500/10 to-violet-100/0",
  },
  "General Knowledge": {
    icon: Layers,
    color: "text-slate-600",
    gradient: "from-slate-500/10 to-slate-100/0",
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
      <div className="relative h-full bg-white border border-slate-200 rounded-2xl p-6 transition-all duration-300 hover:border-slate-300 hover:shadow-xl group-active:scale-[0.98] overflow-hidden">
        {/* Subtle Background Gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

        <div className="relative z-10 h-full flex flex-col justify-between space-y-6">
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-xl bg-slate-50 ${meta.color} transition-all duration-500 group-hover:scale-110 group-hover:bg-white group-hover:shadow-md`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-50 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
              <ChevronRight className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>

          <div>
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{chapters} Chapters</p>
             <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{topic}</h3>
             <p className="text-sm font-medium text-slate-500 mt-1">{count} Practice Modules</p>
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
               <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Readiness</span>
               <span className="text-lg font-bold text-slate-900">{mastery}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
               <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${mastery}%` }}
                  className="h-full bg-indigo-600" 
               />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
