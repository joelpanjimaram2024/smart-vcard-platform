import React, { useState } from 'react';
import { 
  CreditCard, Shield, Sparkles, Zap, Smartphone, BarChart3, Users, 
  HelpCircle, ArrowRight, CheckCircle2, ChevronRight, Play, Globe, Code
} from 'lucide-react';
import { BusinessCard } from '../types';
import { CardDisplay } from './CardTemplates';

interface LandingPageProps {
  onGetStarted: (role: 'individual' | 'company_admin') => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  const [sandboxCard, setSandboxCard] = useState<BusinessCard>({
    id: 'sandbox_try',
    publicId: 'sandbox-eleanor-vance',
    slug: 'eleanor-vance',
    userId: 'guest',
    companyName: 'Vance Creative',
    name: 'Eleanor Vance',
    title: 'Brand Strategist',
    designation: 'Creative Director & Designer',
    department: 'Marketing Creative Group',
    address: '18 Madison Ave, New York, NY',
    bio: 'Designing modern corporate identities and interactive user experiences for forward-thinking tech enterprises globally.',
    templateId: 'glass',
    theme: {
      primaryColor: '#6366f1',
      secondaryColor: '#10b981',
      textColor: '#0f172a',
      backgroundColor: '#f8fafc',
      cardColor: 'rgba(255, 255, 255, 0.75)',
      fontFamily: 'Inter',
      borderRadius: 'lg'
    },
    portfolio: [
      { id: 'sb_p1', title: 'Interactive Web Catalog', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=500&auto=format&fit=crop&q=80' }
    ],
    socialLinks: {
      website: 'https://eleanorvance.design',
      linkedin: 'https://linkedin.com/in/eleanor-vance-mock',
      instagram: 'https://instagram.com/eleanor_creative_mock'
    },
    contactButtons: {
      email: 'eleanor@vance.design',
      phone: '+1 (555) 102-3922'
    },
    customFields: [
      { id: 'f_sb_1', label: 'Availability', value: 'Q3 Bookings Open' }
    ],
    views: 140,
    scans: 42,
    downloads: 12,
    shares: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);

  const templates: ('modern' | 'minimalist' | 'classic' | 'neon' | 'glass')[] = [
    'modern', 'minimalist', 'classic', 'neon', 'glass'
  ];

  const fonts = ['Inter', 'Georgia', 'JetBrains Mono'];

  const handleSandboxChange = (key: string, value: any) => {
    setSandboxCard(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleThemeChange = (key: string, value: any) => {
    setSandboxCard(prev => ({
      ...prev,
      theme: {
        ...prev.theme,
        [key]: value
      }
    }));
  };

  const faqs = [
    {
      q: "What is a Smart Digital Business Card?",
      a: "A digital business card is a modern, interactive profile that contains all your contact buttons, social profiles, websites, portfolios, and custom fields. It can be shared instantly via QR Code, NFC, or direct URL, and updates in real-time."
    },
    {
      q: "Do people need an app to scan my card?",
      a: "Absolutely not! Anyone can scan your dynamic QR code or open your link in a standard web browser on iOS or Android. They can directly download your contact details into their phone's address book with one click."
    },
    {
      q: "Can I manage team cards for my company?",
      a: "Yes! Our Company Admin workspace allows you to establish corporate branding guidelines, upload your logo, and instantly invite employees. You can monitor team scans, lead conversions, and deactivate cards when employees leave."
    },
    {
      q: "Are the QR Codes dynamic or static?",
      a: "Our QR Codes are completely dynamic. If you change your phone number, social links, or template theme, the QR code remains exactly the same, but visitors will instantly see your updated design."
    }
  ];

  return (
    <div className="min-h-screen bg-[#09090b] text-white font-sans selection:bg-indigo-500 selection:text-white">
      {/* Glow Backdrops */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Navigation Header */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 flex items-center justify-center font-black shadow-md shadow-indigo-600/20">
            <CreditCard className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">Smart vCard</span>
            <span className="text-[9px] uppercase tracking-widest font-black text-emerald-400 block -mt-1 font-mono">Enterprise Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={onLogin}
            className="text-xs font-bold text-gray-300 hover:text-white transition-all cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => onGetStarted('company_admin')}
            className="text-xs font-bold px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-md shadow-indigo-600/15 hover:-translate-y-0.5 cursor-pointer"
          >
            Deploy Corporate Tenant
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 pb-20 text-center">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/40 text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-6 font-mono">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          The Future of Professional Networking
        </span>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
          Scale Professional Connections with{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 bg-clip-text text-transparent">
            Smart Digital Cards
          </span>
        </h1>
        <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto mt-6 leading-relaxed">
          Create, customize, and deploy dynamic business cards for individuals or entire corporate organizations. Track real-time QR scans, capture qualified B2B leads, and download vCards offline instantly.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4 mt-10">
          <button
            onClick={() => onGetStarted('company_admin')}
            className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:brightness-110 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Start Corporate Branding (Team)
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onGetStarted('individual')}
            className="px-6 py-3.5 bg-[#111113] hover:bg-[#161618] text-white border border-white/5 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            Create Free Personal vCard
          </button>
        </div>

        {/* Feature quick ribbon */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-16 pt-8 border-t border-white/5 text-left">
          <div className="flex gap-2.5">
            <Zap className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold">Instant NFC/QR Sync</h4>
              <p className="text-[10px] text-slate-500">Updates sync in real-time without reprinting.</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <BarChart3 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold">Real-Time Analytics</h4>
              <p className="text-[10px] text-slate-500">Track views, scans, and download channels.</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Shield className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold">Enterprise Guard RBAC</h4>
              <p className="text-[10px] text-slate-500">Full control over organizational credentials.</p>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Users className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-xs font-extrabold">CRM Lead Capture</h4>
              <p className="text-[10px] text-slate-500">Swap cards and capture leads into pipeline.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Interactive Sandbox tryout */}
      <section className="bg-[#111113]/40 py-20 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest font-mono">// EXPERIENCE LAB</span>
            <h2 className="text-3xl md:text-4xl font-black mt-2">Interactive Design Lab</h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xl mx-auto">Tweak templates, fonts, and brand colors to experience our real-time live rendering workspace instantly.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-10 items-stretch max-w-5xl mx-auto">
            {/* Sandbox Inputs (Left) */}
            <div className="lg:w-1/2 bg-[#111113] p-6 rounded-2xl border border-white/5 flex flex-col justify-between">
              <div className="space-y-5">
                <div>
                  <h4 className="text-xs font-black uppercase text-indigo-400 tracking-wider mb-2">// 1. Typography & Info</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Full Name</label>
                      <input 
                        type="text" 
                        value={sandboxCard.name}
                        onChange={(e) => handleSandboxChange('name', e.target.value)}
                        className="w-full text-xs p-2 bg-[#09090b] border border-white/5 rounded focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Designation</label>
                      <input 
                        type="text" 
                        value={sandboxCard.designation}
                        onChange={(e) => handleSandboxChange('designation', e.target.value)}
                        className="w-full text-xs p-2 bg-[#09090b] border border-white/5 rounded focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Interactive Bio</label>
                  <textarea 
                    value={sandboxCard.bio}
                    onChange={(e) => handleSandboxChange('bio', e.target.value)}
                    rows={2}
                    className="w-full text-xs p-2 bg-[#09090b] border border-white/5 rounded focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-400 tracking-wider mb-2">// 2. Layout & Styling</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Card Layout</label>
                      <select 
                        value={sandboxCard.templateId}
                        onChange={(e) => handleSandboxChange('templateId', e.target.value)}
                        className="w-full text-xs p-2 bg-[#09090b] border border-white/5 rounded focus:outline-none focus:border-indigo-500 capitalize"
                      >
                        {templates.map(t => (
                          <option key={t} value={t}>{t} Theme</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Font Pairings</label>
                      <select 
                        value={sandboxCard.theme.fontFamily}
                        onChange={(e) => handleThemeChange('fontFamily', e.target.value)}
                        className="w-full text-xs p-2 bg-[#09090b] border border-white/5 rounded focus:outline-none focus:border-indigo-500"
                      >
                        {fonts.map(f => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Brand Accent</label>
                    <input 
                      type="color" 
                      value={sandboxCard.theme.primaryColor}
                      onChange={(e) => handleThemeChange('primaryColor', e.target.value)}
                      className="w-full h-8 bg-transparent border border-white/5 rounded cursor-pointer p-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Text Fill</label>
                    <input 
                      type="color" 
                      value={sandboxCard.theme.textColor}
                      onChange={(e) => handleThemeChange('textColor', e.target.value)}
                      className="w-full h-8 bg-transparent border border-white/5 rounded cursor-pointer p-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider text-slate-500 font-bold mb-1">Card BG</label>
                    <input 
                      type="color" 
                      value={sandboxCard.theme.cardColor}
                      disabled={sandboxCard.templateId === 'glass'}
                      onChange={(e) => handleThemeChange('cardColor', e.target.value)}
                      className="w-full h-8 bg-transparent border border-white/5 rounded cursor-pointer p-0 disabled:opacity-40"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/10 mt-6 text-center">
                <button
                  onClick={() => onGetStarted('individual')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  Claim & Register This Card Structure
                </button>
              </div>
            </div>

            {/* Sandbox Live Mock Phone (Right) */}
            <div className="lg:w-1/2 flex items-center justify-center p-4 bg-[#111113]/40 rounded-2xl border border-white/5">
              <div className="relative w-full max-w-[340px] rounded-[40px] border-8 border-white/5 bg-[#111113] overflow-hidden shadow-2xl flex flex-col items-center p-3 py-6">
                {/* Speaker pill */}
                <div className="w-16 h-3.5 bg-[#161618] rounded-full mb-4 shadow-inner flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-indigo-500 animate-pulse" />
                </div>
                
                {/* Simulated frame display */}
                <div className="w-full overflow-hidden rounded-[24px]" style={{ backgroundColor: sandboxCard.theme.backgroundColor }}>
                  <CardDisplay card={sandboxCard} isInteractive={false} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Corporate Pricing Grid */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-12">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">SAAS PLANS</span>
          <h2 className="text-3xl md:text-4xl font-black mt-1">Scale Without Limitations</h2>
          <p className="text-xs text-slate-400 mt-2">Whether you are an independent consultant or scaling a Fortune 500 team, we have the framework.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {/* Individual tier */}
          <div className="p-6 bg-[#111113] rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold">Professional</h3>
              <p className="text-xs text-slate-500 mt-1">For independent builders and designers.</p>
              <div className="my-5">
                <span className="text-3xl font-black">$0</span>
                <span className="text-xs text-slate-500 ml-1">Free Forever</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400 pt-3 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>1 Digital Business Card</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Offline vCard File Download</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Interactive Spline Themes</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => onGetStarted('individual')}
              className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Get Started Free
            </button>
          </div>

          {/* Growth Tier */}
          <div className="p-6 bg-[#161618] rounded-2xl border-2 border-indigo-600 flex flex-col justify-between relative shadow-lg shadow-indigo-600/5">
            <span className="absolute -top-3 right-4 px-2.5 py-0.5 bg-indigo-600 text-[9px] font-black uppercase rounded-full text-white">Most Popular</span>
            <div>
              <h3 className="text-lg font-bold">SaaS Growth</h3>
              <p className="text-xs text-indigo-300 mt-1">For growing corporate agencies.</p>
              <div className="my-5">
                <span className="text-3xl font-black">$49</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-300 pt-3 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Up to 25 Corporate Cards</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Dynamic QR Code Customizer</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>CRM Lead Pipeline Capture</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>7-day Historical Charts</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => onGetStarted('company_admin')}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
            >
              Configure Tenant (14-day Trial)
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="p-6 bg-[#111113] rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold">Enterprise</h3>
              <p className="text-xs text-slate-500 mt-1">For multi-national operations.</p>
              <div className="my-5">
                <span className="text-3xl font-black">$199</span>
                <span className="text-xs text-slate-500 ml-1">/ month</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-400 pt-3 border-t border-white/5">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Unlimited Employee Accounts</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Custom Master Branding Logo</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Corporate SSO & RBAC Audits</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  <span>Full Analytics Geolocation API</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => onGetStarted('company_admin')}
              className="mt-6 w-full py-2 bg-white/5 hover:bg-white/10 text-white border border-white/5 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Contact Commercial Desk
            </button>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="bg-[#09090b] py-20 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">SUPPORT BASE</span>
            <h2 className="text-3xl font-black mt-1">Frequently Answered Queries</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className="bg-[#111113] rounded-xl border border-white/5 overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => setActiveFAQ(activeFAQ === idx ? null : idx)}
                  className="w-full p-4 text-left font-semibold text-sm flex justify-between items-center cursor-pointer hover:bg-white/5 transition-all"
                >
                  <span>{faq.q}</span>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-all ${activeFAQ === idx ? 'rotate-90' : ''}`} />
                </button>
                <div 
                  className={`px-4 pb-4 text-xs text-slate-400 leading-relaxed transition-all ${activeFAQ === idx ? 'block mt-1 border-t border-white/5 pt-2' : 'hidden'}`}
                >
                  {faq.a}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#09090b] py-12 border-t border-white/5 relative z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-sm tracking-tight text-white">Smart vCard SaaS</span>
              <p className="text-[9px] text-slate-500 font-mono">Enterprise networking system</p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            © 2026 Smart vCard Platform Inc. Designed for premium global corporate deployments. All Rights Reserved.
          </p>

          <div className="flex gap-4 text-xs font-semibold text-slate-400">
            <a href="#" className="hover:text-white transition-all">Privacy Guard</a>
            <span className="text-white/10">|</span>
            <a href="#" className="hover:text-white transition-all">Service Terms</a>
            <span className="text-white/10">|</span>
            <a href="#" className="hover:text-white transition-all">API Access</a>
          </div>
        </div>
      </footer>
    </div>
  );
};
