/**
 * Shared Type Definitions for Smart vCard Platform
 */

export type UserRole = 'super_admin' | 'company_admin' | 'employee' | 'individual';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  isVerified: boolean;
  suspended: boolean;
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  domain?: string;
  brandingColors: {
    primary: string;
    secondary: string;
    background: string;
  };
  status: 'pending' | 'approved';
  plan: 'free' | 'growth' | 'enterprise';
  createdAt: string;
}

export interface SocialLinks {
  website?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  youtube?: string;
  whatsapp?: string;
  calendly?: string;
}

export interface ContactButtons {
  email?: string;
  phone?: string;
  sms?: string;
}

export interface CustomField {
  id: string;
  label: string;
  value: string;
}

export interface BusinessCard {
  id: string;
  userId: string;
  companyId?: string;
  name: string;
  title: string; // e.g., "Alice Smith"
  designation: string; // e.g., "Senior Software Engineer"
  department?: string; // e.g., "Engineering"
  bio?: string;
  profilePhoto?: string; // base64 or URL
  companyLogo?: string; // base64 or URL
  templateId: 'modern' | 'minimalist' | 'classic' | 'neon' | 'glass';
  theme: {
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    backgroundColor: string;
    cardColor: string;
    fontFamily: string;
    borderRadius: string; // 'none' | 'sm' | 'md' | 'lg' | 'full'
  };
  portfolio: { id: string; url: string; title: string }[];
  socialLinks: SocialLinks;
  contactButtons: ContactButtons;
  customFields: CustomField[];
  views: number;
  scans: number;
  downloads: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  id: string;
  userId: string; // Who saved it
  cardId?: string; // Card it was saved from
  name: string;
  email: string;
  phone: string;
  company: string;
  title: string;
  note: string;
  tags: string[];
  category: string; // e.g., "Partner", "Client", "Lead", "Personal"
  isFavorite: boolean;
  createdAt: string;
}

export interface Lead {
  id: string;
  cardId: string; // Card that collected this lead
  cardUserId: string; // User who owns the card
  name: string;
  email: string;
  phone: string;
  company: string;
  notes: string;
  status: 'new' | 'contacted' | 'qualified' | 'lost';
  source: string; // e.g., "QR Scan", "Direct Link", "LinkedIn"
  createdAt: string;
}

export interface AnalyticsEvent {
  id: string;
  cardId: string;
  type: 'view' | 'scan' | 'download' | 'share';
  timestamp: string;
  country: string;
  city: string;
  device: string; // 'mobile' | 'desktop' | 'tablet'
  browser: string;
  referrer: string;
}

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
  userAgent?: string;
}
