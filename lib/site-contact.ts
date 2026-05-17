import { SITE_NAME } from "@/lib/seo/brand";

/** Public business contact — shown in footer, legal pages, and schema.org */
export const SITE_CONTACT = {
  businessName: SITE_NAME,
  email: "clawdage00@gmail.com",
  phone: "9074575374",
  phoneE164: "+919074575374",
  phoneDisplay: "+91 90745 75374",
  addressLines: [
    "1607, 2nd Main Rd",
    "Maruthi Layout, Royal Shelters",
    "Stage 4, Devarachikkana Halli",
    "Bengaluru, Karnataka 560114",
  ],
  locality: "Bengaluru",
  region: "Karnataka",
  postalCode: "560114",
  country: "IN",
} as const;

export function siteContactMailto(): string {
  return `mailto:${SITE_CONTACT.email}`;
}

export function siteContactTel(): string {
  return `tel:${SITE_CONTACT.phoneE164}`;
}

export function siteContactMapsUrl(): string {
  const query = encodeURIComponent(SITE_CONTACT.addressLines.join(", "));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
