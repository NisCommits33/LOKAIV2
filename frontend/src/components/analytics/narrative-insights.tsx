"use client";

import { motion } from "framer-motion";
import { Brain, Sparkles, Target, Zap, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface InsightData {
  persona: string;
  badges: string[];
  overview: string;
  gap: string;
  narrative: string;
  stats: {
    avg_accuracy: number;
    total_attempts: number;
  };
}

interface NarrativeInsightsProps {
  data: InsightData | null;
  loading: boolean;
}

export function NarrativeInsights({ data, loading }: NarrativeInsightsProps) {
  if (loading) {
    return (
      <Card className="border-none shadow-xl bg-white overflow-hidden h-full animate-pulse">
        <CardContent className="p-8 h-[300px] bg-slate-50/50" />
      </Card>
    );
  }

  if (!data) return null;

  const getPersonaIcon = (persona: string) => {
    if (persona.includes("Analytical")) return <Brain className="h-6 w-6 text-indigo-500" />;
    if (persona.includes("Subject")) return <Sparkles className="h-6 w-6 text-yellow-500" />;
    if (persona.includes("Resilient")) return <Zap className="h-6 w-6 text-orange-500" />;
    return <Target className="h-6 w-6 text-emerald-500" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-none shadow-xl bg-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
           {getPersonaIcon(data.persona)}
        </div>
        
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Learning Persona</p>
              <h3 className="text-3xl font-black text-slate-900 tracking-tight italic">
                The {data.persona}
              </h3>
              <div className="flex flex-wrap gap-2 pt-2">
                {data.badges.map((badge, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border-none px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
                    {badge}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-center gap-6 min-w-[200px]">
               <div className="text-center border-r border-slate-200 pr-6">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">AVG ACCURACY</p>
                  <p className="text-2xl font-black text-indigo-600">{data.stats.avg_accuracy}%</p>
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-bold text-slate-400 mb-1">DATA POINTS</p>
                  <p className="text-2xl font-black text-slate-900">{data.stats.total_attempts}</p>
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-indigo-50/50 to-white p-6 rounded-2xl border border-indigo-50/50 relative overflow-hidden group">
               <div className="absolute top-0 right-0 h-16 w-16 bg-indigo-500/5 rounded-bl-full -z-0" />
               <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  AI Intelligence
               </h4>
               <p className="text-slate-600 text-sm leading-relaxed relative z-10">
                  {data.narrative}
               </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50/50 to-white p-6 rounded-2xl border border-emerald-50/50 relative overflow-hidden">
               <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4">
                  <Zap className="h-4 w-4 text-emerald-500" />
                  Personalized Advice
               </h4>
               <p className="text-slate-600 text-sm leading-relaxed">
                  {data.overview}
               </p>
               <div className="mt-4 flex items-center gap-2 p-2 bg-white/50 rounded-lg border border-emerald-100/50">
                  <AlertCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <span className="text-[11px] font-bold text-emerald-700">{data.gap}</span>
               </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
