"use client";

import { useState, useEffect, use } from "react";
import { 
  Users, 
  Trophy, 
  Clock, 
  Calendar,
  Search,
  ChevronLeft,
  Filter,
  ArrowUpDown,
  FileSpreadsheet,
  Building2,
  Medal,
  Activity
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/loading";
import { BackButton } from "@/components/ui/back-button";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface AttemptRecord {
  id: string;
  score: number;
  total_questions: number;
  time_spent: number;
  created_at: string;
  users: {
    full_name: string;
    email: string;
    employee_id: string;
    avatar_url: string | null;
    departments: { name: string } | null;
    job_levels: { name: string } | null;
  };
}

export default function MockTestResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [attempts, setAttempts] = useState<AttemptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchResults() {
      try {
        const res = await fetch(`/api/admin/mock-tests/${id}/results`);
        if (res.ok) {
          const data = await res.json();
          setAttempts(data);
        } else {
          toast.error("Failed to load results dashboard");
        }
      } catch (err) {
        toast.error("An error occurred while fetching data");
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [id]);

  const filteredAttempts = attempts.filter(a => 
    a.users.full_name.toLowerCase().includes(search.toLowerCase()) ||
    a.users.employee_id?.toLowerCase().includes(search.toLowerCase())
  );

  // Stats calculation
  const totalParticipants = attempts.length;
  const avgScore = totalParticipants > 0 
    ? Math.round(attempts.reduce((acc, curr) => acc + (curr.score / curr.total_questions), 0) / totalParticipants * 100) 
    : 0;
  const highestScore = totalParticipants > 0 
    ? Math.max(...attempts.map(a => Math.round((a.score / a.total_questions) * 100))) 
    : 0;

  if (loading) return <FullPageSpinner />;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-start gap-4">
          <div className="mt-1">
             <BackButton />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
               <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Test Performance</h1>
               <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[10px] font-bold uppercase tracking-tighter h-5">Official Record</Badge>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Review individual performance and organization-wide analytics for this assessment.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="bg-white dark:bg-slate-900 h-9 text-xs font-semibold gap-2 border-slate-200" onClick={() => toast.info("Exporting feature coming soon!")}>
             <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Total Participants", value: totalParticipants, icon: Users, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/20" },
          { label: "Average Score", value: `${avgScore}%`, icon: Trophy, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/20" },
          { label: "Highest Score", value: `${highestScore}%`, icon: Medal, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Avg Time", value: `${Math.round(attempts.reduce((s, a) => s + a.time_spent, 0) / (totalParticipants || 1))}m`, icon: Clock, color: "text-indigo-600", bg: "bg-indigo-50 dark:bg-indigo-950/20" },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl shadow-sm flex items-center gap-4">
             <div className={`${stat.bg} ${stat.color} h-10 w-10 rounded-xl flex items-center justify-center shrink-0`}>
                <stat.icon className="h-5 w-5" />
             </div>
             <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{stat.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</p>
             </div>
          </div>
        ))}
      </div>

      {/* Main Table Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden min-h-[500px] flex flex-col">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                 placeholder="Search by employee name or ID..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="pl-9 h-10 bg-slate-50 dark:bg-slate-800/50 border-none shadow-none text-sm"
              />
           </div>
           <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
              <Activity className="h-4 w-4" />
              {totalParticipants} Attempt{totalParticipants !== 1 ? 's' : ''} Recorded
           </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto flex-1">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-slate-50/50 dark:bg-slate-800/50">
                <TableHead className="w-[300px] text-[11px] font-bold uppercase tracking-wider pl-6">Employee</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider">Department</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider">Performance</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider">Duration</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider pr-6 text-right">Completion Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAttempts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-96 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                       <Filter className="h-10 w-10 text-slate-200" />
                       <p className="font-medium">No performance records found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAttempts.map((attempt) => {
                  const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
                  return (
                    <TableRow key={attempt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-500 text-sm">
                            {attempt.users.full_name?.charAt(0) || "E"}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{attempt.users.full_name}</p>
                            <p className="text-[10px] text-slate-400 font-medium font-mono uppercase tracking-tighter">ID: {attempt.users.employee_id || "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                           <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                              <Building2 className="h-3 w-3 text-slate-400" />
                              {attempt.users.departments?.name || "Unassigned"}
                           </span>
                           <span className="text-[10px] text-slate-400">{attempt.users.job_levels?.name || "General Staff"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1.5 w-24">
                          <div className="flex justify-between items-center text-[11px]">
                             <span className="font-bold text-slate-900 dark:text-slate-100">{percentage}%</span>
                             <span className="text-slate-400">{attempt.score}/{attempt.total_questions}</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div 
                                className={`h-full rounded-full transition-all duration-500 ${percentage >= 80 ? 'bg-emerald-500' : percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} 
                                style={{ width: `${percentage}%` }}
                             />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold text-slate-500 border-slate-200">
                           {attempt.time_spent} Minutes
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                           {new Date(attempt.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-[10px] text-slate-400">
                           {new Date(attempt.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
