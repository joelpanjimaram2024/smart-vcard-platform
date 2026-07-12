import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Bell,
  CreditCard,
  LogOut,
  Moon,
  Sun,
  Terminal,
  X,
} from 'lucide-react';

import { LandingPage } from './components/LandingPage';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { CompanyAdminDashboard } from './components/CompanyAdminDashboard';
import { EmployeeDashboard } from './components/EmployeeDashboard';
import { CardPublicView } from './components/CardTemplates';
import { QRGenerator } from './components/QRGenerator';
import { BusinessCard, Company, SystemNotification, User as AppUser } from './types';
import { apiUrl, readJsonResponse } from './utils/api';
import { getPublicCardUrl } from './utils/publicCardUrl';

type ActiveView = 'landing' | 'dashboard' | 'auth' | 'public_card';
type AuthMode = 'login' | 'register_individual' | 'register_corporate';
type DevRole = 'super_admin' | 'company_admin' | 'employee' | 'individual' | 'guest';

function getCardIdFromLocation(): string | null {
  if (typeof window === 'undefined') return null;

  const params = new URLSearchParams(window.location.search);
  const cardId = params.get('cardId') || params.get('card');
  const hashCardId = window.location.hash.replace('#/card/', '').replace('#', '');

  return cardId || hashCardId || null;
}

export default function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('vcard_token') || '');
  const [user, setUser] = useState<AppUser | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [appLoading, setAppLoading] = useState(true);

  const [activeView, setActiveView] = useState<ActiveView>('landing');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [publicCardId, setPublicCardId] = useState<string | null>(null);

  const [selectedCardForQR, setSelectedCardForQR] = useState<BusinessCard | null>(null);
  const [selectedCardForPreview, setSelectedCardForPreview] = useState<string | null>(null);

  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('vcard_theme') as 'light' | 'dark') || 'dark';
  });

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications],
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (themeMode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('vcard_theme', themeMode);
  }, [themeMode]);

  useEffect(() => {
    const syncPublicRoute = () => {
      const cardId = getCardIdFromLocation();
      if (cardId && cardId.length > 2) {
        setPublicCardId(cardId);
        setActiveView('public_card');

        const params = new URLSearchParams(window.location.search);
        if (!params.get('cardId') && params.get('card')) {
          window.history.replaceState({}, document.title, getPublicCardUrl(cardId));
        }
      } else {
        setPublicCardId(null);
        setActiveView((current) => (current === 'public_card' ? (token ? 'dashboard' : 'landing') : current));
      }
    };

    syncPublicRoute();
    window.addEventListener('popstate', syncPublicRoute);
    return () => window.removeEventListener('popstate', syncPublicRoute);
  }, [token]);

  const fetchSessionProfile = async (sessionToken: string) => {
    if (!sessionToken) {
      setUser(null);
      setCompany(null);
      setAppLoading(false);
      return;
    }

    setAppLoading(true);
    try {
      const res = await fetch(apiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });

      if (!res.ok) {
        throw new Error('Session expired');
      }

      const data = await readJsonResponse(res, '/api/auth/me');
      setUser(data.user);
      setCompany(data.user.company || null);
      setActiveView((current) => (current === 'public_card' ? current : 'dashboard'));
    } catch {
      localStorage.removeItem('vcard_token');
      setToken('');
      setUser(null);
      setCompany(null);
      setActiveView(publicCardId ? 'public_card' : 'landing');
    } finally {
      setAppLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchSessionProfile(token);
    } else {
      setAppLoading(false);
      if (!publicCardId) {
        setActiveView('landing');
      }
    }
  }, [token]);

  const resetAuthForm = () => {
    setNameInput('');
    setEmailInput('');
    setPasswordInput('');
    setCompanyNameInput('');
    setShowPassword(false);
    setAuthError('');
  };

  const performLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await readJsonResponse(res, '/api/auth/login');
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      localStorage.setItem('vcard_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setCompany(data.user.company || null);
      setActiveView('dashboard');
      resetAuthForm();
    } catch (error: any) {
      setAuthError(error.message || 'Network error. Please try again.');
    } finally {
      setAuthLoading(false);
    }
  };

  const performRegister = async (name: string, email: string, password: string, role: 'individual' | 'company_admin', companyName?: string) => {
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, companyName }),
      });

      const data = await readJsonResponse(res, '/api/auth/register');
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      localStorage.setItem('vcard_token', data.token);
      setToken(data.token);
      setUser(data.user);
      setCompany(data.user.company || data.company || null);
      setActiveView('dashboard');
      resetAuthForm();
    } catch (error: any) {
      setAuthError(error.message || 'Network error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vcard_token');
    setToken('');
    setUser(null);
    setCompany(null);
    setSelectedCardForPreview(null);
    setSelectedCardForQR(null);
    setShowNotificationsDropdown(false);
    setActiveView(publicCardId ? 'public_card' : 'landing');
  };

  const handleDeveloperBypass = async (role: DevRole) => {
    if (role === 'guest') {
      handleLogout();
      return;
    }

    const devEmails: Record<Exclude<DevRole, 'guest'>, string> = {
      super_admin: 'admin@vcard.io',
      company_admin: 'ceo@acme.com',
      employee: 'alice@acme.com',
      individual: 'freelance@gmail.com',
    };

    await performLogin(devEmails[role], 'dev-access');
  };

  const closePublicCard = () => {
    window.history.pushState({}, document.title, window.location.pathname);
    setPublicCardId(null);
    setActiveView(user ? 'dashboard' : 'landing');
  };

  const openPreview = (cardId: string) => {
    setSelectedCardForPreview(cardId);
  };

  const clearAllNotifications = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, isRead: true })));
  };

  if (appLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white font-mono">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-xs uppercase tracking-widest text-indigo-300">Synchronizing Session Token...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#09090b] text-slate-900 dark:text-slate-200 transition-colors duration-300 font-sans">
      <div className="fixed bottom-4 right-4 z-40 bg-[#111113]/90 text-white rounded-2xl border border-white/10 p-4 shadow-2xl max-w-xs glass-effect">
        <div className="flex items-center gap-1.5 border-b border-white/10 pb-2 mb-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Dev Access Portal</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[10px] font-bold">
          <button onClick={() => handleDeveloperBypass('super_admin')} className="px-2 py-1.5 rounded bg-rose-950/40 text-rose-300 border border-rose-900/40 hover:brightness-110 cursor-pointer">● Super Admin</button>
          <button onClick={() => handleDeveloperBypass('company_admin')} className="px-2 py-1.5 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-900/40 hover:brightness-110 cursor-pointer">● Org Admin</button>
          <button onClick={() => handleDeveloperBypass('employee')} className="px-2 py-1.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-900/40 hover:brightness-110 cursor-pointer">● Employee</button>
          <button onClick={() => handleDeveloperBypass('individual')} className="px-2 py-1.5 rounded bg-amber-950/40 text-amber-300 border border-amber-900/40 hover:brightness-110 cursor-pointer">● Individual</button>
          <button onClick={() => handleDeveloperBypass('guest')} className="col-span-2 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-800 cursor-pointer">← Reset to Guest</button>
        </div>
      </div>

      {user && activeView !== 'public_card' && (
        <header className="bg-white dark:bg-[#111113] border-b border-gray-200 dark:border-white/5 py-4 px-6 relative z-30 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setActiveView('dashboard')} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                <CreditCard className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              </button>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{company?.name || user.name || 'vCard'}</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setThemeMode(themeMode === 'light' ? 'dark' : 'light')}
                className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10"
              >
                {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              <div className="relative">
                <button
                  className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 relative"
                  onClick={() => setShowNotificationsDropdown((current) => !current)}
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotificationsCount > 0 && <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full absolute top-1.5 right-1.5"></span>}
                </button>

                {showNotificationsDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-white dark:bg-[#111113] rounded-xl border border-slate-200 dark:border-white/10 shadow-lg p-3 z-50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-xs uppercase text-slate-500 dark:text-slate-400">Alerts</span>
                      <button onClick={clearAllNotifications} className="text-[10px] text-indigo-500 font-medium hover:bg-indigo-500/10 p-1 rounded">Mark All Read</button>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="text-[10px] text-slate-400 text-center py-6">You are all caught up!</p>
                    ) : (
                      notifications.slice(0, 5).map((notification) => (
                        <div key={notification.id} className="p-3 rounded-lg mb-2 bg-slate-50 dark:bg-white/5">
                          <p className="text-xs text-slate-700 dark:text-slate-200 font-medium">{notification.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{notification.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              <button onClick={handleLogout} className="p-2.5 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-rose-950/20 hover:text-rose-600 dark:hover:text-rose-400">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="relative z-10">
        {activeView === 'landing' && (
          <LandingPage
            onGetStarted={(role) => {
              setAuthMode(role === 'company_admin' ? 'register_corporate' : 'register_individual');
              setActiveView('auth');
              setAuthError('');
            }}
            onLogin={() => {
              setAuthMode('login');
              setActiveView('auth');
              setAuthError('');
            }}
          />
        )}

        {activeView === 'auth' && (
          <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
            <div className="w-full max-w-md">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                <div className="text-center mb-8">
                  <CreditCard className="w-16 h-16 mx-auto text-indigo-600 dark:text-indigo-400" />
                  <h1 className="text-2xl font-bold mt-4 dark:text-white">
                    {authMode === 'login'
                      ? 'Welcome Back'
                      : authMode === 'register_individual'
                        ? 'Create Your Account'
                        : 'Create Company Account'}
                  </h1>
                  <p className="text-xs mt-1 text-slate-500 dark:text-slate-400">
                    {authMode === 'login'
                      ? 'Sign in to access your smart digital business card dashboard.'
                      : authMode === 'register_individual'
                        ? 'Join for free and create your personalized digital business card.'
                        : 'Sign up your enterprise tenant and add employees.'}
                  </p>
                </div>

                {authError && (
                  <div className="border border-rose-300 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 p-3 rounded-lg mb-4 text-xs">
                    {authError}
                  </div>
                )}

                <div className="space-y-3">
                  {authMode !== 'login' && (
                    <input
                      type="text"
                      placeholder="Full Name"
                      className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      value={nameInput}
                      onChange={(event) => setNameInput(event.target.value)}
                    />
                  )}

                  <input
                    type="email"
                    placeholder="Email"
                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                    value={emailInput}
                    onChange={(event) => setEmailInput(event.target.value)}
                  />

                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Password"
                      className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      value={passwordInput}
                      onChange={(event) => setPasswordInput(event.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>

                  {authMode === 'register_corporate' && (
                    <input
                      type="text"
                      placeholder="Company Name"
                      className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                      value={companyNameInput}
                      onChange={(event) => setCompanyNameInput(event.target.value)}
                    />
                  )}

                  {authMode === 'login' ? (
                    <button
                      onClick={() => performLogin(emailInput, passwordInput)}
                      disabled={authLoading}
                      className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm mt-4 transition-colors"
                    >
                      {authLoading ? 'Signing In...' : 'Sign In'}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        performRegister(
                          nameInput,
                          emailInput,
                          passwordInput,
                          authMode === 'register_corporate' ? 'company_admin' : 'individual',
                          companyNameInput,
                        )
                      }
                      disabled={authLoading}
                      className="w-full p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm mt-4 transition-colors"
                    >
                      {authLoading ? 'Creating Account...' : 'Create Account'}
                    </button>
                  )}
                </div>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-4">
                  {authMode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button onClick={() => setAuthMode('register_individual')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                        Sign up for free
                      </button>
                      .
                    </>
                  ) : (
                    <>
                      Already signed up?{' '}
                      <button onClick={() => setAuthMode('login')} className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                        Sign in instead
                      </button>
                      .
                    </>
                  )}
                </p>

                <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
                  <button onClick={() => setActiveView('landing')} className="hover:underline">
                    Back to home
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'dashboard' && user && (
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {user.role === 'super_admin' && <SuperAdminDashboard token={token} />}
            {user.role === 'company_admin' && (
              <CompanyAdminDashboard
                user={user}
                token={token}
                company={company}
                onUpdateCompany={setCompany}
              />
            )}
            {(user.role === 'employee' || user.role === 'individual') && (
              <EmployeeDashboard
                user={user}
                token={token}
                onSelectCardForQR={setSelectedCardForQR}
                onSelectCardForPreview={openPreview}
              />
            )}
          </div>
        )}

        {activeView === 'public_card' && publicCardId && (
          <>
            <button
              onClick={closePublicCard}
              className="fixed top-4 left-4 z-[60] backdrop-blur-md bg-white/70 dark:bg-slate-900/70 border border-white/20 rounded-xl p-2.5 shadow-lg flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <CardPublicView cardId={publicCardId} onClose={closePublicCard} />
          </>
        )}
      </main>

      {selectedCardForQR && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setSelectedCardForQR(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(event) => event.stopPropagation()}>
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">QR Code for {selectedCardForQR.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">This QR now opens the public profile bound to this specific card.</p>
              </div>
              <button onClick={() => setSelectedCardForQR(null)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4">
              <QRGenerator card={selectedCardForQR} />
            </div>
          </div>
        </div>
      )}

      {selectedCardForPreview && (
        <CardPublicView cardId={selectedCardForPreview} onClose={() => setSelectedCardForPreview(null)} />
      )}
    </div>
  );
}
