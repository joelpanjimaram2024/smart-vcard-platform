import React, { useState } from 'react';
import { 
  Globe, Linkedin, Github, Instagram, Twitter, Facebook, Youtube, 
  Mail, Phone, MessageSquare, Calendar, ChevronRight, UserCheck, 
  Send, ExternalLink, Download, Share2, Plus, Info
} from 'lucide-react';
import { BusinessCard, SocialLinks, ContactButtons, CustomField } from '../types';
import { downloadVCard } from '../utils/vcard';
import { apiUrl, readJsonResponse } from '../utils/api';
import { getPublicCardUrl } from '../utils/publicCardUrl';

interface CardDisplayProps {
  card: BusinessCard;
  onActionClick?: (type: 'download' | 'share' | 'link_click', label?: string) => void;
  isInteractive?: boolean;
}

// Maps fonts to CSS classes
export const fontClassMap: Record<string, string> = {
  'Inter': 'font-sans',
  'JetBrains Mono': 'font-mono',
  'Georgia': 'font-serif',
  'System': 'font-sans'
};

export const CardDisplay: React.FC<CardDisplayProps> = ({ card, onActionClick, isInteractive = false }) => {
  const { name, title, designation, department, bio, profilePhoto, companyLogo, templateId, theme, socialLinks, contactButtons, customFields, portfolio } = card;

  const fontClass = fontClassMap[theme.fontFamily] || 'font-sans';
  
  // Custom Styles for dynamic colors
  const customCardStyle: React.CSSProperties = {
    fontFamily: theme.fontFamily,
    backgroundColor: templateId === 'glass' ? undefined : theme.cardColor,
    color: theme.textColor,
    borderRadius: theme.borderRadius === 'none' ? '0px' : 
                  theme.borderRadius === 'sm' ? '4px' : 
                  theme.borderRadius === 'md' ? '8px' : 
                  theme.borderRadius === 'lg' ? '16px' : '9999px',
    borderColor: theme.primaryColor + '20'
  };

  const handleLinkClick = (platform: string) => {
    if (onActionClick) onActionClick('link_click', platform);
  };

  const renderSocialIcon = (platform: keyof SocialLinks, url: string) => {
    if (!url) return null;
    const icons: Record<string, any> = {
      website: <Globe className="w-5 h-5" />,
      linkedin: <Linkedin className="w-5 h-5" />,
      github: <Github className="w-5 h-5" />,
      instagram: <Instagram className="w-5 h-5" />,
      twitter: <Twitter className="w-5 h-5" />,
      facebook: <Facebook className="w-5 h-5" />,
      youtube: <Youtube className="w-5 h-5" />,
      whatsapp: <MessageSquare className="w-5 h-5" />,
      calendly: <Calendar className="w-5 h-5" />
    };

    const icon = icons[platform] || <ExternalLink className="w-5 h-5" />;

    return (
      <a
        key={platform}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => handleLinkClick(platform)}
        className="p-3 bg-white/10 dark:bg-black/10 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all duration-300 flex items-center justify-center transform hover:scale-110 border border-gray-200/20 shadow-sm"
        style={{ color: theme.primaryColor }}
        title={platform}
      >
        {icon}
      </a>
    );
  };

  // Modern Template Rendering
  if (templateId === 'modern') {
    return (
      <div 
        id="vcard-display-container"
        className={`w-full max-w-md border overflow-hidden shadow-xl transition-all duration-300 ${fontClass}`}
        style={customCardStyle}
      >
        {/* Banner with theme primary color */}
        <div className="h-32 w-full relative" style={{ backgroundColor: theme.primaryColor }}>
          {companyLogo && (
            <img 
              src={companyLogo} 
              alt="Company Logo" 
              className="absolute top-4 right-4 h-10 object-contain bg-white/90 p-1 rounded shadow-sm"
              referrerPolicy="no-referrer"
            />
          )}
        </div>

        {/* Profile Card details */}
        <div className="px-6 pb-6 -mt-16 relative z-10">
          <div className="flex justify-between items-end mb-4">
            <div className="w-28 h-28 rounded-xl border-4 border-white dark:border-slate-800 overflow-hidden shadow-md bg-gray-100">
              {profilePhoto ? (
                <img src={profilePhoto} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500 font-bold text-2xl">
                  {name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: theme.textColor }}>{name}</h2>
            <p className="text-sm font-medium opacity-80" style={{ color: theme.primaryColor }}>{designation}</p>
            {department && <p className="text-xs opacity-60 uppercase tracking-wider font-semibold mt-0.5">{department}</p>}
          </div>

          {bio && <p className="text-sm mt-3 opacity-75 leading-relaxed border-t border-gray-100 dark:border-slate-700/50 pt-3">{bio}</p>}

          {/* Quick Action Buttons */}
          <div className="grid grid-cols-3 gap-2 mt-4">
            {contactButtons.phone && (
              <a 
                href={`tel:${contactButtons.phone}`}
                className="flex flex-col items-center justify-center p-2 rounded-lg border text-center hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                style={{ borderColor: theme.primaryColor + '30', color: theme.textColor }}
              >
                <Phone className="w-4 h-4 mb-1" style={{ color: theme.primaryColor }} />
                <span className="text-[10px] font-medium">Call</span>
              </a>
            )}
            {contactButtons.email && (
              <a 
                href={`mailto:${contactButtons.email}`}
                className="flex flex-col items-center justify-center p-2 rounded-lg border text-center hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                style={{ borderColor: theme.primaryColor + '30', color: theme.textColor }}
              >
                <Mail className="w-4 h-4 mb-1" style={{ color: theme.primaryColor }} />
                <span className="text-[10px] font-medium">Email</span>
              </a>
            )}
            {contactButtons.sms && (
              <a 
                href={`sms:${contactButtons.sms}`}
                className="flex flex-col items-center justify-center p-2 rounded-lg border text-center hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                style={{ borderColor: theme.primaryColor + '30', color: theme.textColor }}
              >
                <MessageSquare className="w-4 h-4 mb-1" style={{ color: theme.primaryColor }} />
                <span className="text-[10px] font-medium">Message</span>
              </a>
            )}
          </div>

          {/* Custom Fields */}
          {customFields && customFields.length > 0 && (
            <div className="mt-5 space-y-2 border-t border-gray-100 dark:border-slate-700/50 pt-4">
              {customFields.map((field) => (
                <div key={field.id} className="flex justify-between items-center text-xs p-2 rounded bg-black/5 dark:bg-white/5">
                  <span className="font-semibold opacity-70">{field.label}</span>
                  <span className="font-medium opacity-90">{field.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Social Links */}
          {Object.keys(socialLinks).some(k => !!socialLinks[k as keyof SocialLinks]) && (
            <div className="mt-6 border-t border-gray-100 dark:border-slate-700/50 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-60">Connect Digitally</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(socialLinks).map(([platform, url]) => 
                  url ? renderSocialIcon(platform as keyof SocialLinks, url as string) : null
                )}
              </div>
            </div>
          )}

          {/* Portfolio section */}
          {portfolio && portfolio.length > 0 && (
            <div className="mt-6 border-t border-gray-100 dark:border-slate-700/50 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 opacity-60">Portfolio & Projects</h3>
              <div className="grid grid-cols-2 gap-2">
                {portfolio.map((item) => (
                  <div key={item.id} className="group relative rounded-lg overflow-hidden border border-gray-200/10 shadow-sm aspect-video bg-gray-900">
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-300" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                      <p className="text-[10px] text-white font-medium truncate w-full">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Neon Cyberpunk Vibe
  if (templateId === 'neon') {
    return (
      <div 
        id="vcard-display-container"
        className={`w-full max-w-md border overflow-hidden shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all duration-300 relative ${fontClass}`}
        style={customCardStyle}
      >
        {/* Glow strip */}
        <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${theme.primaryColor}, ${theme.secondaryColor})` }} />

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div 
              className="w-20 h-20 rounded-full border-2 overflow-hidden shadow-lg p-0.5"
              style={{ borderColor: theme.primaryColor }}
            >
              {profilePhoto ? (
                <img src={profilePhoto} alt={name} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-purple-900/50 text-white font-bold text-xl rounded-full">
                  {name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight" style={{ textShadow: `0 0 10px ${theme.primaryColor}50` }}>{name}</h2>
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: theme.secondaryColor }}>{designation}</p>
              {department && <p className="text-[10px] opacity-50 uppercase tracking-widest">{department}</p>}
            </div>
          </div>

          {bio && (
            <p 
              className="text-xs p-3 rounded bg-purple-950/20 border-l-2 mb-4 leading-relaxed"
              style={{ borderColor: theme.primaryColor }}
            >
              {bio}
            </p>
          )}

          {/* Contact Actions */}
          <div className="flex flex-wrap gap-2 mb-5">
            {contactButtons.phone && (
              <a 
                href={`tel:${contactButtons.phone}`}
                className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all hover:brightness-110"
                style={{ backgroundColor: theme.primaryColor, color: '#ffffff' }}
              >
                <Phone className="w-3 h-3" />
                <span>Call</span>
              </a>
            )}
            {contactButtons.email && (
              <a 
                href={`mailto:${contactButtons.email}`}
                className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all border hover:bg-white/5"
                style={{ borderColor: theme.secondaryColor, color: theme.secondaryColor }}
              >
                <Mail className="w-3 h-3" />
                <span>Email</span>
              </a>
            )}
            {contactButtons.sms && (
              <a 
                href={`sms:${contactButtons.sms}`}
                className="px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1.5 transition-all hover:opacity-85"
                style={{ backgroundColor: theme.secondaryColor, color: '#000000' }}
              >
                <MessageSquare className="w-3 h-3" />
                <span>SMS</span>
              </a>
            )}
          </div>

          {/* Custom Fields */}
          {customFields && customFields.length > 0 && (
            <div className="mt-4 space-y-2">
              {customFields.map((field) => (
                <div key={field.id} className="flex justify-between items-center text-xs p-2 rounded bg-black/40 border border-purple-500/10">
                  <span className="font-bold uppercase opacity-60 text-[10px] tracking-wider" style={{ color: theme.secondaryColor }}>{field.label}</span>
                  <span className="font-mono opacity-90">{field.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Social Handle Matrix */}
          {Object.keys(socialLinks).some(k => !!socialLinks[k as keyof SocialLinks]) && (
            <div className="mt-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-50" style={{ color: theme.primaryColor }}>// SYSTEM_LINKS</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(socialLinks).map(([platform, url]) => 
                  url ? renderSocialIcon(platform as keyof SocialLinks, url as string) : null
                )}
              </div>
            </div>
          )}

          {/* Portfolios */}
          {portfolio && portfolio.length > 0 && (
            <div className="mt-6">
              <h3 className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-50" style={{ color: theme.secondaryColor }}>// VISUAL_VAULT</h3>
              <div className="grid grid-cols-2 gap-2">
                {portfolio.map((item) => (
                  <div key={item.id} className="group relative rounded overflow-hidden border border-purple-500/20 aspect-video bg-black shadow-inner">
                    <img src={item.url} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-all duration-300" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 to-transparent flex items-end p-2">
                      <p className="text-[9px] font-mono text-purple-200 truncate w-full">{item.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Classic Serene Template (Serif elegant style)
  if (templateId === 'classic') {
    return (
      <div 
        id="vcard-display-container"
        className={`w-full max-w-md border overflow-hidden shadow-lg transition-all duration-300 bg-amber-50/20 ${fontClass}`}
        style={customCardStyle}
      >
        <div className="p-8 text-center">
          {companyLogo && (
            <div className="flex justify-center mb-4">
              <img src={companyLogo} alt="Logo" className="h-8 object-contain opacity-85" referrerPolicy="no-referrer" />
            </div>
          )}

          <div className="flex justify-center mb-4">
            <div className="w-24 h-24 rounded-full border-2 border-amber-900/10 overflow-hidden bg-white p-1">
              {profilePhoto ? (
                <img src={profilePhoto} alt={name} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-700 font-bold text-xl rounded-full">
                  {name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <h2 className="text-2xl font-serif tracking-normal font-bold mb-1" style={{ color: theme.textColor }}>{name}</h2>
          <p className="text-xs italic uppercase tracking-wider font-semibold opacity-75 mb-1" style={{ color: theme.primaryColor }}>{designation}</p>
          {department && <p className="text-[10px] uppercase tracking-wider opacity-50">{department}</p>}
          
          <div className="w-12 h-0.5 bg-stone-300 mx-auto my-4" style={{ backgroundColor: theme.primaryColor }} />

          {bio && <p className="text-xs italic opacity-80 leading-relaxed mb-6 px-4">{bio}</p>}

          {/* Quick contact buttons */}
          <div className="flex justify-center gap-3 mb-6">
            {contactButtons.phone && (
              <a 
                href={`tel:${contactButtons.phone}`}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all"
                style={{ color: theme.primaryColor }}
              >
                <Phone className="w-4 h-4" />
              </a>
            )}
            {contactButtons.email && (
              <a 
                href={`mailto:${contactButtons.email}`}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all"
                style={{ color: theme.primaryColor }}
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
            {contactButtons.sms && (
              <a 
                href={`sms:${contactButtons.sms}`}
                className="w-9 h-9 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-all"
                style={{ color: theme.primaryColor }}
              >
                <MessageSquare className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Custom Fields */}
          {customFields && customFields.length > 0 && (
            <div className="space-y-2 text-left bg-stone-50 p-4 rounded border border-stone-200/50 mb-6">
              {customFields.map((field) => (
                <div key={field.id} className="flex justify-between items-center text-xs">
                  <span className="font-bold text-stone-500">{field.label}</span>
                  <span className="text-stone-800">{field.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Social links */}
          {Object.keys(socialLinks).some(k => !!socialLinks[k as keyof SocialLinks]) && (
            <div className="border-t border-stone-200/60 pt-4 text-center">
              <h3 className="text-[10px] font-sans uppercase tracking-widest text-stone-400 mb-3 font-semibold">Digital Contacts</h3>
              <div className="flex justify-center flex-wrap gap-2">
                {Object.entries(socialLinks).map(([platform, url]) => 
                  url ? renderSocialIcon(platform as keyof SocialLinks, url as string) : null
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Minimalist Pure High-Contrast
  if (templateId === 'minimalist') {
    return (
      <div 
        id="vcard-display-container"
        className={`w-full max-w-md border border-stone-200 shadow-sm transition-all duration-300 ${fontClass}`}
        style={customCardStyle}
      >
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-light tracking-tight mb-1" style={{ color: theme.textColor }}>{name}</h2>
              <p className="text-xs uppercase tracking-widest font-semibold" style={{ color: theme.primaryColor }}>{designation}</p>
              {department && <p className="text-[10px] text-gray-400 uppercase mt-0.5">{department}</p>}
            </div>
            
            {profilePhoto && (
              <div className="w-16 h-16 rounded overflow-hidden grayscale hover:grayscale-0 transition-all duration-500 bg-gray-100">
                <img src={profilePhoto} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </div>
            )}
          </div>

          {bio && <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed mb-6 border-b border-stone-100 pb-4">{bio}</p>}

          {/* Quick Actions */}
          <div className="space-y-1.5 mb-6">
            {contactButtons.phone && (
              <a href={`tel:${contactButtons.phone}`} className="flex items-center gap-3 text-xs opacity-85 hover:opacity-100 py-1 transition-all">
                <Phone className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
                <span>{contactButtons.phone}</span>
              </a>
            )}
            {contactButtons.email && (
              <a href={`mailto:${contactButtons.email}`} className="flex items-center gap-3 text-xs opacity-85 hover:opacity-100 py-1 transition-all">
                <Mail className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
                <span>{contactButtons.email}</span>
              </a>
            )}
          </div>

          {/* Custom Fields */}
          {customFields && customFields.length > 0 && (
            <div className="space-y-1.5 mb-6">
              {customFields.map((field) => (
                <div key={field.id} className="text-xs flex justify-between border-b border-stone-50 py-1">
                  <span className="opacity-50">{field.label}</span>
                  <span className="font-semibold">{field.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Social Network row */}
          {Object.keys(socialLinks).some(k => !!socialLinks[k as keyof SocialLinks]) && (
            <div className="pt-4 border-t border-stone-100 flex flex-wrap gap-2">
              {Object.entries(socialLinks).map(([platform, url]) => 
                url ? (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-wider font-semibold opacity-75 hover:opacity-100 underline decoration-1"
                    style={{ color: theme.primaryColor }}
                  >
                    {platform}
                  </a>
                ) : null
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Glassmorphism Premium Style
  return (
    <div 
      id="vcard-display-container"
      className={`w-full max-w-md backdrop-blur-xl bg-white/20 dark:bg-slate-900/30 border border-white/30 dark:border-slate-800/40 overflow-hidden shadow-[0_8px_32px_0_rgba(31,38,135,0.15)] transition-all duration-300 ${fontClass}`}
      style={customCardStyle}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-black tracking-tight" style={{ color: theme.textColor }}>{name}</h2>
            <p className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/30 dark:bg-black/20 inline-block mt-1" style={{ color: theme.primaryColor }}>
              {designation}
            </p>
            {department && <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{department}</p>}
          </div>

          {profilePhoto ? (
            <img src={profilePhoto} alt={name} className="w-16 h-16 rounded-2xl object-cover border border-white/40 shadow-inner" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-white/30 text-slate-700 font-bold text-xl border border-white/40">
              {name.charAt(0)}
            </div>
          )}
        </div>

        {bio && <p className="text-xs opacity-80 leading-relaxed mb-6 bg-white/10 dark:bg-black/10 p-3 rounded-lg border border-white/10">{bio}</p>}

        {/* Contact list in row form */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {contactButtons.phone && (
            <a 
              href={`tel:${contactButtons.phone}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/20 hover:bg-white/35 transition-all text-xs"
            >
              <Phone className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
              <span className="truncate">Call Me</span>
            </a>
          )}
          {contactButtons.email && (
            <a 
              href={`mailto:${contactButtons.email}`}
              className="flex items-center gap-2 p-2 rounded-lg bg-white/20 hover:bg-white/35 transition-all text-xs"
            >
              <Mail className="w-3.5 h-3.5" style={{ color: theme.primaryColor }} />
              <span className="truncate">Send Email</span>
            </a>
          )}
        </div>

        {/* Custom Fields */}
        {customFields && customFields.length > 0 && (
          <div className="space-y-2 mb-6">
            {customFields.map((field) => (
              <div key={field.id} className="text-xs flex justify-between bg-white/10 dark:bg-black/10 p-2 rounded-lg border border-white/5">
                <span className="opacity-65 font-bold">{field.label}</span>
                <span className="opacity-95">{field.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Social connections */}
        {Object.keys(socialLinks).some(k => !!socialLinks[k as keyof SocialLinks]) && (
          <div className="pt-4 border-t border-white/20">
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Connect Digitally</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(socialLinks).map(([platform, url]) => 
                url ? renderSocialIcon(platform as keyof SocialLinks, url as string) : null
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ==========================================
// LEAD CAPTURE FORM FOR PROFILE CARDS
// ==========================================

interface LeadCaptureFormProps {
  cardId: string;
  onSuccess?: () => void;
  primaryColor?: string;
}

export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({ cardId, onSuccess, primaryColor = '#4f46e5' }) => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', company: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError('Please provide at least a name and email address.');
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(apiUrl(`/api/public/cards/${cardId}/lead`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, source: 'Digital Card View' })
      });

      const data = await readJsonResponse(response, `/api/public/cards/${cardId}/lead`);
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit contact request');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '', company: '', notes: '' });
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Something went wrong, please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-xl border border-gray-150 dark:border-slate-700/80 shadow-md">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
          <UserCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">Send Connection Request</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">Introduce yourself to swap professional cards.</p>
        </div>
      </div>

      {success ? (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-400 rounded-lg text-center text-sm border border-emerald-100 dark:border-emerald-950/35">
          <p className="font-bold mb-1">Message Sent!</p>
          <p className="text-xs">Your connection details have been saved. They will reach out shortly.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="mt-3 text-xs font-semibold underline cursor-pointer"
          >
            Submit another message
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && <p className="text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/10 p-2 rounded border border-rose-100">{error}</p>}
          
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Your Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Victor Vance"
                className="w-full text-xs p-2 rounded-md border border-gray-250 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Your Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. victor@ventures.com"
                className="w-full text-xs p-2 rounded-md border border-gray-250 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Your Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +1 (555) 304-9244"
                className="w-full text-xs p-2 rounded-md border border-gray-250 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Your Company</label>
              <input
                type="text"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. Vice Ventures"
                className="w-full text-xs p-2 rounded-md border border-gray-250 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 dark:text-gray-400 mb-1">Inquiry / Note</label>
            <textarea
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="How would you like to collaborate?"
              rows={2}
              className="w-full text-xs p-2 rounded-md border border-gray-250 dark:border-slate-700 bg-transparent dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm hover:brightness-110 cursor-pointer"
            style={{ backgroundColor: primaryColor }}
          >
            {loading ? 'Sending...' : 'Swap Digital Cards'}
            <Send className="w-3 h-3" />
          </button>
        </form>
      )}
    </div>
  );
};

// ==========================================
// PUBLIC CARD WRAPPER COMPONENT
// ==========================================

interface CardPublicViewProps {
  cardId: string;
  onClose?: () => void;
}

export const CardPublicView: React.FC<CardPublicViewProps> = ({ cardId, onClose }) => {
  const [data, setData] = useState<{ card: BusinessCard; owner: any } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  React.useEffect(() => {
    const fetchCard = async () => {
      try {
        const res = await fetch(apiUrl(`/api/public/cards/${cardId}`));
        const result = await readJsonResponse(res, `/api/public/cards/${cardId}`);
        if (!res.ok) {
          throw new Error(result.error || 'Failed to locate card profile');
        }
        setData(result);
      } catch (err: any) {
        setError(err.message || 'vCard profile does not exist or has been suspended.');
      } finally {
        setLoading(false);
      }
    };
    fetchCard();
  }, [cardId]);

  const handleAction = async (type: 'download' | 'share' | 'link_click', label?: string) => {
    // Log event to backend
    try {
      await fetch(apiUrl(`/api/public/cards/${cardId}/event`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type === 'link_click' ? 'share' : type })
      });
    } catch {
      // Ignored silent error
    }
  };

  const handleSaveContact = () => {
    if (!data) return;
    handleAction('download');
    downloadVCard(data.card);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl flex flex-col items-center shadow-2xl">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Retrieving digital business card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl max-w-sm text-center shadow-2xl border border-gray-150">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <Info className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">Card Inactive</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{error}</p>
          <button 
            onClick={onClose}
            className="mt-4 px-4 py-1.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-md text-xs font-semibold hover:bg-gray-300"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-gray-50 dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-slate-800 flex flex-col md:flex-row relative">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-black/20 dark:hover:bg-white/20 transition-all font-semibold text-xs cursor-pointer"
        >
          ✕ Close
        </button>

        {/* Card display preview pane */}
        <div className="md:w-1/2 p-6 md:p-10 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-gray-200/50 dark:border-slate-800" style={{ background: data.card.theme.backgroundColor }}>
          <div className="w-full flex justify-center mb-4">
            <div className="px-3 py-1 bg-white/40 backdrop-blur border text-[10px] font-bold rounded-full text-slate-800 uppercase tracking-widest shadow-sm">
              Live Preview
            </div>
          </div>
          
          <CardDisplay card={data.card} onActionClick={handleAction} />

          <button
            onClick={handleSaveContact}
            className="mt-6 w-full max-w-md py-3 rounded-xl text-white font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 shadow-lg shadow-indigo-600/10 flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Save Contact Details (vCard)
          </button>
        </div>

        {/* Lead Capture form pane */}
        <div className="md:w-1/2 p-6 md:p-10 bg-white dark:bg-slate-950 flex flex-col justify-between">
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">{data.card.companyId ? 'Corporate Card' : 'Professional Card'}</span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">Networking Connect</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Scan to connect with {data.card.name}. Fill out the connection portal to instantly swap professional portfolios.</p>
            </div>

            <LeadCaptureForm cardId={data.card.id} primaryColor={data.card.theme.primaryColor} />

            {/* Quick action buttons row */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getPublicCardUrl(data.card.publicId));
                  handleAction('share');
                  alert('Business card URL copied to clipboard!');
                }}
                className="py-2 px-4 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                Copy Link
              </button>
              <a
                href={`mailto:${data.card.contactButtons.email || ''}?subject=Connecting from Smart vCard`}
                onClick={() => handleAction('link_click', 'email_direct')}
                className="py-2 px-4 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-900 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Direct Mail
              </a>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 dark:border-slate-900 text-center">
            <p className="text-[10px] text-gray-400">Powered by <span className="font-bold text-indigo-600">Smart vCard Platform</span></p>
          </div>
        </div>

      </div>
    </div>
  );
};
