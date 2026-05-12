function escapeWifiField(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/:/g, "\\:")
    .replace(/"/g, '\\"');
}

export function buildUrlPayload(url: string): string {
  const t = url.trim();
  return t.length > 0 ? t : " ";
}

export function buildWifiPayload(
  ssid: string,
  password: string,
  encryption: "WPA" | "WEP",
): string {
  const enc = encryption === "WEP" ? "WEP" : "WPA";
  const s = escapeWifiField(ssid.trim());
  const p = escapeWifiField(password);
  return `WIFI:T:${enc};S:${s};P:${p};;`;
}

export function buildVcardPayload(fields: {
  name: string;
  phone: string;
  email: string;
  company: string;
}): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${fields.name.trim() || " "}`,
    fields.phone.trim() ? `TEL:${fields.phone.trim()}` : "",
    fields.email.trim() ? `EMAIL:${fields.email.trim()}` : "",
    fields.company.trim() ? `ORG:${fields.company.trim()}` : "",
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\n");
}

/** Standard UPI intent URI (NPCI-style). */
export function buildUpiPayload(pa: string, payeeName: string, amount?: string): string {
  const id = pa.trim();
  const pn = payeeName.trim() || id;
  const params = new URLSearchParams();
  params.set("pa", id);
  params.set("pn", pn);
  params.set("cu", "INR");
  const am = amount?.trim();
  if (am && !Number.isNaN(Number(am))) {
    params.set("am", am);
  }
  return `upi://pay?${params.toString()}`;
}
