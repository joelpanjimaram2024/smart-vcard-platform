import React, { useEffect, useState } from 'react';
import { 
  Building2, Users, Briefcase, Mail, Key, UserCheck, UserX, 
  Send, Palette, BarChart3, Save, Check, RefreshCw, FileText, UserPlus
} from 'lucide-react';
import { User, Company, Lead } from '../types';
import { apiUrl } from '../utils/api';

interface CompanyAdminDashboardProps {
  user: User;
  token: string;
  company: Company | null;
  onUpdateCompany: (comp: Company) => void;
}

export const CompanyAdminDashboard: React.FC<CompanyAdminDashboardProps> = ({ 
  user, token, company, onUpdateCompany 
}) => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Form states for branding
  const [brandName, setBrandName] = useState(company?.name || '');
  const [brandDomain, setBrandDomain] = useState(company?.domain || '');
  const [brandLogo, setBrandLogo] = useState(company?.logoUrl || '');
  const [primaryColor, setPrimaryColor] = useState(company?.brandingColors.primary || '#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState(company?.brandingColors.secondary || '#10b981');
  const [brandingLoading, setBrandingLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'employees' | 'branding' | 'leads'>('employees');

  const fetchCompanyData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [empRes, leadRes] = await Promise.all([
        fetch(apiUrl('/api/company/employees'), { headers }),
        fetch(apiUrl('/api/leads'), { headers })
      ]);

      if (!empRes.ok || !leadRes.ok) {
        throw new Error('Failed to fetch corporate workspace records.');
      }

      const empData = await empRes.json();
      const leadData = await leadRes.json();

      setEmployees(empData.employees || []);
      setLeads(leadData.leads || []);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [token, company]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setInviteLoading(true);
    setInviteSuccess(false);
    setError('');

    try {
      const res = await fetch(apiUrl('/api/company/invite'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: inviteName, email: inviteEmail })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to dispatch invitation');
      }

      setInviteSuccess(true);
      setInviteName('');
      setInviteEmail('');
      fetchCompanyData(); // Reload employee table
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEmployeeToggle = async (empId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/company/employees/${empId}/toggle`), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Toggle failed');
      
      setEmployees(prev => prev.map(emp => emp.id === empId ? { ...emp, suspended: !emp.suspended } : emp));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleSaveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setBrandingLoading(true);
    try {
      const res = await fetch(apiUrl('/api/company'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: brandName,
          domain: brandDomain,
          logoUrl: brandLogo,
          brandingColors: {
            primary: primaryColor,
            secondary: secondaryColor,
            background: company?.brandingColors.background || '#f8fafc'
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save brand details');

      onUpdateCompany(data.company);
      alert('Corporate branding updated successfully across all employee templates!');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setBrandingLoading(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setBrandLogo(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLeadStatusChange = async (leadId: string, nextStatus: string) => {
    try {
      const res = await fetch(apiUrl(`/api/leads/${leadId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!res.ok) throw new Error('Status update failed');

      setLeads(prev => prev.map(ld => ld.id === leadId ? { ...ld, status: nextStatus as any } : ld));
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-gray-500 font-mono">Retrieving organization credentials...</p>
      </div>
    );
  }

  // Calculate statistics
  const totalCards = employees.reduce((sum, emp) => sum + emp.cardCount, 0);
  const totalViews = employees.reduce((sum, emp) => {
    return sum + emp.cards.reduce((acc: number, c: any) => acc + (c.views || 0), 0);
  }, 0);
  const totalLeads = leads.length;

  return (
    <div className="space-y-6">
      {/* corporate details banner */}
      <div className="p-5 bg-gradient-to-r from-[#111113] to-indigo-950 text-white rounded-2xl border border-white/5 shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/10 dark:bg-black/20 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-white/10 shadow-inner">
            {company?.logoUrl ? (
              <img src={company.logoUrl} className="max-h-full max-w-full object-contain" />
            ) : (
              <Building2 className="w-8 h-8 text-indigo-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-black">{company?.name || 'My Company'}</h3>
            <p className="text-xs text-indigo-200">Corporate Tenant Domain: <span className="font-mono underline">{company?.domain || 'acme.com'}</span></p>
          </div>
        </div>

        <div className="flex gap-3 text-center">
          <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
            <span className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Plan License</span>
            <span className="text-xs font-black uppercase font-mono">{company?.plan}</span>
          </div>
          <div className="px-3 py-1.5 bg-white/5 rounded-lg border border-white/5">
            <span className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Tenant Status</span>
            <span className="text-xs font-black uppercase font-mono text-emerald-400">APPROVED</span>
          </div>
        </div>
      </div>

      {/* Aggregate stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Active Employee Cards</span>
          <h3 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{totalCards} cards</h3>
          <p className="text-[10px] text-gray-400 mt-1">Issued and tracked across your domain</p>
        </div>
        <div className="p-4 bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cumulative Impressions</span>
          <h3 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{totalViews} views</h3>
          <p className="text-[10px] text-gray-400 mt-1">Aggregated click interactions</p>
        </div>
        <div className="p-4 bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Captured Leads</span>
          <h3 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{totalLeads} prospects</h3>
          <p className="text-[10px] text-gray-400 mt-1">Captured into unified B2B CRM pipeline</p>
        </div>
      </div>

      {/* Workspace Tabs Header */}
      <div className="border-b border-gray-200 dark:border-white/5 flex gap-4">
        <button
          onClick={() => setActiveTab('employees')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${activeTab === 'employees' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Team Employees Directory ({employees.length})
        </button>
        <button
          onClick={() => setActiveTab('branding')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${activeTab === 'branding' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Branding & Identity
        </button>
        <button
          onClick={() => setActiveTab('leads')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${activeTab === 'leads' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Corporate Leads Pipeline ({leads.length})
        </button>
      </div>

      {/* Tab Panel: Employees */}
      {activeTab === 'employees' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Employee table directory (Left) */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="p-4 bg-gray-50/50 dark:bg-[#161618]/40 border-b border-gray-150 dark:border-white/5 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Active Organizational Members</h4>
                <p className="text-xs text-gray-500">Deactivate employee profiles or audit their generated cards.</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-[#161618] text-gray-400 uppercase font-black border-b border-gray-100 dark:border-white/5">
                    <th className="p-3">Employee Name</th>
                    <th className="p-3">Assigned Email</th>
                    <th className="p-3">Active Cards</th>
                    <th className="p-3">Roster Access</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50/40 dark:hover:bg-white/5 transition-all">
                      <td className="p-3 font-semibold text-gray-900 dark:text-white">
                        {emp.name}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 font-mono">
                        {emp.email}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-300 font-medium">
                        {emp.cardCount} active cards
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${emp.suspended ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>
                          {emp.suspended ? 'suspended' : 'active'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => handleEmployeeToggle(emp.id)}
                          className={`px-2 py-1 rounded font-bold text-[10px] cursor-pointer ${emp.suspended ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'border border-rose-200 text-rose-500 hover:bg-rose-50 dark:hover:bg-white/5'}`}
                        >
                          {emp.suspended ? 'Activate' : 'Suspend'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Onboarding Invitation panel (Right) */}
          <div className="bg-white dark:bg-[#111113] p-5 rounded-xl border border-gray-150 dark:border-white/5 shadow-sm self-start">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <UserPlus className="w-4 h-4" />
              </div>
              <h4 className="font-bold text-gray-900 dark:text-white text-sm">Issue Corporate Card</h4>
            </div>

            {inviteSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/10 text-emerald-700 dark:text-emerald-400 text-xs rounded border mb-3">
                <p className="font-bold">Member Onboarded!</p>
                <p className="text-[10px]">Onboarding emails dispatched. Starter template auto-issued.</p>
              </div>
            )}

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Alice Smith"
                  className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="e.g. alice@acme.com"
                  className="w-full text-xs p-2 rounded border border-gray-200 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                {inviteLoading ? 'Issuing...' : 'Provision Smart Card'}
                <Send className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Tab Panel: Branding */}
      {activeTab === 'branding' && (
        <div className="bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 p-6 shadow-sm max-w-3xl">
          <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-white/5 pb-3">
            <Palette className="w-5 h-5 text-indigo-500" />
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Tenant Branding Directives</h4>
              <p className="text-xs text-gray-500">Apply visual assets and brand colors globally to all employee vCard profiles.</p>
            </div>
          </div>

          <form onSubmit={handleSaveBranding} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Company Trade Name</label>
                <input
                  type="text"
                  required
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  className="w-full text-xs p-2 rounded border border-gray-250 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Corporate Domain</label>
                <input
                  type="text"
                  required
                  value={brandDomain}
                  onChange={e => setBrandDomain(e.target.value)}
                  placeholder="acme.com"
                  className="w-full text-xs p-2 rounded border border-gray-250 dark:border-white/10 bg-transparent dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Corporate Master Logo</label>
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-[#161618] p-3 rounded-lg border border-gray-150 dark:border-white/5">
                <div className="w-14 h-14 bg-white rounded border flex items-center justify-center p-1.5 text-xs text-gray-400">
                  {brandLogo ? <img src={brandLogo} className="max-h-full max-w-full object-contain" /> : 'No Logo'}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="text-xs block w-full text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-600 dark:file:bg-indigo-950 dark:file:text-indigo-400 hover:file:cursor-pointer"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Supports PNG, JPEG, SVG. Max dimensions: 512x512px. Converts to secure base64.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Primary Corporate HEX Color</label>
                <div className="flex items-center gap-2 border border-gray-250 dark:border-white/10 p-1.5 rounded bg-transparent">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer p-0 bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="text-xs bg-transparent dark:text-white font-mono focus:outline-none w-20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-1">Secondary Corporate HEX Color</label>
                <div className="flex items-center gap-2 border border-gray-250 dark:border-white/10 p-1.5 rounded bg-transparent">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer p-0 bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={secondaryColor}
                    onChange={e => setSecondaryColor(e.target.value)}
                    className="text-xs bg-transparent dark:text-white font-mono focus:outline-none w-20"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={brandingLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              {brandingLoading ? 'Updating...' : 'Publish Branding Guidelines'}
            </button>
          </form>
        </div>
      )}

      {/* Tab Panel: Leads */}
      {activeTab === 'leads' && (
        <div className="bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50/50 dark:bg-[#161618]/40 border-b border-gray-150 dark:border-white/5 flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Corporate B2B Leads Pipeline</h4>
              <p className="text-xs text-gray-500">Review sales pipeline prospects captured by all employee cards.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#161618] text-gray-400 uppercase font-black border-b border-gray-100 dark:border-white/5">
                  <th className="p-3">Prospect Details</th>
                  <th className="p-3">Company & Notes</th>
                  <th className="p-3">Channel Source</th>
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
                      {ld.phone && <span className="block text-[9px] text-gray-500">{ld.phone}</span>}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 max-w-sm">
                      <p className="font-bold text-[10px] text-indigo-600">{ld.company || 'Direct Connection'}</p>
                      <span className="opacity-80 italic">{ld.notes}</span>
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
                        onChange={e => handleLeadStatusChange(ld.id, e.target.value)}
                        className="p-1 rounded text-[10px] bg-transparent border border-gray-250 dark:border-white/10 text-gray-600 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="lost">Lost</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
