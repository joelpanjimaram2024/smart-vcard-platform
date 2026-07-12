import React, { useEffect, useState } from 'react';
import { 
  CreditCard, Plus, Edit3, Eye, QrCode, Trash2, Heart, Search, 
  MapPin, Tag, Briefcase, Mail, Phone, ExternalLink, Calendar,
  BarChart3, Smartphone, Laptop, Tablet, Globe, PlusCircle, Check, Info, RefreshCw
} from 'lucide-react';
import { BusinessCard, Contact, Lead, SocialLinks, ContactButtons, CustomField } from '../types';
import { CardDisplay } from './CardTemplates';
import { apiUrl } from '../utils/api';
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

  const [activeTab, setActiveTab] = useState<'cards' | 'builder' | 'contacts' | 'leads' | 'analytics'>('cards');
  const [editingCard, setEditingCard] = useState<BusinessCard | null>(null);

  // Contacts States
  const [contactSearch, setContactSearch] = useState('');
  const [contactCategoryFilter, setContactCategoryFilter] = useState('All');
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '', email: '', phone: '', company: '', title: '', note: '', category: 'Personal', tags: ''
  });

  // Metrics Metric Filter
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'scans' | 'downloads'>('views');

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

      const cardsData = await cardsRes.json();
      const contactsData = await contactsRes.json();
      const leadsData = await leadsRes.json();
      const analyticsData = await analyticsRes.json();

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
      userId: user.id,
      companyId: user.companyId || '',
      name: user.name,
      title: 'Digital Card',
      designation: 'Senior Consultant',
      department: '',
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

  // Contacts CRUD
  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name) return;

    try {
      const res = await fetch(apiUrl('/api/contacts'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...newContact,
          tags: newContact.tags ? newContact.tags.split(',').map(t => t.trim()) : []
        })
      });

      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to add contact');

      setShowAddContact(false);
      setNewContact({ name: '', email: '', phone: '', company: '', title: '', note: '', category: 'Personal', tags: '' });
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleFavoriteContact = async (con: Contact) => {
    try {
      const res = await fetch(apiUrl(`/api/contacts/${con.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isFavorite: !con.isFavorite })
      });
      if (!res.ok) throw new Error('Action failed');
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Remove this saved contact connection?')) return;
    try {
      const res = await fetch(apiUrl(`/api/contacts/${contactId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      fetchWorkspaceData();
    } catch (err: any) {
      alert(err.message);
    }
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

  // Filtered contacts
  const filteredContacts = contacts.filter(con => {
    const matchesSearch = con.name.toLowerCase().includes(contactSearch.toLowerCase()) || 
                          con.company.toLowerCase().includes(contactSearch.toLowerCase()) ||
                          con.note.toLowerCase().includes(contactSearch.toLowerCase());
    
    if (contactCategoryFilter === 'All') return matchesSearch;
    if (contactCategoryFilter === 'Favorites') return matchesSearch && con.isFavorite;
    return matchesSearch && con.category === contactCategoryFilter;
  });

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
          onClick={() => setActiveTab('contacts')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 whitespace-nowrap transition-all ${activeTab === 'contacts' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Connections Address Book ({contacts.length})
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 whitespace-nowrap transition-all ${activeTab === 'leads' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          My Captured Leads ({leads.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 whitespace-nowrap transition-all ${activeTab === 'analytics' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Performance Stats
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
                    onClick={() => onSelectCardForPreview(c.id)}
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

      {/* Tab: Connections Address Book */}
      {activeTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-150 dark:border-white/5 pb-3">
            <div>
              <h3 className="font-extrabold text-gray-900 dark:text-white text-base">Professional Connections Address Book</h3>
              <p className="text-xs text-gray-500">Query and tag your verified professional contacts list.</p>
            </div>
            <button
              onClick={() => setShowAddContact(!showAddContact)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {showAddContact ? 'Close Form' : 'Register Manual Contact'}
            </button>
          </div>

          {/* Add contact manual form */}
          {showAddContact && (
            <div className="p-5 bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 shadow-sm max-w-2xl">
              <h4 className="font-bold text-gray-900 dark:text-white text-xs uppercase mb-3 text-indigo-600 font-mono">// New Connection Registration</h4>
              <form onSubmit={handleAddContact} className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Contact Name *</label>
                    <input
                      type="text"
                      required
                      value={newContact.name}
                      onChange={e => setNewContact({ ...newContact, name: e.target.value })}
                      placeholder="e.g. Elena Rostova"
                      className="w-full p-2 border dark:border-white/10 bg-transparent dark:text-white rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Company / Org</label>
                    <input
                      type="text"
                      value={newContact.company}
                      onChange={e => setNewContact({ ...newContact, company: e.target.value })}
                      placeholder="e.g. Freelance Design"
                      className="w-full p-2 border dark:border-white/10 bg-transparent dark:text-white rounded focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Designation Title</label>
                    <input
                      type="text"
                      value={newContact.title}
                      onChange={e => setNewContact({ ...newContact, title: e.target.value })}
                      placeholder="e.g. Creative Director"
                      className="w-full p-2 border dark:border-white/10 bg-transparent dark:text-white rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newContact.email}
                      onChange={e => setNewContact({ ...newContact, email: e.target.value })}
                      placeholder="e.g. elena@gmail.com"
                      className="w-full p-2 border dark:border-white/10 bg-transparent dark:text-white rounded focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Category</label>
                    <select
                      value={newContact.category}
                      onChange={e => setNewContact({ ...newContact, category: e.target.value })}
                      className="w-full p-2 border dark:border-white/10 bg-transparent dark:text-white rounded"
                    >
                      <option value="Client">Client Partner</option>
                      <option value="Partner">Strategic Partner</option>
                      <option value="Lead">Lead Prospect</option>
                      <option value="Personal">Personal Network</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Comma-separated Tags</label>
                    <input
                      type="text"
                      value={newContact.tags}
                      onChange={e => setNewContact({ ...newContact, tags: e.target.value })}
                      placeholder="Design, Consultant, Top Tier"
                      className="w-full p-2 border dark:border-white/10 bg-transparent dark:text-white rounded"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Private Contact Note</label>
                  <textarea
                    value={newContact.note}
                    onChange={e => setNewContact({ ...newContact, note: e.target.value })}
                    rows={2}
                    className="w-full p-2 border dark:border-white/10 bg-transparent dark:text-white rounded resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold shadow-sm cursor-pointer"
                >
                  Register Connection
                </button>
              </form>
            </div>
          )}

          {/* Connections Filtering Ribbon */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={contactSearch}
                onChange={e => setContactSearch(e.target.value)}
                placeholder="Search by contact name, company, notes..."
                className="w-full text-xs pl-9 pr-4 py-2.5 bg-white dark:bg-[#111113] border border-gray-250 dark:border-white/5 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto">
              {['All', 'Favorites', 'Client', 'Partner', 'Lead', 'Personal'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setContactCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider cursor-pointer transition-all ${contactCategoryFilter === cat ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-[#111113] text-gray-500 hover:bg-gray-50 border border-gray-150 dark:border-white/5 dark:text-gray-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Connections Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredContacts.map((con) => (
              <div 
                key={con.id}
                className="p-5 bg-white dark:bg-[#111113] rounded-2xl border border-gray-150 dark:border-white/5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[9px] rounded">
                      {con.category}
                    </span>
                    <button 
                      onClick={() => handleToggleFavoriteContact(con)}
                      className="p-1 text-gray-400 hover:text-rose-500 transition-all cursor-pointer"
                    >
                      <Heart className={`w-4 h-4 ${con.isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
                    </button>
                  </div>

                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">{con.name}</h4>
                  <p className="text-xs text-gray-400">{con.title} at <span className="font-semibold text-gray-700 dark:text-gray-300">{con.company || 'Direct Network'}</span></p>
                  
                  {con.note && (
                    <div className="mt-3 p-2 bg-gray-50 dark:bg-[#161618] rounded border border-gray-100 dark:border-white/5 text-[11px] text-gray-500 dark:text-gray-400 italic">
                      "{con.note}"
                    </div>
                  )}

                  {/* Contact rows info */}
                  <div className="space-y-1 mt-4 text-[11px] text-gray-600 dark:text-gray-300">
                    {con.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        <span>{con.email}</span>
                      </div>
                    )}
                    {con.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span>{con.phone}</span>
                      </div>
                    )}
                  </div>

                  {/* tags matrix */}
                  {con.tags && con.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {con.tags.map((tag, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-900 text-gray-500 rounded text-[9px] font-bold flex items-center gap-0.5 border dark:border-white/5">
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 dark:border-white/5 flex justify-end gap-1.5">
                  <button
                    onClick={() => handleDeleteContact(con.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-white/5 rounded cursor-pointer"
                    title="Remove connection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredContacts.length === 0 && (
              <div className="col-span-full p-8 text-center bg-gray-50 dark:bg-[#161618]/40 rounded-2xl border border-dashed text-gray-400">
                <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-xs">No saved professional connection matches found.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Captured Leads */}
      {activeTab === 'leads' && (
        <div className="bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50/50 dark:bg-[#161618]/40 border-b border-gray-150 dark:border-white/5">
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Active Connection Prospect Leads</h4>
            <p className="text-xs text-gray-500">Track inquiries submitted by professionals viewing your dynamic business cards.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#161618] text-gray-400 uppercase font-black border-b border-gray-100 dark:border-white/5">
                  <th className="p-3">Prospect Details</th>
                  <th className="p-3">Company & Notes</th>
                  <th className="p-3">Source Channel</th>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Conversion Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {leads.map((ld) => (
                  <tr key={ld.id} className="hover:bg-gray-50/40 dark:hover:bg-white/5 transition-all">
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">
                      <p>{ld.name}</p>
                      <span className="text-[10px] text-gray-400 font-mono font-medium">{ld.email}</span>
                      {ld.phone && <span className="block text-[9px] text-gray-500 mt-0.5">{ld.phone}</span>}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 max-w-sm">
                      <p className="font-bold text-[10px] text-indigo-600">{ld.company || 'Direct Connect'}</p>
                      <span className="opacity-80 italic">"{ld.notes}"</span>
                    </td>
                    <td className="p-3 text-gray-400">
                      {ld.source}
                    </td>
                    <td className="p-3 text-gray-400">
                      {new Date(ld.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                        ld.status === 'qualified' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' :
                        ld.status === 'contacted' ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' :
                        ld.status === 'lost' ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' :
                        'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'
                      }`}>
                        {ld.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <select
                        value={ld.status}
                        onChange={e => handleLeadStatusToggle(ld.id, e.target.value)}
                        className="p-1 rounded text-[10px] bg-transparent border border-gray-250 dark:border-white/10 text-gray-600 dark:text-white cursor-pointer focus:outline-none"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))}

                {leads.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400 italic">
                      No captured connection prospects yet. Share your card to start swiping contacts.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Performance Analytics */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Timeline chart wrapper */}
          <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-150 dark:border-white/5 p-6 shadow-sm">
            <div className="flex gap-2 mb-4">
              {['views', 'scans', 'downloads'].map((m) => (
                <button
                  key={m}
                  onClick={() => setSelectedMetric(m as any)}
                  className={`px-3 py-1 bg-gray-50 hover:bg-gray-100 border text-xs font-bold rounded-lg capitalize cursor-pointer transition-all ${selectedMetric === m ? 'border-indigo-600 bg-indigo-50/40 text-indigo-600' : 'text-gray-500'}`}
                >
                  {m} Timeline
                </button>
              ))}
            </div>

            <InteractiveChart data={analytics.timeline} selectedMetric={selectedMetric} />
          </div>

          {/* Demographics distributions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Country */}
            <div className="bg-white dark:bg-[#111113] p-5 rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
              <h4 className="text-xs uppercase font-extrabold text-gray-400 mb-3 flex items-center gap-1">
                <Globe className="w-4 h-4 text-indigo-500" />
                Geographical Views
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {analytics.countries?.map((c: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs border-b border-gray-50 dark:border-white/5 pb-1.5">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{c.name}</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{c.value} views</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Devices */}
            <div className="bg-white dark:bg-[#111113] p-5 rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
              <h4 className="text-xs uppercase font-extrabold text-gray-400 mb-3 flex items-center gap-1">
                <Smartphone className="w-4 h-4 text-emerald-500" />
                Device Distribution
              </h4>
              <div className="space-y-2">
                {analytics.devices?.map((d: any, idx: number) => {
                  const icons: Record<string, any> = {
                    mobile: <Smartphone className="w-3.5 h-3.5" />,
                    desktop: <Laptop className="w-3.5 h-3.5" />,
                    tablet: <Tablet className="w-3.5 h-3.5" />
                  };
                  return (
                    <div key={idx} className="flex justify-between items-center text-xs border-b border-gray-50 dark:border-white/5 pb-1.5">
                      <span className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5 capitalize">
                        {icons[d.name] || <Smartphone className="w-3.5 h-3.5" />}
                        {d.name}
                      </span>
                      <span className="font-mono font-bold text-gray-900 dark:text-white">{d.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Referral / Source Traffic */}
            <div className="bg-white dark:bg-[#111113] p-5 rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
              <h4 className="text-xs uppercase font-extrabold text-gray-400 mb-3 flex items-center gap-1">
                <Search className="w-4 h-4 text-amber-500" />
                Referrer Channels
              </h4>
              <div className="space-y-2">
                {analytics.referrers?.map((r: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-xs border-b border-gray-50 dark:border-white/5 pb-1.5">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">{r.name}</span>
                    <span className="font-mono font-bold text-gray-900 dark:text-white">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
