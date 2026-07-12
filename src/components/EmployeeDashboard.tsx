import React, { useEffect, useMemo, useState } from 'react';
import { 
  CreditCard, Plus, Edit3, Eye, QrCode, Trash2, Heart, Search, 
  MapPin, Tag, Briefcase, Mail, Phone, ExternalLink, Calendar,
  BarChart3, Smartphone, Laptop, Tablet, Globe, PlusCircle, Check, Info, RefreshCw,
  Download, Users, Filter, X
} from 'lucide-react';
import { BusinessCard, Contact, Lead, SocialLinks, ContactButtons, CustomField } from '../types';
import { CardDisplay } from './CardTemplates';
import { apiUrl, readJsonResponse } from '../utils/api';
import { InteractiveChart } from './InteractiveChart';

interface EmployeeDashboardProps {
  user: any;
  token: string;
  onSelectCardForQR: (card: BusinessCard) => void;
  onSelectCardForPreview: (cardId: string) => void;
}

export const EmployeeDashboard: React.FC<EmployeeDashboardProps> = ({ 
  user, token, onSelectCardForQR, onSelectCardForPreview 
}) => {
  const [cards, setCards] = useState<BusinessCard[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState<'cards' | 'builder' | 'crm'>('cards');
  const [editingCard, setEditingCard] = useState<BusinessCard | null>(null);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState<'all' | Lead['status']>('all');
  const [leadSourceFilter, setLeadSourceFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Metrics Metric Filter
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'scans' | 'downloads'>('scans');

  const fetchWorkspaceData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [cardsRes, contactsRes, leadsRes, analyticsRes] = await Promise.all([
        fetch(apiUrl('/api/cards'), { headers }),
        fetch(apiUrl('/api/contacts'), { headers }),
        fetch(apiUrl('/api/leads'), { headers }),
        fetch(apiUrl('/api/analytics'), { headers })
      ]);

      if (!cardsRes.ok || !contactsRes.ok || !leadsRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to retrieve personal network profile.');
      }

      const cardsData = await readJsonResponse(cardsRes, '/api/cards');
      const contactsData = await readJsonResponse(contactsRes, '/api/contacts');
      const leadsData = await readJsonResponse(leadsRes, '/api/leads');
      const analyticsData = await readJsonResponse(analyticsRes, '/api/analytics');

      setCards(cardsData.cards || []);
      setContacts(contactsData.contacts || []);
      setLeads(leadsData.leads || []);
      setAnalytics(analyticsData || null);
    } catch (err: any) {
      setError(err.message || 'Error fetching records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [token]);

  // Card CRUD
  const handleStartCreateCard = () => {
    const starterTheme = {
      primaryColor: '#4f46e5',
      secondaryColor: '#10b981',
      textColor: '#1e293b',
      backgroundColor: '#f8fafc',
      cardColor: '#ffffff',
      fontFamily: 'Inter',
      borderRadius: 'md'
    };

    const newStarter: BusinessCard = {
      id: '',
      publicId: '',
      slug: '',
      userId: user.id,
      companyId: user.companyId || '',
      companyName: user.company?.name || '',
      name: user.name,
      title: 'Digital Card',
      designation: 'Senior Consultant',
      department: '',
      address: '',
      bio: 'Connect with me to build elite, smart enterprise innovations.',
      profilePhoto: '',
      companyLogo: '',
      templateId: 'modern',
      theme: starterTheme,
      portfolio: [],
      socialLinks: {},
      contactButtons: { email: user.email },
      customFields: [],
      views: 0,
      scans: 0,
      downloads: 0,
      shares: 0,
      createdAt: '',
      updatedAt: ''
    };

    setEditingCard(newStarter);
    setActiveTab('builder');
  };

  const handleStartEditCard = (card: BusinessCard) => {
    setEditingCard(card);
    setActiveTab('builder');
  };

  const handleSaveCard = async () => {
    if (!editingCard) return;
    try {
      const method = editingCard.id ? 'PUT' : 'POST';
      const endpoint = editingCard.id ? `/api/cards/${editingCard.id}` : '/api/cards';

      const res = await fetch(apiUrl(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(editingCard)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to save digital card');

      alert(editingCard.id ? 'Digital card saved!' : 'New digital card created successfully!');
      setEditingCard(null);
      fetchWorkspaceData(); // Refresh list
      setActiveTab('cards');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm('Are you absolutely certain you wish to delete this digital business card? This action is irreversible.')) return;
    try {
      const res = await fetch(apiUrl(`/api/cards/${cardId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete card');
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Profile image file base64 loaders
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'profilePhoto' | 'companyLogo') => {
    const file = e.target.files?.[0];
    if (!file || !editingCard) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingCard({
        ...editingCard,
        [field]: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Lead Conversion status PUT
  const handleLeadStatusToggle = async (leadId: string, nextStatus: string) => {
    try {
      const res = await fetch(apiUrl(`/api/leads/${leadId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });
      if (!res.ok) throw new Error('Status change failed');
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Sub-component modifiers
  const handleSocialChange = (platform: keyof SocialLinks, value: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      socialLinks: {
        ...editingCard.socialLinks,
        [platform]: value
      }
    });
  };

  const handleContactBtnChange = (field: keyof ContactButtons, value: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      contactButtons: {
        ...editingCard.contactButtons,
        [field]: value
      }
    });
  };

  const handleThemeColorChange = (key: string, value: string) => {
    if (!editingCard) return;
    setEditingCard({
      ...editingCard,
      theme: {
        ...editingCard.theme,
        [key]: value
      }
    });
  };

  // Portfolio items additions
  const handleAddPortfolio = () => {
    if (!editingCard) return;
    const itemUrl = prompt('Enter a valid portfolio image Unsplash URL (or leave blank for custom stock):');
    const title = prompt('Enter a project title:');
    if (!title) return;

    const defaultStock = 'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=500&auto=format&fit=crop&q=80';
    const newPortfolio = [
      ...(editingCard.portfolio || []),
      {
        id: `p_pf_${Date.now()}`,
        title,
        url: itemUrl || defaultStock
      }
    ];

    setEditingCard({
      ...editingCard,
      portfolio: newPortfolio
    });
  };

  // Custom Fields additions
  const handleAddCustomField = () => {
    if (!editingCard) return;
    const label = prompt('Enter a field label (e.g., Office Hours, License No.):');
    const value = prompt('Enter a field value (e.g., Mon-Fri 9-5, No. 4930-B):');
    if (!label || !value) return;

    const newFields = [
      ...(editingCard.customFields || []),
      {
        id: `cf_${Date.now()}`,
        label,
        value
      }
    ];

    setEditingCard({
      ...editingCard,
      customFields: newFields
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-gray-500 font-mono">Loading dynamic workspaces...</p>
      </div>
    );
  }

  const analyticsStats = analytics?.stats || {};
  const recentScans = analytics?.recentScans || [];
  const leadSourceOptions = useMemo(
    () => ['all', ...Array.from(new Set(leads.map((lead) => lead.source).filter(Boolean)))],
    [leads],
  );

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = [lead.name, lead.company, lead.email, lead.phone, lead.notes]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(leadSearch.toLowerCase()));
      const matchesStatus = leadStatusFilter === 'all' || lead.status === leadStatusFilter;
      const matchesSource = leadSourceFilter === 'all' || lead.source === leadSourceFilter;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [leadSearch, leadSourceFilter, leadStatusFilter, leads]);

  const hasAnalyticsData = Boolean(
    analytics && (
      (analyticsStats.views || 0) > 0 ||
      (analyticsStats.scans || 0) > 0 ||
      (analyticsStats.uniqueVisitors || 0) > 0 ||
      (analyticsStats.downloads || 0) > 0 ||
      (analyticsStats.connectionRequests || 0) > 0 ||
      recentScans.length > 0
    )
  );

  return (
    <div className="space-y-6">
      {/* Workspace Menu Tabs */}
      <div className="border-b border-gray-200 dark:border-white/5 flex gap-4 overflow-x-auto pb-0.5">
        <button
          onClick={() => setActiveTab('cards')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 whitespace-nowrap transition-all ${activeTab === 'cards' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          My Digital Cards ({cards.length})
        </button>
        <button
          onClick={() => {
            if (!editingCard) handleStartCreateCard();
            setActiveTab('builder');
          }}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 whitespace-nowrap transition-all ${activeTab === 'builder' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          vCard Live Designer
        </button>
        <button
          onClick={() => setActiveTab('crm')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 whitespace-nowrap transition-all ${activeTab === 'crm' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Connections CRM ({leads.length})
        </button>
      </div>

      {/* Tab: Digital Cards */}
      {activeTab === 'cards' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Active Business Cards</h3>
              <p className="text-xs text-gray-500">Launch and track dynamic redirection portfolios.</p>
            </div>
            <button
              onClick={handleStartCreateCard}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Issue New Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {cards.map((c) => (
              <div 
                key={c.id} 
                className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-150 dark:border-white/5 shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <span className="px-2 py-0.5 bg-gray-50 dark:bg-[#161618] text-[9px] font-black uppercase tracking-wider rounded border dark:border-white/5 dark:text-gray-300">
                      Layout: {c.templateId}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">Scans: <span className="font-black text-emerald-500">{c.scans || 0}</span></span>
                  </div>

                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{c.name}</h4>
                  <p className="text-xs text-indigo-600 font-bold">{c.designation}</p>
                  {c.department && <p className="text-[10px] text-gray-400 uppercase tracking-wide">{c.department}</p>}
                  
                  {c.bio && <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-2 leading-relaxed italic">"{c.bio}"</p>}

                  {/* Micro stats display */}
                  <div className="grid grid-cols-3 gap-2 mt-4 bg-gray-50/50 dark:bg-[#161618]/40 p-2 rounded-lg border border-gray-100 dark:border-white/5 text-center text-[10px]">
                    <div>
                      <span className="block font-black text-gray-700 dark:text-gray-300">{c.views || 0}</span>
                      <span className="text-gray-400 text-[9px]">Views</span>
                    </div>
                    <div>
                      <span className="block font-black text-emerald-500">{c.scans || 0}</span>
                      <span className="text-gray-400 text-[9px]">Scans</span>
                    </div>
                    <div>
                      <span className="block font-black text-amber-500">{c.downloads || 0}</span>
                      <span className="text-gray-400 text-[9px]">Downloads</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 mt-5 pt-4 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => handleStartEditCard(c)}
                    className="py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-[#161618] dark:hover:bg-[#111113] dark:text-white rounded border border-gray-200 dark:border-white/5 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    title="Edit fields"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => onSelectCardForPreview(c.publicId)}
                    className="py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-[#161618] dark:hover:bg-[#111113] dark:text-white rounded border border-gray-200 dark:border-white/5 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    title="View public"
                  >
                    <Eye className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                    <span>View</span>
                  </button>
                  <button
                    onClick={() => onSelectCardForQR(c)}
                    className="py-1.5 bg-gray-50 hover:bg-gray-100 dark:bg-[#161618] dark:hover:bg-[#111113] dark:text-white rounded border border-gray-200 dark:border-white/5 text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    title="Dynamic QR engine"
                  >
                    <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                    <span>QR</span>
                  </button>
                  <button
                    onClick={() => handleDeleteCard(c.id)}
                    className="py-1.5 border border-rose-200 hover:bg-rose-50 dark:hover:bg-[#111113] text-rose-500 rounded text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                    title="Archive portfolio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Del</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Card Builder / Real-time Split pane editor */}
      {activeTab === 'builder' && editingCard && (
        <div className="flex flex-col lg:flex-row gap-8 items-stretch">
          {/* Inputs Panel (Left) */}
          <div className="lg:w-[55%] bg-white dark:bg-[#111113] rounded-2xl border border-gray-150 dark:border-white/5 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">{editingCard.id ? 'Modify Active vCard' : 'Design Dynamic Starter'}</h3>
                <p className="text-xs text-gray-500">Live preview triggers instantly on keypress.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingCard(null); setActiveTab('cards'); }}
                  className="px-3 py-1.5 border rounded-lg text-xs font-semibold hover:bg-gray-50 dark:hover:bg-slate-900 dark:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCard}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm cursor-pointer"
                >
                  Publish Changes
                </button>
              </div>
            </div>

            {/* Inputs blocks */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
              {/* Profile Meta */}
              <div>
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 font-mono">// Primary Credentials</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editingCard.name}
                      onChange={e => setEditingCard({ ...editingCard, name: e.target.value })}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Card Title</label>
                    <input
                      type="text"
                      value={editingCard.title}
                      onChange={e => setEditingCard({ ...editingCard, title: e.target.value })}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Designation</label>
                    <input
                      type="text"
                      value={editingCard.designation}
                      onChange={e => setEditingCard({ ...editingCard, designation: e.target.value })}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Department</label>
                    <input
                      type="text"
                      value={editingCard.department || ''}
                      onChange={e => setEditingCard({ ...editingCard, department: e.target.value })}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Company Name</label>
                    <input
                      type="text"
                      value={editingCard.companyName || ''}
                      onChange={e => setEditingCard({ ...editingCard, companyName: e.target.value })}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Address</label>
                    <input
                      type="text"
                      value={editingCard.address || ''}
                      onChange={e => setEditingCard({ ...editingCard, address: e.target.value })}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Biographical Pitch (Bio)</label>
                  <textarea
                    value={editingCard.bio || ''}
                    onChange={e => setEditingCard({ ...editingCard, bio: e.target.value })}
                    rows={2}
                    className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>
              </div>

              {/* Photos & Logos Upload */}
              <div>
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 font-mono">// Media Attachments</h4>
                <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-[#161618] p-3 rounded-xl border border-gray-150 dark:border-white/5">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Profile Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'profilePhoto')}
                      className="text-[10px] block w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-indigo-950 dark:file:text-indigo-400 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Company Logo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => handleImageUpload(e, 'companyLogo')}
                      className="text-[10px] block w-full text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[9px] file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-indigo-950 dark:file:text-indigo-400 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Design custom themes parameters */}
              <div>
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 font-mono">// Visual Canvas Customizer</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Template Preset</label>
                    <select
                      value={editingCard.templateId}
                      onChange={e => setEditingCard({ ...editingCard, templateId: e.target.value as any })}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white capitalize"
                    >
                      <option value="modern">Modern Professional</option>
                      <option value="minimalist">Minimalist High-Contrast</option>
                      <option value="classic">Serene Elegant Serif</option>
                      <option value="neon">Neon Dark Cyberpunk</option>
                      <option value="glass">Premium Glassmorphism</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Font Family</label>
                    <select
                      value={editingCard.theme.fontFamily}
                      onChange={e => handleThemeColorChange('fontFamily', e.target.value)}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white"
                    >
                      <option value="Inter">Inter (Clean Sans-Serif)</option>
                      <option value="Georgia">Georgia (Classic Editorial Serif)</option>
                      <option value="JetBrains Mono">JetBrains Mono (Modern Coding)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Primary Color</label>
                    <input
                      type="color"
                      value={editingCard.theme.primaryColor}
                      onChange={e => handleThemeColorChange('primaryColor', e.target.value)}
                      className="w-full h-8 bg-transparent border rounded cursor-pointer p-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Secondary Color</label>
                    <input
                      type="color"
                      value={editingCard.theme.secondaryColor}
                      onChange={e => handleThemeColorChange('secondaryColor', e.target.value)}
                      className="w-full h-8 bg-transparent border rounded cursor-pointer p-0"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Text Fill</label>
                    <input
                      type="color"
                      value={editingCard.theme.textColor}
                      onChange={e => handleThemeColorChange('textColor', e.target.value)}
                      className="w-full h-8 bg-transparent border rounded cursor-pointer p-0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Border Corners</label>
                    <select
                      value={editingCard.theme.borderRadius}
                      onChange={e => handleThemeColorChange('borderRadius', e.target.value)}
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white"
                    >
                      <option value="none">Brutalist (None)</option>
                      <option value="sm">Soft (Small)</option>
                      <option value="md">Rounded (Medium)</option>
                      <option value="lg">Curved (Large)</option>
                      <option value="full">Pill (Full)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Card Background</label>
                    <input
                      type="color"
                      value={editingCard.theme.backgroundColor}
                      onChange={e => handleThemeColorChange('backgroundColor', e.target.value)}
                      className="w-full h-8 bg-transparent border rounded cursor-pointer p-0"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Buttons triggers */}
              <div>
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 font-mono">// Interactive Quick Actions</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Phone Call</label>
                    <input
                      type="tel"
                      value={editingCard.contactButtons.phone || ''}
                      onChange={e => handleContactBtnChange('phone', e.target.value)}
                      placeholder="+1 (555) ..."
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Direct Email</label>
                    <input
                      type="email"
                      value={editingCard.contactButtons.email || ''}
                      onChange={e => handleContactBtnChange('email', e.target.value)}
                      placeholder="me@email.com"
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Sms Text</label>
                    <input
                      type="tel"
                      value={editingCard.contactButtons.sms || ''}
                      onChange={e => handleContactBtnChange('sms', e.target.value)}
                      placeholder="+1 (555) ..."
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Social Channels urls */}
              <div>
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 font-mono">// Social Media & CRM Integrations</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1">LinkedIn Profile</label>
                    <input
                      type="text"
                      value={editingCard.socialLinks.linkedin || ''}
                      onChange={e => handleSocialChange('linkedin', e.target.value)}
                      placeholder="https://linkedin.com/in/..."
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1">GitHub Repo</label>
                    <input
                      type="text"
                      value={editingCard.socialLinks.github || ''}
                      onChange={e => handleSocialChange('github', e.target.value)}
                      placeholder="https://github.com/..."
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1">Personal Website</label>
                    <input
                      type="text"
                      value={editingCard.socialLinks.website || ''}
                      onChange={e => handleSocialChange('website', e.target.value)}
                      placeholder="https://..."
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-slate-500 mb-1">Calendly Link</label>
                    <input
                      type="text"
                      value={editingCard.socialLinks.calendly || ''}
                      onChange={e => handleSocialChange('calendly', e.target.value)}
                      placeholder="https://calendly.com/..."
                      className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic additions: custom fields & portfolio */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2 font-mono">// Dynamic Add-Ons</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={handleAddCustomField}
                    className="py-1.5 border border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900/40 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Append Custom Field</span>
                  </button>
                  <button
                    onClick={handleAddPortfolio}
                    className="py-1.5 border border-emerald-200 hover:bg-emerald-50 dark:border-emerald-900/40 dark:hover:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Append Portfolio Image</span>
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Interactive Simulated Phone Screen (Right) */}
          <div className="lg:w-[45%] flex items-center justify-center p-4 bg-gray-50/50 dark:bg-[#161618]/50 border border-gray-200/50 dark:border-white/5 rounded-2xl">
            <div className="relative w-full max-w-[340px] rounded-[45px] border-8 border-white/5 bg-slate-900 p-2.5 pb-6 overflow-hidden shadow-2xl flex flex-col items-center">
              <div className="w-16 h-3.5 bg-white/10 rounded-full mb-3 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              </div>
              
              <div className="w-full h-[520px] overflow-y-auto rounded-[28px]" style={{ backgroundColor: editingCard.theme.backgroundColor }}>
                <CardDisplay card={editingCard} isInteractive={false} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Connections CRM */}
      {activeTab === 'crm' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400">Modern CRM Dashboard</p>
              <h3 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">Connections Dashboard</h3>
              <p className="mt-2 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
                Track everyone who scanned your QR code and submitted the networking form, then manage follow-ups from one place.
              </p>
            </div>
            <button
              onClick={fetchWorkspaceData}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 shadow-sm transition hover:bg-gray-50 dark:bg-[#111113] dark:border-white/10 dark:text-gray-200"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Data
            </button>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-150 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#111113]">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                <QrCode className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Total QR Scans</span>
              </div>
              <p className="mt-3 text-3xl font-black text-gray-900 dark:text-white">{analyticsStats.scans || 0}</p>
            </div>
            <div className="rounded-2xl border border-gray-150 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#111113]">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Users className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Unique Visitors</span>
              </div>
              <p className="mt-3 text-3xl font-black text-gray-900 dark:text-white">{analyticsStats.uniqueVisitors || 0}</p>
            </div>
            <div className="rounded-2xl border border-gray-150 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#111113]">
              <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                <Mail className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Contacts Collected</span>
              </div>
              <p className="mt-3 text-3xl font-black text-gray-900 dark:text-white">{leads.length}</p>
            </div>
            <div className="rounded-2xl border border-gray-150 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#111113]">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Download className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Contact Downloads</span>
              </div>
              <p className="mt-3 text-3xl font-black text-gray-900 dark:text-white">{analyticsStats.downloads || 0}</p>
            </div>
          </div>

          {hasAnalyticsData && (
            <div className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm dark:border-white/5 dark:bg-[#111113]">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Activity Insights</p>
                  <h4 className="mt-1 text-lg font-black text-gray-900 dark:text-white">Daily / Weekly Scan Chart</h4>
                </div>
                <div className="flex gap-2">
                  {['views', 'scans', 'downloads'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setSelectedMetric(m as any)}
                      className={`rounded-lg border px-3 py-1 text-xs font-bold capitalize transition-all ${selectedMetric === m ? 'border-indigo-600 bg-indigo-50/40 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-300' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-[#161618] dark:text-gray-300'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <InteractiveChart data={analytics?.timeline} selectedMetric={selectedMetric} />
            </div>
          )}

          <div className="rounded-2xl border border-gray-150 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#111113]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h4 className="text-lg font-black text-gray-900 dark:text-white">Network Pipeline</h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Search, filter, and manage every submitted networking request.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative min-w-[240px] flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Search name, company, email, phone, message..."
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-4 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-[#161618] dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <select
                    value={leadStatusFilter}
                    onChange={(e) => setLeadStatusFilter(e.target.value as any)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-[#161618] dark:text-white"
                  >
                    <option value="all">All statuses</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="lost">Lost</option>
                  </select>
                  <select
                    value={leadSourceFilter}
                    onChange={(e) => setLeadSourceFilter(e.target.value)}
                    className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-[#161618] dark:text-white"
                  >
                    {leadSourceOptions.map((source) => (
                      <option key={source} value={source}>
                        {source === 'all' ? 'All sources' : source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-6 py-12 text-center dark:border-white/10 dark:bg-[#161618]/40">
                <Users className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                <h5 className="text-lg font-black text-gray-900 dark:text-white">No contacts yet</h5>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Scan your QR code and submit the contact form to start building your network.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wider text-gray-400">
                      <th className="border-b border-gray-100 px-4 py-3 font-black dark:border-white/10">Name</th>
                      <th className="border-b border-gray-100 px-4 py-3 font-black dark:border-white/10">Company</th>
                      <th className="border-b border-gray-100 px-4 py-3 font-black dark:border-white/10">Email</th>
                      <th className="border-b border-gray-100 px-4 py-3 font-black dark:border-white/10">Phone</th>
                      <th className="border-b border-gray-100 px-4 py-3 font-black dark:border-white/10">Message</th>
                      <th className="border-b border-gray-100 px-4 py-3 font-black dark:border-white/10">Scan Date</th>
                      <th className="border-b border-gray-100 px-4 py-3 font-black dark:border-white/10">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.map((lead) => (
                      <tr
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="cursor-pointer transition hover:bg-gray-50 dark:hover:bg-white/5"
                      >
                        <td className="border-b border-gray-100 px-4 py-4 font-semibold text-gray-900 dark:border-white/5 dark:text-white">{lead.name}</td>
                        <td className="border-b border-gray-100 px-4 py-4 text-gray-600 dark:border-white/5 dark:text-gray-300">{lead.company || 'Direct Connect'}</td>
                        <td className="border-b border-gray-100 px-4 py-4 text-gray-600 dark:border-white/5 dark:text-gray-300">{lead.email}</td>
                        <td className="border-b border-gray-100 px-4 py-4 text-gray-600 dark:border-white/5 dark:text-gray-300">{lead.phone || '—'}</td>
                        <td className="border-b border-gray-100 px-4 py-4 text-gray-600 dark:border-white/5 dark:text-gray-300">
                          <span className="line-clamp-2 max-w-xs">{lead.notes || '—'}</span>
                        </td>
                        <td className="border-b border-gray-100 px-4 py-4 text-gray-500 dark:border-white/5 dark:text-gray-400">{new Date(lead.createdAt).toLocaleDateString()}</td>
                        <td className="border-b border-gray-100 px-4 py-4 dark:border-white/5">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                            lead.status === 'qualified' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                            lead.status === 'contacted' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' :
                            lead.status === 'lost' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' :
                            'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                          }`}>
                            {lead.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {recentScans.length > 0 && (
            <div className="rounded-2xl border border-gray-150 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-[#111113]">
              <h4 className="mb-4 text-lg font-black text-gray-900 dark:text-white">Recent Scans</h4>
              <div className="space-y-3">
                {recentScans.map((scan: any) => (
                  <div key={scan.id} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-[#161618]/40">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{scan.cardName}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {scan.city}, {scan.country} • {scan.device} • {scan.referrer}
                        </p>
                      </div>
                      <span className="text-[11px] font-mono text-gray-400">{new Date(scan.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
          <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#111113]" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5 dark:border-white/10">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-400">Contact Profile</p>
                <h4 className="mt-2 text-2xl font-black text-gray-900 dark:text-white">{selectedLead.name}</h4>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Submitted via {selectedLead.source}</p>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-6 px-6 py-6 md:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 dark:border-white/5 dark:bg-[#161618]/40">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Message</p>
                  <p className="mt-2 text-sm leading-6 text-gray-700 dark:text-gray-300">{selectedLead.notes || 'No message provided.'}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Email</p>
                    <p className="mt-2 break-all text-sm font-semibold text-gray-900 dark:text-white">{selectedLead.email}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Phone</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{selectedLead.phone || 'Not provided'}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Company</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{selectedLead.company || 'Direct Connect'}</p>
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Scan Date</p>
                    <p className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{new Date(selectedLead.createdAt).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Status</p>
                  <select
                    value={selectedLead.status}
                    onChange={async (e) => {
                      const nextStatus = e.target.value;
                      await handleLeadStatusToggle(selectedLead.id, nextStatus);
                      setSelectedLead({ ...selectedLead, status: nextStatus as Lead['status'] });
                    }}
                    className="mt-3 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-white/10 dark:bg-[#161618] dark:text-white"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>

                <div className="rounded-2xl border border-gray-100 p-4 dark:border-white/5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Quick Actions</p>
                  <div className="mt-3 space-y-2">
                    <a
                      href={`mailto:${selectedLead.email}`}
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                    >
                      <Mail className="h-4 w-4" />
                      Send Email
                    </a>
                    {selectedLead.phone && (
                      <a
                        href={`tel:${selectedLead.phone}`}
                        className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 dark:border-white/10 dark:text-gray-200 dark:hover:bg-white/5"
                      >
                        <Phone className="h-4 w-4" />
                        Call Contact
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
