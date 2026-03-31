"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileJson, 
  FileSpreadsheet, 
  FileText,
  Loader2,
  CheckCircle,
  Share2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ExportData {
  user: {
    full_name: string;
    email: string;
    organization: string;
    department: string;
  };
  analytics: any;
  history: any[];
}

export function ExportControls({ data }: { data: ExportData | null }) {
  const [exporting, setExporting] = useState<string | null>(null);

  const exportCSV = async () => {
    if (!data) return;
    setExporting("csv");
    
    try {
      const headers = ["Date", "Score (%)", "Type"];
      const rows = data.history.map(h => [
        h.date, 
        h.score || h.predicted_score,
        h.is_forecast ? "Forecast" : "Actual"
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `lokai_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV Export Complete");
    } catch (e) {
      toast.error("Failed to export CSV");
    } finally {
      setExporting(null);
    }
  };

  const exportPDF = async () => {
    if (!data) return;
    setExporting("pdf");

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();

      // Header
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, pageWidth, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("LokAI | Learning Analytics Report", 15, 25);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 15, 32);

      // User Info Section
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Candidate Profile", 15, 55);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text([
        `Name: ${data.user.full_name}`,
        `Email: ${data.user.email}`,
        `Organization: ${data.user.organization}`,
        `Department: ${data.user.department}`
      ], 15, 65);

      // Performance Summary
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Executive Summary", 15, 100);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      const summaryText = `Overall Readiness Score: ${data.analytics.readiness_score}% from ${data.analytics.total_quizzes_taken} attempts.`;
      doc.text(summaryText, 15, 110);

      // Category Table
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("Performance by Category", 15, 130);

      autoTable(doc, {
        startY: 135,
        head: [['Category', 'Accuracy (%)', 'Total Questions']],
        body: data.analytics.progress_by_category.map((c: any) => [
          c.category.replace(/_/g, ' '),
          c.accuracy,
          c.total_questions
        ]),
        theme: 'striped',
        headStyles: { fillColor: [99, 102, 241] } // indigo-500
      });

      // Footer
      const finalY = (doc as any).lastAutoTable.finalY || 200;
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text("This is an automatically generated report from LokAI Platform.", pageWidth / 2, 285, { align: 'center' });

      doc.save(`LokAI_Performance_Report_${data.user.full_name.replace(/\s+/g, '_')}.pdf`);
      toast.success("PDF Report Generated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to generate PDF");
    } finally {
      setExporting(null);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-white border-slate-200 hover:bg-slate-50 text-slate-900 font-bold px-6 h-12 rounded-xl flex items-center gap-2 shadow-sm transition-all active:scale-95"
          disabled={!!exporting}
        >
          {exporting ? (
             <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
             <Download className="h-4 w-4" />
          )}
          {exporting ? "Exporting..." : "Export Report"}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl border-slate-200 shadow-2xl">
        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-2 py-2">Select Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={exportPDF}
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer focus:bg-indigo-50 focus:text-indigo-600 transition-colors"
        >
          <div className="h-8 w-8 rounded-lg bg-red-50 flex items-center justify-center text-red-500">
            <FileText className="h-4 w-4" />
          </div>
          <div>
             <p className="text-sm font-bold">Professional PDF</p>
             <p className="text-[10px] opacity-70">Official analytics summary</p>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={exportCSV}
          className="flex items-center gap-3 p-3 rounded-lg cursor-pointer focus:bg-emerald-50 focus:text-emerald-600 transition-colors mt-1"
        >
          <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500">
            <FileSpreadsheet className="h-4 w-4" />
          </div>
          <div>
             <p className="text-sm font-bold">CSV Spreadsheet</p>
             <p className="text-[10px] opacity-70">Raw data for Excel</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
