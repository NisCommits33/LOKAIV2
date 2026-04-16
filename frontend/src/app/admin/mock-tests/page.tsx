"use client";

import { useState, useEffect } from "react";
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Calendar, 
  Clock, 
  BookOpen, 
  FileText,
  Eye,
  Trash2,
  ChevronRight,
  TrendingUp,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { FullPageSpinner } from "@/components/loading";
import Link from "next/link";
import { motion } from "framer-motion";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function fetchTests() {
      try {
        const res = await fetch("/api/admin/mock-tests");
        if (res.ok) {
          const data = await res.json();
          setTests(data);
        }
      } catch (err) {
        toast.error("Could not load mock tests");
      } finally {
        setLoading(false);
      }
    }
    fetchTests();
  }, []);

  const filteredTests = tests.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (start: string, end: string | null) => {
    const now = new Date();
    const st = new Date(start);
    const en = end ? new Date(end) : null;

    if (now < st) return { label: "Upcoming", color: "bg-amber-100 text-amber-700 border-amber-200" };
    if (en && now > en) return { label: "Ended", color: "bg-slate-100 text-slate-600 border-slate-200" };
    return { label: "Active", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  };

  if (loading) return <FullPageSpinner />;

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Mock Tests</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your organization&apos;s scheduled assessments and track results.
          </p>
        </div>
        <Link href="/admin/documents">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Schedule New Test
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search tests by title..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Badge variant="outline" className="px-3 py-1.5 h-auto text-xs text-slate-500 border-slate-200">
            Total: {tests.length}
          </Badge>
        </div>
      </div>

      {filteredTests.length === 0 ? (
        <div className="text-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
          <ClipboardCheck className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">No mock tests found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            Create your first organization-wide test by selecting a document from your library.
          </p>
          <Link href="/admin/documents">
            <Button variant="outline" className="mt-6">Go to Document Library</Button>
          </Link>
        </div>
      ) : (
        <motion.div 
          variants={container} 
          initial="hidden" 
          animate="show"
          className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {filteredTests.map((test) => {
            const status = getStatus(test.start_time, test.end_time);
            return (
              <motion.div key={test.id} variants={item}>
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden group hover:shadow-md transition-all h-full flex flex-col">
                  <div className="p-5 flex-1 space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge className={status.color + " px-2 py-0 border text-[10px] font-bold uppercase tracking-wider"}>
                        {status.label}
                      </Badge>
                      <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 text-[10px] items-center gap-1">
                        {test.quiz_id ? <BookOpen className="h-2.5 w-2.5" /> : <FileText className="h-2.5 w-2.5" />}
                        {test.quiz_id ? "GK Quiz" : "Document"}
                      </Badge>
                    </div>

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {test.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {test.description || "Official assessment for employees."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Questions</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                             <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />
                             {test.question_limit || "All"}
                          </p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timer</p>
                          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                             <Clock className="h-3.5 w-3.5 text-slate-400" />
                             {test.time_limit}m
                          </p>
                       </div>
                    </div>

                    <div className="pt-2 space-y-2 border-t border-slate-100 dark:border-slate-800">
                       <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1.5">
                             <Calendar className="h-3.5 w-3.5" />
                             {new Date(test.start_time).toLocaleDateString()}
                          </span>
                          {test.end_time && (
                             <span className="flex items-center gap-1.5">
                                <TrendingUp className="h-3.5 w-3.5" />
                                {new Date(test.end_time).toLocaleDateString()}
                             </span>
                          )}
                       </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <Link href={`/admin/mock-tests/${test.id}/results`} className="w-full">
                      <Button variant="outline" size="sm" className="w-full bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold">
                        <Users className="h-3.5 w-3.5 mr-2" />
                        View Results
                        <ChevronRight className="h-3.5 w-3.5 ml-auto" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
