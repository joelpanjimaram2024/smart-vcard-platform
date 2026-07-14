// @ts-ignore - express types require esModuleInterop
import express from 'express';
// @ts-ignore - path types require esModuleInterop
import path from 'path';
// @ts-ignore - fs types require esModuleInterop
import fs from 'fs';
// @ts-ignore - crypto types require esModuleInterop
import crypto from 'crypto';
// @ts-ignore - cors types require esModuleInterop
import cors from 'cors';
// @ts-ignore - helmet types require esModuleInterop
import helmet from 'helmet';
// @ts-ignore - rateLimit types require esModuleInterop
import rateLimit from 'express-rate-limit';
// @ts-ignore - vite types have rollup resolution issues with moduleResolution bundler
import { createServer as createViteServer } from 'vite';
import type { Request, Response } from 'express';
import {
  User, UserRole, Company, BusinessCard, Contact, Lead,
  AnalyticsEvent, SystemNotification, ActivityLog, SocialLinks
} from './src/types';

// Destructure for direct usage
const { join } = path;
const { readFileSync, writeFileSync, existsSync } = fs;
const { createHmac } = crypto;

// JWT implementation using native Node.js crypto module
const JWT_SECRET = process.env.JWT_SECRET || 'smart-vcard-enterprise-secret-key-2026';

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login requests per windowMs
  message: { error: 'Too many authentication attempts, please try again later' }
});

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 API requests per windowMs
  message: { error: 'Too many requests, please try again later' }
});

function generateToken(userId: string, role: UserRole): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({ userId, role, exp: Date.now() + 24 * 60 * 60 * 1000 })).toString('base64url');
  const signature = createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token: string): { userId: string; role: UserRole } | null {
  try {
    const [header, payload, signature] = token.split('.');
    if (!header || !payload || !signature) return null;
    const expectedSignature = createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest('base64url');
    if (signature !== expectedSignature) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.exp < Date.now()) return null; // Expired
    return { userId: data.userId, role: data.role };
  } catch {
    return null;
  }
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'card';
}

function generateUniquePublicId(): string {
  let publicId = '';
  do {
    publicId = `pub_${Math.random().toString(36).slice(2, 10)}`;
  } while (db.cards.some(card => card.publicId === publicId));
  return publicId;
}

function generateUniqueSlug(name: string, excludeCardId?: string): string {
  const base = slugify(name);
  let suffix = 0;
  let candidate = base;

  while (db.cards.some(card => card.id !== excludeCardId && card.slug === candidate)) {
    suffix += 1;
    candidate = `${base}-${suffix}`;
  }

  return candidate;
}

function normalizeCard(card: BusinessCard): BusinessCard {
  const company = card.companyId ? db.companies.find(entry => entry.id === card.companyId) : null;
  const publicId = card.publicId || generateUniquePublicId();
  const companyName = card.companyName || company?.name || '';
  const slugSource = card.slug || `${card.name}-${publicId.slice(-4)}`;

  return {
    ...card,
    publicId,
    slug: generateUniqueSlug(slugSource, card.id),
    companyName,
    address: card.address || '',
    contactButtons: card.contactButtons || {},
    socialLinks: card.socialLinks || {},
    portfolio: card.portfolio || [],
    customFields: card.customFields || [],
  };
}

function backfillCards() {
  let changed = false;
  db.cards = db.cards.map(card => {
    const normalized = normalizeCard(card);
    if (JSON.stringify(normalized) !== JSON.stringify(card)) {
      changed = true;
    }
    return normalized;
  });

  if (changed) {
    saveDb();
  }
}

function getGeoDetails(req: Request) {
  const headerCountry = req.headers['cf-ipcountry']
    || req.headers['x-vercel-ip-country']
    || req.headers['x-country']
    || req.headers['x-geo-country'];
  const headerCity = req.headers['x-vercel-ip-city'] || req.headers['x-city'];

  const country = typeof headerCountry === 'string' && headerCountry.trim() ? headerCountry : 'Unknown';
  const city = typeof headerCity === 'string' && headerCity.trim() ? headerCity : 'Unknown';

  return { country, city };
}

function getDeviceDetails(userAgent: string) {
  const isMobile = /mobile/i.test(userAgent);
  const isTablet = /tablet|ipad/i.test(userAgent);
  const device = isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop';

  let browser = 'Unknown';
  if (/chrome/i.test(userAgent) && !/edge|edg/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/edge|edg/i.test(userAgent)) browser = 'Edge';

  return { device, browser };
}

function buildPublicCardResponse(card: BusinessCard) {
  const owner = db.users.find(user => user.id === card.userId);
  const company = card.companyId ? db.companies.find(entry => entry.id === card.companyId) : null;

  return {
    card,
    owner: owner ? { id: owner.id, name: owner.name, email: owner.email } : null,
    company: company ? { id: company.id, name: company.name, domain: company.domain, logoUrl: company.logoUrl } : null,
  };
}

function findPublicCardByPublicId(publicId: string) {
  return db.cards.find(card => card.publicId === publicId);
}

function findPublicCardBySlug(slug: string) {
  return db.cards.find(card => card.slug === slug);
}

function recordAnalyticsEvent(card: BusinessCard, type: AnalyticsEvent['type'], req: Request, referrer: string) {
  const userAgent = req.headers['user-agent'] || '';
  const { device, browser } = getDeviceDetails(userAgent);
  const { country, city } = getGeoDetails(req);

  const analyticsEvent: AnalyticsEvent = {
    id: `ev_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    cardId: card.id,
    type,
    timestamp: new Date().toISOString(),
    country,
    city,
    device: type === 'scan' ? 'mobile' : device,
    browser,
    referrer,
  };

  db.analytics.push(analyticsEvent);
}

// Database JSON File Path
const DB_FILE = join(process.cwd(), 'db.json');

// Memory DB cache
interface DbSchema {
  users: User[];
  companies: Company[];
  cards: BusinessCard[];
  contacts: Contact[];
  leads: Lead[];
  analytics: AnalyticsEvent[];
  notifications: SystemNotification[];
  activityLogs: ActivityLog[];
}

let db: DbSchema = {
  users: [],
  companies: [],
  cards: [],
  contacts: [],
  leads: [],
  analytics: [],
  notifications: [],
  activityLogs: []
};

// Seed DB function
function seedDb() {
  console.log('Seeding database with professional production-ready data...');

  const companyAcme: Company = {
    id: 'comp_acme',
    name: 'Acme Corporation',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=120&auto=format&fit=crop&q=80',
    domain: 'acme.com',
    brandingColors: { primary: '#4f46e5', secondary: '#10b981', background: '#f8fafc' },
    status: 'approved',
    plan: 'enterprise',
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  };

  const companyGlobex: Company = {
    id: 'comp_globex',
    name: 'Globex Industries',
    logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&auto=format&fit=crop&q=80',
    domain: 'globex.io',
    brandingColors: { primary: '#dc2626', secondary: '#f59e0b', background: '#0f172a' },
    status: 'pending',
    plan: 'growth',
    createdAt: new Date().toISOString()
  };

  db.companies = [companyAcme, companyGlobex];

  // Seed Users
  db.users = [
    {
      id: 'usr_super_admin',
      name: 'Sarah Jenkins',
      email: 'admin@vcard.io',
      role: 'super_admin',
      isVerified: true,
      suspended: false,
      createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'usr_company_admin',
      name: 'Johnathan Sterling',
      email: 'ceo@acme.com',
      role: 'company_admin',
      companyId: 'comp_acme',
      isVerified: true,
      suspended: false,
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'usr_employee_alice',
      name: 'Alice Smith',
      email: 'alice@acme.com',
      role: 'employee',
      companyId: 'comp_acme',
      isVerified: true,
      suspended: false,
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'usr_employee_bob',
      name: 'Robert Vance',
      email: 'bob@acme.com',
      role: 'employee',
      companyId: 'comp_acme',
      isVerified: true,
      suspended: false,
      createdAt: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'usr_individual_charlie',
      name: 'Elena Rostova',
      email: 'freelance@gmail.com',
      role: 'individual',
      isVerified: true,
      suspended: false,
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Seed Business Cards
  db.cards = [
    {
      id: 'crd_ceo',
      publicId: 'johnathan-sterling-ceo',
      slug: 'johnathan-sterling',
      userId: 'usr_company_admin',
      companyId: 'comp_acme',
      companyName: companyAcme.name,
      name: 'Johnathan Sterling',
      title: 'Chief Executive Officer',
      designation: 'CEO & Founder',
      department: 'Executive Suite',
      address: 'Acme HQ, 410 Market Street, San Francisco, CA',
      bio: 'Visionary business leader with over 20 years of experience scaling global tech enterprise companies and digital product innovations.',
      profilePhoto: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80',
      companyLogo: companyAcme.logoUrl,
      templateId: 'glass',
      theme: {
        primaryColor: '#4f46e5',
        secondaryColor: '#10b981',
        textColor: '#1e293b',
        backgroundColor: '#f1f5f9',
        cardColor: 'rgba(255, 255, 255, 0.75)',
        fontFamily: 'Inter',
        borderRadius: 'lg'
      },
      portfolio: [
        { id: 'p1', title: 'Acme Cloud Platform Launch', url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=500&auto=format&fit=crop&q=80' },
        { id: 'p2', title: 'Global Tech Summit 2025 Keynote', url: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=500&auto=format&fit=crop&q=80' }
      ],
      socialLinks: {
        website: 'https://acme.com',
        linkedin: 'https://linkedin.com/in/johnathan-sterling-mock',
        twitter: 'https://twitter.com/sterlingceo_mock',
        calendly: 'https://calendly.com/acme-sterling-mock'
      },
      contactButtons: {
        email: 'ceo@acme.com',
        phone: '+1 (555) 902-1244',
        sms: '+1 (555) 902-1244'
      },
      customFields: [
        { id: 'f1', label: 'Office Hours', value: 'Mon - Fri, 9AM - 5PM EST' },
        { id: 'f2', label: 'Assistant', value: 'Grace Kelly (grace@acme.com)' }
      ],
      views: 1245,
      scans: 382,
      downloads: 142,
      shares: 98,
      createdAt: new Date(Date.now() - 28 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'crd_alice',
      publicId: 'alice-smith-ui',
      slug: 'alice-smith',
      userId: 'usr_employee_alice',
      companyId: 'comp_acme',
      companyName: companyAcme.name,
      name: 'Alice Smith',
      title: 'Senior Frontend Architect',
      designation: 'Principal UI/UX Architect',
      department: 'Engineering',
      address: 'Acme Product Studio, 220 Howard Street, San Francisco, CA',
      bio: 'TypeScript ninja and CSS artist. Specializing in highly accessible client experiences, advanced animations, and micro-frontends.',
      profilePhoto: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
      companyLogo: companyAcme.logoUrl,
      templateId: 'neon',
      theme: {
        primaryColor: '#a855f7',
        secondaryColor: '#06b6d4',
        textColor: '#e2e8f0',
        backgroundColor: '#0f172a',
        cardColor: '#1e293b',
        fontFamily: 'JetBrains Mono',
        borderRadius: 'full'
      },
      portfolio: [
        { id: 'pa1', title: 'SaaS Design System', url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=500&auto=format&fit=crop&q=80' },
        { id: 'pa2', title: 'Micro-Frontend Core Architecture', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=500&auto=format&fit=crop&q=80' }
      ],
      socialLinks: {
        github: 'https://github.com/alicesmith-mock',
        linkedin: 'https://linkedin.com/in/alicesmith-ui-mock',
        twitter: 'https://twitter.com/alicecode_mock'
      },
      contactButtons: {
        email: 'alice@acme.com',
        phone: '+1 (555) 304-9844'
      },
      customFields: [
        { id: 'f_tech', label: 'Core Stack', value: 'React 19, TypeScript, Tailwind v4, Vite' }
      ],
      views: 890,
      scans: 220,
      downloads: 87,
      shares: 42,
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'crd_bob',
      publicId: 'robert-vance-sales',
      slug: 'robert-vance',
      userId: 'usr_employee_bob',
      companyId: 'comp_acme',
      companyName: companyAcme.name,
      name: 'Robert Vance',
      title: 'Director of Global Sales',
      designation: 'Global Sales Director',
      department: 'Sales & Growth',
      address: 'Acme Global Sales Hub, 8 King Street, London, UK',
      bio: 'Leading commercial business strategies and strategic client acquisitions. Connect with me to unlock business transformation.',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
      companyLogo: companyAcme.logoUrl,
      templateId: 'modern',
      theme: {
        primaryColor: '#0f172a',
        secondaryColor: '#f59e0b',
        textColor: '#1e293b',
        backgroundColor: '#ffffff',
        cardColor: '#f8fafc',
        fontFamily: 'Inter',
        borderRadius: 'md'
      },
      portfolio: [],
      socialLinks: {
        website: 'https://acme.com',
        linkedin: 'https://linkedin.com/in/robertvance-sales-mock',
        whatsapp: 'https://wa.me/15554443322'
      },
      contactButtons: {
        email: 'bob@acme.com',
        phone: '+1 (555) 444-3322',
        sms: '+1 (555) 444-3322'
      },
      customFields: [],
      views: 1540,
      scans: 430,
      downloads: 198,
      shares: 110,
      createdAt: new Date(Date.now() - 11 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'crd_charlie',
      publicId: 'elena-rostova-brand',
      slug: 'elena-rostova',
      userId: 'usr_individual_charlie',
      companyName: 'Freelance Brand',
      name: 'Elena Rostova',
      title: 'Freelance Brand Director',
      designation: 'Creative Director & Designer',
      address: '14 Shoreditch Works, London, UK',
      bio: 'Designing modern, bold visual brand strategies for fast-growing lifestyle and technology products worldwide.',
      profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
      templateId: 'minimalist',
      theme: {
        primaryColor: '#020617',
        secondaryColor: '#e11d48',
        textColor: '#0f172a',
        backgroundColor: '#fafafa',
        cardColor: '#ffffff',
        fontFamily: 'Inter',
        borderRadius: 'none'
      },
      portfolio: [
        { id: 'pc1', title: 'Neo Luxury Brand Book', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&auto=format&fit=crop&q=80' }
      ],
      socialLinks: {
        website: 'https://elenadesigns-mock.com',
        instagram: 'https://instagram.com/elena_design_mock',
        linkedin: 'https://linkedin.com/in/elena-rostova-mock',
        pinterest: 'https://pinterest.com/elena_mock'
      } as SocialLinks,
      contactButtons: {
        email: 'freelance@gmail.com',
        phone: '+44 7911 123456'
      },
      customFields: [],
      views: 310,
      scans: 78,
      downloads: 24,
      shares: 19,
      createdAt: new Date(Date.now() - 9 * 24 * 3600 * 1000).toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Seed Leads
  db.leads = [
    {
      id: 'ld_1',
      cardId: 'crd_ceo',
      cardUserId: 'usr_company_admin',
      name: 'Victor Vance',
      email: 'victor@viceventures.com',
      phone: '+1 (555) 777-1233',
      company: 'Vice Ventures',
      notes: 'Interested in a enterprise corporate licensing contract for 500 employee smart business cards.',
      status: 'qualified',
      source: 'QR Scan',
      createdAt: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'ld_2',
      cardId: 'crd_ceo',
      cardUserId: 'usr_company_admin',
      name: 'Amelia Earhart',
      email: 'amelia@aviationlabs.co',
      phone: '+1 (555) 203-9911',
      company: 'Aviation Labs',
      notes: 'Wants to schedule a demo of company admin dashboard features.',
      status: 'new',
      source: 'Direct Link',
      createdAt: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'ld_3',
      cardId: 'crd_bob',
      cardUserId: 'usr_employee_bob',
      name: 'Timothy Cook',
      email: 'tim@fruit.com',
      phone: '+1 (555) 888-9999',
      company: 'Fruit Inc',
      notes: 'Looking to purchase custom cards. Contacted him, high probability of conversion.',
      status: 'contacted',
      source: 'QR Scan',
      createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Seed Contacts
  db.contacts = [
    {
      id: 'con_1',
      userId: 'usr_company_admin',
      cardId: 'crd_charlie',
      name: 'Elena Rostova',
      email: 'freelance@gmail.com',
      phone: '+44 7911 123456',
      company: 'Freelance Brand',
      title: 'Creative Director',
      note: 'Stunning brand designer. High recommendation from network. Hire her for Acme next-gen rebranding.',
      tags: ['Design', 'Contractor', 'Top Tier'],
      category: 'Partner',
      isFavorite: true,
      createdAt: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Seed Analytics Timeline Events (For drawing charts)
  const devices = ['mobile', 'desktop', 'tablet'];
  const countries = ['United States', 'United Kingdom', 'Germany', 'Singapore', 'India', 'Canada'];
  const browsers = ['Chrome', 'Safari', 'Firefox', 'Edge'];
  const cardIds = ['crd_ceo', 'crd_alice', 'crd_bob', 'crd_charlie'];

  const generatedEvents: AnalyticsEvent[] = [];
  let eventCounter = 1;

  for (let d = 14; d >= 0; d--) {
    const dayStr = new Date(Date.now() - d * 24 * 3600 * 1000).toISOString().split('T')[0];

    cardIds.forEach(cardId => {
      // Create random views, scans, downloads for each card on each day
      const viewCount = Math.floor(Math.random() * 20) + 15;
      const scanCount = Math.floor(viewCount * (Math.random() * 0.4 + 0.1));
      const downloadCount = Math.floor(scanCount * (Math.random() * 0.5 + 0.1));

      for (let v = 0; v < viewCount; v++) {
        generatedEvents.push({
          id: `ev_${eventCounter++}`,
          cardId,
          type: 'view',
          timestamp: `${dayStr}T${Math.floor(Math.random() * 12 + 8)}:${Math.floor(Math.random() * 60)}:00Z`,
          country: countries[Math.floor(Math.random() * countries.length)],
          city: 'Sample City',
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          referrer: Math.random() > 0.5 ? 'LinkedIn' : 'Direct'
        });
      }

      for (let s = 0; s < scanCount; s++) {
        generatedEvents.push({
          id: `ev_${eventCounter++}`,
          cardId,
          type: 'scan',
          timestamp: `${dayStr}T${Math.floor(Math.random() * 12 + 8)}:${Math.floor(Math.random() * 60)}:00Z`,
          country: countries[Math.floor(Math.random() * countries.length)],
          city: 'Sample City',
          device: 'mobile', // scans are always mobile
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          referrer: 'QR Code'
        });
      }

      for (let dw = 0; dw < downloadCount; dw++) {
        generatedEvents.push({
          id: `ev_${eventCounter++}`,
          cardId,
          type: 'download',
          timestamp: `${dayStr}T${Math.floor(Math.random() * 12 + 8)}:${Math.floor(Math.random() * 60)}:00Z`,
          country: countries[Math.floor(Math.random() * countries.length)],
          city: 'Sample City',
          device: devices[Math.floor(Math.random() * devices.length)],
          browser: browsers[Math.floor(Math.random() * browsers.length)],
          referrer: 'Card Action'
        });
      }
    });
  }

  db.analytics = generatedEvents;

  // Seed Notifications
  db.notifications = [
    {
      id: 'nt_1',
      userId: 'usr_company_admin',
      title: 'Welcome to Smart vCard Corporate',
      message: 'Your enterprise tenant acme.com has been successfully provisioned. You can now invite employees to claim their smart business cards!',
      type: 'success',
      isRead: false,
      createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'nt_2',
      userId: 'usr_company_admin',
      title: 'Pending Registration Approved',
      message: 'Excellent news! Your custom brand domain approval has completed. Branding policies have been applied globally.',
      type: 'info',
      isRead: true,
      createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'nt_3',
      userId: 'usr_employee_alice',
      title: 'Smart Business Card Issued',
      message: 'Your company admin has provisioned a brand new Smart Business Card for you. Set up your profile and export your high-res QR code now.',
      type: 'info',
      isRead: false,
      createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Seed Activity logs
  db.activityLogs = [
    {
      id: 'lg_1',
      userId: 'usr_super_admin',
      userName: 'Sarah Jenkins',
      userEmail: 'admin@vcard.io',
      action: 'COMPANY_APPROVED',
      details: 'Approved Acme Corporation corporate tenant structure.',
      timestamp: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
    },
    {
      id: 'lg_2',
      userId: 'usr_company_admin',
      userName: 'Johnathan Sterling',
      userEmail: 'ceo@acme.com',
      action: 'EMPLOYEE_INVITE',
      details: 'Sent smart business card onboarding invitation to alice@acme.com',
      timestamp: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
    }
  ];

  // Write back to DB
  saveDb();
  console.log('Database seeded with production-ready data');
}

function loadDb() {
  if (existsSync(DB_FILE)) {
    try {
      db = JSON.parse(readFileSync(DB_FILE, 'utf8'));
      console.log('Database loaded successfully from db.json');
    } catch (err) {
      console.error('Failed to parse db.json, generating default seeded dataset...', err);
      seedDb();
    }
  } else {
    seedDb();
  }
}

function saveDb() {
  try {
    writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write db.json', err);
  }
}

// Initialize database
loadDb();
backfillCards();

// Setup Express
const app = express();
app.set('trust proxy', 1);
const PORT = Number(process.env.PORT || 3000);
const isProductionRuntime = process.env.NODE_ENV === 'production' || process.argv[1]?.endsWith('dist/server.cjs');

// Security middleware with relaxed CSP for Vite dev mode
// Vite needs 'unsafe-inline' for React HMR preamble and WebSocket for hot reload
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*"],
      imgSrc: ["'self'", "data:", "https://images.unsplash.com", "https://*.unsplash.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
    },
  },
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting (apply to all API routes)
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

// Only parse JSON for API routes and POST/PUT/DELETE requests
app.use('/api/*', express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    express.json({ limit: '10mb' })(req, res, next);
  } else {
    next();
  }
});

// Middleware: Authenticated User
function authMiddleware(req: any, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  const token = authHeader.split(' ')[1];
  const verified = verifyToken(token);
  if (!verified) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Find user details
  const user = db.users.find(u => u.id === verified.userId);
  if (!user) {
    return res.status(401).json({ error: 'User does not exist' });
  }
  if (user.suspended) {
    return res.status(403).json({ error: 'Your account has been suspended' });
  }

  req.user = user;
  next();
}

// Middleware: Role based routing guards
function roleGuard(roles: UserRole[]) {
  return (req: any, res: express.Response, next: express.NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
    }
    next();
  };
}

// Helper: Log activities
function logActivity(userId: string, action: string, details: string, ip?: string, userAgent?: string) {
  const user = db.users.find(u => u.id === userId);
  const log: ActivityLog = {
    id: `lg_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId,
    userName: user ? user.name : 'Unknown',
    userEmail: user ? user.email : 'Unknown',
    action,
    details,
    timestamp: new Date().toISOString(),
    ip,
    userAgent
  };
  db.activityLogs.unshift(log);
  saveDb();
}

function sendPublicCardResponse(req: Request, res: Response, card: BusinessCard, trackView = true) {
  const owner = db.users.find(user => user.id === card.userId);
  if (!owner || owner.suspended) {
    return res.status(403).json({ error: 'This business card is currently inactive' });
  }

  if (trackView) {
    card.views = (card.views || 0) + 1;
    recordAnalyticsEvent(card, 'view', req, req.headers.referer || 'Public Card');
    saveDb();
  }

  return res.json(buildPublicCardResponse(card));
}

// ==========================================
// API ENDPOINTS
// ==========================================

// Public Route: Submit leads from profile cards
app.post('/api/public/cards/:cardId/lead', (req, res) => {
  const { cardId } = req.params;
  const { name, email, phone, company, notes, source } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and Email are required fields to submit a lead' });
  }

  const targetCard = db.cards.find(c => c.id === cardId);
  if (!targetCard) {
    return res.status(404).json({ error: 'Digital business card not found' });
  }

  const newLead: Lead = {
    id: `ld_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    cardId,
    cardUserId: targetCard.userId,
    name,
    email,
    phone: phone || '',
    company: company || '',
    notes: notes || '',
    status: 'new',
    source: source || 'QR Scan',
    createdAt: new Date().toISOString()
  };

  db.leads.unshift(newLead);

  // Send notification to the card owner
  const notification: SystemNotification = {
    id: `nt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    userId: targetCard.userId,
    title: 'New Lead Captured!',
    message: `${name} from ${company || 'Unknown Company'} submitted a contact inquiry on your card.`,
    type: 'success',
    isRead: false,
    createdAt: new Date().toISOString()
  };
  db.notifications.unshift(notification);

  saveDb();
  res.status(201).json({ success: true, message: 'Lead captured successfully!', lead: newLead });
});

// Public Route: Single Card lookup by public identifier for QR visitors
app.get('/api/public/cards/public/:publicId', (req, res) => {
  const card = findPublicCardByPublicId(req.params.publicId);
  if (!card) {
    return res.status(404).json({ error: 'Business card not found' });
  }

  const trackView = req.query.trackView !== 'false';
  return sendPublicCardResponse(req, res, card, trackView);
});

// Public Route: Optional slug based lookup
app.get('/api/public/cards/slug/:slug', (req, res) => {
  const card = findPublicCardBySlug(req.params.slug);
  if (!card) {
    return res.status(404).json({ error: 'Business card not found' });
  }

  const trackView = req.query.trackView !== 'false';
  return sendPublicCardResponse(req, res, card, trackView);
});

// Legacy public route by internal card id (kept for owner preview / backward compatibility)
app.get('/api/public/cards/:id', (req, res) => {
  const card = db.cards.find(c => c.id === req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Business card not found' });
  }

  const trackView = req.query.trackView !== 'false';
  return sendPublicCardResponse(req, res, card, trackView);
});

// Public Route: Register Interaction Event (Scans, Downloads, Shares)
app.post('/api/public/cards/:id/event', (req, res) => {
  const card = db.cards.find(c => c.id === req.params.id);
  if (!card) return res.status(404).json({ error: 'Business card not found' });

  const { type } = req.body;
  if (!['scan', 'download', 'share'].includes(type)) {
    return res.status(400).json({ error: 'Invalid event type' });
  }

  if (type === 'scan') card.scans = (card.scans || 0) + 1;
  else if (type === 'download') card.downloads = (card.downloads || 0) + 1;
  else if (type === 'share') card.shares = (card.shares || 0) + 1;

  recordAnalyticsEvent(card, type, req, type === 'scan' ? 'QR Code' : 'Card Action');
  saveDb();

  return res.json({ success: true, event: type });
});

// ==========================================
// AUTH ROUTES
// ==========================================

// POST: /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, companyName } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required fields' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email address is already in use' });
  }

  const userId = `usr_${Date.now()}`;
  let companyId: string | undefined;

  // Handle corporate signup vs individual
  if (role === 'company_admin' && companyName) {
    companyId = `comp_${Date.now()}`;
    const newCompany: Company = {
      id: companyId,
      name: companyName,
      brandingColors: { primary: '#4f46e5', secondary: '#10b981', background: '#f8fafc' },
      status: 'pending', // Requires Super Admin approval
      plan: 'growth',
      createdAt: new Date().toISOString()
    };
    db.companies.push(newCompany);
  }

  const newUser: User = {
    id: userId,
    name,
    email: email.toLowerCase(),
    role: role === 'company_admin' ? 'company_admin' : 'individual',
    companyId,
    isVerified: true, // Auto-verified for ease of instant sandbox exploration
    suspended: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDb();

  // Log activity
  logActivity(userId, 'USER_REGISTERED', `Created account with role: ${newUser.role}`);

  const token = generateToken(userId, newUser.role);
  res.status(201).json({ token, user: newUser });
});

// POST: /api/auth/register-individual - Individual user registration
app.post('/api/auth/register-individual', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required fields' });
  }
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email address is already in use' });
  }
  const userId = `usr_${Date.now()}`;
  const newUser: User = {
    id: userId,
    name,
    email: email.toLowerCase(),
    role: 'individual',
    isVerified: true,
    suspended: false,
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  saveDb();
  logActivity(userId, 'USER_REGISTERED', `Created individual account`);
  const token = generateToken(userId, 'individual');
  res.status(201).json({ token, user: newUser });
});

// POST: /api/auth/register-corporate - Company admin registration
app.post('/api/auth/register-corporate', (req, res) => {
  const { name, email, password, companyName, companyDomain } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required fields' });
  }
  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Email address is already in use' });
  }
  const userId = `usr_${Date.now()}`;
  const companyId = `comp_${Date.now()}`;
  const newCompany: Company = {
    id: companyId,
    name: companyName || `${name}'s Company`,
    logoUrl: '',
    domain: companyDomain || '',
    brandingColors: { primary: '#4f46e5', secondary: '#10b981', background: '#f8fafc' },
    status: 'pending',
    plan: 'growth',
    createdAt: new Date().toISOString()
  };
  db.companies.push(newCompany);
  const newUser: User = {
    id: userId,
    name,
    email: email.toLowerCase(),
    role: 'company_admin',
    companyId,
    isVerified: true,
    suspended: false,
    createdAt: new Date().toISOString()
  };
  db.users.push(newUser);
  saveDb();
  logActivity(userId, 'USER_REGISTERED', `Created company admin account for ${companyName}`);
  const token = generateToken(userId, 'company_admin');
  res.status(201).json({ token, user: newUser, company: newCompany });
});

// POST: /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Invalid email address or password' });
  }

  if (user.suspended) {
    return res.status(403).json({ error: 'This user account has been suspended by system administrator' });
  }

  // Token & complete user session
  const token = generateToken(user.id, user.role);
  logActivity(user.id, 'USER_LOGIN', `Logged in successfully from workspace interface`);

  // Include company data if available
  const userWithCompany = {
    ...user,
    company: user.companyId ? db.companies.find(c => c.id === user.companyId) : null
  };

  res.json({ token, user: userWithCompany });
});

// GET: /api/auth/me
app.get('/api/auth/me', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const userWithCompany = {
    ...user,
    company: user.companyId ? db.companies.find(c => c.id === user.companyId) : null
  };
  res.json({ user: userWithCompany });
});

// POST: Forgot password mock
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.users.find(u => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No user account found with that email address' });
  }
  res.json({ success: true, message: 'Password reset instructions have been dispatched to email address.' });
});

// POST: Reset password mock
app.post('/api/auth/reset-password', (_req, res) => {
  res.json({ success: true, message: 'Your password has been successfully reset. Please log in.' });
});

// ==========================================
// BUSINESS CARDS ENDPOINTS
// ==========================================

// GET: /api/cards
app.get('/api/cards', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  let userCards: BusinessCard[] = [];

  if (user.role === 'super_admin') {
    userCards = db.cards;
  } else if (user.role === 'company_admin') {
    userCards = db.cards.filter(c => c.companyId === user.companyId);
  } else {
    userCards = db.cards.filter(c => c.userId === user.id);
  }

  res.json({ cards: userCards });
});

// POST: /api/cards
app.post('/api/cards', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const cardData = req.body;

  const existingCards = db.cards
    .map((card, index) => ({ card, index }))
    .filter(({ card }) => card.userId === user.id)
    .sort((a, b) => new Date(b.card.updatedAt || b.card.createdAt || 0).getTime() - new Date(a.card.updatedAt || a.card.createdAt || 0).getTime());

  if (existingCards.length > 0) {
    const { card, index } = existingCards[0];
    const updatedCard: BusinessCard = normalizeCard({
      ...card,
      ...cardData,
      id: card.id,
      publicId: card.publicId,
      slug: card.slug,
      userId: card.userId,
      companyId: card.companyId,
      companyName: cardData.companyName || card.companyName || db.companies.find(entry => entry.id === card.companyId)?.name || '',
      views: card.views,
      scans: card.scans,
      downloads: card.downloads,
      shares: card.shares,
      updatedAt: new Date().toISOString()
    });

    db.cards[index] = updatedCard;
    saveDb();

    logActivity(user.id, 'CARD_UPDATED', `Reused existing digital business card: ${updatedCard.title}`);

    return res.status(200).json({
      card: updatedCard,
      message: 'Existing card updated to preserve a single QR-linked profile for this user.'
    });
  }

  const cardId = `crd_${Date.now()}`;
  const company = user.companyId ? db.companies.find(entry => entry.id === user.companyId) : null;
  const newCard: BusinessCard = normalizeCard({
    id: cardId,
    publicId: generateUniquePublicId(),
    slug: generateUniqueSlug(cardData.slug || cardData.name || user.name),
    userId: user.id,
    companyId: user.companyId,
    companyName: cardData.companyName || company?.name || '',
    name: cardData.name || user.name,
    title: cardData.title || 'Digital Card',
    designation: cardData.designation || 'Professional',
    department: cardData.department || '',
    address: cardData.address || '',
    bio: cardData.bio || '',
    profilePhoto: cardData.profilePhoto || '',
    companyLogo: cardData.companyLogo || company?.logoUrl || '',
    templateId: cardData.templateId || 'modern',
    theme: cardData.theme || {
      primaryColor: '#4f46e5',
      secondaryColor: '#10b981',
      textColor: '#1e293b',
      backgroundColor: '#f8fafc',
      cardColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: 'md'
    },
    portfolio: cardData.portfolio || [],
    socialLinks: cardData.socialLinks || {},
    contactButtons: cardData.contactButtons || {},
    customFields: cardData.customFields || [],
    views: 0,
    scans: 0,
    downloads: 0,
    shares: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  db.cards.push(newCard);
  saveDb();

  logActivity(user.id, 'CARD_CREATED', `Created new digital business card: ${newCard.title}`);

  res.status(201).json({ card: newCard });
});

// PUT: /api/cards/:id
app.put('/api/cards/:id', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const { id } = req.params;
  const cardIndex = db.cards.findIndex(c => c.id === id);

  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Business card not found' });
  }

  const card = db.cards[cardIndex];

  // Access validation: must be owner, or company admin, or super admin
  if (user.role !== 'super_admin' && card.userId !== user.id) {
    if (user.role === 'company_admin' && card.companyId !== user.companyId) {
      return res.status(403).json({ error: 'Unauthorized to modify this business card' });
    }
    if (user.role !== 'company_admin') {
      return res.status(403).json({ error: 'Unauthorized to modify this business card' });
    }
  }

  const updatedCard: BusinessCard = normalizeCard({
    ...card,
    ...req.body,
    id: card.id, // Immutable
    publicId: card.publicId,
    slug: card.slug,
    userId: card.userId,
    companyId: card.companyId,
    companyName: req.body.companyName || card.companyName || db.companies.find(entry => entry.id === card.companyId)?.name || '',
    views: card.views, // Preserve analytics count
    scans: card.scans,
    downloads: card.downloads,
    shares: card.shares,
    updatedAt: new Date().toISOString()
  });

  db.cards[cardIndex] = updatedCard;
  saveDb();

  logActivity(user.id, 'CARD_UPDATED', `Updated digital business card details: ${updatedCard.title}`);

  res.json({ card: updatedCard });
});

// DELETE: /api/cards/:id
app.delete('/api/cards/:id', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const { id } = req.params;
  const cardIndex = db.cards.findIndex(c => c.id === id);

  if (cardIndex === -1) {
    return res.status(404).json({ error: 'Business card not found' });
  }

  const card = db.cards[cardIndex];

  if (user.role !== 'super_admin' && card.userId !== user.id) {
    if (user.role === 'company_admin' && card.companyId !== user.companyId) {
      return res.status(403).json({ error: 'Unauthorized to delete this business card' });
    }
    if (user.role !== 'company_admin') {
      return res.status(403).json({ error: 'Unauthorized to delete this business card' });
    }
  }

  db.cards.splice(cardIndex, 1);
  saveDb();

  logActivity(user.id, 'CARD_DELETED', `Deleted digital business card id: ${id}`);

  res.json({ success: true, message: 'Business card successfully archived/deleted' });
});

// ==========================================
// COMPANY ENDPOINTS
// ==========================================

// GET: /api/company
app.get('/api/company', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  if (!user.companyId) {
    return res.status(404).json({ error: 'You are not associated with any corporate tenant/company' });
  }

  const company = db.companies.find(c => c.id === user.companyId);
  if (!company) {
    return res.status(404).json({ error: 'Company profile not found' });
  }

  res.json({ company });
});

// PUT: /api/company
app.put('/api/company', authMiddleware, roleGuard(['company_admin', 'super_admin']), (req: any, res) => {
  const user = req.user as User;
  const companyId = user.companyId || req.body.id;

  const companyIndex = db.companies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) {
    return res.status(404).json({ error: 'Company record not found' });
  }

  const updatedCompany = {
    ...db.companies[companyIndex],
    ...req.body,
    id: companyId // Immutable
  };

  db.companies[companyIndex] = updatedCompany;
  saveDb();

  logActivity(user.id, 'COMPANY_UPDATED', `Updated corporate tenant profile parameters for: ${updatedCompany.name}`);

  res.json({ company: updatedCompany });
});

// GET: /api/company/employees
app.get('/api/company/employees', authMiddleware, roleGuard(['company_admin', 'super_admin']), (req: any, res) => {
  const user = req.user as User;
  const companyId = user.companyId;

  const employees = db.users.filter(u => u.companyId === companyId && u.role === 'employee');
  const employeeDetails = employees.map(emp => {
    const cards = db.cards.filter(c => c.userId === emp.id);
    return {
      ...emp,
      cardCount: cards.length,
      cards: cards.map(c => ({ id: c.id, title: c.title, views: c.views, scans: c.scans }))
    };
  });

  res.json({ employees: employeeDetails });
});

// POST: /api/company/invite
app.post('/api/company/invite', authMiddleware, roleGuard(['company_admin']), (req: any, res) => {
  const user = req.user as User;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Employee name and email address are required' });
  }

  const existing = db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'An account with that email address already exists' });
  }

  const newEmpId = `usr_${Date.now()}`;
  const newEmployee: User = {
    id: newEmpId,
    name,
    email: email.toLowerCase(),
    role: 'employee',
    companyId: user.companyId,
    isVerified: true,
    suspended: false,
    createdAt: new Date().toISOString()
  };

  db.users.push(newEmployee);

  // Auto-generate a starter card for this employee
  const cardId = `crd_${Date.now()}`;
  const company = db.companies.find(c => c.id === user.companyId);
  const starterCard: BusinessCard = normalizeCard({
    id: cardId,
    publicId: generateUniquePublicId(),
    slug: generateUniqueSlug(name),
    userId: newEmpId,
    companyId: user.companyId,
    companyName: company?.name || '',
    name,
    title: `${name}'s Card`,
    designation: 'Onboarding Employee',
    department: 'Corporate Onboarding',
    address: '',
    bio: `Proud employee at ${company?.name || 'Company'}. Professional digital business card.`,
    templateId: 'modern',
    theme: {
      primaryColor: company?.brandingColors.primary || '#4f46e5',
      secondaryColor: company?.brandingColors.secondary || '#10b981',
      textColor: '#1e293b',
      backgroundColor: company?.brandingColors.background || '#f8fafc',
      cardColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: 'md'
    },
    portfolio: [],
    socialLinks: {},
    contactButtons: { email },
    customFields: [],
    views: 0,
    scans: 0,
    downloads: 0,
    shares: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  db.cards.push(starterCard);

  saveDb();

  logActivity(user.id, 'EMPLOYEE_INVITE', `Invited and registered employee: ${email}`);

  res.status(201).json({ success: true, employee: newEmployee, card: starterCard });
});

// POST: /api/company/employees/:id/toggle
app.post('/api/company/employees/:id/toggle', authMiddleware, roleGuard(['company_admin']), (req: any, res) => {
  const user = req.user as User;
  const { id } = req.params;

  const empIndex = db.users.findIndex(u => u.id === id && u.companyId === user.companyId);
  if (empIndex === -1) {
    return res.status(404).json({ error: 'Employee not found in your organization' });
  }

  const employee = db.users[empIndex];
  employee.suspended = !employee.suspended;
  saveDb();

  logActivity(user.id, 'EMPLOYEE_SUSPENSION_TOGGLED', `Toggled suspension status for: ${employee.email} to ${employee.suspended}`);

  res.json({ success: true, employee });
});

// ==========================================
// CONTACTS ENDPOINTS (Professional connections)
// ==========================================

// GET: /api/contacts
app.get('/api/contacts', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const userContacts = db.contacts.filter(c => c.userId === user.id);
  res.json({ contacts: userContacts });
});

// POST: /api/contacts
app.post('/api/contacts', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const { name, email, phone, company, title, note, tags, category, isFavorite, cardId } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Contact Name is a required parameter' });
  }

  const newContact: Contact = {
    id: `con_${Date.now()}`,
    userId: user.id,
    cardId: cardId || '',
    name,
    email: email || '',
    phone: phone || '',
    company: company || '',
    title: title || '',
    note: note || '',
    tags: tags || [],
    category: category || 'Personal',
    isFavorite: !!isFavorite,
    createdAt: new Date().toISOString()
  };

  db.contacts.push(newContact);
  saveDb();

  logActivity(user.id, 'CONTACT_CREATED', `Saved connection contact details for: ${name}`);

  res.status(201).json({ contact: newContact });
});

// PUT: /api/contacts/:id
app.put('/api/contacts/:id', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const { id } = req.params;

  const contactIndex = db.contacts.findIndex(c => c.id === id && c.userId === user.id);
  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Saved contact not found' });
  }

  const updatedContact = {
    ...db.contacts[contactIndex],
    ...req.body,
    id: db.contacts[contactIndex].id, // Immutable
    userId: user.id // Immutable
  };

  db.contacts[contactIndex] = updatedContact;
  saveDb();

  res.json({ contact: updatedContact });
});

// DELETE: /api/contacts/:id
app.delete('/api/contacts/:id', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const { id } = req.params;

  const contactIndex = db.contacts.findIndex(c => c.id === id && c.userId === user.id);
  if (contactIndex === -1) {
    return res.status(404).json({ error: 'Saved contact not found' });
  }

  db.contacts.splice(contactIndex, 1);
  saveDb();

  res.json({ success: true, message: 'Saved contact deleted' });
});

// ==========================================
// LEADS ENDPOINTS
// ==========================================

// GET: /api/leads
app.get('/api/leads', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  let userLeads: Lead[] = [];

  if (user.role === 'super_admin') {
    userLeads = db.leads;
  } else if (user.role === 'company_admin') {
    // Company admin sees all leads for company cards
    const companyCardIds = db.cards.filter(c => c.companyId === user.companyId).map(c => c.id);
    userLeads = db.leads.filter(ld => companyCardIds.includes(ld.cardId));
  } else {
    // Individual professional or Employee sees their own captured leads
    userLeads = db.leads.filter(ld => ld.cardUserId === user.id);
  }

  res.json({ leads: userLeads });
});

// PUT: /api/leads/:id
app.put('/api/leads/:id', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const { id } = req.params;
  const { status, notes } = req.body;

  const leadIndex = db.leads.findIndex(ld => ld.id === id);
  if (leadIndex === -1) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  const lead = db.leads[leadIndex];

  // Access validation
  const targetCard = db.cards.find(c => c.id === lead.cardId);
  if (!targetCard) return res.status(404).json({ error: 'Associated card not found' });

  if (user.role !== 'super_admin' && targetCard.userId !== user.id) {
    if (user.role === 'company_admin' && targetCard.companyId !== user.companyId) {
      return res.status(403).json({ error: 'Unauthorized to modify this lead' });
    }
    if (user.role !== 'company_admin') {
      return res.status(403).json({ error: 'Unauthorized to modify this lead' });
    }
  }

  if (status) lead.status = status;
  if (notes !== undefined) lead.notes = notes;

  saveDb();
  res.json({ lead });
});

// ==========================================
// ANALYTICS ENDPOINTS
// ==========================================

// GET: /api/analytics
app.get('/api/analytics', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  let filterCardIds: string[] = [];

  if (user.role === 'super_admin') {
    filterCardIds = db.cards.map(c => c.id);
  } else if (user.role === 'company_admin') {
    filterCardIds = db.cards.filter(c => c.companyId === user.companyId).map(c => c.id);
  } else {
    filterCardIds = db.cards.filter(c => c.userId === user.id).map(c => c.id);
  }

  // Filter analytics events by relevant card IDs
  const events = db.analytics.filter(ev => filterCardIds.includes(ev.cardId));
  const leads = db.leads.filter(lead => filterCardIds.includes(lead.cardId));
  const cardsById = new Map(db.cards.map(card => [card.id, card]));

  // Compute stats
  const totalViews = events.filter(e => e.type === 'view').length;
  const totalScans = events.filter(e => e.type === 'scan').length;
  const totalDownloads = events.filter(e => e.type === 'download').length;
  const totalShares = events.filter(e => e.type === 'share').length;
  const totalConnectionRequests = leads.length;

  // Since analytics events don't persist a visitor/session id yet, estimate unique visitors
  // using a stable signature across card, location, device, browser, referrer, and day.
  const uniqueVisitorKeys = new Set(
    events.map(event => [
      event.cardId,
      event.country || 'Unknown',
      event.city || 'Unknown',
      event.device || 'desktop',
      event.browser || 'Unknown',
      event.referrer || 'Direct',
      event.timestamp.split('T')[0],
    ].join('|')),
  );
  const totalUniqueVisitors = uniqueVisitorKeys.size;

  // Timeline computation (aggregated by day)
  const timelineMap: Record<string, { date: string; views: number; scans: number; downloads: number }> = {};

  // Set default timeline for last 7 days to avoid empty spots
  for (let d = 7; d >= 0; d--) {
    const dStr = new Date(Date.now() - d * 24 * 3600 * 1000).toISOString().split('T')[0];
    timelineMap[dStr] = { date: dStr, views: 0, scans: 0, downloads: 0 };
  }

  events.forEach(e => {
    const dStr = e.timestamp.split('T')[0];
    if (timelineMap[dStr] === undefined) {
      timelineMap[dStr] = { date: dStr, views: 0, scans: 0, downloads: 0 };
    }
    if (e.type === 'view') timelineMap[dStr].views++;
    else if (e.type === 'scan') timelineMap[dStr].scans++;
    else if (e.type === 'download') timelineMap[dStr].downloads++;
  });

  const timeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

  // Geolocation statistics
  const countryStats: Record<string, number> = {};
  events.forEach(e => {
    const c = e.country || 'Unknown';
    countryStats[c] = (countryStats[c] || 0) + 1;
  });

  // Device statistics
  const deviceStats = { mobile: 0, desktop: 0, tablet: 0 };
  events.forEach(e => {
    const d = e.device as 'mobile' | 'desktop' | 'tablet';
    if (deviceStats[d] !== undefined) deviceStats[d]++;
    else deviceStats.desktop++;
  });

  // Referrer/Traffic sources statistics
  const referrerStats: Record<string, number> = {};
  events.forEach(e => {
    const r = e.referrer || 'Direct';
    referrerStats[r] = (referrerStats[r] || 0) + 1;
  });

  const recentScans = events
    .filter(event => event.type === 'scan')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)
    .map(event => ({
      id: event.id,
      timestamp: event.timestamp,
      country: event.country || 'Unknown',
      city: event.city || 'Unknown',
      device: event.device || 'mobile',
      browser: event.browser || 'Unknown',
      referrer: event.referrer || 'QR Code',
      cardName: cardsById.get(event.cardId)?.name || 'Business Card',
    }));

  res.json({
    stats: {
      views: totalViews,
      scans: totalScans,
      downloads: totalDownloads,
      shares: totalShares,
      uniqueVisitors: totalUniqueVisitors,
      connectionRequests: totalConnectionRequests,
    },
    timeline,
    countries: Object.entries(countryStats).map(([name, value]) => ({ name, value })),
    devices: Object.entries(deviceStats).map(([name, value]) => ({ name, value })),
    referrers: Object.entries(referrerStats).map(([name, value]) => ({ name, value })),
    recentScans,
  });
});

// ==========================================
// SYSTEM NOTIFICATIONS
// ==========================================

app.get('/api/notifications', authMiddleware, (req: any, res) => {
  const user = req.user as User;
  const list = db.notifications.filter(n => n.userId === user.id);
  res.json({ notifications: list });
});

app.put('/api/notifications/:id/read', authMiddleware, (req: any, res) => {
  const { id } = req.params;
  const user = req.user as User;

  const notif = db.notifications.find(n => n.id === id && n.userId === user.id);
  if (notif) {
    notif.isRead = true;
    saveDb();
  }
  res.json({ success: true });
});

// ==========================================
// SUPER ADMIN ENDPOINTS
// ==========================================

// GET: /api/admin/companies
app.get('/api/admin/companies', authMiddleware, roleGuard(['super_admin']), (req, res) => {
  const companiesDetails = db.companies.map(comp => {
    const adminUser = db.users.find(u => u.companyId === comp.id && u.role === 'company_admin');
    const employeeCount = db.users.filter(u => u.companyId === comp.id && u.role === 'employee').length;
    const cards = db.cards.filter(c => c.companyId === comp.id);
    const views = cards.reduce((sum, c) => sum + (c.views || 0), 0);

    return {
      ...comp,
      adminName: adminUser ? adminUser.name : 'Unassigned',
      adminEmail: adminUser ? adminUser.email : '',
      employeeCount,
      views
    };
  });
  res.json({ companies: companiesDetails });
});

// PUT: /api/admin/companies/:id/status
app.put('/api/admin/companies/:id/status', authMiddleware, roleGuard(['super_admin']), (req: any, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved' | 'pending'

  const company = db.companies.find(c => c.id === id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  company.status = status;
  saveDb();

  logActivity(req.user.id, 'COMPANY_STATUS_MODIFIED', `Modified company ${company.name} status to ${status}`);

  res.json({ company });
});

// GET: /api/admin/users
app.get('/api/admin/users', authMiddleware, roleGuard(['super_admin']), (req, res) => {
  const usersDetails = db.users.map(u => {
    const comp = u.companyId ? db.companies.find(c => c.id === u.companyId) : null;
    return {
      ...u,
      companyName: comp ? comp.name : 'N/A'
    };
  });
  res.json({ users: usersDetails });
});

// PUT: /api/admin/users/:id/suspend
app.put('/api/admin/users/:id/suspend', authMiddleware, roleGuard(['super_admin']), (req: any, res) => {
  const { id } = req.params;
  const user = db.users.find(u => u.id === id);

  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.id === req.user.id) return res.status(400).json({ error: 'Self-suspension is blocked' });

  user.suspended = !user.suspended;
  saveDb();

  logActivity(req.user.id, 'USER_SUSPENSION_TOGGLED', `Suspended/Activated user ${user.email} status to ${user.suspended}`);

  res.json({ user });
});

// GET: /api/admin/logs
app.get('/api/admin/logs', authMiddleware, roleGuard(['super_admin']), (req, res) => {
  res.json({ logs: db.activityLogs });
});

// ==========================================
// PUBLIC IMAGE/LOGO BASE64 UPLOADER
// ==========================================
app.post('/api/upload', authMiddleware, (req, res) => {
  const { base64Data, filename } = req.body;
  if (!base64Data) {
    return res.status(400).json({ error: 'Missing base64 data stream' });
  }

  // To build an instantly available local sandbox mock uploader without filesytem leakage:
  // We simply echo the clean base64 data back as a safe standard data URL.
  // This guarantees that uploads render instantly, run locally, are completely responsive, and do not crash due to missing credentials.
  const dataUri = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
  res.json({ url: dataUri });
});

// ==========================================
// VITE CLIENT ROUTING MIDDLEWARE
// ==========================================

async function startServer() {
  // Health check endpoint - must be before Vite middleware and catch-all routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  if (!isProductionRuntime) {
    // In development, the frontend is served by its own Vite dev server
    // (run via `npm run dev`). The backend API is served separately.
    console.log('Development mode: frontend served by TanStack Start dev server, backend API on port ' + PORT);
  } else {
    // TanStack Start / Nitro outputs to .output/public/ for client assets
    const outputPath = join(process.cwd(), 'frontend', '.output', 'public');
    const assetsPath = join(outputPath, 'assets');

    app.use('/assets', express.static(assetsPath, {
      immutable: true,
      maxAge: '1y',
    }));

    app.use(express.static(outputPath, {
      index: false,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-store');
        }
      },
    }));

    // SPA fallback for all non-API routes
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-store');
      res.sendFile(join(outputPath, 'index.html'));
    });
  }

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started. Running on port: ${PORT}`);
    console.log(` JWT_SECRET: ${JWT_SECRET === 'smart-vcard-enterprise-secret-key-2026' ? 'Using default (UNSECURE - set JWT_SECRET env var!)' : 'Configured'}`);
    console.log(` Health check: http://localhost:${PORT}/health`);
  });
}

startServer();
