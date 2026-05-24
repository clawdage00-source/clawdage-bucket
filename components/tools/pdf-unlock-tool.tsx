"use client";

import { Loader2, LockOpen, Trash2 } from "lucide-react";
import { useCallback, useState } from "react";

import { DropZone, ToolChrome, downloadUint8, formatBytes } from "@/components/tools/shared-tool-chrome";
import { trackToolUse } from "@/lib/analytics";
import { unlockErrorMessage, unlockPdfFile } from "@/lib/pdf-unlock";

type QueueItem = {
  id: string;
  file: File;
  status: "pending" | "done" | "error";
  message?: string;
};

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function PdfUnlockTool() {
  const [password, setPassword] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [busy, setBusy] = useState(false);

  const addFiles = useCallback((files: FileList) => {
    const pdfs = [...files].filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (pdfs.length === 0) return;
    setQueue((q) => [
      ...q,
      ...pdfs.map((file) => ({ id: makeId(), file, status: "pending" as const })),
    ]);
  }, []);

  const unlockAll = async () => {
    if (queue.length === 0) return;
    setBusy(true);
    let ok = 0;
    for (const item of queue) {
      if (item.status === "done") {
        ok += 1;
        continue;
      }
      try {
        const bytes = new Uint8Array(await item.file.arrayBuffer());
        const out = await unlockPdfFile(bytes, password);
        const name = item.file.name.replace(/\.pdf$/i, "") + "-unlocked.pdf";
        downloadUint8(out, name);
        setQueue((q) =>
          q.map((x) => (x.id === item.id ? { ...x, status: "done", message: "Downloaded" } : x)),
        );
        ok += 1;
      } catch (err) {
        setQueue((q) =>
          q.map((x) =>
            x.id === item.id ? { ...x, status: "error", message: unlockErrorMessage(err) } : x,
          ),
        );
      }
    }
    if (ok > 0) trackToolUse("pdf-unlock", { count: ok });
    setBusy(false);
  };

  return (
    <ToolChrome
      title="PDF Unlock — Remove Password"
      description="Remove PDF passwords locally in your browser. Drag and drop one or many protected PDFs — nothing is uploaded to our servers."
    >
      <div className="mx-auto max-w-xl space-y-5">
        <DropZone
          accept="application/pdf,.pdf"
          multiple
          label="Drop protected PDFs here"
          hint="Bulk unlock supported · Max ~25 MB per file recommended"
          onFiles={addFiles}
        />

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <label className="block text-sm font-medium text-slate-800">PDF password (if required)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter the document password"
            className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none ring-blue-500 focus:ring-2"
            autoComplete="off"
          />
          <p className="mt-2 text-xs text-slate-500">
            Owner-password PDFs may unlock without a user password. Wrong passwords show an error per file.
          </p>
        </div>

        {queue.length > 0 ? (
          <ul className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
            {queue.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-800">{item.file.name}</p>
                  <p className="text-xs text-slate-500">
                    {formatBytes(item.file.size)}
                    {item.message ? ` · ${item.message}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setQueue((q) => q.filter((x) => x.id !== item.id))}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-200"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        <button
          type="button"
          disabled={busy || queue.length === 0}
          onClick={() => void unlockAll()}
          className="flex w-full min-h-[48px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LockOpen className="h-4 w-4" />}
          Unlock &amp; download
        </button>
      </div>
    </ToolChrome>
  );
}
