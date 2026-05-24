import * as XLSX from "xlsx";

export type BankTransaction = {
  date: string;
  description: string;
  debit: number | null;
  credit: number | null;
  balance: number | null;
  category: string;
};

const DATE_PATTERNS = [
  /\b(\d{2}[/-]\d{2}[/-]\d{2,4})\b/,
  /\b(\d{2}\s+[A-Za-z]{3}\s+\d{2,4})\b/,
  /\b(\d{4}[/-]\d{2}[/-]\d{2})\b/,
];

const AMOUNT_RE = /(?:₹|Rs\.?\s*)?([\d,]+\.\d{2}|\d{1,3}(?:,\d{2,3})*(?:\.\d{2})?)/gi;

const CATEGORY_RULES: { label: string; re: RegExp }[] = [
  { label: "UPI", re: /\b(upi|gpay|phonepe|paytm|bhim)\b/i },
  { label: "ATM", re: /\b(atm|cash wdl|cash withdrawal)\b/i },
  { label: "Salary", re: /\b(salary|payroll|neft cr-salary)\b/i },
  { label: "Transfer", re: /\b(neft|imps|rtgs|transfer)\b/i },
  { label: "Shopping", re: /\b(amazon|flipkart|swiggy|zomato|myntra)\b/i },
  { label: "Bills", re: /\b(electricity|mobile|broadband|recharge|bill)\b/i },
  { label: "Interest", re: /\b(interest|int\.?\s*paid)\b/i },
  { label: "Charges", re: /\b(charge|fee|penalty)\b/i },
];

function categorize(text: string): string {
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(text)) return rule.label;
  }
  return "Other";
}

function parseAmounts(line: string): number[] {
  const out: number[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(AMOUNT_RE.source, "gi");
  while ((m = re.exec(line)) !== null) {
    const raw = (m[1] ?? "").replace(/,/g, "");
    const n = Number(raw);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function extractDate(line: string): string | null {
  for (const re of DATE_PATTERNS) {
    const m = line.match(re);
    if (m?.[1]) return m[1];
  }
  return null;
}

/** Heuristic parser for Indian bank statement PDF text. */
export function parseBankStatementText(fullText: string): BankTransaction[] {
  const lines = fullText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const txs: BankTransaction[] = [];
  for (const line of lines) {
    const date = extractDate(line);
    const amounts = parseAmounts(line);
    if (!date || amounts.length === 0) continue;

    const desc = line
      .replace(date, "")
      .replace(/₹|Rs\.?/gi, "")
      .replace(/[\d,]+\.\d{2}/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (desc.length < 3) continue;

    let debit: number | null = null;
    let credit: number | null = null;
    let balance: number | null = null;

    if (amounts.length >= 3) {
      balance = amounts[amounts.length - 1] ?? null;
      debit = amounts[amounts.length - 3] ?? null;
      credit = amounts[amounts.length - 2] ?? null;
    } else if (amounts.length === 2) {
      const amt = amounts[0] ?? 0;
      balance = amounts[1] ?? null;
      if (/\b(cr|credit|deposit|salary|received)\b/i.test(line)) {
        credit = amt;
      } else {
        debit = amt;
      }
    } else {
      const amt = amounts[0] ?? 0;
      if (/\b(cr|credit|deposit|salary|received)\b/i.test(line)) {
        credit = amt;
      } else {
        debit = amt;
      }
    }

    txs.push({
      date,
      description: desc.slice(0, 240),
      debit,
      credit,
      balance,
      category: categorize(`${desc} ${line}`),
    });
  }

  const seen = new Set<string>();
  return txs.filter((t) => {
    const key = `${t.date}|${t.description}|${t.debit}|${t.credit}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function transactionsToXlsx(transactions: BankTransaction[]): Blob {
  const rows = transactions.map((t) => ({
    Date: t.date,
    Description: t.description,
    Category: t.category,
    Debit: t.debit ?? "",
    Credit: t.credit ?? "",
    Balance: t.balance ?? "",
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");
  const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function transactionsToCsv(transactions: BankTransaction[]): Blob {
  const header = "Date,Description,Category,Debit,Credit,Balance\n";
  const body = transactions
    .map((t) =>
      [
        `"${t.date.replace(/"/g, '""')}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        `"${t.category.replace(/"/g, '""')}"`,
        t.debit ?? "",
        t.credit ?? "",
        t.balance ?? "",
      ].join(","),
    )
    .join("\n");
  return new Blob([header + body], { type: "text/csv;charset=utf-8" });
}
