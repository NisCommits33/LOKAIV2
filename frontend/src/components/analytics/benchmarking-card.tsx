"use client";

import { motion } from "framer-motion";
import { Users, Trophy, TrendingUp, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ComparisonData {
  rank: number;
  total: number;
  percentile: number;
  org_average: number;
  message: string;
}

interface BenchmarkingCardProps {
  data: ComparisonData | null;
  loading: boolean;
}

export function BenchmarkingCard({ data, loading }: BenchmarkingCardProps) {
  if (loading) {
    return (
      <Card className="border-none shadow-xl bg-white overflow-hidden h-full animate-pulse">
        <CardContent className="p-8 h-[250px] bg-slate-50/50" />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <motion.div
       initial={{ opacity: 0, scale: 0.95 }}
       animate={{ opacity: 1, scale: 1 }}
       transition={{ duration: 0.5, delay: 0.2 }}
       className="h-full"
    >
      <Card className="border-none shadow-none bg-slate-900 overflow-hidden relative h-full flex flex-col group">
        {/* Abstract background decorative element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-bl-full -z-0 opacity-50" />
        
        <CardContent className="p-8 flex-1 flex flex-col relative z-10 text-white">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-2">
               <Trophy className="h-3 w-3" /> Benchmarking
            </h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                   <Info className="h-3.5 w-3.5 text-slate-500 hover:text-slate-400 transition-colors" />
                </TooltipTrigger>
                <TooltipContent className="bg-slate-800 border-slate-700 text-slate-200 text-[10px] max-w-[200px] p-3 rounded-lg shadow-xl">
                  Your ranking is calculated based on accuracy across all quiz categories compared to active members of your organization.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
               <img 
                 src="https://img.icons8.com/isometric/100/medal.png" 
                 alt="Rank" 
                 className="h-16 w-16 mb-2 opacity-50 contrast-125"
               />
               <div className="absolute inset-x-0 bottom-0 text-3xl font-black text-white italic drop-shadow-lg">
                 #{data.rank}
               </div>
            </div>
            
            <div className="space-y-1">
               <p className="text-4xl font-black text-white tracking-tight italic">
                  {data.percentile}% <span className="text-sm font-bold text-slate-400 not-italic uppercase tracking-widest ml-1">Percentile</span>
               </p>
               <p className="text-xs font-medium text-slate-400">
                  Outperforming {Math.round(data.percentile)}% of {data.total} colleagues.
               </p>
            </div>

            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${data.percentile}%` }}
                 transition={{ duration: 1, ease: "easeOut", delay: 0.5 }}
                 className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
               />
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center">
                   <Users className="h-4 w-4 text-slate-400" />
                </div>
                <div>
                   <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Org Avg Score</p>
                   <p className="text-sm font-black text-slate-300">{data.org_average}%</p>
                </div>
             </div>
             
             <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                <TrendingUp className="h-3.5 w-3.5" />
                <span className="text-[10px] font-black uppercase tracking-wider">Top {(100 - data.percentile).toFixed(0)}%</span>
             </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
