import React, { useEffect, useState } from 'react';
import { 
  Building2, Users, CreditCard, Shield, Check, X, AlertTriangle, 
  Activity, Calendar, Terminal, Info, RefreshCw, UserMinus, UserCheck
} from 'lucide-react';
import { User, Company, ActivityLog } from '../types';
import { apiUrl } from '../utils/api';

interface SuperAdminDashboardProps {
  token: string;
}

export const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ token }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'companies' | 'users' | 'logs'>('companies');

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [compRes, usrRes, logRes] = await Promise.all([
        fetch(apiUrl('/api/admin/companies'), { headers }),
        fetch(apiUrl('/api/admin/users'), { headers }),
        fetch(apiUrl('/api/admin/logs'), { headers })
      ]);

      if (!compRes.ok || !usrRes.ok || !logRes.ok) {
        throw new Error('Failed to retrieve full super administration datasets.');
      }

      const compData = await compRes.json();
      const usrData = await usrRes.json();
      const logData = await logRes.json();

      setCompanies(compData.companies || []);
      setUsers(usrData.users || []);
      setLogs(logData.logs || []);
    } catch (err: any) {
      setError(err.message || 'Fatal loading error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleCompanyStatusToggle = async (companyId: string, currentStatus: string) => {
    try {
      const nextStatus = currentStatus === 'approved' ? 'pending' : 'approved';
      const res = await fetch(apiUrl(`/api/admin/companies/${companyId}/status`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      if (!res.ok) throw new Error('Status update rejected');
      
      // Update state locally
      setCompanies(prev => prev.map(c => c.id === companyId ? { ...c, status: nextStatus } : c));
      fetchAdminData(); // Refresh logs & stats
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUserSuspensionToggle = async (userId: string) => {
    try {
      const res = await fetch(apiUrl(`/api/admin/users/${userId}/suspend`), {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'User action failed');
      }

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, suspended: !u.suspended } : u));
      fetchAdminData(); // Refresh logs
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[350px]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-xs text-gray-500 font-mono">Querying administrative services...</p>
      </div>
    );
  }

  // Summary Metrics
  const totalSaaSUsers = users.length;
  const totalPendingCompanies = companies.filter(c => c.status === 'pending').length;
  const totalApprovedCompanies = companies.filter(c => c.status === 'approved').length;
  const grandViews = companies.reduce((sum, c) => sum + (c.views || 0), 0);

  return (
    <div className="space-y-6">
      {/* Overview Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Registered Companies</span>
            <Building2 className="w-5 h-5 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{companies.length}</h3>
          <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
            <span className="text-emerald-500 font-bold">{totalApprovedCompanies}</span> Approved | <span className="text-amber-500 font-bold">{totalPendingCompanies}</span> Pending
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Active Platforms Accounts</span>
            <Users className="w-5 h-5 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{totalSaaSUsers}</h3>
          <p className="text-[10px] text-gray-400 mt-1">
            Active corporate roster and guest freelancers
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">Global Card Impressions</span>
            <Activity className="w-5 h-5 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black mt-1 text-gray-900 dark:text-white">{grandViews}</h3>
          <p className="text-[10px] text-gray-400 mt-1">
            Aggregated digital scans and views
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 shadow-sm">
          <div className="flex justify-between items-center text-gray-400">
            <span className="text-[10px] font-bold uppercase tracking-wider">System Security Node</span>
            <Shield className="w-5 h-5 text-rose-500" />
          </div>
          <h3 className="text-sm font-bold mt-1 text-gray-800 dark:text-gray-200">JWT-HS256 Active</h3>
          <p className="text-[10px] text-emerald-500 font-bold mt-1.5 flex items-center gap-1 font-mono">
            ● ONLINE_SECURE
          </p>
        </div>
      </div>

      {/* Workspace Tabs Header */}
      <div className="border-b border-gray-200 dark:border-white/5 flex gap-4">
        <button
          onClick={() => setActiveTab('companies')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${activeTab === 'companies' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Company Tenants ({companies.length})
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${activeTab === 'users' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Platform User Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`pb-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer border-b-2 transition-all ${activeTab === 'logs' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
        >
          Activity Audit Logs ({logs.length})
        </button>
      </div>

      {/* Tab Panel: Companies */}
      {activeTab === 'companies' && (
        <div className="bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50/50 dark:bg-[#161618]/40 border-b border-gray-150 dark:border-white/5 flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Corporate Tenant Registry</h4>
              <p className="text-xs text-gray-500">Approve pending corporate domains and manage tenant states.</p>
            </div>
            <button 
              onClick={fetchAdminData}
              className="p-1.5 rounded border border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-[#161618] cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#161618] text-gray-400 uppercase font-black border-b border-gray-100 dark:border-white/5">
                  <th className="p-3">Company Details</th>
                  <th className="p-3">Corporate Admin</th>
                  <th className="p-3">Subscription</th>
                  <th className="p-3">Employee Count</th>
                  <th className="p-3">Dynamic Views</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {companies.map((comp) => (
                  <tr key={comp.id} className="hover:bg-gray-50/40 dark:hover:bg-white/5 transition-all">
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {comp.logoUrl && <img src={comp.logoUrl} className="w-6 h-6 object-cover rounded" />}
                        <div>
                          <p>{comp.name}</p>
                          <span className="text-[10px] text-gray-400 font-mono">{comp.domain}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      <p className="font-medium">{comp.adminName}</p>
                      <span className="text-[10px] text-gray-400">{comp.adminEmail}</span>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 uppercase font-bold font-mono text-[10px]">
                      {comp.plan}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 font-medium">
                      {comp.employeeCount} active
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300 font-bold">
                      {comp.views || 0} clicks
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${comp.status === 'approved' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400'}`}>
                        {comp.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {comp.status === 'pending' ? (
                        <button
                          onClick={() => handleCompanyStatusToggle(comp.id, comp.status)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] inline-flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          Approve
                        </button>
                      ) : (
                        <button
                          onClick={() => handleCompanyStatusToggle(comp.id, comp.status)}
                          className="px-2 py-1 border border-rose-200 hover:bg-rose-50 text-rose-500 dark:hover:bg-rose-950/10 rounded font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          Suspend
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Panel: Users */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-[#111113] rounded-xl border border-gray-150 dark:border-white/5 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50/50 dark:bg-[#161618]/40 border-b border-gray-150 dark:border-white/5 flex justify-between items-center">
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">Active Users Directory</h4>
              <p className="text-xs text-gray-500">Suspend or restore access to corporate members and independent profiles.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-[#161618] text-gray-400 uppercase font-black border-b border-gray-100 dark:border-white/5">
                  <th className="p-3">Member Details</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Tenant Association</th>
                  <th className="p-3">Created Timestamp</th>
                  <th className="p-3">Access Security</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {users.map((usr) => (
                  <tr key={usr.id} className="hover:bg-gray-50/40 dark:hover:bg-white/5 transition-all">
                    <td className="p-3 font-semibold text-gray-900 dark:text-white">
                      <p>{usr.name}</p>
                      <span className="text-[10px] text-gray-400 font-mono font-medium">{usr.email}</span>
                    </td>
                    <td className="p-3 font-bold font-mono text-[10px] tracking-wider capitalize text-gray-600 dark:text-gray-300">
                      {usr.role.replace('_', ' ')}
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-300">
                      {usr.companyName}
                    </td>
                    <td className="p-3 text-gray-400">
                      {new Date(usr.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${usr.suspended ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400'}`}>
                        {usr.suspended ? 'suspended' : 'active'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {usr.suspended ? (
                        <button
                          onClick={() => handleUserSuspensionToggle(usr.id)}
                          className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-bold text-[10px] inline-flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" />
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUserSuspensionToggle(usr.id)}
                          className="px-2 py-1 border border-rose-200 hover:bg-rose-50 text-rose-500 dark:hover:bg-rose-950/10 rounded font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer"
                        >
                          <UserMinus className="w-3 h-3" />
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Panel: Logs */}
      {activeTab === 'logs' && (
        <div className="bg-[#111113] text-slate-200 p-6 rounded-xl border border-white/5 font-mono">
          <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300">Audit Daemon (Live Activity Logs)</span>
            </div>
            <span className="text-[10px] text-slate-500">v1.2 Secure Audit</span>
          </div>

          <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin">
            {logs.map((log) => (
              <div key={log.id} className="text-xs bg-[#161618] p-3 rounded border border-white/5">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold border-b border-white/5 pb-1.5 mb-1.5">
                  <span className="text-emerald-400">// {log.action}</span>
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-slate-200 leading-relaxed font-semibold">{log.details}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-slate-500">
                  <span>OPERATOR: <span className="text-slate-300 font-bold">{log.userName} ({log.userEmail})</span></span>
                  {log.ip && <span>IP: <span className="text-slate-400">{log.ip}</span></span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
