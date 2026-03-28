"use client";

import { useEffect, useState } from "react";
import { 
  Users, Building2, Layers, FileText, Activity, ShieldCheck, UserX
} from "lucide-react";
import { toast } from "sonner";
import { FullPageSpinner } from "@/components/loading";

type AnalyticsData = {
  users: { total: number; active: number; verified: number; };
  organization: { departments: number; jobLevels: number; };
  content: { documents: number; };
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) throw new Error("Failed to fetch analytics");
        setData(await res.json());
      } catch (err) {
        toast.error("Could not load dashboard data");
      } finally {
        setIsLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (isLoading || !data) return <FullPageSpinner />;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Organization Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Overview of your organizational usage, structure, and active members.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI Cards */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-colors">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out"></div>
           <div className="relative flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-indigo-100/80 text-indigo-700 flex items-center justify-center border border-indigo-200 shadow-sm">
               <Users className="h-6 w-6" />
             </div>
             <div>
               <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Total Users</p>
               <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">{data.users.total}</h3>
             </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out"></div>
           <div className="relative flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center border border-emerald-200 shadow-sm">
               <Activity className="h-6 w-6" />
             </div>
             <div>
               <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Active Users</p>
               <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">{data.users.active}</h3>
             </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-sky-200 transition-colors">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-sky-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out"></div>
           <div className="relative flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-sky-100/80 text-sky-700 flex items-center justify-center border border-sky-200 shadow-sm">
               <ShieldCheck className="h-6 w-6" />
             </div>
             <div>
               <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Verified</p>
               <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">{data.users.verified}</h3>
             </div>
           </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-200 transition-colors">
           <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full group-hover:scale-110 transition-transform duration-500 ease-out"></div>
           <div className="relative flex items-center gap-4">
             <div className="h-12 w-12 rounded-xl bg-rose-100/80 text-rose-700 flex items-center justify-center border border-rose-200 shadow-sm">
               <UserX className="h-6 w-6" />
             </div>
             <div>
               <p className="text-sm font-semibold tracking-wide text-slate-500 uppercase">Inactive</p>
               <h3 className="text-3xl font-extrabold tracking-tight text-slate-900 mt-0.5">{data.users.total - data.users.active}</h3>
             </div>
           </div>
        </div>
      </div>

      <h2 className="text-lg font-bold text-slate-800 mt-8 mb-4">Organizational Assets</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-500">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-semibold text-slate-800">Departments</span>
                <span className="block text-xs text-slate-500 font-medium tracking-wide">DIVISIONS</span>
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-900">{data.organization.departments}</span>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-semibold text-slate-800">Job Levels</span>
                <span className="block text-xs text-slate-500 font-medium tracking-wide">HIERARCHY</span>
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-900">{data.organization.jobLevels}</span>
         </div>

         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="block font-semibold text-slate-800">Sourced Docs</span>
                <span className="block text-xs text-slate-500 font-medium tracking-wide">INTELLIGENCE</span>
              </div>
            </div>
            <span className="text-2xl font-bold text-slate-900">{data.content.documents}</span>
         </div>
      </div>
      
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center mt-8">
        <h3 className="text-lg font-semibold text-slate-800">Manage Your Platform</h3>
        <p className="text-slate-500 max-w-lg mx-auto mt-2">
            Use the sidebar navigation to configure your organizational settings, assign roles, approve employee applications, and control access levels across your enterprise workspace.
        </p>
      </div>

    </div>
  );
}
