/**
 * GET /api/admin/invoices/[id]/pdf — Download invoice as PDF
 *
 * Generates a professional PDF invoice on the fly using raw PDF stream generation
 * (no external dependencies required).
 *
 * @module api/admin/invoices/[id]/pdf
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin-client";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.organization_id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const admin = createAdminClient();

  // Fetch invoice with organization info
  const { data: invoice, error } = await admin
    .from("invoices")
    .select("*, organization:organizations(id, name)")
    .eq("id", id)
    .single();

  if (error || !invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  // Org admins can only download their own invoices; super admins can download any
  if (
    profile.role !== "super_admin" &&
    invoice.organization_id !== profile.organization_id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pdfBytes = generateInvoicePDF(invoice);

  return new NextResponse(new Uint8Array(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.invoice_number}.pdf"`,
      "Content-Length": String(pdfBytes.length),
    },
  });
}

/* ═══════════════════════════════════════════════════════
 *  Raw PDF Generation (no external dependencies)
 *
 *  Builds a valid PDF 1.4 document from scratch using
 *  text operators. Supports basic layout with lines,
 *  rectangles, and multi-line text.
 * ═══════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function generateInvoicePDF(invoice: any): Buffer {
  const orgName =
    invoice.organization?.name || "Organization";
  const lines: string[] = [];
  const objects: string[] = [];
  const offsets: number[] = [];
  let currentObj = 0;

  function addObj(content: string) {
    currentObj++;
    offsets.push(Buffer.byteLength(lines.join(""), "utf-8"));
    const obj = `${currentObj} 0 obj\n${content}\nendobj\n`;
    lines.push(obj);
    objects.push(obj);
    return currentObj;
  }

  // 1. Catalog
  addObj("<< /Type /Catalog /Pages 2 0 R >>");

  // 2. Pages
  addObj("<< /Type /Pages /Kids [3 0 R] /Count 1 >>");

  // Build the page content stream
  const contentLines = buildContentStream(invoice, orgName);
  const contentStr = contentLines.join("\n");
  const contentLength = Buffer.byteLength(contentStr, "utf-8");

  // 4. Content stream (added before page so we know the ref)
  const contentObjNum = currentObj + 2; // will be obj 5
  const fontObjNum = currentObj + 3; // will be obj 6
  const fontBoldObjNum = currentObj + 4; // will be obj 7

  // 3. Page
  addObj(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] ` +
      `/Contents ${contentObjNum} 0 R ` +
      `/Resources << /Font << /F1 ${fontObjNum} 0 R /F2 ${fontBoldObjNum} 0 R >> >> >>`
  );

  // 4. (placeholder for numbering—actually stream is next)
  // Stream object
  addObj(
    `<< /Length ${contentLength} >>\nstream\n${contentStr}\nendstream`
  );

  // 5. Font (Helvetica)
  addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
  );

  // 6. Font Bold (Helvetica-Bold)
  addObj(
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
  );

  // Build PDF
  const header = "%PDF-1.4\n";
  const body = lines.join("");

  // Cross-reference table
  const xrefOffset = Buffer.byteLength(header + body, "utf-8");
  let xref = `xref\n0 ${currentObj + 1}\n`;
  xref += "0000000000 65535 f \n";
  for (let i = 0; i < offsets.length; i++) {
    const off = offsets[i] + Buffer.byteLength(header, "utf-8");
    xref += `${String(off).padStart(10, "0")} 00000 n \n`;
  }

  const trailer =
    `trailer\n<< /Size ${currentObj + 1} /Root 1 0 R >>\n` +
    `startxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(header + body + xref + trailer, "utf-8");
}

function escPdf(str: string): string {
  return str
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function formatNPR(amount: number): string {
  return `Rs. ${Number(amount).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildContentStream(invoice: any, orgName: string): string[] {
  const s: string[] = [];
  let y = 790; // start from top

  const left = 50;
  const right = 545;

  // ── Header Background ──
  s.push("0.12 0.12 0.18 rg"); // dark slate
  s.push(`${left} ${y - 10} ${right - left} 60 re f`);

  // ── Title ──
  s.push("BT");
  s.push("/F2 22 Tf");
  s.push("1 1 1 rg"); // white
  s.push(`${left + 20} ${y + 10} Td`);
  s.push(`(${escPdf("LOK.AI")}) Tj`);
  s.push("ET");

  // ── INVOICE label ──
  s.push("BT");
  s.push("/F2 18 Tf");
  s.push("1 1 1 rg");
  s.push(`${right - 150} ${y + 10} Td`);
  s.push("(INVOICE) Tj");
  s.push("ET");

  y -= 30;

  // ── Invoice details ──
  y -= 40;
  s.push("0.2 0.2 0.2 rg"); // dark text

  // Left column: Bill To
  s.push("BT");
  s.push("/F2 10 Tf");
  s.push(`${left} ${y} Td`);
  s.push("(Bill To:) Tj");
  s.push("ET");

  y -= 16;
  s.push("BT");
  s.push("/F1 10 Tf");
  s.push("0.3 0.3 0.3 rg");
  s.push(`${left} ${y} Td`);
  s.push(`(${escPdf(orgName)}) Tj`);
  s.push("ET");

  // Right column: Invoice meta
  let ry = y + 16;
  const metaX = right - 200;

  const metaItems = [
    ["Invoice #:", invoice.invoice_number],
    ["Issue Date:", formatDate(invoice.issue_date)],
    ["Due Date:", formatDate(invoice.due_date)],
    ["Status:", (invoice.status || "").toUpperCase()],
  ];

  for (const [label, value] of metaItems) {
    s.push("BT");
    s.push("/F2 9 Tf");
    s.push("0.4 0.4 0.4 rg");
    s.push(`${metaX} ${ry} Td`);
    s.push(`(${escPdf(label)}) Tj`);
    s.push("ET");

    s.push("BT");
    s.push("/F1 9 Tf");
    s.push("0.2 0.2 0.2 rg");
    s.push(`${metaX + 75} ${ry} Td`);
    s.push(`(${escPdf(String(value))}) Tj`);
    s.push("ET");

    ry -= 16;
  }

  // ── Separator line ──
  y -= 50;
  s.push("0.85 0.85 0.85 rg");
  s.push(`${left} ${y} ${right - left} 1 re f`);

  // ── Table Header ──
  y -= 25;
  s.push("0.95 0.95 0.97 rg");
  s.push(`${left} ${y - 5} ${right - left} 22 re f`);

  s.push("BT");
  s.push("/F2 10 Tf");
  s.push("0.3 0.3 0.3 rg");
  s.push(`${left + 10} ${y} Td`);
  s.push("(Description) Tj");
  s.push("ET");

  s.push("BT");
  s.push("/F2 10 Tf");
  s.push(`${right - 120} ${y} Td`);
  s.push("(Amount) Tj");
  s.push("ET");

  // ── Table Row: Subscription ──
  y -= 30;
  const description = invoice.notes
    ? invoice.notes.split("—")[0]?.trim() || "Subscription"
    : "Subscription Payment";

  s.push("BT");
  s.push("/F1 10 Tf");
  s.push("0.2 0.2 0.2 rg");
  s.push(`${left + 10} ${y} Td`);
  s.push(`(${escPdf(description)}) Tj`);
  s.push("ET");

  s.push("BT");
  s.push("/F1 10 Tf");
  s.push(`${right - 120} ${y} Td`);
  s.push(`(${escPdf(formatNPR(invoice.amount))}) Tj`);
  s.push("ET");

  // ── Tax row (if any) ──
  if (Number(invoice.tax_amount) > 0) {
    y -= 22;
    s.push("BT");
    s.push("/F1 9 Tf");
    s.push("0.4 0.4 0.4 rg");
    s.push(`${left + 10} ${y} Td`);
    s.push("(Tax) Tj");
    s.push("ET");

    s.push("BT");
    s.push("/F1 9 Tf");
    s.push(`${right - 120} ${y} Td`);
    s.push(`(${escPdf(formatNPR(invoice.tax_amount))}) Tj`);
    s.push("ET");
  }

  // ── Separator ──
  y -= 20;
  s.push("0.85 0.85 0.85 rg");
  s.push(`${right - 200} ${y} 200 1 re f`);

  // ── Total ──
  y -= 25;
  s.push("BT");
  s.push("/F2 12 Tf");
  s.push("0.12 0.12 0.18 rg");
  s.push(`${right - 200} ${y} Td`);
  s.push("(Total:) Tj");
  s.push("ET");

  s.push("BT");
  s.push("/F2 12 Tf");
  s.push(`${right - 120} ${y} Td`);
  s.push(`(${escPdf(formatNPR(invoice.total_amount))}) Tj`);
  s.push("ET");

  // ── Payment Info ──
  if (invoice.notes) {
    y -= 40;
    s.push("0.85 0.85 0.85 rg");
    s.push(`${left} ${y + 5} ${right - left} 1 re f`);
    y -= 15;

    s.push("BT");
    s.push("/F2 9 Tf");
    s.push("0.4 0.4 0.4 rg");
    s.push(`${left} ${y} Td`);
    s.push("(Payment Details:) Tj");
    s.push("ET");

    y -= 14;
    // Truncate long notes
    const notesText =
      invoice.notes.length > 90
        ? invoice.notes.substring(0, 90) + "..."
        : invoice.notes;
    s.push("BT");
    s.push("/F1 8 Tf");
    s.push("0.4 0.4 0.4 rg");
    s.push(`${left} ${y} Td`);
    s.push(`(${escPdf(notesText)}) Tj`);
    s.push("ET");
  }

  // ── PO Number (if any) ──
  if (invoice.purchase_order_number) {
    y -= 20;
    s.push("BT");
    s.push("/F1 9 Tf");
    s.push("0.4 0.4 0.4 rg");
    s.push(`${left} ${y} Td`);
    s.push(
      `(PO Number: ${escPdf(invoice.purchase_order_number)}) Tj`
    );
    s.push("ET");
  }

  // ── Footer ──
  s.push("0.85 0.85 0.85 rg");
  s.push(`${left} 60 ${right - left} 1 re f`);

  s.push("BT");
  s.push("/F1 8 Tf");
  s.push("0.5 0.5 0.5 rg");
  s.push(`${left} 45 Td`);
  s.push(`(${escPdf("LOK.AI — Generated automatically. Thank you for your business.")}) Tj`);
  s.push("ET");

  s.push("BT");
  s.push("/F1 8 Tf");
  s.push("0.6 0.6 0.6 rg");
  s.push(`${left} 32 Td`);
  s.push(`(${escPdf(`Currency: NPR (Nepalese Rupees) | Invoice: ${invoice.invoice_number}`)}) Tj`);
  s.push("ET");

  return s;
}
