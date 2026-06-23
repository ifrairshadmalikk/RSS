import { Bell, FileDown, LayoutDashboard, LogOut, Menu, Moon, Newspaper, Rss, Search, Settings, Shield, Sun, TrendingUp, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { AiAssistant } from './AiAssistant.jsx';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/feed', label: 'News Feed', icon: Newspaper },
  { to: '/trends', label: 'Global Trends', icon: TrendingUp },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings }
];

const adminLinks = [
  { to: '/admin', label: 'Admin Panel', icon: Shield }
];

export function Shell() {
  const [dark, setDark] = useState(() => localStorage.getItem('trend_dark') === 'true');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const seenNotificationIds = useRef(new Set());
  const initializedNotifications = useRef(false);
  const audioContext = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('trend_dark', String(dark));
  }, [dark]);

  const initials = useMemo(() => user?.name?.split(' ').map((part) => part[0]).join('').slice(0, 2) || 'U', [user]);
  const unreadCount = notifications.filter((item) => !item.read).length;

  useEffect(() => {
    seenNotificationIds.current = new Set();
    initializedNotifications.current = false;
  }, [user?.id]);

  const loadNotifications = useCallback(async () => {
    const { data } = await api.get('/notifications');
    const items = data.items || [];
    setNotifications(items);
    return items;
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;

      const context = audioContext.current || new AudioContext();
      audioContext.current = context;

      if (context.state === 'suspended') {
        context.resume().catch(() => {});
      }

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      oscillator.frequency.setValueAtTime(660, context.currentTime + 0.12);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.18, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.35);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.38);
    } catch (error) {
      console.warn('Notification sound could not play', error);
    }
  }, []);

  useEffect(() => {
    function unlockAudio() {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext || audioContext.current) return;
        audioContext.current = new AudioContext();
        audioContext.current.resume().catch(() => {});
      } catch {
        // Sound is best-effort because browsers can block audio until interaction.
      }
    }

    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    async function refresh({ notify = false } = {}) {
      const items = await loadNotifications();
      const unreadNewItems = items.filter((item) => !item.read && !seenNotificationIds.current.has(item._id));

      items.forEach((item) => seenNotificationIds.current.add(item._id));

      if (!initializedNotifications.current) {
        initializedNotifications.current = true;
        return;
      }

      if (!notify || !unreadNewItems.length || user.notificationsEnabled === false) return;

      playNotificationSound();

      if ('Notification' in window && user.browserNotificationsEnabled && Notification.permission === 'granted') {
        const latest = unreadNewItems[0];
        new Notification('Breaking Trend Detected!', { body: latest.message });
      }
    }

    refresh().catch((error) => console.error('Failed to fetch notifications', error));
    const id = setInterval(async () => {
      try {
        await refresh({ notify: true });
      } catch (error) {
        console.error('Failed to fetch notifications', error);
      }
    }, 15000);
    return () => clearInterval(id);
  }, [loadNotifications, playNotificationSound, user]);

  function submitSearch(event) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    navigate(`/feed?q=${encodeURIComponent(trimmed)}`);
  }

  async function exportPdf() {
    const { data } = await api.get('/trends/export.pdf', { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'trendwatch-trends.pdf';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen text-ink dark:text-slate-100">
      <aside className={`${open ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-72 border-r border-slate-200 bg-white p-4 shadow-none transition-transform duration-200 lg:translate-x-0 dark:border-slate-800 dark:bg-[#121820]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded bg-slate-950 text-white dark:bg-cyan-500"><Rss size={20} /></div>
            <div>
              <p className="page-kicker">TrendWatch</p>
              <h1 className="text-lg font-bold">Global Monitor</h1>
            </div>
          </div>
          <button className="icon-button lg:hidden" onClick={() => setOpen(false)} aria-label="Close menu"><X size={18} /></button>
        </div>
        <nav className="mt-8 space-y-1">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `flex h-10 items-center gap-3 rounded px-3 text-sm font-medium ${isActive ? 'bg-slate-950 text-white shadow-card dark:bg-cyan-500' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
              <span className="grid h-5 w-5 place-items-center"><Icon size={18} /></span>
              <span className="min-w-0 flex-1">{label}</span>
              {to === '/notifications' && unreadCount > 0 && (
                <span className="min-w-5 rounded-full bg-rose-600 px-1.5 py-0.5 text-center text-[11px] font-bold leading-4 text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
          <div className="my-2 border-t border-slate-200 dark:border-slate-800"></div>
          {user?.role === 'admin' && adminLinks.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `flex h-10 items-center gap-3 rounded px-3 text-sm font-medium ${isActive ? 'bg-rose-600 text-white shadow-card' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'}`}>
              <span className="grid h-5 w-5 place-items-center"><Icon size={18} /></span> {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/78 px-4 py-3 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0f1419]/82">
          <div className="flex items-center gap-2 sm:gap-3">
            <button className="icon-button lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={18} /></button>
            <form onSubmit={submitSearch} className="group relative min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md bg-slate-100 text-slate-500 group-focus-within:bg-cyan-50 group-focus-within:text-cyan-700 dark:bg-slate-800 dark:text-slate-400 dark:group-focus-within:bg-cyan-950/40 dark:group-focus-within:text-cyan-300">
                <Search size={17} />
              </span>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search topics, sources, keywords" className="focus-ring h-12 w-full rounded-lg border border-slate-200 bg-white/95 py-0 pl-14 pr-4 text-sm shadow-sm placeholder:text-slate-400 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900/85 dark:placeholder:text-slate-500 dark:hover:border-slate-600" />
            </form>
            <button onClick={exportPdf} className="icon-button hidden sm:inline-grid" aria-label="Download PDF report" title="Download PDF report"><FileDown size={18} /></button>
            <button onClick={() => setDark((value) => !value)} className="icon-button" aria-label="Toggle dark mode">{dark ? <Sun size={18} /> : <Moon size={18} />}</button>
            <div className="hidden items-center gap-3 sm:flex">
              {user?.profilePicture ? (
                <img src={user.profilePicture} alt="" className="h-9 w-9 rounded object-cover" />
              ) : (
                <div className="grid h-9 w-9 place-items-center rounded bg-slate-900 text-sm font-bold text-white dark:bg-cyan-500">{initials}</div>
              )}
              <button onClick={logout} className="icon-button border-transparent bg-transparent hover:border-rose-200 hover:text-rose-600 dark:bg-transparent dark:hover:border-rose-900" aria-label="Log out"><LogOut size={18} /></button>
            </div>
          </div>
        </header>
        <main className="p-4 sm:p-6">
          <Outlet context={{ refreshNotifications: loadNotifications }} />
        </main>
        <AiAssistant />
      </div>
    </div>
  );
}
