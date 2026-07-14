import type { Card } from "./mock-store";

export function toVCard(c: Card): string {
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${c.name}`,
    `N:${c.name};;;;`,
    c.title && `TITLE:${c.title}`,
    c.company && `ORG:${c.company}`,
    c.email && `EMAIL;TYPE=INTERNET:${c.email}`,
    c.phone && `TEL;TYPE=CELL:${c.phone}`,
    c.website && `URL:${c.website.startsWith("http") ? c.website : `https://${c.website}`}`,
    c.linkedin && `X-SOCIALPROFILE;TYPE=linkedin:https://linkedin.com/in/${c.linkedin}`,
    c.bio && `NOTE:${c.bio}`,
    "END:VCARD",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function downloadVCard(c: Card) {
  const blob = new Blob([toVCard(c)], { type: "text/vcard;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${c.name.replace(/\s+/g, "_")}.vcf`;
  a.click();
  URL.revokeObjectURL(url);
}
