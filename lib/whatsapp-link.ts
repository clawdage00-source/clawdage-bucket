export type CountryDial = { code: string; label: string; dial: string };

export const WHATSAPP_COUNTRIES: CountryDial[] = [
  { code: "IN", label: "India", dial: "91" },
  { code: "US", label: "United States", dial: "1" },
  { code: "GB", label: "United Kingdom", dial: "44" },
  { code: "AE", label: "UAE", dial: "971" },
  { code: "SG", label: "Singapore", dial: "65" },
  { code: "AU", label: "Australia", dial: "61" },
  { code: "CA", label: "Canada", dial: "1" },
  { code: "PK", label: "Pakistan", dial: "92" },
  { code: "BD", label: "Bangladesh", dial: "880" },
  { code: "NP", label: "Nepal", dial: "977" },
];

export function normalizePhone(dial: string, phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const d = dial.replace(/\D/g, "");
  if (digits.startsWith(d)) return digits;
  return `${d}${digits}`;
}

export function buildWhatsAppUrl(dial: string, phone: string, message: string): string {
  const num = normalizePhone(dial, phone);
  if (!num) return "";
  const base = `https://wa.me/${num}`;
  const text = message.trim();
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}
