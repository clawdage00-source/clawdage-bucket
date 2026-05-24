"use client";

import { QRCodeCanvas } from "qrcode.react";
import { Download, Loader2, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";

import { ToolChrome } from "@/components/tools/shared-tool-chrome";
import { trackToolUse } from "@/lib/analytics";
import { downloadBlob } from "@/lib/download-blob";
import { buildUpiPayload } from "@/lib/qr-payloads";
import {
  buildInvoicePdf,
  computeInvoiceTotals,
  type InvoiceLineItem,
} from "@/lib/invoice-pdf";

const emptyItem = (): InvoiceLineItem => ({
  description: "",
  hsn: "",
  qty: 1,
  rate: 0,
  gstPercent: 18,
});

export function InvoiceGeneratorTool() {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const [thermal, setThermal] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [gstin, setGstin] = useState("");
  const [phone, setPhone] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("INV-001");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().slice(0, 10));
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerGstin, setCustomerGstin] = useState("");
  const [notes, setNotes] = useState("");
  const [upiId, setUpiId] = useState("");
  const [upiName, setUpiName] = useState("");
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [items, setItems] = useState<InvoiceLineItem[]>([emptyItem(), emptyItem()]);
  const [busy, setBusy] = useState(false);

  const totals = useMemo(() => computeInvoiceTotals(items), [items]);

  const upiPayload = useMemo(
    () =>
      upiId.trim()
        ? buildUpiPayload(upiId, upiName || businessName, String(totals.grand))
        : "",
    [upiId, upiName, businessName, totals.grand],
  );

  const exportPdf = async () => {
    setBusy(true);
    try {
      let upiQrDataUrl: string | null = null;
      if (upiPayload && qrRef.current) {
        upiQrDataUrl = qrRef.current.toDataURL("image/png");
      }
      const blob = buildInvoicePdf(
        {
          businessName,
          businessAddress,
          gstin,
          phone,
          email: "",
          invoiceNo,
          invoiceDate,
          customerName,
          customerAddress,
          customerGstin,
          items: items.filter((i) => i.description.trim()),
          notes,
          logoDataUrl,
          upiQrDataUrl,
          upiId,
        },
        thermal,
      );
      downloadBlob(blob, `${invoiceNo || "invoice"}.pdf`, "invoice-generator");
      trackToolUse("invoice-generator", { thermal });
    } finally {
      setBusy(false);
    }
  };

  const fieldClass =
    "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <ToolChrome
      title="Invoice Generator — GST & Thermal Receipt"
      description="Create GST tax invoices and thermal receipts for shops, freelancers, and small businesses. Add your logo, line items, and UPI QR — export PDF instantly."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={thermal} onChange={(e) => setThermal(e.target.checked)} />
              Thermal receipt (80 mm)
            </label>
            <label className="cursor-pointer rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium hover:bg-slate-50">
              Upload logo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const r = new FileReader();
                  r.onload = () => setLogoDataUrl(String(r.result));
                  r.readAsDataURL(f);
                }}
              />
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">Business name</label>
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={fieldClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">Address</label>
              <textarea value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} rows={2} className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">GSTIN</label>
              <input value={gstin} onChange={(e) => setGstin(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Invoice #</label>
              <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Date</label>
              <input type="date" value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} className={fieldClass} />
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <p className="text-sm font-semibold text-slate-900">Bill to</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <input placeholder="Customer name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <textarea placeholder="Customer address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} rows={2} className={fieldClass} />
              </div>
              <div className="sm:col-span-2">
                <input placeholder="Customer GSTIN (optional)" value={customerGstin} onChange={(e) => setCustomerGstin(e.target.value)} className={fieldClass} />
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Line items</p>
              <button type="button" onClick={() => setItems((i) => [...i, emptyItem()])} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                <Plus className="h-3.5 w-3.5" /> Add row
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 rounded-lg bg-slate-50 p-2">
                  <input placeholder="Description" value={item.description} onChange={(e) => setItems((rows) => rows.map((r, i) => i === idx ? { ...r, description: e.target.value } : r))} className="col-span-12 rounded border border-slate-300 px-2 py-1.5 text-xs sm:col-span-5" />
                  <input placeholder="HSN" value={item.hsn} onChange={(e) => setItems((rows) => rows.map((r, i) => i === idx ? { ...r, hsn: e.target.value } : r))} className="col-span-3 rounded border border-slate-300 px-2 py-1.5 text-xs sm:col-span-2" />
                  <input type="number" min={1} value={item.qty} onChange={(e) => setItems((rows) => rows.map((r, i) => i === idx ? { ...r, qty: Number(e.target.value) || 1 } : r))} className="col-span-3 rounded border border-slate-300 px-2 py-1.5 text-xs sm:col-span-1" />
                  <input type="number" min={0} step="0.01" value={item.rate} onChange={(e) => setItems((rows) => rows.map((r, i) => i === idx ? { ...r, rate: Number(e.target.value) || 0 } : r))} className="col-span-3 rounded border border-slate-300 px-2 py-1.5 text-xs sm:col-span-2" />
                  <input type="number" min={0} value={item.gstPercent} onChange={(e) => setItems((rows) => rows.map((r, i) => i === idx ? { ...r, gstPercent: Number(e.target.value) || 0 } : r))} className="col-span-3 rounded border border-slate-300 px-2 py-1.5 text-xs sm:col-span-1" />
                  <button type="button" onClick={() => setItems((rows) => rows.filter((_, i) => i !== idx))} className="col-span-12 flex items-center justify-center rounded border border-slate-300 py-1 text-slate-500 sm:col-span-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 border-t border-slate-200 pt-3">
            <div>
              <label className="text-xs font-medium text-slate-700">UPI ID (for QR payment)</label>
              <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="name@upi" className={fieldClass} />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-700">Payee name</label>
              <input value={upiName} onChange={(e) => setUpiName(e.target.value)} className={fieldClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-slate-700">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={fieldClass} />
            </div>
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900">Preview totals</p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-600">Subtotal</dt><dd>₹{totals.subtotal.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">CGST</dt><dd>₹{totals.cgst.toFixed(2)}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-600">SGST</dt><dd>₹{totals.sgst.toFixed(2)}</dd></div>
            <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold"><dt>Total</dt><dd>₹{totals.grand.toFixed(2)}</dd></div>
          </dl>
          {upiPayload ? (
            <div className="flex flex-col items-center rounded-xl bg-slate-50 p-4">
              <QRCodeCanvas value={upiPayload} size={140} ref={qrRef} />
              <p className="mt-2 text-xs text-slate-500">UPI QR on invoice</p>
            </div>
          ) : null}
          <button type="button" disabled={busy} onClick={() => void exportPdf()} className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download PDF invoice
          </button>
          <p className="text-xs text-slate-500">Perfect for laptop repair shops, Instagram sellers, freelancers, and kirana stores.</p>
        </aside>
      </div>
    </ToolChrome>
  );
}
