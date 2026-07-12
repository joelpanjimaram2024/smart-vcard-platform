import { BusinessCard } from '../types';

/**
 * Generates and downloads a standard VCF (vCard) file for a digital business card
 */
export function downloadVCard(card: BusinessCard) {
  const vcardParts = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${card.name};;;;`,
    `FN:${card.name}`,
    `TITLE:${card.designation}`,
    `ORG:${card.companyName || ''}`,
    `DEPT:${card.department || ''}`,
  ];

  if (card.contactButtons.phone) {
    vcardParts.push(`TEL;TYPE=CELL:${card.contactButtons.phone}`);
  }

  if (card.contactButtons.email) {
    vcardParts.push(`EMAIL;TYPE=INTERNET,WORK:${card.contactButtons.email}`);
  }

  if (card.socialLinks.website) {
    vcardParts.push(`URL:${card.socialLinks.website}`);
  }

  if (card.address) {
    vcardParts.push(`ADR;TYPE=WORK:;;${card.address};;;;`);
  }

  // Add notes/bio
  if (card.bio) {
    vcardParts.push(`NOTE:${card.bio.replace(/\n/g, '\\n')}`);
  }

  // Append other social handles as standard custom note parameters
  const socialHandles: string[] = [];
  if (card.socialLinks.linkedin) socialHandles.push(`LinkedIn: ${card.socialLinks.linkedin}`);
  if (card.socialLinks.github) socialHandles.push(`GitHub: ${card.socialLinks.github}`);
  if (card.socialLinks.twitter) socialHandles.push(`Twitter: ${card.socialLinks.twitter}`);
  if (card.socialLinks.whatsapp) socialHandles.push(`WhatsApp: ${card.socialLinks.whatsapp}`);

  if (socialHandles.length > 0) {
    vcardParts.push(`X-SOCIALPROFILE:${socialHandles.join(' | ')}`);
  }

  vcardParts.push('END:VCARD');
  
  const vcardString = vcardParts.join('\n');
  const blob = new Blob([vcardString], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${card.name.trim().replace(/\s+/g, '_')}_contact.vcf`);
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
