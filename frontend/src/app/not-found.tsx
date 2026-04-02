/**
 * not-found.tsx — Custom 404 Page
 *
 * Rendered by Next.js when no route matches the requested URL.
 * Features a clean animated layout with navigation back to the dashboard.
 *
 * @module app/not-found
 */

"use client";

import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center py-20 bg-white dark:bg-slate-950 min-h-screen">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-lg text-center space-y-12"
        >
          <div className="relative">
            <h1 className="text-[10rem] font-bold text-slate-50 dark:text-slate-900 select-none leading-none tracking-tighter">
              404
            </h1>
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
              <span className="text-5xl mb-4">🛸</span>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                Resource Not Found
              </h2>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs mx-auto font-medium leading-relaxed">
              The requested path is unavailable. It may have been relocated or
              removed during system updates.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
            <BackButton />
            <Link href="/">
              <Button className="h-11 px-8 text-sm font-bold rounded-xl bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 shadow-none hover:bg-slate-800 dark:hover:bg-slate-200 transition-all">
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </motion.div>
      </Container>
    </div>
  );
}
