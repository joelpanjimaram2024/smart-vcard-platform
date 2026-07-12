import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Copy, Check, Printer, Palette, RefreshCw } from 'lucide-react';
import { BusinessCard } from '../types';
import { getPublicCardUrl } from '../utils/publicCardUrl';

interface QRGeneratorProps {
  card: BusinessCard;
  onDownload?: () => void;
}

export const QRGenerator: React.FC<QRGeneratorProps> = ({ card, onDownload }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrColor, setQrColor] = useState(card.theme.primaryColor || '#4f46e5');
  const [qrBg, setQrBg] = useState('#ffffff');
  const [copied, setCopied] = useState(false);
  const [svgString, setSvgString] = useState('');

  const cardUrl = getPublicCardUrl(card.publicId);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Render Canvas QR
    QRCode.toCanvas(
      canvasRef.current,
      cardUrl,
      {
        width: 300,
        margin: 1.5,
        color: {
          dark: qrColor,
          light: qrBg
        }
      },
      (error) => {
        if (error) console.error('Failed to generate Canvas QR', error);
      }
    );

    // Generate SVG string for vector download
    QRCode.toString(
      cardUrl,
      {
        type: 'svg',
        width: 300,
        margin: 1.5,
        color: {
          dark: qrColor,
          light: qrBg
        }
      },
      (err, string) => {
        if (err) console.error('Failed to generate SVG QR', err);
        else setSvgString(string);
      }
    );

  }, [cardUrl, qrColor, qrBg]);

  const downloadPNG = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${card.name.trim().replace(/\s+/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onDownload) onDownload();
  };

  const downloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR_${card.name.trim().replace(/\s+/g, '_')}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    if (onDownload) onDownload();
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-150 dark:border-slate-700/80 shadow-md">
      <div className="text-center mb-5">
        <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold uppercase tracking-widest rounded-full">QR Engine v1.0</span>
        <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">Smart Dynamic QR Code</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Scan is tracked in real-time. Link redirects instantly to your active layout.</p>
      </div>

      <div className="flex flex-col items-center">
        {/* QR Code Canvas Wrapper */}
        <div className="p-3 bg-white rounded-xl border border-gray-200 dark:border-slate-700 shadow-inner mb-5 relative group">
          <canvas ref={canvasRef} className="w-56 h-56 object-contain" />
          <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 rounded-xl">
            <span className="text-[10px] font-bold text-gray-800 bg-white/95 px-3 py-1.5 rounded-full shadow border">Dynamic Redirect Active</span>
          </div>
        </div>

        {/* Dynamic Color Palette */}
        <div className="w-full bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="w-4 h-4 text-gray-400" />
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Customize QR Palette</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Code Color</label>
              <div className="flex items-center gap-1.5">
                <input 
                  type="color" 
                  value={qrColor} 
                  onChange={(e) => setQrColor(e.target.value)}
                  className="w-6 h-6 border rounded cursor-pointer p-0 bg-transparent"
                />
                <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 uppercase">{qrColor}</span>
              </div>
            </div>
            <div>
              <label className="block text-[9px] uppercase tracking-wider text-gray-400 font-bold mb-1">Background Color</label>
              <div className="flex items-center gap-1.5">
                <input 
                  type="color" 
                  value={qrBg} 
                  onChange={(e) => setQrBg(e.target.value)}
                  className="w-6 h-6 border rounded cursor-pointer p-0 bg-transparent"
                />
                <span className="text-[10px] font-mono text-gray-600 dark:text-gray-400 uppercase">{qrBg}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => { setQrColor(card.theme.primaryColor || '#4f46e5'); setQrBg('#ffffff'); }}
            className="mt-2 text-[9px] text-indigo-600 font-bold uppercase tracking-wider hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            Reset to Brand Theme
          </button>
        </div>

        {/* QR Actions */}
        <div className="grid grid-cols-2 gap-2 w-full mb-4">
          <button
            onClick={downloadPNG}
            className="py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download PNG
          </button>
          <button
            onClick={downloadSVG}
            className="py-2 border border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900/40 dark:hover:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download SVG
          </button>
        </div>

        <div className="w-full space-y-1 text-center border-t border-gray-100 dark:border-slate-700/50 pt-4">
          <div className="flex justify-between items-center bg-gray-50 dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-800 text-xs text-left">
            <span className="font-mono text-gray-500 dark:text-gray-400 select-all truncate max-w-[160px]">{cardUrl}</span>
            <button 
              onClick={copyUrl}
              className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1 mt-2">
            <Printer className="w-3.5 h-3.5" />
            Print-ready: use SVG download for vector scales.
          </p>
        </div>
      </div>
    </div>
  );
};
