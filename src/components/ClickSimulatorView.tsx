import React, { useState } from 'react';
import { useAnalytics } from '../context/AnalyticsContext';
import { SocialPlatform, DeviceType } from '../types';
import { CITIES_DATA } from '../data/mockData';
import { 
  Play, 
  Zap, 
  ExternalLink, 
  CheckCircle2, 
  MapPin, 
  Smartphone, 
  Share2, 
  Radio, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ClickSimulatorViewProps {
  onOpenTestRedirect: (slug: string) => void;
}

export const ClickSimulatorView: React.FC<ClickSimulatorViewProps> = ({ onOpenTestRedirect }) => {
  const { 
    links, 
    videos, 
    simulateInstantClick, 
    isSimulatingLiveTraffic, 
    toggleLiveSimulation 
  } = useAnalytics();

  const [platform, setPlatform] = useState<SocialPlatform>('TikTok');
  const [cityName, setCityName] = useState('Jakarta');
  const [device, setDevice] = useState<DeviceType>('Mobile');
  const [selectedLinkId, setSelectedLinkId] = useState(links[0]?.id || '');
  const [notification, setNotification] = useState<string | null>(null);
  const [lastSentClick, setLastSentClick] = useState<any | null>(null);

  const handleSendSingleClick = () => {
    const evt = simulateInstantClick({
      platform,
      city: cityName,
      device,
      linkId: selectedLinkId,
    });

    setLastSentClick(evt);
    setNotification(`1 Klik berhasil dikirim dari ${platform} (${cityName})! Periksa log dan grafik.`);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSendBurstClicks = () => {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        simulateInstantClick();
      }, i * 300);
    }
    setNotification(`Ledakan trafik! 5 Klik simultan dari medsos berhasil dipicu!`);
    setTimeout(() => setNotification(null), 3500);
  };

  const activeLink = links.find((l) => l.id === selectedLinkId) || links[0];

  return (
    <div className="space-y-6 text-left max-w-4xl mx-auto">
      {/* Toast Alert */}
      {notification && (
        <div className="p-3 text-xs bg-emerald-600 text-white rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
            Interactive Test Suite & Traffic Generator
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
          Simulasi & Pengujian Trafik Medsos Real-Time
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Uji langsung sistem analitik dengan memicu klik buatan dari berbagai media sosial, kota di Indonesia, dan perangkat.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="md:col-span-2 space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white pb-2 border-b border-slate-100 dark:border-slate-800">
            Kustomisasi Parameter Pengunjung Medsos
          </h2>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pilih Tautan Sasaran
            </label>
            <select
              value={selectedLinkId}
              onChange={(e) => setSelectedLinkId(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
            >
              {links.map((l) => (
                <option key={l.id} value={l.id}>
                  /r/{l.slug} - {l.title} ({l.platform})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Asal Media Sosial
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="TikTok">TikTok (In-App)</option>
                <option value="Instagram">Instagram (Bio / Story)</option>
                <option value="WhatsApp">WhatsApp (Chat/Broadcast)</option>
                <option value="YouTube">YouTube Shorts</option>
                <option value="X (Twitter)">X (Twitter)</option>
                <option value="Facebook">Facebook</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kota Pengunjung
              </label>
              <select
                value={cityName}
                onChange={(e) => setCityName(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {CITIES_DATA.map((c) => (
                  <option key={c.city} value={c.city}>
                    {c.city} ({c.country})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tipe Perangkat
              </label>
              <select
                value={device}
                onChange={(e) => setDevice(e.target.value as DeviceType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Mobile">Mobile (iPhone / Android)</option>
                <option value="Desktop">Desktop (PC / Laptop)</option>
                <option value="Tablet">Tablet (iPad)</option>
              </select>
            </div>
          </div>

          {/* Trigger Buttons */}
          <div className="pt-3 flex flex-wrap items-center gap-3">
            <button
              onClick={handleSendSingleClick}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Kirim 1 Klik Sekarang</span>
            </button>

            <button
              onClick={handleSendBurstClicks}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 rounded-xl transition-colors cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Kirim Lonjakan 5 Klik</span>
            </button>
          </div>
        </div>

        {/* Live Status and Direct Redirection Card */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
              Pengujian Pengalihan Nyata
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Uji tautan seperti pengguna sungguhan. Menekan tombol ini akan mencatat browser dan IP perangkat Anda yang sebenarnya.
            </p>

            <button
              onClick={() => onOpenTestRedirect(activeLink.slug)}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800/80 rounded-xl transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka & Uji Pengalihan Nyata</span>
            </button>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Aliran Otomatis Latar Belakang
              </span>
              <button
                onClick={toggleLiveSimulation}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold"
              >
                {isSimulatingLiveTraffic ? 'Matikan' : 'Nyalakan'}
              </button>
            </div>
            <p className="text-slate-500 text-[11px]">
              {isSimulatingLiveTraffic
                ? 'Sistem sedang otomatis mengirim 1 pengunjung tiap 7 detik agar dashboard tampak dinamis.'
                : 'Aliran otomatis dinonaktifkan. Anda dapat memicu klik manual di atas.'}
            </p>
          </div>
        </div>
      </div>

      {/* Last Triggered Click Feedback Card */}
      {lastSentClick && (
        <div className="bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300">
          <div className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Klik Baru Berhasil Terdaftar di Database Real-Time:</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
            <div>Platform: <strong>{lastSentClick.platform}</strong></div>
            <div>Kota: <strong>{lastSentClick.city}</strong></div>
            <div>OS: <strong>{lastSentClick.os}</strong></div>
            <div>Tautan: <strong>/r/{lastSentClick.linkSlug}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
};
