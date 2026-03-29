"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Gauge, Clock, LayoutGrid, Layers } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";

interface CustomChallengeProps {
  children: React.ReactNode;
  defaultCategory: string;
  availableCategories?: string[];
  availableSubCategories?: string[];
}

export function CustomChallengeDialog({
  children,
  defaultCategory,
  availableCategories = [],
  availableSubCategories = [],
}: CustomChallengeProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Form State
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [timer, setTimer] = useState(10);
  const [category, setCategory] = useState(defaultCategory);
  const [subCategory, setSubCategory] = useState("All Chapters");

  async function handleStart() {
    setLoading(true);
    // Redirect to the custom quiz route with parameters
    const params = new URLSearchParams({
      count: count.toString(),
      difficulty,
      timer: timer.toString(),
      category: category,
      sub_category: subCategory === "All Chapters" ? "" : subCategory,
    });
    router.push(`/dashboard/quizzes/custom?${params.toString()}`);
  }

  const Content = (
    <div className="space-y-6 py-4">
      {/* Subject Filter */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Subject</Label>
        {availableCategories.length > 0 ? (
           <Select value={category} onValueChange={(val) => { setCategory(val); setSubCategory("All Chapters"); }}>
              <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
                 <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder="Select Subject" />
                 </div>
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 p-1">
                 {availableCategories.map(cat => (
                    <SelectItem key={cat} value={cat} className="rounded-lg">{cat}</SelectItem>
                 ))}
                 <SelectItem value="All" className="rounded-lg">Mixed Categories</SelectItem>
              </SelectContent>
           </Select>
        ) : (
          <div className="relative group">
             <LayoutGrid className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
             <Input
               value={category}
               onChange={(e) => setCategory(e.target.value)}
               placeholder="e.g. Nepal Constitution"
               className="pl-10 h-11 rounded-xl border-slate-200 bg-white"
             />
          </div>
        )}
      </div>

      {/* Specific Chapter selector */}
      <div className="space-y-2">
         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Specific Chapter (Optional)</Label>
         <Select value={subCategory} onValueChange={setSubCategory}>
            <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
               <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-slate-400" />
                  <SelectValue placeholder="Focus on chapter..." />
               </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 p-1">
               <SelectItem value="All Chapters" className="rounded-lg italic">Comprehensive Review (All Chapters)</SelectItem>
               {availableSubCategories.map(sub => (
                  <SelectItem key={sub} value={sub} className="rounded-lg">{sub}</SelectItem>
               ))}
            </SelectContent>
         </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Question Count */}
        <div className="space-y-2">
           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Questions</Label>
           <Input
             type="number"
             min={5}
             max={50}
             value={count}
             onChange={(e) => setCount(parseInt(e.target.value) || 10)}
             className="h-11 rounded-xl border-slate-200"
           />
        </div>

        {/* Timer */}
        <div className="space-y-2">
           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Limit (Min)</Label>
           <div className="relative group">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="number"
                min={0}
                placeholder="0 = Unlimited"
                value={timer}
                onChange={(e) => setTimer(parseInt(e.target.value) || 0)}
                className="pl-10 h-11 rounded-xl border-slate-200"
              />
           </div>
        </div>
      </div>

      {/* Difficulty */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Difficulty Level</Label>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="h-11 rounded-xl border-slate-200 bg-white">
             <div className="flex items-center gap-2">
                <Gauge className="h-4 w-4 text-slate-400" />
                <SelectValue placeholder="Select level" />
             </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-100 p-1">
            <SelectItem value="easy" className="rounded-lg">Fundamental</SelectItem>
            <SelectItem value="medium" className="rounded-lg">Intermediate</SelectItem>
            <SelectItem value="hard" className="rounded-lg">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="pt-4">
        <Button
          onClick={handleStart}
          disabled={loading || !category}
          className="w-full h-12 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 shadow-none transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="h-5 w-5" />
              Generate Practice Drill
            </>
          )}
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={children as any} />
        <SheetContent side="bottom" className="rounded-t-[2.5rem] border-none p-8 outline-none bg-white shadow-2xl">
          <SheetHeader className="text-left pb-2">
            <SheetTitle className="text-2xl font-bold text-slate-900">Personalized Practice</SheetTitle>
            <div className="text-sm font-medium text-slate-500 mt-1">Configure your AI-powered curriculum focus.</div>
          </SheetHeader>
          {Content}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={children as any} />
      <SheetContent side="right" className="w-screen max-w-none p-0 h-full flex flex-col border-none shadow-none bg-white">
        <div className="flex-1 flex flex-col w-full max-w-[500px] mx-auto overflow-y-auto">
          <SheetHeader className="text-left p-8 sm:p-12 border-b border-slate-50 shrink-0">
            <SheetTitle className="text-3xl font-bold text-slate-900">Personalized Practice</SheetTitle>
            <div className="text-sm font-medium text-slate-500 mt-2">Setup your optimized curriculum focus.</div>
          </SheetHeader>
          <div className="px-8 sm:px-12">
            {Content}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
