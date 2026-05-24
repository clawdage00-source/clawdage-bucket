import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export type InvoiceLineItem = {
  description: string;
  hsn?: string;
  qty: number;
  rate: number;
  gstPercent: number;
};

export type InvoiceData = {
  businessName: string;
  businessAddress: string;
  gstin: string;
  phone: string;
  email: string;
  invoiceNo: string;
  invoiceDate: string;
  customerName: string;
  customerAddress: string;
  customerGstin: string;
  items: InvoiceLineItem[];
  notes: string;
  logoDataUrl: string | null;
  upiQrDataUrl: string | null;
  upiId: string;
};

function lineAmount(item: InvoiceLineItem): number {
  return item.qty * item.rate;
}

function gstAmount(item: InvoiceLineItem): number {
  return (lineAmount(item) * item.gstPercent) / 100;
}

export function computeInvoiceTotals(items: InvoiceLineItem[]) {
  const subtotal = items.reduce((s, i) => s + lineAmount(i), 0);
  const gstTotal = items.reduce((s, i) => s + gstAmount(i), 0);
  const cgst = gstTotal / 2;
  const sgst = gstTotal / 2;
  const grand = subtotal + gstTotal;
  return { subtotal, cgst, sgst, gstTotal, grand };
}

export function buildInvoicePdf(data: InvoiceData, thermal: boolean): Blob {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: thermal ? [80, 200] : "a4",
  });

  const pageW = doc.internal.pageSize.getWidth();
  let y = thermal ? 6 : 14;

  if (data.logoDataUrl) {
    try {
      const logoW = thermal ? 18 : 28;
      doc.addImage(data.logoDataUrl, "PNG", thermal ? (pageW - logoW) / 2 : 14, y, logoW, logoW * 0.6);
      y += thermal ? 14 : 22;
    } catch {
      /* skip bad logo */
    }
  }

  doc.setFontSize(thermal ? 10 : 16);
  doc.setFont("helvetica", "bold");
  doc.text(data.businessName || "Business Name", pageW / 2, y, { align: "center" });
  y += thermal ? 5 : 7;

  doc.setFontSize(thermal ? 7 : 9);
  doc.setFont("helvetica", "normal");
  const addrLines = doc.splitTextToSize(data.businessAddress || "", pageW - (thermal ? 8 : 28));
  doc.text(addrLines, pageW / 2, y, { align: "center" });
  y += addrLines.length * (thermal ? 3.2 : 4.5) + 2;

  if (data.gstin) {
    doc.text(`GSTIN: ${data.gstin}`, pageW / 2, y, { align: "center" });
    y += thermal ? 4 : 5;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(thermal ? 9 : 12);
  doc.text(thermal ? "TAX INVOICE" : "GST TAX INVOICE", pageW / 2, y, { align: "center" });
  y += thermal ? 5 : 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(thermal ? 7 : 9);
  const leftX = thermal ? 4 : 14;
  doc.text(`Invoice #: ${data.invoiceNo}`, leftX, y);
  doc.text(`Date: ${data.invoiceDate}`, pageW - leftX, y, { align: "right" });
  y += thermal ? 5 : 7;

  doc.text(`Bill To: ${data.customerName || "Customer"}`, leftX, y);
  y += thermal ? 4 : 5;
  if (data.customerAddress) {
    const custLines = doc.splitTextToSize(data.customerAddress, pageW - leftX * 2);
    doc.text(custLines, leftX, y);
    y += custLines.length * (thermal ? 3.2 : 4.5);
  }
  if (data.customerGstin) {
    doc.text(`GSTIN: ${data.customerGstin}`, leftX, y);
    y += thermal ? 4 : 5;
  }
  y += 2;

  const tableBody = data.items.map((item) => {
    const amt = lineAmount(item);
  const gst = gstAmount(item);
    return thermal
      ? [
          `${item.description}\n${item.qty}×₹${item.rate}`,
          `₹${(amt + gst).toFixed(2)}`,
        ]
      : [
          item.description,
          item.hsn ?? "—",
          String(item.qty),
          `₹${item.rate.toFixed(2)}`,
          `${item.gstPercent}%`,
          `₹${(amt + gst).toFixed(2)}`,
        ];
  });

  autoTable(doc, {
    startY: y,
    head: [
      thermal
        ? ["Item", "Amount"]
        : ["Description", "HSN", "Qty", "Rate", "GST", "Amount"],
    ],
    body: tableBody,
    theme: "grid",
    styles: { fontSize: thermal ? 7 : 9, cellPadding: thermal ? 1.5 : 2 },
    headStyles: { fillColor: [30, 64, 175], textColor: 255 },
    margin: { left: leftX, right: leftX },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 20;
  y = finalY + 4;

  const totals = computeInvoiceTotals(data.items);
  doc.setFontSize(thermal ? 7 : 10);
  const totalsX = pageW - leftX;
  doc.text(`Subtotal: ₹${totals.subtotal.toFixed(2)}`, totalsX, y, { align: "right" });
  y += thermal ? 4 : 5;
  if (totals.gstTotal > 0) {
    doc.text(`CGST: ₹${totals.cgst.toFixed(2)}`, totalsX, y, { align: "right" });
    y += thermal ? 4 : 5;
    doc.text(`SGST: ₹${totals.sgst.toFixed(2)}`, totalsX, y, { align: "right" });
    y += thermal ? 4 : 5;
  }
  doc.setFont("helvetica", "bold");
  doc.text(`Total: ₹${totals.grand.toFixed(2)}`, totalsX, y, { align: "right" });
  y += thermal ? 6 : 8;

  if (data.upiQrDataUrl && data.upiId) {
    const qrSize = thermal ? 22 : 32;
    doc.addImage(data.upiQrDataUrl, "PNG", (pageW - qrSize) / 2, y, qrSize, qrSize);
    y += qrSize + 3;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(thermal ? 6 : 8);
    doc.text(`Scan to pay · UPI: ${data.upiId}`, pageW / 2, y, { align: "center" });
    y += 5;
  }

  if (data.notes) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(thermal ? 6 : 8);
    const noteLines = doc.splitTextToSize(`Note: ${data.notes}`, pageW - leftX * 2);
    doc.text(noteLines, leftX, y);
  }

  return doc.output("blob");
}
