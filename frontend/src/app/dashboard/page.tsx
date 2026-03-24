/**
 * dashboard/page.tsx — Main Dashboard
 *
 * The primary authenticated landing page showing:
 * - Personalized welcome message with the user's first name
 * - Role and verification status badges
 * - Feature card grid linking to GK Quizzes, Documents, and Progress
 *
 * Feature cards are conditionally rendered based on the user's role.
 *
 * @module app/dashboard
 */

"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FullPageSpinner } from "@/components/loading";
import { BookOpen, FileText, TrendingUp } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

/** Framer Motion stagger animation for card grid entrance */
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

/** Individual card entrance animation */
const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { dbUser, isLoading } = useAuth();

  if (isLoading) return <FullPageSpinner />;

  /** Dashboard feature cards with role-based visibility */
  const features = [
    {
      title: "GK Quizzes",
      description:
        "Practice with general knowledge quizzes covering Nepal constitution, geography, history, and current affairs.",
      icon: BookOpen,
      href: "/dashboard/quizzes",
      color: "bg-indigo-50 text-indigo-600",
      show: true,
    },
    {
      title: "My Documents",
      description:
        "Upload your study materials and let AI generate practice questions from them.",
      icon: FileText,
      href: "/dashboard/documents",
      color: "bg-slate-50 text-slate-600",
      show: true,
    },
    {
      title: "My Progress",
      description:
        "Track your performance, identify weak areas, and get personalized study recommendations.",
      icon: TrendingUp,
      href: "/dashboard/progress",
      color: "bg-slate-50 text-slate-600",
      show: dbUser?.role === "employee" || dbUser?.role === "org_admin",
    },
  ];

  return (
    <div className="p-6 sm:p-8 space-y-8">
      {/* Welcome section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Welcome back, {dbUser?.full_name?.split(" ")[0] || "User"}
        </h1>
        <p className="text-slate-500 font-medium">
          Continue your exam preparation journey
        </p>
      </motion.div>

      {/* Role badge */}
      <div className="flex items-center gap-2">
        <Badge
          variant="secondary"
          className="capitalize bg-slate-50 text-slate-600 border border-slate-100 font-bold text-[10px] uppercase tracking-widest"
        >
          {dbUser?.role?.replace("_", " ") || "Public"}
        </Badge>
        {dbUser?.verification_status === "verified" && (
          <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-100 font-bold text-[10px] uppercase tracking-widest">
            Verified Employee
          </Badge>
        )}
      </div>

      {/* Feature cards */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"
      >
        {features
          .filter((f) => f.show)
          .map((feature, i) => (
            <motion.div key={i} variants={item}>
              <Link href={feature.href}>
                <Card className="shadow-none border border-slate-100 overflow-hidden bg-white hover:border-slate-200 transition-colors cursor-pointer group">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${feature.color}`}
                      >
                        <feature.icon className="h-5 w-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))}
      </motion.div>
    </div>
  );
}
