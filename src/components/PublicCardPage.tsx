import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  Globe,
  Info,
  Mail,
} from 'lucide-react';

import { CardDisplay, LeadCaptureForm } from './CardTemplates';
import { apiUrl, readJsonResponse } from '../utils/api';
import { BusinessCard } from '../types';
import { downloadVCard } from '../utils/vcard';


type IdentifierType = 'publicId' | 'slug';

interface PublicCardResponse {
  card: BusinessCard;
  owner: {
    id: string;
    name: string;
    email: string;
  };
  company: {
    id?: string;
    name: string;
    domain?: string;
    logoUrl?: string;
  } | null;
}

interface PublicCardPageProps {
  identifier: string;
  identifierType: IdentifierType;
  embedded?: boolean;
  trackScan?: boolean;
  onBack?: () => void;
}

function goBackOrHome() {
  if (typeof window === 'undefined') return;

  if (window.history.length > 1) {
    window.history.back();
  } else {
    window.location.assign('/');
  }
}

export const PublicCardPage: React.FC<PublicCardPageProps> = ({
  identifier,
  identifierType,
  embedded = false,
  trackScan = true,
  onBack,
}) => {
  const [data, setData] = useState<PublicCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');


  const endpoint = identifierType === 'publicId'
    ? `/api/public/cards/public/${encodeURIComponent(identifier)}`
    : `/api/public/cards/slug/${encodeURIComponent(identifier)}`;

  const backAction = onBack || goBackOrHome;

  useEffect(() => {
    let cancelled = false;

    const fetchCard = async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(apiUrl(`${endpoint}?trackView=${trackScan ? 'true' : 'false'}`));
        const result = await readJsonResponse<PublicCardResponse & { error?: string }>(res, endpoint);

        if (!res.ok) {
          throw new Error(result.error || 'Unable to load this business card.');
        }

        if (!cancelled) {
          setData(result);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Unable to load this business card.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchCard();

    return () => {
      cancelled = true;
    };
  }, [endpoint, trackScan]);

  useEffect(() => {
    if (!data || !trackScan) return;

    const sessionId = `scan_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

    fetch(apiUrl(`/api/public/cards/${data.card.id}/event`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'scan', sessionId }),
    }).catch(() => {
      // Ignore analytics failures for public visitors.
    });
  }, [data, trackScan]);

  const handleAction = async (type: 'download' | 'share' | 'link_click', _label?: string) => {
    if (!data) return;

    try {
      await fetch(apiUrl(`/api/public/cards/${data.card.id}/event`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: type === 'link_click' ? 'share' : type }),
      });
    } catch {
      // Ignore analytics failures for public visitors.
    }
  };

  const handleSaveContact = () => {
    if (!data) return;
    void handleAction('download');
    downloadVCard(data.card);
  };

  if (loading) {
    return (
      <div className={embedded ? 'w-full' : 'min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_40%,#f8fafc_100%)]'}>
        {!embedded && (
          <button
            onClick={backAction}
            className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="rounded-3xl border border-white/70 bg-white/90 px-8 py-10 shadow-2xl backdrop-blur-xl">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
            <p className="text-sm font-semibold text-slate-700">Opening digital business card…</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={embedded ? 'w-full' : 'min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_40%,#f8fafc_100%)]'}>
        {!embedded && (
          <button
            onClick={backAction}
            className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur-md"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-md rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-500">
              <Info className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-black text-slate-900">Public card unavailable</h2>
            <p className="mt-2 text-sm text-slate-500">{error || 'This digital card could not be opened.'}</p>
            <button
              onClick={backAction}
              className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { card, company } = data;
  const companyLabel = card.companyName || company?.name || '';
  const website = card.socialLinks.website || company?.domain || '';

  return (
    <div className={embedded ? 'w-full' : 'min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.14),_transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_40%,#f8fafc_100%)]'}>
      {!embedded && (
        <button
          onClick={backAction}
          className="fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-bold text-slate-800 shadow-lg backdrop-blur-md"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
      )}

      <div className={`mx-auto w-full max-w-5xl px-4 sm:px-6 ${embedded ? 'py-3' : 'min-h-screen flex items-start justify-center py-8 sm:py-10'}`}>
        <div className="w-full rounded-[2rem] border border-white/70 bg-white/80 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur-xl overflow-hidden">
          <div className="flex flex-col gap-0">
            <section className="flex items-center justify-center px-4 pt-5 pb-4 sm:px-6 sm:pt-6 sm:pb-5 bg-gray-50/60 dark:bg-[#161618]/50 border-b border-gray-200/60 dark:border-white/5">
              <div className="relative w-full max-w-[340px] rounded-[45px] border-8 border-white/5 bg-slate-900 p-2.5 pb-6 overflow-hidden shadow-2xl flex flex-col items-center">
                <div className="w-16 h-3.5 bg-white/10 rounded-full mb-3 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                </div>

                <div className="w-full h-[520px] overflow-y-auto rounded-[28px]" style={{ backgroundColor: card.theme.backgroundColor }}>
                  <CardDisplay card={card} onActionClick={handleAction} isInteractive={false} />
                </div>
              </div>
            </section>

            <section className="bg-white/95 px-4 pb-5 pt-2 text-slate-900 sm:px-6 sm:pb-6">
              <div className="mx-auto max-w-[340px] space-y-4 sm:max-w-md">
                <button
                  onClick={handleSaveContact}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  <Check className="w-4 h-4" />
                  Save Contact
                </button>

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                    Networking Section
                  </span>
                  <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                    Connect with {card.name}
                  </h1>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    This QR opens the digital business card directly. Save the contact or send your details below.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {card.contactButtons.email && (
                    <a
                      href={`mailto:${card.contactButtons.email}`}
                      onClick={() => { void handleAction('link_click', 'email'); }}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      <Mail className="w-4 h-4 text-indigo-600" />
                      <span className="truncate">{card.contactButtons.email}</span>
                    </a>
                  )}

                  {website && (
                    <a
                      href={website.startsWith('http') ? website : `https://${website}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => { void handleAction('link_click', 'website'); }}
                      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                    >
                      <Globe className="w-4 h-4 text-indigo-600" />
                      <span className="truncate">{website}</span>
                    </a>
                  )}
                </div>

                {(companyLabel || card.designation) && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                      <div className="min-w-0">
                        {companyLabel && <p className="font-semibold text-slate-900">{companyLabel}</p>}
                        <p className="mt-1 text-sm text-slate-500">{card.designation}</p>
                      </div>
                    </div>
                  </div>
                )}

                <LeadCaptureForm cardId={card.id} primaryColor={card.theme.primaryColor} />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
