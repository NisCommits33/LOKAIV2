/**
 * DocWorkspace.tsx — Focused & Resizable Document Workspace
 * 
 * Provides a high-end, adaptive layout for all devices.
 * Features:
 * - Dual Toggles: Hide/Show Document or Tools independently.
 * - Resizable Sidebar: Draggable divider for custom widths.
 * - Dynamic Summary: Shows full doc summary or specific chapter summaries.
 */

"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { 
  FileText, 
  Brain, 
  ChevronLeft, 
  ChevronRight, 
  Download,
  ListRestart,
  Sparkles,
  Layers,
  Search,
  BookOpen,
  ArrowLeft,
  Minimize2,
  Maximize2,
  GripVertical,
  MoreVertical,
  Eye,
  EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocWorkspaceProps {
  doc: any; 
  quizElement: React.ReactNode;
  chapterSummaries?: Record<number, string>; // New prop for chapter-specific summaries
  onChapterSelect?: (index: number) => void;
  onSummarize?: () => void;
  isMinimized?: boolean;
  onMinimizeToggle?: () => void;
  processingStatus?: string;
}

export function DocWorkspace({ 
  doc, 
  quizElement, 
  chapterSummaries = {},
  onChapterSelect, 
  onSummarize,
  isMinimized = false,
  onMinimizeToggle,
  processingStatus
}: DocWorkspaceProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("summary");
  const [selectedChapter, setSelectedChapter] = useState<number>(-1);
  
  // Resizing State
  const [sidebarWidth, setSidebarWidth] = useState(440);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    const savedWidth = localStorage.getItem("doc_workspace_sidebar_width");
    if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= 320 && width <= 800) setSidebarWidth(width);
    }
  }, []);

  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
    localStorage.setItem("doc_workspace_sidebar_width", sidebarWidth.toString());
  }, [sidebarWidth]);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const newWidth = containerRect.right - e.clientX;
        if (newWidth > 300 && newWidth < containerRect.width - 200) {
            setSidebarWidth(newWidth);
        }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
        window.addEventListener("mousemove", resize);
        window.addEventListener("mouseup", stopResizing);
        document.body.style.cursor = 'col-resize';
    } else {
        window.removeEventListener("mousemove", resize);
        window.removeEventListener("mouseup", stopResizing);
        document.body.style.cursor = 'auto';
    }
    return () => {
        window.removeEventListener("mousemove", resize);
        window.removeEventListener("mouseup", stopResizing);
        document.body.style.cursor = 'auto';
    };
  }, [isResizing, resize, stopResizing]);

  const hasChapters = useMemo(() => 
    doc.chapters && Array.isArray(doc.chapters) && doc.chapters.length > 0
  , [doc.chapters]);

  const handleChapterClick = (index: number) => {
    setSelectedChapter(index);
    if (onChapterSelect) onChapterSelect(index);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setActiveTab("summary");
    }
  };

  // --- MINIMIZED VIEW ---
  if (isMinimized) {
    return (
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 left-4 right-4 md:left-auto md:bottom-6 md:right-6 md:w-[400px] z-[100]"
      >
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-white/20 dark:border-slate-800 shadow-2xl rounded-2xl p-4 flex items-center justify-between group">
          <div className="flex items-center gap-4 min-w-0">
             <div className="p-2.5 rounded-xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 shrink-0">
                <FileText size={18} />
             </div>
             <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-slate-900 dark:text-slate-100 truncate tracking-tight">
                  {doc.title}
                </span>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                  Restoring Analysis...
                </span>
             </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMinimizeToggle}
            className="h-10 w-10 p-0 rounded-xl hover:bg-indigo-500/10 dark:hover:bg-slate-800/50 bg-indigo-500/5"
          >
            <Maximize2 className="h-4 w-4 text-indigo-500" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // Determine what summary to show
  const displaySummary = selectedChapter === -1 
    ? doc.ai_summary 
    : chapterSummaries[selectedChapter] || null;

  const summaryTitle = selectedChapter === -1
    ? "Document Insights"
    : `Chapter ${selectedChapter + 1} Summary`;

  // --- FULL VIEW ---
  return (
    <div 
      ref={containerRef}
      className={cn(
        "flex flex-col h-[calc(100vh-16px)] sm:h-[calc(100vh-80px)] overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none sm:rounded-3xl shadow-2xl relative transition-all duration-300",
        isResizing ? "select-none" : ""
      )}
    >
      
      {/* Background Polish */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20 z-0">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 bg-indigo-500/20 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 bg-violet-500/20 blur-[140px] rounded-full" />
      </div>

      {/* Header Toolbar */}
      <div className="h-14 sm:h-16 border-b border-white/20 dark:border-slate-800/30 px-3 sm:px-6 flex items-center justify-between bg-white/70 dark:bg-slate-900/80 backdrop-blur-2xl z-50 sticky top-0">
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 overflow-hidden">
          <div className="flex flex-col min-w-0">
            <h1 className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-slate-100 truncate max-w-[140px] sm:max-w-[320px] tracking-tight">
              {doc.title}
            </h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[8px] sm:text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 truncate">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0" />
                {selectedChapter === -1 ? "Standard Analysis" : doc.chapters?.[selectedChapter]?.title}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-3">
            {/* Action Group 1: AI */}
            <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSummarize}
                className="h-8 sm:h-9 px-3 sm:px-4 rounded-full bg-indigo-500 text-white sm:text-indigo-600 sm:bg-indigo-500/10 hover:bg-indigo-600 sm:hover:bg-indigo-500/20 shadow-lg shadow-indigo-500/10 border border-indigo-500/10 transition-all"
            >
                <Sparkles className="h-3.5 w-3.5 sm:mr-2 shrink-0" />
                <span className="hidden sm:inline font-bold text-[11px] uppercase tracking-wider">
                  {selectedChapter === -1 ? "Summarize" : "Summarize Chapter"}
                </span>
            </Button>

            <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Panel Toggles */}
            <div className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-full border border-white/10">
               <Button
                variant={viewerOpen ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setViewerOpen(!viewerOpen)}
                className={cn(
                    "h-8 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                    viewerOpen ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600" : "text-slate-400"
                )}
               >
                 {viewerOpen ? <Eye size={12} className="mr-2" /> : <EyeOff size={12} className="mr-2" />}
                 Document
               </Button>
               <Button
                variant={sidebarOpen ? "secondary" : "ghost"}
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className={cn(
                    "h-8 px-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all",
                    sidebarOpen ? "bg-white dark:bg-slate-800 shadow-sm text-indigo-600" : "text-slate-400"
                )}
               >
                 {sidebarOpen ? <Eye size={12} className="mr-2" /> : <EyeOff size={12} className="mr-2" />}
                 Tools
               </Button>
            </div>

            {/* Mobile View Toggles & More Menu */}
            <div className="flex md:hidden items-center gap-0.5">
               <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        setViewerOpen(!viewerOpen);
                        if (!viewerOpen) setSidebarOpen(false);
                    }}
                    className={cn("h-8 w-8 rounded-full", viewerOpen ? "text-indigo-600 bg-indigo-500/10" : "text-slate-400")}
               >
                   <FileText size={16} />
               </Button>
               <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                        setSidebarOpen(!sidebarOpen);
                        if (!sidebarOpen) setViewerOpen(false);
                    }}
                    className={cn("h-8 w-8 rounded-full", sidebarOpen ? "text-indigo-600 bg-indigo-500/10" : "text-slate-400")}
               >
                   <Layers size={16} />
               </Button>

               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreVertical size={16} />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-200 dark:border-slate-800 p-2 shadow-2xl">
                  {doc.download_url && (
                    <DropdownMenuItem asChild>
                      <a href={doc.download_url} target="_blank" className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer">
                        <Download size={14} className="text-indigo-500" />
                        <span className="font-bold text-xs uppercase tracking-wider">Download PDF</span>
                      </a>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={onMinimizeToggle} className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer">
                    <Minimize2 size={14} className="text-slate-500" />
                    <span className="font-bold text-xs uppercase tracking-wider">Minimize View</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="hidden sm:block h-6 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Desktop Utility */}
            <div className="hidden sm:flex items-center gap-2">
                {doc.download_url && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        asChild 
                        className="h-9 px-4 rounded-full bg-white/50 dark:bg-slate-800/50 border-white/20 dark:border-slate-700/50 hover:bg-white transition-all shadow-sm"
                    >
                        <a href={doc.download_url} target="_blank">
                            <Download className="h-3.5 w-3.5 mr-2 text-indigo-500" />
                            <span className="font-bold text-[10px] uppercase tracking-wider text-slate-700 dark:text-slate-200">Download</span>
                        </a>
                    </Button>
                )}
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={onMinimizeToggle}
                    className="h-9 w-9 p-0 rounded-full hover:bg-slate-200"
                >
                    <Minimize2 className="h-4 w-4 text-slate-500" />
                </Button>
            </div>
        </div>
      </div>

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10 p-0 md:p-4 gap-0 md:gap-4">
        
        {/* VIEWPORT 1: Document Viewer */}
        <AnimatePresence mode="popLayout">
            {viewerOpen && (
                <motion.div 
                    layout
                    initial={{ flex: 0, opacity: 0, scale: 0.98 }}
                    animate={{ 
                        flex: sidebarOpen ? "1 1 0%" : "1 1 100%", 
                        opacity: 1, 
                        scale: 1 
                    }}
                    exit={{ flex: 0, opacity: 0, scale: 0.98 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="h-full bg-white dark:bg-slate-900 md:rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/50 shadow-inner relative z-10"
                >
                    {doc.download_url ? (
                        <div className="w-full h-full relative">
                            <iframe
                                src={`${doc.download_url}#toolbar=0`}
                                className="w-full h-full border-none relative z-10"
                                title="Viewer"
                            />
                            {isResizing && <div className="absolute inset-0 z-20 bg-transparent" />}
                        </div>
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                            <FileText className="h-12 w-12 opacity-20" />
                            <p className="text-xs font-bold uppercase tracking-widest">No Document Loaded</p>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>

        {/* RESIZER */}
        {viewerOpen && sidebarOpen && (
            <div 
                className={cn(
                    "hidden md:flex w-1 hover:w-2 bg-transparent hover:bg-indigo-500/20 cursor-col-resize items-center justify-center transition-all duration-300 z-30 relative group",
                    isResizing ? "w-2 bg-indigo-500/30" : ""
                )}
                onMouseDown={startResizing}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-1 flex flex-col gap-1 items-center justify-center">
                    <div className="w-0.5 h-1 rounded-full bg-slate-300 group-hover:bg-indigo-500" />
                    <div className="w-0.5 h-1 rounded-full bg-slate-300 group-hover:bg-indigo-500" />
                    <div className="w-0.5 h-1 rounded-full bg-slate-300 group-hover:bg-indigo-500" />
                </div>
            </div>
        )}

        {/* VIEWPORT 2: Tools Sidebar */}
        <AnimatePresence mode="popLayout">
            {sidebarOpen && (
                <motion.div 
                    layout
                    initial={{ width: 0, opacity: 0, x: 20 }}
                    animate={{ 
                        width: !viewerOpen ? "100%" : typeof window !== 'undefined' && window.innerWidth < 768 ? "100%" : sidebarWidth,
                        opacity: 1, 
                        flexShrink: 0,
                        x: 0 
                    }}
                    exit={{ width: 0, opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="h-full bg-white/70 dark:bg-slate-950/80 backdrop-blur-3xl md:rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-2xl flex flex-col z-20 overflow-hidden relative"
                >
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
                        <div className="px-4 sm:px-6 pt-5 pb-4">
                            <TabsList className="w-full h-10 sm:h-12 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200/50 dark:border-white/5">
                                <TabsTrigger value="summary" className="flex-1 gap-2 rounded-lg h-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 data-[state=active]:shadow-md font-bold text-[10px] sm:text-xs uppercase tracking-tight">
                                    <Sparkles size={12} className="hidden sm:block" />
                                    <span>Summary</span>
                                </TabsTrigger>
                                <TabsTrigger value="chapters" className="flex-1 gap-2 rounded-lg h-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 data-[state=active]:shadow-md font-bold text-[10px] sm:text-xs uppercase tracking-tight">
                                    <Layers size={12} className="hidden sm:block" />
                                    <span>Chapters</span>
                                </TabsTrigger>
                                <TabsTrigger value="quiz" className="flex-1 gap-2 rounded-lg h-full data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-indigo-600 data-[state=active]:shadow-md font-bold text-[10px] sm:text-xs uppercase tracking-tight">
                                    <Brain size={12} className="hidden sm:block" />
                                    <span>Quiz</span>
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden">
                            <TabsContent value="summary" className="h-full mt-0 pb-6 px-4 sm:px-6 focus-visible:outline-none">
                                <ScrollArea className="h-full pr-3">
                                    <div className="bg-slate-50/50 dark:bg-slate-900/40 rounded-3xl p-6 sm:p-8 border border-white/40 dark:border-slate-800 shadow-sm mb-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                                                <Sparkles size={16} />
                                            </div>
                                            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">
                                                {summaryTitle}
                                            </h3>
                                        </div>
                                        <div className="prose prose-slate dark:prose-invert prose-sm max-w-none text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                                            {displaySummary || (
                                                <div className="text-center py-8">
                                                    {processingStatus === "processing" ? (
                                                        <div className="space-y-4">
                                                            <div className="flex items-center justify-center mb-4">
                                                                <ListRestart className="h-8 w-8 text-indigo-500 animate-spin opacity-50" />
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest animate-pulse">AI is reading document...</p>
                                                            <div className="space-y-2 mt-4">
                                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                                                                <div className="h-2 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                                                                <div className="h-2 w-5/6 bg-slate-100 dark:bg-slate-800 rounded-full animate-pulse" />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-slate-400 text-xs italic mb-4">No summary generated for this section yet.</p>
                                                            <Button variant="outline" size="sm" onClick={onSummarize} className="rounded-full border-indigo-500/20 text-indigo-500 hover:bg-indigo-500 hover:text-white transition-all">
                                                            Generate Chapter Summary
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mb-10">
                                        {[
                                            { label: "Complexity", value: "Intermediate" },
                                            { label: "Source", value: selectedChapter === -1 ? "Standard" : "Segment" }
                                        ].map((stat, i) => (
                                            <div key={i} className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 shadow-sm">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-1">{stat.label}</p>
                                                <p className="text-xs font-black text-slate-800 dark:text-slate-200">{stat.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="chapters" className="h-full mt-0 pb-6 px-4 sm:px-6 focus-visible:outline-none">
                                <ScrollArea className="h-full pr-3">
                                  <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 px-2 mb-4">Structure</h3>
                                    <button
                                      onClick={() => handleChapterClick(-1)}
                                      className={cn(
                                        "w-full text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 relative group active:scale-[0.98]",
                                        selectedChapter === -1
                                          ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 border-transparent shadow-xl shadow-slate-900/20"
                                          : "bg-white/50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:border-indigo-500/40"
                                      )}
                                    >
                                      <div className="flex items-center gap-4">
                                        <div className={cn(
                                          "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-inner",
                                          selectedChapter === -1 ? "bg-white/20" : "bg-indigo-500/10 text-indigo-500"
                                        )}>
                                          <BookOpen size={20} />
                                        </div>
                                        <div>
                                          <p className="text-xs sm:text-sm font-black tracking-tight">Full Document</p>
                                          <p className={cn("text-[9px] sm:text-[10px] font-medium mt-0.5", selectedChapter === -1 ? "text-slate-400" : "text-slate-500")}>Holistic Overview</p>
                                        </div>
                                      </div>
                                    </button>

                                    {hasChapters ? (
                                      doc.chapters.map((chapter: any, idx: number) => (
                                        <button
                                          key={idx}
                                          onClick={() => handleChapterClick(idx)}
                                          className={cn(
                                            "w-full text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all duration-300 group active:scale-[0.98]",
                                            selectedChapter === idx
                                              ? "bg-slate-900 dark:bg-slate-50 text-white dark:text-slate-900 border-transparent shadow-xl"
                                              : "bg-white/50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:border-indigo-500/40"
                                          )}
                                        >
                                          <div className="flex items-center gap-4">
                                            <div className={cn(
                                              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shadow-inner",
                                              selectedChapter === idx ? "bg-white/20" : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                                            )}>
                                              <span className="text-xs font-black">{idx + 1}</span>
                                            </div>
                                            <div className="min-w-0">
                                              <p className="text-xs sm:text-sm font-black tracking-tight truncate">{chapter.title}</p>
                                              <p className={cn("text-[9px] sm:text-[10px] font-medium mt-0.5", selectedChapter === idx ? "text-slate-400" : "text-slate-500")}>Topic Node</p>
                                            </div>
                                          </div>
                                        </button>
                                      ))
                                    ) : processingStatus === "processing" ? (
                                      <div className="space-y-3 px-2">
                                          {[1, 2, 3].map((i) => (
                                              <div key={i} className="h-20 w-full rounded-2xl sm:rounded-3xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 animate-pulse" />
                                          ))}
                                          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-center text-slate-400/60 mt-4">Generating structure...</p>
                                      </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                            <Search size={40} className="mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Scanning...</p>
                                        </div>
                                    )}
                                  </div>
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="quiz" className="h-full mt-0 pb-6 px-4 sm:px-6 focus-visible:outline-none">
                                <ScrollArea className="h-full pr-3">
                                    {quizElement}
                                </ScrollArea>
                            </TabsContent>
                        </div>
                    </Tabs>
                </motion.div>
            )}
        </AnimatePresence>
      </div>
    </div>
  );
}
