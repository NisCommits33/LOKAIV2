"use client";

import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  ReferenceArea
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Clock, Info } from "lucide-react";

interface HistoryPoint {
  date: string;
  score: number;
}

interface ForecastPoint {
  date: string;
  predicted_score: number;
  is_forecast: boolean;
}

interface TrendForecastChartProps {
  history: HistoryPoint[];
  forecast: ForecastPoint[];
  stats: {
    trend: string;
    net_improvement: number;
  };
  loading: boolean;
}

export function TrendForecastChart({ history, forecast, stats, loading }: TrendForecastChartProps) {
  const { resolvedTheme } = useTheme();
  const gridStroke = resolvedTheme === 'dark' ? '#334155' : '#f1f5f9';

  if (loading) {
    return (
      <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden h-[450px]">
        <CardContent className="p-8 h-full bg-slate-50/50 dark:bg-slate-800/50 animate-pulse" />
      </Card>
    );
  }

  // Combine history and forecast for a continuous line
  const combinedData = [
    ...history.map(h => ({ date: h.date, score: h.score, type: 'history' })),
    ...forecast.map(f => ({ date: f.date, score: f.predicted_score, type: 'forecast' }))
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-2xl">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{data.date}</p>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${data.type === 'history' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            <p className="text-lg font-black text-white italic">{data.score}%</p>
          </div>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">
            {data.type === 'history' ? 'Actual Performance' : 'Predictive Forecast'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <Card className="border-none shadow-xl bg-white dark:bg-slate-900 overflow-hidden flex flex-col h-[450px]">
        <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2 italic">
               <TrendingUp className="h-5 w-5 text-indigo-600" /> Performance Trend
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-400"> Historical scores and AI-driven 14-day readiness forecast.</CardDescription>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">History</span>
             </div>
             <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Forecast</span>
             </div>
          </div>
        </CardHeader>

        <CardContent className="px-4 pb-8 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={combinedData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                tickFormatter={(date) => {
                   const d = new Date(date);
                   return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }}
                minTickGap={30}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold' }}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              
              {/* Reference line for the cut-off between history and forecast */}
              {history.length > 0 && history.length < combinedData.length && (
                 <ReferenceArea 
                   x1={history[history.length - 1].date} 
                   x2={forecast[forecast.length - 1].date} 
                   fill="#10b981" 
                   fillOpacity={0.03} 
                 />
              )}

              {/* History Area */}
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#6366f1" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                connectNulls
                data={history.map(h => ({ ...h, score: h.score }))}
              />
              
              {/* Forecast Area (rendered separately to have dashed line if preferred, or different color) */}
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="#10b981" 
                strokeWidth={3} 
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorForecast)" 
                activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
                data={combinedData.filter(d => d.type === 'forecast' || d === combinedData[history.length - 1])}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}
